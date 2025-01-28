export class Bubble {
    constructor(x, y, width, height, speed, direction) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.direction = direction;
      this.distanceTravelled = 0;
      this.trappedMonster = null; // Track the trapped monster
      this.trapDelay = 0; // Delay timer for 1 second after trapping
      this.state = 'moving'; // 'moving', 'trapped', 'upward'
    }
  
    update() {
      if (this.state === 'moving') {
        // Regular bubble movement
        if (this.distanceTravelled < 2 * this.width) {
          this.x += this.direction * this.speed;
          this.distanceTravelled += this.speed;
        } else {
          this.y -= 2; // Move upwards
        }
      } else if (this.state === 'trapped') {
        // Keep the monster centered during the delay
        if (this.trappedMonster) {
          this.trappedMonster.x = this.x + this.width / 4;
          this.trappedMonster.y = this.y;
        }
  
        // Decrease the delay timer
        this.trapDelay -= 1;
        if (this.trapDelay <= 0) {
          this.state = 'upward'; // Start moving upward
        }
      } else if (this.state === 'upward') {
        // Move trapped monster with the bubble
        if (this.trappedMonster) {
          this.trappedMonster.x = this.x + this.width / 4; // Center horizontally
          this.trappedMonster.y = this.y; // Center vertically
        }
        this.y -= this.speed; // Move upwards
  
        // Check if the bubble reaches the top
        if (this.y + this.height < 0) {
          if (this.trappedMonster) {
            this.trappedMonster.resetPosition(); // Reset monster to start
            this.trappedMonster = null; // Release the monster
          }
          return 'burst'; // Signal the bubble should be removed
        }
      }
    }
  
    trap(monster) {
      this.trappedMonster = monster; // Trap the monster
      this.state = 'trapped'; // Change state
      this.trapDelay = 15; // 1-second delay (assuming 60 FPS)
    }
  
    draw(ctx) {
      ctx.fillStyle = 'cyan';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
  
      // Draw trapped monster if present
      if (this.trappedMonster) {
        this.trappedMonster.draw(ctx);
      }
    }
  }
  