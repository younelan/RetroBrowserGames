import GameSprite from './GameSprite.js';

export default class PowerUp extends GameSprite {
    constructor(x, y) {
        super(x, y, 25, 100, '#ffff00');
        this.angle = 0;
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();
        const grad = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, this.color);
        grad.addColorStop(1, '#c90');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 * window.scaleFactor;
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 15 * window.scaleFactor;
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.rect( -s / 2, -s / 2, s, s);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${s*0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', 0, 0);
        ctx.restore();
    }
    update(deltaTime) {
        this.y += this.speed * deltaTime;
        this.angle += 2 * deltaTime;
    }
}