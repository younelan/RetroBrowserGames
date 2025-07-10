class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.currentLevelIndex = 0;
        this.input = { left: false, right: false, jump: false };
        this.frameCounter = 0;
        this.score = 0;
        this.lives = START_LIVES;
        // Only set to START_OXYGEN if not defined in the level
        this.oxygen = (levels[0] && typeof levels[0].oxygenLevel === 'number') ? levels[0].oxygenLevel : START_OXYGEN;
        this.gameState = 'START'; // 'START', 'PLAYING', 'GAME_OVER', 'WIN'
        this.lastDebugStep = -1; // For debugging step changes

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

        // Set background color and oxygen based on level configuration
        this.backgroundColor = this.level.backgroundColor || 'black'; // Default to black
        this.oxygen = (typeof this.level.oxygenLevel === 'number') ? this.level.oxygenLevel : START_OXYGEN;
    }

    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.input.left = true;
            if (e.key === 'ArrowRight') this.input.right = true;
            if (e.key === ' ' || e.key === 'ArrowUp') {
                this.input.jump = true;
                if (this.gameState === 'START' || this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
                    this.resetGame();
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.input.left = false;
            if (e.key === 'ArrowRight') this.input.right = false;
            if (e.key === ' ' || e.key === 'ArrowUp') this.input.jump = false;
        });

        // Simplified, reliable touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        let touchActive = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchActive = true;

            if (this.gameState === 'START' || this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
                this.resetGame();
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!touchActive) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            // Calculate delta from touch start point
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Simple, reliable thresholds
            const moveThreshold = 20;
            const jumpThreshold = 30;
            
            // Reset all inputs first
            this.input.left = false;
            this.input.right = false;
            this.input.jump = false;
            
            // Horizontal movement
            if (deltaX < -moveThreshold) {
                this.input.left = true;
            } else if (deltaX > moveThreshold) {
                this.input.right = true;
            }
            
            // Jump (can be combined with horizontal)
            if (deltaY < -jumpThreshold) {
                this.input.jump = true;
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchActive = false;
            this.input.left = false;
            this.input.right = false;
            this.input.jump = false;
        });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            touchActive = false;
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
        this.level.enemies.forEach(e => e.update(this.level));

        // Oxygen depletion
        this.oxygen = Math.max(this.oxygen - 1, 0); // Prevent oxygen from going negative
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
        if (this.player.playerState === 'DYING') {
            return; // Already dying, prevent multiple calls
        }
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
                this.oxygen = (typeof this.level.oxygenLevel === 'number') ? this.level.oxygenLevel : START_OXYGEN;
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
            case 'WIN':
                this.drawWinScreen();
                break;
        }
    }

    drawGameScreen() {
        // Update viewport to follow player
        this.level.updateViewport(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        // Calculate scale for the entire game (including UI) based on viewport size
        const totalGameWidth = this.level.viewportWidth * TILE_SIZE;
        const totalGameHeight = this.level.viewportHeight * TILE_SIZE; // No UI height added here
        const scale = Math.min(this.canvas.width / totalGameWidth, this.canvas.height / totalGameHeight);

        this.context.save();
        this.context.scale(scale, scale);

        // Draw the black background for the game world
        const borderThickness = 8; // Example border thickness in game units
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, totalGameWidth, totalGameHeight);

        // Translate context to draw game elements within the border
        this.context.translate(borderThickness, borderThickness);

        // Apply viewport scrolling for rendering only (after all game logic)
        this.context.save();
        
        // Clip to viewport area (full viewport height)
        this.context.beginPath();
        this.context.rect(0, 0, this.level.viewportWidth * TILE_SIZE, this.level.viewportHeight * TILE_SIZE);
        this.context.clip();
        
        this.context.translate(-this.level.scrollX, -this.level.scrollY);

        // Draw game world - now fills entire viewport area
        this.level.draw(this.context, this.frameCounter, this.level.keys.length === 0);
        this.player.draw(this.context, this.player.width, this.player.height);

        // Restore viewport scrolling
        this.context.restore();

        // Restore the main context
        this.context.restore();

        // Draw UI elements OUTSIDE of any transformations - fixed at bottom of canvas
        // Adjust UI scaling based on spare life dimensions
        const uiScale = Math.min(this.canvas.width / 800, this.canvas.height / 600);
        const uiBottomPadding = 20 * uiScale; // Padding for UI elements at the bottom

        // Draw Level Name at the top if specified
        if (this.level.name) {
            const levelNameFontSize = Math.max(20, this.canvas.width / 40);
            this.context.fillStyle = 'white';
            this.context.font = `bold ${levelNameFontSize}px 'Courier New', Courier, monospace`;
            this.context.textAlign = 'center';
            this.context.fillText(this.level.name, this.canvas.width / 2, levelNameFontSize + 10);
            this.context.textAlign = 'left'; // Reset text alignment
        }

        // Draw Lives (spare miners)
        const spareLifeWidth = 20 * uiScale; // Width of spare life icons
        const spareLifeHeight = 20 * uiScale; // Height of spare life icons
        const spareLifeY = this.canvas.height - uiBottomPadding - 40 * uiScale; // Y position for spare life icons
        for (let i = 0; i < this.lives; i++) {
            const spareLifeX = 10 + i * (spareLifeWidth + 5 * uiScale);
            const spareIcon = new Player(spareLifeX, spareLifeY);

            // Animation logic
            const walkAnimSpeed = 0.048;
            const walkTime = this.frameCounter * walkAnimSpeed;
            const totalSteps = Math.floor(walkTime / Math.PI);
            const stepsPerDirection = 10;
            const totalCycle = stepsPerDirection * 2;
            const cycleStep = totalSteps % totalCycle;
            const stepProgress = (walkTime / Math.PI) % 1;

            let currentStep, facingRight, baseStepX, nextStepX, danceX;

            if (cycleStep < stepsPerDirection) {
                currentStep = cycleStep;
                facingRight = true;
                baseStepX = currentStep * 2;
                nextStepX = Math.min((currentStep + 1) * 2, 18);
                danceX = baseStepX + (nextStepX - baseStepX) * stepProgress;
            } else {
                currentStep = cycleStep - stepsPerDirection;
                facingRight = false;
                baseStepX = (9 - currentStep) * 2;
                nextStepX = Math.max((9 - (currentStep + 1)) * 2, 0);
                danceX = baseStepX + (nextStepX - baseStepX) * stepProgress;
            }

            spareIcon.x = spareLifeX + danceX;
            spareIcon.direction = facingRight ? 1 : -1;
            spareIcon.velocityX = facingRight ? 1 : -1;
            spareIcon.customAnimationTime = this.frameCounter * 0.048;

            spareIcon.draw(this.context, spareLifeWidth, spareLifeHeight);
        }

        // Draw Oxygen Bar
        const oxygenBarWidth = 200 * uiScale;
        const oxygenBarHeight = 25 * uiScale; // Match text height
        const oxygenBarX = this.canvas.width - oxygenBarWidth - 20 * uiScale;
        const commonTopY = this.canvas.height - uiBottomPadding - 25 * uiScale; // Common top for all elements
        const oxygenBarY = commonTopY; // Align oxygen bar with common top

        const levelStartOxygen = (typeof this.level.oxygenLevel === 'number') ? this.level.oxygenLevel : START_OXYGEN;
        const oxygenPercentage = this.oxygen / levelStartOxygen;

        // Change color based on oxygen level
        if (oxygenPercentage <= 0.25) {
            this.context.fillStyle = 'red';
        } else if (oxygenPercentage <= 0.5) {
            this.context.fillStyle = 'orange';
        } else {
            this.context.fillStyle = 'cyan';
        }

        this.context.fillRect(oxygenBarX, oxygenBarY - oxygenBarHeight + 2, oxygenPercentage * oxygenBarWidth, oxygenBarHeight);

        // Draw Score
        const scoreX = this.canvas.width - 300 * uiScale; // Position score appropriately
        const scoreY = commonTopY; // Align score with common top
        this.context.fillText(`💎 ${this.score}`, scoreX, scoreY);

        // Draw Level Indicator with emoji
        const levelX = oxygenBarX - 150 * uiScale; // Position level where score was
        const levelY = commonTopY; // Align level with common top
        this.context.fillText(`🌍 ${this.currentLevelIndex + 1}`, levelX, levelY);
    }

    drawStartScreen() {
        // Responsive font sizes based on canvas size
        const baseFontSize = Math.min(this.canvas.width, this.canvas.height) / 15;
        const titleFontSize = Math.max(24, baseFontSize);
        const subtitleFontSize = Math.max(16, baseFontSize * 0.5);
        
        this.context.fillStyle = 'white';
        this.context.font = `bold ${titleFontSize}px 'Courier New', Courier, monospace`;
        this.context.textAlign = 'center';
        this.context.fillText('MANIC MINER', this.canvas.width / 2, this.canvas.height / 2 - titleFontSize);
        this.context.font = `${subtitleFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText('Press SPACE or Tap to Start', this.canvas.width / 2, this.canvas.height / 2 + subtitleFontSize);
        this.context.textAlign = 'left'; // Reset for game screen
    }

    drawEndScreen() {
        // Responsive font sizes
        const baseFontSize = Math.min(this.canvas.width, this.canvas.height) / 15;
        const titleFontSize = Math.max(24, baseFontSize);
        const textFontSize = Math.max(16, baseFontSize * 0.5);
        
        // Dark overlay background
        this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Red glow effect for dramatic impact
        this.context.shadowColor = '#FF4444';
        this.context.shadowBlur = 20;
        this.context.fillStyle = '#FF6666';
        this.context.font = `bold ${titleFontSize}px 'Courier New', Courier, monospace`;
        this.context.textAlign = 'center';
        this.context.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - titleFontSize);
        
        // Reset shadow
        this.context.shadowBlur = 0;
        
        // Score with emphasis
        this.context.fillStyle = '#FFFF88';
        this.context.font = `bold ${textFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + textFontSize/2);
        
        // Restart instruction
        this.context.fillStyle = '#CCCCCC';
        this.context.font = `${textFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText('Press SPACE or Tap to Restart', this.canvas.width / 2, this.canvas.height / 2 + textFontSize * 2);
        
        this.context.textAlign = 'left'; // Reset for game screen
    }

    drawWinScreen() {
        // Responsive font sizes
        const baseFontSize = Math.min(this.canvas.width, this.canvas.height) / 18;
        const titleFontSize = Math.max(20, baseFontSize * 1.2);
        const subtitleFontSize = Math.max(18, baseFontSize);
        const textFontSize = Math.max(14, baseFontSize * 0.7);
        const instructionFontSize = Math.max(12, baseFontSize * 0.6);
        
        // Animated celebration background
        const time = Date.now() * 0.003;
        
        // Gradient background with animated colors
        const gradient = this.context.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        const color1 = `hsl(${(time * 30) % 360}, 70%, 20%)`;
        const color2 = `hsl(${(time * 30 + 180) % 360}, 70%, 40%)`;
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animated stars/sparkles - fewer on mobile
        const numStars = Math.min(50, Math.floor(this.canvas.width * this.canvas.height / 10000));
        for (let i = 0; i < numStars; i++) {
            const starX = (Math.sin(time + i * 0.5) * 0.3 + 0.5) * this.canvas.width;
            const starY = (Math.cos(time * 0.7 + i * 0.8) * 0.3 + 0.5) * this.canvas.height;
            const starSize = Math.sin(time * 2 + i) * 2 + 3;
            const starAlpha = Math.sin(time * 3 + i * 1.2) * 0.5 + 0.5;
            
            this.context.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
            this.context.fillRect(starX - starSize/2, starY - starSize/2, starSize, starSize);
            
            // Cross sparkle effect
            this.context.fillRect(starX - starSize*1.5, starY - 1, starSize*3, 2);
            this.context.fillRect(starX - 1, starY - starSize*1.5, 2, starSize*3);
        }
        
        // Floating confetti - fewer on mobile
        const numConfetti = Math.min(30, Math.floor(this.canvas.width * this.canvas.height / 15000));
        for (let i = 0; i < numConfetti; i++) {
            const confettiX = ((time * 20 + i * 50) % (this.canvas.width + 100)) - 50;
            const confettiY = (Math.sin(time + i) * 50) + (i * 15) % this.canvas.height;
            const confettiSize = 4 + Math.sin(time * 2 + i) * 2;
            const confettiHue = (i * 30) % 360;
            
            this.context.fillStyle = `hsl(${confettiHue}, 80%, 60%)`;
            this.context.save();
            this.context.translate(confettiX, confettiY);
            this.context.rotate(time * 2 + i);
            this.context.fillRect(-confettiSize/2, -confettiSize/2, confettiSize, confettiSize);
            this.context.restore();
        }
        
        // Main victory text with glow effect
        this.context.textAlign = 'center';
        
        // Text glow
        this.context.shadowColor = '#FFD700';
        this.context.shadowBlur = 20;
        this.context.fillStyle = '#FFD700';
        this.context.font = `bold ${titleFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText('🎉 VICTORY! 🎉', this.canvas.width / 2, this.canvas.height / 2 - titleFontSize * 2);
        
        // Reset shadow
        this.context.shadowBlur = 0;
        
        // Success message with bounce effect
        const bounceOffset = Math.sin(time * 4) * 5;
        this.context.fillStyle = '#00FF88';
        this.context.font = `bold ${subtitleFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText('CONGRATULATIONS!', this.canvas.width / 2, this.canvas.height / 2 - subtitleFontSize/2 + bounceOffset);
        
        // Achievement text
        this.context.fillStyle = '#FFFFFF';
        this.context.font = `${textFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText('You completed all levels!', this.canvas.width / 2, this.canvas.height / 2 + textFontSize/2);
        
        // Final score with emphasis
        this.context.fillStyle = '#FFFF00';
        this.context.font = `bold ${textFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + textFontSize * 2);
        
        // Player sprite celebration - scaled for mobile
        const playerScale = (2 + Math.sin(time * 3) * 0.5) * Math.min(this.canvas.width, this.canvas.height) / 800;
        this.context.save();
        this.context.translate(this.canvas.width / 2, this.canvas.height / 2 + textFontSize * 4);
        this.context.scale(playerScale, playerScale);
        
        // Draw a simple celebrating miner
        this.context.fillStyle = '#FFD700'; // Helmet
        this.context.fillRect(-8, -16, 16, 8);
        this.context.fillStyle = '#FFCC99'; // Face
        this.context.fillRect(-6, -8, 12, 8);
        this.context.fillStyle = '#0066FF'; // Body
        this.context.fillRect(-6, 0, 12, 16);
        this.context.fillStyle = '#654321'; // Legs
        this.context.fillRect(-6, 16, 5, 12);
        this.context.fillRect(1, 16, 5, 12);
        
        // Celebrating arms
        const armAngle = Math.sin(time * 6) * 0.5 + 0.5;
        this.context.fillStyle = '#0066FF';
        // Left arm up
        this.context.fillRect(-12, -4 - armAngle * 8, 6, 8);
        // Right arm up  
        this.context.fillRect(6, -4 - armAngle * 8, 6, 8);
        
        this.context.restore();
        
        // Restart instruction
        this.context.fillStyle = '#CCCCCC';
        this.context.font = `${instructionFontSize}px 'Courier New', Courier, monospace`;
        this.context.fillText('Press SPACE or Tap to Play Again', this.canvas.width / 2, this.canvas.height - instructionFontSize * 2);
        
        this.context.textAlign = 'left'; // Reset for game screen
    }

    winGame() {
        this.gameState = 'WIN';
        this.gameMusic.pause();
        // Play victory sound if available
        if (this.soundEnabled && this.levelCompleteSound) {
            this.levelCompleteSound.play();
        }
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
