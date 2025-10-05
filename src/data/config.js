// Static configuration for the galaxy visualization
export const GALAXY_CONFIG = {
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
    starCount: 12000,
    distantStarCount: 15000,
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