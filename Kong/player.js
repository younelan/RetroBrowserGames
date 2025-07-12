export function createPlayer(startPosition) {
  return {
    x: startPosition.x,
    y: startPosition.y,
    width: 20,
    height: 30, // Make Mario taller
    speed: 3,
    dx: 0,
    dy: 0,
    isJumping: false,
    isClimbing: false,
    isOnLadder: false,
    currentLadderX: null, // Store the x-position of the ladder Mario is on
    frame: 0, // Current animation frame
    facing: 'right', // 'left' or 'right'
    animationTimer: 0,
  };
}

export function updatePlayer(player, levelData) {
  // Apply gravity
  if (!player.isClimbing && !player.isOnLadder) {
    player.dy += 0.4; // Reduced gravity
  }

  // Move the player
  player.x += player.dx;
  player.y += player.dy;

  // Collision detection with platforms
  levelData.platforms.forEach(platform => {
    const { start_x, start_y, end_x, end_y } = platform;
    const player_bottom = player.y + player.height;

    // Check for collision
    if (player.x + player.width > start_x && player.x < end_x) {
      const slope = (end_y - start_y) / (end_x - start_x);
      const y_on_platform = start_y + slope * (player.x - start_x);

      if (player_bottom > y_on_platform && player_bottom < y_on_platform + 10) { // Increased tolerance
        player.dy = 0;
        player.isJumping = false;
        player.y = y_on_platform - player.height;
      }
    }
  });

  // Ladder collision and climbing logic
  let wasOnLadder = player.isOnLadder; // Store previous state
  player.isOnLadder = false;
  player.currentLadderX = null; // Reset current ladder x

  levelData.ladders.forEach(ladder => {
    if (
      player.x + player.width > ladder.x &&
      player.x < ladder.x + 20 && // 20 is ladder width
      player.y + player.height > ladder.top_y - player.height / 2 && // Allow grabbing from above
      player.y < ladder.bottom_y
    ) {
      player.isOnLadder = true;
      player.currentLadderX = ladder.x; // Store ladder x
    }
  });

  if (player.isOnLadder) {
    // If player just got on ladder, snap to ladder x
    if (!wasOnLadder && (player.dy > 0 || player.dy < 0)) {
      player.x = player.currentLadderX + 10 - player.width / 2; // Center on ladder using stored x
    }
    player.isJumping = false; // Cannot jump on ladder
    // Only stop vertical movement if not actively climbing
    if (!player.isClimbing) {
      player.dy = 0;
    }
  } else {
    player.isClimbing = false; // Not on ladder, so not climbing
  }
}

export function checkBarrelCollision(player, barrels) {
  for (const barrel of barrels) {
    if (
      player.x < barrel.x + barrel.width &&
      player.x + player.width > barrel.x &&
      player.y < barrel.y + barrel.height &&
      player.y + player.height > barrel.y
    ) {
      // Collision detected
      return true;
    }
  }
  return false;
}