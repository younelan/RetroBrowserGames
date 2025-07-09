class Hazard {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type;
    }

    update(level) {
        // Most hazards are static, but this can be overridden for animated hazards
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw(context, frameCounter = 0) {
        const s = this.width / 16; // Scale factor
        
        switch (this.type) {
            case 'SPIKES':
                context.fillStyle = '#666'; // Grey spikes
                // Draw multiple triangles for spikes
                for (let i = 0; i < 4; i++) {
                    context.beginPath();
                    context.moveTo(this.x + i * (this.width / 4), this.y + this.height);
                    context.lineTo(this.x + i * (this.width / 4) + (this.width / 8), this.y + this.height - this.height / 2);
                    context.lineTo(this.x + (i + 1) * (this.width / 4), this.y + this.height);
                    context.fill();
                }
                break;
            case 'FIRE':
                // Animated fire (simple)
                const fireColor1 = 'orange';
                const fireColor2 = 'red';
                const fireColor3 = 'yellow';

                context.fillStyle = (Math.floor(frameCounter / 5) % 3 === 0) ? fireColor1 : (Math.floor(frameCounter / 5) % 3 === 1) ? fireColor2 : fireColor3;
                context.fillRect(this.x, this.y + this.height / 2, this.width, this.height / 2); // Base of fire
                context.beginPath();
                context.moveTo(this.x, this.y + this.height / 2);
                context.lineTo(this.x + this.width / 2, this.y);
                context.lineTo(this.x + this.width, this.y + this.height / 2);
                context.fill();
                break;
            case 'GENERIC':
            default:
                context.fillStyle = 'orange';
                context.fillRect(this.x, this.y, this.width, this.height);
                break;
        }
    }
}
