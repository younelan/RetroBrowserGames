class Court {
  constructor(scene, width = 94, height = 50) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    
    // Store references to important objects
    this.leftBasket = null;
    this.rightBasket = null;
    this.boundaries = [];
    
    // Create court elements
    this.createGrassFloor();
    this.createCourtFloor();
    this.createAllCourtLines(); // Changed method name for clarity
    this.createBaskets();
    this.createBoundaries();
  }
  
  createGrassFloor() {
    // Create a large green plane for grass around the court
    const grassSize = 200; // Much larger than the court
    const grassGeometry = new THREE.PlaneGeometry(grassSize, grassSize);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x006400, // Dark green grass color
      roughness: 0.9,
      metalness: 0.0
    });
    
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    grass.position.y = -0.01; // Slightly below court level
    grass.receiveShadow = true;
    this.scene.add(grass);
  }
  
  createCourtFloor() {
    // Create court floor with dark brown wood texture
    const courtGeometry = new THREE.PlaneGeometry(this.width, this.height);
    
    // Use dark brown wood color
    const courtMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4037, // Dark brown wood color
      roughness: 0.8,
      metalness: 0.0
    });
    
    // Create court mesh
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    court.position.y = 0.01; // Slightly above grass
    court.receiveShadow = true;
    this.scene.add(court);
  }
  
  createAllCourtLines() {
    console.log("Creating all court lines"); // Debug logging
    
    // Use a bright, very visible material for all lines
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide // Make sure lines are visible from both sides
    });
    
    // Create perimeter lines
    this.createPerimeterLines(lineMaterial);
    
    // Create center lines - MORE VISIBLE
    this.createCenterLine(lineMaterial);
    this.createCenterCircle(lineMaterial);
    
    // Create three-point lines
    this.createThreePointLines(lineMaterial);
  }
  
  createPerimeterLines(material) {
    console.log("Creating perimeter lines"); // Debug logging
    
    // Use a thicker line for better visibility
    const lineWidth = 0.5;
    
    // CRITICAL CHANGE: Create perimeter lines as a single object for better visibility
    const perimeterShape = new THREE.Shape();
    perimeterShape.moveTo(-this.width/2, -this.height/2);
    perimeterShape.lineTo(this.width/2, -this.height/2);
    perimeterShape.lineTo(this.width/2, this.height/2);
    perimeterShape.lineTo(-this.width/2, this.height/2);
    perimeterShape.lineTo(-this.width/2, -this.height/2);
    
    // Create hole in the shape
    const holeWidth = this.width - lineWidth*2;
    const holeHeight = this.height - lineWidth*2;
    const hole = new THREE.Path();
    hole.moveTo(-holeWidth/2, -holeHeight/2);
    hole.lineTo(-holeWidth/2, holeHeight/2);
    hole.lineTo(holeWidth/2, holeHeight/2);
    hole.lineTo(holeWidth/2, -holeHeight/2);
    hole.lineTo(-holeWidth/2, -holeHeight/2);
    perimeterShape.holes.push(hole);
    
    const geometry = new THREE.ShapeGeometry(perimeterShape);
    const perimeter = new THREE.Mesh(geometry, material.clone());
    perimeter.rotation.x = -Math.PI / 2;
    perimeter.position.y = 0.05; // Raised HIGHER above court
    this.scene.add(perimeter);
  }
  
  createCenterLine(material) {
    console.log("Creating center line"); // Debug logging
    
    // Create MUCH THICKER center line for better visibility
    const lineWidth = 2.0; 
    
    // Create a plane geometry for the center line
    const centerLineGeometry = new THREE.PlaneGeometry(this.height, lineWidth);
    const centerLine = new THREE.Mesh(centerLineGeometry, material.clone());
    
    // Position and rotate correctly
    centerLine.rotation.x = -Math.PI / 2; // Make it horizontal
    centerLine.rotation.z = Math.PI / 2; // Rotate to go from side to side
    
    // Position the line at court center but MUCH higher above court surface
    centerLine.position.set(0, 0.1, 0); // Significantly higher
    
    this.scene.add(centerLine);
    console.log("Center line added at position:", centerLine.position);
  }
  
  createCenterCircle(material) {
    console.log("Creating center circle"); // Debug logging
    
    // Create THICKER center circle for better visibility
    const circleGeometry = new THREE.RingGeometry(6, 7, 64);
    const centerCircle = new THREE.Mesh(circleGeometry, material.clone());
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.08; // Position HIGHER above court
    this.scene.add(centerCircle);
    console.log("Center circle added at position:", centerCircle.position);
  }

  createThreePointLines(material) {
    console.log("Creating three-point lines");
    
    // Use thicker lines for better visibility
    const lineWidth = 1.0;
    
    // Left basket three-point line
    const leftBasketX = -this.width/2 + 5.25;
    this.createFixedThreePointLine(leftBasketX, 0, true, material.clone());
    
    // Right basket three-point line
    const rightBasketX = this.width/2 - 5.25;
    this.createFixedThreePointLine(rightBasketX, 0, false, material.clone());
  }

  // Completely redesigned three-point line creation that starts exactly at the court corners
  createFixedThreePointLine(basketX, basketZ, isLeftSide, material) {
    // Starting from the exact court edges with no offset
    const radius = 23.75; // NBA 3-point distance (radius)
    const lineWidth = 1.0;
    
    // Exact corner coordinates - now exactly at the edges
    const topCornerX = isLeftSide ? -this.width/2 : this.width/2;
    const topCornerZ = this.height/2;
    const bottomCornerX = isLeftSide ? -this.width/2 : this.width/2;
    const bottomCornerZ = -this.height/2;
    
    // Create arc for 3-point line
    const arcGeometry = new THREE.RingGeometry(
      radius,
      radius + lineWidth,
      64, // More segments for smoother arc
      1,
      isLeftSide ? -Math.PI/2 : Math.PI/2,
      Math.PI // Half circle
    );
    
    const arc = new THREE.Mesh(arcGeometry, material.clone());
    arc.rotation.x = -Math.PI / 2; // Make it horizontal
    arc.position.set(basketX, 0.09, basketZ); // Position higher above court
    this.scene.add(arc);
    
    // Calculate where the arc meets the straight lines at the court edges
    // To ensure proper alignment, we need to calculate where the arc's endpoints are
    const bottomArcX = basketX + (isLeftSide ? -radius : radius) * Math.cos(isLeftSide ? -Math.PI/2 : Math.PI/2);
    const bottomArcZ = basketZ + (isLeftSide ? -radius : radius) * Math.sin(isLeftSide ? -Math.PI/2 : Math.PI/2);
    
    const topArcX = basketX + (isLeftSide ? -radius : radius) * Math.cos(isLeftSide ? Math.PI/2 : 3*Math.PI/2);
    const topArcZ = basketZ + (isLeftSide ? -radius : radius) * Math.sin(isLeftSide ? Math.PI/2 : 3*Math.PI/2);
    
    // Create bottom straight line from court edge to arc endpoint
    this.createStraightLine(
      bottomCornerX, bottomCornerZ,
      bottomArcX, bottomCornerZ, 
      material.clone(),
      lineWidth
    );
    
    // Create top straight line from court edge to arc endpoint
    this.createStraightLine(
      topCornerX, topCornerZ,
      topArcX, topCornerZ,
      material.clone(),
      lineWidth
    );
    
    // REMOVED: Don't create the vertical connector lines that were causing the issue
  }

  createVisibleLine(x1, z1, x2, z2, lineWidth, material) {
    // Calculate direction and length
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx*dx + dz*dz);
    const angle = Math.atan2(dz, dx);
    
    // Create line geometry
    const lineGeometry = new THREE.PlaneGeometry(length, lineWidth);
    const line = new THREE.Mesh(lineGeometry, material);
    
    // Position and rotate the line
    line.rotation.x = -Math.PI / 2; // Make it horizontal
    line.position.y = 0.09; // Position HIGHER above court for visibility
    line.position.x = (x1 + x2) / 2;
    line.position.z = (z1 + z2) / 2;
    line.rotation.y = angle;
    
    this.scene.add(line);
    console.log(`Line added from (${x1},${z1}) to (${x2},${z2})`);
  }

  createStraightLine(x1, z1, x2, z2, material, lineWidth) {
    // Calculate direction and length
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx*dx + dz*dz);
    const angle = Math.atan2(dz, dx);
    
    // Create line geometry
    const lineGeometry = new THREE.PlaneGeometry(length, lineWidth);
    const line = new THREE.Mesh(lineGeometry, material);
    
    // Position and rotate the line
    line.rotation.x = -Math.PI / 2; // Make it horizontal
    line.position.y = 0.09; // Position HIGHER above court for visibility
    line.position.x = (x1 + x2) / 2;
    line.position.z = (z1 + z2) / 2;
    line.rotation.y = angle;
    
    this.scene.add(line);
    console.log(`Line added from (${x1},${z1}) to (${x2},${z2})`);
  }
  
  createBaskets() {
    // Move baskets outward by just the diameter of the hoop (~1.8 units)
    // Original positions: (-this.width/2 + 5.25, 0, 0) and (this.width/2 - 5.25, 0, 0)
    const outwardOffset = 1.8; // Diameter of the hoop
    
    // Adjust the x-position to move slightly outward while keeping the original offset from center
    this.leftBasket = this.createBasket(-this.width/2 + 5.25 - outwardOffset, 0, 0);
    this.rightBasket = this.createBasket(this.width/2 - 5.25 + outwardOffset, 0, 0);
  }
  
  createBasket(x, y, z) {
    // Create group to hold all basket components
    const basketGroup = new THREE.Group();
    basketGroup.position.set(x, 0, z);
    
    // Determine if this is left or right basket
    const isLeftBasket = x < 0;
    
    // FIX ORIENTATION: Rotate baskets to face the court center
    // Left basket should face right (toward positive X / center of court)
    // Right basket should face left (toward negative X / center of court)
    basketGroup.rotation.y = isLeftBasket ? Math.PI/2 : -Math.PI/2;
    this.scene.add(basketGroup);
    
    // Create a more realistic backboard with better visual appearance
    const backboardWidth = 6;
    const backboardHeight = 4;
    const backboardThickness = 0.2;
    
    // Main backboard (clear acrylic with texture)
    const backboardGeometry = new THREE.BoxGeometry(
      backboardWidth, backboardHeight, backboardThickness
    );
    
    // Create canvas texture for backboard
    const backboardCanvas = document.createElement('canvas');
    backboardCanvas.width = 512;
    backboardCanvas.height = 512;
    const ctx = backboardCanvas.getContext('2d');
    
    // Fill with semi-transparent white
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add subtle grid texture
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }
    
    // Create NBA/FIBA style rectangle on backboard
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 5;
    ctx.strokeRect(128, 128, 256, 180);
    
    const backboardTexture = new THREE.CanvasTexture(backboardCanvas);
    
    const backboardMaterial = new THREE.MeshStandardMaterial({
      map: backboardTexture,
      transparent: true,
      opacity: 0.8,
      roughness: 0.2,
      metalness: 0.1
    });
    
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(0, 10, 0);
    backboard.castShadow = true;
    basketGroup.add(backboard);
    
    // Create red targeting rectangle directly on backboard
    const targetWidth = 2;
    const targetHeight = 1.5;
    const targetGeometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
    const targetMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const targetRect = new THREE.Mesh(targetGeometry, targetMaterial);
    targetRect.position.set(0, 10 - 0.2, backboardThickness/2 + 0.01);
    basketGroup.add(targetRect);
    
    // Create rim with proper support brackets
    const rimRadius = 0.9;
    const rimTubeRadius = 0.05;
    const rimGeometry = new THREE.TorusGeometry(rimRadius, rimTubeRadius, 16, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff5500,
      roughness: 0.3,
      metalness: 0.8
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI/2;
    
    // FIXED: Position rim at correct height and distance from backboard
    // Standard basketball rim is 10 feet (3.05m) high and extends 15 inches (0.38m) from backboard
    rim.position.set(0, 10, backboardThickness/2 + 0.8);
    rim.castShadow = true;
    basketGroup.add(rim);
    
    // Create rim support brackets (two metal pieces connecting rim to backboard)
    const bracketGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.8);
    const bracketMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x999999,
      roughness: 0.3,
      metalness: 0.8 
    });
    
    // Left bracket
    const leftBracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
    leftBracket.position.set(-0.6, 10, backboardThickness/2 + 0.4);
    basketGroup.add(leftBracket);
    
    // Right bracket
    const rightBracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
    rightBracket.position.set(0.6, 10, backboardThickness/2 + 0.4);
    basketGroup.add(rightBracket);
    
    // Create better looking net
    const netGeometry = new THREE.CylinderGeometry(rimRadius, 0.4, 1.8, 16, 6, true);
    const netMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.set(0, 9.1, backboardThickness/2 + 0.8);
    basketGroup.add(net);
    
    // Create supporting pole structure
    const poleRadius = 0.15;
    const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, 10, 16);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.7 
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    
    // Position pole behind backboard
    pole.position.set(0, 5, -3);
    pole.castShadow = true;
    basketGroup.add(pole);
    
    // Create angled support arm connecting pole to backboard
    const armLength = 4;
    const supportGeometry = new THREE.BoxGeometry(0.2, 0.2, armLength);
    const supportMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.7
    });
    const supportArm = new THREE.Mesh(supportGeometry, supportMaterial);
    
    // Position and angle the support arm from pole to backboard
    supportArm.position.set(0, 9, -armLength/2 + backboardThickness/2);
    supportArm.rotation.x = -Math.PI/15; // Slight upward angle
    supportArm.castShadow = true;
    basketGroup.add(supportArm);
    
    // Create the base/stand
    const baseGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.25, -3);
    basketGroup.add(base);
    
    // Create scoring detection volume (invisible)
    const scoreDetectionGeometry = new THREE.BoxGeometry(1.8, 0.6, 1.8);
    const scoreDetectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.0 // Invisible in game
    });
    const scoreDetection = new THREE.Mesh(scoreDetectionGeometry, scoreDetectionMaterial);
    
    // Position detection box just under the rim
    scoreDetection.position.set(0, 9.6, backboardThickness/2 + 0.8);
    scoreDetection.name = isLeftBasket ? 'leftBasket' : 'rightBasket';
    basketGroup.add(scoreDetection);
    
    return scoreDetection; // Return the scoring detection object
  }
  
  createBoundaries() {
    // Create invisible walls to keep players on the court
    const wallMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0
    });
    
    // Create the four walls around the court
    const wallThickness = 1;
    const wallHeight = 10;
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.height);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-this.width/2 - wallThickness/2, wallHeight/2, 0);
    leftWall.name = "leftWall";
    this.scene.add(leftWall);
    this.boundaries.push(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.height);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(this.width/2 + wallThickness/2, wallHeight/2, 0);
    rightWall.name = "rightWall";
    this.scene.add(rightWall);
    this.boundaries.push(rightWall);
    
    // Top wall
    const topWallGeometry = new THREE.BoxGeometry(this.width + wallThickness*2, wallHeight, wallThickness);
    const topWall = new THREE.Mesh(topWallGeometry, wallMaterial);
    topWall.position.set(0, wallHeight/2, -this.height/2 - wallThickness/2);
    topWall.name = "topWall";
    this.scene.add(topWall);
    this.boundaries.push(topWall);
    
    // Bottom wall
    const bottomWallGeometry = new THREE.BoxGeometry(this.width + wallThickness*2, wallHeight, wallThickness);
    const bottomWall = new THREE.Mesh(bottomWallGeometry, wallMaterial);
    bottomWall.position.set(0, wallHeight/2, this.height/2 + wallThickness/2);
    bottomWall.name = "bottomWall";
    this.scene.add(bottomWall);
    this.boundaries.push(bottomWall);
  }
  
  // Utility methods to get important objects
  getLeftBasket() {
    return this.leftBasket;
  }
  
  getRightBasket() {
    return this.rightBasket;
  }
  
  getDimensions() {
    return { width: this.width, height: this.height };
  }
}
