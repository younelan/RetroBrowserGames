import { levels } from './levels.js';

// Global variables
let canvas, ctx, gameWidth, gameHeight, gridSize = 60; // Default grid size
let player, monsters = [];
let bubbles = [];
let currentLevelIndex = 0;
let keys = {};
let levelGrid = [];
let jumpHeight = 1; // Default jump height

// Event listener for input
function handleInput() {
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Spacebar to throw a bubble
    if (e.key === ' ' || e.key === 'Space') {
      throwBubble();
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });
}

// Game initialization
function initializeGame() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas context is not available!');
    return;
  }

  // Load the current level
  const currentLevel = levels[currentLevelIndex];
  levelGrid = parseLevel(currentLevel.grid);
  jumpHeight = currentLevel.jumpHeight || 1; // Use jumpHeight from level data or default to 1

  // Initialize player and monsters based on the grid
  levelGrid.forEach((row, rowIndex) => {
    row.split('').forEach((cell, colIndex) => {
      const x = colIndex * gridSize;
      const y = rowIndex * gridSize;

      if (cell === '1') {
        // Player should start at the position of '1'
        player = { 
          x: x, 
          y: y, 
          width: gridSize, // Player's width is the same size as grid cells
          height: gridSize, // Player's height is the same size as grid cells
          speed: 5, 
          velocity: 0, 
          isJumping: false, 
          direction: 1 // Assume player is facing right initially
        };
      } else if (cell === '+') {
        monsters.push({ 
          x, 
          y, 
          width: gridSize, 
          height: gridSize, 
          speed: 2, 
          direction: 1 
        });
      }
    });
  });

  resizeCanvas();
  startFalling(); // Start falling for the player as soon as the game starts
}

// Parse the level and split into rows
function parseLevel(levelString) {
  return levelString.trim().split('\n').map(line => line.trim());
}

// Game loop - called repeatedly
function gameLoop() {
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Render the grid (blue platforms)
  levelGrid.forEach((row, rowIndex) => {
    row.split('').forEach((cell, colIndex) => {
      const x = colIndex * gridSize;
      const y = rowIndex * gridSize;

      if (cell === 'B') {
        ctx.fillStyle = 'blue';
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    });
  });

  // Update and draw player
  updatePlayer();
  drawPlayer();

  // Update and draw monsters
  monsters.forEach(monster => {
    moveMonster(monster, levelGrid);
    drawMonster(monster);
  });

  // Update and draw bubbles
  bubbles.forEach((bubble, index) => {
    updateBubble(bubble);
    drawBubble(bubble);
    // Remove bubbles that go out of bounds or hit something
    if (bubble.x < 0 || bubble.x > gameWidth || bubble.y < 0 || bubble.y > gameHeight) {
      bubbles.splice(index, 1);
    }
  });

  requestAnimationFrame(gameLoop);
}

// Function to start the fall logic for the player
function startFalling() {
  // Always check for a platform below the player and start falling if there is none
  const platformBelow = checkPlatformBelow(player.x, player.y + player.height);
  if (!platformBelow) {
    player.velocity = 5; // Start falling if no platform is below
    player.isJumping = false; // Player isn't jumping at the start
  }
}

// Update player position with movement and falling
function updatePlayer() {
  // Apply gravity when jumping or falling
  if (player.isJumping) {
    player.velocity += 0.8; // Gravity
    player.y += player.velocity;

    // Check for landing on a platform (stop fall if platform is below)
    if (player.velocity > 0) { // Falling down
      const platformBelow = checkPlatformBelow(player.x, player.y + player.height);
      if (platformBelow) {
        player.y = platformBelow.y - player.height; // Stop falling and land on the platform
        player.isJumping = false;
        player.velocity = 0; // Reset velocity when landing
      }
    }
  } else {
    // Always check if there's a platform below to stop the fall
    const platformBelow = checkPlatformBelow(player.x, player.y + player.height);
    if (!platformBelow) {
      player.velocity = 5; // Start falling if nothing below
      player.isJumping = false;
    }
  }

  // Horizontal movement with collision detection
  if (keys['ArrowLeft']) {
    if (!isWallCollision(player.x - player.speed, player.y)) {
      player.x -= player.speed;
      player.direction = -1; // Set direction to left
    }
  }
  if (keys['ArrowRight']) {
    // Check right side collision before moving
    if (!isWallCollision(player.x + player.width + player.speed, player.y)) {
      player.x += player.speed;
      player.direction = 1; // Set direction to right
    }
  }

  // Jumping logic with spacebar or up arrow
  if ((keys['ArrowUp']) && !player.isJumping) {
    player.isJumping = true;
    player.velocity = -10 * jumpHeight; // Jump height scaled by level data
  }

  // Throw a bubble with the spacebar
  if (keys['Space']) {
    throwBubble();
  }
}

// Check for collision with the walls (check for 'B' in the level)
function isWallCollision(x, y) {
  const col = Math.floor(x / gridSize);
  const row = Math.floor(y / gridSize);
  if (levelGrid[row] && levelGrid[row][col] === 'B') {
    return true; // Wall collision detected
  }
  return false;
}

// Check if there's a platform directly below the player (y + height)
function checkPlatformBelow(x, y) {
  const col = Math.floor(x / gridSize);
  const row = Math.floor((y + gridSize) / gridSize); // Check just below the player

  // Check if there's a platform directly below (on the next row)
  if (levelGrid[row] && levelGrid[row][col] === 'B') {
    return { x: col * gridSize, y: row * gridSize }; // Return the platform's coordinates
  }

  return null; // No platform below
}

function drawPlayer() {
  ctx.fillStyle = 'green';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Monster movement logic (colliding with walls and changing direction)
function moveMonster(monster, grid) {
  const gridX = Math.floor(monster.x / gridSize);
  const gridY = Math.floor(monster.y / gridSize);

  const leftCell = grid[gridY][gridX - 1];
  const rightCell = grid[gridY][gridX + 1];
  const belowCell = grid[gridY + 1] ? grid[gridY + 1][gridX] : null; // Check below

  // Change direction if the monster hits a wall (left or right)
  if (monster.direction === 1 && rightCell === 'B') {
    monster.direction = -1; // Change direction to left
  } else if (monster.direction === -1 && leftCell === 'B') {
    monster.direction = 1; // Change direction to right
  }

  // If no platform below, the monster falls vertically
  if (belowCell !== 'B') {
    monster.y += monster.speed; // Fall until platform is detected
  }

  monster.x += monster.direction * monster.speed;
}

function drawMonster(monster) {
  ctx.fillStyle = 'red';
  ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
}

// Bubble logic
function throwBubble() {
  if (player.isJumping) return; // Player can't throw bubble while jumping

  const bubble = {
    x: player.x + player.width, // Starting position to the right of the player
    y: player.y + player.height / 2, // Center of the player
    width: gridSize,
    height: gridSize,
    speed: 10,
    direction: player.direction, // Set bubble direction based on player’s direction
    distanceTravelled: 0, // Track the distance the bubble has traveled in the current direction
  };

  bubbles.push(bubble);
}

function updateBubble(bubble) {
  // Move bubble in the direction the player was last moving
  if (bubble.distanceTravelled < 2 * gridSize) {
    bubble.x += bubble.direction * bubble.speed; // Move bubble horizontally
    bubble.distanceTravelled += bubble.speed;
  } else {
    bubble.y -= 2; // Once bubble has moved 2 cells, move it upwards
  }
}

function drawBubble(bubble) {
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.arc(bubble.x + bubble.width / 2, bubble.y + bubble.height / 2, bubble.width / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Canvas resizing to fit the grid
function resizeCanvas() {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  // Calculate how many cells fit in the width and height of the canvas
  const gridCountX = Math.floor(maxWidth / gridSize);
  const gridCountY = Math.floor(maxHeight / gridSize);

  // Ensure the grid size fits the entire canvas width/height, maintaining square ratio
  gameWidth = gridCountX * gridSize;
  gameHeight = gridCountY * gridSize;

  canvas.width = gameWidth;
  canvas.height = gameHeight;

  // Recalculate the grid size based on the number of cells in the level
  gridSize = Math.floor(gameWidth / levelGrid[0].length); // Cell width = canvas width / number of columns
}

// Start the game
function startGame() {
  if (!document.getElementById('gameCanvas')) {
    console.error('Canvas element is missing!');
    return;
  }
  initializeGame();
  gameLoop();
  handleInput();
}

window.addEventListener('resize', resizeCanvas);

// Ensure the game starts after DOM content is loaded
document.addEventListener('DOMContentLoaded', startGame);
