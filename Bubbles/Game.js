import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { Bubble } from './Bubble.js';
import { Level } from './Level.js';
import { levels } from './levels.js';
import { Collectible } from './Collectible.js';

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
    this.dragSensitivity = 0.8; // Increased from 0.25
    this.moveSpeed = 4; // Increased from 2
    this.touchData = {
      startTime: 0,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      isDragging: false,
      dragThreshold: 10, // pixels to start dragging
      tapThreshold: 150, // ms to count as tap
      jumpTriggered: false, // Add new property to track jump state
      moveThreshold: 3, // Lower threshold for more responsive movement
    };
    
    // Add resize listener
    window.addEventListener('resize', () => this.resizeCanvas());

    // Add touch/mouse event listeners
    this.setupTouchControls();

    this.isGameEnding = false;
    this.invincibleTime = 0; // Add invincibility time after getting hit
    this.invincibleDuration = 120; // 2 seconds at 60fps

    this.collectibles = [];
    this.collectibleTypes = ['cherry', 'strawberry', 'star'];
    this.collectibleSpawnTimer = 0;
    this.collectibleSpawnInterval = 300; // Spawn every 5 seconds

    this.isGameOver = false;
    this.playerBaseSpeed = 5;
    this.lastTime = 0;
  }

  start() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context is missing!');
      return;
    }
    this.initialize();
    this.handleInput();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  initialize() {
    // Initialize player and monsters
    const currentLevel = levels[this.levelIndex];
    const speedMultiplier = currentLevel.speedMultiplier || 1;
    const levelSpeed = this.playerBaseSpeed * speedMultiplier;
    const levelGrid = this.level.grid;

    levelGrid.forEach((row, rowIndex) => {
      row.split('').forEach((cell, colIndex) => {
        const x = colIndex * this.gridSize;
        const y = rowIndex * this.gridSize;

        if (cell === '1') {
          this.player = new Player(x, y, this.gridSize, this.gridSize, levelSpeed);
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
    const bubbleSpeed = levels[this.levelIndex].bubbleSpeed || 8; // Reduced from 16
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

gameLoop(timestamp) {
  if (this.isGameOver) return;

  if (!this.lastTime) {
    this.lastTime = timestamp;
  }
  const deltaTime = (timestamp - this.lastTime) / (1000 / 60); // Normalize to 60 FPS
  this.lastTime = timestamp;


  this.ctx.fillStyle = "black";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.level.draw(this.ctx, this.gridSize);
  this.drawStats();

  // Check if level is completed
  if (this.monsters.length === 0) {
      this.handleLevelCompletion();
      return;
  }

  // Update invincibility
  if (this.invincibleTime > 0) {
    this.invincibleTime--;
  }

  // Update keys from touch controls
  this.keys['ArrowLeft'] = (this.dragDirection === 'left');
  this.keys['ArrowRight'] = (this.dragDirection === 'right');

  // Update and draw player
  this.player.update(this.keys, this.level.grid, this.gridSize, this.jumpHeight, deltaTime);
  
  // Reset one-time keys
  this.keys['ArrowUp'] = false;

  // Only draw player every other frame when invincible (blinking effect)
  if (this.invincibleTime === 0 || this.invincibleTime % 2) {
    this.player.draw(this.ctx);
  }

  // Check monster collisions and update monsters
  this.monsters.forEach((monster) => {
    monster.update(this.level.grid, this.gridSize);
    monster.draw(this.ctx);

    // Only check collision if not invincible
    if (this.invincibleTime === 0 && 
        !monster.isTrapped && 
        this.isColliding(this.player, monster)) {
      this.handlePlayerHit();
    }
  });

  // Check if player pops any bubbles
  this.checkBubblePop();

  // Update and draw bubbles
  this.updateBubbles(); // Now handled in its own function

  // Update and spawn collectibles
  this.collectibleSpawnTimer++;
  if (this.collectibleSpawnTimer >= this.collectibleSpawnInterval) {
    this.spawnCollectible();
    this.collectibleSpawnTimer = 0;
  }

  // Update and draw collectibles with expiration
  this.collectibles = this.collectibles.filter((collectible, index) => {
    collectible.update();
    if (collectible.expired) {
      return false;
    }
    collectible.draw(this.ctx);
    
    if (this.isColliding(this.player, collectible)) {
      this.collectCollectible(index);
      return false;
    }
    return true;
  });

  this.animationFrame = requestAnimationFrame(this.gameLoop.bind(this));
}


handleLevelCompletion() {
  // Clear any remaining bubbles
  this.bubbles = [];
  
  // Clear any remaining collectibles
  this.collectibles = [];
  
  // Reset touch data
  this.touchData = {
    startTime: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
    dragThreshold: 10,
    tapThreshold: 150,
    jumpTriggered: false,
    moveThreshold: 3
  };

  this.levelIndex++;
  if (this.levelIndex >= levels.length) {
    cancelAnimationFrame(this.animationFrame);
    this.showWinScreen();
  } else {
    this.loadNextLevel();
    // Explicitly start the game loop again
    this.animationFrame = requestAnimationFrame(this.gameLoop.bind(this));
  }
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
  this.collectibles = [];
  this.initialize();
}


showWinScreen() {
  this.isGameEnding = true;
  let frameCount = 0;
  const maxFrames = 180; // 3 seconds at 60fps

  const drawWinScreen = () => {
    if (!this.isGameEnding) return;

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const fontSize = Math.min(this.canvas.width, this.canvas.height) * 0.08;
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = "white";
    const text = "Congratulations! You Won!";
    const metrics = this.ctx.measureText(text);
    this.ctx.fillText(text, (this.canvas.width - metrics.width) / 2, this.canvas.height / 2);

    frameCount++;
    if (frameCount < maxFrames) {
      requestAnimationFrame(drawWinScreen);
    } else {
      this.isGameEnding = false;
      // Use timeout to ensure the last frame is rendered
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  requestAnimationFrame(drawWinScreen);
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
           obj1.y + obj2.height > obj2.y;
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
    })
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
    const touchStart = (e) => {
      e.preventDefault();
      const point = e.touches ? e.touches[0] : e;
      const rect = this.canvas.getBoundingClientRect();
      const x = point.clientX - rect.left;
      const y = point.clientY - rect.top;

      // Only handle touches inside canvas
      if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
        this.touchData.startTime = Date.now();
        this.touchData.startX = point.clientX;
        this.touchData.startY = point.clientY;
        this.touchData.lastX = point.clientX;
        this.touchData.lastY = point.clientY;
        this.touchData.isDragging = false;
        this.touchData.jumpTriggered = false;
        this.dragDirection = null;
      }
    };

    const touchMove = (e) => {
      e.preventDefault();
      if (!this.touchData.startTime) return;

      const point = e.touches ? e.touches[0] : e;
      const deltaX = point.clientX - this.touchData.startX;
      const totalDeltaY = point.clientY - this.touchData.startY;
      
      if (Math.abs(deltaX) > this.touchData.dragThreshold) {
        this.touchData.isDragging = true;
        this.dragDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        this.dragDirection = null;
      }

      // Improved jump handling
      if (this.touchData.isDragging && totalDeltaY < -this.touchData.dragThreshold && !this.touchData.jumpTriggered && !this.player.isJumping) {
        this.touchData.jumpTriggered = true;
        this.keys['ArrowUp'] = true;
      }

      this.touchData.lastX = point.clientX;
      this.touchData.lastY = point.clientY;
    };

    const touchEnd = (e) => {
      e.preventDefault();
      const touchDuration = Date.now() - this.touchData.startTime;
      
      // Throw bubble if it was a quick tap without much movement
      if (!this.touchData.isDragging && touchDuration < this.touchData.tapThreshold) {
        this.throwBubble();
      }

      // Reset touch data
      this.touchData.startTime = 0;
      this.touchData.isDragging = false;
      this.keys['ArrowUp'] = false;
      this.dragDirection = null;
    };

    // Add event listeners
    this.canvas.addEventListener('touchstart', touchStart, { passive: false });
    this.canvas.addEventListener('touchmove', touchMove, { passive: false });
    this.canvas.addEventListener('touchend', touchEnd, { passive: false });
    
    // Mouse equivalents
    this.canvas.addEventListener('mousedown', touchStart);
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.touchData.startTime) touchMove(e);
    });
    this.canvas.addEventListener('mouseup', touchEnd);
    this.canvas.addEventListener('mouseleave', touchEnd);
  }

  handlePlayerHit() {
    this.lives--;
    this.invincibleTime = this.invincibleDuration;

    if (this.lives <= 0) {
      cancelAnimationFrame(this.animationFrame); // Stop game loop
      this.showGameOver();
    } else {
      // Reset player to starting position of current level
      const levelGrid = this.level.grid;
      levelGrid.forEach((row, rowIndex) => {
        row.split('').forEach((cell, colIndex) => {
          if (cell === '1') {
            this.player.x = colIndex * this.gridSize;
            this.player.y = rowIndex * this.gridSize;
          }
        });
      });
    }
  }

  showGameOver() {
    this.isGameOver = true;
    this.isGameEnding = true;

    const drawGameOver = () => {
      // Clear entire screen
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Scale text based on screen size
      const fontSize = Math.min(this.canvas.width, this.canvas.height) * 0.1;
      this.ctx.font = `bold ${fontSize}px Arial`;
      this.ctx.fillStyle = "white";

      // Game Over text
      const gameOverText = "Game Over!";
      const gameOverMetrics = this.ctx.measureText(gameOverText);
      this.ctx.fillText(gameOverText, 
        (this.canvas.width - gameOverMetrics.width) / 2, 
        this.canvas.height * 0.3);

      // Score text
      const scoreText = `Final Score: ${this.score}`;
      const scoreMetrics = this.ctx.measureText(scoreText);
      this.ctx.fillText(scoreText, 
        (this.canvas.width - scoreMetrics.width) / 2, 
        this.canvas.height * 0.5);

      // Draw restart button
      const buttonWidth = this.canvas.width * 0.6;
      const buttonHeight = fontSize * 2;
      const buttonX = (this.canvas.width - buttonWidth) / 2;
      const buttonY = this.canvas.height * 0.7;

      // Button background
      this.ctx.fillStyle = "#4CAF50";
      this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, buttonHeight/2);
      this.ctx.fill();

      // Button text
      this.ctx.fillStyle = "white";
      this.ctx.font = `bold ${fontSize * 0.8}px Arial`;
      const restartText = "Tap to Restart";
      const restartMetrics = this.ctx.measureText(restartText);
      this.ctx.fillText(restartText,
        (this.canvas.width - restartMetrics.width) / 2,
        buttonY + buttonHeight * 0.65);

      // Add click/touch handler for restart button
      const handleRestart = (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
          // Remove event listeners
          this.canvas.removeEventListener('touchstart', handleRestart);
          this.canvas.removeEventListener('mousedown', handleRestart);
          // Reset game
          location.reload();
        }
      };

      this.canvas.addEventListener('touchstart', handleRestart, { passive: false });
      this.canvas.addEventListener('mousedown', handleRestart);
    };

    // Initial draw and keep redrawing to ensure visibility
    drawGameOver();
  }

  spawnCollectible() {
    const type = this.collectibleTypes[Math.floor(Math.random() * this.collectibleTypes.length)];
    const validPositions = [];

    // Find valid spawn positions (empty spaces)
    this.level.grid.forEach((row, rowIndex) => {
      row.split('').forEach((cell, colIndex) => {
        if (cell === ' ') {
          validPositions.push({ x: colIndex, y: rowIndex });
        }
      });
    });

    if (validPositions.length > 0) {
      const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
      const collectible = new Collectible(
        pos.x * this.gridSize,
        pos.y * this.gridSize,
        this.gridSize * 0.8,
        type
      );
      this.collectibles.push(collectible);
    }
  }

  collectCollectible(index) {
    const collectible = this.collectibles[index];
    switch(collectible.type) {
      case 'cherry':
        this.score += 200;
        break;
      case 'strawberry':
        this.score += 500;
        break;
      case 'star':
        this.lives++;
        break;
    }
    this.collectibles.splice(index, 1);
  }
}

