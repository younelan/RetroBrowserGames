// game.js

class Terrain {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Create a rich, multi-layered pattern for the earth
        this.patternCanvas = document.createElement('canvas');
        this.patternCanvas.width = 32;
        this.patternCanvas.height = 32;
        const pctx = this.patternCanvas.getContext('2d');

        // Base dark dirt
        pctx.fillStyle = '#4a2b10';
        pctx.fillRect(0, 0, 32, 32);

        // Mid-tone clumps
        pctx.fillStyle = '#5d3a1a';
        for (let i = 0; i < 8; i++) {
            pctx.fillRect(Math.random() * 32, Math.random() * 32, 8, 8);
        }

        // Highlights and texture noise
        for (let i = 0; i < 128; i++) {
            const rand = Math.random();
            if (rand > 0.8) pctx.fillStyle = '#8d5a2b'; // Light stone/dirt
            else if (rand > 0.6) pctx.fillStyle = '#311a05'; // Dark crevice
            else pctx.fillStyle = '#6e4420'; // Mid brown

            const x = Math.random() * 32;
            const y = Math.random() * 32;
            const size = Math.random() * 2 + 1;
            pctx.fillRect(x, y, size, size);
        }

        // Add subtle shading to the pattern to make it tile less obviously
        const grad = pctx.createLinearGradient(0, 0, 32, 32);
        grad.addColorStop(0, 'rgba(0,0,0,0.1)');
        grad.addColorStop(1, 'rgba(255,255,255,0.05)');
        pctx.fillStyle = grad;
        pctx.fillRect(0, 0, 32, 32);

        this.earthPattern = this.ctx.createPattern(this.patternCanvas, 'repeat');
        this.ctx.clearRect(0, 0, width, height);
    }

    drawLevel(levelData) {
        if (levelData.properties && levelData.properties.terrain) {
            levelData.properties.terrain.forEach(rect => {
                if (rect.type === 'earth') {
                    this.ctx.fillStyle = this.earthPattern;
                    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

                    // Add grass top - Organic and subtle
                    this.ctx.save();
                    this.ctx.fillStyle = '#1e5a1e'; // Dark soil/moss base
                    this.ctx.fillRect(rect.x, rect.y, rect.width, 3);

                    this.ctx.fillStyle = '#3eb03e'; // Muted green
                    for (let x = rect.x; x < rect.x + rect.width; x += 3) {
                        const h = 2 + Math.sin(x * 0.5) * 2; // Wavy transition
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, rect.y + 3);
                        this.ctx.lineTo(x + 1, rect.y - h);
                        this.ctx.lineTo(x + 2, rect.y + 3);
                        this.ctx.fill();
                    }
                    this.ctx.restore();
                } else if (rect.type === 'platform' || rect.type === 'floor') {
                    // ... [Platform logic remains same but improved rivet spacing]
                    const grad = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
                    grad.addColorStop(0, '#777'); grad.addColorStop(0.5, '#444'); grad.addColorStop(1, '#222');
                    this.ctx.fillStyle = grad;
                    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                } else {
                    this.ctx.fillStyle = '#884400';
                    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                }

                // Add highlight to edges
                if (rect.type === 'platform' || rect.type === 'floor') {
                    this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    this.ctx.fillRect(rect.x, rect.y, rect.width, 1);
                    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    this.ctx.fillRect(rect.x, rect.y + rect.height - 1, rect.width, 1);
                }
            });
        }
    }

    isSolid(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const pixel = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        return pixel[3] > 128;
    }

    removeCircle(x, y, radius) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
    }

    addRect(x, y, w, h, color = '#886644') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    draw(mainCtx) {
        mainCtx.drawImage(this.canvas, 0, 0);
    }
}

class Tikming {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.vx = 0.8;
        this.vy = 0;
        this.state = 'faller';
        this.direction = 1;
        this.skill = 'walker';
        this.alive = true;
        this.exited = false;
        this.fallDistance = 0;
        this.constructionTimer = 0;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.deathTimer = 0; // Timer for death animations
        this.selectionFlash = 0; // Timer for selection feedback
        this.isExploding = false;
        this.explosionTimer = 0;
    }

    update() {
        if (!this.alive || this.exited) return;

        const terrain = this.game.terrain;

        // Blocker state is static, but they can still fall if terrain is removed
        if (this.state === 'blocker' && !terrain.isSolid(this.x, this.y)) {
            this.state = 'faller';
        }

        switch (this.state) {
            case 'faller': this.handleFalling(terrain); break;
            case 'walker': this.handleWalking(terrain); break;
            case 'floater': this.handleFloating(terrain); break;
            case 'digger': this.handleDigging(terrain); break;
            case 'basher': this.handleBashing(terrain); break;
            case 'miner': this.handleMining(terrain); break;
            case 'builder': this.handleBuilding(terrain); break;
            case 'blocker': break;
            case 'splatting': this.handleSplatting(terrain); break;
            case 'dying': this.handleDying(terrain); break;
        }

        this.checkExit();
        this.checkHazards();

        // Screen Boundaries - Only flip if we aren't already turning
        if (this.x < 12 && this.direction < 0) this.direction = 1;
        if (this.x > this.game.playAreaWidth - 12 && this.direction > 0) this.direction = -1;
    }

    handleFalling(terrain) {
        this.vy += 0.2;

        // Transition to floater if skill is assigned
        if (this.skill === 'floater' && this.fallDistance > 30) {
            this.state = 'floater';
            return;
        }

        this.y += this.vy;
        this.fallDistance += this.vy;

        if (terrain.isSolid(this.x, this.y)) {
            if (this.fallDistance > 180 && this.skill !== 'floater') {
                this.state = 'splatting';
                this.animationTimer = 0;
            } else {
                this.y = Math.floor(this.y);
                let limit = 15; // Popping out of ground limit
                while (terrain.isSolid(this.x, this.y - 1) && limit-- > 0) this.y--;
                this.state = (this.skill === 'blocker') ? 'blocker' : 'walker';
                this.vy = 0;
                this.fallDistance = 0;
            }
        }
    }

    handleSplatting(terrain) {
        this.animationTimer++;
        if (this.animationTimer > 60) {
            this.die();
        }
    }

    handleDying(terrain) {
        this.animationTimer++;
        if (this.animationTimer > 40) {
            this.alive = false;
            this.exited = true; // Remove from active tikmings
        }
    }

    handleWalking(terrain) {
        // --- Screen Boundary Check ---
        if (this.x < 12 && this.direction < 0) { this.direction = 1; return; }
        if (this.x > this.game.playAreaWidth - 12 && this.direction > 0) { this.direction = -1; return; }

        let nextX = this.x + (this.vx * this.direction);
        let foundFloor = false;

        // --- Blocker Collision Detection ---
        if (this.game.isBlockerNearby(nextX, this.y, this)) {
            this.direction *= -1;
            return;
        }

        // --- Step Detection ---
        for (let dy = 6; dy >= -6; dy--) {
            if (terrain.isSolid(nextX, this.y + dy) && !terrain.isSolid(nextX, this.y + dy - 1)) {
                if (terrain.isSolid(nextX, this.y + dy - 7)) { // Wall check
                    this.direction *= -1;
                    return;
                }
                this.x = nextX;
                this.y = this.y + dy;
                foundFloor = true;
                break;
            }
        }

        if (!foundFloor) {
            this.x = nextX;
            this.state = 'faller';
            this.vy = 0;
            this.fallDistance = 0;
        }
    }

    handleDigging(terrain) {
        this.animationTimer++;
        if (this.animationTimer > 15) {
            this.animationTimer = 0;
            terrain.removeCircle(this.x, this.y + 8, 12);
            this.y += 4;

            // Check if there's solid ground deeper below to continue digging
            let hasGroundBelow = false;
            for (let i = 1; i <= 12; i++) {
                if (terrain.isSolid(this.x, this.y + i)) {
                    hasGroundBelow = true;
                    break;
                }
            }

            if (!hasGroundBelow) {
                this.state = 'faller';
                this.skill = 'walker';
            }
        }
    }

    handleBashing(terrain) {
        this.animationTimer++;
        if (this.animationTimer > 8) {
            this.animationTimer = 0;
            // Shift circle up higher (y - 14) with radius 12 so bottom is 2px above feet
            terrain.removeCircle(this.x + (10 * this.direction), this.y - 14, 12);
            this.x += this.direction * 1.5;
            // Check higher up (y - 10) to see if we've cleared the wall
            if (!terrain.isSolid(this.x + (14 * this.direction), this.y - 10)) {
                this.state = 'walker';
                this.skill = 'walker';
            }
        }
    }

    handleMining(terrain) {
        this.animationTimer++;
        if (this.animationTimer > 12) {
            this.animationTimer = 0;
            // Radius 12 to match Digger width, positioned slightly ahead and below
            terrain.removeCircle(this.x + (8 * this.direction), this.y + 4, 12);
            this.x += this.direction * 3;
            this.y += 2.5;

            if (!terrain.isSolid(this.x, this.y + 1)) {
                this.state = 'faller';
                this.skill = 'walker';
            }
        }
    }

    handleBuilding(terrain) {
        this.animationTimer++;
        if (this.animationTimer > 40) {
            this.animationTimer = 0;
            terrain.addRect(this.x + (2 * this.direction), this.y - 1, 10 * this.direction, 3, '#8b5a2b');
            this.x += 6 * this.direction;
            this.y -= 2;
            this.constructionTimer++;
            if (this.constructionTimer >= 12) {
                this.state = 'walker';
                this.skill = 'walker';
                this.constructionTimer = 0;
            }
        }
    }

    handleFloating(terrain) {
        this.vy = 1.2;
        this.y += this.vy;
        if (terrain.isSolid(this.x, this.y)) {
            this.y = Math.floor(this.y);
            this.state = 'walker';
            this.skill = 'walker';
            this.vy = 0;
            this.fallDistance = 0;
        }
    }

    die() {
        if (this.state === 'splatting') {
            this.state = 'dying';
            this.animationTimer = 0;
        } else {
            this.alive = false;
        }
    }

    checkHazards() {
        const terrain = this.game.terrain;
        // Check a small area around the Tikming for hazards
        const rects = this.game.level.properties.terrain;
        for (const rect of rects) {
            if (rect.type === 'water' || rect.type === 'pit' || rect.type === 'pit_empty') {
                if (this.x > rect.x && this.x < rect.x + rect.width &&
                    this.y > rect.y && this.y < rect.y + rect.height) {
                    this.die();
                    return;
                }
            }
        }
    }

    checkExit() {
        const dist = Math.sqrt(Math.pow(this.x - this.game.level.properties.exitX, 2) + Math.pow(this.y - this.game.level.properties.exitY, 2));
        if (dist < 20) {
            this.exited = true;
            this.game.tikmingsSaved++;
            this.game.updateHUD();
        }
    }

    draw(ctx) {
        if (!this.alive || this.exited) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(2.2, 2.2);

        const time = Date.now() / 1000;
        const walkCycle = (this.x * 0.1) % (Math.PI * 2);

        // --- Head Bob & Body Tilt ---
        let bob = 0;
        let tilt = 0;
        if (this.state === 'walker') {
            bob = Math.abs(Math.sin(walkCycle * 2)) * 1.5;
            tilt = Math.sin(walkCycle) * 0.05;
        } else if (this.state !== 'blocker') {
            bob = Math.sin(time * 4) * 0.5;
        }
        ctx.translate(0, -bob);
        ctx.rotate(tilt * this.direction);

        if (this.direction === -1) ctx.scale(-1, 1);

        this.animationTimer++;

        // --- Robe ---
        const robeGrad = ctx.createLinearGradient(-4, -10, 4, -4);
        robeGrad.addColorStop(0, '#902090');
        robeGrad.addColorStop(1, '#400040');
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.moveTo(-3, -11);
        ctx.bezierCurveTo(-5, -7, -5, -4, -4, -3);
        ctx.lineTo(4, -3);
        ctx.bezierCurveTo(5, -4, 5, -7, 3, -11);
        ctx.closePath();
        ctx.fill();

        // --- Hair ---
        const hairGrad = ctx.createRadialGradient(0, -13, 1, 0, -13, 6);
        hairGrad.addColorStop(0, '#4ade4a');
        hairGrad.addColorStop(1, '#1e5a1e');
        ctx.fillStyle = hairGrad;
        ctx.beginPath();
        ctx.arc(0, -13, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-3, -16, 2.5, 0, Math.PI * 2);
        ctx.arc(2, -17, 3, 0, Math.PI * 2);
        ctx.arc(4, -13, 2, 0, Math.PI * 2);
        ctx.fill();

        // --- Face ---
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.roundRect(-1, -12, 4.5, 4.5, 1.5);
        ctx.fill();

        // --- Eyes ---
        ctx.fillStyle = '#000';
        ctx.fillRect(0.8, -11, 1.2, 1.8);
        ctx.fillRect(3, -11, 1.2, 1.8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(1, -10.8, 0.6, 0.6);

        // --- Role Specific Tools & Poses ---
        ctx.fillStyle = '#ffcc99';
        if (this.state === 'walker') {
            const step1 = Math.sin(walkCycle);
            const lift1 = Math.max(0, -Math.cos(walkCycle)) * 2;
            ctx.fillRect(-2 + step1 * 2, -3 - lift1, 2, 3);
            const step2 = Math.sin(walkCycle + Math.PI);
            const lift2 = Math.max(0, -Math.cos(walkCycle + Math.PI)) * 2;
            ctx.fillRect(0 + step2 * 2, -3 - lift2, 2, 3);
        } else if (this.state === 'blocker') {
            ctx.fillStyle = '#902090';
            ctx.fillRect(-7, -9, 4, 3);
            ctx.fillRect(3, -9, 4, 3);
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(-8, -7.5, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, -7.5, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        } else if (this.state === 'floater' || (this.skill === 'floater' && this.state === 'faller')) {
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -11);
            ctx.lineTo(0, -28);
            ctx.stroke();
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(0, -28, 11, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        } else if (this.state === 'digger') {
            ctx.fillStyle = '#777';
            ctx.fillRect(-1.5, -8, 3, 14);
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        } else if (this.state === 'basher') {
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(2, -8, 4, 3);
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        } else if (this.state === 'miner') {
            ctx.fillStyle = '#777';
            ctx.save();
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(2, -12, 2, 10);
            ctx.restore();
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        } else if (this.state === 'builder') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(2, -10, 8, 2);
            ctx.fillStyle = '#ffcc99';
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        } else {
            ctx.fillRect(-2, -3, 2, 3);
            ctx.fillRect(1, -3, 2, 3);
        }

        ctx.restore();

        // Selection brackets
        if (this.selectionFlash > 0) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.selectionFlash / 20})`;
            ctx.lineWidth = 2;
            const s = 14, o = 10;
            ctx.beginPath();
            ctx.moveTo(this.x - s, this.y - s - o); ctx.lineTo(this.x - s + 4, this.y - s - o);
            ctx.moveTo(this.x + s, this.y - s - o); ctx.lineTo(this.x + s - 4, this.y - s - o);
            ctx.moveTo(this.x + s, this.y - s - o); ctx.lineTo(this.x + s, this.y - s - o + 4);
            ctx.stroke();
            ctx.restore();
            this.selectionFlash--;
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color; this.life = life; this.maxLife = life;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += 0.15; this.life--;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.globalAlpha = 1.0;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.playAreaWidth = 640;
        this.playAreaHeight = 640;
        this.uiHeight = 100;
        this.terrain = null;
        this.tikmings = [];
        this.particles = [];
        this.level = null;
        this.levelIndex = 0;
        this.tikmingsToSpawn = 0;
        this.tikmingsSaved = 0;
        this.spawnTimer = 0;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.selectedSkill = 'walker';
        this.skills = {};
        this.lives = 5;
        this.gameState = 'playing'; // playing, result, gameover, gamewon
        this.lastLevelSuccess = false;
        this.startLevel = 0; // Set this to start from a specific level (0-indexed)

        this.mousePos = { x: 0, y: 0 };
        this.hoveredTikming = null;
        this.frameCount = 0;

        this.skillOrder = ['climber', 'floater', 'bomber', 'blocker', 'builder', 'basher', 'miner', 'digger'];
        this.skillIcons = {
            climber: '🧗', floater: '🌂', bomber: '💥', blocker: '🛑',
            builder: '🪜', basher: '👊', miner: '⛏️', digger: '🕳️'
        };

        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouse(e));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouse(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        }, { passive: false });

        this.gameLoop = this.gameLoop.bind(this);

        // Visual enhancement: Background layers
        this.bgStars = this.createStarField(100, 0.5);
        this.bgDust = this.createStarField(50, 1.2);
        this.cameraShake = 0;
        this.trapDoorAngle = 0; // State for trap door animation
        this.showHelp = false; // Help overlay toggle
    }

    createStarField(count, size) {
        const canvas = document.createElement('canvas');
        canvas.width = this.playAreaWidth;
        canvas.height = this.playAreaHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const opacity = Math.random();
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, size * Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
        return canvas;
    }

    applyCameraShake(amount) {
        this.cameraShake = amount;
    }

    start() {
        this.loadLevel(this.startLevel);
        requestAnimationFrame(this.gameLoop);
    }

    loadLevel(index) {
        this.levelIndex = index;
        this.level = levels[index];
        this.terrain = new Terrain(this.playAreaWidth, this.playAreaHeight);
        this.terrain.drawLevel(this.level);
        this.tikmings = [];
        this.particles = [];
        this.tikmingsToSpawn = this.level.tikmingCount;
        this.tikmingsSaved = 0;
        this.spawnTimer = 0;
        this.timeRemaining = this.level.properties.timeLimit;
        this.gameState = 'playing';

        this.skills = {
            climber: this.level.tikmingTypes.climber || 0,
            floater: this.level.tikmingTypes.floater || 0,
            bomber: this.level.tikmingTypes.bomber || 0,
            blocker: this.level.tikmingTypes.blocker || 0,
            builder: this.level.tikmingTypes.builder || 0,
            basher: this.level.tikmingTypes.basher || 0,
            miner: this.level.tikmingTypes.miner || 0,
            digger: this.level.tikmingTypes.digger || 0
        };

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing' && this.timeRemaining > 0) {
                this.timeRemaining--;
            }
        }, 1000);

        this.selectSkill('digger');
    }

    updateHUD() {
        // Stats are now drawn in drawUI
    }

    selectSkill(skill) {
        this.selectedSkill = skill;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleMouse(e) {
        const pos = this.getMousePos(e);
        const uiY = this.playAreaHeight;

        // Toggle Help
        if (pos.y > uiY + 10 && pos.y < uiY + 42 && pos.x > this.playAreaWidth - 85) {
            this.showHelp = !this.showHelp;
            return;
        }

        if (this.showHelp) {
            this.showHelp = false;
            return;
        }

        if (this.gameState === 'result' || this.gameState === 'gameover' || this.gameState === 'gamewon') {
            // Check button click
            if (pos.x > 220 && pos.x < 420 && pos.y > 450 && pos.y < 500) {
                if (this.gameState === 'gameover' || this.gameState === 'gamewon') {
                    this.lives = 5;
                    this.loadLevel(0);
                } else if (this.lastLevelSuccess) {
                    // Manual override if they don't want to wait
                    if (this.levelIndex + 1 < levels.length) {
                        this.loadLevel(this.levelIndex + 1);
                    } else {
                        this.gameState = 'gamewon';
                    }
                } else {
                    this.loadLevel(this.levelIndex);
                }
            }
            return;
        }

        // Handle UI clicks
        if (pos.y > this.playAreaHeight) {
            const slotWidth = this.playAreaWidth / this.skillOrder.length;
            const skillIndex = Math.floor(pos.x / slotWidth);
            if (skillIndex >= 0 && skillIndex < this.skillOrder.length) {
                this.selectSkill(this.skillOrder[skillIndex]);
            }
            return;
        }

        const tikming = this.getTikmingAt(pos.x, pos.y);
        if (tikming && this.skills[this.selectedSkill] > 0) {
            this.applySkill(tikming, this.selectedSkill);
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        this.mousePos.x = pos.x;
        this.mousePos.y = pos.y;
        this.updateHover();
    }

    getTikmingAt(x, y) {
        return this.tikmings.find(t => {
            if (!t.alive || t.exited) return false;
            return Math.abs(t.x - x) < 25 && Math.abs((t.y - 13) - y) < 30;
        });
    }

    updateHover() {
        if (this.gameState === 'playing' && this.mousePos.y <= this.playAreaHeight) {
            this.hoveredTikming = this.getTikmingAt(this.mousePos.x, this.mousePos.y);
        } else {
            this.hoveredTikming = null;
        }
    }

    applySkill(tikming, skill) {
        if (tikming.skill !== 'walker' && skill !== 'bomber' && skill !== 'floater') return;

        if (skill === 'bomber') {
            if (tikming.isExploding) return;
            tikming.isExploding = true;
            tikming.explosionTimer = 5;
            const timerId = setInterval(() => {
                tikming.explosionTimer--;
                if (tikming.explosionTimer <= 0) {
                    clearInterval(timerId);
                    this.explode(tikming);
                }
            }, 1000);
        } else if (skill === 'floater') {
            tikming.skill = 'floater';
            if (tikming.state === 'faller') tikming.state = 'floater';
        } else if (skill === 'blocker') {
            tikming.state = 'blocker'; tikming.skill = 'blocker';
        } else {
            tikming.state = skill; tikming.skill = skill;
        }

        tikming.selectionFlash = 20;
        this.skills[skill]--;
    }

    isBlockerNearby(x, y, ignoreTik) {
        return this.tikmings.some(t =>
            t !== ignoreTik &&
            t.state === 'blocker' &&
            Math.abs(t.x - x) < 12 &&
            Math.abs(t.y - y) < 10
        );
    }

    explode(tikming) {
        if (!tikming.alive) return;
        this.terrain.removeCircle(tikming.x, tikming.y - 5, 25);
        for (let i = 0; i < 40; i++) {
            this.particles.push(new Particle(
                tikming.x, tikming.y - 5, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8,
                Math.random() > 0.5 ? '#ff0' : '#f00', 30 + Math.random() * 30
            ));
        }
        tikming.die();
    }

    createDebris(x, y) {
        if (Math.random() > 0.3) return;
        this.particles.push(new Particle(x, y, (Math.random() - 0.5) * 2, -Math.random() * 2, '#884400', 10 + Math.random() * 10));
    }

    gameLoop() {
        this.frameCount++;
        if (this.frameCount % 2 === 0) {
            this.update();
        }

        this.updateHover();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    checkLevelEnd() {
        if (this.gameState !== 'playing') return;

        // Level ends when no tikmings are capable of moving
        const activeTikmings = this.tikmings.filter(t => t.alive && !t.exited && t.state !== 'blocker');

        if (this.tikmingsToSpawn === 0 && activeTikmings.length === 0) {
            const savedCount = this.tikmingsSaved;
            this.lastLevelSuccess = savedCount >= this.level.requiredToSave;

            if (!this.lastLevelSuccess) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameover';
                } else {
                    this.gameState = 'result';
                }
            } else {
                this.gameState = 'result';
                if (this.levelIndex + 1 >= levels.length) {
                    this.gameState = 'gamewon';
                } else {
                    setTimeout(() => {
                        if (this.gameState === 'result') {
                            this.loadLevel(this.levelIndex + 1);
                        }
                    }, 4000);
                }
            }
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        if (this.tikmingsToSpawn > 0) {
            this.spawnTimer++;
            if (this.spawnTimer > 100) {
                this.spawnTimer = 0;
                this.tikmings.push(new Tikming(this.level.properties.startX, this.level.properties.startY, this));
                this.tikmingsToSpawn--;
            }
        }

        this.tikmings.forEach(t => {
            t.update();
            if (['digger', 'basher', 'miner'].includes(t.state)) this.createDebris(t.x, t.y);
        });

        // Trap Door Animation Logic - Opens DOWNWARDS
        const targetAngle = (this.tikmingsToSpawn > 0 || (this.spawnTimer < 50 && this.tikmingsToSpawn === 0)) ? Math.PI * 0.6 : 0;
        this.trapDoorAngle += (targetAngle - this.trapDoorAngle) * 0.15;

        this.particles.forEach((p, i) => {
            p.update();
            if (p.life <= 0) this.particles.splice(i, 1);
        });

        if (this.timeRemaining <= 0) {
            this.tikmings.filter(t => t.alive).forEach(t => t.die());
        }

        this.checkLevelEnd();
    }

    drawResultScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(50, 100, 540, 440);
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 100, 540, 440);

        ctx.textAlign = 'center';
        ctx.fillStyle = this.lastLevelSuccess ? '#39ff14' : '#ff3131';
        ctx.font = 'bold 36px "Courier New"';
        ctx.fillText(this.lastLevelSuccess ? "LEVEL COMPLETE! 🎉" : "LEVEL FAILED! 💀", 320, 180);

        ctx.fillStyle = '#fff';
        ctx.font = '24px "Courier New"';
        ctx.fillText(`SAVED: 🏠 ${this.tikmingsSaved}`, 320, 250);
        ctx.fillText(`REQUIRED: ${this.level.requiredToSave}`, 320, 290);

        if (!this.lastLevelSuccess) {
            ctx.fillStyle = '#ffcf00';
            ctx.fillText(`LIVES REMAINING: ${this.lives}`, 320, 350);

            // Button
            ctx.fillStyle = '#331a00';
            ctx.fillRect(220, 450, 200, 50);
            ctx.strokeStyle = '#8b5a2b';
            ctx.lineWidth = 2;
            ctx.strokeRect(220, 450, 200, 50);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px "Courier New"';
            ctx.fillText("RETRY", 320, 482);
        } else {
            ctx.fillStyle = '#aaa';
            ctx.font = 'italic 18px "Courier New"';
            ctx.fillText("Moving to next level shortly...", 320, 400);
        }
    }

    drawGameWonScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, this.playAreaWidth, this.playAreaHeight);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 64px "Courier New"';
        ctx.fillText("VICTORY! 👑", 320, 300);

        ctx.fillStyle = '#fff';
        ctx.font = '24px "Courier New"';
        ctx.fillText("YOU SAVED THE TIKMINGS!", 320, 360);

        // Button
        ctx.fillStyle = '#331a00';
        ctx.fillRect(220, 450, 200, 50);
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        ctx.strokeRect(220, 450, 200, 50);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText("RESTART", 320, 482);
    }

    drawGameOverScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, this.playAreaWidth, this.playAreaHeight);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff3131';
        ctx.font = 'bold 64px "Courier New"';
        ctx.fillText("GAME OVER", 320, 300);

        ctx.fillStyle = '#fff';
        ctx.font = '24px "Courier New"';
        ctx.fillText("ALL LIVES LOST", 320, 360);

        // Button
        ctx.fillStyle = '#331a00';
        ctx.fillRect(220, 450, 200, 50);
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        ctx.strokeRect(220, 450, 200, 50);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText("RESTART", 320, 482);
    }

    drawUI() {
        const ctx = this.ctx;
        const uiY = this.playAreaHeight;

        // --- Glassmorphic HUD ---
        ctx.save();
        ctx.fillStyle = 'rgba(15, 20, 30, 0.85)';
        ctx.fillRect(0, uiY, this.playAreaWidth, this.uiHeight);

        // Stats Bar - Restored Icons
        const statsX = 15, statsY = uiY + 10, statsW = this.playAreaWidth - 30, statsH = 32;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath(); ctx.roundRect(statsX, statsY, statsW, statsH, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'left';

        const savedPercent = Math.floor((this.tikmingsSaved / this.level.tikmingCount) * 100);
        const reqPercent = Math.floor((this.level.requiredToSave / this.level.tikmingCount) * 100);
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        ctx.fillText(`🚩 LVL:${this.level.levelNumber}    🏠 SAVED:${savedPercent}% (${reqPercent}%)    ⏱️ TIME:${timeStr}    ❤️ LIVES:${this.lives}`, statsX + 15, statsY + 21);

        // Help Button
        const helpX = this.playAreaWidth - 85, helpY = statsY + 6, helpW = 70, helpH = 20;
        ctx.fillStyle = this.showHelp ? '#39ff14' : 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath(); ctx.roundRect(helpX, helpY, helpW, helpH, 4); ctx.fill();
        ctx.fillStyle = this.showHelp ? '#000' : '#fff';
        ctx.font = 'bold 10px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText("HELP (?)", helpX + helpW / 2, helpY + 14);

        // Skill Slots
        const slotWidth = this.playAreaWidth / this.skillOrder.length;
        this.skillOrder.forEach((skill, i) => {
            const x = i * slotWidth;
            const y = uiY + 48;
            const isActive = this.selectedSkill === skill;
            const cardW = slotWidth - 8, cardH = 48;

            if (isActive) {
                const grad = ctx.createLinearGradient(x + 4, y, x + 4, y + cardH);
                grad.addColorStop(0, 'rgba(57, 255, 20, 0.3)');
                grad.addColorStop(1, 'rgba(57, 255, 20, 0.05)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.roundRect(x + 4, y, cardW, cardH, 6); ctx.fill();
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                ctx.beginPath(); ctx.roundRect(x + 4, y, cardW, cardH, 6); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.stroke();
            }

            // Icon (Custom Drawn)
            this.drawSkillIcon(ctx, skill, x + slotWidth / 2, y + 25, isActive);

            // Name (Restored)
            ctx.fillStyle = isActive ? '#fff' : '#aaa';
            ctx.font = 'bold 8px "Courier New"';
            ctx.fillText(skill.toUpperCase(), x + slotWidth / 2, y + 10);

            // Count - DOUBLED SIZE, WHITE WITH SHADOW
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;
            ctx.font = 'bold 22px "Courier New"';
            ctx.fillText(this.skills[skill], x + slotWidth / 2, y + 42);
            ctx.restore();
        });
        ctx.restore();
    }

    draw() {
        // Clear background with cosmic gradient
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.playAreaHeight);
        bgGrad.addColorStop(0, '#05070a');
        bgGrad.addColorStop(1, '#0c121d');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Handle Camera Shake
        if (this.cameraShake > 0) {
            const sx = (Math.random() - 0.5) * this.cameraShake;
            const sy = (Math.random() - 0.5) * this.cameraShake;
            this.ctx.translate(sx, sy);
            this.cameraShake *= 0.9;
            if (this.cameraShake < 0.1) this.cameraShake = 0;
        }

        // Parallax Background
        const time = Date.now() / 1000;
        this.ctx.globalAlpha = 0.5;
        this.ctx.drawImage(this.bgStars, (Math.sin(time * 0.05) * 10), (Math.cos(time * 0.05) * 10));
        this.ctx.globalAlpha = 0.3;
        this.ctx.drawImage(this.bgDust, (Math.sin(time * 0.1) * 20), (Math.cos(time * 0.1) * 20));
        this.ctx.globalAlpha = 1.0;

        // Subtile grid lines with glow
        this.ctx.strokeStyle = 'rgba(57, 255, 20, 0.03)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.playAreaWidth; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.playAreaHeight);
            this.ctx.stroke();
        }

        this.ctx.restore();

        this.terrain.draw(this.ctx);

        // All game elements that should be affected by camera shake and global transforms
        this.drawHazards();
        this.drawEntranceAndExit();
        this.tikmings.forEach(t => t.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));

        // Global Ambient Lighting / Vignette
        const vignette = this.ctx.createRadialGradient(
            this.playAreaWidth / 2, this.playAreaHeight / 2, this.playAreaWidth / 4,
            this.playAreaWidth / 2, this.playAreaHeight / 2, this.playAreaWidth
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.playAreaWidth, this.playAreaHeight);

        this.ctx.restore();

        // Draw crosshair if hover in play area - Refined with Corner Brackets
        if (this.hoveredTikming) {
            const l = this.hoveredTikming;
            const size = 15;
            const offset = 10;
            this.ctx.save();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'rgba(255,255,255,0.5)';

            // Draw four corners
            // Top Left
            this.ctx.beginPath(); this.ctx.moveTo(l.x - size, l.y - size - offset); this.ctx.lineTo(l.x - size / 2, l.y - size - offset);
            this.ctx.moveTo(l.x - size, l.y - size - offset); this.ctx.lineTo(l.x - size, l.y - size / 2 - offset); this.ctx.stroke();
            // Top Right
            this.ctx.beginPath(); this.ctx.moveTo(l.x + size, l.y - size - offset); this.ctx.lineTo(l.x + size / 2, l.y - size - offset);
            this.ctx.moveTo(l.x + size, l.y - size - offset); this.ctx.lineTo(l.x + size, l.y - size / 2 - offset); this.ctx.stroke();
            // Bottom Left
            this.ctx.beginPath(); this.ctx.moveTo(l.x - size, l.y + size - offset); this.ctx.lineTo(l.x - size / 2, l.y + size - offset);
            this.ctx.moveTo(l.x - size, l.y + size - offset); this.ctx.lineTo(l.x - size, l.y + size / 2 - offset); this.ctx.stroke();
            // Bottom Right
            this.ctx.beginPath(); this.ctx.moveTo(l.x + size, l.y + size - offset); this.ctx.lineTo(l.x + size / 2, l.y + size - offset);
            this.ctx.moveTo(l.x + size, l.y + size - offset); this.ctx.lineTo(l.x + size, l.y + size / 2 - offset); this.ctx.stroke();

            this.ctx.restore();
        }

        if (this.gameState === 'result') {
            this.drawResultScreen();
        } else if (this.gameState === 'gameover') {
            this.drawGameOverScreen();
        } else if (this.gameState === 'gamewon') {
            this.drawGameWonScreen();
        }

        this.drawUI();

        if (this.showHelp) {
            this.drawHelpOverlay();
        }
    }

    drawHelpOverlay() {
        const ctx = this.ctx;
        const w = this.playAreaWidth - 40;
        const h = this.playAreaHeight - 40;
        const x = 20;
        const y = 20;

        // Backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.playAreaWidth, this.playAreaHeight + this.uiHeight);

        // Glass Modal
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = 'rgba(20, 30, 40, 0.98)';
        ctx.beginPath(); ctx.roundRect(0, 0, w, h, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 32px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText("SKILL MANUAL", w / 2, 60);

        const skills = [
            { id: 'climber', desc: "Climbs up vertical walls." },
            { id: 'floater', desc: "Falls slowly with an umbrella." },
            { id: 'bomber', desc: "Explodes in 5s (clears area)." },
            { id: 'blocker', desc: "Stops & turns other tikmings." },
            { id: 'builder', desc: "Builds a 12-step staircase." },
            { id: 'basher', desc: "Punches through walls horizontally." },
            { id: 'miner', desc: "Digs a diagonal path downwards." },
            { id: 'digger', desc: "Digs a vertical path straight down." }
        ];

        skills.forEach((s, i) => {
            const sy = 120 + i * 55;
            this.drawSkillIcon(ctx, s.id, 60, sy - 10, true);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText(s.id.toUpperCase(), 100, sy - 4);

            ctx.fillStyle = '#aaa';
            ctx.font = '14px "Courier New"';
            ctx.fillText(s.desc, 220, sy - 4);
        });

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillText("TAP ANYWHERE TO CLOSE", w / 2, h - 30);
        ctx.restore();
    }

    drawEntranceAndExit() {
        const time = Date.now() / 1000;

        // --- Entrance: Literal Wooden Trap Door ---
        const sx = this.level.properties.startX, sy = this.level.properties.startY;
        this.ctx.save();
        this.ctx.translate(sx, sy - 8);

        // Casing
        this.ctx.fillStyle = '#4a2b10';
        this.ctx.fillRect(-28, 0, 56, 12);
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-28, 0, 56, 12);

        // Open/Close logic based on spawn timer
        const openAngle = this.trapDoorAngle || 0;

        // Left Door
        this.ctx.save();
        this.ctx.translate(-24, 0);
        this.ctx.rotate(openAngle);
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(0, 0, 24, 4);
        this.ctx.strokeStyle = '#111';
        this.ctx.strokeRect(0, 0, 24, 4);
        // Wood grain
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(4, 1, 16, 1);
        this.ctx.restore();

        // Right Door
        this.ctx.save();
        this.ctx.translate(24, 0);
        this.ctx.rotate(-openAngle);
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(-24, 0, 24, 4);
        this.ctx.strokeStyle = '#111';
        this.ctx.strokeRect(-24, 0, 24, 4);
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(-20, 1, 16, 1);
        this.ctx.restore();

        this.ctx.restore();

        // --- Exit: Ancient Stone Doorway ---
        const ex = this.level.properties.exitX, ey = this.level.properties.exitY;
        this.ctx.save();
        this.ctx.translate(ex, ey - 40);

        // Stone Arch
        const stoneGrad = this.ctx.createLinearGradient(-30, 0, 30, 0);
        stoneGrad.addColorStop(0, '#444'); stoneGrad.addColorStop(0.5, '#777'); stoneGrad.addColorStop(1, '#444');
        this.ctx.fillStyle = stoneGrad;

        // Draw the archway
        this.ctx.beginPath();
        this.ctx.moveTo(-25, 40);
        this.ctx.lineTo(-25, 10);
        this.ctx.arc(0, 10, 25, Math.PI, 0);
        this.ctx.lineTo(25, 40);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Interior (Darkness)
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.moveTo(-18, 40);
        this.ctx.arc(0, 10, 18, Math.PI, 0);
        this.ctx.lineTo(18, 40);
        this.ctx.closePath();
        this.ctx.fill();

        // --- Torches on each side (Higher and Attached) ---
        const drawTorch = (tx, ty) => {
            this.ctx.save();
            this.ctx.translate(tx, ty);

            // Iron bracket
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(tx > 0 ? -6 : 0, 0, 6, 2); // Attachment to wall
            this.ctx.fillRect(-2, -2, 4, 15); // Main stick
            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(-4, -2, 8, 3); // Cup

            // Enhanced Fire Effect
            const fTime = time * 12;
            for (let i = 0; i < 3; i++) {
                const flicker = Math.sin(fTime + i) * 4;
                const hShift = Math.sin(fTime * 0.5 + i) * 2;

                const grad = this.ctx.createRadialGradient(hShift, -6, 1, hShift, -6, 15);
                if (i === 1) { // Core
                    grad.addColorStop(0, '#fff');
                    grad.addColorStop(0.4, '#ffcc00');
                    grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
                } else { // Outer flames
                    grad.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
                    grad.addColorStop(0.6, 'rgba(255, 50, 0, 0.3)');
                    grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                }
                this.ctx.fillStyle = grad;

                this.ctx.beginPath();
                this.ctx.moveTo(-6, -3);
                this.ctx.bezierCurveTo(-6, -18 + flicker, 6, -18 + flicker, 6, -3);
                this.ctx.fill();
            }

            // Embers (Small sparks)
            this.ctx.fillStyle = '#ff9900';
            for (let j = 0; j < 3; j++) {
                const ex = Math.sin(time * 5 + j) * 5;
                const ey = -10 - ((time * 15 + j * 10) % 20);
                const size = Math.random() * 2;
                this.ctx.fillRect(ex, ey, size, size);
            }

            // Dynamic Light Cast
            this.ctx.globalCompositeOperation = 'lighter';
            const innerGlow = this.ctx.createRadialGradient(0, -6, 2, 0, -6, 45);
            innerGlow.addColorStop(0, `rgba(255, 150, 50, ${0.2 + Math.random() * 0.1})`);
            innerGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
            this.ctx.fillStyle = innerGlow;
            this.ctx.beginPath();
            this.ctx.arc(0, -6, 45, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        };

        drawTorch(-26, 10); // Left side of arch frame
        drawTorch(26, 10);  // Right side of arch frame

        // Soft Ground Glow
        const glow = (Math.sin(time * 2) + 1) * 0.2 + 0.1;
        const groundGrad = this.ctx.createRadialGradient(0, 40, 5, 0, 40, 40);
        groundGrad.addColorStop(0, `rgba(0, 255, 255, ${glow})`);
        groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = groundGrad;
        this.ctx.fillRect(-30, 20, 60, 20);

        this.ctx.restore();
    }

    drawHazards() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        const hazards = this.game?.level?.properties?.terrain || this.level?.properties?.terrain || [];

        hazards.forEach(rect => {
            if (rect.type === 'water') {
                ctx.save();
                // Animated Water
                const waveOffset = Math.sin(time * 2 + rect.x * 0.05) * 5;
                const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
                grad.addColorStop(0, 'rgba(0, 150, 255, 0.6)');
                grad.addColorStop(1, 'rgba(0, 50, 200, 0.8)');

                ctx.fillStyle = grad;
                ctx.fillRect(rect.x + waveOffset, rect.y, rect.width, rect.height);

                // Surface highlights
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.lineDashOffset = -time * 20;
                ctx.beginPath();
                ctx.moveTo(rect.x, rect.y);
                ctx.lineTo(rect.x + rect.width, rect.y);
                ctx.stroke();
                ctx.restore();
            } else if (rect.type === 'pit' || rect.type === 'pit_empty') {
                // Subtle abyss glow/fog
                const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.5, 'rgba(255, 0, 0, 0.1)');
                grad.addColorStop(1, 'rgba(0,0,0,0.5)');
                ctx.fillStyle = grad;
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        });
    }

    drawHazards() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        const level = this.level;
        if (!level || !level.properties || !level.properties.terrain) return;

        level.properties.terrain.forEach(rect => {
            if (rect.type === 'water') {
                ctx.save();
                // Animated Water
                const waveOffset = Math.sin(time * 2 + rect.x * 0.05) * 5;
                const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
                grad.addColorStop(0, 'rgba(0, 150, 255, 0.6)');
                grad.addColorStop(1, 'rgba(0, 50, 200, 0.8)');

                ctx.fillStyle = grad;
                ctx.fillRect(rect.x + waveOffset, rect.y, rect.width, rect.height);

                // Surface highlights
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.lineDashOffset = -time * 20;
                ctx.beginPath();
                ctx.moveTo(rect.x, rect.y);
                ctx.lineTo(rect.x + rect.width, rect.y);
                ctx.stroke();
                ctx.restore();
            } else if (rect.type === 'pit' || rect.type === 'pit_empty') {
                // Subtle abyss glow/fog
                const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.5, 'rgba(255, 0, 0, 0.1)');
                grad.addColorStop(1, 'rgba(0,0,0,0.5)');
                ctx.fillStyle = grad;
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        });
    }

    drawSkillIcon(ctx, skill, x, y, isActive) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.8, 0.8);
        ctx.strokeStyle = isActive ? '#39ff14' : '#fff';
        ctx.fillStyle = isActive ? '#39ff14' : '#fff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        switch (skill) {
            case 'climber':
                ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(-6, -10); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, -2); ctx.lineTo(6, -6); ctx.stroke();
                break;
            case 'floater':
                ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -8); ctx.stroke();
                ctx.fillStyle = '#ff3333';
                ctx.beginPath(); ctx.arc(0, -8, 10, Math.PI, 0); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.stroke();
                break;
            case 'bomber':
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.arc(0, 4, 7, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#ffcc00';
                ctx.beginPath(); ctx.moveTo(5, -1); ctx.quadraticCurveTo(10, -10, 8, -12); ctx.stroke();
                break;
            case 'blocker':
                ctx.fillStyle = '#cc0000';
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
                    const r = 9;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
                break;
            case 'builder':
                ctx.strokeStyle = '#8b4513';
                for (let i = 0; i < 4; i++) ctx.strokeRect(-10 + i * 5, 8 - i * 6, 6, 2);
                break;
            case 'basher':
                ctx.fillStyle = '#777';
                ctx.beginPath(); ctx.roundRect(-8, -4, 14, 10, 2); ctx.fill();
                ctx.fillStyle = '#ffdbac';
                ctx.beginPath(); ctx.arc(6, -2, 5, 0, Math.PI * 2); ctx.fill();
                break;
            case 'miner':
                ctx.strokeStyle = '#aaa';
                ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, -12, 10, 4); ctx.stroke();
                ctx.strokeStyle = '#632';
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke();
                break;
            case 'digger':
                ctx.fillStyle = '#444';
                ctx.beginPath(); ctx.arc(0, 6, 9, Math.PI, 0, true); ctx.fill();
                ctx.fillStyle = '#888';
                ctx.fillRect(-2, -10, 4, 14);
                break;
        }
        ctx.restore();
    }
}

const game = new Game();
game.start();
window.game = game;
