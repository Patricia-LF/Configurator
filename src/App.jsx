import Scene from "./canvas/Scene";
import ToggleSwitch from "./components/theme/ToggleSwitch";
import { useTheme } from "./hooks/useTheme";
import ConfiguratorPanel from "./components/configurator/ConfiguratorPanel";
import { useConfigurator } from "./hooks/useConfigurator";
import AlbumSelector from "./components/musicPlayer/AlbumSelector";
import TotalPrice from "./components/price/TotalPrice";

function App() {
  const { selected, setOption } = useConfigurator();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="App" data-theme={isDarkMode ? "dark" : "light"}>
      <Scene />
      <ToggleSwitch
        value={isDarkMode ? "Dark" : "Light"}
        onChange={(newValue) => toggleTheme()}
      />
      <AlbumSelector />
      <ConfiguratorPanel />
      <TotalPrice />
    </div>
  );
}

export default App;
