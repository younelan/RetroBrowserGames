class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.currentLevelIndex = 0;
        this.input = { left: false, right: false, jump: false };
        this.frameCounter = 0;
        this.score = 0;
        this.lives = START_LIVES;
        this.oxygen = START_OXYGEN;
        this.oxygen = START_OXYGEN;
        this.gameState = 'START'; // 'START', 'PLAYING', 'GAME_OVER'

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.loadLevel(this.currentLevelIndex);
        this.setupInput();
        this.startGameLoop();

        // Audio elements
        this.titleMusic = document.getElementById('titleMusic');
        this.gameMusic = document.getElementById('gameMusic');
        this.jumpSound = document.getElementById('jumpSound');
        this.keySound = document.getElementById('keySound');
        this.deathSound = document.getElementById('deathSound');
        this.levelCompleteSound = document.getElementById('levelCompleteSound');

        // Sound toggle
        this.soundToggle = document.getElementById('soundToggle');
        this.soundEnabled = this.soundToggle.checked; // Initialize with checkbox state
        this.soundToggle.addEventListener('change', () => {
            this.soundEnabled = this.soundToggle.checked;
            if (!this.soundEnabled) {
                // Pause all sounds if disabled
                this.titleMusic.pause();
                this.gameMusic.pause();
                this.jumpSound.pause();
                this.keySound.pause();
                this.deathSound.pause();
                this.levelCompleteSound.pause();
            } else if (this.gameState === 'START') {
                this.titleMusic.play().catch(e => console.log("Title music autoplay blocked:", e));
            } else if (this.gameState === 'PLAYING') {
                this.gameMusic.play().catch(e => console.log("Game music autoplay blocked:", e));
            }
        });

        // Play title music on start (only if sound is enabled)
        if (this.soundEnabled) {
            this.titleMusic.play().catch(e => console.log("Title music autoplay blocked:", e));
        }
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
        this.oxygen = START_OXYGEN; // Reset oxygen on level load
    }

    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.input.left = true;
            if (e.key === 'ArrowRight') this.input.right = true;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                this.input.jump = true;
                if (this.gameState === 'START' || this.gameState === 'GAME_OVER') {
                    this.resetGame();
                }
            }
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

            if (this.gameState === 'START' || this.gameState === 'GAME_OVER') {
                this.resetGame();
            }
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
                if (this.gameState === 'PLAYING') {
                    this.frameCounter++;
                    this.update();
                }
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
                if (this.soundEnabled) {
                    this.keySound.currentTime = 0;
                    this.keySound.play();
                }

                // Check for extra life
                if (this.score >= this.nextExtraLifeScore) {
                    this.lives++;
                    this.nextExtraLifeScore += 10000; // Next extra life at 20000, 30000, etc.
                }
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

        // Falling too far
        if (this.player.fallDistance > MAX_FALL_DISTANCE) {
            this.playerDie();
        }


        // Check for level completion
        if (this.level.keys.length === 0 && 
            this.player.x < this.level.portal.x + this.level.portal.width &&
            this.player.x + this.player.width > this.level.portal.x &&
            this.player.y < this.level.portal.y + this.level.portal.height &&
            this.player.y + this.player.height > this.level.portal.y) {
            this.currentLevelIndex++;
            if (this.currentLevelIndex < levels.length) {
                // Level completion bonus
                this.score += Math.floor(this.oxygen / 10); // Example: 1 point per 10 oxygen
                this.loadLevel(this.currentLevelIndex);
                if (this.soundEnabled) {
                    this.levelCompleteSound.play();
                }
            } else {
                this.winGame();
            }
        }
    }

    playerDie() {
        this.player.playerState = 'DYING';
        this.gameMusic.pause();
        this.deathSound.currentTime = 0;
        if (this.soundEnabled) {
            this.deathSound.play();
        }
        setTimeout(() => {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'GAME_OVER';
                this.gameMusic.pause();
                this.gameMusic.currentTime = 0;
            } else {
                this.loadLevel(this.currentLevelIndex);
                this.oxygen = START_OXYGEN;
                if (this.soundEnabled) {
                    this.gameMusic.play().catch(e => console.log("Game music autoplay blocked:", e));
                }
            }
        }, 1000); // 1 second delay for death animation
    }

    draw() {
        // Clear canvas
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.gameState) {
            case 'START':
                this.drawStartScreen();
                break;
            case 'PLAYING':
                this.drawGameScreen();
                break;
            case 'GAME_OVER':
                this.drawEndScreen();
                break;
        }
    }

    drawGameScreen() {
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

    drawStartScreen() {
        this.context.fillStyle = 'white';
        this.context.font = "48px 'Courier New', Courier, monospace";
        this.context.textAlign = 'center';
        this.context.fillText('MANIC MINER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.context.font = "24px 'Courier New', Courier, monospace";
        this.context.fillText('Press SPACE or Tap to Start', this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.context.textAlign = 'left'; // Reset for game screen
    }

    drawEndScreen() {
        this.context.fillStyle = 'white';
        this.context.font = "48px 'Courier New', Courier, monospace";
        this.context.textAlign = 'center';
        this.context.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.context.font = "24px 'Courier New', Courier, monospace";
        this.context.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.context.fillText('Press SPACE or Tap to Restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.context.textAlign = 'left'; // Reset for game screen
    }

    winGame() {
        this.gameState = 'GAME_OVER';
        // Optionally, you can set a flag or display a different message for winning
        // For now, it reuses the GAME_OVER screen.
    }

    resetGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.lives = START_LIVES;
        this.currentLevelIndex = 0;
        this.loadLevel(this.currentLevelIndex);
        this.titleMusic.pause();
        this.titleMusic.currentTime = 0;
        if (this.soundEnabled) {
            this.gameMusic.play().catch(e => console.log("Game music autoplay blocked:", e));
        }
    }
}

// Start the game
window.onload = () => {
    window.game = new Game('gameCanvas');
};
