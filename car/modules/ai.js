import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createVehicle } from './models.js';

export class AIController {
    constructor(scene) {
        this.scene = scene;
        this.cars = [];
        this.speed = 1;
        // Add individual car properties
        this.carProperties = [];
    }

    setSpeed(speed) {
        this.speed = speed;
        this.cars.forEach(car => {
            car.speed = this.baseSpeed * (1 + (Math.random() - 0.5) * this.speedVariation);
        });
    }

    createAICar(index = 0) {
        const colors = [0x0066ff, 0x00ff00, 0xffff00];
        const color = colors[index % colors.length];
        const carGroup = createVehicle(color);
        
        // Set orientation and ground level
        //carGroup.rotation.y = -Math.PI / 2;
        carGroup.position.y = 0.5;
        this.scene.add(carGroup);
        this.cars.push(carGroup);
        this.carProperties.push({
            speed: 0.8 + Math.random() * 0.4,
            wobble: Math.random() * 0.02,
            offset: Math.random() * 6 - 3,
            laneChangeTime: 0
        });
    }

    update(track) {
        this.cars.forEach((car, index) => {
            const props = this.carProperties[index];
            props.laneChangeTime += 0.016;
            const laneOffset = Math.sin(props.laneChangeTime * props.wobble) * 8;

            const angle = Math.atan2(car.position.x, car.position.z);
            const newAngle = angle + (0.005 * props.speed);
            car.position.x = Math.sin(newAngle) * (track.centerRadius + laneOffset);
            car.position.z = Math.cos(newAngle) * (track.centerRadius + laneOffset);

            // Calculate the target position SLIGHTLY ahead of the car.
            const targetAngle = newAngle + 1; // A small increment
            const targetX = Math.sin(targetAngle) * (track.centerRadius + laneOffset);
            const targetZ = Math.cos(targetAngle) * (track.centerRadius + laneOffset);

            car.lookAt(targetX, car.position.y, targetZ);

        });
    }
    
    reset() {
        this.cars.forEach(car => this.scene.remove(car));
        this.cars = [];
        this.carProperties = [];
        
        // Recreate cars with new random properties
        for (let i = 0; i < 3; i++) {
            this.createAICar(i);
        }
    }
}
