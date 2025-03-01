class Moth extends Enemy {
    constructor(x, y) {
        super(x, y, '_');
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY + Math.sin(this.time * 2) * 8;
        
        // Draw wings with flutter effect
        const wingSpan = Math.sin(this.time * 15) * 8 + 16;
        const wingGradient = ctx.createLinearGradient(
            screenX, screenY,
            screenX + 32, screenY
        );
        wingGradient.addColorStop(0, '#E0E0E0');
        wingGradient.addColorStop(0.5, '#FFFFFF');
        wingGradient.addColorStop(1, '#E0E0E0');
        
        ctx.fillStyle = wingGradient;
        
        // Upper wings
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 8);
        ctx.quadraticCurveTo(
            screenX + 16 + wingSpan, screenY,
            screenX + 16, screenY + 12
        );
        ctx.quadraticCurveTo(
            screenX + 16 - wingSpan, screenY,
            screenX + 16, screenY + 8
        );
        ctx.fill();
        
        // Lower wings
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 12);
        ctx.quadraticCurveTo(
            screenX + 16 + wingSpan * 0.8, screenY + 20,
            screenX + 16, screenY + 16
        );
        ctx.quadraticCurveTo(
            screenX + 16 - wingSpan * 0.8, screenY + 20,
            screenX + 16, screenY + 12
        );
        ctx.fill();

        // Draw body
        ctx.fillStyle = '#D0D0D0';
        ctx.beginPath();
        ctx.ellipse(screenX + 16, screenY + 12, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw antennae
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 8);
        ctx.quadraticCurveTo(
            screenX + 12, screenY + 4,
            screenX + 10, screenY + 2
        );
        ctx.moveTo(screenX + 16, screenY + 8);
        ctx.quadraticCurveTo(
            screenX + 20, screenY + 4,
            screenX + 22, screenY + 2
        );
        ctx.stroke();
    }
}

window.Moth = Moth;
