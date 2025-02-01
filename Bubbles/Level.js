export class Level {
    constructor(levelString) {
      this.grid = this.parseLevel(levelString);
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
  
    draw(ctx, gridSize) {
      this.grid.forEach((row, rowIndex) => {
        row.split('').forEach((cell, colIndex) => {
          const x = colIndex * gridSize;
          const y = rowIndex * gridSize;
  
          if (cell === 'B') {
            // Draw block scaled to current gridSize
            ctx.save();
            ctx.translate(x, y);
            
            // Create block gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, gridSize);
            gradient.addColorStop(0, '#4477AA');
            gradient.addColorStop(1, '#225588');
            
            // Main block
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, gridSize, gridSize);
            
            // Highlight (proportional to gridSize)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, gridSize, gridSize * 0.16);
            
            // Shadow (proportional to gridSize)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, gridSize * 0.84, gridSize, gridSize * 0.16);
            
            ctx.restore();
          }
        });
      });
    }
}
