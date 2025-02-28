class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;
        
        this.controls = new Controls();
        this.currentLevel = 0;
        this.score = 0;
        this.fuel = 100;
        this.bombs = [];
        this.explosions = [];
        this.sparkles = [];
        
        // Initialize level first
        this.level = new Level(LEVELS[0]);
        
        // Player state
        this.player = {
            x: GAME_CONSTANTS.TILE_SIZE * 2,
            y: GAME_CONSTANTS.TILE_SIZE * 2,
            width: GAME_CONSTANTS.TILE_SIZE,
            height: GAME_CONSTANTS.TILE_SIZE,
            velocityX: 0,
            velocityY: 0
        };
        
        // Camera position
        this.camera = {
            y: 0
        };
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    update(deltaTime) {
        // Check if player is on ground
        const playerBottom = this.player.y + GAME_CONSTANTS.TILE_SIZE;
        const groundTileY = Math.floor(playerBottom / GAME_CONSTANTS.TILE_SIZE);
        const isOnGround = groundTileY >= 0 && groundTileY < this.level.map.length &&
                          this.level.isWall(Math.floor(this.player.x / GAME_CONSTANTS.TILE_SIZE), groundTileY);
        
        // Update player position based on controls
        if (this.controls.isPressed('ArrowLeft')) {
            this.player.velocityX = -5;
        } else if (this.controls.isPressed('ArrowRight')) {
            this.player.velocityX = 5;
        } else {
            this.player.velocityX = 0;
        }
        
        // Flying
        if (this.controls.isPressed('ArrowUp') && this.fuel > 0) {
            this.player.velocityY = -5;
            this.fuel = Math.max(0, this.fuel - 10 * deltaTime);
        } else {
            this.player.velocityY += 10 * deltaTime; // Gravity
        }
        
        // Drop bomb on Space or when pressing Down while on ground
        if (this.controls.isPressed('Space') || (this.controls.isPressed('ArrowDown') && isOnGround)) {
            this.bombs.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                timeLeft: 1.5 // 1.5 seconds until explosion
            });
        }
        
        // Update bombs and explosions
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.timeLeft -= deltaTime;
            
            // Add sparkles along the fuse
            if (Math.random() < 0.3) { // 30% chance each frame
                const progress = 1 - (bomb.timeLeft / 1.5); // 0 to 1
                const sparkleY = bomb.y - 12 - (progress * 12); // Move up the fuse
                this.sparkles.push({
                    x: bomb.x + (Math.random() * 6 - 3),
                    y: sparkleY,
                    size: Math.random() * 2 + 1,
                    timeLeft: 0.2
                });
            }
            
            if (bomb.timeLeft <= 0) {
                // Create explosion
                this.explosions.push({
                    x: bomb.x,
                    y: bomb.y,
                    radius: 0,
                    maxRadius: 60,
                    duration: 0.5,
                    timeLeft: 0.5,
                    particles: Array(8).fill().map(() => ({
                        angle: Math.random() * Math.PI * 2,
                        speed: Math.random() * 100 + 50
                    }))
                });
                
                // Remove the bomb
                this.bombs.splice(i, 1);
                
                // Check for wall destruction
                const bombTileX = Math.floor(bomb.x / GAME_CONSTANTS.TILE_SIZE);
                const bombTileY = Math.floor(bomb.y / GAME_CONSTANTS.TILE_SIZE);
                
                // Destroy walls in a 3x3 area
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const tileX = bombTileX + dx;
                        const tileY = bombTileY + dy;
                        
                        if (tileY >= 0 && tileY < this.level.map.length &&
                            tileX >= 0 && tileX < this.level.map[0].length) {
                            const tile = this.level.map[tileY][tileX];
                            if (tile === '=') {
                                // Clear all = blocks above this position
                                for (let y = tileY; y >= 0; y--) {
                                    if (this.level.map[y][tileX] === '=') {
                                        this.level.map[y][tileX] = ' ';
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Update sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const sparkle = this.sparkles[i];
            sparkle.timeLeft -= deltaTime;
            if (sparkle.timeLeft <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.timeLeft -= deltaTime;
            explosion.radius = (1 - explosion.timeLeft / explosion.duration) * explosion.maxRadius;
            
            if (explosion.timeLeft <= 0) {
                this.explosions.splice(i, 1);
            }
        }
        
        // Apply velocities
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Collision detection with walls
        const playerTileX = Math.floor(this.player.x / GAME_CONSTANTS.TILE_SIZE);
        const playerTileY = Math.floor(this.player.y / GAME_CONSTANTS.TILE_SIZE);
        
        // Check collisions with surrounding tiles
        for (let y = playerTileY - 1; y <= playerTileY + 1; y++) {
            for (let x = playerTileX - 1; x <= playerTileX + 1; x++) {
                if (y >= 0 && y < this.level.map.length && x >= 0 && x < this.level.map[0].length) {
                    if (this.level.isWall(x, y)) {
                        const wallBox = {
                            x: x * GAME_CONSTANTS.TILE_SIZE,
                            y: y * GAME_CONSTANTS.TILE_SIZE,
                            width: GAME_CONSTANTS.TILE_SIZE,
                            height: GAME_CONSTANTS.TILE_SIZE
                        };
                        
                        if (this.checkCollision(this.player, wallBox)) {
                            // Handle collision
                            const overlapX = (this.player.x + this.player.width / 2) - (wallBox.x + wallBox.width / 2);
                            const overlapY = (this.player.y + this.player.height / 2) - (wallBox.y + wallBox.height / 2);
                            
                            if (Math.abs(overlapX) > Math.abs(overlapY)) {
                                this.player.x = overlapX > 0 ? wallBox.x + wallBox.width : wallBox.x - this.player.width;
                                this.player.velocityX = 0;
                            } else {
                                this.player.y = overlapY > 0 ? wallBox.y + wallBox.height : wallBox.y - this.player.height;
                                this.player.velocityY = 0;
                            }
                        }
                    }
                }
            }
        }
        
        // Check for miner collection
        for (const miner of this.level.miners) {
            if (!miner.rescued) {
                const minerBox = {
                    x: miner.x * GAME_CONSTANTS.TILE_SIZE,
                    y: miner.y * GAME_CONSTANTS.TILE_SIZE,
                    width: GAME_CONSTANTS.TILE_SIZE,
                    height: GAME_CONSTANTS.TILE_SIZE
                };
                
                if (this.checkCollision(this.player, minerBox)) {
                    miner.rescued = true;
                    this.score += 1000;
                }
            }
        }
        
        // Check if level is complete
        if (this.level.isComplete()) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        }
        
        // Update camera
        this.camera.y = Math.max(0, this.player.y - this.canvas.height / 2);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw level
        this.level.render(this.ctx, this.camera.y);
        
        // Check if player is in the air
        const playerTileY = Math.floor((this.player.y + this.player.height) / GAME_CONSTANTS.TILE_SIZE);
        const isInAir = playerTileY < 0 || playerTileY >= this.level.map.length || 
                       this.level.map[playerTileY][Math.floor(this.player.x / GAME_CONSTANTS.TILE_SIZE)] !== 1;
        
        // Render player (adjusted for camera)
        const screenY = this.player.y - this.camera.y;
        
        // Draw legs (slightly spread apart)
        this.ctx.fillStyle = '#ffffff'; // White pants
        const legWidth = GAME_CONSTANTS.TILE_SIZE * 0.2;
        const legHeight = GAME_CONSTANTS.TILE_SIZE * 0.5;
        this.ctx.fillRect(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.4, screenY + GAME_CONSTANTS.TILE_SIZE * 0.4, legWidth, legHeight); // Left leg
        this.ctx.fillRect(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.8, screenY + GAME_CONSTANTS.TILE_SIZE * 0.4, legWidth, legHeight); // Right leg
        
        // Draw body (narrower at waist, wider at shoulders)
        this.ctx.fillStyle = '#4444ff'; // Blue shirt
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.5, screenY + GAME_CONSTANTS.TILE_SIZE * 0.4); // Waist left
        this.ctx.lineTo(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.4, screenY); // Shoulder left
        this.ctx.lineTo(this.player.x + GAME_CONSTANTS.TILE_SIZE * 1.1, screenY); // Shoulder right
        this.ctx.lineTo(this.player.x + GAME_CONSTANTS.TILE_SIZE * 1.0, screenY + GAME_CONSTANTS.TILE_SIZE * 0.4); // Waist right
        this.ctx.fill();
        
        // Draw helmet (round top)
        this.ctx.fillStyle = '#ff4444'; // Red helmet
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.75, screenY - GAME_CONSTANTS.TILE_SIZE * 0.1, GAME_CONSTANTS.TILE_SIZE * 0.4, Math.PI, 0);
        this.ctx.fill();
        
        // Draw rotor with animation
        if (isInAir) {
            // Draw vertical line (doesn't rotate)
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.75, screenY - GAME_CONSTANTS.TILE_SIZE * 0.85, GAME_CONSTANTS.TILE_SIZE * 0.06, GAME_CONSTANTS.TILE_SIZE * 0.4);
            
            // Draw horizontal line at top with animation
            const width = Math.abs(Math.sin(performance.now() / 50)) * GAME_CONSTANTS.TILE_SIZE * 0.4 + GAME_CONSTANTS.TILE_SIZE * 0.12;
            this.ctx.fillRect(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.75 - width/2, screenY - GAME_CONSTANTS.TILE_SIZE * 0.85, width, GAME_CONSTANTS.TILE_SIZE * 0.06);
        } else {
            // Static rotor when on ground
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.75, screenY - GAME_CONSTANTS.TILE_SIZE * 0.85, GAME_CONSTANTS.TILE_SIZE * 0.06, GAME_CONSTANTS.TILE_SIZE * 0.4); // Vertical line
            this.ctx.fillRect(this.player.x + GAME_CONSTANTS.TILE_SIZE * 0.6, screenY - GAME_CONSTANTS.TILE_SIZE * 0.85, GAME_CONSTANTS.TILE_SIZE * 0.4, GAME_CONSTANTS.TILE_SIZE * 0.06); // Horizontal line at top
        }
        
        // Render enemies (bats and spiders)
        for (let y = 0; y < this.level.map.length; y++) {
            for (let x = 0; x < this.level.map[y].length; x++) {
                const tile = this.level.map[y][x];
                if (tile === 4) { // Bat
                    this.ctx.fillStyle = '#8B4513'; // Brown color for bat
                    this.ctx.fillRect(
                        x * GAME_CONSTANTS.TILE_SIZE + 16,
                        y * GAME_CONSTANTS.TILE_SIZE + 16 - this.camera.y,
                        16, 8
                    );
                    // Wings
                    this.ctx.fillRect(
                        x * GAME_CONSTANTS.TILE_SIZE + 12,
                        y * GAME_CONSTANTS.TILE_SIZE + 18 - this.camera.y,
                        24, 4
                    );
                } else if (tile === 5) { // Spider
                    this.ctx.fillStyle = '#8B4513'; // Brown color for spider
                    // Body
                    this.ctx.fillRect(
                        x * GAME_CONSTANTS.TILE_SIZE + 16,
                        y * GAME_CONSTANTS.TILE_SIZE + 16 - this.camera.y,
                        16, 16
                    );
                    // Legs
                    this.ctx.fillRect(
                        x * GAME_CONSTANTS.TILE_SIZE + 12,
                        y * GAME_CONSTANTS.TILE_SIZE + 20 - this.camera.y,
                        24, 2
                    );
                }
            }
        }
        
        // Render miners
        for (const miner of this.level.miners) {
            if (!miner.rescued) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '40px Arial';
                this.ctx.fillText('👷', 
                    miner.x * GAME_CONSTANTS.TILE_SIZE, 
                    (miner.y + 1) * GAME_CONSTANTS.TILE_SIZE - 8 - this.camera.y // Position at bottom of cell with small offset
                );
            }
        }
        
        // Render bombs
        for (const bomb of this.bombs) {
            // Draw dynamite stick (red rectangle)
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(bomb.x - 4, bomb.y - 12 - this.camera.y, 8, 12);
            
            // Draw fuse (brown line)
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(bomb.x, bomb.y - 12 - this.camera.y);
            this.ctx.lineTo(bomb.x, bomb.y - 24 - this.camera.y);
            this.ctx.stroke();
        }
        
        // Render sparkles
        for (const sparkle of this.sparkles) {
            const alpha = sparkle.timeLeft / 0.2; // Fade out
            const gradient = this.ctx.createRadialGradient(
                sparkle.x, sparkle.y, 0,
                sparkle.x, sparkle.y, sparkle.size * 2
            );
            gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(sparkle.x, sparkle.y, sparkle.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Render explosions
        for (const explosion of this.explosions) {
            // Main explosion
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
            gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.6)');
            gradient.addColorStop(0.8, 'rgba(255, 50, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Particle effects
            for (const particle of explosion.particles) {
                const distance = (1 - explosion.timeLeft / explosion.duration) * particle.speed;
                const x = explosion.x + Math.cos(particle.angle) * distance;
                const y = explosion.y + Math.sin(particle.angle) * distance;
                
                this.ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Update HUD
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('fuel').textContent = `Fuel: ${Math.ceil(this.fuel)}`;
        document.getElementById('level').textContent = `Level: ${this.currentLevel + 1}`;
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    loadLevel(levelIndex) {
        if (levelIndex >= LEVELS.length) {
            this.gameWon();
            return;
        }
        
        this.level = new Level(LEVELS[levelIndex]);
        const startPos = this.level.findPlayerStart();
        this.player.x = startPos.x * GAME_CONSTANTS.TILE_SIZE;
        this.player.y = startPos.y * GAME_CONSTANTS.TILE_SIZE;
        this.camera.y = 0;
        this.fuel = 100;
    }
    
    gameWon() {
        alert('Congratulations! You won!');
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
});