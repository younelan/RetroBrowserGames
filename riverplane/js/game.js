import { Player } from './player.js';
import { CorridorManager } from './corridorManager.js';
import { InputManager } from './inputManager.js';

export class Game {
    constructor(canvasId, controlsId) {
        this.canvas = document.getElementById(canvasId);
        this.controlsCanvas = document.getElementById(controlsId);
        this.ctx = this.canvas.getContext('2d');
        this.ctrlCtx = this.controlsCanvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        this.scrollSpeed = 2;
        this.score = 0;
        this.distance = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.targetDistance = 5000;

        this.player = new Player(this);
        this.corridorManager = new CorridorManager(this);
        this.inputManager = new InputManager(this);

        this.resizeGame = this.resizeGame.bind(this);
        window.addEventListener('resize', this.resizeGame);

        this.currentLevel = 1;
        this.maxLevels = 3;
        this.levelDistance = 2000; // Increase distance needed per level
        this.levelCompleted = false;

        this.init();
    }

    init() {
        this.resizeGame();
        this.corridorManager.initCorridor();
        this.highScore = localStorage.getItem('rivergame') || 0;
        this.gameLoop();
    }

    resizeGame() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            this.width = Math.min(window.innerHeight, window.innerWidth * 0.7);
            this.height = this.width;
            this.controlsCanvas.width = window.innerWidth - this.width;
            this.controlsCanvas.height = this.height;
        } else {
            this.width = Math.min(window.innerWidth, window.innerHeight * 0.7);
            this.height = this.width;
            this.controlsCanvas.width = this.width;
            this.controlsCanvas.height = window.innerHeight - this.height;
        }
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.player?.resetPosition();
    }

    update() {
        if (this.gameOver || this.gameWon) return;

        this.player.update();
        this.corridorManager.update();
        
        // Update distance and check level completion
        this.distance += this.scrollSpeed;
        if (this.distance >= this.levelDistance * this.currentLevel) {
            this.levelCompleted = true;
            this.score += 200; // Add points for passing a level
            if (this.currentLevel >= this.maxLevels) {
                this.gameWon = true;
            } else {
                this.currentLevel++;
                this.corridorManager.initCorridor(this.currentLevel);
                this.player.resetPosition();
                // Increase difficulty with each level
                this.scrollSpeed += 0.5;
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.corridorManager.draw();
        this.player.draw();
        this.drawHUD();
        this.drawControls();
    }

    drawHUD() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Level: ${this.currentLevel}/${this.maxLevels}`, 10, 30);
        this.ctx.fillText(`Lives: ${this.player.lives}`, 10, 60);
        this.ctx.fillText(`Fuel: ${Math.ceil(this.player.fuel)}%`, 10, 90);
        this.ctx.fillText(`Score: ${this.score}`, 10, 120);
        this.ctx.fillText(`Progress: ${Math.floor((this.distance % this.levelDistance) / this.levelDistance * 100)}%`, 10, 150);

        if (this.gameOver || this.gameWon) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.gameOver ? 'GAME OVER' : 'YOU WIN!', this.width / 2, this.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 50);

            // Check and update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('rivergame', this.highScore);
            }
            this.ctx.fillStyle = this.score >= this.highScore ? '#ff0' : '#fff'; // Yellow for new high score
            this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + 100);

            // Draw restart button
            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(this.width / 2 - 75, this.height / 2 + 150, 150, 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('RESTART', this.width / 2, this.height / 2 + 185);

            // Add event listener for restart button
            this.canvas.addEventListener('click', this.handleRestartClick.bind(this));
        }
    }

    handleRestartClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (x >= this.width / 2 - 75 && x <= this.width / 2 + 75 &&
            y >= this.height / 2 + 100 && y <= this.height / 2 + 150) {
            this.restartGame();
        }
    }

    restartGame() {
        this.gameOver = false;
        this.gameWon = false;
        this.score = 0;
        this.distance = 0;
        this.currentLevel = 1;
        this.scrollSpeed = 2;
        this.player = new Player(this);
        this.corridorManager = new CorridorManager(this);
        this.corridorManager.initCorridor();
        this.player.resetPosition();
        this.canvas.removeEventListener('click', this.handleRestartClick.bind(this));
    }

    drawControls() {
        this.ctrlCtx.fillStyle = '#222';
        this.ctrlCtx.fillRect(0, 0, this.controlsCanvas.width, this.controlsCanvas.height);
        
        this.ctrlCtx.fillStyle = '#444';
        this.ctrlCtx.font = '20px Arial';
        this.ctrlCtx.textAlign = 'center';
        
        const isVertical = this.controlsCanvas.width < this.controlsCanvas.height;
        if (isVertical) {
            this.ctrlCtx.fillText('← LEFT', this.controlsCanvas.width * 0.25, this.controlsCanvas.height/2);
            this.ctrlCtx.fillText('RIGHT →', this.controlsCanvas.width * 0.75, this.controlsCanvas.height/2);
        } else {
            this.ctrlCtx.fillText('← LEFT | RIGHT →', this.controlsCanvas.width/2, this.controlsCanvas.height/2);
        }
    }

    gameLoop = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

