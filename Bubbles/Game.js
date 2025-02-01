import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { Bubble } from './Bubble.js';
import { Level } from './Level.js';
import { levels } from './levels.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.baseGridSize = 60; // Original grid size
    this.gridSize = this.baseGridSize; // Current grid size (will be adjusted)
    this.levelIndex = 0;
    this.level = new Level(levels[this.levelIndex].grid);
    this.player = null;
    this.monsters = [];
    this.bubbles = [];
    this.keys = {};
    this.jumpHeight = levels[this.levelIndex].jumpHeight || 1;
    this.score = 0;
    this.lives = 3;
    this.maxGridSize = 60; // Maximum allowed grid size

    this.touchStart = null;
    this.isDragging = false;
    this.dragDirection = null;
    this.dragSensitivity = 4; // Increased from 2 to 4
    this.moveSpeed = 8; // Base movement speed for touch controls
    this.lastTouch = null;
    
    // Add resize listener
    window.addEventListener('resize', () => this.resizeCanvas());

    // Add touch/mouse event listeners
    this.setupTouchControls();
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
            console.log("Bubble thrown!"); // Debugging
            this.throwBubble();
        }
    });

    document.addEventListener('keyup', (e) => {
        this.keys[e.key] = false;
    });
}

  throwBubble() {
    const bubbleSpeed = levels[this.levelIndex].bubbleSpeed || 16; 
    const bubbleDelay = levels[this.levelIndex].bubbleDelay || 90; 

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
  this.ctx.fillStyle = "black";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.level.draw(this.ctx, this.gridSize);
  this.drawStats();

  // Check if level is completed
  if (this.monsters.length === 0) {
      this.handleLevelCompletion();
      return;
  }

  // Update and draw player
  this.player.update(this.keys, this.level.grid, this.gridSize, this.jumpHeight);
  this.player.draw(this.ctx);

  // Update and draw monsters
  this.monsters.forEach((monster) => {
      monster.update(this.level.grid, this.gridSize);
      monster.draw(this.ctx);
  });

  // Check if player pops any bubbles
  this.checkBubblePop();

  // Update and draw bubbles
  this.updateBubbles(); // Now handled in its own function

  requestAnimationFrame(() => this.gameLoop());
}


handleLevelCompletion() {
  // Wait until all bubbles are cleared before ending level
  if (this.bubbles.length > 0) {
      setTimeout(() => this.handleLevelCompletion(), 500);
      return;
  }

  this.ctx.fillStyle = "black";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.ctx.fillStyle = "white";
  this.ctx.font = "40px Arial";
  this.ctx.fillText("Level Complete!", this.canvas.width / 2 - 120, this.canvas.height / 2);

  setTimeout(() => {
      this.levelIndex++;
      if (this.levelIndex >= levels.length) {
          this.showWinScreen();
      } else {
          this.loadNextLevel();
      }
  }, 3000); // Show for 3 seconds
}
updateBubbles() {
  this.bubbles.forEach((bubble) => {
      if (bubble.state === "moving") { // Only trap monsters while moving horizontally
          const collision = this.monsters.find(
              (monster) =>
                  !bubble.trappedMonster &&
                  this.isColliding(monster, bubble)
          );

          if (collision) {
              bubble.trap(collision);
              console.log("Monster trapped in bubble!"); // Debugging
          }
      }

      const result = bubble.update();
      bubble.draw(this.ctx);
  });

  // Remove bubbles that have burst
  this.bubbles = this.bubbles.filter(bubble => bubble.state !== 'burst');
}

loadNextLevel() {
  this.level = new Level(levels[this.levelIndex].grid);
  this.player = null;
  this.monsters = [];
  this.bubbles = [];
  
  // Resize canvas before initializing entities
  this.resizeCanvas();
  this.initialize();
}


showWinScreen() {
  this.ctx.fillStyle = "black";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.ctx.fillStyle = "white";
  this.ctx.font = "40px Arial";
  this.ctx.fillText("Congratulations! You Won!", this.canvas.width / 2 - 180, this.canvas.height / 2);

  setTimeout(() => {
      alert("Game Over! Restarting...");
      location.reload(); // Restart the game
  }, 5000); // Show win screen for 5 seconds
}

checkBubblePop() {
  this.bubbles = this.bubbles.filter((bubble) => {
      if (bubble.canBePopped() && this.isColliding(this.player, bubble)) {
          console.log("Bubble popped!"); // Debugging

          if (bubble.trappedMonster) {
              this.score += 100;
              this.monsters = this.monsters.filter(m => m !== bubble.trappedMonster); // Remove monster
          }
          return false; // Remove the bubble
      }
      return true;
  });
}




isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}



handleLevelCompletion() {
  if (this.bubbles.length > 0) {
      setTimeout(() => this.handleLevelCompletion(), 500);
      return;
  }

  this.ctx.fillStyle = "black";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.ctx.fillStyle = "white";
  this.ctx.font = "40px Arial";
  this.ctx.fillText("Level Complete!", this.canvas.width / 2 - 120, this.canvas.height / 2);

  setTimeout(() => {
      this.levelIndex++;
      if (this.levelIndex >= levels.length) {
          this.showWinScreen();
      } else {
          this.loadNextLevel();
      }
  }, 3000);
}


  resizeCanvas() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const isPortrait = containerHeight > containerWidth;

    // Get current level dimensions
    const levelWidth = this.level.grid[0].length;
    const levelHeight = this.level.grid.length;

    let maxWidth, maxHeight;
    if (isPortrait) {
      maxWidth = containerWidth * 0.95; // Use 95% of screen width in portrait
      maxHeight = containerHeight * 0.8; // Use 80% of screen height
    } else {
      maxWidth = containerWidth * 0.8;  // Use 80% of screen width in landscape
      maxHeight = containerHeight * 0.8; // Use 80% of screen height
    }

    // Calculate grid size that will fit the level
    const gridSizeByWidth = Math.floor(maxWidth / levelWidth);
    const gridSizeByHeight = Math.floor(maxHeight / levelHeight);
    let newGridSize = Math.min(gridSizeByWidth, gridSizeByHeight);

    // Ensure grid size doesn't exceed maximum
    newGridSize = Math.min(newGridSize, this.maxGridSize);

    // Calculate actual canvas dimensions
    const canvasWidth = newGridSize * levelWidth;
    const canvasHeight = newGridSize * levelHeight;

    // Update canvas size
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Center canvas
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.transform = 'translate(-50%, -50%)';

    // Update grid size if changed
    if (this.gridSize !== newGridSize) {
      this.updateGridSize(newGridSize);
    }
  }

  updateGridSize(newGridSize) {
    const scaleFactor = newGridSize / this.gridSize;
    this.gridSize = newGridSize;

    // Scale all entities
    if (this.player) {
      this.player.x *= scaleFactor;
      this.player.y *= scaleFactor;
      this.player.width = newGridSize;
      this.player.height = newGridSize;
      this.player.speed = (5 * newGridSize) / this.baseGridSize;
    }

    this.monsters.forEach(monster => {
      monster.x *= scaleFactor;
      monster.y *= scaleFactor;
      monster.width = newGridSize;
      monster.height = newGridSize;
      monster.speed = (2 * newGridSize) / this.baseGridSize;
      monster.startX *= scaleFactor;
      monster.startY *= scaleFactor;
    });

    this.bubbles.forEach(bubble => {
      bubble.x *= scaleFactor;
      bubble.y *= scaleFactor;
      bubble.width = newGridSize;
      bubble.height = newGridSize;
      bubble.speed = (16 * newGridSize) / this.baseGridSize;
    });

    // Ensure player stays within canvas bounds
    if (this.player) {
      this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
      this.player.y = Math.max(0, Math.min(this.player.y, this.canvas.height - this.player.height));
    }
    
    // Ensure monsters stay within canvas bounds
    this.monsters.forEach(monster => {
      monster.x = Math.max(0, Math.min(monster.x, this.canvas.width - monster.width));
      monster.y = Math.max(0, Math.min(monster.y, this.canvas.height - monster.height));
    });
  }

  drawStats() {
    const padding = this.gridSize / 2;
    this.ctx.fillStyle = 'white';
    this.ctx.font = `${this.gridSize/2}px Arial`;
    this.ctx.fillText(`🏆 ${this.score}`, padding, this.gridSize/1.5);
    this.ctx.fillText(`❤️ ${this.lives}`, this.canvas.width - this.gridSize*3, this.gridSize/1.5);
    this.ctx.fillText(`🎮 ${this.levelIndex + 1}`, this.canvas.width/2 - this.gridSize, this.gridSize/1.5);
  }

  setupTouchControls() {
    const getCanvasPoint = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        inBounds: function() {
          return this.x >= 0 && this.x <= rect.width &&
                 this.y >= 0 && this.y <= rect.height;
        }
      };
    };

    let touchStartTime = 0;
    const tapThreshold = 200; // ms to distinguish tap from drag

    const touchStart = (e) => {
      e.preventDefault();
      const point = e.touches ? e.touches[0] : e;
      const canvasPoint = getCanvasPoint(point.clientX, point.clientY);
      
      if (canvasPoint.inBounds()) {
        touchStartTime = Date.now();
        this.touchStart = { x: point.clientX, y: point.clientY };
        this.lastTouch = { x: point.clientX, y: point.clientY };
        this.isDragging = false; // Start as not dragging
      }
    };

    const touchMove = (e) => {
      e.preventDefault();
      if (!this.touchStart || !this.lastTouch) return;

      const point = e.touches ? e.touches[0] : e;
      const canvasPoint = getCanvasPoint(point.clientX, point.clientY);
      
      if (canvasPoint.inBounds()) {
        const deltaX = point.clientX - this.lastTouch.x;
        const deltaY = point.clientY - this.lastTouch.y;
        const moveThreshold = 3; // Smaller threshold for more responsive controls

        // Mark as dragging if moved enough
        if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
          this.isDragging = true;
        }

        // Horizontal movement
        if (deltaX < -moveThreshold) {
          this.player.x -= this.moveSpeed * this.dragSensitivity;
          this.player.direction = -1;
        } else if (deltaX > moveThreshold) {
          this.player.x += this.moveSpeed * this.dragSensitivity;
          this.player.direction = 1;
        }

        // Jump on upward movement
        if (deltaY < -moveThreshold * 3) {
          if (!this.player.isJumping) {
            this.keys['ArrowUp'] = true;
            setTimeout(() => {
              this.keys['ArrowUp'] = false;
            }, 100);
          }
        }

        this.lastTouch = { x: point.clientX, y: point.clientY };
      }
    };

    const touchEnd = (e) => {
      e.preventDefault();
      const touchDuration = Date.now() - touchStartTime;
      
      // If it was a quick tap and we didn't drag, throw bubble
      if (!this.isDragging && touchDuration < tapThreshold) {
        this.throwBubble();
      }

      this.touchStart = null;
      this.lastTouch = null;
      this.isDragging = false;
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
      this.keys['ArrowUp'] = false;
    };

    // Remove existing listeners first to prevent duplicates
    this.canvas.removeEventListener('touchstart', touchStart);
    this.canvas.removeEventListener('touchmove', touchMove);
    this.canvas.removeEventListener('touchend', touchEnd);
    
    // Add touch events
    this.canvas.addEventListener('touchstart', touchStart, { passive: false });
    this.canvas.addEventListener('touchmove', touchMove, { passive: false });
    this.canvas.addEventListener('touchend', touchEnd, { passive: false });
    
    // Mouse events
    this.canvas.addEventListener('mousedown', touchStart);
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.touchStart) touchMove(e);
    });
    this.canvas.addEventListener('mouseup', touchEnd);
    this.canvas.addEventListener('mouseleave', touchEnd);
  }
}

