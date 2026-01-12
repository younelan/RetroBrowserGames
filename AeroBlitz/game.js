import Player from './Player.js';
import Level from './Level.js';
import Projectile from './Projectile.js';
import BasicDrone from './BasicDrone.js';
import HeavyCruiser from './HeavyCruiser.js';
import FastScout from './FastScout.js';
import Particle from './Particle.js';
import PowerUp from './PowerUp.js';
import EnemyProjectile from './EnemyProjectile.js';

// Get canvas and context
window.canvas = document.getElementById('game-canvas');
window.ctx = window.canvas.getContext('2d');
const miniMapCanvas = document.getElementById('mini-map-canvas');
const miniMapCtx = miniMapCanvas.getContext('2d');

// Get UI elements
const scoreDisplay = document.getElementById('score-display');
const levelDisplay = document.getElementById('level-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScore = document.getElementById('final-score');

// --- SCALING & CORE STATE (exposed globally for modules) ---
window.NATIVE_WIDTH = 800;
window.NATIVE_HEIGHT = 800;
window.scaleFactor = 1;

window.score = 0;
window.level = 1;
let gameOver = false;
let gameRunning = false;
let nextLevelScore = 1000;
let lastTime = 0;

// Game objects arrays (exposed globally for modules)
window.projectiles = [];
window.enemyProjectiles = [];
window.enemies = [];
window.particles = [];
window.powerUps = [];

// --- SETTINGS (exposed globally for modules) ---
window.PLAYER_SETTINGS = {
    x: window.NATIVE_WIDTH / 2,
    screenY: window.NATIVE_HEIGHT - 100, // Player's fixed position from bottom of screen
    size: 35,
    lerpFactor: 0.15,
    weaponLevel: 1,
    maxWeaponLevel: 4
};

// --- RESIZE & SCALING ---
function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.95;
    window.canvas.width = size;
    window.canvas.height = size;
    window.scaleFactor = window.canvas.width / window.NATIVE_WIDTH;

    window.levelManager = new Level();
    if (window.player) {
        window.player.targetX = window.player.x;
        // When resizing, re-align player to the defined screenY
        window.player.y = window.PLAYER_SETTINGS.screenY; 
        window.player.targetY = window.PLAYER_SETTINGS.screenY; 
    }
}

// --- PARTICLE & EXPLOSION ---
// This function needs to be global for now as it's called from handleCollisions
window.createExplosion = function(x, y, color) {
    for (let i = 0; i < 20; i++) {
        window.particles.push(new Particle(x, y, color));
    }
};

// --- GAME LOGIC ---

function drawInWorld(object) {
    const screenX = object.x * window.scaleFactor;
    const screenY = (object.y - window.levelManager.scrollOffset) * window.scaleFactor;
    
    // Culling: If object is out of screen, don't draw
    const cullMargin = (object.size || 0) * window.scaleFactor * 2;
    if (screenY < -cullMargin || screenY > window.canvas.height + cullMargin ||
        screenX < -cullMargin || screenX > window.canvas.width + cullMargin) {
        return;
    }

    window.ctx.save();
    window.ctx.translate(screenX, screenY);
    object.draw();
    window.ctx.restore();
}

function gameLoop(timestamp) {
    if (gameOver) return;
    if (!lastTime) lastTime = timestamp;
    const deltaTime = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);

    window.levelManager.update(deltaTime);
    window.levelManager.draw();
    
    window.player.update(deltaTime, window.levelManager);
    window.player.draw();
    window.player.shoot();

    const cameraTop = window.levelManager.scrollOffset;
    const cameraBottom = window.levelManager.scrollOffset + window.NATIVE_HEIGHT;

    window.projectiles.forEach((p, i) => {
        p.update(deltaTime);
        drawInWorld(p);
        if (p.y < cameraTop - p.size) window.projectiles.splice(i, 1);
    });

    window.enemies.forEach((e, i) => {
        e.update(deltaTime);
        drawInWorld(e);
        if (e.y > cameraBottom + e.size) window.enemies.splice(i, 1);
    });

    window.powerUps.forEach((p, i) => {
        p.update(deltaTime);
        drawInWorld(p);
        if (p.y > cameraBottom + p.size) window.powerUps.splice(i, 1);
    });
    
    window.particles.forEach((p, i) => {
        p.update(deltaTime);
        drawInWorld(p);
        if (p.life <= 0) window.particles.splice(i, 1);
    });

    window.enemyProjectiles.forEach((p, i) => {
        p.update(deltaTime);
        drawInWorld(p);
        if (p.y > cameraBottom + p.size) window.enemyProjectiles.splice(i, 1);
    });

    spawnEnemies();
    handleCollisions();
    updateUI();
    drawHUD();

    requestAnimationFrame(gameLoop);
}

function drawHUD() {
    // Health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const x = 10;
    const y = 10;
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, healthBarWidth, healthBarHeight);
    ctx.fillStyle = 'green';
    ctx.fillRect(x, y, healthBarWidth * (window.player.health / window.player.maxHealth), healthBarHeight);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(x, y, healthBarWidth, healthBarHeight);
    ctx.restore();

    // Mini-map
    const miniMapSize = 150;
    miniMapCtx.clearRect(0, 0, miniMapSize, miniMapSize);

    // Draw scaled level canvas
    const miniMapScale = miniMapSize / window.NATIVE_WIDTH;
    const miniMapSourceY = window.levelManager.levelLength - window.NATIVE_HEIGHT - window.levelManager.scrollOffset;
    miniMapCtx.drawImage(
        window.levelManager.levelCanvasElement,
        0, miniMapSourceY,
        window.NATIVE_WIDTH, window.NATIVE_HEIGHT,
        0, 0,
        miniMapSize, miniMapSize
    );

    // Mini-map Title
    miniMapCtx.fillStyle = 'white';
    miniMapCtx.font = '12px Arial';
    miniMapCtx.textAlign = 'center';
    miniMapCtx.fillText('Mini-map', miniMapSize / 2, 12);

    // Draw player on mini-map
    const playerX = (window.player.x / window.NATIVE_WIDTH) * miniMapSize;
    const playerY = ((window.player.y - window.levelManager.scrollOffset) / window.NATIVE_HEIGHT) * miniMapSize;
    miniMapCtx.fillStyle = 'blue';
    miniMapCtx.fillRect(playerX - 2, playerY - 2, 4, 4);

    // Draw enemies on mini-map
    miniMapCtx.fillStyle = 'red';
    window.enemies.forEach(enemy => {
        const enemyX = (enemy.x / window.NATIVE_WIDTH) * miniMapSize;
        const enemyY = ((enemy.y - window.levelManager.scrollOffset) / window.NATIVE_HEIGHT) * miniMapSize;
        if (enemyY > 0 && enemyY < miniMapSize) {
            miniMapCtx.fillRect(enemyX - 1, enemyY - 1, 2, 2);
        }
    });
}


let enemySpawnTimer = 0;

function spawnEnemies() {
    enemySpawnTimer -= 1;
    if (enemySpawnTimer <= 0) {
        const spawnRate = 80 - window.level * 5;
        enemySpawnTimer = Math.max(5, spawnRate);

        const x = Math.random() * (window.NATIVE_WIDTH - 80) + 40;
        const y = window.levelManager.scrollOffset - 60; // Spawn above the screen
        const rand = Math.random();

        if (rand < 0.6 || window.level < 2) {
            window.enemies.push(new BasicDrone(x, y));
        } else if (rand < 0.85 && window.level >= 2) {
            window.enemies.push(new FastScout(x, y));
        } else if (window.level >= 3) {
            window.enemies.push(new HeavyCruiser(x, y));
        }
    }
}

function handleCollisions() {
    // Calculate player's world Y position for consistent collision checks
    const playerWorldY = window.player.y + window.levelManager.scrollOffset;

    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        for (let j = window.enemies.length - 1; j >= 0; j--) {
            const p = window.projectiles[i];
            const e = window.enemies[j];
            if (!p || !e) continue;
            // Projectiles are world-relative in their update, so p.y is world-relative
            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            if (dist < e.size / 2 + p.size / 2) {
                e.health--;
                window.createExplosion(p.x, p.y, p.color);
                window.projectiles.splice(i, 1);
                if (e.health <= 0) {
                    window.createExplosion(e.x, e.y, e.color);
                    window.score += Math.round(e.size);
                    if (Math.random() < 0.2) {
                        window.powerUps.push(new PowerUp(e.x, e.y));
                    }
                    window.enemies.splice(j, 1);
                }
                break; 
            }
        }
    }

    if (!window.player.isHit) {
        for (let i = window.enemies.length - 1; i >= 0; i--) {
            const e = window.enemies[i];
            // Player's x is world-relative, but need playerWorldY for y-collision
            const dist = Math.hypot(window.player.x - e.x, playerWorldY - e.y);
            if (dist < e.size / 2 + window.player.size / 2) {
                window.createExplosion(window.player.x, playerWorldY, '#00aaff');
                window.createExplosion(e.x, e.y, e.color);
                window.enemies.splice(i, 1);
                window.player.isHit = true;
                window.player.hitTimer = 120;
                window.player.health -= 25;
                if (window.player.health <= 0) {
                    showGameOver();
                }
            }
        }
    }

    for (let i = window.powerUps.length - 1; i >= 0; i--) {
        const p = window.powerUps[i];
        // Player's x is world-relative, but need playerWorldY for y-collision
        const dist = Math.hypot(window.player.x - p.x, playerWorldY - p.y);
        if (dist < p.size / 2 + window.player.size / 2) {
            window.player.upgradeWeapon();
            window.powerUps.splice(i, 1);
        }
    }

    if (!window.player.isHit) {
        for (let i = window.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = window.enemyProjectiles[i];
            // Enemy projectiles are world-relative, so p.y is world-relative
            const dist = Math.hypot(window.player.x - p.x, playerWorldY - p.y);
            if (dist < p.size / 2 + window.player.size / 2) {
                window.createExplosion(window.player.x, playerWorldY, '#ff0000');
                window.enemyProjectiles.splice(i, 1);
                window.player.isHit = true;
                window.player.hitTimer = 120;
                window.player.health -= 10;
                if (window.player.health <= 0) {
                    showGameOver();
                }
            }
        }
    }
}

function updateUI() {
    scoreDisplay.textContent = `Score: ${window.score}`;
    if (window.score >= nextLevelScore) {
        window.level++;
        nextLevelScore *= 2.5;
    }
    levelDisplay.textContent = `Level: ${window.level}`;
}

function startGame() {
    resizeCanvas();
    window.player = new Player();
    
    window.score = 0;
    window.level = 1;
    nextLevelScore = 1000;
    gameOver = false;
    gameRunning = true;
    window.projectiles = [];
    window.enemyProjectiles = [];
    window.enemies = [];
    window.particles = [];
    window.powerUps = [];

    window.player.x = window.NATIVE_WIDTH / 2;
    window.player.y = window.PLAYER_SETTINGS.screenY; // Use screenY for initial position
    window.player.targetX = window.player.x;
    window.player.targetY = window.PLAYER_SETTINGS.screenY; // Use screenY for initial target

    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    lastTime = 0;
    gameLoop(performance.now());
}

function showGameOver() {
    gameOver = true;
    gameRunning = false;
    finalScore.textContent = window.score;
    gameOverScreen.style.display = 'flex';
}

// --- EVENT LISTENERS ---
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
window.addEventListener('resize', resizeCanvas);

function movePlayer(e) {
    if (!gameRunning) return;
    const rect = window.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const gameX = (clientX - rect.left) / window.scaleFactor;
    const gameY = (clientY - rect.top) / window.scaleFactor;
    
    window.player.targetX = Math.max(window.player.size / 2, Math.min(window.NATIVE_WIDTH - window.player.size / 2, gameX));
    window.player.targetY = Math.max(window.player.size / 2, Math.min(window.NATIVE_HEIGHT - window.player.size / 2, gameY));
}

window.canvas.addEventListener('mousemove', movePlayer);
window.canvas.addEventListener('touchmove', e => { e.preventDefault(); movePlayer(e); }, { passive: false });
window.canvas.addEventListener('touchstart', e => { e.preventDefault(); movePlayer(e); }, { passive: false });

// --- INITIAL SETUP ---
resizeCanvas();
window.levelManager.draw();
const tempPlayer = new Player();
tempPlayer.x = window.NATIVE_WIDTH/2;
tempPlayer.y = window.PLAYER_SETTINGS.screenY;
tempPlayer.draw();
