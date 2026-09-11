import { useConfigurator } from "../hooks/useConfigurator";
import { productOptions } from "../config/productOptions";
import { isSpeakerAllowed } from "../config/configuratorRules";
import SwitchButton from "./SwitchButton";
import styles from "./ConfiguratorPanel.module.css";

// One switch button per productOptions field, excluding swatch-style fields
// (e.g. turntable.baseColor) which are meant for ColorButton instead.
const controls = Object.entries(productOptions).flatMap(([part, params]) =>
  Object.entries(params)
    .filter(([, field]) => field.variant !== "swatch")
    .map(([param, field]) => ({
      part,
      param,
      label: field.label,
      options: field.options,
    }))
);

// Container of SwitchButtons, one per configurable field in productOptions.js,
// backed by ConfiguratorContext. Meant to be layered on top of the Scene
// canvas — see ConfiguratorPanel.css for the overlay positioning.
export default function ConfiguratorPanel() {
  const { selected, setOption } = useConfigurator();

  // No speaker cutout on the small cabinet — disable rather than hide these.
  const disabledValues = {
    "speaker.included": isSpeakerAllowed(selected) ? [] : ["Speakers", "Cabinet Doors"],
    "speaker.grille": isSpeakerAllowed(selected) ? [] : ["Light", "Dark"],
  };

  return (
    <div className={styles["configurator-panel"]}>
      {controls.map(({ part, param, label, options }) => (
        <SwitchButton
          key={`${part}.${param}`}
          label={label}
          options={options}
          value={selected[part][param]}
          onChange={(value) => setOption(part, param, value)}
          disabledValues={disabledValues[`${part}.${param}`]}
        />
      ))}
    </div>
  );
}
