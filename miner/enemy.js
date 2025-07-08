class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type;
        this.direction = 1;
    }

    update() {
        if (this.type === 'H') { // Horizontal
            this.x += this.direction * 2;
        } else if (this.type === 'V') { // Vertical
            this.y += this.direction * 2;
        }

        // Simple boundary collision
        if (this.x > LEVEL_WIDTH * TILE_SIZE - TILE_SIZE || this.x < 0) {
            this.direction *= -1;
        }
    }

    draw(context) {
        context.fillStyle = 'red';
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}