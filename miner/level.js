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
                        this.portal = { x: worldX, y: worldY, width: TILE_SIZE, height: TILE_SIZE };
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
            context.fillStyle = 'gold';
            const s = k.width / 16; // Scale factor for a 16x16 sprite

            // Key head (circle)
            context.beginPath();
            context.arc(k.x + 8 * s, k.y + 5 * s, 4 * s, 0, Math.PI * 2);
            context.fill();

            // Key body (rectangle)
            context.fillRect(k.x + 7 * s, k.y + 9 * s, 2 * s, 6 * s);

            // Key teeth (small rectangles)
            context.fillRect(k.x + 5 * s, k.y + 14 * s, 2 * s, 2 * s);
            context.fillRect(k.x + 8 * s, k.y + 14 * s, 2 * s, 2 * s);
        });

        // Draw portal
        if (this.portal) {
            context.fillStyle = 'purple';
            context.fillRect(this.portal.x, this.portal.y, this.portal.width, this.portal.height);
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
