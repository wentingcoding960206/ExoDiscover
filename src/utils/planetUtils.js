import planetsData from '../data/predictions.json';

// Processes raw planet data into a structured format for the app
export const processPlanetsData = () => {
  return planetsData
    .filter(planet => planet.planet_name)
    .map((planet, index) => ({
      id: planet.planet_id || index + 1,
      name: planet.planet_name || 'Unknown Planet',
      orbitalPeriod: planet.orbital_period || 0,
      radius: planet.planet_radius || 0,
      transitDepth: planet.transit_depth || 0,
      transitDuration: planet.transit_duration || 0,
      eqTemp: planet.eq_temperature || 0,
      insolationFlux: planet.insolation_flux || 0,
      stellarTemp: planet.stellar_temp || 0,
      stellarRadius: planet.stellar_radius || 0,
      stellarGravity: planet.stellar_gravity || 0,
      source: planet.source || 'Unknown',
      classification: planet.final_prediction,
      actual: planet.actual_label,
      habitableZone: planet.insolation_flux > 0.2 && planet.insolation_flux < 2.0 &&
                     planet.eq_temperature > 200 && planet.eq_temperature < 350,
    }));
};