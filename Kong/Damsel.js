export class Damsel {
  static WIDTH = 30;
  static HEIGHT = 40;
  constructor({ x, y, width = Damsel.WIDTH, height = Damsel.HEIGHT }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update(level, deltaTime) {
    // Damsel does not move in classic DK
  }

  render(ctx, scale = 1) {
    // Use the original drawPauline logic from graphics.js, but allow width/height override
    const x = this.x * scale;
    const y = this.y * scale;
    const width = (this.width || 30) * scale;
    const height = (this.height || 40) * scale;
    // Dress
    ctx.fillStyle = '#ff69b4'; // Pink
    ctx.fillRect(x, y + height * 0.3, width, height * 0.7);
    // Skin
    ctx.fillStyle = '#f0c0a0'; // Skin color
    ctx.fillRect(x + width * 0.1, y, width * 0.8, height * 0.4);
    // Hair
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(x, y, width, height * 0.2);
    ctx.fillRect(x - width * 0.1, y + height * 0.1, width * 0.2, height * 0.2);
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(x + width * 0.2, y + height * 0.25, width * 0.1, height * 0.05);
    ctx.fillRect(x + width * 0.7, y + height * 0.25, width * 0.1, height * 0.05);
    ctx.fillStyle = 'black';
    ctx.fillRect(x + width * 0.23, y + height * 0.27, width * 0.04, height * 0.02);
    ctx.fillRect(x + width * 0.73, y + height * 0.27, width * 0.04, height * 0.02);
    // Arms
    ctx.fillStyle = '#f0c0a0';
    ctx.fillRect(x - width * 0.1, y + height * 0.4, width * 0.2, height * 0.3);
    ctx.fillRect(x + width * 0.9, y + height * 0.4, width * 0.2, height * 0.3);
  }
}
