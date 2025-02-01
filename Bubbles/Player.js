export class Player {
  constructor(x, y, width, height, speed, direction = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.velocity = 0;
    this.isJumping = false;
    this.direction = direction;
  }

  update(keys, levelGrid, gridSize, jumpHeight) {
    // Check if the cell below is empty
    const platformBelow = this.checkPlatformBelow(levelGrid, gridSize);
    if (!this.isJumping && !platformBelow) {
      this.velocity += 0.8; // Gravity
      this.y += this.velocity;

      // Ensure the player stops falling when hitting a platform
      const newPlatformBelow = this.checkPlatformBelow(levelGrid, gridSize);
      if (newPlatformBelow) {
        this.y = newPlatformBelow.y - this.height;
        this.velocity = 0;
      }
    } else if (this.isJumping) {
      // Existing jumping logic
      this.velocity += 0.8;
      this.y += this.velocity;

      if (this.velocity > 0 && platformBelow) {
        this.y = platformBelow.y - this.height;
        this.isJumping = false;
        this.velocity = 0;
      }
    }

    // Horizontal movement
    if (keys['ArrowLeft'] && !this.isWallCollision(levelGrid, gridSize, -this.speed)) {
      this.x -= this.speed;
      this.direction = -1;
    }

    if (keys['ArrowRight'] && !this.isWallCollision(levelGrid, gridSize, this.speed)) {
      this.x += this.speed;
      this.direction = 1;
    }

    // Jumping with space or up arrow
    if ((keys['ArrowUp']) && !this.isJumping) {
      this.isJumping = true;
      this.velocity = -10 * jumpHeight;
    }
  }

  isWallCollision(levelGrid, gridSize, speed) {
    const col = Math.floor((this.x + (speed > 0 ? this.width : 0) + speed) / gridSize); // Adjust for width on the right
    const row = Math.floor(this.y / gridSize);
    return levelGrid[row] && levelGrid[row][col] === 'B';
  }


  checkPlatformBelow(levelGrid, gridSize) {
    const col = Math.floor(this.x / gridSize);
    const row = Math.floor((this.y + this.height) / gridSize);
    if (levelGrid[row] && levelGrid[row][col] === 'B') {
      return { x: col * gridSize, y: row * gridSize };
    }
    return null;
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const width = this.width;
    const height = this.height;
    const direction = -this.direction || 1;

    ctx.save();

    if (direction === -1) {
        ctx.translate(x + width, y);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(x, y);
    }

    // Lighting/Shading Calculations (for 3D effect)
    const lightX = this.x + this.width / 2; // Example light source position
    const lightY = 0;  // Light source above
    const shadeFactor = Math.max(0, 1 - Math.sqrt((lightX - (x + width/2))**2 + (lightY - (y + height/2))**2) / 300); // Adjust divisor for spread

    // Body with Gradient and Shading
    const bodyGradient = ctx.createLinearGradient(0, 0, width, 0);
    bodyGradient.addColorStop(0, `hsl(120, 100%, ${40 + shadeFactor * 30}%)`); // Darker green at edges
    bodyGradient.addColorStop(1, `hsl(120, 100%, ${70 + shadeFactor * 30}%)`); // Lighter green in center

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.5);
    ctx.bezierCurveTo(width * 0.2, height * 0.1, width * 0.8, height * 0.1, width * 0.9, height * 0.5);
    ctx.lineTo(width * 0.7, height * 0.7);
    ctx.lineTo(width * 0.9, height);
    ctx.lineTo(width * 0.8, height * 0.8);
    ctx.lineTo(width * 0.7, height * 0.7);
    ctx.closePath();
    ctx.fill();

    // Belly with subtle gradient
    const bellyGradient = ctx.createRadialGradient(width * 0.5, height * 0.6, 0, width * 0.5, height * 0.6, width * 0.4);
    bellyGradient.addColorStop(0, 'lightgreen');
    bellyGradient.addColorStop(1, 'green');
    ctx.fillStyle = bellyGradient;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.6, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head with shading
    ctx.fillStyle = `hsl(120, 100%, ${50 + shadeFactor * 20}%)`; // Slightly darker head
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.quadraticCurveTo(width * 0.2, height * 0.2, width * 0.4, height * 0.3);
    ctx.lineTo(width * 0.4, height * 0.5);
    ctx.closePath();
    ctx.fill();

    // Eye with shine (more 3D)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.4, width * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.4, width * 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // White shine
    ctx.beginPath();
    ctx.arc(width * 0.27, height * 0.38, width * 0.02, 0, Math.PI * 2); // Smaller white circle
    ctx.fill();

    // Spike with shading
    ctx.fillStyle = `hsl(100, 100%, ${30 + shadeFactor * 20}%)`; // Darker spike
    ctx.beginPath();
    ctx.moveTo(width * 0.2, height * 0.15);
    ctx.lineTo(width * 0.3, 0);
    ctx.lineTo(width * 0.4, height * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

}
