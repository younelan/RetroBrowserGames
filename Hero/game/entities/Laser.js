class Laser {
    constructor() {
        this.active = false;
        this.phase = 0;
        this.direction = 1;
        this.x = 0;
        this.y = 0;
        this.length = GAME_CONSTANTS.TILE_SIZE * 3;
    }

    update(deltaTime, player) {
        if (!this.active) return false;
        
        this.phase = (this.phase + deltaTime * 10) % (Math.PI * 2);
        this.direction = player.facingLeft ? -1 : 1;
        // Position laser at eye level (about 1/4 from top of player)
        this.x = player.x + (player.facingLeft ? 0 : player.width);
        this.y = player.y + player.height * 0.25;
        
        return true; // Return true when laser is active
    }

    render(ctx, player, cameraX, cameraY) {
        if (!this.active) return;
        
        const eyeY = this.y - cameraY;
        const eyeX = this.x - cameraX;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Draw laser beams
        for (let i = 0; i < 3; i++) {
            const offset = Math.sin(this.phase + i * Math.PI / 2) * 2;
            this.drawBeam(ctx, eyeX, eyeY + offset, this.direction);
        }

        // Draw glow effect
        this.drawGlow(ctx, eyeX, eyeY, this.direction);
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