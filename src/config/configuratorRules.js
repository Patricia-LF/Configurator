import { legMaterialBaseOptions, woodVeneerOptions } from "./productOptions";

// Maps ConfiguratorContext's `selected` state onto the product model's mesh
// names, which carry no material of their own — so this computes both a
// visibility set and a mesh->material map.

// Leg material options depend on which wood veneer was chosen for the cabinet
export function getLegMaterialOptions(selectedCabinetWood) {
  if (!selectedCabinetWood) return legMaterialBaseOptions;

  const matchingWoodOption = woodVeneerOptions.find(
    (option) => option.value === selectedCabinetWood,
  );

  if (!matchingWoodOption) return legMaterialBaseOptions;

  return [...legMaterialBaseOptions, matchingWoodOption];
  return [
    ...legMaterialBaseOptions,
    { label: selectedCabinetWood, value: selectedCabinetWood },
  ];
}

// The small (118cm) cabinet has no room for a built-in speaker.
export function isSpeakerAllowed(selected) {
  return selected.cabinet.size !== "118cm";
}

const CABINET_SIZE_TOKEN = {
  "118cm": "Small",
  "200cm": "Large",
};

const LEG_MATERIAL_NAME = {
  Silver: "Legs_Silver",
  Gold: "Legs_Gold",
};

const SPEAKER_GRILLE_MATERIAL = {
  Light: "Speaker_Light",
  Dark: "Speaker_Dark",
};

/**
 * @param {object} selected - ConfiguratorContext's `selected` state
 * @returns {{ visibleMeshNames: Set<string>, materialByMesh: Record<string, string> }}
 */
export function getTestModelState(selected) {
  const size = CABINET_SIZE_TOKEN[selected.cabinet.size];
  const veneer = selected.cabinet.woodVeneer;
  const cabinetMesh = selected.cabinet.surface === "Smooth" ? "Cabinet_Smooth" : "Cabinet_Textured";

  // The backdrop mesh is size-invariant in this export (just Scene_White /
  // Scene_Orange, no _Small/_Large suffix) unlike Console_/Legs_.
  const visibleMeshNames = new Set([`Console_${size}`, `Legs_${size}`, `Scene_${selected.scene.background}`, cabinetMesh]);

  const materialByMesh = {
    [`Console_${size}`]: veneer,
    [cabinetMesh]: veneer,
    // legs.material may also be the cabinet's own veneer name — already a valid material, pass through.
    [`Legs_${size}`]: LEG_MATERIAL_NAME[selected.legs.material] ?? selected.legs.material,
  };

  // No speaker cutout on the small cabinet — leave Speaker/NS_* out entirely.
  if (isSpeakerAllowed(selected)) {
    if (selected.speaker.included === "Speakers") {
      visibleMeshNames.add("Speaker");
      materialByMesh.Speaker = SPEAKER_GRILLE_MATERIAL[selected.speaker.grille];
    } else {
      const nsMesh = selected.cabinet.surface === "Smooth" ? "NS_Smooth" : "NS_Textured";
      visibleMeshNames.add(nsMesh);
      materialByMesh[nsMesh] = veneer;
    }
  }

  return { visibleMeshNames, materialByMesh };
}

// Speaker options are unavailable when the smaller cabinet size is selected
export function isSpeakerAvailable(cabinetSize) {
  return cabinetSize !== "118cm"; // adjust to whichever value represents the smaller size
}

export const speakerUnavailableMessage =
  "Speaker choices are not available with the smaller version.";

// Speaker grille are invisible when no speaker is selected
export function isGrilleVisible(speakerIncluded) {
  return speakerIncluded === "Yes";
}
