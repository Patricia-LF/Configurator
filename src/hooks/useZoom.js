// useZoom.js
// Convenience hook for reading/triggering zoom state from ZoomContext.
import { useContext } from "react";
import { ZoomContext } from "../config/ZoomContext";

export function useZoom() {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }
  return context;
}
