export class GameUI {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
    }

    initialize() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupTouchControls();
    }

    setupTouchControls() {
        const handleInput = (e) => {
            e.preventDefault();
            if (!this.game.gameActive) return;  // Only handle input if game is active
            
            const rect = this.canvas.getBoundingClientRect();
            const scale = this.canvas.width / rect.width; // Calculate scale factor
            
            // Get coordinates, handling both touch and mouse events
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // Convert to canvas space
            const x = (clientX - rect.left) * scale;
            const y = (clientY - rect.top) * scale;

            // Use quadrants to determine direction
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            const dx = x - centerX;
            const dy = y - centerY;
            
            // Use absolute comparison to determine primary direction
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal movement
                this.game.player.direction = dx > 0 ? 'right' : 'left';
            } else {
                // Vertical movement
                this.game.player.direction = dy > 0 ? 'down' : 'up';
            }
        };

        // Add all event listeners
        this.canvas.addEventListener('touchstart', handleInput, { passive: false });
        this.canvas.addEventListener('touchmove', handleInput, { passive: false });
        this.canvas.addEventListener('mousedown', handleInput);
        this.canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) { // Only if mouse button is pressed
                handleInput(e);
            }
        });
    }

    // Remove the old updatePlayerDirection method as it's now integrated into handleInput

    // Optional: Draw touch zones for debugging
    drawTouchZones() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        
        // Draw four triangles
        // Left triangle
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.fillStyle = 'blue';
        this.ctx.fill();
        
        // Right triangle
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'red';
        this.ctx.fill();
        
        // Top triangle
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.fillStyle = 'green';
        this.ctx.fill();
        
        // Bottom triangle
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'yellow';
        this.ctx.fill();
        
        this.ctx.restore();
    }

    resizeCanvas() {
        const containerWidth = this.game.container.clientWidth;
        const containerHeight = window.innerHeight;
        let size = containerWidth;
        
        // Maintain aspect ratio but fill width in portrait mode
        if (containerHeight < containerWidth) {
            size = containerHeight;
        }
        
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Update cell size based on level width
        this.game.cellSize = size / this.game.levels[this.game.currentLevel][0].length;
        this.resizeCells();
    }

    resizeCells() {
        this.game.cellSize = this.canvas.width / this.game.levels[this.game.currentLevel][0].length;
        this.game.player.radius = (this.game.cellSize - 2) / 2; // Adjust size to fit through walls
        this.game.monsters.forEach(monster => {
            monster.radius = (this.game.cellSize - 2) / 2; // Adjust size to fit through walls
            monster.speed = 0.1; // Speed in cells per update
        });
    }

    drawScore() {
        // Keep high score logic for coloring
        var highScore = localStorage.getItem(this.game.highScoreItem) || 0;
        if (this.game.score > highScore) {
            localStorage.setItem(this.game.highScoreItem, this.game.score);
            highScore = this.game.score;
        }

        const width = this.canvas.width;
        const y = this.canvas.height - 5; // Move closer to bottom
        const shadowOffset = 2;

        this.ctx.font = `${this.game.cellSize / 2}px Arial`;

        // Draw shadow layer first
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('L:', width * 0.15 + shadowOffset, y + shadowOffset);
        this.ctx.fillText(`${this.game.currentLevel + 1}`, width * 0.15 + this.game.cellSize + shadowOffset, y + shadowOffset);
        this.ctx.fillText('\u2764', width * 0.5 + shadowOffset, y + shadowOffset);
        this.ctx.fillText(`${this.game.lives}`, width * 0.5 + this.game.cellSize + shadowOffset, y + shadowOffset);
        this.ctx.fillText(`${this.game.score}`, width * 0.85 + shadowOffset, y + shadowOffset);

        // Draw main text
        // Level
        this.ctx.fillStyle = 'lightgreen';  // Label color
        this.ctx.fillText('L:', width * 0.15, y);
        this.ctx.fillStyle = 'white';      // Value color
        this.ctx.fillText(`${this.game.currentLevel + 1}`, width * 0.15 + this.game.cellSize, y);

        // Lives
        this.ctx.fillStyle = 'lightblue';  // Label heart
        this.ctx.fillStyle = '#FF0000';    // Red heart
        this.ctx.fillText('\u2764', width * 0.5, y);
        this.ctx.fillStyle = 'white';      // Value color
        this.ctx.fillText(`${this.game.lives}`, width * 0.5 + this.game.cellSize, y);

        // Score
        this.ctx.fillStyle = this.game.score > highScore ? 'yellow' : 'white';
        this.ctx.fillText(`${this.game.score}`, width * 0.85, y);
    }
}