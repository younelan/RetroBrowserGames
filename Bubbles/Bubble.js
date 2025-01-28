export class Bubble {
    constructor(x, y, width, height, speed, direction) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.direction = direction;
      this.distanceTravelled = 0;
    }
  
    update() {
      if (this.distanceTravelled < 2 * this.width) {
        this.x += this.direction * this.speed;
        this.distanceTravelled += this.speed;
      } else {
        this.y -= 2; // Move upwards
      }
    }
  
    draw(ctx) {
      ctx.fillStyle = 'cyan';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  