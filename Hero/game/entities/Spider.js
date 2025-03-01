class Spider extends Enemy {
    constructor(x, y) {
        super(x, y, '^');
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const centerX = screenX + GAME_CONSTANTS.TILE_SIZE/2;
        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE/2;
        const bobY = Math.sin(this.time * 2) * 4;

        // Draw web with shimmer effect
        this.renderWeb(ctx, centerX, centerY, screenY, bobY);
        
        // Draw spider body
        this.renderBody(ctx, centerX, centerY, bobY);
        
        // Draw legs
        this.renderLegs(ctx, centerX, centerY, bobY);
    }

    renderWeb(ctx, centerX, centerY, screenY, bobY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        // Main web thread
        for (let i = 0; i < 2; i++) {
            const offset = Math.sin(this.time * 3 + i) * 2;
            ctx.beginPath();
            ctx.moveTo(centerX + offset, screenY);
            ctx.lineTo(centerX, centerY + bobY);
            ctx.stroke();
        }
        
        // Cross threads with shimmer
        for (let i = 0; i < 4; i++) {
            const y = screenY + 4 + i * 6;
            const width = 4 + i * 3;
            const shimmer = Math.sin(this.time * 4 + i * 2) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, 255, 255, ${shimmer})`;
            ctx.beginPath();
            ctx.moveTo(centerX - width, y);
            ctx.lineTo(centerX + width, y);
            ctx.stroke();
        }
    }

    renderBody(ctx, centerX, centerY, bobY) {
        // Spider body with enhanced gradient
        const bodyGradient = ctx.createRadialGradient(
            centerX, centerY + bobY, 0,
            centerX, centerY + bobY, 12
        );
        bodyGradient.addColorStop(0, '#660000');
        bodyGradient.addColorStop(0.6, '#440000');
        bodyGradient.addColorStop(1, '#220000');
        
        ctx.fillStyle = bodyGradient;
        
        // Draw abdomen
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + bobY + 4, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw thorax
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + bobY - 4, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        const eyeGlow = Math.sin(this.time * 3) * 0.3 + 0.7;
        for (let i = -1; i <= 1; i += 2) {
            ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
            ctx.beginPath();
            ctx.arc(centerX + (i * 3), centerY + bobY - 6, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderLegs(ctx, centerX, centerY, bobY) {
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 2;
        const legCount = 4;
        
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < legCount; i++) {
                const baseAngle = (i / (legCount-1) - 0.5) * Math.PI * 0.6;
                const legTime = this.time * 2 + i * Math.PI / 3;
                const legBend = Math.sin(legTime) * 0.3;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY + bobY);
                
                ctx.quadraticCurveTo(
                    centerX + Math.cos(baseAngle) * 10 * side,
                    centerY + bobY + Math.sin(baseAngle) * 10,
                    centerX + Math.cos(baseAngle + legBend) * 20 * side,
                    centerY + bobY + Math.sin(baseAngle + legBend) * 20
                );
                ctx.stroke();
            }
        }
    }
}

window.Spider = Spider;
