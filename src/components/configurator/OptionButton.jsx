import styles from "./OptionButton.module.css";

export default function OptionButton({
  label,
  options,
  value,
  defaultValue,
  touched = false,
  onChange,
  disabled = false,
  disabledMessage,
  compact = false,
}) {
  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.buttonGroup}>
        {options.map((option) => {
          const isSelected = option.value === value;
          const isDefaultOption = option.value === defaultValue;
          const isSwatch = Boolean(option.background);

          const showAsActive = isSelected && touched;
          const showAsDefault = isDefaultOption && !touched;

          const typeClass = isSwatch ? styles.swatch : styles.textOption;
          const sizeClass = compact ? styles.compact : "";
          const stateClass = showAsActive
            ? styles.active
            : showAsDefault
              ? styles.default
              : "";

          return (
            <div key={option.value} className={styles.optionWrapper}>
              <button
                className={`${styles.option} ${typeClass} ${sizeClass} ${stateClass} ${disabled ? styles.inactive : ""}`}
                style={isSwatch ? { background: option.background } : undefined}
                onClick={() => onChange(option.value)}
                disabled={disabled}
              >
                {!isSwatch && option.label}
              </button>
              {isSwatch && (
                <span className={styles.optionValue}>{option.value}</span>
              )}
            </div>
          );
        })}
      </div>
      {disabled && disabledMessage && (
        <p className={styles.disabledMessage}>{disabledMessage}</p>
      )}
    </div>
  );
}
