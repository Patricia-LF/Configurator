# Configurator

A configurator for a media consol with a built in vinyl player.

## Installation

## Project structure

```
src/
├── App.jsx
├── main.jsx
│
├── canvas/                    # everything that lives inside <Canvas>
│   ├── Scene.jsx               # top-level scene: lights, camera, environment
│   ├── models/
│   │   ├── ProductModel.jsx    # the main configurable 3D object
│   │   └── parts/               # if the model is split into swappable parts
│   │       ├── Body.jsx
│   │       └── Wheels.jsx
│   └── effects/
│       └── PostProcessing.jsx
│
├── config/                    # ← THE CONFIGURATION LOGIC LIVES HERE
│   ├── configuratorSchema.js   # defines what CAN be configured (options, materials, prices)
│   ├── configuratorStore.js    # Zustand store: current SELECTED state
│   └── configuratorRules.js    # optional: dependencies/constraints between options
│
├── ui/                         # 2D UI outside the canvas
│   ├── OptionPanel.jsx
│   ├── ColorPicker.jsx
│   └── SummaryPanel.jsx
│
├── hooks/
│   └── useConfigurator.js      # convenience hook wrapping the store
│
└── assets/
    ├── models/                 # .glb/.gltf files
    └── textures/
```

## Team

- Wilma (DD)
- Linn S. (DD)
- Simon Torstensson (CG)
- Arvid Wallesten (CG)
- Elin Ekeroth (CG)
- Nathalie Rosenkvist (WU)
- Patricia Loayza Frykberg (WU)
