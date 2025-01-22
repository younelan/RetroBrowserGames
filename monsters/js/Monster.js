export class Monster {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 0.1;
        this.direction = 'left';
        this.lastX = x;  // Add last position tracking like Player
        this.lastY = y;
    }

    move(deltaTime, cellSize) {
        this.lastX = this.x;
        this.lastY = this.y;
        
        let nextX = this.x;
        let nextY = this.y;

        if (this.direction === 'left') nextX -= this.speed * cellSize * deltaTime;
        if (this.direction === 'right') nextX += this.speed * cellSize * deltaTime;
        if (this.direction === 'up') nextY -= this.speed * cellSize * deltaTime;
        if (this.direction === 'down') nextY += this.speed * cellSize * deltaTime;

        this.x = nextX;
        this.y = nextY;
    }

    changeDirection() {
        const directions = ['left', 'right', 'up', 'down'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    draw(ctx) {
        // Main body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF0000';  // Bright red
        ctx.fill();
        
        // Eyes
        const eyeRadius = this.radius * 0.2;
        const eyeOffsetX = this.radius * 0.3;
        const eyeOffsetY = -this.radius * 0.2;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Angry mouth
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.radius * 0.2, this.radius * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = this.radius * 0.1;
        ctx.stroke();

        // Small fangs
        const fangSize = this.radius * 0.2;
        ctx.fillStyle = 'white';
        
        // Left fang
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius * 0.3, this.y + this.radius * 0.2);
        ctx.lineTo(this.x - this.radius * 0.2, this.y + this.radius * 0.4);
        ctx.lineTo(this.x - this.radius * 0.1, this.y + this.radius * 0.2);
        ctx.fill();
        
        // Right fang
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius * 0.3, this.y + this.radius * 0.2);
        ctx.lineTo(this.x + this.radius * 0.2, this.y + this.radius * 0.4);
        ctx.lineTo(this.x + this.radius * 0.1, this.y + this.radius * 0.2);
        ctx.fill();
    }
}