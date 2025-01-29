export class Bubble {
  constructor(x, y, width, height, speed, direction, delayBeforeMoving = 60) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = direction;
    this.distanceTravelled = 0;
    this.trappedMonster = null;
    this.trapDelay = 0;
    this.state = 'moving'; 
    this.configuredDelay = delayBeforeMoving; // Configurable delay
  }

  update() {
    if (this.state === 'moving') {
      if (this.distanceTravelled < 2 * this.width) {
        this.x += this.direction * this.speed;
        this.distanceTravelled += this.speed;
      } else {
        this.y -= 2;
      }
    } else if (this.state === 'trapped') {
      if (this.trappedMonster) {
        this.trappedMonster.x = this.x + this.width / 4;
        this.trappedMonster.y = this.y;
      }
      this.trapDelay -= 1;
      if (this.trapDelay <= 0) {
        this.state = 'upward';
      }
    } else if (this.state === 'upward') {
      if (this.trappedMonster) {
        this.trappedMonster.x = this.x + this.width / 4;
        this.trappedMonster.y = this.y;
      }
      this.y -= this.speed;
      if (this.y + this.height < 0) {
        if (this.trappedMonster) {
          this.trappedMonster.resetPosition();
          this.trappedMonster = null;
        }
        return 'burst';
      }
    }
  }

  trap(monster) {
    this.trappedMonster = monster;
    this.state = 'trapped';
    this.trapDelay = this.configuredDelay; // Use configurable delay
  }

  draw(ctx) {
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    if (this.trappedMonster) {
      this.trappedMonster.draw(ctx);
    }
  }
}
