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

    draw() {
        // Draw touch zones first
        this.drawTouchZones();
        
        // Draw game elements
        this.game.drawWalls();
        this.game.drawMonsters();
        this.game.drawPlayerOne();
        this.game.drawDots();
        this.drawScore();
        
        // Draw end screen if game is over
        if (!this.game.gameActive && this.game.lives <= 0) {
            this.drawEndScreen(false);
        } else if (!this.game.gameActive && this.game.checkLevelComplete()) {
            this.drawEndScreen(true);
        }
    }

    drawDebugInfo() {
        // Removed debug info
    }

    setupTouchControls() {
        this.handleMove = this.handleMove.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.isDragging = false;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.handleMove(e);  // Change direction immediately
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleMove(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', this.handleEnd);
        this.canvas.addEventListener('mouseleave', this.handleEnd);
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            this.handleMove(e);  // Change direction immediately
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                this.handleMove(e);
            }
        });
        
        this.canvas.addEventListener('touchend', this.handleEnd);
        this.canvas.addEventListener('touchcancel', this.handleEnd);
    }

    handleMove(e) {
        e.preventDefault();
        if (!this.game.gameActive || !this.isDragging) return;

        const coords = this.getEventCoordinates(e);
        this.updateDirection(coords.x, coords.y);
    }

    handleEnd() {
        this.isDragging = false;
    }

    getEventCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: (clientX - rect.left) * (this.canvas.width / rect.width),
            y: (clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    updateDirection(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const fromCenterX = x - centerX;
        const fromCenterY = y - centerY;
        
        let newDirection;
        if (Math.abs(fromCenterX) > Math.abs(fromCenterY)) {
            newDirection = fromCenterX > 0 ? 'right' : 'left';
        } else {
            newDirection = fromCenterY > 0 ? 'down' : 'up';
        }

        if (newDirection !== this.game.player.direction) {
            console.log('Direction changed to:', newDirection);
            this.game.player.direction = newDirection;
        }

        this._lastTouch = { x, y, direction: newDirection };
    }

    removeEventListeners() {
        this.canvas.removeEventListener('touchstart', this.handleMove);
        this.canvas.removeEventListener('touchmove', this.handleMove);
        this.canvas.removeEventListener('touchend', this.handleEnd);
        this.canvas.removeEventListener('touchcancel', this.handleEnd);
        this.canvas.removeEventListener('mousedown', this.handleMove);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('mouseup', this.handleEnd);
        this.canvas.removeEventListener('mouseleave', this.handleEnd);
    }

    drawTouchZones() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.2;  // Make zones more visible
        
        // Draw the four triangles
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
        const y = this.canvas.height - 10; // Move closer to bottom
        const shadowOffset = 2;

        this.ctx.font = `${this.game.cellSize / 1.5}px Arial`;  // Larger font size

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

    drawEndScreen(win) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(win ? 'You Win!' : 'Game Over', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.game.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Levels Completed: ${this.game.currentLevel + 1}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText('Click to Restart', this.canvas.width / 2, this.canvas.height / 2 + 60);

        this.ctx.restore();

        // Add event listener for restarting the game
        this.canvas.addEventListener('click', () => {
            this.game.resetGame();
            this.game.initialize();
            this.game.toggleGame();  // This will set gameActive to true and start the game
        }, { once: true });
    }
}