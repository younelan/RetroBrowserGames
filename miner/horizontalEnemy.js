class HorizontalEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 2;
    }

    update(level) {
        const nextX = this.x + this.direction * this.speed;
        const enemyLeadingEdgeX = (this.direction === 1) ? (nextX + this.width) : nextX;
        const lookAheadTileX = Math.floor(enemyLeadingEdgeX / TILE_SIZE);
        const tileBelowFeetY = Math.floor((this.y + this.height) / TILE_SIZE);

        let nextStepHasPlatformBelow = false;

        // Check if lookAheadTileX is within map bounds
        if (lookAheadTileX >= 0 && lookAheadTileX < LEVEL_WIDTH && tileBelowFeetY >= 0 && tileBelowFeetY < level.map.trim().split('\n').length) {
            const mapRows = level.map.trim().split('\n');
            const charBelow = mapRows[tileBelowFeetY][lookAheadTileX];
            const tileAttribute = TILE_ATTRIBUTES[charBelow];
            if (tileAttribute && tileAttribute.isPlatform) {
                nextStepHasPlatformBelow = true;
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

        level.platforms.forEach(checkWallCollision);
        level.brickFloors.forEach(checkWallCollision);
        level.movingLeftFloors.forEach(checkWallCollision);
        level.movingRightFloors.forEach(checkWallCollision);
        level.crumblingPlatforms.forEach(checkWallCollision);

        // Check for world bounds
        const atWorldEdge = (nextX < 0 || nextX + this.width > LEVEL_WIDTH * TILE_SIZE);

        // Turn around if no platform below, about to hit a wall, or at world edge
        if (!nextStepHasPlatformBelow || isAboutToHitWall || atWorldEdge) {
            this.direction *= -1;
        } else {
            this.x = nextX;
        }
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
        
        // Walking animation - proper leg rotation
        const walkCycle = (this.x / 4) % (Math.PI * 2); // Complete walk cycle
        
        // Calculate leg angles for walking gait
        const frontLegAngle = Math.sin(walkCycle) * 0.5; // Front leg swings
        const backLegAngle = Math.sin(walkCycle + Math.PI) * 0.5; // Back leg opposite phase
        const midLegAngle = Math.sin(walkCycle + Math.PI/2) * 0.3; // Middle legs slightly different

        // Spider-like creature - proper side view
        // Main body
        context.fillStyle = '#2d4a2b'; // Dark green
        context.fillRect(this.x + 4 * s, this.y + 6 * s, 8 * s, 10 * s); // Main abdomen
        context.fillRect(this.x + 6 * s, this.y + 4 * s, 6 * s, 6 * s); // Thorax
        
        // Monster Head (larger and more distinctive)
        context.fillStyle = '#1a2e19'; // Darker green
        context.fillRect(this.x + 11 * s, this.y + 3 * s, 6 * s, 8 * s); // Main head
        context.fillRect(this.x + 13 * s, this.y + 1 * s, 4 * s, 4 * s); // Upper skull
        
        // Horn/spikes on head
        context.fillStyle = '#0f1a0e'; // Very dark green
        context.fillRect(this.x + 14 * s, this.y, 2 * s, 3 * s); // Center horn
        context.fillRect(this.x + 12 * s, this.y + 1 * s, 1 * s, 2 * s); // Left spike
        context.fillRect(this.x + 16 * s, this.y + 1 * s, 1 * s, 2 * s); // Right spike
        
        // Large glowing eyes (more prominent)
        context.fillStyle = '#ff0000'; // Bright red glowing eyes
        context.fillRect(this.x + 14 * s, this.y + 4 * s, 2 * s, 2 * s); // Left eye
        context.fillRect(this.x + 14 * s, this.y + 7 * s, 2 * s, 2 * s); // Right eye
        
        // Eye pupils (animated)
        const eyeFlicker = Math.sin(walkCycle * 3) > 0.7;
        if (!eyeFlicker) {
            context.fillStyle = '#660000'; // Dark red pupils
            context.fillRect(this.x + 15 * s, this.y + 5 * s, 1 * s, 1 * s);
            context.fillRect(this.x + 15 * s, this.y + 8 * s, 1 * s, 1 * s);
        }
        
        // Mouth/jaw
        context.fillStyle = '#0f1a0e';
        context.fillRect(this.x + 12 * s, this.y + 9 * s, 4 * s, 2 * s); // Jaw
        
        // Sharp teeth/mandibles
        context.fillStyle = '#fff';
        context.fillRect(this.x + 17 * s, this.y + 8 * s, 2 * s, 1 * s); // Upper fang
        context.fillRect(this.x + 17 * s, this.y + 10 * s, 2 * s, 1 * s); // Lower fang
        context.fillRect(this.x + 16 * s, this.y + 9 * s, 1 * s, 2 * s); // Side tooth
        
        // Draw walking legs with proper rotation
        context.fillStyle = '#2d4a2b';
        
        // Hip points (fixed attachment points)
        const frontHipX = this.x + 6 * s;
        const frontHipY = this.y + 12 * s;
        const midHipX = this.x + 8 * s;
        const midHipY = this.y + 13 * s;
        const backHipX = this.x + 10 * s;
        const backHipY = this.y + 12 * s;
        
        const legLength = 12 * s;
        
        // Front leg (upper)
        const frontUpperLegEndX = frontHipX + Math.sin(frontLegAngle) * (legLength * 0.6);
        const frontUpperLegEndY = frontHipY + Math.cos(frontLegAngle) * (legLength * 0.6);
        this.drawLeg(context, frontHipX, frontHipY, frontUpperLegEndX, frontUpperLegEndY, 2 * s);
        
        // Front leg (lower) - extends to ground
        const frontFootX = frontUpperLegEndX + Math.sin(frontLegAngle + 0.5) * (legLength * 0.6);
        const frontFootY = this.y + this.height - 2 * s; // Touch ground
        this.drawLeg(context, frontUpperLegEndX, frontUpperLegEndY, frontFootX, frontFootY, 1 * s);
        
        // Back leg (upper)
        const backUpperLegEndX = backHipX + Math.sin(backLegAngle) * (legLength * 0.6);
        const backUpperLegEndY = backHipY + Math.cos(backLegAngle) * (legLength * 0.6);
        this.drawLeg(context, backHipX, backHipY, backUpperLegEndX, backUpperLegEndY, 2 * s);
        
        // Back leg (lower) - extends to ground
        const backFootX = backUpperLegEndX + Math.sin(backLegAngle + 0.5) * (legLength * 0.6);
        const backFootY = this.y + this.height - 2 * s; // Touch ground
        this.drawLeg(context, backUpperLegEndX, backUpperLegEndY, backFootX, backFootY, 1 * s);
        
        // Middle legs (simpler, for stability)
        const midFootX = midHipX + Math.sin(midLegAngle) * (legLength * 0.8);
        const midFootY = this.y + this.height - 2 * s;
        this.drawLeg(context, midHipX, midHipY, midFootX, midFootY, 1.5 * s);

        context.restore();
    }

    // Helper method to draw a leg segment
    drawLeg(context, startX, startY, endX, endY, thickness) {
        context.save();
        context.lineWidth = thickness;
        context.strokeStyle = '#2d4a2b';
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
        context.restore();
    }
}
