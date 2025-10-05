import React, { memo, useState, useMemo } from 'react';
import styles from './PlanetList.module.css';
import { PlanetCard } from './PlanetCard';

export const PlanetList = memo(({ isOpen, planets, selectedPlanet, onPlanetSelect, filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPlanets = useMemo(() => {
    return planets.filter(planet => {
      if (!planet.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      for (const key in filters) {
        const filter = filters[key];
        const planetValue = planet[key === 'eqTemp' ? 'eqTemp' : key];
        if (planetValue < filter.current.min || planetValue > filter.current.max) {
          return false;
        }
      }
      return true;
    });
  }, [planets, filters, searchTerm]);
  
  const classificationCounts = useMemo(() => {
    return filteredPlanets.reduce((acc, p) => {
      acc[p.classification] = (acc[p.classification] || 0) + 1;
      return acc;
    }, { 0: 0, 1: 0, 2: 0 });
  }, [filteredPlanets]);

  const panelClasses = `${styles.panel} ${isOpen ? styles.open : ''}`;

  return (
    <div className={panelClasses}>
      <h2 className={styles.title}>Exoplanet Catalog</h2>
      
      <div className={styles.searchBarContainer}>
        <input
          type="text"
          placeholder="Search planets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchBar}
        />
      </div>

      <div className={styles.statsBox}>
        <div className={styles.confirmed}>✓ Confirmed: {classificationCounts[2]}</div>
        <div className={styles.candidate}>○ Candidate: {classificationCounts[1]}</div>
        <div className={styles.falsePositive}>✗ False Positive: {classificationCounts[0]}</div>
      </div>

      <div className={styles.counter}>
        Showing {filteredPlanets.length} of {planets.length} planets
        {filteredPlanets.length < planets.length && (
          <span className={styles.filterNotice}>(Filtered by active criteria)</span>
        )}
      </div>

      <div className={styles.list}>
        {filteredPlanets.length > 0 ? (
          filteredPlanets.map((planet) => (
            <PlanetCard
              key={planet.id}
              planet={planet}
              isSelected={selectedPlanet?.id === planet.id}
              onClick={() => onPlanetSelect(planet)}
            />
          ))
        ) : (
          <div className={styles.noResults}>
            No planets match the current filters.
            <br />
            Try adjusting the filter ranges.
          </div>
        )}
      </div>
    </div>
  );
});