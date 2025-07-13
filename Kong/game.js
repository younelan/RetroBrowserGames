// document.addEventListener('DOMContentLoaded', () => {
import { Level } from './level.js';
import { Barrel } from './Barrel.js';
import { showWinScreen, showGameOverScreen } from './ui.js';
import { LEVELS } from './levels.js';
import './input.js';

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
    this.lives = 3;
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
    this.lives = 3;
    this.isGameOver = false;
    this.isGameWon = false;
    this.lastTime = 0;
    this.animationFrame = 0;
    this.barrelTimer = 0;
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
    // Barrel spawn logic (should create Barrels, not Players)
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
        // If not last level, skip win screen and go straight to next level
        if (this.levelIndex < LEVELS.length - 1) {
          setTimeout(() => {
            let nextLevel = this.levelIndex + 1;
            window.game = new Game(this.canvas, LEVELS[nextLevel], nextLevel);
            window.game.start();
          }, 500); // short delay for smoothness
        } else {
          // Last level: show win screen
          showWinScreen(this.score);
        }
      }
      return;
    }
    // Barrel collision
    for (const barrel of this.level.barrels) {
      if (this.level.player.collidesWith(barrel)) {
        this.lives--;
        if (this.lives > 0) {
          this.level.player.x = this.level.player.x;
          this.level.player.y = this.level.player.y;
        } else {
          this.isGameOver = true;
          showGameOverScreen(this.score);
          return;
        }
      }
    }
    this.level.render(this.ctx);
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }
}