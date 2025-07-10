class BigFoot {
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

        // Bigfoot/Sasquatch creature - humanoid side view
        // Main body (upright torso)
        context.fillStyle = '#2d1810'; // Dark brown fur
        context.fillRect(this.x + 6 * s, this.y + 8 * s, 6 * s, 12 * s); // Torso
        context.fillRect(this.x + 5 * s, this.y + 6 * s, 8 * s, 4 * s); // Chest/shoulders
        
        // Arms (hanging down, swaying with walk)
        context.fillStyle = '#1f0f08'; // Darker brown
        const armSwing = Math.sin(walkCycle) * 0.3; // Arms swing opposite to legs
        // Left arm
        context.fillRect(this.x + 4 * s + armSwing * 2 * s, this.y + 8 * s, 3 * s, 10 * s);
        context.fillRect(this.x + 3 * s + armSwing * 3 * s, this.y + 18 * s, 3 * s, 6 * s); // Forearm
        // Right arm  
        context.fillRect(this.x + 11 * s - armSwing * 2 * s, this.y + 8 * s, 3 * s, 10 * s);
        context.fillRect(this.x + 12 * s - armSwing * 3 * s, this.y + 18 * s, 3 * s, 6 * s); // Forearm
        
        // Large hands
        context.fillStyle = '#0f0805';
        context.fillRect(this.x + 2 * s + armSwing * 3 * s, this.y + 23 * s, 4 * s, 3 * s); // Left hand
        context.fillRect(this.x + 12 * s - armSwing * 3 * s, this.y + 23 * s, 4 * s, 3 * s); // Right hand
        
        // Monster Head (large and primitive)
        context.fillStyle = '#2d1810'; // Dark brown fur
        context.fillRect(this.x + 5 * s, this.y + 2 * s, 8 * s, 6 * s); // Main head
        context.fillRect(this.x + 6 * s, this.y, 6 * s, 4 * s); // Skull/forehead
        
        // Pronounced brow ridge
        context.fillStyle = '#1f0f08';
        context.fillRect(this.x + 6 * s, this.y + 3 * s, 6 * s, 2 * s);
        
        // Glowing red eyes (deep set under brow)
        context.fillStyle = '#ff2222';
        context.fillRect(this.x + 7 * s, this.y + 4 * s, 2 * s, 1 * s);
        context.fillRect(this.x + 10 * s, this.y + 4 * s, 2 * s, 1 * s);
        
        // Eye glow effect
        const eyeFlicker = Math.sin(walkCycle * 2) > 0.5;
        if (eyeFlicker) {
            context.fillStyle = '#ff6666';
            context.fillRect(this.x + 6 * s, this.y + 4 * s, 4 * s, 1 * s);
            context.fillRect(this.x + 9 * s, this.y + 4 * s, 4 * s, 1 * s);
        }
        
        // Large nostrils
        context.fillStyle = '#0f0805';
        context.fillRect(this.x + 8 * s, this.y + 5 * s, 1 * s, 1 * s);
        context.fillRect(this.x + 10 * s, this.y + 5 * s, 1 * s, 1 * s);
        
        // Mouth with fangs
        context.fillStyle = '#0f0805';
        context.fillRect(this.x + 7 * s, this.y + 6 * s, 4 * s, 2 * s);
        context.fillStyle = '#ffffff';
        context.fillRect(this.x + 8 * s, this.y + 6 * s, 1 * s, 2 * s); // Left fang
        context.fillRect(this.x + 10 * s, this.y + 6 * s, 1 * s, 2 * s); // Right fang
        
        // Humanoid walking legs (bipedal)
        context.fillStyle = '#2d1810';
        
        // Hip area
        const hipX = this.x + 8 * s;
        const hipY = this.y + 20 * s;
        
        // Calculate leg positions for walking
        const leftLegAngle = Math.sin(walkCycle) * 0.4; // Left leg forward/back
        const rightLegAngle = Math.sin(walkCycle + Math.PI) * 0.4; // Right leg opposite
        
        const thighLength = 8 * s;
        const shinLength = 8 * s;
        
        // Left leg
        const leftKneeX = hipX - 2 * s + Math.sin(leftLegAngle) * thighLength;
        const leftKneeY = hipY + Math.cos(leftLegAngle) * thighLength;
        const leftFootX = leftKneeX + Math.sin(leftLegAngle + 0.3) * shinLength;
        const leftFootY = this.y + this.height - 2 * s; // Ground level
        
        // Draw left leg
        this.drawLeg(context, hipX - 2 * s, hipY, leftKneeX, leftKneeY, 3 * s); // Thigh
        this.drawLeg(context, leftKneeX, leftKneeY, leftFootX, leftFootY, 2 * s); // Shin
        
        // Right leg  
        const rightKneeX = hipX + 2 * s + Math.sin(rightLegAngle) * thighLength;
        const rightKneeY = hipY + Math.cos(rightLegAngle) * thighLength;
        const rightFootX = rightKneeX + Math.sin(rightLegAngle + 0.3) * shinLength;
        const rightFootY = this.y + this.height - 2 * s; // Ground level
        
        // Draw right leg
        this.drawLeg(context, hipX + 2 * s, hipY, rightKneeX, rightKneeY, 3 * s); // Thigh
        this.drawLeg(context, rightKneeX, rightKneeY, rightFootX, rightFootY, 2 * s); // Shin
        
        // Large feet
        context.fillStyle = '#0f0805';
        context.fillRect(leftFootX - 2 * s, leftFootY, 5 * s, 2 * s); // Left foot
        context.fillRect(rightFootX - 2 * s, rightFootY, 5 * s, 2 * s); // Right foot

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
