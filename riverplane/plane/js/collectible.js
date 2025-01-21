export class Collectible {
    constructor(x, y, type, segment) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'fuel' ? 20 : 15;
        this.height = this.width;
        this.segment = segment; // Add segment reference
    }

    update() {
        this.y += this.segment.game.scrollSpeed;
        // Fuel cells do not move left or right
        if (this.type !== 'fuel') {
            this.x += this.speed;
            // Keep within corridor bounds
            if (this.x < this.segment.leftWall || 
                this.x + this.width > this.segment.leftWall + this.segment.width) {
                this.speed *= -1;
                // Keep collectible within bounds after speed reversal
                if (this.x < this.segment.leftWall) {
                    this.x = this.segment.leftWall;
                } else if (this.x + this.width > this.segment.leftWall + this.segment.width) {
                    this.x = this.segment.leftWall + this.segment.width - this.width;
                }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.type === 'fuel' ? '#ff0' : '#f00'; // Yellow for fuel, red for points
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    collect(game) {
        if (this.type === 'fuel') {
            game.player.fuel = Math.min(100, game.player.fuel + 30);
            game.score += 50; // Add points for collecting fuel
        } else {
            game.score += 100;
        }
    }
}
