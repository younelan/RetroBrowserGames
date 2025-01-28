// utils.js

export function resizeCanvasToFitGrid(canvas, gridSize) {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  
  const gridCount = Math.min(Math.floor(maxWidth / gridSize), Math.floor(maxHeight / gridSize));
  
  const gameWidth = gridSize * gridCount;
  const gameHeight = gridSize * gridCount;
  
  canvas.width = gameWidth;
  canvas.height = gameHeight;
  
  return { gameWidth, gameHeight };
}

