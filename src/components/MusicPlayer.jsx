import { useState } from "react";
import ReactPlayer from "react-player";
import styles from "./MusicPlayer.module.css";
import recordIcon from "../assets/icons/Record.png";
import pauseBtn from "../assets/icons/pause-btn.png";
import nextBtn from "../assets/icons/next-btn.png";
import playBtn from "../assets/icons/play-btn.png";

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

export default function MusicPlayer() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Function to switch to the next song
  const nextSong = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % album.length);
  };

  return (
    <section className={styles["music-container"]}>
      <img src={recordIcon} className={styles.record} />
      {/* Actual sound engine that's hidden */}
      <ReactPlayer
        url={album[currentSongIndex].url}
        playing={isPlaying}
        onEnded={nextSong} // Changes song automatically when finished
        width="0"
        height="0"
      />

      <div className={styles.player}>
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
