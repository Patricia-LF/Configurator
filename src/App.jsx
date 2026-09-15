import Scene from "./canvas/Scene";
import ToggleSwitch from "./components/theme/ToggleSwitch";
import { useTheme } from "./hooks/useTheme";
import ConfiguratorPanel from "./components/configurator/ConfiguratorPanel";
import AlbumSelector from "./components/musicPlayer/AlbumSelector";
import TotalPrice from "./components/price/TotalPrice";
import ZoomButton from "./components/zoom/ZoomButton";

function App() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="App" data-theme={isDarkMode ? "dark" : "light"}>
      <Scene />
      <ToggleSwitch
        value={isDarkMode ? "Dark" : "Light"}
        onChange={toggleTheme}
      />
      <AlbumSelector />
      <ConfiguratorPanel />
      <ZoomButton
        target="legs"
        style={{ position: "absolute", bottom: "30%", left: "17%" }}
      />
      <ZoomButton
        target="speaker"
        style={{ position: "absolute", top: "43%", right: "37%" }}
      />
      <ZoomButton
        target="texture"
        style={{ position: "absolute", bottom: "35%", left: "37%" }}
      />

      <div className="bottom-bar">
        <TotalPrice />
        <button className="checkout-btn">Checkout</button>
      </div>
    </div>
  );
}

export default App;
