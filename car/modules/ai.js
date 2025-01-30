import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createCarModel } from './models.js';

export class AIController {
    constructor(scene) {
        this.scene = scene;
        this.cars = [];
        this.trackRadius = 80;
    }

    createAICar(color = 0x00ff00) {
        const car = {
            model: createCarModel(color),
            speed: 0,
            maxSpeed: 2.0 + Math.random() * 0.5,
            angle: 0
        };

        car.model.position.set(
            Math.random() * 20 - 10,
            0.5,
            Math.random() * 20 - 10
        );

        this.scene.add(car.model);
        this.cars.push(car);
    }

    update() {
        this.cars.forEach(car => {
            const carPos = car.model.position;
            
            // Calculate target point on track
            const angle = Math.atan2(carPos.z, carPos.x);
            const targetX = Math.cos(angle + 0.1) * this.trackRadius;
            const targetZ = Math.sin(angle + 0.1) * this.trackRadius;
            
            // Calculate direction to target
            const direction = new THREE.Vector3(targetX - carPos.x, 0, targetZ - carPos.z).normalize();
            
            // Calculate target angle
            const targetAngle = Math.atan2(direction.x, direction.z);
            let angleDiff = targetAngle - car.angle;
            
            // Normalize angle difference
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Adjust steering
            car.angle += angleDiff * 0.1;
            
            // Calculate distance from ideal radius
            const currentRadius = Math.sqrt(carPos.x * carPos.x + carPos.z * carPos.z);
            const radiusDiff = Math.abs(currentRadius - this.trackRadius);
            
            // Adjust speed based on how close to track we are
            const speedFactor = Math.max(0.5, 1 - radiusDiff / 20);
            car.speed = car.maxSpeed * speedFactor;

            // Update position
            const moveX = Math.sin(car.angle) * car.speed;
            const moveZ = Math.cos(car.angle) * car.speed;
            car.model.position.x += moveX;
            car.model.position.z += moveZ;
            car.model.rotation.y = car.angle;
        });
    }

    reset() {
        this.cars.forEach(car => {
            this.scene.remove(car.model);
        });
        this.cars = [];
        
        // Create new AI cars
        for (let i = 0; i < 3; i++) {
            this.createAICar();
        }
    }
}
