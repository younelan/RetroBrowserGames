class Player {
    constructor(x, y) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.width = 2 * GAME_CONSTANTS.TILE_SIZE;     // 2 tiles wide
        this.height = 2 * GAME_CONSTANTS.TILE_SIZE;    // 2 tiles high
        this.velocityX = 0;
        this.velocityY = 0;
        this.facingLeft = false;
        this.rotorAngle = 0;
        this.isFlying = false;
        this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
    }

    handlePlayerDeath() {
        // Method for the collision manager to call
    }

    update(deltaTime) {
        // Will be handled by game.updatePlayerMovement
    }
    
    render(ctx, camera, controls, fuel) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        const time = performance.now() / 1000;
        
        this.fuel = fuel; // Store current fuel value for flame rendering
        
        // Draw enhanced 3D player
        this.renderRotor(ctx, screenX, screenY);
        this.renderJetpack(ctx, screenX, screenY);
        this.renderBody(ctx, screenX, screenY);
        this.renderHead(ctx, screenX, screenY, time);
        
        // Draw jetpack flames if flying
        if (controls.isPressed('ArrowUp') && this.fuel > 0) {
            this.renderFlames(ctx, screenX, screenY, time);
        }
    }

    renderInDarkness(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        const time = performance.now() / 1000;
        
        ctx.save();
        
        // Special effects for darkness - use a glowing outline
        ctx.globalAlpha = 0.7;
        ctx.globalCompositeOperation = 'screen'; // Makes the player glow in the dark
        
        // Render a simplified glowing player silhouette
        this.renderGlowingSilhouette(ctx, screenX, screenY);
        
        // Add helmet light effect
        this.renderHelmetLight(ctx, screenX, screenY, time);
        
        ctx.restore();
    }

    renderGlowingSilhouette(ctx, x, y) {
        // Body silhouette with glow
        const gradient = ctx.createLinearGradient(
            x, y,
            x + this.width, y + this.height
        );
        gradient.addColorStop(0, 'rgba(150, 200, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0.4)');
        
        ctx.fillStyle = gradient;
        
        // Draw a simplified player shape
        ctx.beginPath();
        // Head
        ctx.arc(
            x + this.width * 0.5,
            y + this.height * 0.1,
            this.width * 0.25,
            0, Math.PI * 2
        );
        
        // Body
        ctx.moveTo(x + this.width * 0.33, y + this.height * 0.5);
        ctx.lineTo(x + this.width * 0.25, y + this.height * 0.1);
        ctx.lineTo(x + this.width * 0.75, y + this.height * 0.1);
        ctx.lineTo(x + this.width * 0.67, y + this.height * 0.5);
        
        // Legs
        ctx.fillRect(
            x + this.width * 0.3,
            y + this.height * 0.5,
            this.width * 0.15,
            this.height * 0.5
        );
        
        ctx.fillRect(
            x + this.width * 0.55,
            y + this.height * 0.5,
            this.width * 0.15,
            this.height * 0.5
        );
        
        ctx.fill();
        
        // Goggles glow
        ctx.fillStyle = 'rgba(150, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.4,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.ellipse(
            x + this.width * 0.6,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }

    renderHelmetLight(ctx, x, y, time) {
        // Create a flashlight effect from the goggles
        const direction = this.facingLeft ? -1 : 1;
        const lightX = x + this.width * (this.facingLeft ? 0.4 : 0.6);
        const lightY = y + this.height * 0.1;
        
        // Light cone
        const gradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            lightX + direction * this.width, lightY, this.width * 2
        );
        gradient.addColorStop(0, 'rgba(200, 255, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
        
        ctx.fillStyle = gradient;
        
        // Draw light cone in direction player is facing
        ctx.beginPath();
        ctx.moveTo(lightX, lightY);
        ctx.lineTo(
            lightX + direction * this.width * 2,
            lightY - this.width * 0.7
        );
        ctx.lineTo(
            lightX + direction * this.width * 2,
            lightY + this.width * 0.7
        );
        ctx.closePath();
        ctx.fill();
        
        // Add pulsing effect for helmet light
        const pulseSize = 5 + Math.sin(time * 3) * 2;
        ctx.fillStyle = 'rgba(200, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(lightX, lightY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderRotor(ctx, x, y) {
        const centerX = x + this.width * 0.5;
        const centerY = y - this.height * 0.1;
        const rotorWidth = this.width * 0.7;
        
        // Create metallic rotor with 3D effect
        const rotorHeight = rotorWidth * 0.1;
        const stemWidth = rotorWidth * 0.1;
        const stemHeight = rotorWidth * 0.15;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotorAngle || 0);
        
        // Draw metal stem with gradient
        const stemGradient = ctx.createLinearGradient(-stemWidth/2, -stemHeight, stemWidth/2, 0);
        stemGradient.addColorStop(0, '#707070');  // Darker gray
        stemGradient.addColorStop(0.5, '#A0A0A0'); // Light gray highlight
        stemGradient.addColorStop(1, '#505050');  // Dark gray shadow
        
        ctx.fillStyle = stemGradient;
        ctx.fillRect(-stemWidth/2, -stemHeight, stemWidth, stemHeight);
        
        // Draw 3D rotor blades with gradient
        const bladeGradient = ctx.createLinearGradient(-rotorWidth/2, 0, rotorWidth/2, 0);
        bladeGradient.addColorStop(0, '#404040'); // Dark edge
        bladeGradient.addColorStop(0.5, '#606060'); // Light middle
        bladeGradient.addColorStop(1, '#303030');  // Dark edge
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-rotorWidth/2, -rotorHeight/2);
        ctx.lineTo(rotorWidth/2, -rotorHeight/2);
        ctx.lineTo(rotorWidth/2, rotorHeight/2);
        ctx.lineTo(-rotorWidth/2, rotorHeight/2);
        ctx.closePath();
        ctx.fill();
        
        // Add metal shine on top edge
        ctx.strokeStyle = '#909090';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-rotorWidth/2, -rotorHeight/2);
        ctx.lineTo(rotorWidth/2, -rotorHeight/2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderJetpack(ctx, x, y) {
        // Draw cylindrical rocket jetpacks with metallic effect
        
        // Left jetpack - cylindrical with 3D effect
        this.renderRocketTank(ctx, 
            x + this.width * 0.15, 
            y + this.height * 0.1,
            this.width * 0.20, 
            this.height * 0.4,
            true  // Left side
        );
        
        // Right jetpack - cylindrical with 3D effect
        this.renderRocketTank(ctx, 
            x + this.width * 0.65, 
            y + this.height * 0.1,
            this.width * 0.20, 
            this.height * 0.4,
            false // Right side
        );
    }

    renderRocketTank(ctx, x, y, width, height, isLeftSide) {
        // Create cylindrical 3D effect for rocket tanks
        ctx.save();
        
        // Base color gradient for the cylinder (vertical gradient)
        const mainGradient = ctx.createLinearGradient(
            x, y,
            x, y + height
        );
        mainGradient.addColorStop(0, '#FFD700'); // Gold highlight at top
        mainGradient.addColorStop(0.3, '#FFA000'); // Orange middle
        mainGradient.addColorStop(0.7, '#FF8000'); // Darker orange
        mainGradient.addColorStop(1, '#CC4400'); // Dark shadow at bottom
        
        // Draw main cylinder body
        ctx.fillStyle = mainGradient;
        
        // Left side has light on left, right side has light on right (for 3D effect)
        const highlightX = isLeftSide ? x : x + width * 0.7;
        const baseX = isLeftSide ? x + width * 0.7 : x;
        const controlX = isLeftSide ? x + width * 0.3 : x + width * 0.7;
        
        // Draw a rounded rectangle for cylinder
        ctx.beginPath();
        
        // Top rounded cap
        ctx.arc(
            x + width / 2,
            y + width / 2,
            width / 2,
            Math.PI, 0, false
        );
        
        // Right side
        ctx.lineTo(x + width, y + height - width / 2);
        
        // Bottom rounded cap
        ctx.arc(
            x + width / 2,
            y + height - width / 2,
            width / 2,
            0, Math.PI, false
        );
        
        // Left side
        ctx.lineTo(x, y + width / 2);
        
        ctx.closePath();
        ctx.fill();
        
        // Add side highlight for 3D cylindrical effect
        const sideHighlightGradient = ctx.createLinearGradient(
            baseX, y,
            highlightX, y
        );
        sideHighlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        sideHighlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        sideHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = sideHighlightGradient;
        ctx.beginPath();
        
        // Draw highlight that follows same shape but with transparency
        // Top rounded cap
        ctx.arc(
            x + width / 2,
            y + width / 2,
            width / 2,
            Math.PI, 0, false
        );
        
        // Right side
        ctx.lineTo(x + width, y + height - width / 2);
        
        // Bottom rounded cap
        ctx.arc(
            x + width / 2,
            y + height - width / 2,
            width / 2,
            0, Math.PI, false
        );
        
        // Left side
        ctx.lineTo(x, y + width / 2);
        
        ctx.closePath();
        ctx.fill();
        
        // Add rocket engine nozzle at bottom
        this.renderRocketNozzle(ctx, x, y, width, height);
        
        // Add technical details - tubing and connectors
        this.renderTechnicalDetails(ctx, x, y, width, height, isLeftSide);
        
        ctx.restore();
    }

    renderRocketNozzle(ctx, x, y, width, height) {
        // Draw nozzle at the bottom of the tank
        const nozzleWidth = width * 0.6;
        const nozzleHeight = width * 0.3;
        
        // Nozzle base (darker color)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(x + (width - nozzleWidth) / 2, y + height - width / 4);
        ctx.lineTo(x + (width + nozzleWidth) / 2, y + height - width / 4);
        ctx.lineTo(x + (width + nozzleWidth) / 2 + nozzleWidth * 0.1, y + height);
        ctx.lineTo(x + (width - nozzleWidth) / 2 - nozzleWidth * 0.1, y + height);
        ctx.closePath();
        ctx.fill();
        
        // Nozzle interior (gradient for depth)
        const nozzleGradient = ctx.createLinearGradient(
            x + width / 2, y + height - width / 4,
            x + width / 2, y + height
        );
        nozzleGradient.addColorStop(0, '#666');
        nozzleGradient.addColorStop(0.7, '#222');
        nozzleGradient.addColorStop(1, '#000');
        
        ctx.fillStyle = nozzleGradient;
        ctx.beginPath();
        ctx.moveTo(x + (width - nozzleWidth * 0.8) / 2, y + height - width / 4);
        ctx.lineTo(x + (width + nozzleWidth * 0.8) / 2, y + height - width / 4);
        ctx.lineTo(x + (width + nozzleWidth * 0.6) / 2, y + height - width / 10);
        ctx.lineTo(x + (width - nozzleWidth * 0.6) / 2, y + height - width / 10);
        ctx.closePath();
        ctx.fill();
    }

    renderTechnicalDetails(ctx, x, y, width, height, isLeftSide) {
        // Position of details depends on which side we're drawing
        const detailX = isLeftSide ? x + width * 0.7 : x + width * 0.1;
        
        // Add fuel gauge with dynamic level based on fuel percentage
        const fuelPercentage = this.fuel / GAME_CONSTANTS.PLAYER.MAX_FUEL;
        const gaugeHeight = height * 0.6;
        const gaugeWidth = width * 0.2;
        const gaugeX = isLeftSide ? x + width * 0.7 : x + width * 0.1;
        const gaugeY = y + height * 0.2;
        
        // Gauge background
        ctx.fillStyle = '#333333';
        ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
        
        // Gauge level with color based on amount
        let fuelColor;
        if (fuelPercentage > 0.6) {
            fuelColor = '#00FF00'; // Green for high fuel
        } else if (fuelPercentage > 0.3) {
            fuelColor = '#FFFF00'; // Yellow for medium fuel
        } else {
            fuelColor = '#FF0000'; // Red for low fuel
        }
        
        // Draw fuel level from bottom up
        const fuelHeight = gaugeHeight * fuelPercentage;
        ctx.fillStyle = fuelColor;
        ctx.fillRect(
            gaugeX, 
            gaugeY + gaugeHeight - fuelHeight, 
            gaugeWidth, 
            fuelHeight
        );
        
        // Add gauge markings
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        
        // Draw tick marks
        for (let i = 0; i <= 4; i++) {
            const tickY = gaugeY + gaugeHeight * i / 4;
            ctx.beginPath();
            ctx.moveTo(gaugeX, tickY);
            ctx.lineTo(gaugeX + gaugeWidth, tickY);
            ctx.stroke();
        }
        
        // Add connection tubes
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        
        // Draw tube connecting jetpack to body
        const tubeStartX = isLeftSide ? x + width : x;
        const tubeStartY = y + height * 0.3;
        const tubeEndX = isLeftSide ? x + width + width * 0.2 : x - width * 0.2;
        const tubeEndY = tubeStartY;
        
        ctx.beginPath();
        ctx.moveTo(tubeStartX, tubeStartY);
        ctx.lineTo(tubeEndX, tubeEndY);
        ctx.stroke();
        
        // Add bolts/rivets
        ctx.fillStyle = '#999999';
        const boltCount = 3;
        for (let i = 0; i < boltCount; i++) {
            const boltY = y + height * 0.2 + (height * 0.6 * i / (boltCount - 1));
            const boltX = isLeftSide ? x + width - 2 : x + 2;
            ctx.beginPath();
            ctx.arc(boltX, boltY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderBody(ctx, x, y) {
        // Create 3D body with shaded gradient
        const bodyGradient = ctx.createLinearGradient(
            x + this.width * 0.25, y + this.height * 0.1,
            x + this.width * 0.75, y + this.height * 0.5
        );
        bodyGradient.addColorStop(0, '#64B5F6'); // Light blue highlight
        bodyGradient.addColorStop(0.5, '#2196F3'); // Medium blue
        bodyGradient.addColorStop(1, '#0D47A1'); // Dark blue shadow
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(x + this.width * 0.33, y + this.height * 0.5); // Bottom left
        ctx.lineTo(x + this.width * 0.25, y + this.height * 0.1); // Top left
        ctx.lineTo(x + this.width * 0.75, y + this.height * 0.1); // Top right
        ctx.lineTo(x + this.width * 0.67, y + this.height * 0.5); // Bottom right
        ctx.closePath();
        ctx.fill();
        
        // Add body highlights for 3D effect
        ctx.strokeStyle = '#90CAF9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + this.width * 0.25, y + this.height * 0.1);
        ctx.lineTo(x + this.width * 0.33, y + this.height * 0.5);
        ctx.stroke();
        
        // Render legs with 3D gradient
        this.renderLegs(ctx, x, y);
    }
    
    renderLegs(ctx, x, y) {
        // Left leg with gradient for 3D effect
        const leftLegGradient = ctx.createLinearGradient(
            x + this.width * 0.3, y + this.height * 0.5,
            x + this.width * 0.45, y + this.height * 0.5
        );
        leftLegGradient.addColorStop(0, '#1565C0'); // Light blue
        leftLegGradient.addColorStop(1, '#0D47A1'); // Dark blue
        
        ctx.fillStyle = leftLegGradient;
        ctx.fillRect(
            x + this.width * 0.3,
            y + this.height * 0.5,
            this.width * 0.15,
            this.height * 0.5
        );
        
        // Right leg with gradient for 3D effect
        const rightLegGradient = ctx.createLinearGradient(
            x + this.width * 0.55, y + this.height * 0.5,
            x + this.width * 0.7, y + this.height * 0.5
        );
        rightLegGradient.addColorStop(0, '#0D47A1'); // Dark blue
        rightLegGradient.addColorStop(1, '#1565C0'); // Light blue
        
        ctx.fillStyle = rightLegGradient;
        ctx.fillRect(
            x + this.width * 0.55,
            y + this.height * 0.5,
            this.width * 0.15,
            this.height * 0.5
        );
        
        // Add knee pads for detail
        this.renderKneePads(ctx, x, y);
    }
    
    renderKneePads(ctx, x, y) {
        // Left knee pad
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.375, 
            y + this.height * 0.65, 
            this.width * 0.075, 
            this.height * 0.05, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Right knee pad
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.625, 
            y + this.height * 0.65, 
            this.width * 0.075, 
            this.height * 0.05, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    renderHead(ctx, x, y, time) {
        // 3D head with shaded gradient
        const headGradient = ctx.createRadialGradient(
            x + this.width * 0.5, y + this.height * 0.1, 0,
            x + this.width * 0.5, y + this.height * 0.1, this.width * 0.25
        );
        headGradient.addColorStop(0, '#FFD0A1'); // Center highlight
        headGradient.addColorStop(0.7, '#FFB74D'); // Medium tone
        headGradient.addColorStop(1, '#FF9800'); // Edge shadow
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(
            x + this.width * 0.5,
            y + this.height * 0.1,
            this.width * 0.25,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Add high-tech goggles with animated glow
        this.renderGoggles(ctx, x, y, time);
    }
    
    renderGoggles(ctx, x, y, time) {
        // Pulsing glow effect for goggles
        const glowIntensity = Math.sin(time * 2) * 0.1 + 0.9;
        
        // Left eye glow
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.4,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Right eye glow
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.6,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Goggle frames
        ctx.strokeStyle = `rgba(150, 255, 255, ${glowIntensity})`;
        ctx.lineWidth = 2;
        
        // Left goggle frame
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.4,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Right goggle frame
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.6,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Add lens reflections
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.38, 
            y + this.height * 0.08,
            this.width * 0.03, 
            this.width * 0.02,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.58, 
            y + this.height * 0.08,
            this.width * 0.03, 
            this.width * 0.02,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    renderFlames(ctx, x, y, time) {
        // Left flame
        this.renderFlame(ctx, 
            x + this.width * 0.25, // Left jetpack center
            y + this.height * 0.52, // Bottom of jetpack
            this.width * 0.15,
            this.height * 0.25,
            time
        );
        
        // Right flame (with offset timing)
        this.renderFlame(ctx,
            x + this.width * 0.75, // Right jetpack center
            y + this.height * 0.52, // Bottom of jetpack
            this.width * 0.15,
            this.height * 0.25,
            time + 0.5 // Offset for animation variety
        );
    }
    
    renderFlame(ctx, x, y, width, height, time) {
        ctx.save();
        
        // Dynamic flame parameters
        const flameHeight = height * (0.8 + Math.sin(time * 10) * 0.2);
        const flickerX = Math.sin(time * 15) * width * 0.15;
        
        // Flame gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + flameHeight);
        gradient.addColorStop(0, '#FFFFFF');   // White hot core
        gradient.addColorStop(0.2, '#FFFF00');  // Yellow
        gradient.addColorStop(0.5, '#FF9500');  // Orange
        gradient.addColorStop(0.8, '#FF5500');  // Red-orange
        gradient.addColorStop(1, '#FF2200');    // Red edge
        
        ctx.fillStyle = gradient;
        
        // Draw flame shape
        ctx.beginPath();
        ctx.moveTo(x - width/2, y); // Left edge start
        ctx.quadraticCurveTo(
            x + flickerX, y + flameHeight * 0.7, // Control point with flicker
            x - width/3 + flickerX/2, y + flameHeight // End point with flicker
        );
        ctx.quadraticCurveTo(
            x + width/4, y + flameHeight * 0.9, // Control point for right curve
            x + width/2, y // Right edge end
        );
        ctx.fill();
        
        // Add inner glow
        const innerGradient = ctx.createLinearGradient(x, y, x, y + flameHeight * 0.7);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        innerGradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.5)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.moveTo(x - width/4, y);
        ctx.quadraticCurveTo(
            x + flickerX/2, y + flameHeight * 0.5,
            x, y + flameHeight * 0.7
        );
        ctx.quadraticCurveTo(
            x + width/8, y + flameHeight * 0.5,
            x + width/4, y
        );
        ctx.fill();
        
        // Add spark particles
        const sparkCount = 3;
        for (let i = 0; i < sparkCount; i++) {
            const sparkTime = (time * 8 + i * 2.1) % 5;
            const sparkProgress = sparkTime / 5;
            
            if (sparkProgress < 1) {
                const sparkX = x + (Math.random() - 0.5) * width * 0.8;
                const sparkY = y + sparkProgress * flameHeight;
                const sparkSize = (1 - sparkProgress) * 3;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - sparkProgress})`;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

window.Player = Player;