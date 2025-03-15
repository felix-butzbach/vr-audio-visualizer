import { setupScene, handleWindowResize } from './scene/setup';
import { createAudioContext, startMicrophoneVisualization, startAudioFileVisualization, stopMusic } from './utils/audio';

const { camera, renderer, visualization } = setupScene();
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

// Event listeners
window.addEventListener('resize', () => handleWindowResize(camera, renderer));

const toggleMusicButton = document.getElementById('toggleMusicButton');
toggleMusicButton?.addEventListener('click', toggleMusic);

const toggleSourceButton = document.getElementById('toggleSourceButton');
toggleSourceButton?.addEventListener('click', toggleAudioSource);

// Start animation loop
visualization.animate(renderer, camera, audioState);