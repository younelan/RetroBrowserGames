// player.js

export class Player {
  constructor(x, y, gridSize) {
    this.x = x;
    this.y = y;
    this.width = gridSize;
    this.height = gridSize;
    this.speed = 5;
    this.velocity = 0;
    this.isJumping = false;
  }

  moveLeft() {
    this.x -= this.speed;
  }

  moveRight() {
    this.x += this.speed;
  }

  jump() {
    if (!this.isJumping) {
      this.velocity = -12;
      this.isJumping = true;
    }
  }

  update() {
    if (this.isJumping) {
      this.velocity += 0.8; // Gravity
      this.y += this.velocity;
      if (this.y >= gameHeight - this.height) {
        this.y = gameHeight - this.height;
        this.isJumping = false;
        this.velocity = 0;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  canMoveTo(x, y, grid, gridSize) {
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);
    if (gridX < 0 || gridY < 0 || gridX >= gameWidth / gridSize || gridY >= gameHeight / gridSize) {
      return false;
    }
    const cell = grid[gridY][gridX];
    return cell === 'B' || cell === '1';
  }
}

