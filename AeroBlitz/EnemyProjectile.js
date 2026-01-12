import GameSprite from './GameSprite.js';

export default class EnemyProjectile extends GameSprite {
    constructor(x, y, size, vx, vy, color = '#FF0000') {
        super(x, y, size, 0, color);
        this.vx = vx;
        this.vy = vy;
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();

        // Laser beam
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.fillRect(-s / 4, -s, s / 2, s * 2);

        ctx.restore();
    }
    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.x += this.vx * deltaTime;
    }
}
