const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- VIRTUAL RESOLUTION --- 
const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 800;

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const highScoreStartEl = document.getElementById('high-score-start');
const highScoreEndEl = document.getElementById('high-score-end');
const helpModal = document.getElementById('help-modal');
const restartModal = document.getElementById('restart-modal');

// Buttons
const easyBtn = document.getElementById('easy');
const mediumBtn = document.getElementById('medium');
const hardBtn = document.getElementById('hard');
const restartBtn = document.getElementById('restart');
const helpBtnStart = document.getElementById('help-btn-start');
const helpBtnOver = document.getElementById('help-btn-over');
const closeHelpBtn = document.getElementById('close-help-btn');
const confirmRestartBtn = document.getElementById('confirm-restart-btn');
const cancelRestartBtn = document.getElementById('cancel-restart-btn');

// Game State
let bird, obstacles, collectibles, score, level, lives, highScore, difficulty, gameLoop;
let gameStarted = false, gameOver = false, isPaused = false, lastDifficulty = 'easy';
let particles = [], lastTime = 0, timeScale = 1;
const obstacleTypes = ['pipe', 'spinner', 'crusher', 'moving_platform'];
let lastObstacleType = '';

const difficulties = {
    easy: { speed: 150, gravity: 900, flap: 320, obstacleDist: 450, pipeGap: 280, spinnerSpeed: 1.5, crusherSpeed: 100, platformSpeed: 100, collectibleChance: 0.8 },
    medium: { speed: 180, gravity: 950, flap: 350, obstacleDist: 400, pipeGap: 240, spinnerSpeed: 1.8, crusherSpeed: 130, platformSpeed: 130, collectibleChance: 0.6 },
    hard: { speed: 210, gravity: 1000, flap: 380, obstacleDist: 350, pipeGap: 200, spinnerSpeed: 2.2, crusherSpeed: 160, platformSpeed: 160, collectibleChance: 0.4 }
};

// --- ENTITIES ---
function Bird() {
    this.x = VIRTUAL_WIDTH / 4; this.y = VIRTUAL_HEIGHT / 2; this.baseRadius = VIRTUAL_WIDTH / 35; this.radius = this.baseRadius;
    this.velocity = 0; this.angle = 0; this.shielded = false; this.shieldTime = 0; this.invincible = false; this.invincibleTime = 0;
    this.isShrunk = false; this.shrinkTime = 0;

    this.draw = function() {
        if (this.invincible && Math.floor(this.invincibleTime * 10) % 2 === 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        this.angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.velocity / 400));
        ctx.rotate(this.angle);

        if (this.shielded) {
            const shieldGrad = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.radius * 1.5);
            shieldGrad.addColorStop(0, 'rgba(52, 152, 219, 0.2)'); shieldGrad.addColorStop(1, 'rgba(52, 152, 219, 0.8)');
            ctx.fillStyle = shieldGrad; ctx.beginPath(); ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2); ctx.fill();
        }

        const grad = ctx.createRadialGradient(0, 0, this.radius / 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffb3'); grad.addColorStop(1, '#ffc400');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c69f00'; ctx.lineWidth = 3; ctx.stroke();

        ctx.beginPath(); ctx.arc(this.radius / 2, -this.radius / 2, this.radius / 3.5, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill();
        ctx.beginPath(); ctx.arc(this.radius / 2 + 2, -this.radius / 2, this.radius / 6, 0, Math.PI * 2); ctx.fillStyle = 'black'; ctx.fill();

        ctx.beginPath(); ctx.moveTo(-this.radius / 1.5, 0);
        ctx.arc(-this.radius / 1.5, 0, this.radius, 0.3 - Math.sin(performance.now() * 0.005) * 0.3, Math.PI - 0.3 + Math.sin(performance.now() * 0.005) * 0.3, false);
        ctx.fillStyle = '#ffde00'; ctx.fill();

        ctx.restore();
    }

    this.update = function(dt) {
        this.velocity += difficulty.gravity * dt;
        this.y += this.velocity * dt;

        if (this.shielded) { this.shieldTime -= dt; if (this.shieldTime <= 0) this.shielded = false; }
        if (this.invincible) { this.invincibleTime -= dt; if (this.invincibleTime <= 0) this.invincible = false; }
        if (this.isShrunk) { this.shrinkTime -= dt; if (this.shrinkTime <= 0) { this.isShrunk = false; this.radius = this.baseRadius; } }

        if (this.y > VIRTUAL_HEIGHT - this.radius - (VIRTUAL_HEIGHT * 0.1) || this.y < -this.radius * 2) handleCollision();
    }

    this.flap = function() {
        this.velocity = -difficulty.flap;
        for (let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y, 'rgba(255, 255, 255, 0.7)', 2, 80));
    }
}

function Pipe() {
    this.type = 'pipe'; this.x = VIRTUAL_WIDTH; this.width = VIRTUAL_WIDTH / 5; this.gap = difficulty.pipeGap;
    this.topHeight = Math.random() * (VIRTUAL_HEIGHT - this.gap - (VIRTUAL_HEIGHT * 0.3)) + (VIRTUAL_HEIGHT * 0.15);
    this.bottomHeight = VIRTUAL_HEIGHT - this.topHeight - this.gap; this.passed = false;
    this.draw = function() { 
        const grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        grad.addColorStop(0, '#28a745'); grad.addColorStop(0.5, '#34c759'); grad.addColorStop(1, '#28a745');
        ctx.fillStyle = grad; ctx.strokeStyle = '#1e7e34'; ctx.lineWidth = 4;
        ctx.fillRect(this.x, 0, this.width, this.topHeight); ctx.strokeRect(this.x, 0, this.width, this.topHeight);
        ctx.fillRect(this.x, VIRTUAL_HEIGHT - this.bottomHeight, this.width, this.bottomHeight); ctx.strokeRect(this.x, VIRTUAL_HEIGHT - this.bottomHeight, this.width, this.bottomHeight);
    };
    this.update = function(dt) { this.x -= difficulty.speed * dt * timeScale; }
    this.collidesWith = (b) => !b.invincible && !b.shielded && b.x + b.radius > this.x && b.x - b.radius < this.x + this.width && (b.y - b.radius < this.topHeight || b.y + b.radius > VIRTUAL_HEIGHT - this.bottomHeight);
}

function Spinner() {
    this.type = 'spinner'; this.x = VIRTUAL_WIDTH; this.y = VIRTUAL_HEIGHT / 2; this.radius = VIRTUAL_WIDTH / 7;
    this.angle = 0; this.speed = difficulty.spinnerSpeed; this.gap = Math.PI / 2.5; this.passed = false;
    this.draw = function() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.strokeStyle = '#a52a2a'; ctx.lineWidth = 8;
        for (let i = 0; i < 3; i++) {
            const grad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
            grad.addColorStop(0, '#e74c3c'); grad.addColorStop(1, '#c0392b');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, i * 2 * Math.PI / 3 + this.gap / 2, (i + 1) * 2 * Math.PI / 3 - this.gap / 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    };
    this.update = function(dt) { this.x -= difficulty.speed * dt * timeScale; this.angle += this.speed * dt * timeScale; }
    this.collidesWith = function(b) {
        if (b.invincible || b.shielded) return false;
        const dist = Math.hypot(b.x - this.x, b.y - this.y);
        if (dist > this.radius + b.radius || dist < this.radius / 4 - b.radius) return false;
        let birdAngle = (Math.atan2(b.y - this.y, b.x - this.x) - this.angle) % (2 * Math.PI);
        if (birdAngle < 0) birdAngle += 2 * Math.PI;
        for (let i = 0; i < 3; i++) {
            if (birdAngle > i * 2 * Math.PI / 3 + this.gap / 2 && birdAngle < (i + 1) * 2 * Math.PI / 3 - this.gap / 2) return true;
        }
        return false;
    };
}

function Crusher() {
    this.type = 'crusher'; this.x = VIRTUAL_WIDTH; this.width = VIRTUAL_WIDTH / 8; this.minGap = 180; this.maxGap = 350;
    this.gap = this.maxGap; this.speed = difficulty.crusherSpeed; this.direction = -1; this.passed = false;
    this.draw = function() {
        const grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        grad.addColorStop(0, '#7f8c8d'); grad.addColorStop(0.5, '#95a5a6'); grad.addColorStop(1, '#7f8c8d');
        ctx.fillStyle = grad; ctx.strokeStyle = '#566573'; ctx.lineWidth = 4;
        const topY = (VIRTUAL_HEIGHT - this.gap) / 2; const bottomY = (VIRTUAL_HEIGHT + this.gap) / 2;
        ctx.fillRect(this.x, 0, this.width, topY); ctx.strokeRect(this.x, 0, this.width, topY);
        ctx.fillRect(this.x, bottomY, this.width, VIRTUAL_HEIGHT - bottomY); ctx.strokeRect(this.x, bottomY, this.width, VIRTUAL_HEIGHT - bottomY);
    };
    this.update = function(dt) { this.x -= difficulty.speed * dt * timeScale; this.gap += this.speed * this.direction * dt * timeScale; if (this.gap < this.minGap || this.gap > this.maxGap) this.direction *= -1; }
    this.collidesWith = (b) => !b.invincible && !b.shielded && b.x + b.radius > this.x && b.x - b.radius < this.x + this.width && (b.y - b.radius < (VIRTUAL_HEIGHT - this.gap) / 2 || b.y + b.radius > (VIRTUAL_HEIGHT + this.gap) / 2);
}

function MovingPlatform() {
    this.type = 'moving_platform'; this.x = VIRTUAL_WIDTH; this.width = VIRTUAL_WIDTH / 4; this.height = 20;
    this.gap = 220; this.y = VIRTUAL_HEIGHT / 2; this.speed = difficulty.platformSpeed; this.direction = 1; this.passed = false;
    this.draw = function() {
        const grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        grad.addColorStop(0, '#d35400'); grad.addColorStop(1, '#e67e22');
        ctx.fillStyle = grad; ctx.strokeStyle = '#a04000'; ctx.lineWidth = 4;
        ctx.fillRect(this.x, this.y - this.gap/2 - this.height, this.width, this.height); ctx.strokeRect(this.x, this.y - this.gap/2 - this.height, this.width, this.height);
        ctx.fillRect(this.x, this.y + this.gap/2, this.width, this.height); ctx.strokeRect(this.x, this.y + this.gap/2, this.width, this.height);
    };
    this.update = function(dt) { this.x -= difficulty.speed * dt * timeScale; this.y += this.speed * this.direction * dt * timeScale; if (this.y < this.gap / 2 + this.height || this.y > VIRTUAL_HEIGHT - this.gap/2 - this.height) this.direction *= -1; }
    this.collidesWith = (b) => {
        if (b.invincible || b.shielded) return false;
        const birdTouchesHorizontal = b.x + b.radius > this.x && b.x - b.radius < this.x + this.width;
        if (!birdTouchesHorizontal) return false;

        const topPlatformBottom = this.y - this.gap / 2;
        const bottomPlatformTop = this.y + this.gap / 2;

        const hitsTop = b.y - b.radius < topPlatformBottom && b.y + b.radius > topPlatformBottom - this.height;
        const hitsBottom = b.y + b.radius > bottomPlatformTop && b.y - b.radius < bottomPlatformTop + this.height;

        return hitsTop || hitsBottom;
    };
}

function Collectible(x, y, type) {
    this.x = x; this.y = y; this.type = type; this.radius = VIRTUAL_WIDTH / 38;
    this.angle = 0; this.value = type === 'gem' ? 10 : 0; this.pulse = 0; this.pulseSpeed = 3;
    this.draw = function() {
        const pulseRadius = this.radius + Math.sin(this.pulse) * 3;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, pulseRadius);
        let emoji = '';
        if (this.type === 'shield') { grad.addColorStop(0, '#8e44ad'); grad.addColorStop(1, '#9b59b6'); emoji = '🛡️'; } 
        else if (this.type === 'slowmo') { grad.addColorStop(0, '#f1c40f'); grad.addColorStop(1, '#f39c12'); emoji = '🕒'; } 
        else if (this.type === 'shrink') { grad.addColorStop(0, '#2ecc71'); grad.addColorStop(1, '#27ae60'); emoji = '🪶'; } 
        else { grad.addColorStop(0, '#a9fffd'); grad.addColorStop(1, '#00c2ff'); emoji = '💎'; }
        
        // Draw background circle for emoji
        ctx.fillStyle = grad; 
        ctx.beginPath(); 
        ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2); 
        ctx.fill();

        ctx.shadowBlur = 0; // Disable shadow for text
        ctx.font = `${this.radius * 1.2}px sans-serif`; // Make emoji larger
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, 0, 0);
        ctx.restore();
    };
    this.update = function(dt) { this.x -= difficulty.speed * dt * timeScale; this.angle += 2 * dt * timeScale; this.pulse += this.pulseSpeed * dt * timeScale; }
}

function Particle(x, y, color, size, speed) {
    this.x = x; this.y = y; this.color = color; this.size = Math.random() * size + 1; this.life = 1;
    this.vx = (Math.random() - 0.5) * speed; this.vy = (Math.random() - 0.5) * speed;
    this.draw = function() { ctx.fillStyle = this.color; ctx.globalAlpha = this.life; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    this.update = function(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= 2 * dt; }
}

// --- GAME LOGIC ---
function addObstacle() {
    let availableTypes = obstacleTypes.filter(t => t !== lastObstacleType);
    let type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    lastObstacleType = type;
    let obs;
    if (type === 'pipe') obs = new Pipe();
    else if (type === 'spinner') obs = new Spinner();
    else if (type === 'crusher') obs = new Crusher();
    else if (type === 'moving_platform') obs = new MovingPlatform();
    obstacles.push(obs);
    addCollectible(obs);
}

function addCollectible(obs) {
    if (Math.random() < difficulty.collectibleChance) {
        const x = obs.x + (obs.width || obs.radius || 0) + difficulty.obstacleDist / 2;
        const y = VIRTUAL_HEIGHT / 2 + (Math.random() - 0.5) * (VIRTUAL_HEIGHT / 4);
        const rand = Math.random();
        let type;
        if (rand < 0.15) type = 'shield';
        else if (rand < 0.3) type = 'slowmo';
        else if (rand < 0.45) type = 'shrink';
        else type = 'gem';
        collectibles.push(new Collectible(x, y, type));
    }
}

function startGame(diff) {
    lastDifficulty = diff;
    difficulty = { ...difficulties[diff] };
    startScreen.style.display = 'none'; gameOverScreen.style.display = 'none';
    gameStarted = true; gameOver = false; isPaused = false; timeScale = 1;
    score = 0; level = 1; lives = 3;
    bird = new Bird(); obstacles = []; collectibles = []; particles = [];
    addObstacle();
    lastTime = performance.now();
    if(gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);
}

function handleCollision() {
    if (bird.invincible) return;
    lives--;
    if (lives <= 0) {
        endGame();
    } else {
        bird.invincible = true;
        bird.invincibleTime = 2;
    }
}

function endGame() {
    if(gameOver) return;
    cancelAnimationFrame(gameLoop);
    gameOver = true; gameStarted = false;
    saveHighScore(); loadHighScore();
    gameOverScreen.style.display = 'flex';
    scoreEl.textContent = score;
    levelEl.textContent = level;
}

function togglePause() {
    if (!gameStarted || gameOver) return;
    isPaused = !isPaused;
    if (!isPaused) {
        lastTime = performance.now();
        gameLoop = requestAnimationFrame(update);
    } else {
        cancelAnimationFrame(gameLoop);
        drawPauseScreen();
    }
}

function update(currentTime) {
    if(gameOver || isPaused) return;
    let dt = (currentTime - lastTime) / 1000; // Delta time in seconds
    lastTime = currentTime;
    if (dt > 0.1) dt = 0.1; // Prevent huge jumps on tab switch

    // Clear and scale canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / VIRTUAL_WIDTH, canvas.height / VIRTUAL_HEIGHT);

    const scaledDt = dt * timeScale;

    drawBackground();

    obstacles.forEach(obs => { obs.update(scaledDt); obs.draw(); });
    collectibles.forEach(c => { c.update(scaledDt); c.draw(); });
    particles.forEach(p => { p.update(dt); p.draw(); });
    drawGround();
    bird.update(scaledDt); bird.draw();
    drawUi(); // Draw UI after bird to ensure it's on top

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.collidesWith(bird)) handleCollision();
        if (obs.x + (obs.width || obs.radius || 0) < bird.x && !obs.passed) {
            obs.passed = true; score++;
            if (score > 0 && score % 5 === 0) { level++; difficulty.speed += 10; }
        }
        if (obs.x + (obs.width || obs.radius || 0) < -50) obstacles.splice(i, 1);
    }

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < VIRTUAL_WIDTH - difficulty.obstacleDist) {
        addObstacle();
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        if (Math.hypot(bird.x - c.x, bird.y - c.y) < bird.radius + c.radius) {
            if (c.type === 'shield') { bird.shielded = true; bird.shieldTime = 5; }
            else if (c.type === 'slowmo') { timeScale = 0.5; setTimeout(() => timeScale = 1, 3000); }
            else if (c.type === 'shrink') { bird.isShrunk = true; bird.radius = bird.baseRadius / 2; bird.shrinkTime = 5; }
            else { score += c.value; }
            for (let j = 0; j < 15; j++) particles.push(new Particle(c.x, c.y, '#fff', 3, 100));
            collectibles.splice(i, 1);
        }
        if (c.x + c.radius < 0) collectibles.splice(i, 1);
    }
    
    particles = particles.filter(p => p.life > 0);

    ctx.restore(); // Restore canvas scaling

    gameLoop = requestAnimationFrame(update);
}

// --- HELPERS & UI ---
function drawBackground() {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    bgGrad.addColorStop(0, '#1c2a3e'); bgGrad.addColorStop(1, '#3a506b');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for(let i=0; i<100; i++) {
        const x = (Math.sin(i * 1234) * VIRTUAL_WIDTH * 1.5 + performance.now() * 0.01 * (i%5+1)) % VIRTUAL_WIDTH;
        const y = (Math.cos(i * 5678) * VIRTUAL_HEIGHT * 1.5 + performance.now() * 0.01 * (i%5+1)) % VIRTUAL_HEIGHT;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
}

function drawGround() {
    const groundHeight = VIRTUAL_HEIGHT * 0.1;
    const grad = ctx.createLinearGradient(0, VIRTUAL_HEIGHT - groundHeight, 0, VIRTUAL_HEIGHT);
    grad.addColorStop(0, '#2c3e50'); grad.addColorStop(1, '#1a2531');
    ctx.fillStyle = grad;
    ctx.fillRect(0, VIRTUAL_HEIGHT - groundHeight, VIRTUAL_WIDTH, groundHeight);
}

function drawUi() {
    ctx.font = "50px 'Bangers', cursive";
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;

    // Lives (left)
    ctx.textAlign = "left";
    ctx.fillText(`❤️ ${lives}`, 20, 20);

    // Score (center)
    ctx.textAlign = "center";
    ctx.fillText(`💰 ${score}`, VIRTUAL_WIDTH / 2, 20);

    // Level (right)
    ctx.textAlign = "right";
    ctx.fillText(`📈 ${level}`, VIRTUAL_WIDTH - 20, 20);

    ctx.shadowColor = 'transparent';
}

function drawPauseScreen() {
    ctx.save();
    ctx.scale(canvas.width / VIRTUAL_WIDTH, canvas.height / VIRTUAL_HEIGHT);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    ctx.font = "100px 'Bangers', cursive";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Paused", VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);
    ctx.restore();
}

function loadHighScore() {
    highScore = localStorage.getItem('jumpyMcFlapFaceHighScore') || 0;
    highScoreStartEl.textContent = highScore; highScoreEndEl.textContent = highScore;
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('jumpyMcFlapFaceHighScore', highScore);
    }
}

function showStartScreen() {
    startScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
}

function masterController(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    // Scale coordinates to virtual resolution
    const virtualX = x * (VIRTUAL_WIDTH / rect.width);
    const virtualY = y * (VIRTUAL_HEIGHT / rect.height);

    if (gameStarted && !isPaused) {
        // Pause Zone (Lives area)
        if (virtualX >= 0 && virtualX <= 150 && virtualY >= 0 && virtualY <= 80) {
            togglePause();
            return;
        }
        // Restart Zone (Level area)
        if (virtualX >= VIRTUAL_WIDTH - 150 && virtualX <= VIRTUAL_WIDTH && virtualY >= 0 && virtualY <= 80) {
            isPaused = true;
            cancelAnimationFrame(gameLoop);
            restartModal.style.display = 'flex';
            return;
        }
    }

    if (isPaused) {
        togglePause();
        return;
    }

    if (gameOver) {
        showStartScreen();
        return;
    }

    if (gameStarted) {
        bird.flap();
    } else {
        startGame(lastDifficulty);
    }
}

// --- INITIAL SETUP ---
function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.95;
    canvas.width = size;
    canvas.height = size;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
loadHighScore();

easyBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame('easy'); });
mediumBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame('medium'); });
hardBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame('hard'); });
restartBtn.addEventListener('click', (e) => { e.stopPropagation(); showStartScreen(); });

helpBtnStart.addEventListener('click', () => { helpModal.style.display = 'flex'; });
helpBtnOver.addEventListener('click', () => { helpModal.style.display = 'flex'; });
closeHelpBtn.addEventListener('click', () => { helpModal.style.display = 'none'; });

confirmRestartBtn.addEventListener('click', () => {
    restartModal.style.display = 'none';
    showStartScreen();
});
cancelRestartBtn.addEventListener('click', () => {
    restartModal.style.display = 'none';
    isPaused = false;
    lastTime = performance.now();
    gameLoop = requestAnimationFrame(update);
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
        if (gameOver) {
            showStartScreen();
        } else if (!gameStarted) {
            startGame(lastDifficulty);
        } else {
            bird.flap();
        }
    }
});

canvas.addEventListener('click', masterController);
canvas.addEventListener('touchstart', masterController, { passive: false });