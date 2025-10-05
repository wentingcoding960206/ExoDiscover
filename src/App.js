import React, { useState, useMemo, useCallback } from 'react';
import { GalaxyView } from './components/GalaxyView/GalaxyView';
import { FilterDashboard } from './components/FilterDashboard/FilterDashboard';
import { PlanetList } from './components/PlanetList/PlanetList';
import { INITIAL_FILTERS } from './data/filters';
import { processPlanetsData } from './utils/planetUtils';
import styles from './App.module.css';

function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isPlanetListOpen, setIsPlanetListOpen] = useState(false);

  const planets = useMemo(() => processPlanetsData(), []);

  const handleFilterChange = useCallback((key, newCurrent) => {
    setFilters(prev => ({
      ...prev,
      [key]: { ...prev[key], current: newCurrent },
    }));
  }, []);
  
  const handlePlanetSelect = useCallback((planet) => {
    setSelectedPlanet(prev => prev?.id === planet.id ? null : planet);
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedPlanet(null);
  }, []);

  return (
    <div className={styles.appContainer}>
      <GalaxyView selectedPlanet={selectedPlanet} allPlanets={planets} />
      
      <div className={styles.uiOverlay}>
        <div className={styles.topControls}>
          <button 
            onClick={() => setIsDashboardOpen(p => !p)} 
            className={`${styles.uiButton} ${isDashboardOpen ? styles.active : ''}`}
          >
            🔭 Filters
          </button>
          <button onClick={handleResetView} className={styles.uiButton}>
            🏠 Reset View
          </button>
        </div>
        <div className={styles.topRightControls}>
           <button 
            onClick={() => setIsPlanetListOpen(p => !p)} 
            className={`${styles.uiButton} ${isPlanetListOpen ? styles.active : ''}`}
          >
            🪐 Planets
          </button>
        </div>
      </div>

      <FilterDashboard 
        isOpen={isDashboardOpen} 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <PlanetList
        isOpen={isPlanetListOpen}
        planets={planets}
        selectedPlanet={selectedPlanet}
        onPlanetSelect={handlePlanetSelect}
        filters={filters}
      />
    </div>
  );
}

export default App;