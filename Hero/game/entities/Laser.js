class Laser {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 1;
        this.height = 1;
        this.length = GAME_CONSTANTS.TILE_SIZE * 3;
        this.direction = 1; // 1 for right, -1 for left
        this.active = false;
    }

    update(deltaTime, player, level) {
        // Update laser position based on player's position and direction
        this.direction = player.facingLeft ? -1 : 1;
        
        // Set laser origin at the player's eye level (from where it's visually shown)
        this.y = player.y + player.height * 0.1; // Match the goggles position
        
        // Set X position based on which eye (left or right) the laser comes from
        if (player.facingLeft) {
            this.x = player.x + player.width * 0.4; // Left eye when facing left
        } else {
            this.x = player.x + player.width * 0.6; // Right eye when facing right
        }
        
        // Add a small height to the laser beam for better collision detection
        this.height = 4; // Give the laser some height for collision detection
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