import Enemy from './Enemy.js';

export default class FastScout extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 300 + 50 * window.level, 2, '#94c');
        this.zigZag = Math.random() * 100;
    }
    update(deltaTime) {
        super.update(deltaTime);
        this.x += Math.sin(this.y / 30 + this.zigZag) * 120 * deltaTime;
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();

        // Main Body (triangular, metallic with a slight purple hue)
        let grad = ctx.createLinearGradient(0, -s, 0, s * 0.5);
        grad.addColorStop(0, '#aaa');
        grad.addColorStop(0.5, '#777');
        grad.addColorStop(1, '#555');
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.moveTo(0, -s);      // Top point
        ctx.lineTo(s * 0.8, s * 0.5);  // Bottom right
        ctx.lineTo(-s * 0.8, s * 0.5); // Bottom left
        ctx.closePath();
        ctx.fill();

        // Cockpit/Canopy (darker, reflective)
        grad = ctx.createLinearGradient(0, -s * 0.7, 0, -s * 0.2);
        grad.addColorStop(0, '#001122');
        grad.addColorStop(1, '#003366');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.7);
        ctx.lineTo(s * 0.3, -s * 0.2);
        ctx.lineTo(-s * 0.3, -s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Engine Thrusters (small, at the back)
        ctx.fillStyle = '#ff9900'; // Orange glow
        ctx.beginPath();
        ctx.ellipse(-s * 0.4, s * 0.4, s * 0.15, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.4, s * 0.4, s * 0.15, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}