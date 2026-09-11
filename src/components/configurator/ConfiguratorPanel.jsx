import { useState, useEffect, useRef } from "react";
import OptionCard from "./OptionCard";
import SwitchButton from "./SwitchButton";
import { useConfigurator } from "../../hooks/useConfigurator";
import { productOptions } from "../../config/productOptions";
import { getLegMaterialOptions } from "../../config/configuratorRules";
import styles from "./ConfiguratorPanel.module.css";

function ConfiguratorPanel() {
  const { selected, setOption } = useConfigurator();
  const partKeys = Object.keys(productOptions);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [touchedParams, setTouchedParams] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  const scrollContainerRef = useRef(null);

  function handleOptionChange(partKey, paramKey, value) {
    setOption(partKey, paramKey, value);

    setTouchedParams((prev) => {
      const updated = new Set(prev[partKey] ?? []);
      updated.add(paramKey);
      return { ...prev, [partKey]: updated };
    });
  }

  // Advance to the next card once every parameter on the current card has been touched
  useEffect(() => {
    const currentPart = partKeys[currentStepIndex];
    const totalParams = Object.keys(productOptions[currentPart]).length;
    const touchedCount = touchedParams[currentPart]?.size ?? 0;

    if (touchedCount === totalParams) {
      if (currentStepIndex < partKeys.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    }
  }, [touchedParams, currentStepIndex]);

  // Auto-scroll to the bottom so the newest card is visible, pushing older ones out of view above
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [currentStepIndex]);

  const visiblePartKeys = partKeys.slice(0, currentStepIndex + 1);

  return (
    <div
      ref={scrollContainerRef}
      className={isComplete ? styles.scrollList : styles.fixedHeightList}
    >
      {visiblePartKeys.map((partKey) => {
        return (
          <OptionCard key={partKey} title={partKey}>
            {Object.entries(productOptions[partKey]).map(
              ([paramKey, param]) => {
                const isLegMaterial =
                  partKey === "legs" && paramKey === "material";
                const options = isLegMaterial
                  ? getLegMaterialOptions(selected.cabinet.woodVeneer)
                  : param.options;

                return (
                  <SwitchButton
                    key={paramKey}
                    label={param.label}
                    options={options}
                    value={selected[partKey][paramKey]}
                    onChange={(value) =>
                      handleOptionChange(partKey, paramKey, value)
                    }
                  />
                );
              },
            )}
          </OptionCard>
        );
      })}
    </div>
  );
}

export default ConfiguratorPanel;
