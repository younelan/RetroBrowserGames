import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createVehicle } from './models.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.speed = 0;
        this.angle = 0;
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            this.maxSpeed = 70;
            this.acceleration = 2.0;
            this.deceleration = 1.0;
        } else {
            // Increase desktop performance
            this.maxSpeed = 100;
            this.acceleration = 2.5;
            this.deceleration = 0.8;
        }
        this.turnSpeed = 2.0;
        this.createCar();
    }

    createCar() {
        // Create vehicle using shared model (red color)
        this.car = createVehicle(0xff0000);
        this.car.rotation.y = Math.PI / 2;
        this.car.position.set(80, 0.5, 0);
        this.scene.add(this.car);
    }

    update(deltaTime) {
        const frameSpeed = this.speed * deltaTime;
        this.car.position.x += Math.sin(this.angle) * frameSpeed;
        this.car.position.z += Math.cos(this.angle) * frameSpeed;
        this.car.rotation.y = this.angle + Math.PI / 2;
        // Keep the car on the ground
        this.car.position.y = 0.5;
    }

    reset() {
        this.speed = 0;
        this.angle = 0;
        this.car.position.set(80, 0.5, 0);
    }
}
