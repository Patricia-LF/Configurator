import { useRef } from 'react';
import './SwitchButton.css';

export default function SwitchButton({ label, options, value, onChange, disabledValues = [] }) {
    const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

    const handleClick = (index) => {
        onChange(options[index].value);
    };

    return (
        <div className="switch-button_container">
            {label && <div className="switch-button_label">{label}</div>}
            <div className="switch-button" style={{ '--count': options.length}}>
                <div
                    className='switch-button_slider'
                    style={{ transform: `translateX(${activeIndex * 100}%)` }}
                />
                {options.map((option, i) => (
                    <button
                        key={option.value}
                        className={`switch-button_option ${i === activeIndex ? 'active' : ''}`}
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
