// ZoomContext.jsx
// Holds which part (if any) is currently zoomed into, and the live on-screen
// position of each zoom target's hotspot — shared by ZoomButton and Scene.
import { createContext, useRef, useState } from "react";

export const ZoomContext = createContext(null);

export function ZoomProvider({ children }) {
  const [zoomTarget, setZoomTarget] = useState(null); // "legs" | "speaker" | "texture" | null
  const anchorPositionsRef = useRef({
    legs: null,
    speaker: null,
    texture: null,
  });

  function triggerZoom(target) {
    // Clicking the same target again zooms back out to the default view
    setZoomTarget((prev) => (prev === target ? null : target));
  }

  const value = {
    zoomTarget,
    triggerZoom,
    anchorPositionsRef,
  };

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}
