import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class DirectionIndicator {
    constructor(scene) {
        this.scene = scene;
        this.createArrow();
    }

    createArrow() {
        const geometry = new THREE.ConeGeometry(1, 2, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.arrow = new THREE.Mesh(geometry, material);
        this.arrow.position.y = 5;
        this.scene.add(this.arrow);
    }

    update(playerPosition, track) {
        // Find next track point and point arrow towards it
        const nextPoint = track.getNextPoint(playerPosition);
        if (nextPoint) {
            this.arrow.position.x = playerPosition.x;
            this.arrow.position.z = playerPosition.z;
            this.arrow.lookAt(nextPoint);
        }
    }

    reset() {
        if (this.arrow) {
            // Reset arrow position and rotation
            this.arrow.position.set(0, 5, 0);
            this.arrow.rotation.set(0, 0, 0);
        }
    }
}
