import * as THREE from 'three';

export default class Particles {
    constructor(game) {
        this.game = game;
        this.particles = [];

        this.geometries = {
            dust: new THREE.BoxGeometry(2, 2, 2),
            impact: new THREE.BoxGeometry(4, 4, 4)
        };

        this.materials = {
            dust: new THREE.MeshStandardMaterial({ color: '#bdc3c7', transparent: true, opacity: 0.6 }),
            impact: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })
        };
    }

    spawn(type, x, y, z, count = 1) {
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.geometries[type], this.materials[type]);
            mesh.position.set(x, y, z);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                Math.random() * 40
            );

            if (type === 'dust') {
                velocity.set((Math.random() - 0.5) * 20, -50, Math.random() * 10);
            }

            const particle = {
                mesh,
                velocity,
                life: 1.0,
                decay: 0.5 + Math.random() * 2.0
            };

            this.particles.push(particle);
            this.game.scene.add(mesh);
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * dt;

            if (p.life <= 0) {
                this.game.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }

            p.mesh.position.addScaledVector(p.velocity, dt);
            p.mesh.scale.set(p.life, p.life, p.life);
            p.mesh.rotation.x += dt * 5;
            p.mesh.rotation.y += dt * 5;
        }
    }
}
