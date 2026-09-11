import { legMaterialBaseOptions } from "./productOptions";

// Leg material options depend on which wood veneer was chosen for the cabinet
export function getLegMaterialOptions(selectedCabinetWood) {
  if (!selectedCabinetWood) return legMaterialBaseOptions;

  return [
    ...legMaterialBaseOptions,
    { label: selectedCabinetWood, value: selectedCabinetWood },
  ];
}
