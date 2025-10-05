import React, { useRef } from 'react';
import { useGalaxyScene } from '../../hooks/useGalaxyScene';
import styles from './GalaxyView.module.css';
import { CameraInfoDisplay } from '../UI/CameraInfoDisplay';

export const GalaxyView = ({ selectedPlanet, allPlanets }) => {
  const mountRef = useRef(null);
  const { cameraStateRef } = useGalaxyScene(mountRef, selectedPlanet, allPlanets);

  return (
    <div className={styles.container}>
      <div ref={mountRef} className={styles.mount} />
      <div className={styles.cameraInfo}>
        <CameraInfoDisplay cameraStateRef={cameraStateRef} />
      </div>
    </div>
  );
};