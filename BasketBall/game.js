(() => {
  const canvas = document.getElementById('gameCanvas');
  const context = canvas.getContext('2d');
  
  // Court dimensions (NBA proportions)
  const COURT_ASPECT_RATIO = 94/50; // length/width
  
  // Game variables
  let gameState = {
    ball: null,
    players: [],
    team1Score: 0,
    team2Score: 0,
    possession: 1,
    courtWidth: 500,
    courtHeight: 300,
    gameTime: 0
  };
  
  // Perspective constants
  const FLOOR_Y = 0.8; // Position of the floor line (0.8 = 80% down the screen)
  const SCALE_FACTOR = 0.6; // How much objects scale with distance
  
  // Initialize the game
  function initGame() {
    // Create ball
    gameState.ball = new Ball(250, 150, 0);
    
    // Create players (3 per team)
    // Team 1 (left) - BLUE
    gameState.players.push(new Player(100, 100, 1, 'blue'));
    gameState.players.push(new Player(150, 150, 1, 'blue'));
    gameState.players.push(new Player(100, 200, 1, 'blue'));
    
    // Team 2 (right) - RED
    gameState.players.push(new Player(400, 100, 2, 'red'));
    gameState.players.push(new Player(350, 150, 2, 'red'));
    gameState.players.push(new Player(400, 200, 2, 'red'));
    
    // Make first player controlled by the user
    gameState.players[0].isUserControlled = true;
    
    // Assign positions to AI players
    assignPlayerPositions();
  }
  
  // Assign strategic positions to AI players
  function assignPlayerPositions() {
    // Team 1 positions
    gameState.players[1].position = 'guard';
    gameState.players[2].position = 'forward';
    
    // Team 2 positions
    gameState.players[3].position = 'guard';
    gameState.players[4].position = 'center';
    gameState.players[5].position = 'forward';
  }
  
  function resizeCanvas() {
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isLandscape) {
      // Landscape orientation
      canvas.height = Math.min(window.innerHeight, window.innerWidth / COURT_ASPECT_RATIO);
      canvas.width = canvas.height * COURT_ASPECT_RATIO;
    } else {
      // Portrait orientation
      canvas.width = Math.min(window.innerWidth, window.innerHeight / COURT_ASPECT_RATIO);
      canvas.height = canvas.width * COURT_ASPECT_RATIO;
    }
  }
  
  // Convert 3D coordinates to 2D screen coordinates with perspective
  function to2D(x, y, z) {
    // Start with the canvas center as the vanishing point
    const vanishX = canvas.width / 2;
    const vanishY = canvas.height * FLOOR_Y;
    
    // Calculate depth (1.0 at floor, smaller as z increases)
    const depth = 1.0 - (z / 200);
    
    // Scale coordinates based on depth
    const scale = SCALE_FACTOR + (1.0 - SCALE_FACTOR) * depth;
    
    // Apply perspective transformation
    const screenX = vanishX + (x - gameState.courtWidth/2) * scale;
    const screenY = vanishY - z * 0.5 - (gameState.courtHeight - y) * scale;
    
    return { x: screenX, y: screenY, scale: scale };
  }
  
  function drawCourt() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky/background gradient
    const bgGradient = context.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(1, '#E0F7FA');
    context.fillStyle = bgGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw court floor with perspective
    const floorY = canvas.height * FLOOR_Y;
    
    // Create court points
    const courtCorners = [
      to2D(0, 0, 0),                                  // Top-left
      to2D(gameState.courtWidth, 0, 0),               // Top-right
      to2D(gameState.courtWidth, gameState.courtHeight, 0), // Bottom-right
      to2D(0, gameState.courtHeight, 0)               // Bottom-left
    ];
    
    // Draw court floor
    context.fillStyle = '#c69c6d';
    context.beginPath();
    context.moveTo(courtCorners[0].x, courtCorners[0].y);
    context.lineTo(courtCorners[1].x, courtCorners[1].y);
    context.lineTo(courtCorners[2].x, courtCorners[2].y);
    context.lineTo(courtCorners[3].x, courtCorners[3].y);
    context.closePath();
    context.fill();
    
    // Court outline
    context.strokeStyle = '#333';
    context.lineWidth = 2;
    context.stroke();
    
    // Mid-court line
    const midTop = to2D(gameState.courtWidth/2, 0, 0);
    const midBottom = to2D(gameState.courtWidth/2, gameState.courtHeight, 0);
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(midTop.x, midTop.y);
    context.lineTo(midBottom.x, midBottom.y);
    context.stroke();
    
    // Center circle
    const centerPoint = to2D(gameState.courtWidth/2, gameState.courtHeight/2, 0);
    const radiusX = 30 * centerPoint.scale;
    const radiusY = 15 * centerPoint.scale; // Scaled for perspective
    
    context.beginPath();
    context.ellipse(centerPoint.x, centerPoint.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.stroke();
    
    // Three-point line arcs
    const leftBasketCenter = to2D(0, gameState.courtHeight/2, 0);
    const rightBasketCenter = to2D(gameState.courtWidth, gameState.courtHeight/2, 0);
    
    // Left arc
    context.beginPath();
    context.ellipse(
      leftBasketCenter.x, 
      leftBasketCenter.y, 
      70 * leftBasketCenter.scale, 
      35 * leftBasketCenter.scale, 
      0, -Math.PI/2, Math.PI/2
    );
    context.stroke();
    
    // Right arc
    context.beginPath();
    context.ellipse(
      rightBasketCenter.x, 
      rightBasketCenter.y, 
      70 * rightBasketCenter.scale, 
      35 * rightBasketCenter.scale, 
      0, Math.PI/2, 3*Math.PI/2
    );
    context.stroke();
    
    // Paint areas
    const leftPaintWidth = 60 * leftBasketCenter.scale;
    const leftPaintHeight = 100 * leftBasketCenter.scale;
    context.strokeRect(
      leftBasketCenter.x, 
      leftBasketCenter.y - leftPaintHeight/2, 
      leftPaintWidth, 
      leftPaintHeight
    );
    
    const rightPaintWidth = 60 * rightBasketCenter.scale;
    const rightPaintHeight = 100 * rightBasketCenter.scale;
    context.strokeRect(
      rightBasketCenter.x - rightPaintWidth, 
      rightBasketCenter.y - rightPaintHeight/2, 
      rightPaintWidth, 
      rightPaintHeight
    );
    
    // Draw baskets
    drawBasket(0, gameState.courtHeight/2, 0, true); // Left basket
    drawBasket(gameState.courtWidth, gameState.courtHeight/2, 0, false); // Right basket
  }
  
  function drawBasket(x, y, z, isLeft) {
    const pos = to2D(x, y, z);
    const scale = pos.scale;
    
    // Draw backboard
    const backboardWidth = 30 * scale;
    const backboardHeight = 20 * scale;
    const backboardZ = 40 * scale;
    
    context.fillStyle = '#fff';
    if (isLeft) {
      const backboardPos = to2D(x + 5, y, z + 40);
      context.fillRect(backboardPos.x - 2, backboardPos.y - backboardHeight/2, 4, backboardHeight);
    } else {
      const backboardPos = to2D(x - 5, y, z + 40);
      context.fillRect(backboardPos.x - 2, backboardPos.y - backboardHeight/2, 4, backboardHeight);
    }
    
    // Draw rim (appears as ellipse due to perspective)
    const rimRadius = 7.5 * scale;
    const rimEllipseY = 3.5 * scale;
    
    context.strokeStyle = '#FFA500';
    context.lineWidth = 2 * scale;
    context.beginPath();
    if (isLeft) {
      const rimPos = to2D(x + 15, y, z + 30);
      context.ellipse(rimPos.x, rimPos.y, rimRadius, rimEllipseY, 0, 0, Math.PI * 2);
    } else {
      const rimPos = to2D(x - 15, y, z + 30);
      context.ellipse(rimPos.x, rimPos.y, rimRadius, rimEllipseY, 0, 0, Math.PI * 2);
    }
    context.stroke();
  }
  
  function drawScoreboard() {
    context.font = '24px Arial';
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    
    // Draw scores on top of the screen
    context.fillText(`BLUE: ${gameState.team1Score} - RED: ${gameState.team2Score}`, canvas.width/2, 30);
  }
  
  // Update AI players
  function updateAI() {
    gameState.players.forEach(player => {
      if (!player.isUserControlled) {
        // AI behavior based on team and game state
        const teamWithBall = gameState.ball.held ? 
          (gameState.ball.heldBy.team === player.team ? true : false) : 
          false;
          
        // If player's team has the ball (offense)
        if (teamWithBall) {
          updateOffensiveAI(player);
        } else {
          // Defense
          updateDefensiveAI(player);
        }
      }
    });
  }
  
  function updateOffensiveAI(player) {
    const ball = gameState.ball;
    const offensiveBasketX = player.team === 1 ? gameState.courtWidth - 15 : 15;
    const centerY = gameState.courtHeight / 2;
    
    // Try to get the ball if it's on the ground and nearby
    if (!ball.held && ball.z < 10) {
      const distToBall = Math.sqrt(Math.pow(player.x - ball.x, 2) + Math.pow(player.y - ball.y, 2));
      if (distToBall < 100) {
        // Move toward ball
        moveToward(player, ball.x, ball.y, player.speed);
        return;
      }
    }
    
    // If this player has the ball
    if (player.hasBall) {
      // Shoot if close enough to basket
      const distToBasket = Math.sqrt(Math.pow(player.x - offensiveBasketX, 2) + 
                                    Math.pow(player.y - centerY, 2));
      
      if (distToBasket < 150 && player.shootCooldown <= 0) {
        player.shoot(ball, gameState);
        return;
      }
      
      // Otherwise move toward basket
      moveToward(player, offensiveBasketX, centerY, player.speed * 0.7);
      return;
    }
    
    // Position based on player's role when team has the ball but this player doesn't
    if (player.position === 'guard') {
      // Guards stay outside the paint
      const targetX = player.team === 1 ? 
                     gameState.courtWidth * 0.7 : 
                     gameState.courtWidth * 0.3;
      const targetY = gameState.courtHeight * 0.3;
      moveToward(player, targetX, targetY, player.speed * 0.5);
    } else if (player.position === 'center') {
      // Centers stay in the paint
      const targetX = player.team === 1 ? 
                     gameState.courtWidth * 0.8 : 
                     gameState.courtWidth * 0.2;
      moveToward(player, targetX, centerY, player.speed * 0.5);
    } else {
      // Forwards find open space
      const targetX = player.team === 1 ? 
                     gameState.courtWidth * 0.6 : 
                     gameState.courtWidth * 0.4;
      const targetY = gameState.courtHeight * 0.7;
      moveToward(player, targetX, targetY, player.speed * 0.5);
    }
  }
  
  function updateDefensiveAI(player) {
    const ball = gameState.ball;
    const defensiveBasketX = player.team === 1 ? 15 : gameState.courtWidth - 15;
    const centerY = gameState.courtHeight / 2;
    
    // If ball is free, go get it
    if (!ball.held) {
      moveToward(player, ball.x, ball.y, player.speed);
      return;
    }
    
    // If opponent has the ball
    if (ball.heldBy && ball.heldBy.team !== player.team) {
      const ballHolder = ball.heldBy;
      
      // Guard the player with the ball
      if (Math.random() < 0.3) { // 30% chance to directly defend the ball handler
        moveToward(player, ballHolder.x, ballHolder.y, player.speed * 0.9);
        return;
      }
    }
    
    // Otherwise, position defensively based on role
    if (player.position === 'guard') {
      // Guards defend the perimeter
      const targetX = player.team === 1 ? 
                     gameState.courtWidth * 0.3 : 
                     gameState.courtWidth * 0.7;
      const targetY = gameState.courtHeight * 0.3;
      moveToward(player, targetX, targetY, player.speed * 0.6);
    } else if (player.position === 'center') {
      // Centers protect the paint
      const targetX = player.team === 1 ? 
                     gameState.courtWidth * 0.2 : 
                     gameState.courtWidth * 0.8;
      moveToward(player, targetX, centerY, player.speed * 0.6);
    } else {
      // Forwards find defensive position
      const targetX = player.team === 1 ? 
                     gameState.courtWidth * 0.4 : 
                     gameState.courtWidth * 0.6;
      const targetY = gameState.courtHeight * 0.7;
      moveToward(player, targetX, targetY, player.speed * 0.6);
    }
  }
  
  // Helper function to move player toward a target
  function moveToward(player, targetX, targetY, speed) {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) { // Only move if not very close to target
      player.x += (dx / distance) * speed;
      player.y += (dy / distance) * speed;
      
      // Ensure player stays within court boundaries
      player.x = Math.max(player.radius, Math.min(gameState.courtWidth - player.radius, player.x));
      player.y = Math.max(player.radius, Math.min(gameState.courtHeight - player.radius, player.y));
    }
    
    // Occasionally jump
    if (player.z === 0 && Math.random() < 0.01) {
      player.jumpSpeed = 6;
    }
  }
  
  function updateGame() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update AI players
    updateAI();
    
    // Update ball and players
    gameState.ball.update(gameState);
    
    // Sort players by y position for proper rendering order (back to front)
    gameState.players.sort((a, b) => a.y - b.y);
    
    // Update all players
    gameState.players.forEach(player => player.update(gameState));
    
    // Draw everything
    drawCourt();
    
    // Draw players (already sorted for correct z-ordering)
    gameState.players.forEach(player => player.draw(context, to2D));
    
    // Draw the ball
    gameState.ball.draw(context, to2D);
    
    // Draw scoreboard
    drawScoreboard();
    
    // Increase game time
    gameState.gameTime += 1/60; // Assume 60fps
    
    // Continue game loop
    requestAnimationFrame(updateGame);
  }

  // Initialize and handle resizing
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  initGame();
  updateGame();
})();