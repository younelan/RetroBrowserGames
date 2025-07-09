class VerticalEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 2;
    }

    update(level) {
        this.y += this.direction * this.speed;

        // Simple boundary collision for vertical movement
        if (this.y < 0 || this.y + this.height > (LEVEL_HEIGHT - UI_HEIGHT_TILES) * TILE_SIZE) {
            this.direction *= -1;
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        context.save();

        const s = this.width / 16;
        
        // Animation based on movement and time
        const animTime = Date.now() * 0.01; // Fast wing flapping
        const wingFlap = Math.sin(animTime + this.y * 0.05) > 0;
        const bodyBob = Math.sin(animTime * 0.5) * s; // Gentle floating motion

        // Bat-like flying creature - side view
        // Main body (with gentle floating motion)
        context.fillStyle = '#4a2c5a'; // Purple
        context.fillRect(this.x + 6 * s, this.y + 4 * s + bodyBob, 4 * s, 20 * s);
        
        // Head
        context.fillStyle = '#3d2447'; // Darker purple
        context.fillRect(this.x + 5 * s, this.y + 2 * s + bodyBob, 6 * s, 8 * s);
        
        // Ears (bat-like)
        context.fillStyle = '#3d2447';
        context.fillRect(this.x + 4 * s, this.y + bodyBob, 2 * s, 4 * s);
        context.fillRect(this.x + 10 * s, this.y + bodyBob, 2 * s, 4 * s);
        
        // Wings (animated flapping)
        context.fillStyle = '#5a3b6b'; // Lighter purple
        if (wingFlap) {
            // Wings up (spread wide)
            context.fillRect(this.x - 1 * s, this.y + 4 * s + bodyBob, 5 * s, 10 * s); // Left wing
            context.fillRect(this.x + 12 * s, this.y + 4 * s + bodyBob, 5 * s, 10 * s); // Right wing
            // Wing tips
            context.fillRect(this.x - 2 * s, this.y + 6 * s + bodyBob, 3 * s, 6 * s);
            context.fillRect(this.x + 15 * s, this.y + 6 * s + bodyBob, 3 * s, 6 * s);
        } else {
            // Wings down (folded closer)
            context.fillRect(this.x + 1 * s, this.y + 8 * s + bodyBob, 4 * s, 8 * s); // Left wing
            context.fillRect(this.x + 11 * s, this.y + 8 * s + bodyBob, 4 * s, 8 * s); // Right wing
        }
        
        // Eyes (glowing yellow with slight flicker)
        const eyeGlow = Math.sin(animTime * 2) > -0.5;
        context.fillStyle = eyeGlow ? '#ffff00' : '#cccc00';
        context.fillRect(this.x + 6 * s, this.y + 4 * s + bodyBob, 1 * s, 1 * s);
        context.fillRect(this.x + 9 * s, this.y + 4 * s + bodyBob, 1 * s, 1 * s);
        
        // Small claws at bottom (with slight sway)
        context.fillStyle = '#3d2447';
        const clawSway = Math.sin(animTime * 0.3) * s;
        context.fillRect(this.x + 6 * s + clawSway, this.y + 24 * s + bodyBob, 1 * s, 4 * s);
        context.fillRect(this.x + 9 * s - clawSway, this.y + 24 * s + bodyBob, 1 * s, 4 * s);

        context.restore();
    }
}
