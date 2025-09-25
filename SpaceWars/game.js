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
let score = 0;
let gameOver = false;
let level = 1;
let enemiesToDefeat = 5; // Start with fewer enemies to defeat
let currentEnemiesDefeated = 0; // Track enemies defeated in current level

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

// Bullet properties
const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 8;
const BULLET_SPEED = 15;
const BULLET_COOLDOWN = 150; // milliseconds
let lastBulletTime = 0;

// Enemy properties
const ENEMY_WIDTH = 60;
const ENEMY_HEIGHT = 40;
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
        health: 3
    };
    bullets = [];
    enemies = [];
    enemyBullets = [];
    bases = [];
    baseBullets = [];
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

function drawStars(context) { // Changed to accept context
    context.fillStyle = 'white';
    stars.forEach(star => {
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
    });
}

function drawProgressBar(context, x, y, width, height, progress) { // Changed to accept context
    context.fillStyle = '#333';
    context.fillRect(x, y, width, height);

    context.fillStyle = '#00FF00';
    context.fillRect(x, y, width * progress, height);

    context.strokeStyle = 'white';
    context.lineWidth = 1;
    context.strokeRect(x, y, width, height);

    context.fillStyle = 'white';
    context.font = `12px Arial`;
    context.textAlign = 'center';
    context.fillText(`${Math.floor(progress * 100)}%`, x + width / 2, y + height / 2 + 4);
}

function update(deltaTime) {
    if (gameOver) return;

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
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - BULLET_HEIGHT / 2,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: BULLET_SPEED
        });
        lastBulletTime = Date.now();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].speed;
        if (bullets[i].x > GAME_SIZE) {
            bullets.splice(i, 1);
        }
    }

    // Spawn enemies
    if (enemies.length < (level * 2) && Date.now() - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
        const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        const spawnX = GAME_SIZE;
        const terrainY = getTerrainHeightAt(spawnX);
        const spawnY = Math.random() * (terrainY - enemyType.height - 50);

        enemies.push({
            x: spawnX,
            y: spawnY,
            width: enemyType.width,
            height: enemyType.height,
            speed: enemyType.speedMin + Math.random() * (enemyType.speedMax - enemyType.speedMin),
            type: enemyType,
            lastFire: Date.now() + Math.random() * ENEMY_FIRE_COOLDOWN
        });
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
    // Player bullets vs enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i] && enemies[j] && checkCollision(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                currentEnemiesDefeated++;
                break;
            }
        }
    }

    // Player bullets vs bases
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = bases.length - 1; j >= 0; j--) {
            if (bullets[i] && bases[j] && checkCollision(bullets[i], bases[j])) {
                bullets.splice(i, 1);
                bases[j].health--;
                if (bases[j].health <= 0) {
                    bases.splice(j, 1);
                    score += 25;
                }
                break;
            }
        }
    }

    // Player vs enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i] && checkCollision(player, enemies[i])) {
            player.health--;
            enemies.splice(i, 1);
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    }

    // Player vs enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i] && checkCollision(player, enemyBullets[i])) {
            player.health--;
            enemyBullets.splice(i, 1);
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    }

    // Player vs base bullets
    for (let i = baseBullets.length - 1; i >= 0; i--) {
        if (baseBullets[i] && checkCollision(player, baseBullets[i])) {
            player.health--;
            baseBullets.splice(i, 1);
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    }

    if (checkTerrainCollision(player)) {
        player.health = 0;
        gameOver = true;
    }

    updateTerrain();

    for (let i = 0; i < stars.length; i++) {
        stars[i].x -= stars[i].speed;
        if (stars[i].x < 0) {
            stars[i].x = GAME_SIZE;
            stars[i].y = Math.random() * GAME_SIZE;
        }
    }

    if (currentEnemiesDefeated >= enemiesToDefeat) {
        level++;
        currentEnemiesDefeated = 0;
        enemiesToDefeat = 5 + (level * 2);
        ENEMY_SPAWN_INTERVAL = Math.max(200, ENEMY_SPAWN_INTERVAL - 100);
        ENEMY_FIRE_COOLDOWN = Math.max(500, ENEMY_FIRE_COOLDOWN - 200);
        levelMessage = `LEVEL ${level-1} COMPLETE!`;
        levelMessageAlpha = 1;
    }

    if (levelMessageAlpha > 0) {
        levelMessageAlpha -= 0.01;
    }
}

function draw() {
    // --- Start drawing to the offscreen canvas ---
    offscreenCtx.clearRect(0, 0, GAME_SIZE, GAME_SIZE);

    drawStars(offscreenCtx);
    drawTerrain(offscreenCtx);
    bases.forEach(base => drawBase(offscreenCtx, base));
    drawPlayer(offscreenCtx);

    bullets.forEach(bullet => drawBullet(offscreenCtx, bullet));
    enemyBullets.forEach(bullet => drawEnemyBullet(offscreenCtx, bullet));
    baseBullets.forEach(bullet => drawBaseBullet(offscreenCtx, bullet));
    enemies.forEach(enemy => drawEnemy(offscreenCtx, enemy));

    offscreenCtx.fillStyle = 'white';
    offscreenCtx.font = `20px Arial`;
    offscreenCtx.textAlign = 'left';
    let statusText = `⭐ ${score}  ❤️ ${player.health}  ${level}`;
    offscreenCtx.fillText(statusText, 10, 30);

    const progressBarX = offscreenCtx.measureText(statusText).width + 20;
    const progressBarY = 15;
    const progressBarWidth = 150;
    const progressBarHeight = 15;
    const progress = currentEnemiesDefeated / enemiesToDefeat;
    drawProgressBar(offscreenCtx, progressBarX, progressBarY, progressBarWidth, progressBarHeight, progress);

    if (levelMessageAlpha > 0) {
        offscreenCtx.save();
        offscreenCtx.globalAlpha = levelMessageAlpha;
        offscreenCtx.fillStyle = 'white';
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
        offscreenCtx.fillText('GAME OVER', GAME_SIZE / 2, GAME_SIZE / 2 - 20);
        offscreenCtx.font = `20px Arial`;
        offscreenCtx.fillText('Tap or Press Space to Restart', GAME_SIZE / 2, GAME_SIZE / 2 + 20);
    }
    // --- End drawing to the offscreen canvas ---

    // --- Copy the offscreen canvas to the visible canvas ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
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
    isTouching = true;
    isFiring = true; // Start firing on touch
    const rect = canvas.getBoundingClientRect();
    touchX = (e.touches[0].clientX - rect.left) * (GAME_SIZE / rect.width);
    touchY = (e.touches[0].clientY - rect.top) * (GAME_SIZE / rect.height);
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

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Initialize and start the game
setupCanvas();
initGame();
window.addEventListener('resize', setupCanvas);
requestAnimationFrame(gameLoop);