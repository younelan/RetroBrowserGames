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
    // If ball is held by a player, handle dribbling
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
    
    // Not held by player - apply physics
    
    // Apply stronger gravity for faster fall
    this.velocity.y -= 15 * deltaTime;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Apply spin/rotation based on velocity
    this.mesh.rotation.x += this.velocity.z * deltaTime * 0.2;
    this.mesh.rotation.z += this.velocity.x * deltaTime * 0.2;
    
    // Court boundaries
    const halfWidth = gameState.courtWidth / 2;
    const halfHeight = gameState.courtHeight / 2;
    
    // Bounce off court boundaries
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
    
    // Bounce off floor with improved physics
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.bounceCount++;
      
      // More energetic bounces with realistic dampening
      if (this.bounceCount < 8) { // Allow more bounces
        const bounceFactor = 0.75 - (this.bounceCount * 0.05); // Gradual energy loss
        this.velocity.y = -this.velocity.y * bounceFactor;
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Create bounce effect
        this.createBounceEffect(scene);
      } else {
        // Ball stops after several bounces
        this.velocity.y = 0;
        this.velocity.x *= 0.95;
        this.velocity.z *= 0.95;
        
        // Stop completely when very slow
        if (Math.abs(this.velocity.x) < 0.5 && Math.abs(this.velocity.z) < 0.5) {
          this.velocity.set(0, 0, 0);
        }
      }
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
  
  // Reset ball to center court
  reset() {
    this.velocity.set(0, 0, 0);
    this.position.set(0, 5, 0);
    this.mesh.position.copy(this.position);
    this.bounceCount = 0;
    this.held = false;
    this.heldBy = null;
  }
}

// Helper function to show score message (to be called within the game scope)
function showScoringMessage(gameState, scoringTeam, points) {
  // This function would add a temporary visual effect
  // Implementation would depend on the game rendering system
  console.log(`Team ${scoringTeam} scored ${points} points!`);
}
