export class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;  // Will be adjusted based on cell size
        this.timeToLive = 10000; // All collectibles expire after 10 seconds
        this.spawnTime = Date.now();
        this.points = 50;
    }

    isExpired() {
        return Date.now() - this.spawnTime > this.timeToLive;
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'powerPellet') {
            this.drawPowerPellet(ctx);
        } else {
            // Draw fruit based on type
            switch(this.type) {
                case 'cherry':
                    this.drawCherry(ctx);
                    break;
                case 'banana':
                    this.drawBanana(ctx);
                    break;
                case 'apple':
                    this.drawApple(ctx);
                    break;
            }
        }
        ctx.restore();
    }

    drawCherry(ctx) {
        // Draw stem
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.quadraticCurveTo(this.x + this.radius, this.y - this.radius * 1.5, 
                            this.x + this.radius * 0.5, this.y - this.radius * 0.5);
        ctx.strokeStyle = '#4a2';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw cherry
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#f00';
        ctx.fill();
    }

    drawBanana(ctx) {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd00';  // Brighter yellow
        ctx.fill();
        ctx.strokeStyle = '#b39700';  // Darker outline
        ctx.stroke();
    }

    drawApple(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#dd0000';  // Darker red to distinguish from monster
        ctx.fill();
        
        // Add highlight for 3D effect
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#dd0000');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Stem
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius * 0.8);
        ctx.lineTo(this.x, this.y - this.radius);
        ctx.strokeStyle = '#4a2';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawPowerPellet(ctx) {
        const pulseAmount = Math.sin(Date.now() / 200) * 0.2 + 0.8; // Pulsing effect
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulseAmount, 0, Math.PI * 2);
        
        // Create gradient for glowing effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * pulseAmount
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#ff8800');
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}
