export class Level {
    constructor(levelString) {
      this.grid = this.parseLevel(levelString);
      this.colors = {
        'R': '#ff0000', // Red
        'G': '#00ff00', // Green
        'B': '#0000ff', // Blue
        'Y': '#ffff00', // Yellow
        'O': '#ffa500', // Orange
        'P': '#800080', // Purple
        'W': '#ffffff', // White
        'C': '#00ffff', // Cyan
        'Z': '#FF8DA1', // Pink
        'M': '#ff00ff', // Magenta
        'N': '#964B00'  // Brown
      };
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
            
            // Create block gradient with the color from the map
            const baseColor = this.colors[cell];
            const gradient = ctx.createLinearGradient(0, 0, 0, gridSize);
            gradient.addColorStop(0, this.lightenColor(baseColor, 30));
            gradient.addColorStop(1, this.darkenColor(baseColor, 30));
            
            // Main block
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, gridSize, gridSize);
            
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, gridSize, gridSize * 0.16);
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
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
