import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Spheres } from '../visualizations/Spheres';
import { Visualization } from '../visualizations/Visualization';

export function setupScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  visualization: Visualization;
} {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const visualization = new Spheres(scene);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 0, 5);
  scene.add(pointLight);

  return { scene, camera, renderer, visualization };
}

export function handleWindowResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}