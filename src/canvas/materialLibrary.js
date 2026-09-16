/**
 * Walks the loaded model once and returns every unique material it finds,
 * keyed by material name (the name assigned in Blender/exported in the glTF).
 * If multiple meshes reference the same material name, GLTFLoader already
 * gives them the same Material instance (it caches by glTF material index),
 * so this just needs to record it once per name.
 *
 * @param {THREE.Object3D} model
 * @returns {Map<string, THREE.Material>}
 */
export function collectMaterialsByName(model) {
  const materialsByName = new Map();

  model.traverse((child) => {
    if (!child.isMesh || !child.material?.name) return;
    if (!materialsByName.has(child.material.name)) {
      materialsByName.set(child.material.name, child.material);
    }
  });

  return materialsByName;
}

// Walks the loaded model once and returns every mesh name it finds, in order.
export function listMeshNames(model) {
  const names = [];
  model.traverse((child) => {
    if (child.isMesh) names.push(child.name);
  });
  return names;
}

/**
 * Assigns `material` to every mesh named `meshName` in `model`. This is the
 * "apply a fetched material to a part from code" half of the test — no new
 * geometry, no re-export, just swapping which Material instance a mesh
 * points at.
 *
 * @param {THREE.Object3D} model
 * @param {string} meshName
 * @param {THREE.Material} material
 * @returns {number}
 */
export function applyMaterialByName(model, meshName, material) {
  let updated = 0;
  model.traverse((child) => {
    if (child.isMesh && child.name === meshName) {
      child.material = material;
      updated += 1;
    }
  });
  return updated;
}
