import styles from "./OptionButton.module.css";

export default function OptionButton({
  label,
  options,
  value,
  onChange,
  disabled = false,
  disabledMessage,
}) {
  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.buttonGroup}>
        {options.map((option) => {
          const isActive = option.value === value;
          const isSwatch = Boolean(option.background);
          const typeClass = isSwatch ? styles.swatch : styles.textOption;

          return (
            <div key={option.value} className={styles.optionWrapper}>
              <button
                className={`${styles.option} ${typeClass} ${isActive ? styles.active : ""} ${disabled ? styles.inactive : ""}`}
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
