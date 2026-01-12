import GameSprite from './GameSprite.js';
import EnemyProjectile from './EnemyProjectile.js';

export default class Enemy extends GameSprite {
    constructor(x, y, size, speed, health, color) {
        super(x, y, size, speed, color);
        this.health = health;
        this.shootCooldown = Math.random() * 100 + 50;
    }
    update(deltaTime) {
        this.y += this.speed * deltaTime;
        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shoot();
        }
    }
    shoot() {
        const projSpeed = 200;
        window.enemyProjectiles.push(new EnemyProjectile(this.x, this.y, 10, 0, projSpeed));
        this.shootCooldown = Math.random() * 100 + 100; // Reset cooldown
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.fillStyle = this.color;
        ctx.fillRect( -s / 2, -s / 2, s, s);
    }
}