export class Enemy {
    constructor(x, y, segment) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        // Adjust speed range to be more consistent
        const minSpeed = segment.game.corridorManager.stepSize * 2;
        const maxSpeed = segment.game.corridorManager.stepSize * 4;
        this.speed = (Math.random() * (maxSpeed - minSpeed) + minSpeed) * (Math.random() < 0.5 ? 1 : -1);
        this.segment = segment;
    }

    update(dt) {
        if (!dt) return;
        
        // Move with corridor
        this.y += this.segment.game.scrollSpeed * dt;
        
        // Horizontal movement with speed limiting
        const maxDelta = this.segment.width * dt; // Max movement per frame
        const movement = Math.min(Math.abs(this.speed * dt), maxDelta) * Math.sign(this.speed);
        this.x += movement;
        
        // Bounce off walls with dampening
        if (this.x < this.segment.leftWall || 
            this.x + this.width > this.segment.leftWall + this.segment.width) {
            this.speed *= -0.8; // Reduce speed slightly on bounce
            if (this.x < this.segment.leftWall) {
                this.x = this.segment.leftWall;
            } else {
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
