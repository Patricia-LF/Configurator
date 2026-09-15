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
    // VSMShadowMap blurs smoothly at large radius; PCFSoftShadowMap gets noisy here.
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Dialed down to avoid clipping bright materials (env + key + fill lights stack up).
    renderer.toneMappingExposure = 0.6;
    mount.appendChild(renderer.domElement);

    // Kept low so the spotlights, not the HDRI, define the vignette.
    scene.environmentIntensity = 0.2;

    const hdrLoader = new HDRLoader();
    hdrLoader.load(hdriUrl, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    let fallbackLight;

    loadProductModel(productModelUrl).then(({ model, lights, cameras }) => {
      if (cancelled) return;

      prepareProductModel(model);

      model.scale.set(1, 1, 1);
      model.position.set(-0.5, 0, 0);
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

      if (lights.length === 0) {
        // SpotLight gives a falloff "pool of light" instead of an even wash.
        fallbackLight = new THREE.SpotLight(0xffffff, 4);
        fallbackLight.position.set(8, 3, 2);
        // decay=0 keeps intensity constant within `distance`; angle/distance shape the falloff.
        fallbackLight.decay = 0;
        // Tight angle keeps the floor mostly dark instead of catching the whole cone.
        fallbackLight.angle = Math.PI / 16;
        fallbackLight.penumbra = 0.6;

        // Needed for Scene_White/Orange's receiveShadow to have something to receive.
        fallbackLight.castShadow = true;
        fallbackLight.shadow.mapSize.set(2048, 2048);
        // Avoids shadow acne.
        fallbackLight.shadow.bias = -0.0015;
        // More samples avoids banding at this blur radius.
        fallbackLight.shadow.radius = 6;
        fallbackLight.shadow.blurSamples = 25;

        if (!productBounds.isEmpty()) {
          const center = productBounds.getCenter(new THREE.Vector3());
          const boxSize = productBounds.getSize(new THREE.Vector3());
          const shadowExtent = Math.max(boxSize.x, boxSize.y, boxSize.z) * 1.5;

          // Nudged left to match the model's visual center (framed by the
          // baked camera, not this bounding box).
          const lightCenterX = center.x - shadowExtent * 0.25;

          // Directly overhead; positioned relative to center/shadowExtent
          // so it scales with whatever's loaded.
          fallbackLight.position.set(
            lightCenterX,
            center.y + shadowExtent * 5,
            center.z,
          );

          // Centers the shadow frustum on the product instead of the origin.
          fallbackLight.target.position.set(lightCenterX, center.y, center.z);
          scene.add(fallbackLight.target);

          // Must bracket the actual light->target distance or the model
          // gets clipped out of the shadow frustum.
          const lightDistance = fallbackLight.position.distanceTo(center);
          fallbackLight.shadow.camera.near = Math.max(0.1, lightDistance - shadowExtent * 3);
          fallbackLight.shadow.camera.far = lightDistance + shadowExtent * 3;
          fallbackLight.distance = lightDistance * 2.5;
          fallbackLight.shadow.camera.updateProjectionMatrix();

          // Fill light for raking detail on the Speaker grille — the
          // overhead key light above hits it too straight-on to show it.
          const fillLight = new THREE.SpotLight(0xffffff, 8);
          fillLight.decay = 0;
          // Tight cone so it doesn't spill onto the floor in front of the model.
          fillLight.angle = Math.PI / 12;
          fillLight.penumbra = 0.7;
          fillLight.position.set(
            center.x + shadowExtent * 3,
            center.y + shadowExtent * 0.5,
            center.z + shadowExtent * 1.5,
          );
          fillLight.target.position.copy(center);
          scene.add(fillLight.target);
          // Must exceed the light's real distance to its target, or falloff zeroes it out early.
          fillLight.distance = fillLight.position.distanceTo(center) * 2;
          scene.add(fillLight);
        }

        // Lights the backdrop's back-left corner for visual interest,
        // narrowed/pulled back so it doesn't spill onto the product.
        const backdropAccentLight = new THREE.SpotLight(0xffffff, 2);
        backdropAccentLight.decay = 0;
        backdropAccentLight.angle = Math.PI / 10;
        backdropAccentLight.penumbra = 0.6;
        backdropAccentLight.position.copy(model.position).add(new THREE.Vector3(-1.8, 2.0, 0.3));
        const backdropAccentTarget = model.position.clone().add(new THREE.Vector3(-2.2, 1.6, -2.2));
        backdropAccentLight.target.position.copy(backdropAccentTarget);
        scene.add(backdropAccentLight.target);
        backdropAccentLight.distance = backdropAccentLight.position.distanceTo(backdropAccentTarget) * 2.5;
        scene.add(backdropAccentLight);

        scene.add(fallbackLight);
      }

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
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
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
