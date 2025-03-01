class EndScreens {
    constructor() {
        this.gameOverTime = null;
        this.winTime = null;
        this.restartButton = null;
        this.score = 0;
    }

    // Updates score from game state
    updateScore(score) {
        this.score = score;
    }

    // Called when game over occurs
    setGameOverTime(time) {
        this.gameOverTime = time;
    }

    // Called when victory occurs
    setWinTime(time) {
        this.winTime = time;
    }
    
    // Get button area for click detection
    getRestartButton() {
        return this.restartButton;
    }

    // Reset button state when not showing screens
    reset() {
        this.restartButton = null;
        this.gameOverTime = null;
        this.winTime = null;
    }

    renderGameOverScreen(ctx, canvasWidth, canvasHeight) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const time = performance.now() / 1000;
        
        // Darken the background with animation
        const alpha = Math.min(0.8, (time - this.gameOverTime) * 0.5);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Create pulsing red glow in the background
        const glowRadius = canvasHeight * 0.8;
        const glowIntensity = 0.3 + Math.sin(time * 2) * 0.1;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
        );
        gradient.addColorStop(0, `rgba(255, 0, 0, ${glowIntensity})`);
        gradient.addColorStop(0.8, 'rgba(100, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Calculate animation progress (0 to 1)
        const animProgress = Math.min(1, (time - this.gameOverTime) * 0.5);
        
        // Draw game over text with animation
        ctx.save();
        
        // Text shadow for depth
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 15 * animProgress;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Main text
        const gameOverSize = 64 * animProgress;
        ctx.font = `bold ${gameOverSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        
        // Add slight movement to text
        const shakeX = Math.sin(time * 5) * 3 * animProgress;
        const shakeY = Math.cos(time * 4) * 2 * animProgress;
        
        ctx.fillText('GAME OVER', centerX + shakeX, centerY - 50 + shakeY);
        
        // Score display
        if (animProgress > 0.4) {
            const scoreAlpha = (animProgress - 0.4) / 0.6;
            ctx.globalAlpha = scoreAlpha;
            ctx.font = 'bold 32px Arial';
            ctx.fillText(`Final Score: ${this.score}`, centerX, centerY + 20);
        }
        
        // Draw restart button with pulsing effect
        if (animProgress > 0.7) {
            const buttonAlpha = (animProgress - 0.7) / 0.3;
            ctx.globalAlpha = buttonAlpha;
            
            // Button pulse effect
            const buttonPulse = 1 + Math.sin(time * 3) * 0.05;
            
            // Button background
            const isMobile = window.innerWidth < 768;
            const buttonWidth = isMobile ? 230 * buttonPulse : 200 * buttonPulse;
            const buttonHeight = isMobile ? 70 * buttonPulse : 60 * buttonPulse;
            const buttonX = centerX - buttonWidth/2;
            const buttonY = centerY + 80;
            const cornerRadius = 10;
            
            // Draw button with rounded corners and gradient
            const buttonGradient = ctx.createLinearGradient(
                buttonX, buttonY,
                buttonX, buttonY + buttonHeight
            );
            buttonGradient.addColorStop(0, '#AA0000');
            buttonGradient.addColorStop(0.5, '#FF0000');
            buttonGradient.addColorStop(1, '#AA0000');
            
            ctx.fillStyle = buttonGradient;
            ctx.beginPath();
            ctx.moveTo(buttonX + cornerRadius, buttonY);
            ctx.lineTo(buttonX + buttonWidth - cornerRadius, buttonY);
            ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + cornerRadius);
            ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - cornerRadius);
            ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - cornerRadius, buttonY + buttonHeight);
            ctx.lineTo(buttonX + cornerRadius, buttonY + buttonHeight);
            ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - cornerRadius);
            ctx.lineTo(buttonX, buttonY + cornerRadius);
            ctx.quadraticCurveTo(buttonX, buttonY, buttonX + cornerRadius, buttonY);
            ctx.closePath();
            ctx.fill();
            
            // Button border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Button text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 5;
            ctx.fillText('RESTART', centerX, buttonY + buttonHeight/2);
            
            // Store button area for click detection
            this.restartButton = {
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                active: true // Add active flag to indicate button is ready
            };
        }
        
        ctx.restore();
    }

    renderWinScreen(ctx, canvasWidth, canvasHeight) {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const time = performance.now() / 1000;
        
        // Initialize win time if not set
        if (!this.winTime) {
            this.winTime = time;
            return; // Early return to wait for next frame
        }
        
        // Calculate animation progress
        const animProgress = Math.min(1, (time - this.winTime) * 0.5);
        
        // Create radial gradient background with golden glow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Golden rays of light radiating from center
        this.renderGoldenRays(ctx, centerX, centerY, time);
        
        // Add central golden glow
        this.renderGoldenGlow(ctx, centerX, centerY, time, canvasHeight);
        
        // Draw victory text with animation
        ctx.save();
        
        // Text shadow for depth
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 20 * animProgress;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Main text
        const victorySize = 64 * animProgress;
        ctx.font = `bold ${victorySize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Creating metallic gold text effect
        const textGradient = ctx.createLinearGradient(
            centerX, centerY - 80,
            centerX, centerY - 20
        );
        textGradient.addColorStop(0, '#FFD700');
        textGradient.addColorStop(0.5, '#FFFFFF');
        textGradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = textGradient;
        ctx.fillText('VICTORY!', centerX, centerY - 50);
        
        // Score display with sparkle effect
        if (animProgress > 0.3) {
            const scoreAlpha = (animProgress - 0.3) / 0.7;
            ctx.globalAlpha = scoreAlpha;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            ctx.shadowBlur = 10;
            
            ctx.font = 'bold 32px Arial';
            ctx.fillText(`Final Score: ${this.score}`, centerX, centerY + 10);
            
            // Draw sparkling gold stars around score
            if (animProgress > 0.5) {
                this.drawVictorySparkles(ctx, centerX, centerY + 10, time);
            }
        }
        
        // Draw restart button with golden glow
        if (animProgress > 0.6) {
            this.renderPlayAgainButton(ctx, centerX, centerY, animProgress, time);
        }
        
        ctx.restore();
    }

    renderGoldenRays(ctx, centerX, centerY, time) {
        const rayCount = 12;
        const rayLength = ctx.canvas.height * 0.8;
        const rayWidth = 20;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.2); // Slowly rotate rays
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle - rayWidth / rayLength) * rayLength,
                Math.sin(angle - rayWidth / rayLength) * rayLength
            );
            ctx.lineTo(
                Math.cos(angle + rayWidth / rayLength) * rayLength,
                Math.sin(angle + rayWidth / rayLength) * rayLength
            );
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    renderGoldenGlow(ctx, centerX, centerY, time, canvasHeight) {
        const glowRadius = canvasHeight * 0.6;
        const glowIntensity = 0.4 + Math.sin(time * 1.5) * 0.1;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity})`);
        gradient.addColorStop(0.7, 'rgba(255, 165, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    renderPlayAgainButton(ctx, centerX, centerY, animProgress, time) {
        const buttonAlpha = (animProgress - 0.6) / 0.4;
        ctx.globalAlpha = buttonAlpha;
        
        // Button pulse effect
        const buttonPulse = 1 + Math.sin(time * 2) * 0.05;
        
        // Button background
        const isMobile = window.innerWidth < 768;
        const buttonWidth = isMobile ? 230 * buttonPulse : 200 * buttonPulse;
        const buttonHeight = isMobile ? 70 * buttonPulse : 60 * buttonPulse;
        const buttonX = centerX - buttonWidth/2;
        const buttonY = centerY + 80;
        const cornerRadius = 10;
        
        // Draw button with rounded corners and gradient
        const buttonGradient = ctx.createLinearGradient(
            buttonX, buttonY,
            buttonX, buttonY + buttonHeight
        );
        buttonGradient.addColorStop(0, '#B8860B');
        buttonGradient.addColorStop(0.5, '#FFD700');
        buttonGradient.addColorStop(1, '#B8860B');
        
        ctx.fillStyle = buttonGradient;
        ctx.beginPath();
        ctx.moveTo(buttonX + cornerRadius, buttonY);
        ctx.lineTo(buttonX + buttonWidth - cornerRadius, buttonY);
        ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + cornerRadius);
        ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - cornerRadius);
        ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - cornerRadius, buttonY + buttonHeight);
        ctx.lineTo(buttonX + cornerRadius, buttonY + buttonHeight);
        ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - cornerRadius);
        ctx.lineTo(buttonX, buttonY + cornerRadius);
        ctx.quadraticCurveTo(buttonX, buttonY, buttonX + cornerRadius, buttonY);
        ctx.closePath();
        ctx.fill();
        
        // Button border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Button text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 5;
        ctx.fillText('PLAY AGAIN', centerX, buttonY + buttonHeight/2);
        
        // Store button area for click detection
        this.restartButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            active: true
        };
    }

    drawVictorySparkles(ctx, centerX, centerY, time) {
        // Draw sparkles around the score
        const sparkleCount = 10;
        const radius = 70;
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = time * 2 + (i / sparkleCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const size = 3 + Math.sin(time * 5 + i * 2) * 2;
            
            // Draw star
            this.drawStar(ctx, x, y, 4, size, size/2);
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
        gradient.addColorStop(0, '#FFF9C4');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Check if a point is inside the restart button
    isPointInButton(x, y) {
        if (!this.restartButton || !this.restartButton.active) return false;
        
        return (
            x >= this.restartButton.x && 
            x <= this.restartButton.x + this.restartButton.width &&
            y >= this.restartButton.y && 
            y <= this.restartButton.y + this.restartButton.height
        );
    }
}

window.EndScreens = EndScreens;
