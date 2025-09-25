const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_SIZE = 800; // Logical game size

// Create an offscreen canvas for double buffering
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// Game variables
let player;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let bases = [];
let baseBullets = [];
let collectibles = [];
let explosions = [];
let boss = null;
let bossBullets = [];
let isBossFight = false;
let score = 0;
let highScore = 0;
let gameOver = false;
let level = 1;
let enemiesToDefeat = 5; // Start with fewer enemies to defeat
let currentEnemiesDefeated = 0; // Track enemies defeated in current level
let isHelpScreenVisible = false;
let screenFlashAlpha = 0;
let screenShake = 0;

let levelMessage = '';
let levelMessageAlpha = 0;

// Starry background
let stars = [];
const NUM_STARS = 100;

// Player properties
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const PLAYER_SPEED = 5;
const PLAYER_SMOOTHING = 0.1; // Smoothing factor for touch movement
const MAX_PLAYER_HEALTH = 3;

// Bullet properties
const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 8;
const BULLET_SPEED = 15;
const BULLET_COOLDOWN = 150; // milliseconds
const BULLET_SPREAD_SPACING = 10; // Vertical spacing between bullets
let lastBulletTime = 0;

// Enemy properties
const ENEMY_SPEED_MIN = 2;
const ENEMY_SPEED_MAX = 4; // Slightly slower max speed
let ENEMY_SPAWN_INTERVAL = 1500; // milliseconds
let lastEnemySpawnTime = 0;
let ENEMY_FIRE_COOLDOWN = 3000; // milliseconds

// Base properties
const BASE_WIDTH = 40;
const BASE_HEIGHT = 20;
const BASE_HEALTH = 3;
let BASE_SPAWN_INTERVAL = 5000; // ms
let lastBaseSpawnTime = 0;
const BASE_FIRE_COOLDOWN = 2000; // ms

// Power-up properties
const SHIELD_DURATION = 20000; // 20 seconds

// Help icon
const helpIcon = { x: GAME_SIZE - 40, y: GAME_SIZE - 40, width: 30, height: 30 };

// Enemy Types
const ENEMY_TYPES = [
    {
        name: 'Scout',
        width: 50,
        height: 30,
        speedMin: 3,
        speedMax: 5,
        color: '#8B0000', // Dark Red
        draw: function(context, enemy) { // Changed to accept context
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Main body - sleek, fast-looking
            let mainBodyGradient = context.createLinearGradient(ex, ey, ex + ew, ey + eh);
            mainBodyGradient.addColorStop(0, '#8B0000'); // Dark Red
            mainBodyGradient.addColorStop(0.5, '#DC143C'); // Crimson
            mainBodyGradient.addColorStop(1, '#8B0000'); // Dark Red
            context.fillStyle = mainBodyGradient;

            context.beginPath();
            context.moveTo(ex, ey + eh / 2); // Front tip
            context.lineTo(ex + ew * 0.8, ey); // Top back
            context.lineTo(ex + ew, ey + eh / 2); // Rear tip
            context.lineTo(ex + ew * 0.8, ey + eh); // Bottom back
            context.closePath();
            context.fill();

            // Cockpit
            context.fillStyle = '#FFD700'; // Gold
            context.beginPath();
            context.arc(ex + ew * 0.4, ey + eh / 2, eh / 6, 0, Math.PI * 2);
            context.fill();

            // Small wings/stabilizers
            context.fillStyle = '#696969'; // DimGray
            context.beginPath();
            context.moveTo(ex + ew * 0.6, ey + eh * 0.1);
            context.lineTo(ex + ew * 0.7, ey - eh * 0.1);
            context.lineTo(ex + ew * 0.7, ey + eh * 0.2);
            context.closePath();
            context.fill();

            context.beginPath();
            context.moveTo(ex + ew * 0.6, ey + eh * 0.9);
            context.lineTo(ex + ew * 0.7, ey + eh * 1.1);
            context.lineTo(ex + ew * 0.7, ey + eh * 0.8);
            context.closePath();
            context.fill();
        }
    },
    {
        name: 'Fighter',
        width: 70,
        height: 40,
        speedMin: 2,
        speedMax: 4,
        color: '#4B0082', // Indigo
        draw: function(context, enemy) { // Changed to accept context
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Main body with gradient - more aggressive, angular
            let mainBodyGradient = context.createLinearGradient(ex, ey, ex + ew, ey + eh);
            mainBodyGradient.addColorStop(0, '#4B0082'); // Indigo
            mainBodyGradient.addColorStop(0.5, '#8A2BE2'); // BlueViolet
            mainBodyGradient.addColorStop(1, '#4B0082'); // Indigo
            context.fillStyle = mainBodyGradient;

            context.beginPath();
            context.moveTo(ex, ey + eh / 2); // Front tip
            context.lineTo(ex + ew * 0.7, ey - eh * 0.2); // Top wing front
            context.lineTo(ex + ew, ey); // Top wing back
            context.lineTo(ex + ew * 0.8, ey + eh / 2); // Mid-body back
            context.lineTo(ex + ew, ey + eh); // Bottom wing back
            context.lineTo(ex + ew * 0.7, ey + eh * 1.2); // Bottom wing front
            context.closePath();
            context.fill();

            // Cockpit
            context.fillStyle = '#ADD8E6'; // Light Blue
            context.beginPath();
            context.ellipse(ex + ew * 0.6, ey + eh / 2, ew * 0.15, eh * 0.25, 0, 0, Math.PI * 2);
            context.fill();

            // Cannons - prominent
            context.fillStyle = '#696969'; // DimGray
            context.fillRect(ex + ew * 0.8, ey - eh * 0.1, ew * 0.2, eh * 0.1);
            context.fillRect(ex + ew * 0.8, ey + eh, ew * 0.2, eh * 0.1);
        }
    },
    {
        name: 'Bomber',
        width: 90,
        height: 50,
        speedMin: 1,
        speedMax: 3,
        color: '#2F4F4F', // DarkSlateGray
        draw: function(context, enemy) { // Changed to accept context
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Main body with gradient - large, imposing
            let mainBodyGradient = context.createLinearGradient(ex, ey, ex + ew, ey + eh);
            mainBodyGradient.addColorStop(0, '#2F4F4F'); // DarkSlateGray
            mainBodyGradient.addColorStop(0.5, '#708090'); // SlateGray
            mainBodyGradient.addColorStop(1, '#2F4F4F'); // DarkSlateGray
            context.fillStyle = mainBodyGradient;

            context.beginPath();
            context.moveTo(ex, ey + eh / 2); // Front
            context.lineTo(ex + ew * 0.8, ey); // Top front
            context.lineTo(ex + ew, ey + eh * 0.2); // Top rear
            context.lineTo(ex + ew, ey + eh * 0.8); // Bottom rear
            context.lineTo(ex + ew * 0.8, ey + eh); // Bottom front
            context.closePath();
            context.fill();

            // Cockpit - central, armored
            context.fillStyle = '#B0C4DE'; // LightSteelBlue
            context.beginPath();
            context.ellipse(ex + ew * 0.6, ey + eh / 2, ew * 0.15, eh * 0.2, 0, 0, Math.PI * 2);
            context.fill();

            // Bomb Bay / Cargo Pods
            context.fillStyle = '#000000'; // Black
            context.fillRect(ex + ew * 0.3, ey + eh * 0.3, ew * 0.3, eh * 0.4);
            context.fillStyle = '#696969'; // DimGray for details
            context.fillRect(ex + ew * 0.35, ey + eh * 0.35, ew * 0.2, eh * 0.1);
            context.fillRect(ex + ew * 0.35, ey + eh * 0.55, ew * 0.2, eh * 0.1);
        }
    },
    {
        name: 'Serpent',
        width: 60,
        height: 20,
        speedMin: 3,
        speedMax: 5,
        color: '#006400', // Dark Green
        draw: function(context, enemy) {
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Segmented body
            for (let i = 0; i < 5; i++) {
                let segmentX = ex + (i * (ew / 5));
                let segmentY = ey + Math.sin(segmentX / 20) * (eh / 4);
                context.fillStyle = i % 2 === 0 ? '#006400' : '#2E8B57'; // Alternating green
                context.beginPath();
                context.arc(segmentX, segmentY, eh / 2, 0, Math.PI * 2);
                context.fill();
            }
        }
    }
];

// Terrain properties
const TERRAIN_SEGMENT_WIDTH = 20;
const TERRAIN_HEIGHT_VARIATION = 100;
const TERRAIN_BASE_HEIGHT = GAME_SIZE - 100; // Base height for the terrain
let terrain = [];

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

let touchX = -1;
let touchY = -1;
let isTouching = false;
let isFiring = false; // For touch auto-fire

function setupCanvas() {
    // Set logical size for both canvases
    canvas.width = GAME_SIZE;
    canvas.height = GAME_SIZE;
    offscreenCanvas.width = GAME_SIZE;
    offscreenCanvas.height = GAME_SIZE;

    const aspectRatio = GAME_SIZE / GAME_SIZE; // 1:1 aspect ratio
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
    } else {
        newHeight = newWidth / aspectRatio;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
}

function initGame() {
    player = {
        x: GAME_SIZE / 4,
        y: GAME_SIZE / 2 - PLAYER_HEIGHT / 2,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed: PLAYER_SPEED,
        health: MAX_PLAYER_HEALTH,
        weaponLevel: 1,
        isShielded: false,
        shieldTimer: 0
    };
    bullets = [];
    enemies = [];
    enemyBullets = [];
    bases = [];
    baseBullets = [];
    collectibles = [];
    explosions = [];
    boss = null;
    bossBullets = [];
    isBossFight = false;
    score = 0;
    gameOver = false;
    lastBulletTime = 0;
    lastEnemySpawnTime = 0;
    lastBaseSpawnTime = 0;
    level = 1;
    enemiesToDefeat = 5;
    currentEnemiesDefeated = 0;
    levelMessage = '';
    levelMessageAlpha = 0;
    screenFlashAlpha = 0;
    screenShake = 0;
    highScore = localStorage.getItem('spaceWarsHighScore') || 0;

    ENEMY_SPAWN_INTERVAL = 1500;
    ENEMY_FIRE_COOLDOWN = 3000;

    terrain = [];
    let currentHeight = TERRAIN_BASE_HEIGHT;
    for (let i = 0; i < GAME_SIZE / TERRAIN_SEGMENT_WIDTH + 2; i++) {
        terrain.push({
            x: i * TERRAIN_SEGMENT_WIDTH,
            y: currentHeight
        });
        currentHeight += (Math.random() - 0.5) * TERRAIN_HEIGHT_VARIATION * 0.5;
        currentHeight = Math.max(TERRAIN_BASE_HEIGHT - TERRAIN_HEIGHT_VARIATION, Math.min(TERRAIN_BASE_HEIGHT + TERRAIN_HEIGHT_VARIATION, currentHeight));
    }

    stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * GAME_SIZE,
            y: Math.random() * GAME_SIZE,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function generateTerrainSegment(lastHeight) {
    let newHeight = lastHeight + (Math.random() - 0.5) * TERRAIN_HEIGHT_VARIATION;
    newHeight = Math.max(TERRAIN_BASE_HEIGHT - TERRAIN_HEIGHT_VARIATION, Math.min(TERRAIN_BASE_HEIGHT + TERRAIN_HEIGHT_VARIATION, newHeight));
    return newHeight;
}

function updateTerrain() {
    for (let i = 0; i < terrain.length; i++) {
        terrain[i].x -= ENEMY_SPEED_MIN;
    }

    if (terrain[0].x + TERRAIN_SEGMENT_WIDTH < 0) {
        terrain.shift();
        const lastSegment = terrain[terrain.length - 1];
        terrain.push({
            x: lastSegment.x + TERRAIN_SEGMENT_WIDTH,
            y: generateTerrainSegment(lastSegment.y)
        });
    }
}

function drawTerrain(context) { // Changed to accept context
    context.fillStyle = '#8B4513'; // Saddle Brown
    context.beginPath();
    context.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
        context.lineTo(terrain[i].x, terrain[i].y);
    }
    context.lineTo(GAME_SIZE, GAME_SIZE);
    context.lineTo(0, GAME_SIZE);
    context.closePath();
    context.fill();

    context.fillStyle = '#228B22'; // Forest Green
    context.beginPath();
    context.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
        context.lineTo(terrain[i].x, terrain[i].y);
    }
    context.lineTo(terrain[terrain.length - 1].x, terrain[terrain.length - 1].y - 5);
    for (let i = terrain.length - 2; i >= 0; i--) {
        context.lineTo(terrain[i].x, terrain[i].y - 5);
    }
    context.closePath();
    context.fill();
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function getTerrainHeightAt(x) {
    for (let i = 0; i < terrain.length - 1; i++) {
        const segmentStart = terrain[i];
        const segmentEnd = terrain[i + 1];

        if (x >= segmentStart.x && x < segmentEnd.x) {
            const ratio = (x - segmentStart.x) / (segmentEnd.x - segmentStart.x);
            return segmentStart.y + (segmentEnd.y - segmentStart.y) * ratio;
        }
    }
    return TERRAIN_BASE_HEIGHT;
}

function checkTerrainCollision(player) {
    if (player.isShielded) return false;
    const playerCenterX = player.x + player.width / 2;
    let terrainYAtPlayerX = getTerrainHeightAt(playerCenterX);

    if (player.y + player.height > terrainYAtPlayerX) {
        return true;
    }
    return false;
}

function drawPlayer(context) { // Changed to accept context
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    if (player.isShielded) {
        context.fillStyle = 'rgba(0, 191, 255, 0.3)'; // Deep sky blue with transparency
        context.beginPath();
        const shieldRadius = (player.width + player.height) / 2 * (1 + Math.sin(Date.now() / 200) * 0.1); // Pulsating effect
        context.arc(player.x + player.width / 2, player.y + player.height / 2, shieldRadius, 0, Math.PI * 2);
        context.fill();
    }

    let mainBodyGradient = context.createLinearGradient(px, py, px + pw, py + ph);
    mainBodyGradient.addColorStop(0, '#A9A9A9');
    mainBodyGradient.addColorStop(0.5, '#D3D3D3');
    mainBodyGradient.addColorStop(1, '#A9A9A9');
    context.fillStyle = mainBodyGradient;

    context.beginPath();
    context.moveTo(px + pw, py + ph / 2);
    context.lineTo(px + pw * 0.2, py);
    context.lineTo(px, py + ph * 0.1);
    context.lineTo(px, py + ph * 0.9);
    context.lineTo(px + pw * 0.2, py + ph);
    context.closePath();
    context.fill();

    context.fillStyle = '#87CEEB';
    context.beginPath();
    context.ellipse(px + pw * 0.4, py + ph / 2, pw * 0.2, ph * 0.3, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#5F9EA0';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = '#696969';
    context.beginPath();
    context.moveTo(px + pw * 0.3, py);
    context.lineTo(px + pw * 0.1, py - ph * 0.2);
    context.lineTo(px + pw * 0.1, py + ph * 0.1);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(px + pw * 0.3, py + ph);
    context.lineTo(px + pw * 0.1, py + ph * 1.2);
    context.lineTo(px + pw * 0.1, py + ph * 0.9);
    context.closePath();
    context.fill();

    context.fillStyle = '#483D8B';
    context.fillRect(px + pw * 0.1, py + ph * 0.2, pw * 0.2, ph * 0.6);

    const flameSize = ph / 2 + Math.random() * (ph / 3);
    context.fillStyle = `rgba(255, ${165 + Math.random() * 90}, 0, ${0.8 + Math.random() * 0.2})`;
    context.beginPath();
    context.moveTo(px + pw * 0.1, py + ph * 0.5);
    context.lineTo(px + pw * 0.1 - flameSize, py + ph * 0.5 - flameSize / 2);
    context.lineTo(px + pw * 0.1 - flameSize * 0.7, py + ph * 0.5);
    context.lineTo(px + pw * 0.1 - flameSize, py + ph * 0.5 + flameSize / 2);
    context.closePath();
    context.fill();
}

function drawEnemy(context, enemy) { // Changed to accept context
    enemy.type.draw(context, enemy);

    const ex = enemy.x;
    const ey = enemy.y;
    const ew = enemy.width;
    const eh = enemy.height;

    const enemyFlameSize = eh / 4 + Math.random() * (eh / 5);
    context.fillStyle = `rgba(255, ${0 + Math.random() * 100}, 0, ${0.6 + Math.random() * 0.3})`;
    context.beginPath();
    context.moveTo(ex + ew, ey + eh / 2);
    context.lineTo(ex + ew + enemyFlameSize, ey + eh / 2 - enemyFlameSize / 2);
    context.lineTo(ex + ew + enemyFlameSize * 0.7, ey + eh / 2);
    context.lineTo(ex + ew + enemyFlameSize, ey + eh / 2 + enemyFlameSize / 2);
    context.closePath();
    context.fill();
}

function drawBullet(context, bullet) { // Changed to accept context
    const bx = bullet.x;
    const by = bullet.y;
    const bw = bullet.width;
    const bh = bullet.height;

    context.fillStyle = '#FFD700';
    context.beginPath();
    context.moveTo(bx, by - bh / 2);
    context.lineTo(bx + bw, by);
    context.lineTo(bx, by + bh / 2);
    context.closePath();
    context.fill();

    const flameSize = bw * 0.5 + Math.random() * (bw * 0.3);
    context.fillStyle = `rgba(255, ${165 + Math.random() * 90}, 0, ${0.8 + Math.random() * 0.2})`;
    context.beginPath();
    context.moveTo(bx, by);
    context.lineTo(bx - flameSize, by - flameSize / 2);
    context.lineTo(bx - flameSize * 0.7, by);
    context.lineTo(bx - flameSize, by + flameSize / 2);
    context.closePath();
    context.fill();
}

function drawEnemyBullet(context, bullet) { // Changed to accept context
    const bx = bullet.x;
    const by = bullet.y;
    const bw = bullet.width;
    const bh = bullet.height;

    context.fillStyle = '#FF0000';
    context.beginPath();
    context.moveTo(bx + bw, by - bh / 2);
    context.lineTo(bx, by);
    context.lineTo(bx + bw, by + bh / 2);
    context.closePath();
    context.fill();

    const flameSize = bw * 0.5 + Math.random() * (bw * 0.3);
    context.fillStyle = `rgba(255, ${0 + Math.random() * 100}, 0, ${0.6 + Math.random() * 0.3})`;
    context.beginPath();
    context.moveTo(bx + bw, by);
    context.lineTo(bx + bw + flameSize, by - flameSize / 2);
    context.lineTo(bx + bw + flameSize * 0.7, by);
    context.lineTo(bx + bw + flameSize, by + flameSize / 2);
    context.closePath();
    context.fill();
}

function drawBase(context, base) {
    const bx = base.x;
    const by = base.y;
    const bw = base.width;
    const bh = base.height;

    // Base structure
    context.fillStyle = '#696969'; // DimGray
    context.fillRect(bx, by, bw, bh);

    // Cannon
    context.fillStyle = '#444';
    context.fillRect(bx + bw / 2 - 5, by - 10, 10, 10);
}

function drawBaseBullet(context, bullet) {
    context.fillStyle = '#00FF00'; // Green
    context.fillRect(bullet.x, bullet.y, 5, 10);
}

function drawBoss(context) {
    if (!boss) return;

    const { x, y, width, height, parts } = boss;

    context.save();

    // Layer 1: Main Hull (Darkest)
    context.fillStyle = '#2c3e50'; // Dark Slate Grey
    context.beginPath();
    context.moveTo(x, y + height * 0.2); // Back top
    context.lineTo(x + width * 0.7, y); // Front top point
    context.lineTo(x + width, y + height * 0.5); // Nose
    context.lineTo(x + width * 0.7, y + height); // Front bottom point
    context.lineTo(x, y + height * 0.8); // Back bottom
    context.closePath();
    context.fill();

    // Layer 2: Superstructure (Lighter)
    const grad = context.createLinearGradient(x, y, x + width, y);
    grad.addColorStop(0, '#34495e'); // Darker
    grad.addColorStop(1, '#566573'); // Lighter
    context.fillStyle = grad;
    context.beginPath();
    context.moveTo(x + width * 0.1, y + height * 0.2);
    context.lineTo(x + width * 0.65, y + height * 0.15);
    context.lineTo(x + width * 0.85, y + height * 0.5);
    context.lineTo(x + width * 0.65, y + height * 0.85);
    context.lineTo(x + width * 0.1, y + height * 0.8);
    context.closePath();
    context.fill();

    // Layer 3: Greebles and Details
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.fillRect(x + 20, y + 35, 100, 10); // Panel line
    context.fillRect(x + 20, y + height - 45, 100, 10); // Panel line
    context.fillRect(x + 150, y + 20, 50, 5); // Small vent
    context.fillRect(x + 150, y + height - 25, 50, 5); // Small vent

    // Command Bridge
    context.fillStyle = '#2c3e50';
    context.fillRect(x + width * 0.6, y + height * 0.4, 80, 40);
    context.fillStyle = '#3498db'; // Glowing blue windows
    context.fillRect(x + width * 0.6 + 10, y + height * 0.4 + 10, 15, 20);
    context.fillRect(x + width * 0.6 + 35, y + height * 0.4 + 10, 15, 20);
    context.fillRect(x + width * 0.6 + 60, y + height * 0.4 + 10, 15, 20);

    // Engines
    const engineX = x + 10;
    const engineY1 = y + height * 0.2 + 10;
    const engineY2 = y + height * 0.8 - 30;
    context.fillStyle = '#2c3e50';
    context.fillRect(engineX, engineY1, 20, 20);
    context.fillRect(engineX, engineY2, 20, 20);

    // Engine Glow
    const engineGlow = context.createRadialGradient(engineX, engineY1 + 10, 2, engineX, engineY1 + 10, 15);
    engineGlow.addColorStop(0, 'white');
    engineGlow.addColorStop(0.4, 'rgba(255, 165, 0, 0.8)');
    engineGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
    context.fillStyle = engineGlow;
    context.fillRect(engineX - 20, engineY1 - 5, 40, 30);

    const engineGlow2 = context.createRadialGradient(engineX, engineY2 + 10, 2, engineX, engineY2 + 10, 15);
    engineGlow2.addColorStop(0, 'white');
    engineGlow2.addColorStop(0.4, 'rgba(255, 165, 0, 0.8)');
    engineGlow2.addColorStop(1, 'rgba(255, 0, 0, 0)');
    context.fillStyle = engineGlow2;
    context.fillRect(engineX - 20, engineY2 - 5, 40, 30);

    // Turrets
    parts.forEach(part => {
        if (part.health > 0) {
            context.save();
            context.translate(part.x + part.width / 2, part.y + part.height / 2);
            context.rotate(part.angle);
            // Base
            context.fillStyle = '#566573';
            context.beginPath();
            context.arc(0, 0, part.width / 1.5, 0, Math.PI * 2);
            context.fill();
            // Barrel
            context.fillStyle = '#34495e';
            context.fillRect(0, -part.height / 4, part.width * 1.2, part.height / 2);
            context.restore();
        }
    });

    context.restore();
}

function drawBossBullet(context, bullet) {
    context.fillStyle = '#FF00FF';
    context.beginPath();
    context.arc(bullet.x, bullet.y, 10, 0, Math.PI * 2);
    context.fill();
}

function drawDynamicBar(context, x, y, width, height, progress, label) {
    const color = progress > 0.6 ? '#00FF00' : progress > 0.3 ? '#FFA500' : '#FF0000';

    context.fillStyle = '#333';
    context.fillRect(x, y, width, height);

    context.fillStyle = color;
    context.fillRect(x, y, width * progress, height);

    context.strokeStyle = 'white';
    context.strokeRect(x, y, width, height);

    context.fillStyle = 'white';
    context.font = `14px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, x + width / 2, y + height / 2);
}

function drawCollectible(context, collectible) {
    const x = collectible.x;
    const y = collectible.y;
    const width = collectible.width;
    const height = collectible.height;

    context.save();
    switch (collectible.type) {
        case 'weapon-upgrade':
            context.fillStyle = '#FFD700';
            context.fillRect(x + width / 4, y, width / 2, height);
            context.fillRect(x, y + height / 4, width, height / 2);
            break;
        case 'extra-life':
            context.fillStyle = '#FF0000';
            context.beginPath();
            context.moveTo(x + width / 2, y + height / 4);
            context.arc(x + width / 4, y + height / 4, width / 4, Math.PI, 0);
            context.arc(x + (width * 3) / 4, y + height / 4, width / 4, Math.PI, 0);
            context.lineTo(x + width / 2, y + height);
            context.closePath();
            context.fill();
            break;
        case 'emp-pulse':
            context.fillStyle = '#00FFFF';
            context.beginPath();
            context.moveTo(x + width / 2, y);
            context.lineTo(x, y + height / 2);
            context.lineTo(x + width / 2, y + height / 2);
            context.lineTo(x + width / 2, y + height);
            context.lineTo(x + width, y + height / 2);
            context.lineTo(x + width / 2, y + height / 2);
            context.closePath();
            context.fill();
            break;
        case 'shield':
            context.fillStyle = '#00BFFF';
            context.beginPath();
            context.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
            context.fill();
            break;
    }
    context.restore();
}

function drawHelpIcon(context) {
    context.fillStyle = 'rgba(128, 128, 128, 0.5)';
    context.beginPath();
    context.arc(helpIcon.x + helpIcon.width / 2, helpIcon.y + helpIcon.height / 2, helpIcon.width / 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'white';
    context.font = `20px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('?', helpIcon.x + helpIcon.width / 2, helpIcon.y + helpIcon.height / 2);
}

function drawHelpScreen(context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, GAME_SIZE, GAME_SIZE);

    context.fillStyle = 'white';
    context.font = '30px Arial';
    context.textAlign = 'center';
    context.fillText('HELP', GAME_SIZE / 2, 50);

    context.font = '16px Arial';
    context.textAlign = 'left';
    let y = 100;

    context.fillText('Controls:', 50, y); y += 25;
    context.fillText('- Desktop: Arrow keys to move, Space to shoot.', 50, y); y += 25;
    context.fillText('- Mobile: Drag to move, auto-fire is on.', 50, y); y += 50;

    context.fillText('Objective:', 50, y); y += 25;
    context.fillText('- Survive as long as possible.', 50, y); y += 25;
    context.fillText('- Destroy enemies and bases for points.', 50, y); y += 50;

    context.fillText('Collectibles:', 50, y); y += 35;

    drawCollectible(context, { x: 50, y: y - 15, width: 20, height: 20, type: 'weapon-upgrade' });
    context.fillText('Weapon Upgrade: Increases bullet count.', 80, y); y += 35;

    drawCollectible(context, { x: 50, y: y - 15, width: 20, height: 20, type: 'extra-life' });
    context.fillText('Extra Life: Gain one health point.', 80, y); y += 35;

    drawCollectible(context, { x: 50, y: y - 15, width: 20, height: 20, type: 'emp-pulse' });
    context.fillText('EMP Pulse: Destroys all enemies on screen.', 80, y); y += 35;

    drawCollectible(context, { x: 50, y: y - 15, width: 20, height: 20, type: 'shield' });
    context.fillText('Shield: 20 seconds of invincibility.', 80, y); y += 50;

    context.textAlign = 'center';
    context.fillText('Tap screen to close help.', GAME_SIZE / 2, y);
}


function drawStars(context) { // Changed to accept context
    context.fillStyle = 'white';
    stars.forEach(star => {
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
    });
}

function createExplosion(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        explosions.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 5 + 2,
            color: color || 'orange',
            lifespan: Math.random() * 50 + 50
        });
    }
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const p = explosions[i];
        p.x += p.vx;
        p.y += p.vy;
        p.lifespan--;
        if (p.lifespan <= 0) {
            explosions.splice(i, 1);
        }
    }
}

function drawExplosions(context) {
    explosions.forEach(p => {
        context.fillStyle = p.color;
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fill();
    });
}

function spawnBoss() {
    isBossFight = true;
    enemies = [];
    enemyBullets = [];
    bases = [];
    baseBullets = [];
    boss = {
        x: GAME_SIZE,
        y: GAME_SIZE / 2 - 90,
        width: 350,
        height: 180,
        speed: 1,
        health: 150,
        maxHealth: 150,
        parts: [
            { x: GAME_SIZE + 200, y: GAME_SIZE / 2 - 60, width: 30, height: 30, health: 25, lastFire: 0, angle: 0 },
            { x: GAME_SIZE + 200, y: GAME_SIZE / 2 + 30, width: 30, height: 30, health: 25, lastFire: 0, angle: 0 }
        ],
        lastMainFire: 0
    };
    levelMessage = 'WARNING! BOSS APPROACHING!';
    levelMessageAlpha = 1;
}

function updateBoss(deltaTime) {
    if (!boss) return;

    // Boss movement
    if (boss.x > GAME_SIZE - 400) {
        boss.x -= boss.speed;
        boss.parts.forEach(part => part.x -= boss.speed);
    } else {
        boss.y += Math.sin(Date.now() / 1000) * 0.5;
        boss.parts.forEach(part => part.y += Math.sin(Date.now() / 1000) * 0.5);
    }

    // Turret aiming and firing
    boss.parts.forEach(part => {
        if (part.health > 0) {
            part.angle = Math.atan2(player.y - part.y, player.x - part.x);
            if (Date.now() - part.lastFire > 1500) {
                const speed = 7;
                bossBullets.push({
                    x: part.x + part.width / 2,
                    y: part.y + part.height / 2,
                    width: 15,
                    height: 5,
                    vx: Math.cos(part.angle) * speed,
                    vy: Math.sin(part.angle) * speed
                });
                part.lastFire = Date.now();
            }
        }
    });

    // Main weapon firing
    if (Date.now() - boss.lastMainFire > 2500) {
        for (let i = 0; i < 8; i++) {
            bossBullets.push({
                x: boss.x + boss.width * 0.8,
                y: boss.y + boss.height / 2,
                width: 20,
                height: 20,
                vx: -6,
                vy: (i - 3.5) * 0.5
            });
        }
        boss.lastMainFire = Date.now();
    }

    // Update boss bullets
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bullet = bossBullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        if (bullet.x < 0) {
            bossBullets.splice(i, 1);
        }
    }

    // Player bullets vs boss
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i]) continue;

        // Check against main body
        if (checkCollision(bullets[i], boss)) {
            boss.health--;
            createExplosion(bullets[i].x, bullets[i].y, 5, '#FFD700');
            bullets.splice(i, 1);
            continue;
        }

        // Check against parts
        for (let j = boss.parts.length - 1; j >= 0; j--) {
            const part = boss.parts[j];
            if (part.health > 0 && checkCollision(bullets[i], part)) {
                part.health--;
                boss.health--;
                createExplosion(bullets[i].x, bullets[i].y, 5, '#FFD700');
                if (part.health <= 0) {
                    createExplosion(part.x + part.width / 2, part.y + part.height / 2, 30);
                }
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Boss defeated
    if (boss.health <= 0) {
        createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 200, '#FF00FF');
        score += 1000;
        isBossFight = false;
        boss = null;
        level++;
        currentEnemiesDefeated = 0;
        enemiesToDefeat = 5 + (level * 2);
        levelMessage = 'BOSS DEFEATED!';
        levelMessageAlpha = 1;
    }
}

function applyPlayerDamage(damage) {
    if (player.isShielded) return;

    player.health -= damage;
    player.weaponLevel = 1;
    screenShake = 15;
    screenFlashAlpha = 1;
    createExplosion(player.x + player.width / 2, player.y + player.height / 2, 20);

    if (player.health <= 0) {
        gameOver = true;
    }
}

function update(deltaTime) {
    if (gameOver) {
        if (score > highScore) {
            localStorage.setItem('spaceWarsHighScore', score);
            highScore = score;
        }
        return;
    }

    // Shared update logic
    if (screenShake > 0) screenShake--;
    if (screenFlashAlpha > 0) screenFlashAlpha -= 0.05;

    if (player.shieldTimer > 0) {
        player.shieldTimer -= deltaTime;
        if (player.shieldTimer <= 0) {
            player.isShielded = false;
        }
    }

    // Keyboard movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;

    // Smoothed touch movement
    if (isTouching && touchX !== -1 && touchY !== -1) {
        let targetX = touchX - player.width / 2;
        let targetY = touchY - player.height / 2;
        player.x += (targetX - player.x) * PLAYER_SMOOTHING;
        player.y += (targetY - player.y) * PLAYER_SMOOTHING;
    }

    player.x = Math.max(0, Math.min(GAME_SIZE - player.width, player.x));
    player.y = Math.max(0, Math.min(GAME_SIZE - player.height, player.y));

    // Shooting (Keyboard or Touch)
    if ((keys.Space || isFiring) && Date.now() - lastBulletTime > BULLET_COOLDOWN) {
        const numBullets = player.weaponLevel;
        const SPREAD_SPACING = 10;
        for (let i = 0; i < numBullets; i++) {
            const yOffset = (numBullets > 1) ? (i - (numBullets - 1) / 2) * SPREAD_SPACING : 0;
            bullets.push({
                x: player.x + player.width,
                y: player.y + player.height / 2 + yOffset - BULLET_HEIGHT / 2,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                speed: BULLET_SPEED
            });
        }
        lastBulletTime = Date.now();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].speed;
        if (bullets[i].x > GAME_SIZE) {
            bullets.splice(i, 1);
        }
    }

    // Update collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].y += 2; // Fall down
        collectibles[i].x -= 1; // Drift left
        if (collectibles[i].y > GAME_SIZE) {
            collectibles.splice(i, 1);
        }
    }

    updateExplosions();

    if (isBossFight) {
        updateBoss(deltaTime);
    } else {
        // REGULAR GAMEPLAY

        // Spawn enemies
        if (enemies.length < (level * 2) && Date.now() - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
            let availableEnemies = ENEMY_TYPES;
            if (level < 5) {
                availableEnemies = ENEMY_TYPES.filter(type => type.name !== 'Serpent');
            }
            const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];

            const spawnX = GAME_SIZE;
            const terrainY = getTerrainHeightAt(spawnX);
            const spawnY = Math.random() * (terrainY - enemyType.height - 50);

            let newEnemy = {
                x: spawnX,
                y: spawnY,
                width: enemyType.width,
                height: enemyType.height,
                speed: enemyType.speedMin + Math.random() * (enemyType.speedMax - enemyType.speedMin),
                type: enemyType,
                lastFire: Date.now() + Math.random() * ENEMY_FIRE_COOLDOWN
            };

            if (enemyType.name === 'Serpent') {
                newEnemy.startY = newEnemy.y;
                newEnemy.amplitude = 20 + Math.random() * 30;
                newEnemy.frequency = 50 + Math.random() * 50;
            }

            enemies.push(newEnemy);
            lastEnemySpawnTime = Date.now();
        }
        // Spawn bases
        if (level >= 3 && Date.now() - lastBaseSpawnTime > BASE_SPAWN_INTERVAL) {
            const spawnX = GAME_SIZE;
            const spawnY = getTerrainHeightAt(spawnX) - BASE_HEIGHT;
            bases.push({
                x: spawnX,
                y: spawnY,
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                health: BASE_HEALTH,
                lastFire: Date.now() + Math.random() * BASE_FIRE_COOLDOWN
            });
            lastBaseSpawnTime = Date.now();
        }

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i]) continue;
            enemies[i].x -= enemies[i].speed;

            if (enemies[i].type.name === 'Serpent') {
                enemies[i].y = enemies[i].startY + Math.sin(enemies[i].x / enemies[i].frequency) * enemies[i].amplitude;
            }

            if (enemies[i].x + enemies[i].width < 0) {
                enemies.splice(i, 1);
            }

            if (Math.random() < 0.01 * level && Date.now() - enemies[i].lastFire > ENEMY_FIRE_COOLDOWN) {
                enemyBullets.push({
                    x: enemies[i].x,
                    y: enemies[i].y + enemies[i].height / 2,
                    width: 15,
                    height: 5,
                    speed: -5
                });
                enemies[i].lastFire = Date.now();
            }
        }

        // Update bases
        for (let i = bases.length - 1; i >= 0; i--) {
            bases[i].x -= ENEMY_SPEED_MIN; // Scroll with terrain
            if (bases[i].x + bases[i].width < 0) {
                bases.splice(i, 1);
            }

            if (Date.now() - bases[i].lastFire > BASE_FIRE_COOLDOWN) {
                baseBullets.push({
                    x: bases[i].x + bases[i].width / 2 - 2.5,
                    y: bases[i].y - 10,
                    width: 5,
                    height: 10,
                    speed: -5
                });
                bases[i].lastFire = Date.now();
            }
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            enemyBullets[i].x += enemyBullets[i].speed;
            if (enemyBullets[i].x < 0) {
                enemyBullets.splice(i, 1);
            }
        }

        // Update base bullets
        for (let i = baseBullets.length - 1; i >= 0; i--) {
            baseBullets[i].y += baseBullets[i].speed;
            if (baseBullets[i].y + baseBullets[i].height < 0) {
                baseBullets.splice(i, 1);
            }
        }

        // Collision detection
        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (bullets[i] && enemies[j] && checkCollision(bullets[i], enemies[j])) {
                    createExplosion(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2, 10);
                    if (Math.random() < 0.2) { // 20% chance to drop
                        const collectibleTypes = ['weapon-upgrade', 'extra-life', 'emp-pulse', 'shield'];
                        const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
                        collectibles.push({ x: enemies[j].x, y: enemies[j].y, width: 20, height: 20, type: type });
                    }
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    score += 10;
                    currentEnemiesDefeated++;
                    break;
                }
            }
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = bases.length - 1; j >= 0; j--) {
                if (bullets[i] && bases[j] && checkCollision(bullets[i], bases[j])) {
                    bases[j].health--;
                    createExplosion(bullets[i].x, bullets[i].y, 5, '#FFD700');
                    if (bases[j].health <= 0) {
                        createExplosion(bases[j].x + bases[j].width / 2, bases[j].y + bases[j].height / 2, 20);
                        bases.splice(j, 1);
                        score += 25;
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i] && checkCollision(player, enemies[i])) {
                applyPlayerDamage(1);
                enemies.splice(i, 1);
            }
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            if (enemyBullets[i] && checkCollision(player, enemyBullets[i])) {
                applyPlayerDamage(1);
                enemyBullets.splice(i, 1);
            }
        }

        for (let i = baseBullets.length - 1; i >= 0; i--) {
            if (baseBullets[i] && checkCollision(player, baseBullets[i])) {
                applyPlayerDamage(1);
                baseBullets.splice(i, 1);
            }
        }

        if (currentEnemiesDefeated >= enemiesToDefeat) {
            if (level > 0 && level % 3 === 0) {
                spawnBoss();
            } else {
                level++;
                currentEnemiesDefeated = 0;
                enemiesToDefeat = 5 + (level * 2);
                ENEMY_SPAWN_INTERVAL = Math.max(200, ENEMY_SPAWN_INTERVAL - 100);
                ENEMY_FIRE_COOLDOWN = Math.max(500, ENEMY_FIRE_COOLDOWN - 200);
                levelMessage = `LEVEL ${level-1} COMPLETE!`;
                levelMessageAlpha = 1;
            }
        }
    }

    // Player vs collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        if (checkCollision(player, collectibles[i])) {
            const collectible = collectibles[i];
            switch (collectible.type) {
                case 'weapon-upgrade':
                    if (player.weaponLevel === 1) {
                        player.weaponLevel = 2;
                    } else if (player.weaponLevel < 8) {
                        player.weaponLevel += 2;
                    }
                    break;
                case 'extra-life':
                    player.health++;
                    break;
                case 'emp-pulse':
                    score += enemies.length * 10;
                    enemies.forEach(e => createExplosion(e.x + e.width/2, e.y + e.height/2, 30));
                    enemies = [];
                    enemyBullets = [];
                    break;
                case 'shield':
                    player.isShielded = true;
                    player.shieldTimer = SHIELD_DURATION;
                    break;
            }
            collectibles.splice(i, 1);
        }
    }

    if (checkTerrainCollision(player)) {
        applyPlayerDamage(1);
        player.x = GAME_SIZE / 4;
        player.y = GAME_SIZE / 2 - PLAYER_HEIGHT / 2;
    }

    updateTerrain();

    for (let i = 0; i < stars.length; i++) {
        stars[i].x -= stars[i].speed;
        if (stars[i].x < 0) {
            stars[i].x = GAME_SIZE;
            stars[i].y = Math.random() * GAME_SIZE;
        }
    }

    if (levelMessageAlpha > 0) {
        levelMessageAlpha -= 0.01;
    }
}

function draw() {
    // --- Start drawing to the offscreen canvas ---
    offscreenCtx.save();
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        offscreenCtx.translate(shakeX, shakeY);
    }
    offscreenCtx.clearRect(0, 0, GAME_SIZE, GAME_SIZE);

    drawStars(offscreenCtx);
    drawTerrain(offscreenCtx);
    bases.forEach(base => drawBase(offscreenCtx, base));
    collectibles.forEach(c => drawCollectible(offscreenCtx, c));
    
    if (isBossFight && boss) {
        drawBoss(offscreenCtx);
        bossBullets.forEach(bullet => drawBossBullet(offscreenCtx, bullet));
    }

    if (!gameOver) {
        drawPlayer(offscreenCtx);
    }

    bullets.forEach(bullet => drawBullet(offscreenCtx, bullet));
    enemyBullets.forEach(bullet => drawEnemyBullet(offscreenCtx, bullet));
    baseBullets.forEach(bullet => drawBaseBullet(offscreenCtx, bullet));
    enemies.forEach(enemy => drawEnemy(offscreenCtx, enemy));
    drawExplosions(offscreenCtx);

    if (screenFlashAlpha > 0) {
        offscreenCtx.fillStyle = `rgba(255, 0, 0, ${screenFlashAlpha})`;
        offscreenCtx.fillRect(0, 0, GAME_SIZE, GAME_SIZE);
    }
    offscreenCtx.restore();

    // UI on top of everything
    if (isBossFight) {
        const bossHealthProgress = boss ? boss.health / boss.maxHealth : 0;
        drawDynamicBar(offscreenCtx, GAME_SIZE / 2 - 150, GAME_SIZE - 40, 300, 20, bossHealthProgress, 'BOSS HEALTH');
        
        const playerHealthProgress = player.health / MAX_PLAYER_HEALTH;
        drawDynamicBar(offscreenCtx, GAME_SIZE / 2 - 150, GAME_SIZE - 70, 300, 15, playerHealthProgress, 'PLAYER HEALTH');

        if (player.isShielded) {
            const shieldProgress = player.shieldTimer / SHIELD_DURATION;
            drawDynamicBar(offscreenCtx, GAME_SIZE / 2 - 150, GAME_SIZE - 95, 300, 10, shieldProgress, 'SHIELD');
        }
    } else {
        offscreenCtx.fillStyle = 'white';
        offscreenCtx.font = `20px Arial`;
        offscreenCtx.textAlign = 'left';
        let statusText = `⭐ ${score}  ❤️ ${player.health}  ${level}`;
        offscreenCtx.fillText(statusText, 10, 30);

        const progressBarX = offscreenCtx.measureText(statusText).width + 20;
        const progressBarY = 15;
        const progressBarWidth = 150;
        const progressBarHeight = 15;
        const progress = enemiesToDefeat > 0 ? currentEnemiesDefeated / enemiesToDefeat : 0;
        drawDynamicBar(offscreenCtx, progressBarX, progressBarY, progressBarWidth, progressBarHeight, progress, `${Math.floor(progress * 100)}%`);
    }

    let powerupY = 60;
    if (player.weaponLevel > 1) {
        offscreenCtx.fillStyle = '#FFD700';
        offscreenCtx.textAlign = 'left';
        offscreenCtx.fillText(`WEAPON LVL: ${player.weaponLevel}`, 10, powerupY);
        powerupY += 30;
    }
    if (player.isShielded && !isBossFight) {
        offscreenCtx.fillStyle = '#00BFFF';
        offscreenCtx.textAlign = 'left';
        offscreenCtx.fillText(`SHIELD: ${Math.ceil(player.shieldTimer / 1000)}s`, 10, powerupY);
    }

    drawHelpIcon(offscreenCtx);

    if (levelMessageAlpha > 0) {
        offscreenCtx.save();
        if (levelMessage.includes('WARNING')) {
            offscreenCtx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
        } else {
            offscreenCtx.globalAlpha = levelMessageAlpha;
        }
        offscreenCtx.fillStyle = 'red';
        offscreenCtx.font = `40px Arial`;
        offscreenCtx.textAlign = 'center';
        offscreenCtx.fillText(levelMessage, GAME_SIZE / 2, GAME_SIZE / 2);
        offscreenCtx.restore();
    }

    if (gameOver) {
        offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        offscreenCtx.fillRect(0, 0, GAME_SIZE, GAME_SIZE);
        offscreenCtx.fillStyle = 'white';
        offscreenCtx.font = `40px Arial`;
        offscreenCtx.textAlign = 'center';
        offscreenCtx.fillText('GAME OVER', GAME_SIZE / 2, GAME_SIZE / 2 - 40);
        offscreenCtx.font = `24px Arial`;
        offscreenCtx.fillText(`Score: ${score}`, GAME_SIZE / 2, GAME_SIZE / 2);
        offscreenCtx.fillText(`High Score: ${highScore}`, GAME_SIZE / 2, GAME_SIZE / 2 + 30);
        offscreenCtx.font = `20px Arial`;
        offscreenCtx.fillText('Tap or Press Space to Restart', GAME_SIZE / 2, GAME_SIZE / 2 + 70);
    }

    if (isHelpScreenVisible) {
        drawHelpScreen(offscreenCtx);
    }
    // --- End drawing to the offscreen canvas ---

    // --- Copy the offscreen canvas to the visible canvas ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
}

function isClickInsideRect(x, y, rect) {
    return x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height;
}

// Event Listeners for Keyboard
document.addEventListener('keydown', (e) => {
    if (gameOver && e.code === 'Space') {
        initGame();
        return;
    }
    if (e.code in keys) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Event Listeners for Touch
canvas.addEventListener('touchstart', (e) => {
    if (gameOver) {
        initGame();
        return;
    }
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const localTouchX = (touch.clientX - rect.left) * (GAME_SIZE / rect.width);
    const localTouchY = (touch.clientY - rect.top) * (GAME_SIZE / rect.height);

    if (isHelpScreenVisible) {
        isHelpScreenVisible = false;
        return;
    }

    if (isClickInsideRect(localTouchX, localTouchY, helpIcon)) {
        isHelpScreenVisible = true;
        return;
    }

    isTouching = true;
    isFiring = true; // Start firing on touch
    
    touchX = localTouchX;
    touchY = localTouchY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isTouching) {
        const rect = canvas.getBoundingClientRect();
        touchX = (e.touches[0].clientX - rect.left) * (GAME_SIZE / rect.width);
        touchY = (e.touches[0].clientY - rect.top) * (GAME_SIZE / rect.height);
    }
});

canvas.addEventListener('touchend', () => {
    isTouching = false;
    isFiring = false; // Stop firing on touch end
    // We don't reset touchX/Y here to let the ship smoothly glide to the last point
});

// Game Loop
let lastTime = 0;
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (!isHelpScreenVisible) {
        update(deltaTime);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

// Initialize and start the game
setupCanvas();
initGame();
window.addEventListener('resize', setupCanvas);
requestAnimationFrame(gameLoop);