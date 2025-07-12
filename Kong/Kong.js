export class Kong {
  static WIDTH = 80;
  static HEIGHT = 80;
  constructor({ x, y, width = Kong.WIDTH, height = Kong.HEIGHT }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update(level, deltaTime) {
    // Optionally animate Kong
  }

  render(ctx, scale = 1, animationFrame = 0) {
    // Use the original drawDonkeyKong logic from graphics.js
    const x = this.x * scale;
    const y = (this.y + 10) * scale;
    const kongScale = scale;
    const throwPhase = animationFrame % 90;
    const isWindingUp = throwPhase < 30;
    const isThrowing = throwPhase >= 30 && throwPhase < 60;
    const isRecovering = throwPhase >= 60;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 45 * kongScale, y + 95 * kongScale, 40 * kongScale, 8 * kongScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(x + 40 * kongScale, y + 60 * kongScale, 38 * kongScale, 48 * kongScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 20 * scale;
    ctx.lineCap = 'round';
    let armX, armY, elbowX, elbowY, handX, handY;
    if (isWindingUp) {
      armX = x + 5 * scale;
      armY = y + 35 * scale;
      elbowX = x - 20 * scale;
      elbowY = y + 10 * scale;
      handX = x - 35 * scale;
      handY = y + 25 * scale;
    } else if (isThrowing) {
      armX = x + 5 * scale;
      armY = y + 35 * scale;
      elbowX = x - 10 * scale;
      elbowY = y + 15 * scale;
      handX = x - 15 * scale;
      handY = y + 45 * scale;
    } else {
      armX = x + 5 * scale;
      armY = y + 35 * scale;
      elbowX = x - 15 * scale;
      elbowY = y + 20 * scale;
      handX = x - 25 * scale;
      handY = y + 35 * scale;
    }
    ctx.beginPath();
    ctx.moveTo(armX, armY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    const rightArmSway = Math.sin(animationFrame * 0.05) * 3;
    ctx.beginPath();
    ctx.moveTo(x + 75 * scale, y + 40 * scale);
    ctx.lineTo(x + (90 + rightArmSway) * scale, y + 55 * scale);
    ctx.lineTo(x + (85 + rightArmSway) * scale, y + 70 * scale);
    ctx.stroke();
    const headSize = isThrowing ? 32 * scale : 30 * scale;
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(x + 40 * scale, y + 20 * scale, headSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x + 40 * scale, y + 25 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.fill();
    const browFurrow = isThrowing ? 6 : 4;
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x + 18 * scale, y + (8 + browFurrow) * scale, 44 * scale, 10 * scale);
    const eyeGlow = isThrowing ? '#FF4444' : 'white';
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.ellipse(x + 30 * scale, y + 18 * scale, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 50 * scale, y + 18 * scale, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    const nostrilSize = isThrowing ? 3 * scale : 2 * scale;
    ctx.beginPath();
    ctx.arc(x + 35 * scale, y + 28 * scale, nostrilSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 45 * scale, y + 28 * scale, nostrilSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4 * scale;
    const mouthOpen = isThrowing ? 0.7 * Math.PI : 0.5 * Math.PI;
    ctx.beginPath();
    ctx.arc(x + 40 * scale, y + 35 * scale, 15 * scale, 0, mouthOpen);
    ctx.stroke();
    ctx.fillStyle = 'white';
    const teethVisible = isThrowing ? 6 : 4;
    for (let i = 0; i < teethVisible; i++) {
      const toothX = x + (28 + i * 4) * scale;
      const toothY = y + 35 * scale;
      ctx.fillRect(toothX, toothY, 2 * scale, 8 * scale);
    }
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 24 * scale;
    ctx.lineCap = 'round';
    const legSpread = isThrowing ? 5 : 0;
    ctx.beginPath();
    ctx.moveTo(x + (30 - legSpread) * scale, y + 95 * scale);
    ctx.lineTo(x + (20 - legSpread) * scale, y + 110 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + (50 + legSpread) * scale, y + 95 * scale);
    ctx.lineTo(x + (60 + legSpread) * scale, y + 110 * scale);
    ctx.stroke();
    if (isWindingUp || (isThrowing && throwPhase < 45)) {
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(handX, handY, 10 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(handX - 8 * scale, handY - 4 * scale);
      ctx.lineTo(handX + 8 * scale, handY - 4 * scale);
      ctx.moveTo(handX - 8 * scale, handY + 4 * scale);
      ctx.lineTo(handX + 8 * scale, handY + 4 * scale);
      ctx.stroke();
    }
    if (isThrowing) {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
      for (let i = 0; i < 3; i++) {
        const steamX = x + (20 + i * 20) * scale;
        const steamY = y + (5 + Math.sin(animationFrame * 0.3 + i) * 3) * scale;
        ctx.beginPath();
        ctx.arc(steamX, steamY, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (isThrowing && throwPhase > 40) {
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const dustX = x + (10 + i * 15) * scale;
        const dustY = y + 110 * scale;
        ctx.beginPath();
        ctx.moveTo(dustX, dustY);
        ctx.lineTo(dustX + (Math.random() - 0.5) * 10, dustY - Math.random() * 8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
