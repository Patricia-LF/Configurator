import Scene from "./canvas/Scene";
import ToggleSwitch from "./components/theme/ToggleSwitch";
import { useTheme } from "./hooks/useTheme";
import ConfiguratorPanel from "./components/configurator/ConfiguratorPanel";
import AlbumSelector from "./components/musicPlayer/AlbumSelector";
import TotalPrice from "./components/price/TotalPrice";
import ZoomButton from "./components/zoom/ZoomButton";
import { isSpeakerAvailable } from "./config/configuratorRules";
import { useConfigurator } from "./hooks/useConfigurator";

function App() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { selected } = useConfigurator();

  return (
    <div className="App" data-theme={isDarkMode ? "dark" : "light"}>
      <Scene />
      <ToggleSwitch
        value={isDarkMode ? "Dark" : "Light"}
        onChange={toggleTheme}
      />
      <AlbumSelector />
      <ConfiguratorPanel />
      <ZoomButton target="legs" />
      <ZoomButton target="speaker" />
      <ZoomButton target="texture" />

      <div className="bottom-bar">
        <TotalPrice />
        <button className="checkout-btn">Checkout</button>
      </div>
    </div>
  );
}

export default App;
