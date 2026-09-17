// useConfigurator.js
// Convenience hook for reading/updating the configurator's selected state
// from ConfiguratorContext.
import { useContext } from "react";
import { ConfiguratorContext } from "../config/ConfiguratorContext";

export function useConfigurator() {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error(
      "useConfigurator must be used within a ConfiguratorProvider",
    );
  }
  return context;
}
