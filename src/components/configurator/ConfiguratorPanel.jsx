import { useState, useEffect, useRef } from "react";
import OptionCard from "./OptionCard";
import OptionButton from "./OptionButton";
import { useConfigurator } from "../../hooks/useConfigurator";
import { productOptions } from "../../config/productOptions";
import {
  getLegMaterialOptions,
  isSpeakerAvailable,
  speakerUnavailableMessage,
} from "../../config/configuratorRules";
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

  // Advance to the next card once every required parameter on the current card has been touched
  useEffect(() => {
    const currentPart = partKeys[currentStepIndex];
    const paramKeys = Object.keys(productOptions[currentPart]);

    // Speaker params don't need to be touched if speaker isn't available at all
    const speakerUnavailable =
      currentPart === "speaker" && !isSpeakerAvailable(selected.cabinet.size);

    const requiredParamCount = speakerUnavailable ? 0 : paramKeys.length;
    const touchedCount = touchedParams[currentPart]?.size ?? 0;

    if (touchedCount >= requiredParamCount) {
      if (currentStepIndex < partKeys.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    }
  }, [touchedParams, currentStepIndex, selected.cabinet.size]);

  // Auto-scroll to the bottom so the newest card is visible, pushing older ones out of view above
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
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

                const isSpeakerParam = partKey === "speaker";
                const speakerAvailable = isSpeakerAvailable(
                  selected.cabinet.size,
                );

                return (
                  <OptionButton
                    key={paramKey}
                    label={param.label}
                    options={options}
                    value={selected[partKey][paramKey]}
                    onChange={(value) =>
                      handleOptionChange(partKey, paramKey, value)
                    }
                    disabled={isSpeakerParam && !speakerAvailable}
                    disabledMessage={
                      isSpeakerParam ? speakerUnavailableMessage : undefined
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
