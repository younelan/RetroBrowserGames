export class Monster {
  constructor(x, y, width, height, speed, direction = 1) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = direction;
  }

  resetPosition() {
    this.x = this.startX;
    this.y = this.startY;
  }

  update(levelGrid, gridSize) {
    const gridX = Math.floor(this.x / gridSize);
    const gridY = Math.floor(this.y / gridSize);

    // Ensure the grid cell exists before accessing it
    if (!levelGrid[gridY]) return;

    const leftCell = levelGrid[gridY][gridX - 1];
    const rightCell = levelGrid[gridY][gridX + 1];
    const belowCell = levelGrid[gridY + 1] ? levelGrid[gridY + 1][gridX] : null;

    if (this.direction === 1 && rightCell === 'B') {
        this.direction = -1;
    } else if (this.direction === -1 && leftCell === 'B') {
        this.direction = 1;
    }

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
