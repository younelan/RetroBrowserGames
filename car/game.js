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
        
        // Then setup components
        this.setupScene();
        this.setupLights();
        this.setupControls();
        this.setupTouchControls();
        
        // Start the game immediately
        this.startGame();
        
        // Start animation loop
        this.animate();
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
        
        // Initialize game components
        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.aiController = new AIController(this.scene);
        this.collectibles = new Collectibles(this.scene);
        this.directionIndicator = new DirectionIndicator(this.scene);
        
        // Create initial AI cars
        for (let i = 0; i < 3; i++) {
            this.aiController.createAICar();
        }
        
        // Set initial AI speed
        this.aiController.setSpeed(1.2);

        // Adjust player properties for better mobile control
        this.player.maxSpeed = 1.5;  // Reduced max speed
        this.player.acceleration = 0.03;  // Smoother acceleration
        this.player.deceleration = 0.02;  // Smoother deceleration
        this.player.turnSpeed = 0.02;     // Smoother turning
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
        
        // Keyboard controls
        const keyState = {};
        
        document.addEventListener('keydown', (e) => {
            keyState[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            keyState[e.key] = false;
        });
        
        // Game loop for continuous key checking
        setInterval(() => {
            if (!this.gameStarted) return;
            
            if (keyState['ArrowUp'] || keyState['w']) {
                this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
            }
            if (keyState['ArrowDown'] || keyState['s']) {
                this.player.speed = Math.max(this.player.speed - this.player.deceleration, -this.player.maxSpeed/2);
            }
            if (keyState['ArrowLeft'] || keyState['a']) {
                this.player.angle -= this.player.turnSpeed;
            }
            if (keyState['ArrowRight'] || keyState['d']) {
                this.player.angle += this.player.turnSpeed;
            }
            if (!keyState['ArrowUp'] && !keyState['w'] && !keyState['ArrowDown'] && !keyState['s']) {
                // Apply deceleration when no acceleration/brake keys are pressed
                if (this.player.speed > 0) {
                    this.player.speed = Math.max(0, this.player.speed - this.player.deceleration);
                } else if (this.player.speed < 0) {
                    this.player.speed = Math.min(0, this.player.speed + this.player.deceleration);
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
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isTouching = true;
            const touch = e.touches[0];
            this.dragStartX = touch.clientX;
            this.touchX = 0;
            
            // Start accelerating immediately when touched
            this.player.speed = Math.min(this.player.speed + this.player.acceleration * 2, this.player.maxSpeed);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchX = (touch.clientX - this.dragStartX) / 100;
            this.currentTurnAmount = this.touchX * this.player.turnSpeed;
            
            // Update player angle based on drag
            this.player.angle += this.currentTurnAmount;
            
            // Keep accelerating while touching
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        });
        
        canvas.addEventListener('touchend', () => {
            this.isTouching = false;
            this.touchX = 0;
            this.currentTurnAmount = 0;
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
        this.gameStarted = true;
        this.raceTime = 0;
        this.score = 0;
        
        // Reset all components
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
        this.player.update();
        this.aiController.update(this.track);
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
