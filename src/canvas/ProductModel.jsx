import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getModelState } from '../config/configuratorRules';
import { FIXED_MATERIAL_BY_MESH } from '../config/productOptions';

export const productModelUrl = '/models/3DTOWEBB_PEVIEW_6.glb';

/**
 * Loads the product GLB: the mesh hierarchy, any KHR_lights_punctual
 * lights, any exported cameras, and any baked animation clips (e.g. camera
 * fly-throughs targeting one of those cameras' nodes).
 *
 * @param {string} [url]
 * @returns {Promise<{ gltf: import('three/addons/loaders/GLTFLoader.js').GLTF, model: THREE.Group, lights: THREE.Light[], cameras: THREE.Camera[], animations: THREE.AnimationClip[] }>}
 */
export function loadProductModel(url = productModelUrl) {
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
        const animations = gltf.animations ?? [];

        if (lights.length === 0) {
          console.warn(`[ProductModel] "${url}" has no lights (KHR_lights_punctual) baked in.`);
        }
        if (cameras.length === 0) {
          console.warn(`[ProductModel] "${url}" has no cameras baked in.`);
        }
        if (animations.length === 0) {
          console.warn(`[ProductModel] "${url}" has no animation clips baked in.`);
        }

        resolve({ gltf, model, lights, cameras, animations });
      },
      undefined,
      reject
    );
  });
}

// Convenience summary of each embedded light, e.g. for a "switch lighting" control.
export function getLightColors(lights) {
  return lights.map((light) => ({
    name: light.name,
    type: light.type, 
    color: light.color.clone(),
    intensity: light.intensity,
  }));
}

// Convenience summary of each embedded camera, e.g. for a "switch view" control.
export function getCameraViews(cameras) {
  return cameras.map((camera) => ({
    name: camera.name,
    type: camera.isPerspectiveCamera ? 'perspective' : 'orthographic',
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone(),
  }));
}

// Prefix of the material-swatch nodes in the model. 
// These are not part of the visible product, but they carry the real materials 
// into the glTF's materials array so they can be fetched and reassigned onto the real product parts.
const MATERIAL_SWATCH_PREFIX = 'Sample_Cube_';

// Node-name prefixes the selection logic below manages. 'Speaker' has no
// trailing underscore — it's a single shape shared by both grille colors.
const MANAGED_PREFIXES = ['Console_', 'Legs_', 'Cabinet_', 'NS_', 'Speaker', 'Scene_'];

function isManagedMeshName(name) {
  return MANAGED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

// Run once right after the model loads: enables shadows on every mesh and
// hides the material-swatch nodes (they're not part of the visible product).
export function prepareProductModel(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (child.name.startsWith(MATERIAL_SWATCH_PREFIX)) {
      child.visible = false;
    }
  });
}

// Assigns each FIXED_MATERIAL_BY_MESH part its material. Run once after load.
export function applyFixedMaterials(model, materialsByName) {
  Object.entries(FIXED_MATERIAL_BY_MESH).forEach(([meshName, materialName]) => {
    if (!materialsByName.has(materialName)) {
      console.warn(`[ProductModel] material "${materialName}" not found for mesh "${meshName}"`);
      return;
    }

    model.traverse((child) => {
      if (child.isMesh && child.name === meshName) {
        child.material = materialsByName.get(materialName);
      }
    });
  });
}

// Updates the model's mesh visibility and material assignments based on the
// current configurator selection. This is the "apply a selection to the model"
export function applyConfiguratorSelection(model, selected, materialsByName) {
  const { visibleMeshNames, materialByMesh } = getModelState(selected);

  model.traverse((child) => {
    if (!child.isMesh || !isManagedMeshName(child.name)) return;

    child.visible = visibleMeshNames.has(child.name);

    const materialName = materialByMesh[child.name];
    if (!materialName) return;

    if (materialsByName.has(materialName)) {
      child.material = materialsByName.get(materialName);
    } else {
      console.warn(`[ProductModel] material "${materialName}" not found for mesh "${child.name}"`);
    }
  });
}

// Returns the bounding box of all visible meshes in the model, ignoring
// hidden meshes and the material-swatch nodes. Useful for framing the camera
// on the product.
export function getProductBounds(model) {
  const bounds = new THREE.Box3();

  model.traverse((child) => {
    if (
      child.isMesh &&
      child.visible &&
      !child.name.startsWith('Scene_') &&
      !child.name.startsWith(MATERIAL_SWATCH_PREFIX)
    ) {
      bounds.expandByObject(child);
    }
  });

  return bounds;
}
