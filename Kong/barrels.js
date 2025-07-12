const DEFAULT_BARREL_SPEED = 150; // Adjusted default value

export function createBarrel(levelData) {
  return {
    x: levelData.dk_pos.x + 60, // Offset from DK's position
    y: levelData.dk_pos.y + 80, // Start below DK's platform
    width: 20,
    height: 20,
    speed: levelData.barrel_speed || DEFAULT_BARREL_SPEED,
    dx: levelData.barrel_speed || DEFAULT_BARREL_SPEED, // Start rolling right
    dy: -100, // Small initial upward velocity for the arc
    jumpedOver: false,
    ignoreDKPlatform: true, // New flag to ignore DK's platform initially
  };
}

export function updateBarrels(barrels, levelData, player, canvasHeight, deltaTime) {
  let pointsEarned = 0;
  const dt = deltaTime / 1000; // Convert deltaTime to seconds

  for (let i = barrels.length - 1; i >= 0; i--) {
    const barrel = barrels[i];

    // Disable ignoreDKPlatform once barrel is below DK's platform
    if (barrel.ignoreDKPlatform && barrel.y > levelData.dk_pos.y + 100) {
      barrel.ignoreDKPlatform = false;
    }

    // Apply gravity
    barrel.dy += 800 * dt;

    // Move the barrel
    barrel.x += barrel.dx * dt;
    barrel.y += barrel.dy * dt;

    // Check if player jumped over the barrel
    if (!barrel.jumpedOver && player.y + player.height < barrel.y && player.x > barrel.x && player.x < barrel.x + barrel.width) {
      barrel.jumpedOver = true;
      pointsEarned += 100;
    }

    // Platform collision detection
    let onPlatform = false;
    levelData.platforms.forEach(platform => {
      // Skip collision with DK's platform if ignoreDKPlatform is true
      if (barrel.ignoreDKPlatform && platform.start_y === 200 && platform.end_y === 200) {
        return; 
      }

      const { start_x, start_y, end_x, end_y } = platform;
      const barrel_bottom = barrel.y + barrel.height;
      const barrel_center_x = barrel.x + barrel.width / 2;

      // Check if barrel is horizontally on the platform
      if (barrel_center_x >= start_x && barrel_center_x <= end_x && barrel.dy >= 0) {
        // Calculate y position on platform
        const slope = (end_y - start_y) / (end_x - start_x);
        const y_on_platform = start_y + slope * (barrel_center_x - start_x);

        // Check if barrel is landing on platform
        if (barrel_bottom >= y_on_platform && barrel_bottom <= y_on_platform + 10) {
          onPlatform = true;
          barrel.dy = 0;
          barrel.y = y_on_platform - barrel.height;

          // Determine roll direction based on platform slope (screen coordinates: bigger Y = lower)
          if (start_y > end_y + 1) { // Left Y is bigger = left side is lower - roll left (toward lower side)
            barrel.dx = -barrel.speed;
          } else if (start_y < end_y - 1) { // Left Y is smaller = right side is lower - roll right (toward lower side)
            barrel.dx = barrel.speed;
          } else { // Flat platform - maintain or set default direction
            if (Math.abs(barrel.dx) < 10) { // If nearly stopped, default to right
              barrel.dx = barrel.speed;
            }
          }
        }
      }
    });

    // If not on platform, continue falling
    if (!onPlatform && barrel.dy === 0) {
      barrel.dy = 50; // Start falling again
    }

    // Remove barrels that fall off screen
    if (barrel.y > canvasHeight) {
      barrels.splice(i, 1);
    }
  }
  return pointsEarned;
}