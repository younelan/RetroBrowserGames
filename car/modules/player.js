import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.speed = 0;
        this.angle = 0;
        this.maxSpeed = 1.5;
        this.acceleration = 0.03;
        this.deceleration = 0.02;
        this.turnSpeed = 0.02;
        this.createCar();
    }

    createCar() {
        const carGroup = new THREE.Group();

        // Main body - lower part
        const bodyGeometry = new THREE.BoxGeometry(4, 0.75, 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            shininess: 100,
            specular: 0x444444
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Hood and trunk (tapered shape)
        const hoodShape = new THREE.Shape();
        hoodShape.moveTo(-2, -1);
        hoodShape.lineTo(2, -1);
        hoodShape.lineTo(1.5, 1);
        hoodShape.lineTo(-1.5, 1);
        hoodShape.lineTo(-2, -1);

        const extrudeSettings = {
            steps: 1,
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelSegments: 3
        };

        const hood = new THREE.Mesh(
            new THREE.ExtrudeGeometry(hoodShape, extrudeSettings),
            bodyMaterial
        );
        hood.scale.set(0.45, 0.25, 0.8);
        hood.position.set(0, 0.75, 0);

        // Cabin/cockpit
        const cabinGeometry = new THREE.BoxGeometry(2, 0.8, 1.8);
        const cabinMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111,
            shininess: 150,
            transparent: true,
            opacity: 0.7
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 1.1, 0);

        // Spoiler
        const spoilerGeometry = new THREE.BoxGeometry(0.3, 0.5, 2.2);
        const spoiler = new THREE.Mesh(spoilerGeometry, bodyMaterial);
        spoiler.position.set(-1.5, 1.2, 0);

        // Front bumper details
        const bumperGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 8);
        const bumperMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 80
        });
        const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        frontBumper.rotation.z = Math.PI / 2;
        frontBumper.position.set(1.8, 0.2, 0);

        // Headlights
        const headlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffcc,
            shininess: 150,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });

        const headlightLeft = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightLeft.rotation.z = Math.PI / 2;
        headlightLeft.position.set(1.9, 0.4, 0.6);

        const headlightRight = headlightLeft.clone();
        headlightRight.position.z = -0.6;

        // Wheels with better detail
        const wheelGeometry = new THREE.Group();
        const wheelPositions = [
            { x: 1.2, z: 1, angle: 0 },    // Front Right
            { x: 1.2, z: -1, angle: 0 },   // Front Left
            { x: -1.2, z: 1, angle: 0 },   // Back Right
            { x: -1.2, z: -1, angle: 0 }   // Back Left
        ];

        wheelPositions.forEach(pos => {
            const wheel = this.createDetailedWheel();
            wheel.position.set(pos.x, 0, pos.z);
            wheel.rotation.set(0, pos.angle, Math.PI / 2);
            carGroup.add(wheel);
        });

        // Add all parts to car
        carGroup.add(body);
        carGroup.add(hood);
        carGroup.add(cabin);
        carGroup.add(spoiler);
        carGroup.add(frontBumper);
        carGroup.add(headlightLeft);
        carGroup.add(headlightRight);

        // Final positioning
        carGroup.rotation.y = Math.PI / 2;
        carGroup.position.y = 0.5;

        this.car = carGroup;
        this.scene.add(this.car);
    }

    createDetailedWheel() {
        const wheelGroup = new THREE.Group();

        // Tire
        const tireGeometry = new THREE.TorusGeometry(0.4, 0.2, 16, 32);
        const tireMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 30
        });
        const tire = new THREE.Mesh(tireGeometry, tireMaterial);

        // Rim
        const rimGeometry = new THREE.CircleGeometry(0.35, 8);
        const rimMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            shininess: 100
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(0, 0, 0.1);

        // Spokes
        for (let i = 0; i < 4; i++) {
            const spokeGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.05);
            const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
            spoke.position.set(0, 0, 0.1);
            spoke.rotation.z = (i / 4) * Math.PI * 2;
            wheelGroup.add(spoke);
        }

        wheelGroup.add(tire);
        wheelGroup.add(rim);

        return wheelGroup;
    }

    update() {
        // Update car position and rotation (fixed direction)
        this.car.position.x += Math.sin(this.angle) * this.speed;
        this.car.position.z += Math.cos(this.angle) * this.speed;
        this.car.rotation.y = this.angle + Math.PI / 2; // Add 90 degrees to face forward
    }

    reset() {
        this.speed = 0;
        this.angle = 0;
        this.car.position.set(80, 1, 0); // Start position
    }
}
