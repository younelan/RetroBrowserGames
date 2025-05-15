class Ball {
  constructor(x, y, z, scene) {
    // Physical properties
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = 1.2; // Ball radius in 3D units
    this.held = false;
    this.heldBy = null;
    this.bounceCount = 0;
    this.shotDistance = 0;
    this.stealable = false;
    this.isPass = false;
    this.passTarget = null;
    
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
    // Skip physics if ball is held by a player
    if (this.held) {
      if (this.heldBy) {
        // Position ball in player's hands
        const player = this.heldBy;
        const holdHeight = 2; // Height to hold the ball
        
        // Calculate position based on player direction and dribble animation
        this.position.set(
          player.mesh.position.x + (player.direction.x > 0 ? 0.5 : -0.5),
          player.mesh.position.y + holdHeight,
          player.mesh.position.z + (player.direction.z > 0 ? 0.5 : -0.5)
        );
        
        // Update mesh position
        this.mesh.position.copy(this.position);
      }
      return;
    }
    
    // Apply gravity
    this.velocity.y -= 9.8 * deltaTime;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Apply spin/rotation based on velocity
    this.mesh.rotation.x += this.velocity.z * deltaTime * 0.1;
    this.mesh.rotation.z += this.velocity.x * deltaTime * 0.1;
    
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
    
    // Bounce off floor
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.bounceCount++;
      
      // Energy loss on bounce
      if (this.bounceCount < 5) {
        this.velocity.y = -this.velocity.y * 0.7;
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Create bounce effect
        this.createBounceEffect(scene);
      } else {
        // Ball stops after a few bounces
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
