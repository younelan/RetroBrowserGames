import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Collectibles {
    constructor(scene, track) {
        this.scene = scene;
        this.track = track;
        this.items = [];
        // Wait for next frame to ensure track is initialized
        requestAnimationFrame(() => this.createCollectibles());
    }

    createCollectibles() {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 10; i++) {
            const coin = new THREE.Mesh(geometry, material);
            const angle = (i / 10) * Math.PI * 2;
            // Use track width to calculate radius if centerRadius isn't available
            const radius = this.track.centerRadius || (this.track.radius - this.track.width/2);
            coin.position.set(
                Math.cos(angle) * radius,
                2,
                Math.sin(angle) * radius
            );
            this.scene.add(coin);
            this.items.push(coin);
        }
    }

    checkCollisions(playerPosition) {
        let score = 0;
        this.items.forEach((item, index) => {
            if (item.visible && this.distance(playerPosition, item.position) < 3) {
                item.visible = false;
                score += 10;
            }
        });
        return score;
    }

    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    update(deltaTime, track) {
        this.items.forEach(item => {
            if (item.visible) {
                item.rotation.y += deltaTime;
            }
        });
    }

    reset() {
        this.items.forEach(item => {
            item.visible = true;
            const angle = Math.random() * Math.PI * 2;
            const radius = this.track.centerRadius;
            item.position.set(
                Math.cos(angle) * radius,
                2,
                Math.sin(angle) * radius
            );
        });
    }
}
