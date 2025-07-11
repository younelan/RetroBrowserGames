class SpiderEnemy {
    constructor(x, y, isMoving = false) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.isMoving = isMoving; // true for moving, false for static
        this.direction = 1; // 1 for down, -1 for up
        this.speed = 1; // Slow movement speed
        this.maxThreadLength = TILE_SIZE; // Maximum distance to drop down (1 tile)
        this.animationTimer = 0;
        this.legAnimation = 0;
    }

    update(level) {
        this.animationTimer++;
        this.legAnimation = Math.sin(this.animationTimer * 0.2) * 2; // Leg movement animation
        
        if (this.isMoving) {
            // Move down and up exactly one tile
            const currentDistance = this.y - this.startY;
            
            if (this.direction === 1) { // Moving down
                this.y += this.speed;
                if (currentDistance >= this.maxThreadLength) {
                    this.direction = -1; // Start moving up
                }
            } else { // Moving up
                this.y -= this.speed;
                if (currentDistance <= 0) {
                    this.y = this.startY; // Ensure exact position
                    this.direction = 1; // Start moving down again
                }
            }
        }
    }

    draw(context) {
        // Draw the hanging thread
        const threadStartY = this.startY - TILE_SIZE; // Thread starts from above the starting position
        const threadEndY = this.y + this.height / 2; // Thread ends at spider center
        
        context.strokeStyle = '#888888';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this.x + this.width / 2, threadStartY);
        context.lineTo(this.x + this.width / 2, threadEndY);
        context.stroke();
        
        // Draw spider body
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Spider body (main oval) - brown/dark orange color
        context.fillStyle = '#8B4513'; // Saddle brown
        context.beginPath();
        context.ellipse(centerX, centerY, 10, 7, 0, 0, 2 * Math.PI);
        context.fill();
        
        // Body outline for definition
        context.strokeStyle = '#654321';
        context.lineWidth = 1;
        context.stroke();
        
        // Spider abdomen (smaller oval behind) - darker brown
        context.fillStyle = '#654321'; // Dark brown
        context.beginPath();
        context.ellipse(centerX, centerY + 4, 7, 5, 0, 0, 2 * Math.PI);
        context.fill();
        
        // Abdomen pattern (lighter spots)
        context.fillStyle = '#A0522D';
        context.beginPath();
        context.ellipse(centerX - 2, centerY + 3, 2, 1.5, 0, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.ellipse(centerX + 2, centerY + 3, 2, 1.5, 0, 0, 2 * Math.PI);
        context.fill();
        
        // Spider legs (4 pairs, animated) - darker brown
        context.strokeStyle = '#654321';
        context.lineWidth = 2;
        context.lineCap = 'round';
        
        const legLength = 10;
        
        // Draw 8 legs (4 on each side)
        for (let i = 0; i < 4; i++) {
            const legY = centerY - 6 + i * 3;
            const legOffset = Math.sin(this.animationTimer * 0.15 + i * 0.5) * 3;
            const legBend = Math.sin(this.animationTimer * 0.1 + i * 0.3) * 1.5;
            
            // Left legs with joints
            context.beginPath();
            context.moveTo(centerX - 5, legY);
            context.lineTo(centerX - 8 - legOffset, legY - 4 + legBend);
            context.lineTo(centerX - 14 - legOffset, legY + 1 + legBend);
            context.stroke();
            
            // Right legs with joints
            context.beginPath();
            context.moveTo(centerX + 5, legY);
            context.lineTo(centerX + 8 + legOffset, legY - 4 + legBend);
            context.lineTo(centerX + 14 + legOffset, legY + 1 + legBend);
            context.stroke();
        }
        
        // Spider eyes (small black dots with white highlights)
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(centerX - 3, centerY - 3, 2, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.arc(centerX + 3, centerY - 3, 2, 0, 2 * Math.PI);
        context.fill();
        
        // Eye highlights
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.arc(centerX - 2, centerY - 4, 1, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.arc(centerX + 4, centerY - 4, 1, 0, 2 * Math.PI);
        context.fill();
        
        // Additional smaller eyes (spiders have 8 eyes)
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(centerX - 1, centerY - 5, 1, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.arc(centerX + 1, centerY - 5, 1, 0, 2 * Math.PI);
        context.fill();
        
        // Chelicerae (fangs)
        context.fillStyle = '#FFFFFF';
        context.beginPath();
        context.arc(centerX - 2, centerY + 1, 1, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.arc(centerX + 2, centerY + 1, 1, 0, 2 * Math.PI);
        context.fill();
        
        // Pedipalps (smaller appendages near mouth)
        context.strokeStyle = '#654321';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(centerX - 4, centerY + 2);
        context.lineTo(centerX - 6, centerY + 4);
        context.stroke();
        context.beginPath();
        context.moveTo(centerX + 4, centerY + 2);
        context.lineTo(centerX + 6, centerY + 4);
        context.stroke();
    }

    checkCollision(rect) {
        return rect.x < this.x + this.width &&
               rect.x + rect.width > this.x &&
               rect.y < this.y + this.height &&
               rect.y + rect.height > this.y;
    }
}
