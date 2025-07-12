const DEFAULT_BARREL_SPEED = 2; // Default value

export function createBarrel(levelData) {
  return {
    x: levelData.dk_pos.x + 60, // Offset from DK's position
    y: levelData.dk_pos.y + 80, // Start below DK's platform (DK is at y=120, platform at y=200)
    width: 20,
    height: 20,
    speed: levelData.barrel_speed || DEFAULT_BARREL_SPEED,
    dx: 5, // Horizontal velocity for the arc
    dy: -2, // Small initial upward velocity for the arc, gravity will pull it down
    jumpedOver: false,
    ignoreDKPlatform: true, // New flag to ignore DK's platform initially
  };
}

export function updateBarrels(barrels, levelData, player, canvasHeight) {
  let pointsEarned = 0;
  for (let i = barrels.length - 1; i >= 0; i--) {
    const barrel = barrels[i];

    // Disable ignoreDKPlatform once barrel is below DK's platform
    if (barrel.ignoreDKPlatform && barrel.y > levelData.dk_pos.y + 100) { // DK is at y=120, platform at y=200
      barrel.ignoreDKPlatform = false;
    }

    // Apply gravity
    barrel.dy += 0.5;

    // Move the barrel
    barrel.x += barrel.dx;
    barrel.y += barrel.dy;

    // Check if player jumped over the barrel
    if (!barrel.jumpedOver && player.y + player.height < barrel.y && player.x > barrel.x && player.x < barrel.x + barrel.width) {
      barrel.jumpedOver = true;
      pointsEarned += 100;
    }

    let currentPlatform = null;
    levelData.platforms.forEach(platform => {
      // Skip collision with DK's platform if ignoreDKPlatform is true
      // Assuming DK's platform is the one at y=200
      if (barrel.ignoreDKPlatform && platform.start_y === 200 && platform.end_y === 200) {
        return; 
      }

      const { start_x, start_y, end_x, end_y } = platform;
      const barrel_bottom = barrel.y + barrel.height;

      const effective_start_x = Math.min(start_x, end_x);
      const effective_end_x = Math.max(start_x, end_x);

      if (barrel.x + barrel.width > effective_start_x && barrel.x < effective_end_x) {
        const platform_length = end_x - start_x;
        const platform_height_diff = end_y - start_y;
        const slope = platform_length !== 0 ? platform_height_diff / platform_length : 0;

        let y_on_platform;
        if (platform_length === 0) {
          y_on_platform = start_y;
        } else {
          y_on_platform = start_y + slope * (barrel.x - start_x);
        }

        if (barrel_bottom > y_on_platform && barrel_bottom < y_on_platform + 20 && barrel.dy >= 0) {
          currentPlatform = platform;
          barrel.dy = 0;
          barrel.y = y_on_platform - barrel.height;

          // Adjust barrel direction based on platform incline
          const slope_threshold = 0.05; // To account for minor floating point differences

          if (start_y < end_y - slope_threshold) { // Left side is lower than right side (slopes down to the right)
            barrel.dx = barrel.speed; // Force barrel to roll right
          } else if (start_y > end_y + slope_threshold) { // Left side is higher than right side (slopes down to the left)
            barrel.dx = -barrel.speed; // Force barrel to roll left
          } else { // Relatively flat platform
            // If on a flat platform, maintain current direction or default if stopped
            if (barrel.dx === 0) {
              barrel.dx = barrel.speed; // Default to right if stopped
            }
          }
        }
      }
    });

    // If barrel is not on any platform, or has rolled off the edge of its current platform
    if (!currentPlatform) {
      // If it was previously on a platform and now isn't, let it fall
      if (barrel.dy === 0) {
        barrel.dy = 0.5; // Re-apply gravity
      }
    } else {
      // Check if barrel has rolled off the current platform's horizontal bounds
      const { start_x, end_x } = currentPlatform;
      const effective_start_x = Math.min(start_x, end_x);
      const effective_end_x = Math.max(start_x, end_x);

      if (barrel.x + barrel.width < effective_start_x || barrel.x > effective_end_x) {
        currentPlatform = null; // Barrel is no longer on this platform
        barrel.dy = 0.5; // Make it fall
      }
    }

    // Remove barrels that fall off screen
    if (barrel.y > canvasHeight) {
      barrels.splice(i, 1);
    }
  }
  return pointsEarned;
}