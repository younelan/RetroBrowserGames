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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    }
}