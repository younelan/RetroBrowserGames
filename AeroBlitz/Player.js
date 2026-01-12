import GameSprite from './GameSprite.js';
import Projectile from './Projectile.js';

export default class Player extends GameSprite {
    constructor() {
        super(window.PLAYER_SETTINGS.x, window.PLAYER_SETTINGS.screenY, window.PLAYER_SETTINGS.size);
        this.y = window.PLAYER_SETTINGS.screenY; // This will be updated each frame, screen-relative
        this.targetX = this.x;
        this.targetY = this.y; // Initialize targetY as screen-relative
        this.weaponLevel = window.PLAYER_SETTINGS.weaponLevel;
        this.shootCooldown = 0;
        this.isHit = false;
        this.hitTimer = 0;
        this.health = 100;
        this.maxHealth = 100;
    }

    draw() {
        if (this.isHit && Math.floor(this.hitTimer / 5) % 2 === 0) return;

        const s = this.size * window.scaleFactor;
        const ctx = window.ctx;

        ctx.save();
        // Translate using player's screen-relative Y position
        ctx.translate(this.x * window.scaleFactor, this.y * window.scaleFactor);

        // --- Main Hull ---
        // Dark metallic base
        let grad = ctx.createLinearGradient(0, -s * 1.2, 0, s * 0.9);
        grad.addColorStop(0, '#555');
        grad.addColorStop(0.3, '#333');
        grad.addColorStop(0.7, '#222');
        grad.addColorStop(1, '#111');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, -s * 1.2); // Nose tip
        ctx.lineTo(-s * 0.4, -s * 0.2); // Left shoulder
        ctx.lineTo(-s * 0.7, s * 0.3); // Left wing mid
        ctx.lineTo(-s * 0.9, s * 0.8); // Left wing tip
        ctx.lineTo(0, s * 0.7); // Tail center
        ctx.lineTo(s * 0.9, s * 0.8); // Right wing tip
        ctx.lineTo(s * 0.7, s * 0.3); // Right wing mid
        ctx.lineTo(s * 0.4, -s * 0.2); // Right shoulder
        ctx.closePath();
        ctx.fill();

        // Lighter metallic top surface with sharp highlight
        grad = ctx.createLinearGradient(0, -s * 1.0, 0, s * 0.5);
        grad.addColorStop(0, '#ccc');
        grad.addColorStop(0.2, '#888');
        grad.addColorStop(0.4, '#555');
        grad.addColorStop(0.41, '#eee'); // Sharp highlight
        grad.addColorStop(0.5, '#888');
        grad.addColorStop(1, '#444');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.0); // Nose tip
        ctx.lineTo(-s * 0.3, -s * 0.1);
        ctx.lineTo(-s * 0.5, s * 0.2);
        ctx.lineTo(0, s * 0.4);
        ctx.lineTo(s * 0.5, s * 0.2);
        ctx.lineTo(s * 0.3, -s * 0.1);
        ctx.closePath();
        ctx.fill();

        // Outline and panel lines
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1 * window.scaleFactor;
        ctx.stroke();

        // Cockpit - Dark, reflective, integrated
        grad = ctx.createLinearGradient(0, -s * 0.7, 0, -s * 0.3);
        grad.addColorStop(0, '#003366');
        grad.addColorStop(0.5, '#006699');
        grad.addColorStop(1, '#003366');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.6, s * 0.15, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#001122';
        ctx.stroke();

        // Side Weapon Pods - smaller details
        const podSize = s * 0.2;
        const podOffset = s * 0.6;
        const podY = s * 0.2;
        for (let i = -1; i <= 1; i += 2) {
            ctx.save();
            ctx.translate(podOffset * i, podY);
            grad = ctx.createLinearGradient(-podSize, 0, podSize, 0);
            grad.addColorStop(0, '#444');
            grad.addColorStop(0.5, '#888');
            grad.addColorStop(1, '#444');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, podSize * 0.5, podSize * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.stroke();
            ctx.restore();
        }

        // Engine Exhaust - Multi-layered, turbulent
        const exhaustCoreY = s * 0.6;
        const exhaustOuterY = s * 1.5;

        // Outer exhaust glow (red-orange, very translucent)
        grad = ctx.createRadialGradient(0, exhaustCoreY, 0, 0, exhaustCoreY, s * 0.8);
        grad.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
        grad.addColorStop(0.5, 'rgba(255, 50, 0, 0.1)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, exhaustCoreY + s * 0.2, s * 0.6, s * 1.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mid flame (yellow-orange, more defined cone)
        grad = ctx.createLinearGradient(0, exhaustCoreY, 0, exhaustOuterY);
        grad.addColorStop(0, 'yellow');
        grad.addColorStop(0.6, 'orange');
        grad.addColorStop(1, 'rgba(255, 100, 0, 0.5)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, exhaustCoreY);
        ctx.quadraticCurveTo(-s * 0.35, exhaustCoreY + s * 0.4, -s * 0.15, exhaustOuterY);
        ctx.lineTo(s * 0.15, exhaustOuterY);
        ctx.quadraticCurveTo(s * 0.35, exhaustCoreY + s * 0.4, s * 0.25, exhaustCoreY);
        ctx.closePath();
        ctx.fill();

        // Inner core flame (bright white-blue, sharp)
        grad = ctx.createRadialGradient(0, exhaustCoreY + s * 0.1, 0, 0, exhaustCoreY + s * 0.1, s * 0.1);
        grad.addColorStop(0, 'white');
        grad.addColorStop(0.5, '#00ccff');
        grad.addColorStop(1, 'rgba(0,0,255,0.7)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, exhaustCoreY + s * 0.1, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    update(deltaTime, levelManager) {
        // Player's screen-relative position is updated here
        this.x += (this.targetX - this.x) * window.PLAYER_SETTINGS.lerpFactor;
        this.y += (this.targetY - this.y) * window.PLAYER_SETTINGS.lerpFactor;
        
        // Keep player within screen bounds in screen coordinates
        this.x = Math.max(this.size / 2, Math.min(window.NATIVE_WIDTH - this.size / 2, this.x));
        this.y = Math.max(this.size / 2, Math.min(window.NATIVE_HEIGHT - this.size / 2, this.y));

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.isHit) {
            this.hitTimer--;
            if (this.hitTimer <= 0) this.isHit = false;
        }
    }

    shoot() {
        if (this.isHit) return; // Prevent shooting when hit

        if (this.shootCooldown === 0) {
            const fireRate = 10;
            const projSpeed = 700;
            const playerWorldY = this.y + window.levelManager.scrollOffset; // Player's Y in world coordinates
            switch (this.weaponLevel) {
                case 1: window.projectiles.push(new Projectile(this.x, playerWorldY - this.size, 10, 0, projSpeed)); break;
                case 2:
                    window.projectiles.push(new Projectile(this.x - 10, playerWorldY, 10, 0, projSpeed));
                    window.projectiles.push(new Projectile(this.x + 10, playerWorldY, 10, 0, projSpeed));
                    break;
                case 3:
                    window.projectiles.push(new Projectile(this.x, playerWorldY - this.size, 10, 0, projSpeed));
                    window.projectiles.push(new Projectile(this.x - 18, playerWorldY, 10, -100, projSpeed));
                    window.projectiles.push(new Projectile(this.x + 18, playerWorldY, 10, 100, projSpeed));
                    break;
                case 4:
                    window.projectiles.push(new Projectile(this.x, playerWorldY - this.size, 12, 0, projSpeed));
                    window.projectiles.push(new Projectile(this.x - 25, playerWorldY, 12, -150, projSpeed));
                    window.projectiles.push(new Projectile(this.x + 25, playerWorldY, 12, 150, projSpeed));
                    break;
            }
            this.shootCooldown = fireRate;
        }
    }
    upgradeWeapon() {
        if (this.weaponLevel < window.PLAYER_SETTINGS.maxWeaponLevel) this.weaponLevel++;
    }
}