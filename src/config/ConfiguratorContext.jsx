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
      const firstOption = productOptions[part][param].options[0];
      initial[part][param] = firstOption?.value ?? null;
    }
  }

  return initial;
}

export function ConfiguratorProvider({ children }) {
  const [selected, setSelected] = useState(getInitialState);

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

  const value = { selected, setOption };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}
