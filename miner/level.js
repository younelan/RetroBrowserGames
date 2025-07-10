class Level {
    constructor(levelData) {
        this.map = levelData.map;
        this.name = levelData.name;
        this.viewportWidth = levelData.viewportWidth || 32;
        this.viewportHeight = levelData.viewportHeight || 16;
        this.platforms = [];
        this.keys = [];
        this.enemies = [];
        this.hazards = [];
        this.crumblingPlatforms = [];
        this.brickFloors = [];
        this.dirtFloors = [];
        this.grassFloors = [];
        this.grassCrumbleFloors = [];
        this.redSandFloors = [];
        this.redSandCrumbleFloors = [];
        this.movingLeftFloors = [];
        this.movingRightFloors = [];
        this.decorativeElements = [];
        this.portal = null;
        this.playerStart = { x: 0, y: 0 };

        // Viewport scrolling properties
        this.scrollX = 0;
        this.scrollY = 0;

        // Calculate actual level dimensions
        this.mapRows = this.map.trim().split('\n');
        this.levelWidth = this.mapRows[0].length;
        this.levelHeight = this.mapRows.length;

        // Unified platform arrays based on TILE_ATTRIBUTES
        this.allPlatforms = []; // All platforms regardless of type
        this.solidPlatforms = []; // All solid platforms (isPlatform && !isMoving)
        this.movingPlatforms = []; // All moving platforms (isPlatform && isMoving)
        this.crumblePlatforms = []; // All crumbling platforms (isCrumble)

        // Store map rows for checking adjacent tiles
        this.mapRows = this.map.trim().split('\n');

        // Ensure spiders are initialized properly in the constructor
        this.spiders = this.spiders || [];

        // Load background color, image, and oxygen level from levelData
        this.backgroundColor = levelData.backgroundColor || DEFAULT_BACKGROUND_COLOR; // Use default background color
        this.background = levelData.background || null; // Default to no image
        this.oxygenLevel = levelData.oxygenLevel || START_OXYGEN; // Default oxygen level

        this.parseMap();
    }

    // Helper method to check if a tile position is empty (space or out of bounds)
    isEmptyTile(x, y) {
        if (y < 0 || y >= this.mapRows.length) return true;
        if (x < 0 || x >= this.mapRows[y].length) return true;
        return this.mapRows[y][x] === ' ';
    }

    parseMap() {
        const mapRows = this.map.trim().split('\n');
        for (let y = 0; y < mapRows.length; y++) {
            for (let x = 0; x < mapRows[y].length; x++) {
                const char = mapRows[y][x];
                const worldX = x * TILE_SIZE;
                const worldY = y * TILE_SIZE;
                const tileAttr = TILE_ATTRIBUTES[char];

                if (!tileAttr) continue; // Skip unknown tiles

                // Create platform object if it's a platform
                if (tileAttr.isPlatform) {
                    const platform = { 
                        x: worldX, 
                        y: worldY, 
                        width: TILE_SIZE, 
                        height: TILE_SIZE, 
                        type: char,
                        decay: tileAttr.isCrumble ? 0 : undefined
                    };

                    // Add to appropriate arrays
                    this.allPlatforms.push(platform);
                    
                    if (tileAttr.isCrumble) {
                        this.crumblePlatforms.push(platform);
                        this.crumblingPlatforms.push(platform); // Keep for backward compatibility
                    } else if (tileAttr.isMoving) {
                        this.movingPlatforms.push(platform);
                        if (tileAttr.moveDirection === -1) {
                            this.movingLeftFloors.push(platform); // Keep for backward compatibility
                        } else if (tileAttr.moveDirection === 1) {
                            this.movingRightFloors.push(platform); // Keep for backward compatibility
                        }
                    } else {
                        this.solidPlatforms.push(platform);
                    }

                    // Keep legacy arrays for rendering
                    switch (char) {
                        case 'X':
                            this.platforms.push(platform);
                            break;
                        case 'B':
                            this.brickFloors.push(platform);
                            break;
                        case 'D':
                            this.dirtFloors.push(platform);
                            break;
                        case 'G':
                            this.grassFloors.push(platform);
                            break;
                        case 'M':
                            this.grassCrumbleFloors.push(platform);
                            break;
                        case 'Q':
                            this.redSandFloors.push(platform);
                            break;
                        case 'W':
                            this.redSandCrumbleFloors.push(platform);
                            break;
                        case 'C':
                            // Already handled above
                            break;
                        case 'L':
                            // Already handled above
                            break;
                        case 'R':
                            // Already handled above
                            break;
                    }
                }

                // Handle ALL tiles (both platform and non-platform)
                switch (char) {
                    case '@':
                        this.playerStart = { x: worldX, y: worldY };
                        break;
                    case 'K':
                        this.keys.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                    case 'P':
                        this.portal = { x: worldX, y: worldY - TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2, type: char };
                        break;
                    case 'E':
                        this.enemies.push(new HorizontalEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'V':
                        this.enemies.push(new VerticalEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'Z':
                        this.enemies.push(new ComplexEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'J':
                        this.enemies.push(new GooseEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'A':
                        this.enemies.push(new SealEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'I':
                        this.hazards.push(new Hazard(worldX, worldY, 'SPIKES'));
                        break;
                    case 'F':
                        this.hazards.push(new Hazard(worldX, worldY, 'FIRE'));
                        break;
                    case '%':
                        this.decorativeElements.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: 'SHRUB' });
                        break;
                    case 'T':
                        this.decorativeElements.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                    case 'Y': // Tall tree (2 tiles high)
                        this.decorativeElements.push({ x: worldX, y: worldY - TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2, type: char });
                        break;
                    case 'U': // Tall cactus (2 tiles high)
                        this.decorativeElements.push({ x: worldX, y: worldY - TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2, type: char });
                        break;
                }
            }
        }
    }

    // Update viewport scrolling to follow the player
    updateViewport(playerX, playerY) {
        // Calculate viewport size in world coordinates
        const viewportWorldWidth = this.viewportWidth * TILE_SIZE;
        const viewportWorldHeight = this.viewportHeight * TILE_SIZE;
        
        // Calculate level size in world coordinates
        const levelWorldWidth = this.levelWidth * TILE_SIZE;
        const levelWorldHeight = this.levelHeight * TILE_SIZE;
        
        // Only scroll if viewport is smaller than level
        if (viewportWorldWidth < levelWorldWidth) {
            // Center the viewport on the player horizontally
            this.scrollX = playerX - viewportWorldWidth / 2;
            
            // Clamp scroll to level boundaries
            this.scrollX = Math.max(0, Math.min(this.scrollX, levelWorldWidth - viewportWorldWidth));
        } else {
            this.scrollX = 0;
        }
        
        if (viewportWorldHeight < levelWorldHeight) {
            // Center the viewport on the player vertically
            this.scrollY = playerY - viewportWorldHeight / 2;
            
            // Clamp scroll to level boundaries
            this.scrollY = Math.max(0, Math.min(this.scrollY, levelWorldHeight - viewportWorldHeight));
        } else {
            this.scrollY = 0;
        }
    }

    draw(context, frameCounter, allKeysCollected) {
        // Ensure background color covers all tiles
        if (this.backgroundColor) {
            context.fillStyle = this.backgroundColor;
            context.fillRect(0, 0, this.levelWidth * TILE_SIZE, this.levelHeight * TILE_SIZE);
        }

        // Render background image if specified
        if (this.background) {
            const backgroundImage = document.getElementById(this.background);
            if (backgroundImage) {
                context.drawImage(backgroundImage, 0, 0, this.levelWidth * TILE_SIZE, this.levelHeight * TILE_SIZE);
            }
        }

        const s = TILE_SIZE / 16; // Scale factor for drawing details (moved to top)

        // Draw background image if specified
        if (this.background) {
            const backgroundImage = document.getElementById(this.background);
            if (backgroundImage) {
                context.drawImage(backgroundImage, 0, 0, this.viewportWidth * TILE_SIZE, this.viewportHeight * TILE_SIZE);
            }
        }

        this.platforms.forEach(p => {
            context.fillStyle = '#888';
            context.fillRect(p.x, p.y, p.width, p.height);
        });

        // Draw keys
        this.keys.forEach(k => {
            context.save(); // Save current context state

            // Translate to the center of the key's tile for rotation
            const centerX = k.x + k.width / 2;
            const centerY = k.y + k.height / 2;
            context.translate(centerX, centerY);

            // Rotate by -90 degrees (counter-clockwise) to make a vertical key appear horizontal
            context.rotate(-Math.PI / 2);

            // Translate back so that drawing coordinates are relative to the top-left of the key's *original* bounding box
            // This means (0,0) is now the top-left of the key's tile, but the canvas is rotated.
            context.translate(-k.width / 2, -k.height / 2);

            context.fillStyle = 'gold';
            const s = k.width / 16; // Scale factor for a 16x16 sprite

            // Key Bow (circular outline)
            context.beginPath();
            context.arc(8 * s, 4 * s, 4 * s, 0, Math.PI * 2); // Center at (8s, 4s), radius 4s
            context.strokeStyle = 'gold';
            context.lineWidth = 2;
            context.stroke();

            // Key Shaft (rectangle)
            context.fillStyle = 'gold';
            context.fillRect(7.5 * s, 8 * s, 1 * s, 8 * s); // From (7.5s, 8s), width 1s, height 8s

            // Key Bit (teeth)
            context.fillRect(6 * s, 14 * s, 1 * s, 2 * s); // Left tooth
            context.fillRect(9 * s, 14 * s, 1 * s, 2 * s); // Right tooth

            context.restore(); // Restore context to original state
        });

        // Draw portal
        if (this.portal) {
            if (allKeysCollected) {
                // Beautiful open door - ornate stone archway
                const portalX = this.portal.x;
                const portalY = this.portal.y;
                const portalW = this.portal.width;
                const portalH = this.portal.height;
                
                // Stone archway frame with 3D effect
                context.fillStyle = '#8B7355'; // Light stone
                context.fillRect(portalX, portalY, portalW, 6); // Top thick border
                context.fillRect(portalX, portalY + portalH - 6, portalW, 6); // Bottom thick border
                context.fillRect(portalX, portalY, 6, portalH); // Left thick border
                context.fillRect(portalX + portalW - 6, portalY, 6, portalH); // Right thick border
                
                // Inner stone detail
                context.fillStyle = '#A0896B'; // Lighter stone
                context.fillRect(portalX + 6, portalY + 6, portalW - 12, 3); // Top inner
                context.fillRect(portalX + 6, portalY + portalH - 9, portalW - 12, 3); // Bottom inner
                context.fillRect(portalX + 6, portalY + 6, 3, portalH - 12); // Left inner
                context.fillRect(portalX + portalW - 9, portalY + 6, 3, portalH - 12); // Right inner
                
                // Stone shadows for depth
                context.fillStyle = '#6B5D42'; // Dark stone shadow
                context.fillRect(portalX + 3, portalY + 3, portalW - 6, 3); // Top shadow
                context.fillRect(portalX + 3, portalY + 3, 3, portalH - 6); // Left shadow
                
                // Mystical glow effect inside the portal
                const time = Date.now() * 0.003;
                const glowIntensity = Math.sin(time) * 0.3 + 0.7;
                context.fillStyle = `rgba(0, 255, 150, ${glowIntensity * 0.3})`;
                context.fillRect(portalX + 9, portalY + 9, portalW - 18, portalH - 18);
                
                // Sparkling particles
                for (let i = 0; i < 5; i++) {
                    const sparkleX = portalX + 12 + (Math.sin(time + i) * 0.5 + 0.5) * (portalW - 24);
                    const sparkleY = portalY + 12 + (Math.cos(time * 1.3 + i * 1.7) * 0.5 + 0.5) * (portalH - 24);
                    const sparkleSize = Math.sin(time * 2 + i * 2) * 1 + 2;
                    
                    context.fillStyle = '#FFFFFF';
                    context.fillRect(sparkleX, sparkleY, sparkleSize, sparkleSize);
                }

            } else {
                // Beautiful closed door - ornate medieval style
                const portalX = this.portal.x;
                const portalY = this.portal.y;
                const portalW = this.portal.width;
                const portalH = this.portal.height;
                
                // Main door body with wood grain effect
                context.fillStyle = '#8B4513'; // Dark wood
                context.fillRect(portalX, portalY, portalW, portalH);
                
                // Wood grain lines
                context.fillStyle = '#654321'; // Darker wood
                for (let i = 0; i < 4; i++) {
                    const grainY = portalY + (i + 1) * (portalH / 5);
                    context.fillRect(portalX + 2, grainY, portalW - 4, 2);
                }
                
                // Vertical wood planks
                context.fillStyle = '#A0522D'; // Medium wood
                context.fillRect(portalX + portalW / 3, portalY, 3, portalH);
                context.fillRect(portalX + (portalW * 2 / 3), portalY, 3, portalH);
                
                // Metal reinforcements
                context.fillStyle = '#404040'; // Dark metal
                context.fillRect(portalX + 4, portalY + 8, portalW - 8, 4); // Top reinforcement
                context.fillRect(portalX + 4, portalY + portalH - 12, portalW - 8, 4); // Bottom reinforcement
                context.fillRect(portalX + 4, portalY + portalH/2 - 2, portalW - 8, 4); // Middle reinforcement
                
                // Metal studs/bolts
                context.fillStyle = '#606060'; // Light metal
                const studPositions = [
                    [portalX + 8, portalY + 10],
                    [portalX + portalW - 12, portalY + 10],
                    [portalX + 8, portalY + portalH/2],
                    [portalX + portalW - 12, portalY + portalH/2],
                    [portalX + 8, portalY + portalH - 14],
                    [portalX + portalW - 12, portalY + portalH - 14]
                ];
                
                studPositions.forEach(([x, y]) => {
                    context.beginPath();
                    context.arc(x, y, 2, 0, Math.PI * 2);
                    context.fill();
                });
                
                // Ornate door handle
                context.fillStyle = '#FFD700'; // Gold
                const handleX = portalX + portalW * 0.75;
                const handleY = portalY + portalH * 0.5;
                context.beginPath();
                context.arc(handleX, handleY, 5, 0, Math.PI * 2);
                context.fill();
                
                // Handle highlight
                context.fillStyle = '#FFFF99'; // Bright gold
                context.beginPath();
                context.arc(handleX - 1, handleY - 1, 2, 0, Math.PI * 2);
                context.fill();
                
                // Keyhole
                context.fillStyle = '#000000';
                context.beginPath();
                context.arc(handleX, handleY, 2, 0, Math.PI * 2);
                context.fill();
                context.fillRect(handleX - 1, handleY, 2, 4); // Keyhole slot
                
                // Door frame shadow
                context.fillStyle = 'rgba(0, 0, 0, 0.3)';
                context.fillRect(portalX - 2, portalY - 2, 2, portalH + 4); // Left shadow
                context.fillRect(portalX, portalY - 2, portalW, 2); // Top shadow
            }
        }

        // Draw hazards
        this.hazards.forEach(h => h.draw(context, frameCounter));

        // Draw crumbling platforms with dirt-like appearance (noticeably darker than dirt)
        this.crumblingPlatforms.forEach(p => {
                const decayProgress = p.decay / 30; // Normalize decay to 0-1
                const currentHeight = p.height * (1 - decayProgress); // Ensure currentHeight is defined
                const currentY = p.y + (p.height - currentHeight);

                // Always draw like dirt but with darker brown colors, even while decaying
                context.save();
                context.beginPath();
                
                // Start from top-left corner (adjusted for decay)
                context.moveTo(p.x, currentY);
                // Top edge (straight)
                context.lineTo(p.x + p.width, currentY);
                // Right edge down to jagged bottom area
                context.lineTo(p.x + p.width, p.y + p.height - 8);

                // Create natural jagged bottom edge - exactly like dirt tile
                const pointSpacing = 1;
                const numPoints = Math.floor(p.width / pointSpacing);

                // Generate jagged points from right to left using GLOBAL position for seamless tiles
                for (let i = numPoints; i >= 0; i--) {
                    const globalX = p.x + (i * pointSpacing);
                    const globalY = p.y; 
                    const variation1 = Math.sin(globalX * 0.08 + globalY * 0.05) * 6;
                    const variation2 = Math.sin(globalX * 0.15 + globalY * 0.08) * 4;
                    const variation3 = Math.sin(globalX * 0.3 + globalY * 0.12) * 3;
                    const variation4 = Math.sin(globalX * 0.6 + globalY * 0.2) * 2;
                    const totalVariation = variation1 + variation2 + variation3 + variation4;
                    const y = p.y + p.height - 8 + totalVariation;
                    context.lineTo(globalX, y);
                }

                // Left edge back to start (adjusted for decay)
                context.lineTo(p.x, currentY);
                context.closePath();
                context.clip();

                // Base crumble color (much darker than dirt for easy distinction)
                context.fillStyle = '#2A1F15'; // Much darker earth brown than dirt (#4A3B28)
                context.fillRect(p.x, currentY, p.width, currentHeight);

                // Create patchy surface with much darker browns (same logic as dirt)
                for (let patch = 0; patch < 20; patch++) {
                    const globalTileX = Math.floor(p.x / TILE_SIZE); // Define globalTileX
                    const globalTileY = Math.floor(p.y / TILE_SIZE); // Define globalTileY
                    const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
                    const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                    
                    const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; // Extend beyond tile
                    const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
                    const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                    const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                    
                    const patchX = p.x - 8 + Math.floor(patchRandX * (p.width + 16));
                    const patchY = currentY + Math.floor(patchRandY * 8); // Adjust for current height
                    const patchWidth = Math.floor(patchRandSize * 12) + 4;
                    const patchHeight = Math.floor(patchRandSize * 6) + 2;
                    
                    // Only draw patch if it's within the current visible area
                    if (patchY >= currentY && patchY + patchHeight <= currentY + currentHeight) {
                        // Much darker versions of dirt patch colors
                        if (patchRandColor < 0.3) {
                            context.fillStyle = '#0F0A08'; // Much darker version of #2A241D
                        } else if (patchRandColor < 0.7) {
                            context.fillStyle = '#1A1A1A'; // Much darker version of #444444
                        } else {
                            context.fillStyle = '#050505'; // Much darker version of #1A1A1A
                        }
                        
                        context.fillRect(patchX, patchY, patchWidth, patchHeight);
                    }
                }

                context.restore();
            });

        // Draw brick floors with small brick pattern
        this.brickFloors.forEach(b => {
            // Base brick color (mortar background)
            context.fillStyle = '#5A2C0B'; // Dark brown mortar
            context.fillRect(b.x, b.y, b.width, b.height);
            
            // Draw individual small bricks to fill entire tile
            const brickWidth = 7;
            const brickHeight = 3;
            const mortarGap = 1;
            
            context.fillStyle = '#CD853F'; // Lighter brick color
            
            // Calculate how many rows we need to fill the height
            const rowHeight = brickHeight + mortarGap;
            const numRows = Math.ceil(b.height / rowHeight);
            
            for (let row = 0; row < numRows; row++) {
                const rowY = b.y + row * rowHeight;
                
                // Alternate offset for staggered pattern
                const isEvenRow = row % 2 === 0;
                const startX = isEvenRow ? 0 : -(brickWidth + mortarGap) / 2;
                
                // Draw bricks across the width
                for (let x = startX; x < b.width; x += brickWidth + mortarGap) {
                    const brickX = b.x + x;
                    
                    // Only draw if brick is within the tile bounds
                    if (brickX >= b.x && brickX + brickWidth <= b.x + b.width && 
                        rowY >= b.y && rowY + brickHeight <= b.y + b.height) {
                        context.fillRect(brickX, rowY, brickWidth, brickHeight);
                    }
                    // Handle partial bricks at edges
                    else if (brickX < b.x + b.width && brickX + brickWidth > b.x && 
                            rowY >= b.y && rowY + brickHeight <= b.y + b.height) {
                        const clippedX = Math.max(brickX, b.x);
                        const clippedWidth = Math.min(brickX + brickWidth, b.x + b.width) - clippedX;
                        if (clippedWidth > 0) {
                            context.fillRect(clippedX, rowY, clippedWidth, brickHeight);
                        }
                    }
                }
            }
        });

        // Draw dirt floors with patchy surface and jagged bottom edge
        this.dirtFloors.forEach(d => {
            // Create clipping path for dirt shape with jagged bottom
            context.save();
            context.beginPath();
            
            // Start from top-left corner
            context.moveTo(d.x, d.y);
            // Top edge (straight)
            context.lineTo(d.x + d.width, d.y);
            // Right edge down to jagged bottom area
            context.lineTo(d.x + d.width, d.y + d.height - 8);
            
            // Create natural jagged bottom edge - much more jagged and irregular
            const pointSpacing = 1; // Smaller spacing for more detailed jagged edge
            const numPoints = Math.floor(d.width / pointSpacing);
            
            // Generate jagged points from right to left using GLOBAL position for seamless tiles
            for (let i = numPoints; i >= 0; i--) {
                const globalX = d.x + (i * pointSpacing); // Use global coordinate
                // Create much more dramatic jagged variation
                const globalY = d.y; 
                const variation1 = Math.sin(globalX * 0.08 + globalY * 0.05) * 6; // Bigger, faster variation
                const variation2 = Math.sin(globalX * 0.15 + globalY * 0.08) * 4; // Medium spikes
                const variation3 = Math.sin(globalX * 0.3 + globalY * 0.12) * 3;  // Small details
                const variation4 = Math.sin(globalX * 0.6 + globalY * 0.2) * 2;   // Fine texture
                const totalVariation = variation1 + variation2 + variation3 + variation4;
                const y = d.y + d.height - 8 + totalVariation; // Much more jagged variation
                context.lineTo(globalX, y);
            }
            
            // Left edge back to start
            context.lineTo(d.x, d.y);
            context.closePath();
            context.clip();
            
            // Now fill the dirt within the clipped area
            // Base dirt color (dark brown)
            context.fillStyle = '#4A3B28'; // Dark earth brown
            context.fillRect(d.x, d.y, d.width, d.height);
            
            // Create patchy, uneven dirt surface - use GLOBAL pixel coordinates, not tile boundaries
            const globalTileX = d.x / TILE_SIZE;
            const globalTileY = d.y / TILE_SIZE;
            
            // Add multiple patches of different dirt colors - draw patches that extend beyond tile boundaries
            for (let patch = 0; patch < 15; patch++) {
                // Use global coordinates and allow patches to span across tile boundaries
                const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7; // Global patch position
                const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; // Extend beyond tile
                const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                
                // Allow patches to start before tile and extend beyond tile boundaries
                const patchX = d.x - 8 + Math.floor(patchRandX * (d.width + 16)); // Extend 8px on each side
                const patchY = d.y + Math.floor(patchRandY * 8); // Only in top area
                const patchWidth = Math.floor(patchRandSize * 12) + 4; // 4-15 pixels wide
                const patchHeight = Math.floor(patchRandSize * 6) + 2; // 2-7 pixels high
                
                // Vary the dirt color for patches
                if (patchRandColor < 0.3) {
                    context.fillStyle = '#524135'; // Medium dirt
                } else if (patchRandColor < 0.6) {
                    context.fillStyle = '#5A4A3D'; // Lighter dirt
                } else {
                    context.fillStyle = '#3F342A'; // Darker dirt
                }
                
                // Draw patch (clipping will handle boundaries)
                context.fillRect(patchX, patchY, patchWidth, patchHeight);
            }
            
            // Add larger, more visible rocks/stones - also allow them to span tile boundaries
            for (let i = 0; i < 8; i++) {
                // Use global coordinates for rocks, allow them to span across tiles
                const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
                const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
                
                const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5; // Extend beyond tile
                const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.7 + 0.3;
                const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
                const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
                
                // Allow rocks to start before tile and extend beyond tile boundaries
                const rockX = d.x - 6 + Math.floor(pseudoRandX * (d.width + 12)); // Extend 6px on each side
                const currentHeight = d.height; // Define currentHeight for dirt floors
                const rockY = d.y + 4 + Math.floor(pseudoRandY * (currentHeight - 16)); // Adjust for current height
                const rockSize = Math.floor(pseudoRandSize * 5) + 3; // 3-7 pixel rocks
                
                // Vary rock colors - darker browns and grays
                if (pseudoRandColor < 0.4) {
                    context.fillStyle = '#3A2F2A'; // Dark brown
                } else if (pseudoRandColor < 0.7) {
                    context.fillStyle = '#4A3B35'; // Medium brown
                } else {
                    context.fillStyle = '#5A4A45'; // Lighter brown
                }
                
                // Draw rock (clipping will handle boundaries)
                context.fillRect(rockX, rockY, rockSize, rockSize);
            }
            
            context.restore();
        });

        // Draw grass floors (dirt base with green grass on top)
        this.grassFloors.forEach(g => {
            // Create clipping path for dirt shape with jagged bottom edge (same as dirt)
            context.save();
            context.beginPath();
            
            // Start from top-left corner
            context.moveTo(g.x, g.y);
            // Top edge (straight)
            context.lineTo(g.x + g.width, g.y);
            // Right edge down to jagged bottom area
            context.lineTo(g.x + g.width, g.y + g.height - 8);
            
            // Create natural jagged bottom edge - same as dirt
            const pointSpacing = 1;
            const numPoints = Math.floor(g.width / pointSpacing);
            
            // Generate jagged points from right to left using GLOBAL position for seamless tiles
            for (let i = numPoints; i >= 0; i--) {
                const globalX = g.x + (i * pointSpacing);
                const globalY = g.y; 
                const variation1 = Math.sin(globalX * 0.08 + globalY * 0.05) * 6;
                const variation2 = Math.sin(globalX * 0.15 + globalY * 0.08) * 4;
                const variation3 = Math.sin(globalX * 0.3 + globalY * 0.12) * 3;
                const variation4 = Math.sin(globalX * 0.6 + globalY * 0.2) * 2;
                const totalVariation = variation1 + variation2 + variation3 + variation4;
                const y = g.y + g.height - 8 + totalVariation;
                context.lineTo(globalX, y);
            }
            
            // Left edge back to start
            context.lineTo(g.x, g.y);
            context.closePath();
            context.clip();
            
            // Draw dirt base (same as dirt tiles)
            context.fillStyle = '#4A3B28'; // Dark earth brown
            context.fillRect(g.x, g.y, g.width, g.height);
            
            // Create patchy, uneven dirt surface (same as dirt)
            const globalTileX = g.x / TILE_SIZE;
            const globalTileY = g.y / TILE_SIZE;
            
            // Add dirt patches (same as dirt tiles)
            for (let patch = 0; patch < 15; patch++) {
                const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
                const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; // Extend beyond tile
                const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                
                const patchX = g.x - 8 + Math.floor(patchRandX * (g.width + 16));
                const patchY = g.y + Math.floor(patchRandY * 8); // Only in top area
                const patchWidth = Math.floor(patchRandSize * 12) + 4; // 4-15 pixels wide
                const patchHeight = Math.floor(patchRandSize * 6) + 2; // 2-7 pixels high
                
                // Vary the dirt color for patches
                if (patchRandColor < 0.3) {
                    context.fillStyle = '#524135'; // Medium dirt
                } else if (patchRandColor < 0.6) {
                    context.fillStyle = '#5A4A3D'; // Lighter dirt
                } else {
                    context.fillStyle = '#3F342A'; // Darker dirt
                }
                
                // Draw patch (clipping will handle boundaries)
                context.fillRect(patchX, patchY, patchWidth, patchHeight);
            }
            
            // Add larger, more visible rocks/stones - also allow them to span tile boundaries
            for (let i = 0; i < 8; i++) {
                // Use global coordinates for rocks, allow them to span across tiles
                const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
                const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
                
                const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5; // Extend beyond tile
                const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.7 + 0.3;
                const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
                const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
                
                // Allow rocks to start before tile and extend beyond tile boundaries
                const rockX = g.x - 6 + Math.floor(pseudoRandX * (g.width + 12)); // Extend 6px on each side
                const currentHeight = g.height; // Define currentHeight for dirt floors
                const rockY = g.y + 4 + Math.floor(pseudoRandY * (currentHeight - 16)); // Adjust for current height
                const rockSize = Math.floor(pseudoRandSize * 5) + 3; // 3-7 pixel rocks
                
                // Vary rock colors - darker browns and grays
                if (pseudoRandColor < 0.4) {
                    context.fillStyle = '#3A2F2A'; // Dark brown
                } else if (pseudoRandColor < 0.7) {
                    context.fillStyle = '#4A3B35'; // Medium brown
                } else {
                    context.fillStyle = '#5A4A45'; // Lighter brown
                }
                
                // Draw rock (clipping will handle boundaries)
                context.fillRect(rockX, rockY, rockSize, rockSize);
            }
            
            // Now add the grass layer on top (top quarter of the tile)
            const grassHeight = Math.floor(g.height / 4); // Top quarter
            
            // Create jagged grass top edge
            context.beginPath();
            context.moveTo(g.x, g.y);
            
            // Create jagged grass edge on top
            for (let i = 0; i <= numPoints; i++) {
                const globalX = g.x + (i * pointSpacing);
                const globalY = g.y;
                // Different variation pattern for grass edge
                const grassVar1 = Math.sin(globalX * 0.12 + globalY * 0.07) * 3;
                const grassVar2 = Math.sin(globalX * 0.25 + globalY * 0.15) * 2;
                const grassVar3 = Math.sin(globalX * 0.45 + globalY * 0.25) * 1.5;
                const totalGrassVar = grassVar1 + grassVar2 + grassVar3;
                const y = g.y + grassHeight + totalGrassVar;
                context.lineTo(globalX, y);
            }
            
            // Complete the grass area
            context.lineTo(g.x + g.width, g.y);
            context.lineTo(g.x, g.y);
            context.closePath();
            
            // Fill with green grass color
            context.fillStyle = '#4A7C59'; // Medium green
            context.fill();
            
            // Add grass texture patches
            for (let patch = 0; patch < 20; patch++) {
                const globalPatchX = (globalTileX * 53 + globalTileY * 37 + patch * 11) % 9;
                const globalPatchY = (globalTileX * 29 + globalTileY * 43 + patch * 19) % 3;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.7) * 0.8 + 0.5;
                const patchRandY = Math.sin(globalPatchY + patch * 4.3) * 0.5 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 23 + globalTileY * 31 + patch * 5.7) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 41 + globalTileY * 47 + patch * 7.1) * 0.5 + 0.5;
                
                const patchX = g.x - 6 + Math.floor(patchRandX * (g.width + 12));
                const patchY = g.y + Math.floor(patchRandY * grassHeight);
                const patchWidth = Math.floor(patchRandSize * 8) + 2;
                const patchHeight = Math.floor(patchRandSize * 4) + 1;
                
                // Vary the grass color for patches
                if (patchRandColor < 0.3) {
                    context.fillStyle = '#3E6B4A'; // Darker green
                } else if (patchRandColor < 0.6) {
                    context.fillStyle = '#5A8C69'; // Lighter green
                } else {
                    context.fillStyle = '#567A61'; // Medium-dark green
                }
                
                context.fillRect(patchX, patchY, patchWidth, patchHeight);
            }
            
            // Add small individual grass blades for detail
            for (let blade = 0; blade < 25; blade++) {
                const globalBladeX = (globalTileX * 61 + globalTileY * 67 + blade * 13) % 13;
                const globalBladeY = (globalTileX * 71 + globalTileY * 73 + blade * 17) % 5;
                
                const bladeRandX = Math.sin(globalBladeX + blade * 3.1) * 0.9 + 0.5;
                const bladeRandY = Math.sin(globalBladeY + blade * 4.9) * 0.8 + 0.5;
                const bladeRandHeight = Math.sin(globalTileX * 79 + globalTileY * 83 + blade * 6.3) * 0.5 + 0.5;
                
                const bladeX = g.x - 4 + Math.floor(bladeRandX * (g.width + 8));
                const bladeY = g.y + Math.floor(bladeRandY * (grassHeight - 2));
                const bladeHeight = Math.floor(bladeRandHeight * 3) + 1;
                
                // Bright green for individual blades
                context.fillStyle = '#6B9A7A';
                context.fillRect(bladeX, bladeY, 1, bladeHeight);
            }
            
            context.restore();
        });

        // Draw grass crumble floors (darker dirt base with green grass on top, crumbles like C)
        this.grassCrumbleFloors.forEach(m => {
            // Create clipping path for dirt shape with jagged bottom edge (same as dirt/grass)
            context.save();
            context.beginPath();
            
            // Start from top-left corner
            context.moveTo(m.x, m.y);
            // Top edge (straight)
            context.lineTo(m.x + m.width, m.y);
            // Right edge down to jagged bottom area
            context.lineTo(m.x + m.width, m.y + m.height - 8);
            
            // Create natural jagged bottom edge - same as dirt/grass
            const pointSpacing = 1;
            const numPoints = Math.floor(m.width / pointSpacing);
            
            // Generate jagged points from right to left using GLOBAL position for seamless tiles
            for (let i = numPoints; i >= 0; i--) {
                const globalX = m.x + (i * pointSpacing);
                const globalY = m.y; 
                const variation1 = Math.sin(globalX * 0.08 + globalY * 0.05) * 6;
                const variation2 = Math.sin(globalX * 0.15 + globalY * 0.08) * 4;
                const variation3 = Math.sin(globalX * 0.3 + globalY * 0.12) * 3;
                const variation4 = Math.sin(globalX * 0.6 + globalY * 0.2) * 2;
                const totalVariation = variation1 + variation2 + variation3 + variation4;
                const y = m.y + m.height - 8 + totalVariation;
                context.lineTo(globalX, y);
            }
            
            // Left edge back to start
            context.lineTo(m.x, m.y);
            context.closePath();
            context.clip();
            
            // Handle crumbling effect (similar to C tile but preserve grass appearance)
            const crumbleProgress = m.decay > 0 ? m.decay / 30 : 0;
            const crumbleHeight = Math.floor(crumbleProgress * m.height);
            
            // Draw darker dirt base (darker than regular dirt for crumble effect)
            context.fillStyle = '#3A2E1F'; // Much darker earth brown
            context.fillRect(m.x, m.y + crumbleHeight, m.width, m.height - crumbleHeight);
            
            // Create patchy, uneven dirt surface (same as dirt/grass but darker)
            const globalTileX = m.x / TILE_SIZE;
            const globalTileY = m.y / TILE_SIZE;
            
            // Add darker dirt patches 
            for (let patch = 0; patch < 15; patch++) {
                const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
                const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5;
                const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                
                const patchX = m.x - 8 + Math.floor(patchRandX * (m.width + 16));
                const patchY = m.y + crumbleHeight + 8 + Math.floor(patchRandY * 6);
                const patchWidth = Math.floor(patchRandSize * 12) + 4;
                const patchHeight = Math.floor(patchRandSize * 6) + 2;
                
                // Only draw if below crumble line
                if (patchY >= m.y + crumbleHeight) {
                    // Vary the darker dirt color for patches
                    if (patchRandColor < 0.3) {
                        context.fillStyle = '#423026'; // Medium dark dirt
                    } else if (patchRandColor < 0.6) {
                        context.fillStyle = '#4A3A2D'; // Lighter dark dirt
                    } else {
                        context.fillStyle = '#2F241A'; // Darker dirt
                    }
                    
                    context.fillRect(patchX, patchY, patchWidth, patchHeight);
                }
            }
            
            // Add darker rocks
            for (let i = 0; i < 8; i++) {
                const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
                const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
                
                const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5;
                const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.7 + 0.3;
                const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
                const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
                
                const rockX = m.x - 6 + Math.floor(pseudoRandX * (m.width + 12));
                const rockY = m.y + crumbleHeight + 8 + Math.floor(pseudoRandY * (m.height - crumbleHeight - 8));
                const rockSize = Math.floor(pseudoRandSize * 5) + 3;
                
                // Only draw if below crumble line
                if (rockY >= m.y + crumbleHeight) {
                    // Vary rock colors - even darker
                    if (pseudoRandColor < 0.4) {
                        context.fillStyle = '#1A140D'; // Very dark brown
                    } else if (pseudoRandColor < 0.7) {
                        context.fillStyle = '#2A2A2A'; // Dark gray
                    } else {
                        context.fillStyle = '#0A0A0A'; // Almost black
                    }
                    
                    context.fillRect(rockX, rockY, rockSize, rockSize);
                    if (rockSize >= 4) {
                        context.fillRect(rockX + 1, rockY - 1, rockSize - 2, 1);
                        context.fillRect(rockX - 1, rockY + 1, 1, rockSize - 2);
                        context.fillRect(rockX + rockSize, rockY + 2, 1, rockSize - 3);
                    }
                }
            }
            
            // Add the grass layer on top (top quarter of remaining tile)
            const remainingHeight = m.height - crumbleHeight;
            const grassHeight = Math.floor(remainingHeight / 4);
            
            if (grassHeight > 0 && remainingHeight > 0) {
                // Create jagged grass top edge
                context.beginPath();
                context.moveTo(m.x, m.y + crumbleHeight);
                
                // Create jagged grass edge on top
                for (let i = 0; i <= numPoints; i++) {
                    const globalX = m.x + (i * pointSpacing);
                    const globalY = m.y;
                    // Different variation pattern for grass edge
                    const grassVar1 = Math.sin(globalX * 0.12 + globalY * 0.07) * 3;
                    const grassVar2 = Math.sin(globalX * 0.25 + globalY * 0.15) * 2;
                    const grassVar3 = Math.sin(globalX * 0.45 + globalY * 0.25) * 1.5;
                    const totalGrassVar = grassVar1 + grassVar2 + grassVar3;
                    const y = m.y + crumbleHeight + grassHeight + totalGrassVar;
                    context.lineTo(globalX, y);
                }
                
                // Complete the grass area
                context.lineTo(m.x + m.width, m.y + crumbleHeight);
                context.lineTo(m.x, m.y + crumbleHeight);
                context.closePath();
                
                // Fill with darker green grass color (more muted for crumble effect)
                context.fillStyle = '#3A5A45'; // Darker, more muted green
                context.fill();
                
                // Add darker grass texture patches
                for (let patch = 0; patch < 20; patch++) {
                    const globalPatchX = (globalTileX * 53 + globalTileY * 37 + patch * 11) % 9;
                    const globalPatchY = (globalTileX * 29 + globalTileY * 43 + patch * 19) % 3;
                    
                    const patchRandX = Math.sin(globalPatchX + patch * 2.7) * 0.8 + 0.5;
                    const patchRandY = Math.sin(globalPatchY + patch * 4.3) * 0.5 + 0.5;
                    const patchRandSize = Math.sin(globalTileX * 23 + globalTileY * 31 + patch * 5.7) * 0.5 + 0.5;
                    const patchRandColor = Math.sin(globalTileX * 41 + globalTileY * 47 + patch * 7.1) * 0.5 + 0.5;
                    
                    const patchX = m.x - 6 + Math.floor(patchRandX * (m.width + 12));
                    const patchY = m.y + crumbleHeight + Math.floor(patchRandY * grassHeight);
                    const patchWidth = Math.floor(patchRandSize * 8) + 2;
                    const patchHeight = Math.floor(patchRandSize * 4) + 1;
                    
                    // Vary the darker grass color for patches
                    if (patchRandColor < 0.3) {
                        context.fillStyle = '#2D4A35'; // Darker green
                    } else if (patchRandColor < 0.6) {
                        context.fillStyle = '#456A52'; // Lighter green
                    } else {
                        context.fillStyle = '#3F5A48'; // Medium-dark green
                    }
                    
                    context.fillRect(patchX, patchY, patchWidth, patchHeight);
                }
                
                // Add small individual grass blades for detail
                for (let blade = 0; blade < 25; blade++) {
                    const globalBladeX = (globalTileX * 61 + globalTileY * 67 + blade * 13) % 13;
                    const globalBladeY = (globalTileX * 71 + globalTileY * 73 + blade * 17) % 5;
                    
                    const bladeRandX = Math.sin(globalBladeX + blade * 3.1) * 0.9 + 0.5;
                    const bladeRandY = Math.sin(globalBladeY + blade * 4.9) * 0.8 + 0.5;
                    const bladeRandHeight = Math.sin(globalTileX * 79 + globalTileY * 83 + blade * 6.3) * 0.5 + 0.5;
                    
                    const bladeX = m.x - 4 + Math.floor(bladeRandX * (m.width + 8));
                    const bladeY = m.y + crumbleHeight + Math.floor(bladeRandY * (grassHeight - 2));
                    const bladeHeight = Math.floor(bladeRandHeight * 3) + 1;
                    
                    // Darker green for individual blades
                    context.fillStyle = '#4A6A55';
                    context.fillRect(bladeX, bladeY, 1, bladeHeight);
                }
            }
            
            context.restore();
        });

        // Draw red sand floors (red/orange sandy platforms)
        this.redSandFloors.forEach(q => {
            // Create clipping path for sand shape with jagged bottom edge
            context.save();
            context.beginPath();
            
            // Start from top-left corner
            context.moveTo(q.x, q.y);
            // Top edge (straight)
            context.lineTo(q.x + q.width, q.y);
            // Right edge down to jagged bottom area
            context.lineTo(q.x + q.width, q.y + q.height - 8);
            
            // Create natural jagged bottom edge
            const pointSpacing = 1;
            const numPoints = Math.floor(q.width / pointSpacing);
            
            // Generate jagged points from right to left using GLOBAL position for seamless tiles
            for (let i = numPoints; i >= 0; i--) {
                const globalX = q.x + (i * pointSpacing);
                const globalY = q.y; 
                const variation1 = Math.sin(globalX * 0.08 + globalY * 0.05) * 6;
                const variation2 = Math.sin(globalX * 0.15 + globalY * 0.08) * 4;
                const variation3 = Math.sin(globalX * 0.3 + globalY * 0.12) * 3;
                const variation4 = Math.sin(globalX * 0.6 + globalY * 0.2) * 2;
                const totalVariation = variation1 + variation2 + variation3 + variation4;
                const y = q.y + q.height - 8 + totalVariation;
                context.lineTo(globalX, y);
            }
            
            // Left edge back to start
            context.lineTo(q.x, q.y);
            context.closePath();
            context.clip();
            
            // Draw red sand base
            context.fillStyle = '#A0522D'; // Red/orange sand color
            context.fillRect(q.x, q.y, q.width, q.height);
            
            // Create sandy, granular texture
            const globalTileX = q.x / TILE_SIZE;
            const globalTileY = q.y / TILE_SIZE;
            
            // Add multiple patches of different red sand colors
            for (let patch = 0; patch < 20; patch++) {
                const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
                const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5;
                const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.8 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                
                const patchX = q.x - 8 + Math.floor(patchRandX * (q.width + 16));
                const patchY = q.y + Math.floor(patchRandY * q.height);
                const patchWidth = Math.floor(patchRandSize * 8) + 3;
                const patchHeight = Math.floor(patchRandSize * 8) + 3;
                
                // Vary the red sand color for patches
                if (patchRandColor < 0.3) {
                    context.fillStyle = '#B8713A'; // Lighter red sand
                } else if (patchRandColor < 0.6) {
                    context.fillStyle = '#CD853F'; // Orange sand
                } else {
                    context.fillStyle = '#8B4513'; // Darker red sand
                }
                
                context.fillRect(patchX, patchY, patchWidth, patchHeight);
            }
            
            // Add sand granules and small rocks
            for (let i = 0; i < 15; i++) {
                const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
                const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
                
                const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5;
                const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.8 + 0.5;
                const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
                const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
                
                const rockX = q.x - 6 + Math.floor(pseudoRandX * (q.width + 12));
                const rockY = q.y + 4 + Math.floor(pseudoRandY * (q.height - 8));
                const rockSize = Math.floor(pseudoRandSize * 4) + 2;
                
                // Vary rock colors - reddish tones
                if (pseudoRandColor < 0.4) {
                    context.fillStyle = '#654321'; // Dark brown
                } else if (pseudoRandColor < 0.7) {
                    context.fillStyle = '#8B4513'; // Saddle brown
                } else {
                    context.fillStyle = '#A0522D'; // Sienna
                }
                
                context.fillRect(rockX, rockY, rockSize, rockSize);
                if (rockSize >= 3) {
                    context.fillRect(rockX + 1, rockY - 1, rockSize - 2, 1);
                    context.fillRect(rockX - 1, rockY + 1, 1, rockSize - 2);
                }
            }
            
            context.restore();
        });

        // Draw red sand crumble floors (darker red sand that crumbles)
        this.redSandCrumbleFloors.forEach(w => {
            // Create clipping path for sand shape with jagged bottom edge
            context.save();
            context.beginPath();
            
            // Start from top-left corner
            context.moveTo(w.x, w.y);
            // Top edge (straight)
            context.lineTo(w.x + w.width, w.y);
            // Right edge down to jagged bottom area
            context.lineTo(w.x + w.width, w.y + w.height - 8);
            
            // Create natural jagged bottom edge
            const pointSpacing = 1;
            const numPoints = Math.floor(w.width / pointSpacing);
            
            // Generate jagged points from right to left using GLOBAL position for seamless tiles
            for (let i = numPoints; i >= 0; i--) {
                const globalX = w.x + (i * pointSpacing);
                const globalY = w.y; 
                const variation1 = Math.sin(globalX * 0.08 + globalY * 0.05) * 6;
                const variation2 = Math.sin(globalX * 0.15 + globalY * 0.08) * 4;
                context.lineTo(globalX, globalY + 8 + variation1 + variation2);
            }
            
            // Left edge back to start
            context.lineTo(w.x, w.y);
            context.closePath();
            context.clip();
            
            // Handle crumbling effect
            const crumbleProgress = w.decay > 0 ? w.decay / 30 : 0;
            const crumbleHeight = Math.floor(crumbleProgress * w.height);
            
            // Draw red sand base (more red and lighter for better distinction)
            context.fillStyle = '#B85D3A'; // Red sand with orange tint - lighter and more red
            context.fillRect(w.x, w.y + crumbleHeight, w.width, w.height - crumbleHeight);
            
            // Create sandy, granular texture with reddish colors
            const globalTileX = w.x / TILE_SIZE;
            const globalTileY = w.y / TILE_SIZE;
            
            // Add multiple patches of different darker red sand colors
            for (let patch = 0; patch < 20; patch++) {
                const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
                const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5;
                const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.8 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                
                const patchX = w.x - 8 + Math.floor(patchRandX * (w.width + 16));
                const patchY = w.y + crumbleHeight + Math.floor(patchRandY * (w.height - crumbleHeight));
                const patchWidth = Math.floor(patchRandSize * 8) + 3;
                const patchHeight = Math.floor(patchRandSize * 8) + 3;
                
                // Only draw if below crumble line
                if (patchY >= w.y + crumbleHeight) {
                    // Vary the red sand color for patches (more red and lighter)
                    if (patchRandColor < 0.3) {
                        context.fillStyle = '#9B4F2F'; // Medium red sand
                    } else if (patchRandColor < 0.6) {
                        context.fillStyle = '#D1663C'; // Lighter red sand
                    } else {
                        context.fillStyle = '#A0522D'; // Reddish brown sand
                    }
                    
                    context.fillRect(patchX, patchY, patchWidth, patchHeight);
                }
            }
            
            // Add darker sand granules and small rocks
            for (let i = 0; i < 15; i++) {
                const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
                const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
                
                const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5;
                const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.8 + 0.5;
                const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
                const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
                
                const rockX = w.x - 6 + Math.floor(pseudoRandX * (w.width + 12));
                const rockY = w.y + crumbleHeight + 4 + Math.floor(pseudoRandY * (w.height - crumbleHeight - 8));
                const rockSize = Math.floor(pseudoRandSize * 4) + 2;
                
                // Only draw if below crumble line
                if (rockY >= w.y + crumbleHeight) {
                    // Vary rock colors - darker reddish tones for contrast
                    if (pseudoRandColor < 0.4) {
                        context.fillStyle = '#5A2D1A'; // Dark reddish brown
                    } else if (pseudoRandColor < 0.7) {
                        context.fillStyle = '#6B3C24'; // Medium dark reddish brown
                    } else {
                        context.fillStyle = '#7A4B2C'; // Lighter dark reddish brown
                    }
                    
                    context.fillRect(rockX, rockY, rockSize, rockSize);
                    if (rockSize >= 3) {
                        context.fillRect(rockX + 1, rockY - 1, rockSize - 2, 1);
                        context.fillRect(rockX - 1, rockY + 1, 1, rockSize - 2);
                    }
                }
            }
            
            // Add the grass layer on top (top quarter of remaining tile)
            const remainingHeight = w.height - crumbleHeight;
            const grassHeight = Math.floor(remainingHeight / 4);
            
            if (grassHeight > 0 && remainingHeight > 0) {
                // Create jagged grass top edge
                context.beginPath();
                context.moveTo(w.x, w.y + crumbleHeight);
                
                // Create jagged grass edge on top
                for (let i = 0; i <= numPoints; i++) {
                    const globalX = w.x + (i * pointSpacing);
                    const globalY = w.y;
                    // Different variation pattern for grass edge
                    const grassVar1 = Math.sin(globalX * 0.12 + globalY * 0.07) * 3;
                    const grassVar2 = Math.sin(globalX * 0.25 + globalY * 0.15) * 2;
                    const grassVar3 = Math.sin(globalX * 0.45 + globalY * 0.25) * 1.5;
                    const totalGrassVar = grassVar1 + grassVar2 + grassVar3;
                    const y = w.y + crumbleHeight + grassHeight + totalGrassVar;
                    context.lineTo(globalX, y);
                }
                
                // Complete the grass area
                context.lineTo(w.x + w.width, w.y + crumbleHeight);
                context.lineTo(w.x, w.y + crumbleHeight);
                context.closePath();
                
                // Fill with darker green grass color (more muted for crumble effect)
                context.fillStyle = '#3A5A45'; // Darker, more muted green
                context.fill();
                
                // Add darker grass texture patches
                for (let patch = 0; patch < 20; patch++) {
                    const globalPatchX = (globalTileX * 53 + globalTileY * 37 + patch * 11) % 9;
                    const globalPatchY = (globalTileX * 29 + globalTileY * 43 + patch * 19) % 3;
                    
                    const patchRandX = Math.sin(globalPatchX + patch * 2.7) * 0.8 + 0.5;
                    const patchRandY = Math.sin(globalPatchY + patch * 4.3) * 0.5 + 0.5;
                    const patchRandSize = Math.sin(globalTileX * 23 + globalTileY * 31 + patch * 5.7) * 0.5 + 0.5;
                    const patchRandColor = Math.sin(globalTileX * 41 + globalTileY * 47 + patch * 7.1) * 0.5 + 0.5;
                    
                    const patchX = w.x - 6 + Math.floor(patchRandX * (w.width + 12));
                    const patchY = w.y + crumbleHeight + Math.floor(patchRandY * grassHeight);
                    const patchWidth = Math.floor(patchRandSize * 8) + 2;
                    const patchHeight = Math.floor(patchRandSize * 4) + 1;
                    
                    // Vary the darker grass color for patches
                    if (patchRandColor < 0.3) {
                        context.fillStyle = '#2D4A35'; // Darker green
                    } else if (patchRandColor < 0.6) {
                        context.fillStyle = '#456A52'; // Lighter green
                    } else {
                        context.fillStyle = '#3F5A48'; // Medium-dark green
                    }
                    
                    context.fillRect(patchX, patchY, patchWidth, patchHeight);
                }
                
                // Add small individual grass blades for detail
                for (let blade = 0; blade < 25; blade++) {
                    const globalBladeX = (globalTileX * 61 + globalTileY * 67 + blade * 13) % 13;
                    const globalBladeY = (globalTileX * 71 + globalTileY * 73 + blade * 17) % 5;
                    
                    const bladeRandX = Math.sin(globalBladeX + blade * 3.1) * 0.9 + 0.5;
                    const bladeRandY = Math.sin(globalBladeY + blade * 4.9) * 0.8 + 0.5;
                    const bladeRandHeight = Math.sin(globalTileX * 79 + globalTileY * 83 + blade * 6.3) * 0.5 + 0.5;
                    
                    const bladeX = w.x - 4 + Math.floor(bladeRandX * (w.width + 8));
                    const bladeY = w.y + crumbleHeight + Math.floor(bladeRandY * (grassHeight - 2));
                    const bladeHeight = Math.floor(bladeRandHeight * 3) + 1;
                    
                    // Darker green for individual blades
                    context.fillStyle = '#4A6A55';
                    context.fillRect(bladeX, bladeY, 1, bladeHeight);
                }
            }
            
            context.restore();
        });

        // Draw moving left floors (conveyor belts)
        this.movingLeftFloors.forEach(l => {
            const tileX = Math.floor(l.x / TILE_SIZE);
            const tileY = Math.floor(l.y / TILE_SIZE);
            const leftEmpty = this.isEmptyTile(tileX - 1, tileY);
            const rightEmpty = this.isEmptyTile(tileX + 1, tileY);

            context.save();
            
            // Helper function to create the belt shape path
            const createBeltPath = () => {
                if (leftEmpty || rightEmpty) {
                    const radius = 6;
                    context.beginPath();
                    
                    // Manually create rounded rectangle path
                    context.moveTo(l.x + (leftEmpty ? radius : 0), l.y);
                    context.lineTo(l.x + l.width - (rightEmpty ? radius : 0), l.y);
                    if (rightEmpty) {
                        context.arcTo(l.x + l.width, l.y, l.x + l.width, l.y + radius, radius);
                    }
                    context.lineTo(l.x + l.width, l.y + l.height - (rightEmpty ? radius : 0));
                    if (rightEmpty) {
                        context.arcTo(l.x + l.width, l.y + l.height, l.x + l.width - radius, l.y + l.height, radius);
                    }
                    context.lineTo(l.x + (leftEmpty ? radius : 0), l.y + l.height);
                    if (leftEmpty) {
                        context.arcTo(l.x, l.y + l.height, l.x, l.y + l.height - radius, radius);
                    }
                    context.lineTo(l.x, l.y + (leftEmpty ? radius : 0));
                    if (leftEmpty) {
                        context.arcTo(l.x, l.y, l.x + radius, l.y, radius);
                    }
                    context.closePath();
                } else {
                    context.beginPath();
                    context.rect(l.x, l.y, l.width, l.height);
                }
            };

            // Conveyor belt base (metal platform)
            createBeltPath();
            const gradient = context.createLinearGradient(l.x, l.y, l.x, l.y + l.height);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(0.3, '#444');
            gradient.addColorStop(0.7, '#333');
            gradient.addColorStop(1, '#222');
            context.fillStyle = gradient;
            context.fill();

            // Clip for the internal elements only
            createBeltPath();
            context.clip();

            // Metal side rails - adjust for rounded edges
            context.fillStyle = '#888';
            const railThickness = 3;
            context.fillRect(l.x, l.y, l.width, railThickness); // Top rail
            context.fillRect(l.x, l.y + l.height - railThickness, l.width, railThickness); // Bottom rail
            
            // Moving belt surface
            context.fillStyle = '#2C2C2C'; // Very dark belt color, barely different from background
            context.fillRect(l.x, l.y + railThickness, l.width, l.height - railThickness * 2);

            // Moving belt pattern (diagonal lines) - slowed down
            context.strokeStyle = '#444';
            context.lineWidth = 1;
            const beltSpeed = frameCounter * -0.8; // Slower moving pattern
            const lineSpacing = 8;
            
            for (let i = Math.floor(beltSpeed / lineSpacing) - 1; i < Math.ceil((l.width + beltSpeed) / lineSpacing) + 1; i++) {
                const x = l.x + (i * lineSpacing) - (beltSpeed % lineSpacing);
                context.beginPath();
                               context.moveTo(x, l.y + railThickness);
                context.lineTo(x + lineSpacing/2, l.y + l.height - railThickness);
                context.stroke();
            }

            // Rotating gears for direction indication - discrete dark gray
            context.fillStyle = '#2E2E2E'; // Very dark gray, barely visible
            const gearRotation = (frameCounter * -0.02) % (Math.PI * 2); // Slow rotation, left direction
            const gearRadius = 36; // Much larger radius - 3x the previous size
            
            // Center one gear per tile
            const numTiles = Math.floor(l.width / TILE_SIZE);
            for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
                const centerX = l.x + ( tileIndex * TILE_SIZE) + (TILE_SIZE / 2);
                const centerY = l.y + l.height/2; // Center of belt
                
                context.save();
                context.translate(centerX, centerY);
                context.rotate(gearRotation);
                
                // Draw gear with thick propeller-like blades
                context.beginPath();
                const numTeeth = 8;
                const outerRadius = gearRadius * 0.9; // Main circle
                const dentRadius = gearRadius * 0.5; // Deeper dent for thicker blades
                
                // Create circle with thick triangular blades
                for (let i = 0; i <= numTeeth * 12; i++) {
                    const angle = (i / (numTeeth * 12)) * Math.PI * 2;
                    const dentProgress = (i % 12) / 12; // 0 to 1 within each tooth
                    
                    let radius;
                    if (dentProgress < 0.2 || dentProgress > 0.8) {
                        // Outside blade - normal radius
                        radius = outerRadius;
                    } else {
                        // Inside blade - much thicker triangular blade
                        const bladeDepth = Math.min(dentProgress - 0.2, 0.8 - dentProgress) / 0.3; // 0 to 1
                        radius = outerRadius - (outerRadius - dentRadius) * bladeDepth;
                    }
                    
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                }
                context.closePath();
                context.fill();
                
                // Center hole - larger and more visible
                context.fillStyle = '#1A1A1A'; // Even darker for center
                context.beginPath();
                context.arc(0, 0, gearRadius * 0.25, 0, Math.PI * 2);
                context.fill();
                
                // Add visible spokes for better rotation visibility
                context.strokeStyle = '#1A1A1A';
                context.lineWidth = 2;
                for (let spoke = 0; spoke < 4; spoke++) {
                    const spokeAngle = (spoke / 4) * Math.PI * 2;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Math.cos(spokeAngle) * dentRadius, Math.sin(spokeAngle) * dentRadius);
                    context.stroke();
                }
                
                context.restore();
                context.fillStyle = '#2E2E2E'; // Reset color for next gear
            }

            // Moving rail segments (visible pieces on the light gray rails) - drawn AFTER gears
            context.fillStyle = '#555'; // Darker color for more discrete segments, closer to belt color
            const segmentWidth = 6;
            const segmentSpacing = 12;
            const globalSegmentSpeed = (frameCounter * -0.3) % segmentSpacing; // Global animation for seamless belts
            
            // Calculate seamless starting position based on world position
            const startOffset = -(l.x % segmentSpacing);
            for (let i = -1; i <= Math.ceil(l.width / segmentSpacing) + 1; i++) {
                const segmentX = l.x + startOffset + (i * segmentSpacing) + globalSegmentSpeed;
                if (segmentX + segmentWidth > l.x && segmentX < l.x + l.width) {
                    context.fillRect(segmentX, l.y, segmentWidth, railThickness);
                }
            }
            
            // Bottom rail segments moving in opposite direction (right)
            const globalBottomSegmentSpeed = (frameCounter * 0.3) % segmentSpacing; // Opposite direction
            for (let i = -1; i <= Math.ceil(l.width / segmentSpacing) + 1; i++) {
                const segmentX = l.x + startOffset + (i * segmentSpacing) + globalBottomSegmentSpeed;
                if (segmentX + segmentWidth > l.x && segmentX < l.x + l.width) {
                    context.fillRect(segmentX, l.y + l.height - railThickness, segmentWidth, railThickness);
                }
            }
            context.restore();
        });

        // Draw moving right floors (conveyor belts)
        this.movingRightFloors.forEach(r => {
            const tileX = Math.floor(r.x / TILE_SIZE);
            const tileY = Math.floor(r.y / TILE_SIZE);
            const leftEmpty = this.isEmptyTile(tileX - 1, tileY);
            const rightEmpty = this.isEmptyTile(tileX + 1, tileY);

            context.save();
            
            // Helper function to create the belt shape path
            const createBeltPath = () => {
                if (leftEmpty || rightEmpty) {
                    const radius = 6;
                    context.beginPath();
                    
                    // Manually create rounded rectangle path
                    context.moveTo(r.x + (leftEmpty ? radius : 0), r.y);
                    context.lineTo(r.x + r.width - (rightEmpty ? radius : 0), r.y);
                    if (rightEmpty) {
                        context.arcTo(r.x + r.width, r.y, r.x + r.width, r.y + radius, radius);
                    }
                    context.lineTo(r.x + r.width, r.y + r.height - (rightEmpty ? radius : 0));
                    if (rightEmpty) {
                        context.arcTo(r.x + r.width, r.y + r.height, r.x + r.width - radius, r.y + r.height, radius);
                    }
                    context.lineTo(r.x + (leftEmpty ? radius : 0), r.y + r.height);
                    if (leftEmpty) {
                        context.arcTo(r.x, r.y + r.height, r.x, r.y + r.height - radius, radius);
                    }
                    context.lineTo(r.x, r.y + (leftEmpty ? radius : 0));
                    if (leftEmpty) {
                        context.arcTo(r.x, r.y, r.x + radius, r.y, radius);
                    }
                    context.closePath();
                } else {
                    context.beginPath();
                    context.rect(r.x, r.y, r.width, r.height);
                }
            };

            // Conveyor belt base (metal platform)
            createBeltPath();
            const gradient = context.createLinearGradient(r.x, r.y, r.x, r.y + r.height);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(0.3, '#444');
            gradient.addColorStop(0.7, '#333');
            gradient.addColorStop(1, '#222');
            context.fillStyle = gradient;
            context.fill();

            // Clip for the internal elements only
            createBeltPath();
            context.clip();

            // Metal side rails - adjust for rounded edges
            context.fillStyle = '#888';
            const railThickness = 3;
            context.fillRect(r.x, r.y, r.width, railThickness); // Top rail
            context.fillRect(r.x, r.y + r.height - railThickness, r.width, railThickness); // Bottom rail
            
            // Moving belt surface
            context.fillStyle = '#2C2C2C'; // Very dark belt color, barely different from background
            context.fillRect(r.x, r.y + railThickness, r.width, r.height - railThickness * 2);

            // Moving belt pattern (diagonal lines) - slowed down
            context.strokeStyle = '#444';
            context.lineWidth = 1;
            const beltSpeed = frameCounter * 0.8; // Slower moving pattern
            const lineSpacing = 8;
            
            for (let i = Math.floor(beltSpeed / lineSpacing) - 1; i < Math.ceil((r.width + beltSpeed) / lineSpacing) + 1; i++) {
                const x = r.x + (i * lineSpacing) - (beltSpeed % lineSpacing);
                context.beginPath();
                context.moveTo(x, r.y + railThickness);
                context.lineTo(x - lineSpacing/2, r.y + r.height - railThickness);
                context.stroke();
            }

            // Rotating gears for direction indication - discrete dark gray
            context.fillStyle = '#2E2E2E'; // Very dark gray, barely visible
            const gearRotation = (frameCounter * 0.02) % (Math.PI * 2); // Slow rotation, right direction
            const gearRadius = 36; // Much larger radius - 3x the previous size
            
            // Center one gear per tile
            const numTiles = Math.floor(r.width / TILE_SIZE);
            for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
                const centerX = r.x + (tileIndex * TILE_SIZE) + (TILE_SIZE / 2);
                const centerY = r.y + r.height/2; // Center of belt
                
                context.save();
                context.translate(centerX, centerY);
                context.rotate(gearRotation);
                
                // Draw gear with thick propeller-like blades (same as left floors)
                context.beginPath();
                const numTeeth = 8;
                const outerRadius = gearRadius * 0.9; // Main circle
                const dentRadius = gearRadius * 0.6; // Blade depth
                
                // Create circle with thick triangular blades
                for (let i = 0; i <= numTeeth * 8; i++) {
                    const angle = (i / (numTeeth * 8)) * Math.PI * 2;
                    const dentProgress = (i % 8) / 8; // 0 to 1 within each tooth
                    
                    let radius;
                    if (dentProgress < 0.2 || dentProgress > 0.8) {
                        // Outside blade - normal radius
                        radius = outerRadius;
                    } else {
                        // Inside blade - much thicker triangular blade
                        const bladeDepth = Math.min(dentProgress - 0.2, 0.8 - dentProgress) / 0.3; // 0 to 1
                        radius = outerRadius - (outerRadius - dentRadius) * bladeDepth;
                    }
                    
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                }
                context.closePath();
                context.fill();
                
                // Center hole - larger and more visible
                context.fillStyle = '#1A1A1A'; // Even darker for center
                context.beginPath();
                context.arc(0, 0, gearRadius * 0.25, 0, Math.PI * 2);
                context.fill();
                
                // Add visible spokes for better rotation visibility
                context.strokeStyle = '#1A1A1A';
                context.lineWidth = 2;
                for (let spoke = 0; spoke < 4; spoke++) {
                    const spokeAngle = (spoke / 4) * Math.PI * 2;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Math.cos(spokeAngle) * dentRadius, Math.sin(spokeAngle) * dentRadius);
                    context.stroke();
                }
                
                context.restore();
                context.fillStyle = '#2E2E2E'; // Reset color for next gear
            }

            // Moving rail segments (visible pieces on the light gray rails) - drawn AFTER gears
            context.fillStyle = '#555'; // Darker color for more discrete segments, closer to belt color
            const segmentWidth = 6;
            const segmentSpacing = 12;
            const globalSegmentSpeed = (frameCounter * 0.3) % segmentSpacing; // Global animation for seamless belts
            
            // Calculate seamless starting position based on world position
            const startOffset = -(r.x % segmentSpacing);
            for (let i = -1; i <= Math.ceil(r.width / segmentSpacing) + 1; i++) {
                const segmentX = r.x + startOffset + (i * segmentSpacing) + globalSegmentSpeed;
                if (segmentX + segmentWidth > r.x && segmentX < r.x + r.width) {
                    context.fillRect(segmentX, r.y, segmentWidth, railThickness);
                }
            }
            
            // Bottom rail segments moving in opposite direction (left)
            const globalBottomSegmentSpeed = (frameCounter * -0.3) % segmentSpacing; // Opposite direction
            for (let i = -1; i <= Math.ceil(r.width / segmentSpacing) + 1; i++) {
                const segmentX = r.x + startOffset + (i * segmentSpacing) + globalBottomSegmentSpeed;
                if (segmentX + segmentWidth > r.x && segmentX < r.x + r.width) {
                    context.fillRect(segmentX, r.y + r.height - railThickness, segmentWidth, railThickness);
                }
            }
            context.restore();
        });

        // Update spiders
        this.spiders.forEach(spider => {
            spider.update(this);
        });

        // Draw enemies
        this.enemies.forEach(e => e.draw(context));

        // Draw decorative elements (Cactus and Shrub)
        this.decorativeElements.forEach(d => {
            const s = d.width / 16; // Scale factor
            switch (d.type) {
                case 'T': // Cactus
                    context.fillStyle = '#006400'; // DarkGreen
                    // Main body of the cactus
                    context.fillRect(d.x + 7 * s, d.y + 2 * s, 2 * s, 14 * s); // Central trunk

                    // Left arm (lower)
                    context.fillRect(d.x + 4 * s, d.y + 6 * s, 3 * s, 2 * s); // Horizontal part
                    context.fillRect(d.x + 4 * s, d.y + 4 * s, 2 * s, 2 * s); // Vertical part
                    context.beginPath();
                    context.arc(d.x + 5 * s, d.y + 4 * s, 1 * s, Math.PI, 2 * Math.PI); // Rounded top
                    context.fill();

                    // Right arm (higher)
                    context.fillRect(d.x + 9 * s, d.y + 4 * s, 3 * s, 2 * s); // Horizontal part
                    context.fillRect(d.x + 10 * s, d.y + 2 * s, 2 * s, 2 * s); // Vertical part
                    context.beginPath();
                    context.arc(d.x + 11 * s, d.y + 2 * s, 1 * s, Math.PI, 2 * Math.PI); // Rounded top
                    context.fill();
                    break;
                case 'Y': // Tall tree (2 tiles high)
                    const trunkColor = '#8B4513'; // SaddleBrown
                    const leafColor = '#228B22'; // ForestGreen
                    const darkLeafColor = '#1F5F1F'; // Darker green
                    
                    // Tree trunk (bottom to middle)
                    context.fillStyle = trunkColor;
                    context.fillRect(d.x + 6 * s, d.y + 20 * s, 4 * s, 12 * s); // Main trunk
                    
                    // Tree crown (large, layered foliage)
                    context.fillStyle = leafColor;
                    // Bottom layer of leaves
                    context.beginPath();
                    context.arc(d.x + 8 * s, d.y + 20 * s, 8 * s, 0, Math.PI * 2);
                    context.fill();
                    
                    // Middle layer
                    context.beginPath();
                    context.arc(d.x + 8 * s, d.y + 16 * s, 7 * s, 0, Math.PI * 2);
                    context.fill();
                    
                    // Top layer
                    context.beginPath();
                    context.arc(d.x + 8 * s, d.y + 12 * s, 6 * s, 0, Math.PI * 2);
                    context.fill();
                    
                    // Add darker leaf details for depth
                    context.fillStyle = darkLeafColor;
                    context.beginPath();
                    context.arc(d.x + 5 * s, d.y + 18 * s, 3 * s, 0, Math.PI * 2);
                    context.fill();
                    context.beginPath();
                    context.arc(d.x + 11 * s, d.y + 14 * s, 3 * s, 0, Math.PI * 2);
                    context.fill();
                    context.beginPath();
                    context.arc(d.x + 8 * s, d.y + 10 * s, 2 * s, 0, Math.PI * 2);
                    context.fill();
                    break;
                case 'U': // Tall cactus (2 tiles high)
                    context.fillStyle = '#006400'; // DarkGreen
                    
                    // Main central trunk (full height)
                    context.fillRect(d.x + 7 * s, d.y + 4 * s, 2 * s, 28 * s);
                    
                    // Left arm (middle height)
                    context.fillRect(d.x + 3 * s, d.y + 12 * s, 4 * s, 2 * s); // Horizontal part
                    context.fillRect(d.x + 3 * s, d.y + 8 * s, 2 * s, 4 * s); // Vertical part
                    context.beginPath();
                    context.arc(d.x + 4 * s, d.y + 8 * s, 1 * s, Math.PI, 2 * Math.PI); // Rounded top
                    context.fill();
                    
                    // Right arm (higher, spans across tiles)
                    context.fillRect(d.x + 9 * s, d.y + 8 * s, 4 * s, 2 * s); // Horizontal part
                    context.fillRect(d.x + 11 * s, d.y + 4 * s, 2 * s, 4 * s); // Vertical part
                    context.beginPath();
                    context.arc(d.x + 12 * s, d.y + 4 * s, 1 * s, Math.PI, 2 * Math.PI); // Rounded top
                    context.fill();
                    
                    // Additional small arm on left (lower)
                    context.fillRect(d.x + 4 * s, d.y + 20 * s, 3 * s, 1.5 * s); // Small horizontal part
                    context.fillRect(d.x + 4 * s, d.y + 18 * s, 1.5 * s, 2 * s); // Small vertical part
                    context.beginPath();
                    context.arc(d.x + 4.75 * s, d.y + 18 * s, 0.75 * s, Math.PI, 2 * Math.PI); // Small rounded top
                    context.fill();
                    break;
                case 'SHRUB': // Shrub/Bush
                    const shrubColor = '#228B22'; // ForestGreen
                    const darkerShrubColor = '#186F18'; // Darker green

                    // Small trunk
                    context.fillStyle = '#8B4513'; // SaddleBrown
                    context.fillRect(d.x + 7 * s, d.y + 12 * s, 2 * s, 4 * s);

                    // Main foliage (overlapping circles/ovals)
                    context.fillStyle = shrubColor;
                    context.beginPath();
                    context.arc(d.x + 8 * s, d.y + 8 * s, 6 * s, 0, Math.PI * 2); // Central mass
                    context.arc(d.x + 4 * s, d.y + 10 * s, 4 * s, 0, Math.PI * 2); // Lower left
                    context.arc(d.x + 12 * s, d.y + 10 * s, 4 * s, 0, Math.PI * 2); // Lower right
                    context.arc(d.x + 6 * s, d.y + 4 * s, 5 * s, 0, Math.PI * 2); // Upper left
                    context.arc(d.x + 10 * s, d.y + 4 * s, 5 * s, 0, Math.PI * 2); // Upper right
                    context.fill();

                    // Add darker spots for texture
                    context.fillStyle = darkerShrubColor;
                    context.beginPath();
                    context.arc(d.x + 5 * s, d.y + 7 * s, 2 * s, 0, Math.PI * 2);
                    context.fill();
                    context.beginPath();
                    context.arc(d.x + 11 * s, d.y + 6 * s, 2.5 * s, 0, Math.PI * 2);
                    context.fill();
                    context.beginPath();
                    context.arc(d.x + 7 * s, d.y + 10 * s, 1.5 * s, 0, Math.PI * 2);
                    context.fill();
                    break;
            }
        });

        // Draw spiders
        this.spiders.forEach(spider => {
            spider.draw(context);
        });
    }
}
