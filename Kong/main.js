import { Game } from './game.js';
import { InputHandler } from './InputHandler.js';
import { LEVELS, START_LEVEL } from './levels.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gameCanvas');
  // Load all levels from levels.js
  let currentLevel = START_LEVEL;
  let game = new Game(canvas);
  let inputHandler = new InputHandler(game);
  window.game = game;
  game.loadLevel(LEVELS[currentLevel], currentLevel);
  game.start();

  // Add keyboard shortcut to switch levels for testing
  window.addEventListener('keydown', (e) => {
    if (e.key === 'n') { // Press 'n' for next level
      currentLevel = (currentLevel + 1) % LEVELS.length;
      game = new Game(canvas, LEVELS[currentLevel], currentLevel);
      inputHandler.detachEvents();
      inputHandler = new InputHandler(game);
      window.game = game;
      game.start();
    }
    if (e.key === 'p') { // Press 'p' for previous level
      currentLevel = (currentLevel - 1 + LEVELS.length) % LEVELS.length;
      game = new Game(canvas, LEVELS[currentLevel], currentLevel);
      inputHandler.detachEvents();
      inputHandler = new InputHandler(game);
      window.game = game;
      game.start();
    }
  });

  let restartHandler = (e) => {
    if (window._winScreenActive || window._gameOverScreenActive) {
      // Restart the game at the first level
      currentLevel = 0;
      game = new Game(canvas, LEVELS[currentLevel], currentLevel);
      inputHandler.detachEvents();
      inputHandler = new InputHandler(game);
      window.game = game;
      game.start();
      window._winScreenActive = false;
      window._gameOverScreenActive = false;
    }
  };
  window.addEventListener('keydown', restartHandler);
  window.addEventListener('mousedown', restartHandler);
  window.addEventListener('touchstart', restartHandler);
});
