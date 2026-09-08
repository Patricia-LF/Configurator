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
src/
├── App.jsx              # Main component
├── main.jsx             # Entry point
├── canvas/               # Everything rendered inside <Canvas> (scene, models, effects)
├── config/                # Configuration logic (which parameters can be changed)
├── ui/                    # 2D UI outside the canvas
├── hooks/                 # Custom React hooks
└── assets/                # 3D models (.glb/.gltf) and textures
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
├── canvas/                     # everything that lives inside <Canvas>
│   ├── Scene.jsx                # lights, camera, environment
│   ├── models/
│   │   ├── ProductModel.jsx     # main configurable 3D object
│   │   └── parts/                # only needed if the model is split into swappable meshes
│   │       ├── Body.jsx
│   │       └── Wheels.jsx
│   └── effects/                 # optional — skip until core features work
│       └── PostProcessing.jsx
│
├── config/                     # configuration logic
│   ├── configuratorSchema.js    # defines what CAN be configured (options, materials)
│   ├── configuratorState.js     # current SELECTED state — plain React Context or useState first
│   └── configuratorRules.js     # optional: dependencies/constraints between options
│
├── ui/                          # 2D UI outside the canvas
│   ├── OptionPanel.jsx
│   ├── ColorPicker.jsx
│   └── SummaryPanel.jsx
│
├── hooks/
│   └── useConfigurator.js       # hook exposing config state + setters to components
│
└── assets/
    └── textures/                 # keep .glb/.gltf in public/models/ instead — see note below

```

## Team

- Wilma (DD)
- Linn S. (DD)
- Simon Torstensson (CG)
- Arvid Wallesten (CG)
- Elin Ekeroth (CG)
- Nathalie Rosenkvist (WU)
- Patricia Loayza Frykberg (WU)
