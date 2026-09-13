// Defines the available options for each configurable parameter

// Shared option list — reused for both cabinet and legs
export const woodVeneerOptions = [
  {
    label: "Walnut",
    value: "Walnut",
    background: "url('/textures/walnut.jpg')",
  },
  {
    label: "Maple",
    value: "Maple",
    background: "url('/textures/maple.jpg')",
  },
  {
    label: "Mahogany",
    value: "Mahogany",
    background: "url('/textures/mahogany.jpg')",
  },
];

export const legMaterialBaseOptions = [
  {
    label: "Silver",
    value: "Silver",
    background: "url('/textures/silver.png')",
  },
  { label: "Gold", value: "Gold", background: "url('/textures/gold.png')" },
];

export const productOptions = {
  size: {
    length: {
      label: "Length",
      default: "118cm",
      options: [
        { label: "118cm", value: "118cm" },
        { label: "200cm", value: "200cm" },
      ],
    },
  },

  speaker: {
    included: {
      label: "Add",
      default: "Yes",
      options: [
        { label: "No", value: "No" },
        { label: "Yes", value: "Yes" },
      ],
    },

    grille: {
      label: "Speaker Grille",
      default: "Dark",
      options: [
        { label: "Light", value: "Light" },
        { label: "Dark", value: "Dark" },
      ],
    },
  },

  materials: {
    surface: {
      label: "Cabinet Surface",
      options: [
        { label: "Smooth", value: "Smooth" },
        { label: "Textured", value: "Textured" },
      ],
    },
    woodVeneer: {
      label: "Wood Type",
      options: woodVeneerOptions,
    },

    legs: {
      label: "Legs",
      default: "Silver",
      options: [], // actual options are computed dynamically via getLegMaterialOptions()
    },
  },

  turntable: {
    baseColor: {
      label: "Base Color",
      options: [
        { label: "White", value: "White", background: "#FFFBF8" },
        { label: "Black", value: "Black", background: "#211E1E" },
        { label: "Blue", value: "Blue", background: "#243E94" },
        { label: "Orange", value: "Orange", background: "#CC4C15" },
        { label: "Green", value: "Green", background: "#52582A" },
        { label: "Red", value: "Red", background: "#641717" },
      ],
    },

    basePlatter: {
      label: "Base Platter",
      options: [
        { label: "Basic", value: "Basic" },
        { label: "Acrylic", value: "Acrylic" },
      ],
    },
  },
};
