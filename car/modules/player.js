import { createCarModel } from './models.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.speed = 0;
        this.maxSpeed = 1.5;
        this.acceleration = 0.05;
        this.deceleration = 0.03;
        this.turnSpeed = 0.03;
        this.angle = 0;
        this.driftFactor = 0.98;
        this.isBraking = false;
        this.steeringAmount = 0;
        
        this.createPlayer();
    }

    createPlayer() {
        this.car = createCarModel();
        this.car.position.set(0, 0.5, 0);
        this.scene.add(this.car);
    }

    reset() {
        this.speed = 0;
        this.angle = 0;
        this.car.position.set(0, 0.5, 0);
        this.car.rotation.y = 0;
    }

    update() {
        const moveX = Math.sin(this.angle) * this.speed;
        const moveZ = Math.cos(this.angle) * this.speed;
        
        this.car.position.x += moveX;
        this.car.position.z += moveZ;
        this.car.rotation.y = this.angle;

        // Apply drift/friction
        this.speed *= this.driftFactor;
    }
}
