export class Bubble {
  constructor(x, y, width, height, speed, direction, delayBeforeMoving = 60) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    const baseSpeed = 4; // Lower base speed
    this.speed = (speed / 4) * (width / 60); // Scale speed to grid size
    this.direction = direction;
    this.distanceTravelled = 0;
    this.trappedMonster = null;
    this.trapDelay = 0;
    this.state = 'moving';
    this.configuredDelay = delayBeforeMoving;
    this.safeFrames = 30; // Bubble is invincible for first 30 frames
  }

  update() {
    if (this.safeFrames > 0) {
        this.safeFrames--; // Count down before bubble can be popped
    }

    if (this.state === 'moving') {
        if (this.distanceTravelled < 2 * this.width) {
            this.x += this.direction * this.speed;
            this.distanceTravelled += Math.abs(this.speed);
        } else {
            this.state = 'upward'; // Switch to moving upward
        }
    } else if (this.state === 'trapped') {
        if (this.trappedMonster) {
            this.trappedMonster.x = this.x + this.width / 4; // Keep centered
            this.trappedMonster.y = this.y;
        }
        this.trapDelay--;
        if (this.trapDelay <= 0) {
            this.state = 'upward'; // Start moving up
        }
    } else if (this.state === 'upward') {
        if (this.trappedMonster) {
            this.trappedMonster.x = this.x + this.width / 4; // Center monster
            this.trappedMonster.y = this.y;
        }
        this.y -= this.speed * 0.75;
        if (this.y + this.height < 0) {
            if (this.trappedMonster) {
                this.trappedMonster.isTrapped = false;
                this.trappedMonster.resetPosition();
                this.trappedMonster = null;
            }
            return 'burst';
        }
    }
}


  canBePopped() {
    return this.safeFrames <= 0; // Bubble can be popped after the safe delay
}


  trap(monster) {
    this.trappedMonster = monster;
    this.trappedMonster.isTrapped = true;
    this.state = 'trapped';
    this.trapDelay = this.configuredDelay;
  }

  draw(ctx) {
    const scale = this.width / 60;
    
    // Draw bubble slightly smaller than grid
    const bubbleRadius = (this.width * 0.4);
    ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
    ctx.beginPath();
    ctx.arc(
      this.x + this.width/2,
      this.y + this.height/2,
      bubbleRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Scale shine effect properly
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(
      this.x + this.width * 0.3,
      this.y + this.height * 0.3,
      bubbleRadius * 0.25,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    if (this.trappedMonster) {
      // Properly scale and position trapped monster
      ctx.save();
      const monsterScale = 0.8;
      ctx.translate(this.x + this.width/2, this.y + this.height/2);
      ctx.scale(monsterScale * (this.trappedMonster.direction), monsterScale);
      ctx.translate(-this.width/2, -this.height/2);
      this.trappedMonster.draw(ctx);
      ctx.restore();
    }

    // Debugging: Draw safeFrames countdown
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText(this.safeFrames, this.x + this.width / 2 - 6, this.y + this.height / 2);
  }

}
