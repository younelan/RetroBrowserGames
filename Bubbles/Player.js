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
    if ((keys['ArrowUp'] ) && !this.isJumping) {
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
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
