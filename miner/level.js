class Level {
    constructor(levelData) {
        this.map = levelData.map;
        this.name = levelData.name;
        this.viewportWidth = levelData.viewportWidth || 32;
        this.viewportHeight = levelData.viewportHeight || 16;
        this.brickScheme = levelData.brickScheme || DEFAULT_BRICK_SCHEME; // Store brick color scheme
        this.dirtScheme = levelData.dirtScheme || DEFAULT_DIRT_SCHEME; // Store dirt color scheme
        this.surfaceScheme = levelData.surfaceScheme || DEFAULT_SURFACE_SCHEME; // Store surface color scheme
        this.movingPlatformScheme = levelData.movingPlatformScheme || DEFAULT_MOVING_PLATFORM_SCHEME; // Store moving platform color scheme
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
        this.ladders = []; // Array to store ladder tiles
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

        // Load background color, image, oxygen level, and fall distance from levelData
        this.backgroundColor = levelData.backgroundColor || DEFAULT_BACKGROUND_COLOR; // Use default background color
        this.background = levelData.background || null; // Default to no image
        this.oxygenLevel = levelData.oxygenLevel || START_OXYGEN; // Default oxygen level
        this.maxFall = levelData.maxFall || 0; // Default: no fall damage (0 = disabled)

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
                        case '_':
                            this.brickFloors.push(platform);
                            break;
                        case '=':
                            this.dirtFloors.push(platform);
                            break;
                        case ':':
                            this.grassFloors.push(platform);
                            break;
                        case ';':
                            this.grassCrumbleFloors.push(platform);
                            break;
                        case '-':
                            // Already handled above
                            break;
                        case '<':
                            // Already handled above
                            break;
                        case '>':
                            // Already handled above
                            break;
                    }
                }

                // Handle ALL tiles (both platform and non-platform)
                switch (char) {
                    case '@':
                        this.playerStart = { x: worldX, y: worldY };
                        break;
                    case '+':
                        this.keys.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                    case '*':
                        this.portal = { x: worldX, y: worldY - TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2, type: char };
                        break;
                    case 'E':
                        this.enemies.push(new BigFoot(worldX, worldY - TILE_SIZE));
                        break;
                    case 'V':
                        this.enemies.push(new Bat(worldX, worldY - TILE_SIZE));
                        break;
                    case 'Z':
                        this.enemies.push(new Robot(worldX, worldY - TILE_SIZE));
                        break;
                    case 'J':
                        this.enemies.push(new GooseEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'A':
                        this.enemies.push(new SealEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'N':
                        this.enemies.push(new DinosaurEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'P':
                        this.enemies.push(new PenguinEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'S':
                        this.spiders.push(new SpiderEnemy(worldX, worldY, false)); // Static spider
                        break;
                    case 'T':
                        this.spiders.push(new SpiderEnemy(worldX, worldY, true)); // Moving spider
                        break;
                    case 'Q':
                        this.enemies.push(new ToiletEnemy(worldX, worldY - TILE_SIZE));
                        break;
                    case 'I':
                        this.hazards.push(new Hazard(worldX, worldY, 'SPIKES'));
                        break;
                    case 'F':
                        this.hazards.push(new Hazard(worldX, worldY, 'FIRE'));
                        break;
                    case '3':
                        const shrubBerries = [];
                        const numBerries = 3; // Fixed number of berries
                        for (let i = 0; i < numBerries; i++) {
                            const randX = (Math.random() * 0.6 + 0.2); // 20% to 80% across the tile
                            const randY = (Math.random() * 0.6 + 0.2); // 20% to 80% down the tile
                            const berrySize = (Math.random() * 0.5 + 0.5); // 0.5 to 1.0 scale
                            shrubBerries.push({ x: randX, y: randY, size: berrySize });
                        }
                        this.decorativeElements.push(new Plant(worldX, worldY, TILE_SIZE, TILE_SIZE, 'SHRUB', shrubBerries));
                        break;
                    case '2':
                        this.decorativeElements.push(new Plant(worldX, worldY, TILE_SIZE, TILE_SIZE, char));
                        break;
                    case '1': // Tall tree (2 tiles high)
                        this.decorativeElements.push(new Plant(worldX, worldY - TILE_SIZE, TILE_SIZE, TILE_SIZE * 2, char));
                        break;
                    case '4': // Tall cactus (2 tiles high)
                        this.decorativeElements.push(new Plant(worldX, worldY - TILE_SIZE, TILE_SIZE, TILE_SIZE * 2, char));
                        break;
                    case 'L': // Ladder
                        this.ladders.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
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
                // Get the dirt color scheme for this level
                const colorScheme = DIRT_COLOR_SCHEMES[this.dirtScheme] || DIRT_COLOR_SCHEMES[DEFAULT_DIRT_SCHEME];
                
                const decayProgress = p.decay / 30; // Normalize decay to 0-1
                const currentHeight = p.height * (1 - decayProgress); // Ensure currentHeight is defined
                const currentY = p.y + (p.height - currentHeight);

                // Always draw like dirt but with darker colors, even while decaying
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

                // Base crumble color (darker than normal dirt using scheme)
                context.fillStyle = colorScheme.crumbleBase;
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
            // Get the brick color scheme for this level
            const colorScheme = BRICK_COLOR_SCHEMES[this.brickScheme] || BRICK_COLOR_SCHEMES[DEFAULT_BRICK_SCHEME];
            
            // Base brick color (mortar background)
            context.fillStyle = colorScheme.mortar;
            context.fillRect(b.x, b.y, b.width, b.height);
            
            // Draw individual small bricks to fill entire tile
            const brickWidth = 7;
            const brickHeight = 3;
            const mortarGap = 1;
            
            context.fillStyle = colorScheme.brick;
            
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
            // Get the dirt color scheme for this level
            const colorScheme = DIRT_COLOR_SCHEMES[this.dirtScheme] || DIRT_COLOR_SCHEMES[DEFAULT_DIRT_SCHEME];
            
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
            // Base dirt color using scheme
            context.fillStyle = colorScheme.base;
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
                
                // Vary the dirt color for patches using scheme
                if (patchRandColor < 0.3) {
                    context.fillStyle = colorScheme.patch1;
                } else if (patchRandColor < 0.6) {
                    context.fillStyle = colorScheme.patch2;
                } else {
                    context.fillStyle = colorScheme.patch3;
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
                const rockX = d.x - 6 + Math.floor(pseudoRandX * (d.width + 16)); // Extend 6px on each side
                const currentHeight = d.height; // Define currentHeight for dirt floors
                const rockY = d.y + 4 + Math.floor(pseudoRandY * (currentHeight - 16)); // Adjust for current height
                const rockSize = Math.floor(pseudoRandSize * 5) + 3; // 3-7 pixel rocks
                
                // Vary rock colors using scheme
                if (pseudoRandColor < 0.4) {
                    context.fillStyle = colorScheme.rock1;
                } else if (pseudoRandColor < 0.7) {
                    context.fillStyle = colorScheme.rock2;
                } else {
                    context.fillStyle = colorScheme.rock3;
                }
                
                // Draw rock (clipping will handle boundaries)
                context.fillRect(rockX, rockY, rockSize, rockSize);
            }
            
            context.restore();
        });

        // Draw grass floors (dirt base with a surface layer on top)
        this.grassFloors.forEach(g => {
            this.drawTwoLayerPlatform(context, g, this.dirtScheme, this.surfaceScheme);
        });

        // Draw grass crumble floors (dirt base with a surface layer on top, crumbles)
        this.grassCrumbleFloors.forEach(m => {
            // Create a darker dirt scheme for crumble floors
            const originalDirtScheme = DIRT_COLOR_SCHEMES[this.dirtScheme] || DIRT_COLOR_SCHEMES[DEFAULT_DIRT_SCHEME];
            const crumbleDirtScheme = {
                ...originalDirtScheme,
                base: originalDirtScheme.crumbleBase || originalDirtScheme.base
            };
            this.drawTwoLayerPlatformWithCustomScheme(context, m, crumbleDirtScheme, this.surfaceScheme, m.decay);
        });

        // Draw moving left floors (conveyor belts)
        this.movingLeftFloors.forEach(l => {
            const tileX = Math.floor(l.x / TILE_SIZE);
            const tileY = Math.floor(l.y / TILE_SIZE);
            const leftEmpty = this.isEmptyTile(tileX - 1, tileY);
            const rightEmpty = this.isEmptyTile(tileX + 1, tileY);

            // Get color scheme for this level
            const colorScheme = MOVING_PLATFORM_COLOR_SCHEMES[this.movingPlatformScheme];

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

            // Conveyor belt base (metal platform) - using color scheme
            createBeltPath();
            const gradient = context.createLinearGradient(l.x, l.y, l.x, l.y + l.height);
            gradient.addColorStop(0, colorScheme.base);
            gradient.addColorStop(0.3, this.darkenColor(colorScheme.base, 0.3));
            gradient.addColorStop(0.7, this.darkenColor(colorScheme.base, 0.5));
            gradient.addColorStop(1, this.darkenColor(colorScheme.base, 0.7));
            context.fillStyle = gradient;
            context.fill();

            // Clip for the internal elements only
            createBeltPath();
            context.clip();

            // Metal side rails - using color scheme
            context.fillStyle = colorScheme.rail;
            const railThickness = 3;
            context.fillRect(l.x, l.y, l.width, railThickness); // Top rail
            context.fillRect(l.x, l.y + l.height - railThickness, l.width, railThickness); // Bottom rail
            
            // Moving belt surface - using color scheme
            context.fillStyle = colorScheme.surface;
            context.fillRect(l.x, l.y + railThickness, l.width, l.height - railThickness * 2);

            // Moving belt pattern (diagonal lines) - using color scheme
            context.strokeStyle = colorScheme.pattern;
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

            // Rotating gears for direction indication - using color scheme
            context.fillStyle = colorScheme.gear;
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
                
                // Center hole - using color scheme
                context.fillStyle = colorScheme.gearCenter;
                context.beginPath();
                context.arc(0, 0, gearRadius * 0.25, 0, Math.PI * 2);
                context.fill();
                
                // Add visible spokes for better rotation visibility
                context.strokeStyle = colorScheme.gearCenter;
                context.lineWidth = 2;
                for (let spoke = 0; spoke < 4; spoke++) {
                    const spokeAngle = (spoke / 4) * Math.PI * 2;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Math.cos(spokeAngle) * dentRadius, Math.sin(spokeAngle) * dentRadius);
                    context.stroke();
                }
                
                context.restore();
                context.fillStyle = colorScheme.gear; // Reset color for next gear
            }

            // Moving rail segments (visible pieces on the light gray rails) - using color scheme
            context.fillStyle = colorScheme.segment;
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

            // Get color scheme for this level
            const colorScheme = MOVING_PLATFORM_COLOR_SCHEMES[this.movingPlatformScheme];

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

            // Conveyor belt base (metal platform) - using color scheme
            createBeltPath();
            const gradient = context.createLinearGradient(r.x, r.y, r.x, r.y + r.height);
            gradient.addColorStop(0, colorScheme.base);
            gradient.addColorStop(0.3, this.darkenColor(colorScheme.base, 0.3));
            gradient.addColorStop(0.7, this.darkenColor(colorScheme.base, 0.5));
            gradient.addColorStop(1, this.darkenColor(colorScheme.base, 0.7));
            context.fillStyle = gradient;
            context.fill();

            // Clip for the internal elements only
            createBeltPath();
            context.clip();

            // Metal side rails - using color scheme
            context.fillStyle = colorScheme.rail;
            const railThickness = 3;
            context.fillRect(r.x, r.y, r.width, railThickness); // Top rail
            context.fillRect(r.x, r.y + r.height - railThickness, r.width, railThickness); // Bottom rail
            
            // Moving belt surface - using color scheme
            context.fillStyle = colorScheme.surface;
            context.fillRect(r.x, r.y + railThickness, r.width, r.height - railThickness * 2);

            // Moving belt pattern (diagonal lines) - using color scheme
            context.strokeStyle = colorScheme.pattern;
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

            // Rotating gears for direction indication - using color scheme
            context.fillStyle = colorScheme.gear;
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
                
                // Center hole - using color scheme
                context.fillStyle = colorScheme.gearCenter;
                context.beginPath();
                context.arc(0, 0, gearRadius * 0.25, 0, Math.PI * 2);
                context.fill();
                
                // Add visible spokes for better rotation visibility
                context.strokeStyle = colorScheme.gearCenter;
                context.lineWidth = 2;
                for (let spoke = 0; spoke < 4; spoke++) {
                    const spokeAngle = (spoke / 4) * Math.PI * 2;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(Math.cos(spokeAngle) * dentRadius, Math.sin(spokeAngle) * dentRadius);
                    context.stroke();
                }
                
                context.restore();
                context.fillStyle = colorScheme.gear; // Reset color for next gear
            }

            // Moving rail segments (visible pieces on the light gray rails) - using color scheme
            context.fillStyle = colorScheme.segment;
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

        // Draw spiders
        this.spiders.forEach(spider => {
            spider.draw(context);
        });

        // Draw decorative elements (trees, shrubs, etc.)
        this.decorativeElements.forEach(d => {
            d.draw(context, s); // Call the draw method of the Plant object
        });

        // Draw ladders
        this.ladders.forEach(ladder => {
            const s = TILE_SIZE / 16; // Scale factor for drawing details
            
            // Ladder side rails (vertical) - yellow/gold color
            context.fillStyle = '#DAA520'; // Golden rod
            context.fillRect(ladder.x + 2 * s, ladder.y, 2 * s, TILE_SIZE); // Left rail
            context.fillRect(ladder.x + 12 * s, ladder.y, 2 * s, TILE_SIZE); // Right rail
            
            // Single ladder rung (horizontal) - centered in the tile
            const rungY = ladder.y + TILE_SIZE / 2; // Center the rung vertically
            context.fillStyle = '#FFD700'; // Gold for rung
            context.fillRect(ladder.x + 2 * s, rungY - s, 12 * s, 2 * s);
            
            // Add subtle highlight to make rung more visible
            context.fillStyle = '#FFFF99'; // Light yellow highlight
            context.fillRect(ladder.x + 2 * s, rungY - s, 12 * s, s);
            
            // Add side rail highlights - brighter gold
            context.fillStyle = '#FFD700'; // Gold for highlights
            context.fillRect(ladder.x + 2 * s, ladder.y, s, TILE_SIZE); // Left rail highlight
            context.fillRect(ladder.x + 13 * s, ladder.y, s, TILE_SIZE); // Right rail highlight
        });

    }

    drawTwoLayerPlatform(context, p, dirtSchemeKey, surfaceSchemeKey, decay = 0) {
        const dirtColorScheme = DIRT_COLOR_SCHEMES[dirtSchemeKey] || DIRT_COLOR_SCHEMES[DEFAULT_DIRT_SCHEME];
        const surfaceColorScheme = SURFACE_COLOR_SCHEMES[surfaceSchemeKey] || SURFACE_COLOR_SCHEMES[DEFAULT_SURFACE_SCHEME];

        const crumbleProgress = decay > 0 ? decay / 30 : 0;
        const crumbleHeight = Math.floor(crumbleProgress * p.height);

        context.save();
        context.beginPath();
        context.rect(p.x, p.y + crumbleHeight, p.width, p.height - crumbleHeight);
        context.clip();

        // Draw dirt base (same as dirt tiles)
        context.fillStyle = dirtColorScheme.base;
        context.fillRect(p.x, p.y, p.width, p.height);

        // Create patchy, uneven dirt surface (same as dirt)
        const globalTileX = p.x / TILE_SIZE;
        const globalTileY = p.y / TILE_SIZE;

        // Add multiple patches of different dirt colors - draw patches that extend beyond tile boundaries
        for (let patch = 0; patch < 15; patch++) {
            const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
            const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;

            const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; // Extend beyond tile
            const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
            const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
            const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;

            const patchX = p.x - 8 + Math.floor(patchRandX * (p.width + 16)); // Extend 8px on each side
            const patchY = p.y - 8 + Math.floor(patchRandY * (p.height + 16)); // Extend 8px above/below
            const patchW = Math.floor(4 + patchRandSize * 8);
            const patchH = Math.floor(4 + patchRandSize * 8);

            // Choose patch color based on the patch index and random value
            let patchColor;
            if (patchRandColor < 0.25) {
                patchColor = dirtColorScheme.patch1;
            } else if (patchRandColor < 0.5) {
                patchColor = dirtColorScheme.patch2;
            } else if (patchRandColor < 0.75) {
                patchColor = dirtColorScheme.patch3;
            } else {
                // Add rocks/pebbles in the dirt
                if (patch % 3 === 0) {
                    patchColor = dirtColorScheme.rock1;
                } else if (patch % 3 === 1) {
                    patchColor = dirtColorScheme.rock2;
                } else {
                    patchColor = dirtColorScheme.rock3;
                }
            }

            context.fillStyle = patchColor;
            context.fillRect(patchX, patchY, patchW, patchH);
        }

        // Draw jagged bottom edge (same as dirt)
        context.fillStyle = dirtColorScheme.patch3; // Use darkest dirt color for bottom edge
        for (let i = 0; i < p.width; i += 2) {
            const edgeRandX = (globalTileX * 71 + i * 13) % 11;
            const edgeHeight = Math.floor(Math.sin(edgeRandX) * 2 + 3);
            context.fillRect(p.x + i, p.y + p.height - edgeHeight, 2, edgeHeight);
        }

        // Draw the surface layer based on surface scheme
        if (surfaceSchemeKey === 'grass') {
            this.drawGrassSurface(context, p, surfaceColorScheme);
        } else if (surfaceSchemeKey === 'ice') {
            this.drawIceSurface(context, p, surfaceColorScheme);
        }

        context.restore();
    }

    drawTwoLayerPlatformWithCustomScheme(context, p, dirtColorScheme, surfaceSchemeKey, decay = 0) {
        const surfaceColorScheme = SURFACE_COLOR_SCHEMES[surfaceSchemeKey] || SURFACE_COLOR_SCHEMES[DEFAULT_SURFACE_SCHEME];

        const crumbleProgress = decay > 0 ? decay / 30 : 0;
        const crumbleHeight = Math.floor(crumbleProgress * p.height);

        context.save();
        context.beginPath();
        context.rect(p.x, p.y + crumbleHeight, p.width, p.height - crumbleHeight);
        context.clip();

        // Draw dirt base (same as dirt tiles)
        context.fillStyle = dirtColorScheme.base;
        context.fillRect(p.x, p.y, p.width, p.height);

        // Create patchy, uneven dirt surface (same as dirt)
        const globalTileX = p.x / TILE_SIZE;
        const globalTileY = p.y / TILE_SIZE;

        // Add multiple patches of different dirt colors - draw patches that extend beyond tile boundaries
        for (let patch = 0; patch < 15; patch++) {
            const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
            const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;

            const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; // Extend beyond tile
            const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
            const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
            const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;

            const patchX = p.x - 8 + Math.floor(patchRandX * (p.width + 16)); // Extend 8px on each side
            const patchY = p.y - 8 + Math.floor(patchRandY * (p.height + 16)); // Extend 8px above/below
            const patchW = Math.floor(4 + patchRandSize * 8);
            const patchH = Math.floor(4 + patchRandSize * 8);

            // Choose patch color based on the patch index and random value
            let patchColor;
            if (patchRandColor < 0.25) {
                patchColor = dirtColorScheme.patch1;
            } else if (patchRandColor < 0.5) {
                patchColor = dirtColorScheme.patch2;
            } else if (patchRandColor < 0.75) {
                patchColor = dirtColorScheme.patch3;
            } else {
                // Add rocks/pebbles in the dirt
                if (patch % 3 === 0) {
                    patchColor = dirtColorScheme.rock1;
                } else if (patch % 3 === 1) {
                    patchColor = dirtColorScheme.rock2;
                } else {
                    patchColor = dirtColorScheme.rock3;
                }
            }

            context.fillStyle = patchColor;
            context.fillRect(patchX, patchY, patchW, patchH);
        }

        // Draw jagged bottom edge (same as dirt)
        context.fillStyle = dirtColorScheme.patch3; // Use darkest dirt color for bottom edge
        for (let i = 0; i < p.width; i += 2) {
            const edgeRandX = (globalTileX * 71 + i * 13) % 11;
            const edgeHeight = Math.floor(Math.sin(edgeRandX) * 2 + 3);
            context.fillRect(p.x + i, p.y + p.height - edgeHeight, 2, edgeHeight);
        }

        // Draw the surface layer based on surface scheme
        if (surfaceSchemeKey === 'grass') {
            this.drawGrassSurface(context, p, surfaceColorScheme);
        } else if (surfaceSchemeKey === 'ice') {
            this.drawIceSurface(context, p, surfaceColorScheme);
        }

        context.restore();
    }

    drawGrassSurface(context, g, colorScheme) {
        const grassHeight = Math.floor(g.height / 4); // Top quarter
        const inset = 2; // Leave a border of dirt showing around the grass

        // Fill with base grass color, but inset from edges
        context.fillStyle = colorScheme.base;
        context.fillRect(g.x + inset, g.y + inset, g.width - inset * 2, grassHeight - inset);

        // Add static grass texture patches (adjusted for inset)
        context.fillStyle = colorScheme.patch1;
        context.fillRect(g.x + 4, g.y + 3, 5, 2);
        context.fillStyle = colorScheme.patch2;
        context.fillRect(g.x + 10, g.y + 2, 4, 2);
        context.fillStyle = colorScheme.patch3;
        context.fillRect(g.x + 17, g.y + 4, 4, 2);

        // Add static grass blades (adjusted for inset)
        context.fillStyle = colorScheme.blade;
        context.fillRect(g.x + 5, g.y + inset, 1, 2);
        context.fillRect(g.x + 12, g.y + inset + 1, 1, 3);
        context.fillRect(g.x + 20, g.y + inset, 1, 2);
    }

    drawIceSurface(context, p, colorScheme) {
        const iceHeight = Math.floor(p.height / 4);
        const inset = 2; // Leave a border of dirt showing around the ice

        // Fill with base ice color, but inset from edges
        context.fillStyle = colorScheme.base;
        context.fillRect(p.x + inset, p.y + inset, p.width - inset * 2, iceHeight - inset);

        // Add static patches of different blue colors (adjusted for inset)
        context.fillStyle = colorScheme.patch1;
        context.fillRect(p.x + 5, p.y + 2, 6, 2);
        context.fillStyle = colorScheme.patch2;
        context.fillRect(p.x + 12, p.y + 3, 5, 2);
        context.fillStyle = colorScheme.patch3;
        context.fillRect(p.x + 20, p.y + 2, 4, 2);

        // Draw static cracks (adjusted for inset)
        context.strokeStyle = colorScheme.crack;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(p.x + 7, p.y + inset);
        context.lineTo(p.x + 12, p.y + iceHeight - 1);
        context.moveTo(p.x + 17, p.y + inset);
        context.lineTo(p.x + 22, p.y + iceHeight - 1);
        context.stroke();
    }

    // Helper function to darken a color for gradient effects
    darkenColor(color, factor) {
        // Convert hex color to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Apply darkening factor
        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
}