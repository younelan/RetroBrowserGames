export class Collectible {
    constructor(x, y, type, segment) {
        this.x = x;
        this.y = y;
        this.type = type;
        if (type === 'road') {
            // For left bank road
            if (x === 0) {
                this.width = segment.leftWall;
            } 
            // For right bank road
            else {
                this.width = segment.game.width - (segment.leftWall + segment.width);
            }
            this.height = segment.game.corridorManager.segmentHeight/2;
        } else if (type === 'decoration') {
            this.isTree = Math.random() < 0.6; // 60% chance for trees
            this.width = this.isTree ? 15 : 30; // Trees thinner than houses
        } else {
            this.width = type === 'fuel' ? 20 : 15;
        }
        this.height = this.width;
        this.segment = segment;
        this.speed = type === 'points' ? (Math.random() - 0.5) * 240 : 0;
    }

    update(dt) {
        this.y += this.segment.game.scrollSpeed * dt;
        
        // Only points collectibles move side to side
        if (this.type === 'points') {
            this.x += this.speed * dt;
            
            // Keep within corridor bounds
            if (this.x < this.segment.leftWall || 
                this.x + this.width > this.segment.leftWall + this.segment.width) {
                this.speed *= -1;
                if (this.x < this.segment.leftWall) {
                    this.x = this.segment.leftWall;
                } else {
                    this.x = this.segment.leftWall + this.segment.width - this.width;
                }
            }
        }
    }

    draw(ctx) {
        if (this.type === 'road') {
            ctx.fillStyle = '#808080'; // Medium gray
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'decoration') {
            if (this.isTree) {
                // Thin tree trunk
                ctx.fillStyle = '#8B4513'; // Saddle brown
                ctx.fillRect(this.x + this.width/2 - 2, this.y + 5, 3, 12);
                
                // Tree foliage (lighter than bank green)
                ctx.fillStyle = '#90EE90'; // Light green
                // Draw three triangles for fuller tree
                for (let i = 0; i < 3; i++) {
                    const yOffset = i * 5;
                    const width = this.width - (i * 3); // Gets narrower at top
                    ctx.beginPath();
                    ctx.moveTo(this.x + this.width/2 - width/2, this.y + 5 - yOffset);
                    ctx.lineTo(this.x + this.width/2 + width/2, this.y + 5 - yOffset);
                    ctx.lineTo(this.x + this.width/2, this.y - 8 - yOffset);
                    ctx.closePath();
                    ctx.fill();
                }
            } else {
                // Wider house
                // House base
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(this.x, this.y, this.width, 15);
                
                // Roof
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.moveTo(this.x - 3, this.y);
                ctx.lineTo(this.x + this.width + 3, this.y);
                ctx.lineTo(this.x + this.width/2, this.y - 10);
                ctx.closePath();
                ctx.fill();
                
                // Door
                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + this.width/2 - 2, this.y + 5, 4, 10);
                
                // Windows
                ctx.fillStyle = '#ADD8E6';
                ctx.fillRect(this.x + 4, this.y + 3, 5, 5);
                ctx.fillRect(this.x + this.width - 9, this.y + 3, 5, 5);
            }
        } else if (this.type === 'fuel') {
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
        if (this.type === 'road') {
            // Roads can't be collected or destroyed
            return;
        }
        if (this.type === 'decoration') {
            game.score += 75; // Points for shooting decorations
        } else if (this.type === 'fuel') {
            game.player.fuel = Math.min(100, game.player.fuel + 30);
            game.score += 50; // Add points for collecting fuel
        } else {
            game.score += 100;
        }
    }
}
