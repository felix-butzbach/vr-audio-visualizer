import * as THREE from 'three';
import { setupScene, handleWindowResize } from './scene/setup';
import { createAudioContext, startMicrophoneVisualization, startAudioFileVisualization, stopMusic } from './utils/audio';
import { createCopySphere } from './utils/sphere';
import { AUDIO_CONFIG } from './config/constants.ts';

const { scene, camera, renderer, spheres } = setupScene();
const copySpheres: THREE.Mesh[] = [];
const audioState = createAudioContext();

function toggleMusic(): void {
  const toggleMusicButton = document.getElementById('toggleMusicButton');
  if (!toggleMusicButton) return;

  if (audioState.context.state === 'suspended') {
    audioState.context.resume();
  }

  if (!(audioState.analyser as any).isConnected) {
    if (audioState.isUsingMicrophone) {
      startMicrophoneVisualization(audioState);
    } else {
      startAudioFileVisualization(audioState);
    }
    toggleMusicButton.textContent = 'Stop Music';
  } else {
    stopMusic(audioState);
    toggleMusicButton.textContent = 'Start Music';
  }
}

function toggleAudioSource(): void {
  audioState.isUsingMicrophone = !audioState.isUsingMicrophone;
  const toggleSourceButton = document.getElementById('toggleSourceButton');
  if (!toggleSourceButton) return;

  toggleSourceButton.textContent = audioState.isUsingMicrophone
    ? 'Use Audio File'
    : 'Use Microphone';

  if ((audioState.analyser as any).isConnected) {
    stopMusic(audioState);
    toggleMusic();
  }
}

function animate(): void {
  if (audioState.analyser && (audioState.analyser as any).isConnected) {
    audioState.analyser.getByteFrequencyData(audioState.dataArray);
    const time = Date.now() * 0.001;

    // Update spheres
    for (let i = 0; i < spheres.length; i++) {
      const sphere = spheres[i];
      const volume = audioState.dataArray[i] / 255;

      const maxScale = sphere.userData.baseScale + volume * 8;
      const scale = volume > AUDIO_CONFIG.THRESHOLD ? maxScale : sphere.userData.baseScale;
      sphere.scale.set(scale, scale, scale);

      if (scale > maxScale * AUDIO_CONFIG.COPY_SPHERE_THRESHOLD &&
        Math.random() < AUDIO_CONFIG.COPY_SPHERE_CHANCE) {
        const copySphere = createCopySphere(sphere);
        scene.add(copySphere);
        copySpheres.push(copySphere);
      }

      const angle = time * sphere.userData.rotationSpeed;
      const radius = sphere.userData.initialPosition.length();
      sphere.position.x = Math.cos(angle) * radius;
      sphere.position.z = Math.sin(angle) * radius;
      sphere.position.y = sphere.userData.initialPosition.y;
    }

    // Update copy spheres
    for (let i = copySpheres.length - 1; i >= 0; i--) {
      const copySphere = copySpheres[i];
      const userData = copySphere.userData;
      if (!userData.fadeStartTime || !userData.fadeDuration) continue;

      const elapsedTime = Date.now() - userData.fadeStartTime;
      const fadeProgress = elapsedTime / userData.fadeDuration;

      if (fadeProgress >= 1) {
        scene.remove(copySphere);
        copySpheres.splice(i, 1);
      } else if (copySphere.material instanceof THREE.MeshPhongMaterial) {
        copySphere.material.opacity = (userData.initialOpacity || 0) * (1 - fadeProgress);
      }
    }
  }

  renderer.render(scene, camera);
}

// Event listeners
window.addEventListener('resize', () => handleWindowResize(camera, renderer));

const toggleMusicButton = document.getElementById('toggleMusicButton');
toggleMusicButton?.addEventListener('click', toggleMusic);

const toggleSourceButton = document.getElementById('toggleSourceButton');
toggleSourceButton?.addEventListener('click', toggleAudioSource);

// Start animation loop
renderer.setAnimationLoop(animate);