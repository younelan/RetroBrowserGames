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
            
            // Use our Controls class
            this.controls = new Controls();
            
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
            this.lightsOn = this.level.initialLightsOn;
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
                this.lightsOn = this.level.initialLightsOn; // Reset lights
            }
        }

        update(deltaTime) {
            if (this.gameOver || this.gameWon) return;

            // Ground collision check
            const isOnGround = this.collisionManager.checkGroundCollision(this.player);
            
            // Update controls with ground state
            this.controls.setOnGround(isOnGround);
            
            // Update rotor animation
            if (this.controls.isPressed('ArrowUp') && this.fuel > 0) {
                // When flying, rotor spins actively
                this.player.rotorAngle = (this.player.rotorAngle + deltaTime * 15) % (Math.PI * 2);
                this.rotorStopTimer = 0.5; // Set timer for slowing down after releasing up button
            } else if (this.rotorStopTimer > 0) {
                // Slow down rotor after releasing up button
                this.player.rotorAngle = (this.player.rotorAngle + deltaTime * 5) % (Math.PI * 2); 
                this.rotorStopTimer -= deltaTime;
            }
            
            // Update player movement based on controls
            this.updatePlayerMovement(deltaTime, isOnGround);
            
            // Handle weapon inputs from unified controls
            this.handleWeaponInputs(deltaTime, isOnGround);
            
            // Rest of collision checks
            if (this.collisionManager.checkHazardCollisions(this.player) ||
                this.collisionManager.checkEnemyCollisions(this.player, this.enemies)) {
                this.handlePlayerDeath();
                return;
            }

            // Handle collectible collisions through CollectionManager
            const collidedCollectibles = this.collisionManager.checkCollectibleCollisions(this.player, this.level.collectibles);
            collidedCollectibles.forEach(collectible => {
                this.score += GAME_CONSTANTS.COLLECTIBLES[collectible.type].POINTS;
                collectible.collected = true;
            });

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

            // Handle level exit collisions
            const levelExit = this.collisionManager.checkLevelExitCollision(this.player);
            if (levelExit) {
                this.loadLevel(this.currentLevel + 1);
                return;
            }
        }
        
        updatePlayerMovement(deltaTime, isOnGround) {
            // Set horizontal velocity based on controls
            if (this.controls.isPressed('ArrowLeft')) {
                this.player.velocityX = -GAME_CONSTANTS.PLAYER.MOVE_SPEED;
                this.player.facingLeft = true;
            } else if (this.controls.isPressed('ArrowRight')) {
                this.player.velocityX = GAME_CONSTANTS.PLAYER.MOVE_SPEED;
                this.player.facingLeft = false;
            } else {
                this.player.velocityX = 0;
            }
            
            // Set vertical velocity for jetpack (flying)
            if (this.controls.isPressed('ArrowUp') && this.fuel > 0) {
                this.player.velocityY = -GAME_CONSTANTS.PLAYER.FLY_SPEED;
                this.fuel = Math.max(0, this.fuel - GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * deltaTime);
            } else if (!isOnGround) {
                this.player.velocityY += GAME_CONSTANTS.PLAYER.GRAVITY * deltaTime;
            } else {
                this.player.velocityY = 0;
                if (this.fuel < GAME_CONSTANTS.PLAYER.MAX_FUEL) {
                    this.fuel += GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * deltaTime;
                }
            }
            
            // Apply velocities with deltaTime
            this.player.x += this.player.velocityX * deltaTime;
            this.player.y += this.player.velocityY * deltaTime;
            
            // Handle wall collisions after movement
            this.collisionManager.handleGridCollisions(this.player);
        }
        
        handleWeaponInputs(deltaTime, isOnGround) {
            // Laser weapon (space bar or laser button)
            if (this.controls.isPressed(' ')) {
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
            
            // Dynamite weapon (X key, down arrow, or bomb button)
            // Use proper ground check for arrow down/swipe down
            if ((this.controls.isPressed('KeyX') || this.controls.canDropDynamite()) && 
                this.dynamites.length < 3 && isOnGround) {
                // Create a new dynamite at the player's position
                const dynamite = new Dynamite(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height
                );
                this.dynamites.push(dynamite);
            }
            
            // Update dynamites
            for (let i = this.dynamites.length - 1; i >= 0; i--) {
                const dynamite = this.dynamites[i];
                if (dynamite.update(deltaTime)) {
                    // When the dynamite timer reaches zero, create an explosion
                    this.addExplosion(dynamite.x, dynamite.y);
                    this.dynamites.splice(i, 1);
                }
            }
            
            // Update explosions and properly remove them when done
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                this.explosions[i].timeLeft -= deltaTime;
                if (this.explosions[i].timeLeft <= 0) {
                    this.explosions.splice(i, 1);
                }
            }

            // Also update sparkles and remove them when done
            for (let i = this.sparkles.length - 1; i >= 0; i--) {
                this.sparkles[i].timeLeft -= deltaTime;
                if (this.sparkles[i].timeLeft <= 0) {
                    this.sparkles.splice(i, 1);
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
            
            // Render explosions - place this before the darkness overlay
            for (let i = 0; i < this.explosions.length; i++) {
                const explosion = this.explosions[i];
                const progress = explosion.timeLeft / explosion.duration;
                const screenX = explosion.x - this.camera.x;
                const screenY = explosion.y - this.camera.y;
                
                // Only render if timeLeft > 0
                if (progress > 0) {
                    // Draw explosion with dynamic opacity based on remaining time
                    const gradient = this.ctx.createRadialGradient(
                        screenX, screenY, 0, 
                        screenX, screenY, explosion.radius * progress
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 200, ${progress})`);
                    gradient.addColorStop(0.2, `rgba(255, 200, 0, ${progress * 0.8})`);
                    gradient.addColorStop(0.4, `rgba(255, 100, 0, ${progress * 0.6})`);
                    gradient.addColorStop(0.8, `rgba(255, 50, 0, ${progress * 0.4})`);
                    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(screenX, screenY, explosion.radius * progress, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            // Create darkness overlay if lights are out
            if (!this.lightsOn) { // Changed from this.lightsOn to !this.lightsOn
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
            
            // Add glow effect for explosions in darkness
            if (!this.lightsOn) {
                for (const explosion of this.explosions) {
                    const progress = explosion.timeLeft / explosion.duration;
                    
                    // Only render if timeLeft > 0
                    if (progress > 0) {
                        const screenX = explosion.x - this.camera.x;
                        const screenY = explosion.y - this.camera.y;
                        
                        const explosionGradient = this.ctx.createRadialGradient(
                            screenX, screenY, 0,
                            screenX, screenY, explosion.radius * 1.5 * progress
                        );
                        explosionGradient.addColorStop(0, `rgba(255, 200, 0, ${progress * 0.8})`);
                        explosionGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
                        
                        this.ctx.fillStyle = explosionGradient;
                        this.ctx.beginPath();
                        this.ctx.arc(screenX, screenY, explosion.radius * 1.5 * progress, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
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
            
            // Draw virtual joystick for touch controls
            this.controls.drawVirtualJoystick(this.ctx);
        }
        
        drawPlayer() {
            const screenX = this.player.x - this.camera.x;
            const screenY = this.player.y - this.camera.y;
            const tileSize = GAME_CONSTANTS.TILE_SIZE;
            
            // All measurements relative to player size (2x2 tiles)
            const playerWidth = tileSize * GAME_CONSTANTS.PLAYER.WIDTH;
            const playerHeight = tileSize * GAME_CONSTANTS.PLAYER.HEIGHT;
            
            // Draw rotor above head
            this.drawRotor(
                screenX + playerWidth * 0.5, 
                screenY - playerHeight * 0.1,  // Position above the head
                playerWidth * 0.7,             // Rotor width (percentage of player width)
                this.player.rotorAngle || 0
            );

            // Draw jetpack - now wider and closer to the player
            this.ctx.fillStyle = '#FFA000'; // Jetpack base color
            
            // Left side jetpack - wider and closer to player
            this.ctx.fillRect(
                screenX + playerWidth * 0.15, // Moved closer to player (was 0.05)
                screenY + playerHeight * 0.1,
                playerWidth * 0.20, // Made wider (was 0.15)
                playerHeight * 0.4
            );
            
            // Right side jetpack - wider and closer to player
            this.ctx.fillRect(
                screenX + playerWidth * 0.65, // Moved closer to player (was 0.8)
                screenY + playerHeight * 0.1,
                playerWidth * 0.20, // Made wider (was 0.15)
                playerHeight * 0.4
            );
            
            // Draw jetpack exhaust flames when flying
            if (this.controls.isPressed('ArrowUp') && this.fuel > 0) {
                const time = performance.now() / 1000;
                
                // Left rocket flame - adjust position to match widened jetpack
                this.drawRocketFlame(
                    screenX + playerWidth * 0.25, // Centered on wider jetpack (was 0.125)
                    screenY + playerHeight * 0.52,
                    playerWidth * 0.15, // Made flame wider (was 0.1)
                    playerHeight * 0.25, // Made flame taller (was 0.2)
                    time
                );
                
                // Right rocket flame - adjust position to match widened jetpack
                this.drawRocketFlame(
                    screenX + playerWidth * 0.75, // Centered on wider jetpack (was 0.875)
                    screenY + playerHeight * 0.52,
                    playerWidth * 0.15, // Made flame wider (was 0.1)
                    playerHeight * 0.25, // Made flame taller (was 0.2)
                    time + 0.5 // Offset animation slightly
                );
            }
            
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
            // Adjusted body shape to connect better with jetpacks
            this.ctx.moveTo(screenX + playerWidth * 0.33, screenY + playerHeight * 0.5);
            this.ctx.lineTo(screenX + playerWidth * 0.25, screenY + playerHeight * 0.1);
            this.ctx.lineTo(screenX + playerWidth * 0.75, screenY + playerHeight * 0.1);
            this.ctx.lineTo(screenX + playerWidth * 0.67, screenY + playerHeight * 0.5);
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

        drawRotor(centerX, centerY, rotorWidth, angle) {
            const ctx = this.ctx;
            const rotorHeight = rotorWidth * 0.1;  // Thin rotor blades
            const stemWidth = rotorWidth * 0.1;    // Width of central stem
            const stemHeight = rotorWidth * 0.15;  // Height of the stem
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // Draw central stem (vertical part of the T)
            ctx.fillStyle = '#505050';
            ctx.fillRect(-stemWidth/2, -stemHeight, stemWidth, stemHeight);
            
            // Draw rotor blades (horizontal part of the T)
            ctx.fillStyle = '#303030';
            
            // Draw the main blade with tapered ends for better appearance
            ctx.beginPath();
            ctx.moveTo(-rotorWidth/2, -rotorHeight/2);
            ctx.lineTo(rotorWidth/2, -rotorHeight/2);
            ctx.lineTo(rotorWidth/2, rotorHeight/2);
            ctx.lineTo(-rotorWidth/2, rotorHeight/2);
            ctx.closePath();
            ctx.fill();
            
            // Add highlights to make the rotor more visible
            ctx.strokeStyle = '#707070';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-rotorWidth/2, -rotorHeight/2);
            ctx.lineTo(rotorWidth/2, -rotorHeight/2);
            ctx.stroke();
            
            ctx.restore();
        }

        drawRocketFlame(x, y, width, height, time) {
            const ctx = this.ctx;
            
            // Create flame path
            ctx.save();
            
            // Define flame animation parameters
            const flameHeight = height * (0.8 + Math.sin(time * 10) * 0.2);
            const flickerX = Math.sin(time * 15) * width * 0.15;
            
            // Draw main flame with gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + flameHeight);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.2, '#FFFF00');
            gradient.addColorStop(0.5, '#FF9500');
            gradient.addColorStop(0.8, '#FF5500');
            gradient.addColorStop(1, '#FF2200');
            
            ctx.fillStyle = gradient;
            
            // Draw flame shape
            ctx.beginPath();
            ctx.moveTo(x - width/2, y);
            ctx.quadraticCurveTo(
                x + flickerX, y + flameHeight * 0.7,
                x - width/3 + flickerX/2, y + flameHeight
            );
            ctx.quadraticCurveTo(
                x + width/4, y + flameHeight * 0.9,
                x + width/2, y
            );
            ctx.fill();
            
            // Add inner glow
            const innerGradient = ctx.createLinearGradient(x, y, x, y + flameHeight * 0.7);
            innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            innerGradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.5)');
            innerGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
            
            ctx.fillStyle = innerGradient;
            ctx.beginPath();
            ctx.moveTo(x - width/4, y);
            ctx.quadraticCurveTo(
                x + flickerX/2, y + flameHeight * 0.5,
                x, y + flameHeight * 0.7
            );
            ctx.quadraticCurveTo(
                x + width/8, y + flameHeight * 0.5,
                x + width/4, y
            );
            ctx.fill();
            
            // Add spark particles
            const sparkCount = 3;
            for (let i = 0; i < sparkCount; i++) {
                const sparkTime = (time * 8 + i * 2.1) % 5;
                const sparkProgress = sparkTime / 5;
                
                if (sparkProgress < 1) {
                    const sparkX = x + (Math.random() - 0.5) * width * 0.8;
                    const sparkY = y + sparkProgress * flameHeight;
                    const sparkSize = (1 - sparkProgress) * 3;
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - sparkProgress) + ')';
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Add glow effect
            ctx.globalCompositeOperation = 'screen';
            const glowGradient = ctx.createRadialGradient(
                x, y + flameHeight/2, 0,
                x, y + flameHeight/2, flameHeight * 1.2
            );
            glowGradient.addColorStop(0, 'rgba(255, 200, 50, 0.5)');
            glowGradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.3)');
            glowGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y + flameHeight/2, flameHeight * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
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
            
            // Create new level instance
            this.level = new Level(LEVELS[levelNumber]);
            
            // Set canvas size based on viewport if needed
            if (this.canvas.width !== this.level.viewport * GAME_CONSTANTS.TILE_SIZE) {
                this.canvas.width = this.level.viewport * GAME_CONSTANTS.TILE_SIZE;
                this.canvas.height = this.level.viewport * GAME_CONSTANTS.TILE_SIZE;
            }
            
            const startPos = this.level.findPlayerStart();
            
            // Reset player position
            this.player.x = startPos.x * GAME_CONSTANTS.TILE_SIZE;
            this.player.y = startPos.y * GAME_CONSTANTS.TILE_SIZE;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.player.rotorAngle = 0; // Reset rotor angle for new level
            
            // Reset state
            this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
            this.dynamites = [];
            this.explosions = [];
            this.sparkles = [];
            this.lasers = [];
            this.lightsOn = this.level.initialLightsOn; // Set initial light state
            
            // Reinitialize entities for the new level
            this.initializeEntities();
            
            // Create a new collision manager for the new level
            this.collisionManager = new CollisionManager(this.level);
            
            // Reset camera
            this.camera = {
                x: 0,
                y: 0
            };
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
            
            // Add visual spark effects
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 150 + 50;
                this.sparkles.push({
                    x: explosion.x,
                    y: explosion.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 4 + 2,
                    timeLeft: Math.random() * 0.5 + 0.3
                });
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