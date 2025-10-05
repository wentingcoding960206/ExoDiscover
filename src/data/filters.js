// Initial state for the exoplanet filters
export const INITIAL_FILTERS = {
  planetRadius: { label: "Planet Radius", unit: "Earth Radii", min: 0, max: 300, step: 0.1, current: { min: 0, max: 300 } },
  transitDepth: { label: "Transit Depth", unit: "PPM", min: 0, max: 227500, step: 1, current: { min: 0, max: 227500 } },
  transitDuration: { label: "Transit Duration", unit: "Hours", min: 0, max: 30, step: 0.1, current: { min: 0, max: 30 } },
  insolationFlux: { label: "Ins. Flux", unit: "Earth Flux", min: 0, max: 285000, step: 1, current: { min: 0, max: 285000 } },
  eqTemp: { label: "Eq. Temp", unit: "Kelvin", min: 0, max: 6500, step: 1, current: { min: 0, max: 6500} },
  stellarTemp: { label: "Stellar Temp", unit: "Kelvin", min: 0, max: 50000, step: 1, current: { min: 0, max: 50000 } },
  stellarGravity: { label: "Stellar Gravity", unit: "log₁₀(cm/s²)", min: 0, max: 8, step: 0.01, current: { min: 0, max: 8 } },
};