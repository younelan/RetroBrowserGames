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
  
  // Perspective constants - Enhanced for better 3D effect
  const FLOOR_Y = 0.75; // Position of the floor line (0.75 = 75% down the screen)
  const SCALE_FACTOR = 0.4; // More dramatic scaling for distant objects
  const PERSPECTIVE_ANGLE = -0.5; // Angle to tilt the court perspective
  
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
  
  // Convert 3D coordinates to 2D screen coordinates with enhanced perspective
  function to2D(x, y, z) {
    // Start with the canvas center as the vanishing point
    const vanishX = canvas.width / 2;
    const vanishY = canvas.height * FLOOR_Y;
    
    // Apply a tilt to create a more 3D view
    const tiltedY = y * Math.cos(PERSPECTIVE_ANGLE) - z * Math.sin(PERSPECTIVE_ANGLE);
    const tiltedZ = y * Math.sin(PERSPECTIVE_ANGLE) + z * Math.cos(PERSPECTIVE_ANGLE);
    
    // Calculate depth (1.0 at floor, smaller as z increases)
    const depth = 1.0 - (tiltedZ / 300);
    
    // Scale coordinates based on depth (more dramatic scaling)
    const scale = SCALE_FACTOR + (1.0 - SCALE_FACTOR) * depth;
    
    // Apply perspective transformation with more pronounced effect
    const screenX = vanishX + (x - gameState.courtWidth/2) * scale;
    const screenY = vanishY - tiltedZ * 0.8 - (gameState.courtHeight - tiltedY) * scale * 1.2;
    
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
    
    // Draw floor with 3D perspective grid
    drawFloorGrid();
    
    // Create court points with enhanced perspective
    const courtCorners = [
      to2D(0, 0, 0),                                  // Top-left
      to2D(gameState.courtWidth, 0, 0),               // Top-right
      to2D(gameState.courtWidth, gameState.courtHeight, 0), // Bottom-right
      to2D(0, gameState.courtHeight, 0)               // Bottom-left
    ];
    
    // Draw court floor with gradient for depth
    const floorGradient = context.createLinearGradient(
      courtCorners[0].x, courtCorners[0].y,
      courtCorners[2].x, courtCorners[2].y
    );
    floorGradient.addColorStop(0, '#d4b283'); // Lighter at top
    floorGradient.addColorStop(1, '#b89b72'); // Darker at bottom
    
    context.fillStyle = floorGradient;
    context.beginPath();
    context.moveTo(courtCorners[0].x, courtCorners[0].y);
    context.lineTo(courtCorners[1].x, courtCorners[1].y);
    context.lineTo(courtCorners[2].x, courtCorners[2].y);
    context.lineTo(courtCorners[3].x, courtCorners[3].y);
    context.closePath();
    context.fill();
    
    // Court outline with thicker border
    context.strokeStyle = '#333';
    context.lineWidth = 3;
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
    
    // Enhanced basket rendering
    drawEnhancedBaskets();
  }
  
  // New function to draw a 3D grid on the floor
  function drawFloorGrid() {
    context.strokeStyle = 'rgba(120, 100, 80, 0.2)';
    context.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 0; y <= gameState.courtHeight; y += 30) {
      const start = to2D(0, y, 0);
      const end = to2D(gameState.courtWidth, y, 0);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x <= gameState.courtWidth; x += 30) {
      const start = to2D(x, 0, 0);
      const end = to2D(x, gameState.courtHeight, 0);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  }
  
  // Enhanced basket rendering with more 3D detail
  function drawEnhancedBaskets() {
    // Left basket
    drawBasket3D(0, gameState.courtHeight/2, 0, true);
    
    // Right basket
    drawBasket3D(gameState.courtWidth, gameState.courtHeight/2, 0, false);
  }
  
  function drawBasket3D(x, y, z, isLeft) {
    const backboardHeight = 40;
    const backboardWidth = 60;
    const poleHeight = 120;
    
    // Draw vertical support pole
    const poleBottom = to2D(x, y, 0);
    const poleTop = to2D(x, y, poleHeight);
    
    // Gradient for pole
    const poleGradient = context.createLinearGradient(
      poleBottom.x, poleBottom.y,
      poleTop.x, poleTop.y
    );
    
    poleGradient.addColorStop(0, '#777');
    poleGradient.addColorStop(1, '#444');
    
    context.strokeStyle = poleGradient;
    context.lineWidth = 8 * poleBottom.scale;
    context.beginPath();
    context.moveTo(poleBottom.x, poleBottom.y);
    context.lineTo(poleTop.x, poleTop.y);
    context.stroke();
    
    // Draw backboard with 3D effect
    const backboardOffsetX = isLeft ? 20 : -20;
    const backboardZ = poleHeight - 20;
    
    const backboardTopLeft = to2D(x + backboardOffsetX - backboardWidth/2, y - backboardHeight/2, backboardZ);
    const backboardTopRight = to2D(x + backboardOffsetX + backboardWidth/2, y - backboardHeight/2, backboardZ);
    const backboardBottomRight = to2D(x + backboardOffsetX + backboardWidth/2, y + backboardHeight/2, backboardZ);
    const backboardBottomLeft = to2D(x + backboardOffsetX - backboardWidth/2, y + backboardHeight/2, backboardZ);
    
    // Backboard front face
    context.fillStyle = '#eee';
    context.beginPath();
    context.moveTo(backboardTopLeft.x, backboardTopLeft.y);
    context.lineTo(backboardTopRight.x, backboardTopRight.y);
    context.lineTo(backboardBottomRight.x, backboardBottomRight.y);
    context.lineTo(backboardBottomLeft.x, backboardBottomLeft.y);
    context.closePath();
    context.fill();
    
    // Backboard border
    context.strokeStyle = '#000';
    context.lineWidth = 2 * backboardTopLeft.scale;
    context.stroke();
    
    // Backboard target square
    const targetSize = backboardHeight * 0.4;
    const targetLeft = to2D(x + backboardOffsetX - targetSize/2, y - targetSize/2, backboardZ + 1);
    const targetWidth = (backboardTopRight.x - backboardTopLeft.x) * (targetSize / backboardWidth);
    const targetHeight = (backboardBottomLeft.y - backboardTopLeft.y) * (targetSize / backboardHeight);
    
    context.strokeStyle = '#ff4444';
    context.lineWidth = 2 * backboardTopLeft.scale;
    context.strokeRect(targetLeft.x, targetLeft.y, targetWidth, targetHeight);
    
    // Draw rim with 3D perspective
    const rimOffsetX = isLeft ? 30 : -30;
    const rimZ = backboardZ - 5;
    const rimCenter = to2D(x + rimOffsetX, y, rimZ);
    
    // Draw rim (appears as ellipse due to perspective)
    const rimRadius = 15 * rimCenter.scale;
    const rimEllipseY = 7 * rimCenter.scale; // Flattened for perspective
    
    // Rim shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.beginPath();
    context.ellipse(
      to2D(x + rimOffsetX, y, 0).x,
      to2D(x + rimOffsetX, y, 0).y,
      rimRadius * 0.8,
      rimEllipseY * 0.4,
      0, 0, Math.PI * 2
    );
    context.fill();
    
    // Rim with gradient for 3D effect
    const rimGradient = context.createLinearGradient(
      rimCenter.x - rimRadius, rimCenter.y,
      rimCenter.x + rimRadius, rimCenter.y
    );
    rimGradient.addColorStop(0, '#ff7722');
    rimGradient.addColorStop(0.5, '#ffaa44');
    rimGradient.addColorStop(1, '#ff7722');
    
    context.strokeStyle = rimGradient;
    context.lineWidth = 3 * rimCenter.scale;
    context.beginPath();
    context.ellipse(rimCenter.x, rimCenter.y, rimRadius, rimEllipseY, 0, 0, Math.PI * 2);
    context.stroke();
    
    // Draw net with 3D effect
    drawNet3D(x + rimOffsetX, y, rimZ, rimRadius, rimEllipseY, rimCenter.scale);
  }
  
  function drawNet3D(x, y, z, radiusX, radiusY, scale) {
    const netHeight = 35 * scale;
    const segments = 12;
    const verticals = 8;
    
    context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    context.lineWidth = 1 * scale;
    
    // Draw vertical net lines
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const startX = x + Math.cos(angle) * radiusX;
      const startY = y + Math.sin(angle) * radiusY;
      
      // Calculate position at bottom of net (narrower)
      const bottomX = x + Math.cos(angle) * radiusX * 0.3;
      const bottomY = y + Math.sin(angle) * radiusY * 0.3;
      const bottomZ = z - netHeight;
      
      const start = to2D(startX, startY, z);
      const end = to2D(bottomX, bottomY, bottomZ);
      
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    
    // Draw horizontal net rings
    for (let j = 1; j <= verticals; j++) {
      const ratio = j / verticals;
      const ringZ = z - ratio * netHeight;
      const ringRadiusX = radiusX * (1 - ratio * 0.7);
      const ringRadiusY = radiusY * (1 - ratio * 0.7);
      
      context.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const ringX = x + Math.cos(angle) * ringRadiusX;
        const ringY = y + Math.sin(angle) * ringRadiusY;
        
        const point = to2D(ringX, ringY, ringZ);
        
        if (i === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      }
      context.stroke();
    }
  }
  
  function drawScoreboard() {
    context.font = '24px Arial';
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    
    // Draw scores on top of the screen
    context.fillText(`BLUE: ${gameState.team1Score} - RED: ${gameState.team2Score}`, canvas.width/2, 30);
    
    // Draw control instructions
    context.font = '14px Arial';
    context.textAlign = 'left';
    context.fillText("Controls: Arrow Keys/WASD = Move, F = Shoot, Spacebar = Jump", 10, canvas.height - 10);
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
      // Guards stay outside the paint - add randomness to prevent clustering
      const targetX = player.team === 1 ? 
                      gameState.courtWidth * (0.7 + Math.random() * 0.1) : 
                      gameState.courtWidth * (0.3 - Math.random() * 0.1);
      const targetY = gameState.courtHeight * (0.3 + Math.random() * 0.1);
      moveToward(player, targetX, targetY, player.speed * 0.5);
    } else if (player.position === 'center') {
      // Centers stay in the paint - add variation
      const targetX = player.team === 1 ? 
                      gameState.courtWidth * (0.8 + Math.random() * 0.05) : 
                      gameState.courtWidth * (0.2 - Math.random() * 0.05);
      const targetY = centerY + Math.sin(gameState.gameTime * 2) * 20; // Move up and down a bit
      moveToward(player, targetX, targetY, player.speed * 0.5);
    } else {
      // Forwards find open space - with randomness
      const targetX = player.team === 1 ? 
                      gameState.courtWidth * (0.6 + Math.random() * 0.1) : 
                      gameState.courtWidth * (0.4 - Math.random() * 0.1);
      const targetY = gameState.courtHeight * (0.7 - Math.random() * 0.2);
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
                      gameState.courtWidth * (0.3 - Math.random() * 0.1) : 
                      gameState.courtWidth * (0.7 + Math.random() * 0.1);
      const targetY = gameState.courtHeight * (0.3 + Math.random() * 0.2);
      moveToward(player, targetX, targetY, player.speed * 0.6);
    } else if (player.position === 'center') {
      // Centers protect the paint
      const targetX = player.team === 1 ? 
                      gameState.courtWidth * (0.2 - Math.random() * 0.05) : 
                      gameState.courtWidth * (0.8 + Math.random() * 0.05);
      const randomOffset = Math.sin(gameState.gameTime) * 15;
      moveToward(player, targetX, centerY + randomOffset, player.speed * 0.6);
    } else {
      // Forwards find defensive position
      const targetX = player.team === 1 ? 
                      gameState.courtWidth * (0.4 - Math.random() * 0.1) : 
                      gameState.courtWidth * (0.6 + Math.random() * 0.1);
      const targetY = gameState.courtHeight * (0.7 - Math.random() * 0.15);
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
    
    // Draw the ball - Pass gameState as third parameter
    gameState.ball.draw(context, to2D, gameState);
    
    // Draw scoreboard
    drawScoreboard();
    
    // Draw touch controls for mobile
    if (window.controls.touchControls.active) {
      window.controls.drawTouchControls(context);
    }
    
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