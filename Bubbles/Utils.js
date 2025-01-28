// Utility functions

// Resize the canvas to fit the grid
export function resizeCanvas(canvas, grid) {
  const numberOfRows = grid.length;
  const numberOfColumns = grid[0].length;
  
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate the cell size based on the canvas size and grid dimensions
  const cellWidth = Math.floor(canvasWidth / numberOfColumns);
  const cellHeight = Math.floor(canvasHeight / numberOfRows);

  // Set the canvas size and return the cell size
  canvas.width = numberOfColumns * cellWidth;
  canvas.height = numberOfRows * cellHeight;

  return Math.min(cellWidth, cellHeight); // Cell size will be the smaller of the two dimensions
}

// Draw the grid (background)
export function drawGrid(ctx, grid, cellSize) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw the grid cells
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      let color = 'white'; // Default color

      if (cell === 'B') color = 'blue';  // Platform
      if (cell === '+') color = 'red';   // Monster
      if (cell === '1') color = 'green'; // Player

      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
}

// Check if a position collides with a wall
export function isWallCollision(grid, x, y, cellSize) {
  const gridX = Math.floor(x / cellSize);
  const gridY = Math.floor(y / cellSize);
  
  // If it's out of bounds or a wall (B or any other solid object), return true
  if (gridY < 0 || gridY >= grid.length || gridX < 0 || gridX >= grid[gridY].length) {
    return true;
  }

  const cell = grid[gridY][gridX];
  return cell === 'B';  // Platform or wall
}

// Check if there's a platform below a given x, y position
export function checkPlatformBelow(grid, x, y, cellSize) {
  const gridX = Math.floor(x / cellSize);
  const gridY = Math.floor((y + cellSize) / cellSize); // Just below the current position

  if (gridY < 0 || gridY >= grid.length || gridX < 0 || gridX >= grid[gridY].length) {
    return false; // Out of bounds, no platform below
  }

  const cell = grid[gridY][gridX];
  return cell === 'B'; // Platform or floor below
}
