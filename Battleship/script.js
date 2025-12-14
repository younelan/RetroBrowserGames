// script.js
document.addEventListener('DOMContentLoaded', () => {
    const playerCanvas = document.getElementById('playerBoard');
    const computerCanvas = document.getElementById('computerBoard');
    const playerContainer = document.getElementById('playerContainer');
    const computerContainer = document.getElementById('computerContainer');
    const playerCtx = playerCanvas.getContext('2d');
    const computerCtx = computerCanvas.getContext('2d');
    const startGameButton = document.getElementById('startGameButton'); // Get the button
    const randomizeButton = document.getElementById('randomizeButton'); // Shuffle player's ships
    const restartButton = document.getElementById('restartButton');
    const gameOverButtonBounds = {}; // map canvas.id -> {x,y,w,h}

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
    let selectedShip = null; // currently selected ship (tap)
    let startMouseX = 0;
    let startMouseY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let originalShipState = null;

    // Double-tap detection state for touch devices
    let lastTap = { time: 0, x: 0, y: 0 };
    let longPressTimer = null;
    let longPressFired = false;

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
            placeShipOnBoard(playerBoard, ship, originalShipState.row, originalShipState.col, originalShipState.isVertical);
            // show a small feedback on the player canvas
            // Position rotation feedback using canvas-local cell size and header offset
            {
                const cs = playerCanvas.width / gridSize;
                const headerPx = cs;
                addFloatingText(playerCanvas, 'Can\'t rotate here', '220,120,120', { center: false, x: (ship.startCol+0.5)*cs, y: headerPx + (ship.startRow+0.3)*cs, duration: 60 });
            }
        }
        renderPlayerBoards();
    }

    // Initialize canvas dimensions and calculate cellSize
    function initializeCanvas(canvas, ctx) {
        let displayWidth = canvas.clientWidth;

        // Account for header row inside canvas: we'll add one extra 'cell' height to the canvas height.
        // So the total canvas height = displayWidth + (displayWidth / gridSize)
        // On narrow screens (mobile), make sure canvases fit vertically when stacked by limiting displayWidth accordingly.
        if (window.innerWidth <= 768) {
            const bothVisible = computerContainer && !computerContainer.classList.contains('hidden');
            if (bothVisible) {
                // availableHeight per canvas (roughly half the viewport minus UI chrome)
                const availableHeight = Math.max(140, Math.floor((window.innerHeight - 140) / 2));
                // We need displayWidth + displayWidth/gridSize <= availableHeight
                const maxDisplay = Math.floor(availableHeight / (1 + 1 / gridSize));
                displayWidth = Math.min(displayWidth, maxDisplay);
            } else {
                const availableHeight = Math.max(140, Math.floor(window.innerHeight - 160));
                const maxDisplay = Math.floor(availableHeight / (1 + 1 / gridSize));
                displayWidth = Math.min(displayWidth, maxDisplay);
            }
        }

        // set canvas dimensions: width is displayWidth, height reserves one extra cell for header
        const cellSizeLocal = displayWidth / gridSize;
        canvas.width = displayWidth;
        canvas.height = Math.ceil(displayWidth + cellSizeLocal);
        return cellSizeLocal;
    }
    
    // Function to handle window resizing
    function onResize() {
        cellSize = initializeCanvas(playerCanvas, playerCtx);
        initializeCanvas(computerCanvas, computerCtx); // Computer canvas uses the same cellSize

        renderPlayerBoards();
        renderComputerBoards();
    }

    // Draw the grid
    function drawGrid(ctx, headerHeight) {
        ctx.strokeStyle = '#bbb'; // Grid line color

        // draw header background
        ctx.fillStyle = 'rgba(20,30,40,0.85)';
        ctx.fillRect(0, 0, ctx.canvas.width, headerHeight);

        // vertical lines
        for (let i = 0; i <= gridSize; i++) {
            const x = i * cellSize;
            ctx.beginPath();
            ctx.moveTo(x, headerHeight);
            ctx.lineTo(x, headerHeight + gridSize * cellSize);
            ctx.stroke();
        }

        // horizontal lines (shifted by headerHeight)
        for (let i = 0; i <= gridSize; i++) {
            const y = headerHeight + i * cellSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(gridSize * cellSize, y);
            ctx.stroke();
        }
    }

    // Draw all ships on a specific context
    function drawAllShips(ctx, ships, isPlayerBoard, headerHeight) {
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

                const x = c * cellSize + 1;
                const y = headerHeight + r * cellSize + 1;
                ctx.beginPath();
                ctx.rect(x, y, cellSize - 2, cellSize - 2);

                // If this ship is selected, draw with a highlighted tint
                if (selectedShip === ship && isPlayerBoard && !ship.sunk) {
                    ctx.fillStyle = 'rgba(80, 180, 255, 0.85)';
                    ctx.fill();
                } else {
                    // Draw fill for unhit segments (or for sunk ships)
                    if (ship.sunk || !ship.hits[i]) {
                        ctx.fillStyle = fillColor;
                        ctx.fill();
                    }
                }
                ctx.stroke(); // Always draw outline for visibility
            }

            // If selected, draw rotate button near the ship (player only)
            if (selectedShip === ship && isPlayerBoard && !ship.sunk) {
                // compute bounding box of the ship in canvas pixels
                const cs = cellSize;
                const headerPx = headerHeight;
                const left = ship.startCol * cs;
                const top = headerPx + ship.startRow * cs;
                const width = ship.isVertical ? cs : ship.length * cs;
                const height = ship.isVertical ? ship.length * cs : cs;
                const pad = Math.max(4, Math.floor(cs * 0.06));
                const r = Math.max(8, Math.floor(cs * 0.12));

                // Place button inside the ship area: top-right corner inset
                const bx = left + Math.min(width - r - pad, Math.max(r + pad, width - r - pad));
                const by = top + r + pad;

                // ensure button stays within canvas bounds
                const bxClamped = Math.min(Math.max(bx, r + 2), ctx.canvas.width - (r + 2));
                const byClamped = Math.min(Math.max(by, headerPx + r + 2), headerPx + gridSize * cs - (r + 2));

                // draw circular button
                ctx.save();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(bxClamped, byClamped, r, 0, Math.PI * 2);
                ctx.fill();
                // draw rotate icon (simple curved arrow)
                ctx.strokeStyle = '#333';
                ctx.lineWidth = Math.max(1, Math.floor(cs * 0.05));
                ctx.beginPath();
                ctx.arc(bxClamped - r * 0.12, byClamped - r * 0.05, r * 0.48, 0.2 * Math.PI, 1.6 * Math.PI);
                ctx.moveTo(bxClamped + r * 0.45, byClamped - r * 0.25);
                ctx.lineTo(bxClamped + r * 0.15, byClamped - r * 0.15);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    // Return rotate button bounds for a player ship (in canvas pixel coords)
    function getRotateButtonBoundsForShip(ship, canvas) {
        const cs = canvas.width / gridSize;
        const headerPx = cs;
        const left = ship.startCol * cs;
        const top = headerPx + ship.startRow * cs;
        const width = ship.isVertical ? cs : ship.length * cs;
        const height = ship.isVertical ? ship.length * cs : cs;
        const pad = Math.max(4, Math.floor(cs * 0.06));
        const r = Math.max(8, Math.floor(cs * 0.12));
        const bx = left + Math.min(width - r - pad, Math.max(r + pad, width - r - pad));
        const by = top + r + pad;
        const bxClamped = Math.min(Math.max(bx, r + 2), canvas.width - (r + 2));
        const byClamped = Math.min(Math.max(by, headerPx + r + 2), headerPx + gridSize * cs - (r + 2));
        return { x: bxClamped, y: byClamped, r: r };
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
            const t = 1 - (this.life / this.maxLife); // 0 -> 1 progress
            const opacity = Math.max(0, this.life / this.maxLife);

            // radial gradient for richer particles
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, Math.max(1, this.size * (1 + t)));
            grad.addColorStop(0, `rgba(255,255,255,${Math.min(0.9, opacity)})`);
            grad.addColorStop(0.2, `rgba(${this.color},${Math.min(0.9, opacity)})`);
            grad.addColorStop(1, `rgba(${this.color},${opacity * 0.05})`);

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (1.2 - 0.8 * t), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Shard particle for explosion debris (thin elongated pieces)
    class ShardParticle {
        constructor(x, y, color, length, angle, speed, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.length = length;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.angle = angle;
            this.life = life;
            this.maxLife = life;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.04; // gravity pull
            this.life--;
        }

        draw(ctx) {
            const opacity = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = `rgba(${this.color}, ${opacity})`;
            ctx.fillRect(0, -1.0, this.length, 2.2);
            ctx.restore();
        }
    }

    // Shockwave/ring for explosion
    class Shockwave {
        constructor(x, y, maxRadius, life) {
            this.x = x;
            this.y = y;
            this.maxRadius = maxRadius;
            this.life = life;
            this.maxLife = life;
        }

        update() {
            this.life--;
        }

        draw(ctx) {
            const t = 1 - (this.life / this.maxLife);
            const radius = this.maxRadius * t;
            const opacity = Math.max(0, 0.9 * (1 - t));
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = Math.max(1, 6 * (1 - t));
            ctx.strokeStyle = `rgba(255,220,130,${opacity * 0.9})`;
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw an explosion graphic for a hit
    function drawExplosion(ctx, particles) {
        particles.forEach(particle => {
            particle.update();
            particle.draw(ctx);
        });
    }

    // Floating text (Hit / Miss / Sunk) that rises and fades
    function addFloatingText(canvas, text, colorRGB = '255,255,255', options = {}) {
        const cx = options.center ? canvas.width / 2 : (options.x || canvas.width / 2);
        const cy = options.center ? canvas.height / 2 : (options.y || canvas.height / 2);
        const duration = options.duration || 50;
        const size = options.size || Math.floor(canvas.width * (options.center ? 0.06 : 0.04));

        animations.push({
            canvas: canvas,
            row: options.row ?? null,
            col: options.col ?? null,
            type: 'floatingText',
            text: text,
            x: cx,
            y: cy,
            color: colorRGB,
            life: duration,
            maxLife: duration,
            size: size,
            frame: 0,
            duration: duration,
            draw: function(ctx) {
                const t = 1 - (this.life / this.maxLife);
                const opacity = Math.max(0, this.life / this.maxLife);
                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = `rgba(${this.color},${Math.min(1, opacity + 0.15)})`;
                ctx.font = `bold ${this.size}px sans-serif`;
                // slight upward movement
                const y = this.y - t * (this.size * 1.4);
                // shadow/glow
                ctx.shadowColor = `rgba(0,0,0,${Math.min(0.6, opacity)})`;
                ctx.shadowBlur = 8;
                ctx.fillText(this.text, this.x, y);
                ctx.restore();

                this.life--;
                if (this.life <= 0) this.duration = 0;
            }
        });
    }

    // Confetti particle for celebratory effect
    class Confetti {
        constructor(x, y, color, size, vx, vy, life, rot) {
            this.x = x; this.y = y; this.color = color; this.size = size;
            this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life; this.rot = rot;
        }
        update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; this.rot += 0.12; this.life--; }
        draw(ctx) {
            const opacity = Math.max(0, this.life / this.maxLife);
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
            ctx.fillStyle = `rgba(${this.color}, ${opacity})`;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size*0.6);
            ctx.restore();
        }
    }

    function addConfetti(canvas, count = 24) {
        const cx = canvas.width / 2; const cy = canvas.height / 3;
        const conf = [];
        const colors = ['255,82,82','255,184,77','102,187,106','66,165,245','171,71,188'];
        for (let i=0;i<count;i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 4 + 1.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;
            const size = Math.random() * 8 + 6;
            const life = Math.floor(Math.random() * 60) + 40;
            const color = colors[Math.floor(Math.random()*colors.length)];
            conf.push(new Confetti(cx, cy, color, size, vx, vy, life, Math.random()*Math.PI));
        }

        animations.push({
            canvas: canvas,
            type: 'confetti',
            particles: conf,
            frame: 0,
            duration: 120,
            draw: function(ctx) {
                this.particles.forEach(p => { p.draw(ctx); p.update(); });
                this.particles = this.particles.filter(p => p.life>0);
                if (this.particles.length === 0) this.duration = 0;
            }
        });
    }

    // Add explosion animation to the list
    function addExplosionAnimation(canvas, row, col) {
        const cs = canvas.width / gridSize;
        const x = col * cs + cs / 2;
        // include header row offset
        const y = cs + row * cs + cs / 2;
        const particles = [];
        const shardParticles = [];
        const particleCount = 26;

        // core fire/flash particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (cs * 0.12) + (cs * 0.03);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - Math.random() * 0.5;
            const size = Math.random() * (cs * 0.12) + 2.5;
            const life = Math.floor(Math.random() * 24) + 14; // Frames
            const colors = ['255,180,60', '255,90,30', '255,220,120'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new ExplosionParticle(x + vx * 0.5, y + vy * 0.5, color, size, vx, vy, life));
        }

        // shards (metal/wood debris)
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = Math.random() * (cs * 0.45) + (cs * 0.1);
            const speed = Math.random() * (cs * 0.14) + (cs * 0.04);
            const life = Math.floor(Math.random() * 30) + 18;
            const colors = ['200,60,30', '120,90,60', '80,80,80'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            shardParticles.push(new ShardParticle(x, y, color, length, angle, speed, life));
        }

        // shockwave
        const shockwave = new Shockwave(x, y, cs * 1.6, 26);

        animations.push({
            canvas: canvas,
            row: row,
            col: col,
            type: 'hit',
            particles: particles,
            shards: shardParticles,
            shockwave: shockwave,
            frame: 0,
            duration: Math.max(30, ...particles.map(p => p.maxLife)),
            draw: function(ctx, currentFrame) {
                // draw shockwave first (so particles overlay)
                if (this.shockwave && this.shockwave.life > 0) {
                    this.shockwave.draw(ctx);
                    this.shockwave.update();
                }

                // draw shards
                this.shards.forEach(s => { s.draw(ctx); s.update(); });
                this.shards = this.shards.filter(s => s.life > 0);

                // draw main fire particles
                drawExplosion(ctx, this.particles);
                this.particles = this.particles.filter(p => p.life > 0);

                if (this.particles.length === 0 && this.shards.length === 0) {
                    this.duration = currentFrame; // mark finished
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
        const cs = canvas.width / gridSize;
        const x = col * cs + cs / 2;
        // include header row offset
        const y = cs + row * cs + cs / 2;
        const particles = [];
        const particleCount = 15; // Fewer particles than explosion

        // Add "droplets"
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (cs * 0.08) + (cs * 0.01);
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = Math.random() * (cs * 0.08) + 1;
            const life = Math.floor(Math.random() * 20) + 15; // Longer life for droplets

            const colors = ['173,216,230', '255,255,255', '135,206,250']; // Light blue, white, light sky blue
            const color = colors[Math.floor(Math.random() * colors.length)];

            particles.push(new SplashParticle(x, y, color, size, velocityX, velocityY, life));
        }

        // Add multiple ripple effects for nicer water
        const ripples = [];
        for (let i = 0; i < 3; i++) {
            ripples.push({
                x: x, y: y, size: 0, life: 24 + i * 8, maxLife: 24 + i * 8,
                update: function() { this.size += cs * (0.04 + i * 0.01); this.life--; },
                draw: function(ctx) {
                    const opacity = Math.max(0, this.life / this.maxLife) * 0.9;
                    ctx.strokeStyle = `rgba(173, 216, 230, ${opacity})`;
                    ctx.lineWidth = 2 * opacity;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        // small upward droplets
        for (let i = 0; i < particleCount; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
            const speed = Math.random() * (cs * 0.06) + (cs * 0.02);
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed - Math.random() * 0.4;
            const size = Math.random() * (cs * 0.06) + 1;
            const life = Math.floor(Math.random() * 20) + 12;
            const colors = ['173,216,230', '200,230,255', '150,200,255'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new SplashParticle(x + velocityX * 0.4, y + velocityY * 0.4, color, size, velocityX, velocityY, life));
        }

        animations.push({
            canvas: canvas,
            row: row,
            col: col,
            type: 'miss',
            particles: particles,
            ripples: ripples,
            frame: 0,
            duration: 40,
            draw: function(ctx, currentFrame) {
                // draw ripples
                this.ripples.forEach(r => { r.draw(ctx); r.update(); });
                this.ripples = this.ripples.filter(r => r.life > 0);

                drawSplash(ctx, this.particles);
                this.particles = this.particles.filter(p => p.life > 0);

                if (this.particles.length === 0 && this.ripples.length === 0) {
                    this.duration = currentFrame;
                }
            }
        });
        // show a small 'Miss' floating text at the cell
        // Position floating text using canvas-local cell size and header offset
        const textCs = canvas.width / gridSize;
        const textHeader = textCs;
        addFloatingText(canvas, 'Miss', '140,200,230', { x: col * textCs + textCs/2, y: textHeader + row * textCs + textCs/2, row: row, col: col, duration: 42 });
    }

    // Draw shots (hits and misses)
    function drawShots(ctx, shotsBoard, headerHeight) {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // If there is an active animation for this cell on this canvas, skip the static marker
                const hasAnim = animations.some(anim => anim.canvas === ctx.canvas && anim.row === r && anim.col === c);
                if (hasAnim) continue;
                if (shotsBoard[r][c] === 2) { // Miss
                    // Draw a nicer droplet + small sheen for miss
                    const cx = c * cellSize + cellSize / 2;
                    const cy = headerHeight + r * cellSize + cellSize / 2;
                    const dropRadius = cellSize * 0.18;
                    // body
                    const grad = ctx.createRadialGradient(cx - dropRadius * 0.3, cy - dropRadius * 0.5, 1, cx, cy, dropRadius);
                    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
                    grad.addColorStop(0.2, 'rgba(200,230,255,0.9)');
                    grad.addColorStop(1, 'rgba(140,200,230,0.6)');
                    ctx.beginPath();
                    ctx.arc(cx, cy, dropRadius, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    // small highlight
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(255,255,255,0.75)';
                    ctx.ellipse(cx - dropRadius * 0.3, cy - dropRadius * 0.4, dropRadius * 0.45, dropRadius * 0.25, -0.6, 0, Math.PI * 2);
                    ctx.fill();
                    // subtle outline
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.stroke();
                } else if (shotsBoard[r][c] === 3) { // Hit
                    // Draw a burn/crater mark for hit
                    const cx = c * cellSize + cellSize / 2;
                    const cy = headerHeight + r * cellSize + cellSize / 2;
                    const outer = cellSize * 0.36;
                    // dark scorched circle
                    ctx.beginPath();
                    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, outer);
                    g.addColorStop(0, 'rgba(255,120,80,0.95)');
                    g.addColorStop(0.25, 'rgba(200,40,30,0.9)');
                    g.addColorStop(0.6, 'rgba(80,30,30,0.4)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
                    ctx.fill();
                    // small inner highlight
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(255,200,160,0.75)';
                    ctx.arc(cx, cy, outer * 0.28, 0, Math.PI * 2);
                    ctx.fill();
                    // faint cracked lines
                    ctx.strokeStyle = 'rgba(40,20,20,0.55)';
                    ctx.lineWidth = Math.max(1, cellSize * 0.03);
                    ctx.beginPath();
                    ctx.moveTo(cx - outer * 0.5, cy - outer * 0.15);
                    ctx.lineTo(cx + outer * 0.25, cy + outer * 0.45);
                    ctx.moveTo(cx + outer * 0.45, cy - outer * 0.4);
                    ctx.lineTo(cx - outer * 0.35, cy + outer * 0.25);
                    ctx.stroke();
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

        // Draw a centered Restart button on the game-over overlay
        const btnW = Math.floor(w * 0.28);
        const btnH = Math.max(28, Math.floor(w * 0.06));
        const btnX = Math.floor((w - btnW) / 2);
        const btnY = Math.floor(h / 2 + (w * 0.09));
        // rounded rect background
        ctx.fillStyle = '#ff6b6b';
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(btnX + radius, btnY);
        ctx.lineTo(btnX + btnW - radius, btnY);
        ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + radius);
        ctx.lineTo(btnX + btnW, btnY + btnH - radius);
        ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - radius, btnY + btnH);
        ctx.lineTo(btnX + radius, btnY + btnH);
        ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - radius);
        ctx.lineTo(btnX, btnY + radius);
        ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
        ctx.closePath();
        ctx.fill();
        // button text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(btnH * 0.5)}px sans-serif`;
        ctx.fillText('Restart', btnX + btnW / 2, btnY + btnH / 2);
        // Store bounds for click detection
        gameOverButtonBounds[ctx.canvas.id] = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.restore();
    }

    function renderBoard(ctx, board, ships, shotsBoard, isPlayerBoard) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const headerHeight = cellSize; // reserve one row height for status
        drawGrid(ctx, headerHeight);
        drawAllShips(ctx, ships, isPlayerBoard, headerHeight);
        drawShots(ctx, shotsBoard, headerHeight);
        // Determine whether this board is currently 'active' (highlighted)
        let isActive = false;
        if (gameState === 'placement') {
            isActive = isPlayerBoard; // while placing, player's board is active
        } else if (gameState === 'playing') {
            // When playing: computer board is active when it's player's turn (they attack it).
            // Player board is active when it's computer's turn (they attack player).
            isActive = isPlayerBoard ? !playerTurn : playerTurn;
        }

        // draw status text in header
        ctx.save();
        // if active, tint the header/background slightly and add a subtle highlight over the grid
        if (isActive) {
            // header tint
            ctx.fillStyle = 'rgba(255, 240, 200, 0.08)';
            ctx.fillRect(0, 0, ctx.canvas.width, headerHeight);
            // grid tint
            ctx.fillStyle = 'rgba(255, 240, 200, 0.03)';
            ctx.fillRect(0, headerHeight, ctx.canvas.width, gridSize * cellSize);
        }

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.floor(cellSize * 0.45)}px sans-serif`;
        let title;
        if (gameState === 'placement' && isPlayerBoard) {
            title = 'Position your boats';
        } else {
            title = isPlayerBoard ? 'Your Boats' : "Computer's Boats";
        }
        ctx.fillText(title, ctx.canvas.width / 2, headerHeight / 2);

        // draw turn indicator circle on the right of the status line
        const circleRadius = Math.max(4, Math.floor(cellSize * 0.15));
        const circlePadding = Math.floor(cellSize * 0.15);
        const circleX = ctx.canvas.width - circlePadding - circleRadius;
        const circleY = headerHeight / 2;
        if (isActive) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = Math.max(1, Math.floor(cellSize * 0.06));
            ctx.beginPath();
            ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
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
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const cellSizeLocal = rect.width / gridSize;
        return { x, y, cellSize: cellSizeLocal };
    }

    // Get ship at mouse position
    function getShipAtMousePos(e) {
        const mousePos = getMousePos(playerCanvas, e);
        const col = Math.floor(mousePos.x / mousePos.cellSize);
        // Account for header row reserved at top of canvas
        const headerPx = mousePos.cellSize;
        const row = Math.floor((mousePos.y - headerPx) / mousePos.cellSize);

        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            return null;
        }
        return playerBoard[row][col]; // Returns a Ship object or 0
    }

    // Main render functions
    function renderPlayerBoards() {
        // Use local cell size for player canvas when rendering
        cellSize = playerCanvas.width / gridSize;
        renderBoard(playerCtx, playerBoard, playerShips, computerShots, true);
    }

    function renderComputerBoards() {
        // Use local cell size for computer canvas when rendering
        cellSize = computerCanvas.width / gridSize;
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
                            // floating 'Hit' text (position using canvas-local cell size + header)
                            {
                                const cs = canvas.width / gridSize;
                                const headerPx = cs;
                                addFloatingText(canvas, 'Hit!', '255,200,80', { x: col * cs + cs/2, y: headerPx + row * cs + cs/2, row: row, col: col, duration: 36 });
                            }
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
                // show sunk text on the same canvas
                {
                    const cs = canvas.width / gridSize;
                    const headerPx = cs;
                    addFloatingText(canvas, `${ship.name} sunk!`, '255,100,50', { x: col * cs + cs/2, y: headerPx + row * cs + cs/2, row: row, col: col, center: false, duration: 70 });
                }
                // add small confetti when a ship sinks
                addConfetti(canvas, 14);
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
            // celebratory effects
            addConfetti(computerCanvas, 36);
            addConfetti(playerCanvas, 26);
            // show centered win text on computer canvas
            addFloatingText(computerCanvas, 'You Win!', '255,230,120', { center: true, duration: 140 });
            // show Restart control and hide placement controls
            if (randomizeButton) randomizeButton.style.display = 'none';
            if (startGameButton) startGameButton.style.display = 'none';
            if (restartButton) restartButton.style.display = 'inline-block';
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
            addConfetti(playerCanvas, 36);
            addConfetti(computerCanvas, 26);
            addFloatingText(playerCanvas, 'You Lose', '220,200,255', { center: true, duration: 140 });
            if (randomizeButton) randomizeButton.style.display = 'none';
            if (startGameButton) startGameButton.style.display = 'none';
            if (restartButton) restartButton.style.display = 'inline-block';
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

    // Event listeners for player canvas (mouse + touch unified)
    function handlePointerDown(e) {
        if (gameState === 'placement') {
            const ship = getShipAtMousePos(e);
            if (ship && ship !== 0) {
                maybeDragging = true; // potential drag
                startMouseX = e.clientX;
                startMouseY = e.clientY;
                draggedShip = ship;

                originalShipState = {
                    row: ship.startRow,
                    col: ship.startCol,
                    isVertical: ship.isVertical
                };

                const mousePos = getMousePos(playerCanvas, e);
                // Use the local cell size for correct offsets
                dragOffsetX = (mousePos.x / mousePos.cellSize) - ship.startCol;
                dragOffsetY = (mousePos.y / mousePos.cellSize) - ship.startRow;
            }
        }
    }

    function handlePointerMove(e) {
        if (gameState === 'placement' && draggedShip) {
            if (maybeDragging) {
                const dx = e.clientX - startMouseX;
                const dy = e.clientY - startMouseY;
                if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
                    isDragging = true;
                    maybeDragging = false;
                }
            }

            if (isDragging) {
                const mousePos = getMousePos(playerCanvas, e);
                const localCell = mousePos.cellSize;
                let newCol = Math.floor((mousePos.x / localCell) - dragOffsetX);
                let newRow = Math.floor((mousePos.y / localCell) - dragOffsetY);

                newCol = Math.max(0, Math.min(gridSize - 1, newCol));
                newRow = Math.max(0, Math.min(gridSize - 1, newRow));

                const currentShipOriginalState = {
                    row: draggedShip.startRow,
                    col: draggedShip.startCol,
                    isVertical: draggedShip.isVertical
                };

                for (const pos of draggedShip.positions) {
                    playerBoard[pos.row][pos.col] = 0;
                }

                draggedShip.startRow = newRow;
                draggedShip.startCol = newCol;

                if (canPlaceShip(playerBoard, draggedShip, newRow, newCol, draggedShip.isVertical, draggedShip)) {
                    placeShipOnBoard(playerBoard, draggedShip, newRow, newCol, draggedShip.isVertical);
                } else {
                    placeShipOnBoard(playerBoard, draggedShip, currentShipOriginalState.row, currentShipOriginalState.col, currentShipOriginalState.isVertical);
                }
                renderPlayerBoards();
            }
        }
    }

    function handlePointerUp(e) {
        if (gameState === 'placement') {
            if (draggedShip) {
                if (isDragging) {
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
                    }
                    // after a real drag-drop, deselect
                    selectedShip = null;
                    renderPlayerBoards();
                } else {
                    // short tap on a ship -> selection or rotate-button click
                    const mousePos = getMousePos(playerCanvas, e);
                    const px = mousePos.x;
                    const py = mousePos.y;

                    // Check rotate buttons first (allow immediate rotate without prior select)
                    let rotated = false;
                    for (const s of playerShips) {
                        if (s.sunk) continue;
                        const b = getRotateButtonBoundsForShip(s, playerCanvas);
                        const dx = px - b.x;
                        const dy = py - b.y;
                        if ((dx * dx + dy * dy) <= (b.r * b.r)) {
                            rotateShip(s);
                            rotated = true;
                            break;
                        }
                    }
                    if (!rotated) {
                        // select the tapped ship (or deselect if empty)
                        const tapped = getShipAtMousePos(e);
                        if (tapped && tapped !== 0) selectedShip = tapped; else selectedShip = null;
                        renderPlayerBoards();
                    }
                }
            }

            isDragging = false;
            maybeDragging = false;
            draggedShip = null;
        }
    }

    // Mouse events
    playerCanvas.addEventListener('mousedown', handlePointerDown);
    playerCanvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // Touch events (map first touch to pointer handlers)
    playerCanvas.addEventListener('touchstart', (ev) => {
        ev.preventDefault();
        if (!ev.touches || !ev.touches[0]) return;
        const t = ev.touches[0];
        // start pointer logic
        handlePointerDown(t);

        // prepare long-press detection (rotate on long-press)
        longPressFired = false;
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        const rect = playerCanvas.getBoundingClientRect();
        const startX = t.clientX - rect.left;
        const startY = t.clientY - rect.top;
        longPressTimer = setTimeout(() => {
            // only trigger if not dragging and still in placement
            if (gameState === 'placement' && !isDragging && !maybeDragging) {
                const fakeEvent = { clientX: t.clientX, clientY: t.clientY };
                const ship = getShipAtMousePos(fakeEvent);
                if (ship && ship !== 0) {
                    rotateShip(ship);
                    if (navigator.vibrate) navigator.vibrate(20);
                    longPressFired = true;
                }
            }
            longPressTimer = null;
        }, 520); // long-press threshold
    }, { passive: false });

    playerCanvas.addEventListener('touchmove', (ev) => {
        ev.preventDefault();
        if (ev.touches && ev.touches[0]) {
            const t = ev.touches[0];
            // cancel long-press if movement exceeds threshold
            if (longPressTimer) {
                // if moved more than DRAG_THRESHOLD pixels from the original touch, cancel long-press
                if (typeof startMouseX === 'number' && typeof startMouseY === 'number' && Math.hypot(t.clientX - startMouseX, t.clientY - startMouseY) > DRAG_THRESHOLD) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
            handlePointerMove(t);
        }
    }, { passive: false });

    // Allow touchend to propagate so click events (e.g. Start button) still fire.
    window.addEventListener('touchend', (ev) => {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        if (ev.changedTouches && ev.changedTouches[0]) handlePointerUp(ev.changedTouches[0]);
    }, { passive: true });

    // Event Listener for Computer Canvas (Player attacking computer)
    computerCanvas.addEventListener('click', (e) => {
        if (gameState === 'playing' && playerTurn) {
            const mousePos = getMousePos(computerCanvas, e);
            const col = Math.floor(mousePos.x / mousePos.cellSize);
            // adjust for header row inside canvas
            const headerPx = mousePos.cellSize;
            const row = Math.floor((mousePos.y - headerPx) / mousePos.cellSize);

            if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                playerMakeShot(row, col);
            }
        }
    });

    // Click handler for game-over Restart button on canvases
    function handleCanvasClickForRestart(e) {
        if (gameState !== 'gameOver') return;
        const canvas = e.currentTarget;
        // get event position (support mouse/touch)
        let ex, ey;
        if (e.changedTouches && e.changedTouches[0]) {
            const t = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            ex = t.clientX - rect.left;
            ey = t.clientY - rect.top;
        } else {
            const mousePos = getMousePos(canvas, e);
            ex = mousePos.x;
            ey = mousePos.y;
        }

        // Recompute button bounds consistently with drawGameOverOnCanvas
        const w = canvas.width;
        const h = canvas.height;
        const btnW = Math.floor(w * 0.28);
        const btnH = Math.max(28, Math.floor(w * 0.06));
        const btnX = Math.floor((w - btnW) / 2);
        const btnY = Math.floor(h / 2 + (w * 0.09));

        if (ex >= btnX && ex <= btnX + btnW && ey >= btnY && ey <= btnY + btnH) {
            restartGame();
        }
    }

    playerCanvas.addEventListener('click', handleCanvasClickForRestart);
    computerCanvas.addEventListener('click', handleCanvasClickForRestart);
    // also handle touchend directly on canvases for mobile (click may be prevented)
    playerCanvas.addEventListener('touchend', (ev) => handleCanvasClickForRestart(ev), { passive: true });
    computerCanvas.addEventListener('touchend', (ev) => handleCanvasClickForRestart(ev), { passive: true });

    // Start Game Button Logic
    startGameButton.addEventListener('click', () => {
        if (gameState === 'placement') {
            gameState = 'playing';
            startGameButton.disabled = true;
            // hide placement controls and show restart button
            if (randomizeButton) randomizeButton.style.display = 'none';
            if (startGameButton) startGameButton.style.display = 'none';
            if (restartButton) restartButton.style.display = 'inline-block';
            // Reveal and reorder boards: show computer first, then player
            if (computerContainer) {
                computerContainer.classList.remove('hidden');
                const parent = computerContainer.parentNode;
                if (parent && playerContainer) parent.insertBefore(computerContainer, playerContainer);
            }
            // reinitialize canvas sizes now that computer container is visible
            onResize();
            // ensure boards are rendered with correct sizes
            renderComputerBoards();
            renderPlayerBoards();
            // show a small start flash on the computer canvas
            addFloatingText(computerCanvas, 'Battle Start', '200,240,255', { center: true, duration: 60 });
            playerTurn = true; // Player starts
            // No need to remove listeners, as they are now conditional on gameState
        }
    });

    // Randomize player's ships while in placement
    if (randomizeButton) {
        randomizeButton.addEventListener('click', () => {
            if (gameState !== 'placement') return;
            // Place player's ships randomly and clear any selection/drag
            placeAllShipsRandomly(playerBoard, playerShips);
            selectedShip = null;
            draggedShip = null;
            isDragging = false;
            maybeDragging = false;
            renderPlayerBoards();
            addFloatingText(playerCanvas, 'Shuffled', '200,240,255', { center: false, duration: 40 });
        });
    }

    // Restart logic (button)
    function restartGame() {
        // reset boards and state to placement
        gameState = 'placement';
        gameOverWinner = null;
        playerTurn = true;
        // reset boards and shots
        playerBoard = createEmptyBoard();
        computerBoard = createEmptyBoard();
        playerShots = createEmptyBoard();
        computerShots = createEmptyBoard();
        playerShips.length = 0;
        computerShips.length = 0;
        animations.length = 0;
        // place ships randomly for both
        placeAllShipsRandomly(playerBoard, playerShips);
        placeAllShipsRandomly(computerBoard, computerShips);
        // reset selection/drag state
        selectedShip = null;
        draggedShip = null;
        isDragging = false;
        maybeDragging = false;
        // show placement controls
        if (randomizeButton) randomizeButton.style.display = 'inline-block';
        if (startGameButton) { startGameButton.style.display = 'inline-block'; startGameButton.disabled = false; }
        if (restartButton) restartButton.style.display = 'none';
        // clear any gameOver button bounds
        gameOverButtonBounds[playerCanvas.id] = null;
        gameOverButtonBounds[computerCanvas.id] = null;
        // reinitialize canvases sizes and render
        onResize();
        addFloatingText(playerCanvas, 'Restarted', '200,240,255', { center: false, duration: 40 });
    }

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            restartGame();
        });
    }

    // Double-click to rotate ship
    playerCanvas.addEventListener('dblclick', (e) => {
        if (gameState === 'placement') {
            const ship = getShipAtMousePos(e);
            if (ship && ship !== 0) {
                rotateShip(ship);
            }
        }
    });

    // Touch: detect double-tap to rotate on mobile
    playerCanvas.addEventListener('touchend', (ev) => {
        if (gameState !== 'placement') return;
        if (!ev.changedTouches || ev.changedTouches.length === 0) return;
        const t = ev.changedTouches[0];
        const rect = playerCanvas.getBoundingClientRect();
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        const now = Date.now();

        // Consider it a tap only if we aren't dragging
        if (isDragging || maybeDragging) {
            // reset maybeDragging state so subsequent taps work
            maybeDragging = false;
            return;
        }

        const dt = now - lastTap.time;
        const dx = x - lastTap.x;
        const dy = y - lastTap.y;
        const dist = Math.hypot(dx, dy);

        const DOUBLE_TAP_MAX_DELAY = 350; // ms
        const DOUBLE_TAP_MAX_DIST = 36; // px

        if (lastTap.time > 0 && dt > 0 && dt <= DOUBLE_TAP_MAX_DELAY && dist <= DOUBLE_TAP_MAX_DIST) {
            // Detected a double-tap
            const fakeEvent = { clientX: t.clientX, clientY: t.clientY };
            const ship = getShipAtMousePos(fakeEvent);
            if (ship && ship !== 0) {
                rotateShip(ship);
            }
            // reset lastTap to avoid triple-tap
            lastTap.time = 0;
        } else {
            // store this tap for potential double-tap
            lastTap.time = now;
            lastTap.x = x;
            lastTap.y = y;
        }
    }, { passive: true });

    // Also listen on touchstart for a snappier double-tap detection on mobile
    playerCanvas.addEventListener('touchstart', (ev) => {
        if (gameState !== 'placement') return;
        if (!ev.touches || ev.touches.length !== 1) return;
        const t = ev.touches[0];
        const rect = playerCanvas.getBoundingClientRect();
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        const now = Date.now();

        // Ignore if a drag is in progress or was just happening
        if (isDragging || maybeDragging) return;

        const dt = now - lastTap.time;
        const dx = x - lastTap.x;
        const dy = y - lastTap.y;
        const dist = Math.hypot(dx, dy);

        const DOUBLE_TAP_MAX_DELAY = 400; // ms (slightly more forgiving on touchstart)
        const DOUBLE_TAP_MAX_DIST = 40; // px

        if (lastTap.time > 0 && dt > 0 && dt <= DOUBLE_TAP_MAX_DELAY && dist <= DOUBLE_TAP_MAX_DIST) {
            // Detected a double-tap
            const fakeEvent = { clientX: t.clientX, clientY: t.clientY };
            const ship = getShipAtMousePos(fakeEvent);
            if (ship && ship !== 0) {
                rotateShip(ship);
                // optional haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(20);
            }
            lastTap.time = 0;
        } else {
            lastTap.time = now;
            lastTap.x = x;
            lastTap.y = y;
        }
    }, { passive: true });
});
