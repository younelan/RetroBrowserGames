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

        // Check if player is on a ladder
        this.onLadder = this.isOnLadder(level);
        
        // Horizontal movement (works both on and off ladder)
        if (input.left) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        } else if (input.right) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        } else {
            this.velocityX = 0;
        }

        // Vertical movement logic
        if (this.onLadder) {
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
        } else {
            // Not on ladder: normal physics
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

        // World boundaries using actual level dimensions
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

        // Update animation frame and classic Manic Miner dancing
        this.frameCounter++;
        
        if (this.onLadder && (this.velocityY !== 0)) {
            // Player is climbing - animate while moving up/down
            this.idleTimer = 0;
            if (this.frameCounter > 6) { // Slightly slower climbing animation
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.frameCounter = 0;
            }
        } else if (this.velocityX !== 0 && this.onGround) {
            // Player is actively moving horizontally
            this.idleTimer = 0;
            if (this.frameCounter > 5) { // Change frame every 5 game ticks
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.frameCounter = 0;
            }
        } else if (this.onGround || this.onLadder) {
            // Player is idle on ground or ladder - just stay still
            this.animationFrame = 0; // Static frame when idle
        } else {
            // Player is jumping/falling
            this.animationFrame = 0; 
            this.idleTimer = 0;
        }
    }

    handleHorizontalCollisions(level, prevX) {
        // Skip horizontal collisions entirely if player is in the air
        if (!this.onGround) {
            return;
        }

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
            // Skip collision entirely if player is moving up
            if (this.velocityY < 0) {
                return;
            }
            // Only check collision if player is falling or stationary
            if (this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
            }
        });

        // Handle moving platforms - special logic for conveyor movement
        level.movingPlatforms.forEach(platform => {
            const tileAttr = TILE_ATTRIBUTES[platform.type];
            if (tileAttr && tileAttr.isMoving) {
                // Skip collision entirely if player is moving up
                if (this.velocityY < 0) {
                    return;
                }
                // Only check collision if player is falling or stationary
                if (this.checkCollision(platform)) {
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
            // Skip collision entirely if player is moving up
            if (this.velocityY < 0) {
                return;
            }
            // Only check collision if player is falling or stationary
            if (this.checkCollision(platform)) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isJumping = false;
                onGroundThisFrame = true;
                platform.decay++; // Start decay
            }
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
        const isClimbing = this.onLadder && Math.abs(this.velocityY) > 0.1;
        
        if (isClimbing) {
            // Climbing animation - back view for better arm visibility
            const climbTime = Date.now() * 0.008; // Double speed for hands - half second each transition
            // Arms in perfect opposition: one at minimum, other at maximum, meeting halfway
            const armCycle = (Math.sin(climbTime) + 1) / 2; // 0 to 1 smooth cycle
            const leftArmLength = 0.5 + armCycle * 6; // 0.5 to 6.5 pixels (much bigger range!)
            const rightArmLength = 6.5 - armCycle * 6; // 6.5 to 0.5 pixels (opposite, much bigger range!)
            
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
            
        } else if (isMoving) {
            // Walking animation - side to side arm swing
            const armSwing = walkCycle * 0.4;
            
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
            
        } else if (isMoving) {
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
}