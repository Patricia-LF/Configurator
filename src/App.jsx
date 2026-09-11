import { useState } from "react";
import VinylCoverflow from "./components/musicPlayer/VinylCoverflow";
import Scene from "./canvas/Scene";
import { useConfigurator } from "./hooks/useConfigurator";
import MusicPlayer from "./components/musicPlayer/MusicPlayer";
import ConfiguratorPanel from "./components/configurator/ConfiguratorPanel";

function App() {
  const { selected, setOption } = useConfigurator();

  return (
    <div className="App">
      <Scene />
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
