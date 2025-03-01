class Dynamite {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = -300; // Initial upward toss
        this.width = GAME_CONSTANTS.TILE_SIZE / 2;
        this.height = GAME_CONSTANTS.TILE_SIZE / 2;
        this.timer = 1.5; // 1.5 seconds fuse
        this.gravity = 800;
        this.sparkles = [];
        this.fuseSparkles = [];
        this.bounceCount = 0;
        this.maxBounces = 2;
        this.hasExploded = false;
    }

    update(deltaTime) {
        // Apply gravity and movement
        this.velocityY += this.gravity * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Ground collision and bounce
        const groundY = Math.floor((this.y + this.height) / GAME_CONSTANTS.TILE_SIZE) * GAME_CONSTANTS.TILE_SIZE;
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            if (this.bounceCount < this.maxBounces) {
                this.velocityY = -this.velocityY * 0.5;
                this.bounceCount++;
            } else {
                this.velocityY = 0;
            }
        }

        // Update timer
        this.timer -= deltaTime;

        // Add fuse sparkles
        if (Math.random() < 0.3) {
            this.addFuseSpark();
        }

        // Update existing sparkles
        this.updateSparkles(deltaTime);

        // Return true when ready to explode
        if (this.timer <= 0 && !this.hasExploded) {
            this.hasExploded = true;
            return true;
        }
        
        return false;
    }

    addFuseSpark() {
        this.fuseSparkles.push({
            x: this.x + (Math.random() - 0.5) * 4,
            y: this.y - this.height/2,
            vx: (Math.random() - 0.5) * 50,
            vy: -Math.random() * 50,
            timeLeft: 0.3,
            size: Math.random() * 2 + 1
        });
    }

    updateSparkles(deltaTime) {
        // Update and remove old sparkles
        for (let i = this.fuseSparkles.length - 1; i >= 0; i--) {
            const sparkle = this.fuseSparkles[i];
            sparkle.x += sparkle.vx * deltaTime;
            sparkle.y += sparkle.vy * deltaTime;
            sparkle.vy += this.gravity * deltaTime;
            sparkle.timeLeft -= deltaTime;
            if (sparkle.timeLeft <= 0) {
                this.fuseSparkles.splice(i, 1);
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
            radius: GAME_CONSTANTS.TILE_SIZE * 2.5,
            timeLeft: 0.8,
            duration: 0.8,
            sparkCount: 20,
            sparkles: []
        };
    }
}

window.Dynamite = Dynamite;