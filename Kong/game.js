import { createPlayer, updatePlayer, checkBarrelCollision } from './player.js';
import { loadLevel } from './levels.js';
import { render } from './renderer.js';
import { createBarrel, updateBarrels } from './barrels.js';
import './input.js';

const DEFAULT_BARREL_RELEASE_FREQUENCY = 100; // Default value

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 800;
  canvas.height = 800;

  // Game state
  let currentLevel = 1;
  let score = 0;
  let lives = 3;
  let player;
  let barrels = [];

  let barrelTimer = 0;

  function init() {
    // Load level data
    loadLevel(currentLevel).then(levelData => {
      // Initialize game objects
      player = createPlayer(levelData.player_start);
      window.player = player; // Make player global for input.js

      // Start the game loop
      gameLoop(levelData);
    });
  }

  function gameLoop(levelData) {
    // Update game logic
    updatePlayer(player, levelData);
    score += updateBarrels(barrels, levelData, player, canvas.height);

    // Spawn new barrels
    barrelTimer++;
    if (barrelTimer > (levelData.barrel_release_frequency || DEFAULT_BARREL_RELEASE_FREQUENCY)) { // Spawn a barrel every X frames
      barrels.push(createBarrel(levelData));
      barrelTimer = 0;
    }

    // Check for win condition
    if (
      player.x < levelData.pauline_pos.x + 30 &&
      player.x + player.width > levelData.pauline_pos.x &&
      player.y < levelData.pauline_pos.y + 40 &&
      player.y + player.height > levelData.pauline_pos.y
    ) {
      alert('You win!');
      return;
    }

    // Check for collisions
    if (checkBarrelCollision(player, barrels)) {
      lives--;
      if (lives > 0) {
        // Reset player position
        player.x = levelData.player_start.x;
        player.y = levelData.player_start.y;
      } else {
        // Game over
        alert('Game Over');
        // You might want to restart the game or show a game over screen here
        return;
      }
    }

    // Render the game
    render(ctx, player, barrels, levelData, score, lives);

    // Request the next frame
    requestAnimationFrame(() => gameLoop(levelData));
  }

  init();
});