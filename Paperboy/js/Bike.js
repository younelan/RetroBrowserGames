import * as THREE from 'three';
import { Utils } from './utils.js';

export default class Bike {
    constructor(game) {
        this.game = game;

        this.position = new THREE.Vector3(0, 0, 0);
        this.speed = 150;
        this.laneWidth = 60;

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Mobile Touch Steering
        this.touchX = 0;
        this.isTouching = false;
        window.addEventListener('touchstart', (e) => {
            this.isTouching = true;
            this.touchX = e.touches[0].clientX;
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            if (!this.isTouching) return;
            const currentX = e.touches[0].clientX;
            const deltaX = currentX - this.touchX;
            this.position.x += deltaX * 1.5; // Sensitivity
            this.touchX = currentX;
            // No e.preventDefault() here to allow tap detection elsewhere if needed, 
            // but we have touch-action: none on canvas
        });
        window.addEventListener('touchend', () => {
            this.isTouching = false;
        });

        this.createMesh();
        this.reset();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({ color: '#ecf0f1', metalness: 0.8, roughness: 0.1 }); // Light Silver
        const frameMat = new THREE.MeshStandardMaterial({ color: '#e74c3c', metalness: 0.3, roughness: 0.6 }); // Red Frame
        const tireMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: '#f39c12' }); // Vibrant Orange
        const pantMat = new THREE.MeshStandardMaterial({ color: '#2980b9' }); // Bright Blue pants
        const skinMat = new THREE.MeshStandardMaterial({ color: '#ffd3ac' });
        const helmetMat = new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.2 }); // Bright Red Helmet
        const bagMat = new THREE.MeshStandardMaterial({ color: '#ecf0f1' }); // Light Canvas bag
        const jointMat = skinMat; // Joints use skin or clothing color

        // --- BIKE ---
        const wheelGeo = new THREE.CylinderGeometry(14, 14, 5, 20);
        const rimGeo = new THREE.CylinderGeometry(11, 11, 6, 20);

        const addWheel = (y, z) => {
            const wGroup = new THREE.Group();
            const tire = new THREE.Mesh(wheelGeo, tireMat);
            tire.rotation.z = Math.PI / 2;
            wGroup.add(tire);
            const rim = new THREE.Mesh(rimGeo, metalMat);
            rim.rotation.z = Math.PI / 2;
            wGroup.add(rim);
            wGroup.position.set(0, y, z);
            wGroup.castShadow = true;
            this.mesh.add(wGroup);
            return wGroup;
        };

        addWheel(32, 14);
        addWheel(-25, 14);

        // Frame fork and body (rounded tubes)
        const tubeGeo = new THREE.CylinderGeometry(2, 2, 60, 8);
        const frameTube = new THREE.Mesh(tubeGeo, metalMat);
        frameTube.position.set(0, 5, 14);
        frameTube.rotation.x = Math.PI / 2;
        this.mesh.add(frameTube);

        // Seat post and Seat
        const seatPost = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 25, 8), metalMat);
        seatPost.position.set(0, -10, 30);
        seatPost.rotation.x = -0.4;
        this.mesh.add(seatPost);

        const seat = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), tireMat);
        seat.position.set(0, -15, 42);
        seat.scale.set(1, 1.4, 0.6);
        this.mesh.add(seat);

        // Handlebars Stem & Bars
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 30, 8), metalMat);
        stem.position.set(0, 26, 35);
        stem.rotation.x = 0.3;
        this.mesh.add(stem);

        const bars = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 40, 8), metalMat);
        bars.position.set(0, 32, 48);
        bars.rotation.z = Math.PI / 2;
        this.mesh.add(bars);

        const gripGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 8);
        const gripL = new THREE.Mesh(gripGeo, tireMat);
        gripL.position.set(-18, 32, 48);
        gripL.rotation.z = Math.PI / 2;
        this.mesh.add(gripL);
        const gripR = new THREE.Mesh(gripGeo, tireMat);
        gripR.position.set(18, 32, 48);
        gripR.rotation.z = Math.PI / 2;
        this.mesh.add(gripR);

        // --- RIDER ---
        const riderGroup = new THREE.Group();

        // Torso (Rounded)
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(8, 12, 4, 10), shirtMat);
        torso.position.set(0, -2, 50);
        torso.rotation.x = 0.4;
        riderGroup.add(torso);

        // Head & Helmet
        const head = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 12), skinMat);
        head.position.set(0, 6, 68);
        riderGroup.add(head);

        const helmet = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 12), helmetMat);
        helmet.position.set(0, 6, 70);
        helmet.scale.set(1, 1.1, 0.9);
        riderGroup.add(helmet);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 2), helmetMat);
        visor.position.set(0, 12, 70);
        visor.rotation.x = -0.2;
        riderGroup.add(visor);

        // Arms (Jointed Cylinders)
        const armGeo = new THREE.CylinderGeometry(2, 2, 15, 8);
        const jointGeo = new THREE.SphereGeometry(2.5, 8, 8);

        const addArm = (side) => {
            const arm = new THREE.Group();
            const upper = new THREE.Mesh(armGeo, shirtMat);
            upper.position.y = -7.5;
            arm.add(upper);
            const elbow = new THREE.Mesh(jointGeo, shirtMat);
            elbow.position.y = -15;
            arm.add(elbow);
            const lower = new THREE.Mesh(armGeo, skinMat);
            lower.position.y = -22.5;
            arm.add(lower);

            arm.position.set(10 * side, 5, 58);
            arm.rotation.x = 1.2;
            arm.rotation.z = 0.3 * side;
            riderGroup.add(arm);
        };
        addArm(-1);
        addArm(1);

        // Legs (Jointed)
        const legGeo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
        const addLeg = (side) => {
            const leg = new THREE.Group();
            const upper = new THREE.Mesh(legGeo, pantMat);
            upper.position.y = -9;
            leg.add(upper);
            const knee = new THREE.Mesh(jointGeo, pantMat);
            knee.position.y = -18;
            leg.add(knee);
            const lower = new THREE.Mesh(legGeo, pantMat);
            lower.position.y = -27;
            leg.add(lower);

            leg.position.set(6 * side, -8, 40);
            leg.rotation.x = -0.6;
            riderGroup.add(leg);
        };
        addLeg(-1);
        addLeg(1);

        // Newspaper Bag
        const bag = new THREE.Mesh(new THREE.BoxGeometry(10, 28, 22), bagMat);
        bag.position.set(-12, -4, 45);
        bag.rotation.y = 0.2;
        riderGroup.add(bag);

        this.mesh.add(riderGroup);
        this.game.scene.add(this.mesh);
    }

    reset() {
        this.position.set(0, 0, 0);
        this.speed = 150;
        if (this.mesh) this.mesh.position.copy(this.position);
    }

    update(dt) {
        // Forward movement
        this.position.y += this.speed * dt;

        // Steering
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.position.x -= 150 * dt;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.position.x += 150 * dt;
        }

        // Speed control
        const isAccelerating = this.keys['ArrowUp'] || this.keys['KeyW'] || this.isTouching;
        const isBraking = this.keys['ArrowDown'] || this.keys['KeyS'];

        if (isAccelerating) {
            this.speed = Utils.clamp(this.speed + 150 * dt, 100, 350);
        } else if (isBraking) {
            this.speed = Utils.clamp(this.speed - 150 * dt, 50, 350);
        } else {
            this.speed = Utils.lerp(this.speed, 150, 0.05);
        }

        // Clamp to road (wider)
        this.position.x = Utils.clamp(this.position.x, -220, 220);

        this.mesh.position.copy(this.position);

        // Dust trail
        if (this.game.particles && Math.random() > 0.6) {
            this.game.particles.spawn('dust', this.position.x, this.position.y - 10, 2, 1);
        }

        // Tilt lean
        const leanTarget = (this.keys['ArrowLeft'] ? 0.3 : (this.keys['ArrowRight'] ? -0.3 : 0));
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, leanTarget, 0.1);
    }
}
