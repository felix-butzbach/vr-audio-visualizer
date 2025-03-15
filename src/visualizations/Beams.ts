import * as THREE from 'three';
import { Visualization } from './Visualization.ts';

const BEAM_CONFIG = {
    BASE_RADIUS: 0.1,
    HEIGHT: 40,
    SEGMENTS: 32,
    COUNT: 64,
    SPACE_WIDTH: 20,
    DISTANCE_FROM_CAMERA: 20,
    VOLUME_THRESHOLD: 0.1
};

export class Beams extends Visualization {
    beams: THREE.Mesh[] = [];

    constructor(private scene: THREE.Scene) {
        super();
        this.setupBeams();
    }

    private createBeam(index: number): THREE.Mesh {
        const geometry = new THREE.CylinderGeometry(BEAM_CONFIG.BASE_RADIUS, BEAM_CONFIG.BASE_RADIUS, BEAM_CONFIG.HEIGHT, BEAM_CONFIG.SEGMENTS);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            transparent: true,
            shininess: 100,
        });

        const beam = new THREE.Mesh(geometry, material);

        // Position beams in front of the camera, distributed randomly
        const xPosition = (index / BEAM_CONFIG.COUNT) * 2 - 1; // -1 to 1
        beam.position.x = xPosition * BEAM_CONFIG.SPACE_WIDTH;
        beam.position.y = 0; // Centered vertically
        beam.position.z = -BEAM_CONFIG.DISTANCE_FROM_CAMERA;

        beam.userData = {
            baseRadius: BEAM_CONFIG.BASE_RADIUS,
        };

        return beam;
    }

    private setupBeams(): void {
        for (let i = 0; i < BEAM_CONFIG.COUNT; i++) {
            const beam = this.createBeam(i);
            this.scene.add(beam);
            this.beams.push(beam);
        }
    }

    animate(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, audioState: any): void {
        const animate = (): void => {
            if (audioState.analyser && (audioState.analyser as any).isConnected) {
                audioState.analyser.getByteFrequencyData(audioState.dataArray);

                // Update beams
                for (let i = 0; i < this.beams.length; i++) {
                    const beam = this.beams[i];
                    const volume = audioState.dataArray[i] / 255;

                    const maxRadius = beam.userData.baseRadius + volume * 8;
                    const radius = volume > BEAM_CONFIG.VOLUME_THRESHOLD ? maxRadius : beam.userData.baseRadius;
                    beam.scale.set(radius, 1, radius);
                }
            }

            renderer.render(this.scene, camera);
        };

        renderer.setAnimationLoop(animate);
    }
}
