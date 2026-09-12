import { legMaterialBaseOptions } from "./productOptions";

// Leg material options depend on which wood veneer was chosen for the cabinet
export function getLegMaterialOptions(selectedCabinetWood) {
  if (!selectedCabinetWood) return legMaterialBaseOptions;

  return [
    ...legMaterialBaseOptions,
    { label: selectedCabinetWood, value: selectedCabinetWood },
  ];
}
// Maps ConfiguratorContext's `selected` state to which named meshes in the
// product GLB (3D_TO_WEB_PREVIEW_4_LIGHT_TEXT_JPG_FIX.glb) should be visible.
//
// NS_Smooth_*/NS_Textured_* ("NS" = No Speaker) are the blank door inserts
// shown when speaker.included is "Cabinet Doors", following surface/veneer
// like the regular cabinet door meshes.

const CABINET_SIZE_TOKEN = {
  "118cm": "Small",
  "200cm": "Large",
};

const CABINET_SURFACE_PREFIX = {
  Smooth: "Cabinet_Smooth",
  Textured: "Cabinet_Textured",
};

const NS_SURFACE_PREFIX = {
  Smooth: "NS_Smooth",
  Textured: "NS_Textured",
};

const SPEAKER_GRILLE_NAME = {
  Light: "Speaker_Light",
  Dark: "Speaker_Dark",
};

// Node name prefixes this module manages the visibility of. Anything not
// matching one of these (Back_Wall, Floor, Light_Bounce_Plane,
// Recordplayer_Cover, ...) is static scenery and stays at its default
// visibility.
const MANAGED_PREFIXES = ["Console_", "Cabinet_", "Legs_", "Speaker_", "NS_", "Scene_"];

export function isManagedMeshName(name) {
  return MANAGED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

// The small (118cm) cabinet has no room for a built-in speaker.
export function isSpeakerAllowed(selected) {
  return selected.cabinet.size !== "118cm";
}

/**
 * @param {object} selected - ConfiguratorContext's `selected` state
 * @returns {(name: string) => boolean} predicate for a mesh's visibility
 */
export function getMeshVisibility(selected) {
  const veneer = selected.cabinet.woodVeneer;

  const activeConsole = `Console_${CABINET_SIZE_TOKEN[selected.cabinet.size]}_${veneer}`;
  const activeCabinetDoor = `${CABINET_SURFACE_PREFIX[selected.cabinet.surface]}_${veneer}`;
  const activeLegs = `Legs_${CABINET_SIZE_TOKEN[selected.cabinet.size]}_${selected.legs.material}`;

  // No speaker cutout on the small cabinet, so nothing to show here.
  let activeSpeaker = null;
  if (isSpeakerAllowed(selected)) {
    activeSpeaker =
      selected.speaker.included === "Speakers"
        ? SPEAKER_GRILLE_NAME[selected.speaker.grille]
        : `${NS_SURFACE_PREFIX[selected.cabinet.surface]}_${veneer}`;
  }

  // Backdrop follows the cabinet size — Scene_<Light/Dark color>_<Small/Large>.
  const activeBackdrop = `Scene_${selected.scene.background}_${CABINET_SIZE_TOKEN[selected.cabinet.size]}`;

  const activeNames = new Set(
    [activeConsole, activeCabinetDoor, activeLegs, activeSpeaker, activeBackdrop].filter(Boolean),
  );

  return (name) => {
    if (!isManagedMeshName(name)) return true; // static scenery, e.g. Floor
    return activeNames.has(name);
  };
}
