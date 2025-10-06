export class Level {
    // levelSpec can be either a plain grid string or an object { grid, color1, color2, colors }
    constructor(levelSpec) {
      if (typeof levelSpec === 'string') {
        this.grid = this.parseLevel(levelSpec);
        this.levelColors = {};
      } else {
        this.grid = this.parseLevel(levelSpec.grid || '');
        this.levelColors = {
          color1: levelSpec.color1,
          color2: levelSpec.color2,
          colors: levelSpec.colors || {}
        };
      }

      // Default color map
      this.colors = {
        'R': '#ff0000', // Red
        'G': '#00ff00', // Green
        'B': '#0000ff', // Blue (generic block by default)
        'C': '#FF8DA1', // Candy / diagonal-wrapped block (default)
        'Y': '#ffff00', // Yellow
        'O': '#ffa500', // Orange
        'M': '#770000', // Maroon
        'S': '#808000', // Olive
        'D': '#000080', // Navy
        'L': '#808080', // Grey
        'T': '#00ff7f', // Teal
        'P': '#880099', // Purple
  'W': '#ffffff', // White
        'Z': '#FF8DA1', // Pink
        'N': '#964B00'  // Brown
      };

      // Apply any per-level explicit color overrides
      if (this.levelColors.colors) {
        Object.keys(this.levelColors.colors).forEach(k => {
          this.colors[k] = this.levelColors.colors[k];
        });
      }

      // If a level defines color1, use it as the generic block color 'B'
      if (this.levelColors.color1) {
        this.colors['B'] = this.levelColors.color1;
        // Also map C to the same main color by default so levels can use C blocks with same palette
        this.colors['C'] = this.levelColors.color1;
        // Map R (cloud) to same main color by default
        this.colors['R'] = this.levelColors.color1;
      }

      // Per-cell shadow color overrides (for example color2 for 'B')
      this.shadowColors = {};
      if (this.levelColors.color2) {
        this.shadowColors['B'] = this.levelColors.color2;
        this.shadowColors['C'] = this.levelColors.color2;
        this.shadowColors['R'] = this.levelColors.color2;
      }
      // Cache for generated patterns keyed by gridSize+colors
      this._patternCache = {};
    }

    // Create or fetch a cached repeating pattern for candy tiles so adjacent C tiles align
    getCandyPattern(ctx, gridSize, mainColor, stripeColor) {
      const key = `${gridSize}:${mainColor}:${stripeColor}`;
      if (this._patternCache[key]) return this._patternCache[key];

      // create offscreen canvas sized to gridSize so the pattern repeats every tile
      const size = Math.max(1, Math.round(gridSize));
      const off = document.createElement('canvas');
      off.width = size;
      off.height = size;
      const octx = off.getContext('2d');

      // fill base
      if (/^#([0-9A-Fa-f]{6})$/.test(mainColor)) {
        const g = octx.createLinearGradient(0, 0, 0, size);
        g.addColorStop(0, this.lightenColor(mainColor, 15));
        g.addColorStop(1, this.darkenColor(mainColor, 8));
        octx.fillStyle = g;
      } else {
        octx.fillStyle = mainColor;
      }
      octx.fillRect(0, 0, size, size);

      // draw diagonal parallelogram stripes so pattern tiles seamlessly
      const stripeW = Math.max(2, Math.round(size * 0.16));
      const spacing = stripeW * 2;
      octx.fillStyle = stripeColor;
      // draw stripes with parallelograms that span the square in a tiled-friendly way
      for (let x = -size; x < size * 2; x += spacing) {
        octx.beginPath();
        octx.moveTo(x, 0);
        octx.lineTo(x + stripeW, 0);
        octx.lineTo(x + stripeW + size, size);
        octx.lineTo(x + size, size);
        octx.closePath();
        octx.fill();
      }

  // (no top highlight or bottom border here) keep pattern purely diagonal so it tiles seamlessly

      const pattern = ctx.createPattern(off, 'repeat');
      this._patternCache[key] = pattern;
      return pattern;
    }

    // Create or fetch a cached repeating soft-cloud pattern for 'R' tiles
    getCloudPattern(ctx, gridSize, mainColor, accentColor) {
      const key = `cloud:${gridSize}:${mainColor}:${accentColor}`;
      if (this._patternCache[key]) return this._patternCache[key];

      const size = Math.max(1, Math.round(gridSize));
      const off = document.createElement('canvas');
      off.width = size;
      off.height = size;
      const octx = off.getContext('2d');

      // base fill
      octx.fillStyle = mainColor;
      octx.fillRect(0, 0, size, size);

      // draw several soft ellipses / blobs to simulate clouds
      octx.globalCompositeOperation = 'lighter';
      const blobs = Math.max(3, Math.round(size / 16));
      for (let i = 0; i < blobs; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const rx = size * (0.18 + Math.random() * 0.25);
        const ry = size * (0.12 + Math.random() * 0.25);
        const grad = octx.createRadialGradient(cx, cy, 1, cx, cy, Math.max(rx, ry));
        grad.addColorStop(0, accentColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        octx.fillStyle = grad;
        octx.beginPath();
        octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
        octx.fill();
      }
      octx.globalCompositeOperation = 'source-over';

      const pattern = ctx.createPattern(off, 'repeat');
      this._patternCache[key] = pattern;
      return pattern;
    }
  
    get width() {
      return this.grid[0].length;
    }
  
    get height() {
      return this.grid.length;
    }
  
    parseLevel(levelString) {
      return levelString.trim().split('\n').map(line => line.trim());
    }

    isWall(cell) {
      return this.colors.hasOwnProperty(cell);
    }
  
    draw(ctx, gridSize) {
      this.grid.forEach((row, rowIndex) => {
        row.split('').forEach((cell, colIndex) => {
          const x = colIndex * gridSize;
          const y = rowIndex * gridSize;
  
          if (this.isWall(cell)) {
            ctx.save();
            ctx.translate(x, y);

            // Special rendering for cloud 'R' tiles
            if (cell === 'R') {
              const mainColor = this.colors['R'] || '#cccccc';
              const accent = this.shadowColors['R'] || ( /^#([0-9A-Fa-f]{6})$/.test(mainColor) ? this.lightenColor(mainColor, 25) : 'rgba(255,255,255,0.6)');
              const pattern = this.getCloudPattern(ctx, gridSize, mainColor, accent);
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, gridSize, gridSize);
              ctx.restore();
              return;
            }

            // Special rendering for candy-wrapped diagonal block 'C' (seamless)
            if (cell === 'C') {
              const mainColor = this.colors['C'] || '#FF8DA1';
              const stripeColor = this.shadowColors['C'] || ( /^#([0-9A-Fa-f]{6})$/.test(mainColor) ? this.darkenColor(mainColor, 25) : 'rgba(0,0,0,0.2)');

              // Create or retrieve a repeating pattern for candies (so adjacent C tiles look seamless)
              const pattern = this.getCandyPattern(ctx, gridSize, mainColor, stripeColor);
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, gridSize, gridSize);

              ctx.restore();
              return;
            }

            // Default block rendering for other wall tiles
            const baseColor = this.colors[cell] || '#000000';
            const gradient = ctx.createLinearGradient(0, 0, 0, gridSize);
            // If the provided color is a hex value, use lighten/darken helpers to create a gradient.
            // Otherwise (e.g., rgba()), fall back to a flat gradient using the same color.
            if (/^#([0-9A-Fa-f]{6})$/.test(baseColor)) {
              gradient.addColorStop(0, this.lightenColor(baseColor, 30));
              gradient.addColorStop(1, this.darkenColor(baseColor, 30));
            } else {
              gradient.addColorStop(0, baseColor);
              gradient.addColorStop(1, baseColor);
            }

            // Main block
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, gridSize, gridSize);

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, gridSize, gridSize * 0.16);

            // Shadow: use per-level shadow color if provided for this cell, otherwise fallback to dark translucent black
            const perCellShadow = this.shadowColors[cell];
            if (perCellShadow) {
              // Use the provided shadow color (optionally darkened a bit)
              ctx.fillStyle = perCellShadow;
            } else {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            }
            ctx.fillRect(0, gridSize * 0.84, gridSize, gridSize * 0.16);

            ctx.restore();
          }
        });
      });
    }



    // Helper function to lighten a color
    lightenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    // Helper function to darken a color
    darkenColor(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }
}
