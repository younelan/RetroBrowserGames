export class Ladder {
  static WIDTH = 40; // doubled from 20
  constructor({ x, top_y, bottom_y, broken = false }) {
    this.x = x;
    this.top_y = top_y;
    this.bottom_y = bottom_y;
    this.broken = broken;
    this.width = Ladder.WIDTH;
  }

  update(level, deltaTime) {
    // Ladders are static
  }

  render(ctx, scale = 1) {
    ctx.strokeStyle = '#8B4513'; // Brown for ladder sides
    ctx.lineWidth = 5 * scale;
    // Draw sides
    ctx.beginPath();
    ctx.moveTo(this.x * scale, this.top_y * scale);
    ctx.lineTo(this.x * scale, this.bottom_y * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((this.x + Ladder.WIDTH) * scale, this.top_y * scale);
    ctx.lineTo((this.x + Ladder.WIDTH) * scale, this.bottom_y * scale);
    ctx.stroke();
    // Draw rungs
    ctx.lineWidth = 3 * scale;
    for (let y = this.top_y; y < this.bottom_y; y += 15) {
      ctx.beginPath();
      ctx.moveTo(this.x * scale, y * scale);
      ctx.lineTo((this.x + Ladder.WIDTH) * scale, y * scale);
      ctx.stroke();
    }
  }
}
