import { useEffect, useRef } from "react";
import styles from "./ZoomButton.module.css";
import { useZoom } from "../../hooks/useZoom";
import { useTheme } from "../../hooks/useTheme";
import zoomBtnLight from "../../assets/icons/zoom-btn-light.png";
import zoomBtnDark from "../../assets/icons/zoom-btn.png";
import zoomOutBtnLight from "../../assets/icons/zoomOut-btn-light.png";
import zoomOutBtnDark from "../../assets/icons/zoomOut-btn.png";

export default function ZoomButton({ target }) {
  const { zoomTarget, triggerZoom, anchorPositionsRef } = useZoom();
  const { isDarkMode } = useTheme();

  const buttonRef = useRef(null);

  const isActive = zoomTarget === target;

  useEffect(() => {
    let frameId;

    function updatePosition() {
      const anchor = anchorPositionsRef.current[target];

      if (buttonRef.current && anchor) {
        buttonRef.current.style.display = anchor.visible ? "block" : "none";

        if (anchor.visible) {
          buttonRef.current.style.transform = `
            translate(${anchor.x}px, ${anchor.y}px)
            translate(-50%, -50%)
          `;
        }
      }

      frameId = requestAnimationFrame(updatePosition);
    }

    updatePosition();

    return () => cancelAnimationFrame(frameId);
  }, [target, anchorPositionsRef]);

  const zoomIcon = isActive
    ? isDarkMode
      ? zoomOutBtnDark
      : zoomOutBtnLight
    : isDarkMode
      ? zoomBtnDark
      : zoomBtnLight;

  return (
    <button
      ref={buttonRef}
      className={`${styles.zoomBtn} ${isActive ? styles.active : ""}`}
      onClick={() => triggerZoom(target)}
      aria-label={isActive ? `Zoom out from ${target}` : `Zoom to ${target}`}
    >
      <img src={zoomIcon} alt="" />
    </button>
  );
}
