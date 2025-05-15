class Player {
  constructor(x, y, team, color) {
    this.x = x;
    this.y = y;
    this.z = 0; // Height off the ground
    this.team = team;
    this.color = color;
    this.radius = 15;
    this.hasBall = false;
    this.isUserControlled = false;
    this.speed = 3;
    this.jumpSpeed = 0;
    this.jumpHeight = 0;
    this.isShooting = false;
    this.shootCooldown = 0;
    this.position = ''; // Default position

    // Animation variables
    this.animationStep = 0;
    this.animationSpeed = 0;
    this.lastX = x;
    this.lastY = y;
    this.direction = 0; // 0: down, 1: up, 2: left, 3: right
  }

  update(gameState) {
    // Store previous position for animation
    this.lastX = this.x;
    this.lastY = this.y;

    // Player movement based on controls
    if (this.isUserControlled) {
      const keys = window.controls.keys;

      // Movement
      let dx = 0;
      let dy = 0;

      if (keys['ArrowUp'] || keys['w']) dy -= this.speed;
      if (keys['ArrowDown'] || keys['s']) dy += this.speed;
      if (keys['ArrowLeft'] || keys['a']) dx -= this.speed;
      if (keys['ArrowRight'] || keys['d']) dx += this.speed;

      // Apply diagonal movement normalization
      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
      }

      // Update position with boundary checking
      const newX = this.x + dx;
      const newY = this.y + dy;

      // Keep player within court boundaries
      if (newX >= this.radius && newX <= gameState.courtWidth - this.radius) {
        this.x = newX;
      }

      if (newY >= this.radius && newY <= gameState.courtHeight - this.radius) {
        this.y = newY;
      }

      // Jumping
      if ((keys[' '] || keys['Spacebar']) && this.z === 0) {
        // Start jump
        this.jumpSpeed = 8;
      }

      // Shooting
      if ((keys['f'] || keys['F']) && this.hasBall && this.shootCooldown <= 0) {
        this.shoot(gameState.ball, gameState);
      }

      // Picking up the ball
      const ball = gameState.ball;
      if (
        !this.hasBall &&
        !ball.held && // Only pick up if no one else has it
        ball.z < 20 && // Ball is close to the ground
        Math.abs(this.x - ball.x) < this.radius + ball.radius &&
        Math.abs(this.y - ball.y) < this.radius + ball.radius
      ) {
        this.hasBall = true;
        ball.held = true;
        ball.heldBy = this;

        // Reset ball physics when picked up
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = 0;
        ball.bounceCount = 0;
      }
    }

    // Handle jump physics
    if (this.z > 0 || this.jumpSpeed !== 0) {
      this.z += this.jumpSpeed;
      this.jumpSpeed -= 0.5; // Gravity

      // Landing
      if (this.z <= 0) {
        this.z = 0;
        this.jumpSpeed = 0;
      }
    }

    // Update shooting cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    // Update ball position if held by this player
    if (this.hasBall) {
      gameState.ball.x = this.x + (this.team === 1 ? 15 : -15);
      gameState.ball.y = this.y;
      gameState.ball.z = this.z + 20; // Hold ball slightly above player
    }

    // Update animation based on movement
    const dx = this.x - this.lastX;
    const dy = this.y - this.lastY;

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      this.animationSpeed = Math.min(10, this.animationSpeed + 0.5);
      // Set direction based on movement
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 3 : 2; // right or left
      } else {
        this.direction = dy > 0 ? 0 : 1; // down or up
      }
    } else {
      this.animationSpeed = Math.max(0, this.animationSpeed - 0.5);
    }

    // Update animation step
    if (this.animationSpeed > 0) {
      this.animationStep = (this.animationStep + this.animationSpeed / 10) % 4;
    }
  }

  shoot(ball, gameState) {
    if (!this.hasBall) return;

    this.hasBall = false;
    ball.held = false;
    ball.heldBy = null;

    // Determine which basket to aim for
    const targetX = this.team === 1 ? gameState.courtWidth - 15 : 15;
    const targetY = gameState.courtHeight / 2;
    const targetZ = 30; // Height of the rim

    // Calculate initial velocity for the shot
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction and set speed
    const speed = 6 + distance / 40;
    ball.vx = (dx / distance) * speed;
    ball.vy = (dy / distance) * speed;

    // Set vertical velocity for arc (higher for longer shots)
    const arcHeight = 100 + distance / 3;
    ball.vz = Math.sqrt(2 * 0.5 * arcHeight); // Based on projectile physics

    // Add a small randomness to make shots more interesting
    const accuracy = this.isUserControlled ? 0.95 : 0.85; // User is more accurate
    ball.vx *= 0.95 + Math.random() * 0.1;
    ball.vy *= 0.95 + Math.random() * 0.1;

    // Jump when shooting
    if (this.z === 0) {
      this.jumpSpeed = 5;
    }

    // Set shooting cooldown
    this.shootCooldown = 30;
  }

  draw(context, to2D) {
    // Convert 3D position to 2D screen position
    const pos = to2D(this.x, this.y, this.z);
    const scale = pos.scale;

    // Draw shadow on the ground
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.beginPath();
    context.ellipse(
      to2D(this.x, this.y, 0).x,
      to2D(this.x, this.y, 0).y,
      this.radius * scale * 0.8,
      this.radius * scale * 0.3,
      0, 0, Math.PI * 2
    );
    context.fill();

    // Set team colors
    const primaryColor = this.team === 1 ? '#2266dd' : '#dd3322';
    const secondaryColor = this.team === 1 ? '#4488ff' : '#ff6644';

    // Save context for restoration later
    context.save();

    // Calculate player height based on z position
    const playerHeight = this.radius * 2.5 * scale;
    const playerWidth = this.radius * 1.5 * scale;

    // Draw player body (torso)
    context.fillStyle = primaryColor;
    this.drawRoundedRect(
      context,
      pos.x - playerWidth / 2,
      pos.y - playerHeight / 2,
      playerWidth,
      playerHeight * 0.6,
      playerWidth * 0.3
    );

    // Jersey number
    context.fillStyle = '#fff';
    context.font = `bold ${12 * scale}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.team === 1 ? 'B' : 'R', pos.x, pos.y - playerHeight * 0.1);

    // Draw head
    context.fillStyle = '#f8d8c0'; // Skin tone
    context.beginPath();
    context.arc(
      pos.x,
      pos.y - playerHeight * 0.35,
      playerWidth * 0.4,
      0,
      Math.PI * 2
    );
    context.fill();
    context.strokeStyle = '#000';
    context.lineWidth = 1 * scale;
    context.stroke();

    // Draw legs with animation
    const legSpread = Math.sin(this.animationStep * Math.PI) * playerWidth * 0.3;
    const legWidth = playerWidth * 0.3;
    const legHeight = playerHeight * 0.5;

    // Left leg
    context.fillStyle = secondaryColor;
    this.drawRoundedRect(
      context,
      pos.x - playerWidth / 2 - legSpread * 0.5,
      pos.y + playerHeight * 0.1,
      legWidth,
      legHeight,
      legWidth * 0.3
    );

    // Right leg
    this.drawRoundedRect(
      context,
      pos.x + playerWidth / 2 - legWidth + legSpread * 0.5,
      pos.y + playerHeight * 0.1,
      legWidth,
      legHeight,
      legWidth * 0.3
    );

    // Draw arms with animation
    const armSpread = Math.sin((this.animationStep + 2) * Math.PI) * playerWidth * 0.3;
    const armWidth = playerWidth * 0.25;
    const armHeight = playerHeight * 0.4;

    // Left arm
    context.fillStyle = primaryColor;
    this.drawRoundedRect(
      context,
      pos.x - playerWidth / 2 - armWidth + armSpread * 0.5,
      pos.y - playerHeight * 0.25,
      armWidth,
      armHeight,
      armWidth * 0.3
    );

    // Right arm
    this.drawRoundedRect(
      context,
      pos.x + playerWidth / 2 - armSpread * 0.5,
      pos.y - playerHeight * 0.25,
      armWidth,
      armHeight,
      armWidth * 0.3
    );

    // Restore context
    context.restore();

    // Visual indicator for user-controlled player
    if (this.isUserControlled) {
      context.strokeStyle = '#ffff00';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pos.x, pos.y, (this.radius + 10) * scale, 0, Math.PI * 2);
      context.stroke();

      // Add an arrow above player
      const arrowSize = 10 * scale;
      context.fillStyle = '#ffff00';
      context.beginPath();
      context.moveTo(pos.x, pos.y - playerHeight / 2 - arrowSize * 2);
      context.lineTo(pos.x + arrowSize, pos.y - playerHeight / 2 - arrowSize);
      context.lineTo(pos.x - arrowSize, pos.y - playerHeight / 2 - arrowSize);
      context.closePath();
      context.fill();
    }

    // Visual indicator for ball possession
    if (this.hasBall) {
      context.strokeStyle = '#00ff00';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pos.x, pos.y, (this.radius + 12) * scale, 0, Math.PI * 2);
      context.stroke();
    }
  }

  // Helper method to draw rounded rectangles
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}