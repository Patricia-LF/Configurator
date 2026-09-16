import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import {
  loadProductModel,
  loadCameraAnimation,
  getLightColors,
  getCameraViews,
  productModelUrl,
  cameraModelUrl,
  prepareProductModel,
  applyFixedMaterials,
  applyConfiguratorSelection,
  getProductBounds,
  getZoomAnchorMeshes,
} from "./ProductModel";
import { collectMaterialsByName } from "./materialLibrary";
import { useConfigurator } from "../hooks/useConfigurator";
import { useTheme } from "../hooks/useTheme";
import { useZoom } from "../hooks/useZoom";

const hdriUrl = "/models/studio.hdr";

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function easeOutQuint(progress) {
  return 1 - Math.pow(1 - progress, 5);
}

function getZoomAnchorPosition(target, mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  if (target === "speaker") {
    center.set(box.max.x, box.max.y / 1.5, center.z);
  } else if (target === "legs") {
    center.set(box.min.x, box.min.y, center.z);
  }
  // texture: no offset — stays at the mesh's true center

  return center;
}

// "CameraAction" (24fps) bakes several camera moves; this range covers
// default -> close-up, played forward to enter and backward to leave.
const CAMERA_ACTION_FPS = 24;
const TURNTABLE_CLIP_FRAME_RANGE = [35, 105];
// Shifts the close-up framing left (world X), back toward the product
// (world Z), and up (world Y) for more of an overhead look down onto the
// vinyl player, ramped in so the start stays unshifted.
const TURNTABLE_CAMERA_OFFSET = new THREE.Vector3(-0.4, 0.15, 0.15);

// Shifts a clip's position track by `offset`, weighted by each keyframe's
// progress (0 at start, 1 at end) along the baked start->end path.
function offsetPositionTrack(clip, offset, weightForProgress) {
  const track = clip.tracks.find((t) => t.name.endsWith(".position"));
  if (!track) return;

  const { values } = track;
  const count = values.length / 3;
  if (count === 0) return;

  const start = new THREE.Vector3().fromArray(values, 0);
  const end = new THREE.Vector3().fromArray(values, (count - 1) * 3);
  const path = end.clone().sub(start);
  const pathLengthSq = path.lengthSq();

  const current = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    current.fromArray(values, idx);

    const progress =
      pathLengthSq === 0
        ? 0
        : THREE.MathUtils.clamp(
            current.sub(start).dot(path) / pathLengthSq,
            0,
            1,
          );
    const weight = weightForProgress(progress);

    values[idx] += offset.x * weight;
    values[idx + 1] += offset.y * weight;
    values[idx + 2] += offset.z * weight;
  }
}

// Blends a clip's position+quaternion tracks toward a pose, weighted by
// progress (see offsetPositionTrack) — 0 keeps the baked value, 1 replaces it.
function blendTrackTowardPose(
  clip,
  targetPosition,
  targetQuaternion,
  weightForProgress,
) {
  const posTrack = clip.tracks.find((t) => t.name.endsWith(".position"));
  if (!posTrack) return;
  const rotTrack = clip.tracks.find((t) => t.name.endsWith(".quaternion"));

  const posValues = posTrack.values;
  const count = posValues.length / 3;
  if (count === 0) return;

  const start = new THREE.Vector3().fromArray(posValues, 0);
  const end = new THREE.Vector3().fromArray(posValues, (count - 1) * 3);
  const path = end.clone().sub(start);
  const pathLengthSq = path.lengthSq();

  const current = new THREE.Vector3();
  const blendedPos = new THREE.Vector3();
  const bakedQuat = new THREE.Quaternion();

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    current.fromArray(posValues, idx);

    const progress =
      pathLengthSq === 0
        ? 0
        : THREE.MathUtils.clamp(
            current.clone().sub(start).dot(path) / pathLengthSq,
            0,
            1,
          );
    const weight = weightForProgress(progress);

    blendedPos.copy(current).lerp(targetPosition, weight);
    blendedPos.toArray(posValues, idx);

    if (rotTrack) {
      const rIdx = i * 4;
      bakedQuat.fromArray(rotTrack.values, rIdx);
      bakedQuat.slerp(targetQuaternion, weight);
      bakedQuat.toArray(rotTrack.values, rIdx);
    }
  }
}

/**
 * Main product scene: loads the model, applies ConfiguratorContext's
 * selection, and renders it with an orbit-controlled camera following the
 * app-wide theme toggle.
 */
export default function Scene() {
  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const materialsByNameRef = useRef(null);
  // Baked-in camera + AnimationMixer/clips from the GLB, alongside the orbit camera below.
  const cinematicCameraRef = useRef(null);
  const cinematicMixerRef = useRef(null);
  const cinematicClipsRef = useRef([]);
  // Sub-clip trimmed from "CameraAction" (see TURNTABLE_CLIP_FRAME_RANGE) —
  // forward for the intro, backward for the outro.
  const cinematicTurntableClipRef = useRef(null);
  // True while the render loop shows the cinematic camera's pose instead of
  // OrbitControls' — during playback, then parked until the user's first drag.
  const cameraLockedRef = useRef(false);
  // Orbit camera/controls, stashed so the turntable effect below can reach them.
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const prevActivePartRef = useRef(null);

  const zoomAnchorMeshesRef = useRef({
    legs: null,
    speaker: null,
    texture: null,
  });

  const defaultCameraPositionRef = useRef(null);
  const cameraTweenRef = useRef(null);

  const { selected, activePart } = useConfigurator();
  const { isDarkMode } = useTheme();

  const modelSelection = {
    ...selected,
    scene: { background: isDarkMode ? "Orange" : "White" },
  };

  const { zoomTarget, anchorPositionsRef, triggerZoom } = useZoom();

  function startCameraTween(targetPosition, target) {
    if (!targetPosition) return;
    cameraTweenRef.current = {
      startPosition: null,
      targetPosition: targetPosition.clone(),
      target, // "legs" | "speaker" | "texture" | undefined (zoom-out)
      startTime: performance.now(),
      duration: 1500,
    };
  }

  // Ref so this effect can stay `[]` but still read the latest selection on load.
  const selectedRef = useRef(modelSelection);
  useEffect(() => {
    selectedRef.current = modelSelection;
    if (modelRef.current && materialsByNameRef.current) {
      applyConfiguratorSelection(
        modelRef.current,
        modelSelection,
        materialsByNameRef.current,
      );

      // Re-scan for the currently-visible zoom anchor meshes — which mesh
      // represents each target can change with the selection (e.g.
      // Legs_Large_X vs Legs_Small_X, or Speaker becoming hidden entirely
      // when the small size is chosen).
      zoomAnchorMeshesRef.current = getZoomAnchorMeshes(modelRef.current);

      // If the currently active zoom target's part just became unavailable
      // (e.g. speaker hidden after switching to the small size), zoom back out.
      if (zoomTarget && !zoomAnchorMeshesRef.current[zoomTarget]) {
        triggerZoom(zoomTarget);
      }
    }
  }, [selected, isDarkMode]);

  const ZOOM_DISTANCE = 2; // how close the camera gets to the anchor — tune to taste

  const zoomTargetRef = useRef(null); // mirrors zoomTarget, since the animate() effect has [] deps

  useEffect(() => {
    zoomTargetRef.current = zoomTarget;

    if (zoomTarget) {
      const mesh = zoomAnchorMeshesRef.current[zoomTarget];
      if (!mesh || !defaultCameraPositionRef.current) return;

      const anchorPosition = getZoomAnchorPosition(zoomTarget, mesh);
      const direction = defaultCameraPositionRef.current
        .clone()
        .sub(anchorPosition)
        .normalize();
      const zoomPosition = anchorPosition
        .clone()
        .addScaledVector(direction, ZOOM_DISTANCE);

      startCameraTween(zoomPosition, zoomTarget);
    } else if (defaultCameraPositionRef.current) {
      startCameraTween(defaultCameraPositionRef.current, null);
    }
  }, [zoomTarget]);

  useEffect(() => {
    const mount = mountRef.current;
    let cancelled = false;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.filmGauge = 36;
    camera.setFocalLength(50);
    camera.updateProjectionMatrix();
    camera.position.set(0, 0.8, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    // The GLB's baked-in lights are PointLights (no VSMShadowMap support)
    // and don't cast shadows themselves (see the dedicated key light below,
    // a DirectionalLight) — VSMShadowMap gives it a real, smooth blur
    // instead of PCFSoftShadowMap's noisy few-sample dithering.
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Dialed down to avoid clipping bright materials (env + key + fill lights stack up).
    renderer.toneMappingExposure = 0.6;
    mount.appendChild(renderer.domElement);

    // Kept low so the spotlights, not the HDRI, define the vignette.
    scene.environmentIntensity = 0.7;

    const hdrLoader = new HDRLoader();
    hdrLoader.load(hdriUrl, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    Promise.all([
      loadProductModel(productModelUrl),
      loadCameraAnimation(cameraModelUrl),
    ])
      .then(([{ model, lights, cameras, animations }, cinematic]) => {
        if (cancelled) return;

        prepareProductModel(model);

        // Baked-in cinematic camera + its clips come from cameraModelUrl —
        // productModelUrl's export doesn't carry the turntable camera bake.
        // Kept alongside (not instead of) the orbit `camera` below.
        cinematicCameraRef.current = cinematic.camera;
        cinematicClipsRef.current = cinematic.animations;
        if (cinematic.camera && cinematic.animations.length > 0) {
          cinematicMixerRef.current = new THREE.AnimationMixer(
            cinematic.camera,
          );
        }

        model.scale.set(1, 1, 1);
        model.position.set(-0.5, 0.1, 0);
        scene.add(model);

        modelRef.current = model;

        const materialsByName = collectMaterialsByName(model);
        materialsByNameRef.current = materialsByName;

        // Legs_Silver is a copy of the same metallic material as Recordplayer_Metallic_Parts,
        // so it can be swapped in for the legs without affecting the rest of the product.
        const recordPlayerMetal = materialsByName.get(
          "Recordplayer_Metallic_Parts",
        );
        if (recordPlayerMetal) {
          materialsByName.set("Legs_Silver", recordPlayerMetal);

          // Legs_Gold is a copy of the same metallic material, but with a gold tint.
          const goldMetal = recordPlayerMetal.clone();
          goldMetal.color.setRGB(0.76, 0.59, 0.3);
          materialsByName.set("Legs_Gold", goldMetal);
        }

        applyFixedMaterials(model, materialsByName);

        applyConfiguratorSelection(model, selectedRef.current, materialsByName);
        zoomAnchorMeshesRef.current = getZoomAnchorMeshes(model);

        // Sizes the fallback shadow frustum / frames the camera when there's no baked-in camera.
        const productBounds = getProductBounds(model);

        console.log("[Scene] lights from GLB:", getLightColors(lights));
        console.log("[Scene] cameras from GLB:", getCameraViews(cameras));
        console.log(
          "[Scene] animation clips from GLB:",
          animations.map((clip) => clip.name),
        );
        console.log(
          "[Scene] cinematic camera/clips from CAM_ANIM GLB:",
          cinematic.camera?.name,
          cinematic.animations.map((clip) => clip.name),
        );

        // GLB lights are illumination only now — see the dedicated key
        // light below for the actual shadow. Blender exports
        // physically-based candela values that blow out this scene's tone
        // mapping, so intensities are re-tuned by hand per light.
        const GLB_LIGHT_INTENSITY_BY_NAME = {
          Scene_Light_Top: 20,
          Scene_Light_Front: 15,
        };
        lights.forEach((light) => {
          if (light.name in GLB_LIGHT_INTENSITY_BY_NAME) {
            light.intensity = GLB_LIGHT_INTENSITY_BY_NAME[light.name];
          }

          if ("castShadow" in light) {
            light.castShadow = false;
          }
        });

        // Standard shadow-casting key light: a DirectionalLight aimed at
        // the product, with its orthographic shadow camera frustum fit
        // tightly to the product's bounds (padded) so the shadow map's
        // resolution isn't wasted on empty space.
        const boundsCenter = productBounds.getCenter(new THREE.Vector3());
        const boundsSize = productBounds.getSize(new THREE.Vector3());
        const maxDim = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

        const keyLight = new THREE.DirectionalLight(0xffffff, 2);
        keyLight.position.set(
          boundsCenter.x + maxDim * 0.6,
          boundsCenter.y + maxDim * 1.5,
          boundsCenter.z + maxDim * 1.2,
        );
        keyLight.target.position.copy(boundsCenter);
        scene.add(keyLight, keyLight.target);

        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(4096, 4096);
        keyLight.shadow.bias = -0.0015;
        // The shadow's blur radius is in world units, not texels — bigger = softer.
        keyLight.shadow.radius = 10;
        keyLight.shadow.blurSamples = 16;
        // >1 darkens the shadowed area beyond this light's own occlusion —
        // the env/HDRI fill light was making it read as too faint.
        keyLight.shadow.intensity = 1.8;

        // The shadow camera's frustum is orthographic, so it needs to be sized
        // to the product's bounding box (padded) instead of using near/far.
        const frustumPadding = maxDim * 3;
        const shadowCam = keyLight.shadow.camera;
        shadowCam.left = -maxDim / 2 - frustumPadding;
        shadowCam.right = maxDim / 2 + frustumPadding;
        shadowCam.top = maxDim / 2 + frustumPadding;
        shadowCam.bottom = -maxDim / 2 - frustumPadding;
        shadowCam.near = 0.1;
        shadowCam.far = maxDim * 6;
        shadowCam.updateProjectionMatrix();

        if (cameras.length > 0) {
          // Use the first exported camera's framing as the starting view.
          camera.position.copy(cameras[0].position);
          camera.quaternion.copy(cameras[0].quaternion);
          // Baked camera has no orbit target; without this, orbiting pivots around the origin.
          if (!productBounds.isEmpty()) {
            controls.target.copy(productBounds.getCenter(new THREE.Vector3()));
            controls.update();
          }
        } else {
          // No baked camera — frame on the product's bounding box instead.
          if (!productBounds.isEmpty()) {
            const center = productBounds.getCenter(new THREE.Vector3());
            const boxSize = productBounds.getSize(new THREE.Vector3());
            const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
            const fitDistance =
              maxDim / 2 / Math.tan((camera.fov * Math.PI) / 360);

            camera.near = fitDistance / 100;
            camera.far = fitDistance * 100;
            camera.position.set(
              center.x,
              center.y,
              center.z + fitDistance * 1.4,
            );
            camera.updateProjectionMatrix();

            controls.target.copy(center);
            controls.update();
          }
        }

        // Start fully tilted down (maxPolarAngle) and fully zoomed out
        // (maxDistance) instead of the artist's camera angle/distance, so
        // every reload begins at the same, most-zoomed-out view.
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = controls.maxPolarAngle;
        spherical.radius = controls.maxDistance;
        camera.position
          .copy(controls.target)
          .add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update();

        // Remember this as the "zoomed out" / default view to tween back to.
        defaultCameraPositionRef.current = camera.position.clone();

        // Build the turntable sub-clip now that the on-load view is settled, so
        // it blends from that exact pose (otherwise the fly-through would
        // jump). Note controls.min/maxPolarAngle/AzimuthAngle above can still
        // clamp this view.
        if (cinematicMixerRef.current) {
          const reloadPosition = camera.position.clone();
          const reloadQuaternion = camera.quaternion.clone();

          const [clipStart, clipEnd] = TURNTABLE_CLIP_FRAME_RANGE;
          cinematicTurntableClipRef.current = THREE.AnimationUtils.subclip(
            cinematic.animations[0],
            "CameraTurntableIntro",
            clipStart,
            clipEnd,
            CAMERA_ACTION_FPS,
          );
          // Ramp 1 -> 0: starts on the on-load view, fades out by the close-up.
          blendTrackTowardPose(
            cinematicTurntableClipRef.current,
            reloadPosition,
            reloadQuaternion,
            (p) => 1 - p,
          );
          // Ramp 0 -> 1: shifts the close-up itself further left.
          offsetPositionTrack(
            cinematicTurntableClipRef.current,
            TURNTABLE_CAMERA_OFFSET,
            (p) => p,
          );
        }
      })
      .catch((error) => {
        console.error("[Scene]", error);
      });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    // Disables two-finger/right-click panning; only orbiting is wanted here.
    controls.enablePan = false;
    // The minDistance is set to a value that keeps the camera from going inside the product.
    controls.minDistance = ZOOM_DISTANCE;
    // The maxDistance is set to a value that allows the camera to orbit around the product without going too far away.
    controls.maxDistance = 4.9;
    // Polar angle is measured from straight up, so raising this floor is
    // what limits how far the camera can swing above the product.
    controls.minPolarAngle = 0.9;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minAzimuthAngle = -Math.PI / 12;
    controls.maxAzimuthAngle = Math.PI / 12;
    controlsRef.current = controls;

    const timer = new THREE.Timer();
    let frameId;

    const animate = (timestamp) => {
      frameId = requestAnimationFrame(animate);
      timer.update(timestamp);
      cinematicMixerRef.current?.update(timer.getDelta());

      if (cameraLockedRef.current) {
        // A cinematic clip is driving the camera (or just finished and is
        // holding its final frame) — mirror its pose instead of fighting OrbitControls.
        camera.position.copy(cinematicCameraRef.current.position);
        camera.quaternion.copy(cinematicCameraRef.current.quaternion);
      } else if (cameraTweenRef.current) {
        // A zoom-to-anchor tween is driving the camera — same idea as the
        // cinematic lock above: skip controls.update() so it doesn't fight
        // the position we're setting here.
        const tween = cameraTweenRef.current;

        const lookAtTarget =
          tween.target && zoomAnchorMeshesRef.current[tween.target]
            ? getZoomAnchorPosition(
                tween.target,
                zoomAnchorMeshesRef.current[tween.target],
              )
            : controls.target;

        if (!tween.startPosition) {
          tween.startPosition = camera.position.clone();
          tween.startQuaternion = camera.quaternion.clone();

          // Compute the orientation the camera will have once it reaches
          // targetPosition and looks at lookAtTarget — done once, up front,
          // so rotation can be eased smoothly instead of snapping every frame.
          const originalPosition = camera.position.clone();
          const originalQuaternion = camera.quaternion.clone();
          camera.position.copy(tween.targetPosition);
          camera.lookAt(lookAtTarget);
          tween.endQuaternion = camera.quaternion.clone();
          camera.position.copy(originalPosition);
          camera.quaternion.copy(originalQuaternion);
        }

        const elapsed = performance.now() - tween.startTime;
        const progress = Math.min(elapsed / tween.duration, 1);
        const eased = easeOutQuint(progress);

        camera.position.lerpVectors(
          tween.startPosition,
          tween.targetPosition,
          eased,
        );
        camera.quaternion.slerpQuaternions(
          tween.startQuaternion,
          tween.endQuaternion,
          eased,
        );

        if (progress >= 1) {
          camera.position.copy(tween.targetPosition);
          camera.quaternion.copy(tween.endQuaternion);
          cameraTweenRef.current = null;
        }
      } else if (zoomTargetRef.current) {
        // Tween finished, but still zoomed onto a specific part — stay parked
        // exactly where the tween left the camera. Don't call controls.update():
        // its min/maxDistance and angle constraints are tuned for the default
        // view, and controls.target is still the product's center rather than
        // the anchor, so it would clamp the camera to the wrong position.
      } else {
        controls.update();
      }

      const width = mount.clientWidth;
      const height = mount.clientHeight;

      for (const target of ["legs", "speaker", "texture"]) {
        const mesh = zoomAnchorMeshesRef.current[target];

        if (!mesh) {
          anchorPositionsRef.current[target] = { x: 0, y: 0, visible: false };
          continue;
        }

        const anchorPosition = getZoomAnchorPosition(target, mesh);
        anchorPosition.project(camera);

        const x = (anchorPosition.x * 0.5 + 0.5) * width;
        const y = (-anchorPosition.y * 0.5 + 0.5) * height;

        anchorPositionsRef.current[target] = {
          x,
          y,
          visible: anchorPosition.z >= -1 && anchorPosition.z <= 1,
        };
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      modelRef.current = null;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Plays the turntable sub-clip forward on reaching the turntable step, and
  // backward (retracing the same path) once another card's option is touched.
  useEffect(() => {
    const prevActivePart = prevActivePartRef.current;
    prevActivePartRef.current = activePart;

    const mixer = cinematicMixerRef.current;
    const controls = controlsRef.current;
    const clip = cinematicTurntableClipRef.current;
    if (!mixer || !controls || !cinematicCameraRef.current || !clip) return;

    const enteringTurntable =
      activePart === "turntable" && prevActivePart !== "turntable";
    const leavingTurntable =
      prevActivePart === "turntable" && activePart !== "turntable";
    if (!enteringTurntable && !leavingTurntable) return;

    // Pointer input is ignored outright while a clip is playing.
    controls.enabled = false;
    cameraLockedRef.current = true;

    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = enteringTurntable ? 1 : -1;
    action.time = enteringTurntable ? 0 : clip.duration;
    action.play();

    const handleFinished = (event) => {
      if (event.action !== action) return;
      mixer.removeEventListener("finished", handleFinished);
      controls.enabled = true;

      if (enteringTurntable) {
        // Stay parked on the close-up until the user's first drag.
        const handleDragStart = () => {
          cameraLockedRef.current = false;
          controls.removeEventListener("start", handleDragStart);
        };
        controls.addEventListener("start", handleDragStart);
      } else {
        // Back at the on-load view — no reason to keep it locked.
        cameraLockedRef.current = false;
      }
    };
    mixer.addEventListener("finished", handleFinished);
  }, [activePart]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
