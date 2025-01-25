export class Monster {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 0.1;
        this.direction = 'left';
        this.lastX = x;  // Add last position tracking like Player
        this.lastY = y;
        this.eyeOffsetStep = 0;  // For eye animation
        this.isVulnerable = false;
        this.vulnerableTime = 0;
        this.vulnerableDuration = 7000; // 7 seconds
        this.blinkStart = 5000; // Start blinking 2 seconds before ending
        this.points = 200; // Points for eating a vulnerable monster
        this.isRegenerating = false;
        this.regenerationTime = 3000; // 3 seconds to regenerate
        this.regenerateStart = 0;
        this.originalX = x;  // Store original position for regeneration
        this.originalY = y;
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

        // Update eye animation step
        this.eyeOffsetStep = (this.eyeOffsetStep + 1) % 120;  // Slower eye animation
    }

    changeDirection() {
        const directions = ['left', 'right', 'up', 'down'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    makeVulnerable() {
        this.isVulnerable = true;
        this.vulnerableTime = Date.now();
    }

    update() {
        if (this.isVulnerable) {
            const elapsed = Date.now() - this.vulnerableTime;
            if (elapsed > this.vulnerableDuration) {
                this.isVulnerable = false;
            }
        }
        
        if (this.isRegenerating) {
            const elapsed = Date.now() - this.regenerateStart;
            if (elapsed > this.regenerationTime) {
                this.isRegenerating = false;
            }
        }
    }

    startRegeneration() {
        this.isRegenerating = true;
        this.isVulnerable = false;
        this.regenerateStart = Date.now();
    }

    draw(ctx) {
        if (this.isRegenerating) {
            // Draw only eyes while regenerating
            this.drawEyes(ctx);
            return;
        }

        if (!this.isVulnerable) {
            // Main body with 3D effect
            const bodyGradient = ctx.createRadialGradient(
                this.x - this.radius * 0.3,
                this.y - this.radius * 0.3,
                0,
                this.x,
                this.y,
                this.radius
            );
            bodyGradient.addColorStop(0, '#ff0000');
            bodyGradient.addColorStop(0.7, '#cc0000');
            bodyGradient.addColorStop(1, '#990000');

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.fillStyle = bodyGradient;
            ctx.fill();
            
            // Eyes with animation
            const eyeRadius = this.radius * 0.2;
            const eyeOffsetX = this.radius * 0.3;
            const eyeOffsetY = -this.radius * 0.2;
            const eyeAnimationOffset = Math.sin(this.eyeOffsetStep / 20) * eyeRadius * 0.5;  // Slower eye animation
            
            // Left eye
            ctx.beginPath();
            ctx.arc(this.x - eyeOffsetX + eyeAnimationOffset, this.y + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x - eyeOffsetX + eyeAnimationOffset, this.y + eyeOffsetY, eyeRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();

            // Right eye
            ctx.beginPath();
            ctx.arc(this.x + eyeOffsetX + eyeAnimationOffset, this.y + eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + eyeOffsetX + eyeAnimationOffset, this.y + eyeOffsetY, eyeRadius * 0.5, 0, 2 * Math.PI);
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
        } else {
            // Draw vulnerable monster
            const elapsed = Date.now() - this.vulnerableTime;
            const isBlinking = elapsed > this.blinkStart && 
                             Math.floor(elapsed / 200) % 2 === 0; // Blink every 200ms

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            
            if (isBlinking) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = '#0000ff'; // Blue when vulnerable
            }
            ctx.fill();

            // Always draw eyes
            const eyeRadius = this.radius * 0.2;
            const eyeOffsetX = this.radius * 0.3;
            const eyeOffsetY = -this.radius * 0.2;

            // Left eye
            ctx.beginPath();
            ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();

            // Right eye
            ctx.beginPath();
            ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        }
    }

    drawEyes(ctx) {
        const eyeRadius = this.radius * 0.2;
        const eyeOffsetX = this.radius * 0.3;
        const eyeOffsetY = -this.radius * 0.2;

        // Left eye
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}