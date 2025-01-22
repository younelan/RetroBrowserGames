export class Player {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.speed = 300; // Units per second instead of per frame
        this.lives = 5;
        this.fuel = 100;
        this.fuelConsumption = 6; // Per second instead of per frame
        this.bullets = [];
        this.shootCooldown = 0;
        this.shootCooldownTime = 10;
        this.bulletSpeed = 600; // Units per second
        
        this.resetPosition();
    }

    resetPosition() {
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height * 2;
    }

    update(dt) {
        // Update fuel using deltaTime
        this.fuel -= this.fuelConsumption * dt;
        if (this.fuel <= 0) {
            this.game.gameOver = true;
            return;
        }

        // Move player based on input using deltaTime
        if (this.game.inputManager.isMovingLeft()) {
            this.x -= this.speed * dt;
        }
        if (this.game.inputManager.isMovingRight()) {
            this.x += this.speed * dt;
        }
        if (this.game.inputManager.isMovingUp()) {
            this.y -= this.speed * dt;
        }
        if (this.game.inputManager.isMovingDown()) {
            this.y += this.speed * 0.8 * dt; // Slightly slower going down
        }

        // Keep player within screen bounds
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.game.height - this.height, this.y));

        // Check collision with corridor walls
        const currentSegment = this.game.corridorManager.getCurrentSegment(this.y);
        if (currentSegment) {
            if (this.x < currentSegment.leftWall || 
                this.x + this.width > currentSegment.leftWall + currentSegment.width) {
                this.lives--;
                if (this.lives <= 0) {
                    this.game.gameOver = true;
                } else {
                    this.resetPosition();
                }
            }
        }

        // Update shooting cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Handle shooting
        if (this.game.inputManager.isShooting() && this.shootCooldown === 0) {
            this.shoot();
        }

        // Update bullets using deltaTime
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= this.bulletSpeed * dt;
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot() {
        this.bullets.push({
            x: this.x + this.width / 2 - 2,
            y: this.y,
            width: 4,
            height: 10
        });
        this.shootCooldown = this.shootCooldownTime;
    }    

    draw() {
        // Save context state
        this.game.ctx.save();
        this.game.ctx.translate(this.x + this.width/2, this.y + this.height/2);

        // Draw plane body (white)
        this.game.ctx.fillStyle = '#fff';
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(0, -this.height/2); // Nose
        this.game.ctx.lineTo(this.width/4, -this.height/4); // Right nose taper
        this.game.ctx.lineTo(this.width/4, this.height/3); // Right side
        this.game.ctx.lineTo(0, this.height/2); // Tail
        this.game.ctx.lineTo(-this.width/4, this.height/3); // Left side
        this.game.ctx.lineTo(-this.width/4, -this.height/4); // Left nose taper
        this.game.ctx.closePath();
        this.game.ctx.fill();

        // Draw lower wings (slightly darker white)
        this.game.ctx.fillStyle = '#f0f0f0';
        // Right lower wing
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(this.width/4, 0);
        this.game.ctx.lineTo(this.width/2, this.height/4);
        this.game.ctx.lineTo(this.width/4, this.height/2);
        this.game.ctx.closePath();
        this.game.ctx.fill();
        // Left lower wing
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-this.width/4, 0);
        this.game.ctx.lineTo(-this.width/2, this.height/4);
        this.game.ctx.lineTo(-this.width/4, this.height/2);
        this.game.ctx.closePath();
        this.game.ctx.fill();

        // Draw upper wings (light gray for depth)
        this.game.ctx.fillStyle = '#e0e0e0';
        // Right upper wing (wider)
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(this.width/4, -this.height/4);
        this.game.ctx.lineTo(this.width/1.5, 0);
        this.game.ctx.lineTo(this.width/4, this.height/4);
        this.game.ctx.closePath();
        this.game.ctx.fill();
        // Left upper wing (wider)
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(-this.width/4, -this.height/4);
        this.game.ctx.lineTo(-this.width/1.5, 0);
        this.game.ctx.lineTo(-this.width/4, this.height/4);
        this.game.ctx.closePath();
        this.game.ctx.fill();

        // Draw bullets
        this.game.ctx.restore(); // Restore context for bullets
        this.game.ctx.fillStyle = '#ff0';
        this.bullets.forEach(bullet => {
            this.game.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
