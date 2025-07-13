export class Barrel {
  constructor({ x, y, width = 30, height = 30, speed = 100, dx = 100, dy = 0 }) {
    this.x = x;
    // Move up by 10px to keep bottom at same level after increasing size by 1.5x
    this.y = y - 10;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.dx = dx;
    this.dy = dy;
    this.jumpedOver = false;
    this.ignoreDKPlatform = true;
  }

  update(level, deltaTime) {
    const dt = deltaTime / 1000;
    // Gravity
    this.dy += 800 * dt;
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    // Platform collision
    let onPlatform = false;
    for (const platform of level.platforms) {
      const { start_x, start_y, end_x, end_y } = platform;
      const barrel_bottom = this.y + this.height;
      const barrel_center_x = this.x + this.width / 2;
      if (barrel_center_x >= start_x && barrel_center_x <= end_x && this.dy >= 0) {
        const slope = (end_y - start_y) / (end_x - start_x);
        const y_on_platform = start_y + slope * (barrel_center_x - start_x);
        if (barrel_bottom >= y_on_platform && barrel_bottom <= y_on_platform + 10) {
          onPlatform = true;
          this.dy = 0;
          this.y = y_on_platform - this.height;
          if (start_y > end_y + 1) {
            this.dx = -this.speed;
          } else if (start_y < end_y - 1) {
            this.dx = this.speed;
          }
        }
      }
    }
    if (!onPlatform && this.dy === 0) {
      this.dy = 50;
    }
  }

  render(ctx, scale = 1, animationFrame = 0) {
    // Parabolic bounce for rolling barrels (jump-like, half barrel height)
    let bounceOffset = 0;
    if (this.dy === 0) { // Only while rolling
      // Double the bounce period for even longer/slower bounce
      const period = this.width * 4.4;
      const t = ((this.x % period) / period);
      // Double the parabola width (even less steep)
      const amplitude = this.height * 0.5;
      bounceOffset = (-1.1 * amplitude * Math.pow(t - 0.5, 2) + amplitude * 0.95);
    }
    const x = this.x * scale;
    const y = (this.y - bounceOffset) * scale;
    const w = this.width * scale;
    const h = this.height * scale;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const depth = 8 * scale;
    const rot = ((this.x + (animationFrame || 0) * 2) / 32) % (2 * Math.PI);

    // Draw shadow on ground
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + depth, cy + h * 0.7, w * 0.6, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw barrel body (side cylinder) with bold wood texture
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    grad.addColorStop(0, '#5a2d0c');
    grad.addColorStop(0.15, '#a0522d');
    grad.addColorStop(0.5, '#e2a86b');
    grad.addColorStop(0.85, '#a0522d');
    grad.addColorStop(1, '#5a2d0c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.shadowColor = '#442200';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Bold wood grain lines
    ctx.strokeStyle = 'rgba(80,40,10,0.55)';
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.32 + i * 2, h * 0.22 + i, 0, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(-w * 0.18, h * 0.08, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.13, -h * 0.12, 2.2, 0, Math.PI * 2);
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.stroke();

    // Staves (vertical lines for wood planks, high contrast)
    ctx.strokeStyle = 'rgba(60,30,10,0.7)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * w * 0.38, Math.sin(angle) * h * 0.38);
      ctx.lineTo(Math.cos(angle) * w * 0.48, Math.sin(angle) * h * 0.48);
      ctx.stroke();
    }

    // Barrel bands (metal hoops)
    ctx.strokeStyle = '#d2cfc7';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(0, i * h * 0.18, w / 2, h * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Barrel rim (dark)
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#442200';
    ctx.stroke();

    // Barrel highlight (curved, subtle, not white)
    ctx.globalAlpha = 0.13;
    ctx.beginPath();
    ctx.ellipse(-w * 0.13, -h * 0.18, w * 0.18, h * 0.13, 0, Math.PI * 0.1, Math.PI * 1.1);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#fffbe6';
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    ctx.restore(); // barrel rotation
  }
}
