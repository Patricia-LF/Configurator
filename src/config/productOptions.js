// Defines the available options for each configurable parameter

// Shared option list — reused for both cabinet and legs
export const woodVeneerOptions = [
  {
    label: "Walnut",
    value: "Walnut",
    background: "url('/textures/walnut.jpg')",
    price: 0,
  },
  {
    label: "Maple",
    value: "Maple",
    background: "url('/textures/maple.jpg')",
    price: 0,
  },
  {
    label: "Mahogany",
    value: "Mahogany",
    background: "url('/textures/mahogany.jpg')",
    price: 0,
  },
];

export const legMaterialBaseOptions = [
  {
    label: "Silver",
    value: "Silver",
    background: "url('/textures/silver.png')",
    price: 0,
  },
  {
    label: "Gold",
    value: "Gold",
    background: "url('/textures/gold.png')",
    price: 0,
  },
];

// Parts that always use one material regardless of the configurator
// selection — the export ships them material-less otherwise.
export const FIXED_MATERIAL_BY_MESH = {
  Recordplayer_Cover: 'Recordplayer_Cover_Glass',
  Recordplayer_Turntable_Inner: 'Recordplayer_Turntable_Outer_Matte',
  Recordplayer_Turntable_Outer: 'Recordplayer_Turntable_Outer_Matte',
};

export const productOptions = {
  size: {
    length: {
      label: "Length",
      default: "200cm",
      options: [
        { label: "200cm", value: "200cm", price: 26000 },
        { label: "118cm", value: "118cm", price: 20000 },
      ],
    },
  },

  speaker: {
    included: {
      label: "Add",
      default: "Yes",
      options: [
        { label: "Yes", value: "Yes", price: 8000 },
        { label: "No", value: "No", price: 0 },
      ],
    },

    grille: {
      label: "Speaker Grille",
      default: "Dark",
      options: [
        { label: "Dark", value: "Dark", price: 0 },
        { label: "Light", value: "Light", price: 0 },
        { label: "No Fabric", value: "No Fabric", price: 0 },
      ],
    },
  },

  materials: {
    surface: {
      label: "Cabinet Surface",
      options: [
        { label: "Smooth", value: "Smooth", price: 0 },
        { label: "Textured", value: "Textured", price: 2000 },
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
        { label: "White", value: "White", background: "#FFFBF8", price: 0 },
        { label: "Black", value: "Black", background: "#211E1E", price: 0 },
        { label: "Blue", value: "Blue", background: "#243E94", price: 0 },
        { label: "Orange", value: "Orange", background: "#CC4C15", price: 0 },
        { label: "Green", value: "Green", background: "#52582A", price: 0 },
        { label: "Red", value: "Red", background: "#641717", price: 0 },
      ],
    },
  },
};
