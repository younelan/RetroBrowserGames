export class Platform {
  static HEIGHT = 28;
  constructor({ start_x, start_y, end_x, end_y }) {
    this.start_x = start_x;
    this.start_y = start_y;
    this.end_x = end_x;
    this.end_y = end_y;
  }

  update(level, deltaTime) {
    // Platforms are static
  }

  render(ctx, scale = 1) {
    ctx.save();
    // 3D metallic girder base
    const dx = (this.end_x - this.start_x) * scale;
    const dy = (this.end_y - this.start_y) * scale;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(this.start_x * scale, this.start_y * scale);
    ctx.rotate(angle);
    // Main girder body (deep gradient for metallic look)
    const grad = ctx.createLinearGradient(0, -18 * scale, 0, 18 * scale);
    grad.addColorStop(0, '#fffbe6');
    grad.addColorStop(0.08, '#ffb347');
    grad.addColorStop(0.18, '#de690e');
    grad.addColorStop(0.4, '#a63c00');
    grad.addColorStop(0.6, '#a63c00');
    grad.addColorStop(0.82, '#de690e');
    grad.addColorStop(0.92, '#ffb347');
    grad.addColorStop(1, '#fffbe6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(length, -12 * scale);
    ctx.lineTo(length, 14 * scale);
    ctx.lineTo(0, 12 * scale);
    ctx.closePath();
    ctx.shadowColor = '#b84a00';
    ctx.shadowBlur = 16 * scale;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Top and bottom metallic edge lines (with inner shadow)
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#fffbe6';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(length, -12 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 12 * scale);
    ctx.lineTo(length, 14 * scale);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    // 3D shadow under girder
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, 14 * scale);
    ctx.lineTo(length, 14 * scale);
    ctx.lineTo(length, 24 * scale);
    ctx.lineTo(0, 24 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Diagonal metallic stripes (shiny, with shadow)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 7 * scale;
    ctx.shadowColor = '#a63c00';
    ctx.shadowBlur = 6 * scale;
    for (let s = -24 * scale; s < length; s += 36 * scale) {
      ctx.beginPath();
      ctx.moveTo(s, -10 * scale);
      ctx.lineTo(s + 18 * scale, 10 * scale);
      ctx.stroke();
    }
    ctx.restore();
    // Bolts with metallic shine and shadow
    const boltCount = Math.max(4, Math.floor(length / (120 * scale)));
    for (let i = 0; i <= boltCount; i++) {
      const t = i / boltCount;
      const bx = t * length;
      const by = 0;
      ctx.beginPath();
      ctx.arc(bx, by, 7 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#222';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6 * scale;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(bx - 2 * scale, by - 2 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbe6';
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }
}
