import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { LEVELS } from '../data/levels.js';

export class Track {
    constructor(scene) {
        this.scene = scene;
        this.radius = 80;
        this.width = 40; // Make track wider (was 16/32)
        this.innerRadius = this.radius - this.width;
        this.centerRadius = this.radius - this.width/2; // For placing objects
        this.trackPoints = [];
        this.currentLevel = LEVELS.level1;
        this.createTrack();
    }

    createTrack() {
        this.createGround();
        this.createRoad();
        this.createBorderLines();
        this.createStartLine();

        // Clear existing track points if any
        this.trackPoints = [...this.currentLevel.trackPoints];
        
        // Create track visualization
        const trackGeometry = new THREE.BufferGeometry();
        const positions = [];
        
        this.trackPoints.forEach(point => {
            positions.push(point.x, point.y, point.z);
        });
        // Close the loop
        positions.push(this.trackPoints[0].x, this.trackPoints[0].y, this.trackPoints[0].z);
        
        trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const trackMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.trackLine = new THREE.Line(trackGeometry, trackMaterial);
        this.scene.add(this.trackLine);
    }

    reset() {
        // Remove existing track
        if (this.trackLine) {
            this.scene.remove(this.trackLine);
        }
        // Recreate track
        this.createTrack();
    }

    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(10, 10);
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0;
        this.scene.add(this.ground);
    }

    createRoad() {
        // Create asphalt texture
        const textureLoader = new THREE.TextureLoader();
        const asphaltTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
        asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
        asphaltTexture.repeat.set(20, 20);
        
        const roadShape = new THREE.Shape();
        roadShape.absarc(0, 0, this.radius, 0, Math.PI * 2, false);
        
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, this.radius - this.width, 0, Math.PI * 2, true);
        roadShape.holes.push(holePath);

        const roadGeometry = new THREE.ShapeGeometry(roadShape, 64);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.1,
            map: asphaltTexture,
            side: THREE.DoubleSide
        });

        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = 0.01;
        this.scene.add(this.road);

        // Add road markings
        this.createRoadMarkings();
    }

    createRoadMarkings() {
        const segments = 32;
        for (let i = 0; i < segments; i++) {
            if (i % 2 === 0) continue;
            
            const angle = (i / segments) * Math.PI * 2;
            const marking = new THREE.Mesh(
                new THREE.PlaneGeometry(5, 0.8), // Length first, width second
                new THREE.MeshBasicMaterial({ 
                    color: 0xffffff,
                    side: THREE.DoubleSide 
                })
            );
            
            // Position markings flat on the road
            marking.position.x = Math.cos(angle) * this.centerRadius;
            marking.position.z = Math.sin(angle) * this.centerRadius;
            marking.position.y = 0.02; // Just above road surface
            
            // Align with track direction
            marking.rotation.x = -Math.PI/2; // Lay flat
            marking.rotation.z = angle + Math.PI/2; // Point along track
            
            this.scene.add(marking);
        }
    }

    createBorderLines() {
        const linesMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        // Inner line
        const innerLineGeometry = new THREE.RingGeometry(
            this.radius - this.width - 0.5,
            this.radius - this.width,
            64
        );
        this.innerLine = new THREE.Mesh(innerLineGeometry, linesMaterial);
        this.innerLine.rotation.x = -Math.PI / 2;
        this.innerLine.position.y = 0.02;
        this.scene.add(this.innerLine);

        // Outer line
        const outerLineGeometry = new THREE.RingGeometry(
            this.radius,
            this.radius + 0.5,
            64
        );
        this.outerLine = new THREE.Mesh(outerLineGeometry, linesMaterial);
        this.outerLine.rotation.x = -Math.PI / 2;
        this.outerLine.position.y = 0.02;
        this.scene.add(this.outerLine);
    }

    createStartLine() {
        this.startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(this.width - 1, 2),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide
            })
        );
        this.startLine.position.set(this.radius - this.width/2, 0.03, 0);
        this.startLine.rotation.x = -Math.PI / 2;
        this.scene.add(this.startLine);
    }

    isOnTrack(position) {
        const distanceFromCenter = Math.sqrt(
            position.x * position.x + position.z * position.z
        );
        return distanceFromCenter <= this.radius + 6 && 
               distanceFromCenter >= this.radius - 14;
    }

    getNextPoint(position) {
        // Find the closest point and return the next one
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        this.trackPoints.forEach((point, index) => {
            const distance = position.distanceTo(point);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        
        // Return next point (or first if at end)
        return this.trackPoints[(closestIndex + 1) % this.trackPoints.length];
    }

    checkLap(position) {
        // Only detect lap if player crosses from behind the start line.
        const threshold = 5;
        const d = position.distanceTo(this.startLine.position);
        // Assume lap crosses when player's x exceeds startLine.x (tweak as needed)
        if (d < threshold && position.x > this.startLine.position.x) {
            // Debounce: ensure lap detected only once per crossing.
            if (!this.lapDetected) {
                this.lapDetected = true;
                // ...set currentLap, lapTime etc...
                return { newLap: true, currentLap: 1, lapTime: 10, bestLap: 10 };
            }
        } else {
            this.lapDetected = false;
        }
        return { newLap: false };
    }
}
