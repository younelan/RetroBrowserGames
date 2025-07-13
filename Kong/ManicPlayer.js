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
        this.onLadder = false; // Track if player is on ladder
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

        // Check if player is on a ladder (this determines the state for dispatching)
        this.onLadder = this.isOnLadder(level);
        
        // Process horizontal input (common to all states)
        if (input.left) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        } else if (input.right) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        } else {
            this.velocityX = 0;
        }

        // Dispatch to appropriate movement handler
        if (this.onLadder) {
            this.handleLadderMovement(input, level);
        } else if (this.onGround) {
            this.handleGroundMovement(input, level);
        } else {
            this.handleAirMovement(input, level);
        }

        // World boundaries using actual level dimensions (common to all states)
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > level.levelWidth * TILE_SIZE) {
            this.x = level.levelWidth * TILE_SIZE - this.width;
            this.velocityX = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
        // Prevent falling off bottom of game world (above UI)
        const gameWorldBottom = level.levelHeight * TILE_SIZE;
        if (this.y + this.height > gameWorldBottom) {
            this.y = gameWorldBottom - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.onGround = true;
        }

        // Update animation frame (common to all states)
        this.frameCounter++;
        
        if (this.onLadder && (this.velocityY !== 0)) {
            this.idleTimer = 0;
            if (this.frameCounter > 6) {
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.frameCounter = 0;
            }
        } else if (this.velocityX !== 0 && this.onGround) {
            this.idleTimer = 0;
            if (this.frameCounter > 5) {
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.frameCounter = 0;
            }
        } else if (this.onGround || this.onLadder) {
            this.animationFrame = 0; 
        } else {
            this.animationFrame = 0; 
            this.idleTimer = 0;
        }
    }

    handleGroundMovement(input, level) {
        // Apply gravity (always, unless on ladder)
        this.velocityY += GRAVITY;

        // Handle jumping
        if (input.jump && this.onGround) {
            this.velocityY = -PLAYER_JUMP_FORCE;
            this.isJumping = true;
            this.onGround = false;
            if (window.game && window.game.jumpSound && window.game.soundEnabled) {
                window.game.jumpSound.currentTime = 0;
                window.game.jumpSound.play();
            }
        }

        // Update X position and handle horizontal collisions
        this.x += this.velocityX;
        this.handleGroundHorizontalCollisions(level);

        // Update Y position and handle vertical collisions
        this.y += this.velocityY;
        this.handleVerticalCollisions(level);

        // Update fall distance
        if (!this.onGround) {
            this.fallDistance += this.velocityY; 
        } else {
            this.fallDistance = 0; 
        }
    }

    handleLadderMovement(input, level) {
        // On ladder: smooth climbing movement
        if (input.up) {
            this.velocityY = -PLAYER_SPEED; // Climb up smoothly
        } else if (input.down) {
            this.velocityY = PLAYER_SPEED; // Climb down smoothly
        } else {
            this.velocityY = 0; // Stay in place on ladder
        }
        
        // Reset jumping state when on ladder
        this.isJumping = false;

        // Update X position and handle horizontal collisions
        this.x += this.velocityX;
        this.handleLadderHorizontalCollisions(level);

        // Update Y position and handle vertical collisions
        this.y += this.velocityY;
        this.handleVerticalCollisions(level);

        // Player is on ladder, not on ground
        this.onGround = false;
        this.fallDistance = 0; // Reset fall distance on ladder
    }

    handleAirMovement(input, level) {
        // Apply gravity
        this.velocityY += GRAVITY;

        // Update X position and handle horizontal collisions
        this.x += this.velocityX;
        this.handleAirHorizontalCollisions(level);

        // Update Y position and handle vertical collisions
        this.y += this.velocityY;
        this.handleVerticalCollisions(level);

        // Update fall distance
        this.fallDistance += this.velocityY; 
    }

    handleGroundHorizontalCollisions(level) {
        // Simpler horizontal collision for ground/ladder
        // Prevents moving into solid walls
        const playerRect = { x: this.x, y: this.y, width: this.width, height: this.height };

        for (const platform of level.solidPlatforms) {
            if (this.checkCollision(platform)) {
                // If moving right and hit left side of platform
                if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                }
                // If moving left and hit right side of platform
                else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                }
                this.velocityX = 0;
                return; // Stop checking after first collision
            }
        }

        for (const platform of level.crumblePlatforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                }
                this.velocityX = 0;
                return;
            }
        }
        for (const platform of level.movingPlatforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                }
                this.velocityX = 0;
                return;
            }
        }
    }

    handleLadderHorizontalCollisions(level) {
        // Same as ground horizontal collisions for now
        this.handleGroundHorizontalCollisions(level);
    }

    handleAirHorizontalCollisions(level) {
        // This is the complex one with diagonal pass-through
        // Handle all solid platforms (non-moving platforms)
        for (const platform of level.solidPlatforms) {
            if (this.checkCollision(platform)) {
                // Check if this is primarily a side collision (hitting a vertical wall)
                const playerCenterY = this.y + this.height / 2;
                const platformCenterY = platform.y + platform.height / 2;
                const verticalOverlap = Math.abs(playerCenterY - platformCenterY);
                
                // Only treat as wall collision if player center is roughly aligned with platform center
                // This prevents treating platform tops/bottoms as walls
                if (verticalOverlap < (this.height / 2 + platform.height / 2) * 0.7) {
                    // Special case: Allow diagonal jumps through single layer obstacles
                    if (this.velocityY < 0) { // Player is jumping up
                        const checkX = this.velocityX > 0 ? platform.x + platform.width : platform.x - TILE_SIZE;
                        const checkY = platform.y - this.height; // Check for player's full height
                        
                        // Check if the space diagonally above is clear
                        if (this.isSpaceClear(checkX, checkY, level)) {
                            // Diagonal space is clear, allow horizontal movement to continue
                            continue; // Skip the rest of this platform's collision logic
                        } else {
                            // Diagonal space is NOT clear (solid block above), so stop horizontal movement
                            if (this.velocityX > 0) { // Moving right, hit left side of platform
                                this.x = platform.x - this.width;
                            } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                                this.x = platform.x + platform.width;
                            }
                            this.velocityX = 0; // Stop horizontal movement
                        }
                    } else { // Player is falling or moving horizontally without jumping up
                        // This is a regular side collision, stop horizontal movement
                        if (this.velocityX > 0) { // Moving right, hit left side of platform
                            this.x = platform.x - this.width;
                        } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                            this.x = platform.x + platform.width;
                        }
                        this.velocityX = 0; // Stop horizontal movement
                    }
                }
            }
        }

        // Handle crumbling platforms
        for (const platform of level.crumblePlatforms) {
            if (this.checkCollision(platform)) {
                // Check if this is primarily a side collision (hitting a vertical wall)
                const playerCenterY = this.y + this.height / 2;
                const platformCenterY = platform.y + platform.height / 2;
                const verticalOverlap = Math.abs(playerCenterY - platformCenterY);
                
                // Only treat as wall collision if player center is roughly aligned with platform center
                if (verticalOverlap < (this.height / 2 + platform.height / 2) * 0.7) {
                    // Special case: Allow diagonal jumps through single layer obstacles
                    if (this.velocityY < 0) { // Player is jumping up
                        const checkX = this.velocityX > 0 ? platform.x + platform.width : platform.x - TILE_SIZE;
                        const checkY = platform.y - this.height; // Check for player's full height
                        
                        // Check if the space diagonally above is clear
                        if (this.isSpaceClear(checkX, checkY, level)) {
                            continue; // Allow diagonal jump through single layer, continue checking other platforms
                        } else {
                            // Diagonal space is NOT clear (solid block above), so stop horizontal movement
                            if (this.velocityX > 0) { // Moving right, hit left side of platform
                                this.x = platform.x - this.width;
                            } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                                this.x = platform.x + platform.width;
                            }
                            this.velocityX = 0; // Stop horizontal movement
                        }
                    } else { // Player is falling or moving horizontally without jumping up
                        // This is a regular side collision, stop horizontal movement
                        if (this.velocityX > 0) { // Moving right, hit left side of platform
                            this.x = platform.x - this.width;
                        } else if (this.velocityX < 0) {
                            this.x = platform.x + platform.width;
                        }
                        this.velocityX = 0; // Stop horizontal movement
                    }
                }
            }
        }

        // Handle moving platforms
        for (const platform of level.movingPlatforms) {
            if (this.checkCollision(platform)) {
                // Check if this is primarily a side collision (hitting a vertical wall)
                const playerCenterY = this.y + this.height / 2;
                const platformCenterY = platform.y + platform.height / 2;
                const verticalOverlap = Math.abs(playerCenterY - platformCenterY);
                
                // Only treat as wall collision if player center is roughly aligned with platform center
                if (verticalOverlap < (this.height / 2 + platform.height / 2) * 0.7) {
                    // Special case: Allow diagonal jumps through single layer obstacles
                    if (this.velocityY < 0) { // Player is jumping up
                        const checkX = this.velocityX > 0 ? platform.x + platform.width : platform.x - TILE_SIZE;
                        const checkY = platform.y - this.height; // Check for player's full height
                        
                        // Check if the space diagonally above is clear
                        if (this.isSpaceClear(checkX, checkY, level)) {
                            continue; // Allow diagonal jump through single layer, continue checking other platforms
                        } else {
                            // Diagonal space is NOT clear (solid block above), so stop horizontal movement
                            if (this.velocityX > 0) { // Moving right, hit left side of platform
                                this.x = platform.x - this.width;
                            } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                                this.x = platform.x + platform.width;
                            }
                            this.velocityX = 0; // Stop horizontal movement
                        }
                    }
                    
                    else { // Player is falling or moving horizontally without jumping up
                        // This is a regular side collision, stop horizontal movement
                        if (this.velocityX > 0) { // Moving right, hit left side of platform
                            this.x = platform.x - this.width;
                        } else if (this.velocityX < 0) { // Moving left, hit right side of platform
                            this.x = platform.x + platform.width;
                        }
                        this.velocityX = 0; // Stop horizontal movement
                    }
                }
            }
        }
    }

    handleVerticalCollisions(level) {
        let onGroundThisFrame = false;

        // Handle all solid platforms
        for (const platform of level.solidPlatforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0) { // Falling or stationary
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    onGroundThisFrame = true;
                } 
            }
        }

        // Handle moving platforms - special logic for conveyor movement
        for (const platform of level.movingPlatforms) {
            const tileAttr = TILE_ATTRIBUTES[platform.type];
            if (tileAttr && tileAttr.isMoving) {
                if (this.checkCollision(platform)) {
                    if (this.velocityY > 0) { // Falling or stationary
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
            }
        }

        // Handle crumbling platforms
        for (const platform of level.crumblePlatforms) {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0) { // Falling or stationary
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    onGroundThisFrame = true;
                    // Decay is now handled by the platform's own update() method
                } 
            }
        };

        this.onGround = onGroundThisFrame;

        // Crumbling platform decay is now handled automatically by each platform's update() method
        // and removed from the unified platforms array via level.updateTiles()
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw(context, width, height) {
        const s = Math.min(width, height) / 16; // Scale based on bounding dimensions

        if (this.playerState === 'DYING') {
            context.globalAlpha = 1 - (this.deathAnimationTimer / 60);
            if (context.globalAlpha <= 0) {
                context.globalAlpha = 0;
            }
        }

        context.save();

        const isMoving = Math.abs(this.velocityX) > 0.1;
        const walkTime = isMoving ? (this.customAnimationTime !== undefined ? this.customAnimationTime : Date.now() * 0.006) : 0;
        const walkCycle = Math.sin(walkTime);
        const walkCycle2 = Math.sin(walkTime + Math.PI);
        const bodyBob = isMoving ? Math.sin(walkTime * 2) * 0.5 * s : 0;

        if (this.direction === -1) {
            context.translate(this.x + width / 2, this.y);
            context.scale(-1, 1);
            context.translate(-(this.x + width / 2), -this.y);
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
        const isClimbing = Math.abs(this.velocityY) > 0.1;
        let leftArmLength = 0; // Declare here
        let rightArmLength = 0; // Declare here
        
        if (isClimbing) {
            // Climbing animation - back view for better arm visibility
            const climbTime = Date.now() * 0.008; // Double speed for hands - half second each transition
            // Arms in perfect opposition: one at minimum, other at maximum, meeting halfway
            const armCycle = (Math.sin(climbTime) + 1) / 2; // 0 to 1 smooth cycle
            leftArmLength = 0.5 + armCycle * 6; // Assign here
            rightArmLength = 6.5 - armCycle * 6; // Assign here
            
            // Left arm - back view positioning, both arms clearly visible
            context.save();
            context.fillStyle = '#0066FF';
            context.translate(this.x + 1 * s, this.y + 10 * s + bodyBob); // Further left for back view
            context.fillRect(0, 0, 3 * s, 3 * s); // Shoulder
            context.fillRect(1 * s, 3 * s, 2 * s, 4 * s); // Upper arm
            
            // Forearm with variable length - always visible, grows and shrinks smoothly
            context.translate(2 * s, 7 * s); // Elbow position
            // Forearm starts at elbow (Y=0) and extends down by leftArmLength
            context.fillRect(-1 * s, 0, 2 * s, leftArmLength * s);
            // Hand is positioned at the end of the forearm
            context.fillStyle = '#FFCC99';
            context.fillRect(-1 * s, leftArmLength * s, 2 * s, 2 * s);
            context.restore();
            
            // Right arm - back view positioning, clearly visible
            context.save();
            context.fillStyle = '#0077DD';
            context.translate(this.x + 10 * s, this.y + 10 * s + bodyBob); // Further right for back view
            context.fillRect(0, 0, 3 * s, 3 * s); // Shoulder
            context.fillRect(1 * s, 3 * s, 2 * s, 4 * s); // Upper arm
            
            // Forearm with variable length - always visible, shrinks and grows smoothly
            context.translate(2 * s, 7 * s); // Elbow position
            // Forearm starts at elbow (Y=0) and extends down by rightArmLength
            context.fillRect(-1 * s, 0, 2 * s, rightArmLength * s);
            // Hand is positioned at the end of the forearm
            context.fillStyle = '#FFD6B3';
            context.fillRect(-1 * s, rightArmLength * s, 2 * s, 2 * s);
            context.restore();
            
        } else if (Math.abs(this.velocityX) > 0.1) {
            // Walking animation - side to side arm swing
            const armSwing = walkCycle * 0.4;
            
            // Back arm (further from viewer) - full arm with shoulder, upper arm, forearm
            context.save();
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
            
        } else {
            // Static arms when idle
            // Back arm
            context.save();
            context.fillStyle = '#0066FF';
            context.translate(this.x + 3 * s, this.y + 10 * s + bodyBob);
            context.fillRect(0, 0, 3 * s, 3 * s); // Shoulder
            context.fillRect(1 * s, 3 * s, 2 * s, 4 * s); // Upper arm
            context.translate(2 * s, 7 * s);
            context.fillRect(-1 * s, 0, 2 * s, 4 * s); // Forearm
            context.fillStyle = '#FFCC99';
            context.fillRect(-1 * s, 4 * s, 2 * s, 2 * s); // Hand
            context.restore();
            
            // Front arm
            context.save();
            context.fillStyle = '#0077DD';
            context.translate(this.x + 9 * s, this.y + 10 * s + bodyBob);
            context.fillRect(0, 0, 3 * s, 3 * s); // Shoulder
            context.fillRect(1 * s, 3 * s, 2 * s, 4 * s); // Upper arm
            context.translate(2 * s, 7 * s);
            context.fillRect(-1 * s, 0, 2 * s, 4 * s); // Forearm
            context.fillStyle = '#FFD6B3';
            context.fillRect(-1 * s, 4 * s, 2 * s, 2 * s); // Hand
            context.restore();
        }
        
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
        
        if (isClimbing) {
            // Climbing leg animation - back view for better leg visibility
            const climbTime = Date.now() * 0.002; // Half speed for legs - slower, more realistic climbing pace
            const leftLegBend = Math.sin(climbTime); // Same as left arm timing
            const rightLegBend = Math.sin(climbTime + Math.PI); // Same as right arm timing
            
            // Left leg - back view positioning
            context.save();
            context.translate(this.x + 4 * s, this.y + 20 * s + bodyBob); // Slightly more left
            
            // Thigh - STATIC
            context.fillStyle = '#654321';
            context.fillRect(0, 0, 2 * s, 6 * s);
            context.fillStyle = '#4A2F1A';
            context.fillRect(1 * s, 0, 1 * s, 6 * s); // Muscle definition
            
            // Shin with variable length - contracts when "up"
            context.translate(1 * s, 6 * s); // Knee position
            const leftShinLength = 3 + leftLegBend * 3; // 0 to 6 pixels (bigger range)
            // Shin starts at knee (Y=0) and extends down by leftShinLength
            if (leftShinLength > 0.5) {
                context.fillStyle = '#654321';
                context.fillRect(-1 * s, 0, 2 * s, leftShinLength * s);
                context.fillStyle = '#4A2F1A';
                context.fillRect(0, 0, 1 * s, leftShinLength * s);
                
                // Foot is positioned at the end of the shin
                context.fillStyle = '#8B4513';
                context.fillRect(-1 * s, leftShinLength * s, 3 * s, 2 * s);
                context.fillStyle = '#654321';
                context.fillRect(-1 * s, leftShinLength * s + 1 * s, 3 * s, 1 * s);
            }
            context.restore();
            
            // Right leg - back view positioning
            context.save();
            context.translate(this.x + 8 * s, this.y + 20 * s + bodyBob); // Slightly more right
            
            // Thigh - STATIC
            context.fillStyle = '#765432';
            context.fillRect(0, 0, 2 * s, 6 * s);
            context.fillStyle = '#654321';
            context.fillRect(1 * s, 0, 1 * s, 6 * s);
            
            // Shin with variable length - contracts when "up"
            context.translate(1 * s, 6 * s); // Knee position
            const rightShinLength = 3 + rightLegBend * 3; // 0 to 6 pixels (bigger range)
            // Shin starts at knee (Y=0) and extends down by rightShinLength
            if (rightShinLength > 0.5) {
                context.fillStyle = '#765432';
                context.fillRect(-1 * s, 0, 2 * s, rightShinLength * s);
                context.fillStyle = '#654321';
                context.fillRect(0, 0, 1 * s, rightShinLength * s);
                
                // Foot is positioned at the end of the shin
                context.fillStyle = '#A0522D';
                context.fillRect(-1 * s, rightShinLength * s, 3 * s, 2 * s);
                context.fillStyle = '#8B4513';
                context.fillRect(-1 * s, rightShinLength * s + 1 * s, 3 * s, 1 * s);
            }
            context.restore();
            
        } else if (Math.abs(this.velocityX) > 0.1) {
            // Walking leg animation - side to side swing
            const leftLegSwing = walkCycle * 0.4;
            const rightLegSwing = walkCycle2 * 0.4;
            
            // Left leg (back leg in side view) with muscle definition
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

    isOnLadder(level) {
        // Check if any part of the player overlaps with a ladder
        for (const ladder of level.ladders) {
            if (this.checkCollision(ladder)) {
                return true;
            }
        }
        return false;
    }

    isSpaceClear(x, y, level) {
        // Check if coordinates are outside the level boundaries (consider them as solid)
        if (x < 0 || y < 0 || x >= level.levelWidth * TILE_SIZE || y >= level.levelHeight * TILE_SIZE) {
            return false; // Outside grid is considered full/solid
        }
        
        // Create a test rectangle for the space we want to check
        const testRect = {
            x: x,
            y: y,
            width: TILE_SIZE,
            height: this.height // Check for player's full height
        };
        
        // Check against all platform types
        const allPlatforms = [
            ...level.solidPlatforms,
            ...level.crumblePlatforms,
            ...level.movingPlatforms
        ];
        
        // If any platform overlaps with this space, it's not clear
        for (const platform of allPlatforms) {
            if (testRect.x < platform.x + platform.width &&
                testRect.x + testRect.width > platform.x &&
                testRect.y < platform.y + platform.height &&
                testRect.y + testRect.height > platform.y) {
                return false; // Space is occupied
            }
        }
        
        return true; // Space is clear
    }
}