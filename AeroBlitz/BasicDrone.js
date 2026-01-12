import Enemy from './Enemy.js';

export default class BasicDrone extends Enemy {
    constructor(x, y) {
        super(x, y, 35, 150 + Math.random() * 50 * window.level, 3, '#c44');
    }
    draw() {
        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;
        ctx.save();

        // Main Body (more metallic and rounded)
        let grad = ctx.createLinearGradient(0, -s, 0, s);
        grad.addColorStop(0, '#888');
        grad.addColorStop(0.5, '#555');
        grad.addColorStop(1, '#333');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.7, s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit/Canopy (darker, reflective)
        grad = ctx.createLinearGradient(0, -s * 0.5, 0, 0);
        grad.addColorStop(0, '#003366');
        grad.addColorStop(1, '#006699');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.4, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine Exhaust (subtle glow)
        grad = ctx.createRadialGradient(0, s * 0.8, 0, 0, s * 0.8, s * 0.5);
        grad.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
        grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.8, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings/Side elements (subtle and sharp)
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, 0);
        ctx.lineTo(-s * 1.1, s * 0.3);
        ctx.lineTo(-s * 0.7, s * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(s * 0.7, 0);
        ctx.lineTo(s * 1.1, s * 0.3);
        ctx.lineTo(s * 0.7, s * 0.4);
        ctx.closePath();
        ctx.fill();


        ctx.restore();
    }
}