class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isGameOver = false;
        this.isGameStarted = false;

        // Game objects
        this.gorilla = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            velocityY: 0,
            isJumping: false
        };

        this.platforms = [];
        this.bananas = [];
        this.obstacles = [];
        
        // Game constants
        this.gravity = 0.5;
        this.jumpForce = -15;
        this.platformSpeed = 2;
        this.minPlatformGap = 100;
        this.maxPlatformGap = 200;

        // Initialize event listeners
        this.initializeEventListeners();
        this.resize();
    }

    initializeEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.resize());

        // Handle touch/click events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isGameStarted && !this.isGameOver) {
                this.jump();
            }
        });

        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isGameStarted && !this.isGameOver) {
                this.jump();
            }
        });

        // Handle start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        // Handle restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Adjust gorilla position on resize
        if (!this.isGameStarted) {
            this.gorilla.x = this.canvas.width * 0.2;
            this.gorilla.y = this.canvas.height * 0.5;
        }
    }

    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        this.isGameStarted = true;
        this.isGameOver = false;
        this.score = 0;
        this.updateScore();
        
        // Initialize platforms
        this.platforms = [];
        this.addInitialPlatforms();
        
        // Start game loop
        this.gameLoop();
    }

    resetGame() {
        this.gorilla.x = this.canvas.width * 0.2;
        this.gorilla.y = this.canvas.height * 0.5;
        this.gorilla.velocityY = 0;
        this.platforms = [];
        this.bananas = [];
        this.obstacles = [];
        this.score = 0;
        document.getElementById('game-over-screen').classList.add('hidden');
    }

    addInitialPlatforms() {
        // Add initial platform under gorilla
        this.platforms.push({
            x: this.gorilla.x - 50,
            y: this.gorilla.y + 100,
            width: 150,
            height: 20
        });

        // Add more platforms
        let lastX = this.gorilla.x + 100;
        for (let i = 0; i < 5; i++) {
            this.addPlatform(lastX);
            lastX = this.platforms[this.platforms.length - 1].x + this.platforms[this.platforms.length - 1].width;
        }
    }

    addPlatform(startX) {
        const width = 100 + Math.random() * 100;
        const gap = this.minPlatformGap + Math.random() * (this.maxPlatformGap - this.minPlatformGap);
        const minY = 100;
        const maxY = this.canvas.height - 100;
        const y = Math.random() * (maxY - minY) + minY;

        this.platforms.push({
            x: startX + gap,
            y: y,
            width: width,
            height: 20
        });

        // Add banana above platform (30% chance)
        if (Math.random() < 0.3) {
            this.bananas.push({
                x: startX + gap + width / 2,
                y: y - 50,
                width: 20,
                height: 20,
                collected: false
            });
        }
    }

    jump() {
        if (this.gorilla.isJumping) return;
        this.gorilla.velocityY = this.jumpForce;
        this.gorilla.isJumping = true;
    }

    update() {
        if (!this.isGameStarted || this.isGameOver) return;

        // Update gorilla physics
        this.gorilla.velocityY += this.gravity;
        this.gorilla.y += this.gorilla.velocityY;

        // Move platforms and check collision
        this.platforms.forEach(platform => {
            platform.x -= this.platformSpeed;

            // Platform collision
            if (this.gorilla.velocityY > 0 && 
                this.gorilla.x + this.gorilla.width > platform.x &&
                this.gorilla.x < platform.x + platform.width &&
                this.gorilla.y + this.gorilla.height > platform.y &&
                this.gorilla.y + this.gorilla.height < platform.y + platform.height + this.gorilla.velocityY) {
                this.gorilla.y = platform.y - this.gorilla.height;
                this.gorilla.velocityY = 0;
                this.gorilla.isJumping = false;
            }
        });

        // Check banana collection
        this.bananas.forEach(banana => {
            if (!banana.collected &&
                this.gorilla.x + this.gorilla.width > banana.x &&
                this.gorilla.x < banana.x + banana.width &&
                this.gorilla.y + this.gorilla.height > banana.y &&
                this.gorilla.y < banana.y + banana.height) {
                banana.collected = true;
                this.score += 10;
                this.updateScore();
            }
        });

        // Remove off-screen platforms and add new ones
        if (this.platforms[0].x + this.platforms[0].width < 0) {
            this.platforms.shift();
            this.addPlatform(this.platforms[this.platforms.length - 1].x);
        }

        // Remove collected bananas
        this.bananas = this.bananas.filter(banana => !banana.collected);

        // Check game over conditions
        if (this.gorilla.y > this.canvas.height || this.gorilla.y < 0) {
            this.gameOver();
        }
    }

    updateScore() {
        document.getElementById('scoreValue').textContent = this.score;
    }

    gameOver() {
        this.isGameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw platforms
        this.ctx.fillStyle = '#27ae60';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Draw bananas
        this.ctx.fillStyle = '#f1c40f';
        this.bananas.forEach(banana => {
            if (!banana.collected) {
                this.ctx.beginPath();
                this.ctx.arc(banana.x + banana.width/2, banana.y + banana.height/2, banana.width/2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw gorilla
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(this.gorilla.x, this.gorilla.y, this.gorilla.width, this.gorilla.height);
    }

    gameLoop() {
        this.update();
        this.draw();

        if (!this.isGameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    new Game();
});
