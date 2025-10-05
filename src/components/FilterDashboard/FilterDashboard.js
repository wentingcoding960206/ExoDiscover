import React, { memo } from 'react';
import styles from './FilterDashboard.module.css';
import { FilterRangeSlider } from './FilterRangeSlider';

export const FilterDashboard = memo(({ isOpen, filters, onFilterChange }) => {
  const dashboardClasses = `${styles.dashboard} ${isOpen ? styles.open : ''}`;

  return (
    <div className={dashboardClasses}>
      <h2 className={styles.title}>Exoplanet Filters</h2>
      {Object.entries(filters).map(([key, data]) => (
        <FilterRangeSlider
          key={key}
          filterKey={key}
          data={data}
          onChange={onFilterChange}
        />
      ))}
    </div>
  );
});