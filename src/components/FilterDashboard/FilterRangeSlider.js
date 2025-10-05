import React from 'react';
import styles from './FilterRangeSlider.module.css';

export function FilterRangeSlider({ filterKey, data, onChange }) {
  const { label, unit, min, max, step, current } = data;

  const clamp = (val, minVal, maxVal) => Math.min(Math.max(val, minVal), maxVal);

  const handleMinChange = (value) => {
    const newMin = clamp(Number(value), min, current.max - step);
    onChange(filterKey, { ...current, min: newMin });
  };

  const handleMaxChange = (value) => {
    const newMax = clamp(Number(value), current.min + step, max);
    onChange(filterKey, { ...current, max: newMax });
  };

  const percent = (value) => ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.labelContainer}>
        <span>{label}</span>
        <span className={styles.unit}>{unit}</span>
      </div>

      <div className={styles.sliderContainer}>
        <div className={styles.track} />
        <div
          className={styles.activeRange}
          style={{
            left: `${percent(current.min)}%`,
            width: `${percent(current.max) - percent(current.min)}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current.min}
          onChange={(e) => handleMinChange(e.target.value)}
          className={styles.slider}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current.max}
          onChange={(e) => handleMaxChange(e.target.value)}
          className={styles.slider}
        />
      </div>

      <div className={styles.inputGroup}>
        <input
          type="number"
          value={current.min}
          min={min}
          max={current.max - step}
          step={step}
          onChange={(e) => handleMinChange(e.target.value)}
          onBlur={(e) => handleMinChange(e.target.value)}
          className={styles.inputBox}
        />
        <input
          type="number"
          value={current.max}
          min={current.min + step}
          max={max}
          step={step}
          onChange={(e) => handleMaxChange(e.target.value)}
          onBlur={(e) => handleMaxChange(e.target.value)}
          className={styles.inputBox}
        />
      </div>
    </div>
  );
}