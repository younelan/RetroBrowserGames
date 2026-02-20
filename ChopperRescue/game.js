/**
 * CHOPPER RESCUE: DESERT STRIKE
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keys = {}; // Moved to top

// --- GAME CONFIGURATION ---
const CONFIG = {
    WORLD_WIDTH: 15000,
    GRAVITY: 0.15,
    AIR_RESISTANCE: 0.98,
    DAMPING: 0.85,
    ENGINE_POWER: 0.4, // Halved from 0.8 for gradual buildup
    MAX_SPEED: 16,     // Raised for more thrilling flight
    GROUND_Y: 0,
    SAFE_LANDING_SPEED: 4.5,
    SPRITE_SCALE: 0.5,
    TOTAL_SOLDIERS: 64,
    HELICOPTER_CAPACITY: 16,
    MAX_PARTICLES: 150, // Strict mobile cap
    MAX_LIVES: 5
};

const ASSETS = {
    helicopter: 'assets/helicopter_master.png',
    soldier: 'assets/soldier_spritesheet.png',
    tank: 'assets/tank_spritesheet.png',
    barracks: 'assets/barracks.png',
    watchtower: 'assets/watchtower.png',
    sandbags: 'assets/sandbags.png',
    palm_tree: 'assets/palm_tree.png',
    shrub: 'assets/desert_shrub.png',
    cactus: 'assets/palm_tree.png', // Reusing placeholder for now or generating new
    rock: 'assets/sandbags.png',
    world: 'assets/world.svg',
    home_base: 'assets/home_base.png'
};

const IMAGES = {};
let gameActive = false;

// --- STATE MANAGEMENT ---
const GAME_STATE = {
    rescued: 0,
    onboard: 0,
    remaining: CONFIG.TOTAL_SOLDIERS,
    lives: 5,
    gameOver: false,
    touch: { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 },
    messages: [] // For "+1 SECURED" popups
};

// --- HELICOPTER ---
class Helicopter {
    constructor() {
        this.reset();
    }

    reset() {
        // Guarantee viewport and ground scale
        resize();

        this.x = 200;
        this.y = CONFIG.GROUND_Y - 18; // Intermediate grounding
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.facing = 1;
        this.state = 'landed';
        this.onboard = 0;
        this.frame = 0;
        this.animTimer = 0;
        this.explosionFrame = 0;
        this.exfilTimer = 0; // Added for sequential unloading
        this.sessionRescued = 0; // For cumulative +1, +2, +3 messages
    }

    update(dt) {
        if (this.state === 'destroyed') {
            this.animTimer += dt;
            if (this.animTimer > 8) {
                this.explosionFrame = Math.min(3, this.explosionFrame + 1);
                this.animTimer = 0;
            }
            return;
        }

        // Keyboard controls
        if (keys['ArrowUp'] || keys['w']) this.vy -= CONFIG.ENGINE_POWER * 1.2 * dt; // Gradual ascent
        if (keys['ArrowDown'] || keys['s']) this.vy += CONFIG.ENGINE_POWER * 4.0 * dt; // Responsive but gradual descent
        if (keys['ArrowLeft'] || keys['a']) { this.vx -= CONFIG.ENGINE_POWER * 1.0 * dt; this.facing = -1; }
        if (keys['ArrowRight'] || keys['d']) { this.vx += CONFIG.ENGINE_POWER * 1.0 * dt; this.facing = 1; }

        // Touch / Drag controls (Tuned for DT)
        if (GAME_STATE.touch.active) {
            const dx = GAME_STATE.touch.moveX - GAME_STATE.touch.startX;
            const dy = GAME_STATE.touch.moveY - GAME_STATE.touch.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 10) {
                const sensitivity = 0.008; // Significantly reduced
                this.vx += dx * sensitivity * dt;
                this.vy += dy * sensitivity * dt;
                if (dx !== 0) this.facing = Math.sign(dx);
            }
        }

        // Apply Physics
        this.vy += CONFIG.GRAVITY * dt;

        // Auto-stabilization / Air Resistance
        const isInput = keys['ArrowUp'] || keys['w'] || keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d'] || GAME_STATE.touch.active;
        const friction = isInput ? Math.pow(CONFIG.AIR_RESISTANCE, dt) : Math.pow(CONFIG.DAMPING, dt);
        this.vx *= friction;
        this.vy *= friction;

        // VELOCITY CLAMPING (System-wide consistency)
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > CONFIG.MAX_SPEED) {
            const ratio = CONFIG.MAX_SPEED / currentSpeed;
            this.vx *= ratio;
            this.vy *= ratio;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Boundaries
        if (this.y < 100) { this.y = 100; this.vy = 0; } // Ceiling capped at sky top

        // Ground check
        if (this.y > CONFIG.GROUND_Y - 18) { // Align with new resting point
            const vyAbs = Math.abs(this.vy);
            const vxAbs = Math.abs(this.vx);

            if (vyAbs < 5.0 && vxAbs < 3.0) { // Slightly more tolerant for faster engine
                this.y = CONFIG.GROUND_Y - 18;
                this.vy = 0;
                this.vx = 0;
                this.state = 'landed';
                this.angle = 0;
            } else if (this.y > CONFIG.GROUND_Y - 20) {
                this.explode();
            }
        } else {
            this.state = 'flight';
            this.angle = Math.max(-0.4, Math.min(0.4, this.vx * 0.04));
            this.sessionRescued = 0; // Reset cumulative counter when taking off
        }

        this.animTimer += dt;
        if (this.animTimer > 4) {
            this.frame = (this.frame + 1) % 4;
            this.animTimer = 0;
        }

        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x > CONFIG.WORLD_WIDTH) { this.x = CONFIG.WORLD_WIDTH; this.vx = 0; }
    }

    explode() {
        if (this.state === 'destroyed') return;
        this.state = 'destroyed';

        // Spawn Procedural Particles (Halved for Mobile)
        for (let i = 0; i < 20; i++) {
            // Fire particles (Red/Orange/Yellow)
            const color = `hsl(${10 + Math.random() * 40}, 100%, 50%)`;
            const vx = (Math.random() - 0.5) * 12 + this.vx;
            const vy = (Math.random() - 0.8) * 15 + this.vy;
            ENTITIES.particles.push(new Particle(this.x, this.y, vx, vy, color, 20 + Math.random() * 20, 5 + Math.random() * 10));
        }
        for (let i = 0; i < 15; i++) {
            // Smoke particles (Gray/Black)
            const g = 50 + Math.random() * 50;
            const color = `rgb(${g}, ${g}, ${g})`;
            const vx = (Math.random() - 0.5) * 6 + this.vx * 0.5;
            const vy = (Math.random() - 1.2) * 8;
            ENTITIES.particles.push(new Particle(this.x, this.y, vx, vy, color, 40 + Math.random() * 40, 10 + Math.random() * 15));
        }
        for (let i = 0; i < 10; i++) {
            // Sparks
            ENTITIES.particles.push(new Particle(this.x, this.y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, '#fff', 10 + Math.random() * 10, 2));
        }

        this.onboard = 0; // PASSENGERS ARE LOST
        GAME_STATE.lives--;
        updateHUD();

        if (GAME_STATE.lives <= 0) {
            setTimeout(() => endGame(false), 2000);
        } else {
            // Respawn after delay
            setTimeout(() => {
                this.reset();
                this.state = 'flight'; // Don't block on landing check initially
                this.y = 100; // Drop from sky for "new arrival" feel
            }, 2000);
        }
    }

    draw(cameraX) {
        const sx = this.x - cameraX;
        ctx.save();
        ctx.translate(sx, this.y);
        ctx.rotate(this.angle);

        // Helicopter asset is 640x640 with 160x160 cells.
        // Row 0: Side view, Row 1: Front view, Row 2: Explosion
        const frameW = 160;
        const frameH = 160;
        let row = 0;

        if (this.state === 'destroyed') {
            // Draw a charred/darkened version of the helicopter
            ctx.filter = 'brightness(0.2) grayscale(1)';
        }

        const size = 480; // Doubled from 240
        if (IMAGES.helicopter && IMAGES.helicopter.complete) {
            ctx.scale(this.facing, 1);
            // Removed the + size/6 offset which was pushing it down too much
            ctx.drawImage(IMAGES.helicopter, this.frame * frameW, row * frameH, frameW, frameH, -size / 2, -size / 2, size, size);
        }
        ctx.restore();
        ctx.filter = 'none';
    }
}

const ENTITIES = {
    dunes: [],
    props: [],
    soldiers: [],
    tanks: [],
    bullets: [],
    particles: []
};

class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.maxLife = life;
        this.life = life;
        this.size = size;
        this.alpha = 1;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.05 * dt; // Gravity
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }
    draw(cameraX) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function generateWorld() {
    // 1. Dunes (Lightweight)
    for (let i = 0; i < 30; i++) {
        ENTITIES.dunes.push({
            x: Math.random() * CONFIG.WORLD_WIDTH,
            w: 400 + Math.random() * 800,
            h: 60 + Math.random() * 120,
            parallax: 0.3 + Math.random() * 0.4,
            color: `hsl(30, ${30 + Math.random() * 20}%, ${25 + Math.random() * 15}%)`
        });
    }

    // 2. Generate clusters
    for (let i = 0; i < 80; i++) {
        const x = 800 + Math.random() * (CONFIG.WORLD_WIDTH - 1600);
        const rand = Math.random();
        const rotation = (Math.random() - 0.5) * 0.4;

        let py = CONFIG.GROUND_Y;
        let foreground = false;

        if (rand < 0.1) ENTITIES.props.push({ x, y: py - 200 + 25, type: 'barracks', img: IMAGES.barracks, size: 200, rot: 0 });
        else if (rand < 0.15) ENTITIES.props.push({ x, y: py - 250 + 31, type: 'tower', img: IMAGES.watchtower, size: 250, rot: 0 });
        else if (rand < 0.25) ENTITIES.props.push({ x, y: py - 150 + 10, type: 'palm', img: IMAGES.palm_tree, size: 150, rot: 0 });
        else if (rand < 0.35) ENTITIES.props.push({ x, y: py - 60 + 10, type: 'shrub', img: IMAGES.shrub, size: 60, rot: 0 });
        else if (rand < 0.375) ENTITIES.props.push({ x, y: py + 40 + Math.random() * 80, type: 'sandbags', img: IMAGES.sandbags, size: 240, rot: 0, foreground: true });
        else if (rand < 0.40) ENTITIES.props.push({ x, y: py + 40 + Math.random() * 80, type: 'rock', img: IMAGES.sandbags, size: 160, rot: 0, foreground: true });
    }

    // Soldiers near barracks
    ENTITIES.props.forEach(p => {
        if (p.type === 'barracks') {
            for (let j = 0; j < 5; j++) {
                ENTITIES.soldiers.push(new Soldier(p.x + (Math.random() - 0.5) * 300));
            }
        }
    });

    for (let k = 0; k < 8; k++) {
        // Progressive distribution: use square of random to push tanks further out
        // Most tanks will spawn in the second half of the world
        const progress = Math.pow(Math.random(), 0.5); // Bias towards further distances
        const x = 3000 + progress * (CONFIG.WORLD_WIDTH - 4000);
        ENTITIES.tanks.push(new Tank(x));
    }
}

class Soldier {
    constructor(x) {
        this.x = x;
        this.y = CONFIG.GROUND_Y + 120; // Lowered by ~15% depth
        this.state = 'wander';
        this.frame = 0;
        this.facing = Math.random() > 0.5 ? 1 : -1;
        this.timer = 0;
        this.scale = 1.0; // Added for exfil
    }

    update(heli, dt) {
        const dist = Math.abs(this.x - heli.x);
        const alt = heli.y;

        if (this.state === 'wander') {
            this.x += this.facing * 0.6 * dt;
            if (dist < 500) this.state = 'waving';
            if (Math.random() < 0.01 * dt) this.facing *= -1;
        } else if (this.state === 'waving') {
            if (dist > 700) this.state = 'wander';
            if (heli.state === 'landed' && dist < 400) this.state = 'running';
        } else if (this.state === 'running') {
            const dir = Math.sign(heli.x - this.x);
            this.x += dir * 2.5 * dt;
            this.facing = dir;
            if (Math.abs(this.x - heli.x) < 15 && heli.state === 'landed' && heli.onboard < CONFIG.HELICOPTER_CAPACITY) {
                this.state = 'inside';
                heli.onboard++;
                updateHUD();
            }
        } else if (this.state === 'exfiltrating') {
            // Walk "up" (into the base) with grounded trajectory - FASTER
            this.y -= 1.5 * dt;
            this.x += (Math.random() - 0.5) * 0.8 * dt; // More energetic walk
            this.scale *= (1 - 0.02 * dt); // Faster shrink

            // Animation frames
            this.timer += dt;
            if (this.timer > 6) { this.frame = (this.frame + 1) % 4; this.timer = 0; }

            // Trigger SECURED at the top of the road (Stop before desert)
            if (this.state !== 'secured' && (this.scale < 0.2 || this.y < CONFIG.GROUND_Y + 10)) {
                this.state = 'secured';
                GAME_STATE.rescued++;
                heli.sessionRescued++;
                // Cumulative message logic (+1, +2, +3...)
                GAME_STATE.messages.push({ x: 200, y: CONFIG.GROUND_Y - 200, text: `+${heli.sessionRescued}`, life: 40, size: 40 });
                updateHUD();
                if (GAME_STATE.rescued >= CONFIG.TOTAL_SOLDIERS) endGame(true);
            }
        }

        this.timer += dt;
        if (this.timer > 8) { this.frame = (this.frame + 1) % 4; this.timer = 0; }
    }

    draw(cameraX) {
        if (this.state === 'inside' || this.state === 'secured') return;
        ctx.save();

        let size = 156; // 30% larger than 120
        if (this.state === 'exfiltrating') size *= this.scale;

        const yOff = (this.state === 'exfiltrating') ? 0 : (size / 5);
        ctx.translate(this.x - cameraX, this.y - 45 + yOff);
        ctx.scale(this.facing, 1);

        // Soldier is 640x640 with 160x160 cells (Row 0: Sideways, Row 1: Waving)
        const fw = 160;
        const fh = 160;
        const row = (this.state === 'waving') ? 1 : 0; // Fixed ReferenceError
        if (IMAGES.soldier) {
            ctx.drawImage(IMAGES.soldier, this.frame * fw, row * fh, fw, fh, -size / 2, -size / 2, size, size);
        }
        ctx.restore();
    }
}

class Tank {
    constructor(x) { this.x = x; this.y = CONFIG.GROUND_Y - 15; this.facing = -1; this.frame = 0; this.timer = 0; this.shootTimer = Math.random() * 100; }
    update(heli, dt) {
        this.x += this.facing * 1.2 * dt;
        if (Math.random() < 0.005 * dt) this.facing *= -1;
        this.shootTimer += dt;
        if (this.shootTimer > 200 && Math.abs(this.x - heli.x) < 900) {
            this.shoot(heli);
            this.shootTimer = 0;
        }
        this.timer += dt;
        if (this.timer > 6) { this.frame = (this.frame + 1) % 4; this.timer = 0; }
    }
    shoot(target) {
        const ang = Math.atan2(target.y - this.y, target.x - this.x);
        ENTITIES.bullets.push({ x: this.x, y: this.y, vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7 });
    }
    draw(cameraX) {
        ctx.save();
        const size = 320;
        // Grounding: bring down by 1/3 as requested
        ctx.translate(this.x - cameraX, this.y + (size / 3));
        ctx.scale(-this.facing, 1);

        if (IMAGES.tank) {
            // Tank is 640x640 with 4 sprites in a 2x2 grid -> 320px cells
            // We use a slight inset (2px) to avoid picking up the black grid lines
            const fw = 320;
            const inset = 2;
            const col = this.frame % 2;
            const row = Math.floor(this.frame / 2);
            ctx.drawImage(IMAGES.tank,
                col * fw + inset, row * fw + inset, fw - inset * 2, fw - inset * 2,
                -size / 2, -size / 2, size, size
            );
        }
        ctx.restore();
    }
}

// --- ENGINE LOOP ---
const heli = new Helicopter();
window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

// Touch Handlers
canvas.addEventListener('touchstart', e => {
    GAME_STATE.touch.active = true;
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    GAME_STATE.touch.startX = GAME_STATE.touch.moveX = (t.clientX - rect.left) * (canvas.width / rect.width);
    GAME_STATE.touch.startY = GAME_STATE.touch.moveY = (t.clientY - rect.top) * (canvas.height / rect.height);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    if (!GAME_STATE.touch.active) return;
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    GAME_STATE.touch.moveX = (t.clientX - rect.left) * (canvas.width / rect.width);
    GAME_STATE.touch.moveY = (t.clientY - rect.top) * (canvas.height / rect.height);
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => {
    GAME_STATE.touch.active = false;
});

function updateHUD() {
    document.getElementById('saved-count').innerText = `${GAME_STATE.rescued.toString().padStart(2, '0')} / ${CONFIG.TOTAL_SOLDIERS}`;
    document.getElementById('onboard-count').innerText = `${heli.onboard.toString().padStart(2, '0')} / ${CONFIG.HELICOPTER_CAPACITY}`;
    document.getElementById('remaining-count').innerText = CONFIG.TOTAL_SOLDIERS - GAME_STATE.rescued - heli.onboard;
    document.getElementById('lives-count').innerText = GAME_STATE.lives.toString().padStart(2, '0');
}

function endGame(win) {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('end-title').innerText = win ? "EXFIL COMPLETE" : "CASUALTY REPORTED";
    document.getElementById('end-stats').innerText = `${GAME_STATE.rescued} P.O.W.S SECURED`;
}

let lastTime = 0;
function loop(time) {
    if (!gameActive) {
        lastTime = time;
        return;
    }
    const dt = Math.min(2, (time - lastTime) / 16.666);
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const camX = heli.x - canvas.width / 2;

    // 1. SKY (Simple Solid Sky to prioritize performance)
    ctx.fillStyle = '#1a1c3c';
    ctx.fillRect(0, 0, canvas.width, CONFIG.GROUND_Y);

    // 2. PARALLAX DUNES
    ENTITIES.dunes.forEach(d => {
        const dx = (d.x - camX * d.parallax) % (CONFIG.WORLD_WIDTH + d.w);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.ellipse(dx, CONFIG.GROUND_Y + 20, d.w, d.h, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. GROUND
    ctx.fillStyle = '#d2b48c';
    ctx.fillRect(0, CONFIG.GROUND_Y, canvas.width, canvas.height - CONFIG.GROUND_Y);

    // Sand Detail (Thin horizontal lines)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(0, CONFIG.GROUND_Y + i * 15, canvas.width, 1);
    }

    // 4. ENTITIES
    heli.update(dt);

    ENTITIES.props.forEach(p => {
        const px = p.x - camX;
        if (px > -400 && px < canvas.width + 400) {
            ctx.save();
            ctx.translate(px, p.y + p.size / 2);
            ctx.rotate(p.rot);
            ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
    });

    // AIRBORNE SAND DUST (Atmosphere) - Thinned & Short-lived
    if (ENTITIES.particles.length < CONFIG.MAX_PARTICLES && Math.random() < 0.05 * dt) {
        ENTITIES.particles.push(new Particle(heli.x + 1000, CONFIG.GROUND_Y - Math.random() * 400, -8 - Math.random() * 5, 0, 'rgba(210, 140, 68, 0.2)', 120, 2 + Math.random() * 3));
    }

    ENTITIES.soldiers.forEach(s => { s.update(heli, dt); }); // Move DRAW after heli
    ENTITIES.tanks.forEach(t => { t.update(heli, dt); t.draw(camX); });

    // 5. PARTICLES (Limited Capacity)
    ENTITIES.particles = ENTITIES.particles.filter(p => {
        p.update(dt);
        p.draw(camX);
        return p.life > 0;
    });
    if (ENTITIES.particles.length > CONFIG.MAX_PARTICLES) {
        ENTITIES.particles.splice(0, ENTITIES.particles.length - CONFIG.MAX_PARTICLES);
    }

    ENTITIES.bullets = ENTITIES.bullets.filter(b => {
        b.x += b.vx * dt; b.y += b.vy * dt;
        const dist = Math.sqrt(Math.pow(b.x - heli.x, 2) + Math.pow(b.y - heli.y, 2));
        if (dist < 40 && heli.state !== 'destroyed') { heli.explode(); return false; }
        ctx.fillStyle = '#fff'; ctx.fillRect(b.x - camX, b.y, 5, 5);
        return (b.y < CONFIG.GROUND_Y + 100);
    });

    // 1.5. HOME BASE (Environment Layer - Brought to front)

    // 1.5. FRIENDLY MISSION HQ
    const hbx = 200 - camX;
    const h_size = 250;
    const roadY = CONFIG.GROUND_Y + 5; // Helicopter skid level (775)

    // 1. Building starts right above the road/skid level
    if (IMAGES.home_base) {
        ctx.drawImage(IMAGES.home_base, hbx - h_size, roadY - h_size + 80, h_size, h_size);
    }

    // 2. Road/Runway (Parallelogram for Pseudo-3D)
    const roadW = 300;
    const roadH = 120;
    const slant = 60; // How much the sides slant
    const rx = hbx - roadW / 2;

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(rx + slant, roadY); // Top-left
    ctx.lineTo(rx + roadW + slant, roadY); // Top-right
    ctx.lineTo(rx + roadW, roadY + roadH); // Bottom-right
    ctx.lineTo(rx, roadY + roadH); // Bottom-left
    ctx.closePath();
    ctx.fill();

    // 3. Helipad Marking (H in circle - distorted for perspective)
    const padY = roadY + roadH / 2;
    ctx.save();
    ctx.translate(hbx + 20, padY);
    ctx.scale(1.2, 0.4); // Squash Y for perspective, slightly widen X

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 0, 0);
    ctx.restore();

    heli.draw(camX);

    // DRAW ALL SOLDIERS IN FRONT OF HELI
    ENTITIES.soldiers.forEach(s => { if (s.state !== 'inside' && s.state !== 'secured') s.draw(camX); });

    // Soldiers are already drawn in front of heli above

    // DRAW FLASH MESSAGES (Improved Visibility)
    GAME_STATE.messages = GAME_STATE.messages.filter(m => {
        m.y -= 1.2 * dt;
        m.life -= dt;
        const progress = m.life / 40;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.5; // Pulse effect

        ctx.save();
        ctx.translate(m.x - camX, m.y);
        ctx.scale(scale, scale);
        ctx.fillStyle = `rgba(255, 255, 0, ${progress})`;
        ctx.font = 'bold 36px Arial'; // Larger
        ctx.textAlign = 'center';
        ctx.fillText(m.text, 0, 0);
        ctx.restore();
        return m.life > 0;
    });

    // HOME BASE EXFILTRATION
    if (heli.state === 'landed' && heli.x < 500 && heli.onboard > 0) {
        heli.exfilTimer += dt;
        if (heli.exfilTimer > 25) { // Unload sequential every ~25 ticks
            heli.onboard--;
            // Spawn extreme LEFT and LOWER on the road
            const exfil = new Soldier(heli.x - 180);
            exfil.state = 'exfiltrating';
            exfil.y = CONFIG.GROUND_Y + 70;
            exfil.scale = 1.0;
            ENTITIES.soldiers.push(exfil);
            heli.exfilTimer = 0;
            updateHUD();
        }
    } else {
        heli.exfilTimer = 0;
    }

    requestAnimationFrame(loop);
}

async function init() {
    const loader = Object.entries(ASSETS).map(([k, s]) => new Promise(res => {
        const img = new Image(); img.onload = () => { IMAGES[k] = img; res(); }; img.src = s;
    }));
    await Promise.all(loader);
    generateWorld();
    updateHUD();

    // Start immediately
    if (document.getElementById('start-screen')) {
        document.getElementById('start-screen').classList.add('hidden');
    }
    gameActive = true;
    heli.reset();
    lastTime = performance.now();
    loop(lastTime);
}

function resize() {
    // We want a perfect 1000x1000 internal resolution.
    // The CSS will scale this into the 100vmin x 100vmin container.
    // If we set CSS width/height to vmin, and canvas internal to 1000x1000, 
    // it will render a square.
    canvas.width = 1000;
    canvas.height = 1000;
    CONFIG.GROUND_Y = 820;
}
window.onresize = resize;
resize();

// Global restart handler
document.getElementById('restart-btn').onclick = () => {
    document.getElementById('game-over').classList.add('hidden');
    // Deep reset of game state
    ENTITIES.particles = [];
    ENTITIES.bullets = [];
    ENTITIES.soldiers = [];
    ENTITIES.tanks = [];
    GAME_STATE.rescued = 0;
    GAME_STATE.onboard = 0;
    GAME_STATE.lives = CONFIG.MAX_LIVES;

    // Clear input state
    for (let k in keys) keys[k] = false;
    GAME_STATE.touch.active = false;

    generateWorld();
    updateHUD();
    heli.reset();
    gameActive = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
};

init();
