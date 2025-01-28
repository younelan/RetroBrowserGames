export class Monster {
  constructor(x, y, width, height, speed, direction = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = direction;
  }

  update(levelGrid, gridSize) {
    const gridX = Math.floor(this.x / gridSize);
    const gridY = Math.floor(this.y / gridSize);

    const leftCell = levelGrid[gridY][gridX - 1];
    const rightCell = levelGrid[gridY][gridX + 1];
    const belowCell = levelGrid[gridY + 1] ? levelGrid[gridY + 1][gridX] : null;

    // Change direction when hitting a wall
    if (this.direction === 1 && rightCell === 'B') {
      this.direction = -1;
    } else if (this.direction === -1 && leftCell === 'B') {
      this.direction = 1;
    }

    // Fall if no platform below
    if (belowCell !== 'B') {
      this.y += this.speed;
    }

    this.x += this.direction * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
