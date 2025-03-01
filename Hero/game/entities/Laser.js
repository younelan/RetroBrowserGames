class Laser {
    constructor() {
        this.active = false;
        this.phase = 0;
        this.length = GAME_CONSTANTS.TILE_SIZE * 3;
    }

    update(deltaTime, player, level) {
        if (!this.active) return;
        
        this.phase = (this.phase + deltaTime * 10) % (Math.PI * 2);
        const direction = player.facingLeft ? -1 : 1;
        const startX = player.x + player.width * 0.5;
        const startY = player.y + player.height * 0.25;
        const endX = startX + this.length * direction;

        // Check for enemy hits
        const tileY = Math.floor(startY / GAME_CONSTANTS.TILE_SIZE);
        const startTileX = Math.floor(Math.min(startX, endX) / GAME_CONSTANTS.TILE_SIZE);
        const endTileX = Math.floor(Math.max(startX, endX) / GAME_CONSTANTS.TILE_SIZE);

        for (let x = startTileX; x <= endTileX; x++) {
            if (level.checkAndDamageEnemy(x, tileY)) {
                return true; // Hit something
            }
        }
        return false;
    }

    render(ctx, player, cameraX, cameraY) {
        if (!this.active) return;
        
        const direction = player.facingLeft ? -1 : 1;
        const eyeY = player.y + player.height * 0.25 - cameraY;
        const eyeX = player.x + player.width * 0.5 - cameraX;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Draw laser beams
        for (let i = 0; i < 3; i++) {
            const offset = Math.sin(this.phase + i * Math.PI / 2) * 2;
            this.drawBeam(ctx, eyeX, eyeY + offset, direction);
        }

        // Draw glow effect
        this.drawGlow(ctx, eyeX, eyeY, direction);
        ctx.restore();
    }

    drawBeam(ctx, x, y, direction) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.length * direction, y);
        ctx.stroke();
    }

    drawGlow(ctx, x, y, direction) {
        const gradient = ctx.createLinearGradient(
            x, y,
            x + this.length * direction, y
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.length * direction, y);
        ctx.stroke();
    }
}

window.Laser = Laser;