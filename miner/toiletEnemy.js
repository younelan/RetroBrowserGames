class ToiletEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 1.5;
        this.animationTimer = 0;
        this.seatAnimation = 0; // For toilet seat opening/closing like Pac-Man
        this.flushAnimation = 0; // For water swirl effect
    }

    update(level) {
        const nextX = this.x + this.direction * this.speed;
        const enemyLeadingEdgeX = (this.direction === 1) ? (nextX + this.width) : nextX;
        const lookAheadTileX = Math.floor(enemyLeadingEdgeX / TILE_SIZE);
        const tileBelowFeetY = Math.floor((this.y + this.height) / TILE_SIZE);

        let nextStepHasPlatformBelow = false;
        const probeX = this.direction === 1 ? nextX + this.width - 1 : nextX;
        const probeY = this.y + this.height + 1;

        const probeRect = {
            x: probeX,
            y: probeY,
            width: 1,
            height: 1
        };

        for (const platform of level.allPlatforms) {
            if (this.checkCollision(probeRect, platform)) {
                nextStepHasPlatformBelow = true;
                break;
            }
        }

        // Check for wall collision
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

        // Update animations
        this.animationTimer++;
        
        // Toilet seat animation - opens and closes like Pac-Man
        this.seatAnimation = Math.sin(this.animationTimer * 0.1) * 0.5 + 0.5; // Slower and smoother animation
        
        // Flush animation for water swirl
        this.flushAnimation = this.animationTimer * 0.2;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        const { x, y, width, height } = this; // width=32, height=64

        context.save();
        context.translate(x, y);

        if (this.direction === -1) {
            context.scale(-1, 1);
            context.translate(-width, 0);
        }

        // Define colors
        const porcelain = '#FFFFFF';
        const outline = '#000000';

        // Set drawing styles
        context.strokeStyle = outline;
        context.lineWidth = 2;
        context.fillStyle = porcelain;

        // --- Main Toilet Shape (as a single path, excluding lid) ---
        context.beginPath();

        // Start at the top-back of the tank body
        context.moveTo(0, 4);
        // Top of the tank body
        context.lineTo(14, 4);
        // Down the front of the tank
        context.lineTo(14, 34);

        // The top of the bowl (flat)
        context.lineTo(width, 34);

        // The front and bottom of the bowl/base, including the pipe
        context.bezierCurveTo(width, 50, 24, 50, 24, 54);
        context.lineTo(24, height - 2); // Right side of the pipe
        context.lineTo(8, height - 2); // Bottom of the pipe (wider)
        context.lineTo(8, 54);        // Left side of the pipe (wider)
        context.bezierCurveTo(16, 50, 0, 50, 0, 34); // Curve to the back

        // Close the shape
        context.closePath();

        context.fill();
        context.stroke();

        // --- Tank Lid (drawn separately) ---
        context.beginPath();
        context.rect(-2, -2, 20, 6); // Lid dimensions
        context.fill();
        context.stroke();

        // --- Flush Button (smooth and metallic) ---
        context.fillStyle = '#C0C0C0'; // Metallic silver
        context.strokeStyle = '#888888'; // Darker gray outline
        context.lineWidth = 1; // Thinner outline for the button
        context.beginPath();
        context.arc(7, 10, 3, 0, Math.PI * 2); // Centered at (7, 10) with radius 3
        context.fill();
        context.stroke(); // Draw the outline

        // --- Toilet Seat ---
        context.fillStyle = porcelain;
        context.strokeStyle = outline;
        context.lineWidth = 1.5;
        context.beginPath();
        // Rectangular seat, extending 2 pixels beyond the bowl front
        context.rect(14, 32, width - 12 + 2, 4); // x, y, width, height
        context.fill();
        context.stroke();

        // --- Toilet Lid (on top of the seat, animated) ---
        context.save();
        context.translate(14, 30); // Pivot point at the back-left of the lid
        const angle = -this.seatAnimation * (Math.PI / 4); // Animate from 0 to -45 degrees (downwards)
        context.rotate(angle);

        context.fillStyle = porcelain;
        context.strokeStyle = outline;
        context.lineWidth = 1.5;
        context.beginPath();
        // Draw the lid as a rectangle, starting from the pivot point
        context.rect(0, 0, width - 12 + 2, 3); // x, y, width, height (thinner)
        context.fill();
        context.stroke();
        context.restore();

        context.restore();
    }
}
