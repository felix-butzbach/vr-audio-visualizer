import { setupScene, handleWindowResize } from './scene/setup';
import { createAudioContext, startMicrophoneVisualization, startAudioFileVisualization, stopMusic } from './utils/audio';

const { camera, renderer, visualization } = setupScene();
const audioState = createAudioContext();

function toggleVisualization(): void {
  const toggleVisualizationButton = document.getElementById('toggleVisualizationButton');
  if (!toggleVisualizationButton) return;

  if (audioState.context.state === 'suspended') {
    audioState.context.resume();
  }

  if (!(audioState.analyser as any).isConnected) {
    if (audioState.isUsingMicrophone) {
      startMicrophoneVisualization(audioState);
    } else {
      startAudioFileVisualization(audioState);
    }
    toggleVisualizationButton.textContent = 'Stop Visualization';
  } else {
    stopMusic(audioState);
    toggleVisualizationButton.textContent = 'Start Visualization';
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
    toggleVisualization();
  }
}

// Event listeners
window.addEventListener('resize', () => handleWindowResize(camera, renderer));

const toggleVisualizationButton = document.getElementById('toggleVisualizationButton');
toggleVisualizationButton?.addEventListener('click', toggleVisualization);

const toggleSourceButton = document.getElementById('toggleSourceButton');
toggleSourceButton?.addEventListener('click', toggleAudioSource);

// Start animation loop
visualization.animate(renderer, camera, audioState);