// Game constants
const GAME_CONSTANTS = {
    PLAYER_RADIUS: 20,
    ENEMY_RADIUS: 20,
    SLINGSHOT_WIDTH: 32,  // Match grid size
    SLINGSHOT_HEIGHT: 64, // 2x grid size
    GROUND_HEIGHT: 40,
    GRAVITY: 0.5,
    DRAG_RADIUS: 100,
    MAX_POWER: 25,
    SKY_COLOR: '#87CEEB',
    GROUND_COLOR: '#90EE90',
    SLINGSHOT_COLOR: '#8B4513',
    GRID_SIZE: 32,
    VIEWPORT_WIDTH: 800,
    VIEWPORT_HEIGHT: 600
};

const SPRITES = {
    PLAYER: '🧙',  // Wizard gnome
    ENEMY: '👺',   // Enemy gnome
    GROUND: '🌱'   // Grass
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.debugInfo = document.getElementById('debug-info');
        
        // Initialize game state
        this.currentLevel = 0;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        this.trajectoryPoints = [];
        this.placeholders = [];  // Add placeholders array
        this.camera = { x: 0, y: 0 };
        
        // Initialize slingshot position
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
        
        this.enemies = [];
        this.platforms = [];
        this.levelWidth = 0;
        this.levelHeight = 0;
        this.viewport = null;
        
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
        this.placeholders = [];  // Add placeholders array
        this.camera = { x: 0, y: 0 };
        
        // Initialize slingshot position
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
        
        this.enemies = [];
        this.platforms = [];
        this.levelWidth = 0;
        this.levelHeight = 0;
        this.viewport = null;
    }

    loadLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        if (!level) return;

        // Set level dimensions and viewport
        this.levelWidth = level.width;
        this.levelHeight = level.height;
        this.viewport = {
            width: GAME_CONSTANTS.VIEWPORT_WIDTH,
            height: level.viewport || GAME_CONSTANTS.VIEWPORT_HEIGHT
        };

        // Set slingshot position from level data
        this.slingshot.x = level.slingshot.x;
        this.slingshot.y = level.slingshot.y;

        // Initialize player at slingshot position
        this.player = {
            x: level.slingshot.x,
            y: level.slingshot.y - 60,  // Adjust height so bottom aligns with old top
            radius: 20,
            velocityX: 0,
            velocityY: 0,
            isLaunched: false
        };

        // Load enemies with physics properties
        this.enemies = level.enemies.map(enemy => ({
            x: enemy.x,
            y: enemy.y,
            radius: GAME_CONSTANTS.ENEMY_RADIUS,
            velocityY: 0,
            isGrounded: false,
            isHit: false,
            type: enemy.type
        }));

        // Load platforms
        this.platforms = level.platforms.map(platform => ({
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height,
            color: platform.color || GAME_CONSTANTS.SLINGSHOT_COLOR,
            hasGrass: platform.hasGrass || false,
            type: platform.type || 'regular'
        }));

        // Reset game state
        this.placeholders = [];
        this.camera = { x: 0, y: 0 };
        this.updateCamera();
    }

    updateCamera() {
        // Center camera on player
        this.camera.x = Math.max(0, Math.min(this.player.x - this.viewport.width / 2,
                                            this.levelWidth - this.viewport.width));
        this.camera.y = Math.max(0, Math.min(this.player.y - this.viewport.height / 2,
                                            this.levelHeight - this.viewport.height));
    }

    resizeCanvas() {
        // Set canvas size based on level's viewport
        if (this.viewport) {
            this.canvas.width = this.viewport.width;
            this.canvas.height = this.viewport.height;
        } else {
            this.canvas.width = GAME_CONSTANTS.VIEWPORT_WIDTH;
            this.canvas.height = GAME_CONSTANTS.VIEWPORT_HEIGHT;
        }
        
        // Only reload level if one is loaded
        if (this.currentLevel >= 0) {
            this.loadLevel(this.currentLevel);
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state and apply scaling
        this.ctx.save();
        const scaleX = this.canvas.width / this.levelWidth;
        const scaleY = this.canvas.height / this.viewport.height;
        this.ctx.scale(scaleX, scaleY);
        
        // Apply camera translation
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw sky background
        this.ctx.fillStyle = GAME_CONSTANTS.SKY_COLOR;
        this.ctx.fillRect(this.camera.x, this.camera.y, this.levelWidth, this.viewport.height);

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

        // Draw slingshot
        this.drawSlingshot();

        // Draw trajectory first (behind player)
        if (this.isDragging && this.trajectoryPoints.length > 0) {
            // Draw thick white path
            this.ctx.beginPath();
            this.ctx.moveTo(this.trajectoryPoints[0].x, this.trajectoryPoints[0].y);
            for (let i = 1; i < this.trajectoryPoints.length; i++) {
                this.ctx.lineTo(this.trajectoryPoints[i].x, this.trajectoryPoints[i].y);
            }
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 6;
            this.ctx.stroke();
        }

        // Draw placeholders
        for (const placeholder of this.placeholders) {
            this.ctx.font = '32px Arial';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';  // Semi-transparent
            this.ctx.fillText(SPRITES.PLAYER, 
                placeholder.x - placeholder.radius, 
                placeholder.y + placeholder.radius);
        }

        // Draw player
        if (!this.player.isLaunched || this.player.velocityY < 20) {  // Only hide if falling fast
            this.ctx.font = '32px Arial';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillStyle = '#FFFFFF';  // Full opacity for active player
            this.ctx.fillText(SPRITES.PLAYER, 
                this.player.x - this.player.radius, 
                this.player.y + this.player.radius);
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            if (!enemy.isHit) {
                this.ctx.font = '32px Arial';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(SPRITES.ENEMY, 
                    enemy.x - enemy.radius, 
                    enemy.y + enemy.radius);  // Add radius to y to position bottom at y
            }
        }

        // Restore context state
        this.ctx.restore();
    }

    drawSlingshot() {
        this.ctx.save();
        
        // Draw slingshot base
        this.ctx.fillStyle = GAME_CONSTANTS.SLINGSHOT_COLOR;
        const baseWidth = 20;
        const baseHeight = 60;
        
        // Draw main pole
        this.ctx.fillRect(
            this.slingshot.x - baseWidth/2,
            this.slingshot.y - baseHeight,
            baseWidth,
            baseHeight
        );
        
        // Draw fork
        const forkWidth = 40;
        const forkHeight = 20;
        
        this.ctx.beginPath();
        // Left prong
        this.ctx.moveTo(this.slingshot.x - baseWidth/2, this.slingshot.y - baseHeight);
        this.ctx.lineTo(this.slingshot.x - forkWidth/2, this.slingshot.y - baseHeight - forkHeight);
        this.ctx.lineTo(this.slingshot.x - forkWidth/2 + 10, this.slingshot.y - baseHeight - forkHeight/2);
        this.ctx.lineTo(this.slingshot.x - baseWidth/2, this.slingshot.y - baseHeight);
        
        // Right prong
        this.ctx.moveTo(this.slingshot.x + baseWidth/2, this.slingshot.y - baseHeight);
        this.ctx.lineTo(this.slingshot.x + forkWidth/2, this.slingshot.y - baseHeight - forkHeight);
        this.ctx.lineTo(this.slingshot.x + forkWidth/2 - 10, this.slingshot.y - baseHeight - forkHeight/2);
        this.ctx.lineTo(this.slingshot.x + baseWidth/2, this.slingshot.y - baseHeight);
        
        this.ctx.fillStyle = GAME_CONSTANTS.SLINGSHOT_COLOR;
        this.ctx.fill();
        
        // Draw elastic band if dragging
        if (this.isDragging) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.slingshot.x - forkWidth/2, this.slingshot.y - baseHeight - forkHeight);
            this.ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
            this.ctx.lineTo(this.slingshot.x + forkWidth/2, this.slingshot.y - baseHeight - forkHeight);
            this.ctx.strokeStyle = '#000000';  // Black rubber band
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    update() {
        if (this.player.isLaunched) {
            // Update player position
            this.player.x += this.player.velocityX;
            this.player.y += this.player.velocityY;
            this.player.velocityY += GAME_CONSTANTS.GRAVITY;

            // Update camera to follow player
            this.updateCamera();

            // Check if player hits ground or platforms
            for (const platform of this.platforms) {
                if (this.checkPlatformCollision(this.player, platform)) {
                    break;
                }
            }

            // Check if player is out of bounds
            if (this.player.y > this.levelHeight) {
                this.resetPlayer();
            }
        }

        // Update enemies
        for (let enemy of this.enemies) {
            if (!enemy.isHit && this.checkCollision(this.player, enemy)) {
                enemy.isHit = true;
            }
        }

        // Check if level is complete
        if (this.enemies.every(enemy => enemy.isHit)) {
            this.currentLevel++;
            if (this.currentLevel < LEVELS.length) {
                this.loadLevel(this.currentLevel);
            }
        }
    }

    checkPlatformCollision(player, platform) {
        if (!player.isLaunched) return false;

        const playerBottom = player.y + player.radius;
        const playerTop = player.y - player.radius;
        const playerLeft = player.x - player.radius;
        const playerRight = player.x + player.radius;

        // Check if player is within platform's horizontal bounds
        if (playerRight > platform.x && playerLeft < platform.x + platform.width) {
            // Check for collision from above
            if (playerBottom > platform.y && playerTop < platform.y) {
                // Only handle collision if moving downward
                if (player.velocityY > 0) {
                    player.y = platform.y - player.radius;
                    
                    // Reduce both velocities on each bounce
                    player.velocityY = -player.velocityY * 0.5;
                    player.velocityX = player.velocityX * 0.8;
                    
                    // Base case: if velocities are too low, stop bouncing
                    if (Math.abs(player.velocityY) < 3 || Math.abs(player.velocityX) < 1) {
                        this.resetPlayer();  // This will create placeholder and new player
                        return true;
                    }
                    
                    return true;
                }
            }
        }

        return false;
    }

    checkCollision(player, enemy) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + enemy.radius) {
            return true;
        }

        return false;
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

    handleStart(e) {
        if (this.player.isLaunched) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Convert canvas coordinates to level coordinates
        const levelX = canvasX * (this.levelWidth / this.canvas.width) + this.camera.x;
        const levelY = canvasY * (this.viewport.height / this.canvas.height) + this.camera.y;
        
        const dx = levelX - this.player.x;
        const dy = levelY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.player.radius * 2) {  // Made hit area bigger
            this.isDragging = true;
            this.dragStart = { x: this.player.x, y: this.player.y };  // Start from player position
            this.dragCurrent = { x: this.player.x, y: this.player.y };
        }
    }

    handleMove(e) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Convert to level coordinates
        const levelX = canvasX * (this.levelWidth / this.canvas.width) + this.camera.x;
        const levelY = canvasY * (this.viewport.height / this.canvas.height) + this.camera.y;
        
        // Calculate distance from slingshot
        const dx = levelX - this.dragStart.x;
        const dy = levelY - this.dragStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > GAME_CONSTANTS.DRAG_RADIUS) {
            // Limit drag distance
            const angle = Math.atan2(dy, dx);
            this.dragCurrent = {
                x: this.dragStart.x + Math.cos(angle) * GAME_CONSTANTS.DRAG_RADIUS,
                y: this.dragStart.y + Math.sin(angle) * GAME_CONSTANTS.DRAG_RADIUS
            };
        } else {
            this.dragCurrent = { x: levelX, y: levelY };
        }
        
        // Move player to drag position
        this.player.x = this.dragCurrent.x;
        this.player.y = this.dragCurrent.y;
        
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
            
            // Start from slingshot position
            this.player.x = this.dragStart.x;
            this.player.y = this.dragStart.y;
        }
        
        this.isDragging = false;
        this.trajectoryPoints = [];
    }

    calculateTrajectory() {
        if (!this.isDragging) return;
        
        this.trajectoryPoints = [];
        const dx = this.dragCurrent.x - this.dragStart.x;
        const dy = this.dragCurrent.y - this.dragStart.y;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), GAME_CONSTANTS.DRAG_RADIUS);
        
        if (distance > 0) {
            const power = (distance / GAME_CONSTANTS.DRAG_RADIUS) * GAME_CONSTANTS.MAX_POWER;
            let x = this.dragStart.x;  // Start from slingshot position
            let y = this.dragStart.y;
            let vx = -dx / distance * power;
            let vy = -dy / distance * power;
            
            for (let i = 0; i < 60; i++) {  // More points for longer path
                x += vx;
                y += vy;
                vy += GAME_CONSTANTS.GRAVITY;
                
                this.trajectoryPoints.push({ x, y });
                
                // Stop if we hit ground
                if (y > this.levelHeight - GAME_CONSTANTS.GROUND_HEIGHT) break;
                
                // Check platform collisions
                let hitPlatform = false;
                for (const platform of this.platforms) {
                    if (y + this.player.radius > platform.y && 
                        y - this.player.radius < platform.y + platform.height &&
                        x + this.player.radius > platform.x && 
                        x - this.player.radius < platform.x + platform.width) {
                        hitPlatform = true;
                        break;
                    }
                }
                if (hitPlatform) break;
            }
        }
    }

    resetPlayer() {
        // Create a placeholder where the player stopped
        const placeholder = {
            x: this.player.x,
            y: this.player.y,
            radius: this.player.radius,
            isPlaceholder: true
        };
        this.placeholders.push(placeholder);

        // Reset player position to slingshot
        this.player.x = this.slingshot.x;
        this.player.y = this.slingshot.y - 60;  // Match loadLevel height
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isLaunched = false;

        // Reset camera
        this.camera.x = 0;
        this.updateCamera();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game(document.getElementById('gameCanvas'));
});
