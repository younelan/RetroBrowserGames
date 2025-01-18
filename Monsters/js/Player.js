export class Player {
    constructor() {
        this.x = 75;
        this.y = 75;
        this.radius = 12;
        this.speed = 0.1;
        this.direction = 'right';
        this.lastX = this.x;  // Add these for collision handling
        this.lastY = this.y;
        this.mouthOpen = true;  // For animation
        this.animationStep = 0;  // For smoother animation
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

        // Update animation step for smoother movement
        this.animationStep = (this.animationStep + 1) % 60;  // Slower animation
        this.mouthOpen = this.animationStep < 30;
    }

    draw(ctx) {
        // Determine rotation angle based on direction
        let rotation = 0;
        switch(this.direction) {
            case 'right': rotation = 0; break;
            case 'down': rotation = Math.PI / 2; break;
            case 'left': rotation = Math.PI; break;
            case 'up': rotation = -Math.PI / 2; break;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(rotation);
        ctx.translate(-this.x, -this.y);

        // Draw shadow for 3D effect
        const shadowGradient = ctx.createRadialGradient(
            this.x + this.radius * 0.2,
            this.y + this.radius * 0.2,
            0,
            this.x + this.radius * 0.2,
            this.y + this.radius * 0.2,
            this.radius * 1.2
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(this.x + this.radius * 0.2, this.y + this.radius * 0.2, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = shadowGradient;
        ctx.fill();

        // Draw main body with enhanced 3D effect
        const bodyGradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        bodyGradient.addColorStop(0, '#ffff00');
        bodyGradient.addColorStop(0.7, '#ffcc00');
        bodyGradient.addColorStop(1, '#ff9900');

        // Draw body shape
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        ctx.closePath();

        // Draw mouth
        if (this.mouthOpen) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, 2.3 * Math.PI, false);
            ctx.lineTo(this.x, this.y);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
        }

        // Eyes (will automatically be rotated with the body)
        const eyeOffset = this.radius * 0.3;
        let eyeX = this.x + eyeOffset;
        let eyeY = this.y - eyeOffset;

        if (this.direction === 'left') {
            eyeX = this.x - eyeOffset;
            eyeY = this.y + eyeOffset;
        }

        ctx.beginPath();
        ctx.arc(eyeX, eyeY, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        ctx.restore();
    }
}
