import { useEffect, useRef } from "react";
import styles from "./ZoomButton.module.css";
import { useZoom } from "../../hooks/useZoom";
import zoomBtn from "../../assets/icons/zoom-btn.svg";
import zoomOutBtn from "../../assets/icons/zoomOut-btn.svg";

export default function ZoomButton({ target }) {
  const { zoomTarget, triggerZoom, anchorPositionsRef } = useZoom();

  const buttonRef = useRef(null);

  const isActive = zoomTarget === target;
  const zoomIcon = isActive ? zoomOutBtn : zoomBtn;

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
