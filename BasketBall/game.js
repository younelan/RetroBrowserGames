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
  const FLOOR_Y = 0.65; // Raised floor line position for better perspective
  const SCALE_FACTOR = 0.35; // Scale factor for distant objects
  const PERSPECTIVE_ANGLE = -0.3; // Reduced angle for less distortion
  
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
  
  // Convert 3D coordinates to 2D screen coordinates with improved perspective
  function to2D(x, y, z) {
    // Start with the canvas center as the vanishing point
    const vanishX = canvas.width / 2;
    const vanishY = canvas.height * FLOOR_Y;
    
    // Apply a tilt to create a more 3D view
    const tiltedY = y * Math.cos(PERSPECTIVE_ANGLE) - z * Math.sin(PERSPECTIVE_ANGLE);
    const tiltedZ = y * Math.sin(PERSPECTIVE_ANGLE) + z * Math.cos(PERSPECTIVE_ANGLE);
    
    // Calculate depth (1.0 at floor, smaller as z increases)
    const depth = 1.0 - (tiltedZ / 400);
    
    // Scale coordinates based on depth (more dramatic scaling)
    const scale = SCALE_FACTOR + (1.0 - SCALE_FACTOR) * depth;
    
    // Apply perspective transformation with more pronounced effect
    const screenX = vanishX + (x - gameState.courtWidth/2) * scale;
    const screenY = vanishY - tiltedZ * 0.8 - (gameState.courtHeight - tiltedY) * scale * 1.1;
    
    return { x: screenX, y: screenY, scale: scale };
  }
  
  function drawCourt() {
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stadium background first
    drawStadium();
    
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
  
  // New function to draw a stadium background
  function drawStadium() {
    // Gradient sky background
    const skyGradient = context.createLinearGradient(0, 0, 0, canvas.height * FLOOR_Y);
    skyGradient.addColorStop(0, '#1a2738');
    skyGradient.addColorStop(1, '#2c4356');
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, canvas.width, canvas.height * FLOOR_Y);
    
    // Stadium floor
    const floorGradient = context.createLinearGradient(0, canvas.height * FLOOR_Y, 0, canvas.height);
    floorGradient.addColorStop(0, '#3a3a3a');
    floorGradient.addColorStop(1, '#222222');
    context.fillStyle = floorGradient;
    context.fillRect(0, canvas.height * FLOOR_Y, canvas.width, canvas.height * (1 - FLOOR_Y));
    
    // Stadium seats (simplified)
    const seatRows = 10;
    const seatHeight = (canvas.height * FLOOR_Y) / seatRows;
    
    for (let i = 0; i < seatRows; i++) {
      const y = i * seatHeight;
      const color = i % 2 === 0 ? '#3a3a3a' : '#4a4a4a';
      
      context.fillStyle = color;
      context.fillRect(0, y, canvas.width, seatHeight);
    }
    
    // Stadium lights
    const lightCount = 4;
    const lightSpacing = canvas.width / (lightCount + 1);
    
    for (let i = 1; i <= lightCount; i++) {
      const x = i * lightSpacing;
      
      // Light pole
      context.fillStyle = '#555';
      context.fillRect(x - 2, 0, 4, canvas.height * FLOOR_Y * 0.3);
      
      // Light glow
      const gradient = context.createRadialGradient(
        x, canvas.height * FLOOR_Y * 0.3, 0,
        x, canvas.height * FLOOR_Y * 0.3, 50
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, canvas.height * FLOOR_Y * 0.3, 50, 0, Math.PI * 2);
      context.fill();
    }
  }
  
  // Enhanced floor grid with better perspective
  function drawFloorGrid() {
    // Create a radial gradient for the court
    const centerPt = to2D(gameState.courtWidth / 2, gameState.courtHeight / 2, 0);
    const cornerPt = to2D(0, 0, 0);
    const radius = Math.sqrt(
      Math.pow(centerPt.x - cornerPt.x, 2) + 
      Math.pow(centerPt.y - cornerPt.y, 2)
    );
    
    const floorGradient = context.createRadialGradient(
      centerPt.x, centerPt.y, 0,
      centerPt.x, centerPt.y, radius
    );
    floorGradient.addColorStop(0, '#c69c6d');
    floorGradient.addColorStop(1, '#a58b62');
    
    // Create court polygon
    const courtCorners = [
      to2D(0, 0, 0),                                  // Top-left
      to2D(gameState.courtWidth, 0, 0),               // Top-right
      to2D(gameState.courtWidth, gameState.courtHeight, 0), // Bottom-right
      to2D(0, gameState.courtHeight, 0)               // Bottom-left
    ];
    
    // Fill court with gradient
    context.fillStyle = floorGradient;
    context.beginPath();
    context.moveTo(courtCorners[0].x, courtCorners[0].y);
    context.lineTo(courtCorners[1].x, courtCorners[1].y);
    context.lineTo(courtCorners[2].x, courtCorners[2].y);
    context.lineTo(courtCorners[3].x, courtCorners[3].y);
    context.closePath();
    context.fill();
    
    // Court border
    context.strokeStyle = '#8B4513';
    context.lineWidth = 4;
    context.stroke();
    
    // Draw grid lines
    context.strokeStyle = 'rgba(120, 100, 80, 0.2)';
    context.lineWidth = 1;
    
    // Horizontal grid lines
    const gridSpacing = 20;
    for (let y = 0; y <= gameState.courtHeight; y += gridSpacing) {
      const start = to2D(0, y, 0);
      const end = to2D(gameState.courtWidth, y, 0);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    
    // Vertical grid lines
    for (let x = 0; x <= gameState.courtWidth; x += gridSpacing) {
      const start = to2D(x, 0, 0);
      const end = to2D(x, gameState.courtHeight, 0);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    
    // Court sides: add boards along the perimeter of the court
    drawCourtSides(courtCorners);
  }
  
  // Draw 3D court sides with boards
  function drawCourtSides(corners) {
    const sideHeight = 15; // Lower height for more realistic look
    
    // Calculate 3D coordinates for board tops
    const topCorners = [
      to2D(0, 0, sideHeight),
      to2D(gameState.courtWidth, 0, sideHeight),
      to2D(gameState.courtWidth, gameState.courtHeight, sideHeight),
      to2D(0, gameState.courtHeight, sideHeight)
    ];
    
    // Draw the sides in the correct order for proper depth
    const sides = [
      // Back side (furthest from viewer)
      {
        bottom: [corners[0], corners[1]],
        top: [topCorners[0], topCorners[1]],
        color: '#8B4513',
        shadowColor: '#5d2c09'
      },
      // Left side
      {
        bottom: [corners[0], corners[3]],
        top: [topCorners[0], topCorners[3]],
        color: '#9B5523',
        shadowColor: '#6d3c19'
      },
      // Right side
      {
        bottom: [corners[1], corners[2]],
        top: [topCorners[1], topCorners[2]],
        color: '#9B5523',
        shadowColor: '#6d3c19'
      },
      // Front side (closest to viewer)
      {
        bottom: [corners[3], corners[2]],
        top: [topCorners[3], topCorners[2]],
        color: '#8B4513', 
        shadowColor: '#5d2c09'
      }
    ];
    
    // Sort sides by depth for proper rendering order
    sides.sort((a, b) => {
      // Calculate average y-coordinate as depth indicator
      const avgYA = (a.bottom[0].y + a.bottom[1].y) / 2;
      const avgYB = (b.bottom[0].y + b.bottom[1].y) / 2;
      return avgYA - avgYB; // Sort from back to front
    });
    
    // Draw each side with proper shading
    sides.forEach(side => {
      const [b1, b2] = side.bottom;
      const [t1, t2] = side.top;
      
      // Create gradient for 3D effect
      const gradient = context.createLinearGradient(
        (b1.x + b2.x) / 2, (b1.y + b2.y) / 2,
        (t1.x + t2.x) / 2, (t1.y + t2.y) / 2
      );
      gradient.addColorStop(0, side.color);
      gradient.addColorStop(1, side.shadowColor);
      
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(b1.x, b1.y);
      context.lineTo(b2.x, b2.y);
      context.lineTo(t2.x, t2.y);
      context.lineTo(t1.x, t1.y);
      context.closePath();
      context.fill();
      
      // Add subtle edge highlights
      context.strokeStyle = side.shadowColor;
      context.lineWidth = 1;
      context.stroke();
    });
    
    // Top edges of the boards
    context.beginPath();
    context.moveTo(topCorners[0].x, topCorners[0].y);
    context.lineTo(topCorners[1].x, topCorners[1].y);
    context.lineTo(topCorners[2].x, topCorners[2].y);
    context.lineTo(topCorners[3].x, topCorners[3].y);
    context.closePath();
    context.lineWidth = 2;
    context.strokeStyle = '#7d4c29';
    context.stroke();
  }
  
  // Enhanced basket rendering with more 3D detail
  function drawEnhancedBaskets() {
    // Left basket
    drawBasket3D(0, gameState.courtHeight/2, 0, true);
    
    // Right basket
    drawBasket3D(gameState.courtWidth, gameState.courtHeight/2, 0, false);
  }
  
  // Improved basket rendering for better 3D appearance
  function drawBasket3D(x, y, z, isLeft) {
    const backboardHeight = 40;
    const backboardWidth = 60;
    const poleHeight = 120;
    
    // Draw vertical support pole with increased thickness
    const poleBottom = to2D(x, y, 0);
    const poleTop = to2D(x, y, poleHeight);
    
    // Create improved pole with 3D effect
    context.beginPath();
    context.moveTo(poleBottom.x - 4 * poleBottom.scale, poleBottom.y);
    context.lineTo(poleBottom.x + 4 * poleBottom.scale, poleBottom.y);
    context.lineTo(poleTop.x + 3 * poleTop.scale, poleTop.y);
    context.lineTo(poleTop.x - 3 * poleTop.scale, poleTop.y);
    context.closePath();
    
    // Gradient for 3D pole effect
    const poleGradient = context.createLinearGradient(
      poleBottom.x, poleBottom.y,
      poleTop.x, poleTop.y
    );
    poleGradient.addColorStop(0, '#666');
    poleGradient.addColorStop(0.5, '#888');
    poleGradient.addColorStop(1, '#444');
    
    context.fillStyle = poleGradient;
    context.fill();
    context.strokeStyle = '#333';
    context.lineWidth = 1;
    context.stroke();
    
    // Improved backboard with better 3D effect
    const backboardOffsetX = isLeft ? 20 : -20;
    const backboardZ = poleHeight - 20;
    
    // Define backboard corners with proper perspective
    const backboardCorners = {
      topLeft: to2D(x + backboardOffsetX - backboardWidth/2, y - backboardHeight/2, backboardZ),
      topRight: to2D(x + backboardOffsetX + backboardWidth/2, y - backboardHeight/2, backboardZ),
      bottomRight: to2D(x + backboardOffsetX + backboardWidth/2, y + backboardHeight/2, backboardZ),
      bottomLeft: to2D(x + backboardOffsetX - backboardWidth/2, y + backboardHeight/2, backboardZ)
    };
    
    // Draw backboard with depth
    // First the back face (slightly darker)
    const backZ = backboardZ - 3;
    const backboardBack = {
      topLeft: to2D(x + backboardOffsetX - backboardWidth/2, y - backboardHeight/2, backZ),
      topRight: to2D(x + backboardOffsetX + backboardWidth/2, y - backboardHeight/2, backZ),
      bottomRight: to2D(x + backboardOffsetX + backboardWidth/2, y + backboardHeight/2, backZ),
      bottomLeft: to2D(x + backboardOffsetX - backboardWidth/2, y + backboardHeight/2, backZ)
    };
    
    // Draw back face
    context.fillStyle = '#ddd';
    context.beginPath();
    context.moveTo(backboardBack.topLeft.x, backboardBack.topLeft.y);
    context.lineTo(backboardBack.topRight.x, backboardBack.topRight.y);
    context.lineTo(backboardBack.bottomRight.x, backboardBack.bottomRight.y);
    context.lineTo(backboardBack.bottomLeft.x, backboardBack.bottomLeft.y);
    context.closePath();
    context.fill();
    
    // Draw front face
    context.fillStyle = '#fff';
    context.beginPath();
    context.moveTo(backboardCorners.topLeft.x, backboardCorners.topLeft.y);
    context.lineTo(backboardCorners.topRight.x, backboardCorners.topRight.y);
    context.lineTo(backboardCorners.bottomRight.x, backboardCorners.bottomRight.y);
    context.lineTo(backboardCorners.bottomLeft.x, backboardCorners.bottomLeft.y);
    context.closePath();
    context.fill();
    
    // Draw edges to connect front and back
    context.strokeStyle = '#aaa';
    context.lineWidth = 1;
    
    // Connect front to back at corners
    for (const corner in backboardCorners) {
      context.beginPath();
      context.moveTo(backboardCorners[corner].x, backboardCorners[corner].y);
      context.lineTo(backboardBack[corner].x, backboardBack[corner].y);
      context.stroke();
    }
    
    // Draw backboard border
    context.strokeStyle = '#333';
    context.lineWidth = 2 * backboardCorners.topLeft.scale;
    context.beginPath();
    context.moveTo(backboardCorners.topLeft.x, backboardCorners.topLeft.y);
    context.lineTo(backboardCorners.topRight.x, backboardCorners.topRight.y);
    context.lineTo(backboardCorners.bottomRight.x, backboardCorners.bottomRight.y);
    context.lineTo(backboardCorners.bottomLeft.x, backboardCorners.bottomLeft.y);
    context.closePath();
    context.stroke();
    
    // Improved target square with better alignment
    const targetSize = backboardHeight * 0.4;
    const targetX = x + backboardOffsetX;
    const targetY = y;
    const targetPos = to2D(targetX - targetSize/2, targetY - targetSize/2, backboardZ + 0.5);
    const targetWidth = (backboardCorners.topRight.x - backboardCorners.topLeft.x) * (targetSize / backboardWidth);
    const targetHeight = (backboardCorners.bottomLeft.y - backboardCorners.topLeft.y) * (targetSize / backboardHeight);
    
    context.strokeStyle = '#ff3333';
    context.lineWidth = 2 * backboardCorners.topLeft.scale;
    context.strokeRect(targetPos.x, targetPos.y, targetWidth, targetHeight);
    
    // Improved rim with better 3D perspective
    const rimOffsetX = isLeft ? 30 : -30;
    const rimZ = backboardZ - 5;
    const rimCenter = to2D(x + rimOffsetX, y, rimZ);
    const rimRadius = 15 * rimCenter.scale;
    const rimEllipseY = 7 * rimCenter.scale; // Flattened for perspective
    
    // Draw rim shadow
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
    
    // Draw rim with 3D effect (cylinder)
    const rimThickness = 3 * rimCenter.scale;
    const rimDepth = 2 * rimCenter.scale;
    
    // Draw rim front edge
    context.strokeStyle = '#ff7722';
    context.lineWidth = rimThickness;
    context.beginPath();
    context.ellipse(rimCenter.x, rimCenter.y, rimRadius, rimEllipseY, 0, 0, Math.PI * 2);
    context.stroke();
    
    // Draw rim with gradient to suggest depth
    const rimGradient = context.createLinearGradient(
      rimCenter.x - rimRadius, rimCenter.y - rimEllipseY,
      rimCenter.x + rimRadius, rimCenter.y + rimEllipseY
    );
    rimGradient.addColorStop(0, '#ffaa44');
    rimGradient.addColorStop(0.5, '#ff7722');
    rimGradient.addColorStop(1, '#dd5500');
    
    context.strokeStyle = rimGradient;
    context.lineWidth = rimThickness * 0.6;
    context.beginPath();
    context.ellipse(rimCenter.x, rimCenter.y, rimRadius * 0.95, rimEllipseY * 0.95, 0, 0, Math.PI * 2);
    context.stroke();
    
    // Draw improved net with better 3D effect
    drawImprovedNet(x + rimOffsetX, y, rimZ, rimRadius, rimEllipseY, rimCenter.scale);
  }
  
  // Improved net drawing for better 3D appearance
  function drawImprovedNet(x, y, z, radiusX, radiusY, scale) {
    const netHeight = 35 * scale;
    const segments = 12;
    const horizontalLines = 6;
    
    // Translucent white for net
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 1.2 * scale;
    
    // Draw vertical net strings with better perspective
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const topX = x + Math.cos(angle) * radiusX;
      const topY = y + Math.sin(angle) * radiusY;
      const topZ = z;
      
      // Bottom point (narrower at bottom)
      const bottomX = x + Math.cos(angle) * (radiusX * 0.2);
      const bottomY = y + Math.sin(angle) * (radiusY * 0.2);
      const bottomZ = z - netHeight;
      
      const topPoint = to2D(topX, topY, topZ);
      const bottomPoint = to2D(bottomX, bottomY, bottomZ);
      
      context.beginPath();
      context.moveTo(topPoint.x, topPoint.y);
      context.lineTo(bottomPoint.x, bottomPoint.y);
      context.stroke();
    }
    
    // Draw horizontal net rings with proper perspective
    for (let j = 1; j <= horizontalLines; j++) {
      const ratio = j / horizontalLines;
      const currentZ = z - ratio * netHeight;
      
      // Calculate current radius (smaller as we go down)
      const currentRadiusX = radiusX * (1 - ratio * 0.8);
      const currentRadiusY = radiusY * (1 - ratio * 0.8);
      
      // Draw complete ring with better perspective
      context.beginPath();
      
      // Draw points around the rim
      const numPoints = 24; // More points for smoother ellipse
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const currentX = x + Math.cos(angle) * currentRadiusX;
        const currentY = y + Math.sin(angle) * currentRadiusY;
        
        const point = to2D(currentX, currentY, currentZ);
        
        if (i === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      }
      
      context.stroke();
    }
    
    // Add some random connecting threads for realism
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 0.6 * scale;
    
    for (let i = 0; i < 8; i++) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const ratio1 = Math.random() * 0.8; // Height ratio for first point
      const ratio2 = Math.random() * 0.8; // Height ratio for second point
      
      const z1 = z - ratio1 * netHeight;
      const z2 = z - ratio2 * netHeight;
      
      // Calculate radius at each height
      const r1x = radiusX * (1 - ratio1 * 0.8);
      const r1y = radiusY * (1 - ratio1 * 0.8);
      const r2x = radiusX * (1 - ratio2 * 0.8);
      const r2y = radiusY * (1 - ratio2 * 0.8);
      
      const x1 = x + Math.cos(angle1) * r1x;
      const y1 = y + Math.sin(angle1) * r1y;
      const x2 = x + Math.cos(angle2) * r2x;
      const y2 = y + Math.sin(angle2) * r2y;
      
      const pt1 = to2D(x1, y1, z1);
      const pt2 = to2D(x2, y2, z2);
      
      context.beginPath();
      context.moveTo(pt1.x, pt1.y);
      context.lineTo(pt2.x, pt2.y);
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