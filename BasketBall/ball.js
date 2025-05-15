class Ball {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.radius = 10;
    this.held = false;
    this.heldBy = null;
    this.bounceCount = 0;
  }
  
  update(gameState) {
    if (this.held) return; // Skip physics if ball is held by player
    
    // Apply gravity if ball is in the air
    this.vz -= 0.5;
    
    // Update position based on velocity
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    
    // Bounce off the ground
    if (this.z <= 0) {
      this.z = 0;
      this.bounceCount++;
      
      // Each bounce reduces energy
      if (this.bounceCount < 10) {
        this.vz = -this.vz * 0.8;
        // Also reduce horizontal velocity due to friction
        this.vx *= 0.9;
        this.vy *= 0.9;
      } else {
        // Eventually the ball stops bouncing
        this.vz = 0;
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        // Stop completely when very slow
        if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
          this.vx = 0;
          this.vy = 0;
        }
      }
    }
    
    // Bounce off court boundaries
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = -this.vx * 0.8;
    } else if (this.x > gameState.courtWidth - this.radius) {
      this.x = gameState.courtWidth - this.radius;
      this.vx = -this.vx * 0.8;
    }
    
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = -this.vy * 0.8;
    } else if (this.y > gameState.courtHeight - this.radius) {
      this.y = gameState.courtHeight - this.radius;
      this.vy = -this.vy * 0.8;
    }
    
    // Check for basket scoring
    this.checkScoring(gameState);
  }
  
  checkScoring(gameState) {
    // Left basket (Team 2 scores)
    if (
      Math.abs(this.x - 15) < 10 &&
      Math.abs(this.y - gameState.courtHeight/2) < 10 &&
      Math.abs(this.z - 30) < 5 &&
      this.vz < 0
    ) {
      gameState.team2Score += (this.x < 70) ? 2 : 3; // 2 or 3 points
      this.resetAfterScore(gameState, 1); // Team 1 gets the ball
    }
    
    // Right basket (Team 1 scores)
    if (
      Math.abs(this.x - (gameState.courtWidth - 15)) < 10 &&
      Math.abs(this.y - gameState.courtHeight/2) < 10 &&
      Math.abs(this.z - 30) < 5 &&
      this.vz < 0
    ) {
      gameState.team1Score += (this.x > gameState.courtWidth - 70) ? 2 : 3; // 2 or 3 points
      this.resetAfterScore(gameState, 2); // Team 2 gets the ball
    }
  }
  
  resetAfterScore(gameState, teamWithPossession) {
    // Reset ball to center court
    this.x = gameState.courtWidth / 2;
    this.y = gameState.courtHeight / 2;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.held = false;
    this.heldBy = null;
    this.bounceCount = 0;
    
    // Update possession
    gameState.possession = teamWithPossession;
  }
  
  draw(context, to2D) {
    // Convert 3D position to 2D screen coordinates
    const pos = to2D(this.x, this.y, this.z);
    const scale = pos.scale;
    
    // Draw shadow on the ground
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.beginPath();
    context.ellipse(
      to2D(this.x, this.y, 0).x,
      to2D(this.x, this.y, 0).y,
      this.radius * scale * 0.8,
      this.radius * scale * 0.4,
      0, 0, Math.PI * 2
    );
    context.fill();
    
    // Draw ball
    context.fillStyle = '#ff7f00';
    context.beginPath();
    context.arc(pos.x, pos.y, this.radius * scale, 0, Math.PI * 2);
    context.fill();
    
    // Draw ball details (lines)
    const rotation = (this.vx * this.vx + this.vy * this.vy + this.vz * this.vz) * 0.01;
    context.strokeStyle = '#000';
    context.lineWidth = 1 * scale;
    
    // Horizontal line
    context.beginPath();
    context.arc(pos.x, pos.y, this.radius * scale, rotation, rotation + Math.PI);
    context.stroke();
    
    // Vertical line
    context.beginPath();
    context.arc(pos.x, pos.y, this.radius * scale, rotation + Math.PI/2, rotation + 3*Math.PI/2);
    context.stroke();
  }
}
