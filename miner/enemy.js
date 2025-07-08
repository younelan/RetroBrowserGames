class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.type = type;
        this.direction = 1;
        if (this.type === 'C') {
            this.pathState = 'horizontal'; // 'horizontal' or 'vertical'
            this.pathCounter = 0;
            this.pathLimit = 60; // Number of frames to move in one direction
        }
    }

    update(level) {
        if (this.type === 'H') { // Horizontal
            const nextX = this.x + this.direction * 2; // Where enemy will be
            const enemyLeadingEdgeX = (this.direction === 1) ? (nextX + this.width) : nextX; // Leading edge of enemy
            const lookAheadTileX = Math.floor(enemyLeadingEdgeX / TILE_SIZE); // Tile X of the leading edge
            const tileBelowFeetY = Math.floor((this.y + this.height) / TILE_SIZE); // Tile Y directly below enemy feet

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
            level.crumblingPlatforms.forEach(checkWallCollision); // Crumbling platforms are also solid walls

            // Check for world bounds
            const atWorldEdge = (nextX < 0 || nextX + this.width > LEVEL_WIDTH * TILE_SIZE);

            // Turn around if no platform below, about to hit a wall, or at world edge
            if (!nextStepHasPlatformBelow || isAboutToHitWall || atWorldEdge) {
                this.direction *= -1;
            } else {
                this.x = nextX;
            }
        } else if (this.type === 'V') { // Vertical
            this.y += this.direction * 2;
        } else if (this.type === 'C') { // Complex
            if (this.pathState === 'horizontal') {
                this.x += this.direction * 2;
            } else { // vertical
                this.y += this.direction * 2;
            }
            this.pathCounter++;
            if (this.pathCounter >= this.pathLimit) {
                this.pathCounter = 0;
                this.direction *= -1; // Reverse direction
                this.pathState = (this.pathState === 'horizontal') ? 'vertical' : 'horizontal'; // Switch path state
            }
        }

        // Simple boundary collision for vertical movement (for V and C types)
        if (this.type === 'V' || this.type === 'C') {
            if (this.y < 0 || this.y + this.height > (LEVEL_HEIGHT - UI_HEIGHT_TILES) * TILE_SIZE) {
                this.direction *= -1;
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        context.save(); // Save current context state

        // Apply horizontal flip based on direction
        if (this.direction === -1) { // Facing left
            context.translate(this.x + this.width, this.y); // Translate to top-right of bounding box
            context.scale(-1, 1);
            context.translate(-(this.x + this.width), -this.y); // Translate back
        }

        const s = this.width / 16; // Scale factor for drawing details

        switch (this.type) {
            case 'H': // Horizontal Enemy (e.g., Spider/Penguin)
                context.fillStyle = '#555'; // Dark grey
                context.fillRect(this.x, this.y, this.width, this.height);
                // Simple eyes
                context.fillStyle = 'white';
                context.fillRect(this.x + 4 * s, this.y + 4 * s, 3 * s, 3 * s);
                context.fillRect(this.x + 9 * s, this.y + 4 * s, 3 * s, 3 * s);
                context.fillStyle = 'black';
                context.fillRect(this.x + 5 * s, this.y + 5 * s, 1 * s, 1 * s);
                context.fillRect(this.x + 10 * s, this.y + 5 * s, 1 * s, 1 * s);
                break;
            case 'V': // Vertical Enemy (e.g., Slime) - 2 cells high, remains circular
                context.fillStyle = '#00FF00'; // Green slime
                context.beginPath();
                context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
                context.fill();
                // Drip effect (adjusted for 2 cells high)
                context.fillRect(this.x + this.width / 2 - 2 * s, this.y + this.height - 4 * s, 4 * s, 4 * s);
                break;
            case 'C': // Complex Enemy (Robot) - Side view with treads
                context.fillStyle = '#888'; // Light grey robot body
                context.fillRect(this.x + 2 * s, this.y + 2 * s, 12 * s, 10 * s); // Main body (2 cells high)

                // Head/Top
                context.fillStyle = '#666';
                context.fillRect(this.x + 4 * s, this.y - 2 * s, 8 * s, 4 * s);

                // Treads (simple animation)
                context.fillStyle = '#444'; // Dark grey treads
                const treadOffset = (Math.floor(this.x / 4) % 4) * s; // Animate treads
                context.fillRect(this.x + 2 * s, this.y + 12 * s, 12 * s, 4 * s); // Tread base
                context.fillStyle = '#222';
                context.fillRect(this.x + 2 * s + treadOffset, this.y + 12 * s, 2 * s, 4 * s);
                context.fillRect(this.x + 6 * s + treadOffset, this.y + 12 * s, 2 * s, 4 * s);
                context.fillRect(this.x + 10 * s + treadOffset, this.y + 12 * s, 2 * s, 4 * s);
                break;
            default: // Fallback for unknown types
                context.fillStyle = 'red';
                context.fillRect(this.x, this.y, this.width, this.height);
                break;
        }

        context.restore(); // Restore context to original state
    }
}