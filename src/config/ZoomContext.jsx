import { createContext, useState } from "react";

export const ZoomContext = createContext(null);

export function ZoomProvider({ children }) {
  const [zoomTarget, setZoomTarget] = useState(null); // "legs" | "speaker" | "texture" | null

  function triggerZoom(target) {
    // Clicking the same target again zooms back out to the default view
    setZoomTarget((prev) => (prev === target ? null : target));
  }

  const value = { zoomTarget, triggerZoom };

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}
