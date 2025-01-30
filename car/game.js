import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Player } from './modules/player.js';
import { AIController } from './modules/ai.js';
import { Track } from './modules/track.js';
import { Collectibles } from './modules/collectibles.js';
import { DirectionIndicator } from './modules/direction.js';

class Game {
    constructor() {
        this.setupGame();
        this.setupEventListeners();
        // Start game immediately
        this.startGame();
    }

    setupGame() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        
        // Game state
        this.gameStarted = false;
        this.raceTime = 0;
        this.score = 0;
        
        // Set sky color
        this.scene.background = new THREE.Color(0x87CEEB);
        
        this.setupLighting();
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
        
        // Start animation loop
        this.lastTime = 0;
        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 100, 0);
        this.scene.add(directionalLight);

        this.camera.position.set(0, 120, 0);
        this.camera.lookAt(0, 0, 0);
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

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        // Touch controls
        document.getElementById('accelerate')?.addEventListener('touchstart', () => {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        });
        
        document.getElementById('brake')?.addEventListener('touchstart', () => {
            this.player.speed = Math.max(this.player.speed - this.player.deceleration, -this.player.maxSpeed/2);
        });
        
        document.getElementById('left')?.addEventListener('touchstart', () => {
            this.player.angle -= this.player.turnSpeed;
        });
        
        document.getElementById('right')?.addEventListener('touchstart', () => {
            this.player.angle += this.player.turnSpeed;
        });

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
        }, 1000 / 60);
    }

    startGame() {
        // Hide start screen
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }

        this.gameStarted = true;
        this.raceTime = 0;
        this.score = 0;
        this.player.reset();
        this.aiController.reset();
        this.collectibles.reset();
        
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('timeValue').textContent = this.raceTime;
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!deltaTime || !this.gameStarted) return;

        // Update game time and score display
        this.raceTime += deltaTime;
        document.getElementById('timeValue').textContent = Math.floor(this.raceTime);

        // Update game components
        this.player.update();
        this.aiController.update();
        this.collectibles.update(deltaTime);
        this.directionIndicator.update(this.player.car.position);

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
