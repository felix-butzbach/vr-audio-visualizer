import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let analyser: AnalyserNode;
let dataArray: Uint8Array;
const spheres: THREE.Mesh[] = [];
const copySpheres: THREE.Mesh[] = [];

interface SphereUserData {
  baseScale: number;
  initialPosition: THREE.Vector3;
  rotationSpeed: number;
  fadeStartTime?: number;
  fadeDuration?: number;
  initialOpacity?: number;
}

const audio = new Audio(
  'https://cdn.pixabay.com/audio/2024/09/27/audio_8cb2279810.mp3'
);
audio.crossOrigin = 'anonymous';

let audioContext: AudioContext;
let audioSource: MediaElementAudioSourceNode;
let microphoneSource: MediaStreamAudioSourceNode | null = null;
let isUsingMicrophone = false;

function init(): void {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Enable VR
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  // Create spheres
  const geometry = new THREE.SphereGeometry(0.05, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    shininess: 100,
  });

  for (let i = 0; i < 256; i++) {
    const sphere = new THREE.Mesh(geometry, material.clone());

    // Distribute spheres in a 3D space using spherical coordinates
    const phi = Math.acos(-1 + (2 * i) / 128);
    const theta = Math.sqrt(128 * Math.PI) * phi;

    const radius = 1 + Math.random() * 2;
    sphere.position.x = radius * Math.sin(phi) * Math.cos(theta);
    sphere.position.y = radius * Math.sin(phi) * Math.sin(theta);
    sphere.position.z = radius * Math.cos(phi);

    // Random color (red to green gradient)
    const t = sphere.position.x / (2 * radius); // Normalized position (0 to 1)
    const r = Math.max(0, Math.min(1, 1 - t * 2)); // Red component (1 to 0)
    const g = Math.max(0, Math.min(1, t * 2)); // Green component (0 to 1)
    const color = new THREE.Color(r, g, 0);
    (sphere.material as THREE.MeshPhongMaterial).color = color;

    sphere.userData = {
      baseScale: 0.05,
      initialPosition: sphere.position.clone(),
      rotationSpeed: 0.1 + Math.random() * 0.02,
    } as SphereUserData;
    
    scene.add(sphere);
    spheres.push(sphere);
  }

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 0, 5);
  scene.add(pointLight);

  // Set up audio context and analyser
  audioContext = new (window.AudioContext || (window as Window & typeof globalThis & {webkitAudioContext: typeof AudioContext}).webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512; // Increased to 512 to get 256 frequency bins
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Create audio source
  audioSource = audioContext.createMediaElementSource(audio);

  // Start button
  const startButton = document.getElementById('startButton');
  startButton?.addEventListener('click', toggleVisualization);

  // Toggle source button
  const toggleSourceButton = document.getElementById('toggleSourceButton');
  toggleSourceButton?.addEventListener('click', toggleAudioSource);

  // Set up animation loop
  renderer.setAnimationLoop(animate);

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

function toggleVisualization(): void {
  const startButton = document.getElementById('startButton');
  if (!startButton) return;

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  if (!(analyser as any).isConnected) {
    if (isUsingMicrophone) {
      startMicrophoneVisualization();
    } else {
      startAudioFileVisualization();
    }
    startButton.textContent = 'Stop Visualization';
  } else {
    stopVisualization();
    startButton.textContent = 'Start Visualization';
  }
}

function toggleAudioSource(): void {
  isUsingMicrophone = !isUsingMicrophone;
  const toggleSourceButton = document.getElementById('toggleSourceButton');
  if (!toggleSourceButton) return;

  toggleSourceButton.textContent = isUsingMicrophone
    ? 'Use Audio File'
    : 'Use Microphone';

  if ((analyser as any).isConnected) {
    stopVisualization();
    toggleVisualization();
  }
}

function startMicrophoneVisualization(): void {
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      microphoneSource = audioContext.createMediaStreamSource(stream);
      microphoneSource.connect(analyser);
      analyser.connect(audioContext.destination);
      (analyser as any).isConnected = true;
    })
    .catch((err) => {
      console.error('Error accessing microphone:', err);
    });
}

function startAudioFileVisualization(): void {
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);
  audio.play();
  (analyser as any).isConnected = true;
}

function stopVisualization(): void {
  if (isUsingMicrophone && microphoneSource) {
    microphoneSource.disconnect();
  } else {
    audioSource.disconnect();
    audio.pause();
    audio.currentTime = 0;
  }
  analyser.disconnect();
  (analyser as any).isConnected = false;
}

function createCopySphere(originalSphere: THREE.Mesh): void {
  const copySphere = originalSphere.clone();
  copySphere.material = (originalSphere.material as THREE.Material).clone();
  copySphere.userData = {
    ...originalSphere.userData,
    fadeStartTime: Date.now(),
    fadeDuration: 2000, // 2 seconds fade duration
    initialOpacity: (originalSphere.material as THREE.MeshPhongMaterial).opacity * 0.6, // Start at 60% of the original opacity
  } as SphereUserData;
  
  if (copySphere.material instanceof THREE.MeshPhongMaterial) {
    copySphere.material.opacity = copySphere.userData.initialOpacity || 0;
  }
  
  scene.add(copySphere);
  copySpheres.push(copySphere);
}

function animate(): void {
  if (analyser && (analyser as any).isConnected) {
    analyser.getByteFrequencyData(dataArray);

    const time = Date.now() * 0.001;

    for (let i = 0; i < spheres.length; i++) {
      const sphere = spheres[i];
      const volume = dataArray[i] / 255;

      // Apply a threshold to make spheres invisible when audio is very low
      const threshold = 0.05;
      const maxScale = (sphere.userData as SphereUserData).baseScale + volume * 8;
      const scale = volume > threshold ? maxScale : (sphere.userData as SphereUserData).baseScale;

      sphere.scale.set(scale, scale, scale);

      // Create a copy when close to max size
      if (scale > maxScale * 0.9 && Math.random() < 0.1) {
        createCopySphere(sphere);
      }

      // Rotation in x-z plane
      const angle = time * (sphere.userData as SphereUserData).rotationSpeed;
      const radius = (sphere.userData as SphereUserData).initialPosition.length();
      sphere.position.x = Math.cos(angle) * radius;
      sphere.position.z = Math.sin(angle) * radius;
      sphere.position.y = (sphere.userData as SphereUserData).initialPosition.y;
    }

    // Update and remove fading copy spheres
    for (let i = copySpheres.length - 1; i >= 0; i--) {
      const copySphere = copySpheres[i];
      const userData = copySphere.userData as SphereUserData;
      if (!userData.fadeStartTime || !userData.fadeDuration) continue;

      const elapsedTime = Date.now() - userData.fadeStartTime;
      const fadeProgress = elapsedTime / userData.fadeDuration;

      if (fadeProgress >= 1) {
        scene.remove(copySphere);
        copySpheres.splice(i, 1);
      } else if (copySphere.material instanceof THREE.MeshPhongMaterial) {
        copySphere.material.opacity =
          (userData.initialOpacity || 0) * (1 - fadeProgress);
      }
    }
  }

  renderer.render(scene, camera);
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();