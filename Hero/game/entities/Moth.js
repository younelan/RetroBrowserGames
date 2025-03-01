class Moth extends Enemy {
    constructor(x, y) {
        super(x, y, '_');
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY + Math.sin(this.time * 2) * 8;
        
        // Draw wing shadows
        this.renderWingShadows(ctx, screenX, screenY);
        // Draw wings with iridescent effect
        this.renderWings(ctx, screenX, screenY);
        // Draw glowing patterns
        this.renderWingPatterns(ctx, screenX, screenY);
        // Draw body and antennae
        this.renderBody(ctx, screenX, screenY);
    }

    renderWingShadows(ctx, x, y) {
        const wingSpan = Math.sin(this.time * 15) * 8 + 16;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.drawWingShape(ctx, x + 2, y + 2, wingSpan * 0.9);
    }

    renderWings(ctx, x, y) {
        const wingSpan = Math.sin(this.time * 15) * 8 + 16;
        
        // Create rainbow iridescent effect
        const shimmerSpeed = this.time * 2;
        const wingGradient = ctx.createLinearGradient(
            x, y, x + 32, y + 32
        );
        
        // Shifting rainbow colors
        const hue1 = (shimmerSpeed * 20) % 360;
        const hue2 = (hue1 + 60) % 360;
        const hue3 = (hue1 + 180) % 360;
        
        wingGradient.addColorStop(0, `hsla(${hue1}, 100%, 75%, 0.9)`);
        wingGradient.addColorStop(0.3, `hsla(${hue2}, 100%, 85%, 0.9)`);
        wingGradient.addColorStop(0.7, `hsla(${hue3}, 100%, 75%, 0.9)`);
        wingGradient.addColorStop(1, `hsla(${hue1}, 100%, 75%, 0.9)`);
        
        ctx.fillStyle = wingGradient;
        this.drawWingShape(ctx, x, y, wingSpan);

        // Add sparkle effect
        this.renderSparkles(ctx, x, y);
    }

    renderSparkles(ctx, x, y) {
        const sparkleCount = 6;
        for(let i = 0; i < sparkleCount; i++) {
            const angle = (this.time * 3 + i * (Math.PI * 2 / sparkleCount));
            const radius = 12 + Math.sin(this.time * 4 + i) * 4;
            const sparkleX = x + 16 + Math.cos(angle) * radius;
            const sparkleY = y + 12 + Math.sin(angle) * radius;
            
            // Draw sparkle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawWingShape(ctx, x, y, wingSpan) {
        // Upper wings
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 8);
        ctx.quadraticCurveTo(
            x + 16 + wingSpan, y,
            x + 16, y + 12
        );
        ctx.quadraticCurveTo(
            x + 16 - wingSpan, y,
            x + 16, y + 8
        );
        ctx.fill();
        
        // Lower wings
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 12);
        ctx.quadraticCurveTo(
            x + 16 + wingSpan * 0.8, y + 20,
            x + 16, y + 16
        );
        ctx.quadraticCurveTo(
            x + 16 - wingSpan * 0.8, y + 20,
            x + 16, y + 12
        );
        ctx.fill();
    }

    renderWingPatterns(ctx, x, y) {
        // Add glowing patterns to wings
        const time = this.time * 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        
        // Draw luminescent wing veins
        const veins = 5;
        for(let side = -1; side <= 1; side += 2) {
            for(let i = 0; i < veins; i++) {
                const angle = (i / veins) * Math.PI * 0.5;
                const length = 15 + Math.sin(time + i) * 2;
                ctx.beginPath();
                ctx.moveTo(x + 16, y + 12);
                ctx.lineTo(
                    x + 16 + Math.cos(angle) * length * side,
                    y + 12 + Math.sin(angle) * length
                );
                ctx.stroke();
            }
        }
    }

    renderBody(ctx, x, y) {
        // Create fluffy body effect
        const bodyGradient = ctx.createRadialGradient(
            x + 16, y + 12, 0,
            x + 16, y + 12, 8
        );
        bodyGradient.addColorStop(0, '#FFFFFF');
        bodyGradient.addColorStop(0.5, '#E0E0E0');
        bodyGradient.addColorStop(1, '#D0D0D0');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 12, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add fur texture
        this.renderFurTexture(ctx, x, y);
        // Draw animated antennae
        this.renderAntennae(ctx, x, y);
    }

    renderFurTexture(ctx, x, y) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + this.time;
            const length = 3 + Math.sin(this.time * 5 + i) * 1;
            ctx.beginPath();
            ctx.moveTo(x + 16, y + 12);
            ctx.lineTo(
                x + 16 + Math.cos(angle) * length,
                y + 12 + Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }

    renderAntennae(ctx, x, y) {
        const waveOffset = Math.sin(this.time * 3) * 2;
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        
        // Left antenna
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 8);
        ctx.quadraticCurveTo(
            x + 12 + waveOffset, y + 4,
            x + 10 - waveOffset, y + 2
        );
        
        // Right antenna
        ctx.moveTo(x + 16, y + 8);
        ctx.quadraticCurveTo(
            x + 20 - waveOffset, y + 4,
            x + 22 + waveOffset, y + 2
        );
        ctx.stroke();
        
        // Add glowing antenna tips
        this.renderAntennaTips(ctx, x, y, waveOffset);
    }

    renderAntennaTips(ctx, x, y, waveOffset) {
        const glow = Math.sin(this.time * 4) * 0.3 + 0.7;
        const gradient = ctx.createRadialGradient(
            x + 10 - waveOffset, y + 2, 0,
            x + 10 - waveOffset, y + 2, 2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${glow})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + 10 - waveOffset, y + 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 22 + waveOffset, y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.Moth = Moth;
