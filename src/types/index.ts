export interface SphereUserData {
    baseScale: number;
    initialPosition: THREE.Vector3;
    rotationSpeed: number;
    fadeStartTime?: number;
    fadeDuration?: number;
    initialOpacity?: number;
  }
  
  export interface AudioState {
    context: AudioContext;
    analyser: AnalyserNode;
    source: MediaElementAudioSourceNode;
    microphoneSource: MediaStreamAudioSourceNode | null;
    isUsingMicrophone: boolean;
    dataArray: Uint8Array;
  }