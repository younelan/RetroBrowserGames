import { drawPlayer, drawDonkeyKong, drawPlatforms, drawBarrels, drawPauline, drawLadders } from './graphics.js';

export function render(ctx, player, barrels, levelData, score, lives) {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw platforms
  drawPlatforms(ctx, levelData.platforms);

  // Draw ladders
  drawLadders(ctx, levelData.ladders);

  // Draw Donkey Kong
  drawDonkeyKong(ctx, levelData.dk_pos);

  // Draw Pauline
  drawPauline(ctx, levelData.pauline_pos);

  // Draw barrels
  drawBarrels(ctx, barrels);

  // Draw player
  drawPlayer(ctx, player);

  // Draw UI
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, ctx.canvas.width - 80, 20);
}