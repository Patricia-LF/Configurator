// ToggleSwitch.jsx
import styles from "./ToggleSwitch.module.css";
import toggleIconDark from "../../assets/icons/toggle-icon-dark.png";
import toggleIconLight from "../../assets/icons/toggle-icon-light.png";

export default function ToggleSwitch({
  label,
  value,
  onChange,
  lightValue = "Light",
  darkValue = "Dark",
}) {
  const isDark = value === darkValue;

  return (
    <div className={styles.container}>
      <p className={styles.themeText}>Dark/Light</p>
      {label && <div className={styles.label}>{label}</div>}
      <button
        className={`${styles.track} ${isDark ? styles.dark : styles.light}`}
        onClick={() => onChange(isDark ? lightValue : darkValue)}
        aria-pressed={isDark}
      >
        <img
          src={isDark ? toggleIconDark : toggleIconLight}
          alt={isDark ? "Dark" : "Light"}
          className={`${styles.slider} ${isDark ? styles.sliderDark : styles.sliderLight}`}
        />
      </button>
    </div>
  );
}
