// monster.js

export class Monster {
  constructor(x, y, gridSize) {
    this.x = x;
    this.y = y;
    this.width = gridSize;
    this.height = gridSize;
    this.speed = 2;
    this.direction = 1; // 1 for right, -1 for left
  }

  move(grid, gridSize) {
    const gridX = Math.floor(this.x / gridSize);
    const gridY = Math.floor(this.y / gridSize);

    const leftCell = grid[gridY][gridX - 1];
    const rightCell = grid[gridY][gridX + 1];

    if ((this.direction === 1 && rightCell !== 'B') || (this.direction === -1 && leftCell !== 'B')) {
      this.direction *= -1;
    }

    this.x += this.direction * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

