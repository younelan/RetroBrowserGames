import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Player } from './modules/player.js';
import { Track } from './modules/track.js';
import { AIController } from './modules/ai.js';
import { DirectionIndicator } from './modules/direction.js';
import { Collectibles } from './modules/collectibles.js';

export class Game {
    constructor() {
        // Initialize properties first
        this.lastTime = performance.now();
        this.gameStarted = false;
        this.score = 0;
        this.raceTime = 0;
        this.touchX = 0;
        this.isTouching = false;
        this.dragStartX = 0;
        this.currentTurnAmount = 0;
        
        // Initialize all components before starting
        this.setupScene();
        this.setupLights();
        this.setupControls();
        this.setupTouchControls();
        
        // Wait for components to be ready
        requestAnimationFrame(() => {
            this.startGame();
            this.animate();
        });
    }
    
    setupScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        
        // Set sky color
        this.scene.background = new THREE.Color(0x87CEEB);
        
        this.handleResize();
        
        // Initialize all components synchronously
        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.aiController = new AIController(this.scene);
        this.directionIndicator = new DirectionIndicator(this.scene);
        this.collectibles = new Collectibles(this.scene, this.track);
        
        // Create AI cars immediately
        for (let i = 0; i < 3; i++) {
            this.aiController.createAICar(i);
        }
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 100, 0);
        this.scene.add(directionalLight);

        this.camera.position.set(0, 120, 0);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupControls() {
        window.addEventListener('resize', () => this.handleResize());
        
        const keyState = {};
        
        document.addEventListener('keydown', (e) => {
            keyState[e.key] = true;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keyState[e.key] = false;
        });
        
        let lastTime = performance.now();
        setInterval(() => {
            if (!this.gameStarted) return;
            
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Forward/Backward
            if (keyState['ArrowUp'] || keyState['w']) {
                this.player.speed = Math.min(
                    this.player.speed + this.player.acceleration * deltaTime,
                    this.player.maxSpeed
                );
            }
            if (keyState['ArrowDown'] || keyState['s']) {
                this.player.speed = Math.max(
                    this.player.speed - this.player.deceleration * deltaTime,
                    -this.player.maxSpeed/2
                );
            }
            
            // Inverted Left/Right: left now increases angle, right decreases it
            if (keyState['ArrowLeft'] || keyState['a']) {
                this.player.angle += this.player.turnSpeed * deltaTime;
            }
            if (keyState['ArrowRight'] || keyState['d']) {
                this.player.angle -= this.player.turnSpeed * deltaTime;
            }
            
            // Natural deceleration
            if (!keyState['ArrowUp'] && !keyState['w'] && !keyState['ArrowDown'] && !keyState['s']) {
                if (this.player.speed > 0) {
                    this.player.speed = Math.max(0, this.player.speed - this.player.deceleration * deltaTime);
                } else if (this.player.speed < 0) {
                    this.player.speed = Math.min(0, this.player.speed + this.player.deceleration * deltaTime);
                }
            }
        }, 1000 / 60);
    }
    
    setupHUD() {
        // Verify HUD elements exist
        const requiredElements = ['scoreValue', 'timeValue', 'lapValue', 'lastLapValue', 'bestLapValue'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing HUD elements:', missingElements);
            return;
        }
        
        // Start game if all elements exist
        this.startGame();
    }
    
    setupTouchControls() {
        const canvas = document.getElementById('gameCanvas');
        let lastTouchTime = performance.now();
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isTouching = true;
            lastTouchTime = performance.now();
            this.player.speed = this.player.maxSpeed * 0.5;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTouchTime) / 1000;
            lastTouchTime = currentTime;
            
            const touch = e.touches[0];
            const screenWidth = window.innerWidth;
            // Map touch position to 0-9 scale; center (5) gives zero, <5 left, >5 right.
            const digit = (touch.clientX / screenWidth) * 9;
            const multiplier = (digit - 5) * (2/5);
            // Invert steer: subtract instead of add
            this.player.angle -= multiplier * this.player.turnSpeed * deltaTime;
            
            // Moderate acceleration
            this.player.speed = Math.min(
                this.player.speed + this.player.acceleration * deltaTime * 2,
                this.player.maxSpeed
            );
        });
        
        canvas.addEventListener('touchend', () => {
            this.isTouching = false;
        });
    }
    
    handleResize() {
        const container = document.getElementById('game-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    startGame() {
        if (!this.track || !this.player || !this.aiController || 
            !this.collectibles || !this.directionIndicator) {
            console.error('Game components not ready');
            return;
        }

        this.gameStarted = true;
        this.raceTime = 0;
        this.score = 0;
        
        // Reset components
        this.player.reset();
        this.aiController.reset();
        this.collectibles.reset();
        this.track.reset();
        this.directionIndicator.reset();
        
        // Reset HUD
        const elements = ['scoreValue', 'timeValue', 'lapValue', 'lastLapValue', 'bestLapValue'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        // Ensure game is started
        if (!this.gameStarted) {
            this.startGame();
            return;
        }

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (!deltaTime || !this.gameStarted) return;

        // Update game time
        this.raceTime += deltaTime;
        document.getElementById('timeValue').textContent = Math.floor(this.raceTime);

        // Update game components
        this.player.update(deltaTime);
        this.aiController.update(this.track, deltaTime);
        this.collectibles.update(deltaTime, this.track);
        this.directionIndicator.update(this.player.car.position, this.track);

        // Check lap completion
        const lapInfo = this.track.checkLap(this.player.car.position);
        if (lapInfo.newLap) {
            document.getElementById('lapValue').textContent = lapInfo.currentLap;
            document.getElementById('lastLapValue').textContent = lapInfo.lapTime.toFixed(1);
            if (lapInfo.bestLap < Infinity) {
                document.getElementById('bestLapValue').textContent = lapInfo.bestLap.toFixed(1);
            }
        }

        // Check collectibles
        const scoreGained = this.collectibles.checkCollisions(this.player.car.position);
        if (scoreGained > 0) {
            this.score += scoreGained;
            document.getElementById('scoreValue').textContent = this.score;
        }

        // Update camera
        const cameraDistance = 20;
        const cameraHeight = 10;
        const targetX = this.player.car.position.x - Math.sin(this.player.angle) * cameraDistance;
        const targetZ = this.player.car.position.z - Math.cos(this.player.angle) * cameraDistance;
        
        this.camera.position.x += (targetX - this.camera.position.x) * 0.1;

        this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
        this.camera.position.y = cameraHeight;
        this.camera.lookAt(this.player.car.position);

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Create and start the game immediately
const game = new Game();
