export class Player {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.speed = 5;
        this.lives = 5;
        this.fuel = 100;
        this.fuelConsumption = 0.1;
        this.bullets = [];
        this.shootCooldown = 0;
        this.shootCooldownTime = 10;
        
        this.resetPosition();
    }

    resetPosition() {
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height * 2;
    }

    update() {
        // Update fuel
        this.fuel -= this.fuelConsumption;
        if (this.fuel <= 0) {
            this.game.gameOver = true;
            return;
        }

        // Move player based on input
        if (this.game.inputManager.isMovingLeft()) {
            this.x -= this.speed;
        }
        if (this.game.inputManager.isMovingRight()) {
            this.x += this.speed;
        }
        if (this.game.inputManager.isMovingUp()) {
            this.y -= this.speed;
        }
        if (this.game.inputManager.isMovingDown()) {
            this.y += this.speed * 0.8; // Slightly slower going down
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

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= 10;
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
        // Draw player
        this.game.ctx.fillStyle = '#0f0';
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(this.x + this.width / 2, this.y);
        this.game.ctx.lineTo(this.x + this.width, this.y + this.height);
        this.game.ctx.lineTo(this.x, this.y + this.height);
        this.game.ctx.closePath();
        this.game.ctx.fill();

        // Draw bullets
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
