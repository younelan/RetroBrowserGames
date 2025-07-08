const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameUi = document.getElementById('game-ui');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const gameScoreEl = document.getElementById('game-score');
const gameLevelEl = document.getElementById('game-level');
const highScoreStartEl = document.getElementById('high-score-start');
const highScoreEndEl = document.getElementById('high-score-end');

// Buttons
const easyBtn = document.getElementById('easy');
const mediumBtn = document.getElementById('medium');
const hardBtn = document.getElementById('hard');
const restartBtn = document.getElementById('restart');

// Game State
let bird, pipes, collectibles, score, level, difficulty, gameLoop, highScore;
let gameStarted = false;
let gameOver = false;
let frameCount = 0;
let lastDifficulty = 'easy';

const difficulties = {
    easy: { pipeSpeed: 2, pipeGap: 320, gravity: 0.2, flapStrength: 6, collectibleChance: 0.7, pipeDistance: 380 },
    medium: { pipeSpeed: 3, pipeGap: 280, gravity: 0.25, flapStrength: 6.5, collectibleChance: 0.5, pipeDistance: 320 },
    hard: { pipeSpeed: 4, pipeGap: 240, gravity: 0.3, flapStrength: 7, collectibleChance: 0.3, pipeDistance: 280 }
};

function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.95;
    canvas.width = size;
    canvas.height = size;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function Bird() {
    this.x = canvas.width / 4;
    this.y = canvas.height / 2;
    this.radius = canvas.width / 30;
    this.velocity = 0;
    this.gravity = difficulty.gravity;
    this.flapStrength = difficulty.flapStrength;
    this.angle = 0;

    this.draw = function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        this.angle = Math.atan2(this.velocity, 10);
        ctx.rotate(this.angle);

        // Body with 3D effect
        const gradient = ctx.createRadialGradient(0, 0, this.radius / 2, 0, 0, this.radius);
        gradient.addColorStop(0, '#ffffb3');
        gradient.addColorStop(1, '#ffc400');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c69f00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(this.radius / 2.5, -this.radius / 2.5, this.radius / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.radius / 2.5 + 2, -this.radius / 2.5, this.radius / 7, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Wing
        ctx.beginPath();
        ctx.moveTo(-this.radius / 2, 0);
        ctx.arc(-this.radius / 2, 0, this.radius / 1.2, 0.2 - Math.sin(frameCount * 0.4) * 0.2, Math.PI - 0.2 + Math.sin(frameCount * 0.4) * 0.2, false);
        ctx.fillStyle = '#ffde00';
        ctx.fill();

        ctx.restore();
    }

    this.update = function() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y > canvas.height - this.radius - (canvas.height * 0.1)) {
            endGame();
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.velocity = 0;
        }
    }

    this.flap = function() {
        this.velocity = -this.flapStrength;
    }
}

function Pipe() {
    this.x = canvas.width;
    this.width = canvas.width / 6;
    this.topHeight = Math.random() * (canvas.height - difficulty.pipeGap - (canvas.height * 0.3)) + (canvas.height * 0.15);
    this.bottomHeight = canvas.height - this.topHeight - difficulty.pipeGap;
    this.passed = false;

    this.draw = function() {
        const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradient.addColorStop(0, '#28a745');
        gradient.addColorStop(0.5, '#34c759');
        gradient.addColorStop(1, '#28a745');
        ctx.fillStyle = gradient;

        // Top pipe
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.fillRect(this.x - 10, this.topHeight - 30, this.width + 20, 30);
        
        // Bottom pipe
        ctx.fillRect(this.x, canvas.height - this.bottomHeight, this.width, this.bottomHeight);
        ctx.fillRect(this.x - 10, canvas.height - this.bottomHeight, this.width + 20, 30);

        ctx.strokeStyle = '#1e7e34';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, 0, this.width, this.topHeight);
        ctx.strokeRect(this.x, canvas.height - this.bottomHeight, this.width, this.bottomHeight);
    }

    this.update = function() {
        this.x -= difficulty.pipeSpeed;
    }
}

function Collectible(pipe) {
    this.radius = canvas.width / 35;
    this.x = pipe.x + pipe.width / 2;
    this.y = pipe.topHeight + difficulty.pipeGap / 2;
    this.angle = 0;

    this.draw = function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        this.angle += 0.05;
        ctx.rotate(this.angle);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(i * 2 * Math.PI / 5) * this.radius, Math.sin(i * 2 * Math.PI / 5) * this.radius);
            ctx.lineTo(Math.cos((i + 0.5) * 2 * Math.PI / 5) * this.radius / 2, Math.sin((i + 0.5) * 2 * Math.PI / 5) * this.radius / 2);
        }
        ctx.closePath();
        const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ffc107');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#c69f00';
        ctx.stroke();
        ctx.restore();
    }

    this.update = function() {
        this.x -= difficulty.pipeSpeed;
    }
}

function drawBackground() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax Mountains
    drawMountains('#a0d8e0', 0.2, 0.6, 150);
    drawMountains('#8ac9d3', 0.4, 0.7, 100);
}

function drawMountains(color, speed, height, variation) {
    ctx.fillStyle = color;
    const mountainOffset = (frameCount * speed) % canvas.width;
    ctx.beginPath();
    ctx.moveTo(-mountainOffset, canvas.height);
    for (let i = 0; i < canvas.width * 2; i += 150) {
        ctx.lineTo(i - mountainOffset, canvas.height * height + Math.sin(i * 0.1) * variation);
    }
    ctx.lineTo(canvas.width - mountainOffset + canvas.width, canvas.height);
    ctx.fill();
}

function drawGround() {
    const groundHeight = canvas.height * 0.1;
    const groundGradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(1, '#654321');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    ctx.fillStyle = '#A0522D';
    const groundOffset = (frameCount * difficulty.pipeSpeed) % 40;
    for (let i = -groundOffset; i < canvas.width; i += 40) {
        ctx.fillRect(i, canvas.height - groundHeight, 20, 10);
    }
}

function loadHighScore() {
    highScore = localStorage.getItem('flappyHighScore') || 0;
    highScoreStartEl.textContent = highScore;
    highScoreEndEl.textContent = highScore;
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }
}

function startGame(diff) {
    lastDifficulty = diff;
    difficulty = { ...difficulties[diff] };
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameUi.style.display = 'flex';
    gameStarted = true;
    gameOver = false;
    score = 0;
    level = 1;
    frameCount = 0;
    bird = new Bird();
    pipes = [new Pipe()];
    collectibles = [];
    if (Math.random() < difficulty.collectibleChance) {
        collectibles.push(new Collectible(pipes[0]));
    }
    updateUi();
    gameLoop = setInterval(update, 1000 / 60);
}

function endGame() {
    if(gameOver) return;
    clearInterval(gameLoop);
    gameOver = true;
    gameStarted = false;
    saveHighScore();
    loadHighScore();
    gameOverScreen.style.display = 'flex';
    gameUi.style.display = 'none';
    scoreEl.textContent = score;
    levelEl.textContent = level;
}

function updateUi() {
    gameScoreEl.textContent = score;
    gameLevelEl.textContent = level;
}

function update() {
    frameCount++;
    drawBackground();

    // Pipes
    if (frameCount % Math.round(difficulty.pipeDistance / difficulty.pipeSpeed) === 0) {
        const newPipe = new Pipe();
        pipes.push(newPipe);
        if (Math.random() < difficulty.collectibleChance) {
            collectibles.push(new Collectible(newPipe));
        }
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();
        pipes[i].draw();

        if (pipes[i].x + pipes[i].width < bird.x && !pipes[i].passed) {
            pipes[i].passed = true;
            score++;
            if (score > 0 && score % 10 === 0) {
                level++;
                difficulty.pipeSpeed += 0.05;
                difficulty.pipeGap = Math.max(200, difficulty.pipeGap - 5);
            }
            updateUi();
        }

        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
        }

        if (
            bird.x + bird.radius > pipes[i].x &&
            bird.x - bird.radius < pipes[i].x + pipes[i].width &&
            (bird.y - bird.radius < pipes[i].topHeight || bird.y + bird.radius > canvas.height - pipes[i].bottomHeight)
        ) {
            endGame();
        }
    }

    // Collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].update();
        collectibles[i].draw();

        const dist = Math.hypot(bird.x - collectibles[i].x, bird.y - collectibles[i].y);
        if (dist < bird.radius + collectibles[i].radius) {
            collectibles.splice(i, 1);
            score += 5;
            updateUi();
        }

        if (collectibles[i] && collectibles[i].x + collectibles[i].radius < 0) {
            collectibles.splice(i, 1);
        }
    }
    
    drawGround();
    bird.update();
    bird.draw();
}

function handleUserAction(e) {
    if (e.code === 'Space' || e.type === 'touchstart') {
        e.preventDefault();
        if (!gameStarted && !gameOver) {
            startGame(lastDifficulty);
        } else if (gameStarted && !gameOver) {
            bird.flap();
        }
    }
    if (e.code === 'Enter' && gameOver) {
        restartBtn.click();
    }
}

// Initial Setup
loadHighScore();
easyBtn.addEventListener('click', () => startGame('easy'));
mediumBtn.addEventListener('click', () => startGame('medium'));
hardBtn.addEventListener('click', () => startGame('hard'));
restartBtn.addEventListener('click', () => {
    startScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
});

document.addEventListener('keydown', handleUserAction);
document.addEventListener('touchstart', handleUserAction, { passive: false });
