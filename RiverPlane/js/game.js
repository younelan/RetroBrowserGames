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
            this.inputManager.lastTouch.active = false;
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
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        
        const progressOffset = 8; // Offset to align bars with text vertically
        
        // Level number and Progress bar
        this.ctx.fillText(`${this.currentLevel}`, 10, 10);
        
        // Progress bar aligned with level text
        const progressPercent = Math.max(0, Math.min(100, 
            Math.floor((this.distance % this.levelDistance) / this.levelDistance * 100)));
        const progressBarWidth = this.width * 0.4 - 40;
        const progressBarHeight = 15;
        const progressX = 30;
        const progressY = 10 - progressBarHeight + progressOffset;

        // Progress bar background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(progressX, progressY, progressBarWidth, progressBarHeight);

        // Progress bar fill
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(progressX, progressY, progressBarWidth * (progressPercent / 100), progressBarHeight);

        // Fuel label and bar
        this.ctx.fillText('F', this.width * 0.4, 10);
        
        const fuelLevel = Math.max(0, Math.min(100, Math.ceil(this.player.fuel)));
        const fuelBarWidth = this.width * 0.4 - 40;
        const fuelBarHeight = 15;
        const fuelX = this.width * 0.4 + 20;
        const fuelY = 10 - fuelBarHeight + progressOffset;

        // Fuel bar background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(fuelX, fuelY, fuelBarWidth, fuelBarHeight);

        // Fuel bar fill with color based on level
        if (fuelLevel > 60) {
            this.ctx.fillStyle = '#2ecc71';
        } else if (fuelLevel > 25) {
            this.ctx.fillStyle = '#f39c12';
        } else {
            this.ctx.fillStyle = '#e74c3c';
        }
        this.ctx.fillRect(fuelX, fuelY, fuelBarWidth * (fuelLevel / 100), fuelBarHeight);

        // Score
        this.ctx.fillText(`${this.score}`, this.width * 0.8, 10);

        // Lives
        this.ctx.fillText('❤️', 10, this.height - 20);
        this.ctx.fillText(`${this.player.lives}`, 30, this.height - 20);

        // Game over screen
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
            this.ctx.fillRect(this.width / 2 - 75, this.height / 2 + 100, 150, 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
               this.ctx.fillText('RESTART', this.width / 2, this.height / 2 + 135);

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
        if (this.gameOver || this.gameWon) return;

        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate grid sections using proper scaling
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = (touch.clientX - rect.left) * scaleX;
        const canvasY = (touch.clientY - rect.top) * scaleY;
        
        const horizontalSection = Math.floor(canvasX / (this.width / 3));
        const verticalSection = Math.floor(canvasY / (this.height / 3));

        const isMove = e.type === 'touchmove';
        this.inputManager.handleGameAreaTouch(horizontalSection, verticalSection, touch, isMove);
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

