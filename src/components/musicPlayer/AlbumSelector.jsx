import { useState } from "react";
import VinylCoverflow from "./VinylCoverflow";
import MusicPlayer from "./MusicPlayer";

const disks = [
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
];

export default function AlbumSelector() {
  const [selectedDisk, setSelectedDisk] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [showCoverflow, setShowCoverflow] = useState(true);
  const [playerStart, setPlayerStart] = useState(false);

  const handleSelect = (disk) => {
    setSelectedDisk(disk);
    setExiting(true); // case starts sliding down immediately

    // record starts rising a beat later so the two paths visually
    // "cross" instead of just happening in parallel
    setTimeout(() => setPlayerStart(true), 80);
  };

  const handleCoverflowExited = () => {
    setShowCoverflow(false); // unmount only once its own transition is done
  };

  return (
    <>
      {showCoverflow && (
        <VinylCoverflow
          disks={disks}
          onSelect={handleSelect}
          exiting={exiting}
          onExited={handleCoverflowExited}
        />
      )}
      <MusicPlayer start={playerStart} disk={selectedDisk} />
    </>
  );
}
