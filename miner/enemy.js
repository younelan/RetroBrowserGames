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
            const nextX = this.x + this.direction * 2;
            const nextFeetRect = { x: nextX, y: this.y + this.height - 1, width: this.width, height: 1 }; // 1-pixel high strip at the bottom

            let nextStepHasPlatformBelow = false;
            const checkPlatformBelow = (p) => {
                // Check if the platform is directly below the enemy's next horizontal position
                if (nextX < p.x + p.width &&
                    nextX + this.width > p.x &&
                    this.y + this.height < p.y + p.height && // Enemy's bottom is above platform's bottom
                    this.y + this.height >= p.y) { // Enemy's bottom is at or below platform's top
                    nextStepHasPlatformBelow = true;
                }
            };

            level.platforms.forEach(checkPlatformBelow);
            level.brickFloors.forEach(checkPlatformBelow);
            level.movingLeftFloors.forEach(checkPlatformBelow);
            level.movingRightFloors.forEach(checkPlatformBelow);

            // Check for edge of platform (no platform below) or world bounds
            if (!nextStepHasPlatformBelow || nextX < 0 || nextX + this.width > LEVEL_WIDTH * TILE_SIZE) {
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
            case 'V': // Vertical Enemy (e.g., Slime)
                context.fillStyle = '#00FF00'; // Green slime
                context.beginPath();
                context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
                context.fill();
                // Drip effect
                context.fillRect(this.x + this.width / 2 - 2 * s, this.y + this.height - 4 * s, 4 * s, 4 * s);
                break;
            case 'C': // Complex Enemy (e.g., Robot)
                context.fillStyle = '#888'; // Light grey robot body
                context.fillRect(this.x, this.y, this.width, this.height);
                // Head
                context.fillStyle = '#666';
                context.fillRect(this.x + 4 * s, this.y - 4 * s, 8 * s, 4 * s);
                // Antenna
                context.fillStyle = 'red';
                context.fillRect(this.x + 7 * s, this.y - 8 * s, 2 * s, 4 * s);
                break;
            default: // Fallback for unknown types
                context.fillStyle = 'red';
                context.fillRect(this.x, this.y, this.width, this.height);
                break;
        }
    }
}