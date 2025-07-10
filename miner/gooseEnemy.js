class GooseEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 1.5; // Slightly slower than horizontal enemy
        this.bobOffset = 0; // For head bobbing animation
        this.neckExtension = 0; // For neck stretching animation
        this.wingFlap = 0; // For wing flapping animation
        this.honkTimer = 0; // For honking animation
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
        this.bobOffset += 0.15;
        this.neckExtension += 0.12;
        this.wingFlap += 0.18;
        this.honkTimer += 0.08;
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
        
        // Walking animation
        const walkCycle = (this.x / 3) % (Math.PI * 2);
        const headBob = Math.sin(this.bobOffset) * 1.5 * s;
        const neckStretch = Math.sin(this.neckExtension) * 2 * s;
        const wingFlapping = Math.sin(this.wingFlap) * 0.5;
        
        // Body (goose body - more oval and plump)
        context.fillStyle = '#E6E6E6'; // Light gray/white goose color
        context.fillRect(this.x + 4 * s, this.y + 18 * s, 8 * s, 10 * s); // Main body
        context.fillRect(this.x + 3 * s, this.y + 20 * s, 10 * s, 8 * s); // Wider belly
        
        // Darker gray patches on body
        context.fillStyle = '#D0D0D0';
        context.fillRect(this.x + 5 * s, this.y + 19 * s, 6 * s, 3 * s);
        context.fillRect(this.x + 4 * s, this.y + 23 * s, 8 * s, 2 * s);
        
        // Wings (flapping animation)
        context.fillStyle = '#C0C0C0';
        const wingY = this.y + 20 * s + wingFlapping * s;
        context.fillRect(this.x + 3 * s, wingY, 2 * s, 6 * s); // Left wing
        context.fillRect(this.x + 11 * s, wingY, 2 * s, 6 * s); // Right wing
        
        // Wing tips (darker)
        context.fillStyle = '#A0A0A0';
        context.fillRect(this.x + 3 * s, wingY + 4 * s, 2 * s, 2 * s);
        context.fillRect(this.x + 11 * s, wingY + 4 * s, 2 * s, 2 * s);
        
        // Tail feathers
        context.fillStyle = '#D0D0D0';
        context.fillRect(this.x + 1 * s, this.y + 22 * s, 3 * s, 4 * s);
        context.fillStyle = '#A0A0A0';
        context.fillRect(this.x + 1 * s, this.y + 24 * s, 3 * s, 1 * s);
        
        // Long neck (with stretching animation)
        const neckBaseY = this.y + 18 * s;
        const neckLength = 12 * s + neckStretch;
        const neckTopY = neckBaseY - neckLength;
        
        context.fillStyle = '#E6E6E6';
        context.fillRect(this.x + 7 * s, neckTopY, 3 * s, neckLength); // Main neck
        
        // Neck shading
        context.fillStyle = '#D0D0D0';
        context.fillRect(this.x + 7 * s, neckTopY + 2 * s, 1 * s, neckLength - 4 * s);
        
        // Head (with bobbing animation)
        const headY = neckTopY - 6 * s + headBob;
        context.fillStyle = '#E6E6E6';
        context.fillRect(this.x + 6 * s, headY, 5 * s, 6 * s); // Main head
        
        // Head shading
        context.fillStyle = '#D0D0D0';
        context.fillRect(this.x + 6 * s, headY + 1 * s, 2 * s, 4 * s);
        
        // Eyes (black beady eyes)
        context.fillStyle = '#000000';
        context.fillRect(this.x + 7 * s, headY + 1 * s, 1 * s, 1 * s);
        context.fillRect(this.x + 9 * s, headY + 1 * s, 1 * s, 1 * s);
        
        // Beak (orange/yellow duck/goose beak)
        context.fillStyle = '#FFA500';
        const beakY = headY + 2.5 * s;
        context.fillRect(this.x + 11 * s, beakY, 3 * s, 2 * s); // Upper beak
        context.fillRect(this.x + 11 * s, beakY + 1 * s, 3 * s, 2 * s); // Lower beak
        
        // Beak tip (darker)
        context.fillStyle = '#FF8C00';
        context.fillRect(this.x + 13 * s, beakY, 1 * s, 3 * s);
        
        // Nostrils
        context.fillStyle = '#000000';
        context.fillRect(this.x + 12 * s, beakY + 0.5 * s, 0.5 * s, 0.5 * s);
        
        // Occasional honking animation (open beak)
        if (Math.sin(this.honkTimer) > 0.8) {
            context.fillStyle = '#000000';
            context.fillRect(this.x + 11 * s, beakY + 1 * s, 2 * s, 1 * s); // Open beak
        }
        
        // Webbed feet (walking animation)
        const leftFootAngle = Math.sin(walkCycle) * 0.3;
        const rightFootAngle = Math.sin(walkCycle + Math.PI) * 0.3;
        
        context.fillStyle = '#FFA500'; // Orange webbed feet
        
        // Left foot
        const leftFootX = this.x + 5 * s + Math.sin(leftFootAngle) * 2 * s;
        const leftFootY = this.y + this.height - 2 * s;
        context.fillRect(leftFootX, leftFootY, 3 * s, 2 * s);
        // Webbed toes
        context.fillRect(leftFootX - 1 * s, leftFootY + 1 * s, 5 * s, 1 * s);
        
        // Right foot
        const rightFootX = this.x + 8 * s + Math.sin(rightFootAngle) * 2 * s;
        const rightFootY = this.y + this.height - 2 * s;
        context.fillRect(rightFootX, rightFootY, 3 * s, 2 * s);
        // Webbed toes
        context.fillRect(rightFootX - 1 * s, rightFootY + 1 * s, 5 * s, 1 * s);
        
        // Foot claws (black)
        context.fillStyle = '#000000';
        context.fillRect(leftFootX + 2 * s, leftFootY, 0.5 * s, 1 * s);
        context.fillRect(rightFootX + 2 * s, rightFootY, 0.5 * s, 1 * s);

        context.restore();
    }
}
