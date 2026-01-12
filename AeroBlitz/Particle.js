import GameSprite from './GameSprite.js';

export default class Particle extends GameSprite {
    constructor(x, y, color) {
        super(x, y, Math.random() * 8 + 3, 0, color);
        this.speedX = (Math.random() - 0.5) * 250;
        this.speedY = (Math.random() - 0.5) * 250;
        this.life = 1;
    }
    update(deltaTime) {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
        this.life -= deltaTime * 1.5;
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, 'white');
        grad.addColorStop(0.4, this.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.restore();
    }
}