import * as THREE from 'three';
import { SphereUserData } from '../types';
import { SPHERE_CONFIG, FADE_CONFIG } from '../config/constants.ts';

export function createSphere(index: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(SPHERE_CONFIG.BASE_SCALE, SPHERE_CONFIG.SEGMENTS, SPHERE_CONFIG.SEGMENTS);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    shininess: 100,
  });

  const sphere = new THREE.Mesh(geometry, material.clone());

  // Position using spherical coordinates
  const phi = Math.acos(-1 + (2 * index) / SPHERE_CONFIG.COUNT);
  const theta = Math.sqrt(SPHERE_CONFIG.COUNT * Math.PI) * phi;

  const radius = SPHERE_CONFIG.BASE_RADIUS + Math.random() * SPHERE_CONFIG.MAX_RADIUS_ADDON;
  sphere.position.x = radius * Math.sin(phi) * Math.cos(theta);
  sphere.position.y = radius * Math.sin(phi) * Math.sin(theta);
  sphere.position.z = radius * Math.cos(phi);

  // Color gradient
  const t = sphere.position.x / (2 * radius);
  const r = Math.max(0, Math.min(1, 1 - t * 2));
  const g = Math.max(0, Math.min(1, t * 2));
  const color = new THREE.Color(r, g, 0);
  (sphere.material as THREE.MeshPhongMaterial).color = color;

  sphere.userData = {
    baseScale: SPHERE_CONFIG.BASE_SCALE,
    initialPosition: sphere.position.clone(),
    rotationSpeed: SPHERE_CONFIG.MIN_ROTATION_SPEED + Math.random() * SPHERE_CONFIG.MAX_ROTATION_SPEED_ADDON,
  } as SphereUserData;

  return sphere;
}

export function createCopySphere(originalSphere: THREE.Mesh): THREE.Mesh {
  const copySphere = originalSphere.clone();
  copySphere.material = (originalSphere.material as THREE.Material).clone();
  copySphere.userData = {
    ...originalSphere.userData,
    fadeStartTime: Date.now(),
    fadeDuration: FADE_CONFIG.DURATION,
    initialOpacity: (originalSphere.material as THREE.MeshPhongMaterial).opacity * FADE_CONFIG.OPACITY_MULTIPLIER,
  } as SphereUserData;
  
  if (copySphere.material instanceof THREE.MeshPhongMaterial) {
    copySphere.material.opacity = copySphere.userData.initialOpacity || 0;
  }
  
  return copySphere;
}