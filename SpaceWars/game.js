const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_SIZE = 800; // Logical game size

// Game variables
let player;
let bullets = [];
let enemies = [];
let enemyBullets = [];
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

// Enemy Types
const ENEMY_TYPES = [
    {
        name: 'Scout',
        width: 50,
        height: 30,
        speedMin: 3,
        speedMax: 5,
        color: '#8B0000', // Dark Red
        draw: function(ctx, enemy) {
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Main body - sleek, fast-looking
            let mainBodyGradient = ctx.createLinearGradient(ex, ey, ex + ew, ey + eh);
            mainBodyGradient.addColorStop(0, '#8B0000'); // Dark Red
            mainBodyGradient.addColorStop(0.5, '#DC143C'); // Crimson
            mainBodyGradient.addColorStop(1, '#8B0000'); // Dark Red
            ctx.fillStyle = mainBodyGradient;

            ctx.beginPath();
            ctx.moveTo(ex, ey + eh / 2); // Front tip
            ctx.lineTo(ex + ew * 0.8, ey); // Top back
            ctx.lineTo(ex + ew, ey + eh / 2); // Rear tip
            ctx.lineTo(ex + ew * 0.8, ey + eh); // Bottom back
            ctx.closePath();
            ctx.fill();

            // Cockpit
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.beginPath();
            ctx.arc(ex + ew * 0.4, ey + eh / 2, eh / 6, 0, Math.PI * 2);
            ctx.fill();

            // Small wings/stabilizers
            ctx.fillStyle = '#696969'; // DimGray
            ctx.beginPath();
            ctx.moveTo(ex + ew * 0.6, ey + eh * 0.1);
            ctx.lineTo(ex + ew * 0.7, ey - eh * 0.1);
            ctx.lineTo(ex + ew * 0.7, ey + eh * 0.2);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(ex + ew * 0.6, ey + eh * 0.9);
            ctx.lineTo(ex + ew * 0.7, ey + eh * 1.1);
            ctx.lineTo(ex + ew * 0.7, ey + eh * 0.8);
            ctx.closePath();
            ctx.fill();
        }
    },
    {
        name: 'Fighter',
        width: 70,
        height: 40,
        speedMin: 2,
        speedMax: 4,
        color: '#4B0082', // Indigo
        draw: function(ctx, enemy) {
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Main body with gradient - more aggressive, angular
            let mainBodyGradient = ctx.createLinearGradient(ex, ey, ex + ew, ey + eh);
            mainBodyGradient.addColorStop(0, '#4B0082'); // Indigo
            mainBodyGradient.addColorStop(0.5, '#8A2BE2'); // BlueViolet
            mainBodyGradient.addColorStop(1, '#4B0082'); // Indigo
            ctx.fillStyle = mainBodyGradient;

            ctx.beginPath();
            ctx.moveTo(ex, ey + eh / 2); // Front tip
            ctx.lineTo(ex + ew * 0.7, ey - eh * 0.2); // Top wing front
            ctx.lineTo(ex + ew, ey); // Top wing back
            ctx.lineTo(ex + ew * 0.8, ey + eh / 2); // Mid-body back
            ctx.lineTo(ex + ew, ey + eh); // Bottom wing back
            ctx.lineTo(ex + ew * 0.7, ey + eh * 1.2); // Bottom wing front
            ctx.closePath();
            ctx.fill();

            // Cockpit
            ctx.fillStyle = '#ADD8E6'; // Light Blue
            ctx.beginPath();
            ctx.ellipse(ex + ew * 0.6, ey + eh / 2, ew * 0.15, eh * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cannons - prominent
            ctx.fillStyle = '#696969'; // DimGray
            ctx.fillRect(ex + ew * 0.8, ey - eh * 0.1, ew * 0.2, eh * 0.1);
            ctx.fillRect(ex + ew * 0.8, ey + eh, ew * 0.2, eh * 0.1);
        }
    },
    {
        name: 'Bomber',
        width: 90,
        height: 50,
        speedMin: 1,
        speedMax: 3,
        color: '#2F4F4F', // DarkSlateGray
        draw: function(ctx, enemy) {
            const ex = enemy.x;
            const ey = enemy.y;
            const ew = enemy.width;
            const eh = enemy.height;

            // Main body with gradient - large, imposing
            let mainBodyGradient = ctx.createLinearGradient(ex, ey, ex + ew, ey + eh);
            mainBodyGradient.addColorStop(0, '#2F4F4F'); // DarkSlateGray
            mainBodyGradient.addColorStop(0.5, '#708090'); // SlateGray
            mainBodyGradient.addColorStop(1, '#2F4F4F'); // DarkSlateGray
            ctx.fillStyle = mainBodyGradient;

            ctx.beginPath();
            ctx.moveTo(ex, ey + eh / 2); // Front
            ctx.lineTo(ex + ew * 0.8, ey); // Top front
            ctx.lineTo(ex + ew, ey + eh * 0.2); // Top rear
            ctx.lineTo(ex + ew, ey + eh * 0.8); // Bottom rear
            ctx.lineTo(ex + ew * 0.8, ey + eh); // Bottom front
            ctx.closePath();
            ctx.fill();

            // Cockpit - central, armored
            ctx.fillStyle = '#B0C4DE'; // LightSteelBlue
            ctx.beginPath();
            ctx.ellipse(ex + ew * 0.6, ey + eh / 2, ew * 0.15, eh * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bomb Bay / Cargo Pods
            ctx.fillStyle = '#000000'; // Black
            ctx.fillRect(ex + ew * 0.3, ey + eh * 0.3, ew * 0.3, eh * 0.4);
            ctx.fillStyle = '#696969'; // DimGray for details
            ctx.fillRect(ex + ew * 0.35, ey + eh * 0.35, ew * 0.2, eh * 0.1);
            ctx.fillRect(ex + ew * 0.35, ey + eh * 0.55, ew * 0.2, eh * 0.1);
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

function setupCanvas() {
    canvas.width = GAME_SIZE; // Set drawing buffer to logical game size
    canvas.height = GAME_SIZE;

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

    // For touch events, we need to scale touch coordinates back to GAME_SIZE
    // This is handled in the touch event listeners directly now.
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
    score = 0;
    gameOver = false;
    lastBulletTime = 0;
    lastEnemySpawnTime = 0;
    level = 1;
    enemiesToDefeat = 5; // Start with fewer enemies to defeat
    currentEnemiesDefeated = 0;
    levelMessage = '';
    levelMessageAlpha = 0;

    // Reset difficulty parameters for new game
    ENEMY_SPAWN_INTERVAL = 1500; // Slower initial spawn
    ENEMY_FIRE_COOLDOWN = 3000; // Much slower initial enemy fire

    // Initialize terrain
    terrain = [];
    let currentHeight = TERRAIN_BASE_HEIGHT;
    for (let i = 0; i < GAME_SIZE / TERRAIN_SEGMENT_WIDTH + 2; i++) {
        terrain.push({
            x: i * TERRAIN_SEGMENT_WIDTH,
            y: currentHeight
        });
        currentHeight += (Math.random() - 0.5) * TERRAIN_HEIGHT_VARIATION * 0.5; // Smaller initial variation
        currentHeight = Math.max(TERRAIN_BASE_HEIGHT - TERRAIN_HEIGHT_VARIATION, Math.min(TERRAIN_BASE_HEIGHT + TERRAIN_HEIGHT_VARIATION, currentHeight));
    }

    // Initialize stars
    stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * GAME_SIZE,
            y: Math.random() * GAME_SIZE,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.5 + 0.1 // Slower stars
        });
    }
}

function generateTerrainSegment(lastHeight) {
    let newHeight = lastHeight + (Math.random() - 0.5) * TERRAIN_HEIGHT_VARIATION;
    newHeight = Math.max(TERRAIN_BASE_HEIGHT - TERRAIN_HEIGHT_VARIATION, Math.min(TERRAIN_BASE_HEIGHT + TERRAIN_HEIGHT_VARIATION, newHeight));
    return newHeight;
}

function updateTerrain() {
    // Scroll terrain
    for (let i = 0; i < terrain.length; i++) {
        terrain[i].x -= ENEMY_SPEED_MIN; // Use enemy speed for terrain scrolling
    }

    // Remove off-screen segments and add new ones
    if (terrain[0].x + TERRAIN_SEGMENT_WIDTH < 0) {
        terrain.shift();
        const lastSegment = terrain[terrain.length - 1];
        terrain.push({
            x: lastSegment.x + TERRAIN_SEGMENT_WIDTH,
            y: generateTerrainSegment(lastSegment.y)
        });
    }
}

function drawTerrain() {
    ctx.fillStyle = '#8B4513'; // Saddle Brown
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.lineTo(GAME_SIZE, GAME_SIZE);
    ctx.lineTo(0, GAME_SIZE);
    ctx.closePath();
    ctx.fill();

    // Draw a green top layer for grass/foliage
    ctx.fillStyle = '#228B22'; // Forest Green
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.lineTo(terrain[terrain.length - 1].x, terrain[terrain.length - 1].y - 5); // Slightly above terrain
    for (let i = terrain.length - 2; i >= 0; i--) {
        ctx.lineTo(terrain[i].x, terrain[i].y - 5);
    }
    ctx.closePath();
    ctx.fill();
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
    return TERRAIN_BASE_HEIGHT; // Default if outside current terrain view
}

function checkTerrainCollision(player) {
    // Find the terrain segment directly below the player's center x-coordinate
    const playerCenterX = player.x + player.width / 2;
    let terrainYAtPlayerX = getTerrainHeightAt(playerCenterX);

    // If player's bottom is below terrain, it's a collision
    if (player.y + player.height > terrainYAtPlayerX) {
        return true;
    }
    return false;
}

function drawPlayer() {
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    // Main body - sleek, layered design, facing right
    let mainBodyGradient = ctx.createLinearGradient(px, py, px + pw, py + ph);
    mainBodyGradient.addColorStop(0, '#A9A9A9'); // DarkGray
    mainBodyGradient.addColorStop(0.5, '#D3D3D3'); // LightGray
    mainBodyGradient.addColorStop(1, '#A9A9A9'); // DarkGray
    ctx.fillStyle = mainBodyGradient;

    ctx.beginPath();
    ctx.moveTo(px + pw, py + ph / 2); // Front tip
    ctx.lineTo(px + pw * 0.2, py); // Top front wing connection
    ctx.lineTo(px, py + ph * 0.1); // Top rear wing tip
    ctx.lineTo(px, py + ph * 0.9); // Bottom rear wing tip
    ctx.lineTo(px + pw * 0.2, py + ph); // Bottom front wing connection
    ctx.closePath();
    ctx.fill();

    // Cockpit - more distinct bubble
    ctx.fillStyle = '#87CEEB'; // SkyBlue for glass
    ctx.beginPath();
    ctx.ellipse(px + pw * 0.4, py + ph / 2, pw * 0.2, ph * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5F9EA0'; // CadetBlue for frame
    ctx.lineWidth = 2;
    ctx.stroke();

    // Side fins/wings
    ctx.fillStyle = '#696969'; // DimGray
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.3, py);
    ctx.lineTo(px + pw * 0.1, py - ph * 0.2);
    ctx.lineTo(px + pw * 0.1, py + ph * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + pw * 0.3, py + ph);
    ctx.lineTo(px + pw * 0.1, py + ph * 1.2);
    ctx.lineTo(px + pw * 0.1, py + ph * 0.9);
    ctx.closePath();
    ctx.fill();

    // Thrusters/Engines at the back (left side)
    ctx.fillStyle = '#483D8B'; // DarkSlateBlue
    ctx.fillRect(px + pw * 0.1, py + ph * 0.2, pw * 0.2, ph * 0.6);

    // Engine exhaust
    const flameSize = ph / 2 + Math.random() * (ph / 3); // More pronounced flickering
    ctx.fillStyle = `rgba(255, ${165 + Math.random() * 90}, 0, ${0.8 + Math.random() * 0.2})`; // Brighter, more opaque
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.1, py + ph * 0.5); // Center of thruster exit
    ctx.lineTo(px + pw * 0.1 - flameSize, py + ph * 0.5 - flameSize / 2);
    ctx.lineTo(px + pw * 0.1 - flameSize * 0.7, py + ph * 0.5);
    ctx.lineTo(px + pw * 0.1 - flameSize, py + ph * 0.5 + flameSize / 2);
    ctx.closePath();
    ctx.fill();
}

function drawEnemy(enemy) {
    enemy.type.draw(ctx, enemy);

    // Engine exhaust for enemy (moved here to be drawn after the ship body)
    const ex = enemy.x;
    const ey = enemy.y;
    const ew = enemy.width;
    const eh = enemy.height;

    const enemyFlameSize = eh / 4 + Math.random() * (eh / 5); // Flickering effect
    ctx.fillStyle = `rgba(255, ${0 + Math.random() * 100}, 0, ${0.6 + Math.random() * 0.3})`; // Reddish to dark orange, flickering alpha
    ctx.beginPath();
    ctx.moveTo(ex + ew, ey + eh / 2); // Start at the back of the enemy ship
    ctx.lineTo(ex + ew + enemyFlameSize, ey + eh / 2 - enemyFlameSize / 2);
    ctx.lineTo(ex + ew + enemyFlameSize * 0.7, ey + eh / 2);
    ctx.lineTo(ex + ew + enemyFlameSize, ey + eh / 2 + enemyFlameSize / 2);
    ctx.closePath();
    ctx.fill();
}

function drawBullet(bullet) {
    const bx = bullet.x;
    const by = bullet.y;
    const bw = bullet.width;
    const bh = bullet.height;

    // Missile body
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.beginPath();
    ctx.moveTo(bx, by - bh / 2); // Top back
    ctx.lineTo(bx + bw, by); // Front tip
    ctx.lineTo(bx, by + bh / 2); // Bottom back
    ctx.closePath();
    ctx.fill();

    // Missile exhaust
    const flameSize = bw * 0.5 + Math.random() * (bw * 0.3);
    ctx.fillStyle = `rgba(255, ${165 + Math.random() * 90}, 0, ${0.8 + Math.random() * 0.2})`; // Orange-yellow flickering
    ctx.beginPath();
    ctx.moveTo(bx, by); // Center back of missile
    ctx.lineTo(bx - flameSize, by - flameSize / 2);
    ctx.lineTo(bx - flameSize * 0.7, by);
    ctx.lineTo(bx - flameSize, by + flameSize / 2);
    ctx.closePath();
    ctx.fill();
}

function drawEnemyBullet(bullet) {
    const bx = bullet.x;
    const by = bullet.y;
    const bw = bullet.width;
    const bh = bullet.height;

    // Missile body
    ctx.fillStyle = '#FF0000'; // Red
    ctx.beginPath();
    ctx.moveTo(bx + bw, by - bh / 2); // Top back (relative to enemy direction)
    ctx.lineTo(bx, by); // Front tip (relative to enemy direction)
    ctx.lineTo(bx + bw, by + bh / 2); // Bottom back (relative to enemy direction)
    ctx.closePath();
    ctx.fill();

    // Missile exhaust
    const flameSize = bw * 0.5 + Math.random() * (bw * 0.3);
    ctx.fillStyle = `rgba(255, ${0 + Math.random() * 100}, 0, ${0.6 + Math.random() * 0.3})`; // Reddish flickering
    ctx.beginPath();
    ctx.moveTo(bx + bw, by); // Center back of missile
    ctx.lineTo(bx + bw + flameSize, by - flameSize / 2);
    ctx.lineTo(bx + bw + flameSize * 0.7, by);
    ctx.lineTo(bx + bw + flameSize, by + flameSize / 2);
    ctx.closePath();
    ctx.fill();
}

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawProgressBar(x, y, width, height, progress) {
    // Background of the progress bar
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, width, height);

    // Filled part of the progress bar
    ctx.fillStyle = '#00FF00'; // Green
    ctx.fillRect(x, y, width * progress, height);

    // Border of the progress bar
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Progress text
    ctx.fillStyle = 'white';
    ctx.font = `12px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(progress * 100)}%`, x + width / 2, y + height / 2 + 4);
}

function update(deltaTime) {
    if (gameOver) return;

    // Update player position based on keyboard
    if (!isTouching) {
        if (keys.ArrowUp) player.y -= player.speed;
        if (keys.ArrowDown) player.y += player.speed;
        if (keys.ArrowLeft) player.x -= player.speed;
        if (keys.ArrowRight) player.x += player.speed;
    }

    // Update player position based on touch (drag)
    if (isTouching && touchX !== -1 && touchY !== -1) {
        // Simple follow for now, can be refined for smoother drag
        player.x = touchX - player.width / 2;
        player.y = touchY - player.height / 2;
    }

    // Keep player within bounds
    player.x = Math.max(0, Math.min(GAME_SIZE - player.width, player.x));
    player.y = Math.max(0, Math.min(GAME_SIZE - player.height, player.y));

    // Player shooting
    if (keys.Space && Date.now() - lastBulletTime > BULLET_COOLDOWN) {
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
    if (enemies.length < (level * 2) && Date.now() - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) { // Max enemies scales with level
        const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        const spawnX = GAME_SIZE;
        const terrainY = getTerrainHeightAt(spawnX);
        const spawnY = Math.random() * (terrainY - enemyType.height - 50); // Ensure enemy spawns above terrain with some buffer

        enemies.push({
            x: spawnX,
            y: spawnY,
            width: enemyType.width,
            height: enemyType.height,
            speed: enemyType.speedMin + Math.random() * (enemyType.speedMax - enemyType.speedMin),
            type: enemyType, // Store the enemy type for drawing
            lastFire: Date.now() + Math.random() * ENEMY_FIRE_COOLDOWN // Stagger initial fire
        });
        lastEnemySpawnTime = Date.now();
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i]) continue; // Fix for undefined enemy
        enemies[i].x -= enemies[i].speed;
        if (enemies[i].x + enemies[i].width < 0) {
            enemies.splice(i, 1);
        }

        // Enemy firing (with a random chance)
        if (Math.random() < 0.01 * level && Date.now() - enemies[i].lastFire > ENEMY_FIRE_COOLDOWN) { // Chance to fire increases with level
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

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].x += enemyBullets[i].speed;
        if (enemyBullets[i].x < 0) {
            enemyBullets.splice(i, 1);
        }
    }

    // Collision detection
    // Bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i] && enemies[j] && checkCollision(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                currentEnemiesDefeated++; // Increment defeated count
                break; // Bullet can only hit one enemy
            }
        }
    }

    // Player-enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i] && checkCollision(player, enemies[i])) {
            player.health--;
            enemies.splice(i, 1);
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    }

    // Player-enemy bullet collisions
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i] && checkCollision(player, enemyBullets[i])) {
            player.health--;
            enemyBullets.splice(i, 1);
            if (player.health <= 0) {
                gameOver = true;
            }
        }
    }

    // Player-terrain collision
    if (checkTerrainCollision(player)) {
        player.health = 0; // Instant death on terrain collision
        gameOver = true;
    }

    // Update terrain
    updateTerrain();

    // Update stars
    for (let i = 0; i < stars.length; i++) {
        stars[i].x -= stars[i].speed;
        if (stars[i].x < 0) {
            stars[i].x = GAME_SIZE;
            stars[i].y = Math.random() * GAME_SIZE;
        }
    }

    // Level progression
    if (currentEnemiesDefeated >= enemiesToDefeat) {
        level++;
        currentEnemiesDefeated = 0;
        enemiesToDefeat = 5 + (level * 2); // More gradual increase
        ENEMY_SPAWN_INTERVAL = Math.max(200, ENEMY_SPAWN_INTERVAL - 100); // Don't go below 200ms
        ENEMY_FIRE_COOLDOWN = Math.max(500, ENEMY_FIRE_COOLDOWN - 200); // Don't go below 500ms
        levelMessage = `LEVEL ${level-1} COMPLETE!`; // Display previous level as complete
        levelMessageAlpha = 1; // Make message fully visible
    }

    // Fade out level complete message
    if (levelMessageAlpha > 0) {
        levelMessageAlpha -= 0.01; // Adjust fade speed
    }
}

function draw(scaleX, scaleY) {
    ctx.clearRect(0, 0, GAME_SIZE, GAME_SIZE);

    // Draw stars background
    drawStars();

    // Draw terrain first
    drawTerrain();

    // Draw player
    drawPlayer();

    // Draw bullets
    bullets.forEach(bullet => {
        drawBullet(bullet);
    });

    // Draw enemy bullets
    enemyBullets.forEach(bullet => {
        drawEnemyBullet(bullet);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        drawEnemy(enemy);
    });

    // Draw combined status line
    ctx.fillStyle = 'white';
    ctx.font = `20px Arial`;
    ctx.textAlign = 'left';
    let statusText = `⭐ ${score}  ❤️ ${player.health}  ${level}`; // Removed "Level"
    ctx.fillText(statusText, 10, 30);

    // Draw progress bar on the same line
    const progressBarX = ctx.measureText(statusText).width + 20; // Position after status text
    const progressBarY = 15; // Align with text
    const progressBarWidth = 150;
    const progressBarHeight = 15;
    const progress = currentEnemiesDefeated / enemiesToDefeat;

    drawProgressBar(progressBarX, progressBarY, progressBarWidth, progressBarHeight, progress);

    // Level Complete message
    if (levelMessageAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = levelMessageAlpha;
        ctx.fillStyle = 'white';
        ctx.font = `40px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(levelMessage, GAME_SIZE / 2, GAME_SIZE / 2);
        ctx.restore();
    }

    // Draw Game Over screen
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_SIZE, GAME_SIZE);
        ctx.fillStyle = 'white';
        ctx.font = `40px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_SIZE / 2, GAME_SIZE / 2 - 20);
        ctx.font = `20px Arial`;
        ctx.fillText('Press F5 to Restart', GAME_SIZE / 2, GAME_SIZE / 2 + 20);
    }
}

// Event Listeners for Keyboard
document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Event Listeners for Touch (Mobile Drag Controls)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    isTouching = true;
    const rect = canvas.getBoundingClientRect();
    touchX = (e.touches[0].clientX - rect.left) * (GAME_SIZE / rect.width); // Scale touch to GAME_SIZE
    touchY = (e.touches[0].clientY - rect.top) * (GAME_SIZE / rect.height); // Scale touch to GAME_SIZE
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isTouching) {
        const rect = canvas.getBoundingClientRect();
        touchX = (e.touches[0].clientX - rect.left) * (GAME_SIZE / rect.width); // Scale touch to GAME_SIZE
        touchY = (e.touches[0].clientY - rect.top) * (GAME_SIZE / rect.height); // Scale touch to GAME_SIZE
    }
});

canvas.addEventListener('touchend', () => {
    isTouching = false;
    touchX = -1;
    touchY = -1;
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