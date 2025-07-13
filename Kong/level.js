import { Player } from './player.js';
import { Damsel } from './Damsel.js';
import { Barrel } from './Barrel.js';
import { Platform } from './Platform.js';
import { Ladder } from './Ladder.js';
import { Kong } from './Kong.js';
import { Hammer } from './Hammer.js';

export class Level {
  constructor(levelData, scale = 1) {
    this.name = levelData.name;
    this.time = levelData.time;
    this.virtualWidth = 800;
    this.virtualHeight = 800;
    this.scale = scale;
    console.log(`Level initialized with scale: ${this.scale}`);
    // Store all positions/sizes in virtual units
    this.platforms = (levelData.platforms || []).map((p, idx) => {
      console.log(`Platform: start_x=${p.start_x}, start_y=${p.start_y}, end_x=${p.end_x}, end_y=${p.end_y}`);
      const plat = new Platform(p);
      plat.index = idx;
      return plat;
    });
    this.ladders = (levelData.ladders || []).map(l => new Ladder(l));
    // Use the y from the level data directly for Damsel position
    this.damsel = new Damsel({ ...levelData.damsel_pos });
    // Use player start position in virtual coordinates (no scaling here)
    this.player_start = levelData.player_start;
    console.log(`Player start position from levelData: x=${this.player_start.x}, y=${this.player_start.y}`);
    this.player = new Player({
      x: this.player_start.x,
      y: this.player_start.y,
      width: Player.WIDTH,
      height: Player.HEIGHT,
      speed: Player.SPEED
    });
    console.log(`Player initialized in Level: x=${this.player.x}, y=${this.player.y}, width=${this.player.width}, height=${this.player.height}`);
    this.kong = new Kong({ ...levelData.dk_pos });
    this.barrels = [];
    // Convert hammer items to Hammer instances
    this.items = (levelData.items || []).map(item => {
      if (item.type === 'hammer') return new Hammer({ x: item.x, y: item.y });
      return item;
    });
    this.barrel_speed = levelData.barrel_speed || 1;
    this.barrel_release_frequency = levelData.barrel_release_frequency;
    // Add more as needed
  }

  update(deltaTime) {
    // Hammer pickup logic
    let hammerCarried = false;
    this.items.forEach(item => {
      if (item instanceof Hammer && !item.carried && !item.pickedUp) {
        // Simple AABB collision for pickup
        if (
          this.player.x < item.x + item.width &&
          this.player.x + this.player.width > item.x &&
          this.player.y < item.y + item.height &&
          this.player.y + this.player.height > item.y
        ) {
          item.carried = true;
          item.pickedUp = true;
          hammerCarried = true;
        }
      } else if (item instanceof Hammer && item.carried) {
        hammerCarried = true;
      }
    });
    this.player.hasHammer = hammerCarried;
    // Update player (pass hammer state)
    this.player.update(this, deltaTime);
    this.kong.update(this, deltaTime);
    this.damsel.update(this, deltaTime);
    this.barrels.forEach(barrel => barrel.update(this, deltaTime));
    // Update hammers (if needed)
    this.items.forEach(item => {
      if (item instanceof Hammer) item.update(this, deltaTime);
    });
    // Add more as needed
  }

  render(ctx) {
    // Draw ladders first, then platforms, Kong, Damsel, barrels, player
    this.ladders.forEach(l => l.render(ctx, this.scale));
    this.platforms.forEach(p => p.render(ctx, this.scale));
    // Draw hammer items (not carried)
    this.items.forEach(item => {
      if (item instanceof Hammer && !item.carried) {
        item.render(ctx, this.scale);
      }
    });
    this.kong.render(ctx, this.scale);
    this.damsel.render(ctx, this.scale);
    this.barrels.forEach(b => b.render(ctx, this.scale));
    // Draw hammer in player's hand if carried (player tells hammer where to draw)
    // If player is carrying the hammer, player tells hammer to draw itself at the correct place
    let hammer = this.items.find(item => item instanceof Hammer && item.carried);
    if (hammer) {
      this.player.drawCarriedHammer(ctx, hammer, this.scale);
    }
    this.player.render(ctx, this.scale);
    // Add more as needed
  }
}
