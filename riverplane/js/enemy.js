export class Enemy {
    constructor(x, y, segment) {
        this.x = x;
        this.y = y;
        this.width = 40; // Wider than before
        this.height = 20; // Shorter than before
        // Adjust speed range to be more consistent
        const minSpeed = segment.game.corridorManager.stepSize * 2;
        const maxSpeed = segment.game.corridorManager.stepSize * 4;
        this.speed = (Math.random() * (maxSpeed - minSpeed) + minSpeed) * (Math.random() < 0.5 ? 1 : -1);
        this.segment = segment;
        this.type = Math.random() < 0.5 ? 'boat' : 'helicopter';
        // Animation for helicopter blades
        this.rotorAngle = 0;
    }

    update(dt) {
        if (!dt) return;
        
        // Move with corridor
        this.y += this.segment.game.scrollSpeed * dt;
        
        // Horizontal movement with speed limiting
        const maxDelta = this.segment.width * dt; // Max movement per frame
        const movement = Math.min(Math.abs(this.speed * dt), maxDelta) * Math.sign(this.speed);
        this.x += movement;
        
        // Bounce off walls with dampening
        if (this.x < this.segment.leftWall || 
            this.x + this.width > this.segment.leftWall + this.segment.width) {
            this.speed *= -0.8; // Reduce speed slightly on bounce
            if (this.x < this.segment.leftWall) {
                this.x = this.segment.leftWall;
            } else {
                this.x = this.segment.leftWall + this.segment.width - this.width;
            }
        }
    }

    draw(ctx) {
        // Save context state
        ctx.save();
        
        // Move to enemy position and flip based on direction
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        const facingLeft = this.speed < 0;
        if (facingLeft) {
            ctx.scale(-1, 1);
        }

        if (this.type === 'boat') {
            this.drawBoat(ctx);
        } else {
            this.drawHelicopter(ctx);
        }

        ctx.restore();
    }

    drawBoat(ctx) {
        // Hull (dark brown)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.height/3);
        ctx.lineTo(-this.width/3, this.height/2);
        ctx.lineTo(this.width/3, this.height/2);
        ctx.lineTo(this.width/2, this.height/3);
        ctx.lineTo(this.width/3, 0);
        ctx.lineTo(-this.width/3, 0);
        ctx.closePath();
        ctx.fill();

        // Cabin (lighter brown)
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.rect(-this.width/4, -this.height/3, this.width/2, this.height/3);
        ctx.fill();

        // Windows (black)
        ctx.fillStyle = '#000';
        const windowWidth = this.width/8;
        const windowHeight = this.height/6;
        const windowSpacing = windowWidth * 1.5;
        const startX = -windowSpacing;
        
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(
                startX + (i * windowSpacing),
                -this.height/4,
                windowWidth,
                windowHeight
            );
        }
    }

    drawHelicopter(ctx) {
        // Body (dark gray)
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/3, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail boom
        ctx.fillStyle = '#505050';
        ctx.fillRect(-this.width/2, -this.height/6, this.width/2, this.height/3);

        // Tail rotor
        ctx.fillStyle = '#303030';
        ctx.save();
        ctx.translate(-this.width/2, 0);
        ctx.rotate(this.rotorAngle * 2);
        ctx.fillRect(-this.height/3, -this.height/8, this.height/1.5, this.height/4);
        ctx.restore();

        // Main rotor
        ctx.save();
        ctx.rotate(this.rotorAngle);
        ctx.fillStyle = '#202020';
        ctx.fillRect(-this.width/1.5, -this.height/8, this.width * 1.5, this.height/4);
        ctx.restore();

        // Update rotor animation
        this.rotorAngle += 0.2;
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
}
