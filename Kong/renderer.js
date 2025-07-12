import { drawPlayer, drawDonkeyKong, drawPlatforms, drawBarrels, drawPauline, drawLadders } from './graphics.js';
import { GAME_WIDTH, GAME_HEIGHT } from './game.js';

export function render(ctx, player, barrels, levelData, score, lives) {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();

  // Calculate scaling factor
  const scaleX = ctx.canvas.width / GAME_WIDTH;
  const scaleY = ctx.canvas.height / GAME_HEIGHT;
  ctx.scale(scaleX, scaleY);

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

  // Draw UI (positions and font sizes are now relative to GAME_WIDTH/HEIGHT)
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, GAME_WIDTH - 80, 20);

  ctx.restore();
}