import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import * as THREE from 'three';
import planetsData from './predictions.json';

// --- Configuration Object ---
const GALAXY_CONFIG = {
  smoothingFactor: 0.05,
  camera: {
    initialRadius: 800,
    minRadius: 150,
    maxRadius: 900,
    initialPhi: 60,
    minPhi: 10,
    maxPhi: 170,
  },
  particles: {
    armCount: 30000,
    dustCount: 2000,
    starCount: 12000, // Increased for a denser inner starfield
    distantStarCount: 15000, // New layer for a deep background
    armMinRadius: 100,
    armMaxRadius: 800,
    whiteStarProbability: 0.12,
  },
  core: {
    baseSize: 30,
    glow1Size: 60,
    glow2Size: 80,
    diskInnerRadius: 80,
    diskOuterRadius: 170,
    diskRadialSegments: 128,
    diskThetaSegments: 64,
    diskWarpHeight: 20,
    diskOpacityStart: 0.3,
    diskOpacityEnd: 0.9,
    diskMaxOpacity: 0.9,
    exclusionRadius: 180,
  },
  rotation: {
    galaxy: 0.0005,
    stars: 0.00005,
  }
};
const planetMarkers = new Map(); // Store planet id -> marker mesh
const planetPositions = new Map(); // Store planet id -> position in galaxy

// --- Initial Filter State ---
const INITIAL_FILTERS = {
  planetRadius: { label: "Planet Radius", unit: "Earth Radii", min: 0, max: 300, step: 0.1, current: { min: 0, max: 300 } },
  transitDepth: { label: "Transit Depth", unit: "PPM", min: 0, max: 227500, step: 1, current: { min: 0, max: 227500 } },
  transitDuration: { label: "Transit Duration", unit: "Hours", min: 0, max: 30, step: 0.1, current: { min: 0, max: 30 } },
  insolationFlux: { label: "Ins. Flux", unit: "Earth Flux", min: 0, max: 285000, step: 1, current: { min: 0, max: 285000 } },
  eqTemp: { label: "Eq. Temp", unit: "Kelvin", min: 0, max: 6500, step: 1, current: { min: 0, max: 6500} },
  stellarTemp: { label: "Stellar Temp", unit: "Kelvin", min: 0, max: 50000, step: 1, current: { min: 0, max: 50000 } },
  stellarGravity: { label: "Stellar Gravity", unit: "log₁₀(cm/s²)", min: 0, max: 8, step: 0.01, current: { min: 0, max: 8 } },
};


// --- NEW & UPDATED UI Components ---

function FilterRangeSlider({ filterKey, data, onChange }) {
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
    <div
      style={{
        marginBottom: "28px",
        background: "linear-gradient(180deg, #0b0c1b 0%, #1a1c3a 100%)",
        padding: "16px",
        borderRadius: "14px",
        boxShadow: "0 0 20px rgba(0,0,40,0.5)",
        border: "1px solid rgba(59,130,246,0.2)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.01)";
        e.currentTarget.style.boxShadow = "0 0 25px rgba(37,99,235,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 0 20px rgba(0,0,40,0.5)";
      }}
    >
      {/* Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          color: "#E5E7EB",
          fontWeight: 500,
          fontSize: "14px",
          letterSpacing: "0.3px",
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.65, fontStyle: "italic" }}>{unit}</span>
      </div>

      {/* Slider */}
      <div style={{ position: "relative", height: "36px" }}>
        {/* Full Track */}
        <div
          style={{
            position: "absolute",
            height: "6px",
            background: "linear-gradient(90deg, #1e293b, #243b55)",
            borderRadius: "4px",
            width: "100%",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />

        {/* Active Range */}
        <div
          style={{
            position: "absolute",
            height: "6px",
            borderRadius: "4px",
            background: "linear-gradient(90deg, #1e3a8a, #3b82f6, #8b5cf6)",
            left: `${percent(current.min)}%`,
            width: `${percent(current.max) - percent(current.min)}%`,
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 10px rgba(59,130,246,0.4)",
            transition: "all 0.15s ease-out",
          }}
        />

        {/* Two Range Inputs */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current.min}
          onChange={(e) => handleMinChange(e.target.value)}
          style={sliderBaseStyle}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current.max}
          onChange={(e) => handleMaxChange(e.target.value)}
          style={sliderBaseStyle}
        />

        {/* Custom CSS for Thumbs */}
        <style>{`
          input[type=range] {
            pointer-events: none;
          }
          input[type=range]::-webkit-slider-thumb {
            pointer-events: auto;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #60a5fa 0%, #1e3a8a 70%);
            border: 2px solid #93c5fd;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(96,165,250,0.5);
            transition: all 0.15s ease;
            margin-top: -7px;
          }
          input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 16px rgba(96,165,250,0.8);
          }
          input[type=range]::-moz-range-thumb {
            pointer-events: auto;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #60a5fa 0%, #1e3a8a 70%);
            border: 2px solid #93c5fd;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(96,165,250,0.5);
            transition: all 0.15s ease;
          }
          input[type=range]::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 16px rgba(96,165,250,0.8);
          }
        `}</style>
      </div>

      {/* Inputs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          marginTop: "14px",
        }}
      >
        <input
          type="number"
          value={current.min}
          min={min}
          max={current.max - step}
          step={step}
          onChange={(e) => handleMinChange(e.target.value)}
          onBlur={(e) => handleMinChange(e.target.value)}
          style={inputBoxStyle}
        />
        <input
          type="number"
          value={current.max}
          min={current.min + step}
          max={max}
          step={step}
          onChange={(e) => handleMaxChange(e.target.value)}
          onBlur={(e) => handleMaxChange(e.target.value)}
          style={inputBoxStyle}
        />
      </div>
    </div>
  );
}

/* --- Styles --- */
const sliderBaseStyle = {
  position: "absolute",
  width: "100%",
  height: "6px",
  top: "50%",
  left: 0,
  appearance: "none",
  background: "transparent",
};

const inputBoxStyle = {
  flex: 1,
  padding: "6px 8px",
  backgroundColor: "#111827",
  border: "1px solid #334155",
  color: "#E0F2FE",
  borderRadius: "6px",
  fontSize: "14px",
  textAlign: "center",
  boxShadow: "inset 0 0 4px rgba(59,130,246,0.2)",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
};


const FilterDashboard = memo(({ isOpen, filters, onFilterChange }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '25%',
      maxWidth: '350px',
      height: '100vh',
      backgroundColor: 'rgba(10, 10, 20, 0.9)',
      color: 'white',
      padding: '20px',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.5s ease-in-out',
      overflowY: 'auto',
      zIndex: 10,
      pointerEvents: 'auto'
    }}>
      <h2 style={{ marginTop: '40px', textAlign: 'center', color: "#93c5fd" }}>Exoplanet Filters</h2>
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

// --- Planet List Component ---
const PlanetList = memo(({ isOpen, planets, selectedPlanet, onPlanetSelect, filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPlanets = planets.filter(planet => {
    if (!planet.name) return false;
    
    // Apply search filter
    if (!planet.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply range filters
    const { planetRadius, transitDepth, transitDuration, insolationFlux, eqTemp, stellarTemp, stellarGravity } = filters;
    
    // Check each filter
    if (planet.radius < planetRadius.current.min || planet.radius > planetRadius.current.max) return false;
    if (planet.transitDepth < transitDepth.current.min || planet.transitDepth > transitDepth.current.max) return false;
    if (planet.transitDuration < transitDuration.current.min || planet.transitDuration > transitDuration.current.max) return false;
    if (planet.insolationFlux < insolationFlux.current.min || planet.insolationFlux > insolationFlux.current.max) return false;
    if (planet.eqTemp < eqTemp.current.min || planet.eqTemp > eqTemp.current.max) return false;
    if (planet.stellarTemp < stellarTemp.current.min || planet.stellarTemp > stellarTemp.current.max) return false;
    if (planet.stellarGravity < stellarGravity.current.min || planet.stellarGravity > stellarGravity.current.max) return false;
    
    return true;
  });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '25%',
      maxWidth: '350px',
      height: '100vh',
      backgroundColor: 'rgba(10, 10, 20, 0.9)',
      color: 'white',
      padding: '20px',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.5s ease-in-out',
      overflowY: 'auto',
      zIndex: 10,
      pointerEvents: 'auto'
    }}>
      <h2 style={{ marginTop: '40px', textAlign: 'center', color: "#93c5fd" }}>Exoplanet Catalog</h2>
      
      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search planets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#111827',
            border: '1px solid #334155',
            color: '#E0F2FE',
            borderRadius: '6px',
            fontSize: '14px',
            boxShadow: 'inset 0 0 4px rgba(59,130,246,0.2)',
          }}
        />
      </div>

      {/* Classification Statistics */}
      <div style={{
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: 'rgba(30, 58, 138, 0.2)',
        borderRadius: '8px',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        <div style={{ color: '#10b981' }}>
          ✓ Confirmed: {filteredPlanets.filter(p => p.classification === 2).length}
        </div>
        <div style={{ color: '#ef4444' }}>
          ○ Candidate: {filteredPlanets.filter(p => p.classification === 1).length}
        </div>
        <div style={{ color: '#6b7280' }}>
          ✗ False Positive: {filteredPlanets.filter(p => p.classification === 0).length}
        </div>
      </div>

      {/* Planet Counter */}
      <div style={{ 
        marginBottom: '15px', 
        textAlign: 'center',
        color: '#93c5fd',
        fontSize: '13px'
      }}>
        Showing {filteredPlanets.length} of {planets.length} planets
        {filteredPlanets.length < planets.length && (
          <span style={{ display: 'block', fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
            (Filtered by active criteria)
          </span>
        )}
      </div>

      {/* Planet List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#93c5fd',
            opacity: 0.7,
            fontSize: '14px'
          }}>
            No planets match the current filters.
            <br />
            Try adjusting the filter ranges.
          </div>
        )}
      </div>
    </div>
  );
});

// --- Planet Card Component ---
const PlanetCard = memo(({ planet, isSelected, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine classification status
  const getClassificationInfo = (classification) => {
    switch(classification) {
      case 2:
        return {
          text: '✓ Confirmed Exoplanet',
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 0.5)'
        };
      case 1:
        return {
          text: '○ Exoplanet Candidate',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.5)'
        };
      case 0:
        return {
          text: '✗ False Positive',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.2)',
          borderColor: 'rgba(107, 114, 128, 0.5)'
        };
      default:
        return {
          text: '? Unknown Status',
          color: '#fbbf24',
          bgColor: 'rgba(251, 191, 36, 0.2)',
          borderColor: 'rgba(251, 191, 36, 0.5)'
        };
    }
  };

  const classificationInfo = getClassificationInfo(planet.classification);

  return (
    <div
      style={{
        background: isSelected 
          ? 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 100%)'
          : 'linear-gradient(180deg, #0b0c1b 0%, #1a1c3a 100%)',
        padding: '12px',
        borderRadius: '10px',
        boxShadow: isSelected 
          ? '0 0 20px rgba(37,99,235,0.6)' 
          : '0 0 15px rgba(0,0,40,0.5)',
        border: isSelected 
          ? '1px solid rgba(96,165,250,0.5)' 
          : `1px solid ${classificationInfo.borderColor}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => {
        onClick();
        setIsExpanded(!isExpanded);
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(37,99,235,0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0,0,40,0.5)';
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ 
          fontWeight: 500, 
          fontSize: '15px',
          color: '#E5E7EB'
        }}>
          {planet.name}
        </span>
        <span style={{ 
          fontSize: '12px', 
          opacity: 0.7,
          color: '#93c5fd'
        }}>
        </span>
      </div>

      {/* Classification Status Badge */}
      <div style={{ 
        padding: '4px 8px',
        backgroundColor: classificationInfo.bgColor,
        borderRadius: '4px',
        textAlign: 'center',
        color: classificationInfo.color,
        fontSize: '12px',
        fontWeight: 500,
        marginBottom: isExpanded ? '8px' : '0'
      }}>
        {classificationInfo.text}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid rgba(147,197,253,0.2)',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#E0F2FE'
        }}>
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
            <div style={{ 
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: 'rgba(34,197,94,0.2)',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#86efac'
            }}>
              ✨ Potentially Habitable
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// --- Info Row Helper Component ---
const InfoRow = ({ label, value }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between',
    marginBottom: '4px'
  }}>
    <span style={{ opacity: 0.8 }}>{label}:</span>
    <span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);

const NavItem = memo(({ section, activeSection, onClick, children }) => (
  <button
    onClick={() => onClick(section)}
    style={{
      padding: '10px 15px',
      margin: '0 5px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      backgroundColor: activeSection === section ? '#9333ea' : '#374151',
      color: 'white',
      fontWeight: activeSection === section ? 'bold' : 'normal',
      transition: 'all 0.3s',
    }}
  >
    {children}
  </button>
));

const CameraInfoDisplay = memo(({ cameraStateRef }) => {
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
    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '10px 15px', borderRadius: '5px', color: 'white', fontSize: '14px', fontFamily: 'monospace' }}>
      <div>Rotation (θ): {info.theta}°</div>
      <div>Elevation (φ): {info.phi}°</div>
    </div>
  );
});

// --- Planet Marker Creation ---
const createPlanetMarker = () => {
  // --- MODIFIED: Increased the size of the cube to make it more visible ---
  const geometry = new THREE.BoxGeometry(20, 20, 20); // Was 8
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd700, // Golden color
    emissive: 0xffd700,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9,
  });
  const marker = new THREE.Mesh(geometry, material);
  
  // --- MODIFIED: Increased the glow size to match the new cube size ---
  const glowGeometry = new THREE.BoxGeometry(30, 30, 30); // Was 12
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffed4e,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  marker.add(glow);
  
  return marker;
};

// --- Generate Random Position in Galaxy Arm ---
const generatePlanetPosition = (planetId) => {
  // Choose a random arm (0-3)
  const armIndex = Math.floor(Math.random() * 4);
  const armOffset = armIndex * Math.PI * 0.5;
  
  // Random position along the arm
  const t = Math.random() * 0.7 + 0.2; // Avoid center and edges
  const angle = t * Math.PI * 4 + armOffset;
  const radius = GALAXY_CONFIG.particles.armMinRadius + 
                 t * (GALAXY_CONFIG.particles.armMaxRadius - GALAXY_CONFIG.particles.armMinRadius);
  
  // Add some random offset for natural distribution
  const randomOffset = 30;
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * randomOffset;
  const z = Math.sin(angle) * radius + (Math.random() - 0.5) * randomOffset;
  const y = (Math.random() - 0.5) * 20; // Slight vertical offset
  
  return new THREE.Vector3(x, y, z);
};

// --- Main Galaxy Component ---
const MilkyWayGalaxy = () => {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const cameraRef = useRef(null);
  const [activeSection, setActiveSection] = useState('home');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [isPlanetListOpen, setIsPlanetListOpen] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  // Sample planet data - replace with your actual JSON data
  // Process the imported JSON data to match the expected format
  // Process the imported JSON data to match the expected format
  const [planets] = useState(() => {
    return planetsData
      .filter(planet => planet.planet_name) // Filter out planets without names
      .map((planet, index) => ({
        id: planet.planet_id || index + 1, // Use planet_id, fallback to index
        name: planet.planet_name || 'Unknown Planet',
        distance: Math.round(Math.random() * 2000 + 100),
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
        // --- UPDATED MAPPING ---
        classification: planet.final_prediction, // Map the final_prediction field to classification
        actual: planet.actual_label, // Map actual_label to actual
        // --- END UPDATED MAPPING ---
        habitableZone: planet.insolation_flux > 0.2 && planet.insolation_flux < 2.0 && 
                      planet.eq_temperature > 200 && planet.eq_temperature < 350
      }));
  });

 const handlePlanetSelect = useCallback((planet) => {
    setSelectedPlanet(planet);

    if (cameraRef.current && planet) {
        const { state } = cameraRef.current;

        // Get or generate the planet's position in the galaxy arm
        let position;
        if (!planetPositions.has(planet.id)) {
            position = generatePlanetPosition(planet.id);
            planetPositions.set(planet.id, position);
        } else {
            position = planetPositions.get(planet.id);
        }

        // Set the camera to look at the planet's position and zoom in
        state.targetLookAt = position.clone();
        state.targetRadius = 100; // Zoom in close to the marker
        
        // Calculate the ideal viewing angle to look at the planet from the side
        const targetThetaRad = Math.atan2(position.z, position.x) + Math.PI / 4; // Add offset for better view
        state.targetTheta = THREE.MathUtils.radToDeg(targetThetaRad);
        state.targetPhi = 75; // A nice elevated angle
    }
}, []);


  const handleFilterChange = useCallback((key, newCurrent) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: {
        ...prevFilters[key],
        current: newCurrent
      }
    }));
  }, []);

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { camera, state } = cameraRef.current;

    // Smoothly interpolate camera position and look-at target
    state.theta += (state.targetTheta - state.theta) * GALAXY_CONFIG.smoothingFactor;
    state.phi += (state.targetPhi - state.phi) * GALAXY_CONFIG.smoothingFactor;
    state.radius += (state.targetRadius - state.radius) * GALAXY_CONFIG.smoothingFactor;
    state.lookAt.lerp(state.targetLookAt, GALAXY_CONFIG.smoothingFactor);

    const radTheta = (state.theta * Math.PI) / 180;
    const radPhi = (state.phi * Math.PI) / 180;

    // Calculate new camera position based on spherical coordinates relative to the look-at point
    camera.position.x = state.lookAt.x + state.radius * Math.sin(radPhi) * Math.cos(radTheta);
    camera.position.y = state.lookAt.y + state.radius * Math.cos(radPhi);
    camera.position.z = state.lookAt.z + state.radius * Math.sin(radPhi) * Math.sin(radTheta);
    
    // Point the camera to the interpolated look-at position
    camera.lookAt(state.lookAt);
}, []);


  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;
    
    // --- MODIFIED: Added lookAt and targetLookAt to camera state ---
    const cameraState = {
      radius: GALAXY_CONFIG.camera.initialRadius,
      theta: 0,
      phi: GALAXY_CONFIG.camera.initialPhi,
      targetRadius: GALAXY_CONFIG.camera.initialRadius,
      targetTheta: 0,
      targetPhi: GALAXY_CONFIG.camera.initialPhi,
      isDragging: false,
      previousMouseX: 0,
      previousMouseY: 0,
      lookAt: new THREE.Vector3(0, 0, 0), // Current look-at point
      targetLookAt: new THREE.Vector3(0, 0, 0), // Target look-at point
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    cameraRef.current = { camera, state: cameraState };
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountNode.appendChild(renderer.domElement);
    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    // --- Create Planet Markers ---
    const planetsGroupRef = new THREE.Group();
    galaxyGroup.add(planetsGroupRef);

    // Initialize markers for all planets
    planets.forEach(planet => {
      if (!planetPositions.has(planet.id)) {
        const position = generatePlanetPosition(planet.id);
        planetPositions.set(planet.id, position);
      }
      
      const marker = createPlanetMarker();
      const position = planetPositions.get(planet.id);
      marker.position.copy(position);
      marker.visible = false; // Hidden by default
      
      planetMarkers.set(planet.id, marker);
      planetsGroupRef.add(marker);
    });
    
    // --- Scene Objects ---

    const core = new THREE.Mesh(new THREE.SphereGeometry(GALAXY_CONFIG.core.baseSize, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 }));
    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(GALAXY_CONFIG.core.glow1Size, 32, 32), new THREE.MeshBasicMaterial({ color: 0x9333ea, transparent: true, opacity: 0.25 }));
    const outerGlow = new THREE.Mesh(new THREE.SphereGeometry(GALAXY_CONFIG.core.glow2Size, 32, 32), new THREE.MeshBasicMaterial({ color: 0x4a0080, transparent: true, opacity: 0.1 }));
    scene.add(core, coreGlow, outerGlow);

    const diskGeometry = new THREE.RingGeometry(
        GALAXY_CONFIG.core.diskInnerRadius,
        GALAXY_CONFIG.core.diskOuterRadius,
        GALAXY_CONFIG.core.diskRadialSegments,
        GALAXY_CONFIG.core.diskThetaSegments
    );

    const positions = diskGeometry.attributes.position.array;
    const colors = [];
    const opacities = []; 

    const colorInner = new THREE.Color(0xffffff); 
    const colorOuter = new THREE.Color(0x9333ea); 

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const radius = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(y, x);

        const normalizedRadius = (radius - GALAXY_CONFIG.core.diskInnerRadius) /
                                (GALAXY_CONFIG.core.diskOuterRadius - GALAXY_CONFIG.core.diskInnerRadius);

        const warpAmount = Math.sin(angle) * GALAXY_CONFIG.core.diskWarpHeight * (1 - normalizedRadius);
        positions[i + 2] = warpAmount;

        const interpolatedColor = new THREE.Color().lerpColors(colorInner, colorOuter, normalizedRadius);
        colors.push(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b);
        
        let currentOpacity = THREE.MathUtils.smoothstep(
            normalizedRadius,
            GALAXY_CONFIG.core.diskOpacityStart,
            GALAXY_CONFIG.core.diskOpacityEnd
        );
        currentOpacity = 1.0 - currentOpacity; 
        currentOpacity *= GALAXY_CONFIG.core.diskMaxOpacity;
        
        opacities.push(currentOpacity);
    }
    diskGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    diskGeometry.setAttribute('opacity', new THREE.Float32BufferAttribute(opacities, 1)); 
    diskGeometry.attributes.position.needsUpdate = true;

    const accretionDiskMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute float opacity; 
            varying vec3 vColor;
            varying float vOpacity;

            void main() {
                vColor = color; 
                vOpacity = opacity; 
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vOpacity;

            void main() {
                gl_FragColor = vec4(vColor, vOpacity); 
            }
        `,
        vertexColors: true, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide, 
        depthWrite: false, 
    });

    const accretionDisk = new THREE.Mesh(diskGeometry, accretionDiskMaterial);
    accretionDisk.rotation.x = -Math.PI / 2;
    scene.add(accretionDisk);

    const createSpiralArm = (angleOffset, colorHue) => {
      const positions = new Float32Array(GALAXY_CONFIG.particles.armCount * 3);
      const colors = new Float32Array(GALAXY_CONFIG.particles.armCount * 3);
      for (let i = 0; i < GALAXY_CONFIG.particles.armCount; i++) {
        const i3 = i * 3;
        const angle = (i / GALAXY_CONFIG.particles.armCount) * Math.PI * 6 + angleOffset;
        
        const radius = GALAXY_CONFIG.particles.armMinRadius + (i / GALAXY_CONFIG.particles.armCount) * (GALAXY_CONFIG.particles.armMaxRadius - GALAXY_CONFIG.particles.armMinRadius);
        
        const armCurve = Math.sin((i / GALAXY_CONFIG.particles.armCount) * Math.PI * 2) * 30;
        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 25 + armCurve * (1 - i / GALAXY_CONFIG.particles.armCount);
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;

        const color = new THREE.Color();
        if (Math.random() < GALAXY_CONFIG.particles.whiteStarProbability) {
          color.setHex(0xffffff);
        } else {
          const dist = Math.sqrt(x * x + z * z) / GALAXY_CONFIG.particles.armMaxRadius;
          color.setHSL(colorHue + dist * 0.15, 0.8 - dist * 0.3, 0.6 - dist * 0.4 + Math.random() * 0.2);
        }
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({ size: 2, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true });
      return new THREE.Points(geometry, material);
    };

    const arms = [
        createSpiralArm(0, 0.6),
        createSpiralArm(Math.PI, 0.8),
        createSpiralArm(Math.PI * 0.5, 0.75),
        createSpiralArm(Math.PI * 1.5, 0.65),
    ];
    arms.forEach(arm => galaxyGroup.add(arm));

    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(GALAXY_CONFIG.particles.dustCount * 3);
    for (let i = 0; i < GALAXY_CONFIG.particles.dustCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 400 + 50;
        dustPositions[i * 3] = Math.cos(angle) * radius;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x4a0080, size: 3, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    galaxyGroup.add(dust);

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(GALAXY_CONFIG.particles.starCount * 3);
    const starColors = new Float32Array(GALAXY_CONFIG.particles.starCount * 3);
    
    const coreExclusionRadiusSq = GALAXY_CONFIG.core.exclusionRadius * GALAXY_CONFIG.core.exclusionRadius;

    for (let i = 0; i < GALAXY_CONFIG.particles.starCount; i++) {
        const i3 = i * 3;
        let x, y, z, distanceSq;
        do {
            x = (Math.random() - 0.5) * 3000;
            y = (Math.random() - 0.5) * 3000;
            z = (Math.random() - 0.5) * 3000;
            distanceSq = x * x + y * y + z * z;
        } while (distanceSq < coreExclusionRadiusSq);

        starPositions[i3] = x;
        starPositions[i3 + 1] = y;
        starPositions[i3 + 2] = z;

        const brightness = Math.random() * 0.5 + 0.5;
        starColors[i3] = brightness;
        starColors[i3 + 1] = brightness;
        starColors[i3 + 2] = brightness;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true }));
    scene.add(stars);

    const distantStarsGeometry = new THREE.BufferGeometry();
    const distantStarPositions = new Float32Array(GALAXY_CONFIG.particles.distantStarCount * 3);
    const distantStarColors = new Float32Array(GALAXY_CONFIG.particles.distantStarCount * 3);
    for (let i = 0; i < GALAXY_CONFIG.particles.distantStarCount; i++) {
        const i3 = i * 3;
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const radius = 4000 + Math.random() * 1000; 
        distantStarPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        distantStarPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        distantStarPositions[i3 + 2] = radius * Math.cos(phi);

        const brightness = Math.random() * 0.3 + 0.2; 
        distantStarColors[i3] = brightness;
        distantStarColors[i3 + 1] = brightness;
        distantStarColors[i3 + 2] = brightness;
    }
    distantStarsGeometry.setAttribute('position', new THREE.BufferAttribute(distantStarPositions, 3));
    distantStarsGeometry.setAttribute('color', new THREE.BufferAttribute(distantStarColors, 3));
    const distantStars = new THREE.Points(distantStarsGeometry, new THREE.PointsMaterial({ size: 1, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true }));
    scene.add(distantStars); 

    const handleMouseDown = (e) => {
      cameraState.isDragging = true;
      cameraState.previousMouseX = e.clientX;
      cameraState.previousMouseY = e.clientY;
      mountNode.style.cursor = 'grabbing';
    };
    const handleMouseMove = (e) => {
      if (!cameraState.isDragging) return;
      const deltaX = e.clientX - cameraState.previousMouseX;
      const deltaY = e.clientY - cameraState.previousMouseY;
      cameraState.targetTheta += deltaX * 0.5;
      cameraState.targetPhi = Math.max(GALAXY_CONFIG.camera.minPhi, Math.min(GALAXY_CONFIG.camera.maxPhi, cameraState.targetPhi - deltaY * 0.3));
      cameraState.previousMouseX = e.clientX;
      cameraState.previousMouseY = e.clientY;
    };
    const handleMouseUp = () => {
      cameraState.isDragging = false;
      mountNode.style.cursor = 'grab';
    };
    const handleWheel = (e) => {
      e.preventDefault();
      cameraState.targetRadius = Math.max(GALAXY_CONFIG.camera.minRadius, Math.min(GALAXY_CONFIG.camera.maxRadius, cameraState.targetRadius + e.deltaY * 0.5));
    };
    
    mountNode.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    mountNode.addEventListener('wheel', handleWheel);
    mountNode.style.cursor = 'grab';
    
    updateCameraPosition();

    const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        updateCameraPosition();
        galaxyGroup.rotation.y += GALAXY_CONFIG.rotation.galaxy;
        stars.rotation.y += GALAXY_CONFIG.rotation.stars;

        const time = Date.now() * 0.001;

        // Update planet marker visibility and animation
        if (selectedPlanet && planetMarkers.has(selectedPlanet.id)) {
            // Show only the selected planet's marker
            planetMarkers.forEach((marker, id) => {
                marker.visible = id === selectedPlanet.id;

                if (id === selectedPlanet.id) {
                    // Animate the selected marker to make it noticeable
                    const pulseScale = 1 + Math.sin(time * 3) * 0.2;
                    marker.scale.set(pulseScale, pulseScale, pulseScale);
                    marker.rotation.y += 0.02;
                    marker.rotation.x += 0.01;
                }
            });
        } else {
            // Hide all markers if no planet is selected
            planetMarkers.forEach(marker => {
                marker.visible = false;
            });
        }

        const coreScale = 1 + Math.sin(time) * 0.1;
        coreGlow.scale.set(coreScale, coreScale, coreScale);
        const outerScale = 1 + Math.sin(time * 0.8) * 0.05;
        outerGlow.scale.set(outerScale, outerScale, outerScale);

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (mountNode && renderer.domElement) {
         mountNode.removeChild(renderer.domElement);
      }
      
      mountNode.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      mountNode.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      planetMarkers.clear();
      planetPositions.clear();

      scene.traverse(object => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
              if (Array.isArray(object.material)) {
                  object.material.forEach(material => material.dispose());
              } else {
                  object.material.dispose();
              }
          }
      });
      renderer.dispose();
    };
  }, [updateCameraPosition]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
      <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      
      <FilterDashboard isOpen={isDashboardOpen} filters={filters} onFilterChange={handleFilterChange} />

      <PlanetList 
        isOpen={isPlanetListOpen} 
        planets={planets} 
        selectedPlanet={selectedPlanet}
        onPlanetSelect={handlePlanetSelect}
        filters={filters}
      />
      
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
            style={{
              pointerEvents: 'auto',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              backgroundColor: isDashboardOpen ? '#1e3a8a' : '#374151',
              color: 'white',
              zIndex: 20,
              transition: 'background-color 0.3s ease'
            }}
          >
          🔭 Filters
          </button>

          <button
            onClick={() => {
              setSelectedPlanet(null);
              if (cameraRef.current) {
                const { state } = cameraRef.current;
                // Reset camera to initial position and look at the center
                state.targetRadius = GALAXY_CONFIG.camera.initialRadius;
                state.targetTheta = 0;
                state.targetPhi = GALAXY_CONFIG.camera.initialPhi;
                state.targetLookAt = new THREE.Vector3(0, 0, 0); // --- MODIFIED: Reset look-at target ---
              }
            }}
            style={{
              pointerEvents: 'auto',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              backgroundColor: '#374151',
              color: 'white',
              zIndex: 20,
              marginLeft: '10px',
              transition: 'background-color 0.3s ease'
            }}
          >
            🏠 Reset View
          </button>
          
          <button
            onClick={() => setIsPlanetListOpen(!isPlanetListOpen)}
            style={{
              pointerEvents: 'auto',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              backgroundColor: isPlanetListOpen ? '#1e3a8a' : '#374151',
              color: 'white',
              zIndex: 20,
              transition: 'background-color 0.3s ease'
            }}
          >
          🪐 Planets
          </button>
      </div>


        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
            <div style={{ alignSelf: 'flex-start', pointerEvents: 'auto', marginLeft: isDashboardOpen ? 'max(25%, 350px)' : '0px', transition: 'margin-left 0.5s ease-in-out' }}>
            </div>
        
            <div style={{ alignSelf: 'flex-end' }}>
                <CameraInfoDisplay cameraStateRef={cameraRef} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default MilkyWayGalaxy;
