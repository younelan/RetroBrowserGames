// script.js
document.addEventListener('DOMContentLoaded', () => {
    const playerCanvas = document.getElementById('playerBoard');
    const computerCanvas = document.getElementById('computerBoard');
    const playerCtx = playerCanvas.getContext('2d');
    const computerCtx = computerCanvas.getContext('2d');
    const startGameButton = document.getElementById('startGameButton'); // Get the button

    const gridSize = 10; // 10x10 grid
    let cellSize; // Will be calculated dynamically

    // Create an empty 10x10 board
    function createEmptyBoard() {
        return Array(gridSize).fill(null).map(() => Array(gridSize).fill(0)); // 0 for empty, Ship object for occupied
    }

    let gameState = 'placement'; // 'placement', 'playing', 'gameOver'
    let currentPlayer = 'player'; // 'player' or 'computer'
    let playerTurn = true;
    let gameOverWinner = null; // 'player' or 'computer'

    // Ship types: name, length
    const shipConfigs = [
        { name: 'destroyer', length: 2 },
        { name: 'submarine', length: 3 },
        { name: 'cruiser', length: 3 },
        { name: 'battleship', length: 4 },
        { name: 'carrier', length: 5 },
    ];

    class Ship {
        constructor(id, name, length, startRow, startCol, isVertical) {
            this.id = id;
            this.name = name;
            this.length = length;
            this.startRow = startRow;
            this.startCol = startCol;
            this.isVertical = isVertical;
            this.hits = Array(length).fill(false); // To track hits on individual ship segments
            this.sunk = false;
        }

        get positions() {
            const positions = [];
            for (let i = 0; i < this.length; i++) {
                if (this.isVertical) {
                    positions.push({ row: this.startRow + i, col: this.startCol });
                } else {
                    positions.push({ row: this.startRow, col: this.startCol + i });
                }
            }
            return positions;
        }

        isSunk() {
            return this.hits.every(hit => hit);
        }
    }

    let playerBoard = createEmptyBoard(); // Stores references to player ship objects or 0
    let computerBoard = createEmptyBoard(); // Stores references to computer ship objects or 0
    let playerShips = []; // Array of actual Ship objects for the player
    let computerShips = []; // Array of actual Ship objects for the computer

    // Stores 'miss' (2), 'hit' (3) or 0 (unknown) for shots on the boards
    let playerShots = createEmptyBoard(); // Shots taken by player on computer's board
    let computerShots = createEmptyBoard(); // Shots taken by computer on player's board

    // Animation queue (particles, ripples, etc.). Declared early so render functions can reference it.
    const animations = [];

    // Drag / placement interaction state
    let draggedShip = null;
    let isDragging = false;
    let maybeDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let originalShipState = null;

    const DRAG_THRESHOLD = 5; // Pixels to move before it's considered a drag

    function rotateShip(ship) {
        if (!ship || ship === 0) return;

        originalShipState = {
            row: ship.startRow,
            col: ship.startCol,
            isVertical: ship.isVertical
        };
        
        const proposedIsVertical = !ship.isVertical;
        
        // Temporarily clear ship from board for collision check
        const currentShipPositions = ship.positions; 
        for (const pos of currentShipPositions) {
            playerBoard[pos.row][pos.col] = 0;
        }

        if (canPlaceShip(playerBoard, ship, ship.startRow, ship.startCol, proposedIsVertical, ship)) {
            // If valid, update ship's orientation and place it
            placeShipOnBoard(playerBoard, ship, ship.startRow, ship.startCol, proposedIsVertical);
        } else {
            // If invalid, revert ship's state to original and place it back
            console.log("Cannot rotate ship here, reverting.");
            placeShipOnBoard(playerBoard, ship, originalShipState.row, originalShipState.col, originalShipState.isVertical);
        }
        renderPlayerBoards();
    }

    // Initialize canvas dimensions and calculate cellSize
    function initializeCanvas(canvas, ctx) {
        const displayWidth = canvas.clientWidth;
        canvas.width = displayWidth;
        canvas.height = displayWidth; // Make it square
        return displayWidth / gridSize;
    }
    
    // Function to handle window resizing
    function onResize() {
        cellSize = initializeCanvas(playerCanvas, playerCtx);
        initializeCanvas(computerCanvas, computerCtx); // Computer canvas uses the same cellSize

        renderPlayerBoards();
        renderComputerBoards();
    }

    // Draw the grid
    function drawGrid(ctx) {
        ctx.strokeStyle = '#bbb'; // Grid line color
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, gridSize * cellSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(gridSize * cellSize, i * cellSize);
            ctx.stroke();
        }
    }

    // Draw all ships on a specific context
    function drawAllShips(ctx, ships, isPlayerBoard) {
        for (const ship of ships) {
            // Determine ship fill color based on player/computer, sunk status
            let fillColor = '';
            let borderColor = 'rgba(50, 50, 50, 0.8)'; // Default dark border for all ships
            let outlineWidth = 1;

            if (ship.sunk) {
                fillColor = 'rgba(25, 25, 25, 0.9)'; // Darker, almost black for sunk ships
                borderColor = 'black';
                outlineWidth = 2;
            } else if (isPlayerBoard) {
                fillColor = 'rgba(0, 100, 200, 0.7)'; // Player ships blue
            } else { // Computer's board
                if (gameState === 'placement') { // During placement, show computer ships for debugging/setup
                    fillColor = 'rgba(100, 100, 100, 0.7)'; // Grey for computer ships in placement
                } else {
                    continue; // Hide un-sunk computer ships during gameplay
                }
            }
            
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = outlineWidth;

            // Draw each segment of the ship
            for (let i = 0; i < ship.length; i++) {
                let r = ship.isVertical ? ship.startRow + i : ship.startRow;
                let c = ship.isVertical ? ship.startCol : ship.startCol + i;

                ctx.beginPath();
                ctx.rect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);

                // Draw fill for unhit segments (or for sunk ships)
                if (ship.sunk || !ship.hits[i]) {
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                }
                ctx.stroke(); // Always draw outline for visibility
            }
        }
    }

    // Explosion Particle Class
    class ExplosionParticle {
        constructor(x, y, color, size, velocityX, velocityY, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.velocityX = velocityX;
            this.velocityY = velocityY;
            this.life = life;
            this.maxLife = life;
        }

        update() {
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.life--;
        }

        draw(ctx) {
            const opacity = this.life / this.maxLife;
            ctx.fillStyle = `rgba(${this.color}, ${opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * opacity, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw an explosion graphic for a hit
    function drawExplosion(ctx, particles) {
        particles.forEach(particle => {
            particle.update();
            particle.draw(ctx);
        });
    }

    // Add explosion animation to the list
    function addExplosionAnimation(canvas, row, col) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        const particles = [];
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (cellSize * 0.1) + (cellSize * 0.02);
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = Math.random() * (cellSize * 0.1) + 2;
            const life = Math.floor(Math.random() * 20) + 10; // Frames

            const colors = ['255,165,0', '255,255,0', '255,69,0']; // Orange, Yellow, Red
            const color = colors[Math.floor(Math.random() * colors.length)];

            particles.push(new ExplosionParticle(x, y, color, size, velocityX, velocityY, life));
        }

        animations.push({
            canvas: canvas,
            row: row,
            col: col,
            type: 'hit',
            particles: particles,
            frame: 0,
            duration: particles[0].maxLife, // Duration based on particle life
            draw: function(ctx, currentFrame) {
                drawExplosion(ctx, this.particles);
                this.particles = this.particles.filter(p => p.life > 0);
                if (this.particles.length === 0) {
                    this.duration = currentFrame; // Mark as finished for animate loop to remove
                }
            }
        });
    }

    // Splash Particle Class (similar to Explosion, but water-themed)
    class SplashParticle {
        constructor(x, y, color, size, velocityX, velocityY, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.velocityX = velocityX;
            this.velocityY = velocityY;
            this.life = life;
            this.maxLife = life;
            this.gravity = 0.1; // Simulate gravity for droplets
        }

        update() {
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.velocityY += this.gravity; // Apply gravity
            this.life--;
        }

        draw(ctx) {
            const opacity = this.life / this.maxLife;
            ctx.fillStyle = `rgba(${this.color}, ${opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * opacity, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw a splash graphic for a miss
    function drawSplash(ctx, particles) {
        particles.forEach(particle => {
            particle.update();
            particle.draw(ctx);
        });
    }

    // Add splash animation to the list
    function addSplashAnimation(canvas, row, col) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        const particles = [];
        const particleCount = 15; // Fewer particles than explosion

        // Add "droplets"
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (cellSize * 0.08) + (cellSize * 0.01);
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = Math.random() * (cellSize * 0.08) + 1;
            const life = Math.floor(Math.random() * 20) + 15; // Longer life for droplets

            const colors = ['173,216,230', '255,255,255', '135,206,250']; // Light blue, white, light sky blue
            const color = colors[Math.floor(Math.random() * colors.length)];

            particles.push(new SplashParticle(x, y, color, size, velocityX, velocityY, life));
        }

        // Add an expanding ripple effect (as a single "particle" with special drawing)
        particles.push({
            x: x, y: y, size: 0, life: 30, maxLife: 30,
            update: function() { this.size += cellSize * 0.03; this.life--; },
            draw: function(ctx) {
                const opacity = this.life / this.maxLife;
                ctx.strokeStyle = `rgba(173, 216, 230, ${opacity})`;
                ctx.lineWidth = 2 * opacity;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
            }
        });


        animations.push({
            canvas: canvas,
            row: row,
            col: col,
            type: 'miss',
            particles: particles,
            frame: 0,
            duration: 30, // Duration based on longest particle life
            draw: function(ctx, currentFrame) {
                drawSplash(ctx, this.particles);
                this.particles = this.particles.filter(p => p.life > 0);
                if (this.particles.length === 0) {
                    this.duration = currentFrame; // Mark as finished for animate loop to remove
                }
            }
        });
    }

    // Draw shots (hits and misses)
    function drawShots(ctx, shotsBoard) {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // If there is an active animation for this cell on this canvas, skip the static marker
                const hasAnim = animations.some(anim => anim.canvas === ctx.canvas && anim.row === r && anim.col === c);
                if (hasAnim) continue;
                if (shotsBoard[r][c] === 2) { // Miss
                    ctx.beginPath();
                    ctx.arc(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, cellSize / 4, 0, 2 * Math.PI);
                    ctx.fillStyle = 'rgba(173, 216, 230, 0.7)'; // Lighter, more watery blue
                    ctx.fill();
                    ctx.lineWidth = 1.5; // Slightly thicker outline
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // White outline
                    ctx.stroke();
                } else if (shotsBoard[r][c] === 3) { // Hit
                    // Draw a subtle pulsing hit marker if no particle animation is present
                    const cx = c * cellSize + cellSize / 2;
                    const cy = r * cellSize + cellSize / 2;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(200, 0, 0, 1)';
                    ctx.lineWidth = Math.max(2, cellSize * 0.06);
                    const size = cellSize * 0.28;
                    ctx.beginPath();
                    ctx.moveTo(cx - size, cy - size);
                    ctx.lineTo(cx + size, cy + size);
                    ctx.moveTo(cx + size, cy - size);
                    ctx.lineTo(cx - size, cy + size);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    // Draw a game-over message onto a canvas context
    function drawGameOverOnCanvas(ctx) {
        if (gameState !== 'gameOver' || !gameOverWinner) return;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, w, h);

        const title = (gameOverWinner === 'player') ? 'You Win!' : 'Computer Wins!';
        const subtitle = (gameOverWinner === 'player') ? 'All enemy ships sunk.' : 'Your fleet has been destroyed.';

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.font = `bold ${Math.floor(w * 0.08)}px sans-serif`;
        ctx.fillText(title, w / 2, h / 2 - (w * 0.05));

        // Subtitle
        ctx.font = `${Math.floor(w * 0.035)}px sans-serif`;
        ctx.fillText(subtitle, w / 2, h / 2 + (w * 0.05));

        ctx.restore();
    }

    function renderBoard(ctx, board, ships, shotsBoard, isPlayerBoard) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawGrid(ctx);
        drawAllShips(ctx, ships, isPlayerBoard);
        drawShots(ctx, shotsBoard);
    }

    // Check if a ship can be placed at a given position and orientation without overlapping other ships
    // 'excludeShip' is used when moving a ship, to not check collision with itself
    function canPlaceShip(board, ship, startRow, startCol, isVertical, excludeShip = null) {
        for (let i = 0; i < ship.length; i++) {
            let r = isVertical ? startRow + i : startRow;
            let c = isVertical ? startCol : startCol + i;

            // Check boundaries
            if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
                return false;
            }

            // Check for overlap with other ships
            if (board[r][c] !== 0 && board[r][c] !== excludeShip) {
                return false; // Cell occupied by another ship
            }
        }
        return true;
    }

    // Place a ship object on the board and update its properties
    function placeShipOnBoard(board, ship, startRow, startCol, isVertical) {
        // Clear old positions of the ship on the board if it was already placed
        for (const pos of ship.positions) {
            board[pos.row][pos.col] = 0;
        }

        ship.startRow = startRow;
        ship.startCol = startCol;
        ship.isVertical = isVertical;

        // Mark new positions
        for (const pos of ship.positions) {
            board[pos.row][pos.col] = ship; // Store reference to the ship object
        }
    }

    // Place all ships randomly on a given board
    function placeAllShipsRandomly(board, shipsArray) {
        // Clear any existing ships
        for(let r=0; r<gridSize; r++) {
            for(let c=0; c<gridSize; c++) {
                board[r][c] = 0;
            }
        }
        shipsArray.length = 0; // Clear the array of ship objects

        let shipIdCounter = 0;
        for (const config of shipConfigs) {
            const newShip = new Ship(shipIdCounter++, config.name, config.length, 0, 0, false);
            let placed = false;
            while (!placed) {
                const isVertical = Math.random() < 0.5;
                const row = Math.floor(Math.random() * gridSize);
                const col = Math.floor(Math.random() * gridSize);

                if (canPlaceShip(board, newShip, row, col, isVertical)) {
                    placeShipOnBoard(board, newShip, row, col, isVertical);
                    shipsArray.push(newShip);
                    placed = true;
                }
            }
        }
    }

    // Helper to get mouse position in grid coordinates
    function getMousePos(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    // Get ship at mouse position
    function getShipAtMousePos(e) {
        const mousePos = getMousePos(playerCanvas, e);
        const col = Math.floor(mousePos.x / cellSize);
        const row = Math.floor(mousePos.y / cellSize);

        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            return null;
        }
        return playerBoard[row][col]; // Returns a Ship object or 0
    }

    // Main render functions
    function renderPlayerBoards() {
        renderBoard(playerCtx, playerBoard, playerShips, computerShots, true);
    }

    function renderComputerBoards() {
        renderBoard(computerCtx, computerBoard, computerShips, playerShots, false);
    }

    // Handle a shot at a given row and column
    function handleShot(board, shipsArray, shotsBoard, row, col) {
        if (shotsBoard[row][col] !== 0) { // Already shot here
            return { hit: false, sunk: null, gameOver: false, alreadyShot: true };
        }

                    const target = board[row][col];
                if (target !== 0) { // It's a ship
                    shotsBoard[row][col] = 3; // Mark as hit
                    // Trigger explosion animation
                    const canvas = (board === playerBoard) ? playerCanvas : computerCanvas;
                    addExplosionAnimation(canvas, row, col);
                    const ship = target;
            
            // Find the index of the hit part within the ship
            for (let i = 0; i < ship.length; i++) {
                let r = ship.isVertical ? ship.startRow + i : ship.startRow;
                let c = ship.isVertical ? ship.startCol : ship.startCol + i;
                if (r === row && c === col) {
                    ship.hits[i] = true;
                    break;
                }
            }

            if (ship.isSunk()) {
                ship.sunk = true;
                console.log(`${ship.name} sunk!`);
                if (shipsArray.every(s => s.sunk)) {
                    return { hit: true, sunk: ship, gameOver: true, alreadyShot: false };
                }
                return { hit: true, sunk: ship, gameOver: false, alreadyShot: false };
            }
            return { hit: true, sunk: null, gameOver: false, alreadyShot: false };
        } else { // Miss
            shotsBoard[row][col] = 2; // Mark as miss
            // Trigger splash animation
            const canvas = (board === playerBoard) ? playerCanvas : computerCanvas;
            addSplashAnimation(canvas, row, col);
            return { hit: false, sunk: null, gameOver: false, alreadyShot: false };
        }
    }

    function playerMakeShot(row, col) {
        const result = handleShot(computerBoard, computerShips, playerShots, row, col);
        renderComputerBoards();

        if (result.gameOver) {
            gameState = 'gameOver';
            gameOverWinner = 'player';
            // Let the animation loop draw the canvas-based win screen
            return;
        }

        if (!result.alreadyShot) {
            playerTurn = false;
            setTimeout(computerMakeShot, 1000); // Computer takes turn after 1 second
        }
    }

    function computerMakeShot() {
        let shotRow, shotCol;
        let validShot = false;
        while (!validShot) {
            shotRow = Math.floor(Math.random() * gridSize);
            shotCol = Math.floor(Math.random() * gridSize);
            if (computerShots[shotRow][shotCol] === 0) { // Not already shot
                validShot = true;
            }
        }

        const result = handleShot(playerBoard, playerShips, computerShots, shotRow, shotCol);
        renderPlayerBoards();

        if (result.gameOver) {
            gameState = 'gameOver';
            gameOverWinner = 'computer';
            return;
        }

        playerTurn = true; // Player's turn again
    }

    // Function to handle window resizing
    function onResize() {
        cellSize = initializeCanvas(playerCanvas, playerCtx);
        initializeCanvas(computerCanvas, computerCtx); // Computer canvas uses the same cellSize

        renderPlayerBoards();
        renderComputerBoards();
    }


    // Initial setup
    // Initialize canvases and calculate initial cellSize
    cellSize = initializeCanvas(playerCanvas, playerCtx);
    initializeCanvas(computerCanvas, computerCtx);

    placeAllShipsRandomly(playerBoard, playerShips);
    placeAllShipsRandomly(computerBoard, computerShips);

    renderPlayerBoards();
    renderComputerBoards();

    // Attach resize event listener
    window.addEventListener('resize', onResize);

    // Start the animation loop (handles particle effects and game-over drawing)
    requestAnimationFrame(animate);

    // Game animation management

    function animate() {
        // Redraw boards first to clear previous animation frames
        renderPlayerBoards();
        renderComputerBoards();

        // Update and draw animations
        for (let i = 0; i < animations.length; i++) {
            const anim = animations[i];
            const ctx = anim.canvas.getContext('2d');
            anim.draw(ctx, anim.frame);
            anim.frame++;

            if (anim.frame > anim.duration) {
                animations.splice(i, 1); // Remove completed animation
                i--;
            }
        }

        // If game over, draw canvas-based messages on both boards
        if (gameState === 'gameOver') {
            drawGameOverOnCanvas(playerCtx);
            drawGameOverOnCanvas(computerCtx);
        }

        requestAnimationFrame(animate);
    }

    // Event Listeners for Player Canvas (Drag & Drop, Rotation)
    playerCanvas.addEventListener('mousedown', (e) => {
        if (gameState === 'placement') {
            const ship = getShipAtMousePos(e);
            if (ship && ship !== 0) { // If a ship is clicked
                maybeDragging = true; // Set flag for potential drag
                startMouseX = e.clientX;
                startMouseY = e.clientY;
                draggedShip = ship;

                originalShipState = {
                    row: ship.startRow,
                    col: ship.startCol,
                    isVertical: ship.isVertical
                };

                const mousePos = getMousePos(playerCanvas, e);

                // Calculate offset from the top-left of the ship's start cell to the mouse click, in grid units

                dragOffsetX = (mousePos.x / cellSize) - ship.startCol;

                dragOffsetY = (mousePos.y / cellSize) - ship.startRow;
            }
        }
    });

    playerCanvas.addEventListener('mousemove', (e) => {
        if (gameState === 'placement' && draggedShip) {
            if (maybeDragging) { // Check if we might be dragging
                const dx = e.clientX - startMouseX;
                const dy = e.clientY - startMouseY;
                if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
                    isDragging = true; // Confirmed as a drag
                    maybeDragging = false; // No longer just "maybe"
                }
            }

            if (isDragging) {
                const mousePos = getMousePos(playerCanvas, e);
                // Calculate new position using the drag offset
                let newCol = Math.floor((mousePos.x / cellSize) - dragOffsetX);
                let newRow = Math.floor((mousePos.y / cellSize) - dragOffsetY);

                // Ensure newCol and newRow are within bounds
                newCol = Math.max(0, Math.min(gridSize - 1, newCol));
                newRow = Math.max(0, Math.min(gridSize - 1, newRow));

                // Store the original position of the ship before attempting to move it
                const currentShipOriginalState = {
                    row: draggedShip.startRow,
                    col: draggedShip.startCol,
                    isVertical: draggedShip.isVertical
                };

                // Temporarily remove the ship from the board for collision detection
                // This is done by placing it at the new potential position, effectively moving it in memory
                // but we still need to check for collision with other ships after this.
                // Before this, clear the cells the ship currently occupies
                for (const pos of draggedShip.positions) {
                    playerBoard[pos.row][pos.col] = 0;
                }
                // Now, conceptually move the ship to the new position
                draggedShip.startRow = newRow;
                draggedShip.startCol = newCol;

                // Check if the new position is valid
                if (canPlaceShip(playerBoard, draggedShip, newRow, newCol, draggedShip.isVertical, draggedShip)) {
                    // If valid, apply the new position permanently
                    placeShipOnBoard(playerBoard, draggedShip, newRow, newCol, draggedShip.isVertical);
                } else {
                    // If invalid, revert the ship's position to its original state
                    placeShipOnBoard(playerBoard, draggedShip, currentShipOriginalState.row, currentShipOriginalState.col, currentShipOriginalState.isVertical);
                }
                renderPlayerBoards();
            }
        }
    });

    playerCanvas.addEventListener('mouseup', () => {
        if (gameState === 'placement' && draggedShip) { // Check draggedShip, not necessarily isDragging
            if (isDragging) { // If it was a confirmed drag
                // Check one last time if the final position is valid. If not, revert to original.
                const tempBoard = createEmptyBoard();
                for (let r = 0; r < gridSize; r++) {
                    for (let c = 0; c < gridSize; c++) {
                        if (playerBoard[r][c] !== draggedShip) {
                            tempBoard[r][c] = playerBoard[r][c];
                        }
                    }
                }
                if (!canPlaceShip(tempBoard, draggedShip, draggedShip.startRow, draggedShip.startCol, draggedShip.isVertical, draggedShip)) {
                    placeShipOnBoard(playerBoard, draggedShip, originalShipState.row, originalShipState.col, originalShipState.isVertical);
                    renderPlayerBoards();
                }
            }
            // Reset all drag related flags and variables
            isDragging = false;
            maybeDragging = false;
            draggedShip = null;
        }
    });

    // Event Listener for Computer Canvas (Player attacking computer)
    computerCanvas.addEventListener('click', (e) => {
        if (gameState === 'playing' && playerTurn) {
            const mousePos = getMousePos(computerCanvas, e);
            const col = Math.floor(mousePos.x / cellSize);
            const row = Math.floor(mousePos.y / cellSize);

            if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                playerMakeShot(row, col);
            }
        }
    });

    // Start Game Button Logic
    startGameButton.addEventListener('click', () => {
        if (gameState === 'placement') {
            gameState = 'playing';
            startGameButton.disabled = true;
            console.log('Game Started!');
            playerTurn = true; // Player starts
            // No need to remove listeners, as they are now conditional on gameState
        }
    });

    // Double-click to rotate ship
    playerCanvas.addEventListener('dblclick', (e) => {
        if (gameState === 'placement') {
            const ship = getShipAtMousePos(e);
            if (ship && ship !== 0) {
                rotateShip(ship);
            }
        }
    });
});
