import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMeshVisibility } from './oldConfiguratorRules';

const modelUrl = '/models/3D_TO_WEB_PREVIEW_4_WITH_MODIFIERS.glb';

// const WOOD_MATERIAL_NAMES = new Set(['Mahogany', 'Maple', 'Walnut']);

// The wood materials' packed metallic/roughness texture baked out of Blender
// as a solid magenta placeholder (missing-image fallback color) instead of
// actual per-pixel data — its green channel (roughness) reads as ~0, i.e.
// mirror-smooth, and its blue channel (metalness) reads as ~1. That's what
// makes the wood look like shiny, bloated plastic ("swollen") instead of
// matte wood: darker veneers like Walnut show the blown-out specular
// highlights the most starkly. Dropping the broken texture and setting
// explicit factors restores a matte-wood look until re-exported from Blender.
// const WOOD_ROUGHNESS = 0.7;
// const WOOD_METALNESS = 0;

// function fixWoodRoughness(model) {
//     model.traverse((child) => {
//         if (!child.isMesh || !WOOD_MATERIAL_NAMES.has(child.material?.name)) return;

//         const material = child.material;
//         material.roughnessMap = null;
//         material.metalnessMap = null;
//         material.roughness = WOOD_ROUGHNESS;
//         material.metalness = WOOD_METALNESS;
//         material.needsUpdate = true;
//     });
// }

/**
 * Loads the product
 * @param {string} [url]
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

                // fixWoodRoughness(model);

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
        type: light.type,
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

/**
 * Shows/hides the model's per-option meshes to match ConfiguratorContext's
 * `selected` state, per the mapping in configuratorRules.getMeshVisibility.
 * Safe to call repeatedly on the same `model` as selections change.
 */
export function applyProductSelection(model, selected) {
    const isVisible = getMeshVisibility(selected);

    model.traverse((child) => {
        if (child.isMesh) {
            child.visible = isVisible(child.name);
        }
    });
}
