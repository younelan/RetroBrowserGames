import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class DirectionIndicator {
    constructor(scene) {
        this.scene = scene;
        this.arrows = [];
        this.trackRadius = 80;
        this.direction = 1; // 1 for clockwise, -1 for counterclockwise
        this.createArrows();
    }

    createArrows() {
        const arrowCount = 16;
        
        for (let i = 0; i < arrowCount; i++) {
            const angle = (i / arrowCount) * Math.PI * 2;
            const x = Math.cos(angle) * (this.trackRadius - 8);
            const z = Math.sin(angle) * (this.trackRadius - 8);
            
            const arrow = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 2),
                new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );
            
            arrow.position.set(x, 0.5, z);
            arrow.rotation.x = -Math.PI / 2;
            arrow.rotation.z = angle + Math.PI / 2;
            
            this.scene.add(arrow);
            this.arrows.push(arrow);
        }
    }

    update(playerPosition) {
        const playerAngle = Math.atan2(playerPosition.z, playerPosition.x);
        
        this.arrows.forEach(arrow => {
            const arrowAngle = Math.atan2(arrow.position.z, arrow.position.x);
            const angleDiff = (arrowAngle - playerAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
            
            if (this.direction > 0) {  // Clockwise
                arrow.material.opacity = angleDiff > 0 ? 0.8 : 0.2;
            } else {  // Counter-clockwise
                arrow.material.opacity = angleDiff < 0 ? 0.8 : 0.2;
            }
        });
    }
}
