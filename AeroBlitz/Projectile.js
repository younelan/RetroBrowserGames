import GameSprite from './GameSprite.js';

export default class Projectile extends GameSprite {
    constructor(x, y, size, vx, vy, color = '#00FFFF') {
        super(x, y, size, 0, color);
        this.vx = vx;
        this.vy = -vy;
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();

        // Laser beam
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(-s / 4, -s, s / 2, s * 2);

        ctx.restore();
    }
    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.x += this.vx * deltaTime;
    }
}