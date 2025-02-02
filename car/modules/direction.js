import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class DirectionIndicator {
    constructor(scene) {
        this.scene = scene;
        this.createArrow();
    }

    createArrow() {
        // Create a more visible direction indicator
        const arrowGroup = new THREE.Group();
        
        // Arrow body
        const bodyGeometry = new THREE.BoxGeometry(3, 0.3, 0.3);
        const arrowBody = new THREE.Mesh(
            bodyGeometry,
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        
        // Arrow head
        const headGeometry = new THREE.ConeGeometry(0.6, 1.5, 8);
        const arrowHead = new THREE.Mesh(
            headGeometry,
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        arrowHead.position.x = 2;
        arrowHead.rotation.z = -Math.PI / 2;
        
        arrowGroup.add(arrowBody);
        arrowGroup.add(arrowHead);
        
        this.arrow = arrowGroup;
        this.arrow.position.y = 2; // Lower height, just above car
        this.scene.add(this.arrow);
    }

    update(playerPosition, track) {
        const nextPoint = track.getNextPoint(playerPosition);
        if (nextPoint) {
            // Calculate position on larger circle around player
            const directionToNext = new THREE.Vector3()
                .subVectors(nextPoint, playerPosition)
                .normalize();
            
            // Position arrow 30 units ahead of player (3x car length)
            this.arrow.position.x = playerPosition.x + directionToNext.x * 30;
            this.arrow.position.z = playerPosition.z + directionToNext.z * 30;
            this.arrow.position.y = 2;
            
            // Make arrow look towards next point
            this.arrow.lookAt(nextPoint.x, 2, nextPoint.z);
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
