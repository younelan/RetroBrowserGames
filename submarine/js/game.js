/**
 * Submarine Commander - 640x640 UNIFIED SQUARE CANVAS
 * High-Fidelity Features: Unique Silhouettes, PT Boats, Hydrophone, Engine Temp
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// -- CONSTANTS --
const MODES = { MAP: 'MAP', SONAR: 'SONAR', PERI: 'PERI' };
const WORLD = { W: 4000, H: 4000, MAX_DEPTH: 250, FLOOR_DEPTH: 240 };
const SHIP_TYPES = {
    CARGO: { l: 'CARGO', speed: 0.15, tonnage: 5000, silo: 'CARGO' },
    TANKER: { l: 'TANKER', speed: 0.1, tonnage: 12000, silo: 'TANKER' },
    DESTROYER: { l: 'DESTROYER', speed: 0.4, tonnage: 2000, silo: 'DESTROYER', aggressive: true },
    PT_BOAT: { l: 'PT BOAT', speed: 0.8, tonnage: 500, silo: 'PT_BOAT', aggressive: true }
};
const COLORS = {
    HUD_BG: '#333399',
    SKY: '#3366ff',
    SEA: '#000066',
    GREEN: '#00ff00',
    YELLOW: '#ffff00',
    CYAN: '#00ffff',
    RED: '#ff0000',
    ORANGE: '#ffa500',
    GREY: '#aaaaaa'
};

// -- STATE --
let mode = MODES.PERI;
let running = false;
let introActive = false;
let introText = "";
let introIndex = 0;
let lastTypeTime = 0;
let startTime = 0;
const introLines = [
    "SITUATION: ATLANTIC - 1942",
    "MISSION: SEEK AND DESTROY ENEMY CONVOYS",
    "DEPARTURE: IMMEDIATE",
    "GOOD LUCK COMMANDER..."
];
let currentLineIdx = 0;
let audioCtx = null;
let lastFireTime = 0;
const keys = {};

const sub = {
    x: WORLD.W / 2, y: WORLD.H / 2,
    heading: 0, depth: 0,
    speedStage: 0, actualSpeed: 0,
    fuel: 250, battery: 100, air: 100,
    temp: 40, tonnage: 0,
    damage: { C: 0, I: 0, H: 0, E: 0 },
    torpedoes: 80, score: 0,
    rudder: 0, diveCommand: 0,
    shake: 0
};

const entities = [];
const torpedoes = [];
const depthCharges = [];
const particles = [];
const hydroHistory = new Array(80).fill(0);

// -- CONTROLS --
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyM') mode = MODES.MAP;
    if (e.code === 'KeyS') mode = MODES.SONAR;
    if (e.code === 'KeyP') mode = MODES.PERI;
    if (e.code.startsWith('Digit')) sub.speedStage = parseInt(e.code.slice(-1));
    if (e.code === 'Space') fireTorpedo();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Interaction logic
let isDragging = false;

function handleInput(e, isInitial) {
    if (e.cancelable) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) / rect.width * 640;
    const y = (clientY - rect.top) / rect.height * 640;

    if (y > 580) {
        if (isInitial) {
            if (x < 160) mode = MODES.MAP;
            else if (x < 320) mode = MODES.SONAR;
            else if (x < 480) mode = MODES.PERI;
            else if (x > 480) fireTorpedo();
        }
        return;
    }

    if (y > 400) {
        if (isInitial && x > 160 && x < 320) {
            const speedY = y - 410;
            if (speedY >= 0 && speedY <= 150) {
                sub.speedStage = 9 - Math.floor(speedY / 15);
                sub.speedStage = Math.max(0, Math.min(9, sub.speedStage));
            }
        }
        return;
    }

    if (y < 400) {
        if (isInitial) isDragging = true;
        if (isDragging) {
            sub.rudder = (x / 640 - 0.5) * 2;
            sub.diveCommand = (y / 400 - 0.5) * 2;
        }
    }
}

canvas.addEventListener('mousedown', e => handleInput(e, true));
window.addEventListener('mousemove', e => { if (isDragging) handleInput(e, false); });
window.addEventListener('mouseup', () => { isDragging = false; sub.rudder = 0; sub.diveCommand = 0; });

canvas.addEventListener('touchstart', e => handleInput(e, true), { passive: false });
window.addEventListener('touchmove', e => { if (isDragging) handleInput(e, false); }, { passive: false });
window.addEventListener('touchend', () => { isDragging = false; sub.rudder = 0; sub.diveCommand = 0; });

function playMorseSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') return; // Silence until user interaction
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) { }
}

function initGame() {
    sub.x = WORLD.W / 2; sub.y = WORLD.H / 2;
    sub.fuel = 250; sub.battery = 100; sub.air = 100; sub.temp = 40; sub.tonnage = 0;
    sub.damage = { C: 0, I: 0, H: 0, E: 0 };
    sub.depth = 0; sub.speedStage = 0; sub.heading = 0; sub.actualSpeed = 0;
    sub.torpedoes = 80; sub.score = 0; sub.rudder = 0; sub.diveCommand = 0; sub.shake = 0;
    entities.length = 0; torpedoes.length = 0; depthCharges.length = 0; particles.length = 0;
    for (let i = 0; i < 15; i++) spawnEntity();

    introActive = true;
    introText = "";
    introIndex = 0;
    currentLineIdx = 0;
    lastTypeTime = Date.now();
    requestAnimationFrame(gameLoop);
}

// Start immediately on load
window.addEventListener('load', () => {
    initGame();
});

// Resume audio on first user interaction
window.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

function startMission() {
    // This is now redundant for starting the intro, but keep for retry
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    initGame();
}

function spawnEntity() {
    const r = Math.random();
    let type = SHIP_TYPES.CARGO;
    if (r > 0.9) type = SHIP_TYPES.PT_BOAT;
    else if (r > 0.7) type = SHIP_TYPES.DESTROYER;
    else if (r > 0.5) type = SHIP_TYPES.TANKER;

    entities.push({
        x: Math.random() * WORLD.W, y: Math.random() * WORLD.H,
        active: true, type: type,
        heading: Math.random() * 360, speed: type.speed,
        lastDrop: 0
    });
}

function fireTorpedo() {
    if (sub.depth < 50 && sub.torpedoes > 0 && Date.now() - lastFireTime > 2000) {
        torpedoes.push({
            x: sub.x, y: sub.y,
            heading: sub.heading,
            dist: 0, active: true,
            bubbles: []
        });
        sub.torpedoes--; lastFireTime = Date.now();
    }
}

function createExplosion(x, y, color = COLORS.YELLOW) {
    for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            life: 1,
            size: 2 + Math.random() * 5,
            color
        });
    }
}

function gameLoop() {
    if (introActive) {
        updateIntro();
        renderIntro();
        requestAnimationFrame(gameLoop);
        return;
    }
    if (!running) return;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function updateIntro() {
    const now = Date.now();
    if (currentLineIdx < introLines.length) {
        if (now - lastTypeTime > 40) { // 2x as fast (was 80)
            const line = introLines[currentLineIdx];
            if (introIndex < line.length) {
                introText += line[introIndex];
                introIndex++;
                playMorseSound();
            } else {
                introText += "\n";
                currentLineIdx++;
                introIndex = 0;
            }
            lastTypeTime = now;
        }
    } else if (now - lastTypeTime > 1000) {
        introActive = false;
        running = true;
        startTime = Date.now();
        document.getElementById('start-screen').classList.add('hidden');
    }
}

function renderIntro() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 640, 640);
    ctx.fillStyle = COLORS.GREEN;
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    const lines = introText.split("\n");
    lines.forEach((l, i) => {
        ctx.fillText(l, 50, 100 + i * 40);
    });
    // Cursor
    if (Math.floor(Date.now() / 300) % 2 === 0) {
        const lastLine = lines[lines.length - 1];
        const tx = 50 + ctx.measureText(lastLine).width;
        const ty = 100 + (lines.length - 1) * 40;
        ctx.fillRect(tx + 2, ty - 18, 10, 20);
    }
}

function update() {
    // Movement
    if (keys['ArrowLeft']) sub.heading = (sub.heading - 0.8 + 360) % 360;
    else if (keys['ArrowRight']) sub.heading = (sub.heading + 0.8) % 360;
    else if (Math.abs(sub.rudder) > 0.05) sub.heading = (sub.heading + sub.rudder * 1.5 + 360) % 360;

    if (keys['ArrowDown']) sub.depth = Math.min(250, sub.depth + 0.6);
    else if (keys['ArrowUp']) sub.depth = Math.max(0, sub.depth - 0.8);
    else if (Math.abs(sub.diveCommand) > 0.05) sub.depth = Math.max(0, Math.min(250, sub.depth + sub.diveCommand * 0.8));

    const target = sub.speedStage * 0.4;
    sub.actualSpeed += (target - sub.actualSpeed) * 0.05;
    const rad = (sub.heading - 90) * (Math.PI / 180);
    sub.x += Math.cos(rad) * sub.actualSpeed; sub.y += Math.sin(rad) * sub.actualSpeed;
    if (sub.x < 0) sub.x += WORLD.W; if (sub.x > WORLD.W) sub.x -= WORLD.W;
    if (sub.y < 0) sub.y += WORLD.H; if (sub.y > WORLD.H) sub.y -= WORLD.H;

    // Heat & Battery
    if (sub.speedStage >= 7) sub.temp += 0.02 * (sub.speedStage - 6);
    else if (sub.temp > 40) sub.temp -= 0.01;
    if (sub.temp > 100) sub.damage.E = Math.min(9, sub.damage.E + 0.01);

    if (sub.depth === 0) { sub.air = Math.min(100, sub.air + 0.2); sub.battery = Math.min(100, sub.battery + 0.05); }
    else { sub.air -= 0.01; sub.battery -= 0.005 * (sub.actualSpeed + 1); }
    sub.fuel -= 0.001 * (sub.actualSpeed + 0.5);

    // Entity AI
    entities.forEach(ent => {
        if (!ent.active) return;
        const erad = (ent.heading - 90) * (Math.PI / 180);
        ent.x += Math.cos(erad) * ent.speed; ent.y += Math.sin(erad) * ent.speed;
        if (ent.x < 0) ent.x += WORLD.W; if (ent.x > WORLD.W) ent.x -= WORLD.W;
        if (ent.y < 0) ent.y += WORLD.H; if (ent.y > WORLD.H) ent.y -= WORLD.H;

        if (ent.type.aggressive) {
            let dx = sub.x - ent.x; let dy = sub.y - ent.y;
            if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1200) {
                const targetHeading = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
                let diff = targetHeading - ent.heading;
                if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
                ent.heading = (ent.heading + Math.sign(diff) * 0.8 + 360) % 360;
                ent.speed = ent.type.speed * 1.5;
                if (dist < 200 && Date.now() - ent.lastDrop > 5000) {
                    depthCharges.push({ x: ent.x, y: ent.y, z: 0, targetZ: sub.depth + (Math.random() - 0.5) * 30, life: 1 });
                    ent.lastDrop = Date.now();
                }
            } else { ent.speed = ent.type.speed; }
        }
    });

    // Torpedoes
    torpedoes.forEach(t => {
        if (!t.active) return;
        const trad = (t.heading - 90) * (Math.PI / 180);
        t.x += Math.cos(trad) * 10; t.y += Math.sin(trad) * 10;
        t.dist += 10; if (t.dist > 2500) t.active = false;

        // Bubbles trail
        if (Math.random() > 0.5) {
            t.bubbles.push({ x: t.x, y: t.y, life: 1 });
        }
        t.bubbles.forEach(b => b.life -= 0.05);
        t.bubbles = t.bubbles.filter(b => b.life > 0);

        if (t.x < 0) t.x += WORLD.W; if (t.x > WORLD.W) t.x -= WORLD.W;
        if (t.y < 0) t.y += WORLD.H; if (t.y > WORLD.H) t.y -= WORLD.H;

        entities.forEach(ent => {
            if (!ent.active) return;
            let dx = ent.x - t.x; let dy = ent.y - t.y;
            if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
            if (Math.sqrt(dx * dx + dy * dy) < 60) {
                t.active = false; ent.active = false;
                sub.tonnage += ent.type.tonnage;
                sub.score += Math.floor(ent.type.tonnage / 10);
                createExplosion(ent.x, ent.y);
            }
        });
    });

    // Depth Charges
    depthCharges.forEach(dc => {
        dc.z += 2;
        if (dc.z >= dc.targetZ) {
            let dx = sub.x - dc.x; let dy = sub.y - dc.y;
            if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
            const d = Math.sqrt(dx * dx + dy * dy);
            const dz = Math.abs(sub.depth - dc.z);
            if (d < 120 && dz < 40) {
                sub.shake = 25;
                sub.damage.H = Math.min(9, sub.damage.H + (d < 60 ? 2 : 1));
                createExplosion(dc.x, dc.y, COLORS.RED);
            }
            dc.life = 0;
        }
    });
    for (let i = depthCharges.length - 1; i >= 0; i--) if (depthCharges[i].life <= 0) depthCharges.splice(i, 1);

    // Particles
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.02;
    });
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);

    if (sub.shake > 0) sub.shake *= 0.85;

    // Seafloor Collision & Crush Depth
    if (sub.depth >= WORLD.FLOOR_DEPTH) {
        sub.damage.H = Math.min(9, sub.damage.H + 0.05); // Damage from hitting seafloor
        sub.shake = Math.max(sub.shake, 5);
    }
    if (sub.depth >= WORLD.MAX_DEPTH) {
        sub.damage.H = Math.min(9, sub.damage.H + 0.1); // Crush depth pressure
        sub.shake = Math.max(sub.shake, 8);
    }

    if (sub.fuel <= 0 || sub.air <= 0 || sub.damage.H >= 9) endGame();

    // Update Hydro History (Sonar)
    if (Date.now() % 100 < 30) {
        hydroHistory.shift();
        let maxPeak = 0;
        entities.forEach(e => {
            if (!e.active) return;
            let dx = e.x - sub.x; let dy = e.y - sub.y;
            if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1500) maxPeak = Math.max(maxPeak, 40 * (1 - dist / 1500));
        });
        hydroHistory.push(maxPeak);
    }
}

function render() {
    ctx.save();
    if (sub.shake > 1) ctx.translate((Math.random() - 0.5) * sub.shake, (Math.random() - 0.5) * sub.shake);
    ctx.clearRect(0, 0, 640, 640);

    drawMainView();
    drawTFCSOverlay(10, 10);
    ctx.restore();

    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(0, 400, 640, 180);
    draw4ColumnHUD();
    drawCompactButtons();
}

function drawTFCSOverlay(x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, 120, 160);
    ctx.textAlign = 'left'; ctx.fillStyle = COLORS.YELLOW; ctx.font = 'bold 16px monospace';
    const rows = [
        ['T', sub.torpedoes],
        ['F', Math.floor(sub.fuel)],
        ['C', Math.floor(sub.battery)],
        ['S', Math.floor(sub.actualSpeed * 50)],
        ['H', Math.floor(sub.temp)],
        ['W', sub.tonnage]
    ];
    rows.forEach((r, i) => {
        const py = y + 25 + i * 25;
        ctx.fillStyle = COLORS.YELLOW; ctx.fillText(r[0], x + 5, py);
        ctx.fillStyle = r[0] === 'H' && sub.temp > 80 ? COLORS.RED : COLORS.GREEN;
        ctx.fillText(r[1].toString().padStart(r[0] === 'W' ? 5 : 3, '0'), x + 35, py);
    });
}

function draw4ColumnHUD() {
    const colW = 160;
    drawATD(5, 410, colW - 10);
    drawCompass(5, 530, colW - 10);
    drawSpeedSelector(165, 410, colW - 10);
    drawStatus(325, 410, colW - 10);
    drawDepthDial(485, 410, colW - 10);
    drawMiniView(485, 500, colW - 10);
}

function drawATD(x, y, w) {
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, 80);
    ctx.strokeStyle = COLORS.YELLOW;
    const dy = y + 40 + sub.diveCommand * 35; ctx.beginPath(); ctx.moveTo(x + 5, dy); ctx.lineTo(x + w - 5, dy); ctx.stroke();
    const rx = x + w / 2 + sub.rudder * (w / 2 - 5); ctx.beginPath(); ctx.moveTo(rx, y + 5); ctx.lineTo(rx, y + 75); ctx.stroke();
}

function drawCompass(x, y, w) {
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, 35);
    ctx.strokeStyle = COLORS.GREEN; ctx.strokeRect(x, y, w, 35);
    ctx.fillStyle = COLORS.GREEN; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
    const markers = [{ a: 0, l: 'N' }, { a: 90, l: 'E' }, { a: 180, l: 'S' }, { a: 270, l: 'W' }];
    markers.forEach(m => {
        let diff = m.a - sub.heading; if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
        let mx = x + w / 2 + diff * 1.2; if (mx > x + 5 && mx < x + w - 5) ctx.fillText(m.l, mx, y + 25);
    });
    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 5); ctx.lineTo(x + w / 2, y + 30); ctx.stroke();
}

function drawSpeedSelector(x, y, w) {
    ctx.fillStyle = '#111'; ctx.fillRect(x, y, w, 155);
    ctx.fillStyle = COLORS.CYAN; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('THROTTLE', x + w / 2, y + 12);
    for (let i = 0; i <= 9; i++) {
        const sy = y + 20 + (9 - i) * 13;
        const active = sub.speedStage === i;
        ctx.fillStyle = active ? COLORS.GREEN : '#222'; ctx.fillRect(x + 15, sy, w - 30, 10);
        ctx.fillStyle = active ? '#fff' : '#444'; ctx.font = 'bold 9px monospace'; ctx.fillText(i, x + 8, sy + 9);
    }
}

function drawStatus(x, y, w) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    ctx.fillStyle = COLORS.YELLOW; ctx.font = '14px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`, x, y + 12);
    [['C', sub.damage.C], ['I', sub.damage.I], ['H', sub.damage.H], ['E', Math.floor(sub.damage.E)]].forEach((d, i) => {
        const dx = x + (i % 2) * 65; const dy = y + 45 + Math.floor(i / 2) * 40;
        ctx.fillStyle = COLORS.YELLOW; ctx.fillText(d[0], dx, dy);
        ctx.fillStyle = '#000'; ctx.fillRect(dx + 20, dy - 14, 25, 18);
        ctx.fillStyle = d[1] > 5 ? COLORS.RED : COLORS.GREEN; ctx.fillText(Math.floor(d[1]), dx + 24, dy);
    });
    ctx.fillStyle = COLORS.CYAN; ctx.fillRect(x + w - 10, y + 10, 8, 150);
    ctx.fillStyle = '#000'; ctx.fillRect(x + w - 10, y + 10, 8, 150 * (1 - sub.air / 100));
}

function drawDepthDial(x, y, w) {
    const cx = x + w / 2; const cy = y + 40;
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, 80);
    ctx.strokeStyle = '#666'; ctx.beginPath(); ctx.arc(cx, cy, 35, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('DEPTH', cx, cy + 5);
    const nRad = (sub.depth / 250 * 360 - 90) * (Math.PI / 180);
    ctx.strokeStyle = COLORS.CYAN; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(nRad) * 30, cy + Math.sin(nRad) * 30); ctx.stroke(); ctx.lineWidth = 1;
}

function drawMiniView(x, y, w) {
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, 70);
    // Ocean background
    const gradient = ctx.createLinearGradient(x, y, x, y + 70);
    gradient.addColorStop(0, '#0066ff');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, 70);

    // Ocean Floor
    ctx.fillStyle = '#442211';
    ctx.beginPath();
    ctx.moveTo(x, y + 70);
    ctx.lineTo(x, y + 60);
    for (let i = 0; i <= 10; i++) {
        const sx = x + (i / 10) * w;
        const sy = y + 60 + Math.sin(i * 0.8) * 4;
        ctx.lineTo(sx, sy);
    }
    ctx.lineTo(x + w, y + 70);
    ctx.fill();

    // Surface
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x + w, y + 5); ctx.stroke();

    // Submarine (white dot/small shape)
    const sy = y + 5 + (sub.depth / 250) * 55;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + w / 2, sy, 3, 0, 7);
    ctx.fill();

    // Depth Label
    ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText(Math.floor(sub.depth) + 'ft', x + w - 5, y + 15);
}

function drawMainView() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 640, 400);
    if (mode === MODES.MAP) {
        ctx.strokeStyle = '#020'; for (let i = 0; i < 640; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke(); }
        const px = (sub.x / 4000) * 640; const py = (sub.y / 4000) * 400;
        ctx.strokeStyle = '#fff'; ctx.strokeRect(px - 5, py - 5, 10, 10);
        entities.forEach(e => {
            if (e.active) {
                ctx.fillStyle = e.type === SHIP_TYPES.DESTROYER || e.type === SHIP_TYPES.PT_BOAT ? '#f33' : '#fff';
                ctx.fillRect((e.x / 4000) * 640 - 2, (e.y / 4000) * 400 - 2, 4, 4);
            }
        });
        torpedoes.forEach(t => {
            if (!t.active) return;
            const tx = (t.x / 4000) * 640; const ty = (t.y / 4000) * 400;
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            t.bubbles.forEach(b => { ctx.fillRect((b.x / 4000) * 640 - 1, (b.y / 4000) * 400 - 1, 2, 2); });
            ctx.save(); ctx.translate(tx, ty); ctx.rotate(t.heading * Math.PI / 180);
            ctx.fillStyle = COLORS.CYAN; ctx.fillRect(-1, -4, 2, 8); ctx.restore();
        });
        drawParticlesInView('MAP');
    } else if (mode === MODES.SONAR) {
        drawSonar();
        drawParticlesInView('SONAR');
    } else if (mode === MODES.PERI) {
        drawPeriscope();
    }
}

function drawParticlesInView(vMode) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (vMode === 'MAP' || vMode === 'SONAR') {
            const px = (p.x / 4000) * 640; const py = (p.y / 4000) * 400;
            ctx.beginPath(); ctx.arc(px, py, p.size / 2, 0, 7); ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

function drawSonar() {
    ctx.strokeStyle = COLORS.GREEN; ctx.beginPath(); ctx.arc(320, 180, 160, 0, 7); ctx.stroke();
    // Radar line
    const rLine = (Date.now() / 500) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'; ctx.beginPath(); ctx.moveTo(320, 180); ctx.lineTo(320 + Math.cos(rLine) * 160, 180 + Math.sin(rLine) * 160); ctx.stroke();

    entities.forEach(e => {
        if (!e.active) return;
        let dx = e.x - sub.x; let dy = e.y - sub.y;
        if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2000) {
            const ang = Math.atan2(dy, dx); const r = (dist / 2000) * 160;
            ctx.fillStyle = COLORS.GREEN; ctx.fillRect(320 + Math.cos(ang) * r - 2, 180 + Math.sin(ang) * r - 2, 4, 4);
        }
    });

    // Hydrophone Chart
    ctx.fillStyle = '#111'; ctx.fillRect(100, 350, 440, 45);
    ctx.strokeStyle = COLORS.GREEN; ctx.strokeRect(100, 350, 440, 45);
    ctx.beginPath();
    hydroHistory.forEach((h, i) => {
        ctx.lineTo(100 + i * 5.5, 395 - h);
    });
    ctx.stroke();
    ctx.fillStyle = COLORS.GREEN; ctx.font = '10px monospace'; ctx.fillText('HYDROPHONE ENGINE NOISE', 110, 362);
}

function drawPeriscope() {
    const periSubmergeDepth = 15;
    const horizonY = Math.max(0, 200 - (sub.depth / periSubmergeDepth) * 200);

    if (sub.depth < 150) {
        // Background Colors
        const depthFactor = Math.min(1, sub.depth / 150);
        const skyAlpha = Math.max(0, 1 - (sub.depth / 30));
        const seaAlpha = 1 - depthFactor;

        // Sky (above horizon)
        if (horizonY > 0) {
            ctx.fillStyle = `rgb(${51 * skyAlpha}, ${102 * skyAlpha}, ${255 * skyAlpha})`;
            ctx.fillRect(0, 0, 640, horizonY);
        }

        // Sea (below horizon)
        ctx.fillStyle = `rgb(0, 0, ${102 * seaAlpha})`;
        ctx.fillRect(0, horizonY, 640, 400 - horizonY);

        // Ships and Target (only if some sky or surface is visible)
        if (sub.depth < 50) {
            let sighted = false;
            entities.forEach(ent => {
                if (!ent.active) return;
                let dx = ent.x - sub.x; let dy = ent.y - sub.y;
                if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 3000) {
                    const b = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
                    let diff = b - sub.heading; if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
                    if (Math.abs(diff) < 45) {
                        sighted = true;
                        const sx = 320 + (diff / 45) * 320; const sz = 2000 / d;
                        drawShipSilhouette(sx, horizonY, sz, ent.type);
                    }
                }
            });

            // Torpedoes and Explosions
            torpedoes.forEach(t => {
                if (!t.active) return;
                let dx = t.x - sub.x; let dy = t.y - sub.y;
                if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
                const d = Math.sqrt(dx * dx + dy * dy); if (d > 2500) return;
                const b = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
                let diff = b - sub.heading; if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
                if (Math.abs(diff) < 45) {
                    const sx = 320 + (diff / 45) * 320; const sz = 500 / d;
                    ctx.fillStyle = COLORS.CYAN; ctx.fillRect(sx - sz, horizonY + 1, sz * 2, sz / 2);
                }
            });

            particles.forEach(p => {
                let dx = p.x - sub.x; let dy = p.y - sub.y;
                if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
                const d = Math.sqrt(dx * dx + dy * dy); if (d > 3000) return;
                const b = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
                let diff = b - sub.heading; if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
                if (Math.abs(diff) < 45) {
                    const sx = 320 + (diff / 45) * 320;
                    ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(sx + p.vx * 2, horizonY + p.vy * 0.3, p.size, 0, 7); ctx.fill();
                }
            });
            ctx.globalAlpha = 1;

            if (sighted) {
                ctx.fillStyle = COLORS.YELLOW; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
                ctx.fillText('SHIP SIGHTED', 320, 50);
            }
        }
        drawTranslucentHUD();
    } else {
        // Pitch Black
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 640, 400);
    }

    // Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.beginPath(); ctx.moveTo(320, 50); ctx.lineTo(320, 350); ctx.moveTo(100, 200); ctx.lineTo(540, 200); ctx.stroke();
}

function drawTranslucentHUD() {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const mx = 500, my = 20, ms = 120;
    ctx.fillStyle = '#000'; ctx.fillRect(mx, my, ms, ms);
    ctx.strokeStyle = COLORS.GREEN; ctx.strokeRect(mx, my, ms, ms);

    // Grid
    ctx.strokeStyle = '#020';
    for (let i = 0; i <= ms; i += ms / 4) {
        ctx.beginPath(); ctx.moveTo(mx + i, my); ctx.lineTo(mx + i, my + ms); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx, my + i); ctx.lineTo(mx + ms, my + i); ctx.stroke();
    }

    // Sub
    const subX = mx + ms / 2; const subY = my + ms / 2;
    ctx.fillStyle = '#fff'; ctx.fillRect(subX - 2, subY - 2, 4, 4);

    // Entities (relative to sub)
    entities.forEach(ent => {
        if (!ent.active) return;
        let dx = ent.x - sub.x; let dy = ent.y - sub.y;
        if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2000) {
            const ex = subX + (dx / 2000) * (ms / 2);
            const ey = subY + (dy / 2000) * (ms / 2);
            ctx.fillStyle = ent.type.aggressive ? COLORS.RED : '#fff';
            ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
        }
    });

    // Torpedoes
    torpedoes.forEach(t => {
        if (!t.active) return;
        let dx = t.x - sub.x; let dy = t.y - sub.y;
        if (Math.abs(dx) > 2000) dx -= Math.sign(dx) * 4000; if (Math.abs(dy) > 2000) dy -= Math.sign(dy) * 4000;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2000) {
            const tx = subX + (dx / 2000) * (ms / 2);
            const ty = subY + (dy / 2000) * (ms / 2);
            ctx.fillStyle = COLORS.CYAN; ctx.fillRect(tx - 1, ty - 1, 2, 2);
        }
    });

    ctx.restore();
}

function drawShipSilhouette(x, baseY, scale, type) {
    ctx.fillStyle = '#000';
    if (type === SHIP_TYPES.CARGO) {
        // Cargo: Flat hull with two distinct masts/stacks
        ctx.fillRect(x - scale, baseY - scale / 6, scale * 2, scale / 6);
        ctx.fillRect(x - scale * 0.5, baseY - scale / 2, scale / 8, scale / 3);
        ctx.fillRect(x + scale * 0.3, baseY - scale / 2, scale / 8, scale / 3);
    } else if (type === SHIP_TYPES.TANKER) {
        // Tanker: Long low hull with bridge at the very end
        ctx.fillRect(x - scale * 1.5, baseY - scale / 8, scale * 3, scale / 8);
        ctx.fillRect(x + scale * 0.8, baseY - scale / 2.5, scale / 2, scale / 4);
        ctx.fillRect(x + scale * 1.0, baseY - scale / 1.5, scale / 8, scale / 4); // Thin stack
    } else if (type === SHIP_TYPES.DESTROYER) {
        // Destroyer: Ramped hull with central superstructure
        ctx.beginPath();
        ctx.moveTo(x - scale, baseY);
        ctx.lineTo(x - scale * 0.9, baseY - scale / 4);
        ctx.lineTo(x + scale * 0.9, baseY - scale / 4);
        ctx.lineTo(x + scale, baseY);
        ctx.fill();
        ctx.fillRect(x - scale / 3, baseY - scale / 1.8, scale / 1.5, scale / 3);
        ctx.fillRect(x - scale / 8, baseY - scale / 1.2, scale / 4, scale / 3); // Main mast
    } else if (type === SHIP_TYPES.PT_BOAT) {
        // PT Boat: Sharp wedge with small cabin
        ctx.beginPath();
        ctx.moveTo(x - scale / 2, baseY);
        ctx.lineTo(x + scale / 2, baseY);
        ctx.lineTo(x + scale / 2.5, baseY - scale / 5);
        ctx.lineTo(x - scale / 3, baseY - scale / 5);
        ctx.fill();
        ctx.fillRect(x - scale / 10, baseY - scale / 3, scale / 5, scale / 8);
    }
}

function drawCompactButtons() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 580, 640, 60);
    ctx.strokeStyle = '#444'; ctx.strokeRect(1, 581, 638, 58);
    const btnW = 140;
    [{ l: 'MAP 🗺️', m: MODES.MAP }, { l: 'SONAR 📻', m: MODES.SONAR }, { l: 'PERI 🔭', m: MODES.PERI }].forEach((b, i) => {
        ctx.fillStyle = mode === b.m ? '#339' : '#222'; ctx.fillRect(i * btnW + 2, 582, btnW - 4, 56);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText(b.l, i * btnW + btnW / 2, 615);
    });
    ctx.fillStyle = '#800'; ctx.fillRect(450, 582, 185, 56);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.fillText('🚀 FIRE', 542, 615);
}

function endGame() { running = false; document.getElementById('game-over').classList.remove('hidden'); document.getElementById('final-score').innerText = `TONNAGE: ${sub.tonnage}`; }

function resize() {
    const size = Math.min(window.innerWidth - 10, window.innerHeight - 10);
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
}
window.addEventListener('resize', resize); resize();
