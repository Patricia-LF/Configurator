// Hook that can read and change values

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
