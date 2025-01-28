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
    if (this.player.isJumping) return;

    const bubble = new Bubble(
      this.player.x , 
      this.player.y , 
      this.gridSize, 
      this.gridSize, 
      10, 
      this.player.direction
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

    // Update and draw bubbles
    this.bubbles = this.bubbles.filter((bubble) => {
      const collision = this.monsters.find(
        (monster) =>
          !bubble.trappedMonster && // Bubble isn't already trapping a monster
          bubble.x < monster.x + monster.width &&
          bubble.x + bubble.width > monster.x &&
          bubble.y < monster.y + monster.height &&
          bubble.y + bubble.height > monster.y
      );
    
      if (collision) {
        bubble.trap(collision); // Trap the monster and start the delay
        return true;
      }
    
      const result = bubble.update();
      bubble.draw(this.ctx);
      return result !== 'burst'; // Remove bubble if it bursts
    });
    
    

    requestAnimationFrame(() => this.gameLoop());
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

