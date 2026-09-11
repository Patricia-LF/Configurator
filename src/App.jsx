import AlbumSelector from "./components/musicPlayer/AlbumSelector";
import Scene from "./canvas/Scene";
import ConfiguratorPanel from "./components/configurator/ConfiguratorPanel";

function App() {
  return (
    <div className="App">
      <Scene />
      <AlbumSelector />
      <ConfiguratorPanel />
    </div>
  );
}

export default App;
