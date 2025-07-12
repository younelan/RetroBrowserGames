export function drawPlayer(ctx, player) {
  const x = player.x;
  const y = player.y;
  const width = player.width;
  const height = player.height;

  ctx.save();
  if (player.facing === 'left') {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.translate(-(x + width), -y);
  }

  // Body (overalls)
  ctx.fillStyle = '#0000ff'; // Blue
  ctx.fillRect(x, y + height * 0.4, width, height * 0.6);

  // Shirt
  ctx.fillStyle = '#ff0000'; // Red
  ctx.fillRect(x, y, width, height * 0.5);

  // Head
  ctx.fillStyle = '#f0c0a0'; // Skin color
  ctx.fillRect(x + width * 0.1, y - height * 0.3, width * 0.8, height * 0.4);

  // Eyes
  ctx.fillStyle = 'white';
  ctx.fillRect(x + width * 0.25, y - height * 0.2, width * 0.1, height * 0.05);
  ctx.fillRect(x + width * 0.55, y - height * 0.2, width * 0.1, height * 0.05);
  ctx.fillStyle = 'black';
  ctx.fillRect(x + width * 0.28, y - height * 0.18, width * 0.04, height * 0.02);
  ctx.fillRect(x + width * 0.58, y - height * 0.18, width * 0.04, height * 0.02);

  // Hat
  ctx.fillStyle = '#ff0000'; // Red
  ctx.fillRect(x, y - height * 0.4, width, height * 0.15);
  ctx.fillRect(x + width * 0.7, y - height * 0.5, width * 0.3, height * 0.2);

  // Moustache
  ctx.fillStyle = '#4B3621'; // Brown
  ctx.fillRect(x + width * 0.2, y + height * 0.1, width * 0.6, height * 0.05);

  // Legs
  ctx.fillStyle = '#0000ff'; // Blue
  ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.3, height * 0.2);
  ctx.fillRect(x + width * 0.6, y + height * 0.8, width * 0.3, height * 0.2);

  // Arms (simple, will animate later)
  ctx.fillStyle = '#ff0000'; // Red
  ctx.fillRect(x - width * 0.2, y + height * 0.4, width * 0.4, height * 0.4);
  ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.4, height * 0.4);

  // Animation for walking
  if (player.dx !== 0) {
    if (player.frame === 0) {
      // Leg forward
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(x + width * 0.6, y + height * 0.8, width * 0.3, height * 0.2);
      // Arm forward
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + width * 0.8, y + height * 0.4, width * 0.4, height * 0.4);
    } else {
      // Leg back
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.3, height * 0.2);
      // Arm back
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x - width * 0.2, y + height * 0.4, width * 0.4, height * 0.4);
    }
  }

  ctx.restore();
}

export function drawDonkeyKong(ctx, dk_pos, animationFrame = 0) {
  // Smaller, more gorilla-like, and better platform alignment
  const x = dk_pos.x;
  const y = dk_pos.y + 10;
  const scale = 1.0;

  // Animation phases
  const throwPhase = animationFrame % 90;
  const isWindingUp = throwPhase < 30;
  const isThrowing = throwPhase >= 30 && throwPhase < 60;
  const isRecovering = throwPhase >= 60;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x + 45 * scale, y + 95 * scale, 40 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main body: use ellipse for a rounder, barrel-chested gorilla look
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.ellipse(x + 40 * scale, y + 60 * scale, 38 * scale, 48 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chest highlight (subtle, not orange dots)
  // Removed the 3 orange dots entirely

  // Arms (thick, long, and animated)
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

  // Right arm
  const rightArmSway = Math.sin(animationFrame * 0.05) * 3;
  ctx.beginPath();
  ctx.moveTo(x + 75 * scale, y + 40 * scale);
  ctx.lineTo(x + (90 + rightArmSway) * scale, y + 55 * scale);
  ctx.lineTo(x + (85 + rightArmSway) * scale, y + 70 * scale);
  ctx.stroke();

  // Head (round, gorilla-like)
  const headSize = isThrowing ? 32 * scale : 30 * scale;
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.arc(x + 40 * scale, y + 20 * scale, headSize, 0, Math.PI * 2);
  ctx.fill();

  // Face area
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.arc(x + 40 * scale, y + 25 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Angry brow ridge
  const browFurrow = isThrowing ? 6 : 4;
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(x + 18 * scale, y + (8 + browFurrow) * scale, 44 * scale, 10 * scale);

  // Fierce eyes (oval, no dots, NO ORANGE DOTS ABOVE)
  const eyeGlow = isThrowing ? '#FF4444' : 'white';
  ctx.fillStyle = eyeGlow;
  ctx.beginPath();
  ctx.ellipse(x + 30 * scale, y + 18 * scale, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 50 * scale, y + 18 * scale, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flaring nostrils
  ctx.fillStyle = 'black';
  const nostrilSize = isThrowing ? 3 * scale : 2 * scale;
  ctx.beginPath();
  ctx.arc(x + 35 * scale, y + 28 * scale, nostrilSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 45 * scale, y + 28 * scale, nostrilSize, 0, Math.PI * 2);
  ctx.fill();

  // Snarling mouth
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4 * scale;
  const mouthOpen = isThrowing ? 0.7 * Math.PI : 0.5 * Math.PI;
  ctx.beginPath();
  ctx.arc(x + 40 * scale, y + 35 * scale, 15 * scale, 0, mouthOpen);
  ctx.stroke();

  // Sharp teeth
  ctx.fillStyle = 'white';
  const teethVisible = isThrowing ? 6 : 4;
  for (let i = 0; i < teethVisible; i++) {
    const toothX = x + (28 + i * 4) * scale;
    const toothY = y + 35 * scale;
    ctx.fillRect(toothX, toothY, 2 * scale, 8 * scale);
  }

  // Powerful legs (shorter, more gorilla-like)
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 24 * scale;
  ctx.lineCap = 'round';
  const legSpread = isThrowing ? 5 : 0;
  // Left leg
  ctx.beginPath();
  ctx.moveTo(x + (30 - legSpread) * scale, y + 95 * scale);
  ctx.lineTo(x + (20 - legSpread) * scale, y + 110 * scale);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(x + (50 + legSpread) * scale, y + 95 * scale);
  ctx.lineTo(x + (60 + legSpread) * scale, y + 110 * scale);
  ctx.stroke();

  // Barrel in hand - only show during wind up and early throw
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

  // Steam/anger effect when throwing
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

  // Ground impact effect during throw
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

export function drawPlatforms(ctx, platforms) {
  ctx.save();
  platforms.forEach(p => {
    // 3D metallic girder base
    const dx = p.end_x - p.start_x;
    const dy = p.end_y - p.start_y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(p.start_x, p.start_y);
    ctx.rotate(angle);

    // Main girder body (deep gradient for metallic look)
    const grad = ctx.createLinearGradient(0, -18, 0, 18);
    grad.addColorStop(0, '#fffbe6'); // top highlight
    grad.addColorStop(0.08, '#ffb347');
    grad.addColorStop(0.18, '#de690e');
    grad.addColorStop(0.4, '#a63c00'); // shadow
    grad.addColorStop(0.6, '#a63c00');
    grad.addColorStop(0.82, '#de690e');
    grad.addColorStop(0.92, '#ffb347');
    grad.addColorStop(1, '#fffbe6'); // bottom highlight
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(length, -12);
    ctx.lineTo(length, 14);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.shadowColor = '#b84a00';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top and bottom metallic edge lines (with inner shadow)
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#fffbe6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(length, -12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(length, 14);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // 3D shadow under girder
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(length, 14);
    ctx.lineTo(length, 24);
    ctx.lineTo(0, 24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Diagonal metallic stripes (shiny, with shadow)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 7;
    ctx.shadowColor = '#a63c00';
    ctx.shadowBlur = 6;
    for (let s = -24; s < length; s += 36) {
      ctx.beginPath();
      ctx.moveTo(s, -10);
      ctx.lineTo(s + 18, 10);
      ctx.stroke();
    }
    ctx.restore();

    // Bolts with metallic shine and shadow
    const boltCount = Math.max(4, Math.floor(length / 120));
    for (let i = 0; i <= boltCount; i++) {
      const t = i / boltCount;
      const bx = t * length;
      const by = 0;
      // Outer bolt (dark)
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#222';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      // Inner metallic shine
      ctx.beginPath();
      ctx.arc(bx - 2, by - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbe6';
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  });
  ctx.restore();
}

export function drawBarrels(ctx, barrels, animationFrame = 0) {
  barrels.forEach(barrel => {
    const x = barrel.x;
    const y = barrel.y;
    const w = barrel.width;
    const h = barrel.height;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const depth = 8;
    const rot = ((barrel.x + animationFrame * 2) / 32) % (2 * Math.PI);

    ctx.save();
    // Draw shadow on ground
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + depth, cy + h * 0.7, w * 0.6, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw barrel body (side cylinder) with bold wood texture
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    // Stronger wood gradient
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

    // Bold wood grain lines
    ctx.save();
    ctx.strokeStyle = 'rgba(80,40,10,0.55)';
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.32 + i * 2, h * 0.22 + i, 0, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
    }
    // Big knots
    ctx.beginPath();
    ctx.arc(-w * 0.18, h * 0.08, 3, 0, Math.PI * 2);
    ctx.arc(w * 0.13, -h * 0.12, 2.2, 0, Math.PI * 2);
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

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
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.beginPath();
    ctx.ellipse(-w * 0.13, -h * 0.18, w * 0.18, h * 0.13, 0, Math.PI * 0.1, Math.PI * 1.1);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#fffbe6';
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // barrel rotation
    ctx.restore();
  });
}

export function drawPauline(ctx, pauline_pos) {
  const x = pauline_pos.x;
  const y = pauline_pos.y;
  const width = 30;
  const height = 40;

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

export function drawLadders(ctx, ladders) {
  ctx.strokeStyle = '#8B4513'; // Brown for ladder sides
  ctx.lineWidth = 5;
  ladders.forEach(ladder => {
    // Draw sides
    ctx.beginPath();
    ctx.moveTo(ladder.x, ladder.top_y);
    ctx.lineTo(ladder.x, ladder.bottom_y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ladder.x + 20, ladder.top_y);
    ctx.lineTo(ladder.x + 20, ladder.bottom_y);
    ctx.stroke();

    // Draw rungs
    ctx.lineWidth = 3;
    for (let y = ladder.top_y; y < ladder.bottom_y; y += 15) {
      ctx.beginPath();
      ctx.moveTo(ladder.x, y);
      ctx.lineTo(ladder.x + 20, y);
      ctx.stroke();
    }
  });
}