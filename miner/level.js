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
                        this.enemies.push(new Enemy(worldX, worldY - TILE_SIZE, 'H'));
                        break;
                    case 'V':
                        this.enemies.push(new Enemy(worldX, worldY - TILE_SIZE, 'V'));
                        break;
                    case 'Z':
                        this.enemies.push(new Enemy(worldX, worldY - TILE_SIZE, 'C'));
                        break;
                    case 'C':
                        this.crumblingPlatforms.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, decay: 0, type: char });
                        break;
                    
                    case 'I':
                        this.hazards.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: 'SPIKES' });
                        break;
                    case 'F':
                        this.hazards.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, type: 'FIRE' });
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
                // Open door (frame only, transparent inside)
                context.fillStyle = 'lime';
                // Draw top part of frame
                context.fillRect(this.portal.x, this.portal.y, this.portal.width, 4); // Top border
                // Draw bottom part of frame
                context.fillRect(this.portal.x, this.portal.y + this.portal.height - 4, this.portal.width, 4); // Bottom border
                // Draw left part of frame
                context.fillRect(this.portal.x, this.portal.y, 4, this.portal.height); // Left border
                // Draw right part of frame
                context.fillRect(this.portal.x + this.portal.width - 4, this.portal.y, 4, this.portal.height); // Right border

            } else {
                // Closed door (purple, with a handle)
                context.fillStyle = 'purple';
                context.fillRect(this.portal.x, this.portal.y, this.portal.width, this.portal.height);
                // Door handle
                context.fillStyle = 'gold';
                context.beginPath();
                context.arc(this.portal.x + this.portal.width * 0.75, this.portal.y + this.portal.height * 0.5, 3, 0, Math.PI * 2);
                context.fill();
            }
        }

        // Draw hazards
        this.hazards.forEach(h => {
            const s = h.width / 16; // Scale factor
            switch (h.type) {
                case 'SPIKES':
                    context.fillStyle = '#666'; // Grey spikes
                    // Draw multiple triangles for spikes
                    for (let i = 0; i < 4; i++) {
                        context.beginPath();
                        context.moveTo(h.x + i * (h.width / 4), h.y + h.height);
                        context.lineTo(h.x + i * (h.width / 4) + (h.width / 8), h.y + h.height - h.height / 2);
                        context.lineTo(h.x + (i + 1) * (h.width / 4), h.y + h.height);
                        context.fill();
                    }
                    break;
                case 'FIRE':
                    // Animated fire (simple)
                    const fireColor1 = 'orange';
                    const fireColor2 = 'red';
                    const fireColor3 = 'yellow';

                    context.fillStyle = (Math.floor(frameCounter / 5) % 3 === 0) ? fireColor1 : (Math.floor(frameCounter / 5) % 3 === 1) ? fireColor2 : fireColor3;
                    context.fillRect(h.x, h.y + h.height / 2, h.width, h.height / 2); // Base of fire
                    context.beginPath();
                    context.moveTo(h.x, h.y + h.height / 2);
                    context.lineTo(h.x + h.width / 2, h.y);
                    context.lineTo(h.x + h.width, h.y + h.height / 2);
                    context.fill();
                    break;
                case 'GENERIC':
                default:
                    context.fillStyle = 'orange';
                    context.fillRect(h.x, h.y, h.width, h.height);
                    break;
            }
        });

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

        // Draw brick floors
        this.brickFloors.forEach(b => {
            context.fillStyle = '#8B4513'; // SaddleBrown
            context.fillRect(b.x, b.y, b.width, b.height);
            // Add some brick-like details
            context.strokeStyle = '#5A2C0B';
            context.lineWidth = 2;
            context.strokeRect(b.x, b.y, b.width, b.height);
            context.beginPath();
            context.moveTo(b.x + b.width / 2, b.y);
            context.lineTo(b.x + b.width / 2, b.y + b.height);
            context.stroke();
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
