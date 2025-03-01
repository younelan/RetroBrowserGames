// Load dependencies in order
const scripts = [
    'game/constants.js',
    'game/level.js',     // Move up - needed by CollisionManager
    'game/levels.js',
    'game/controls.js',
    'game/collision/CollisionManager.js',
    'game/entities/Player.js',
    'game/entities/Enemy.js',
    'game/entities/Collectible.js',
    'game/entities/Dynamite.js',
    'game/entities/Laser.js',
    'game/weapons/WeaponSystem.js',
    'game/systems/CollectibleSystem.js'
];

// Load scripts sequentially
async function loadScripts() {
    for (const src of scripts) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Initialize game only after all scripts are loaded
loadScripts().then(() => {
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
                ' ': false  // Space bar for laser
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
            this.dynamites = [];  // Replace this.bombs
            this.explosions = [];
            this.sparkles = [];
            this.gameOver = false;
            this.gameWon = false;
            this.rotorStopTimer = 0;  // Timer for delaying rotor stop
            this.drowning = false;
            this.drowningStartTime = 0;
            this.currentLampTile = null; // Track which lamp tile the player is currently on
            
            // Replace player object with Player instance
            const startPos = this.level.findPlayerStart();
            this.player = new Player(startPos.x, startPos.y);
            
            // Move other entity initialization to separate classes
            this.weaponSystem = new WeaponSystem();
            this.collectibleSystem = new CollectibleSystem(this.level.collectibles);
            
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
            
            this.collectibles = [];
            this.enemies = [];
            this.laser = new Laser();
            
            // Initialize entities
            this.initializeEntities();
            
            this.collisionManager = new CollisionManager(this.level);
            
            // Start game loop
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
        
        initializeEntities() {
            // Initialize collectible system with level data
            this.collectibleSystem = new CollectibleSystem(this.level.collectibles);
            
            // Create enemies from level map
            this.enemies = [];
            for (let y = 0; y < this.level.map.length; y++) {
                for (let x = 0; x < this.level.map[y].length; x++) {
                    const tile = this.level.map[y][x];
                    if (tile === '&' || tile === '^') {
                        this.enemies.push(new Enemy(x, y, tile));
                    }
                }
            }
        }

        handlePlayerDeath() {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                // Reset player position to start
                const startPos = this.level.findPlayerStart();
                this.player.x = startPos.x * GAME_CONSTANTS.TILE_SIZE;
                this.player.y = startPos.y * GAME_CONSTANTS.TILE_SIZE;
                this.player.velocityX = 0;
                this.player.velocityY = 0;
                this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
                this.dynamites = [];
                this.explosions = [];
                this.sparkles = [];
                this.lasers = [];
            }
        }

        update(deltaTime) {
            if (this.gameOver || this.gameWon) return;

            // Ground collision check
            const isOnGround = this.collisionManager.checkGroundCollision(this.player);
            
            // Update player movement
            this.player.update(deltaTime, this.controls, isOnGround);
            
            // Handle wall collisions after movement
            this.collisionManager.handleGridCollisions(this.player);

            // Handle weapons
            if (this.controls[' ']) { // Space bar for laser
                this.laserActive = true;
                this.laser.active = true;
                this.laserPhase += deltaTime * 10;
                
                // Check laser collisions with enemies
                if (this.laser.active) {
                    const hitEnemies = this.collisionManager.checkLaserCollisions(this.laser, this.enemies);
                    hitEnemies.forEach(enemy => {
                        enemy.hit();
                        this.score += 100;
                    });
                }
            } else {
                this.laserActive = false;
                this.laser.active = false;
            }

            // Handle dynamite through WeaponSystem
            if (this.controls['ArrowDown'] && isOnGround) {
                this.weaponSystem.addDynamite(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height
                );
            }

            // Replace the immediate explosion with proper dynamite drop
            if (this.controls['ArrowDown'] && isOnGround) {
                if (this.dynamites.length < 3) { // Limit number of active dynamites
                    const dynamite = new Dynamite(
                        this.player.x + this.player.width / 2,
                        this.player.y + this.player.height
                    );
                    this.dynamites.push(dynamite);
                }
            }

            // Update dynamites
            for (let i = this.dynamites.length - 1; i >= 0; i--) {
                if (this.dynamites[i].update(deltaTime)) {
                    this.dynamites.splice(i, 1);
                }
            }

            // Update sparkles
            for (let i = this.sparkles.length - 1; i >= 0; i--) {
                this.sparkles[i].timeLeft -= deltaTime;
                if (this.sparkles[i].timeLeft <= 0) {
                    this.sparkles.splice(i, 1);
                }
            }

            // Rest of collision checks
            if (this.collisionManager.checkHazardCollisions(this.player) ||
                this.collisionManager.checkEnemyCollisions(this.player, this.enemies)) {
                this.handlePlayerDeath();
                return;
            }

            // Handle collectible collisions through CollectionManager
            const collidedCollectibles = this.collisionManager.checkCollectibleCollisions(this.player, this.collectibles);
            collidedCollectibles.forEach(collectible => {
                this.score += collectible.collect();
            });
            
            // Handle weapons
            if (this.controls[' ']) { // Space bar for laser
                this.laser.active = true;
                this.laserActive = true;  // For rendering
                this.laserPhase += deltaTime * 10;
            } else {
                this.laser.active = false;
                this.laserActive = false;
            }

            if (this.controls['x'] && isOnGround) { // X key for dynamite
                if (this.dynamites.length < 3) {
                    this.dynamites.push(new Dynamite(
                        this.player.x + this.player.width / 2,
                        this.player.y + this.player.height
                    ));
                }
            }

            // Update weapon systems
            this.laser.update(deltaTime, this.player, this.level);
            
            // Update systems
            this.weaponSystem.update(deltaTime, this.player, this.level);
            this.updateCamera();

            // Handle light switch collisions
            const lightSwitch = this.collisionManager.checkLightSwitchCollisions(this.player);
            if (lightSwitch) {
                const tile = this.level.map[lightSwitch.y][lightSwitch.x];
                if (tile === '*') {
                    this.lightsOn = true; // Turn on light
                } else if (tile === 'o') {
                    this.lightsOn = false; // Turn off light
                }
            }
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
            
            // Render dynamites
            this.dynamites.forEach(dynamite => {
                dynamite.render(this.ctx, this.camera.x, this.camera.y);
            });
            
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
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw visible circle around player
                const gradient = this.ctx.createRadialGradient(
                    this.player.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE/2,
                    this.player.y - this.camera.y + GAME_CONSTANTS.TILE_SIZE/2,
                    0,
                    this.player.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE/2,
                    this.player.y - this.camera.y + GAME_CONSTANTS.TILE_SIZE/2,
                    GAME_CONSTANTS.TILE_SIZE * 2
                );
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // Always visible elements (even in darkness)
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            
            // Draw lava with glow
            for (let y = 0; y < this.level.map.length; y++) {
                for (let x = 0; x < this.level.map[y].length; x++) {
                    if (this.level.map[y][x] === '!') { // Lava
                        const screenX = x * GAME_CONSTANTS.TILE_SIZE - this.camera.x;
                        const screenY = y * GAME_CONSTANTS.TILE_SIZE - this.camera.y;
                        // Draw lava glow
                        const lavaGradient = this.ctx.createRadialGradient(
                            screenX + GAME_CONSTANTS.TILE_SIZE/2,
                            screenY + GAME_CONSTANTS.TILE_SIZE/2, 
                            0,
                            screenX + GAME_CONSTANTS.TILE_SIZE/2,
                            screenY + GAME_CONSTANTS.TILE_SIZE/2, 
                            GAME_CONSTANTS.TILE_SIZE
                        );
                        lavaGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                        lavaGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        this.ctx.fillStyle = lavaGradient;
                        this.ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                    }
                }
            }
            
            // Draw player in dark
            if (!this.lightsOn) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.5;
                this.drawPlayer();
                this.ctx.restore();
            }
            
            // Draw laser beam
            if (this.laserActive) {
                const direction = this.player.facingLeft ? -1 : 1;
                const eyeY = this.player.y - this.camera.y - GAME_CONSTANTS.TILE_SIZE/2 - 4;
                const eyeX = this.player.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE / 2;
                const fullLaserLength = GAME_CONSTANTS.TILE_SIZE * 3;
                
                // Animated beam pattern
                for (let i = 0; i < 3; i++) {
                    const offset = Math.sin(this.laserPhase + i * Math.PI / 2) * 2;
                    this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
                    this.ctx.lineWidth = 2;
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
                gradient.addColorStop(0, 'rgba(255, 100, 100, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 6;
                this.ctx.beginPath();
                this.ctx.moveTo(eyeX, eyeY);
                this.ctx.lineTo(eyeX + fullLaserLength * direction, eyeY);
                this.ctx.stroke();
            }
            
            // Draw dynamite glow in dark
            if (!this.lightsOn) {
                for (const dynamite of this.dynamites) {
                    const bombGradient = this.ctx.createRadialGradient(
                        dynamite.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE/4,
                        dynamite.y - this.camera.y + GAME_CONSTANTS.TILE_SIZE/4,
                        0,
                        dynamite.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE/4,
                        dynamite.y - this.camera.y + GAME_CONSTANTS.TILE_SIZE/4,
                        GAME_CONSTANTS.TILE_SIZE/2
                    );
                    bombGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                    bombGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    this.ctx.fillStyle = bombGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        dynamite.x - this.camera.x + GAME_CONSTANTS.TILE_SIZE/4,
                        dynamite.y - this.camera.y + GAME_CONSTANTS.TILE_SIZE/4,
                        GAME_CONSTANTS.TILE_SIZE/4,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
            
            this.ctx.restore();
            
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
            const screenX = this.player.x - this.camera.x;
            const screenY = this.player.y - this.camera.y;
            const tileSize = GAME_CONSTANTS.TILE_SIZE;
            
            // All measurements relative to player size (2x2 tiles)
            const playerWidth = tileSize * GAME_CONSTANTS.PLAYER.WIDTH;
            const playerHeight = tileSize * GAME_CONSTANTS.PLAYER.HEIGHT;

            // Draw jetpack (relative to player dimensions)
            this.ctx.fillStyle = '#FFA000';
            this.ctx.fillRect(
                screenX,
                screenY + playerHeight * 0.1,
                playerWidth * 0.15,
                playerHeight * 0.4
            );
            
            // Draw legs
            this.ctx.fillStyle = '#1565C0';
            this.ctx.fillRect(
                screenX + playerWidth * 0.3,
                screenY + playerHeight * 0.5,
                playerWidth * 0.15,
                playerHeight * 0.5
            );
            this.ctx.fillRect(
                screenX + playerWidth * 0.55,
                screenY + playerHeight * 0.5,
                playerWidth * 0.15,
                playerHeight * 0.5
            );
            
            // Draw body
            this.ctx.fillStyle = '#2196F3';
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + playerWidth * 0.3, screenY + playerHeight * 0.5);
            this.ctx.lineTo(screenX + playerWidth * 0.25, screenY + playerHeight * 0.1);
            this.ctx.lineTo(screenX + playerWidth * 0.75, screenY + playerHeight * 0.1);
            this.ctx.lineTo(screenX + playerWidth * 0.7, screenY + playerHeight * 0.5);
            this.ctx.fill();
            
            // Draw head
            this.ctx.fillStyle = '#FFB74D';
            this.ctx.beginPath();
            this.ctx.arc(
                screenX + playerWidth * 0.5,
                screenY + playerHeight * 0.1,
                playerWidth * 0.25,
                0,
                Math.PI * 2
            );
            this.ctx.fill();

            // Draw goggles
            this.ctx.fillStyle = '#424242';
            this.ctx.beginPath();
            this.ctx.ellipse(
                screenX + playerWidth * 0.4,
                screenY + playerHeight * 0.1,
                playerWidth * 0.1,
                playerWidth * 0.06,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(
                screenX + playerWidth * 0.6,
                screenY + playerHeight * 0.1,
                playerWidth * 0.1,
                playerWidth * 0.06,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
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
            this.dynamites = [];
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
                radius: GAME_CONSTANTS.TILE_SIZE * 2.5,
                timeLeft: 0.8,
                duration: 0.8,
                sparkCount: 20,
                sparkles: [],
                color: color || '#FF4500'
            };
            
            // Add initial sparkles
            for (let i = 0; i < explosion.sparkCount; i++) {
                const angle = (Math.PI * 2 * i) / explosion.sparkCount;
                const speed = Math.random() * 200 + 100;
                explosion.sparkles.push({
                    x: explosion.x,
                    y: explosion.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 3 + 2,
                    timeLeft: Math.random() * 0.5 + 0.3
                });
            }
            
            this.explosions.push(explosion);

            // Damage walls in explosion radius
            const tileX = Math.floor(x / GAME_CONSTANTS.TILE_SIZE);
            const tileY = Math.floor(y / GAME_CONSTANTS.TILE_SIZE);
            const radius = 3;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        this.destroyConnectedWalls(tileX + dx, tileY + dy);
                    }
                }
            }
        }

        destroyConnectedWalls(startX, startY) {
            const visited = new Set();
            const toExplore = [{x: startX, y: startY}];
            
            while (toExplore.length > 0) {
                const {x, y} = toExplore.pop();
                const key = `${x},${y}`;
                
                if (visited.has(key)) continue;
                visited.add(key);
                
                // If this is a destructible wall or lava
                if (this.level.isDestructible(x, y)) {
                    this.level.damageWall(x, y);
                    
                    // Check adjacent tiles
                    [[-1,0], [1,0], [0,-1], [0,1]].forEach(([dx, dy]) => {
                        toExplore.push({x: x + dx, y: y + dy});
                    });
                }
            }
        }

        updateCamera() {
            // Calculate target camera position (centered on player)
            const targetX = this.player.x - (this.canvas.width - this.player.width) / 2;
            const targetY = this.player.y - (this.canvas.height - this.player.height) / 2;
            
            // Clamp camera to level boundaries
            this.camera.x = Math.max(0, Math.min(targetX, 
                this.level.map[0].length * GAME_CONSTANTS.TILE_SIZE - this.canvas.width));
            this.camera.y = Math.max(0, Math.min(targetY, 
                this.level.map.length * GAME_CONSTANTS.TILE_SIZE - this.canvas.height));
        }
    }
    // Start the game
    new Game();
}).catch(error => {
    console.error('Failed to load game:', error);
});