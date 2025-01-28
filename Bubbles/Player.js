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
    // Jumping logic
    if (this.isJumping) {
      this.velocity += 0.8; // Gravity
      this.y += this.velocity;

      const platformBelow = this.checkPlatformBelow(levelGrid, gridSize);
      if (this.velocity > 0 && platformBelow) {
        this.y = platformBelow.y - this.height;
        this.isJumping = false;
        this.velocity = 0;
      }
    } else {
      const platformBelow = this.checkPlatformBelow(levelGrid, gridSize);
      if (!platformBelow) {
        this.velocity = 5;
        this.isJumping = false;
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
    if ((keys['ArrowUp'] || keys[' ']) && !this.isJumping) {
      this.isJumping = true;
      this.velocity = -10 * jumpHeight;
    }
  }

  isWallCollision(levelGrid, gridSize, speed) {
    const col = Math.floor((this.x + speed) / gridSize);
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
