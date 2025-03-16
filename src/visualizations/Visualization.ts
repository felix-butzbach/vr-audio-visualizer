import * as THREE from 'three';

export abstract class Visualization {
    abstract animate(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, audioState: AudioState): void;
}
