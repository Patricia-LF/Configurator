import { useState } from "react";
import VinylCoverflow from "./components/VinylCoverflow";
import Scene from "./canvas/Scene";
import { useConfigurator } from "./hooks/useConfigurator";

function App() {
  const { selected, setOption } = useConfigurator();

  console.log(selected);

  return (
    <div className="App">
      <div className="App">
        {/* temporary test button — remove once real UI is wired up */}
        <button onClick={() => setOption("legs", "material", "Gold")}>
          Test: set legs material to Gold
        </button>
      </div>
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
      <Scene />
    </div>
  );
}

export default App;
