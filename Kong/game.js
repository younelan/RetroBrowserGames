import { Level } from './level.js';
import { Barrel } from './Barrel.js';
import { showWinScreen, showGameOverScreen } from './ui.js';
import { LEVELS } from './levels.js';

export const START_LIVES = 5;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 800;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.score = 0;
    this.lives = START_LIVES;
    this.isGameOver = false;
    this.isGameWon = false;
    this.lastTime = 0;
    this.animationFrame = 0;
    this.barrelTimer = 0;
    this.levelIndex = 0;
    this._winHandled = false;
    this._spawnProtectTime = null;
    this._pendingRespawn = false;
    this._pendingRespawnTime = 0;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    this.canvas.width = size;
    this.canvas.height = size;
  }

  loadLevel(levelData, levelIndex) {
    this.level = new Level(levelData, this.canvas.width / (levelData.virtualWidth || GAME_WIDTH));
    this.levelIndex = levelIndex;
    this.barrelTimer = 0; // Reset barrel timer for new level
    this._spawnProtectTime = null; // Reset spawn protection for new level
    this._pendingRespawn = false;
    this._pendingRespawnTime = 0;
    this._winHandled = false; // Reset win handled flag for new level

    // Ensure player is unfrozen and visible when loading a new level
    if (this.level && this.level.player) {
      this.level.player.fading = false;
      this.level.player.fadeAlpha = 1;
      this.level.player.fadeTimer = 0;
    }
  }

  start() {
    // Only reset score and lives if starting a new game from scratch
    if (this.isGameOver || this.isGameWon) {
      this.score = 0;
      this.lives = START_LIVES;
      this.isGameOver = false;
      this.isGameWon = false;
    }
    // Load the initial level if not already loaded
    if (!this.level) {
        this.loadLevel(LEVELS[this.levelIndex], this.levelIndex);
    }
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  gameLoop(timestamp) {
    if (this.isGameOver || this.isGameWon) return;
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.animationFrame++;
    // Clear the canvas before rendering
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.level.update(deltaTime);
    // Barrel spawn logic
    this.barrelTimer += deltaTime;
    if (this.barrelTimer > (this.level.barrel_release_frequency || 100) * 10) {
      this.level.barrels.push(new Barrel({
        x: this.level.kong.x + 60,
        y: this.level.kong.y + 80,
        dx: this.level.barrel_speed || 100,
        dy: -100
      }));
      this.barrelTimer = 0;
    }

    // --- SPAWN PROTECTION: Prevent instant death for 1.2s after spawn or level start ---
    if (!this._spawnProtectTime) this._spawnProtectTime = timestamp;
    const spawnProtect = (timestamp - this._spawnProtectTime < 1200);

    // Win condition
    if (
      this.level.player.x < this.level.damsel.x + 30 &&
      this.level.player.x + this.level.player.width > this.level.damsel.x &&
      this.level.player.y < this.level.damsel.y + 40 &&
      this.level.player.y + this.level.player.height > this.level.damsel.y
    ) {
      this.isGameWon = true;
      if (!this._winHandled) {
        this._winHandled = true;
        if (this.levelIndex < LEVELS.length - 1) {
          setTimeout(() => {
            this.levelIndex++;
            this.loadLevel(LEVELS[this.levelIndex], this.levelIndex);
            this.start(); // Restart game loop for new level
          }, 500);
        } else {
          showWinScreen(this.score);
        }
      }
      return;
    }

    // Barrel collision (ignore if spawn protected or player is fading)
    if (!spawnProtect && !this.level.player.isFrozen()) {
      for (const barrel of this.level.barrels) {
        if (this.level.player.collidesWith(barrel)) {
          this.lives--;
          if (this.lives < 0) this.lives = 0;
          if (this.lives > 0) {
            // Fade out, then respawn after fade
            this.level.player.triggerFade();
            this._pendingRespawn = true;
            this._pendingRespawnTime = timestamp + this.level.player.FADE_DURATION;
          } else {
            this.isGameOver = true;
            showGameOverScreen(this.score);
            return;
          }
          break;
        }
      }
    }

    // Handle pending respawn after fade
    if (this._pendingRespawn && timestamp >= this._pendingRespawnTime) {
      this.level.player.x = this.level.player_start.x;
      this.level.player.y = this.level.player_start.y - (this.level.player.height - 30);
      this.level.player.dx = 0;
      this.level.player.dy = 0;
      this._spawnProtectTime = timestamp;
      this._pendingRespawn = false;
    }

    // Update player (skip input/movement if frozen)
    if (!this.level.player.isFrozen()) {
      // ...existing code for input, movement, etc...
    }

    // --- RENDER: Draw everything including UI ---
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.level.render(this.ctx, this.animationFrame);
    // Draw UI: Emojis only, plus level name in HUD
    this.ctx.save();
    this.ctx.font = '28px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`🏆${this.score}`, 10, 32);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`❤️${this.lives}`, this.canvas.width - 10, 32);
    this.ctx.textAlign = 'center';
    this.ctx.font = '32px Arial';
    this.ctx.fillText(`🗺️${this.levelIndex + 1}  ${this.level.name ? ' ' + this.level.name : ''}`, this.canvas.width / 2, 32);
    this.ctx.restore();

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  restoreLife() {
    if (this.lives < START_LIVES) {
      this.lives++;
    }
  }

  addScore(points) {
    this.score += points;
  }

  // Player control wrappers for InputHandler
  movePlayerLeft() {
    if (this.level && this.level.player) {
      this.level.player.moveLeft();
    }
  }

  movePlayerRight() {
    if (this.level && this.level.player) {
      this.level.player.moveRight();
    }
  }

  stopPlayerMovingX() {
    if (this.level && this.level.player) {
      this.level.player.stopMovingX();
    }
  }

  jumpPlayer() {
    if (this.level && this.level.player) {
      this.level.player.jump();
    }
  }

  climbPlayerUp() {
    if (this.level && this.level.player) {
      this.level.player.climbUp();
    }
  }

  climbPlayerDown() {
    if (this.level && this.level.player) {
      this.level.player.climbDown();
    }
  }
  stopPlayerClimbing() {
    if (this.level && this.level.player) {
      this.level.player.stopClimbing();
    }
  }
}