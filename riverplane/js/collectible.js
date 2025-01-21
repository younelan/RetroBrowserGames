export class Collectible {
    constructor(x, y, type, segment) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'fuel' ? 20 : 15;
        this.height = this.width;
        this.segment = segment; // Add segment reference
        this.speed = type === 'fuel' ? 0 : (Math.random() - 0.5) * 240; // Speed in units per second
    }

    update(dt) {
        this.y += this.segment.game.scrollSpeed * dt;
        
        // Points collectibles move side to side
        if (this.type !== 'fuel') {
            this.x += this.speed * dt;
            
            // Keep within corridor bounds
            if (this.x < this.segment.leftWall || 
                this.x + this.width > this.segment.leftWall + this.segment.width) {
                this.speed *= -1;
                // Keep collectible within bounds after speed reversal
                if (this.x < this.segment.leftWall) {
                    this.x = this.segment.leftWall;
                } else if (this.x + this.width > this.segment.leftWall + this.segment.width) {
                    this.x = this.segment.leftWall + this.segment.width - this.width;
                }
            }
        }
    }

    draw(ctx) {
        if (this.type === 'fuel') {
            // Draw split-colored fuel cell
            // Top half - white
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x, this.y, this.width, this.height/2);
            
            // Bottom half - pink
            ctx.fillStyle = '#ffb6c1'; // Light pink
            ctx.fillRect(this.x, this.y + this.height/2, this.width, this.height/2);
            
            // Draw 'F' letter
            ctx.fillStyle = '#000';
            ctx.font = `${this.width * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('F', this.x + this.width/2, this.y + this.height/2);
        } else {
            // Points collectible remains red
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    collect(game) {
        if (this.type === 'fuel') {
            game.player.fuel = Math.min(100, game.player.fuel + 30);
            game.score += 50; // Add points for collecting fuel
        } else {
            game.score += 100;
        }
    }
}
