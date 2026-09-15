import styles from "./ZoomButton.module.css";
import { useZoom } from "../../hooks/useZoom";
import { useTheme } from "../../hooks/useTheme";
import zoomBtnLight from "../../assets/icons/zoom-btn-light.png";
import zoomBtnDark from "../../assets/icons/zoom-btn.png";

export default function ZoomButton({ target, style }) {
  const { zoomTarget, triggerZoom } = useZoom();
  const { isDarkMode } = useTheme();

  const isActive = zoomTarget === target;

  return (
    <button
      className={`${styles.zoomBtn} ${isActive ? styles.active : ""}`}
      style={style}
      onClick={() => triggerZoom(target)}
      aria-label={`Zoom to ${target}`}
    >
      <img src={isDarkMode ? zoomBtnDark : zoomBtnLight} alt="" />
    </button>
  );
}
