class Level {
    constructor(levelData) {
        // First trim the entire level string to remove empty lines at start/end
        // Then split into lines and trim each line to remove leading/trailing spaces
        this.map = levelData.map.trim().split('\n').map(row => row.trim().split(''));
        this.viewport = levelData.viewport;
        this.collectibles = [];
        this.initialLightsOn = (levelData.lights === false) ? false : true; // Store initial light state
        this.exits = [];
        
        // Find collectibles in the level
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                if (tile in GAME_CONSTANTS.COLLECTIBLES) {
                    this.collectibles.push({ 
                        x: x * GAME_CONSTANTS.TILE_SIZE, 
                        y: y * GAME_CONSTANTS.TILE_SIZE, 
                        type: tile, 
                        collected: false 
                    });
                }
                if (tile === '(' || tile === ')') {
                    this.exits.push({
                        x: x,
                        y: y,
                        facingRight: tile === ')'
                    });
                }
            }
        }
    }

    findPlayerStart() {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === '@') {
                    return { x, y };
                }
            }
        }
        // Default start position if no @ found
        return { x: 1, y: 1 };
    }

    isWall(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return true;
        }
        const tile = this.map[y][x];
        return (tile in WALLS) || tile === '=' || tile === '!' || tile === '~';
    }

    isHazard(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return false;
        }
        const tile = this.map[y][x];
        return tile === '!' || tile === '^' || tile === '&' || tile === '~';  // Lava, spider, snake, water
    }

    isDestructible(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return false;
        }
        return this.map[y][x] === '=' || this.map[y][x] === '!';
    }

    damageWall(x, y) {
        if (this.isDestructible(x, y)) {
            this.map[y][x] = ' ';  // Replace with empty space
            return true;
        }
        return false;
    }

    isLightSwitch(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return false;
        }
        const tile = this.map[y][x];
        // Remove debug log
        return tile === '*' || tile === 'o';
    }

    isExit(x, y) {
        if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return false;
        }
        const tile = this.map[y][x];
        return tile === '(' || tile === ')';
    }

    getExitAt(x, y) {
        return this.exits.find(exit => exit.x === x && exit.y === y);
    }

    isComplete() {
        return this.collectibles.every(c => c.collected);
    }

    renderLava(ctx, screenX, screenY, time) {
        // Base lava color
        const baseGradient = ctx.createLinearGradient(
            screenX, screenY,
            screenX, screenY + GAME_CONSTANTS.TILE_SIZE
        );
        baseGradient.addColorStop(0, '#FF4500');  // Bright orange-red
        baseGradient.addColorStop(0.5, '#FF2400'); // Deeper red
        baseGradient.addColorStop(1, '#8B0000');  // Dark red
        
        ctx.fillStyle = baseGradient;
        ctx.fillRect(
            screenX, screenY,
            GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE
        );
    
        // Lava flow animation
        const flowOffset = Math.sin(time * 2 + screenX * 0.1) * 5;
        const flowGradient = ctx.createLinearGradient(
            screenX, screenY + flowOffset,
            screenX, screenY + GAME_CONSTANTS.TILE_SIZE + flowOffset
        );
        flowGradient.addColorStop(0, 'rgba(255, 140, 0, 0.5)'); // Bright orange
        flowGradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.5)'); // Red-orange
        flowGradient.addColorStop(1, 'rgba(139, 0, 0, 0.5)');   // Dark red
        
        ctx.fillStyle = flowGradient;
        ctx.fillRect(
            screenX, screenY,
            GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE
        );
    
        // Add bubbles
        for (let i = 0; i < 3; i++) {
            const bubbleX = screenX + (Math.sin(time * 3 + i * 7) + 1) * GAME_CONSTANTS.TILE_SIZE/3;
            const bubbleY = screenY + ((time * (0.5 + i * 0.2)) % 1) * GAME_CONSTANTS.TILE_SIZE;
            const bubbleSize = 4 + Math.sin(time * 5 + i * 3) * 2;
            
            // Bubble gradient
            const bubbleGradient = ctx.createRadialGradient(
                bubbleX, bubbleY, 0,
                bubbleX, bubbleY, bubbleSize
            );
            bubbleGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
            bubbleGradient.addColorStop(0.6, 'rgba(255, 140, 0, 0.4)');
            bubbleGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
            ctx.fillStyle = bubbleGradient;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    
        // Add sparks
        for (let i = 0; i < 2; i++) {
            if (Math.random() < 0.1) {
                const sparkX = screenX + Math.random() * GAME_CONSTANTS.TILE_SIZE;
                const sparkY = screenY + Math.random() * GAME_CONSTANTS.TILE_SIZE * 0.5;
                const sparkSize = 1 + Math.random() * 2;
                
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    
        // Add surface glow
        const glowGradient = ctx.createRadialGradient(
            screenX + GAME_CONSTANTS.TILE_SIZE/2, screenY, 0,
            screenX + GAME_CONSTANTS.TILE_SIZE/2, screenY, GAME_CONSTANTS.TILE_SIZE
        );
        glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(
            screenX - 5, screenY - 5,
            GAME_CONSTANTS.TILE_SIZE + 10, GAME_CONSTANTS.TILE_SIZE + 10
        );
    }

    initializeEntities() {
        // Create enemies from level map
        this.enemies = [];
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                if (tile === '&') {
                    this.enemies.push(new Snake(x, y));
                } else if (tile === '^') {
                    this.enemies.push(new Spider(x, y));
                }
            }
        }
    }

    render(ctx, offsetX, offsetY, time) { // Add time parameter here
        const startCol = Math.floor(offsetX / GAME_CONSTANTS.TILE_SIZE);
        const endCol = startCol + Math.ceil(ctx.canvas.width / GAME_CONSTANTS.TILE_SIZE) + 1; // +1 to ensure we render offscreen tiles
        const startRow = Math.floor(offsetY / GAME_CONSTANTS.TILE_SIZE);
        const endRow = startRow + Math.ceil(ctx.canvas.height / GAME_CONSTANTS.TILE_SIZE) + 1; // +1 to ensure we render offscreen tiles

        // Clear the canvas with a solid background color first
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Render the tiles with exact pixel alignment
        for (let row = startRow; row < endRow; row++) {
            if (row < 0 || row >= this.map.length) continue;
            
            for (let col = startCol; col < endCol; col++) {
                if (col < 0 || col >= this.map[row].length) continue;
                
                const tile = this.map[row][col];
                
                // Skip rendering enemy tiles since they're now handled by their own classes
                if (tile === '^' || tile === '&') continue;
                
                // Calculate exact pixel positions without any subpixel values
                const screenX = Math.floor(col * GAME_CONSTANTS.TILE_SIZE - offsetX);
                const screenY = Math.floor(row * GAME_CONSTANTS.TILE_SIZE - offsetY);
                
                // Only render tiles that are within the viewport
                if (screenX <= ctx.canvas.width && screenY <= ctx.canvas.height) {
                    // Set fill color based on tile type
                    if (tile in WALLS) {
                        ctx.fillStyle = WALLS[tile];
                        ctx.fillRect(
                            screenX, 
                            screenY, 
                            GAME_CONSTANTS.TILE_SIZE,
                            GAME_CONSTANTS.TILE_SIZE
                        );
                    } else if (tile === '=') {
                        // Draw destructible wall with enhanced brick pattern
                        const brickColor = '#8B4513';  // Base brown color
                        const morterColor = '#696969'; // Darker grout color
                        const highlightColor = '#A0522D'; // Lighter brick highlight
                        
                        // Fill base color
                        ctx.fillStyle = brickColor;
                        ctx.fillRect(
                            screenX, 
                            screenY, 
                            GAME_CONSTANTS.TILE_SIZE,
                            GAME_CONSTANTS.TILE_SIZE
                        );
                        
                        // Draw brick pattern
                        ctx.fillStyle = highlightColor;
                        
                        // Draw two bricks with highlight
                        const brickHeight = GAME_CONSTANTS.TILE_SIZE / 3;
                        
                        // Top brick
                        ctx.fillRect(
                            screenX, 
                            screenY, 
                            GAME_CONSTANTS.TILE_SIZE * 0.6, 
                            brickHeight - 2
                        );
                        
                        // Middle brick (offset)
                        ctx.fillRect(
                            screenX + GAME_CONSTANTS.TILE_SIZE * 0.2, 
                            screenY + brickHeight + 2, 
                            GAME_CONSTANTS.TILE_SIZE * 0.8,
                            brickHeight - 2
                        );
                        
                        // Bottom brick
                        ctx.fillRect(
                            screenX, 
                            screenY + 2 * brickHeight + 2, 
                            GAME_CONSTANTS.TILE_SIZE * 0.7,
                            brickHeight - 2
                        );
                        
                        // Add mortar lines
                        ctx.fillStyle = morterColor;
                        // Horizontal mortar lines
                        ctx.fillRect(screenX, screenY + brickHeight, GAME_CONSTANTS.TILE_SIZE, 2);
                        ctx.fillRect(screenX, screenY + 2 * brickHeight, GAME_CONSTANTS.TILE_SIZE, 2);
                        
                        // Vertical mortar lines - vary by row for pattern
                        const verticalOffset = (Math.floor(screenY / GAME_CONSTANTS.TILE_SIZE) % 2) * 0.5;
                        ctx.fillRect(
                            screenX + GAME_CONSTANTS.TILE_SIZE * (0.6 + verticalOffset), 
                            screenY, 
                            2, 
                            brickHeight
                        );
                        ctx.fillRect(
                            screenX + GAME_CONSTANTS.TILE_SIZE * (0.3 + verticalOffset), 
                            screenY + brickHeight, 
                            2, 
                            brickHeight
                        );
                        ctx.fillRect(
                            screenX + GAME_CONSTANTS.TILE_SIZE * (0.7 + verticalOffset), 
                            screenY + 2 * brickHeight, 
                            2, 
                            brickHeight
                        );
                    } else if (tile === '!') {
                        this.renderLava(ctx, screenX, screenY, time);
                        continue; // Skip the default tile rendering
                    } else if (tile === '~') {
                        // Draw water base
                        ctx.fillStyle = 'rgba(30, 144, 255, 0.5)'; // Semi-transparent blue
                        ctx.fillRect(
                            screenX, 
                            screenY, 
                            GAME_CONSTANTS.TILE_SIZE,
                            GAME_CONSTANTS.TILE_SIZE
                        );
                        
                        // Create wave pattern
                        const time = performance.now() / 1000;
                        ctx.fillStyle = 'rgba(30, 144, 255, 0.3)'; // Lighter blue for waves
                        ctx.beginPath();
                        ctx.moveTo(screenX, screenY);
                        
                        // Draw wavy pattern from left to right at the top of tile
                        for (let x = 0; x <= GAME_CONSTANTS.TILE_SIZE; x += 4) {
                            const waveOffset = Math.sin(time * 2 + x/10) * 2;
                            ctx.lineTo(screenX + x, screenY + waveOffset);
                        }
                        
                        // Complete the path
                        ctx.lineTo(screenX + GAME_CONSTANTS.TILE_SIZE, screenY + GAME_CONSTANTS.TILE_SIZE);
                        ctx.lineTo(screenX, screenY + GAME_CONSTANTS.TILE_SIZE);
                        ctx.closePath();
                        ctx.fill();
                    } else if (tile === '(' || tile === ')') {
                        this.renderSittingPerson(ctx, screenX, screenY, tile === ')');
                    } else if (tile === '*' || tile === 'o') {
                        const centerX = screenX + GAME_CONSTANTS.TILE_SIZE/2;
                        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE/2;
                        
                        // Draw chain
                        ctx.strokeStyle = '#696969';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(centerX, screenY);
                        ctx.lineTo(centerX, centerY + 8);  // Chain now goes to bottom
                        ctx.stroke();
                        
                        // Draw hook at bottom
                        ctx.beginPath();
                        ctx.arc(centerX, centerY + 8, 2, 0, Math.PI);  // Hook faces down
                        ctx.stroke();
                        
                        // Draw main lantern body (upside down)
                        ctx.fillStyle = '#8B4513';  // Saddle brown
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#654321';
                        
                        // Bottom wide part (was top)
                        ctx.beginPath();
                        ctx.moveTo(centerX - 8, centerY + 6);  // Left bottom
                        ctx.lineTo(centerX + 8, centerY + 6);  // Right bottom
                        ctx.stroke();
                        
                        // Sides converging to top (was bottom)
                        ctx.beginPath();
                        ctx.moveTo(centerX - 8, centerY + 6);  // Left bottom
                        ctx.lineTo(centerX - 4, centerY - 8);  // Left top
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX + 8, centerY + 6);  // Right bottom
                        ctx.lineTo(centerX + 4, centerY - 8);  // Right top
                        ctx.stroke();
                        
                        // Top line (was bottom)
                        ctx.beginPath();
                        ctx.moveTo(centerX - 4, centerY - 8);
                        ctx.lineTo(centerX + 4, centerY - 8);
                        ctx.stroke();
                        
                        // Cross beams (horizontal)
                        for(let i = 1; i < 3; i++) {
                            const y = centerY + 4 - i * 5;  // Start from bottom
                            const bottomWidth = 8;
                            const shrink = i * 2;
                            ctx.beginPath();
                            ctx.moveTo(centerX - bottomWidth + shrink, y);
                            ctx.lineTo(centerX + bottomWidth - shrink, y);
                            ctx.stroke();
                        }
                        
                        // Draw glass panels
                        const glassColor = tile === '*' ? '#FFDB58' : '#A0A0A0';
                        ctx.fillStyle = glassColor;
                        
                        // Front panel (trapezoid, upside down)
                        ctx.beginPath();
                        ctx.moveTo(centerX - 8, centerY + 6);  // Bottom left (wide)
                        ctx.lineTo(centerX + 8, centerY + 6);  // Bottom right (wide)
                        ctx.lineTo(centerX + 4, centerY - 8);  // Top right (narrow)
                        ctx.lineTo(centerX - 4, centerY - 8);  // Top left (narrow)
                        ctx.closePath();
                        ctx.fill();
                        
                        // Add sharp panel lines
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        for(let i = 1; i < 3; i++) {
                            const y = centerY + 4 - i * 5;  // Start from bottom
                            const bottomWidth = 8;
                            const shrink = i * 2;
                            ctx.beginPath();
                            ctx.moveTo(centerX - bottomWidth + shrink, y);
                            ctx.lineTo(centerX + bottomWidth - shrink, y);
                            ctx.stroke();
                        }
                        
                        if (tile === '*') {
                            // Draw sharper glow
                            const gradient = ctx.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, GAME_CONSTANTS.TILE_SIZE * 0.6
                            );
                            gradient.addColorStop(0, 'rgba(255, 255, 150, 0.6)');
                            gradient.addColorStop(0.7, 'rgba(255, 255, 150, 0.2)');
                            gradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
                            
                            ctx.fillStyle = gradient;
                            ctx.beginPath();
                            ctx.arc(centerX, centerY, GAME_CONSTANTS.TILE_SIZE * 0.6, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Draw sharp flame (upside down)
                            ctx.fillStyle = '#FF4500';  // OrangeRed
                            ctx.beginPath();
                            ctx.moveTo(centerX, centerY + 1);
                            ctx.lineTo(centerX + 2, centerY - 2);
                            ctx.lineTo(centerX, centerY - 4);
                            ctx.lineTo(centerX - 2, centerY - 2);
                            ctx.closePath();
                            ctx.fill();
                            
                            // Flame highlight (upside down)
                            ctx.fillStyle = '#FFD700';
                            ctx.beginPath();
                            ctx.moveTo(centerX, centerY);
                            ctx.lineTo(centerX + 1, centerY - 2);
                            ctx.lineTo(centerX, centerY - 3);
                            ctx.lineTo(centerX - 1, centerY - 2);
                            ctx.closePath();
                            ctx.fill();
                        }
                    }
                    
                    // Draw collectibles in the same pass
                    const collectible = this.collectibles.find(c => 
                        Math.floor(c.x / GAME_CONSTANTS.TILE_SIZE) === col && 
                        Math.floor(c.y / GAME_CONSTANTS.TILE_SIZE) === row && 
                        !c.collected
                    );
                    
                    if (collectible) {
                        const centerX = screenX + GAME_CONSTANTS.TILE_SIZE / 2;
                        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE / 2;
                        
                        // Draw collectible glow
                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, GAME_CONSTANTS.TILE_SIZE / 2
                        );
                        gradient.addColorStop(0, GAME_CONSTANTS.COLLECTIBLES[collectible.type].COLOR);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, GAME_CONSTANTS.TILE_SIZE / 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw collectible emoji
                        ctx.font = '24px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = GAME_CONSTANTS.COLLECTIBLES[collectible.type].COLOR;
                        ctx.fillText(
                            GAME_CONSTANTS.COLLECTIBLES[collectible.type].EMOJI,
                            centerX,
                            centerY
                        );
                    }
                }
            }
        }
    }

    renderSittingPerson(ctx, x, y, facingRight) {
        // Portal size increased to 2x normal size
        const centerX = x + GAME_CONSTANTS.TILE_SIZE / 2;
        const centerY = y + GAME_CONSTANTS.TILE_SIZE / 2;
        const scale = GAME_CONSTANTS.TILE_SIZE / 32; // Base scale for drawing
        const portalSize = GAME_CONSTANTS.TILE_SIZE * 2; // Doubled portal size
        
        // Draw an impressive portal effect first
        this.renderPortalEffect(ctx, centerX, centerY, portalSize, facingRight);
        
        // Save context for transformations
        ctx.save();
        
        // Mirror if facing right
        if (facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-2 * centerX, 0);
        }
        
        // Draw enhanced 3D person with glow effects
        this.renderEnhanced3DPerson(ctx, centerX, centerY, scale);
        
        // Restore context after transformations
        ctx.restore();
    }

    // New method to render an enhanced 3D-looking person with glow effects
    renderEnhanced3DPerson(ctx, centerX, centerY, scale) {
        const time = performance.now() / 1000;
        
        // Create light source animation
        const lightPulse = Math.sin(time * 2) * 0.2 + 0.8;
        
        // Add ambient glow around character
        const ambientGlow = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 40 * scale
        );
        ambientGlow.addColorStop(0, 'rgba(100, 255, 250, 0.3)');
        ambientGlow.addColorStop(0.5, 'rgba(50, 200, 255, 0.2)');
        ambientGlow.addColorStop(1, 'rgba(0, 100, 200, 0)');
        
        ctx.fillStyle = ambientGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Create energy field effect
        ctx.strokeStyle = 'rgba(200, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            const pulseRadius = (20 + i * 8) * scale * (0.8 + Math.sin(time * 3 + i) * 0.2);
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw futuristic platform/seat under person
        // Platform base - metallic look
        const platformGradient = ctx.createLinearGradient(
            centerX - 18 * scale, 
            centerY + 12 * scale,
            centerX + 18 * scale, 
            centerY + 15 * scale
        );
        platformGradient.addColorStop(0, '#336699');
        platformGradient.addColorStop(0.5, '#88AADD');
        platformGradient.addColorStop(1, '#336699');
        
        ctx.fillStyle = platformGradient;
        ctx.beginPath();
        ctx.ellipse(
            centerX, 
            centerY + 14 * scale, 
            18 * scale, 
            6 * scale, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Platform rim glow
        ctx.strokeStyle = 'rgba(100, 200, 255, ' + lightPulse + ')';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.ellipse(
            centerX, 
            centerY + 14 * scale, 
            18 * scale, 
            6 * scale, 
            0, 0, Math.PI * 2
        );
        ctx.stroke();
        
        // Add tech details to platform
        ctx.fillStyle = '#1A3366';
        ctx.beginPath();
        ctx.ellipse(
            centerX, 
            centerY + 14 * scale, 
            10 * scale, 
            3 * scale, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = 'rgba(100, 200, 255, ' + lightPulse + ')';
        ctx.beginPath();
        ctx.ellipse(
            centerX, 
            centerY + 14 * scale, 
            4 * scale, 
            1.5 * scale, 
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw energy column beneath platform
        const columnGradient = ctx.createLinearGradient(
            centerX, centerY + 14 * scale,
            centerX, centerY + 30 * scale
        );
        columnGradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        columnGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = columnGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 6 * scale, centerY + 14 * scale);
        ctx.lineTo(centerX + 6 * scale, centerY + 14 * scale);
        ctx.lineTo(centerX + 3 * scale, centerY + 30 * scale);
        ctx.lineTo(centerX - 3 * scale, centerY + 30 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Draw futuristic humanoid with energy/crystal effects
        
        // Body - crystal/energy form
        const bodyGradient = ctx.createLinearGradient(
            centerX, centerY - 8 * scale,
            centerX, centerY + 10 * scale
        );
        bodyGradient.addColorStop(0, 'rgba(150, 255, 255, 0.9)');
        bodyGradient.addColorStop(0.5, 'rgba(50, 180, 255, 0.8)');
        bodyGradient.addColorStop(1, 'rgba(30, 100, 200, 0.9)');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(centerX - 8 * scale, centerY + 5 * scale);
        ctx.lineTo(centerX - 6 * scale, centerY - 8 * scale);
        ctx.lineTo(centerX + 6 * scale, centerY - 8 * scale);
        ctx.lineTo(centerX + 8 * scale, centerY + 5 * scale);
        ctx.closePath();
        ctx.fill();
        
        // Add glowing tech lines to body
        ctx.strokeStyle = 'rgba(200, 255, 255, ' + lightPulse + ')';
        ctx.lineWidth = scale;
        
        // Horizontal lines
        for (let i = 0; i < 3; i++) {
            const y = centerY - 5 * scale + i * 4 * scale;
            const widthReduction = i * 2 * scale;
            ctx.beginPath();
            ctx.moveTo(centerX - 6 * scale + widthReduction, y);
            ctx.lineTo(centerX + 6 * scale - widthReduction, y);
            ctx.stroke();
        }
        
        // Head - glowing orb/crystal
        const headGradient = ctx.createRadialGradient(
            centerX, centerY - 10 * scale, 0,
            centerX, centerY - 10 * scale, 7 * scale
        );
        headGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        headGradient.addColorStop(0.4, 'rgba(150, 220, 255, 0.9)');
        headGradient.addColorStop(1, 'rgba(100, 180, 255, 0.8)');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 10 * scale, 7 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Create crystalline facets on head
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 0.5 * scale;
        
        const facets = 5;
        for (let i = 0; i < facets; i++) {
            const angle = (i / facets) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - 10 * scale);
            ctx.lineTo(
                centerX + Math.cos(angle) * 7 * scale,
                centerY - 10 * scale + Math.sin(angle) * 7 * scale
            );
            ctx.stroke();
        }
        
        // Draw energy patterns inside head
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 + Math.sin(time * 3) * 0.3) + ')';
        ctx.lineWidth = 0.5 * scale;
        
        for (let i = 0; i < 3; i++) {
            const innerRadius = 3 * scale;
            const angle = time * 2 + i * Math.PI * 2/3;
            
            ctx.beginPath();
            ctx.moveTo(
                centerX, 
                centerY - 10 * scale
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * innerRadius,
                centerY - 10 * scale + Math.sin(angle) * innerRadius
            );
            ctx.stroke();
        }
        
        // Draw limbs as energy beams
        
        // Arms
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';
        
        // Left arm
        ctx.beginPath();
        ctx.moveTo(centerX - 8 * scale, centerY - 4 * scale);
        ctx.quadraticCurveTo(
            centerX - 15 * scale,
            centerY + 2 * scale,
            centerX - 12 * scale,
            centerY + 8 * scale
        );
        ctx.stroke();
        
        // Right arm
        ctx.beginPath();
        ctx.moveTo(centerX + 8 * scale, centerY - 4 * scale);
        ctx.quadraticCurveTo(
            centerX + 15 * scale,
            centerY + 2 * scale,
            centerX + 12 * scale,
            centerY + 8 * scale
        );
        ctx.stroke();
        
        // Legs
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(centerX - 6 * scale, centerY + 5 * scale);
        ctx.quadraticCurveTo(
            centerX - 10 * scale,
            centerY + 10 * scale,
            centerX - 8 * scale,
            centerY + 15 * scale
        );
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(centerX + 6 * scale, centerY + 5 * scale);
        ctx.quadraticCurveTo(
            centerX + 10 * scale,
            centerY + 10 * scale,
            centerX + 8 * scale,
            centerY + 15 * scale
        );
        ctx.stroke();
        
        // Add energy tendrils connecting to platform
        ctx.strokeStyle = 'rgba(150, 255, 255, ' + (0.5 + Math.sin(time * 2.5) * 0.3) + ')';
        ctx.lineWidth = scale;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI + time * 0.5;
            const feetX = centerX + Math.cos(angle) * 6 * scale;
            const feetY = centerY + 14 * scale;
            
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * 4 * scale, 
                centerY + 5 * scale
            );
            ctx.quadraticCurveTo(
                centerX + Math.cos(angle) * 5 * scale,
                centerY + 10 * scale,
                feetX,
                feetY
            );
            ctx.stroke();
        }
    }

    // New method to render an impressive portal effect
    renderPortalEffect(ctx, centerX, centerY, size, facingRight) {
        const time = performance.now() / 1000;
        
        // Save context for portal effect
        ctx.save();
        
        // Draw outer portal glow
        const outerGradient = ctx.createRadialGradient(
            centerX, centerY, size * 0.2,
            centerX, centerY, size * 0.9
        );
        outerGradient.addColorStop(0, 'rgba(100, 200, 255, 0.7)');
        outerGradient.addColorStop(0.5, 'rgba(50, 100, 255, 0.5)');
        outerGradient.addColorStop(1, 'rgba(50, 50, 255, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw swirling portal energy
        const swirls = 6;
        const swirlWidth = 10;
        const direction = facingRight ? 1 : -1;
        
        ctx.strokeStyle = '#40E0FF';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < swirls; i++) {
            const angle = (time * direction + i * Math.PI / 3) % (Math.PI * 2);
            const radius = size * 0.4 + Math.sin(time * 3 + i) * 10;
            
            ctx.beginPath();
            ctx.arc(
                centerX, 
                centerY, 
                radius,
                angle, 
                angle + Math.PI / swirlWidth
            );
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(
                centerX, 
                centerY, 
                radius,
                angle + Math.PI, 
                angle + Math.PI + Math.PI / swirlWidth
            );
            ctx.stroke();
        }
        
        // Draw inner portal core
        const innerGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, size * 0.45
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        innerGradient.addColorStop(0.3, 'rgba(150, 230, 255, 0.8)');
        innerGradient.addColorStop(0.6, 'rgba(100, 200, 255, 0.6)');
        innerGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pulsing effect
        const pulseSize = (Math.sin(time * 3) * 0.1 + 0.9) * size * 0.3;
        const pulseGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, pulseSize
        );
        pulseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        pulseGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.5)');
        pulseGradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
        
        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw stars/sparkles
        const sparkleCount = 12;
        for (let i = 0; i < sparkleCount; i++) {
            const sparkAngle = time * 2 + i * (Math.PI * 2 / sparkleCount);
            const distance = size * 0.35 * (0.8 + Math.sin(time * 4 + i * 7) * 0.2);
            const sparkX = centerX + Math.cos(sparkAngle) * distance;
            const sparkY = centerY + Math.sin(sparkAngle) * distance;
            const sparkSize = 2 + Math.sin(time * 5 + i) * 1;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.drawStar(ctx, sparkX, sparkY, 4, sparkSize, sparkSize/2);
        }
        
        // Restore context
        ctx.restore();
    }

    // Helper method to draw stars
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
        ctx.fill();
    }
}

class LevelManager {
    constructor() {
        this.currentLevel = 0;
        this.grid = [];
        this.collectibles = [];
        this.dynamites = [];
        this.loadLevel(this.currentLevel);
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.grid = [];
        this.collectibles = [];
        this.dynamites = [];
        
        const level = LEVELS[levelNumber];
        if (!level) return false;

        // Initialize grid
        for (let y = 0; y < GAME_CONSTANTS.GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GAME_CONSTANTS.GRID_SIZE; x++) {
                const tileType = level.map[y][x];
                this.grid[y][x] = {
                    type: tileType,
                    health: (tileType === 2 || tileType === '!') ? 100 : 0 // Both destructible walls and lava have health
                };
            }
        }

        // Load collectibles
        this.collectibles = level.collectibles.map(collectible => ({
            x: collectible.x * GAME_CONSTANTS.TILE_SIZE,
            y: collectible.y * GAME_CONSTANTS.TILE_SIZE,
            type: collectible.type,
            collected: false
        }));

        return true;
    }

    getTileAt(x, y) {
        if (x < 0 || x >= GAME_CONSTANTS.GRID_SIZE || y < 0 || y >= GAME_CONSTANTS.GRID_SIZE) {
            return { type: 1 }; // Return solid wall for out of bounds
        }
        return this.grid[y][x];
    }

    damageWall(x, y, damage) {
        const tile = this.getTileAt(x, y);
        if (tile && (tile.type === 2 || tile.type === '!')) { // Handle both destructible wall and lava
            tile.health -= damage * 100; // Convert to percentage
            if (tile.health <= 0) {
                tile.type = 0; // Convert to empty space
                return true;
            }
        }
        return false;
    }

    addDynamite(x, y, velocityX, velocityY) {
        this.dynamites.push({
            x, y,
            velocityX, velocityY,
            timer: GAME_CONSTANTS.WEAPONS.DYNAMITE_TIMER
        });
    }

    updateDynamites(deltaTime) {
        for (let i = this.dynamites.length - 1; i >= 0; i--) {
            const dynamite = this.dynamites[i];
            
            // Update position
            dynamite.x += dynamite.velocityX;
            dynamite.y += dynamite.velocityY;
            dynamite.velocityY += GAME_CONSTANTS.PHYSICS.GRAVITY;

            // Check collision with walls
            const tileX = Math.floor(dynamite.x / GAME_CONSTANTS.TILE_SIZE);
            const tileY = Math.floor(dynamite.y / GAME_CONSTANTS.TILE_SIZE);
            const tile = this.getTileAt(tileX, tileY);

            if (tile && tile.type !== 0) {
                // Explode on contact with walls
                this.explode(dynamite.x, dynamite.y);
                this.dynamites.splice(i, 1);
                continue;
            }

            // Update timer
            dynamite.timer -= deltaTime;
            if (dynamite.timer <= 0) {
                this.explode(dynamite.x, dynamite.y);
                this.dynamites.splice(i, 1);
            }
        }
    }

    explode(x, y) {
        const tileX = Math.floor(x / GAME_CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / GAME_CONSTANTS.TILE_SIZE);
        const radius = GAME_CONSTANTS.WEAPONS.EXPLOSION_RADIUS;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    this.damageWall(tileX + dx, tileY + dy, 100);
                }
            }
        }
    }

    collectCollectible(x, y) {
        const collectible = this.collectibles.find(c => 
            !c.collected &&
            Math.abs(c.x - x) < GAME_CONSTANTS.TILE_SIZE &&
            Math.abs(c.y - y) < GAME_CONSTANTS.TILE_SIZE
        );

        if (collectible) {
            collectible.collected = true;
            return true;
        }
        return false;
    }

    isLevelComplete() {
        return this.collectibles.every(collectible => collectible.collected);
    }
}
