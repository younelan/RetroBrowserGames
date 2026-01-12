import Enemy from './Enemy.js';

export default class HeavyCruiser extends Enemy {
    constructor(x, y) {
        super(x, y, 60, 80 + Math.random() * 20 * window.level, 10, '#77a');
        this.vx = (Math.random() - 0.5) * 60;
    }
    update(deltaTime) {
        super.update(deltaTime);
        this.x += this.vx * deltaTime;
        if (this.x < this.size / 2 || this.x > window.NATIVE_WIDTH - this.size / 2) this.vx *= -1;
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();

        // Main Hull (large, blocky, metallic)
        let grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, '#556');
        grad.addColorStop(0.5, '#778');
        grad.addColorStop(1, '#445');
        ctx.fillStyle = grad;
        ctx.fillRect(-s * 0.8, -s * 0.6, s * 1.6, s * 1.2);

        // Command Bridge (top center)
        ctx.fillStyle = '#334';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.7, s * 0.4, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Weapon pods/turrets (sides)
        ctx.fillStyle = '#889';
        ctx.beginPath();
        ctx.rect(-s * 0.9, -s * 0.4, s * 0.2, s * 0.8);
        ctx.rect(s * 0.7, -s * 0.4, s * 0.2, s * 0.8);
        ctx.fill();

        // Engine Thrusters (back)
        ctx.fillStyle = '#00aaff'; // Blue glow
        ctx.beginPath();
        ctx.ellipse(-s * 0.4, s * 0.7, s * 0.2, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.4, s * 0.7, s * 0.2, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}