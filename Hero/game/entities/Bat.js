class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, '/');
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY + Math.sin(this.time * 3) * 5;
        
        // Draw wings
        const wingSpan = Math.sin(this.time * 10) * 10 + 20;
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 8);
        ctx.quadraticCurveTo(
            screenX + 16 + wingSpan, screenY,
            screenX + 16, screenY + 16
        );
        ctx.quadraticCurveTo(
            screenX + 16 - wingSpan, screenY,
            screenX + 16, screenY + 8
        );
        ctx.fill();

        // Draw body
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        ctx.ellipse(screenX + 16, screenY + 12, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw eyes
        const glowIntensity = Math.sin(this.time * 2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 0, 0, ${glowIntensity})`;
        ctx.beginPath();
        ctx.arc(screenX + 14, screenY + 10, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 18, screenY + 10, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.Bat = Bat;
