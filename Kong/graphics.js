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

export function drawDonkeyKong(ctx, dk_pos) {
  const x = dk_pos.x;
  const y = dk_pos.y;
  const scale = 0.8; // Scale down the overall size for better fit

  // Body (large, rounded rectangle)
  ctx.fillStyle = '#4B3621'; // Dark Brown
  ctx.fillRect(x, y + 20 * scale, 70 * scale, 60 * scale);

  // Head (more distinct, slightly forward)
  ctx.beginPath();
  ctx.arc(x + 60 * scale, y + 30 * scale, 25 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Muzzle/Snout
  ctx.fillStyle = '#A0522D'; // Sienna
  ctx.beginPath();
  ctx.ellipse(x + 65 * scale, y + 35 * scale, 10 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x + 60 * scale, y + 25 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(x + 60 * scale, y + 25 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Arms (thick, one forward for throwing pose)
  ctx.strokeStyle = '#4B3621';
  ctx.lineWidth = 15 * scale;
  ctx.lineCap = 'round';

  // Back arm
  ctx.beginPath();
  ctx.moveTo(x + 10 * scale, y + 40 * scale);
  ctx.lineTo(x + 20 * scale, y + 70 * scale);
  ctx.stroke();

  // Front arm (throwing pose)
  ctx.beginPath();
  ctx.moveTo(x + 50 * scale, y + 40 * scale);
  ctx.lineTo(x + 70 * scale, y + 60 * scale);
  ctx.stroke();

  // Legs (simplified)
  ctx.lineWidth = 20 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 20 * scale, y + 80 * scale);
  ctx.lineTo(x + 20 * scale, y + 90 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 50 * scale, y + 80 * scale);
  ctx.lineTo(x + 50 * scale, y + 90 * scale);
  ctx.stroke();
}

export function drawPlatforms(ctx, platforms) {
  ctx.strokeStyle = '#de690e'; // Girder color
  ctx.lineWidth = 10; // Thickness of the girder
  platforms.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(p.start_x, p.start_y);
    ctx.lineTo(p.end_x, p.end_y);
    ctx.stroke();
  });
}

export function drawBarrels(ctx, barrels) {
  barrels.forEach(barrel => {
    const x = barrel.x;
    const y = barrel.y;
    const width = barrel.width;
    const height = barrel.height;

    // Main barrel body
    ctx.fillStyle = '#8B4513'; // SaddleBrown
    ctx.fillRect(x, y, width, height);

    // Top and bottom bands
    ctx.strokeStyle = '#696969'; // DimGray
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.1);
    ctx.lineTo(x + width, y + height * 0.1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.9);
    ctx.lineTo(x + width, y + height * 0.9);
    ctx.stroke();

    // Vertical planks (simplified)
    ctx.strokeStyle = '#A0522D'; // Sienna
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + (i * width / 4), y);
      ctx.lineTo(x + (i * width / 4), y + height);
      ctx.stroke();
    }

    // Highlight for rounded effect
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2 * 0.8, height / 2 * 0.9, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
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