export class Level {
    constructor(levelString) {
      this.grid = this.parseLevel(levelString);
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
            ctx.fillStyle = 'blue';
            ctx.fillRect(x, y, gridSize, gridSize);
          }
        });
      });
    }
  }
  