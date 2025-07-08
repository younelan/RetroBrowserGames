class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE; // Player is 2 cells high
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.animationFrame = 0; // For walking animation
        this.frameCounter = 0;   // To control animation speed
        this.direction = 1;      // 1 for right, -1 for left
        this.onGround = false; // Track if player is on ground
        this.onMovingFloor = null; // Track if player is on a moving floor ('L' or 'R')
        this.playerState = 'ALIVE'; // 'ALIVE', 'DYING'
        this.deathAnimationTimer = 0;
        this.fallDistance = 0; // Track vertical distance fallen
    }

    update(input, level) {
        if (this.playerState === 'DYING') {
            this.deathAnimationTimer++;
            this.y -= 2; // Float upwards
            // Optionally, change color or size here for effect
            return; // Stop normal updates during death animation
        }

        // Horizontal movement
        if (input.left) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        } else if (input.right) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        } else {
            this.velocityX = 0;
        }

        // Apply gravity
        this.velocityY += GRAVITY;

        // Handle jumping
        if (input.jump && this.onGround) {
            this.velocityY = -PLAYER_JUMP_FORCE;
            this.isJumping = true;
            this.onGround = false;
            // Play jump sound - assuming 'game' object is accessible or passed
            // For now, we'll assume 'game' is globally accessible or passed to player.update
            // A better solution would be to use an event system.
            if (window.game && window.game.jumpSound) {
                window.game.jumpSound.currentTime = 0;
                window.game.jumpSound.play();
            }
        }

        // Store previous position for collision resolution
        const prevX = this.x;
        const prevY = this.y;

        // Update X position and handle horizontal collisions
        this.x += this.velocityX;
        this.handleHorizontalCollisions(level, prevX);

        // Apply movement from moving floors
        if (this.onMovingFloor === 'L') {
            this.x -= 1;
        } else if (this.onMovingFloor === 'R') {
            this.x += 1;
        }

        // Update Y position and handle vertical collisions
        this.y += this.velocityY;
        this.handleVerticalCollisions(level, prevY);

        // Update fall distance
        if (!this.onGround) {
            this.fallDistance += this.velocityY; // Accumulate vertical speed
        } else {
            this.fallDistance = 0; // Reset when on ground
        }

        // World boundaries
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > LEVEL_WIDTH * TILE_SIZE) {
            this.x = LEVEL_WIDTH * TILE_SIZE - this.width;
            this.velocityX = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        // Prevent falling off bottom of game world (above UI)
        const gameWorldBottom = (LEVEL_HEIGHT - UI_HEIGHT_TILES) * TILE_SIZE;
        if (this.y + this.height > gameWorldBottom) {
            this.y = gameWorldBottom - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.onGround = true;
        }

        // Update animation frame
        this.frameCounter++;
        if (this.velocityX !== 0 && this.onGround) {
            if (this.frameCounter > 5) { // Change frame every 5 game ticks
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.frameCounter = 0;
            }
        } else {
            this.animationFrame = 0; // Static frame when not moving or jumping
        }
    }

    handleHorizontalCollisions(level, prevX) {
        level.platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityX > 0) { // Moving right, hit left side of platform
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                    this.x = platform.x + platform.width;
                }
                this.velocityX = 0;
            }
        });
    }

    handleVerticalCollisions(level, prevY) {
        let onGroundThisFrame = false;

        // Handle solid platforms (only solid from top)
        level.platforms.forEach(platform => {
            // Check for collision only if falling
            if (this.velocityY > 0 && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
            }
            // If moving up and colliding, do nothing (pass through)
        });

        // Handle brick floors (behave like solid platforms)
        level.brickFloors.forEach(platform => {
            if (this.velocityY > 0 && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
            }
        });

        // Handle moving left floors
        level.movingLeftFloors.forEach(platform => {
            if (this.velocityY > 0 && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
                this.x -= 1; // Move player left
            }
        });

        // Handle moving right floors
        level.movingRightFloors.forEach(platform => {
            if (this.velocityY > 0 && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
                this.x += 1; // Move player right
            }
        });

        // Handle crumbling platforms (only solid from top)
        level.crumblingPlatforms.forEach(platform => {
            // Check for collision only if falling
            if (this.velocityY > 0 && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
                platform.decay++; // Start decay
            }
            // If moving up and colliding, do nothing (pass through)
        });

        this.onGround = onGroundThisFrame;
        this.onMovingFloor = null;

        if (onGroundThisFrame) {
            level.movingLeftFloors.forEach(platform => {
                if (this.checkCollision(platform)) {
                    this.onMovingFloor = 'L';
                }
            });
            level.movingRightFloors.forEach(platform => {
                if (this.checkCollision(platform)) {
                    this.onMovingFloor = 'R';
                }
            });
        }

        // Update crumbling platforms decay
        level.crumblingPlatforms = level.crumblingPlatforms.filter(p => {
            if (p.decay > 0) {
                p.decay++;
                if (p.decay > 30) { // Disappear after 30 frames of decay
                    return false; // Remove platform
                }
            }
            return true;
        });
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw(context) {
        if (this.playerState === 'DYING') {
            // Simple fade out effect
            context.globalAlpha = 1 - (this.deathAnimationTimer / 60); // Fade out over 60 frames
            if (context.globalAlpha <= 0) {
                context.globalAlpha = 0; // Ensure it fully disappears
            }
        }

        const s = TILE_SIZE / 16; // Scale factor for a 16x16 sprite, based on TILE_SIZE

        context.save();
        // Adjust translation for 2-cell height and correct drawing origin for flipping
        if (this.direction === -1) { // Facing left
            // Translate to the right edge of the player's bounding box, then scale by -1 horizontally
            // This effectively flips the drawing context around the player's right edge.
            context.translate(this.x + this.width, this.y);
            context.scale(-1, 1);
            // Translate back so that subsequent drawing commands (relative to 0,0)
            // are effectively drawing from the original this.x, this.y but flipped.
            context.translate(-this.x, -this.y);
        }

        // Miner Willy Sprite (simplified pixel art)
        // All coordinates are relative to this.x, this.y

        // Helmet (Yellow)
        context.fillStyle = '#FFFF00';
        context.fillRect(this.x + 4 * s, this.y + 2 * s, 8 * s, 3 * s); // Main helmet
        context.fillRect(this.x + 7 * s, this.y + 1 * s, 2 * s, 1 * s); // Lamp base
        context.fillStyle = '#FFFFFF'; // Lamp light
        context.fillRect(this.x + 7 * s, this.y + 0 * s, 2 * s, 1 * s);

        // Head (Skin tone)
        context.fillStyle = '#FFDDDD';
        context.fillRect(this.x + 5 * s, this.y + 5 * s, 6 * s, 6 * s); // Face

        // Body (Cyan) - Top part
        context.fillStyle = '#00AAAA';
        context.fillRect(this.x + 4 * s, this.y + 11 * s, 8 * s, 5 * s); // Upper body (top tile)

        // Body (Cyan) - Bottom part (connected to top part)
        context.fillRect(this.x + 4 * s, this.y + TILE_SIZE + 0 * s, 8 * s, 10 * s); // Lower body (bottom tile)

        // Arms (Cyan)
        context.fillRect(this.x + 2 * s, this.y + 12 * s, 2 * s, 6 * s); // Left arm
        context.fillRect(this.x + 12 * s, this.y + 12 * s, 2 * s, 6 * s); // Right arm

        // Legs (Yellow) - Animated
        context.fillStyle = '#FFFF00';
        if (this.animationFrame === 0) {
            // Frame 0: Legs slightly apart
            context.fillRect(this.x + 4 * s, this.y + TILE_SIZE + 10 * s, 3 * s, 6 * s); // Left leg
            context.fillRect(this.x + 9 * s, this.y + TILE_SIZE + 10 * s, 3 * s, 6 * s); // Right leg
        } else {
            // Frame 1: Legs in a walking pose
            context.fillRect(this.x + 2 * s, this.y + TILE_SIZE + 10 * s, 3 * s, 6 * s); // Left leg (forward)
            context.fillRect(this.x + 11 * s, this.y + TILE_SIZE + 10 * s, 3 * s, 6 * s); // Right leg (backward)
        }

        context.restore();
        context.globalAlpha = 1; // Reset alpha for other drawings
    }
}