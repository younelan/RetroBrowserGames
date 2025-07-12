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
      } else if (!player.isJumping) { // Allow jump if not on ladder
        player.dy = -7; // Jump strength for barrels
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
      if (!player.isJumping && !player.isClimbing) {
        player.dy = -7; // Jump strength for barrels
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

// Touch and Drag Controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', (e) => {
  const player = window.player;
  if (!player) return;

  const touchCurrentX = e.touches[0].clientX;
  const touchCurrentY = e.touches[0].clientY;

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

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // If it was a tap (small movement), trigger jump
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    if (!player.isJumping && !player.isClimbing) {
      player.dy = -7; // Jump strength
      player.isJumping = true;
    }
  }

  // Stop all movement
  player.dx = 0;
  player.dy = 0;
  player.isClimbing = false;
});