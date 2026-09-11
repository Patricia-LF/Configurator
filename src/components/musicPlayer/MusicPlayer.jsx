import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import styles from "./MusicPlayer.module.css";
import recordIcon from "../../assets/icons/vinyl.png";
import pauseBtn from "../../assets/icons/pause-btn.png";
import nextBtn from "../../assets/icons/next-btn.png";
import playBtn from "../../assets/icons/play-btn.png";

// Example of an album with tracks
const album = [
  {
    artist: "Daryl Hall & John Oats",
    title: "Rich Girl",
    url: "https://soundhelix.com",
  },
  {
    artist: "Dire Straits",
    title: "Sultans Of Swing",
    url: "https://soundhelix.com",
  },
];

// stage moves forward once: hidden -> risen (sliding up) -> done (buttons shown)
export default function MusicPlayer({ start = false, disk = null }) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stage, setStage] = useState("hidden");

  useEffect(() => {
    if (!start) return;
    const frame = requestAnimationFrame(() => setStage("risen"));
    return () => cancelAnimationFrame(frame);
  }, [start]);

  const handleRecordTransitionEnd = (event) => {
    if (stage === "risen" && event.propertyName === "transform") {
      setStage("done");
    }
  };

  // Function to switch to the next song
  const nextSong = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % album.length);
  };

  const recordClassName = [styles.record, stage !== "hidden" && styles["record--risen"]]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles["music-container"]}>
      <div className={recordClassName} onTransitionEnd={handleRecordTransitionEnd}>
        <img src={recordIcon} className={styles["record-disk"]} alt="" />
        {disk?.image && (
          <img src={disk.image} className={styles["record-label"]} alt="" />
        )}
      </div>
      {/* Actual sound engine that's hidden */}
      <ReactPlayer
        url={album[currentSongIndex].url}
        playing={isPlaying}
        onEnded={nextSong} // Changes song automatically when finished
        width="0"
        height="0"
      />

      <div
        className={`${styles.player} ${stage === "done" ? styles["player--visible"] : ""}`}
      >
        <div className={styles.buttons}>
          {/* Buttons */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={styles.playing}
          >
            <img
              src={isPlaying ? pauseBtn : playBtn}
              alt={isPlaying ? "Pause" : "Play"}
              className={isPlaying ? styles["pause-btn"] : styles["play-btn"]}
            />
          </button>
          <button onClick={nextSong} className={styles["next-btn"]}>
            <img src={nextBtn} alt="Next" className={styles.next}></img>
          </button>
        </div>

        {/* Title - artist and song name */}
        <h3 className={styles["song-info"]}>
          {album[currentSongIndex].artist} - {album[currentSongIndex].title}
        </h3>
      </div>
    </section>
  );
}
