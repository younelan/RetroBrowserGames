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
        this.playerState = 'ALIVE'; // 'ALIVE', 'DYING'
        this.deathAnimationTimer = 0;
        this.fallDistance = 0; // Track vertical distance fallen
        
        // Classic Manic Miner dancing animation
        this.danceTimer = 0;
        this.danceSteps = 0;
        this.danceDirection = 1; // 1 for right, -1 for left
        this.dancePhase = 0; // 0 = moving right, 1 = moving left
        this.idleTimer = 0;
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
            if (window.game && window.game.jumpSound && window.game.soundEnabled) {
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

        // Update animation frame and classic Manic Miner dancing
        this.frameCounter++;
        
        if (this.velocityX !== 0 && this.onGround) {
            // Player is actively moving
            this.idleTimer = 0;
            if (this.frameCounter > 5) { // Change frame every 5 game ticks
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.frameCounter = 0;
            }
        } else if (this.onGround) {
            // Player is idle - just stay still
            this.animationFrame = 0; // Static frame when idle
        } else {
            // Player is jumping/falling
            this.animationFrame = 0; 
            this.idleTimer = 0;
        }
    }

    handleHorizontalCollisions(level, prevX) {
        // Handle all solid platforms (non-moving platforms)
        level.solidPlatforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityX > 0) { // Moving right, hit left side of platform
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                    this.x = platform.x + platform.width;
                }
                this.velocityX = 0;
            }
        });

        // Handle crumbling platforms
        level.crumblePlatforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityX > 0) { // Moving right, hit left side of platform
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                    this.x = platform.x + platform.width;
                }
                this.velocityX = 0;
            }
        });

        // Handle moving platforms
        level.movingPlatforms.forEach(platform => {
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

        // Handle all solid platforms (only solid from top)
        level.solidPlatforms.forEach(platform => {
            // Check for collision only if falling
            if (this.velocityY > 0 && this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
            }
            // If moving up and colliding, do nothing (pass through)
        });

        // Handle moving platforms - special logic for conveyor movement
        level.movingPlatforms.forEach(platform => {
            const tileAttr = TILE_ATTRIBUTES[platform.type];
            if (tileAttr && tileAttr.isMoving) {
                // Check if player's feet are on the platform and there's horizontal overlap
                if (this.velocityY > 0 && 
                    this.y + this.height >= platform.y && this.y + this.height <= platform.y + platform.height &&
                    this.x < platform.x + platform.width && this.x + this.width > platform.x) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    onGroundThisFrame = true;
                    
                    // Apply conveyor movement
                    if (tileAttr.moveDirection === -1) {
                        this.x -= 1; // Move player left
                    } else if (tileAttr.moveDirection === 1) {
                        this.x += 1; // Move player right
                    }
                }
            }
        });

        // Handle crumbling platforms (only solid from top, start decay on contact)
        level.crumblePlatforms.forEach(platform => {
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

        // Update crumbling platforms decay
        level.crumblePlatforms = level.crumblePlatforms.filter(p => {
            if (p.decay > 0) {
                p.decay++;
                if (p.decay > 30) { // Disappear after 30 frames of decay
                    // Also remove from legacy array
                    const index = level.crumblingPlatforms.indexOf(p);
                    if (index > -1) level.crumblingPlatforms.splice(index, 1);
                    return false; // Remove platform
                }
            }
            return true;
        });
        
        // Update legacy array as well
        level.crumblingPlatforms = level.crumblingPlatforms.filter(p => {
            return p.decay === undefined || p.decay <= 30;
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
            context.globalAlpha = 1 - (this.deathAnimationTimer / 60);
            if (context.globalAlpha <= 0) {
                context.globalAlpha = 0;
            }
        }

        const s = TILE_SIZE / 16;
        
        context.save();
        
        // Smooth continuous walking animation
        const isMoving = Math.abs(this.velocityX) > 0.1;
        // Use custom animation time if provided (for spare lives), otherwise use real time
        const walkTime = isMoving ? (this.customAnimationTime !== undefined ? this.customAnimationTime : Date.now() * 0.012) : 0;
        const walkCycle = Math.sin(walkTime);
        const walkCycle2 = Math.sin(walkTime + Math.PI); // Opposite phase
        
        // Subtle body bob only when walking
        const bodyBob = isMoving ? Math.sin(walkTime * 2) * 0.5 * s : 0;
        
        // Apply horizontal flip for direction
        if (this.direction === -1) {
            context.translate(this.x + this.width / 2, this.y);
            context.scale(-1, 1);
            context.translate(-(this.x + this.width / 2), -this.y);
        }

        // Miner in Side View Profile (facing direction of movement) - 3D and cool looking
        
        // Mining Helmet with 3D shading
        context.fillStyle = '#FFD700';
        context.fillRect(this.x + 4 * s, this.y + 1 * s + bodyBob, 7 * s, 4 * s);
        context.fillRect(this.x + 3 * s, this.y + 2 * s + bodyBob, 2 * s, 2 * s); // Back of helmet
        // Helmet shadow/depth
        context.fillStyle = '#CC9900';
        context.fillRect(this.x + 4 * s, this.y + 4 * s + bodyBob, 7 * s, 1 * s);
        context.fillRect(this.x + 3 * s, this.y + 3 * s + bodyBob, 2 * s, 1 * s);
        
        // Helmet lamp with glow effect
        context.fillStyle = '#FFFFFF';
        context.fillRect(this.x + 11 * s, this.y + 2 * s + bodyBob, 2 * s, 2 * s);
        // Light beam with glow
        context.fillStyle = '#FFFFAA';
        context.fillRect(this.x + 13 * s, this.y + 3 * s + bodyBob, 3 * s, 1 * s);
        context.fillStyle = '#FFFFFF';
        context.fillRect(this.x + 13 * s, this.y + 3 * s + bodyBob, 2 * s, 1 * s);
        
        // Head with 3D shading
        context.fillStyle = '#FFCC99';
        context.fillRect(this.x + 4 * s, this.y + 5 * s + bodyBob, 6 * s, 4 * s);
        context.fillRect(this.x + 10 * s, this.y + 6 * s + bodyBob, 2 * s, 2 * s); // Nose
        // Face shadow for depth
        context.fillStyle = '#E6B380';
        context.fillRect(this.x + 4 * s, this.y + 8 * s + bodyBob, 6 * s, 1 * s);
        context.fillRect(this.x + 9 * s, this.y + 6 * s + bodyBob, 1 * s, 2 * s);
        
        // Eye with more detail
        context.fillStyle = '#FFFFFF';
        context.fillRect(this.x + 6 * s, this.y + 6 * s + bodyBob, 2 * s, 1 * s);
        context.fillStyle = '#000000';
        context.fillRect(this.x + 7 * s, this.y + 6 * s + bodyBob, 1 * s, 1 * s);
        
        // Body/Torso with 3D shading and muscle definition
        context.fillStyle = '#0066FF';
        context.fillRect(this.x + 4 * s, this.y + 9 * s + bodyBob, 6 * s, 6 * s);
        // Torso shading
        context.fillStyle = '#004499';
        context.fillRect(this.x + 4 * s, this.y + 13 * s + bodyBob, 6 * s, 2 * s);
        context.fillRect(this.x + 8 * s, this.y + 9 * s + bodyBob, 2 * s, 6 * s);
        // Chest muscles
        context.fillStyle = '#0077DD';
        context.fillRect(this.x + 5 * s, this.y + 10 * s + bodyBob, 2 * s, 2 * s);
        context.fillRect(this.x + 7 * s, this.y + 10 * s + bodyBob, 2 * s, 2 * s);
        
        // Animated Arms with proper joints and muscles
        const armSwing = isMoving ? walkCycle * 0.4 : 0;
        
        // Back arm (further from viewer) - full arm with shoulder, upper arm, forearm
        context.save();
        // Shoulder
        context.fillStyle = '#0066FF';
        context.translate(this.x + 3 * s, this.y + 10 * s + bodyBob);
        context.rotate(armSwing);
        context.fillRect(0, 0, 3 * s, 3 * s); // Shoulder
        context.fillRect(1 * s, 3 * s, 2 * s, 4 * s); // Upper arm
        // Elbow joint
        context.translate(2 * s, 7 * s);
        context.rotate(armSwing * 0.5);
        context.fillRect(-1 * s, 0, 2 * s, 4 * s); // Forearm
        // Hand
        context.fillStyle = '#FFCC99';
        context.fillRect(-1 * s, 4 * s, 2 * s, 2 * s);
        context.restore();
        
        // Front arm (closer to viewer) - brighter and more prominent
        context.save();
        // Shoulder
        context.fillStyle = '#0077DD';
        context.translate(this.x + 9 * s, this.y + 10 * s + bodyBob);
        context.rotate(-armSwing);
        context.fillRect(0, 0, 3 * s, 3 * s); // Shoulder
        context.fillRect(1 * s, 3 * s, 2 * s, 4 * s); // Upper arm
        // Elbow joint
        context.translate(2 * s, 7 * s);
        context.rotate(-armSwing * 0.5);
        context.fillRect(-1 * s, 0, 2 * s, 4 * s); // Forearm
        // Hand
        context.fillStyle = '#FFD6B3';
        context.fillRect(-1 * s, 4 * s, 2 * s, 2 * s);
        context.restore();
        
        // Pants with 3D shading
        context.fillStyle = '#654321';
        context.fillRect(this.x + 4 * s, this.y + 15 * s + bodyBob, 6 * s, 5 * s);
        // Pants shading
        context.fillStyle = '#4A2F1A';
        context.fillRect(this.x + 4 * s, this.y + 18 * s + bodyBob, 6 * s, 2 * s);
        context.fillRect(this.x + 8 * s, this.y + 15 * s + bodyBob, 2 * s, 5 * s);
        
        // Belt with buckle
        context.fillStyle = '#8B4513';
        context.fillRect(this.x + 4 * s, this.y + 15 * s + bodyBob, 6 * s, 1 * s);
        // Belt buckle
        context.fillStyle = '#C0C0C0';
        context.fillRect(this.x + 6 * s, this.y + 15 * s + bodyBob, 2 * s, 1 * s);
        
        // Muscular legs with 3D shading and proper joints
        context.fillStyle = '#654321';
        
        if (isMoving) {
            // Left leg (back leg in side view) with muscle definition
            const leftLegSwing = walkCycle * 0.4;
            context.save();
            context.translate(this.x + 5 * s, this.y + 20 * s + bodyBob);
            context.rotate(leftLegSwing);
            // Thigh with muscle shading
            context.fillStyle = '#654321';
            context.fillRect(0, 0, 2 * s, 6 * s);
            context.fillStyle = '#4A2F1A';
            context.fillRect(1 * s, 0, 1 * s, 6 * s); // Muscle definition
            
            context.translate(1 * s, 6 * s);
            context.rotate(leftLegSwing * 0.5);
            // Shin with calf muscle
            context.fillStyle = '#654321';
            context.fillRect(-1 * s, 0, 2 * s, 6 * s);
            context.fillStyle = '#4A2F1A';
            context.fillRect(0, 0, 1 * s, 6 * s); // Calf muscle
            
            // Left boot with 3D shading
            context.fillStyle = '#8B4513';
            context.fillRect(-1 * s, 6 * s, 3 * s, 2 * s);
            context.fillStyle = '#654321';
            context.fillRect(-1 * s, 7 * s, 3 * s, 1 * s); // Boot shadow
            context.restore();
            
            // Right leg (front leg in side view) - brighter for 3D effect
            const rightLegSwing = walkCycle2 * 0.4;
            context.save();
            context.translate(this.x + 7 * s, this.y + 20 * s + bodyBob);
            context.rotate(rightLegSwing);
            // Thigh with highlighted muscles
            context.fillStyle = '#765432';
            context.fillRect(0, 0, 2 * s, 6 * s);
            context.fillStyle = '#654321';
            context.fillRect(1 * s, 0, 1 * s, 6 * s); // Muscle highlight
            
            context.translate(1 * s, 6 * s);
            context.rotate(rightLegSwing * 0.5);
            // Shin with prominent calf
            context.fillStyle = '#765432';
            context.fillRect(-1 * s, 0, 2 * s, 6 * s);
            context.fillStyle = '#654321';
            context.fillRect(0, 0, 1 * s, 6 * s); // Calf highlight
            
            // Right boot with depth
            context.fillStyle = '#A0522D';
            context.fillRect(-1 * s, 6 * s, 3 * s, 2 * s);
            context.fillStyle = '#8B4513';
            context.fillRect(-1 * s, 7 * s, 3 * s, 1 * s); // Boot shadow
            context.restore();
        } else {
            // Standing legs with muscle definition
            // Left leg
            context.fillStyle = '#654321';
            context.fillRect(this.x + 5 * s, this.y + 20 * s, 2 * s, 10 * s);
            context.fillStyle = '#4A2F1A';
            context.fillRect(this.x + 6 * s, this.y + 20 * s, 1 * s, 10 * s); // Muscle line
            
            // Right leg (brighter)
            context.fillStyle = '#765432';
            context.fillRect(this.x + 7 * s, this.y + 20 * s, 2 * s, 10 * s);
            context.fillStyle = '#654321';
            context.fillRect(this.x + 8 * s, this.y + 20 * s, 1 * s, 10 * s); // Muscle highlight
            
            // Standing boots with 3D effect
            context.fillStyle = '#8B4513';
            context.fillRect(this.x + 5 * s, this.y + 30 * s, 3 * s, 2 * s);
            context.fillRect(this.x + 7 * s, this.y + 30 * s, 3 * s, 2 * s);
            // Boot shadows
            context.fillStyle = '#654321';
            context.fillRect(this.x + 5 * s, this.y + 31 * s, 3 * s, 1 * s);
            context.fillRect(this.x + 7 * s, this.y + 31 * s, 3 * s, 1 * s);
        }
        
        context.restore();
        context.globalAlpha = 1;
    }
}