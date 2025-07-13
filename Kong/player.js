import { Platform } from './Platform.js';


export class Player {
  static WIDTH = 40;
  static HEIGHT = 60;
  static SPEED = 200; // pixels per second
  static JUMP_VELOCITY = -400; // initial jump velocity
  static GRAVITY = 800; // pixels per second squared
  static LADDER_TOLERANCE = 5; // pixels of horizontal tolerance for ladder collision

  constructor({ x, y, width = Player.WIDTH, height = Player.HEIGHT, speed = Player.SPEED }) {
    this.x = x;
    // Shift y upward by the increase in height so feet stay in the same place
    this.y = y - (Player.HEIGHT - 30); // 30 is the old height
    this.width = width;
    this.height = height;
    this.speed = speed;

    this.dx = 0; // velocity in x direction
    this.dy = 0; // velocity in y direction

    this.isJumping = false;
    this.isClimbing = false; // Ensure climbing is false at start
    this.isOnLadder = false;
    this.isOnLadderBelow = false; // New flag: true if there's a ladder segment below the player
    this.currentPlatform = null; // The platform the player is currently standing on
    this.isDroppingThroughPlatform = false; // New flag for dropping through platforms
    this.dropThroughTimer = 0; // Timer for dropping through platforms
    this.DROP_THROUGH_DURATION = 200; // ms to ignore platform collisions when dropping

    this.facing = 'right'; // 'left' or 'right' for animation
    this.frame = 0; // Current animation frame
    this.animationTimer = 0;
    this.animationInterval = 100; // Milliseconds per frame

    this.fading = false;
    this.fadeAlpha = 1;
    this.fadeTimer = 0;
    this.FADE_DURATION = 1000; // ms
  }

  triggerFade() {
    this.fading = true;
    this.fadeAlpha = 1;
    this.fadeTimer = this.FADE_DURATION;
  }

  isFrozen() {
    return this.fading;
  }

  update(level, deltaTime) {
    if (this.fading) {
      // Only update fade logic, skip all movement and input
      this.fadeTimer -= deltaTime;
      if (this.fadeTimer > this.FADE_DURATION / 2) {
        // Fade out
        this.fadeAlpha = (this.fadeTimer - this.FADE_DURATION / 2) / (this.FADE_DURATION / 2);
      } else if (this.fadeTimer > 0) {
        // Fade in
        this.fadeAlpha = 1 - (this.fadeTimer / (this.FADE_DURATION / 2));
      } else {
        this.fading = false;
        this.fadeAlpha = 1;
      }
      return;
    }

    const dt = deltaTime / 1000; // Convert deltaTime to seconds

    // Update drop through timer
    if (this.isDroppingThroughPlatform) {
      this.dropThroughTimer -= deltaTime;
      if (this.dropThroughTimer <= 0) {
        this.isDroppingThroughPlatform = false;
      }
    }

    // Determine if player is currently on a ladder or has a ladder below
    this.isOnLadder = false;
    this.isOnLadderBelow = false;
    for (const ladder of level.ladders) {
      // Check for horizontal overlap between player and ladder with tolerance
      const horizontalOverlap = (this.x + this.width > ladder.x - Player.LADDER_TOLERANCE &&
                                 this.x < ladder.x + ladder.width + Player.LADDER_TOLERANCE);

      // Check if player is vertically within the ladder bounds
      const verticalOverlap = (this.y + this.height > ladder.top_y &&
                               this.y < ladder.bottom_y);

      if (horizontalOverlap && verticalOverlap) {
        this.isOnLadder = true;
      }

      // Check if there's a ladder segment below the player's feet
      // Player's feet are above or at ladder top, and ladder extends below player
      if (horizontalOverlap &&
          this.y + this.height <= ladder.bottom_y &&
          this.y + this.height + 5 >= ladder.top_y) { // Check a few pixels below player for ladder top
        this.isOnLadderBelow = true;
      }
    }

    // Handle vertical movement based on climbing state
    if (this.isClimbing) {
      // dy is set by climbUp/climbDown methods
      // No gravity when actively climbing
      // If player moves off ladder while climbing, stop climbing
      if (!this.isOnLadder) {
        this.isClimbing = false;
        this.dy = 0; // Reset dy so gravity can take over
      }
    } else if (this.isOnLadder) {
      // If on a ladder but not actively climbing, stop vertical movement
      this.dy = 0;
    } else {
      // If not climbing and not on a ladder, apply gravity
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
      // If actively dropping through a platform, skip collision with the current platform
      if (this.isDroppingThroughPlatform && platform === this.currentPlatform) {
        continue; // Skip this platform for collision detection
      }

      // Check if player's horizontal bounds overlap with platform's horizontal bounds
      if (this.x < platform.end_x && this.x + this.width > platform.start_x) {
        const slope = (platform.end_y - platform.start_y) / (platform.end_x - platform.start_x);
        const playerCenterX = this.x + this.width / 2;
        const platformTopAtPlayerX = platform.start_y + slope * (playerCenterX - platform.start_x);

        const EPSILON = 1; // Small tolerance

        if (this.dy >= 0 &&
            this.y + this.height <= platformTopAtPlayerX + EPSILON &&
            nextY + this.height >= platformTopAtPlayerX - EPSILON) {
          platformYToSnapTo = platformTopAtPlayerX;
          onPlatform = true;
          this.currentPlatform = platform;
          this.isJumping = false;
          this.dy = 0;
          break;
        }
      }
    }

    // Apply vertical movement after checking all platforms
    if (onPlatform) {
      this.y = platformYToSnapTo - this.height;
      this.isDroppingThroughPlatform = false; // Reset flag when landing on a platform
    } else {
      this.y = nextY;
      this.currentPlatform = null;
    }

    // Reset horizontal velocity if no input
    if (this.dx === 0) {
      this.animationTimer = 0;
      this.frame = 0;
    } else {
      this.animationTimer += deltaTime;
      if (this.animationTimer > this.animationInterval) {
        this.frame = (this.frame + 1) % 2;
        this.animationTimer = 0;
      }
    }

    // If not on a ladder, cannot be climbing
    if (!this.isOnLadder && this.isClimbing) {
      this.isClimbing = false;
      // Gravity will naturally take over here
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

    // Fade logic
    if (this.fading) {
      this.fadeTimer -= deltaTime;
      if (this.fadeTimer > this.FADE_DURATION / 2) {
        // Fade out
        this.fadeAlpha = (this.fadeTimer - this.FADE_DURATION / 2) / (this.FADE_DURATION / 2);
      } else if (this.fadeTimer > 0) {
        // Fade in
        this.fadeAlpha = 1 - (this.fadeTimer / (this.FADE_DURATION / 2));
      } else {
        this.fading = false;
        this.fadeAlpha = 1;
      }
    }
  }

  render(ctx, scale) {
    const x = this.x * scale;
    const y = this.y * scale;
    const width = this.width * scale;
    const height = this.height * scale;

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;
    if (this.facing === 'left') {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.translate(-(x + width), -y);
    }

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height * 1.05, width * 0.4, height * 0.12, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Body (overalls, with gradient)
    let bodyGradient = ctx.createLinearGradient(x, y + height * 0.4, x, y + height);
    bodyGradient.addColorStop(0, '#3366ff');
    bodyGradient.addColorStop(1, '#0000aa');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(x + width * 0.15, y + height * 0.45, width * 0.7, height * 0.5);

    // Shirt (with gradient)
    let shirtGradient = ctx.createLinearGradient(x, y, x, y + height * 0.5);
    shirtGradient.addColorStop(0, '#ff6666');
    shirtGradient.addColorStop(1, '#cc0000');
    ctx.fillStyle = shirtGradient;
    ctx.fillRect(x + width * 0.15, y + height * 0.1, width * 0.7, height * 0.4);

    // Head (rounder, with face)
    ctx.fillStyle = '#f0c0a0';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y, width * 0.32, height * 0.28, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Eyes (bigger, blue irises)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.38, y - height * 0.05, width * 0.07, height * 0.06, 0, 0, 2 * Math.PI);
    ctx.ellipse(x + width * 0.62, y - height * 0.05, width * 0.07, height * 0.06, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#3399ff';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.38, y - height * 0.05, width * 0.03, height * 0.025, 0, 0, 2 * Math.PI);
    ctx.ellipse(x + width * 0.62, y - height * 0.05, width * 0.03, height * 0.025, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.38, y - height * 0.05, width * 0.012, height * 0.012, 0, 0, 2 * Math.PI);
    ctx.ellipse(x + width * 0.62, y - height * 0.05, width * 0.012, height * 0.012, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Hat (Mario style, with brim)
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y - height * 0.18, width * 0.32, height * 0.13, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(x + width * 0.18, y - height * 0.18, width * 0.64, height * 0.07);
    // Brim
    ctx.fillStyle = '#aa0000';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y - height * 0.13, width * 0.38, height * 0.06, 0, 0, Math.PI);
    ctx.fill();

    // Moustache (curved)
    ctx.strokeStyle = '#4B3621';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(x + width/2, y + height * 0.04, width * 0.18, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.stroke();

    // Legs (with boots)
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(x + width * 0.22, y + height * 0.85, width * 0.18, height * 0.15);
    ctx.fillRect(x + width * 0.60, y + height * 0.85, width * 0.18, height * 0.15);
    ctx.fillStyle = '#442200';
    ctx.fillRect(x + width * 0.22, y + height * 0.97, width * 0.18, height * 0.06);
    ctx.fillRect(x + width * 0.60, y + height * 0.97, width * 0.18, height * 0.06);

    // Arms (with gloves) - start at shoulders
    ctx.fillStyle = '#ff2222';
    // Left arm
    ctx.fillRect(x - width * 0.08, y + height * 0.1, width * 0.22, height * 0.52);
    // Right arm
    ctx.fillRect(x + width * 0.86, y + height * 0.1, width * 0.22, height * 0.52);
    // Gloves
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(x - width * 0.02, y + height * 0.62, width * 0.07, height * 0.06, 0, 0, 2 * Math.PI);
    ctx.ellipse(x + width * 0.98, y + height * 0.62, width * 0.07, height * 0.06, 0, 0, 2 * Math.PI);
    ctx.fill();

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
    // Allow jump if not already jumping and not actively climbing (but allow if just standing on ladder)
    if (!this.isJumping && !this.isClimbing) {
      this.dy = Player.JUMP_VELOCITY;
      this.isJumping = true;
    } else if (!this.isJumping && this.isOnLadder && !this.isClimbing) {
      // Standing on a ladder (not climbing): allow jump
      this.dy = Player.JUMP_VELOCITY;
      this.isJumping = true;
      this.isClimbing = false;
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
    // Only allow climbing down if currently on a ladder AND there's a ladder segment below
    if (this.isOnLadder && this.isOnLadderBelow) {
      this.isClimbing = true;
      this.dy = this.speed * 0.7; // Slower climbing speed
      this.dx = 0; // Stop horizontal movement while climbing
    } else if (this.currentPlatform && this.isOnLadderBelow) {
      // If not on a ladder but on a platform, and there's a ladder below, attempt to drop through
      this.isDroppingThroughPlatform = true;
      this.dropThroughTimer = this.DROP_THROUGH_DURATION; // Start timer
      this.dy = this.speed; // Give a downward push to help drop through
      this.currentPlatform = null; // Detach from current platform
    }
  }

  stopClimbing() {
    this.isClimbing = false;
    // The update method now handles stopping vertical movement if still on ladder
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