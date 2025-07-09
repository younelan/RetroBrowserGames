class SpiderEnemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'static' or 'moving'
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.direction = 1; // Moving direction (1 for down, -1 for up)
        this.threadLength = TILE_SIZE * 2; // Max thread length for moving spider
        this.threadRetracting = false; // Whether the thread is retracting
    }

    update(level) {
        if (this.type === 'moving') {
            if (this.threadRetracting) {
                this.y -= 1;
                if (this.y <= level.playerStart.y) {
                    this.threadRetracting = false;
                }
            } else {
                this.y += 1;
                if (this.y >= level.playerStart.y + this.threadLength) {
                    this.threadRetracting = true;
                }
            }
        }
    }

    draw(context) {
        context.fillStyle = 'black';
        context.fillRect(this.x, this.y, this.width, this.height);

        if (this.type === 'moving') {
            // Draw thread
            context.strokeStyle = 'gray';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(this.x + this.width / 2, this.y);
            context.lineTo(this.x + this.width / 2, this.y - this.threadLength);
            context.stroke();
        }
    }

    checkCollision(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}
