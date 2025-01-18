export class Enemy {
    constructor(x, y, segment) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = (Math.random() - 0.5) * 4;
        this.segment = segment;
    }

    update() {
        this.y += this.segment.game.scrollSpeed;
        this.x += this.speed;
        
        // Keep within corridor bounds
        if (this.x < this.segment.leftWall || 
            this.x + this.width > this.segment.leftWall + this.segment.width) {
            this.speed *= -1;
            // Keep enemy within bounds after speed reversal
            if (this.x < this.segment.leftWall) {
                this.x = this.segment.leftWall;
            } else if (this.x + this.width > this.segment.leftWall + this.segment.width) {
                this.x = this.segment.leftWall + this.segment.width - this.width;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
}
