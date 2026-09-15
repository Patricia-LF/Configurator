import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import {
  loadProductModel,
  getLightColors,
  getCameraViews,
  productModelUrl,
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

function getZoomAnchorPosition(target, mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  if (target === "speaker") {
    center.set(box.max.x, box.max.y, center.z);
  } else if (target === "legs") {
    center.set(box.min.x, box.min.y, center.z);
  }
  // texture: no offset — stays at the mesh's true center

  return center;
}

// "CameraAction" is baked at 24fps over 348 frames: default view -> close-up
// turntable framing -> back to default -> a third framing. The turntable
// step uses just frames 20-150 (default in to the close-up, held there) —
// played forward to arrive, and played backward (AnimationAction.timeScale
// = -1) to leave, so the "outro" is guaranteed to retrace the exact same
// path back to the exact same starting pose.
const CAMERA_ACTION_FPS = 24;
const TURNTABLE_CLIP_FRAME_RANGE = [35, 105];
// Nudges the baked close-up framing (0.3, 1.23, 0.93) further left along
// world X. Negative = left. Applied to the clip's position track, ramped
// so it still starts from the true, unshifted default view.
const TURNTABLE_CAMERA_OFFSET = new THREE.Vector3(-0.3, 0, 0);

// Shifts a clip's position track by `offset`, weighted per-keyframe by
// `weightForProgress(progress)`, where `progress` is how far that keyframe
// already is along the clip's baked start->end path (0 at the first
// keyframe, 1 once the camera reaches/holds on its final framing).
function offsetPositionTrack(clip, offset, weightForProgress) {
  const track = clip.tracks.find((t) => t.name.endsWith('.position'));
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

    const progress = pathLengthSq === 0
      ? 0
      : THREE.MathUtils.clamp(current.sub(start).dot(path) / pathLengthSq, 0, 1);
    const weight = weightForProgress(progress);

    values[idx] += offset.x * weight;
    values[idx + 1] += offset.y * weight;
    values[idx + 2] += offset.z * weight;
  }
}

// Blends a clip's position+quaternion tracks toward an absolute pose,
// weighted per-keyframe by `weightForProgress(progress)` (see
// `offsetPositionTrack` above for how `progress` is derived) — weight 0
// keeps the original baked value, weight 1 fully replaces it with
// `targetPosition`/`targetQuaternion`.
function blendTrackTowardPose(clip, targetPosition, targetQuaternion, weightForProgress) {
  const posTrack = clip.tracks.find((t) => t.name.endsWith('.position'));
  if (!posTrack) return;
  const rotTrack = clip.tracks.find((t) => t.name.endsWith('.quaternion'));

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

    const progress = pathLengthSq === 0
      ? 0
      : THREE.MathUtils.clamp(current.clone().sub(start).dot(path) / pathLengthSq, 0, 1);
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
 * Main product scene: loads the configurable product model, applies
 * ConfiguratorContext's `selected` state onto its materials/visibility, and
 * renders it with an orbit-controlled camera. The backdrop follows the
 * app-wide Light/Dark theme toggle rather than its own configurator option.
 */
export default function Scene() {
  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const materialsByNameRef = useRef(null);
  // Baked-in camera + its AnimationMixer/clips from the GLB, kept alongside
  // (not instead of) the orbit-controlled `camera` below.
  const cinematicCameraRef = useRef(null);
  const cinematicMixerRef = useRef(null);
  const cinematicClipsRef = useRef([]);

  const zoomAnchorMeshesRef = useRef({
    legs: null,
    speaker: null,
    texture: null,
  });

  const defaultCameraPositionRef = useRef(null);
  const cameraTweenRef = useRef(null);

  const { selected } = useConfigurator();
  // The sub-clip trimmed out of "CameraAction" for the turntable step (see
  // TURNTABLE_CLIP_FRAME_RANGE above) — played forward for the intro and
  // backward for the outro.
  const cinematicTurntableClipRef = useRef(null);
  // True while the render loop should show the cinematic camera's pose
  // instead of OrbitControls' — during the fly-through itself, and then
  // still parked on the close-up afterward until the user's first drag.
  const cameraLockedRef = useRef(false);
  // The orbit-controlled render camera/controls, stashed so the
  // turntable-fly-through effect below (a separate effect from the one that
  // creates them) can reach them.
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const prevActivePartRef = useRef(null);
  const { selected, activePart } = useConfigurator();
  const { isDarkMode } = useTheme();

  const modelSelection = {
    ...selected,
    scene: { background: isDarkMode ? "Orange" : "White" },
  };

  const { zoomTarget, anchorPositionsRef } = useZoom();

  function startCameraTween(targetPosition, target) {
    if (!targetPosition) return;
    cameraTweenRef.current = {
      startPosition: null,
      targetPosition: targetPosition.clone(),
      target, // "legs" | "speaker" | "texture" | undefined (zoom-out)
      startTime: performance.now(),
      duration: 800,
    };
  }

  // Kept in a ref so this effect can stay `[]` while still reading the
  // latest selection once the model finishes loading.
  const selectedRef = useRef(modelSelection);
  useEffect(() => {
    selectedRef.current = modelSelection;
    if (modelRef.current && materialsByNameRef.current) {
      applyConfiguratorSelection(
        modelRef.current,
        modelSelection,
        materialsByNameRef.current,
      );
    }
  }, [selected, isDarkMode]);

  const ZOOM_DISTANCE = 2; // how close the camera gets to the anchor — tune to taste

  useEffect(() => {
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
    // The GLB's baked-in lights (Scene_Light_Top/Front) are PointLights, and
    // three.js silently skips shadow maps for PointLights under VSMShadowMap
    // (unsupported) — PCFShadowMap is the widest-compatible option that works
    // for point lights.
    renderer.shadowMap.type = THREE.PCFShadowMap;
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

    loadProductModel(productModelUrl)
      .then(({ model, lights, cameras, animations }) => {
        prepareProductModel(model);

        // Baked-in camera + clips (e.g. a zoom-to-area fly-through), fetched
        // for later use — this doesn't touch the orbit `camera`/`controls` below.
        cinematicCameraRef.current = cameras[0] ?? null;
        cinematicClipsRef.current = animations;
        if (cameras.length > 0 && animations.length > 0) {
          cinematicMixerRef.current = new THREE.AnimationMixer(model);
        }

        model.scale.set(1, 1, 1);
        model.position.set(-0.5, 0.1, 0);
        scene.add(model);

        modelRef.current = model;

        const materialsByName = collectMaterialsByName(model);
        materialsByNameRef.current = materialsByName;

        applyFixedMaterials(model, materialsByName);

        applyConfiguratorSelection(model, selectedRef.current, materialsByName);
        zoomAnchorMeshesRef.current = getZoomAnchorMeshes(model);

        // Sizes the fallback lights' shadow frustum and frames the camera
        // when the export has no baked-in camera.
        const productBounds = getProductBounds(model);

        console.log("[Scene] lights from GLB:", getLightColors(lights));
        console.log("[Scene] cameras from GLB:", getCameraViews(cameras));
        console.log(
          "[Scene] animation clips from GLB:",
          animations.map((clip) => clip.name),
        );

        // WEBBTO3D_FINAL_TEST.glb has its own baked-in lights (KHR_lights_punctual),
        // already added to the scene as part of `scene.add(model)` above — enable
        // shadow casting on them so Scene_White/Orange's receiveShadow has something
        // to receive, same as the manual fallback lights used to provide.
        //
        // Blender's glTF exporter writes physically-based candela values (tens of
        // thousands here) meant for a physically-correct exposure pipeline, which
        // blows out this scene's tone mapping/exposure — so intensities are
        // re-tuned by hand per light, matching the values from threejs.org/editor.
        const GLB_LIGHT_INTENSITY_BY_NAME = {
          Scene_Light_Top: 20,
          Scene_Light_Front: 10,
        };
        lights.forEach((light) => {
          if (light.name in GLB_LIGHT_INTENSITY_BY_NAME) {
            light.intensity = GLB_LIGHT_INTENSITY_BY_NAME[light.name];
          }

          if ("castShadow" in light) {
            light.castShadow = true;
            light.shadow.mapSize.set(2048, 2048);
            light.shadow.bias = -0.0015;
          }
        });

        if (cameras.length > 0) {
          // Use the first exported camera's framing as the starting view.
          camera.position.copy(cameras[0].position);
          camera.quaternion.copy(cameras[0].quaternion);
          // Baked camera has no orbit target — without this, orbiting pivots
          // around the origin instead of the product.
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

        // Start fully tilted down (maxPolarAngle) instead of the artist's
        // camera angle, so every reload begins at the same view.
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = controls.maxPolarAngle;
        camera.position
          .copy(controls.target)
          .add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update();

        // Remember this as the "zoomed out" / default view to tween back to
        defaultCameraPositionRef.current = camera.position.clone();
      })
      .catch((error) => {
        console.error("[Scene]", error);
      });

      if (cameras.length > 0) {
        // Use the first exported camera's framing as the starting view.
        camera.position.copy(cameras[0].position);
        camera.quaternion.copy(cameras[0].quaternion);
        // Baked camera has no orbit target — without this, orbiting pivots
        // around the origin instead of the product.
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
          const fitDistance = (maxDim / 2) / Math.tan((camera.fov * Math.PI) / 360);

          camera.near = fitDistance / 100;
          camera.far = fitDistance * 100;
          camera.position.set(center.x, center.y, center.z + fitDistance * 1.4);
          camera.updateProjectionMatrix();

          controls.target.copy(center);
          controls.update();
        }
      }

      // Now that the actual on-load view is settled (the GLB's own baked
      // camera framing — note controls.min/maxPolarAngle and
      // min/maxAzimuthAngle below can still clamp it if the artist's angle
      // falls outside those limits), build the turntable sub-clip so it
      // blends from that exact pose — otherwise the fly-through would jump
      // from the on-load view to the raw baked default the instant it
      // starts. Playing it backward for the outro (see the turntable
      // effect below) then guarantees an identical return trip.
      if (cinematicMixerRef.current) {
        const reloadPosition = camera.position.clone();
        const reloadQuaternion = camera.quaternion.clone();

        const [clipStart, clipEnd] = TURNTABLE_CLIP_FRAME_RANGE;
        cinematicTurntableClipRef.current = THREE.AnimationUtils.subclip(
          animations[0],
          'CameraTurntableIntro',
          clipStart,
          clipEnd,
          CAMERA_ACTION_FPS
        );
        // Ramp 1 -> 0: starts exactly on the on-load view, fading out by
        // the time it reaches the close-up (whose baked framing we keep).
        blendTrackTowardPose(cinematicTurntableClipRef.current, reloadPosition, reloadQuaternion, (p) => 1 - p);
        // Ramp 0 -> 1: shifts the close-up itself further left.
        offsetPositionTrack(cinematicTurntableClipRef.current, TURNTABLE_CAMERA_OFFSET, (p) => p);
      }
    }).catch((error) => {
      console.error('[Scene]', error);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    // Two-finger trackpad drag (and right-click-drag) would otherwise pan
    // the camera/target off the product — only orbiting is wanted here.
    controls.enablePan = false;
    // Keeps the camera off the floor/backdrop rear; tuned to the ~4-unit default distance.
    controls.minDistance = 2.5;
    controls.maxDistance = 5.5;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minAzimuthAngle = -Math.PI / 12;
    controls.maxAzimuthAngle = Math.PI / 12;
    controlsRef.current = controls;

    const timer = new THREE.Timer();
    let frameId;

    const animate = (timestamp) => {
      frameId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const delta = timer.getDelta();

      cinematicMixerRef.current?.update(delta);

      if (cameraTweenRef.current) {
        const tween = cameraTweenRef.current;

        if (!tween.startPosition) {
          tween.startPosition = camera.position.clone();
        }

        const elapsed = performance.now() - tween.startTime;
        const progress = Math.min(elapsed / tween.duration, 1);
        const eased = easeOutCubic(progress);

        camera.position.lerpVectors(
          tween.startPosition,
          tween.targetPosition,
          eased,
        );

        const lookAtTarget =
          tween.target && zoomAnchorMeshesRef.current[tween.target]
            ? getZoomAnchorPosition(
                tween.target,
                zoomAnchorMeshesRef.current[tween.target],
              )
            : controls.target;

        camera.lookAt(lookAtTarget);

        if (progress >= 1) {
          camera.position.copy(tween.targetPosition);
          camera.lookAt(lookAtTarget);
          cameraTweenRef.current = null;
        }
      }

      const width = mount.clientWidth;
      const height = mount.clientHeight;

      for (const target of ["legs", "speaker", "texture"]) {
        const mesh = zoomAnchorMeshesRef.current[target];

        if (!mesh) {
          anchorPositionsRef.current[target] = { x: 0, y: 0, visible: false };
          continue;
        }

        const anchorPosition = getZoomAnchorPosition(target, mesh); // ← delad funktion
        anchorPosition.project(camera);

        const x = (anchorPosition.x * 0.5 + 0.5) * width;
        const y = (-anchorPosition.y * 0.5 + 0.5) * height;

        anchorPositionsRef.current[target] = {
          x,
          y,
          visible: anchorPosition.z >= -1 && anchorPosition.z <= 1,
        };
      cinematicMixerRef.current?.update(timer.getDelta());

      if (cameraLockedRef.current) {
        // A cinematic clip (see the turntable fly-through effect) is
        // driving the baked-in GLB camera, or it just finished and we're
        // holding on its final frame until the user drags — mirror its
        // pose onto the render camera instead of letting OrbitControls
        // fight it.
        camera.position.copy(cinematicCameraRef.current.position);
        camera.quaternion.copy(cinematicCameraRef.current.quaternion);
      } else {
        controls.update();
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

  // Plays the trimmed turntable sub-clip forward the moment the user
  // reaches the turntable step, and backward (retracing the exact same
  // path back to the exact same starting pose) the moment they touch an
  // option in any other card afterward — ConfiguratorPanel's
  // `setActivePart` fires on every option change, not just step advances.
  useEffect(() => {
    const prevActivePart = prevActivePartRef.current;
    prevActivePartRef.current = activePart;

    const mixer = cinematicMixerRef.current;
    const controls = controlsRef.current;
    const clip = cinematicTurntableClipRef.current;
    if (!mixer || !controls || !cinematicCameraRef.current || !clip) return;

    const enteringTurntable = activePart === 'turntable' && prevActivePart !== 'turntable';
    const leavingTurntable = prevActivePart === 'turntable' && activePart !== 'turntable';
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
      mixer.removeEventListener('finished', handleFinished);
      controls.enabled = true;

      if (enteringTurntable) {
        // Stay parked on the close-up (cameraLockedRef stays true) until
        // the user's first drag actually begins.
        const handleDragStart = () => {
          cameraLockedRef.current = false;
          controls.removeEventListener('start', handleDragStart);
        };
        controls.addEventListener('start', handleDragStart);
      } else {
        // Back at the on-load view — no reason to keep it locked.
        cameraLockedRef.current = false;
      }
    };
    mixer.addEventListener('finished', handleFinished);
  }, [activePart]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
