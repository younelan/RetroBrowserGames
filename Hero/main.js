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
    'game/systems/CollectibleSystem.js',
    'game/ui/EndScreens.js'  // Add the new EndScreens class
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
            
            // Create end screens manager
            this.endScreens = new EndScreens();
            
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

            // Add click listener for restart button
            this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
            this.canvas.addEventListener('touchend', (e) => {
                // Prevent default to avoid unwanted scrolling or zooming
                e.preventDefault();
                this.handleCanvasClick(e);
            }, { passive: false });
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
                this.endScreens.setGameOverTime(performance.now() / 1000);
                this.endScreens.updateScore(this.score);
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
            // Get horizontal and vertical intensities (-1 to +1, can exceed 1 for touch)
            const horizontalIntensity = this.controls.getHorizontalIntensity();
            const verticalIntensity = this.controls.getVerticalIntensity();
            
            // Set horizontal velocity based on intensity
            if (horizontalIntensity !== 0) {
                // Apply the intensity to the base speed
                this.player.velocityX = horizontalIntensity * GAME_CONSTANTS.PLAYER.MOVE_SPEED;
                
                // Update facing direction based on current movement
                this.player.facingLeft = horizontalIntensity < 0;
            } else {
                this.player.velocityX = 0;
            }
            
            // Set vertical velocity for jetpack (flying)
            if (verticalIntensity < 0 && this.fuel > 0) { // Negative means up
                // Apply the intensity to the jetpack speed
                const flySpeed = Math.abs(verticalIntensity) * GAME_CONSTANTS.PLAYER.FLY_SPEED;
                this.player.velocityY = -flySpeed;
                
                // Fuel consumption is proportional to intensity
                const fuelRate = GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * Math.abs(verticalIntensity);
                this.fuel = Math.max(0, this.fuel - fuelRate * deltaTime);
            } else if (!isOnGround) {
                // Apply gravity with a cap to prevent excessive falling speed
                const maxFallSpeed = GAME_CONSTANTS.PLAYER.GRAVITY * 0.5;
                this.player.velocityY = Math.min(
                    this.player.velocityY + GAME_CONSTANTS.PLAYER.GRAVITY * deltaTime,
                    maxFallSpeed
                );
            } else {
                this.player.velocityY = 0;
                if (this.fuel < GAME_CONSTANTS.PLAYER.MAX_FUEL) {
                    this.fuel += GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * deltaTime;
                }
            }
            
            // Move player with proper collision detection
            // Use smaller steps for precise collision detection
            const steps = 5; // Increase steps for more precise collision detection
            const stepDeltaTime = deltaTime / steps;
            
            for (let i = 0; i < steps; i++) {
                // Move along X-axis first
                const originalX = this.player.x;
                if (this.player.velocityX !== 0) {
                    this.player.x += this.player.velocityX * stepDeltaTime;
                    // Check for collisions on X-axis movement
                    if (this.collisionManager.handleGridCollisions(this.player)) {
                        // X-collision detected, position already corrected by collision handler
                    } 
                }
                
                // Then move along Y-axis
                const originalY = this.player.y;
                if (this.player.velocityY !== 0) {
                    this.player.y += this.player.velocityY * stepDeltaTime;
                    // Check for collisions on Y-axis movement
                    if (this.collisionManager.handleGridCollisions(this.player)) {
                        // Y-collision detected, position already corrected by collision handler
                    }
                }
            }
        }
        
        handleWeaponInputs(deltaTime, isOnGround) {
            // Laser weapon (space bar or laser button)
            if (this.controls.isPressed(' ')) {
                this.laserActive = true;
                this.laser.active = true;
                this.laserPhase += deltaTime * 10;
                
                // Update laser before checking collisions
                this.laser.update(deltaTime, this.player, this.level);
                
                // Check laser collisions with enemies
                const hitEnemies = this.collisionManager.checkLaserCollisions(this.laser, this.enemies);
                
                hitEnemies.forEach(enemy => {
                    // Make sure enemies actually get hit and removed
                    enemy.hit();
                    enemy.alive = false; // Ensure enemy is marked as dead
                    
                    // Remove enemy from map
                    const tileX = Math.floor(enemy.x / GAME_CONSTANTS.TILE_SIZE);
                    const tileY = Math.floor(enemy.y / GAME_CONSTANTS.TILE_SIZE);
                    if (tileX >= 0 && tileY >= 0 && tileY < this.level.map.length && tileX < this.level.map[0].length) {
                        this.level.map[tileY][tileX] = ' '; // Replace with empty space
                    }
                    
                    this.score += 100;
                });
            } else {
                this.laserActive = false;
                this.laser.active = false;
            }
            
            // Dynamite weapon (X key, down arrow, or bomb button)
            // Use proper ground check for arrow down/swipe down
            if ((this.controls.isPressed('KeyX') || this.controls.canDropDynamite()) && 
                this.dynamites.length < 3 && isOnGround) {
                // Create a new dynamite at the player's feet
                const dynamite = new Dynamite(
                    this.player.x + this.player.width / 2, // Center horizontally
                    this.player.y + this.player.height // Place at the bottom of player
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
            
            // Draw the player using the Player class's render method
            this.ctx.save();
            if (this.drowning) {
                // Make player semi-transparent when drowning
                this.ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 200) * 0.5;
            }
            this.player.render(this.ctx, this.camera, this.controls, this.fuel);
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
            
            // Draw laser beam
            if (this.laserActive) {
                const direction = this.player.facingLeft ? -1 : 1;
                const eyeY = this.player.y - this.camera.y + this.player.height * 0.1; // Match goggle position
                const eyeX = this.player.x - this.camera.x + (this.player.facingLeft ? 
                    this.player.width * 0.4 : this.player.width * 0.6); // Left or right eye
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
                    const screenX = explosion.x - this.camera.x;
                    const screenY = explosion.y - this.camera.y;
                    
                    // Only render if timeLeft > 0
                    if (progress > 0) {
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
                this.endScreens.renderGameOverScreen(this.ctx, this.canvas.width, this.canvas.height);
            } else if (this.gameWon) {
                this.endScreens.renderWinScreen(this.ctx, this.canvas.width, this.canvas.height);
            }
            
            // Draw virtual joystick for touch controls
            this.controls.drawVirtualJoystick(this.ctx);

            // Draw HUD elements after game world rendering
            this.renderHUD();
        }

        renderHUD() {
            // Draw game status indicators
            const padding = 10;
            const fuelBarWidth = 150;
            const barHeight = 20;
            
            // Get HUD element
            const hud = document.getElementById('hud');
            if (hud) {
                // Update lives display
                const livesElement = document.getElementById('lives');
                if (livesElement) {
                    livesElement.textContent = `❤️ ${this.lives}`;
                }
                
                // Update score display
                const scoreElement = document.getElementById('score');
                if (scoreElement) {
                    scoreElement.textContent = `💎 ${this.score}`;
                }
                
                // Clear fuel element to replace with visual bar
                const fuelElement = document.getElementById('fuel');
                if (fuelElement) {
                    fuelElement.innerHTML = ''; // Clear text content
                    
                    // Create fuel bar container
                    const fuelBar = document.createElement('div');
                    fuelBar.style.display = 'flex';
                    fuelBar.style.alignItems = 'center';
                    fuelBar.style.gap = '5px';
                    
                    // Add fuel icon
                    const fuelIcon = document.createElement('span');
                    fuelIcon.textContent = '⛽';
                    fuelBar.appendChild(fuelIcon);
                    
                    // Create outer bar container
                    const barContainer = document.createElement('div');
                    barContainer.style.width = `${fuelBarWidth}px`;
                    barContainer.style.height = `${barHeight}px`;
                    barContainer.style.border = '1px solid white';
                    barContainer.style.borderRadius = '3px';
                    barContainer.style.overflow = 'hidden';
                    barContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    
                    // Create inner bar that shows fuel level
                    const innerBar = document.createElement('div');
                    const fuelPercentage = (this.fuel / GAME_CONSTANTS.PLAYER.MAX_FUEL) * 100;
                    
                    // Set color based on fuel level
                    let barColor;
                    if (fuelPercentage > 60) {
                        barColor = '#2ECC71'; // Green for high fuel
                    } else if (fuelPercentage > 30) {
                        barColor = '#F1C40F'; // Yellow for medium fuel
                    } else {
                        barColor = '#E74C3C'; // Red for low fuel
                    }
                    
                    innerBar.style.width = `${fuelPercentage}%`;
                    innerBar.style.height = '100%';
                    innerBar.style.backgroundColor = barColor;
                    innerBar.style.transition = 'width 0.3s, background-color 0.5s';
                    
                    // Add inner bar to container
                    barContainer.appendChild(innerBar);
                    
                    // Add bar container to fuel element
                    fuelBar.appendChild(barContainer);
                    fuelElement.appendChild(fuelBar);
                }
                
                // Update level display
                const levelElement = document.getElementById('level');
                if (levelElement) {
                    levelElement.textContent = `Level: ${this.currentLevel + 1}`;
                }
            }
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
                this.endScreens.setWinTime(performance.now() / 1000);
                this.endScreens.updateScore(this.score);
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

        handleCanvasClick(event) {
            // Get restart button area from end screens
            const restartButton = this.endScreens.getRestartButton();
            if (!restartButton) return;
            
            // Get click coordinates
            let x, y;
            if (event.type === 'touchend') {
                const rect = event.target.getBoundingClientRect();
                const touch = event.changedTouches[0];
                x = touch.clientX - rect.left;
                y = touch.clientY - rect.top;
            } else {
                const rect = this.canvas.getBoundingClientRect();
                x = event.clientX - rect.left;
                y = event.clientY - rect.top;
            }
            
            // Check if click is within button bounds
            if (x >= restartButton.x && 
                x <= restartButton.x + restartButton.width &&
                y >= restartButton.y && 
                y <= restartButton.y + restartButton.height) {
                // Reset the game
                this.restartGame();
            }
        }

        restartGame() {
            // Reset game state
            this.currentLevel = 0;
            this.score = 0;
            this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
            this.lives = GAME_CONSTANTS.PLAYER.STARTING_LIVES;
            this.gameOver = false;
            this.gameWon = false;
            this.dynamites = [];
            this.explosions = [];
            this.sparkles = [];

            // Load the first level
            this.loadLevel(0);
        };
    };
    
    // Start the game
    new Game();
}).catch(error => {
    console.error('Failed to load game:', error);
});