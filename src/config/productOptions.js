// Defines the available options for each configurable parameter

// Shared option list — reused for both cabinet and legs
const woodVeneerOptions = ["Walnut", "Maple", "Mahogany"];

export const productOptions = {
  cabinet: {
    size: {
      label: "Cabinet Size",
      options: ["180cm", "240cm"],
    },
    surface: {
      label: "Cabinet Surface",
      options: ["Smooth", "Textured"],
    },
    woodVeneer: {
      label: "Wood Veneer",
      options: woodVeneerOptions,
    },
  },

  speaker: {
    included: {
      label: "Built-in Speaker",
      options: ["No", "Yes"],
    },
    grille: {
      label: "Speaker Grille",
      options: ["Light", "Dark"],
    },
  },

  legs: {
    material: {
      label: "Leg Material",
      options: ["Silver", "Gold", ...woodVeneerOptions],
    },
  },

  turntable: {
    baseColor: {
      label: "Base Color",
      options: ["White", "Black", "Blue", "Orange", "Green", "Red"],
    },
  },
};
