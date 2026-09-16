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
│   ├── album-images/                # album cover images used by VinylCoverflow
│   ├── models/                      # .glb 3D model file(s) - named groups inside (Body, Legs, Speaker, VinylPlayer)
│   └── textures/                    # material/wood swatch images used as button backgrounds
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css                    # global styles, CSS theme variables (--text, --bg, --border, --card-bg, --clash-font)
│   │
│   ├── assets/
│   │   └── icons/                   # small bundled assets (menu, player, toggle icons)
│   │
│   ├── canvas/
│   │   ├── Scene.jsx                # raw three.js scene setup (camera, renderer, lights, OrbitControls)
│   │   └── ProductModel.jsx         # loads the .glb, exposes loadProductModel/getLightColors/getCameraViews
│   │
│   ├── components/
│   │   ├── configurator/
│   │   │   ├── ConfiguratorPanel.jsx        # step-by-step card flow, position: fixed, reads productOptions + selected state
│   │   │   ├── ConfiguratorPanel.module.css
│   │   │   ├── OptionCard.jsx               # wraps each configurable part in its own card
│   │   │   ├── OptionCard.module.css
│   │   │   ├── OptionButton.jsx             # renders either plain text pills or material/color swatches
│   │   │   └── OptionButton.module.css
│   │   │
│   │   ├── musicPlayer/
│   │   │   ├── MusicPlayer.jsx              # floating play/pause/switch player, position: fixed
│   │   │   ├── MusicPlayer.module.css
│   │   │   ├── VinylCoverflow.jsx           # scrollable album disk selector, position: fixed
│   │   │   └── VinylCoverflow.module.css
│   │   │
│   │   └── theme/
│   │       ├── ToggleSwitch.jsx             # dark/light mode slider toggle, position: fixed
│   │       └── ToggleSwitch.module.css
│   │
│   ├── config/
│   │   ├── productOptions.js         # defines available parameters/options per part (with backgrounds for swatches)
│   │   ├── ConfiguratorContext.jsx   # Context + Provider holding the currently SELECTED configurator state
│   │   ├── configuratorRules.js      # cross-part logic (leg material follows cabinet wood, speaker availability by size)
│   │   └── ThemeContext.jsx          # Context + Provider holding isDarkMode + toggleTheme
│   │
│   └── hooks/
│       ├── useConfigurator.js        # convenience hook wrapping ConfiguratorContext
│       └── useTheme.js               # convenience hook wrapping ThemeContext
│
├── index.html
├── eslint.config.js
├── vite.config.js
├── package.json
├── package-lock.json
├── LICENSE
└── .gitignore

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
