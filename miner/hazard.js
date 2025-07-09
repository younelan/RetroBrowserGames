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

    draw(context) {
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
                // Fire animation with an array of segments, each moving independently like an equalizer
                const gradient = context.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(1, 'red');
                gradient.addColorStop(0.9, 'orange');
                gradient.addColorStop(0.5, 'orange');
                gradient.addColorStop(0, 'yellow');
                context.fillStyle = gradient;

                const segmentCount = 8; // Number of segments
                const segmentWidth = this.width / segmentCount;
                const segments = Array.from({ length: segmentCount }, (_, i) => {
                    const timeFactor = Date.now() / 500 + i;
                    return Math.abs(Math.sin(timeFactor)) * (this.height / 4); // Independent motion for each segment
                });

                context.beginPath();
                context.moveTo(this.x, this.y + this.height);
                segments.forEach((variation, i) => {
                    context.lineTo(this.x + i * segmentWidth, this.y + this.height - variation);
                });
                context.lineTo(this.x + this.width, this.y + this.height);
                context.closePath();
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
