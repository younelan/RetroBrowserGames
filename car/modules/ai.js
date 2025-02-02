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
        const carGroup = new THREE.Group();
        
        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1, 2),
            new THREE.MeshPhongMaterial({ color: color })
        );
        
        // Cockpit
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 1.8),
            new THREE.MeshPhongMaterial({ color: 0x333333 })
        );
        cockpit.position.set(-0.5, 0.6, 0);
        
        // Wheels (same as player car)
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 8);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            { x: -1.2, z: 1 },
            { x: -1.2, z: -1 },
            { x: 1.2, z: 1 },
            { x: 1.2, z: -1 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, -0.3, pos.z);
            carGroup.add(wheel);
        });

        carGroup.add(body);
        carGroup.add(cockpit);
        carGroup.position.y = 1;
        
        this.scene.add(carGroup);
        this.cars.push(carGroup);
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
