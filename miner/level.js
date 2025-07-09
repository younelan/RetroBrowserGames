class Level {
    constructor(levelData) {
        this.map = levelData.map;
        this.name = levelData.name;
        this.platforms = [];
        this.keys = [];
        this.enemies = [];
        this.hazards = [];
        this.crumblingPlatforms = [];
        this.brickFloors = [];
        this.movingLeftFloors = [];
        this.movingRightFloors = [];
        this.decorativeElements = [];
        this.portal = null;
        this.playerStart = { x: 0, y: 0 };

        this.parseMap();
    }

    parseMap() {
        const mapRows = this.map.trim().split('\n');
        for (let y = 0; y < mapRows.length; y++) {
            for (let x = 0; x < mapRows[y].length; x++) {
                const char = mapRows[y][x];
                const worldX = x * TILE_SIZE;
                const worldY = y * TILE_SIZE;

                switch (char) {
                    case 'X':
                        this.platforms.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
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
                    case 'C':
                        this.crumblingPlatforms.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, decay: 0, type: char });
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
                    
                    case 'B':
                        this.brickFloors.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                    case 'L':
                        this.movingLeftFloors.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                    case 'R':
                        this.movingRightFloors.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                    case 'T':
                        this.decorativeElements.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: char });
                        break;
                }
            }
        }
    }

    draw(context, frameCounter, allKeysCollected) {
        const s = TILE_SIZE / 16; // Scale factor for drawing details (moved to top)
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

        // Draw crumbling platforms
        this.crumblingPlatforms.forEach(p => {
            const decayProgress = p.decay / 30; // Normalize decay to 0-1
            const currentHeight = p.height * (1 - decayProgress);
            const currentY = p.y + (p.height - currentHeight);

            // Change color as it decays
            const r = Math.floor(139 + (255 - 139) * decayProgress); // From brown to lighter
            const g = Math.floor(69 + (255 - 69) * decayProgress);
            const b = Math.floor(19 + (255 - 19) * decayProgress);
            context.fillStyle = `rgb(${r},${g},${b})`;

            context.fillRect(p.x, currentY, p.width, currentHeight);
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

        // Draw moving left floors
        this.movingLeftFloors.forEach(l => {
            context.save();
            context.beginPath();
            context.rect(l.x, l.y, l.width, l.height);
            context.clip();

            context.fillStyle = '#00FF00'; // Green base
            context.fillRect(l.x, l.y, l.width, l.height);

            // Draw scrolling pattern (e.g., arrows or lines)
            context.fillStyle = '#00AA00'; // Darker green for pattern
            const patternWidth = 16; // Width of each pattern segment
            const scrollOffset = (frameCounter * -0.5) % patternWidth; // Slower speed and wrap-around

            for (let x = -patternWidth + scrollOffset; x < l.width; x += patternWidth) {
                // Draw a simple arrow pointing left
                context.beginPath();
                context.moveTo(l.x + x + patternWidth - 4, l.y + l.height / 2 - 4);
                context.lineTo(l.x + x + 4, l.y + l.height / 2);
                context.lineTo(l.x + x + patternWidth - 4, l.y + l.height / 2 + 4);
                context.fill();
            }
            context.restore();
        });

        // Draw moving right floors
        this.movingRightFloors.forEach(r => {
            context.save();
            context.beginPath();
            context.rect(r.x, r.y, r.width, r.height);
            context.clip();

            context.fillStyle = '#0000FF'; // Blue base
            context.fillRect(r.x, r.y, r.width, r.height);

            // Draw scrolling pattern (e.g., arrows or lines)
            context.fillStyle = '#0000AA'; // Darker blue for pattern
            const patternWidth = 16; // Width of each pattern segment
            const scrollOffset = (frameCounter * 0.5) % patternWidth; // Slower speed and wrap-around (opposite direction)

            for (let x = -patternWidth + scrollOffset; x < r.width; x += patternWidth) {
                // Draw a simple arrow pointing right
                context.beginPath();
                context.moveTo(r.x + x + 4, r.y + r.height / 2 - 4);
                context.lineTo(r.x + x + patternWidth - 4, r.y + r.height / 2);
                context.lineTo(r.x + x + 4, r.y + r.height / 2 + 4);
                context.fill();
            }
            context.restore();
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
    }
}
