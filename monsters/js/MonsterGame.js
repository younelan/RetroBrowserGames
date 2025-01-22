import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { GameUI } from './GameUI.js';
import { Translator } from './Translator.js';
import { colors } from './levels.js';

export class MonsterGame {
    constructor(canvasId, levelStrings) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('gameContainer');
        this.levels = this.parseLevels(levelStrings);
        this.currentLevel = 0;
        this.score = 0;
        this.lives = 10;
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
        this.lives = 10;
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
        this.score = 0;
        this.lives = 10;
        this.currentLevel = 0;
        this.gameActive = true;
        this.initializeLevel();
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
        this.ui.resizeCells();
        
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
        
        // Update player position
        this.player.move(deltaTime, this.cellSize);
        if (this.isCollidingWithWall(this.player.x, this.player.y, this.player.radius)) {
            this.player.x = this.player.lastX;
            this.player.y = this.player.lastY;
        }

        // Update monsters
        this.monsters.forEach(monster => {
            const prevX = monster.x;
            const prevY = monster.y;
            
            monster.move(deltaTime, this.cellSize);
            
            if (this.isCollidingWithWall(monster.x, monster.y, monster.radius)) {
                monster.x = prevX;
                monster.y = prevY;
                // Fix: Use the monster's changeDirection method
                monster.changeDirection();
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
                        this.score++;
                    }
                }
            }
        }

        // Check monster collisions
        this.monsters.forEach(monster => {
            const dist = Math.hypot(this.player.x - monster.x, this.player.y - monster.y);
            if (dist < this.player.radius + monster.radius) {
                this.lives--;
                if (this.lives <= 0) {
                    this.endGame(false);
                } else {
                    this.initializeLevel();
                }
            }
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

    draw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw UI elements including debug info
        this.ui.draw();
    }

    drawWalls() {
        for (let row = 0; row < this.levels[this.currentLevel].length; row++) {
            for (let col = 0; col < this.levels[this.currentLevel][row].length; col++) {
                const cell = this.levels[this.currentLevel][row][col];
                if (colors[cell]) {
                    this.ctx.fillStyle = colors[cell];
                    this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
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
                    this.ctx.beginPath();
                    this.ctx.arc(col * this.cellSize + this.cellSize / 2, row * this.cellSize + this.cellSize / 2, this.cellSize / 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            }
        }
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
        const message = win ? 'You Win!' : 'Game Over';
        alert(this.translator.translate(message));
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
}
