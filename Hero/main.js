// Export Game class to make it available globally
window.Game = class {
    constructor() {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize controls
        this.controls = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            ' ': false  // Space bar
        };
        
        // Add event listeners for controls
        window.addEventListener('keydown', (e) => {
            if (this.controls.hasOwnProperty(e.key)) {
                this.controls[e.key] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.controls.hasOwnProperty(e.key)) {
                this.controls[e.key] = false;
            }
        });
        
        // Initialize level first to get viewport size
        this.level = new Level(LEVELS[0]);
        
        // Set canvas size based on viewport
        this.canvas.width = this.level.viewport * GAME_CONSTANTS.TILE_SIZE;
        this.canvas.height = this.level.viewport * GAME_CONSTANTS.TILE_SIZE;
        
        this.currentLevel = 0;
        this.score = 0;
        this.fuel = 100;
        this.lives = GAME_CONSTANTS.PLAYER.STARTING_LIVES;
        this.bombs = [];
        this.explosions = [];
        this.sparkles = [];
        this.gameOver = false;
        this.gameWon = false;
        this.rotorStopTimer = 0;  // Timer for delaying rotor stop
        this.drowning = false;
        this.drowningStartTime = 0;
        this.currentLampTile = null; // Track which lamp tile the player is currently on
        
        // Player state
        this.player = {
            x: GAME_CONSTANTS.TILE_SIZE * 2,
            y: GAME_CONSTANTS.TILE_SIZE * 2,
            width: GAME_CONSTANTS.TILE_SIZE,
            height: GAME_CONSTANTS.TILE_SIZE,
            velocityX: 0,
            velocityY: 0,
            facingLeft: true
        };
        
        // Camera position
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Lighting state
        this.lightsOn = true;
        this.litLamps = new Set();  // Keep track of which lamps are lit
        
        // Laser state
        this.laserActive = false;
        this.laserPhase = 0; // For animation
        
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
        if (this.gameOver || this.gameWon) {
            if (this.controls[' '] || this.controls['Enter']) {
                // Restart game
                this.lives = GAME_CONSTANTS.PLAYER.STARTING_LIVES;
                this.loadLevel(0);
                this.score = 0;
                this.gameOver = false;
                this.gameWon = false;
            } else if (this.controls['Enter'] && this.gameOver) {
                // Retry current level
                this.lives--;
                this.loadLevel(this.currentLevel);
                this.gameOver = false;
            }
            return;
        }
        
        // Check if player is on ground
        const playerBottom = this.player.y + GAME_CONSTANTS.TILE_SIZE;
        const groundTileY = Math.floor(playerBottom / GAME_CONSTANTS.TILE_SIZE);
        const isOnGround = groundTileY >= 0 && groundTileY < this.level.map.length &&
                          this.level.isWall(Math.floor(this.player.x / GAME_CONSTANTS.TILE_SIZE), groundTileY);
        
        // Update player position based on controls
        if (this.controls['ArrowLeft']) {
            this.player.velocityX = -5;
            this.player.facingLeft = true;
        } else if (this.controls['ArrowRight']) {
            this.player.velocityX = 5;
            this.player.facingLeft = false;
        } else {
            this.player.velocityX = 0;
        }
        
        // Flying
        if (this.controls['ArrowUp'] && this.fuel > 0) {
            this.player.velocityY = -5;
            this.fuel = Math.max(0, this.fuel - 10 * deltaTime);
        } else {
            this.player.velocityY += 10 * deltaTime; // Gravity
        }
        
        // Handle dynamite (down arrow while on ground)
        if (this.controls['ArrowDown'] && isOnGround) {
            if (this.bombs.length < 3) {  // Limit number of active bombs
                this.bombs.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height,
                    timeLeft: 1.5 // 1.5 seconds until explosion
                });
            }
        }
        
        // Handle laser (space bar)
        this.laserActive = this.controls[' '];
        if (this.laserActive) {
            const direction = this.player.facingLeft ? -1 : 1;
            // Position laser at head level (matching where we draw the head)
            const eyeY = this.player.y - GAME_CONSTANTS.TILE_SIZE/2 - 4; // Match head position from level.js
            const eyeX = this.player.x + GAME_CONSTANTS.TILE_SIZE / 2; // Center of player
            const fullLaserLength = GAME_CONSTANTS.TILE_SIZE * 3; // Shorter laser length
            
            // Animate laser phase
            this.laserPhase = (this.laserPhase + deltaTime * 10) % (Math.PI * 2);
            
            // Check for enemies along the laser beam
            const laserEndX = eyeX + fullLaserLength * direction;
            const startTileX = Math.floor(Math.min(eyeX, laserEndX) / GAME_CONSTANTS.TILE_SIZE);
            const endTileX = Math.floor(Math.max(eyeX, laserEndX) / GAME_CONSTANTS.TILE_SIZE);
            const tileY = Math.floor(eyeY / GAME_CONSTANTS.TILE_SIZE);
            
            // Check each tile the laser passes through
            for (let tileX = startTileX; tileX <= endTileX; tileX++) {
                // Make sure we're in bounds
                if (tileY >= 0 && tileY < this.level.map.length && 
                    tileX >= 0 && tileX < this.level.map[tileY].length) {
                    // Check for enemies
                    const tile = this.level.map[tileY][tileX];
                    if (tile === '&' || tile === '^') { // Snake (&) or Spider (^)
                        // Remove the enemy
                        this.level.map[tileY][tileX] = ' ';
                        // Add score
                        this.score += 100;
                        // Add explosion effect
                        this.addExplosion(
                            tileX * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE/2,
                            tileY * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE/2,
                            '#FF0000'
                        );
                    }
                }
            }
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
                    radius: GAME_CONSTANTS.TILE_SIZE,
                    timeLeft: 0.5,
                    duration: 0.5,
                    color: '#FF0000'
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
                            if (tile === '=' || tile === '!') {  // Check for both wall and lava
                                // Clear all destructible blocks above this position
                                for (let y = tileY; y >= 0; y--) {
                                    const currentTile = this.level.map[y][tileX];
                                    if (currentTile === '=' || currentTile === '!') {
                                        this.level.map[y][tileX] = ' ';
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.timeLeft -= deltaTime;
            if (explosion.timeLeft <= 0) {
                this.explosions.splice(i, 1);
                continue;
            }
            
            // Scale radius based on time left
            const progress = explosion.timeLeft / explosion.duration;
            explosion.radius = GAME_CONSTANTS.TILE_SIZE * (1 + (1 - progress));
        }
        
        // Update sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const sparkle = this.sparkles[i];
            sparkle.timeLeft -= deltaTime;
            if (sparkle.timeLeft <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
        
        // Update rotor stop timer
        if (isOnGround) {
            if (this.rotorStopTimer < 1) {
                this.rotorStopTimer += deltaTime;
            }
        } else {
            this.rotorStopTimer = 0;
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
                    // Check for hazards first
                    if (this.level.isHazard(x, y)) {
                        const hazardBox = {
                            x: x * GAME_CONSTANTS.TILE_SIZE,
                            y: y * GAME_CONSTANTS.TILE_SIZE,
                            width: GAME_CONSTANTS.TILE_SIZE,
                            height: GAME_CONSTANTS.TILE_SIZE
                        };
                        if (this.checkCollision(this.player, hazardBox)) {
                            this.lives--;
                            if (this.lives <= 0) {
                                this.gameOver = true;
                                return;
                            } else {
                                // Reset player position to start of current level
                                this.loadLevel(this.currentLevel);
                                return;
                            }
                        }
                    }
                    
                    // Check for lamp collision
                    const currentTile = this.level.map[playerTileY][playerTileX];
                    if (currentTile === 'o') {  // Off lamp - turns lights off
                        this.lightsOn = false;
                    } else if (currentTile === '*') {  // On lamp - turns lights on
                        this.lightsOn = true;
                    }
                    
                    // Then check for wall collisions
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
        
        // Check for collectible collection
        this.level.collectibles.forEach(collectible => {
            if (!collectible.collected) {
                const collectibleBox = {
                    x: collectible.x,
                    y: collectible.y,
                    width: GAME_CONSTANTS.TILE_SIZE,
                    height: GAME_CONSTANTS.TILE_SIZE
                };
                
                if (this.checkCollision(this.player, collectibleBox)) {
                    collectible.collected = true;
                    this.score += GAME_CONSTANTS.COLLECTIBLES[collectible.type].POINTS;
                }
            }
        });
        
        // Check if level is complete
        if (this.level.isComplete()) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        }
        
        // Update camera to follow player
        const halfViewportWidth = this.canvas.width / 2;
        const halfViewportHeight = this.canvas.height / 2;
        
        // Target camera position (centered on player)
        const targetX = this.player.x - halfViewportWidth;
        const targetY = this.player.y - halfViewportHeight;
        
        // Calculate level bounds
        const maxX = (this.level.map[0].length * GAME_CONSTANTS.TILE_SIZE) - this.canvas.width;
        const maxY = (this.level.map.length * GAME_CONSTANTS.TILE_SIZE) - this.canvas.height;
        
        // Clamp camera position to level bounds
        this.camera.x = Math.max(0, Math.min(maxX, targetX));
        this.camera.y = Math.max(0, Math.min(maxY, targetY));
    }
    
    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the level
        this.level.render(this.ctx, this.camera.x, this.camera.y);
        
        // Draw the player
        this.ctx.save();
        if (this.drowning) {
            // Make player semi-transparent when drowning
            this.ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 200) * 0.5;
        }
        this.drawPlayer();
        this.ctx.restore();
        
        // Render bombs
        const time = performance.now() / 1000;
        for (const bomb of this.bombs) {
            // Draw dynamite stick (red rectangle)
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(bomb.x - 4 - this.camera.x, bomb.y - 12 - this.camera.y, 8, 12);
            
            // Draw fuse (brown line with animation)
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            // Animate fuse with sine wave
            const fuseWave = Math.sin(time * 5) * 2;
            this.ctx.moveTo(bomb.x - this.camera.x, bomb.y - 12 - this.camera.y);
            this.ctx.quadraticCurveTo(
                bomb.x - this.camera.x + fuseWave, 
                bomb.y - 18 - this.camera.y,
                bomb.x - this.camera.x, 
                bomb.y - 24 - this.camera.y
            );
            this.ctx.stroke();
            
            // Draw fuse spark
            this.ctx.fillStyle = '#FFA500';
            const sparkX = bomb.x - this.camera.x + Math.sin(time * 10) * 2;
            const sparkY = bomb.y - 24 - this.camera.y + Math.cos(time * 10);
            this.ctx.beginPath();
            this.ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw spark glow
            const sparkGradient = this.ctx.createRadialGradient(
                sparkX, sparkY, 0,
                sparkX, sparkY, 4
            );
            sparkGradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
            sparkGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            this.ctx.fillStyle = sparkGradient;
            this.ctx.beginPath();
            this.ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Render explosions
        for (const explosion of this.explosions) {
            // Skip invalid explosions
            if (!Number.isFinite(explosion.x) || !Number.isFinite(explosion.y) || !Number.isFinite(explosion.radius)) {
                continue;
            }
            
            const progress = explosion.timeLeft / explosion.duration;
            if (!Number.isFinite(progress)) {
                continue;
            }
            
            // Main explosion
            const x = explosion.x - this.camera.x;
            const y = explosion.y - this.camera.y;
            const radius = explosion.radius;
            
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(255, 255, 200, ${progress})`);
            gradient.addColorStop(0.2, `rgba(255, 200, 0, ${progress * 0.8})`);
            gradient.addColorStop(0.4, `rgba(255, 100, 0, ${progress * 0.6})`);
            gradient.addColorStop(0.8, `rgba(255, 50, 0, ${progress * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Render sparkles
        this.ctx.fillStyle = '#FFD700';
        for (const sparkle of this.sparkles) {
            this.ctx.globalAlpha = sparkle.timeLeft / 0.2;
            this.ctx.beginPath();
            this.ctx.arc(
                sparkle.x - this.camera.x,
                sparkle.y - this.camera.y,
                sparkle.size,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        
        // Draw laser beam (before darkness overlay so it's visible in dark)
        if (this.laserActive) {
            const direction = this.player.facingLeft ? -1 : 1;
            // Position laser at head level (matching where we draw the head)
            const eyeY = this.player.y - this.camera.y - GAME_CONSTANTS.TILE_SIZE/2 - 4; // Match head position from level.js
            const eyeX = this.player.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE / 2; // Center of player
            const fullLaserLength = GAME_CONSTANTS.TILE_SIZE * 3; // Shorter laser length
            
            this.ctx.save();
            
            // Make laser glow in dark
            this.ctx.globalCompositeOperation = 'screen';
            
            // Main beam
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            
            // Animated beam pattern
            for (let i = 0; i < 3; i++) {
                const offset = Math.sin(this.laserPhase + i * Math.PI / 2) * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(eyeX, eyeY + offset);
                this.ctx.lineTo(eyeX + fullLaserLength * direction, eyeY + offset);
                this.ctx.stroke();
            }
            
            // Add glow effect
            const gradient = this.ctx.createLinearGradient(
                eyeX, eyeY,
                eyeX + fullLaserLength * direction, eyeY
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(eyeX, eyeY);
            this.ctx.lineTo(eyeX + fullLaserLength * direction, eyeY);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        // Create darkness overlay if lights are out
        if (!this.lightsOn) {
            // Save the current context state
            this.ctx.save();
            
            // Create a dark overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Create a small light around the player
            const playerScreenX = Math.floor(this.player.x - this.camera.x);  // Floor to prevent shimmering
            const playerScreenY = Math.floor(this.player.y - this.camera.y);
            
            // Clear a circle around player and lava
            this.ctx.globalCompositeOperation = 'destination-out';
            
            // Player light
            const gradient = this.ctx.createRadialGradient(
                playerScreenX + GAME_CONSTANTS.TILE_SIZE/2,
                playerScreenY + GAME_CONSTANTS.TILE_SIZE/2,
                0,
                playerScreenX + GAME_CONSTANTS.TILE_SIZE/2,
                playerScreenY + GAME_CONSTANTS.TILE_SIZE/2,
                GAME_CONSTANTS.TILE_SIZE * 2
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');  // Softer edge
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(
                playerScreenX + GAME_CONSTANTS.TILE_SIZE/2,
                playerScreenY + GAME_CONSTANTS.TILE_SIZE/2,
                GAME_CONSTANTS.TILE_SIZE * 2,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            // Restore the context state
            this.ctx.restore();
        }
        
        // Draw game over screen if needed
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawPlayer() {
        // Check if player is in the air
        const playerBottom = this.player.y + GAME_CONSTANTS.TILE_SIZE;
        const groundTileY = Math.floor(playerBottom / GAME_CONSTANTS.TILE_SIZE);
        const isOnGround = groundTileY >= 0 && groundTileY < this.level.map.length &&
                          this.level.isWall(Math.floor(this.player.x / GAME_CONSTANTS.TILE_SIZE), groundTileY);
        
        // Render player
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;
        const scale = GAME_CONSTANTS.PLAYER.SCALE;
        
        // Center the visual representation within the collision box
        const visualX = screenX / scale - (GAME_CONSTANTS.TILE_SIZE * (scale - 1)) / (2 * scale);
        const visualY = (screenY - GAME_CONSTANTS.TILE_SIZE * (scale - 1)) / scale;  // Offset Y to account for increased height
        
        this.ctx.save();
        this.ctx.scale(scale, scale);
        
        // Draw legs
        this.ctx.fillStyle = '#1565C0';
        this.ctx.fillRect(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.3,
            visualY + GAME_CONSTANTS.TILE_SIZE * 0.5,
            GAME_CONSTANTS.TILE_SIZE * 0.15,
            GAME_CONSTANTS.TILE_SIZE * 0.5
        );
        this.ctx.fillRect(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.55,
            visualY + GAME_CONSTANTS.TILE_SIZE * 0.5,
            GAME_CONSTANTS.TILE_SIZE * 0.15,
            GAME_CONSTANTS.TILE_SIZE * 0.5
        );
        
        // Draw jetpack
        this.ctx.fillStyle = '#FFA000';
        this.ctx.fillRect(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.15,
            visualY + GAME_CONSTANTS.TILE_SIZE * 0.2,
            GAME_CONSTANTS.TILE_SIZE * 0.2,
            GAME_CONSTANTS.TILE_SIZE * 0.4
        );
        
        // Draw body
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.moveTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.3, visualY + GAME_CONSTANTS.TILE_SIZE * 0.5);
        this.ctx.lineTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.25, visualY + GAME_CONSTANTS.TILE_SIZE * 0.2);
        this.ctx.lineTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.75, visualY + GAME_CONSTANTS.TILE_SIZE * 0.2);
        this.ctx.lineTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.7, visualY + GAME_CONSTANTS.TILE_SIZE * 0.5);
        this.ctx.fill();
        
        // Draw head
        this.ctx.fillStyle = '#FFB74D';
        this.ctx.beginPath();
        this.ctx.arc(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.5,
            visualY + GAME_CONSTANTS.TILE_SIZE * 0.15,
            GAME_CONSTANTS.TILE_SIZE * 0.15,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw helicopter rotor
        this.ctx.fillStyle = '#424242';
        // Vertical part
        this.ctx.fillRect(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.48,
            visualY - GAME_CONSTANTS.TILE_SIZE * 0.1,
            GAME_CONSTANTS.TILE_SIZE * 0.04,
            GAME_CONSTANTS.TILE_SIZE * 0.2
        );
        
        // Horizontal part (rotates when not on ground or during stop delay)
        const shouldSpin = !isOnGround || this.rotorStopTimer < 1;
        const rotorWidth = GAME_CONSTANTS.TILE_SIZE * (0.3 + (shouldSpin ? Math.sin(Date.now() / 100) * 0.2 : 0));
        this.ctx.fillRect(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.5 - rotorWidth,
            visualY - GAME_CONSTANTS.TILE_SIZE * 0.1,
            rotorWidth * 2,
            GAME_CONSTANTS.TILE_SIZE * 0.04
        );
        
        // Draw goggles
        this.ctx.fillStyle = '#424242';
        this.ctx.beginPath();
        this.ctx.ellipse(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.43,
            visualY + GAME_CONSTANTS.TILE_SIZE * 0.15,
            GAME_CONSTANTS.TILE_SIZE * 0.08,
            GAME_CONSTANTS.TILE_SIZE * 0.05,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(
            visualX + GAME_CONSTANTS.TILE_SIZE * 0.57,
            visualY + GAME_CONSTANTS.TILE_SIZE * 0.15,
            GAME_CONSTANTS.TILE_SIZE * 0.08,
            GAME_CONSTANTS.TILE_SIZE * 0.05,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw jetpack flames when flying
        if (this.controls['ArrowUp'] && this.fuel > 0) {
            const flameHeight = Math.random() * 0.2 + 0.3;
            const gradient = this.ctx.createLinearGradient(
                visualX + GAME_CONSTANTS.TILE_SIZE * 0.25,
                visualY + GAME_CONSTANTS.TILE_SIZE * 0.6,
                visualX + GAME_CONSTANTS.TILE_SIZE * 0.25,
                visualY + GAME_CONSTANTS.TILE_SIZE * (0.6 + flameHeight)
            );
            gradient.addColorStop(0, '#FF9800');
            gradient.addColorStop(0.5, '#FF5722');
            gradient.addColorStop(1, '#F44336');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.15, visualY + GAME_CONSTANTS.TILE_SIZE * 0.6);
            this.ctx.lineTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.25, visualY + GAME_CONSTANTS.TILE_SIZE * (0.6 + flameHeight));
            this.ctx.lineTo(visualX + GAME_CONSTANTS.TILE_SIZE * 0.35, visualY + GAME_CONSTANTS.TILE_SIZE * 0.6);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        
        // Check if we've completed all levels
        if (levelNumber >= LEVELS.length) {
            this.gameWon = true;
            return;
        }
        
        this.level = new Level(LEVELS[levelNumber]);
        const startPos = this.level.findPlayerStart();
        
        // Reset player position
        this.player.x = startPos.x * GAME_CONSTANTS.TILE_SIZE;
        this.player.y = startPos.y * GAME_CONSTANTS.TILE_SIZE;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        
        // Reset state
        this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
        this.bombs = [];
        this.explosions = [];
        this.sparkles = [];
        this.lasers = [];
    }
    
    gameWon() {
        alert('Congratulations! You won!');
    }
    
    addExplosion(x, y, color) {
        const explosion = {
            x: Number(x),
            y: Number(y),
            radius: GAME_CONSTANTS.TILE_SIZE,
            timeLeft: 0.5,
            duration: 0.5,
            color: color || '#FF0000'
        };
        this.explosions.push(explosion);
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    new Game();
});