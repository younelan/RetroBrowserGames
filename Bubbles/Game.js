import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { Bubble } from './Bubble.js';
import { Level } from './Level.js';
import { levels } from './levels.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 60;
    this.levelIndex = 0;
    this.level = new Level(levels[this.levelIndex].grid);
    this.player = null;
    this.monsters = [];
    this.bubbles = [];
    this.keys = {};
    this.jumpHeight = levels[this.levelIndex].jumpHeight || 1;
  }

  start() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context is missing!');
      return;
    }
    this.initialize();
    this.handleInput();
    this.gameLoop();
  }

  initialize() {
    // Initialize player and monsters
    const currentLevel = levels[this.levelIndex];
    const levelGrid = this.level.grid;

    levelGrid.forEach((row, rowIndex) => {
      row.split('').forEach((cell, colIndex) => {
        const x = colIndex * this.gridSize;
        const y = rowIndex * this.gridSize;

        if (cell === '1') {
          this.player = new Player(x, y, this.gridSize, this.gridSize, 5);
        } else if (cell === '+') {
          this.monsters.push(new Monster(x, y, this.gridSize, this.gridSize, 2));
        }
      });
    });

    this.resizeCanvas();
  }

  handleInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      if (e.key === ' ' || e.key === 'Space') {
        this.throwBubble();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  throwBubble() {
    const bubbleSpeed = levels[this.levelIndex].bubbleSpeed || 2; 
    const bubbleDelay = levels[this.levelIndex].bubbleDelay || 60; 

    const bubble = new Bubble(
        this.player.x + this.player.width / 2 - this.gridSize / 2, // Center bubble
        this.player.y + this.player.height / 2 - this.gridSize / 2,
        this.gridSize, 
        this.gridSize, 
        bubbleSpeed, 
        this.player.direction,
        bubbleDelay
    );
    this.bubbles.push(bubble);
}



  gameLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.level.draw(this.ctx, this.gridSize);

    // Update and draw player
    this.player.update(this.keys, this.level.grid, this.gridSize, this.jumpHeight);
    this.player.draw(this.ctx);

    // Update and draw monsters
    this.monsters.forEach((monster) => {
      monster.update(this.level.grid, this.gridSize);
      monster.draw(this.ctx);
    });

    // Check if player collides with any bubbles and pop them
    this.bubbles = this.bubbles.filter((bubble) => {
      if (this.isColliding(this.player, bubble)) {
          if (bubble.trappedMonster) {
              this.score += 100; // Increase score
              this.monsters = this.monsters.filter(m => m !== bubble.trappedMonster); // Remove monster
          }
          return false; // Remove the bubble
      }
  
      const result = bubble.update();
      bubble.draw(this.ctx);
      return result !== 'burst'; // Remove bubble if it bursts at top
  });
  
  

    // Check for victory condition
    if (this.monsters.length === 0) {
      this.handleLevelCompletion();
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  isColliding(player, bubble) {
    const dx = (player.x + player.width / 2) - (bubble.x + bubble.width / 2);
    const dy = (player.y + player.height / 2) - (bubble.y + bubble.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < bubble.width + player.width ; // Reduce radius for better detection
}



  handleLevelCompletion() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "40px Arial";
    this.ctx.fillText("Victory!", this.canvas.width / 2 - 80, this.canvas.height / 2);

    setTimeout(() => {
      this.levelIndex++;
      if (this.levelIndex >= levels.length) {
        alert("Game Over! You won!");
        location.reload(); // Restart the game
      } else {
        this.loadNextLevel();
      }
    }, 3000); // 3-second delay before moving to next level
  }
  loadNextLevel() {
    this.level = new Level(levels[this.levelIndex].grid);
    this.player = null;
    this.monsters = [];
    this.bubbles = [];

    this.initialize(); // Reinitialize player and monsters
  }

  resizeCanvas() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    const gridCountX = Math.floor(maxWidth / this.gridSize);
    const gridCountY = Math.floor(maxHeight / this.gridSize);

    this.canvas.width = gridCountX * this.gridSize;
    this.canvas.height = gridCountY * this.gridSize;
  }
}

