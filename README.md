# Configurator

An interactive 3D web configurator for a media console with a built-in vinyl player. Built with React and three.js, it lets you customize the console in real time — size, materials, wood finish, speaker setup, and turntable details — while watching the changes render live on the 3D model. Zoom into specific parts for a closer look, switch between light and dark themes, and see the total price update as you configure.

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
│   ├── album-images/                # album cover images used by VinylCoverflow
│   ├── models/                      # .glb 3D model files and HDRI environment maps
│   │   ├── 3DTOWEBB_BACKGROUND_FIX.glb
│   │   ├── 3DTOWEBB_CAMERA.glb      # baked-in cinematic turntable camera + clip
│   │   ├── hochsal.hdr
│   │   └── studio.hdr
│   └── textures/                    # material/wood swatch images used as button backgrounds
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css                    # global styles, CSS theme variables (--text, --bg, --border, --card-bg, --clash-font)
│   │
│   ├── assets/
│   │   └── icons/                   # small bundled assets (menu, player, toggle, zoom icons)
│   │
│   ├── canvas/
│   │   ├── Scene.jsx                # raw three.js scene setup (camera, renderer, lights, OrbitControls, zoom & turntable cinematic camera)
│   │   ├── ProductModel.jsx         # loads the .glb(s), mesh visibility/material logic, zoom anchor helpers
│   │   └── materialLibrary.js       # collects reusable materials from swatch nodes in the model
│   │
│   ├── components/
│   │   ├── configurator/
│   │   │   ├── ConfiguratorPanel.jsx        # step-by-step card flow, reads productOptions + selected state
│   │   │   ├── ConfiguratorPanel.module.css
│   │   │   ├── OptionCard.jsx               # wraps each configurable part in its own card
│   │   │   ├── OptionCard.module.css
│   │   │   ├── OptionButton.jsx             # renders plain text pills or material/color swatches
│   │   │   └── OptionButton.module.css
│   │   │
│   │   ├── musicPlayer/
│   │   │   ├── AlbumSelector.jsx            # album selection logic
│   │   │   ├── MusicPlayer.jsx              # floating play/pause/next player, position: fixed
│   │   │   ├── MusicPlayer.module.css
│   │   │   ├── VinylCoverflow.jsx           # scrollable album disk selector, position: fixed
│   │   │   └── VinylCoverflow.module.css
│   │   │
│   │   ├── price/
│   │   │   ├── TotalPrice.jsx               # displays the running total based on selected options
│   │   │   └── TotalPrice.module.css
│   │   │
│   │   ├── theme/
│   │   │   ├── ToggleSwitch.jsx             # dark/light mode slider toggle, position: fixed
│   │   │   └── ToggleSwitch.module.css
│   │   │
│   │   └── zoom/
│   │       ├── ZoomButton.jsx               # zoom-to-part buttons that track their target on screen
│   │       └── ZoomButton.module.css
│   │
│   ├── config/
│   │   ├── productOptions.js         # defines available parameters/options per part (with backgrounds/prices)
│   │   ├── ConfiguratorContext.jsx   # Context + Provider holding the currently SELECTED configurator state
│   │   ├── configuratorRules.js      # cross-part logic (leg material follows wood veneer, speaker availability by size, mesh/material mapping)
│   │   ├── calculateTotalPrice.js    # sums selected options' prices into a total
│   │   ├── ThemeContext.jsx          # Context + Provider holding isDarkMode + toggleTheme
│   │   └── ZoomContext.jsx           # Context + Provider holding the active zoom target + hotspot screen positions
│   │
│   └── hooks/
│       ├── useConfigurator.js        # convenience hook wrapping ConfiguratorContext
│       ├── useTheme.js               # convenience hook wrapping ThemeContext
│       └── useZoom.js                # convenience hook wrapping ZoomContext
│
├── index.html
├── eslint.config.js
├── vite.config.js
├── package.json
├── package-lock.json
├── favicon-32x32.png
├── LICENSE
└── .gitignore
```

### Troubleshooting

- **Port already in use** — Vite automatically picks the next available port if `5173` is taken; check the terminal output for the correct URL.
- **`npm install` fails** — make sure you're running a recent enough Node.js version (`node -v`).

## Team

- Wilma Skarström (DD)
- Linn S. Mölgaard (DD)
- Simon Torstensson (CG)
- Arvid Wallesten (CG)
- Elin Ekeroth (CG)
- Nathalie Rosenkvist (WU)
- Patricia Loayza Frykberg (WU)
