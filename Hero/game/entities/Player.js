class Player {
    constructor(x, y) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE; // Remove the 0.5 tile offset
        this.width = 2 * GAME_CONSTANTS.TILE_SIZE;     // 2 tiles wide
        this.height = 2 * GAME_CONSTANTS.TILE_SIZE;    // 2 tiles high (not 2.5)
        this.velocityX = 0;
        this.velocityY = 0;
        this.facingLeft = false;
        this.isFlying = false;
        this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
        this.wingAngle = 0;  // Replace rotorAngle with wingAngle
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
        this.fuel = fuel;

        // Update wing animation
        if (controls.isPressed('ArrowUp') && this.fuel > 0) {
            this.wingAngle += 15 * (time - this.lastTime || 0); // Faster flapping when flying
        } else {
            this.wingAngle += 3 * (time - this.lastTime || 0);  // Slower idle flapping
        }
        this.lastTime = time;

        // Draw in new order: body -> wings -> head
        this.renderBody(ctx, screenX, screenY, time);
        this.renderWings(ctx, screenX, screenY, time);
        this.renderHead(ctx, screenX, screenY, time);

        // Replace jetpack flames with magical sparkle effect when flying
        if (controls.isPressed('ArrowUp') && this.fuel > 0) {
            this.renderMagicSparkles(ctx, screenX, screenY, time);
        }
    }

    renderInDarkness(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        const time = performance.now() / 1000;
        
        ctx.save();
        
        // Special effects for darkness - use a glowing outline
        ctx.globalAlpha = 0.7;
        ctx.globalCompositeOperation = 'lighter'; // Makes the player glow in the dark
        
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
        const direction = this.facingLeft ? -1 : 1;
        const lightX = x + this.width * (this.facingLeft ? 0.4 : 0.6);
        const lightY = y + this.height * 0.05; // Adjusted to match new head position (was 0.1)
        
        // Create a flashlight effect from the goggles
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
    
    renderBody(ctx, x, y, time) {
        const centerX = x + this.width * 0.5;
        const centerY = y + this.height * 0.5;
        
        // Dragon body - more elongated and less circular
        ctx.beginPath();
        ctx.moveTo(centerX - this.width * 0.4, centerY - this.height * 0.2);
        
        // Back curve
        ctx.quadraticCurveTo(
            centerX - this.width * 0.2, centerY - this.height * 0.3,
            centerX + this.width * 0.2, centerY - this.height * 0.2
        );
        
        // Tail section
        ctx.quadraticCurveTo(
            centerX + this.width * 0.3, centerY,
            centerX + this.width * 0.2, centerY + this.height * 0.2
        );
        
        // Bottom curve
        ctx.quadraticCurveTo(
            centerX, centerY + this.height * 0.25,
            centerX - this.width * 0.4, centerY + this.height * 0.2
        );
        
        // Close the path
        ctx.closePath();

        // Fill with gradient
        const bodyGradient = ctx.createLinearGradient(
            centerX - this.width * 0.4, centerY,
            centerX + this.width * 0.4, centerY
        );
        bodyGradient.addColorStop(0, '#90EE90');
        bodyGradient.addColorStop(0.5, '#32CD32');
        bodyGradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = bodyGradient;
        ctx.fill();

        // Add scales and spikes
        this.renderScales(ctx, centerX, centerY);
        this.renderSpikes(ctx, centerX, centerY - this.height * 0.25);
        
        // Render legs
        this.renderDragonLegs(ctx, centerX, centerY);
    }

    renderDragonLegs(ctx, centerX, centerY) {
        // Front leg
        this.renderDragonLeg(ctx, 
            centerX - this.width * 0.25, 
            centerY, 
            true
        );
        
        // Back leg
        this.renderDragonLeg(ctx,
            centerX + this.width * 0.1,
            centerY,
            false
        );
    }

    renderDragonLeg(ctx, x, y, isFront) {
        const legGradient = ctx.createLinearGradient(
            x, y,
            x, y + this.height * 0.4
        );
        legGradient.addColorStop(0, '#228B22');
        legGradient.addColorStop(1, '#006400');
        
        ctx.fillStyle = legGradient;
        
        // Upper leg
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
            x - this.width * 0.1,
            y + this.height * 0.2,
            x + this.width * 0.05,
            y + this.height * 0.25
        );
        
        // Lower leg with digitigrade joint
        ctx.quadraticCurveTo(
            x + this.width * 0.1,
            y + this.height * 0.35,
            x,
            y + this.height * 0.4
        );
        
        // Foot
        ctx.lineTo(x - this.width * 0.1, y + this.height * 0.4);
        ctx.quadraticCurveTo(
            x - this.width * 0.05,
            y + this.height * 0.3,
            x,
            y
        );
        
        ctx.fill();

        // Add claws
        ctx.fillStyle = '#1B4B1B';
        for (let i = 0; i < 3; i++) {
            const clawX = x - this.width * 0.08 + (i * this.width * 0.04);
            ctx.beginPath();
            ctx.moveTo(clawX, y + this.height * 0.4);
            ctx.lineTo(clawX - this.width * 0.02, y + this.height * 0.43);
            ctx.lineTo(clawX + this.width * 0.02, y + this.height * 0.43);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    renderScales(ctx, centerX, centerY) {
        ctx.fillStyle = '#228B22';  // Darker green for scales
        const scaleRows = 3;
        const scalesPerRow = 5;
        const scaleSize = this.width * 0.1;
        
        for (let row = 0; row < scaleRows; row++) {
            for (let i = 0; i < scalesPerRow; i++) {
                const x = centerX - this.width * 0.3 + (i * scaleSize * 1.2);
                const y = centerY - this.height * 0.1 + (row * scaleSize * 0.8);
                
                // Draw scale shape
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + scaleSize, y);
                ctx.lineTo(x + scaleSize/2, y + scaleSize);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    renderSpikes(ctx, centerX, centerY) {
        ctx.fillStyle = '#1B8B1B';  // Slightly darker green for spikes
        const spikeCount = 5;
        
        for (let i = 0; i < spikeCount; i++) {
            const x = centerX - this.width * 0.2 + (i * this.width * 0.1);
            const y = centerY - this.height * 0.3;
            const height = this.height * 0.15;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + this.width * 0.03, y - height);
            ctx.lineTo(x + this.width * 0.06, y);
            ctx.fill();
        }
    }
    
    renderWings(ctx, x, y, time) {
        const centerX = x + this.width * 0.5;
        const centerY = y + this.height * 0.35;
        const wingSpan = this.width * 1.2;
        const wingHeight = this.height * 0.6;
        
        // Wing flap animation
        const flapOffset = Math.sin(this.wingAngle) * 0.5;
        
        ['left', 'right'].forEach(side => {
            ctx.save();
            ctx.translate(centerX, centerY);
            if (side === 'right') ctx.scale(-1, 1);
            
            // Draw main wing membrane
            const wingGradient = ctx.createLinearGradient(0, -wingHeight/2, -wingSpan/2, wingHeight/2);
            wingGradient.addColorStop(0, '#98FB98');
            wingGradient.addColorStop(0.5, '#32CD32');
            wingGradient.addColorStop(1, '#228B22');
            
            ctx.fillStyle = wingGradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            // Create dragon wing shape with spikes
            ctx.quadraticCurveTo(
                -wingSpan * 0.3, -wingHeight * (0.5 + flapOffset),
                -wingSpan * 0.5, -wingHeight * (0.3 + flapOffset)
            );
            // Add wing finger detail
            for (let i = 0; i < 3; i++) {
                const x = -wingSpan * (0.5 - i * 0.15);
                const y = -wingHeight * (0.3 - i * 0.15);
                ctx.lineTo(x, y * (1 + flapOffset));
            }
            ctx.quadraticCurveTo(
                -wingSpan * 0.2, wingHeight * 0.2,
                0, wingHeight * 0.1
            );
            ctx.fill();
            
            // Add wing bone structure
            ctx.strokeStyle = '#1B8B1B';
            ctx.lineWidth = 3;
            // Draw wing bones here...
            
            ctx.restore();
        });
    }

    renderArms(ctx, x, y) {
        const time = performance.now() / 1000;
        const armSwing = Math.sin(time * 2) * 0.1;
        
        // Use metallic white like legs
        const armGradient = ctx.createLinearGradient(
            x, y + this.height * 0.2,
            x + this.width, y + this.height * 0.2
        );
        armGradient.addColorStop(0, '#FFFFFF');
        armGradient.addColorStop(0.4, '#E0E0E0');
        armGradient.addColorStop(0.6, '#F5F5F5');
        armGradient.addColorStop(1, '#FFFFFF');
        
        ctx.fillStyle = armGradient;
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;

        // Extended arms that go more to the sides
        // Left arm
        ctx.save();
        ctx.translate(x + this.width * 0.1, y + this.height * 0.2);
        ctx.rotate(-0.2 + armSwing);
        this.renderArm(ctx, true);
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(x + this.width * 0.9, y + this.height * 0.2);
        ctx.rotate(0.2 - armSwing);
        this.renderArm(ctx, false);
        ctx.restore();
    }

    renderArm(ctx, isLeft) {
        // Thinner but longer arms
        const armWidth = this.width * 0.08;
        const armLength = this.height * 0.4;
        
        // Draw simple rectangular arm with rounded ends
        ctx.beginPath();
        if (isLeft) {
            ctx.roundRect(-armWidth, 0, armWidth, armLength, 4);
        } else {
            ctx.roundRect(0, 0, armWidth, armLength, 4);
        }
        ctx.fill();
        ctx.stroke();
    }

    renderMetallicJoint(ctx, x, y, size) {
        const jointRadius = this.width * size;
        const jointGradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, jointRadius
        );
        jointGradient.addColorStop(0, '#FFFFFF');
        jointGradient.addColorStop(0.5, '#E0E0E0');
        jointGradient.addColorStop(1, '#CCCCCC');
        
        ctx.fillStyle = jointGradient;
        ctx.beginPath();
        ctx.arc(x, y, jointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    renderLegs(ctx, x, y) {
        // Create metallic white gradient for legs
        const legGradient = ctx.createLinearGradient(
            x + this.width * 0.3, y + this.height * 0.5,
            x + this.width * 0.7, y + this.height * 0.5
        );
        legGradient.addColorStop(0, '#FFFFFF'); // Pure white
        legGradient.addColorStop(0.4, '#E0E0E0'); // Light metallic
        legGradient.addColorStop(0.6, '#F5F5F5'); // Slightly lighter
        legGradient.addColorStop(1, '#FFFFFF'); // Back to white
        
        ctx.fillStyle = legGradient;
        
        // Left leg with metallic sheen
        ctx.fillRect(
            x + this.width * 0.3,
            y + this.height * 0.5,
            this.width * 0.15,
            this.height * 0.5
        );
        
        // Right leg with metallic sheen
        ctx.fillRect(
            x + this.width * 0.55,
            y + this.height * 0.5,
            this.width * 0.15,
            this.height * 0.5
        );
        
        // Add metallic highlights to legs
        const highlightGradient = ctx.createLinearGradient(
            x + this.width * 0.3, y + this.height * 0.5,
            x + this.width * 0.45, y + this.height
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        highlightGradient.addColorStop(0.5, 'rgba(220, 220, 220, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(200, 200, 200, 0.4)');
        
        ctx.fillStyle = highlightGradient;
        
        // Apply highlights to both legs
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
        
        // Add knee joints (metallic circles)
        this.renderKneeJoints(ctx, x, y);
    }

    renderKneeJoints(ctx, x, y) {
        ctx.fillStyle = '#D3D3D3';
        
        // Left knee joint
        ctx.beginPath();
        ctx.arc(
            x + this.width * 0.375,
            y + this.height * 0.65,
            this.width * 0.06,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Right knee joint
        ctx.beginPath();
        ctx.arc(
            x + this.width * 0.625,
            y + this.height * 0.65,
            this.width * 0.06,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Add metallic shine to joints
        const jointShine = ctx.createRadialGradient(
            x + this.width * 0.375, y + this.height * 0.65, 0,
            x + this.width * 0.375, y + this.height * 0.65, this.width * 0.06
        );
        jointShine.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        jointShine.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        jointShine.addColorStop(1, 'rgba(200, 200, 200, 0)');
        
        ctx.fillStyle = jointShine;
        ctx.fill();
    }
    
    renderHead(ctx, x, y, time) {
        const centerX = x + this.width * 0.5;
        const centerY = y + this.height * 0.15; // Moved up to ear level (was 0.3)

        // Draw cute dragon head with repositioned elements
        const headGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.width * 0.3
        );
        headGradient.addColorStop(0, '#90EE90');
        headGradient.addColorStop(0.7, '#32CD32');
        headGradient.addColorStop(1, '#228B22');

        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Adjust eye position to new head position
        const eyeY = centerY - this.height * 0.02; // Adjusted relative to new head position
        this.renderDragonEyes(ctx, centerX, eyeY, time);

        // Adjust snout position
        this.renderSnout(ctx, centerX, centerY + this.height * 0.05); // Adjusted for new head position

        // Adjust horn position
        this.renderHorns(ctx, centerX, centerY - this.height * 0.1); // Adjusted for new head position
    }

    renderDragonEyes(ctx, centerX, eyeY, time) {
        // White background for eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - this.width * 0.12, eyeY, this.width * 0.08, 0, Math.PI * 2);
        ctx.arc(centerX + this.width * 0.12, eyeY, this.width * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Cute black pupils that follow movement direction
        const pupilOffset = this.facingLeft ? -0.02 : 0.02;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - this.width * (0.12 - pupilOffset), eyeY, this.width * 0.04, 0, Math.PI * 2);
        ctx.arc(centerX + this.width * (0.12 + pupilOffset), eyeY, this.width * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Add eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - this.width * 0.14, eyeY - this.height * 0.02, this.width * 0.02, 0, Math.PI * 2);
        ctx.arc(centerX + this.width * 0.10, eyeY - this.height * 0.02, this.width * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSnout(ctx, centerX, centerY) {
        // Cute rounded snout
        const snoutGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.width * 0.15
        );
        snoutGradient.addColorStop(0, '#98FB98');
        snoutGradient.addColorStop(1, '#32CD32');

        ctx.fillStyle = snoutGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width * 0.15, this.height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(centerX - this.width * 0.05, centerY, this.width * 0.02, 0, Math.PI * 2);
        ctx.arc(centerX + this.width * 0.05, centerY, this.width * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    renderHorns(ctx, centerX, centerY) {
        const hornGradient = ctx.createLinearGradient(
            centerX, centerY,
            centerX, centerY - this.height * 0.1
        );
        hornGradient.addColorStop(0, '#FFE4B5');
        hornGradient.addColorStop(1, '#DEB887');

        ctx.fillStyle = hornGradient;
        
        // Left horn
        ctx.beginPath();
        ctx.moveTo(centerX - this.width * 0.15, centerY);
        ctx.quadraticCurveTo(
            centerX - this.width * 0.2,
            centerY - this.height * 0.15,
            centerX - this.width * 0.15,
            centerY - this.height * 0.2
        );
        ctx.lineTo(centerX - this.width * 0.1, centerY);
        ctx.fill();

        // Right horn
        ctx.beginPath();
        ctx.moveTo(centerX + this.width * 0.15, centerY);
        ctx.quadraticCurveTo(
            centerX + this.width * 0.2,
            centerY - this.height * 0.15,
            centerX + this.width * 0.15,
            centerY - this.height * 0.2
        );
        ctx.lineTo(centerX + this.width * 0.1, centerY);
        ctx.fill();
    }
    
    renderGoggles(ctx, x, y, time) {
        const glowIntensity = Math.sin(time * 2) * 0.1 + 0.9;
        
        // Goggles base (dark tint)
        ctx.fillStyle = '#1A0000';
        
        // Left goggle
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.4,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Right goggle
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.6,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Add red glow effect to goggles
        const glowColor = `rgba(255, 0, 0, ${glowIntensity * 0.3})`;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        
        // Left goggle glow
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.4,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Right goggle glow
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.6,
            y + this.height * 0.1,
            this.width * 0.1,
            this.width * 0.06,
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Add subtle reflection highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.38,
            y + this.height * 0.08,
            this.width * 0.03,
            this.width * 0.02,
            -Math.PI / 4,
            0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.58,
            y + this.height * 0.08,
            this.width * 0.03,
            this.width * 0.02,
            -Math.PI / 4,
            0, Math.PI * 2
        );
        ctx.fill();
    }
    
    renderMagicSparkles(ctx, x, y, time) {
        const centerX = x + this.width * 0.5;
        const centerY = y + this.height * 0.7;
        const sparkleCount = 8;
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + time * 3;
            const radius = 20 + Math.sin(time * 5 + i) * 10;
            const sparkleX = centerX + Math.cos(angle) * radius;
            const sparkleY = centerY + Math.sin(angle) * radius;
            
            // Draw sparkle
            const gradient = ctx.createRadialGradient(
                sparkleX, sparkleY, 0,
                sparkleX, sparkleY, 5
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(150, 255, 150, 0.5)');
            gradient.addColorStop(1, 'rgba(50, 200, 50, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

window.Player = Player;