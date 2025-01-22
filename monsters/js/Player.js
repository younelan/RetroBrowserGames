export class Player {
    constructor() {
        this.x = 75;
        this.y = 75;
        this.radius = 12;
        this.speed = 0.1;
        this.direction = 'right';
        this.lastX = this.x;  // Add these for collision handling
        this.lastY = this.y;
    }

    move(deltaTime, cellSize) {
        this.lastX = this.x;  // Store last position
        this.lastY = this.y;

        let nextX = this.x;
        let nextY = this.y;

        if (this.direction === 'right') nextX += this.speed * cellSize * deltaTime;
        if (this.direction === 'left') nextX -= this.speed * cellSize * deltaTime;
        if (this.direction === 'up') nextY -= this.speed * cellSize * deltaTime;
        if (this.direction === 'down') nextY += this.speed * cellSize * deltaTime;

        this.x = nextX;
        this.y = nextY;
    }

    draw(ctx) {
        let startAngle, endAngle;

        switch (this.direction) {
            case 'right':
                startAngle = 0.2 * Math.PI;
                endAngle = 1.8 * Math.PI;
                break;
            case 'left':
                startAngle = 1.2 * Math.PI;
                endAngle = 0.8 * Math.PI;
                break;
            case 'up':
                startAngle = 1.7 * Math.PI;
                endAngle = 1.3 * Math.PI;
                break;
            case 'down':
                startAngle = 0.7 * Math.PI;
                endAngle = 0.3 * Math.PI;
                break;
            default:
                startAngle = 0.2 * Math.PI;
                endAngle = 1.8 * Math.PI;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, startAngle, endAngle);
        ctx.lineTo(this.x, this.y);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
    }
}
