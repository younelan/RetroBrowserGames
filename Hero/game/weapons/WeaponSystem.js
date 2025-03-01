class WeaponSystem {
    constructor() {
        this.laser = new Laser();
        this.dynamites = [];
        this.explosions = [];
    }

    update(deltaTime, player, level) {
        // Update laser
        if (this.laser.active) {
            this.laser.update(deltaTime, player, level);
        }

        // Update dynamites
        for (let i = this.dynamites.length - 1; i >= 0; i--) {
            const dynamite = this.dynamites[i];
            if (dynamite.update(deltaTime)) {
                // Dynamite exploded
                this.explosions.push(dynamite.createExplosion());
                this.dynamites.splice(i, 1);
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.timeLeft -= deltaTime;
            if (explosion.timeLeft <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }

    render(ctx, cameraX, cameraY) {
        // Render laser
        if (this.laser.active) {
            this.laser.render(ctx, player, cameraX, cameraY);
        }

        // Render dynamites
        this.dynamites.forEach(dynamite => {
            dynamite.render(ctx, cameraX, cameraY);
        });

        // Render explosions
        this.explosions.forEach(explosion => {
            this.renderExplosion(ctx, explosion, cameraX, cameraY);
        });
    }

    renderExplosion(ctx, explosion, cameraX, cameraY) {
        const progress = explosion.timeLeft / explosion.duration;
        const x = explosion.x - cameraX;
        const y = explosion.y - cameraY;
        const radius = explosion.radius;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${progress})`);
        gradient.addColorStop(0.2, `rgba(255, 200, 0, ${progress * 0.8})`);
        gradient.addColorStop(0.4, `rgba(255, 100, 0, ${progress * 0.6})`);
        gradient.addColorStop(0.8, `rgba(255, 50, 0, ${progress * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    addDynamite(x, y) {
        if (this.dynamites.length < 3) {
            this.dynamites.push(new Dynamite(x, y));
        }
    }

    setLaserActive(active) {
        this.laser.active = active;
    }

    getExplosions() {
        return this.explosions;
    }
}

window.WeaponSystem = WeaponSystem;