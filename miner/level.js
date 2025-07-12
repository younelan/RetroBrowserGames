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
        this.platforms = []; // All platform tile objects (Wall, Dirt, MovingWalkway)
        this.keys = [];
        this.enemies = [];
        this.hazards = [];
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

        // Platform arrays will be derived from the unified platforms array

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

    // Getter to provide collision objects for enemies
    get allPlatforms() {
        return this.platforms.filter(p => !p.crumbled); // Exclude crumbled platforms from collision
    }

    get solidPlatforms() {
        return this.platforms.filter(p => !['<', '>', '-', ';'].includes(p.type) && !p.crumbled);
    }

    get movingPlatforms() {
        return this.platforms.filter(p => (p.type === '<' || p.type === '>') && !p.crumbled);
    }

    get crumblePlatforms() {
        return this.platforms.filter(p => (p.type === '-' || p.type === ';') && !p.crumbled);
    }

    // Helper method to darken a color for gradient effects
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

                    // Platform arrays are now computed via getters

                    // Create platform tile objects
                    let platformTile = null;
                    switch (char) {
                        case 'X':
                        case '_':
                            platformTile = new Wall(worldX, worldY, TILE_SIZE, TILE_SIZE, char, this.brickScheme);
                            break;
                        case '=':
                        case ':':
                            platformTile = new Dirt(worldX, worldY, TILE_SIZE, TILE_SIZE, char, this.dirtScheme, this.surfaceScheme);
                            break;
                        case ';':
                        case '-':
                            platformTile = new Dirt(worldX, worldY, TILE_SIZE, TILE_SIZE, char, this.dirtScheme, this.surfaceScheme, 0);
                            break;
                        case '<':
                        case '>':
                            platformTile = new MovingWalkway(worldX, worldY, TILE_SIZE, TILE_SIZE, char, this);
                            break;
                    }
                    
                    if (platformTile) {
                        this.platforms.push(platformTile);
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

    setPlayerReference(player) {
        // Set player reference for crumbling platforms
        this.platforms.forEach(platform => {
            if (platform.setPlayer && (platform.type === '-' || platform.type === ';')) {
                platform.setPlayer(player);
            }
        });
    }

    setLevelReference() {
        // Set level reference for tiles that need it
        this.platforms.forEach(platform => {
            if (platform.setLevel) {
                platform.setLevel(this);
            }
        });
    }

    updateTiles() {
        // Update all platforms that have update methods
        this.platforms.forEach(platform => {
            if (platform.update) {
                platform.update();
            }
        });

        // Remove crumbled tiles from platforms array
        this.platforms = this.platforms.filter(platform => {
            // Keep platform if it doesn't have crumbled property or if it's not crumbled
            return !platform.crumbled;
        });

        // Collision arrays are automatically updated via getters
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

        // Draw all platforms using their draw methods
        this.platforms.forEach(platform => {
            if (platform.draw) {
                // Pass frameCounter for MovingWalkway animations
                platform.draw(context, frameCounter);
            }
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
            context.fillRect(7.5 * s, 8 * s, 1 * s, 8 * s);

            // Key Bit (teeth)
            context.fillRect(6 * s, 14 * s, 1 * s, 2 * s);
            context.fillRect(9 * s, 14 * s, 1 * s, 2 * s);

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
                context.fillRect(portalX, portalY, portalW, 6);
                context.fillRect(portalX, portalY + portalH - 6, portalW, 6);
                context.fillRect(portalX, portalY, 6, portalH);
                context.fillRect(portalX + portalW - 6, portalY, 6, portalH);
                
                // Inner stone detail
                context.fillStyle = '#A0896B'; // Lighter stone
                context.fillRect(portalX + 6, portalY + 6, portalW - 12, 3);
                context.fillRect(portalX + 6, portalY + portalH - 9, portalW - 12, 3);
                context.fillRect(portalX + 6, portalY + 6, 3, portalH - 12);
                context.fillRect(portalX + portalW - 9, portalY + 6, 3, portalH - 12);
                
                // Stone shadows for depth
                context.fillStyle = '#6B5D42'; // Dark stone shadow
                context.fillRect(portalX + 3, portalY + 3, portalW - 6, 3);
                context.fillRect(portalX + 3, portalY + 3, 3, portalH - 6);
                
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
                context.fillRect(portalX + 4, portalY + 8, portalW - 8, 4);
                context.fillRect(portalX + 4, portalY + portalH - 12, portalW - 8, 4);
                context.fillRect(portalX + 4, portalY + portalH/2 - 2, portalW - 8, 4);
                
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
                context.fillRect(handleX - 1, handleY, 2, 4);
                
                // Door frame shadow
                context.fillStyle = 'rgba(0, 0, 0, 0.3)';
                context.fillRect(portalX - 2, portalY - 2, 2, portalH + 4);
                context.fillRect(portalX, portalY - 2, portalW, 2);
            }
        }

        // Draw hazards
        this.hazards.forEach(h => h.draw(context, frameCounter));

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
            d.draw(context, s);
        });

        // Draw ladders
        this.ladders.forEach(ladder => {
            const s = TILE_SIZE / 16;
            
            // Ladder side rails (vertical) - yellow/gold color
            context.fillStyle = '#DAA520'; // Golden rod
            context.fillRect(ladder.x + 2 * s, ladder.y, 2 * s, TILE_SIZE);
            context.fillRect(ladder.x + 12 * s, ladder.y, 2 * s, TILE_SIZE);
            
            // Single ladder rung (horizontal) - centered in the tile
            const rungY = ladder.y + TILE_SIZE / 2;
            context.fillStyle = '#FFD700'; // Gold for rung
            context.fillRect(ladder.x + 2 * s, rungY - s, 12 * s, 2 * s);
            
            // Add subtle highlight to make rung more visible
            context.fillStyle = '#FFFF99'; // Light yellow highlight
            context.fillRect(ladder.x + 2 * s, rungY - s, 12 * s, s);
            
            // Add side rail highlights - brighter gold
            context.fillStyle = '#FFD700'; // Gold for highlights
            context.fillRect(ladder.x + 2 * s, ladder.y, s, TILE_SIZE);
            context.fillRect(ladder.x + 13 * s, ladder.y, s, TILE_SIZE);
        });

    }
}