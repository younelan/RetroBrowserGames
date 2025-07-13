// document.addEventListener('DOMContentLoaded', () => {

import { Level } from './level.js';
import { Barrel } from './Barrel.js';
import { showWinScreen, showGameOverScreen } from './ui.js';
import { LEVELS } from './levels.js';
import './input.js';

export const START_LIVES = 5;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 800;

export class Game {
  constructor(canvas, levelData, levelIndex = 0) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Calculate scale based on canvas size and virtual game size
    const virtualWidth = levelData.virtualWidth || 800;
    const virtualHeight = levelData.virtualHeight || 800;
    // Use the actual canvas size for scaling
    this.resizeCanvas();
    const scale = Math.min(this.canvas.width / virtualWidth, this.canvas.height / virtualHeight);
    this.level = new Level(levelData, scale);
    this.score = 0;
    this.lives = START_LIVES;
    this.isGameOver = false;
    this.isGameWon = false;
    this.lastTime = 0;
    this.animationFrame = 0;
    this.barrelTimer = 0;
    this.levelIndex = levelIndex;
    this._winHandled = false;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    // Make the canvas fill the window while maintaining aspect ratio
    const size = Math.min(window.innerWidth, window.innerHeight);
    this.canvas.width = size;
    this.canvas.height = size;
  }

  start() {
    this.score = 0;
    this.lives = START_LIVES;
    this.isGameOver = false;
    this.isGameWon = false;
    this.lastTime = 0;
    this.animationFrame = 0;
    this.barrelTimer = 0;
    this._spawnProtectTime = null; // Reset spawn protection
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  gameLoop(timestamp) {
    if (this.isGameOver || this.isGameWon) return;
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.animationFrame++;
    this.level.update(deltaTime);
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
            let nextLevel = this.levelIndex + 1;
            window.game = new Game(this.canvas, LEVELS[nextLevel], nextLevel);
            window.game.start();
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
    this.level.render(this.ctx);
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
}