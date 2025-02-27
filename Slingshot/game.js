// Game constants
const GAME_CONSTANTS = {
    PLAYER_RADIUS: 20,
    ENEMY_RADIUS: 20,
    SLINGSHOT_WIDTH: 40,
    SLINGSHOT_HEIGHT: 80,
    GROUND_HEIGHT: 50,
    GRAVITY: 0.5,
    DRAG_RADIUS: 100,
    MAX_POWER: 15,
    SKY_COLOR: '#87CEEB',
    GROUND_COLOR: '#90EE90',
    SLINGSHOT_COLOR: '#8B4513'
};

const SPRITES = {
    PLAYER: '🧙',
    ENEMY: '👺',
    GROUND: '🌱'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.debugInfo = document.getElementById('debug-info');
        
        // Initialize game state
        this.initializeGameState();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial canvas resize
        this.resizeCanvas();
        
        // Start game loop
        this.gameLoop();
    }

    initializeGameState() {
        this.currentLevel = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        this.trajectoryPoints = [];
        
        // Initialize slingshot position (will be properly set after canvas resize)
        this.slingshot = {
            x: 0,
            y: 0,
            width: GAME_CONSTANTS.SLINGSHOT_WIDTH,
            height: GAME_CONSTANTS.SLINGSHOT_HEIGHT
        };
        
        // Initialize player
        this.player = {
            x: 0,
            y: 0,
            radius: GAME_CONSTANTS.PLAYER_RADIUS,
            velocityX: 0,
            velocityY: 0,
            isLaunched: false
        };
        
        // Initialize enemies with physics
        this.enemies = [];
        
        // Initialize platforms
        this.platforms = [];
    }

    loadLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        if (!level) return;

        const groundY = this.canvas.height - GAME_CONSTANTS.GROUND_HEIGHT;

        // Set slingshot position from level data
        this.slingshot.x = level.slingshot.x * this.canvas.width;
        this.slingshot.y = groundY;

        // Load enemies with physics properties
        this.enemies = level.enemies.map(enemy => ({
            x: enemy.x * this.canvas.width,
            y: enemy.y * this.canvas.height,
            radius: GAME_CONSTANTS.ENEMY_RADIUS,
            velocityY: 0,
            isGrounded: false,
            isHit: false,
            type: enemy.type
        }));

        // Load platforms
        this.platforms = level.platforms.map(platform => ({
            x: platform.x * this.canvas.width,
            y: platform.y * this.canvas.height,
            width: platform.width * this.canvas.width,
            height: platform.height * this.canvas.height,
            color: platform.color || GAME_CONSTANTS.SLINGSHOT_COLOR,
            hasGrass: platform.hasGrass || false,
            type: platform.type || 'regular'
        }));

        this.resetPlayer();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        });
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const size = container.offsetWidth;
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Reload current level with new dimensions
        this.loadLevel(this.currentLevel);
    }

    resetPlayer() {
        const slingshotTipY = this.slingshot.y - this.slingshot.height - 20;
        this.player.x = this.slingshot.x;
        this.player.y = slingshotTipY;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isLaunched = false;
    }

    handleStart(e) {
        if (this.player.isLaunched) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.player.radius + 10) {
            this.isDragging = true;
            this.dragStart = { x, y };
            this.dragCurrent = { x, y };
        }
    }

    handleMove(e) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.dragCurrent = { x, y };

        // Calculate drag vector relative to slingshot tip
        const slingshotTipY = this.slingshot.y - this.slingshot.height - 20;
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), GAME_CONSTANTS.DRAG_RADIUS);
        
        if (distance > 0) {
            this.player.x = this.slingshot.x + dx;
            this.player.y = slingshotTipY + dy;
        }
        
        this.calculateTrajectory();
    }

    handleEnd() {
        if (!this.isDragging) return;
        
        const dx = this.dragCurrent.x - this.dragStart.x;
        const dy = this.dragCurrent.y - this.dragStart.y;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), GAME_CONSTANTS.DRAG_RADIUS);
        
        if (distance > 0) {
            const power = (distance / GAME_CONSTANTS.DRAG_RADIUS) * GAME_CONSTANTS.MAX_POWER;
            this.player.velocityX = -dx / distance * power;
            this.player.velocityY = -dy / distance * power;
            this.player.isLaunched = true;
        }
        
        this.isDragging = false;
        this.trajectoryPoints = [];
    }

    calculateTrajectory() {
        if (!this.isDragging) return;
        
        this.trajectoryPoints = [];
        const slingshotTipY = this.slingshot.y - this.slingshot.height - 20;
        const dx = this.dragCurrent.x - this.dragStart.x;
        const dy = this.dragCurrent.y - this.dragStart.y;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), GAME_CONSTANTS.DRAG_RADIUS);
        
        if (distance > 0) {
            const power = (distance / GAME_CONSTANTS.DRAG_RADIUS) * GAME_CONSTANTS.MAX_POWER;
            let x = this.player.x;
            let y = this.player.y;
            let vx = -dx / distance * power;
            let vy = -dy / distance * power;
            
            for (let i = 0; i < 30; i++) {
                x += vx;
                y += vy;
                vy += GAME_CONSTANTS.GRAVITY;
                
                this.trajectoryPoints.push({ x, y });
                
                if (y > this.canvas.height - GAME_CONSTANTS.GROUND_HEIGHT) break;
            }
        }
    }

    update() {
        const groundY = this.canvas.height - GAME_CONSTANTS.GROUND_HEIGHT;

        // Update enemies
        for (let enemy of this.enemies) {
            if (!enemy.isHit && !enemy.isGrounded) {
                enemy.velocityY += GAME_CONSTANTS.GRAVITY;
                enemy.y += enemy.velocityY;

                // Platform collision for enemies
                for (const platform of this.platforms) {
                    if (enemy.x > platform.x && enemy.x < platform.x + platform.width &&
                        enemy.y + enemy.radius > platform.y && enemy.y + enemy.radius < platform.y + platform.height) {
                        enemy.y = platform.y - enemy.radius;
                        enemy.velocityY = 0;
                        enemy.isGrounded = true;
                        break;
                    }
                }

                // Ground collision for enemies
                if (enemy.y + enemy.radius > groundY) {
                    enemy.y = groundY - enemy.radius;
                    enemy.velocityY = 0;
                    enemy.isGrounded = true;
                }
            }
        }

        if (this.player.isLaunched) {
            this.player.x += this.player.velocityX;
            this.player.y += this.player.velocityY;
            this.player.velocityY += GAME_CONSTANTS.GRAVITY;

            this.checkCollisions();

            // Reset if out of bounds
            if (this.player.x < 0 || this.player.x > this.canvas.width) {
                this.resetPlayer();
            }
        } else if (this.isDragging) {
            const slingshotTipY = this.slingshot.y - this.slingshot.height - 20;
            const dx = this.dragCurrent.x - this.dragStart.x;
            const dy = this.dragCurrent.y - this.dragStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dragDistance = Math.min(distance, GAME_CONSTANTS.DRAG_RADIUS);
            
            this.player.x = this.slingshot.x + dx;
            this.player.y = slingshotTipY + dy;
        }
    }

    checkCollisions() {
        if (!this.player.isLaunched) return;

        const groundY = this.canvas.height - GAME_CONSTANTS.GROUND_HEIGHT;

        // Ground collision
        if (this.player.y + this.player.radius > groundY) {
            this.resetPlayer();
            return;
        }

        // Enemy collisions
        for (let enemy of this.enemies) {
            if (enemy.isHit) continue;

            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player.radius + enemy.radius) {
                enemy.isHit = true;
                enemy.velocityY = -10; // Give hit enemies a little bounce
                enemy.isGrounded = false;
            }
        }

        // Check if all enemies are hit
        const remainingEnemies = this.enemies.filter(enemy => !enemy.isHit).length;
        if (remainingEnemies === 0) {
            console.log("You win! All gnomes defeated!");
            this.currentLevel++;
            if (this.currentLevel < LEVELS.length) {
                this.loadLevel(this.currentLevel);
            }
        }
    }

    drawSlingshot() {
        // Draw slingshot base
        this.ctx.fillStyle = GAME_CONSTANTS.SLINGSHOT_COLOR;
        this.ctx.fillRect(
            this.slingshot.x - this.slingshot.width/2,
            this.slingshot.y - this.slingshot.height,
            this.slingshot.width,
            this.slingshot.height
        );

        // Draw V shape at top
        this.ctx.beginPath();
        this.ctx.moveTo(this.slingshot.x - this.slingshot.width/2, 
                       this.slingshot.y - this.slingshot.height);
        this.ctx.lineTo(this.slingshot.x - this.slingshot.width, 
                       this.slingshot.y - this.slingshot.height - 20);
        this.ctx.lineTo(this.slingshot.x + this.slingshot.width/2, 
                       this.slingshot.y - this.slingshot.height);
        this.ctx.lineTo(this.slingshot.x + this.slingshot.width, 
                       this.slingshot.y - this.slingshot.height - 20);
        this.ctx.strokeStyle = GAME_CONSTANTS.SLINGSHOT_COLOR;
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky
        this.ctx.fillStyle = GAME_CONSTANTS.SKY_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw platforms
        for (const platform of this.platforms) {
            if (platform.type === "ground") {
                // Draw ground-like platform
                this.ctx.fillStyle = GAME_CONSTANTS.GROUND_COLOR;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                // Draw grass on ground
                for(let x = platform.x; x < platform.x + platform.width; x += 20) {
                    this.ctx.fillText(SPRITES.GROUND, x, platform.y);
                }
            } else {
                // Draw regular platform
                this.ctx.fillStyle = platform.color;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                // Draw grass on platform if specified
                if (platform.hasGrass) {
                    for(let x = platform.x; x < platform.x + platform.width; x += 20) {
                        this.ctx.fillText(SPRITES.GROUND, x, platform.y);
                    }
                }
            }
        }

        // Draw rubber band first (behind slingshot)
        if (!this.player.isLaunched) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.slingshot.x - this.slingshot.width, 
                          this.slingshot.y - this.slingshot.height - 20);
            this.ctx.lineTo(this.player.x, this.player.y);
            this.ctx.lineTo(this.slingshot.x + this.slingshot.width, 
                          this.slingshot.y - this.slingshot.height - 20);
            this.ctx.strokeStyle = '#800000';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // Draw slingshot
        this.drawSlingshot();

        // Draw trajectory preview
        if (this.isDragging && this.trajectoryPoints.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.trajectoryPoints[0].x, this.trajectoryPoints[0].y);
            for (let point of this.trajectoryPoints) {
                this.ctx.lineTo(point.x, point.y);
            }
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw player gnome
        this.ctx.font = `${GAME_CONSTANTS.PLAYER_RADIUS * 2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(SPRITES.PLAYER, this.player.x, this.player.y);

        // Draw enemy gnomes
        this.ctx.font = `${GAME_CONSTANTS.ENEMY_RADIUS * 2}px Arial`;
        for (const enemy of this.enemies) {
            if (!enemy.isHit) {
                this.ctx.fillText(SPRITES.ENEMY, enemy.x, enemy.y);
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
