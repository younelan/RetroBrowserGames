class Fighter {
    constructor(game, color, startX, spriteName = 'knight_sprites.png') {
        this.game = game;
        this.color = color;
        this.x = startX;
        this.baseY = 600;
        this.y = this.baseY;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.accel = 1800;
        this.friction = 0.88;
        this.gravity = 2800;
        this.jumpPower = -1400;

        this.moveIntent = 0;
        this.isOnGround = true;
        this.isDucking = false;
        this.direction = 1;

        this.health = 100;
        this.stamina = 100;
        this.state = 'idle';
        this.animTimer = 0;
        this.hasHit = false;
        this.attackCooldown = 0;

        // Sprite System
        this.spriteReady = false;
        this.processedCanvas = null;
        this.flash = 0;
        this.tileSize = 160; // 640 / 4

        this.spriteSheet = new Image();
        this.spriteSheet.src = spriteName;

        this.spriteSheet.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = this.spriteSheet.naturalWidth;
            canvas.height = this.spriteSheet.naturalHeight;
            const pctx = canvas.getContext('2d', { willReadFrequently: true });
            pctx.drawImage(this.spriteSheet, 0, 0);

            const imgData = pctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                // Precise green chroma key (#05FC00)
                if (d[i + 1] > 165 && d[i] < 140 && d[i + 2] < 140) d[i + 3] = 0;
            }
            pctx.putImageData(imgData, 0, 0);
            this.processedCanvas = canvas;
            this.spriteReady = true;
        };

        // 4x4 Grid Mapping (Indices 0-15)
        this.animations = {
            idle: [0, 1, 2, 3],
            walk: [4, 5, 6, 7],
            jump: [8],
            apex: [9],
            land: [10],
            crouch: [11],
            attack_high: [12],
            attack_mid: [13],
            attack_low: [14],
            kick: [14],
            hit: [15]
        };
    }

    update(dt) {
        if (this.state === 'dead') return;
        if (this.flash > 0) this.flash -= dt * 10;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        this.animTimer += dt;

        // 1. Horizontal Movement
        if (this.moveIntent !== 0 && (this.state === 'idle' || this.state === 'walk')) {
            this.vx += this.moveIntent * this.accel * dt;
            this.state = 'walk';
        }

        // 2. Physics & Friction (Always applies)
        this.vx *= this.friction;
        this.x += this.vx * dt;

        // 3. Grounded Facing Logic: Always face the opponent
        if (this.isOnGround && this.state !== 'dead') {
            const opp = this.game.p1 === this ? this.game.p2 : this.game.p1;
            if (opp) this.direction = (opp.x > this.x) ? 1 : -1;
        }

        // 4. Idle Transition
        if (Math.abs(this.vx) < 15 && this.moveIntent === 0 && this.state === 'walk') {
            this.state = 'idle';
        }

        // 5. Air Physics & States
        if (!this.isOnGround) {
            this.vy += this.gravity * dt;
            this.y += this.vy * dt;
            if (this.vy < -400) this.state = 'jump';
            else if (Math.abs(this.vy) < 400) this.state = 'apex';
            else this.state = 'land';

            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.vy = 0;
                this.isOnGround = true;
                this.state = 'idle';
            }
        }

        if (this.isDucking && this.isOnGround) this.state = 'crouch';

        // 6. Combat State Recovery
        if (this.state === 'attack' || this.state === 'kick' || this.state === 'hit') {
            const limit = this.state === 'hit' ? 0.45 : 0.6;
            if (this.animTimer > limit) {
                this.state = 'idle';
                this.animTimer = 0;
                this.hasHit = false;
                this.attackCooldown = 0.2;
            }
        }

        this.stamina = Math.min(100, this.stamina + 25 * dt);
        this.updateUI();
        this.x = Math.max(80, Math.min(this.game.width - 80, this.x));
    }

    jump() {
        if (this.isOnGround && this.state !== 'dead') {
            this.vy = this.jumpPower;
            this.isOnGround = false;
            this.animTimer = 0;
        }
    }

    duck() { if (this.isOnGround && this.state !== 'dead') this.isDucking = true; }

    takeDamage(amount) {
        this.health -= amount;
        this.state = 'hit'; this.animTimer = 0; this.flash = 1.0;
        if (this.health <= 0) { this.health = 0; this.state = 'dead'; }
    }

    updateUI() {
        const id = this.color === 'white' ? 'p1' : 'p2';
        const h = document.getElementById(`${id}-health`);
        const s = document.getElementById(`${id}-stamina`);
        if (h) h.style.width = `${this.health}%`;
        if (s) s.style.width = `${this.stamina}%`;
    }

    attack(type) {
        if (this.state !== 'idle' && this.state !== 'walk') return;
        if (this.stamina < 20 || !this.isOnGround || this.attackCooldown > 0) return;

        this.state = (type === 'kick') ? 'kick' : 'attack';
        this.attackType = type;
        this.stamina -= 30;
        this.animTimer = 0;
        this.hasHit = false;
    }

    draw(ctx) {
        if (!this.spriteReady || !this.processedCanvas) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        // Universal Flip Logic: Sprites face RIGHT in sheet. 
        // scale(1, 1) = Right, scale(-1, 1) = Left.
        ctx.scale(this.direction, 1);

        let animName = this.state;
        if (this.state === 'attack') animName = 'attack_' + this.attackType;
        const anim = this.animations[animName] || this.animations['idle'];

        // Frame Cycle (Slightly faster walk)
        const speed = (this.state === 'walk') ? 12 : 8;
        const fIdx = anim[Math.floor(this.animTimer * speed) % anim.length];

        const col = fIdx % 4;
        const row = Math.floor(fIdx / 4);

        // CROP ADJUSTMENT: Removing 3px border to avoid grid lines
        const sx = col * this.tileSize + 3;
        const sy = row * this.tileSize + 3;
        const sw = this.tileSize - 6;
        const sh = this.tileSize - 6;

        // World Scale (Characters look natural at 320x320 world space)
        const scale = 320 / 154; // 154px cropped source -> 320px world
        const dw = sw * scale;
        const dh = sh * scale;

        // Anchor: Bottom-Center (offset to ground feet properly)
        const ox = -dw / 2;
        const oy = -dh + 10;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(0, 0, 75, 16, 0, 0, Math.PI * 2); ctx.fill();

        if (this.flash > 0 && Math.floor(Date.now() / 40) % 2 === 0) {
            ctx.shadowBlur = 40; ctx.shadowColor = '#fff';
        }

        ctx.drawImage(this.processedCanvas, sx, sy, sw, sh, ox, oy, dw, dh);
        ctx.restore();
    }
}
