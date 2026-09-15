import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import {
  loadProductModel,
  getLightColors,
  getCameraViews,
  productModelUrl,
  prepareProductModel,
  applyFixedMaterials,
  applyConfiguratorSelection,
  getProductBounds,
} from './ProductModel';
import { collectMaterialsByName } from './materialLibrary';
import { useConfigurator } from '../hooks/useConfigurator';
import { useTheme } from '../hooks/useTheme';

const hdriUrl = '/models/studio.hdr';

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
  const { selected } = useConfigurator();
  const { isDarkMode } = useTheme();

  const modelSelection = { ...selected, scene: { background: isDarkMode ? 'Orange' : 'White' } };

  // Kept in a ref so this effect can stay `[]` while still reading the
  // latest selection once the model finishes loading.
  const selectedRef = useRef(modelSelection);
  useEffect(() => {
    selectedRef.current = modelSelection;
    if (modelRef.current && materialsByNameRef.current) {
      applyConfiguratorSelection(modelRef.current, modelSelection, materialsByNameRef.current);
    }
  }, [selected, isDarkMode]);

  useEffect(() => {
    const mount = mountRef.current;
    let cancelled = false;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.filmGauge = 36;
    camera.setFocalLength(50);
    camera.updateProjectionMatrix();
    camera.position.set(0, 0.8, 4);

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

    loadProductModel(productModelUrl).then(({ model, lights, cameras, animations }) => {
      if (cancelled) return;

      prepareProductModel(model);

      // Baked-in camera + clips (e.g. a zoom-to-area fly-through), fetched
      // for later use — this doesn't touch the orbit `camera`/`controls` below.
      cinematicCameraRef.current = cameras[0] ?? null;
      cinematicClipsRef.current = animations;
      if (cameras.length > 0 && animations.length > 0) {
        cinematicMixerRef.current = new THREE.AnimationMixer(model);
      }

      model.scale.set(1, 1, 1);
      model.position.set(-0.4, 0, 0);
      scene.add(model);

      modelRef.current = model;

      const materialsByName = collectMaterialsByName(model);
      materialsByNameRef.current = materialsByName;

      applyFixedMaterials(model, materialsByName);

      applyConfiguratorSelection(model, selectedRef.current, materialsByName);

      // Sizes the fallback lights' shadow frustum and frames the camera
      // when the export has no baked-in camera.
      const productBounds = getProductBounds(model);

      console.log('[Scene] lights from GLB:', getLightColors(lights));
      console.log('[Scene] cameras from GLB:', getCameraViews(cameras));
      console.log('[Scene] animation clips from GLB:', animations.map((clip) => clip.name));

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

        if ('castShadow' in light) {
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
          const fitDistance = (maxDim / 2) / Math.tan((camera.fov * Math.PI) / 360);

          camera.near = fitDistance / 100;
          camera.far = fitDistance * 100;
          camera.position.set(center.x, center.y, center.z + fitDistance * 1.4);
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
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
    }).catch((error) => {
      console.error('[Scene]', error);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    // Keeps the camera off the floor/backdrop rear; tuned to the ~4-unit default distance.
    controls.minDistance = 2.5;
    controls.maxDistance = 5.5;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minAzimuthAngle = -Math.PI / 12;
    controls.maxAzimuthAngle = Math.PI / 12;

    const timer = new THREE.Timer();
    let frameId;
    const animate = (timestamp) => {
      frameId = requestAnimationFrame(animate);
      timer.update(timestamp);
      cinematicMixerRef.current?.update(timer.getDelta());
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      modelRef.current = null;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
