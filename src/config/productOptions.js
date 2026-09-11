// Defines the available options for each configurable parameter

// Shared option list — reused for both cabinet and legs
const woodVeneerOptions = [
  { label: "Walnut", value: "Walnut" },
  { label: "Maple", value: "Maple" },
  { label: "Mahogany", value: "Mahogany" },
];

export const legMaterialBaseOptions = [
  { label: "Silver", value: "Silver" },
  { label: "Gold", value: "Gold" },
];

export const productOptions = {
  cabinet: {
    size: {
      label: "Cabinet Size",
      options: [
        { label: "118cm", value: "118cm" },
        { label: "200cm", value: "200cm" },
      ],
    },
    surface: {
      label: "Cabinet Surface",
      options: [
        { label: "Smooth", value: "Smooth" },
        { label: "Textured", value: "Textured" },
      ],
    },
    woodVeneer: {
      label: "Wood Veneer",
      options: woodVeneerOptions,
    },
  },

  speaker: {
    included: {
      label: "Speakers",
      options: [
        { label: "Speakers", value: "Speakers" },
        { label: "Cabinet Doors", value: "Cabinet Doors" },
      ],
    },
    grille: {
      label: "Speaker Grille",
      options: [
        { label: "Light", value: "Light" },
        { label: "Dark", value: "Dark" },
      ],
    },
  },

  legs: {
    material: {
      label: "Leg Material",
      options: [], // actual options are computed dynamically via getLegMaterialOptions()
    },
  },

  turntable: {
    baseColor: {
      label: "Base Color",
      options: [
        { label: "White", value: "White" },
        { label: "Black", value: "Black" },
        { label: "Blue", value: "Blue" },
        { label: "Orange", value: "Orange" },
        { label: "Green", value: "Green" },
        { label: "Red", value: "Red" },
      ],
    },
  },
};
