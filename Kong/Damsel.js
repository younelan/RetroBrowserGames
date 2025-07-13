export class Damsel {
  static WIDTH = 30;
  static HEIGHT = 80; // doubled
  constructor({ x, y, width = Damsel.WIDTH, height = Damsel.HEIGHT }) {
    this.x = x;
    // Adjust y so feet stay in same place
    this.height = height;
    this.width = width;
    this.y = y - (this.height / 2); // move up by half new height
  }

  update(level, deltaTime) {
    // Sway slower, blink less often, wave every ~10s
    if (!this._animTime) this._animTime = 0;
    this._animTime += deltaTime;
    // Sway: oscillate x offset, slower
    this._sway = Math.sin(this._animTime / 1400) * 4;
    // Blink: eyes closed for 120ms every ~4.5s
    this._blink = (Math.floor(this._animTime / 4500) !== Math.floor((this._animTime - deltaTime) / 4500)) ? 1 : (this._blink || 0);
    if (this._blink && this._animTime % 4500 > 120) this._blink = 0;
    // Waving: every 10s, wave for 1.2s
    const wavePeriod = 10000;
    const waveDuration = 1200;
    const t = this._animTime % wavePeriod;
    this._waving = t < waveDuration;
  }

  render(ctx, scale = 1) {
    const x = this.x * scale + (this._sway || 0);
    const y = this.y * scale;
    const width = (this.width || 30) * scale;
    const height = (this.height || 80) * scale;
    // Dress (drawn first, full, symmetric)
    ctx.fillStyle = '#e23a8e';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y + height * 0.3);
    ctx.lineTo(x + width * 0.8, y + height * 0.3);
    ctx.lineTo(x + width * 0.9, y + height);
    ctx.lineTo(x + width * 0.1, y + height);
    ctx.closePath();
    ctx.fill();
    // Dress highlight
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.7, width * 0.22, height * 0.09, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    // Shoulders/torso
    ctx.fillStyle = '#f0c0a0';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.28, width * 0.18, height * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hair (drawn behind face, with side hair)
    ctx.save();
    ctx.fillStyle = '#8B4513';
    // Back hair (long, behind face)
    // REMOVED: brown ovaloid on neck/top of dress
    // ctx.beginPath();
    // ctx.ellipse(x + width * 0.5, y + height * 0.32, width * 0.12, height * 0.16, 0, 0, Math.PI * 2);
    // ctx.globalAlpha = 0.7;
    // ctx.fill();
    // ctx.globalAlpha = 1.0;
    // Top hair
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.09, width * 0.15, height * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    // Side hair (left and right of face)
    ctx.beginPath();
    ctx.ellipse(x + width * 0.38, y + height * 0.13, width * 0.04, height * 0.07, 0, 0, Math.PI * 2);
    ctx.ellipse(x + width * 0.62, y + height * 0.13, width * 0.04, height * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Face (centered, round, cute, drawn after hair)
    ctx.save();
    ctx.shadowColor = '#c18b6e';
    ctx.shadowBlur = 4 * scale;
    ctx.fillStyle = '#f0c0a0';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.13, width * 0.13, height * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Cute hairline and hair above eyes
    ctx.save();
    ctx.fillStyle = '#8B4513';
    // Hairline: gentle arc above face, slightly below top hair
    ctx.beginPath();
    ctx.moveTo(x + width * 0.37, y + height * 0.08);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.04, x + width * 0.63, y + height * 0.08);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.10, x + width * 0.37, y + height * 0.08);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    // Hair going up from hairline to top of head (fills above hairline)
    ctx.beginPath();
    ctx.moveTo(x + width * 0.37, y + height * 0.08);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * -0.04, x + width * 0.63, y + height * 0.08);
    ctx.lineTo(x + width * 0.63, y + height * 0.08);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.04, x + width * 0.37, y + height * 0.08);
    ctx.closePath();
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    // Hair above eyes: a soft, rounded fringe/bangs
    ctx.beginPath();
    ctx.ellipse(x + width * 0.5, y + height * 0.095, width * 0.13, height * 0.045, 0, Math.PI, 2 * Math.PI);
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    // Side hair: left and right, hugging face, from above eyes to below cheeks
    ctx.beginPath();
    ctx.ellipse(x + width * 0.36, y + height * 0.13, width * 0.035, height * 0.09, Math.PI * 0.1, 0, Math.PI * 2);
    ctx.ellipse(x + width * 0.64, y + height * 0.13, width * 0.035, height * 0.09, -Math.PI * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Cheeks
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.44, y + height * 0.15, width * 0.025, height * 0.018, 0, 0, Math.PI * 2);
    ctx.ellipse(x + width * 0.56, y + height * 0.15, width * 0.025, height * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    // Eyes (higher on face)
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.47, y + height * 0.09, width * 0.018, height * 0.03, 0, 0, Math.PI * 2);
    ctx.ellipse(x + width * 0.53, y + height * 0.09, width * 0.018, height * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!this._blink) {
      ctx.fillStyle = '#3a6edb';
      ctx.beginPath();
      ctx.ellipse(x + width * 0.47, y + height * 0.10, width * 0.008, height * 0.014, 0, 0, Math.PI * 2);
      ctx.ellipse(x + width * 0.53, y + height * 0.10, width * 0.008, height * 0.014, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(x + width * 0.47, y + height * 0.105, width * 0.004, height * 0.007, 0, 0, Math.PI * 2);
      ctx.ellipse(x + width * 0.53, y + height * 0.105, width * 0.004, height * 0.007, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(x + width * 0.48, y + height * 0.085, width * 0.003, height * 0.003, 0, 0, Math.PI * 2);
      ctx.ellipse(x + width * 0.52, y + height * 0.085, width * 0.003, height * 0.003, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else {
      // Draw eyelids (blink)
      ctx.fillStyle = '#f0c0a0';
      ctx.beginPath();
      ctx.ellipse(x + width * 0.47, y + height * 0.09, width * 0.018, height * 0.03, 0, 0, Math.PI * 2);
      ctx.ellipse(x + width * 0.53, y + height * 0.09, width * 0.018, height * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Smile (at bottom of face)
    ctx.save();
    ctx.strokeStyle = '#b85c2b';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.17, width * 0.03, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();
    // Arms (waving or natural)
    ctx.save();
    ctx.fillStyle = '#f0c0a0';
    if (this._waving) {
      // Waving: animate a handkerchief in her right hand
      // Draw right arm as usual
      ctx.beginPath();
      ctx.ellipse(x + width * 0.22, y + height * 0.38, width * 0.06, height * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + width * 0.22, y + height * 0.53, width * 0.03, height * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      // Animate a waving handkerchief
      const handX = x + width * 0.22;
      const handY = y + height * 0.53;
      const waveAngle = Math.sin((this._animTime % 600) / 600 * Math.PI * 2) * 0.7;
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(waveAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width * 0.04, -height * 0.04);
      ctx.lineTo(width * 0.08, 0);
      ctx.lineTo(width * 0.04, height * 0.04);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.restore();
      // Left arm (static)
      ctx.beginPath();
      ctx.ellipse(x + width * 0.78, y + height * 0.38, width * 0.06, height * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      // Left hand
      ctx.beginPath();
      ctx.ellipse(x + width * 0.78, y + height * 0.53, width * 0.03, height * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Both arms natural
      ctx.beginPath();
      ctx.ellipse(x + width * 0.22, y + height * 0.38, width * 0.06, height * 0.13, 0, 0, Math.PI * 2);
      ctx.ellipse(x + width * 0.78, y + height * 0.38, width * 0.06, height * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hands
      ctx.beginPath();
      ctx.ellipse(x + width * 0.22, y + height * 0.53, width * 0.03, height * 0.02, 0, 0, Math.PI * 2);
      ctx.ellipse(x + width * 0.78, y + height * 0.53, width * 0.03, height * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Shoes
    ctx.save();
    ctx.fillStyle = '#b85c2b';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.32, y + height * 0.98, width * 0.05, height * 0.02, 0, 0, Math.PI * 2);
    ctx.ellipse(x + width * 0.68, y + height * 0.98, width * 0.05, height * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
