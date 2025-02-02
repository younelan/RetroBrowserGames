import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createCarModel } from './models.js';

export class AIController {
    constructor(scene) {
        this.scene = scene;
        this.cars = [];
        this.speed = 1;
    }

    setSpeed(speed) {
        this.speed = speed;
        this.cars.forEach(car => {
            car.speed = this.baseSpeed * (1 + (Math.random() - 0.5) * this.speedVariation);
        });
    }

    createAICar(color = 0x00ff00) {
        const geometry = new THREE.BoxGeometry(4, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const car = new THREE.Mesh(geometry, material);
        car.position.y = 1;
        this.scene.add(car);
        this.cars.push(car);
    }

    update(track) {
        this.cars.forEach(car => {
            // Simple AI movement around track
            const angle = Math.atan2(car.position.x, car.position.z);
            car.position.x = Math.sin(angle + 0.01) * 80;
            car.position.z = Math.cos(angle + 0.01) * 80;
            car.rotation.y = angle + Math.PI/2;
        });
    }

    reset() {
        this.cars.forEach(car => this.scene.remove(car.model));
        this.cars = [];
        
        for (let i = 0; i < 3; i++) {
            this.createAICar();
        }
    }
}
