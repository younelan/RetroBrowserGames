import { Platform } from './Platform.js';


export class Player {
  static WIDTH = 68; // was 56, now wider
  static HEIGHT = 84;
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

    // Flip for left/right
    if (this.facing === 'left') {
      ctx.translate(x + width / 2, y + height / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(x + width / 2), -(y + height / 2));
    }

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height * 1.05, width * 0.4, height * 0.12, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Animation timing for pendulum arms/legs
    let walkTime = (this.frame + performance.now() / 120) * 0.18;
    let walkCycle2 = Math.sin(walkTime * 2 + Math.PI); // legs and arms rotate at same speed
    let walkCycle = walkCycle2;
    let isMoving = Math.abs(this.dx) > 0.1;
    let isClimbing = this.isClimbing;
    let bodyBob = isMoving && !isClimbing ? Math.sin(walkTime * 2) * 0.5 * height * 0.05 : 0;

    if (isClimbing) {
      // --- Climbing (front view, as before) ---
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
      // Arms (climbing, up/down alternately)
      ctx.save();
      ctx.strokeStyle = '#ff2222';
      ctx.lineWidth = 6 * scale;
      let climbTime = performance.now() * 0.008;
      let armCycle = (Math.sin(climbTime) + 1) / 2;
      let leftArmY = y + height * 0.35 + armCycle * height * 0.18;
      let rightArmY = y + height * 0.35 + (1 - armCycle) * height * 0.18;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.38, y + height * 0.35);
      ctx.lineTo(x + width * 0.38, leftArmY);
      ctx.moveTo(x + width * 0.62, y + height * 0.35);
      ctx.lineTo(x + width * 0.62, rightArmY);
      ctx.stroke();
      ctx.restore();
      // Legs (climbing, up/down alternately)
      ctx.save();
      ctx.strokeStyle = '#0000ff';
      ctx.lineWidth = 8 * scale;
      let legTime = performance.now() * 0.004;
      let legCycle = (Math.sin(legTime) + 1) / 2;
      let leftLegY = y + height * 0.85 + legCycle * height * 0.12;
      let rightLegY = y + height * 0.85 + (1 - legCycle) * height * 0.12;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.44, y + height * 0.85);
      ctx.lineTo(x + width * 0.44, leftLegY);
      ctx.moveTo(x + width * 0.56, y + height * 0.85);
      ctx.lineTo(x + width * 0.56, rightLegY);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      return;
    }

    // --- Side view (asymmetrical, Mario-like, pendulum arms/legs) ---
    // Make the side view as big as the climb view, but keep the original body shape (not a rectangle)
    // --- HEAD (drawn before body, moved up) ---
    ctx.save();
    // Move head up further, keep cap where it is
    const headCenterX = x + width * 0.5;
    const headCenterY = y - height * 0.13 + bodyBob; // move head up more

    // --- Head (drawn before hair, before cap) ---
    ctx.fillStyle = '#f0c080';
    ctx.beginPath();
    ctx.ellipse(headCenterX, headCenterY, width * 0.13, height * 0.13, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Ear (small, back of head)
    ctx.fillStyle = '#e0b080';
    ctx.beginPath();
    ctx.ellipse(headCenterX - width * 0.09, headCenterY + height * 0.01, width * 0.022, height * 0.035, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Nose (side, round, forward)
    ctx.fillStyle = '#e0a070';
    ctx.beginPath();
    ctx.ellipse(headCenterX + width * 0.12, headCenterY, width * 0.045, height * 0.035, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Eye (side, blue iris, forward)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(headCenterX + width * 0.07, headCenterY - height * 0.02, width * 0.018, height * 0.014, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#3399ff';
    ctx.beginPath();
    ctx.ellipse(headCenterX + width * 0.07, headCenterY - height * 0.02, width * 0.007, height * 0.007, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(headCenterX + width * 0.07, headCenterY - height * 0.02, width * 0.003, height * 0.003, 0, 0, 2 * Math.PI);
    ctx.fill();

    // --- Cap (drawn before hair, so hair appears in front of the red arc) ---
    ctx.save();
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    const capDomeCenterX = x + width * 0.5;
    const capDomeBottomY = y - height * 0.07 + bodyBob - height * 0.13;
    ctx.arc(capDomeCenterX, capDomeBottomY, width * 0.13, Math.PI, 0, false);
    ctx.lineTo(capDomeCenterX + width * 0.13, capDomeBottomY);
    ctx.lineTo(capDomeCenterX - width * 0.13, capDomeBottomY);
    ctx.closePath();
    ctx.fill();
    // Cap band (at bottom of dome)
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(capDomeCenterX - width * 0.13, capDomeBottomY, width * 0.26, height * 0.035);
    // Extended front brim (slightly below dome, follows new dome position)
    ctx.fillStyle = '#aa0000';
    ctx.beginPath();
    ctx.ellipse(capDomeCenterX + width * 0.10, capDomeBottomY + height * 0.03, width * 0.13, height * 0.035, 0, Math.PI * 0.95, Math.PI * 0.05, false);
    ctx.fill();
    ctx.restore();

    // --- Hair (drawn after cap, in front of the red hat arc) ---
    ctx.save();
    ctx.fillStyle = '#6b3e1b'; // dark brown
    // Hair patch matches the width of the hat dome, height is height*0.07
    var hairWidth2 = width * 0.26;
    var hairHeight2 = height * 0.07;
    var hairX2 = headCenterX - hairWidth2 / 2;
    var hairY2 = capDomeBottomY + height * 0.01; // just below the hat dome
    ctx.beginPath();
    // Draw a rectangle with a circular border radius at the front (face side)
    ctx.moveTo(hairX2, hairY2);
    ctx.lineTo(hairX2 + hairWidth2 - hairHeight2, hairY2);
    ctx.arc(
      hairX2 + hairWidth2 - hairHeight2 / 2,
      hairY2 + hairHeight2 / 2,
      hairHeight2 / 2,
      Math.PI * 1.5,
      Math.PI * 0.5,
      false
    );
    ctx.lineTo(hairX2, hairY2 + hairHeight2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // --- BODY (drawn after head, as before) ---
    // Draw a much shorter blue square for the static overalls part
    let staticOverallsTop = y + height * 0.45 + bodyBob;
    let staticOverallsHeight = height * 0.10; // much shorter, square-like
    let staticOverallsWidth = width * 0.32;
    let staticOverallsLeft = x + width * 0.34;
    let bodyGradient = ctx.createLinearGradient(staticOverallsLeft, staticOverallsTop, staticOverallsLeft, staticOverallsTop + staticOverallsHeight);
    bodyGradient.addColorStop(0, '#3366ff');
    bodyGradient.addColorStop(1, '#0000aa');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(staticOverallsLeft, staticOverallsTop, staticOverallsWidth, staticOverallsHeight);
    // Shirt (side, offset for asymmetry, now deep red)
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    // Move shirt up so it reaches the head (same as head bottom)
    const shirtTopY = y - height * 0.01 + bodyBob;
    ctx.moveTo(x + width * 0.36, shirtTopY);
    ctx.lineTo(x + width * 0.36, staticOverallsTop);
    ctx.quadraticCurveTo(x + width * 0.36, staticOverallsTop + staticOverallsHeight * 0.5, x + width * 0.50, staticOverallsTop + staticOverallsHeight * 0.5);
    ctx.quadraticCurveTo(x + width * 0.64, staticOverallsTop + staticOverallsHeight * 0.5, x + width * 0.64, staticOverallsTop);
    ctx.lineTo(x + width * 0.64, shirtTopY);
    ctx.closePath();
    ctx.fill();
    // Head (side, oval, with nose, offset for profile)
    // Draw the miner's head (side profile, facing right, with Mario's cap above), centered horizontally and higher up
    // Move the head up, but keep the cap where it is
    ctx.save();
    // Center head horizontally with the body and move it up further
    const minerHeadCenterX = x + width * 0.5;
    const minerHeadCenterY = y - height * 0.07 + bodyBob; // move head up, cap stays put
    ctx.fillStyle = '#f0c080';
    ctx.beginPath();
    ctx.ellipse(minerHeadCenterX, minerHeadCenterY, width * 0.13, height * 0.13, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Ear (small, back of head)
    ctx.fillStyle = '#e0b080';
    ctx.beginPath();
    ctx.ellipse(minerHeadCenterX - width * 0.09, minerHeadCenterY + height * 0.01, width * 0.022, height * 0.035, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Nose (side, round, forward)
    ctx.fillStyle = '#e0a070';
    ctx.beginPath();
    ctx.ellipse(minerHeadCenterX + width * 0.12, minerHeadCenterY, width * 0.045, height * 0.035, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Eye (side, blue iris, forward)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(minerHeadCenterX + width * 0.07, minerHeadCenterY - height * 0.02, width * 0.018, height * 0.014, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#3399ff';
    ctx.beginPath();
    ctx.ellipse(minerHeadCenterX + width * 0.07, minerHeadCenterY - height * 0.02, width * 0.007, height * 0.007, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(minerHeadCenterX + width * 0.07, minerHeadCenterY - height * 0.02, width * 0.003, height * 0.003, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    // Hat (side, Mario style, offset to match new head center)
    // --- Hair (drawn before the cap dome, so the dome is in front) ---
    // Save cap dome and brim positions for hair placement
    // Use already-declared capDomeCenterX and capDomeBottomY if present, else declare here
    // (If these are already declared above, just use them)
    // Draw hair first
    ctx.save();
    ctx.fillStyle = '#6b3e1b'; // dark brown
    // The hat dome is width*0.13 radius, so width*0.26 wide. We'll make the hair patch the same width as the hat dome.
    // The nose is height*0.035, so hair height is height*0.07 (taller than before)
    var hairWidth2 = width * 0.26;
    var hairHeight2 = height * 0.07;
    // The top of the hair should be just under the hat dome, so align with capDomeBottomY
    var hairX2 = headCenterX - hairWidth2 / 2;
    var hairY2 = capDomeBottomY + height * 0.01; // just below the hat dome
    ctx.beginPath();
    // Draw a rectangle with a circular border radius at the front (face side)
    ctx.moveTo(hairX2, hairY2);
    ctx.lineTo(hairX2 + hairWidth2 - hairHeight2, hairY2);
    ctx.arc(
      hairX2 + hairWidth2 - hairHeight2 / 2,
      hairY2 + hairHeight2 / 2,
      hairHeight2 / 2,
      Math.PI * 1.5,
      Math.PI * 0.5,
      false
    );
    ctx.lineTo(hairX2, hairY2 + hairHeight2);
    ctx.closePath();
    ctx.fill();
    // --- Back hair arc (vertical, at the back of the head) ---
    // Draw a vertical patch at the back of the head, ending at the bottom of the nose, with the outer edge matching the head and the inner edge as a reverse half-circle
    var backHairWidth = hairHeight2 * 0.98;
    var backHairTop = hairY2 + hairHeight2 * 0.08;
    var backHairBottom = headCenterY + height * 0.08; // bottom of the nose
    // Place the patch so the outer edge matches the head ellipse
    var backHairX = headCenterX - width * 0.13 - backHairWidth * 0.5; // align with head's left edge
    ctx.beginPath();
    // Outer edge: follow the head ellipse from top to bottom
    var steps = 16;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      // Head ellipse parametric: x = cx + rx * cos(theta), y = cy + ry * sin(theta)
      var theta = Math.PI * 0.7 + t * Math.PI * 0.6; // from upper left to lower left
      var hx = headCenterX + width * 0.13 * Math.cos(theta);
      var hy = headCenterY + height * 0.13 * Math.sin(theta);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    // Inner edge: reverse half-circle (open parenthesis) from bottom to top
    // Inner edge: rotated reverse half-circle (open parenthesis), bottom attached to back curve, top at center of head
    var cx0 = backHairX + backHairWidth * 0.5; // bottom anchor (same as back curve bottom)
    var cy0 = backHairBottom; // bottom anchor Y
    var cx1 = headCenterX; // top anchor (center of head)
    var cy1 = backHairTop; // top anchor Y
    var r = (backHairBottom - backHairTop) / 2;
    var angle0 = Math.PI * 0.5 + Math.PI * 0.25; // 135deg, rotated 45deg from vertical
    var angle1 = Math.PI * 1.5 + Math.PI * 0.25; // 315deg, rotated 45deg from vertical
    for (var j = 0; j <= steps; j++) {
      var t2 = j / steps;
      // Interpolate center from bottom (back curve) to top (center of head)
      var cx = cx0 * (1 - t2) + cx1 * t2;
      var cy = cy0 * (1 - t2) + cy1 * t2;
      // Angle sweeps from angle0 to angle1
      var phi = angle0 + (angle1 - angle0) * t2;
      var ix = cx + r * Math.cos(phi);
      var iy = cy + r * Math.sin(phi);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Now draw the cap dome, band, and brim in front of the hair
    ctx.save();
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(capDomeCenterX, capDomeBottomY, width * 0.13, Math.PI, 0, false);
    ctx.lineTo(capDomeCenterX + width * 0.13, capDomeBottomY);
    ctx.lineTo(capDomeCenterX - width * 0.13, capDomeBottomY);
    ctx.closePath();
    ctx.fill();
    // Cap band (at bottom of dome)
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(capDomeCenterX - width * 0.13, capDomeBottomY, width * 0.26, height * 0.035);
    // Extended front brim (slightly below dome, follows new dome position)
    ctx.fillStyle = '#aa0000';
    ctx.beginPath();
    ctx.ellipse(capDomeCenterX + width * 0.10, capDomeBottomY + height * 0.03, width * 0.13, height * 0.035, 0, Math.PI * 0.95, Math.PI * 0.05, false);
    ctx.fill();
    ctx.restore();
    // Moustache (side, curved, offset)

    // Mouth (side, quarter-circle at front of head)
    ctx.save();
    ctx.strokeStyle = '#4B3621';
    ctx.lineWidth = 2.5 * scale;
    // Place at front of head, just below nose, as a quarter arc
    const mouthCenterX = headCenterX + width * 0.13 + width * 0.012;
    const mouthCenterY = headCenterY + height * 0.025;
    ctx.beginPath();
    // Draw a quarter-circle (open downward and backward)
    ctx.arc(mouthCenterX, mouthCenterY, width * 0.032, Math.PI * 1.5, Math.PI * 2, false);
    ctx.stroke();
    ctx.restore();

    // --- Arms (pendulum, one behind, one in front, both centered at shoulder) ---
    let armSwing = isMoving ? walkCycle * 0.7 : 0;
    // Move arms down so they attach at the bottom of the head (side view)
    // The head's bottom Y is headCenterY + height * 0.13
    // But the head is drawn at headCenterY = y - height * 0.13 + bodyBob, radius height*0.13
    // So bottom is y - height*0.13 + bodyBob + height*0.13 = y + bodyBob
    // Move arms a bit further down for a more natural shoulder position just below the head
    let armAttachY = y + bodyBob + height * 0.03;
    // Draw rear arm (left arm, behind body)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = '#ff6666'; // lighter red for arms
    ctx.lineWidth = 7 * scale;
    let rearShoulderX = x + width * 0.5;
    let rearShoulderY = armAttachY;
    let rearArmX = rearShoulderX - Math.sin(armSwing) * width * 0.22;
    let rearArmY = rearShoulderY + Math.abs(Math.cos(armSwing)) * height * 0.38;
    ctx.beginPath();
    ctx.moveTo(rearShoulderX, rearShoulderY);
    ctx.lineTo(rearArmX, rearArmY);
    ctx.stroke();
    // Draw rear hand (circle at end of rear arm)
    ctx.fillStyle = '#f0c0a0';
    ctx.beginPath();
    ctx.ellipse(rearArmX, rearArmY, width * 0.035, height * 0.035, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw front arm (right arm, in front of body)
    ctx.save();
    ctx.strokeStyle = '#ff6666'; // lighter red for arms
    ctx.lineWidth = 7 * scale;
    let frontShoulderX = x + width * 0.5;
    let frontShoulderY = armAttachY;
    let frontArmX = frontShoulderX + Math.sin(armSwing) * width * 0.22;
    let frontArmY = frontShoulderY + Math.abs(Math.cos(armSwing)) * height * 0.38;
    ctx.beginPath();
    ctx.moveTo(frontShoulderX, frontShoulderY);
    ctx.lineTo(frontArmX, frontArmY);
    ctx.stroke();
    // Draw front hand (circle at end of front arm)
    ctx.fillStyle = '#f0c0a0';
    ctx.beginPath();
    ctx.ellipse(frontArmX, frontArmY, width * 0.035, height * 0.035, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // --- Legs (pendulum, attach to bottom of blue square) ---
    ctx.save();
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 16 * scale; // wider legs
    // Center the top of the legs under the body
    let legAttachY = staticOverallsTop + staticOverallsHeight;
    let legAttachXLeft = x + width * 0.48;
    let legAttachXRight = x + width * 0.52;
    if (isMoving) {
      // Walking: legs swing like pendulums (like arms), 3x the X swing
      let legSwing = walkCycle2 * 0.7;
      ctx.beginPath();
      // Left leg
      ctx.moveTo(legAttachXLeft, legAttachY);
      ctx.lineTo(
        legAttachXLeft - 3 * Math.sin(legSwing) * width * 0.13,
        legAttachY + Math.abs(Math.cos(legSwing)) * height * 0.46 // keep leg length as before
      );
      // Right leg
      ctx.moveTo(legAttachXRight, legAttachY);
      ctx.lineTo(
        legAttachXRight + 3 * Math.sin(legSwing) * width * 0.13,
        legAttachY + Math.abs(Math.cos(legSwing)) * height * 0.46 // keep leg length as before
      );
      ctx.stroke();
      // Draw feet (ellipses at end of each leg)
      ctx.fillStyle = '#7a4b13';
      // Left foot
      let leftFootX = legAttachXLeft - 3 * Math.sin(legSwing) * width * 0.13;
      let leftFootY = legAttachY + Math.abs(Math.cos(legSwing)) * height * 0.46;
      ctx.beginPath();
      ctx.ellipse(leftFootX, leftFootY + height * 0.015, width * 0.13, height * 0.05, 0, 0, 2 * Math.PI);
      ctx.fill();
      // Right foot
      let rightFootX = legAttachXRight + 3 * Math.sin(legSwing) * width * 0.13;
      let rightFootY = legAttachY + Math.abs(Math.cos(legSwing)) * height * 0.46;
      ctx.beginPath();
      ctx.ellipse(rightFootX, rightFootY + height * 0.015, width * 0.13, height * 0.05, 0, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Idle: legs straight down from center, wider
      ctx.beginPath();
      ctx.moveTo(legAttachXLeft, legAttachY);
      ctx.lineTo(legAttachXLeft, legAttachY + height * 0.46); // keep leg length as before
      ctx.moveTo(legAttachXRight, legAttachY);
      ctx.lineTo(legAttachXRight, legAttachY + height * 0.46); // keep leg length as before
      ctx.stroke();
      // Draw feet (ellipses at end of each leg)
      ctx.fillStyle = '#7a4b13';
      // Left foot
      ctx.beginPath();
      ctx.ellipse(legAttachXLeft, legAttachY + height * 0.46 + height * 0.015, width * 0.13, height * 0.05, 0, 0, 2 * Math.PI);
      ctx.fill();
      // Right foot
      ctx.beginPath();
      ctx.ellipse(legAttachXRight, legAttachY + height * 0.46 + height * 0.015, width * 0.13, height * 0.05, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();

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
    // AABB collision, but ignore the top of the player (the head) for barrel collision
    // Only the lower 2/3 of the player counts for collision
    const bodyTop = this.y + this.height / 3;
    return (
      this.x < gameObject.x + gameObject.width &&
      this.x + this.width > gameObject.x &&
      bodyTop < gameObject.y + gameObject.height &&
      this.y + this.height > gameObject.y
    );
  }
}