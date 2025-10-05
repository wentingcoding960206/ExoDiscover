import * as THREE from 'three';
import { GALAXY_CONFIG } from '../data/config';

export const createPlanetMarker = () => {
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9,
  });
  const marker = new THREE.Mesh(geometry, material);
  
  const glowGeometry = new THREE.BoxGeometry(30, 30, 30);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffed4e,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  marker.add(glow);
  
  return marker;
};

export const generatePlanetPosition = () => {
  const armIndex = Math.floor(Math.random() * 4);
  const armOffset = armIndex * Math.PI * 0.5;
  
  const t = Math.random() * 0.7 + 0.2;
  const angle = t * Math.PI * 4 + armOffset;
  const radius = GALAXY_CONFIG.particles.armMinRadius + 
                 t * (GALAXY_CONFIG.particles.armMaxRadius - GALAXY_CONFIG.particles.armMinRadius);
  
  const randomOffset = 30;
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * randomOffset;
  const z = Math.sin(angle) * radius + (Math.random() - 0.5) * randomOffset;
  const y = (Math.random() - 0.5) * 20;
  
  return new THREE.Vector3(x, y, z);
};

export const createSpiralArm = (angleOffset, colorHue) => {
  const config = GALAXY_CONFIG.particles;
  const positions = new Float32Array(config.armCount * 3);
  const colors = new Float32Array(config.armCount * 3);
  
  for (let i = 0; i < config.armCount; i++) {
    const i3 = i * 3;
    const t = i / config.armCount;
    const angle = t * Math.PI * 6 + angleOffset;
    const radius = config.armMinRadius + t * (config.armMaxRadius - config.armMinRadius);
    
    const armCurve = Math.sin(t * Math.PI * 2) * 30;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 25 + armCurve * (1 - t);
    
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    const color = new THREE.Color();
    if (Math.random() < config.whiteStarProbability) {
      color.setHex(0xffffff);
    } else {
      const dist = Math.sqrt(x * x + z * z) / config.armMaxRadius;
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