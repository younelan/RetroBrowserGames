class Dynamite {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONSTANTS.TILE_SIZE / 2;
        this.height = GAME_CONSTANTS.TILE_SIZE;
        this.timeLeft = 1.5; // 1.5 seconds until explosion
        this.sparkles = [];
    }

    update(deltaTime) {
        this.timeLeft -= deltaTime;
        this.updateSparkles(deltaTime);
        return this.timeLeft <= 0;
    }

    updateSparkles(deltaTime) {
        // Add new sparkles
        if (Math.random() < 0.3) {
            const progress = 1 - (this.timeLeft / 1.5);
            this.sparkles.push({
                x: this.x + (Math.random() * 6 - 3),
                y: this.y - 12 - (progress * 12),
                size: Math.random() * 2 + 1,
                timeLeft: 0.2
            });
        }

        // Update existing sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            this.sparkles[i].timeLeft -= deltaTime;
            if (this.sparkles[i].timeLeft <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const time = performance.now() / 1000;

        this.renderDynamite(ctx, screenX, screenY);
        this.renderFuse(ctx, screenX, screenY, time);
        this.renderSparkles(ctx, cameraX, cameraY, time);
    }

    renderDynamite(ctx, x, y) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - 4, y - 12, 8, 12);
    }

    renderFuse(ctx, x, y, time) {
        const fuseWave = Math.sin(time * 5) * 2;
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.quadraticCurveTo(
            x + fuseWave,
            y - 18,
            x,
            y - 24
        );
        ctx.stroke();
    }

    renderSparkles(ctx, cameraX, cameraY, time) {
        // Current fuse spark
        const sparkX = this.x - cameraX + Math.sin(time * 10) * 2;
        const sparkY = this.y - 24 - cameraY + Math.cos(time * 10);
        
        this.renderSpark(ctx, sparkX, sparkY);
        this.renderSparkGlow(ctx, sparkX, sparkY);
        this.renderTrailingSparkles(ctx, cameraX, cameraY);
    }

    renderSpark(ctx, x, y) {
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSparkGlow(ctx, x, y) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTrailingSparkles(ctx, cameraX, cameraY) {
        ctx.fillStyle = '#FFD700';
        for (const sparkle of this.sparkles) {
            ctx.globalAlpha = sparkle.timeLeft / 0.2;
            ctx.beginPath();
            ctx.arc(
                sparkle.x - cameraX,
                sparkle.y - cameraY,
                sparkle.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    createExplosion() {
        return {
            x: this.x,
            y: this.y,
            radius: GAME_CONSTANTS.TILE_SIZE,
            timeLeft: 0.5,
            duration: 0.5,
            color: '#FF0000'
        };
    }
}

window.Dynamite = Dynamite;