import { createPlayer, updatePlayer, checkBarrelCollision } from './player.js';
import { loadLevel } from './levels.js';
import { render } from './renderer.js';
import { createBarrel, updateBarrels } from './barrels.js';
import './input.js';
import { showWinScreen, showGameOverScreen } from './ui.js';

const DEFAULT_BARREL_RELEASE_FREQUENCY = 100; // Default value
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 800;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    const windowAspectRatio = newWidth / newHeight;

    if (windowAspectRatio > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // Initial resize

  // Game state
  let currentLevel = 1;
  let score = 0;
  let lives = 3;
  let player;
  let barrels = [];

  let barrelTimer = 0;
  let isGameOver = false;
  let isGameWon = false;

  function init() {
    currentLevel = 1;
    score = 0;
    lives = 3;
    barrels = [];
    barrelTimer = 0;
    isGameOver = false;
    isGameWon = false;

    loadLevel(currentLevel).then(levelData => {
      player = createPlayer(levelData.player_start);
      window.player = player;
      gameLoop(levelData);
    });
  }

  function gameLoop(levelData) {
    if (isGameOver || isGameWon) {
      return;
    }

    updatePlayer(player, levelData);
    score += updateBarrels(barrels, levelData, player, canvas.height);

    barrelTimer++;
    if (barrelTimer > (levelData.barrel_release_frequency || DEFAULT_BARREL_RELEASE_FREQUENCY)) {
      barrels.push(createBarrel(levelData));
      barrelTimer = 0;
    }

    if (
      player.x < levelData.pauline_pos.x + 30 &&
      player.x + player.width > levelData.pauline_pos.x &&
      player.y < levelData.pauline_pos.y + 40 &&
      player.y + player.height > levelData.pauline_pos.y
    ) {
      isGameWon = true;
      showWinScreen(score);
      return;
    }

    if (checkBarrelCollision(player, barrels)) {
      lives--;
      if (lives > 0) {
        player.x = levelData.player_start.x;
        player.y = levelData.player_start.y;
      } else {
        isGameOver = true;
        showGameOverScreen(score);
        return;
      }
    }

    render(ctx, player, barrels, levelData, score, lives);

    requestAnimationFrame(() => gameLoop(levelData));
  }

  document.addEventListener('keydown', () => {
    if (isGameOver || isGameWon) {
      init();
    }
  });

  document.addEventListener('click', () => {
    if (isGameOver || isGameWon) {
      init();
    }
  });

  document.addEventListener('touchstart', () => {
    if (isGameOver || isGameWon) {
      init();
    }
  });

  init();
});