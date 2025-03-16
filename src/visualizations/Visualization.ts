import * as THREE from 'three';
import { AudioState } from '../types/index.ts';

export abstract class Visualization {
    abstract animate(
        renderer: THREE.WebGLRenderer, 
        camera: THREE.PerspectiveCamera, 
        audioState: AudioState
    ): void;
}
