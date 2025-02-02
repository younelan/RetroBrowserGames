import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createCarModel } from './models.js';

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
        // AI car colors
        const colors = [0x0066ff, 0x00ff00, 0xffff00];
        const color = colors[index % colors.length];
        
        // Create car using same geometry as player but different color
        const carGroup = this.createCarBody(color);
        this.scene.add(carGroup);
        this.cars.push(carGroup);
        
        // Add random properties for this car
        this.carProperties.push({
            speed: 0.8 + Math.random() * 0.4, // Speed variation
            wobble: Math.random() * 0.02, // Lane change rate
            offset: Math.random() * 6 - 3, // Starting lane position
            laneChangeTime: 0
        });
    }

    createCarBody(color) {
        const carGroup = new THREE.Group();
        
        // Main body - same shape as player car
        const bodyShape = new THREE.Shape();
        bodyShape.moveTo(-2, -1);
        bodyShape.quadraticCurveTo(-2.2, -0.5, -1.8, 0);  // Front curve
        bodyShape.quadraticCurveTo(-1.5, 0.5, -1, 0.8);   // Hood curve
        bodyShape.lineTo(1, 0.8);                          // Top line
        bodyShape.quadraticCurveTo(1.5, 0.8, 1.8, 0.3);   // Back curve
        bodyShape.quadraticCurveTo(2, -0.5, 1.8, -1);     // Bottom back
        bodyShape.lineTo(-2, -1);                          // Bottom

        const extrudeSettings = {
            steps: 1,
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelSegments: 5
        };

        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 100,
            specular: 0x666666
        });

        const body = new THREE.Mesh(
            new THREE.ExtrudeGeometry(bodyShape, extrudeSettings),
            bodyMaterial
        );
        body.scale.set(0.7, 0.7, 0.7);

        // Add driver figure
        const driverHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0xffdbac })
        );
        driverHead.position.set(0, 1.3, 0);

        const driverBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.2, 0.6, 8),
            new THREE.MeshPhongMaterial({ color: color }) // Match car color
        );
        driverBody.position.set(0, 0.9, 0);

        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 16, 16),
            new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 150
            })
        );
        helmet.scale.set(1, 0.8, 1);
        helmet.position.set(0, 1.3, 0);

        // Add wheels
        const wheelPositions = [
            { x: -1.1, y: 0, z: 0.6 },  // Front Right
            { x: -1.1, y: 0, z: -0.6 }, // Front Left
            { x: 1.1, y: 0, z: 0.6 },   // Back Right
            { x: 1.1, y: 0, z: -0.6 }   // Back Left
        ];

        wheelPositions.forEach(pos => {
            const wheel = this.createWheel();
            wheel.position.set(pos.x, pos.y, pos.z);
            carGroup.add(wheel);
        });

        // Add all parts
        carGroup.add(body);
        carGroup.add(driverHead);
        carGroup.add(driverBody);
        carGroup.add(helmet);

        // Rotate to face forward
        carGroup.rotation.y = -Math.PI / 2;
        carGroup.position.y = 0.5;

        return carGroup;
    }

    createWheel() {
        const wheelGroup = new THREE.Group();

        // Tire
        const tire = new THREE.Mesh(
            new THREE.TorusGeometry(0.4, 0.2, 16, 32),
            new THREE.MeshPhongMaterial({
                color: 0x222222,
                shininess: 30
            })
        );

        // Rim
        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8),
            new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                shininess: 100
            })
        );

        wheelGroup.add(tire);
        wheelGroup.add(rim);
        wheelGroup.rotation.x = Math.PI / 2;

        return wheelGroup;
    }

    update(track) {
        this.cars.forEach((car, index) => {
            const props = this.carProperties[index];
            // Update lane change timing
            props.laneChangeTime += 0.016;
            
            // Smoothly change lane position
            const laneOffset = Math.sin(props.laneChangeTime * props.wobble) * 8;
            
            const angle = Math.atan2(car.position.x, car.position.z);
            const newAngle = angle + (0.01 * props.speed);
            
            // Position on track with lane offset
            car.position.x = Math.sin(newAngle) * (track.centerRadius + laneOffset);
            car.position.z = Math.cos(newAngle) * (track.centerRadius + laneOffset);
            
            // Point in direction of travel
            const nextAngle = newAngle + 0.1;
            const targetX = Math.sin(nextAngle) * (track.centerRadius + laneOffset);
            const targetZ = Math.cos(nextAngle) * (track.centerRadius + laneOffset);
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
