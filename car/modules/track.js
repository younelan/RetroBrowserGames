import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Track {
    constructor(scene) {
        this.scene = scene;
        this.radius = 80;
        this.width = 16;
        this.createTrack();
    }

    createTrack() {
        this.createGround();
        this.createRoad();
        this.createBorderLines();
        this.createStartLine();
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
            side: THREE.DoubleSide
        });

        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = 0.01;
        this.scene.add(this.road);
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
}
