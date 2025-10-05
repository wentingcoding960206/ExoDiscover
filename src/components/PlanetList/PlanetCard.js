import React, { memo, useState } from 'react';
import styles from './PlanetCard.module.css';

const InfoRow = ({ label, value }) => (
  <div className={styles.infoRow}>
    <span className={styles.infoLabel}>{label}:</span>
    <span className={styles.infoValue}>{value}</span>
  </div>
);

const getClassificationInfo = (classification) => {
    switch(classification) {
      case 2: return { text: '✓ Confirmed Exoplanet', styleKey: 'confirmed' };
      case 1: return { text: '○ Exoplanet Candidate', styleKey: 'candidate' };
      case 0: return { text: '✗ False Positive', styleKey: 'falsePositive' };
      default: return { text: '? Unknown Status', styleKey: 'unknown' };
    }
};

export const PlanetCard = memo(({ planet, isSelected, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const classificationInfo = getClassificationInfo(planet.classification);
  const cardClasses = `${styles.card} ${isSelected ? styles.selected : ''}`;
  const badgeClasses = `${styles.badge} ${styles[classificationInfo.styleKey]}`;

  return (
    <div
      className={cardClasses}
      onClick={() => {
        onClick();
        setIsExpanded(prev => !prev);
      }}
    >
      <div className={styles.header}>
        <span className={styles.planetName}>{planet.name}</span>
      </div>

      <div className={badgeClasses} style={{ marginBottom: isExpanded ? '8px' : '0' }}>
        {classificationInfo.text}
      </div>

      {isExpanded && (
        <div className={styles.details}>
          <InfoRow label="Orbital Period" value={`${planet.orbitalPeriod?.toFixed(2)} days`} />
          <InfoRow label="Radius" value={`${planet.radius} Earth Radii`} />
          <InfoRow label="Transit Depth" value={`${planet.transitDepth} PPM`} />
          <InfoRow label="Transit Duration" value={`${planet.transitDuration?.toFixed(2)} Hours`} />
          <InfoRow label="Ins. Flux" value={`${planet.insolationFlux?.toFixed(2)} Earth Flux`} />
          <InfoRow label="Eq. Temp" value={`${Math.round(planet.eqTemp)} K`} />
          <InfoRow label="Stellar Temp" value={`${Math.round(planet.stellarTemp)} K`} />
          <InfoRow label="Stellar Gravity" value={`${planet.stellarGravity?.toFixed(3)} log₁₀(cm/s²)`} />
          <InfoRow label="Stellar Radius" value={`${planet.stellarRadius?.toFixed(3)} Solar Radii`} />
          <InfoRow label="Source" value={planet.source} />
          {planet.habitableZone && (
            <div className={styles.habitable}>
              ✨ Potentially Habitable
            </div>
          )}
        </div>
      )}
    </div>
  );
});