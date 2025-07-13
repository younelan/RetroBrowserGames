export class Hammer {
  static WIDTH = 60;
  static HEIGHT = 48;

  constructor({ x, y, carried = false }) {
    this.x = x;
    this.y = y;
    this.carried = carried; // true if player is holding it
    this.width = Hammer.WIDTH;
    this.height = Hammer.HEIGHT;
    this.pickedUp = false;
  }

  update(level, deltaTime) {
    // If carried, position is managed by player
    // Otherwise, static on ground
  }

  render(ctx, scale = 1, x = null, y = null) {
    // If x/y are provided, draw at those (for carried), else use this.x/this.y
    const drawX = (x !== null ? x : this.x) * scale;
    const drawY = (y !== null ? y : this.y) * scale;
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(this.carried ? -Math.PI/4 : 0); // tilt if carried
    // Draw hammer: handle (longer and thicker)
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(15, 28, 32, 10); // handle
    // Draw hammer: head (bigger)
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 12, 28, 28); // head
    ctx.restore();
  }
}
