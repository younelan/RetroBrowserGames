import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.speed = 0;
        this.angle = 0;
        this.maxSpeed = 1.5;         // Slower max speed
        this.acceleration = 0.03;     // Smoother acceleration
        this.deceleration = 0.02;     // Smoother deceleration
        this.turnSpeed = 0.02;        // Smoother turning
        this.createCar();
    }

    createCar() {
        // Simple car geometry
        const geometry = new THREE.BoxGeometry(4, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.car = new THREE.Mesh(geometry, material);
        this.car.position.y = 1;
        this.scene.add(this.car);
    }

    update() {
        // Add momentum to turning
        if (Math.abs(this.speed) > 0.1) {
            const effectiveTurnSpeed = this.turnSpeed * (this.speed / this.maxSpeed);
            this.car.rotation.y = this.angle;
        }
        
        // Update position with smooth movement
        this.car.position.x += Math.sin(this.angle) * this.speed;
        this.car.position.z += Math.cos(this.angle) * this.speed;
    }

    reset() {
        this.speed = 0;
        this.angle = 0;
        this.car.position.set(80, 1, 0); // Start position
    }
}
