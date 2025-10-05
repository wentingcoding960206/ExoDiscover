import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GALAXY_CONFIG } from '../data/config';
import { createPlanetMarker, generatePlanetPosition, createSpiralArm } from '../utils/threeUtils';

const planetMarkers = new Map();
const planetPositions = new Map();

export const useGalaxyScene = (mountRef, selectedPlanet, allPlanets) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const galaxyGroupRef = useRef(null);
  const starsRef = useRef(null);

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { camera, state } = cameraRef.current;
    
    state.theta += (state.targetTheta - state.theta) * GALAXY_CONFIG.smoothingFactor;
    state.phi += (state.targetPhi - state.phi) * GALAXY_CONFIG.smoothingFactor;
    state.radius += (state.targetRadius - state.radius) * GALAXY_CONFIG.smoothingFactor;
    state.lookAt.lerp(state.targetLookAt, GALAXY_CONFIG.smoothingFactor);

    const radTheta = (state.theta * Math.PI) / 180;
    const radPhi = (state.phi * Math.PI) / 180;

    camera.position.x = state.lookAt.x + state.radius * Math.sin(radPhi) * Math.cos(radTheta);
    camera.position.y = state.lookAt.y + state.radius * Math.cos(radPhi);
    camera.position.z = state.lookAt.z + state.radius * Math.sin(radPhi) * Math.sin(radTheta);
    
    camera.lookAt(state.lookAt);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mountNode = mountRef.current;

    // --- One-time Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
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
      lookAt: new THREE.Vector3(0, 0, 0),
      targetLookAt: new THREE.Vector3(0, 0, 0),
    };
    cameraRef.current = { camera, state: cameraState };
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountNode.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Galaxy Objects ---
    const galaxyGroup = new THREE.Group();
    galaxyGroupRef.current = galaxyGroup;
    scene.add(galaxyGroup);

    // Planet Markers
    const planetsGroup = new THREE.Group();
    galaxyGroup.add(planetsGroup);
    allPlanets.forEach(planet => {
        let position = planetPositions.get(planet.id);
        if (!position) {
            position = generatePlanetPosition();
            planetPositions.set(planet.id, position);
        }
        const marker = createPlanetMarker();
        marker.position.copy(position);
        marker.visible = false;
        planetMarkers.set(planet.id, marker);
        planetsGroup.add(marker);
    });

    // Core
    const core = new THREE.Mesh(new THREE.SphereGeometry(GALAXY_CONFIG.core.baseSize, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 }));
    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(GALAXY_CONFIG.core.glow1Size, 32, 32), new THREE.MeshBasicMaterial({ color: 0x9333ea, transparent: true, opacity: 0.25 }));
    const outerGlow = new THREE.Mesh(new THREE.SphereGeometry(GALAXY_CONFIG.core.glow2Size, 32, 32), new THREE.MeshBasicMaterial({ color: 0x4a0080, transparent: true, opacity: 0.1 }));
    scene.add(core, coreGlow, outerGlow);
    
    // Spiral Arms
    const arms = [
        createSpiralArm(0, 0.6),
        createSpiralArm(Math.PI, 0.8),
        createSpiralArm(Math.PI * 0.5, 0.75),
        createSpiralArm(Math.PI * 1.5, 0.65),
    ];
    arms.forEach(arm => galaxyGroup.add(arm));

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(GALAXY_CONFIG.particles.starCount * 3);
    for (let i = 0; i < GALAXY_CONFIG.particles.starCount; i++) {
        starPositions[i*3] = (Math.random() - 0.5) * 3000;
        starPositions[i*3+1] = (Math.random() - 0.5) * 3000;
        starPositions[i*3+2] = (Math.random() - 0.5) * 3000;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.8, color: 0xffffff, transparent: true, opacity: 0.9, sizeAttenuation: true }));
    starsRef.current = stars;
    scene.add(stars);

    // --- Animation Loop ---
    const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        updateCameraPosition();
        
        galaxyGroupRef.current.rotation.y += GALAXY_CONFIG.rotation.galaxy;
        starsRef.current.rotation.y += GALAXY_CONFIG.rotation.stars;

        const time = Date.now() * 0.001;
        const currentSelected = selectedPlanet; // Capture value for this frame

        planetMarkers.forEach((marker, id) => {
            const isSelected = currentSelected?.id === id;
            marker.visible = isSelected;
            if (isSelected) {
                const pulseScale = 1 + Math.sin(time * 3) * 0.2;
                marker.scale.set(pulseScale, pulseScale, pulseScale);
                marker.rotation.y += 0.02;
                marker.rotation.x += 0.01;
            }
        });

        const coreScale = 1 + Math.sin(time) * 0.1;
        coreGlow.scale.set(coreScale, coreScale, coreScale);
        const outerScale = 1 + Math.sin(time * 0.8) * 0.05;
        outerGlow.scale.set(outerScale, outerScale, outerScale);

        renderer.render(scene, camera);
    };
    animate();

    // --- Event Handlers ---
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
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    mountNode.style.cursor = 'grab';
    mountNode.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    mountNode.addEventListener('wheel', handleWheel);
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(frameRef.current);
      mountNode.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      mountNode.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
         mountNode.removeChild(renderer.domElement);
      }
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
  }, [allPlanets, mountRef, updateCameraPosition]); // Only runs once on mount

  // --- Effect to handle camera changes on planet selection ---
  useEffect(() => {
    if (cameraRef.current) {
        const { state } = cameraRef.current;
        if (selectedPlanet) {
            const position = planetPositions.get(selectedPlanet.id);
            if (position) {
                state.targetLookAt = position.clone();
                state.targetRadius = 100;
                const targetThetaRad = Math.atan2(position.z, position.x) + Math.PI / 4;
                state.targetTheta = THREE.MathUtils.radToDeg(targetThetaRad);
                state.targetPhi = 75;
            }
        } else {
            // Reset view
            state.targetRadius = GALAXY_CONFIG.camera.initialRadius;
            state.targetTheta = 0;
            state.targetPhi = GALAXY_CONFIG.camera.initialPhi;
            state.targetLookAt = new THREE.Vector3(0, 0, 0);
        }
    }
  }, [selectedPlanet]);

  return { cameraStateRef: cameraRef };
};