export class Monster {
  constructor(x, y, width, height, speed, direction = 1) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    const baseSpeed = 2; // Base monster speed
    this.speed = (speed / 2) * (width / 60); // Scale speed to grid size
    this.direction = direction;
    this.isTrapped = false;
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
        this.y += this.speed * 1.5; // Faster falling
    }

    this.x += this.direction * this.speed * 1.2; // Slightly faster horizontal movement
}

draw(ctx) {
  const x = this.x;
  const y = this.y;
  const width = this.width;
  const height = this.height;
  const direction = this.direction || 1;
  
  // Scale all measurements relative to gridSize
  const scale = width / 60; // 60 is the base grid size

  ctx.save();

  if (direction === -1) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
  } else {
      ctx.translate(x, y);
  }

  // Scale all drawings relative to base size
  ctx.scale(width / 60, height / 60);

  const baseSize = 60;
  // Draw using fixed base coordinates
  const cornerRadius = baseSize * 0.15;

  // Body (rounded rectangle)
  const bodyGradient = ctx.createLinearGradient(0, 0, baseSize, 0); // Horizontal gradient
  bodyGradient.addColorStop(0, 'hsl(250, 70%, 50%)'); // Lighter, more bluish purple
  bodyGradient.addColorStop(1, 'hsl(250, 70%, 30%)'); // Darker edges

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(baseSize - cornerRadius, 0);
  ctx.arcTo(baseSize, 0, baseSize, cornerRadius, cornerRadius); // Top-right corner
  ctx.lineTo(baseSize, baseSize - cornerRadius);
  ctx.arcTo(baseSize, baseSize, baseSize - cornerRadius, baseSize, cornerRadius); // Bottom-right
  ctx.lineTo(cornerRadius, baseSize);
  ctx.arcTo(0, baseSize, 0, baseSize - cornerRadius, cornerRadius); // Bottom-left
  ctx.lineTo(0, cornerRadius);
  ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius); // Top-left
  ctx.closePath();
  ctx.fill();

  // Arms (more defined)
  ctx.fillStyle = 'hsl(250, 70%, 40%)'; // Slightly darker arms
  ctx.beginPath();
  ctx.moveTo(baseSize * 0.1, baseSize * 0.4); // Adjusted arm positions
  ctx.lineTo(baseSize * 0.3, baseSize * 0.6);
  ctx.lineTo(baseSize * 0.2, baseSize * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(baseSize * 0.9, baseSize * 0.4); // Adjusted arm positions
  ctx.lineTo(baseSize * 0.7, baseSize * 0.6);
  ctx.lineTo(baseSize * 0.8, baseSize * 0.7);
  ctx.closePath();
  ctx.fill();

  // Head (slightly separated)
  const headYOffset = -baseSize * 0.2; // More head separation
  const headGradient = ctx.createRadialGradient(baseSize / 2, baseSize / 2 + headYOffset, 0, baseSize / 2, baseSize / 2 + headYOffset, baseSize * 0.2); // Smaller head
  headGradient.addColorStop(0, 'hsl(250, 70%, 60%)'); // Lighter head
  headGradient.addColorStop(1, 'hsl(250, 70%, 40%)');

  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.ellipse(baseSize / 2, baseSize / 2 + headYOffset, baseSize * 0.2, baseSize * 0.2, 0, 0, Math.PI * 2); // Smaller head
  ctx.fill();

  // Eyes (black, to the sides)
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(baseSize * 0.3, baseSize / 2 + headYOffset - baseSize * 0.1, baseSize * 0.04, 0, Math.PI * 2); // Left eye
  ctx.arc(baseSize * 0.7, baseSize / 2 + headYOffset - baseSize * 0.1, baseSize * 0.04, 0, Math.PI * 2); // Right eye
  ctx.fill();

  // Shoes (red dots at the bottom)
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(baseSize * 0.3, baseSize * 0.9, baseSize * 0.05, 0, Math.PI * 2); // Left shoe
  ctx.arc(baseSize * 0.7, baseSize * 0.9, baseSize * 0.05, 0, Math.PI * 2); // Right shoe
  ctx.fill();

  ctx.restore();
}

}
