import { legMaterialBaseOptions } from "./productOptions";

// Leg material options depend on which wood veneer was chosen for the cabinet
export function getLegMaterialOptions(selectedCabinetWood) {
  if (!selectedCabinetWood) return legMaterialBaseOptions;

  return [
    ...legMaterialBaseOptions,
    { label: selectedCabinetWood, value: selectedCabinetWood },
  ];
}

// Speaker options are unavailable when the smaller cabinet size is selected
export function isSpeakerAvailable(cabinetSize) {
  return cabinetSize !== "118cm"; // adjust to whichever value represents the smaller size
}

export const speakerUnavailableMessage =
  "Speaker choices are not available with the smaller version.";
