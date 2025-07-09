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
        
        // Smooth time-based animation
        const time = Date.now() * 0.005; // Slower, smoother animation
        const wingCycle = Math.sin(time * 4); // Fast wing flapping
        const bodyFloat = Math.sin(time) * 2; // Gentle floating
        const wingFlap = wingCycle > 0;
        const wingAngle = wingCycle * 0.3; // Subtle wing angle variation

        // True side-view bat - facing right, properly aligned within 2-cell height
        // Main body (elongated horizontally for side view) 
        context.fillStyle = '#4a2c5a';
        context.fillRect(this.x + 4 * s, this.y + 14 * s + bodyFloat, 8 * s, 10 * s);
        
        // Head (pointed snout facing right)
        context.fillStyle = '#3d2447';
        context.fillRect(this.x + 11 * s, this.y + 12 * s + bodyFloat, 4 * s, 14 * s);
        
        // Snout/nose (pointing right)
        context.fillStyle = '#2d1a37';
        context.fillRect(this.x + 14 * s, this.y + 16 * s + bodyFloat, 2 * s, 6 * s);
        
        // Ear (single ear visible from side)
        context.fillStyle = '#3d2447';
        context.fillRect(this.x + 12 * s, this.y + 8 * s + bodyFloat, 2 * s, 6 * s);
        
        // Wings - true side view with proper flapping
        context.fillStyle = '#5a3b6b';
        if (wingFlap) {
            // Wing up position - visible wing
            context.fillRect(this.x + 2 * s, this.y + 8 * s + bodyFloat + wingAngle, 8 * s, 12 * s);
            // Wing membrane detail
            context.fillStyle = '#3d2447';
            context.fillRect(this.x + 3 * s, this.y + 10 * s + bodyFloat + wingAngle, 6 * s, 2 * s);
        } else {
            // Wing down position
            context.fillRect(this.x + 3 * s, this.y + 18 * s + bodyFloat - wingAngle, 7 * s, 8 * s);
            // Wing membrane detail
            context.fillStyle = '#3d2447';
            context.fillRect(this.x + 4 * s, this.y + 20 * s + bodyFloat - wingAngle, 5 * s, 2 * s);
        }
        
        // Single eye visible from side
        context.fillStyle = Math.sin(time * 6) > 0 ? '#ffff00' : '#cccc00';
        context.fillRect(this.x + 12 * s, this.y + 16 * s + bodyFloat, 2 * s, 2 * s);
        
        // Feet/claws (hanging down with slight sway) - kept within bounds
        context.fillStyle = '#2d1a37';
        const clawSway = Math.sin(time * 0.8) * 0.5;
        context.fillRect(this.x + 6 * s + clawSway, this.y + 26 * s + bodyFloat, 2 * s, 6 * s);
        context.fillRect(this.x + 9 * s - clawSway, this.y + 26 * s + bodyFloat, 2 * s, 6 * s);

        context.restore();
    }
}
