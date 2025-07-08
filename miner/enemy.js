class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type;
        this.direction = 1;
        if (this.type === 'C') {
            this.pathState = 'horizontal'; // 'horizontal' or 'vertical'
            this.pathCounter = 0;
            this.pathLimit = 60; // Number of frames to move in one direction
        }
    }

    update() {
        if (this.type === 'H') { // Horizontal
            this.x += this.direction * 2;
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

        // Simple boundary collision
        if (this.x > LEVEL_WIDTH * TILE_SIZE - TILE_SIZE || this.x < 0) {
            this.direction *= -1;
        }
        // Simple boundary collision for vertical movement
        if (this.y > (LEVEL_HEIGHT - UI_HEIGHT_TILES) * TILE_SIZE - TILE_SIZE || this.y < 0) {
            this.direction *= -1;
        }
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