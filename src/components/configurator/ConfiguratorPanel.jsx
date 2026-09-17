import { useState, useEffect, useRef } from "react";
import OptionCard from "./OptionCard";
import OptionButton from "./OptionButton";
import { useConfigurator } from "../../hooks/useConfigurator";
import { productOptions } from "../../config/productOptions";
import {
  getLegMaterialOptions,
  isSpeakerAvailable,
  speakerUnavailableMessage,
  isGrilleVisible,
} from "../../config/configuratorRules";
import styles from "./ConfiguratorPanel.module.css";

function ConfiguratorPanel() {
  const { selected, setOption, setActivePart } = useConfigurator();

  const speakerAvailable = isSpeakerAvailable(selected.size.length);
  // Speaker card doesn't exist at all on the small size — the message
  // explaining why lives on the Size card instead.
  const partKeys = Object.keys(productOptions).filter(
    (key) => key !== "speaker" || speakerAvailable,
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [touchedParams, setTouchedParams] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  const scrollContainerRef = useRef(null);

  function handleOptionChange(partKey, paramKey, value) {
    setOption(partKey, paramKey, value);
    // Lets other parts of the app (e.g. Scene's cinematic camera) react to
    // the user actually picking an option on a given card — e.g. clicking a
    // turntable base color — rather than merely scrolling to it. Also fires
    // for cards other than the current step, e.g. re-editing an earlier
    // card once every step is visible — Scene's cinematic camera uses this
    // to notice the user has moved on from the turntable card.
    setActivePart(partKey);

    setTouchedParams((prev) => {
      const updated = new Set(prev[partKey] ?? []);
      updated.add(paramKey);
      return { ...prev, [partKey]: updated };
    });
  }

  // Advance to the next card once every parameter on the current card has been touched
  useEffect(() => {
    const currentPart = partKeys[currentStepIndex];
    const allParamKeys = Object.keys(productOptions[currentPart]);

    const requiredParamKeys = allParamKeys.filter((paramKey) => {
      const isGrilleParam = currentPart === "speaker" && paramKey === "grille";
      if (isGrilleParam && !isGrilleVisible(selected.speaker.included)) {
        return false;
      }
      return true;
    });

    const touchedCount = touchedParams[currentPart]?.size ?? 0;

    if (touchedCount >= requiredParamKeys.length) {
      if (currentStepIndex < partKeys.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    }
  }, [
    touchedParams,
    currentStepIndex,
    selected.size.length,
    selected.speaker.included,
  ]);

  // Auto-scroll to the bottom so the newest card is visible, pushing older ones out of view above
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [currentStepIndex]);

  // When switching to free-scroll mode, land at the bottom instead of jumping to the top
  useEffect(() => {
    if (isComplete && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [isComplete]);

  const visiblePartKeys = partKeys.slice(0, currentStepIndex + 1);

  return (
    <div ref={scrollContainerRef} className={styles.panelBase}>
      <div className={styles.spacer} />{" "}
      {/*Spacer is used to fill up the space above the first card to position it at the bottom, since justify-content: flex-end disables scrolling*/}
      {visiblePartKeys.map((partKey) => {
        return (
          <OptionCard key={partKey} title={partKey}>
            {Object.entries(productOptions[partKey]).map(
              ([paramKey, param]) => {
                const isGrilleParam =
                  partKey === "speaker" && paramKey === "grille";
                const isSpeakerGrille = isGrilleParam;

                const grilleVisible = isGrilleVisible(
                  selected.speaker.included,
                );

                if (isGrilleParam && !grilleVisible) {
                  return null;
                }

                const isLegMaterial =
                  partKey === "materials" && paramKey === "legs";
                const options = isLegMaterial
                  ? getLegMaterialOptions(selected.materials.woodVeneer)
                  : param.options;

                return (
                  <OptionButton
                    key={paramKey}
                    label={param.label}
                    options={options}
                    value={selected[partKey][paramKey]}
                    defaultValue={param.default}
                    touched={touchedParams[partKey]?.has(paramKey) ?? false}
                    onChange={(value) =>
                      handleOptionChange(partKey, paramKey, value)
                    }
                    compact={isSpeakerGrille}
                  />
                );
              },
            )}

            {partKey === "size" && !speakerAvailable && (
              <p className={styles.disabledMessage}>
                {speakerUnavailableMessage}
              </p>
            )}
          </OptionCard>
        );
      })}
    </div>
  );
}

export default ConfiguratorPanel;
