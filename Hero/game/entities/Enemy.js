class Enemy {
    constructor(x, y, type) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.initialY = this.y; // Store initial position for movement patterns
        this.initialX = this.x;
        this.width = GAME_CONSTANTS.TILE_SIZE;
        this.height = GAME_CONSTANTS.TILE_SIZE;
        this.type = type;
        this.alive = true;
        this.phase = 0;
    }

    update(deltaTime) {
        if (!this.alive) return;

        this.phase += deltaTime * 3;

        if (this.type === '^') { // Spider
            // Vertical movement pattern
            this.y = this.initialY + Math.sin(this.phase) * GAME_CONSTANTS.TILE_SIZE * 0.5;
        } else if (this.type === '&') { // Snake
            // Horizontal movement pattern
            this.x = this.initialX + Math.sin(this.phase) * GAME_CONSTANTS.TILE_SIZE;
        }
    }

    render(ctx, cameraX, cameraY) {
        if (!this.alive) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        if (this.type === '^') {
            this.renderSpider(ctx, screenX, screenY);
        } else if (this.type === '&') {
            this.renderSnake(ctx, screenX, screenY);
        }
    }

    renderSpider(ctx, x, y) {
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        
        // Draw web
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();

        // Draw spider body
        ctx.fillStyle = '#440000';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw legs
        ctx.strokeStyle = '#660000';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 3) * Math.PI;
            const legX = Math.cos(angle + this.phase) * 8;
            const legY = Math.sin(angle + this.phase) * 4;
            
            // Draw legs on both sides
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + legX, centerY + legY);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX - legX, centerY + legY);
            ctx.stroke();
        }
    }

    renderSnake(ctx, x, y) {
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        
        // Snake body
        ctx.fillStyle = '#006600';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snake pattern
        ctx.fillStyle = '#004400';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
                centerX + (i * 8 - 8),
                centerY,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    checkCollision(player) {
        if (!this.alive) return false;
        
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }

    hit() {
        this.alive = false;
        return 100; // Points for killing enemy
    }
}

window.Enemy = Enemy;