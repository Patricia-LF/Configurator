// Sets a start value through productOptions.js, and keeps tab on the selected value

import { createContext, useState } from "react";
import { productOptions } from "./productOptions";

export const ConfiguratorContext = createContext(null);

// Builds initial selected state from each option's first available choice
function getInitialState() {
  const initial = {};

  for (const part in productOptions) {
    initial[part] = {};
    for (const param in productOptions[part]) {
      const config = productOptions[part][param];
      const defaultValue = config.default ?? config.options[0]?.value ?? null;
      initial[part][param] = defaultValue;
    }
  }

  return initial;
}

export function ConfiguratorProvider({ children }) {
  const [selected, setSelected] = useState(getInitialState);
  // Which ConfiguratorPanel step/part is currently active, e.g. "turntable" —
  // exposed so other parts of the app (like Scene's cinematic camera) can
  // react to the user reaching a given step.
  const [activePart, setActivePart] = useState(null);

  // Updates one parameter for one part, e.g. setOption("legs", "material", "Gold").
  // Speaker fields are left as-is on "118cm" — isSpeakerAllowed (configuratorRules.js)
  // handles hiding/disabling them, so the choice is preserved if size changes back.
  function setOption(part, param, value) {
    setSelected((prev) => ({
      ...prev,
      [part]: {
        ...prev[part],
        [param]: value,
      },
    }));
  }

  const value = { selected, setOption, activePart, setActivePart };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}
