# Configurator

A configurator for a media consol with a built in vinyl player.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes bundled with Node.js)
- Git

### Getting Started

1. **Clone the repo**

```bash
   git clone https://github.com/Patricia-LF/Configurator.git
   cd Configurator
```

2. **Install dependencies**

```bash
   npm install
```

3. **Start the dev server**

```bash
   npm run dev
```

Open the link shown in the terminal (usually `http://localhost:5173`) in your browser.

### Building for production

```bash
npm run build
```

The production build will be output to the `dist/` folder.

To preview the production build locally:

```bash
npm run preview
```

### Project Structure

```
project-root/
├── public/
│   └── models/                  # .glb/.gltf files — served as-is, no bundling
│       └── product.glb
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   │
│   ├── canvas/                   # everything that lives inside <Canvas>
│   │   ├── Scene.jsx              # lights, camera, environment
│   │   ├── models/
│   │   │   ├── ProductModel.jsx   # main configurable 3D object
│   │   │   └── parts/              # only needed if the model is split into swappable meshes
│   │   │       ├── Body.jsx
│   │   │       └── Wheels.jsx
│   │   └── effects/                # optional — skip until core features work
│   │       └── PostProcessing.jsx
│   │
│   ├── config/                    # configuration logic
│   │   ├── configuratorSchema.js   # defines what CAN be configured (options, materials)
│   │   ├── configuratorState.js    # current SELECTED state — Context/useState first
│   │   └── configuratorRules.js    # optional: dependencies/constraints between options
│   │
│   ├── ui/                         # 2D UI outside the canvas
│   │   ├── OptionPanel.jsx
│   │   ├── ColorPicker.jsx
│   │   └── SummaryPanel.jsx
│   │
│   ├── hooks/
│   │   └── useConfigurator.js      # hook exposing config state + setters to components
│   │
│   └── assets/                     # only small bundled assets (icons, fonts, small textures)
│
├── index.html
├── vite.config.js
└── package.json

```

### Troubleshooting

- **Port already in use** — Vite automatically picks the next available port if `5173` is taken; check the terminal output for the correct URL.
- **`npm install` fails** — make sure you're running a recent enough Node.js version (`node -v`).

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
