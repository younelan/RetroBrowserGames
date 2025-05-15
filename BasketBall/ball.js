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
    this.shotDistance = 0; // Track distance of shots for scoring
  }

  update(gameState) {
    if (this.held) return; // Skip physics if ball is held by player

    // Apply gravity
    this.vz -= 0.5;

    // Update position
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Bounce off the ground
    if (this.z <= 0) {
      this.z = 0;
      this.bounceCount++;

      // Each bounce reduces energy
      if (this.bounceCount < 5) {
        this.vz = -this.vz * 0.7; // More dampening
        this.vx *= 0.8;
        this.vy *= 0.8;
      } else {
        // Ball stops more quickly
        this.vz = 0;
        this.vx *= 0.85;
        this.vy *= 0.85;

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

    // Check for player collisions when ball is loose
    if (!this.held) {
      this.checkPlayerCollisions(gameState);
    }
  }

  // Check for players trying to grab the ball
  checkPlayerCollisions(gameState) {
    gameState.players.forEach(player => {
      // Skip if player already has a ball
      if (player.hasBall) return;

      // Check if player is close to ball
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const dz = this.z - player.z;
      const distance = Math.sqrt(dx*dx + dy*dy);

      // AI players have a chance to pick up the ball if it's close
      if (!this.held &&
          distance < player.radius + this.radius &&
          this.z < 25 &&
          player.z < 25) {

        // AI players try to grab the ball with some randomness
        if (!player.isUserControlled) {
          // Higher chance to grab if ball is slow
          const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
          if (Math.random() < 0.1 - speed/100) {
            player.hasBall = true;
            this.held = true;
            this.heldBy = player;
            this.vx = 0;
            this.vy = 0;
            this.vz = 0;
          }
        }
      }
    });
  }

  checkScoring(gameState) {
    // Left basket (Team 2 scores)
    if (
      Math.abs(this.x - 15) < 12 &&
      Math.abs(this.y - gameState.courtHeight/2) < 12 &&
      Math.abs(this.z - 30) < 6 &&
      this.vz < 0
    ) {
      // Calculate points based on shot distance
      const pointValue = (this.shotDistance > 70) ? 3 : 2;
      gameState.team2Score += pointValue;
      this.resetAfterScore(gameState, 1); // Team 1 gets the ball

      // Log scoring
      console.log(`Team 2 scored ${pointValue} points!`);
    }

    // Right basket (Team 1 scores)
    if (
      Math.abs(this.x - (gameState.courtWidth - 15)) < 12 &&
      Math.abs(this.y - gameState.courtHeight/2) < 12 &&
      Math.abs(this.z - 30) < 6 &&
      this.vz < 0
    ) {
      // Calculate points based on shot distance
      const pointValue = (this.shotDistance > 70) ? 3 : 2;
      gameState.team1Score += pointValue;
      this.resetAfterScore(gameState, 2); // Team 2 gets the ball

      // Log scoring
      console.log(`Team 1 scored ${pointValue} points!`);
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

    // Track which team gets the ball
    setTimeout(() => {
      // Give ball to a random player from the team with possession
      const eligiblePlayers = gameState.players.filter(p => p.team === teamWithPossession);
      if (eligiblePlayers.length > 0) {
        const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];

        // Move ball to player
        this.x = randomPlayer.x;
        this.y = randomPlayer.y;
        this.z = randomPlayer.z + 20;

        // Make player hold ball
        this.held = true;
        this.heldBy = randomPlayer;
        randomPlayer.hasBall = true;
      }
    }, 1000); // Delay giving the ball to simulate inbounding
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

// Helper function to show score message (to be called within the game scope)
function showScoringMessage(gameState, scoringTeam, points) {
  // This function would add a temporary visual effect
  // Implementation would depend on the game rendering system
  console.log(`Team ${scoringTeam} scored ${points} points!`);
}
