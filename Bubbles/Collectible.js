export class Collectible {
  constructor(x, y, width, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = width;
    this.type = type;
    this.scale = width / 60;
    // Remove bounce animation
  }

  update() {
    // Remove bouncing
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    switch(this.type) {
      case 'cherry':
        this.drawCherry(ctx);
        break;
      case 'strawberry':
        this.drawStrawberry(ctx);
        break;
      case 'star':
        this.drawStar(ctx);
        break;
    }

    ctx.restore();
  }

  drawCherry(ctx) {
    const w = this.width * 0.4;
    // Draw stem
    ctx.strokeStyle = '#2d5a27';
    ctx.lineWidth = this.width * 0.1;
    ctx.beginPath();
    ctx.moveTo(this.width * 0.5, 0);
    ctx.quadraticCurveTo(this.width * 0.7, this.height * 0.3, this.width * 0.5, this.height * 0.4);
    ctx.stroke();

    // Draw cherries
    ctx.fillStyle = '#ff2d2d';
    ctx.beginPath();
    ctx.arc(w, this.height * 0.6, w, 0, Math.PI * 2);
    ctx.arc(this.width - w, this.height * 0.6, w, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(w * 0.7, this.height * 0.5, w * 0.3, 0, Math.PI * 2);
    ctx.arc(this.width - w * 1.3, this.height * 0.5, w * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStrawberry(ctx) {
    // Body
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    ctx.moveTo(this.width * 0.5, 0);
    ctx.quadraticCurveTo(this.width, this.height * 0.2, this.width * 0.8, this.height);
    ctx.quadraticCurveTo(this.width * 0.5, this.height * 1.1, this.width * 0.2, this.height);
    ctx.quadraticCurveTo(0, this.height * 0.2, this.width * 0.5, 0);
    ctx.fill();

    // Seeds
    ctx.fillStyle = '#ffff00';
    for(let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = this.width * 0.5 + Math.cos(angle) * this.width * 0.3;
      const y = this.height * 0.5 + Math.sin(angle) * this.height * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, this.width * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStar(ctx) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for(let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x1 = Math.cos(angle) * this.width * 0.5;
      const y1 = Math.sin(angle) * this.width * 0.5;
      const x2 = Math.cos(angle + Math.PI / 5) * this.width * 0.2;
      const y2 = Math.sin(angle + Math.PI / 5) * this.width * 0.2;
      if(i === 0) {
        ctx.moveTo(x1 + this.width/2, y1 + this.height/2);
      } else {
        ctx.lineTo(x1 + this.width/2, y1 + this.height/2);
      }
      ctx.lineTo(x2 + this.width/2, y2 + this.height/2);
    }
    ctx.closePath();
    ctx.fill();
  }
}
