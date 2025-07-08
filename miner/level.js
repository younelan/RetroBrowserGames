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
                        this.platforms.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE });
                        break;
                    case '@':
                        this.playerStart = { x: worldX, y: worldY };
                        break;
                    case 'K':
                        this.keys.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE });
                        break;
                    case 'P':
                        this.portal = { x: worldX, y: worldY - TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2 };
                        break;
                    case 'E':
                        this.enemies.push(new Enemy(worldX, worldY, 'H'));
                        break;
                    case 'V':
                        this.enemies.push(new Enemy(worldX, worldY, 'V'));
                        break;
                    case 'Z':
                        this.enemies.push(new Enemy(worldX, worldY, 'C'));
                        break;
                    case 'H':
                        this.crumblingPlatforms.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE, decay: 0 });
                        break;
                    case 'H':
                        this.hazards.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE });
                        break;
                    case 'B':
                        this.brickFloors.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE });
                        break;
                    case 'L':
                        this.movingLeftFloors.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE });
                        break;
                    case 'R':
                        this.movingRightFloors.push({ x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE });
                        break;
                }
            }
        }
    }

    draw(context, frameCounter, allKeysCollected) {
        // Draw platforms
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
            context.fillStyle = 'orange';
            context.fillRect(h.x, h.y, h.width, h.height);
        });

        // Draw crumbling platforms
        this.crumblingPlatforms.forEach(p => {
            context.fillStyle = 'brown'; // Or some other distinct color
            context.fillRect(p.x, p.y, p.width, p.height);
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
            context.fillStyle = '#00FF00'; // Green
            context.fillRect(l.x, l.y, l.width, l.height);
            // Add left arrow animation
            const arrowWidth = l.width / 3;
            const arrowHeight = l.height / 3;
            const arrowX = l.x + l.width / 2 - arrowWidth / 2;
            const arrowY = l.y + l.height / 2 - arrowHeight / 2;
            context.fillStyle = 'black';
            context.beginPath();
            context.moveTo(arrowX + arrowWidth, arrowY);
            context.lineTo(arrowX, arrowY + arrowHeight / 2);
            context.lineTo(arrowX + arrowWidth, arrowY + arrowHeight);
            context.fill();
        });

        // Draw moving right floors
        this.movingRightFloors.forEach(r => {
            context.fillStyle = '#0000FF'; // Blue
            context.fillRect(r.x, r.y, r.width, r.height);
            // Add right arrow animation
            const arrowWidth = r.width / 3;
            const arrowHeight = r.height / 3;
            const arrowX = r.x + r.width / 2 - arrowWidth / 2;
            const arrowY = r.y + r.height / 2 - arrowHeight / 2;
            context.fillStyle = 'black';
            context.beginPath();
            context.moveTo(arrowX, arrowY);
            context.lineTo(arrowX + arrowWidth, arrowY + arrowHeight / 2);
            context.lineTo(arrowX, arrowY + arrowHeight);
            context.fill();
        });

        // Draw enemies
        this.enemies.forEach(e => e.draw(context));
    }
}
