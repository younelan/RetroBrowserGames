class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, '-');  // Changed from '/' to '-'
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY + Math.sin(this.time * 3) * 5;
        
        // Draw wing shadows first
        this.renderWingShadows(ctx, screenX, screenY);
        // Draw main wings
        this.renderWings(ctx, screenX, screenY);
        // Draw body and details
        this.renderBody(ctx, screenX, screenY);
        // Draw glowing eyes
        this.renderEyes(ctx, screenX, screenY);
    }

    renderWingShadows(ctx, x, y) {
        const wingSpan = Math.sin(this.time * 10) * 10 + 20;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 10);
        ctx.quadraticCurveTo(
            x + 18 + wingSpan, y + 4,
            x + 18, y + 18
        );
        ctx.quadraticCurveTo(
            x + 18 - wingSpan, y + 4,
            x + 18, y + 10
        );
        ctx.fill();
    }

    renderWings(ctx, x, y) {
        const wingSpan = Math.sin(this.time * 10) * 10 + 20;
        
        // Create darker purple wing gradient
        const wingGradient = ctx.createLinearGradient(
            x + 16, y + 8,
            x + 16 + wingSpan, y
        );
        wingGradient.addColorStop(0, '#4A1C4A');  // Dark purple
        wingGradient.addColorStop(0.4, '#722F72'); // Medium purple
        wingGradient.addColorStop(0.6, '#8B3A8B'); // Light purple
        wingGradient.addColorStop(1, '#4A1C4A');  // Dark purple
        
        ctx.fillStyle = wingGradient;
        
        // Draw membrane patterns
        this.renderWingMembranes(ctx, x, y, wingSpan);
    }

    renderWingMembranes(ctx, x, y, wingSpan) {
        // Left wing
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 8);
        ctx.quadraticCurveTo(
            x + 16 + wingSpan, y,
            x + 16, y + 16
        );
        ctx.quadraticCurveTo(
            x + 16 - wingSpan, y,
            x + 16, y + 8
        );
        ctx.fill();

        // Add wing bone details
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const offset = (i + 1) * (wingSpan / 3);
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 8);
            ctx.quadraticCurveTo(
                x + 16 + offset, y + 2,
                x + 16, y + 16
            );
            ctx.stroke();
        }
    }

    renderBody(ctx, x, y) {
        // Create 3D body effect with darker purple base
        const bodyGradient = ctx.createRadialGradient(
            x + 14, y + 10, 0,
            x + 16, y + 12, 10
        );
        bodyGradient.addColorStop(0, '#722F72');   // Medium purple
        bodyGradient.addColorStop(0.6, '#4A1C4A'); // Dark purple
        bodyGradient.addColorStop(1, '#2D112D');   // Very dark purple
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 12, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add brighter fur texture
        ctx.strokeStyle = 'rgba(171, 130, 255, 0.4)'; // Lighter purple
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.time;
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 12);
            ctx.lineTo(
                x + 16 + Math.cos(angle) * 6,
                y + 12 + Math.sin(angle) * 8
            );
            ctx.stroke();
        }
    }

    renderFurTexture(ctx, x, y) {
        ctx.strokeStyle = 'rgba(90, 90, 90, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.time;
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 12);
            ctx.lineTo(
                x + 16 + Math.cos(angle) * 6,
                y + 12 + Math.sin(angle) * 8
            );
            ctx.stroke();
        }
    }

    renderEyes(ctx, x, y) {
        // Enhance glowing effect
        const glowIntensity = Math.sin(this.time * 2) * 0.3 + 0.7;
        const glowSize = Math.sin(this.time * 4) * 0.5 + 2.5;
        
        // Draw larger outer glow
        const glowGradient = ctx.createRadialGradient(
            x + 14, y + 10, 0,
            x + 14, y + 10, glowSize * 3
        );
        glowGradient.addColorStop(0, `rgba(255, 50, 50, ${glowIntensity})`);
        glowGradient.addColorStop(0.5, `rgba(255, 0, 0, ${glowIntensity * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x + 14, y + 10, glowSize * 3, 0, Math.PI * 2);
        ctx.arc(x + 18, y + 10, glowSize * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw intense red eyes
        ctx.fillStyle = `rgba(255, 0, 0, ${glowIntensity * 1.2})`;
        ctx.beginPath();
        ctx.arc(x + 14, y + 10, glowSize, 0, Math.PI * 2);
        ctx.arc(x + 18, y + 10, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.Bat = Bat;
