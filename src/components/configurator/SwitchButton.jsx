import { useRef } from 'react';
import styles from './SwitchButton.module.css';

export default function SwitchButton({ label, options, value, onChange, disabledValues = [] }) {
    const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

    const handleClick = (index) => {
        onChange(options[index].value);
    };

    return (
        <div className={styles["switch-button_container"]}>
            {label && <div className={styles["switch-button_label"]}>{label}</div>}
            <div className={styles["switch-button"]} style={{ '--count': options.length}}>
                <div
                    className={styles["switch-button_slider"]}
                    style={{ transform: `translateX(${activeIndex * 100}%)` }}
                />
                {options.map((option, i) => (
                    <button
                        key={option.value}
                        className={`${styles["switch-button_option"]} ${i === activeIndex ? styles.active : ''}`}
                        disabled={disabledValues.includes(option.value)}
                        onClick={() => handleClick(i)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
