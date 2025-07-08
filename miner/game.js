class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.currentLevelIndex = 0;
        this.input = { left: false, right: false, jump: false };
        this.frameCounter = 0;
        this.score = 0;
        this.lives = 3;
        this.oxygen = 1000;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.loadLevel(this.currentLevelIndex);
        this.setupInput();
        this.startGameLoop();
    }

    resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.context.imageSmoothingEnabled = false; // For pixel art
    }

    loadLevel(levelIndex) {
        this.level = new Level(levels[levelIndex]);
        this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
        this.oxygen = 1000; // Reset oxygen on level load
    }

    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.input.left = true;
            if (e.key === 'ArrowRight') this.input.right = true;
            if (e.key === ' ' || e.key === 'ArrowUp') this.input.jump = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.input.left = false;
            if (e.key === 'ArrowRight') this.input.right = false;
            if (e.key === ' ' || e.key === 'ArrowUp') this.input.jump = false;
        });

        // Touch
        let touchStartX = 0;
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;

            // Determine if horizontal or vertical drag
            if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal movement
                const deadZone = 20; // Pixels
                if (deltaX < -deadZone) {
                    this.input.left = true;
                    this.input.right = false;
                } else if (deltaX > deadZone) {
                    this.input.right = true;
                    this.input.left = false;
                } else {
                    this.input.left = false;
                    this.input.right = false;
                }
                this.input.jump = false;
            } else { // Vertical movement (for jump)
                const deadZone = 20; // Pixels
                if (deltaY < -deadZone) {
                    this.input.jump = true;
                } else {
                    this.input.jump = false;
                }
                this.input.left = false;
                this.input.right = false;
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.input.left = false;
            this.input.right = false;
            this.input.jump = false;
        });
    }

    startGameLoop() {
        const MS_PER_UPDATE = 1000 / 60; // 60 updates per second
        let lastTimestamp = 0;
        let accumulatedTime = 0;

        const gameLoop = (currentTimestamp) => {
            requestAnimationFrame(gameLoop);

            accumulatedTime += currentTimestamp - lastTimestamp;
            lastTimestamp = currentTimestamp;

            while (accumulatedTime >= MS_PER_UPDATE) {
                this.frameCounter++;
                this.update();
                accumulatedTime -= MS_PER_UPDATE;
            }

            this.draw();
        }
        requestAnimationFrame(gameLoop);
    }

    update() {
        this.player.update(this.input, this.level);
        this.level.enemies.forEach(e => e.update());

        // Oxygen depletion
        this.oxygen--;
        if (this.oxygen <= 0) {
            this.playerDie();
        }

        // Key collection
        this.level.keys.forEach((key, index) => {
            if (this.player.x < key.x + key.width &&
                this.player.x + this.player.width > key.x &&
                this.player.y < key.y + key.height &&
                this.player.y + this.player.height > key.y) {
                this.level.keys.splice(index, 1);
                this.score += 100;
            }
        });

        // Hazard collision
        this.level.hazards.forEach(hazard => {
            if (this.player.x < hazard.x + hazard.width &&
                this.player.x + this.player.width > hazard.x &&
                this.player.y < hazard.y + hazard.height &&
                this.player.y + this.player.height > hazard.y) {
                this.playerDie();
            }
        });

        // Enemy collision
        this.level.enemies.forEach(enemy => {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                this.playerDie();
            }
        });


        // Check for level completion
        if (this.level.keys.length === 0 && 
            this.player.x < this.level.portal.x + this.level.portal.width &&
            this.player.x + this.player.width > this.level.portal.x &&
            this.player.y < this.level.portal.y + this.level.portal.height &&
            this.player.y + this.player.height > this.level.portal.y) {
            this.currentLevelIndex++;
            if (this.currentLevelIndex < levels.length) {
                this.loadLevel(this.currentLevelIndex);
            } else {
                // Game complete!
                alert("You win!");
            }
        }
    }

    playerDie() {
        this.lives--;
        if (this.lives <= 0) {
            alert("Game Over");
            this.currentLevelIndex = 0;
            this.lives = 3;
            this.score = 0;
        }
        this.loadLevel(this.currentLevelIndex);
        this.oxygen = 1000;
    }

    draw() {
        // Clear canvas
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate scale for the entire game (including UI)
        const totalGameWidth = LEVEL_WIDTH * TILE_SIZE;
        const totalGameHeight = LEVEL_HEIGHT * TILE_SIZE;
        const scale = Math.min(this.canvas.width / totalGameWidth, this.canvas.height / totalGameHeight);

        this.context.save();
        this.context.scale(scale, scale);

        // Draw the blue border around the entire game area
        this.context.fillStyle = '#0000AA'; // Dark blue border
        this.context.fillRect(0, 0, totalGameWidth, totalGameHeight);

        // Draw the inner black background for the game world
        const borderThickness = 8; // Example border thickness in game units
        this.context.fillStyle = 'black';
        this.context.fillRect(borderThickness, borderThickness, totalGameWidth - borderThickness * 2, totalGameHeight - borderThickness * 2);

        // Translate context to draw game elements within the border
        this.context.translate(borderThickness, borderThickness);

        // Draw game world (top portion)
        this.level.draw(this.context, this.frameCounter, this.level.keys.length === 0);
        this.player.draw(this.context);

        // Draw UI Panel (bottom portion)
        const uiPanelY = (LEVEL_HEIGHT - UI_HEIGHT_TILES) * TILE_SIZE - borderThickness; // Adjust for border
        this.context.fillStyle = '#222'; // Dark grey background for UI
        this.context.fillRect(-borderThickness, uiPanelY, totalGameWidth, UI_HEIGHT_TILES * TILE_SIZE + borderThickness); // Extend to cover border

        // Draw Score
        this.context.fillStyle = 'white';
        this.context.font = "24px 'Courier New', Courier, monospace";
        this.context.fillText(`Score: ${this.score}`, 20, uiPanelY + 30);

        // Draw Lives (animated Miner Willy icons)
        for (let i = 0; i < this.lives; i++) {
            const playerIcon = new Player(200 + i * 40, uiPanelY + 15);
            playerIcon.animationFrame = this.player.animationFrame; // Match player animation
            playerIcon.draw(this.context);
        }

        // Draw Oxygen Bar
        this.context.fillStyle = '#555';
        this.context.fillRect(totalGameWidth - 320, uiPanelY + 15, 300, 20);
        this.context.fillStyle = 'cyan';
        this.context.fillRect(totalGameWidth - 320, uiPanelY + 15, (this.oxygen / 1000) * 300, 20);

        this.context.restore();
    }
}

// Start the game
window.onload = () => new Game('gameCanvas');
