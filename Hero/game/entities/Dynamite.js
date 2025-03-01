class Dynamite {
    constructor(x, y) {
        // Place dynamite on the ground at player's feet
        this.x = x;
        this.y = y; // This will be the player's feet position
        this.velocityX = 0;
        this.velocityY = -150; // Reduced initial upward toss so it stays lower
        this.width = GAME_CONSTANTS.TILE_SIZE / 2;
        this.height = GAME_CONSTANTS.TILE_SIZE / 2;
        this.timer = 1.5; // 1.5 seconds fuse
        this.gravity = 800;
        this.sparkles = [];
        this.fuseSparkles = [];
        this.bounceCount = 0;
        this.maxBounces = 1; // Reduced bounces for quicker placement
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

        // Draw dynamite body
        this.renderDynamite(ctx, screenX, screenY);
        
        // Draw fuse and sparkles
        this.renderFuse(ctx, screenX, screenY, time);
        this.renderSparkles(ctx, cameraX, cameraY, time);
    }

    renderDynamite(ctx, x, y) {
        // Get the position of the ground under the dynamite
        const tileY = Math.floor((this.y + this.height) / GAME_CONSTANTS.TILE_SIZE);
        const groundY = tileY * GAME_CONSTANTS.TILE_SIZE;
        
        // Calculate the stick height to reach exactly to the ground, not below
        const stickHeight = Math.max(12, groundY - (this.y - 6));
        
        // Draw red dynamite stick extending to the ground
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(
            x - 4,          // Center horizontally (8px wide)
            y - 6,          // Top position (6px above center)
            8,              // Width of dynamite stick
            stickHeight     // Height extending to the ground
        );
        
        // Draw black cap on top
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 4, y - 8, 8, 2);
    }

    renderFuse(ctx, x, y, time) {
        const fuseWave = Math.sin(time * 5) * 2;
        
        // Draw fuse coming from the top of the dynamite
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 8); // Connect to the top of the dynamite
        ctx.quadraticCurveTo(
            x + fuseWave,
            y - 14,
            x,
            y - 20 // Keep fuse visible above dynamite
        );
        ctx.stroke();
    }

    renderSparkles(ctx, cameraX, cameraY, time) {
        // Current fuse spark - adjusted position to match new fuse placement
        const sparkX = this.x - cameraX + Math.sin(time * 10) * 2;
        const sparkY = this.y - 20 - cameraY + Math.cos(time * 10); // Align with top of fuse
        
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

    renderGlowInDarkness(ctx, screenX, screenY) {
        const bombGradient = ctx.createRadialGradient(
            screenX + GAME_CONSTANTS.TILE_SIZE/4,
            screenY + GAME_CONSTANTS.TILE_SIZE/4,
            0,
            screenX + GAME_CONSTANTS.TILE_SIZE/4,
            screenY + GAME_CONSTANTS.TILE_SIZE/4,
            GAME_CONSTANTS.TILE_SIZE/2
        );
        bombGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        bombGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = bombGradient;
        ctx.beginPath();
        ctx.arc(
            screenX + GAME_CONSTANTS.TILE_SIZE/4,
            screenY + GAME_CONSTANTS.TILE_SIZE/4,
            GAME_CONSTANTS.TILE_SIZE/4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    createExplosion() {
        const explosion = {
            x: this.x,
            y: this.y,
            radius: GAME_CONSTANTS.TILE_SIZE * 2.5,
            timeLeft: 0.8,
            duration: 0.8,
            sparkCount: 20,
            sparkles: []
        };

        // Create initial explosion sparkles
        for (let i = 0; i < explosion.sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / explosion.sparkCount;
            const speed = Math.random() * 200 + 100;
            explosion.sparkles.push({
                x: explosion.x,
                y: explosion.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 2,
                timeLeft: Math.random() * 0.5 + 0.3
            });
        }

        return explosion;
    }
}

window.Dynamite = Dynamite;