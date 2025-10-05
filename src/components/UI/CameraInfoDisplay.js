import React, { useState, useEffect, memo } from 'react';
import styles from './CameraInfoDisplay.module.css';

export const CameraInfoDisplay = memo(({ cameraStateRef }) => {
  const [info, setInfo] = useState({ distance: 0, theta: 0, phi: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const state = cameraStateRef.current?.state;
      if (state) {
        setInfo({
          distance: Math.round(state.radius),
          theta: Math.round(state.theta % 360),
          phi: Math.round(state.phi),
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [cameraStateRef]);

  return (
    <div className={styles.infoBox}>
      <div>Rotation (θ): {info.theta}°</div>
      <div>Elevation (φ): {info.phi}°</div>
    </div>
  );
});