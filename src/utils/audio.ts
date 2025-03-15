import { AudioState } from '../types';
import { AUDIO_CONFIG } from '../config/constants.ts';

export function createAudioContext(): AudioState {
  const audio = new Audio(AUDIO_CONFIG.AUDIO_URL);
  audio.crossOrigin = 'anonymous';

  const context = new (window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext: AudioContext }).webkitAudioContext)();
  const analyser = context.createAnalyser();
  analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
  
  const source = context.createMediaElementSource(audio);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  return {
    context,
    analyser,
    source,
    microphoneSource: null,
    isUsingMicrophone: false,
    dataArray
  };
}

export function startMicrophoneVisualization(audioState: AudioState): Promise<void> {
  return navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      audioState.microphoneSource = audioState.context.createMediaStreamSource(stream);
      audioState.microphoneSource.connect(audioState.analyser);
      audioState.analyser.connect(audioState.context.destination);
      (audioState.analyser as any).isConnected = true;
    })
    .catch((err) => {
      console.error('Error accessing microphone:', err);
    });
}

export function startAudioFileVisualization(audioState: AudioState): void {
  audioState.source.connect(audioState.analyser);
  audioState.analyser.connect(audioState.context.destination);
  (audioState.source.mediaElement as HTMLAudioElement).play();
  (audioState.analyser as any).isConnected = true;
}

export function stopVisualization(audioState: AudioState): void {
  if (audioState.isUsingMicrophone && audioState.microphoneSource) {
    audioState.microphoneSource.disconnect();
  } else {
    audioState.source.disconnect();
    const audio = audioState.source.mediaElement as HTMLAudioElement;
    audio.pause();
    audio.currentTime = 0;
  }
  audioState.analyser.disconnect();
  (audioState.analyser as any).isConnected = false;
}