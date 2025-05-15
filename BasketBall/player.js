class Player {
  constructor(x, y, z, team, color, position, scene) {
    // Basic properties
    this.team = team;
    this.color = color;
    this.position = position; // basketball position (point guard, etc.)
    this.radius = 1;
    this.height = 4.0; // DOUBLED height from 2 to 4 meters
    this.isUserControlled = false;
    
    // Game stats
    this.speed = 13; // Units per second
    this.shooting_accuracy = 0.6; // 0-1 value
    this.basketball_iq = 0.6; // 0-1 value
    this.rebounding = 0.5; // 0-1 value
    this.stamina = 1.0; // 0-1 value
    this.ball_control = 0.7; // 0-1 value for dribbling
    
    // Movement states
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.direction = new THREE.Vector3(0, 0, 0);
    this.isJumping = false;
    this.jumpForce = 0;
    this.jumpCooldown = 0;
    
    // Ball handling
    this.hasBall = false;
    this.shootCooldown = 0;
    this.passCooldown = 0;
    this.stealCooldown = 0;
    this.justStoleTheBall = false;
    this.stealCooldownTimer = 0;
    
    // Animation states
    this.dribblePhase = 0;
    this.dribbleSpeed = 5; // Dribbles per second
    this.dribbleSide = team === 1 ? 1 : -1; // Which side to dribble (right or left)
    
    // AI decision making
    this.decisionTimer = 0;
    this.targetPosition = new THREE.Vector3(x, 0, z);
    
    // Create 3D model
    this.createModel(x, y, z, scene);
    
    // Add to scene
    this.scene = scene;
  }
  
  createModel(x, y, z, scene) {
    // Create a group to hold all player parts
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);
    
    // Set primary and secondary colors based on team - bright and recognizable
    const primaryColor = this.team === 1 ? 0x0066ff : 0xff3300;
    const secondaryColor = this.team === 1 ? 0x99ccff : 0xff9966;
    
    // Create body (torso) - TALLER for doubled height
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.6, 3.0, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: primaryColor });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 2.0; // Raised position to match height
    this.body.castShadow = true;
    this.mesh.add(this.body);
    
    // Create head - Proportional to new height
    const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf8d8c0 }); // Skin tone
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 4.2; // Higher position for taller player
    this.head.castShadow = true;
    this.mesh.add(this.head);
    
    // Create legs - LONGER for taller player
    const legGeometry = new THREE.CylinderGeometry(0.3, 0.2, 2.4, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: secondaryColor });
    
    // Left leg
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(-0.35, 1.2, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);
    
    // Right leg
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(0.35, 1.2, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);
    
    // Create arms - LONGER for taller player
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.15, 2.2, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: primaryColor });
    
    // Left arm
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(-1.0, 2.8, 0);
    this.leftArm.rotation.z = Math.PI / 3; // Angle arm outward
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);
    
    // Right arm
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(1.0, 2.8, 0);
    this.rightArm.rotation.z = -Math.PI / 3; // Angle arm outward
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);
    
    // Add jersey number
    this.addJerseyNumber();
    
    // Create player shadow - BIGGER for taller player
    const shadowGeometry = new THREE.CircleGeometry(1.2, 16);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2; // Lay flat on ground
    this.shadow.position.y = 0.01; // Just above the ground
    this.mesh.add(this.shadow);
    
    // Add visual indicator for user-controlled player
    if (this.isUserControlled) {
      // Create a bright arrow above player
      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(0, 0.5);
      arrowShape.lineTo(0.3, 0);
      arrowShape.lineTo(-0.3, 0);
      arrowShape.lineTo(0, 0.5);
      
      const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
      const arrowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide
      });
      this.controlArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      this.controlArrow.position.y = 2.6; // Above player's head
      this.mesh.add(this.controlArrow);
      
      // Add a ring under the player
      const ringGeometry = new THREE.RingGeometry(0.8, 0.9, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2; // Lay flat
      ring.position.y = 0.02; // Just above ground
      this.mesh.add(ring);
    }
    
    // Add simple position indicator text
    this.addPositionIndicator();
    
    // Add to scene
    scene.add(this.mesh);
  }
  
  addJerseyNumber() {
    // Create a canvas texture for the jersey number
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Clear canvas with team color
    context.fillStyle = this.team === 1 ? '#0066ff' : '#ff3300';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add jersey number
    const playerNumber = this.team === 1 ? 
      (this.position === 'pointGuard' ? '1' : 
       this.position === 'shootingGuard' ? '2' : '3') :
      (this.position === 'pointGuard' ? '1' : 
       this.position === 'powerForward' ? '4' : '5');
    
    // Add text
    context.font = 'bold 90px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(playerNumber, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const numberTexture = new THREE.CanvasTexture(canvas);
    
    // Create a larger plane on the front of the jersey
    const numberGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const numberMaterial = new THREE.MeshBasicMaterial({
      map: numberTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
    numberMesh.position.set(0, 1.0, 0.41); // Position on chest
    numberMesh.rotation.y = Math.PI; // Face forward
    this.mesh.add(numberMesh);
    
    // Add back number too
    const backNumber = numberMesh.clone();
    backNumber.position.z = -0.41; // Position on back
    backNumber.rotation.y = 0; // Face backward
    this.mesh.add(backNumber);
  }
  
  addPositionIndicator() {
    // Create a simple text sprite showing player position
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create positional text abbreviation
    let positionText;
    switch(this.position) {
      case 'pointGuard': positionText = 'PG'; break;
      case 'shootingGuard': positionText = 'SG'; break;
      case 'powerForward': positionText = 'PF'; break;
      case 'center': positionText = 'C'; break;
      default: positionText = this.position;
    }
    
    // Add position text
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = this.team === 1 ? '#0066ff' : '#ff3300';
    context.fillText(positionText, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const indicatorTexture = new THREE.CanvasTexture(canvas);
    
    // Create sprite material using the texture
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: indicatorTexture,
      transparent: true
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 2.6, 0); // Position above player head
    sprite.scale.set(1.5, 0.4, 1);
    this.mesh.add(sprite);
  }
  
  // Process user input
  handleUserInput(deltaTime, gameState) {
    const keys = window.controls.keys;
    const moveSpeed = this.speed * deltaTime;
    
    // Reset velocity
    this.velocity.set(0, 0, 0);
    
    // Movement directions
    if (keys['ArrowUp'] || keys['w']) this.velocity.z -= moveSpeed;
    if (keys['ArrowDown'] || keys['s']) this.velocity.z += moveSpeed;
    if (keys['ArrowLeft'] || keys['a']) this.velocity.x -= moveSpeed;
    if (keys['ArrowRight'] || keys['d']) this.velocity.x += moveSpeed;
    
    // Normalize diagonal movement
    if (this.velocity.x !== 0 && this.velocity.z !== 0) {
      this.velocity.x *= 0.7071; // 1 / sqrt(2)
      this.velocity.z *= 0.7071;
    }
    
    // Apply movement
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    
    // Keep player within court boundaries
    this.keepOnCourt(gameState);
    
    // Update direction for animation
    if (this.velocity.length() > 0.1) {
      this.direction.copy(this.velocity).normalize();
      
      // Set player facing direction
      this.mesh.rotation.y = Math.atan2(-this.velocity.x, -this.velocity.z);
      
      // Animate legs when moving
      this.animateRunning(deltaTime);
    } else {
      this.resetLegAnimation();
    }
    
    // Handle jumping
    if ((keys[' '] || keys['Spacebar']) && !this.isJumping && this.jumpCooldown <= 0) {
      this.jump();
    }
    
    // Update jump
    this.updateJump(deltaTime);
    
    // Handle shooting
    if ((keys['f'] || keys['F']) && this.hasBall && this.shootCooldown <= 0) {
      this.shoot(gameState);
    }
    
    // Handle passing (not implemented yet)
    if ((keys['e'] || keys['E']) && this.hasBall && this.passCooldown <= 0) {
      this.findAndPassToTeammate(gameState);
    }
    
    // Update cooldowns
    this.updateCooldowns(deltaTime);
  }
  
  // Update for AI offensive player
  updateOffense(deltaTime, gameState) {
    const ball = gameState.ball;
    
    // Try to get loose ball if nearby
    if (!ball.held && this.mesh.position.distanceTo(ball.mesh.position) < 5 && ball.mesh.position.y < 2) {
      this.moveTowards(ball.mesh.position, deltaTime * this.speed);
      return;
    }
    
    // If this player has the ball
    if (this.hasBall) {
      // Get basket position for this team
      const basketX = this.team === 1 ? gameState.courtWidth/2 - 5.25 : -gameState.courtWidth/2 + 5.25;
      const basketPosition = new THREE.Vector3(basketX, 10, 0);
      
      // Calculate distance to basket
      const distanceToBasket = this.mesh.position.distanceTo(basketPosition);
      
      // Consider passing to a teammate
      if (Math.random() < 0.02 * this.basketball_iq) {
        this.findAndPassToTeammate(gameState);
      }
      
      // Shoot if in good position
      const goodShot = distanceToBasket < 15 || (distanceToBasket < 25 && this.shooting_accuracy > 0.7);
      
      if (goodShot && this.shootCooldown <= 0) {
        // Check if defender is too close
        const closeDefenders = gameState.players.filter(p => 
          p.team !== this.team && 
          p.mesh.position.distanceTo(this.mesh.position) < 3
        );
        
        // Shoot if open or close to basket
        if (closeDefenders.length === 0 || distanceToBasket < 7) {
          this.shoot(gameState);
          return;
        }
      }
      
      // Dribble toward basket
      const targetPosition = new THREE.Vector3(basketX, 0, 0);
      
      // Adjust target based on defenders
      const defenders = gameState.players.filter(p => p.team !== this.team);
      defenders.forEach(defender => {
        if (defender.mesh.position.distanceTo(this.mesh.position) < 5) {
          // Avoid defender by adding repulsion vector
          const awayVector = new THREE.Vector3().subVectors(
            this.mesh.position,
            defender.mesh.position
          ).normalize().multiplyScalar(2);
          
          // Adjust target to avoid defender
          targetPosition.add(awayVector);
        }
      });
      
      // Move toward adjusted target
      this.moveTowards(targetPosition, deltaTime * this.speed * 0.8); // Slower when dribbling
    } else {
      // Position without ball - move to strategic position
      this.updateOffensivePosition(deltaTime, gameState);
    }
    
    // Update cooldowns
    this.updateCooldowns(deltaTime);
  }
  
  // Update for AI defensive player
  updateDefense(deltaTime, gameState) {
    const ball = gameState.ball;
    
    // Try to get loose ball if nearby
    if (!ball.held && this.mesh.position.distanceTo(ball.mesh.position) < 5 && ball.mesh.position.y < 2) {
      this.moveTowards(ball.mesh.position, deltaTime * this.speed);
      return;
    }
    
    // If ball carrier exists
    if (ball.heldBy && ball.heldBy.team !== this.team) {
      const ballCarrier = ball.heldBy;
      
      // Calculate distance to ball carrier
      const distanceToBallCarrier = this.mesh.position.distanceTo(ballCarrier.mesh.position);
      
      // Get basket position for this team to defend
      const basketX = this.team === 1 ? -gameState.courtWidth/2 + 5.25 : gameState.courtWidth/2 - 5.25;
      const basketPosition = new THREE.Vector3(basketX, 0, 0);
      
      // Check if this player should guard the ball carrier
      const shouldGuardBallCarrier = 
        (this.position === ballCarrier.position) || // Same position matchup
        distanceToBallCarrier < 3; // Already close
      
      if (shouldGuardBallCarrier) {
        // Man-to-man defense - position between ball and basket
        const defenseVector = new THREE.Vector3().subVectors(
          basketPosition,
          ballCarrier.mesh.position
        ).normalize().multiplyScalar(2);
        
        const defensePosition = new THREE.Vector3().addVectors(
          ballCarrier.mesh.position,
          defenseVector
        );
        
        // Move to defensive position
        this.moveTowards(defensePosition, deltaTime * this.speed);
        
        // Try to steal if close enough and ball is stealable
        if (distanceToBallCarrier < 2 && this.stealCooldown <= 0) {
          this.attemptSteal(ballCarrier, gameState);
        }
      } else {
        // Zone defense - position based on role
        this.updateDefensivePosition(deltaTime, gameState, ballCarrier);
      }
    } else {
      // No ball carrier - basic defensive positioning
      this.updateDefensivePosition(deltaTime, gameState, null);
    }
    
    // Update cooldowns
    this.updateCooldowns(deltaTime);
  }
  
  // Position player in offensive formation
  updateOffensivePosition(deltaTime, gameState) {
    // Find ball carrier on same team
    const ballCarrier = gameState.ball.heldBy;
    const basketX = this.team === 1 ? gameState.courtWidth/2 - 5.25 : -gameState.courtWidth/2 + 5.25;
    
    if (ballCarrier && ballCarrier.team === this.team) {
      // Position based on role relative to ball carrier
      let offsetX = 0, offsetZ = 0;
      
      switch(this.position) {
        case 'pointGuard':
          offsetX = this.team === 1 ? 5 : -5;
          offsetZ = -8;
          break;
        case 'shootingGuard':
          offsetX = this.team === 1 ? 8 : -8;
          offsetZ = 8;
          break;
        case 'center':
          offsetX = this.team === 1 ? 12 : -12;
          offsetZ = 0;
          break;
        case 'powerForward':
          offsetX = this.team === 1 ? 10 : -10;
          offsetZ = -6;
          break;
        default:
          offsetX = this.team === 1 ? 6 : -6;
          offsetZ = 6;
      }
      
      // Set target position relative to ball carrier
      const targetPosition = new THREE.Vector3(
        ballCarrier.mesh.position.x + offsetX,
        0,
        ballCarrier.mesh.position.z + offsetZ
      );
      
      // Move toward position
      this.moveTowards(targetPosition, deltaTime * this.speed * 0.6);
    } else {
      // No ball carrier - move to default offensive position
      let targetX, targetZ;
      
      // Position based on offensive side of court
      const offensiveHalf = this.team === 1 ? 1 : -1;
      
      switch(this.position) {
        case 'pointGuard':
          targetX = offensiveHalf * 10;
          targetZ = 0;
          break;
        case 'shootingGuard':
          targetX = offensiveHalf * 15;
          targetZ = -10;
          break;
        case 'center':
          targetX = offensiveHalf * 20;
          targetZ = 2;
          break;
        case 'powerForward':
          targetX = offensiveHalf * 18;
          targetZ = 10;
          break;
        default:
          targetX = offensiveHalf * 12;
          targetZ = 8;
      }
      
      // Move toward position
      this.moveTowards(new THREE.Vector3(targetX, 0, targetZ), deltaTime * this.speed * 0.5);
    }
  }
  
  // Position player in defensive formation
  updateDefensivePosition(deltaTime, gameState, ballCarrier) {
    // Calculate defensive position
    const basketX = this.team === 1 ? -gameState.courtWidth/2 + 5.25 : gameState.courtWidth/2 - 5.25;
    const basketPosition = new THREE.Vector3(basketX, 0, 0);
    
    let targetPosition;
    
    if (ballCarrier) {
      // Position based on ball position and defensive role
      let offsetX = 0, offsetZ = 0;
      
      // Adjust defensive positioning based on player's role
      switch(this.position) {
        case 'pointGuard':
          // Guards defend perimeter
          offsetX = this.team === 1 ? 12 : -12;
          offsetZ = -8;
          break;
        case 'shootingGuard':
          offsetX = this.team === 1 ? 8 : -8;
          offsetZ = 10;
          break;
        case 'center':
          // Centers protect the paint
          offsetX = this.team === 1 ? 3 : -3;
          offsetZ = 0;
          break;
        case 'powerForward':
          offsetX = this.team === 1 ? 6 : -6;
          offsetZ = -6;
          break;
        default:
          offsetX = this.team === 1 ? 8 : -8;
          offsetZ = 6;
      }
      
      // Create vector from basket to ball
      const ballToBasketVector = new THREE.Vector3().subVectors(
        basketPosition,
        ballCarrier.mesh.position
      ).normalize();
      
      // Position along this vector with offset based on role
      targetPosition = new THREE.Vector3().addVectors(
        basketPosition,
        new THREE.Vector3(offsetX, 0, offsetZ)
      );
      
      // Move toward ball more if it's on the same side as the player
      if (Math.sign(ballCarrier.mesh.position.z) === Math.sign(offsetZ)) {
        targetPosition.lerp(ballCarrier.mesh.position, 0.3);
      }
    } else {
      // No ball carrier - basic defensive positioning around basket
      const defensiveRadius = 10;
      let angle;
      
      switch(this.position) {
        case 'pointGuard':
          angle = 0;
          break;
        case 'shootingGuard':
          angle = Math.PI / 4;
          break;
        case 'center':
          angle = Math.PI / 2;
          break;
        case 'powerForward':
          angle = 3 * Math.PI / 4;
          break;
        default:
          angle = Math.PI;
      }
      
      targetPosition = new THREE.Vector3(
        basketX + Math.cos(angle) * defensiveRadius * (this.team === 1 ? 1 : -1),
        0,
        Math.sin(angle) * defensiveRadius
      );
    }
    
    // Move toward defensive position
    this.moveTowards(targetPosition, deltaTime * this.speed * 0.7);
  }
  
  // Move toward a target position
  moveTowards(targetPosition, speed) {
    // Direction vector to target
    const direction = new THREE.Vector3().subVectors(
      targetPosition,
      this.mesh.position
    );
    
    // Only move if not already at the target
    if (direction.length() > 0.1) {
      // Normalize and scale by speed
      direction.normalize().multiplyScalar(speed);
      
      // Store direction for animation
      this.direction = direction.clone();
      
      // Update position
      this.mesh.position.add(direction);
    } else {
      this.direction.set(0, 0, 0);
    }
    
    // Rotate player to face direction of movement
    if (direction.length() > 0.01) {
      const targetRotation = Math.atan2(-direction.x, -direction.z);
      
      // Smoothly rotate toward target direction
      const currentRotation = this.mesh.rotation.y;
      const rotationDiff = targetRotation - currentRotation;
      
      // Handle wrap-around for angles
      let deltaRotation = rotationDiff;
      if (rotationDiff > Math.PI) deltaRotation -= Math.PI * 2;
      if (rotationDiff < -Math.PI) deltaRotation += Math.PI * 2;
      
      // Apply smooth rotation
      this.mesh.rotation.y += deltaRotation * 0.1;
    }
    
    // Animate movement
    this.animateRunning(speed);
  }
  
  // Jump with greater height to match player height
  jump() {
    if (this.isJumping || this.jumpCooldown > 0) return;
    
    this.isJumping = true;
    this.jumpForce = 15; // Higher jump force (was 10)
    this.jumpCooldown = 0.5; // Cooldown in seconds
  }
  
  // Update jump physics
  updateJump(deltaTime) {
    if (this.isJumping) {
      // Apply jump force with gravity
      this.mesh.position.y += this.jumpForce * deltaTime;
      this.jumpForce -= 30 * deltaTime; // Gravity
      
      // Check for landing
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.isJumping = false;
        this.jumpForce = 0;
      }
    }
    
    // Update jump cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
    }
  }
  
  // Keep player within court boundaries
  keepOnCourt(gameState) {
    const halfWidth = gameState.courtWidth / 2;
    const halfHeight = gameState.courtHeight / 2;
    const buffer = 1; // Keep slight distance from edge
    
    // Clamp X position
    if (this.mesh.position.x < -halfWidth + buffer) {
      this.mesh.position.x = -halfWidth + buffer;
    } else if (this.mesh.position.x > halfWidth - buffer) {
      this.mesh.position.x = halfWidth - buffer;
    }
    
    // Clamp Z position
    if (this.mesh.position.z < -halfHeight + buffer) {
      this.mesh.position.z = -halfHeight + buffer;
    } else if (this.mesh.position.z > halfHeight - buffer) {
      this.mesh.position.z = halfHeight - buffer;
    }
  }
  
  // Animate legs when running
  animateRunning(speed) {
    // Only animate if moving significantly
    if (speed > 0.1) {
      // Calculate animation frequency based on speed
      const frequency = speed * 3;
      
      // Update leg positions based on sinusoidal movement
      const legAngle = Math.sin(Date.now() * 0.01 * frequency) * 0.5;
      
      // Apply rotation to legs
      this.leftLeg.rotation.x = -legAngle;
      this.rightLeg.rotation.x = legAngle;
      
      // Apply smaller arm rotation in opposite phase
      this.leftArm.rotation.x = legAngle * 0.7;
      this.rightArm.rotation.x = -legAngle * 0.7;
    }
  }
  
  // Reset leg animation to standing position
  resetLegAnimation() {
    this.leftLeg.rotation.x = 0;
    this.rightLeg.rotation.x = 0;
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;
  }
  
  // Shoot the ball
  shoot(gameState) {
    if (!this.hasBall) return;
    
    // Release ball
    this.hasBall = false;
    const ball = gameState.ball;
    ball.held = false;
    ball.heldBy = null;
    
    // Determine which basket to aim for
    const basketX = this.team === 1 ? gameState.courtWidth/2 - 5.25 : -gameState.courtWidth/2 + 5.25;
    const basketPosition = new THREE.Vector3(basketX, 10, 0);
    
    // Calculate distance to basket
    const distance = this.mesh.position.distanceTo(basketPosition);
    ball.shotDistance = distance;
    
    // Calculate direction to basket
    const direction = new THREE.Vector3().subVectors(
      basketPosition,
      new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z)
    ).normalize();
    
    // Set ball velocity for shot
    const speed = 20 + distance * 0.5; // Faster for longer shots
    
    // Apply player's shooting accuracy
    const accuracyFactor = this.isUserControlled ? 0.95 : this.shooting_accuracy;
    const randomFactor = 1 - ((1 - accuracyFactor) * (distance / 30));
    
    // Add small random variation based on skill
    const variation = new THREE.Vector3(
      (Math.random() - 0.5) * (1 - randomFactor) * 0.1,
      (Math.random() - 0.5) * (1 - randomFactor) * 0.1,
      (Math.random() - 0.5) * (1 - randomFactor) * 0.1
    );
    
    // Calculate arc height based on distance
    const arcHeight = 15 + distance * 0.15;
    
    // Set ball launch velocity with appropriate arc for shot
    ball.velocity.set(
      direction.x * speed + variation.x,
      arcHeight + variation.y, // Higher arc for longer shots
      direction.z * speed + variation.z
    );
    
    // Position ball slightly above and in front of hands
    ball.mesh.position.set(
      this.mesh.position.x + direction.x * 0.5,
      this.mesh.position.y + 2,
      this.mesh.position.z + direction.z * 0.5
    );
    ball.position.copy(ball.mesh.position);
    
    // Set shooting animation - jump when shooting
    this.jump();
    
    // Set cooldown
    this.shootCooldown = 1.5; // 1.5 seconds
  }
  
  // Find an open teammate and pass the ball
  findAndPassToTeammate(gameState) {
    if (!this.hasBall) return;
    
    // Find teammates
    const teammates = gameState.players.filter(p => p !== this && p.team === this.team);
    if (teammates.length === 0) return;
    
    // Evaluate each teammate as a passing target
    let bestTeammate = null;
    let bestScore = -1;
    
    teammates.forEach(teammate => {
      // Calculate how open this teammate is
      let openness = 1.0;
      
      // Check distance to nearest defender
      gameState.players.filter(p => p.team !== this.team).forEach(defender => {
        const dist = teammate.mesh.position.distanceTo(defender.mesh.position);
        if (dist < 5) {
          openness *= (dist / 5); // Closer defenders reduce openness more
        }
      });
      
      // Factor in distance to basket
      const basketX = this.team === 1 ? gameState.courtWidth/2 - 5.25 : -gameState.courtWidth/2 + 5.25;
      const basketPosition = new THREE.Vector3(basketX, 10, 0);
      const distToBasket = teammate.mesh.position.distanceTo(basketPosition);
      const positionScore = 1 - (distToBasket / 50); // Closer to basket is better
      
      // Calculate overall score
      const score = (openness * 0.7) + (positionScore * 0.3);
      
      if (score > bestScore) {
        bestScore = score;
        bestTeammate = teammate;
      }
    });
    
    // Pass to the best teammate if score is good enough
    if (bestTeammate && bestScore > 0.4) {
      this.pass(bestTeammate, gameState);
    }
  }
  
  // Pass the ball to a teammate
  pass(receiver, gameState) {
    if (!this.hasBall) return;
    
    // Release ball
    this.hasBall = false;
    const ball = gameState.ball;
    ball.held = false;
    ball.heldBy = null;
    ball.isPass = true;
    ball.passTarget = receiver;
    
    // Calculate direction to receiver
    const passDirection = new THREE.Vector3().subVectors(
      receiver.mesh.position,
      this.mesh.position
    ).normalize();
    
    // Calculate distance to receiver
    const distance = this.mesh.position.distanceTo(receiver.mesh.position);
    
    // Set ball velocity for pass
    const passSpeed = 25; // Faster than shooting
    const arcHeight = 7 + distance * 0.07; // Higher arc for taller players
    
    ball.velocity.set(
      passDirection.x * passSpeed,
      arcHeight,
      passDirection.z * passSpeed
    );
    
    // Position ball at the passer's hands (at the higher position)
    ball.mesh.position.set(
      this.mesh.position.x + passDirection.x * 0.7,
      this.mesh.position.y + 2.4, // Higher hand position
      this.mesh.position.z + passDirection.z * 0.7
    );
    ball.position.copy(ball.mesh.position);
    
    // Set cooldown
    this.passCooldown = 0.5; // Half-second cooldown
  }
  
  // Pick up the ball (adjusted for height)
  pickupBall(ball) {
    if (ball.held) return;
    
    // Update ball state
    this.hasBall = true;
    ball.held = true;
    ball.heldBy = this;
    ball.isPass = false;
    ball.passTarget = null;
    
    // Reset ball physics
    ball.velocity.set(0, 0, 0);
    
    // Position ball in player's hands at the new height
    ball.mesh.position.set(
      this.mesh.position.x + (this.team === 1 ? 0.5 : -0.5),
      this.mesh.position.y + 2.4, // Higher hand position for taller players
      this.mesh.position.z
    );
    ball.position.copy(ball.mesh.position);
  }
  
  // Try to steal the ball
  attemptSteal(ballHandler, gameState) {
    if (this.stealCooldown > 0) return false;
    if (ballHandler.team === this.team) return false;
    
    // Calculate distance
    const distance = this.mesh.position.distanceTo(ballHandler.mesh.position);
    if (distance > 2.5) return false;
    
    // Calculate steal chance based on various factors
    let stealChance = 0.03; // Base chance
    
    // Increase chance if ball is low in dribble
    if (gameState.ball.mesh.position.y < 1) {
      stealChance += 0.2;
    }
    
    // Point guards are better at stealing
    if (this.position === 'pointGuard') {
      stealChance += 0.1;
    }
    
    // Ball handler's control reduces steal chance
    stealChance *= (1 - ballHandler.ball_control);
    
    // User-controlled players are harder to steal from
    if (ballHandler.isUserControlled) {
      stealChance *= 0.6;
    }
    
    // Attempt steal
    if (Math.random() < stealChance) {
      // Successful steal
      ballHandler.hasBall = false;
      this.hasBall = true;
      gameState.ball.held = true;
      gameState.ball.heldBy = this;
      
      // Position ball in stealer's hands
      gameState.ball.mesh.position.set(
        this.mesh.position.x + (this.team === 1 ? 0.5 : -0.5),
        this.mesh.position.y + 1.5,
        this.mesh.position.z
      );
      gameState.ball.position.copy(gameState.ball.mesh.position);
      
      // Set cooldown
      ballHandler.stealCooldown = 1.0;
      this.stealCooldown = 0.5;
      
      // Flag for special behavior after steal
      this.justStoleTheBall = true;
      this.stealCooldownTimer = 1.5;
      
      return true;
    }
    
    // Failed steal attempt
    this.stealCooldown = 0.3;
    return false;
  }
  
  // Update cooldowns
  updateCooldowns(deltaTime) {
    if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
    if (this.passCooldown > 0) this.passCooldown -= deltaTime;
    if (this.stealCooldown > 0) this.stealCooldown -= deltaTime;
    if (this.stealCooldownTimer > 0) {
      this.stealCooldownTimer -= deltaTime;
      if (this.stealCooldownTimer <= 0) {
        this.justStoleTheBall = false;
      }
    }
  }
}