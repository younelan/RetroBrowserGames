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

        // Store map rows for checking adjacent tiles
        this.mapRows = this.map.trim().split('\n');

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
                const centerX = l.x + (tileIndex * TILE_SIZE) + (TILE_SIZE / 2);
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
                
                // Draw gear with thick triangular blades (same as left floors)
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
