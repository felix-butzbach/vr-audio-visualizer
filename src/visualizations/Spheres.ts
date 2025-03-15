import * as THREE from 'three';
import { SPHERE_CONFIG, AUDIO_CONFIG, FADE_CONFIG } from '../config/constants.ts';
import { SphereUserData } from '../types/index.ts';

export class Spheres {
    spheres: THREE.Mesh[] = [];
    copySpheres: THREE.Mesh[] = [];

    constructor(private scene: THREE.Scene) {
        this.setupSpheres();
    }

    private createSphere(index: number): THREE.Mesh {
        const geometry = new THREE.SphereGeometry(SPHERE_CONFIG.BASE_SCALE, SPHERE_CONFIG.SEGMENTS, SPHERE_CONFIG.SEGMENTS);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            shininess: 100,
        });

        const sphere = new THREE.Mesh(geometry, material.clone());

        // Position using spherical coordinates
        const phi = Math.acos(-1 + (2 * index) / SPHERE_CONFIG.COUNT);
        const theta = Math.sqrt(SPHERE_CONFIG.COUNT * Math.PI) * phi;

        const radius = SPHERE_CONFIG.BASE_RADIUS + Math.random() * SPHERE_CONFIG.MAX_RADIUS_ADDON;
        sphere.position.x = radius * Math.sin(phi) * Math.cos(theta);
        sphere.position.y = radius * Math.sin(phi) * Math.sin(theta);
        sphere.position.z = radius * Math.cos(phi);

        // Color gradient
        const t = sphere.position.x / (2 * radius);
        const r = Math.max(0, Math.min(1, 1 - t * 2));
        const g = Math.max(0, Math.min(1, t * 2));
        const color = new THREE.Color(r, g, 0);
        (sphere.material as THREE.MeshPhongMaterial).color = color;

        sphere.userData = {
            baseScale: SPHERE_CONFIG.BASE_SCALE,
            initialPosition: sphere.position.clone(),
            rotationSpeed: SPHERE_CONFIG.MIN_ROTATION_SPEED + Math.random() * SPHERE_CONFIG.MAX_ROTATION_SPEED_ADDON,
        } as SphereUserData;

        return sphere;
    }

    private createCopySphere(originalSphere: THREE.Mesh): THREE.Mesh {
        const copySphere = originalSphere.clone();
        copySphere.material = (originalSphere.material as THREE.Material).clone();
        copySphere.userData = {
            ...originalSphere.userData,
            fadeStartTime: Date.now(),
            fadeDuration: FADE_CONFIG.DURATION,
            initialOpacity: (originalSphere.material as THREE.MeshPhongMaterial).opacity * FADE_CONFIG.OPACITY_MULTIPLIER,
        } as SphereUserData;

        if (copySphere.material instanceof THREE.MeshPhongMaterial) {
            copySphere.material.opacity = copySphere.userData.initialOpacity || 0;
        }

        return copySphere;
    }

    private setupSpheres(): void {
        for (let i = 0; i < SPHERE_CONFIG.COUNT; i++) {
            const sphere = this.createSphere(i);
            this.scene.add(sphere);
            this.spheres.push(sphere);
        }
    }

    animate(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, audioState: any): void {
        const animate = (): void => {
            if (audioState.analyser && (audioState.analyser as any).isConnected) {
                audioState.analyser.getByteFrequencyData(audioState.dataArray);
                const time = Date.now() * 0.001;

                // Update spheres
                for (let i = 0; i < this.spheres.length; i++) {
                    const sphere = this.spheres[i];
                    const volume = audioState.dataArray[i] / 255;

                    const maxScale = sphere.userData.baseScale + volume * 8;
                    const scale = volume > AUDIO_CONFIG.THRESHOLD ? maxScale : sphere.userData.baseScale;
                    sphere.scale.set(scale, scale, scale);

                    if (scale > maxScale * AUDIO_CONFIG.COPY_SPHERE_THRESHOLD &&
                        Math.random() < AUDIO_CONFIG.COPY_SPHERE_CHANCE) {
                        const copySphere = this.createCopySphere(sphere);
                        this.scene.add(copySphere);
                        this.copySpheres.push(copySphere);
                    }

                    const angle = time * sphere.userData.rotationSpeed;
                    const radius = sphere.userData.initialPosition.length();
                    sphere.position.x = Math.cos(angle) * radius;
                    sphere.position.z = Math.sin(angle) * radius;
                    sphere.position.y = sphere.userData.initialPosition.y;
                }

                // Update copy spheres
                for (let i = this.copySpheres.length - 1; i >= 0; i--) {
                    const copySphere = this.copySpheres[i];
                    const userData = copySphere.userData;
                    if (!userData.fadeStartTime || !userData.fadeDuration) continue;

                    const elapsedTime = Date.now() - userData.fadeStartTime;
                    const fadeProgress = elapsedTime / userData.fadeDuration;

                    if (fadeProgress >= 1) {
                        this.scene.remove(copySphere);
                        this.copySpheres.splice(i, 1);
                    } else if (copySphere.material instanceof THREE.MeshPhongMaterial) {
                        copySphere.material.opacity = (userData.initialOpacity || 0) * (1 - fadeProgress);
                    }
                }
            }

            renderer.render(this.scene, camera);
        };

        renderer.setAnimationLoop(animate);
    }
}
