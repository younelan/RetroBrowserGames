class Ball {
  constructor(x, y, z, scene) {
    // Physical properties
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = 0.6; // SMALLER ball radius (was 1.2)
    this.held = false;
    this.heldBy = null;
    this.bounceCount = 0;
    this.shotDistance = 0;
    this.stealable = false;
    this.isPass = false;
    this.passTarget = null;
    this.shotBy = null; // Track who shot the ball
    this.initialShotPosition = new THREE.Vector3(); // Store starting position of shot
    
    // Dribbling properties
    this.dribbleHeight = 0;
    this.dribblePhase = 0;
    this.isDribbling = false;
    
    // Create 3D model
    this.createMesh(scene);
    
    // Reference to scene
    this.scene = scene;
  }
  
  createMesh(scene) {
    // Create basketball geometry
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    
    // Make the basketball more orange to stand out against dirt court
    const material = new THREE.MeshStandardMaterial({
      color: 0xff5500, // Brighter orange for contrast
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Create ball mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    
    // Add seams (black lines)
    this.addSeams(scene);
    
    // Add to scene
    scene.add(this.mesh);
  }
  
  addSeams(scene) {
    // Add seam lines to make basketball recognizable
    const seamMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    
    // Horizontal seam
    const horizontalSeamGeometry = new THREE.BufferGeometry();
    const horizontalPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      horizontalPoints.push(
        this.radius * Math.cos(angle),
        0,
        this.radius * Math.sin(angle)
      );
    }
    horizontalSeamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(horizontalPoints, 3));
    const horizontalSeam = new THREE.Line(horizontalSeamGeometry, seamMaterial);
    this.mesh.add(horizontalSeam);
    
    // Vertical seams (perpendicular to each other)
    for (let i = 0; i < 2; i++) {
      const verticalSeamGeometry = new THREE.BufferGeometry();
      const verticalPoints = [];
      for (let j = 0; j <= 64; j++) {
        const angle = (j / 64) * Math.PI * 2;
        verticalPoints.push(
          i === 0 ? this.radius * Math.sin(angle) : 0,
          this.radius * Math.cos(angle),
          i === 0 ? 0 : this.radius * Math.sin(angle)
        );
      }
      verticalSeamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticalPoints, 3));
      const verticalSeam = new THREE.Line(verticalSeamGeometry, seamMaterial);
      this.mesh.add(verticalSeam);
    }
  }
  
  update(deltaTime, gameState, scene) {
    // EARLY SAFETY CHECK: If no scene, return to avoid errors
    if (!scene) return;
    
    // Track ball state changes but without console spam
    if (this._lastHeldState !== this.held) {
      this._lastHeldState = this.held;
    }
    
    // PLAYER CONTROL MODE: If ball is held by a player, handle dribbling
    if (this.held && this.heldBy) {
      const player = this.heldBy;
      
      // Check if player is moving - enable dribbling
      const isMoving = player.velocity && (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1);
      const playerHeight = 4.0; // Match doubled player height
      
      if (isMoving) {
        // Player is moving - dribble the ball
        this.isDribbling = true;
        
        // Update dribble phase
        this.dribblePhase += deltaTime * 5; // Adjust for dribble speed
        
        // Calculate dribble height using sine wave
        const dribbleAmplitude = 1.8; // Max height of dribble
        const minHeight = this.radius; // Lowest point (touching ground)
        
        // Calculate height using sine wave
        this.dribbleHeight = minHeight + Math.abs(Math.sin(this.dribblePhase)) * dribbleAmplitude;
        
        // Position ball beside player with dribble height
        const sideOffset = player.team === 1 ? 0.8 : -0.8; // Side offset
        this.position.set(
          player.mesh.position.x + sideOffset,
          this.dribbleHeight,
          player.mesh.position.z + 0.5
        );
        
        // Create bounce effect when ball is at lowest point
        if (this.dribbleHeight <= minHeight + 0.1 && Math.sin(this.dribblePhase) > 0) {
          this.createBounceEffect(scene);
        }
      } else {
        // Player is stationary - hold ball in hands
        this.isDribbling = false;
        this.dribbleHeight = playerHeight * 0.6; // Hold at 60% of player height
        
        // Position ball in player's hands
        const forwardDir = new THREE.Vector3(
          -Math.sin(player.mesh.rotation.y),
          0,
          -Math.cos(player.mesh.rotation.y)
        );
        
        this.position.set(
          player.mesh.position.x + forwardDir.x * 0.5,
          this.dribbleHeight,
          player.mesh.position.z + forwardDir.z * 0.5
        );
      }
      
      // Update mesh position
      this.mesh.position.copy(this.position);
      
      // Add subtle rotation while dribbling
      if (this.isDribbling) {
        this.mesh.rotation.x += 5 * deltaTime;
        this.mesh.rotation.z += 3 * deltaTime;
      }
      
      return;
    }
    
    // IMPROVED PASSING: Enhanced logic for passing to teammates
    if (this.isPass && this.passTarget) {
      // Get updated target position (aim higher for more reliable catches)
      const targetPos = this.passTarget.mesh.position.clone();
      targetPos.y += 3.0; // Aim higher (was 2.4)
      
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.position);
      const distanceToTarget = toTarget.length();
      
      // SIGNIFICANTLY IMPROVED CATCH DETECTION: Make catching much easier
      // Increased catch radius from 2.5 to 5.0
      if (distanceToTarget < 5.0) {
        // Much higher catch probability (90% chance when close)
        if (distanceToTarget < 3.0 || Math.random() < 0.9) {
          // Force ball into player's hands
          this.position.copy(targetPos);
          this.mesh.position.copy(this.position);
          
          // Reset velocity before pickup
          this.velocity.set(0, 0, 0);
          
          // Let player catch the ball
          this.passTarget.pickupBall(this);
          this.isPass = false;
          this.passTarget = null;
          return;
        }
      }
      
      // MUCH STRONGER HOMING: Greatly improved guidance for passes
      // Increased homing range and strength for better targeting
      if (distanceToTarget < 15) { // Increased from 8 to 15
        // Stronger correction based on distance
        const homingStrength = Math.min(0.95, 5 / distanceToTarget); // Stronger homing (was 0.8)
        
        // Better trajectory calculation with proper arc
        const targetVelocity = toTarget.normalize().multiplyScalar(this.velocity.length() * 0.9);
        
        // Ensure ball stays airborne with upward component
        targetVelocity.y = Math.max(targetVelocity.y, 3); // Minimum upward velocity
        
        // Apply stronger trajectory correction
        this.velocity.lerp(targetVelocity, deltaTime * homingStrength * 2.0); // Doubled correction factor
      }
    }
    
    // PHYSICS SIMULATION - This is the critical part for free flying balls
    
    // Apply gravity
    this.velocity.y -= 28 * deltaTime;
    
    // CRITICAL FIX: FORCE CLEAR ANY HELD REFERENCES IF VELOCITY EXISTS
    // This prevents a player reference from erroneously holding the ball in place
    if (!this.held && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1 || Math.abs(this.velocity.z) > 0.1)) {
      this.heldBy = null; // Double-ensure heldBy is null when moving freely
    }
    
    // Move the ball based on velocity - THIS IS CRITICAL
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // EXPLICITLY update mesh position to match calculated position
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    
    // Apply spin based on velocity
    this.mesh.rotation.x += this.velocity.z * deltaTime * 0.3;
    this.mesh.rotation.z -= this.velocity.x * deltaTime * 0.3;
    
    // COURT BOUNDARY COLLISIONS
    const halfWidth = gameState.courtWidth ? gameState.courtWidth / 2 : 47;
    const halfHeight = gameState.courtHeight ? gameState.courtHeight / 2 : 25;
    
    // Handle collisions with court boundaries
    if (this.position.x < -halfWidth + this.radius) {
      this.position.x = -halfWidth + this.radius;
      this.velocity.x *= -0.8; // Energy loss on bounce
    } else if (this.position.x > halfWidth - this.radius) {
      this.position.x = halfWidth - this.radius;
      this.velocity.x *= -0.8;
    }
    
    if (this.position.z < -halfHeight + this.radius) {
      this.position.z = -halfHeight + this.radius;
      this.velocity.z *= -0.8;
    } else if (this.position.z > halfHeight - this.radius) {
      this.position.z = halfHeight - this.radius;
      this.velocity.z *= -0.8;
    }
    
    // FLOOR BOUNCE: Make more energetic
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.bounceCount++;
      
      // More energetic bounce - first bounce higher, then lose energy faster
      if (this.bounceCount < 5) {
        const bounceFactor = this.bounceCount === 1 ? 0.8 : (0.75 - (this.bounceCount * 0.12));
        this.velocity.y = -this.velocity.y * bounceFactor;
        this.velocity.x *= 0.85; // More friction on court
        this.velocity.z *= 0.85;
        
        // Create visible bounce effect
        this.createBounceEffect(scene);
        
        // Log bounce for debugging
        console.log(`BOUNCE #${this.bounceCount} - vel y after: ${this.velocity.y.toFixed(2)}`);
      } else {
        // Ball stops bouncing after several bounces
        this.velocity.y = 0;
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Stop completely when velocity is low
        if (Math.abs(this.velocity.x) < 0.8 && Math.abs(this.velocity.z) < 0.8) {
          this.velocity.set(0, 0, 0);
          console.log("Ball stopped moving");
        }
      }
    }
    
    // Calculate shot distance for scoring if this is a shot
    if (this.shotBy && this.initialShotPosition.lengthSq() > 0) {
      const dx = this.position.x - this.initialShotPosition.x;
      const dz = this.position.z - this.initialShotPosition.z;
      this.shotDistance = Math.sqrt(dx*dx + dz*dz);
    }
  }
  
  // Create visual effect when ball bounces
  createBounceEffect(scene) {
    if (!scene) return;
    
    // Create a ring that expands and fades
    const ringGeometry = new THREE.RingGeometry(0.1, 0.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(this.position.x, 0.05, this.position.z);
    ring.rotation.x = -Math.PI / 2; // Lay flat
    scene.add(ring);
    
    // Animate the ring expansion and fading
    const initialTime = Date.now();
    const duration = 500; // milliseconds
    
    function animateRing() {
      const elapsed = Date.now() - initialTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        scene.remove(ring);
        ring.geometry.dispose();
        ringMaterial.dispose();
        return;
      }
      
      // Scale up
      const scale = 1 + progress * 3;
      ring.scale.set(scale, scale, 1);
      
      // Fade out
      ringMaterial.opacity = 0.7 * (1 - progress);
      
      requestAnimationFrame(animateRing);
    }
    
    animateRing();
  }
  
  // Reset ball to center court - FIXED to ensure ball is properly free
  reset() {
    this.velocity.set(0, 0, 0);
    this.position.set(0, 5, 0);
    this.mesh.position.copy(this.position);
    this.bounceCount = 0;
    this.held = false; // Explicitly set to false
    this.heldBy = null; // Clear reference
    this.isPass = false;
    this.passTarget = null;
    this.shotBy = null;
    this.initialShotPosition.set(0, 0, 0);
    
    console.log("BALL RESET - Now free at position:", this.position.y.toFixed(2));
  }
}

// Helper function to show score message (to be called within the game scope)
function showScoringMessage(gameState, scoringTeam, points) {
  // This function would add a temporary visual effect
  // Implementation would depend on the game rendering system
  console.log(`Team ${scoringTeam} scored ${points} points!`);
}
