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
│   └── models/
│       └── mediaconsole.glb        # entire model, named groups inside (Body, Legs, Speaker, VinylPlayer)
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   ├── index.css
│   │
│   ├── assets/
│   │   └── icons/                  # small bundled assets (menu, player, and UI icons)
│   │
│   ├── canvas/                     # everything that lives inside <Canvas>
│   │   ├── Scene.jsx               # lights, camera, environment
│   │   └── ProductModel.jsx        # reads nodes.Body, nodes.Legs, nodes.Speaker, etc. from the glb file
│   │
│   ├── components/
│   │   ├── configurator/
│   │   │   ├── DropdownButton.jsx
│   │   │   ├── DropdownButton.module.css
│   │   │   ├── ColorButton.jsx
│   │   │   └── SwitchButton.jsx
│   │   └── music-player/
│   │       ├── MusicPlayer.jsx
│   │       └── MusicPlayer.module.css
│   │
│   ├── config/                     # configuration logic
│   │   ├── productOptions.js       # defines what CAN be configured (options, materials)
│   │   ├── ConfiguratorContext.jsx # Context + Provider holding the currently SELECTED state
│   │   └── configuratorRules.js    # optional: dependencies/constraints between options
│   │
│   └── hooks/
│       └── useConfigurator.js      # convenience hook wrapping the Context
│
├── index.html
├── vite.config.js
└── package.json

```

### Troubleshooting

- **Port already in use** — Vite automatically picks the next available port if `5173` is taken; check the terminal output for the correct URL.
- **`npm install` fails** — make sure you're running a recent enough Node.js version (`node -v`).

## Team

- Wilma (DD)
- Linn S. (DD)
- Simon Torstensson (CG)
- Arvid Wallesten (CG)
- Elin Ekeroth (CG)
- Nathalie Rosenkvist (WU)
- Patricia Loayza Frykberg (WU)
