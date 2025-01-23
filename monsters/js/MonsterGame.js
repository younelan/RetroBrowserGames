import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { GameUI } from './GameUI.js';
import { Translator } from './Translator.js';
import { colors } from './levels.js';
import { Collectible } from './Collectible.js';

export class MonsterGame {
    constructor(canvasId, levelStrings) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('gameContainer');
        this.originalLevels = levelStrings;  // Store original level data
        this.levels = this.parseLevels(levelStrings);
        this.currentLevel = 0;
        this.score = 0;
        this.startingLives = 3;
        this.lives = this.startingLives;
        this.gameActive = false;
        this.highScoreItem = "monster_highScore";
        this.fixedTimeStep = 1000 / 60;
        
        // Fix the scaling by setting initial size
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientWidth;
        this.cellSize = this.canvas.width / levelStrings[0].split('\n')[1].length;
        this.lastUpdateTime = null;

        this.player = new Player();
        this.monsters = [];
        this.ui = new GameUI(this);
        this.translator = new Translator();
        this.collectibles = [];
        this.lastCollectibleSpawn = 0;
        this.collectibleSpawnInterval = 10000; // 10 seconds between spawns
        this.fruitTypes = ['cherry', 'banana', 'apple', 'powerPellet'];

        this.setupEventListeners();
        console.log('Game initialized'); // Debug
    }

    initialize() {
        // Initial setup
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientWidth;
        this.cellSize = this.canvas.width / this.levels[0][0].length;
        
        // Initialize game state
        this.score = 0;
        this.lives = this.startingLives;
        this.currentLevel = 0;
        this.gameActive = false;
        
        // Set up initial level
        this.initializeLevel();
        
        // Draw initial state
        this.draw();
        
        // Start animation loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                if (event.key === 'ArrowRight') this.player.direction = 'right';
                if (event.key === 'ArrowLeft') this.player.direction = 'left';
                if (event.key === 'ArrowUp') this.player.direction = 'up';
                if (event.key === 'ArrowDown') this.player.direction = 'down';
            }
        });

        // Button controls
        const button = document.getElementById('startStopButton');
        button.addEventListener('click', () => this.toggleGame());
    }

    start() {
        this.gameActive = true;
        this.lastUpdateTime = performance.now();
        this.gameLoop(this.lastUpdateTime);
        
        // Update button text
        const button = document.getElementById('startStopButton');
        button.textContent = this.translator.translate("Stop");
    }

    toggleGame() {
        this.gameActive = !this.gameActive;
        const button = document.getElementById('startStopButton');
        if (this.gameActive) {
            document.getElementById('message').innerHTML = "Good Luck";
            button.textContent = this.translator.translate("Stop");
            this.start();
        } else {
            button.textContent = this.translator.translate("Start");
        }
    }

    initializeLevel() {
        this.monsters = [];
        let totalDots = 0;
        this.ui.resizeCanvas();  // Ensure canvas is resized and centered
        
        for (let row = 0; row < this.levels[this.currentLevel].length; row++) {
            for (let col = 0; col < this.levels[this.currentLevel][row].length; col++) {
                const cell = this.levels[this.currentLevel][row][col];
                if (cell === '+') {
                    this.monsters.push(new Monster(
                        col * this.cellSize + this.cellSize / 2,
                        row * this.cellSize + this.cellSize / 2,
                        (this.cellSize - 2) / 2
                    ));
                } else if (cell === '@') {
                    this.player.x = col * this.cellSize + this.cellSize / 2;
                    this.player.y = row * this.cellSize + this.cellSize / 2 + 1;
                } else if (cell === '.') {
                    totalDots++;
                }
            }
        }
        return totalDots;
    }

    gameLoop(timestamp) {
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = timestamp;
        }
        const deltaTime = (timestamp - this.lastUpdateTime) / this.fixedTimeStep;
        this.lastUpdateTime = timestamp;

        if (this.gameActive) {
            this.update(deltaTime);
            this.draw();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    update(deltaTime) {
        if (!this.gameActive) return;
        
        // Try to spawn a collectible
        this.updateCollectibles();
        
        // Update player position
        this.player.move(deltaTime, this.cellSize);
        if (this.isCollidingWithWall(this.player.x, this.player.y, this.player.radius)) {
            this.player.x = this.player.lastX;
            this.player.y = this.player.lastY;
        }

        // Update monsters
        this.monsters.forEach(monster => {
            monster.update();
            
            // Only move monster if not regenerating
            if (!monster.isRegenerating) {
                const prevX = monster.x;
                const prevY = monster.y;
                
                monster.move(deltaTime, this.cellSize);
                
                if (this.isCollidingWithWall(monster.x, monster.y, monster.radius)) {
                    monster.x = prevX;
                    monster.y = prevY;
                    monster.changeDirection();
                }
            }
        });

        // Check dot collection
        const currentLevel = this.levels[this.currentLevel];
        for (let row = 0; row < currentLevel.length; row++) {
            for (let col = 0; col < currentLevel[row].length; col++) {
                if (currentLevel[row][col] === '.') {
                    const dotX = col * this.cellSize + this.cellSize / 2;
                    const dotY = row * this.cellSize + this.cellSize / 2;
                    const dist = Math.hypot(this.player.x - dotX, this.player.y - dotY);
                    if (dist < this.player.radius + this.cellSize / 10) {
                        currentLevel[row][col] = ' ';
                        this.score += 10;  // Changed from 1 to 10 points
                    }
                }
            }
        }

        // Update monster states
        this.monsters.forEach(monster => monster.update());

        // Check monster collisions
        this.monsters.forEach(monster => {
            if (monster.isRegenerating) return; // Skip collision check if regenerating
            
            const dist = Math.hypot(this.player.x - monster.x, this.player.y - monster.y);
            if (dist < this.player.radius + monster.radius) {
                if (monster.isVulnerable) {
                    // Player eats the monster - start regeneration
                    this.score += monster.points;
                    monster.startRegeneration();
                } else {
                    // Monster eats the player
                    this.lives--;
                    if (this.lives <= 0) {
                        this.endGame(false);
                    } else {
                        this.initializeLevel();
                    }
                }
            }
        });

        // Check collectible collisions with power pellet handling
        this.collectibles = this.collectibles.filter(collectible => {
            if (collectible.isExpired()) return false;
            
            const dist = Math.hypot(this.player.x - collectible.x, this.player.y - collectible.y);
            if (dist < this.player.radius + collectible.radius) {
                if (collectible.type === 'powerPellet') {
                    this.monsters.forEach(monster => monster.makeVulnerable());
                }
                this.score += collectible.points;
                return false;
            }
            return true;
        });

        // Replace level completion check
        if (this.checkLevelComplete()) {
            if (this.currentLevel < this.levels.length - 1) {
                this.currentLevel++;
                this.initializeLevel();
            } else {
                this.endGame(true);
            }
        }

        // Keep player within bounds
        this.keepInBounds(this.player);
        this.monsters.forEach(monster => this.keepInBounds(monster));
    }

    updateCollectibles() {
        const now = Date.now();
        if (now - this.lastCollectibleSpawn > this.collectibleSpawnInterval) {
            const emptySpaces = this.findEmptySpaces();
            if (emptySpaces.length > 0) {
                const pos = emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
                const type = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
                const collectible = new Collectible(
                    pos.x * this.cellSize + this.cellSize / 2,
                    pos.y * this.cellSize + this.cellSize / 2,
                    type
                );
                collectible.radius = (this.cellSize - 2) / 2;
                this.collectibles.push(collectible);
                this.lastCollectibleSpawn = now;
            }
        }
    }

    findEmptySpaces() {
        const spaces = [];
        const level = this.levels[this.currentLevel];
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] === ' ') {
                    spaces.push({x, y});
                }
            }
        }
        return spaces;
    }

    draw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw UI elements including debug info
        this.ui.draw();
        this.drawCollectibles();
    }

    drawWalls() {
        for (let row = 0; row < this.levels[this.currentLevel].length; row++) {
            for (let col = 0; col < this.levels[this.currentLevel][row].length; col++) {
                const cell = this.levels[this.currentLevel][row][col];
                if (colors[cell]) {
                    this.ctx.fillStyle = colors[cell];
                    this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize + 1, this.cellSize + 1);
                }
            }
        }
    }

    drawMonsters() {
        this.monsters.forEach(monster => {
            monster.draw(this.ctx);
        });
    }

    drawPlayerOne() {
        this.player.draw(this.ctx);
    }

    drawDots() {
        for (let row = 0; row < this.levels[this.currentLevel].length; row++) {
            for (let col = 0; col < this.levels[this.currentLevel][row].length; col++) {
                if (this.levels[this.currentLevel][row][col] === '.') {
                    const dotX = col * this.cellSize + this.cellSize / 2;
                    const dotY = row * this.cellSize + this.cellSize / 2;
                    const dotRadius = this.cellSize / 5;

                    // Draw shadow
                    const shadowGradient = this.ctx.createRadialGradient(
                        dotX + dotRadius * 0.2,
                        dotY + dotRadius * 0.2,
                        0,
                        dotX + dotRadius * 0.2,
                        dotY + dotRadius * 0.2,
                        dotRadius * 1.5
                    );
                    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
                    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                    this.ctx.beginPath();
                    this.ctx.arc(dotX + dotRadius * 0.2, dotY + dotRadius * 0.2, dotRadius, 0, Math.PI * 2);
                    this.ctx.fillStyle = shadowGradient;
                    this.ctx.fill();

                    // Draw main dot with stark 3D effect
                    const gradient = this.ctx.createRadialGradient(
                        dotX - dotRadius * 0.3,
                        dotY - dotRadius * 0.3,
                        0,
                        dotX,
                        dotY,
                        dotRadius
                    );
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.5, '#f0f0f0');
                    gradient.addColorStop(1, '#808080');

                    this.ctx.beginPath();
                    this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();

                    // Add bright highlight
                    this.ctx.beginPath();
                    this.ctx.arc(
                        dotX - dotRadius * 0.2,
                        dotY - dotRadius * 0.2,
                        dotRadius * 0.4,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    this.ctx.fill();
                }
            }
        }
    }

    drawCollectibles() {
        this.collectibles.forEach(collectible => {
            collectible.draw(this.ctx);
        });
    }

    isCollidingWithWall(x, y, radius) {
        // Get the cells that the entity might be touching
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Check bounds
        if (row < 0 || row >= this.levels[this.currentLevel].length ||
            col < 0 || col >= this.levels[this.currentLevel][0].length) {
            return true;
        }

        // Check the cell the entity is in and adjacent cells
        const cells = [
            [row, col],
            [row, col + 1],
            [row, col - 1],
            [row + 1, col],
            [row - 1, col]
        ];

        for (const [checkRow, checkCol] of cells) {
            if (checkRow >= 0 && checkRow < this.levels[this.currentLevel].length &&
                checkCol >= 0 && checkCol < this.levels[this.currentLevel][0].length) {
                const cell = this.levels[this.currentLevel][checkRow][checkCol];
                if (colors[cell]) {
                    // Check detailed collision with wall
                    const wallX = checkCol * this.cellSize;
                    const wallY = checkRow * this.cellSize;
                    
                    // Check if the entity's circle intersects with the wall's rectangle
                    const closestX = Math.max(wallX, Math.min(x, wallX + this.cellSize));
                    const closestY = Math.max(wallY, Math.min(y, wallY + this.cellSize));
                    
                    const distanceX = x - closestX;
                    const distanceY = y - closestY;
                    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
                    
                    if (distanceSquared < (radius * radius)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    keepInBounds(entity) {
        if (entity.x < 0) entity.x = this.canvas.width;
        if (entity.x > this.canvas.width) entity.x = 0;
        if (entity.y < 0) entity.y = this.canvas.height;
        if (entity.y > this.canvas.height) entity.y = 0;
    }

    endGame(win) {
        this.gameActive = false;
        this.ui.drawEndScreen(win);
    }

    checkLevelComplete() {
        // Replace flat() with a more compatible method
        const currentLevel = this.levels[this.currentLevel];
        let hasDots = false;
        for (let row = 0; row < currentLevel.length; row++) {
            for (let col = 0; col < currentLevel[row].length; col++) {
                if (currentLevel[row][col] === '.') {
                    hasDots = true;
                    break;
                }
            }
        }
        return !hasDots;
    }

    parseLevels(levelStrings) {
        return levelStrings.map(levelString => {
            const rows = levelString.trim().split('\n');
            return rows.map(row => row.trim().split(''));
        });
    }

    resetGame() {
        this.score = 0;
        this.lives = this.startingLives;
        this.currentLevel = 0;  // Ensure we start from first level
        this.gameActive = false;
        this.monsters = [];
        this.player = new Player();
        
        // Reset level data
        this.levels = this.parseLevels(this.originalLevels);  // We need to add originalLevels property
        
        // Update button text back to Start
        const button = document.getElementById('startStopButton');
        button.textContent = this.translator.translate("Start");
        
        // Clear any existing message
        document.getElementById('message').innerHTML = "";
        
        // Initialize the level
        this.initializeLevel();
        this.collectibles = [];
        this.lastCollectibleSpawn = 0;
    }
}
