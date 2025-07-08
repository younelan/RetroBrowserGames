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
        context.fillStyle = 'red';
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}