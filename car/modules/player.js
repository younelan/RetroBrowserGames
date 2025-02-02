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

        // Sleek convertible body
        const bodyShape = new THREE.Shape();
        // Lower body curve
        bodyShape.moveTo(-2, -1);
        bodyShape.quadraticCurveTo(-2.3, -0.5, -2.3, 0);
        // Hood
        bodyShape.quadraticCurveTo(-2, 0.3, -1.5, 0.4);
        // Windshield base
        bodyShape.lineTo(-0.8, 0.4);
        // Windshield (angled)
        bodyShape.lineTo(-0.3, 0.8);
        // Back area (no roof)
        bodyShape.lineTo(1.5, 0.8);
        // Rear deck
        bodyShape.quadraticCurveTo(2, 0.4, 2.2, 0);
        // Bottom curve
        bodyShape.quadraticCurveTo(2, -0.5, 1.8, -1);
        bodyShape.lineTo(-2, -1);

        // Create car body with correct material properties
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            shininess: 100,
            specular: 0x666666
        });

        // Create body with proper depth
        const extrudeSettings = {
            steps: 1,
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelSegments: 5
        };

        const body = new THREE.Mesh(
            new THREE.ExtrudeGeometry(bodyShape, extrudeSettings),
            bodyMaterial
        );
        body.scale.set(0.6, 0.6, 0.6);

        // Add driver figure
        const driver = this.createDriver();
        driver.position.set(0.2, 0.6, 0); // Centered in cockpit

        // Add seats
        const seats = this.createSeats();
        seats.position.set(0.2, 0.3, 0);

        // Fix wheel positions and orientation
        const wheelPositions = [
            { x: -1.2, y: -0.3, z: 0.5 },  // Front Right
            { x: -1.2, y: -0.3, z: -0.5 }, // Front Left
            { x: 1.2, y: -0.3, z: 0.5 },   // Back Right
            { x: 1.2, y: -0.3, z: -0.5 }   // Back Left
        ];

        wheelPositions.forEach(pos => {
            const wheel = this.createDetailedWheel();
            wheel.position.set(pos.x, pos.y, pos.z);
            carGroup.add(wheel);
        });

        carGroup.add(body);
        carGroup.add(driver);
        carGroup.add(seats);

        carGroup.rotation.y = Math.PI / 2;
        carGroup.position.y = 0.5;

        this.car = carGroup;
        this.scene.add(this.car);
    }

    createDetailedWheel() {
        const wheelGroup = new THREE.Group();

        // Create tire as a cylinder (vertical orientation)
        const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32),
            new THREE.MeshPhongMaterial({
                color: 0x222222,
                shininess: 30
            })
        );

        // Create rim
        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16),
            new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                shininess: 100
            })
        );

        // Add spokes for detail
        for (let i = 0; i < 8; i++) {
            const spoke = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.3, 0.04),
                rim.material
            );
            spoke.rotation.z = (i / 8) * Math.PI * 2;
            rim.add(spoke);
        }

        wheelGroup.add(tire);
        wheelGroup.add(rim);

        // Orient wheel properly
        wheelGroup.rotation.z = Math.PI/2; // Make wheel vertical
        
        return wheelGroup;
    }

    createDriver() {
        const driverGroup = new THREE.Group();
        
        // Helmet with visor
        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshPhongMaterial({ 
                color: 0xff0000,
                shininess: 150
            })
        );
        
        // Visor
        const visor = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshPhongMaterial({
                color: 0x111111,
                transparent: true,
                opacity: 0.7
            })
        );
        visor.position.y = 0.03;
        visor.position.z = 0.02;
        helmet.add(visor);

        // Body in racing suit
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.15, 0.4, 8),
            new THREE.MeshPhongMaterial({ color: 0x2266ff })
        );
        body.position.y = -0.3;

        driverGroup.add(helmet);
        driverGroup.add(body);
        return driverGroup;
    }

    createSeats() {
        const seatGroup = new THREE.Group();

        // Fix seat material
        const seatMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 30
        });

        // Driver seat
        const seatGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const seatBack = new THREE.BoxGeometry(0.4, 0.4, 0.1);

        const driverSeat = new THREE.Mesh(seatGeometry, seatMaterial);
        const driverBack = new THREE.Mesh(seatBack, seatMaterial);
        driverBack.position.z = -0.15;
        driverBack.position.y = 0.15;

        seatGroup.add(driverSeat);
        seatGroup.add(driverBack);

        return seatGroup;
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
