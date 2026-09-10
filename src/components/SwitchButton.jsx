import { useRef } from 'react';
import './SwitchButton.css';

export default function SwitchButton({ label, options, value, onChange }) {
    const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
    const ref = useRef([]);

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
                        ref={(el) => (ref.current[i] = el)}
                        className={`switch-button_option ${i === activeIndex ? 'active' : ''}`}
                        onClick={() => handleClick(i)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Add this code snippet to use the SwitchButton component:
{/* <SwitchButton
label="Size"
options={[
  { label: "180cm", value: "180cm" },
  { label: "Value", value: "Value" }
]}
value={size}
onChange={setSize}
/> */}