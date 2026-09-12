import { useState } from "react";
import Scene from "./canvas/Scene";
import ToggleSwitch from "./components/theme/ToggleSwitch";
import { useTheme } from "./hooks/useTheme";
import ConfiguratorPanel from "./components/configurator/ConfiguratorPanel";
import { useConfigurator } from "./hooks/useConfigurator";
import MusicPlayer from "./components/musicPlayer/MusicPlayer";
import VinylCoverflow from "./components/musicPlayer/VinylCoverflow";

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
      <VinylCoverflow
        disks={[
          {
            id: "sultans-of-swing",
            image: "/album-images/sultans-of-swing.jpg",
            title: "Disk 1",
          },
          {
            id: "hey-jude",
            image: "/album-images/hey-jude.jpg",
            title: "Disk 2",
          },
          {
            id: "big-in-japan",
            image: "/album-images/big-in-japan.jpg",
            title: "Disk 3",
          },
          {
            id: "little-lies",
            image: "/album-images/little-lies.jpg",
            title: "Disk 4",
          },
          {
            id: "another-brick-in-the-wall",
            image: "/album-images/another-brick-in-the-wall.jpg",
            title: "Disk 5",
          },
        ]}
      />
      <MusicPlayer />
      <ConfiguratorPanel />
    </div>
  );
}

export default App;
