import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { loadProductModel, getLightColors, getCameraViews, applyProductSelection } from './ProductModel';
import { useConfigurator } from '../hooks/useConfigurator';

// Files in public/ are served as-is at the site root — reference them by
// URL, don't import them as modules (Vite will try to parse them as JS).
const hdriUrl = '/models/indoor.hdr';

export default function Scene() {
    const mountRef = useRef(null);
    const modelRef = useRef(null);
    const { selected } = useConfigurator();

    // Read via a ref inside the mount effect below so that effect can stay
    // `[]` (it owns the renderer/animation loop, which shouldn't be torn
    // down and rebuilt every time an option changes) while still applying
    // whatever was selected by the time the model finishes loading.
    const selectedRef = useRef(selected);
    useEffect(() => {
        selectedRef.current = selected;
        if (modelRef.current) {
            applyProductSelection(modelRef.current, selected);
        }
    }, [selected]);

    useEffect(() => {
        const mount = mountRef.current;
        let cancelled = false;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set( 0, 0.5, 2 );

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;

        mount.appendChild(renderer.domElement);

        // Controls how much the environment affects the materials
        scene.environmentIntensity = 1; // Brighter reflections

        // Modern Three.js also uses tone mapping to handle "bright" HDR data
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.5; // Increase for a brighter look
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // HDRI environment map (ambient/reflection lighting; no manual lights)
        const hdrLoader = new HDRLoader();
        hdrLoader.load(hdriUrl, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.environment = texture;

            // solid color background but HDRI reflections:
            scene.background = new THREE.Color(0xaaaaaa);
        });

        let fallbackLight;

        loadProductModel().then(({ model, lights, cameras }) => {
            if (cancelled) return;

            model.scale.set(1, 1, 1);
            model.position.set(0, 0, 0);
            scene.add(model);

            modelRef.current = model;
            applyProductSelection(model, selectedRef.current);

            // Lights baked into the GLB (KHR_lights_punctual) are already
            // part of `model`'s hierarchy from `scene.add(model)` above —
            // this is just a look at what colors/types came through.
            console.log('[Scene] lights from GLB:', getLightColors(lights));
            console.log('[Scene] cameras from GLB:', getCameraViews(cameras));

            if (lights.length === 0) {
                // Current export has no embedded lights — fall back to a
                // basic directional light so the model isn't unlit.
                fallbackLight = new THREE.DirectionalLight(0xffffff, 5);
                fallbackLight.position.set(5, 10, 7.5);
                scene.add(fallbackLight);
            }

            if (cameras.length > 0) {
                // Use the first exported camera's framing as the starting view.
                camera.position.copy(cameras[0].position);
                camera.quaternion.copy(cameras[0].quaternion);
            }
        }).catch((error) => {
            console.error(error);
        });

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;

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

    return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}
