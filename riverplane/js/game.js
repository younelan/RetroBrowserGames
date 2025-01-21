import { Player } from './player.js';
import { CorridorManager } from './corridorManager.js';
import { InputManager } from './inputManager.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        this.scrollSpeed = 120; // Units per second
        this.score = 0;
        this.distance = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.targetDistance = 5000;

        this.resizeGame = this.resizeGame.bind(this);
        window.addEventListener('resize', this.resizeGame);

        this.currentLevel = 1;
        this.maxLevels = 5;
        this.levelDistance = 2000; // Increase distance needed per level
        this.levelCompleted = false;

        this.lastTime = performance.now();
        this.fixedTimeStep = 1000 / 60; // Target 60 FPS

        this.buttonArea = {
            x: 0,
            y: 0,
            width: 150,
            height: 50
        };

        this.init();
    }

    init() {
        // Set initial size before creating other objects
        this.resizeGame();
        
        // Initialize game objects after canvas size is set
        this.player = new Player(this);
        this.corridorManager = new CorridorManager(this);
        this.inputManager = new InputManager(this);
        
        this.corridorManager.initCorridor();
        this.highScore = localStorage.getItem('rivergame') || 0;
        
        // Start game loop
        requestAnimationFrame(this.gameLoop);

        // Add touch event listeners for the game canvas
        this.canvas.addEventListener('touchstart', this.handleGameTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleGameTouch.bind(this));
        this.canvas.addEventListener('touchend', () => {
            this.inputManager.resetTouchControls();
        });
    }

    resizeGame() {
        // Make the game canvas square
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.width = size;
        this.height = size;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.player?.resetPosition();
    }

    update(deltaTime) {
        if (this.gameOver || this.gameWon) return;

        // Convert deltaTime to seconds and clamp it
        const dt = Math.min(deltaTime, 100) / 1000; // Cap at 100ms to prevent huge jumps
        
        this.player.update(dt);
        this.corridorManager.update(dt);
        
        // Update distance using deltaTime
        this.distance += this.scrollSpeed * dt;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.corridorManager.draw();
        this.player.draw();
        this.drawHUD();
    }

    drawHUD() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Level: ${this.currentLevel}/${this.maxLevels}`, 10, 30);
        this.ctx.fillText(`Lives: ${this.player.lives}`, 10, 60);
        
        // Fix NaN displays
        const fuelDisplay = Math.max(0, Math.min(100, Math.ceil(this.player.fuel)));
        const progressDisplay = Math.max(0, Math.min(100, Math.floor((this.distance % this.levelDistance) / this.levelDistance * 100)));
        
        this.ctx.fillText(`Fuel: ${fuelDisplay}%`, 10, 90);
        this.ctx.fillText(`Score: ${this.score}`, 10, 120);
        this.ctx.fillText(`Progress: ${progressDisplay}%`, 10, 150);

        if (this.gameOver || this.gameWon) {
            // Add semi-transparent background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Center message
            const messageY = this.height * 0.4;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = Math.floor(this.width * 0.08) + 'px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.gameOver ? 'GAME OVER' : 'YOU WIN!', this.width / 2, messageY);

            // Score
            this.ctx.font = Math.floor(this.width * 0.05) + 'px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, messageY + 50);

            // High score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('rivergame', this.highScore);
            }
            this.ctx.fillStyle = this.score >= this.highScore ? '#ff0' : '#fff';
            this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, messageY + 100);

            // Draw restart button - scale with screen size
            this.buttonArea = {
                width: Math.min(150, this.width * 0.4),
                height: Math.min(50, this.height * 0.1)
            };
            this.buttonArea.x = this.width / 2 - this.buttonArea.width / 2;
            this.buttonArea.y = messageY + 150;

            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(
                this.buttonArea.x,
                this.buttonArea.y,
                this.buttonArea.width,
                this.buttonArea.height
            );

            this.ctx.fillStyle = '#fff';
            this.ctx.font = Math.floor(this.width * 0.04) + 'px Arial';
            this.ctx.fillText('RESTART', this.width / 2, this.buttonArea.y + this.buttonArea.height * 0.65);

            // Add event listeners if not already added
            if (!this.restartListenersAdded) {
                this.canvas.addEventListener('click', this.handleRestartClick.bind(this));
                this.canvas.addEventListener('touchend', this.handleRestartTouch.bind(this));
                this.restartListenersAdded = true;
            }
        }
    }

    handleRestartClick(event) {
        // Only process restart click if game is over
        if (!this.gameOver && !this.gameWon) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Scale coordinates to canvas
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        if (this.isInsideButton(canvasX, canvasY)) {
            this.restartGame();
        }
    }

    handleRestartTouch(event) {
        // Only process restart touch if game is over
        if (!this.gameOver && !this.gameWon) {
            return;
        }

        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.changedTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Scale coordinates to canvas
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        if (this.isInsideButton(canvasX, canvasY)) {
            this.restartGame();
        }
    }

    isInsideButton(x, y) {
        return x >= this.buttonArea.x &&
               x <= this.buttonArea.x + this.buttonArea.width &&
               y >= this.buttonArea.y &&
               y <= this.buttonArea.y + this.buttonArea.height;
    }

    restartGame() {
        this.gameOver = false;
        this.gameWon = false;
        this.score = 0;
        this.distance = 0;
        this.currentLevel = 1;
        this.scrollSpeed = 120; // Units per second instead of per frame
        this.player = new Player(this);
        this.corridorManager = new CorridorManager(this);
        this.levelCompleted = false;
        this.corridorManager.initCorridor();
        this.player.resetPosition();
        
        // Remove event listeners
        if (this.restartListenersAdded) {
            this.canvas.removeEventListener('click', this.handleRestartClick.bind(this));
            this.canvas.removeEventListener('touchend', this.handleRestartTouch.bind(this));
            this.restartListenersAdded = false;
        }
    }

    handleGameTouch(e) {
        // Don't process game touches if game is over
        if (this.gameOver || this.gameWon) {
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Calculate which third of the screen was touched
        const horizontalSection = Math.floor(x / (this.width / 3));
        const verticalSection = Math.floor(y / (this.height / 3));

        this.inputManager.handleGameAreaTouch(horizontalSection, verticalSection);
    }

    gameLoop = (currentTime) => {
        if (!this.lastTime) {
            this.lastTime = currentTime;
            requestAnimationFrame(this.gameLoop);
            return;
        }

        const deltaTime = Math.min(currentTime - this.lastTime, 100);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(this.gameLoop);
    }
}

