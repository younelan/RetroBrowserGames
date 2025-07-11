class PenguinEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 1.2; // Slightly faster waddle
        this.waddleOffset = 0; // For side-to-side waddle
        this.flipperFlap = 0; // For flipper animation
        this.beakBob = 0; // For head bobbing animation
        this.bodyTilt = 0; // For body tilting while waddling
        this.footStep = 0; // For alternating foot steps
        this.animationTimer = 0;
        this.breathTimer = 0; // Separate timer for breath clouds
    }

    update(level) {
        const nextX = this.x + this.direction * this.speed;
        const enemyLeadingEdgeX = (this.direction === 1) ? (nextX + this.width) : nextX;
        const lookAheadTileX = Math.floor(enemyLeadingEdgeX / TILE_SIZE);
        const tileBelowFeetY = Math.floor((this.y + this.height) / TILE_SIZE);

        let nextStepHasPlatformBelow = false;
        const probeX = this.direction === 1 ? nextX + this.width - 1 : nextX; // Probe at the leading edge
        const probeY = this.y + this.height + 1; // 1 pixel below feet

        const probeRect = {
            x: probeX,
            y: probeY,
            width: 1, // A single pixel probe
            height: 1
        };

        for (const platform of level.allPlatforms) {
            if (this.checkCollision(probeRect, platform)) {
                nextStepHasPlatformBelow = true;
                break;
            }
        }

        // Check for wall collision in the next horizontal step
        let isAboutToHitWall = false;
        const nextHorizontalRect = { x: nextX, y: this.y, width: this.width, height: this.height };

        const checkWallCollision = (p) => {
            if (this.checkCollision(nextHorizontalRect, p)) {
                isAboutToHitWall = true;
            }
        };

        level.allPlatforms.forEach(checkWallCollision);

        // Check for world bounds
        const atWorldEdge = (nextX < 0 || nextX + this.width > LEVEL_WIDTH * TILE_SIZE);

        // Turn around if no platform below, about to hit a wall, or at world edge
        if (!nextStepHasPlatformBelow || isAboutToHitWall || atWorldEdge) {
            this.direction *= -1;
        } else {
            this.x = nextX;
        }

        // Update animation timers for penguin-specific animations
        this.animationTimer++;
        this.breathTimer++;
        
        // More pronounced waddle when moving
        const walkCycle = this.animationTimer * 0.25;
        this.waddleOffset = Math.sin(walkCycle) * 4; // More pronounced waddle
        this.bodyTilt = Math.sin(walkCycle) * 0.15; // Body tilts with waddle
        this.footStep = Math.sin(walkCycle * 2) * 2; // Alternating foot steps
        
        // Flipper animation - more active when moving
        this.flipperFlap = Math.sin(this.animationTimer * 0.4) * 3;
        
        // Head bob - gentle rhythm
        this.beakBob = Math.sin(this.animationTimer * 0.2) * 1.5;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Apply waddle offset and body tilt for animation
        const waddleX = centerX + this.waddleOffset;
        
        // Save context for potential flipping
        context.save();
        context.translate(waddleX, centerY);
        
        // Flip the entire penguin horizontally if facing left
        if (this.direction === -1) {
            context.scale(-1, 1);
        }
        
        // Apply body tilt after flipping
        context.rotate(this.bodyTilt);
        
        // Draw shadow under penguin
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.beginPath();
        context.ellipse(0, 28, 12, 4, 0, 0, 2 * Math.PI);
        context.fill();
        
        // Penguin body (main oval) - side view profile
        context.fillStyle = '#1A1A1A'; // Darker black
        context.beginPath();
        context.ellipse(0, 8, 16, 22, 0, 0, 2 * Math.PI); // Slightly wider for side view
        context.fill();
        
        // Add slight outline for definition
        context.strokeStyle = '#000000';
        context.lineWidth = 1;
        context.stroke();

        // White belly - just the front oval portion of the belly
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.ellipse(6, 12, 8, 14, 0, 0, 2 * Math.PI); // Smaller oval positioned at front
        context.fill();

        // Head - always facing forward in side view
        const headX = 4; // Positioned forward for side profile
        const headY = -12 + this.beakBob;
        
        context.fillStyle = '#1A1A1A';
        context.beginPath();
        context.ellipse(headX, headY, 12, 13, 0, 0, 2 * Math.PI);
        context.fill();

        // White face patch - side view (smaller, just around eye area)
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.ellipse(headX + 4, headY + 1, 6, 7, 0, 0, 2 * Math.PI);
        context.fill();

        // Eye - single eye visible in side view
        context.fillStyle = '#000000';
        const eyeY = headY - 2;
        const eyeX = headX + 6; // Forward position for side view
        
        context.beginPath();
        context.arc(eyeX, eyeY, 3, 0, 2 * Math.PI);
        context.fill();
        
        // Eye shine
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.arc(eyeX + 1, eyeY - 1, 1.2, 0, 2 * Math.PI);
        context.fill();

        // Orange beak - side profile
        context.fillStyle = '#FF8C00';
        context.beginPath();
        const beakX = headX + 12;
        const beakY = headY + 2;
        
        context.moveTo(beakX - 2, beakY - 3);
        context.lineTo(beakX + 6, beakY);
        context.lineTo(beakX - 2, beakY + 3);
        context.closePath();
        context.fill();
        
        // Beak highlight
        context.fillStyle = '#FFB84D';
        context.beginPath();
        context.moveTo(beakX - 1, beakY - 2);
        context.lineTo(beakX + 4, beakY);
        context.lineTo(beakX - 1, beakY + 1);
        context.closePath();
        context.fill();

        // Wing/Flipper - single wing visible in side view
        context.fillStyle = '#1A1A1A';
        const flipperX = -8;
        const flipperY = 4 + this.flipperFlap;
        
        context.save();
        context.translate(flipperX, flipperY);
        context.rotate(this.flipperFlap * 0.1);
        context.beginPath();
        context.ellipse(0, 0, 6, 16, Math.PI / 6, 0, 2 * Math.PI);
        context.fill();
        context.restore();

        // Orange feet - side view with walking animation
        context.fillStyle = '#FF8C00';
        const feetY = 26;
        
        // Back foot
        const backFootOffset = Math.sin(this.footStep) * 2;
        context.beginPath();
        context.ellipse(-4, feetY + backFootOffset, 7, 4, 0, 0, 2 * Math.PI);
        context.fill();
        
        // Front foot - slightly forward and opposite animation
        const frontFootOffset = -Math.sin(this.footStep) * 2;
        context.beginPath();
        context.ellipse(4, feetY + frontFootOffset, 7, 4, 0, 0, 2 * Math.PI);
        context.fill();
        
        // Feet highlights
        context.fillStyle = '#FFB84D';
        context.beginPath();
        context.ellipse(-4, feetY + backFootOffset - 1, 5, 2, 0, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.ellipse(4, feetY + frontFootOffset - 1, 5, 2, 0, 0, 2 * Math.PI);
        context.fill();

        // Tail - small rounded tail at the back
        context.fillStyle = '#1A1A1A';
        context.beginPath();
        context.ellipse(-14, 8, 3, 6, 0, 0, 2 * Math.PI);
        context.fill();

        context.restore(); // Restore context after flipping and rotation

        // Red bow tie - drawn LAST to ensure proper layering, positioned prominently forward on the neck
        const bowTieX = waddleX + (this.direction === 1 ? 12 : -12); // Even more forward position
        const bowTieY = centerY - 2 + this.beakBob * 0.3; // Higher on neck, subtle head bob follow
        
        // Save context for bow tie drawing
        context.save();
        context.translate(bowTieX, bowTieY);
        
        // Main bow tie body (red) - slightly larger and more prominent
        context.fillStyle = '#DC143C'; // Crimson red
        context.beginPath();
        // Left wing of bow tie
        context.moveTo(-7, -4);
        context.lineTo(-2, -2);
        context.lineTo(-2, 2);
        context.lineTo(-7, 4);
        context.closePath();
        context.fill();
        
        // Right wing of bow tie
        context.beginPath();
        context.moveTo(2, -2);
        context.lineTo(7, -4);
        context.lineTo(7, 4);
        context.lineTo(2, 2);
        context.closePath();
        context.fill();
        
        // Center knot of bow tie (darker red) - slightly larger
        context.fillStyle = '#B22222'; // Darker red
        context.fillRect(-2.5, -2.5, 5, 5);
        
        // Bow tie highlights for 3D effect
        context.fillStyle = '#FF6B6B'; // Light red highlight
        context.fillRect(-6, -3, 2, 1); // Left wing highlight
        context.fillRect(4, -3, 2, 1); // Right wing highlight
        context.fillRect(-1, -2, 2, 1); // Center highlight
        
        // Additional shadow for depth
        context.fillStyle = 'rgba(139, 0, 0, 0.3)'; // Dark red shadow
        context.fillRect(-6, 3, 3, 1); // Left wing shadow
        context.fillRect(3, 3, 3, 1); // Right wing shadow
        
        context.restore(); // Restore bow tie context

        // Breath effect - positioned correctly for side view
        if (this.breathTimer % 80 < 12) {
            // Calculate breath position based on actual direction
            const breathX = waddleX + (this.direction === 1 ? 20 : -20);
            const breathY = centerY - 8 + this.beakBob;
            
            // Multiple breath particles for more realistic effect
            for (let i = 0; i < 3; i++) {
                const offsetX = (Math.random() - 0.5) * 8 * this.direction;
                const offsetY = (Math.random() - 0.5) * 4;
                const size = 2 + Math.random() * 2;
                
                context.fillStyle = `rgba(255, 255, 255, ${0.6 - i * 0.2})`;
                context.beginPath();
                context.arc(breathX + offsetX, breathY + offsetY, size, 0, 2 * Math.PI);
                context.fill();
            }
        }
        
        // Add occasional snow flakes around penguin for cold effect
        if (this.animationTimer % 200 < 3) {
            for (let i = 0; i < 2; i++) {
                const snowX = waddleX + (Math.random() - 0.5) * 40;
                const snowY = centerY + (Math.random() - 0.5) * 60;
                
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.beginPath();
                context.arc(snowX, snowY, 1, 0, 2 * Math.PI);
                context.fill();
            }
        }
    }
}
