import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import styles from "./MusicPlayer.module.css";
import recordIcon from "../../assets/icons/vinyl_2.webp";
import { useTheme } from "../../hooks/useTheme";

// Icon names refer to the THEME they're shown in, not their own color —
// "Light" icons are dark-colored (shown against light backgrounds), and vice versa
import pauseBtn from "../../assets/icons/pause-btn.svg"; // light-colored icon, used in dark mode
import nextBtn from "../../assets/icons/next-btn.svg";
import playBtn from "../../assets/icons/play-btn.svg";
import pauseBtnLight from "../../assets/icons/pause-btn-light.svg"; // dark-colored icon, used in light mode
import nextBtnLight from "../../assets/icons/next-btn-light.svg";
import playBtnLight from "../../assets/icons/play-btn-light.svg";

// Example of an album with tracks - same albums as VinylCoverFlow in App.jsx
const album = [
  {
    id: "sultans-of-swing",
    artist: "Dire Straits",
    title: "Sultans Of Swing",
    url: "https://soundhelix.com",
  },
  {
    id: "hey-jude",
    artist: "The Beatles",
    title: "Hey Jude",
    url: "https://soundhelix.com",
  },
  {
    id: "big-in-japan",
    artist: "Alphaville",
    title: "Big In Japan",
    url: "https://soundhelix.com",
  },
  {
    id: "little-lies",
    artist: "Fleetwood Mac",
    title: "Little Lies",
    url: "https://soundhelix.com",
  },
  {
    id: "another-brick-in-the-wall",
    artist: "Pink Floyd",
    title: "Another Brick In The Wall",
    url: "https://soundhelix.com",
  },
];

// stage moves forward once: hidden -> risen (sliding up) -> done (buttons shown)
// and resets straight back to hidden when the player is dismissed
export default function MusicPlayer({ start = false, disk = null, onBack }) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isDarkMode } = useTheme();
  const [stage, setStage] = useState("hidden");

  useEffect(() => {
    if (!start) {
      setStage("hidden");
      return;
    }
    const frame = requestAnimationFrame(() => setStage("risen"));
    return () => cancelAnimationFrame(frame);
  }, [start]);

  // Keep the displayed song in sync with whichever vinyl was picked
  useEffect(() => {
    if (!disk) return;
    const index = album.findIndex((song) => song.id === disk.id);
    if (index !== -1) setCurrentSongIndex(index);
  }, [disk]);

  const handleRecordTransitionEnd = (event) => {
    if (stage === "risen" && event.propertyName === "transform") {
      setStage("done");
    }
  };

  // Function to switch to the next song
  const nextSong = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % album.length);
  };

  const recordClassName = [
    styles.record,
    stage !== "hidden" && styles["record--risen"],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles["music-container"]}>
      <div
        className={recordClassName}
        onTransitionEnd={handleRecordTransitionEnd}
      >
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
              src={
                isPlaying
                  ? isDarkMode
                    ? pauseBtn
                    : pauseBtnLight
                  : isDarkMode
                    ? playBtn
                    : playBtnLight
              }
              alt={isPlaying ? "Pause" : "Play"}
              className={isPlaying ? styles["pause-btn"] : styles["play-btn"]}
            />
          </button>
          <button onClick={onBack} className={styles["next-btn"]}>
            <img
              src={isDarkMode ? nextBtn : nextBtnLight}
              alt="Next"
              className={styles.next}
            ></img>
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
