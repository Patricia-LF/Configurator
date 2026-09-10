import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Files in public/ are served as-is at the site root — reference them by
// URL, don't import them as modules (Vite will try to parse them as JS).
const modelUrl = '/models/3DTOWEBB_PREVIEW_2_OPTIMIZED.glb';

/**
 * Loads the product GLB and pulls out everything embedded in the file:
 * the mesh hierarchy, any KHR_lights_punctual lights, and any exported
 * cameras.
 *
 * GLTFLoader turns embedded lights into real THREE.Light instances that sit
 * in `model`'s node hierarchy, and embedded cameras into `gltf.cameras`. Both
 * come back as empty arrays if the source .glb was exported without them —
 * check the Blender glTF export panel's "Cameras" / "Punctual Lights"
 * checkboxes if you expect entries here and get none.
 *
 * @param {string} [url] - defaults to the bundled product model
 * @returns {Promise<{ gltf: import('three/addons/loaders/GLTFLoader.js').GLTF, model: THREE.Group, lights: THREE.Light[], cameras: THREE.Camera[] }>}
 */
export function loadProductModel(url = modelUrl) {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                const model = gltf.scene;
                const lights = [];

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }

                    if (child.isLight) {
                        lights.push(child);
                    }
                });

                const cameras = gltf.cameras ?? [];

                if (lights.length === 0) {
                    console.warn(`[ProductModel] "${url}" has no lights (KHR_lights_punctual) baked in.`);
                }
                if (cameras.length === 0) {
                    console.warn(`[ProductModel] "${url}" has no cameras baked in.`);
                }

                resolve({ gltf, model, lights, cameras });
            },
            undefined,
            reject
        );
    });
}

/** Convenience summary of each embedded light's color/intensity, e.g. for a debug panel. */
export function getLightColors(lights) {
    return lights.map((light) => ({
        name: light.name,
        type: light.type, // 'PointLight' | 'SpotLight' | 'DirectionalLight'
        color: light.color.clone(),
        intensity: light.intensity,
    }));
}

/** Convenience summary of each embedded camera, e.g. for a "switch view" control. */
export function getCameraViews(cameras) {
    return cameras.map((camera) => ({
        name: camera.name,
        type: camera.isPerspectiveCamera ? 'perspective' : 'orthographic',
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
    }));
}
