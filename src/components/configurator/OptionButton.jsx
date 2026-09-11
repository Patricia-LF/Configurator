// OptionButton.jsx
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
          const stateClass = disabled
            ? styles.inactive
            : isActive
              ? styles.active
              : styles.default;

          return (
            <button
              key={option.value}
              className={`${styles.option} ${stateClass}`}
              onClick={() => onChange(option.value)}
              disabled={disabled}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {disabled && disabledMessage && (
        <p className={styles.disabledMessage}>{disabledMessage}</p>
      )}
    </div>
  );
}
