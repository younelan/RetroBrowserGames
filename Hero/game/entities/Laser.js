class Laser {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 1;
        this.height = 1;
        this.length = GAME_CONSTANTS.TILE_SIZE * 3;
        this.direction = 1; // 1 for right, -1 for left
        this.active = false;
        this.phase = 0; // Animation phase for laser beam
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
        
        // Update animation phase
        if (this.active) {
            this.phase += deltaTime * 10;
        }
        
        // Add a small height to the laser beam for better collision detection
        this.height = 4; // Give the laser some height for collision detection
    }

    render(ctx, camera) {
        if (!this.active) return;
        
        // Convert world coordinates to screen coordinates
        const eyeY = this.y - camera.y;
        const eyeX = this.x - camera.x;
        
        // Draw laser beam with visual effects
        ctx.save();
        
        // Use screen blend mode for glowing effect
        ctx.globalCompositeOperation = 'screen';
        
        // Draw the main animated beam pattern
        this.renderBeams(ctx, eyeX, eyeY);
        
        // Draw the glow effect
        this.renderGlow(ctx, eyeX, eyeY);
        
        ctx.restore();
    }
    
    renderBeams(ctx, eyeX, eyeY) {
        // Animated beam pattern with multiple lines
        for (let i = 0; i < 3; i++) {
            const offset = Math.sin(this.phase + i * Math.PI / 2) * 2;
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(eyeX, eyeY + offset);
            ctx.lineTo(eyeX + this.length * this.direction, eyeY + offset);
            ctx.stroke();
        }
    }
    
    renderGlow(ctx, eyeX, eyeY) {
        // Add glow effect using gradient
        const gradient = ctx.createLinearGradient(
            eyeX, eyeY,
            eyeX + this.length * this.direction, eyeY
        );
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(eyeX, eyeY);
        ctx.lineTo(eyeX + this.length * this.direction, eyeY);
        ctx.stroke();
    }
}

window.Laser = Laser;