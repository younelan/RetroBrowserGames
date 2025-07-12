import { Platform } from './Platform.js';


export class Player {
  static WIDTH = 20;
  static HEIGHT = 30;
  static SPEED = 200; // pixels per second
  static JUMP_VELOCITY = -400; // initial jump velocity
  static GRAVITY = 800; // pixels per second squared

  constructor({ x, y, width = Player.WIDTH, height = Player.HEIGHT, speed = Player.SPEED }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;

    this.dx = 0; // velocity in x direction
    this.dy = 0; // velocity in y direction

    this.isJumping = false;
    this.isClimbing = false; // Ensure climbing is false at start
    this.isOnLadder = false;
    this.currentPlatform = null; // The platform the player is currently standing on

    this.facing = 'right'; // 'left' or 'right' for animation
    this.frame = 0; // Current animation frame
    this.animationTimer = 0;
    this.animationInterval = 100; // Milliseconds per frame
  }

  update(level, deltaTime) {
    const dt = deltaTime / 1000; // Convert deltaTime to seconds

    // Apply gravity
    if (!this.isClimbing) {
      this.dy += Player.GRAVITY * dt;
    }

    // Calculate potential next y position
    let nextY = this.y + this.dy * dt;

    // Update x position
    this.x += this.dx * dt;

    // Platform collision detection
    let onPlatform = false;
    let platformYToSnapTo = -1; // Initialize with an invalid value

    for (const platform of level.platforms) {
      // Check if player's horizontal bounds overlap with platform's horizontal bounds
      if (this.x < platform.end_x && this.x + this.width > platform.start_x) {
        const slope = (platform.end_y - platform.start_y) / (platform.end_x - platform.start_x);
        const playerCenterX = this.x + this.width / 2;
        const platformTopAtPlayerX = platform.start_y + slope * (playerCenterX - platform.start_x);

        // Define a small epsilon for floating point comparisons
        const EPSILON = 1; // Small tolerance

        // Check if player is falling (dy >= 0) and would land on this platform
        // This means the player's current bottom is above or at the platform top,
        // and the player's next bottom would be below or at the platform top.
        if (this.dy >= 0 &&
            this.y + this.height <= platformTopAtPlayerX + EPSILON && // Current bottom is above or at platform top
            nextY + this.height >= platformTopAtPlayerX - EPSILON) { // Next bottom is below or at platform top
          platformYToSnapTo = platformTopAtPlayerX;
          onPlatform = true;
          this.currentPlatform = platform;
          break; // Player is on a platform, no need to check others
        }
      }
    }

    if (onPlatform) {
      this.y = platformYToSnapTo - this.height; // Snap player to platform
      this.dy = 0; // Stop vertical movement
      this.isJumping = false;
    } else {
      this.y = nextY; // Apply the predicted y if no collision
      this.currentPlatform = null;
    }

    // Reset horizontal velocity if no input
    if (this.dx === 0) {
      this.animationTimer = 0;
      this.frame = 0;
    } else {
      this.animationTimer += deltaTime;
      if (this.animationTimer > this.animationInterval) {
        this.frame = (this.frame + 1) % 2; // Cycle between 0 and 1 for walking animation
        this.animationTimer = 0;
      }
    }

    // Ladder collision detection and climbing logic
    this.isOnLadder = false;
    for (const ladder of level.ladders) {
      // Check for horizontal overlap between player and ladder
      // And if player's vertical bounds overlap with ladder's vertical bounds
      if (this.x < ladder.x + ladder.width &&
          this.x + this.width > ladder.x &&
          this.y + this.height > ladder.top_y &&
          this.y < ladder.bottom_y) {
        this.isOnLadder = true;
        break;
      }
    }

    // If not on a ladder, cannot be climbing
    if (!this.isOnLadder && this.isClimbing) {
      this.isClimbing = false;
      this.dy = 0; // Stop vertical movement if player moves off a ladder
    }

    // Prevent player from going off screen horizontally (basic boundary)
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x + this.width > level.virtualWidth) {
      this.x = level.virtualWidth - this.width;
    }

    // Prevent player from going off screen vertically (basic boundary for falling)
    if (this.y + this.height > level.virtualHeight) {
      this.y = level.virtualHeight - this.height;
      this.dy = 0;
      this.isJumping = false;
    }
  }

  render(ctx, scale) {
    // Pass the player object and scale to the drawPlayer function from graphics.js
    const x = this.x * scale;
    const y = this.y * scale;
    const width = this.width * scale;
    const height = this.height * scale;

    ctx.save();
    if (this.facing === 'left') {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.translate(-(x + width), -y);
    }

    // Body (overalls)
    ctx.fillStyle = '#0000ff'; // Blue
    ctx.fillRect(x, y + height * 0.4, width, height * 0.6);

    // Shirt
    ctx.fillStyle = '#ff0000'; // Red
    ctx.fillRect(x, y, width, height * 0.5);

    // Head
    ctx.fillStyle = '#f0c0a0'; // Skin color
    ctx.fillRect(x + width * 0.1, y - height * 0.3, width * 0.8, height * 0.4);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(x + width * 0.25, y - height * 0.2, width * 0.1, height * 0.05);
    ctx.fillRect(x + width * 0.55, y - height * 0.2, width * 0.1, height * 0.05);
    ctx.fillStyle = 'black';
    ctx.fillRect(x + width * 0.28, y - height * 0.18, width * 0.04, height * 0.02);
    ctx.fillRect(x + width * 0.58, y - height * 0.18, width * 0.04, height * 0.02);

    // Hat
    ctx.fillStyle = '#ff0000'; // Red
    ctx.fillRect(x, y - height * 0.4, width, height * 0.15);
    ctx.fillRect(x + width * 0.7, y - height * 0.5, width * 0.3, height * 0.2);

    // Moustache
    ctx.fillStyle = '#4B3621'; // Brown
    ctx.fillRect(x + width * 0.2, y + height * 0.1, width * 0.6, height * 0.05);

    // Legs
    ctx.fillStyle = '#0000ff'; // Blue
    ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.3, height * 0.2);
    ctx.fillRect(x + width * 0.6, y + height * 0.8, width * 0.3, height * 0.2);

    // Arms (simple, will animate later)
    ctx.fillStyle = '#ff0000'; // Red
    ctx.fillRect(x - width * 0.2, y + height * 0.4, width * 0.4, height * 0.4);
    ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.4, height * 0.4);

    // Animation for walking
    if (this.dx !== 0) {
      if (this.frame === 0) {
        // Leg forward
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(x + width * 0.6, y + height * 0.8, width * 0.3, height * 0.2);
        // Arm forward
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.4, height * 0.4);
      } else {
        // Leg back
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.3, height * 0.2);
        // Arm back
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - width * 0.2, y + height * 0.4, width * 0.4, height * 0.4);
      }
    }

    ctx.restore();
  }

  // Input handling methods (called from InputHandler)
  moveLeft() {
    this.dx = -this.speed;
    this.facing = 'left';
  }

  moveRight() {
    this.dx = this.speed;
    this.facing = 'right';
  }

  stopMovingX() {
    this.dx = 0;
  }

  jump() {
    if (!this.isJumping && !this.isClimbing) {
      this.dy = Player.JUMP_VELOCITY;
      this.isJumping = true;
    }
  }

  climbUp() {
    if (this.isOnLadder) {
      this.isClimbing = true;
      this.dy = -this.speed * 0.7; // Slower climbing speed
      this.dx = 0; // Stop horizontal movement while climbing
    }
  }

  climbDown() {
    if (this.isOnLadder) {
      this.isClimbing = true;
      this.dy = this.speed * 0.7; // Slower climbing speed
      this.dx = 0; // Stop horizontal movement while climbing
    }
  }

  stopClimbing() {
    this.isClimbing = false;
    if (this.isOnLadder) {
      this.dy = 0; // Stop vertical movement if still on ladder but stopped climbing
    }
  }

  collidesWith(gameObject) {
    // Basic AABB collision detection
    return (
      this.x < gameObject.x + gameObject.width &&
      this.x + this.width > gameObject.x &&
      this.y < gameObject.y + gameObject.height &&
      this.y + this.height > gameObject.y
    );
  }
}