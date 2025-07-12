document.addEventListener('keydown', (e) => {
  const player = window.player; // Assuming player is a global for now
  if (!player) return;

  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
      player.dx = -player.speed;
      break;
    case 'ArrowRight':
    case 'd':
      player.dx = player.speed;
      break;
    case 'ArrowUp':
    case 'w':
      if (player.isOnLadder) {
        player.isClimbing = true;
        player.dy = -player.speed;
      } else if (!player.isJumping && player.currentPlatform && player.dy === 0) { // Only jump if on a platform
        player.dy = -400; // Jump strength
        player.isJumping = true;
      }
      break;
    case 'ArrowDown':
    case 's':
      if (player.isOnLadder) {
        player.isClimbing = true;
        player.dy = player.speed;
      }
      break;
    case ' ': // Space
      if (!player.isJumping && !player.isClimbing && player.currentPlatform && player.dy === 0) { // Only jump if on a platform
        player.dy = -400; // Jump strength
        player.isJumping = true;
      }
      break;
  }
});

document.addEventListener('keyup', (e) => {
  const player = window.player; // Assuming player is a global for now
  if (!player) return;

  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'ArrowRight':
    case 'd':
      player.dx = 0;
      break;
    case 'ArrowUp':
    case 'w':
    case 'ArrowDown':
    case 's':
      if (player.isClimbing) {
        player.dy = 0;
        player.isClimbing = false; // Stop climbing when key is released
      }
      break;
  }
});

import { GAME_WIDTH, GAME_HEIGHT } from './game.js';

// Touch and Drag Controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent scrolling
  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  touchStartX = (e.touches[0].clientX - rect.left) * scaleX;
  touchStartY = (e.touches[0].clientY - rect.top) * scaleY;
});

document.addEventListener('touchmove', (e) => {
  e.preventDefault(); // Prevent scrolling
  const player = window.player;
  if (!player) return;

  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const touchCurrentX = (e.touches[0].clientX - rect.left) * scaleX;
  const touchCurrentY = (e.touches[0].clientY - rect.top) * scaleY;

  const dx = touchCurrentX - touchStartX;
  const dy = touchCurrentY - touchStartY;

  // Horizontal movement
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      player.dx = player.speed;
      player.facing = 'right';
    } else {
      player.dx = -player.speed;
      player.facing = 'left';
    }
    player.isClimbing = false; // Stop climbing if horizontal drag
  } 
  // Vertical movement (climbing)
  else if (player.isOnLadder) {
    if (dy > 0) {
      player.dy = player.speed;
    } else {
      player.dy = -player.speed;
    }
    player.isClimbing = true;
    player.dx = 0; // Stop horizontal movement if climbing
  }
});

document.addEventListener('touchend', (e) => {
  const player = window.player;
  if (!player) return;

  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const touchEndX = (e.changedTouches[0].clientX - rect.left) * scaleX;
  const touchEndY = (e.changedTouches[0].clientY - rect.top) * scaleY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // If it was a tap (small movement), trigger jump
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    if (!player.isJumping && !player.isClimbing && player.currentPlatform && player.dy === 0) { // Only jump if on a platform
      player.dy = -400; // Jump strength
      player.isJumping = true;
    }
  }

  // Stop all movement
  player.dx = 0;
  player.dy = 0;
  player.isClimbing = false;
});