class SealEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 1.0; // Slower speed for sliding motion
        this.flipperWave = 0; // For flipper animation
        this.ballRotation = 0; // For slow ball rotation
        this.bodyWiggle = 0; // For body wiggling while moving
        this.noseWiggle = 0; // For subtle nose movement
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

        // Update animation timers
        this.flipperWave += 0.12;
        this.ballRotation += 0.02;
        this.bodyWiggle += 0.08;
        this.noseWiggle += 0.25;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        context.save();

        // Apply horizontal flip based on direction
        if (this.direction === -1) {
            context.translate(this.x + this.width, this.y);
            context.scale(-1, 1);
            context.translate(-(this.x + this.width), -this.y);
        }

        const s = this.width / 16;
        
        // Seal movement animation (sliding/wiggling motion)
        const walkCycle = (this.x / 6) % (Math.PI * 2);
        const bodyWiggling = Math.sin(this.bodyWiggle) * 0.8 * s;
        const noseWiggling = Math.sin(this.noseWiggle) * 0.3 * s;
        
        // Main seal body (streamlined, curved arch shape like real seals)
        const bodyBaseY = this.y + 20 * s; // Move body down so it touches ground like duck
        context.fillStyle = '#4A4A4A'; // Dark gray seal color
        
        // Create curved seal body using multiple overlapping rectangles for smooth arch
        // Bottom belly (widest part)
        context.fillRect(this.x + 3 * s + bodyWiggling, bodyBaseY + 8 * s, 10 * s, 4 * s);
        // Lower body arch
        context.fillRect(this.x + 2 * s + bodyWiggling, bodyBaseY + 4 * s, 12 * s, 8 * s);
        // Mid body (narrower)
        context.fillRect(this.x + 3 * s + bodyWiggling, bodyBaseY, 10 * s, 8 * s);
        // Upper body (even narrower)
        context.fillRect(this.x + 4 * s + bodyWiggling, bodyBaseY - 4 * s, 8 * s, 8 * s);
        // Neck area
        context.fillRect(this.x + 5 * s + bodyWiggling, bodyBaseY - 8 * s, 6 * s, 8 * s);
        
        // Body shading for 3D curved effect
        context.fillStyle = '#6A6A6A';
        // Top ridge of the arch
        context.fillRect(this.x + 4 * s + bodyWiggling, bodyBaseY - 2 * s, 8 * s, 4 * s);
        context.fillRect(this.x + 5 * s + bodyWiggling, bodyBaseY - 6 * s, 6 * s, 4 * s);
        // Side shading
        context.fillStyle = '#5A5A5A';
        context.fillRect(this.x + 3 * s + bodyWiggling, bodyBaseY + 2 * s, 2 * s, 8 * s);
        context.fillRect(this.x + 11 * s + bodyWiggling, bodyBaseY + 2 * s, 2 * s, 8 * s);
        
        // Rear flippers (back flippers) - at ground level, more fin-shaped
        context.fillStyle = '#3A3A3A';
        const flipperMove = Math.sin(this.flipperWave) * 1 * s;
        // Tail flippers (horizontal)
        context.fillRect(this.x + flipperMove, bodyBaseY + 6 * s, 4 * s, 3 * s);
        context.fillRect(this.x - flipperMove, bodyBaseY + 9 * s, 4 * s, 3 * s);
        // Make them more fin-shaped
        context.fillRect(this.x + 1 * s + flipperMove, bodyBaseY + 5 * s, 2 * s, 1 * s);
        context.fillRect(this.x + 1 * s - flipperMove, bodyBaseY + 12 * s, 2 * s, 1 * s);
        
        // Front flippers (side flippers) - more realistic positioning
        context.fillStyle = '#3A3A3A';
        const frontFlipperMove = Math.sin(this.flipperWave + Math.PI/2) * 1.5 * s;
        // Left flipper (angled)
        context.fillRect(this.x + 6 * s + bodyWiggling, bodyBaseY + 6 * s + frontFlipperMove, 3 * s, 4 * s);
        context.fillRect(this.x + 5 * s + bodyWiggling, bodyBaseY + 8 * s + frontFlipperMove, 2 * s, 2 * s);
        // Right flipper (angled)
        context.fillRect(this.x + 7 * s + bodyWiggling, bodyBaseY + 6 * s - frontFlipperMove, 3 * s, 4 * s);
        context.fillRect(this.x + 9 * s + bodyWiggling, bodyBaseY + 8 * s - frontFlipperMove, 2 * s, 2 * s);
        
        // Head with integrated upward-curving snout (45-degree angle) - positioned higher
        const headY = bodyBaseY - 18 * s; // Move head up so top aligns with bottom of ball
        context.fillStyle = '#4A4A4A';
        // Rounded head shape - back of head
        context.fillRect(this.x + 6 * s + bodyWiggling, headY, 6 * s, 8 * s);
        context.fillRect(this.x + 7 * s + bodyWiggling, headY - 1 * s, 4 * s, 10 * s);
        
        // Integrated snout curving upward at 45 degrees from eye level (shorter)
        context.fillStyle = '#4A4A4A'; // Same color as body for seamless integration
        const snoutBaseX = this.x + 10 * s + bodyWiggling;
        const snoutBaseY = headY + 1 * s; // At eye level
        
        // Shorter snout segments flowing at 45-degree angle upward and forward
        // Bottom segment (connects to head at eye level)
        context.fillRect(snoutBaseX, snoutBaseY, 3 * s, 2.5 * s);
        // Mid segment (angled upward)
        context.fillRect(snoutBaseX + 1.5 * s, snoutBaseY - 1.5 * s, 2 * s, 2.5 * s);
        // Top segment (connects to top of head)
        context.fillRect(snoutBaseX + 2.5 * s, snoutBaseY - 3 * s, 1.5 * s, 2 * s);
        // Connect top segment to the top of the head
        context.fillRect(this.x + 8 * s + bodyWiggling, headY - 1 * s, 4.5 * s, 2 * s);
        
        // Snout shading for 3D effect
        context.fillStyle = '#5A5A5A';
        context.fillRect(snoutBaseX + 1 * s, snoutBaseY - 0.5 * s, 1.5 * s, 1.5 * s);
        context.fillRect(snoutBaseX + 2 * s, snoutBaseY - 2 * s, 1.5 * s, 1.5 * s);
        
        // Nose tip (very dark, at the highest point of the curve)
        context.fillStyle = '#1A1A1A';
        context.fillRect(snoutBaseX + 2.8 * s + noseWiggling, snoutBaseY - 2.5 * s, 0.8 * s, 0.8 * s);
        
        // Eyes (large, expressive seal eyes - positioned on the back of the head)
        context.fillStyle = '#000000';
        context.fillRect(this.x + 7 * s + bodyWiggling, headY + 1 * s, 1.5 * s, 1.5 * s);
        context.fillRect(this.x + 8.5 * s + bodyWiggling, headY + 1 * s, 1.5 * s, 1.5 * s);
        
        // Eye highlights (more realistic)
        context.fillStyle = '#FFFFFF';
        context.fillRect(this.x + 7.5 * s + bodyWiggling, headY + 1.2 * s, 0.8 * s, 0.8 * s);
        context.fillRect(this.x + 9 * s + bodyWiggling, headY + 1.2 * s, 0.8 * s, 0.8 * s);
        
        // Whiskers (positioned on the sides of the shorter snout at eye level)
        context.fillStyle = '#2A2A2A';
        context.fillRect(this.x + 8 * s + bodyWiggling, snoutBaseY - 0.5 * s, 1.5 * s, 0.3 * s);
        context.fillRect(this.x + 8 * s + bodyWiggling, snoutBaseY + 1 * s, 1.5 * s, 0.3 * s);
        context.fillRect(this.x + 8.5 * s + bodyWiggling, snoutBaseY + 0.2 * s, 1.2 * s, 0.3 * s);
        
        // Beach ball on shorter upward-curving nose (positioned so bottom aligns with top of head)
        const ballCenterX = snoutBaseX + 3.5 * s;
        const ballCenterY = snoutBaseY - 7 * s; // Position ball so bottom aligns with top of head
        const ballRadius = 5 * s; // Much larger beach ball
        
        // Draw circular beach ball with radial segments
        context.save();
        context.translate(ballCenterX, ballCenterY);
        context.rotate(this.ballRotation); // Slow rotation
        
        // Draw beach ball segments (like a real beach ball)
        const numSegments = 6;
        const segmentAngle = (Math.PI * 2) / numSegments;
        
        // Beach ball colors (alternating)
        const colors = ['#FF4444', '#4444FF', '#FFFF44', '#44FF44', '#FF44FF', '#44FFFF'];
        
        for (let i = 0; i < numSegments; i++) {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            
            context.fillStyle = colors[i % colors.length];
            context.beginPath();
            context.moveTo(0, 0);
            context.arc(0, 0, ballRadius, startAngle, endAngle);
            context.closePath();
            context.fill();
        }
        
        // Ball outline (circle)
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(0, 0, ballRadius, 0, Math.PI * 2);
        context.stroke();
        
        // Ball highlight (curved highlight on sphere)
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.arc(-ballRadius * 0.3, -ballRadius * 0.3, ballRadius * 0.3, 0, Math.PI * 2);
        context.fill();
        
        // Inner highlight for more 3D effect
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.beginPath();
        context.arc(-ballRadius * 0.2, -ballRadius * 0.2, ballRadius * 0.15, 0, Math.PI * 2);
        context.fill();
        
        context.restore();

        context.restore();
    }
}
