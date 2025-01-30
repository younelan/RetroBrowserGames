import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Collectibles {
    constructor(scene) {
        this.scene = scene;
        this.items = [];
        this.trackRadius = 80;
        this.createCollectibles();
    }

    createCollectibles() {
        const collectibleCount = 12;
        const textureLoader = new THREE.TextureLoader();
        const coinTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/disc.png');
        
        for (let i = 0; i < collectibleCount; i++) {
            const angle = (i / collectibleCount) * Math.PI * 2;
            const x = Math.cos(angle) * (this.trackRadius - 8);
            const z = Math.sin(angle) * (this.trackRadius - 8);
            
            const collectible = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 3),
                new THREE.MeshBasicMaterial({
                    map: coinTexture,
                    color: 0xFFD700,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                })
            );
            
            collectible.position.set(x, 1, z);
            collectible.rotation.x = -Math.PI / 2;
            collectible.rotation.z = angle;
            collectible.userData.collected = false;
            
            this.scene.add(collectible);
            this.items.push(collectible);
        }
    }

    update(deltaTime) {
        this.items.forEach(coin => {
            if (!coin.userData.collected) {
                coin.rotation.z += deltaTime * 2;
            }
        });
    }

    checkCollisions(playerPosition) {
        let score = 0;
        this.items.forEach(collectible => {
            if (!collectible.userData.collected) {
                const distance = collectible.position.distanceTo(playerPosition);
                if (distance < 4) {
                    collectible.userData.collected = true;
                    collectible.material.opacity = 0.2;
                    score += 10;
                }
            }
        });
        return score;
    }

    reset() {
        this.items.forEach(item => {
            item.userData.collected = false;
            item.material.opacity = 0.8;
        });
    }
}
