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
  }

  update(gameState) {
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
    
    // Draw shadow on the ground (more elliptical for perspective)
    const shadowScale = 1 + (this.z * 0.01);
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
    
    // Draw player with 3D shading
    // For more 3D feel, we'll use gradient instead of flat color
    const gradientY = this.radius * scale / 2;
    const gradient = context.createRadialGradient(
      pos.x - gradientY, pos.y - gradientY, 1,
      pos.x, pos.y, this.radius * scale
    );
    
    // Create team colors with highlight/shadow for 3D effect
    if (this.team === 1) {
      gradient.addColorStop(0, '#4488ff'); // Highlight
      gradient.addColorStop(0.7, '#2266dd'); // Base blue
      gradient.addColorStop(1, '#1144aa'); // Shadow
    } else {
      gradient.addColorStop(0, '#ff6644'); // Highlight  
      gradient.addColorStop(0.7, '#dd3322'); // Base red
      gradient.addColorStop(1, '#aa1100'); // Shadow
    }
    
    // Draw player body with 3D gradient
    context.beginPath();
    context.arc(pos.x, pos.y, this.radius * scale, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    
    // Add outline
    context.strokeStyle = '#000';
    context.lineWidth = 1.5 * scale;
    context.stroke();
    
    // Draw jersey number with 3D shadow effect
    context.fillStyle = '#fff';
    context.font = `bold ${14 * scale}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Text shadow for 3D effect
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 3 * scale;
    context.shadowOffsetX = 1 * scale;
    context.shadowOffsetY = 1 * scale;
    
    // Draw the number/letter
    context.fillText(this.team === 1 ? 'B' : 'R', pos.x, pos.y);
    
    // Reset shadow
    context.shadowColor = 'transparent';
    
    // Visual indicator for user-controlled player
    if (this.isUserControlled) {
      context.strokeStyle = '#ffff00';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pos.x, pos.y, (this.radius + 5) * scale, 0, Math.PI * 2);
      context.stroke();
      
      // Add a small arrow above player
      const arrowSize = 8 * scale;
      context.fillStyle = '#ffff00';
      context.beginPath();
      context.moveTo(pos.x, pos.y - this.radius * scale - arrowSize * 2);
      context.lineTo(pos.x + arrowSize, pos.y - this.radius * scale - arrowSize);
      context.lineTo(pos.x - arrowSize, pos.y - this.radius * scale - arrowSize);
      context.closePath();
      context.fill();
    }
    
    // Visual indicator for ball possession with glow effect
    if (this.hasBall) {
      context.strokeStyle = '#00ff00';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pos.x, pos.y, (this.radius + 8) * scale, 0, Math.PI * 2);
      context.stroke();
      
      // Add glow
      const glowSize = 4;
      for (let i = 0; i < glowSize; i++) {
        context.strokeStyle = `rgba(0, 255, 0, ${0.1 - 0.02 * i})`;
        context.lineWidth = 2 + i;
        context.beginPath();
        context.arc(pos.x, pos.y, (this.radius + 8 + i) * scale, 0, Math.PI * 2);
        context.stroke();
      }
    }
  }
}