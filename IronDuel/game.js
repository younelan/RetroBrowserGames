class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 14;
        this.vy = (Math.random() - 0.5) * 14 - 6;
        this.life = 1.0; this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    update(dt) {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.5; this.life -= dt * 1.8;
    }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color; ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800; this.height = 800;
        this.lastTime = 0; this.gameState = 'play';
        this.timer = 99; this.timerCounter = 0;

        // VFX & State
        this.particles = [];
        this.leaves = [];
        this.shake = 0;
        this.hitStop = 0;
        this.camera = { x: 0, y: 0, zoom: 1.0, targetZoom: 1.0 };

        // Assets (Random Arena)
        this.bg = new Image();
        const arenaCount = 3;
        const arenaId = Math.floor(Math.random() * arenaCount) + 1;
        this.bg.src = `bg${arenaId}.png`;

        this.init();
    }

    init() {
        this.resize();

        // Random Enemy Selection (The Rogue's Gallery)
        const enemies = [
            'enemy_samurai.png',
            'enemy_paladin.png',
            'enemy_beastmaster.png',
            'enemy_void_knight.png',
            'enemy_viking.png'
        ];
        const enemySprite = enemies[Math.floor(Math.random() * enemies.length)];

        this.p1 = new Fighter(this, 'white', 250, 'knight_sprites.png');
        this.p2 = new Fighter(this, 'black', 550, enemySprite);

        // Initial Facing
        this.p1.direction = 1;
        this.p2.direction = -1;

        this.input = new InputHandler(this);

        // Pre-populate leaves
        for (let i = 0; i < 15; i++) this.spawnLeaf(true);

        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    updateStatus(msg) {
        const el = document.getElementById('status-msg');
        if (el) el.textContent = msg.toUpperCase();
    }

    loop(timestamp) {
        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.hitStop > 0) {
            this.hitStop -= dt;
        } else {
            this.update(dt);
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.timerCounter += dt;
        if (this.timerCounter >= 1) {
            this.timer = Math.max(0, this.timer - 1);
            this.timerCounter = 0;
            const tEl = document.getElementById('match-timer');
            if (tEl) tEl.textContent = this.timer;
        }

        this.input.update();

        const p1G = this.p1.isOnGround;
        const p2G = this.p2.isOnGround;

        this.p1.update(dt);
        this.p2.update(dt);

        // 1. DYNAMIC CAMERA
        const midX = (this.p1.x + this.p2.x) / 2;
        const dist = Math.abs(this.p1.x - this.p2.x);
        this.camera.targetZoom = Math.max(0.8, 1.4 - (dist / 800));
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.05;
        this.camera.x += (midX - 400 - this.camera.x) * 0.1;

        if (!p1G && this.p1.isOnGround) this.spawnDust(this.p1.x, this.p1.y);
        if (!p2G && this.p2.isOnGround) this.spawnDust(this.p2.x, this.p2.y);

        // AI SENSES & TRACKING
        if (this.p2.state !== 'dead' && this.p1.state !== 'dead') {
            const dist = this.p1.x - this.p2.x;
            const absD = Math.abs(dist);

            // ALWAYS FACE PLAYER
            this.p2.direction = dist > 0 ? 1 : -1;

            if (absD > 150) {
                this.p2.moveIntent = dist > 0 ? 1 : -1;
                this.p2.isDucking = false; // Don't duck while chasing
            } else {
                this.p2.moveIntent = 0;
                // Aggressive decision making
                if (Math.random() < 0.06) {
                    const m = ['high', 'mid', 'low', 'kick'];
                    this.p2.attack(m[Math.floor(Math.random() * m.length)]);
                }
                // Toggle ducking but don't stay down forever
                if (this.p2.isDucking && Math.random() < 0.1) this.p2.isDucking = false;
                if (!this.p2.isDucking && Math.random() < 0.03) this.p2.isDucking = true;

                if (Math.random() < 0.015) this.p2.jump();
            }
        }

        if (this.p1.health <= 0 || this.p2.health <= 0 || this.timer <= 0) this.endGame();
        this.checkCollisions();

        // VFX Update
        this.particles = this.particles.filter(p => { p.update(dt); return p.life > 0; });
        this.leaves.forEach(l => {
            l.x += l.vx; l.y += l.vy; l.rot += l.vr;
            if (l.y > 600) { Object.assign(l, this.createLeafData()); l.y = -20; }
        });

        if (this.shake > 0) this.shake -= dt * 45;
    }

    createLeafData() {
        return {
            x: Math.random() * 800, y: -20,
            vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2,
            rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.1,
            size: 4 + Math.random() * 4,
            color: Math.random() > 0.5 ? '#b71c1c' : '#e65100'
        };
    }

    spawnLeaf(randomY = false) {
        const l = this.createLeafData();
        if (randomY) l.y = Math.random() * 600;
        this.leaves.push(l);
    }

    spawnSparks(x, y) {
        for (let i = 0; i < 20; i++) {
            const p = new Particle(x, y, i > 15 ? '#fff' : '#e8eef1');
            p.vx = (Math.random() - 0.5) * 55;
            p.vy = (Math.random() - 1) * 35;
            p.size = 1 + Math.random() * 3;
            this.particles.push(p);
        }
    }

    spawnDust(x, y) {
        for (let i = 0; i < 8; i++) {
            const p = new Particle(x, y, 'rgba(150,150,160,0.4)');
            p.vy = -Math.random() * 2.5; p.vx = (Math.random() - 0.5) * 6;
            this.particles.push(p);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, 800, 800);

        // --- IRON ANCHORED VIEW ---
        this.ctx.save();
        // Camera setup with dynamic impact shake & zoom focus
        const focusZoom = this.hitStop > 0 ? 1.15 : 1.0;
        this.ctx.translate(400, 300);
        this.ctx.scale(this.camera.zoom * focusZoom, this.camera.zoom * focusZoom);

        const shakeX = (Math.random() - 0.5) * this.shake;
        const shakeY = (Math.random() - 0.5) * this.shake;
        this.ctx.translate(-400 - this.camera.x + shakeX, -300 + shakeY);

        // LOCKED BACKGROUND
        if (this.bg && this.bg.complete) {
            this.ctx.drawImage(this.bg, this.camera.x - 400, -200, 1600, 1000);
        } else {
            this.ctx.fillStyle = '#050506'; this.ctx.fillRect(this.camera.x - 800, 0, 2400, 800);
        }

        // METALLIC ARENA FLOOR
        const floorY = 600;
        const groundG = this.ctx.createLinearGradient(0, floorY, 0, 800);
        groundG.addColorStop(0, '#1a1c1e'); groundG.addColorStop(1, '#050506');
        this.ctx.fillStyle = groundG;
        this.ctx.fillRect(this.camera.x - 1200, floorY, 3200, 300);

        // HI-FI GRASS (Now sparse industrial rubble/tufts)
        this.ctx.save();
        for (let i = -40; i < 60; i++) {
            const gx = i * 40 - (this.camera.x * 0.1 % 40);
            const seed = (i * 999.9) % 1;
            this.ctx.strokeStyle = seed > 0.5 ? '#2a2d30' : '#1a1c1e';
            this.ctx.lineWidth = 1.2;
            this.ctx.beginPath();
            const h = 8 + seed * 8;
            this.ctx.moveTo(gx, floorY);
            this.ctx.lineTo(gx + (seed - 0.5) * 5, floorY - h);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // SHADOWS
        const drawS = (p) => {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.beginPath(); this.ctx.ellipse(p.x, floorY + 5, 45, 12, 0, 0, 6.28); this.ctx.fill();
            this.ctx.restore();
        };
        drawS(this.p1); drawS(this.p2);

        this.p1.draw(this.ctx); this.p2.draw(this.ctx);
        this.particles.forEach(p => p.draw(this.ctx));

        const fG = this.ctx.createLinearGradient(0, floorY - 50, 0, floorY + 50);
        fG.addColorStop(0, 'rgba(10,12,14,0)'); fG.addColorStop(1, 'rgba(5,5,6,0.7)');
        this.ctx.fillStyle = fG; this.ctx.fillRect(this.camera.x - 1200, floorY - 50, 3200, 150);

        this.ctx.restore(); // END WORLD

        // METAL SPEEDLINES (UI Space)
        if (Math.abs(this.p1.vx) > 900 || this.shake > 20) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(232, 238, 241, 0.15)';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 40; i++) {
                const a = Math.random() * 6.28;
                const d = 250 + Math.random() * 300;
                this.ctx.beginPath();
                this.ctx.moveTo(400 + Math.cos(a) * 200, 300 + Math.sin(a) * 200);
                this.ctx.lineTo(400 + Math.cos(a) * d, 300 + Math.sin(a) * d);
                this.ctx.stroke();
            }
            this.ctx.restore();
        }

        // --- CRITICAL IMPACT GLITCH ---
        if (this.shake > 25) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'difference';
            this.ctx.fillStyle = `rgba(255,0,0,${Math.random() * 0.2})`;
            this.ctx.fillRect(0, 0, 800, 600);
            this.ctx.restore();
        }
    }

    checkCollisions() {
        const check = (a, d) => {
            const isS = a.state === 'attack' || a.state === 'kick';
            if (isS && !a.hasHit && a.animTimer > 0.15 && a.animTimer < 0.35) {
                if (d.isDucking && a.attackType === 'high') return;
                if (!d.isOnGround && (a.attackType === 'low' || a.state === 'kick')) return;

                const reach = a.state === 'kick' ? 140 : 125;
                const hX = a.x + (a.direction * reach);
                const hY = a.y - 120;

                if (Math.abs(hX - d.x) < 85 && Math.abs(hY - (d.y - 120)) < 160 && d.state !== 'hit' && d.state !== 'dead') {
                    a.hasHit = true;
                    const isK = a.state === 'kick';
                    d.takeDamage(isK ? 10 : 20);
                    d.vx = a.direction * (isK ? 2200 : 700);
                    this.updateStatus(isK ? "CRUSHING KICK!" : "MASTER STRIKE!");
                    this.spawnBlood(d.x, d.y - 110);
                    this.spawnSparks(hX, hY);
                    this.shake = isK ? 35 : 25;
                    this.hitStop = 0.15;
                }
            }
        };
        check(this.p1, this.p2); check(this.p2, this.p1);
    }

    spawnBlood(x, y) {
        for (let i = 0; i < 15; i++) {
            const p = new Particle(x, y, '#8b0000');
            p.vx = (Math.random() - 0.5) * 20; p.vy = (Math.random() - 0.3) * 15;
            this.particles.push(p);
        }
    }

    endGame() {
        if (this.gameState === 'dead') return;
        this.gameState = 'dead';
        const victory = document.getElementById('overlay-msg');
        const text = document.getElementById('victory-text');
        if (victory && text) {
            victory.classList.remove('hidden');
            if (this.p1.health <= 0) text.textContent = "SENTINEL WINS";
            else if (this.p2.health <= 0) text.textContent = "BARBARIAN WINS";
            else text.textContent = "TIME OUT";
        }
        setTimeout(() => {
            window.addEventListener('pointerdown', () => location.reload(), { once: true });
        }, 1000);
    }
}

window.onload = () => { new Game(); };
