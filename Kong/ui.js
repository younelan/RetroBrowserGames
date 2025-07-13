  import { GAME_WIDTH, GAME_HEIGHT } from './game.js';

export function showWinScreen(score) {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  // Animated blue-to-black radial gradient background (darker)
  let t = Date.now() / 1000;
  let grad = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, canvas.width/1.1 + Math.sin(t)*20
  );
  grad.addColorStop(0, '#0a1830'); // very dark blue center
  grad.addColorStop(0.4, '#11203a'); // dark blue
  grad.addColorStop(0.7, '#080e18'); // even darker blue
  grad.addColorStop(1, '#000'); // black edge
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ORGANIZED confetti: spiral pattern, animated
  ctx.font = '38px Arial';
  let confettiCount = 32;
  for (let i = 0; i < confettiCount; i++) {
    let angle = t*0.7 + i * (2 * Math.PI / confettiCount);
    let radius = 180 + 60 * Math.sin(t + i);
    let x = canvas.width/2 + Math.cos(angle) * radius;
    let y = canvas.height/2 + Math.sin(angle) * radius + Math.sin(t*2 + i)*10;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t*2 + i);
    ctx.fillText(['🎉','✨','🎊','🥳'][i%4], x, y);
  }
  ctx.globalAlpha = 1.0;


  // Animated star behind trophy
  ctx.save();
  const starX = canvas.width / 2;
  const starY = canvas.height / 2 - 120;
  const starOuter = 90 + 6*Math.sin(t*2);
  const starInner = 38 + 2*Math.cos(t*3);
  const starPoints = 5;
  const starRotation = t * 0.7;
  ctx.translate(starX, starY);
  ctx.rotate(starRotation);
  ctx.beginPath();
  for (let i = 0; i < starPoints * 2; i++) {
    let angle = (Math.PI / starPoints) * i;
    let r = i % 2 === 0 ? starOuter : starInner;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.shadowColor = '#ffe680';
  ctx.shadowBlur = 40 + 10*Math.abs(Math.sin(t*2));
  ctx.globalAlpha = 0.22 + 0.08*Math.sin(t*2);
  ctx.fillStyle = 'gold';
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.setTransform(1,0,0,1,0,0); // reset transform
  ctx.restore();

  // Animated trophy with glow (on top of star)
  ctx.save();
  ctx.font = '110px Arial';
  ctx.shadowColor = '#ffe680';
  ctx.shadowBlur = 32 + 16*Math.abs(Math.sin(t*2));
  ctx.globalAlpha = 0.96 + 0.04*Math.sin(t*2);
  ctx.textAlign = 'center';
  ctx.fillText('🏆', canvas.width / 2, canvas.height / 2 - 120);
  ctx.restore();

  // Classy animated win text (centered, elegant font, refined color, black outline)
  ctx.save();
  ctx.font = 'bold 68px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Animated gradient text
  let gradText = ctx.createLinearGradient(canvas.width/2-180,0,canvas.width/2+180,0);
  gradText.addColorStop(0, '#fffbe6');
  gradText.addColorStop(0.5, `hsl(${(t*40)%360}, 80%, 60%)`);
  gradText.addColorStop(1, '#ffe680');
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'black';
  ctx.miterLimit = 2;
  ctx.strokeText('Victory!', canvas.width / 2, canvas.height / 2 - 30 + Math.sin(t*2)*6);
  ctx.fillStyle = gradText;
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 22;
  ctx.fillText('Victory!', canvas.width / 2, canvas.height / 2 - 30 + Math.sin(t*2)*6);
  ctx.restore();

  // Pauline and Mario (emoji)
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('👸🏻  +  👨🏻‍🔧', canvas.width / 2, canvas.height / 2 + 40);

  // Score
  ctx.font = '32px Arial';
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.fillText(`🏆${score}`, canvas.width / 2, canvas.height / 2 + 90);

  // Restart message (centered, moved down, black outline for readability)
  ctx.save();
  ctx.font = 'bold 28px "Playfair Display", Arial, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'black';
  ctx.miterLimit = 2;
  ctx.strokeText('Tap, Click, or Press Any Key to Restart', canvas.width / 2, canvas.height / 2 + 170);
  ctx.fillStyle = '#e0e6ff';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText('Tap, Click, or Press Any Key to Restart', canvas.width / 2, canvas.height / 2 + 170);
  ctx.restore();

  // Animate!
  function animateWinScreen() {
    if (window._winScreenActive) {
      showWinScreen(score);
    }
  }
  window._winScreenActive = true;
  setTimeout(() => { window._winScreenActive = false; }, 10000);
  requestAnimationFrame(animateWinScreen);
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
  ctx.fillText('Tap, Click, or Press Any Key to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
}
