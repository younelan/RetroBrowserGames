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
  const x = this.x;
  const y = this.y;
  const width = this.width;
  const height = this.height;
  const direction = this.direction || 1;

  ctx.save();

  if (direction === -1) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
  } else {
      ctx.translate(x, y);
  }

  // Body (rounded rectangle)
  const bodyGradient = ctx.createLinearGradient(0, 0, width, 0); // Horizontal gradient
  bodyGradient.addColorStop(0, 'hsl(250, 70%, 50%)'); // Lighter, more bluish purple
  bodyGradient.addColorStop(1, 'hsl(250, 70%, 30%)'); // Darker edges

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  const cornerRadius = width * 0.15; // Adjust for corner roundness
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(width - cornerRadius, 0);
  ctx.arcTo(width, 0, width, cornerRadius, cornerRadius); // Top-right corner
  ctx.lineTo(width, height - cornerRadius);
  ctx.arcTo(width, height, width - cornerRadius, height, cornerRadius); // Bottom-right
  ctx.lineTo(cornerRadius, height);
  ctx.arcTo(0, height, 0, height - cornerRadius, cornerRadius); // Bottom-left
  ctx.lineTo(0, cornerRadius);
  ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius); // Top-left
  ctx.closePath();
  ctx.fill();

  // Arms (more defined)
  ctx.fillStyle = 'hsl(250, 70%, 40%)'; // Slightly darker arms
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.4); // Adjusted arm positions
  ctx.lineTo(width * 0.3, height * 0.6);
  ctx.lineTo(width * 0.2, height * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width * 0.9, height * 0.4); // Adjusted arm positions
  ctx.lineTo(width * 0.7, height * 0.6);
  ctx.lineTo(width * 0.8, height * 0.7);
  ctx.closePath();
  ctx.fill();


  // Head (slightly separated)
  const headYOffset = -height * 0.2; // More head separation
  const headGradient = ctx.createRadialGradient(width / 2, height / 2 + headYOffset, 0, width / 2, height / 2 + headYOffset, width * 0.2); // Smaller head
  headGradient.addColorStop(0, 'hsl(250, 70%, 60%)'); // Lighter head
  headGradient.addColorStop(1, 'hsl(250, 70%, 40%)');

  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.ellipse(width / 2, height / 2 + headYOffset, width * 0.2, height * 0.2, 0, 0, Math.PI * 2); // Smaller head
  ctx.fill();

  // Eyes (black, to the sides)
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(width * 0.3, height / 2 + headYOffset - height * 0.1, width * 0.04, 0, Math.PI * 2); // Left eye
  ctx.arc(width * 0.7, height / 2 + headYOffset - height * 0.1, width * 0.04, 0, Math.PI * 2); // Right eye
  ctx.fill();

  // Shoes (red dots at the bottom)
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(width * 0.3, height * 0.9, width * 0.05, 0, Math.PI * 2); // Left shoe
  ctx.arc(width * 0.7, height * 0.9, width * 0.05, 0, Math.PI * 2); // Right shoe
  ctx.fill();


  ctx.restore();
}

}
