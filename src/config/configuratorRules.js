import { legMaterialBaseOptions, woodVeneerOptions } from "./productOptions";

// Leg material options depend on which wood veneer was chosen for the cabinet
export function getLegMaterialOptions(selectedCabinetWood) {
  if (!selectedCabinetWood) return legMaterialBaseOptions;

  const matchingWoodOption = woodVeneerOptions.find(
    (option) => option.value === selectedCabinetWood,
  );

  if (!matchingWoodOption) return legMaterialBaseOptions;

  return [...legMaterialBaseOptions, matchingWoodOption];
}

// Speaker options are unavailable when the smaller cabinet size is selected
export function isSpeakerAvailable(cabinetSize) {
  return cabinetSize !== "118cm"; // adjust to whichever value represents the smaller size
}

export const speakerUnavailableMessage =
  "Speaker choices are not available with the smaller version.";
