// Defines the available options for each configurable parameter

// Shared option list — reused for both cabinet and legs
const woodVeneerOptions = [
  { label: "Walnut", value: "Walnut" },
  { label: "Maple", value: "Maple" },
  { label: "Mahogany", value: "Mahogany" },
];

export const productOptions = {
  cabinet: {
    size: {
      label: "Cabinet Size",
      options: ["118cm", "200cm"],
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
      label: "Built-in Speaker",
      options: [
        { label: "No", value: "No" },
        { label: "Yes", value: "Yes" },
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
      options: [
        { label: "Silver", value: "Silver" },
        { label: "Gold", value: "Gold" },
        ...woodVeneerOptions,
      ],
    },
  },

  turntable: {
    baseColor: {
      label: "Base Color",
      options: ["White", "Black", "Blue", "Orange", "Green", "Red"],
    },
  },
};
