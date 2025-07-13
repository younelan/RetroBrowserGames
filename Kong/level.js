import { Player } from './player.js';
import { Damsel } from './Damsel.js';
import { Barrel } from './Barrel.js';
import { Platform } from './Platform.js';
import { Ladder } from './Ladder.js';
import { Kong } from './Kong.js';

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
    this.items = (levelData.items || []);
    this.barrel_speed = levelData.barrel_speed || 1;
    this.barrel_release_frequency = levelData.barrel_release_frequency;
    // Add more as needed
  }

  update(deltaTime) {
    this.player.update(this, deltaTime);
    this.kong.update(this, deltaTime);
    this.damsel.update(this, deltaTime);
    this.barrels.forEach(barrel => barrel.update(this, deltaTime));
    // Add more as needed
  }

  render(ctx) {
    // Draw ladders first, then platforms, Kong, Damsel, barrels, player
    this.ladders.forEach(l => l.render(ctx, this.scale));
    this.platforms.forEach(p => p.render(ctx, this.scale));
    this.kong.render(ctx, this.scale);
    this.damsel.render(ctx, this.scale);
    this.barrels.forEach(b => b.render(ctx, this.scale));
    this.player.render(ctx, this.scale);
    // Add more as needed
  }
}
