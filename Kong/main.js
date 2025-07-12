import { Game } from './game.js';
import { InputHandler } from './InputHandler.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gameCanvas');
  // Load level JSON (assume 1-level.json for now)
  const resp = await fetch('1-level.json');
  const levelData = await resp.json();
  const game = new Game(canvas, levelData);
  new InputHandler(game);
  window.game = game;
  game.start();
});
