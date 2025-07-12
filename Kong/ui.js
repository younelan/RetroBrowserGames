
import { GAME_WIDTH, GAME_HEIGHT } from './game.js';

export function showWinScreen(score) {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent black background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFD700'; // Gold color for win text
  ctx.font = 'bold 60px "Press Start 2P", cursive'; // Pixel font
  ctx.textAlign = 'center';
  ctx.fillText('YOU WIN!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

  ctx.fillStyle = 'white';
  ctx.font = '30px "Press Start 2P", cursive';
  ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

  ctx.fillStyle = '#00FF00'; // Green for restart message
  ctx.font = '20px "Press Start 2P", cursive';
  ctx.fillText('Click or Press Any Key to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
}

export function showGameOverScreen(score) {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent black background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FF0000'; // Red color for game over text
  ctx.font = 'bold 60px "Press Start 2P", cursive'; // Pixel font
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

  ctx.fillStyle = 'white';
  ctx.font = '30px "Press Start 2P", cursive';
  ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

  ctx.fillStyle = '#00FF00'; // Green for restart message
  ctx.font = '20px "Press Start 2P", cursive';
  ctx.fillText('Click or Press Any Key to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
}
