const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level-val');
const timeElement = document.getElementById('time');
const bonusElement = document.getElementById('bonus-info');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const restartBtn = document.getElementById('restartBtn');

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const START_LEVEL = 1;
const SPEED_MODIFIER = 0.5; // Half speed as requested

const LEVEL3_PATERNOSTER = {
    centerX: 250,
    shaftHalfWidth: 14,
    minY: 112,
    maxY: 368,
    stepCount: 5,
    stepWidth: 35,
    stepHeight: 8,
    phaseSpeed: 0.0025
};

function checkCollision(r1, r2) {
    if (!r1 || !r2) return false;
    return r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y;
}

function drawSteelBlock(x, y, w, h) {
    ctx.save();
    // 1. Metallic Gradient Base
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#CBD5E1'); // Slate 300
    grad.addColorStop(0.5, '#94A3B8'); // Slate 400
    grad.addColorStop(1, '#475569'); // Slate 600
    ctx.fillStyle = grad;
    fillRoundedRect(x, y, w, h, 2);

    // 2. Beveled Edges
    ctx.strokeStyle = '#F8FAFC'; // Highlights
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h - 1); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x + w - 1, y + 1);
    ctx.stroke();

    ctx.strokeStyle = '#1E293B'; // Shadows
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h - 1); ctx.lineTo(x + w - 1, y + h - 1); ctx.lineTo(x + w - 1, y + 1);
    ctx.stroke();

    // 3. Industrial Rivets (Center-aligned)
    ctx.fillStyle = '#64748B';
    const rw = 2;
    ctx.beginPath(); ctx.arc(x + 5, y + 5, rw, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - 5, y + 5, rw, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y + h - 5, rw, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - 5, y + h - 5, rw, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// --- ANIMATED SPRITE SYSTEM ---
const sprites = {
    player: { src: 'mack_anim.png', img: null, frames: 4, grid: 2 },
    vandal: { src: 'vandal_anim.png', img: null, frames: 4, grid: 2 },
    osha: { src: 'osha_anim.png', img: null, frames: 4, grid: 2 },
    jackhammer: { src: 'jackhammer_anim.png', img: null, frames: 2, grid: 2 }
};

let loadedCount = 0;
const totalSprites = Object.keys(sprites).length;

function processTransparency(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(img, 0, 0);
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 20 && data[i + 1] < 20 && data[i + 2] < 20) data[i + 3] = 0;
    }
    tCtx.putImageData(imgData, 0, 0);
    return tempCanvas;
}

Object.keys(sprites).forEach(key => {
    const s = sprites[key];
    const img = new Image();
    img.onload = () => {
        s.img = processTransparency(img);
        loadedCount++;
        if (loadedCount === totalSprites) draw(); // Final initial draw
    };
    img.src = s.src;
});

let score = 0;
let lives = 3;
let level = START_LEVEL;
let gameRunning = false;
let animationId = null;
let timeLeft = 280;
let bonus = 0;
let lastTime = 0;
let frameCount = 0;
let deathMessage = "";
let deathTimer = 0;
const DEBUG = false;
const DEBUG_BUILD = '2026-03-12-paternoster-debug-1';
let debugAccumulator = 0;

function debugLogState(tag) {
    if (!DEBUG) return;
    const p0 = paternosterPlatforms[0];
    const p0Text = p0 ? `(${Math.round(p0.x)}, ${Math.round(p0.y)})` : 'none';
    console.log(
        `[DBG ${DEBUG_BUILD}] ${tag} | level=${level} running=${gameRunning} ` +
        `paternosters=${paternosterPlatforms.length} p0=${p0Text} ` +
        `player=(${Math.round(player.x || 0)}, ${Math.round(player.y || 0)})`
    );
}

// Colors & Gradients
const COLORS = {
    BG_TOP: '#0B1220',
    BG_BOTTOM: '#111827',
    PLATFORM_TOP: '#60A5FA',
    PLATFORM_BOTTOM: '#2563EB',
    LADDER: '#94A3B8',
    PLAYER: '#FFFFFF',
    VANDAL: '#F97316',
    OSHA: '#A78BFA',
    GIRDER_L2: '#34D399',
    GIRDER_L2_EDGE: '#10B981',
    GLOW: 'rgba(96, 165, 250, 0.45)'
};

let collectionAnimations = []; // Visual feedback for block delivery

function fillRoundedRect(x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function strokeRoundedRect(x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
}

// Parallax Stars
const stars = Array.from({ length: 50 }, () => ({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    size: Math.random() * 1.5,
    speed: Math.random() * 0.2 + 0.1
}));

// Game objects
let player = {};
let beams = [];
let gaps = [];
let enemies = [];
let jackhammer = {};
let platforms = [];
let ladders = [];
let elevator = null;
let paternosterPlatforms = []; // Platforms that rotate/loop
let lunchboxes = [];
let conveyors = [];
let magnet = {};
let steelBlocks = [];
let processor = {};
let trampolines = [];
let movingPlatform = null;
let level2Machines = [];

// --- LEVEL CONFIGS ---
const LEVEL1_LAYOUT = [
    { x: 45, y: 440, w: 380, h: 12 },
    { x: 45, y: 360, w: 380, h: 12 },
    { x: 45, y: 280, w: 380, h: 12 },
    { x: 45, y: 200, w: 380, h: 12 },
    { x: 45, y: 120, w: 380, h: 12 },
    { x: 45, y: 60, w: 380, h: 12 }
];

const LEVEL1_LADDERS_POS = [
    { x: 100, y: 360, h: 80, w: 30 }, { x: 380, y: 360, h: 80, w: 30 },
    { x: 240, y: 280, h: 80, w: 30 }, { x: 150, y: 200, h: 80, w: 30 },
    { x: 330, y: 200, h: 80, w: 30 }, { x: 200, y: 120, h: 80, w: 30 },
    { x: 110, y: 60, h: 60, w: 30 }  // Top floor to next floor down
];

function initLevel1() {
    platforms = [...LEVEL1_LAYOUT];
    ladders = [...LEVEL1_LADDERS_POS];
    beams = [
        { x: 80, y: 430, w: 20, h: 8, collected: false },
        { x: 400, y: 350, w: 20, h: 8, collected: false },
        { x: 100, y: 110, w: 20, h: 8, collected: false },
        { x: 380, y: 50, w: 20, h: 8, collected: false }
    ];
    gaps = [
        { x: 150, y: 360, w: 40, filled: false, riveted: false },
        { x: 300, y: 360, w: 40, filled: false, riveted: false },
        { x: 200, y: 280, w: 40, filled: false, riveted: false },
        { x: 250, y: 200, w: 40, filled: false, riveted: false }
    ];
    jackhammer = { x: 360, y: 57, w: 63, h: 63, vx: 1, active: false, collected: false, minX: 45, maxX: 362 };
    elevator = { x: 5, y: 440, w: 35, h: 8, minY: 60, maxY: 440, vy: 0, state: 'idle' };
    trampolines = [{ x: 450, y: 460, w: 50, h: 40, power: -14.5 }]; // Wider, taller, more power
    enemies = [
        { x: 200, y: 296, w: 48, h: 64, vx: 1.5, type: 'vandal', minX: 60, maxX: 372 },
        { x: 320, y: 216, w: 48, h: 64, vx: -1.2, type: 'osha', minX: 60, maxX: 372 }
    ];
    player = {
        x: 250, y: 381, w: 48, h: 64, vx: 0, vy: 0, speed: 3.2, jumpPower: -6.0,
        prevY: 381,
        onGround: false, onLadder: false, hasBeam: false, hasJackhammer: false,
        beamsReady: 0, gapsRiveted: 0, facingRight: true,
        carryingBox: null // Track carried toolbox
    };
    timeLeft = 280; bonus = 5000;
    movingPlatform = null;
    level2Machines = [];
}

let hazards = []; // Pincers, Dynamite
let magnetTimer = 0;

function initLevel2() {
    // Exact layout from level2.png
    platforms = [
        { x: 0, y: 480, w: 500, h: 4, isFloor: true, color: '#991b1b' }, // Reddish Ground Line at 480
        // 4 Tiers with perfect 80px spacing
        { x: 0, y: 320, w: 150, h: 12 }, { x: 350, y: 320, w: 150, h: 12 }, // Tier 1
        { x: 0, y: 240, w: 150, h: 12 }, { x: 350, y: 240, w: 150, h: 12 }, // Tier 2
        { x: 0, y: 160, w: 150, h: 12 }, { x: 350, y: 160, w: 150, h: 12 }, // Tier 3
        // Tier 4: Closer to the center (Left) and Screen Edge (Right)
        { x: 130, y: 80, w: 60, h: 12 }, { x: 350, y: 80, w: 150, h: 12 },
        // Bottom Left Stripe Platform (Pipe grounded: x: 0, y: 360)
        { x: 0, y: 360, w: 82, h: 12, isStripe: true }
    ];

    ladders = [
        { x: 440, y: 320, h: 160, color: '#ec4899' } // Connect Tier 1 (320) to Ground (480)
    ];

    lunchboxes = [
        { x: 5, y: 302, w: 24, h: 18, collected: false }, // Left Tier 1 (320)
        { x: 400, y: 302, w: 24, h: 18, collected: false }, // Right Tier 1
        { x: 230, y: 462, w: 24, h: 18, collected: false }, // Ground Equispaced 1 (Was overlap)
        { x: 440, y: 462, w: 24, h: 18, collected: false }, // Ground Equispaced 4
        { x: 380, y: 222, w: 24, h: 18, collected: false }, // Tier 2 Right (240)
        { x: 65, y: 142, w: 24, h: 18, collected: false },  // Moved down to Tier 3 Left (160)
        { x: 410, y: 142, w: 24, h: 18, collected: false }   // Moved down to Tier 3 Right (160)
    ];

    hazards = [
        { x: 45, baseX: 45, y: 310, w: 20, h: 10, type: 'pincer', side: 1 },
        { x: 105, baseX: 105, y: 310, w: 20, h: 10, type: 'pincer', side: -1 },
        { x: 370, y: 470, w: 10, h: 10, type: 'dynamite' } // Ground Equispaced 3
    ];

    level2Machines = [
        { kind: 'hammer', x: 300, y: 460, w: 20, h: 20, collected: false }, // Ground Equispaced 2
        { kind: 'plates', x: 80, y: 222, w: 30, h: 18 }, // Grounded on Tier 2
        { kind: 'machine_part', x: 180, y: 435, w: 30, h: 25 },
        { kind: 'motor', x: 140, y: 45, w: 40, h: 35 },
        { kind: 'recipient', x: 184, y: 440, w: 40, h: 40 } // Aligned with corrected conveyor end
    ];

    // Continuous Diagonal Conveyors
    conveyors = [
        { x: 70, y: 480, targetX: 174, targetY: 430, speed: 1.5, type: 'bottom' },
        { x: 420, y: 160, targetX: 500, targetY: 80, speed: 1.5, type: 'exit' }
    ];

    // Level 2: Crane Lift
    // Range adjusted for Tier 4 (top) and Tier 1 (bottom)
    elevator = { x: 175, y: 320, w: 150, h: 12, minY: 80, maxY: 320, vy: -1.5, state: 'auto' };

    paternosterPlatforms = [];
    magnet = { x: 210, y: 10, w: 80, h: 60, active: false };

    enemies = [
        { x: 400, y: 176, w: 48, h: 64, vx: -1.2, type: 'osha', minX: 350, maxX: 452 }, // Tier 2 (240)
        { x: 60, y: 96, w: 48, h: 64, vx: 1.5, type: 'vandal', minX: 0, maxX: 102 }   // Tier 3 (160)
    ];

    player = {
        x: 20, y: 416, w: 48, h: 64, vx: 0, vy: 0, speed: 3.2, jumpPower: -6.0,
        prevY: 416,
        onGround: false, onLadder: false, boxesCollected: 0, facingRight: true,
        hasHammer: false, caughtByMagnet: false
    };

    timeLeft = 280; bonus = 6000;
}

function initLevel3() {
    platforms = [
        { x: 0, y: 460, w: 500, h: 10, isFloor: true }, // Ground Floor
        // Tier 2 (380): 4 Equal 70px segments with 50px gaps and 120px central shaft
        { x: 0, y: 380, w: 70, h: 12 }, { x: 120, y: 380, w: 70, h: 12 },
        { x: 310, y: 380, w: 70, h: 12 }, { x: 430, y: 380, w: 70, h: 12 },

        { x: 0, y: 273, w: 160, h: 12 }, { x: 340, y: 273, w: 160, h: 12 }, // Tier 3 (273)
        { x: 340, y: 166, w: 160, h: 12 }, // Tier 4 (166)

        { x: 0, y: 60, w: 500, h: 12 } // Top platform
    ];
    ladders = [
        { x: 28, y: 273, h: 107 }, { x: 452, y: 273, h: 107 }, // Mid ladders (Tier 2 to 3)
        { x: 130, y: 58, h: 108, isRope: true }, { x: 370, y: 58, h: 108, isRope: true } // Top ropes (Tier 4 to 5) - FIXED START Y
    ];
    steelBlocks = [
        { x: 130, y: 365, w: 20, h: 15, collected: false },
        { x: 350, y: 365, w: 20, h: 15, collected: false },
        { x: 50, y: 258, w: 20, h: 15, collected: false },
        { x: 430, y: 258, w: 20, h: 15, collected: false },
        { x: 320, y: 45, w: 20, h: 15, collected: false },
        { x: 150, y: 45, w: 20, h: 15, collected: false }
    ];
    processors = [
        { x: 51, y: 418, w: 88, h: 40, count: 0 },
        { x: 361, y: 418, w: 88, h: 40, count: 0 }
    ];
    blocksProcessed = 0;
    collectionAnimations = [];
    conveyors = [];
    movingPlatform = { x: 0, y: 166, w: 160, h: 12, beltSpeed: 1.3 };
    trampolines = [
        { x: 170, y: 450, w: 40, h: 10, power: -12.5 }, // Left pod
        { x: 290, y: 450, w: 40, h: 10, power: -12.5 }  // Right pod
    ];
    elevator = null;
    // Ferris-wheel paternoster: right side goes UP, left side goes DOWN
    paternosterPlatforms = [];
    const shaftCX = LEVEL3_PATERNOSTER.centerX;
    const shaftHW = LEVEL3_PATERNOSTER.shaftHalfWidth;
    const pMinY = LEVEL3_PATERNOSTER.minY;
    const pMaxY = LEVEL3_PATERNOSTER.maxY;
    const pRange = pMaxY - pMinY;
    const stepW = LEVEL3_PATERNOSTER.stepWidth;
    const stepH = LEVEL3_PATERNOSTER.stepHeight;
    for (let i = 0; i < LEVEL3_PATERNOSTER.stepCount; i++) {
        let phase = i / LEVEL3_PATERNOSTER.stepCount;
        let x, y;
        if (phase < 0.5) {
            let t = phase / 0.5;
            x = shaftCX + shaftHW;
            y = pMaxY - t * pRange;
        } else {
            let t = (phase - 0.5) / 0.5;
            x = shaftCX - shaftHW - stepW;
            y = pMinY + t * pRange;
        }
        paternosterPlatforms.push({ phase: phase, x: x, y: y, w: stepW, h: stepH });
    }
    enemies = [
        { x: 50, y: 102, w: 48, h: 64, vx: 2, type: 'vandal', minX: 10, maxX: 112 },
        { x: 350, y: 102, w: 48, h: 64, vx: -2, type: 'vandal', minX: 345, maxX: 452 }
    ];
    player = {
        x: 360, y: 214, w: 48, h: 64, vx: 0, vy: 0, speed: 3.2, jumpPower: -6.0,
        prevY: 214,
        onGround: false, onLadder: false, hasBlock: false, facingRight: true
    };
    timeLeft = 280; bonus = 7000;
    debugLogState('initLevel3');
    level2Machines = [];
}

function initCurrentLevel() {
    if (level === 1) initLevel1();
    else if (level === 2) initLevel2();
    else if (level === 3) initLevel3();
}

function updateHUD() {
    if (scoreElement) scoreElement.textContent = score.toString().padStart(6, '0');
    if (livesElement) livesElement.textContent = lives;
    if (levelElement) levelElement.textContent = level;
    if (timeElement) timeElement.textContent = Math.ceil(timeLeft);
    if (bonusElement) bonusElement.textContent = `BONUS: ${Math.floor(bonus).toString().padStart(4, '0')}`;
}

function update(deltaTime) {
    if (!gameRunning) return;
    if (DEBUG) debugAccumulator += deltaTime;

    // Calculate timeStep for frame-rate independence (60fps baseline)
    const timeStep = Math.min(2.0, (deltaTime / 16.666)) * SPEED_MODIFIER;

    player.prevY = player.y;

    timeLeft -= (deltaTime / 1000); // Timer stays real-time
    if (timeLeft <= 0) { loseLife("TIME EXPIRED"); return; }
    bonus = Math.max(0, bonus - (deltaTime / 100) * SPEED_MODIFIER);
    frameCount += timeStep; // Animation speed synced to timeStep

    if (keys.Left) { player.vx = -player.speed; player.facingRight = false; }
    else if (keys.Right) { player.vx = player.speed; player.facingRight = true; }
    else { player.vx = 0; }

    // Refined "Up" as Jump logic: If on ground, Up is a Jump.
    if (keys.Up && player.onGround) {
        player.vy = player.jumpPower;
        player.onGround = false;
        keys.Up = false; // Prevent auto-rejump
    }

    // Ladder Logic (Robust center-matching)
    player.onLadder = false;
    for (let l of ladders) {
        const ladderW = l.w || 30;
        if (Math.abs((player.x + player.w / 2) - (l.x + ladderW / 2)) < 25 &&
            player.y + player.h >= l.y - 12 && player.y <= l.y + l.h + 8) {
            player.onLadder = true;
            break;
        }
    }

    let isClimbing = false;
    if (player.onLadder) {
        // Only "climb" if pressing keys or already slow in the air (stick to ladder)
        if (keys.Up || keys.Down || (!player.onGround && Math.abs(player.vy) < 1.0)) {
            player.vy = 0;
            if (keys.Up) player.vy = -player.speed;
            if (keys.Down) player.vy = player.speed;
            isClimbing = true;
        }
    }

    if (level === 1 && elevator) {
        // Level 1 logic remains manual
        const onElevator = player.vy >= 0 && checkCollision(player, elevator);
        const playerNearShaft = player.x < 60;
        if (!onElevator && playerNearShaft) {
            if (keys.Up && elevator.y > player.y + 10) elevator.vy = -player.speed;
            else if (keys.Down && elevator.y < player.y - 10) elevator.vy = player.speed;
            else elevator.vy = 0;
        }
        if (onElevator) {
            if (keys.Up) elevator.vy = -player.speed;
            else if (keys.Down) elevator.vy = player.speed;
            else elevator.vy = 0;
            elevator.y += elevator.vy * timeStep;
            elevator.y = Math.max(elevator.minY, Math.min(elevator.maxY, elevator.y));
            player.y = elevator.y - player.h;
            player.vy = 0;
            player.onGround = true;
        } else {
            if (!playerNearShaft || (!keys.Up && !keys.Down)) elevator.vy = 0;
            elevator.y += elevator.vy * timeStep;
            elevator.y = Math.max(elevator.minY, Math.min(elevator.maxY, elevator.y));
        }
    } else if (level === 2 && elevator) {
        // Level 2: Oscillating Lift
        elevator.y += elevator.vy * timeStep;
        if (elevator.y <= elevator.minY || elevator.y >= elevator.maxY) elevator.vy *= -1;

        if (player.vy >= 0 && checkCollision(player, elevator)) {
            player.y = elevator.y - player.h;
            player.vy = 0;
            player.onGround = true;
        }
    } else if (level === 3 && paternosterPlatforms.length > 0) {
        // Ferris-wheel paternoster: right side UP, left side DOWN
        const phaseSpeed = LEVEL3_PATERNOSTER.phaseSpeed;
        const shaftCX = LEVEL3_PATERNOSTER.centerX;
        const shaftHW = LEVEL3_PATERNOSTER.shaftHalfWidth;
        const pMinY = LEVEL3_PATERNOSTER.minY;
        const pMaxY = LEVEL3_PATERNOSTER.maxY;
        const pRange = pMaxY - pMinY;
        for (let p of paternosterPlatforms) {
            p.phase = (p.phase + phaseSpeed * timeStep) % 1.0;
            if (p.phase < 0.5) {
                // Right side, going UP
                let t = p.phase / 0.5;
                p.x = shaftCX + shaftHW;
                p.y = pMaxY - t * pRange;
            } else {
                // Left side, going DOWN
                let t = (p.phase - 0.5) / 0.5;
                p.x = shaftCX - shaftHW - p.w;
                p.y = pMinY + t * pRange;
            }
            if (player.vy >= 0 && checkCollision(player, p)) {
                player.y = p.y - player.h;
                player.vy = 0;
                player.onGround = true;
            }
        }

        if (movingPlatform) {
            if (player.vy >= 0 && checkCollision(player, movingPlatform)) {
                player.y = movingPlatform.y - player.h;
                player.vy = 0;
                player.onGround = true;
                player.x += movingPlatform.beltSpeed * timeStep;
            }
        }
    }

    if (isClimbing) {
        // Ladder Snap (Only when climbing UP and reaching a platform top)
        if (keys.Up && !player.onGround) {
            for (let p of platforms) {
                if (player.x + player.w / 2 > p.x && player.x + player.w / 2 < p.x + p.w &&
                    player.y + player.h > p.y - 12 && player.y + player.h < p.y + 2) {
                    player.y = p.y - player.h;
                    player.onGround = true;
                    player.vy = 0;
                    isClimbing = false;
                }
            }
        }
    } else if (!((level === 1 && elevator && checkCollision(player, elevator))) &&
        !((level === 2 && elevator && checkCollision(player, elevator))) &&
        !((level === 3) && paternosterPlatforms.some(p => checkCollision(player, p))) &&
        !((level === 3) && movingPlatform && checkCollision(player, movingPlatform))) {
        player.vy += 0.5 * timeStep;
    }

    if (keys.Space && player.onGround && !player.onLadder) {
        player.vy = player.jumpPower;
        player.onGround = false;
        keys.Space = false; // Prevent multi-jump
    }

    for (let t of trampolines) {
        if (player.vy >= 0 && checkCollision(player, t)) {
            player.vy = t.power; player.onGround = false;
        }
    }

    player.x += player.vx * timeStep;
    player.y += player.vy * timeStep;
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.w, player.x));
    if (player.y > CANVAS_HEIGHT) { loseLife("PERIMETER BREACH / FELL"); return; }

    player.onGround = false;
    for (let p of platforms) {
        let canPassDown = false;
        if (keys.Down) {
            // Check if on a ladder or at the TOP of a ladder (wanting to go down)
            for (let l of ladders) {
                const ladderW = l.w || 30;
                if (Math.abs((player.x + player.w / 2) - (l.x + ladderW / 2)) < 25 &&
                    player.y + player.h >= p.y - 12 && player.y + player.h <= p.y + 30 &&
                    l.y <= p.y + 2 && l.y + l.h > p.y + 2) {
                    canPassDown = true;
                    break;
                }
            }
        }
        if (canPassDown) continue;

        const checkRange = 20; // Only check center 20px
        // One-Way Platform Logic:
        // 1. Must be falling or standing (vy >= 0)
        // 2. Middle/Lower body must be at or above the platform (Half-body rule)
        // 3. Feet must have been above the platform in previous frame
        if (player.vy >= 0 &&
            player.y + (player.h * 0.5) <= p.y + 4 &&
            player.prevY + player.h <= p.y + 12 &&
            player.x + player.w / 2 + checkRange / 2 > p.x &&
            player.x + player.w / 2 - checkRange / 2 < p.x + p.w &&
            player.y + player.h >= p.y - 4 &&
            player.y + player.h <= p.y + (player.onGround ? 12 : 8)) {

            if (level === 1) {
                let onGap = false;
                for (let g of gaps) {
                    // Gap check must match platform checkRange (center 20px)
                    if (!g.filled && Math.abs(player.y + player.h - g.y) < 10 &&
                        (player.x + player.w / 2 + 10) > g.x &&
                        (player.x + player.w / 2 - 10) < g.x + g.w) {
                        onGap = true; break;
                    }
                }
                if (onGap) continue;
            }
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
        }
    }

    if (level === 1) {
        for (let b of beams) if (!b.collected && !player.hasBeam && checkCollision(player, b)) { b.collected = true; player.hasBeam = true; score += 50; }
        if (player.hasBeam) {
            for (let g of gaps) if (!g.filled && checkCollision(player, { x: g.x, y: g.y, w: g.w, h: 12 })) {
                g.filled = true; player.hasBeam = false; player.beamsReady++; score += 100;
                if (player.beamsReady === 4) jackhammer.active = true;
            }
        }
        if (jackhammer.active && !player.hasJackhammer) {
            jackhammer.x += jackhammer.vx * timeStep;
            if (jackhammer.x < jackhammer.minX || jackhammer.x > jackhammer.maxX) jackhammer.vx *= -1;
            if (checkCollision(player, jackhammer)) { player.hasJackhammer = true; score += 500; }
        }
        if (player.hasJackhammer) {
            for (let g of gaps) if (g.filled && !g.riveted && checkCollision(player, { x: g.x, y: g.y - 15, w: g.w, h: 30 })) {
                g.riveted = true; player.gapsRiveted++; score += 200;
                if (player.gapsRiveted === 4) { score += Math.floor(bonus); nextLevel(); }
            }
        }
    } else if (level === 2) {
        for (let lb of lunchboxes) {
            if (!lb.collected && checkCollision(player, lb)) {
                lb.collected = true;
                player.boxesCollected++;
                score += 200;
                if (player.boxesCollected === 7) magnet.active = true;
            }
        }

        // Pincer Horizontal Movement toward midpoint (x: 75) with 1s pause
        const pincerCycle = 200;
        const pt = frameCount % pincerCycle;
        let pincerRatio = 0;
        if (pt < 70) pincerRatio = Math.sin((pt / 70) * (Math.PI / 2));
        else if (pt < 130) pincerRatio = 1; // 60 frame (1 second) pause at center
        else pincerRatio = Math.cos(((pt - 130) / 70) * (Math.PI / 2));

        for (let h of hazards) {
            if (h.type === 'pincer') {
                h.x = h.baseX + (75 - h.baseX) * pincerRatio;
            }
        }

        for (let m of level2Machines) {
            if (m.kind === 'hammer' && !m.collected && checkCollision(player, m)) {
                m.collected = true;
                player.hasHammer = true;
                player.speed = 4.5; // Hammer boost?
                score += 500;
            }
        }

        for (let h of hazards) {
            let colObj = h;
            // Relax Dynamite collision (Forgiving: 60% width, 40% height)
            if (h.type === 'dynamite') {
                colObj = { x: h.x + h.w * 0.2, y: h.y + h.h * 0.6, w: h.w * 0.6, h: h.h * 0.4 };
            }
            // Relax Pincer collision (30% width, 40% height) to allow jumping over
            else if (h.type === 'pincer') {
                colObj = { x: h.x + h.w * 0.35, y: h.y + h.h * 0.6, w: h.w * 0.3, h: h.h * 0.4 };
            }
            // Tighten Slag collision (50% width, 60% height) for fair play
            else if (h.type === 'slag') {
                colObj = { x: h.x + h.w * 0.25, y: h.y + h.h * 0.4, w: h.w * 0.5, h: h.h * 0.6 };
            }
            if (checkCollision(player, colObj)) loseLife(h.type.toUpperCase() + " HAZARD");
        }

        // --- NEW: Player-Conveyor Interaction ---
        for (let c of conveyors) {
            if (player.vy >= 0) { // Only collide when falling or standing
                const px = player.x + player.w / 2;
                if (px >= c.x && px <= c.targetX) {
                    // Dynamic Diagonal Height Calculation
                    const slope = (c.y - c.targetY) / (c.targetX - c.x);
                    const beltY = c.y - (px - c.x) * slope;
                    if (player.y + player.h >= beltY - 8 && player.y + player.h <= beltY + 8) {
                        player.y = beltY - player.h - 3; // Snap 3px above base surface
                        player.vy = 0;
                        player.onGround = true;
                        player.x += c.speed * timeStep; // Carry Mack along
                    }
                }
            }
        }

        // Slag Spawning (One every 2 seconds / 120 frames robustly)
        if (Math.floor(frameCount / 120) > Math.floor((frameCount - timeStep) / 120)) {
            hazards.push({ x: 76, y: 372, w: 16, h: 16, type: 'slag', state: 'falling' });
        }

        for (let i = hazards.length - 1; i >= 0; i--) {
            let h = hazards[i];
            if (h.type === 'slag') {
                if (h.state === 'falling') {
                    h.y += 3 * timeStep;
                    // Precise Diagonal Snapping (belt starts at x=70, y=480, ends at x=174, y=430)
                    let beltY = 480 - (h.x - 70) * 0.48; // Updated slope for 174 width
                    if (h.y >= beltY - h.h - 3 && h.x >= 70 && h.x <= 174) {
                        h.y = beltY - h.h - 3; // Snap 3px above base surface
                        h.state = 'conveyor';
                    } else if (h.y > 500) {
                        hazards.splice(i, 1);
                    }
                } else if (h.state === 'conveyor') {
                    h.x += 0.8 * timeStep;
                    // Keep snapped while on conveyor (3px up)
                    let beltY = 480 - (h.x - 70) * 0.48;
                    h.y = beltY - h.h - 3;
                    if (h.x > 174) h.state = 'final_fall';
                } else if (h.state === 'final_fall') {
                    h.y += 4 * timeStep;
                    // Collect in recipient at x: 184 (end of 70->174 conveyor)
                    if (h.y >= 440 && h.x >= 170 && h.x <= 230) {
                        hazards.splice(i, 1);
                    } else if (h.y > 500) {
                        hazards.splice(i, 1);
                    }
                }
            }
        }

        // Magnet logic
        if (magnet.active && !player.caughtByMagnet) {
            if (player.y < 120 && Math.abs((player.x + player.w / 2) - (magnet.x + magnet.w / 2)) < 20) {
                player.caughtByMagnet = true;
                score += 1000;
            }
        }

        if (player.caughtByMagnet) {
            player.vx = 0; player.vy = 0;
            player.y -= 2 * timeStep;
            if (player.y < -50) { score += Math.floor(bonus); nextLevel(); }
        }
    }
    else if (level === 3) {
        // Update Steel Blocks physics (Gravity + Platform Collision)
        for (let sb of steelBlocks) {
            if (!sb.collected) {
                sb.vy = (sb.vy || 0) + 0.3 * timeStep;
                sb.y += sb.vy * timeStep;

                // Block landing on platforms
                let onPlat = false;
                for (let p of platforms) {
                    if (sb.y + sb.h >= p.y && sb.y + sb.h <= p.y + 12 &&
                        sb.x + sb.w > p.x && sb.x < p.x + p.w && sb.vy >= 0) {
                        if (sb.vy > 1) sb.landAnim = 1.0; // Trigger landing "bounce" scale
                        sb.y = p.y - sb.h;
                        sb.vy = 0;
                        onPlat = true;
                        break;
                    }
                }
                if (sb.landAnim > 0) sb.landAnim -= 0.1 * timeStep;

                // Handle falling into processors directly
                let pFound = null;
                for (let p of processors) {
                    const intakeRect = { x: p.x - 20, y: p.y - 30, w: p.w + 40, h: 40 };
                    if (checkCollision(sb, intakeRect)) {
                        pFound = p; break;
                    }
                }
                if (pFound) {
                    collectionAnimations.push({
                        x: sb.x, y: sb.y, w: sb.w, h: sb.h,
                        tx: pFound.x + pFound.w / 2 - 8, ty: pFound.y + 15,
                        life: 1.0, pRef: pFound
                    });
                    sb.y = 1000; // Move away
                }

                // Handle falling off bottom
                if (sb.y > 500) {
                    sb.y = -20; // Respawn from top for simplicity if lost? Or just kill it.
                    sb.collected = true; // Temporary: hide it if lost
                }
            }
        }

        // Handle Pickup with delay guard
        for (let i = steelBlocks.length - 1; i >= 0; i--) {
            let sb = steelBlocks[i];
            if (sb.pickupDelay > 0) sb.pickupDelay -= timeStep;

            if (!sb.collected && !player.hasBlock && (sb.pickupDelay <= 0 || !sb.pickupDelay) && checkCollision(player, sb)) {
                sb.collected = true;
                player.hasBlock = true;
                score += 50;
            }
        }

        // Intake check BEFORE drop check
        let atDish = false;
        let pFound = null;
        for (let p of processors) {
            const leftDishIntake = { x: p.x - 50, y: p.y - 20, w: 50, h: 80 };
            const rightDishIntake = { x: p.x + p.w, y: p.y - 20, w: 50, h: 80 };
            const topDishIntake = { x: p.x + p.w / 2 - 30, y: p.y - 45, w: 60, h: 50 };
            if (checkCollision(player, p) || checkCollision(player, leftDishIntake) || checkCollision(player, rightDishIntake) || checkCollision(player, topDishIntake)) {
                atDish = true;
                pFound = p;
                break;
            }
        }
        if (player.hasBlock && atDish && pFound) {
            player.hasBlock = false;
            // Spawn Collection Animation
            collectionAnimations.push({
                x: player.x + (player.facingRight ? 30 : -10),
                y: player.y + 20,
                w: 16, h: 16,
                tx: pFound.x + pFound.w / 2 - 8,
                ty: pFound.y + 15,
                life: 1.0, // Progress from 1 to 0
                pRef: pFound
            });
            blocksProcessed++;
            score += 300;
            if (blocksProcessed === 6) { score += Math.floor(bonus); nextLevel(); }
        } else if (player.hasBlock && keys.Down && !player.onLadder) {
            // Drop Mechanic: Prevent drop while climbing ladders
            player.hasBlock = false;
            steelBlocks.push({
                x: player.x + (player.facingRight ? 35 : -15),
                y: player.y + 10, // Drop from hand/chest level
                w: 20, h: 15,
                collected: false,
                vy: 2.0, // Initial downward kick for visual feedback
                pickupDelay: 60 // 1 second cooldown
            });
        }

        // Update Collection Animations
        for (let i = collectionAnimations.length - 1; i >= 0; i--) {
            let anim = collectionAnimations[i];
            anim.life -= 0.05 * timeStep;
            // Move towards target
            anim.x += (anim.tx - anim.x) * 0.2 * timeStep;
            anim.y += (anim.ty - anim.y) * 0.2 * timeStep;
            if (anim.life <= 0) {
                anim.pRef.count++;
                collectionAnimations.splice(i, 1);
            }
        }
    }
    for (let e of enemies) {
        e.x += e.vx * timeStep;
        if (e.x < e.minX || e.x > e.maxX) {
            e.vx *= -1;
            e.x = Math.max(e.minX, Math.min(e.maxX, e.x));
        }

        let colObj = e;
        if (level === 2 && (e.type === 'osha' || e.type === 'vandal')) {
            // Relaxed Enemy Hitbox (50% width, 70% height - Trimmed top/sides)
            colObj = { x: e.x + e.w * 0.25, y: e.y + e.h * 0.3, w: e.w * 0.5, h: e.h * 0.7 };
        }

        if (checkCollision(player, colObj)) loseLife(e.type.toUpperCase() + " COLLISION");
    }
    if (DEBUG && debugAccumulator >= 1000) {
        debugAccumulator = 0;
        debugLogState('tick');
    }
    updateHUD();
}

/**
 * Renders a high-fidelity industrial beam (girder/brick) with metallic gradients and rivets.
 */
function drawDetailedBeam(x, y, w, h) {
    ctx.save();
    // Main Girder Body (Industrial red/orange)
    const beamGrad = ctx.createLinearGradient(x, y, x, y + h);
    beamGrad.addColorStop(0, '#ef4444'); // Bright Red
    beamGrad.addColorStop(0.5, '#b91c1c'); // Deep Red
    beamGrad.addColorStop(1, '#7f1d1d'); // Dark Red
    ctx.fillStyle = beamGrad;
    fillRoundedRect(x, y, w, h, 2);

    // Structural "H-Beam" Detail (Indentation)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 2, y + 2, w - 4, h / 2 - 1);

    // Rivets (Sophisticated metallic dots)
    ctx.fillStyle = '#CBD5E1';
    const rivetSize = 2;
    // Four corners if wide enough
    if (w > 10) {
        ctx.beginPath();
        ctx.arc(x + 4, y + 4, rivetSize, 0, Math.PI * 2);
        ctx.arc(x + w - 4, y + 4, rivetSize, 0, Math.PI * 2);
        ctx.arc(x + 4, y + h - 4, rivetSize, 0, Math.PI * 2);
        ctx.arc(x + w - 4, y + h - 4, rivetSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Highlight Edge
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    strokeRoundedRect(x, y, w, h, 2);
    ctx.restore();
}

function drawNeoGirder(x, y, w, h, forcedColor = null, forcedEdge = null) {
    const topCol = forcedColor || (level === 2 ? '#3b82f6' : (level === 3 ? '#60A5FA' : COLORS.PLATFORM_TOP));
    const botCol = forcedEdge || (level === 2 ? '#1e3a8a' : (level === 3 ? '#2563EB' : COLORS.PLATFORM_BOTTOM));

    ctx.save();

    // Main Body Gradient (Metallic/Sophisticated)
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#60a5fa'); // Highlight top
    grad.addColorStop(0.2, topCol);  // Main top skin
    grad.addColorStop(0.8, botCol);  // Main bottom skin
    grad.addColorStop(1, '#0f172a'); // Deep edge shadow

    ctx.fillStyle = grad;
    fillRoundedRect(x, y, w, h, 2);

    // Bevel/Shine effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 1);
    ctx.lineTo(x + w - 2, y + 1);
    ctx.stroke();

    // Rivet Details (Industrial Look)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let rx = x + 15; rx < x + w - 10; rx += 40) {
        ctx.beginPath(); ctx.arc(rx, y + h / 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(rx - 1, y + h / 2 - 1, 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
    }

    // Weathering/Texture (Subtle noise)
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 2);
    }

    ctx.restore();
}

function drawProfessionalLadder(l) {
    const ladderW = l.w || 30;
    const isRope = l.isRope || false;
    ctx.save();

    if (isRope) {
        // High-end Rope Visual 
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(l.x + 2, l.y, 2, l.h);
        ctx.fillRect(l.x + ladderW - 4, l.y, 2, l.h);
        for (let i = 6; i < l.h; i += 14) {
            ctx.fillStyle = '#FFF'; ctx.fillRect(l.x + 1, l.y + i, ladderW - 2, 2);
        }
    } else {
        // High-end Industrial Metallic Ladder
        // Left Rail
        const railGrad = ctx.createLinearGradient(l.x, l.y, l.x + 4, l.y);
        railGrad.addColorStop(0, '#475569'); railGrad.addColorStop(0.5, '#94A3B8'); railGrad.addColorStop(1, '#1E293B');
        ctx.fillStyle = railGrad;
        ctx.fillRect(l.x, l.y, 6, l.h);
        // Right Rail
        ctx.fillRect(l.x + ladderW - 6, l.y, 6, l.h);

        // Rungs (Sophisticated look)
        for (let i = 0; i < l.h; i += 12) {
            const rungGrad = ctx.createLinearGradient(l.x, l.y + i, l.x + ladderW, l.y + i);
            rungGrad.addColorStop(0, '#64748B'); rungGrad.addColorStop(0.5, '#CBD5E1'); rungGrad.addColorStop(1, '#64748B');
            ctx.fillStyle = rungGrad;
            ctx.fillRect(l.x, l.y + i, ladderW, 3);

            // Detail: Rung shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(l.x + 2, l.y + i + 3, ladderW - 4, 1);
        }
    }
    ctx.restore();
}

/**
 * Renders an animated industrial pincer (clamp) hazard.
 */
function drawPincerHazard(x, y, w, h, side = 1) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Animation: Clamp opens and closes over time (The "swing")
    const clampRotation = 0.6 + Math.sin(frameCount * 0.15) * 0.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise

    // Pincer Base (Joint/Cylinder) - Scaled 50% again (3.5 -> 1.75)
    const jointGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 2);
    jointGrad.addColorStop(0, '#CBD5E1');
    jointGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = jointGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 1.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Single Jaw (L-shaped "équerre")
    ctx.lineCap = 'square';

    ctx.save();
    ctx.rotate(clampRotation * side);

    // Jaw Arm (L-Shape / Équerre) - Scaled 50% again, keeping 5px width
    const jawGrad = ctx.createLinearGradient(0, -5, 0, 5);
    jawGrad.addColorStop(0, '#EF4444'); // Red
    jawGrad.addColorStop(0.5, '#991B1B'); // Dark Red
    jawGrad.addColorStop(1, '#7F1D1D');
    ctx.strokeStyle = jawGrad;
    ctx.lineWidth = 5; // User: "keep the line thickness of the arm the same"

    // Long side of the "équerre" goes forward
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 0); // Scaled from 8
    ctx.lineTo(6.5, -5 * side); // Scaled from 13 and 10
    ctx.stroke();

    // Highlight line on the outer edge - Keep 1.5px width
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0.5, -0.25 * side);
    ctx.lineTo(3.5, -0.25 * side);
    ctx.lineTo(5.5, -4.5 * side);
    ctx.stroke();

    // The Claw/Teeth at the tip - Scaled 50% again
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(5.75, -4.5 * side);
    ctx.lineTo(7, -6 * side);
    ctx.lineTo(5, -5.5 * side);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.restore();
}

function drawAnimatedSprite(name, x, y, w, h, facingRight, moving = true) {
    const s = sprites[name];
    if (!s || !s.img) return;

    // Frame logic: 4 frames in 2x2 grid
    // Frame Index: 0, 1, 2, 3
    let frame = 0;
    if (moving) {
        frame = Math.floor(frameCount / 10) % s.frames;
    }

    // Frames are 2x2 grid in 640x640 sheet -> each frame is 320x320
    const fw = s.img.width / s.grid;
    const fh = s.img.height / s.grid;
    const sx = (frame % s.grid) * fw;
    const sy = Math.floor(frame / s.grid) * fh;

    ctx.save();
    if (!facingRight) {
        ctx.scale(-1, 1);
        ctx.drawImage(s.img, sx, sy, fw, fh, -x - w, y, w, h);
    } else {
        ctx.drawImage(s.img, sx, sy, fw, fh, x, y, w, h);
    }
    ctx.restore();
}

function draw() {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, COLORS.BG_TOP);
    bgGrad.addColorStop(1, COLORS.BG_BOTTOM);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FFF';
    for (let s of stars) {
        s.y += s.speed; if (s.y > CANVAS_HEIGHT) s.y = 0;
        ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.05 + s.x) * 0.2;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    if (level === 1) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.setLineDash([10, 5]); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(10, 60); ctx.lineTo(10, 440); ctx.moveTo(35, 60); ctx.lineTo(35, 440); ctx.stroke();
        ctx.setLineDash([]);

        // Ladders BEFORE (Background / "Before")
        for (let l of ladders) drawProfessionalLadder(l);

        // Platforms AFTER (Foreground)
        for (let p of platforms) {
            let lastX = p.x;
            let levelGaps = gaps.filter(g => Math.abs(g.y - p.y) < 2);
            levelGaps.sort((a, b) => a.x - b.x);
            for (let g of levelGaps) {
                const gapH = g.h || 12; // Ensure finite value for gradient
                if (g.x > lastX) drawNeoGirder(lastX, p.y, g.x - lastX, p.h);
                if (!g.riveted) {
                    if (g.filled) {
                        drawNeoGirder(g.x, g.y, g.w, gapH, '#fbbf24', '#b45309');
                        ctx.fillStyle = '#FFF'; ctx.fillRect(g.x + g.w / 2 - 5, g.y + 2, 10, p.h - 4);
                        ctx.strokeStyle = 'yellow'; ctx.strokeRect(g.x + 2, g.y + 2, g.w - 4, p.h - 4);
                    } else {
                        ctx.shadowBlur = 10; ctx.shadowColor = 'yellow';
                        ctx.strokeStyle = '#FFFF00'; ctx.setLineDash([4, 2]);
                        ctx.strokeRect(g.x + 2, g.y + 2, g.w - 4, p.h - 4);
                        ctx.shadowBlur = 0; ctx.setLineDash([]);
                    }
                } else {
                    drawNeoGirder(g.x, g.y, g.w, gapH);
                    ctx.fillStyle = '#FFF'; ctx.fillRect(g.x + g.w / 2 - 2, g.y + 1, 4, p.h - 2);
                    ctx.fillStyle = '#0F0'; ctx.shadowBlur = 10; ctx.fillRect(g.x + g.w / 2 - 2, g.y + gapH / 2 - 2, 4, 4); ctx.shadowBlur = 0;
                }
                lastX = g.x + g.w;
            }
            if (lastX < p.x + p.w) drawNeoGirder(lastX, p.y, (p.x + p.w) - lastX, p.h);
        }
    } else {
        for (let p of platforms) {
            drawNeoGirder(p.x, p.y, p.w, p.h);
        }
    }


    if (level === 1) {
        if (elevator) {
            // Sophisticated Elevator Cabin Visual (No Graphic)
            ctx.save();
            // Outer Frame (Metallic)
            const elGrad = ctx.createLinearGradient(elevator.x, elevator.y - 30, elevator.x, elevator.y);
            elGrad.addColorStop(0, '#475569');
            elGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = elGrad;
            ctx.fillRect(elevator.x, elevator.y - 35, elevator.w, 35);
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
            ctx.strokeRect(elevator.x, elevator.y - 35, elevator.w, 35);

            // Internal Grid
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.beginPath();
            for (let i = 1; i < 4; i++) {
                ctx.moveTo(elevator.x + (elevator.w / 4) * i, elevator.y - 35);
                ctx.lineTo(elevator.x + (elevator.w / 4) * i, elevator.y);
            }
            ctx.stroke();

            // Floor Platform
            drawNeoGirder(elevator.x, elevator.y, elevator.w, elevator.h, '#64748b', '#1e293b');
            ctx.restore();
        }
        for (let t of trampolines) {
            // Sophisticated, Taller Trampoline Visual
            ctx.save();
            // Side Supports (Structural Legs - Reaching the ground)
            const legGrad = ctx.createLinearGradient(t.x, t.y, t.x, t.y + t.h);
            legGrad.addColorStop(0, '#64748b'); legGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = legGrad;
            ctx.fillRect(t.x, t.y + 10, 6, t.h - 10);
            ctx.fillRect(t.x + t.w - 6, t.y + 10, 6, t.h - 10);

            // The Frame (Heavy duty circular look)
            ctx.fillStyle = '#334155';
            fillRoundedRect(t.x, t.y + 4, t.w, 6, 3);

            // The Bouncy Surface (Tensioned Pad)
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(t.x + 4, t.y + 5, t.w - 8, 4);

            // Highlight shine on the pad
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(t.x + 6, t.y + 6, t.w - 12, 1);

            ctx.restore();
        }
        for (let b of beams) if (!b.collected) {
            drawDetailedBeam(b.x, b.y, b.w, b.h);
        }
        if (jackhammer.active && !player.hasJackhammer) {
            drawAnimatedSprite('jackhammer', jackhammer.x, jackhammer.y, jackhammer.w, jackhammer.h, true, true);
        }
    } else if (level === 2) {
        // Ladders FIRST (Background)
        for (let l of ladders) drawProfessionalLadder(l);

        // Platforms SECOND (Foreground)
        for (let p of platforms) {
            if (p.isFloor) {
                ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h);
            } else if (p.isStripe) {
                // Realistic Industrial Pipe (3D Cylindrical Look)
                const pipeGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
                pipeGrad.addColorStop(0, '#701a75'); // Dark pink/purple
                pipeGrad.addColorStop(0.5, '#cc00cc'); // Center light
                pipeGrad.addColorStop(1, '#701a75'); // Bottom shadow
                ctx.fillStyle = pipeGrad;
                ctx.fillRect(p.x, p.y, p.w, p.h);

                // Highlight shine along top
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(p.x, p.y + 1, p.w, 2);

                // Pipe Flange (Collar/Rim) on the right edge
                const flangeX = p.x + p.w - 12;
                ctx.fillStyle = '#475569'; // Steel Flange
                ctx.fillRect(flangeX, p.y - 4, 12, p.h + 8);
                // Flange Rim Detail (Polished highlight)
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
                ctx.strokeRect(flangeX, p.y - 4, 12, p.h + 8);
                // Flange opening shadow (Realistic dark aperture)
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(p.x + p.w - 4, p.y - 2, 4, p.h + 4);
            } else {
                drawNeoGirder(p.x, p.y, p.w, p.h);
            }
        }

        // Machines & Objects
        for (let m of level2Machines) {
            if (m.kind === 'hammer' && !m.collected) {
                ctx.save();
                // 1. Wooden Handle (Slightly tapered)
                const handleGrad = ctx.createLinearGradient(m.x + 8, m.y + 6, m.x + 12, m.y + 6);
                handleGrad.addColorStop(0, '#78350f'); // Dark wood
                handleGrad.addColorStop(1, '#92400e'); // Light wood
                ctx.fillStyle = handleGrad;
                ctx.fillRect(m.x + 9, m.y + 6, 3, 14);

                // 2. Metallic Lead (Polished Steel)
                const headGrad = ctx.createLinearGradient(m.x, m.y, m.x, m.y + 8);
                headGrad.addColorStop(0, '#f8fafc'); // Shine
                headGrad.addColorStop(0.5, '#94a3b8'); // Mid steel
                headGrad.addColorStop(1, '#1e293b'); // Dark shadow
                ctx.fillStyle = headGrad;
                fillRoundedRect(m.x, m.y, 20, 8, 2);

                // 3. Highlight line on head
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(m.x + 2, m.y + 1);
                ctx.lineTo(m.x + 18, m.y + 1);
                ctx.stroke();

                // 4. Rivet at the joint
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath(); ctx.arc(m.x + 10.5, m.y + 4, 1.5, 0, Math.PI * 2); ctx.fill();

                ctx.restore();
            } else if (m.kind === 'plates') {
                // High-Fidelity Metallic Steel Plates
                for (let i = 0; i < 6; i++) {
                    const py = m.y + i * 3;
                    const pGrad = ctx.createLinearGradient(m.x, py, m.x, py + 2);
                    pGrad.addColorStop(0, '#f8fafc'); // Plate Shine
                    pGrad.addColorStop(0.5, '#94a3b8'); // Mid Steel
                    pGrad.addColorStop(1, '#475569'); // Bottom Shadow
                    ctx.fillStyle = pGrad;
                    ctx.fillRect(m.x, py, m.w, 2);
                    // Plate edges (Lattice shadow)
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(m.x, py + 2, m.w, 1);
                }
            } else if (m.kind === 'motor') {
                // Realistic Industrial Motor
                const mGrad = ctx.createLinearGradient(m.x, m.y, m.x + m.w, m.y + m.h);
                mGrad.addColorStop(0, '#475569'); mGrad.addColorStop(1, '#1e293b');
                ctx.fillStyle = mGrad;
                fillRoundedRect(m.x, m.y, m.w, m.h, 4);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                strokeRoundedRect(m.x, m.y, m.w, m.h, 4);
                // Vents
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                for (let i = 0; i < 3; i++) ctx.fillRect(m.x + 5, m.y + 8 + i * 8, m.w - 10, 4);
            } else if (m.kind === 'recipient') {
                // Industrial collector bin
                ctx.fillStyle = '#475569';
                ctx.fillRect(m.x, m.y, m.w, m.h);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
                ctx.strokeRect(m.x, m.y, m.w, m.h);
                // Opening at top
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(m.x + 5, m.y, m.w - 10, 5);
            }
        }

        // Animated Conveyors (Premium visual routine)
        for (let c of conveyors) {
            ctx.save();
            // Side Frames (Industrial Steel)
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 14;
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.targetX, c.targetY); ctx.stroke();

            // Belt (Orange base)
            ctx.strokeStyle = '#f97316'; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.targetX, c.targetY); ctx.stroke();

            // Treads (Animated - Slowed down)
            ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 8;
            ctx.setLineDash([4, 6]);
            ctx.lineDashOffset = -(frameCount * 0.6) % 10;
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.targetX, c.targetY); ctx.stroke();
            ctx.setLineDash([]);

            // Rollers at ends
            ctx.fillStyle = '#1e293b';
            ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(c.targetX, c.targetY, 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(c.targetX, c.targetY, 6, 0, Math.PI * 2); ctx.stroke();

            ctx.restore();
        }
        ctx.lineWidth = 1;

        // Lunchboxes (Faithful white/orange cubes)
        for (let lb of lunchboxes) {
            if (!lb.collected) {
                // Bottom Orange (Realistic shaded)
                const lunchGrad = ctx.createLinearGradient(lb.x, lb.y, lb.x, lb.y + lb.h);
                lunchGrad.addColorStop(0, '#f97316');
                lunchGrad.addColorStop(1, '#ea580c');
                ctx.fillStyle = lunchGrad;
                ctx.fillRect(lb.x, lb.y + 6, lb.w, lb.h - 6);

                // Top White part (Soft shading)
                ctx.fillStyle = '#f8fafc'; ctx.fillRect(lb.x, lb.y, lb.w, 6);

                // Handle (Metallic)
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(lb.x + 6, lb.y); ctx.lineTo(lb.x + 6, lb.y - 4);
                ctx.lineTo(lb.x + lb.w - 6, lb.y - 4); ctx.lineTo(lb.x + lb.w - 6, lb.y); ctx.stroke();

                // Latch
                ctx.fillStyle = '#64748b'; ctx.fillRect(lb.x + lb.w / 2 - 2, lb.y + 4, 4, 4);
            }
        }

        if (elevator) {
            // Steel Support Structure
            ctx.fillStyle = '#334155'; ctx.fillRect(245, 0, 10, 50);
            ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, CANVAS_WIDTH, 5); // Ceiling

            // The ROPE/CABLE (Realistic Steel Braided)
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
            ctx.beginPath();
            // From motor to top support
            ctx.moveTo(160, 60); // Starts at motor center (140 + 20)
            ctx.lineTo(250, 40);
            // From top support down to elevator
            ctx.lineTo(250, elevator.y);
            ctx.stroke();

            // Rope Detail (Twist effect)
            ctx.setLineDash([3, 3]); ctx.strokeStyle = '#475569';
            ctx.stroke(); ctx.setLineDash([]);

            // Pulley Hub at center-top
            ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(250, 40, 12, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();

            // Elevator Girder
            drawNeoGirder(elevator.x, elevator.y, elevator.w, elevator.h);
        }

        if (magnet.active) {
            ctx.save();
            const mx = magnet.x, my = magnet.y, mw = magnet.w, mh = magnet.h;

            // 1. Attraction Field (Doubled Pulsating Glow)
            const pulse = (Math.sin(frameCount / 10) + 1) / 2;
            const glowSize = 120;
            const glowGrad = ctx.createRadialGradient(mx + mw / 2, my + mh / 2, 20, mx + mw / 2, my + mh / 2, glowSize);
            glowGrad.addColorStop(0, `rgba(255, 255, 255, ${0.1 + pulse * 0.2})`);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(mx - glowSize, my - 20, mw + glowSize * 2, mh + 300);

            // 2. Main Metallic Housing (Electromagnet Body)
            const bGrad = ctx.createLinearGradient(mx, my, mx + mw, my);
            bGrad.addColorStop(0, '#475569'); bGrad.addColorStop(0.5, '#cbd5e1'); bGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = bGrad;
            fillRoundedRect(mx, my, mw, mh, 8); // Larger corner radius

            // 3. Copper Coils (Dynamic scaling for 80px width)
            const coilCount = 5;
            const coilWidth = 10;
            const spacing = (mw - (coilCount * coilWidth)) / (coilCount + 1);
            for (let i = 0; i < coilCount; i++) {
                const cx = mx + spacing + i * (coilWidth + spacing);
                ctx.fillStyle = '#92400e'; // Dark Copper
                ctx.fillRect(cx, my + 12, coilWidth, mh - 24);
                // Coil highlight
                ctx.fillStyle = '#d97706';
                ctx.fillRect(cx + 2, my + 12, 2, mh - 24);
            }

            // 4. Pole Pieces (Heavy duty bottom plates)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(mx + 4, my + mh - 8, mw - 8, 8);

            // 5. Rivets & Industrial details (More rivets for larger size)
            ctx.fillStyle = '#cbd5e1';
            const rivets = [
                { x: 8, y: 8 }, { x: mw - 8, y: 8 },
                { x: 8, y: mh - 8 }, { x: mw - 8, y: mh - 8 }
            ];
            for (let r of rivets) {
                ctx.beginPath(); ctx.arc(mx + r.x, my + r.y, 2.5, 0, Math.PI * 2); ctx.fill();
            }

            // 6. "Catch" Feedback (Wider Sparks on Mack)
            if (player.caughtByMagnet) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 8; i++) {
                    const sx = mx + (Math.random() * mw);
                    const sy = my + mh + (Math.random() * (player.y - my));
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + (Math.random() - 0.5) * 20, sy + (Math.random() - 0.5) * 20);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }

        for (let h of hazards) {
            if (h.type === 'slag') {
                // Premium Irregular Rocky Debris (16x16)
                ctx.fillStyle = '#f1f5f9';
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                ctx.beginPath();
                // Irregular jagged path
                ctx.moveTo(h.x + 4, h.y);
                ctx.lineTo(h.x + 12, h.y + 2);
                ctx.lineTo(h.x + 16, h.y + 8);
                ctx.lineTo(h.x + 14, h.y + 14);
                ctx.lineTo(h.x + 8, h.y + 16);
                ctx.lineTo(h.x + 2, h.y + 12);
                ctx.lineTo(h.x, h.y + 6);
                ctx.closePath();
                ctx.fill(); ctx.stroke();

                // Add "Glow/Hot Spots" inside
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(h.x + 6, h.y + 6, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(h.x + 10, h.y + 10, 1.5, 0, Math.PI * 2); ctx.fill();
            } else if (h.type === 'pincer') {
                // Static side orientation (defined in initLevel2)
                drawPincerHazard(h.x, h.y, h.w, h.h, h.side || 1);
            } else if (h.type === 'dynamite') {
                // Precise drawing within the new narrowed 10px hitbox
                ctx.fillStyle = '#FFF'; ctx.fillRect(h.x + 1, h.y, 8, h.h);
                ctx.fillStyle = '#F0F'; ctx.fillRect(h.x + 3, h.y - 4, 4, 4);
            }
        }
    } else if (level === 3) {
        // Platforms & Ladders
        for (let l of ladders) drawProfessionalLadder(l);
        for (let p of platforms) {
            if (p.isFloor) {
                ctx.fillStyle = '#334155'; ctx.fillRect(p.x, p.y, p.w, p.h);
            } else {
                drawNeoGirder(p.x, p.y, p.w, p.h);
            }
        }

        // Steel Blocks
        for (let sb of steelBlocks) {
            if (!sb.collected && sb.y < 500) {
                let scaleY = 1.0;
                if (sb.landAnim > 0) scaleY = 1.0 + Math.sin(sb.landAnim * 10) * 0.2;
                ctx.save();
                ctx.translate(sb.x + sb.w / 2, sb.y + sb.h);
                ctx.scale(1.0, scaleY);
                drawSteelBlock(-sb.w / 2, -sb.h, sb.w, sb.h);
                ctx.restore();
            }
        }

        // Animating Collections
        for (let anim of collectionAnimations) {
            ctx.save();
            ctx.globalAlpha = anim.life;
            const size = 16 * anim.life;
            // Draw centered at anim.x, anim.y
            drawSteelBlock(anim.x, anim.y, size, size);
            ctx.restore();
        }

        // Bottom Processing Machines
        for (let p of processors) {
            const procGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            procGrad.addColorStop(0, '#22C55E');
            procGrad.addColorStop(1, '#15803D');
            ctx.fillStyle = procGrad;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y + p.h);
            ctx.lineTo(p.x + 12, p.y + 10);
            ctx.lineTo(p.x + p.w - 12, p.y + 10);
            ctx.lineTo(p.x + p.w, p.y + p.h);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#D1FAE5';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Parabolic dishes
            const leftDishCx = p.x - 6;
            const rightDishCx = p.x + p.w + 6;
            const sideDishCy = p.y + 21;
            const topDishCx = p.x + p.w / 2;
            const topDishCy = p.y - 10;

            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 4;

            // Dishes
            ctx.save();
            ctx.translate(leftDishCx, sideDishCy);
            ctx.rotate(Math.PI * 1.75);
            ctx.scale(-1, 1);
            ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI * 0.05, Math.PI * 0.78); ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(rightDishCx, sideDishCy);
            ctx.rotate(Math.PI * 1.25);
            ctx.scale(1, -1);
            ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI * 0.05, Math.PI * 0.78); ctx.stroke();
            ctx.restore();

            ctx.beginPath(); ctx.arc(topDishCx, topDishCy, 16, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();

            // Connecting rods & highlights
            ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(p.x + 10, p.y + 18); ctx.lineTo(p.x + p.w - 10, p.y + 18); ctx.stroke();

            // Progress bar
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            fillRoundedRect(p.x + 10, p.y + 28, p.w - 20, 7, 3);
            const progressW = (p.count / 3) * (p.w - 20); // Each can take half the load? Or just total?
            // Let's make it show the total progress or individual.
            const totalProgW = (blocksProcessed / 6) * (p.w - 20);
            const progGrad = ctx.createLinearGradient(p.x + 10, p.y + 28, p.x + 10 + totalProgW, p.y + 28);
            progGrad.addColorStop(0, '#22D3EE');
            progGrad.addColorStop(1, '#0EA5E9');
            ctx.fillStyle = progGrad;
            fillRoundedRect(p.x + 10, p.y + 28, totalProgW, 7, 3);
        }

        // Trampoline Pods
        for (let t of trampolines) {
            const trampGrad = ctx.createLinearGradient(t.x, t.y, t.x, t.y + t.h);
            trampGrad.addColorStop(0, '#334155');
            trampGrad.addColorStop(1, '#1F2937');
            ctx.fillStyle = trampGrad;
            fillRoundedRect(t.x, t.y, t.w, t.h, 4);
            ctx.fillStyle = '#22C55E';
            fillRoundedRect(t.x + 6, t.y - 10, t.w - 12, 10, 3);
        }

        // Central Vertical Shaft (paternoster)
        const shaftTop = LEVEL3_PATERNOSTER.minY - 10;
        const shaftBottom = LEVEL3_PATERNOSTER.maxY + 10;
        const shaftHeight = shaftBottom - shaftTop;
        const shaftGrad = ctx.createLinearGradient(237, shaftTop, 237, shaftBottom);
        shaftGrad.addColorStop(0, '#334155');
        shaftGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = shaftGrad;
        fillRoundedRect(237, shaftTop, 26, shaftHeight, 8);
        ctx.fillStyle = '#1E293B';
        fillRoundedRect(242, shaftTop + 3, 16, shaftHeight - 6, 6);
        // Pulleys at top and bottom
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath(); ctx.arc(250, LEVEL3_PATERNOSTER.minY - 12, 12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(250, LEVEL3_PATERNOSTER.maxY + 12, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(250, LEVEL3_PATERNOSTER.minY - 12, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(250, LEVEL3_PATERNOSTER.maxY + 12, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        // Paternoster steps
        for (let p of paternosterPlatforms) {
            const stepGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            stepGrad.addColorStop(0, '#38BDF8');
            stepGrad.addColorStop(1, '#0284C7');
            ctx.fillStyle = stepGrad;
            fillRoundedRect(p.x, p.y, p.w, p.h, 3);
            ctx.strokeStyle = '#E0F2FE'; ctx.lineWidth = 1;
            strokeRoundedRect(p.x, p.y, p.w, p.h, 3);
        }

        // Left conveyors + diagonal drop machine / drop zone
        for (let c of conveyors) {
            if (c.kind === 'dropMachine') {
                const machineGrad = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
                machineGrad.addColorStop(0, '#E2E8F0');
                machineGrad.addColorStop(1, '#94A3B8');
                ctx.fillStyle = machineGrad;
                fillRoundedRect(c.x, c.y, c.w, c.h, 6);
                ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1.5;
                strokeRoundedRect(c.x, c.y, c.w, c.h, 6);
                ctx.fillStyle = '#22C55E'; fillRoundedRect(c.x + 8, c.y + 8, c.w - 16, 7, 3);
                continue;
            }
            const beltH = c.h || 12;
            const beltGrad = ctx.createLinearGradient(c.x, c.y, c.x + c.w, c.y + beltH);
            beltGrad.addColorStop(0, '#64748B');
            beltGrad.addColorStop(1, '#475569');
            ctx.fillStyle = beltGrad;
            fillRoundedRect(c.x, c.y, c.w, beltH, 3);
            const stripe = (Date.now() / 45) % 20;
            ctx.fillStyle = '#FFF';
            fillRoundedRect(c.x + stripe, c.y + 2, Math.min(10, c.w), Math.max(3, beltH - 4), 2);
            if (c.kind === 'diagonal') {
                ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 1; strokeRoundedRect(c.x, c.y, c.w, beltH, 3);
            }
        }

        if (movingPlatform) {
            const mpGrad = ctx.createLinearGradient(movingPlatform.x, movingPlatform.y, movingPlatform.x, movingPlatform.y + movingPlatform.h);
            mpGrad.addColorStop(0, '#D1D5DB');
            mpGrad.addColorStop(1, '#6B7280');
            ctx.fillStyle = mpGrad;
            fillRoundedRect(movingPlatform.x, movingPlatform.y, movingPlatform.w, movingPlatform.h, 4);
            ctx.strokeStyle = '#E5E7EB';
            strokeRoundedRect(movingPlatform.x, movingPlatform.y, movingPlatform.w, movingPlatform.h, 4);

            const hatchOffset = (frameCount * 1.5) % 14;
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            for (let i = -14; i < movingPlatform.w + 14; i += 14) {
                ctx.beginPath();
                ctx.moveTo(movingPlatform.x + i + hatchOffset, movingPlatform.y + movingPlatform.h - 1);
                ctx.lineTo(movingPlatform.x + i + 8 + hatchOffset, movingPlatform.y + 1);
                ctx.stroke();
            }

            const leftRollerX = movingPlatform.x + 12;
            const rightRollerX = movingPlatform.x + movingPlatform.w - 12;
            const rollerY = movingPlatform.y + movingPlatform.h / 2;
            const rollerAngle = frameCount * 0.16;
            ctx.fillStyle = '#374151';
            for (let rollerX of [leftRollerX, rightRollerX]) {
                ctx.beginPath();
                ctx.arc(rollerX, rollerY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.save();
                ctx.translate(rollerX, rollerY);
                ctx.rotate(rollerAngle);
                ctx.strokeStyle = '#93C5FD';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
                ctx.moveTo(0, -4); ctx.lineTo(0, 4);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    for (let e of enemies) drawAnimatedSprite(e.type, e.x, e.y, e.w, e.h, e.vx > 0, true);
    drawAnimatedSprite('player', player.x, player.y, player.w, player.h, player.facingRight, player.vx !== 0 || player.vy !== 0);

    if (level === 1 && player.hasJackhammer) {
        // Held Jackhammer (Closer to player, correctly positioned)
        const jX = player.facingRight ? player.x + 15 : player.x - 28;
        drawAnimatedSprite('jackhammer', jX, player.y - 4, 60, 60);
    }
    if ((level === 1 && player.hasBeam) || (level === 3 && player.hasBlock)) {
        // Carried Object: Exactly matching ground girder dimensions (20x8)
        // Positioned at "front" of player based on direction
        const beamW = 20;
        const beamH = 8;
        // Half the distance: Move it 12px inward from the extreme edge to align with hands
        const carryX = player.facingRight ? player.x + 36 : player.x - 8;
        const carryY = player.y + 18; // Lifted slightly higher to hands/chest
        if (level === 1) {
            drawDetailedBeam(carryX, carryY, beamW, beamH);
        } else {
            // Level 3 Block: Unified Steel Block Visual
            drawSteelBlock(carryX, carryY, 16, 16);
        }
    }

    const vig = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 200, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 350);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (deathTimer > 0) {
        deathTimer -= 16;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH, 60);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(deathMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 7);
    }

    if (DEBUG) {
        const p0 = paternosterPlatforms[0];
        const p0Text = p0 ? `${Math.round(p0.x)},${Math.round(p0.y)}` : 'none';
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(8, 8, 300, 74);
        ctx.strokeStyle = '#0F0';
        ctx.strokeRect(8, 8, 300, 74);
        ctx.fillStyle = '#0F0';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`DBG ${DEBUG_BUILD}`, 14, 24);
        ctx.fillText(`level=${level} running=${gameRunning}`, 14, 40);
        ctx.fillText(`paternosters=${paternosterPlatforms.length} p0=${p0Text}`, 14, 56);
        ctx.fillText(`player=${Math.round(player.x || 0)},${Math.round(player.y || 0)}`, 14, 72);
        ctx.restore();
    }
}

function loseLife(reason) {
    deathMessage = "DIAGNOSTIC: " + reason;
    deathTimer = 1500;
    lives--;
    if (lives < 0) { showOverlay("GAME OVER", "REASON: " + reason); }
    else {
        initCurrentLevel();
        player.vy = 0;
    }
}

function showOverlay(title, msg) {
    gameRunning = false;
    overlay.classList.remove('hidden');
    overlayTitle.textContent = title;
    overlayTitle.style.color = title === "VICTORY" ? "#0f0" : "#f00";
    overlayTitle.style.textShadow = title === "VICTORY" ? "0 0 10px #0f0" : "0 0 10px #f00";
    overlayMsg.textContent = msg;
}

function nextLevel() {
    level++;
    if (level <= 3) initCurrentLevel();
    else { showOverlay("VICTORY", "YOU SAVED THE BUILDING!"); }
}

function resetGame() {
    score = 0; lives = 3; level = START_LEVEL;
    initCurrentLevel(); updateHUD();
    overlay.classList.add('hidden');
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code.replace('Arrow', '')] = true;
    if (e.code === 'Space' && player.onGround && !player.onLadder) { player.vy = player.jumpPower; player.onGround = false; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code.replace('Arrow', '')] = false; });

// --- MOBILE TOUCH CONTROLS (Dragging) ---
let touchStart = { x: 0, y: 0 };
const TOUCH_THRESHOLD = 30; // Min px to register movement

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;

    // Reset horizontal
    keys.Left = keys.Right = false;
    if (Math.abs(dx) > TOUCH_THRESHOLD) {
        if (dx < 0) keys.Left = true;
        else keys.Right = true;
    }

    // Handle Up/Down
    keys.Up = keys.Down = false;
    if (Math.abs(dy) > TOUCH_THRESHOLD) {
        if (dy < 0) keys.Up = true;
        else keys.Down = true;
    }
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    keys.Left = keys.Right = keys.Up = keys.Down = false;
}, { passive: false });


startBtn.addEventListener('click', () => {
    if (!gameRunning) { gameRunning = true; startBtn.style.display = 'none'; lastTime = performance.now(); requestAnimationFrame(gameLoop); }
});
restartBtn.addEventListener('click', resetGame);

// Auto-start immediately
gameRunning = true;
startBtn.style.display = 'none';
lastTime = performance.now();
requestAnimationFrame(gameLoop);

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime || 0; lastTime = timestamp; update(deltaTime); draw(); if (gameRunning) animationId = requestAnimationFrame(gameLoop);
}

initCurrentLevel();
updateHUD();
draw();