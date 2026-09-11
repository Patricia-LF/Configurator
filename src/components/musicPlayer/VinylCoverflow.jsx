// VinylCoverflow.jsx
import { useState, useRef } from 'react';
import './VinylCoverflow.css';

const HOVER_DELAY = 150;

// shortest signed distance from `index` to `center`, wrapping around the array
function getOffset(index, center, length) {
  let diff = index - center;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

export default function VinylCoverflow({ disks }) {
  const [centerIndex, setCenterIndex] = useState(Math.floor(disks.length / 2));
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const hoverTimeout = useRef(null);

  const wrap = (i) => ((i % disks.length) + disks.length) % disks.length;

  const goTo = (i) => setCenterIndex(wrap(i));

  const handleMouseEnter = (i) => {
    setHoveredIndex(i);
    if (i !== centerIndex) {
      hoverTimeout.current = setTimeout(() => goTo(i), HOVER_DELAY);
    }
  };

  const handleMouseLeave = (i) => {
    setHoveredIndex((current) => (current === i ? null : current));
    clearTimeout(hoverTimeout.current);
  };

  return (
    <div className="coverflow">
      <div className="coverflow__stage">
        {disks.map((disk, i) => {
          const offset = getOffset(i, centerIndex, disks.length);
          const distance = Math.abs(offset);

          // don't render disks that are far outside the visible/staging range
          if (distance > 2) return null;

          const isCenter = offset === 0;
          const isStaging = distance === 2;
          const isHovered = hoveredIndex === i;

          const translateX = offset * 90;
          const rotateY = offset === 0 ? 0 : offset > 0 ? -45 : 45;
          const translateZ = isHovered && !isCenter && !isStaging ? -20 : -distance * 55;
          const scale = isCenter ? 1 : isHovered && !isStaging ? 0.85 : 0.75;

          return (
            <div
              key={disk.id}
              className="coverflow__item"
              onMouseEnter={() => !isStaging && handleMouseEnter(i)}
              onMouseLeave={() => !isStaging && handleMouseLeave(i)}
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: isStaging ? 0 : 1,
                pointerEvents: isStaging ? 'none' : 'auto',
                zIndex: isHovered ? 50 : disks.length - distance,
              }}
            >
              <img src={disk.image} alt={disk.label} />
              {!isCenter && (
                <div
                  className="coverflow__shade"
                  style={{ background: isHovered ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.35)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}