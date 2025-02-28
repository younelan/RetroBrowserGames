class Level {
    constructor(levelString) {
        this.map = levelString.trim().split('\n').map(row => row.split(''));
        this.miners = [];
        
        // Find miners in the level
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === '+') {
                    this.miners.push({ x, y, rescued: false });
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
        return (tile in WALLS && tile !== '+') || tile === '=' || tile === '^' || tile === '&' || tile === '*';
    }

    isComplete() {
        return this.miners.every(miner => miner.rescued);
    }

    render(ctx, cameraY) {
        // Draw level
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const screenX = x * GAME_CONSTANTS.TILE_SIZE;
                const screenY = y * GAME_CONSTANTS.TILE_SIZE - cameraY;
                const tile = this.map[y][x];
                
                if (tile in WALLS) {
                    ctx.fillStyle = WALLS[tile];
                    ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                } else if (tile === '=') {
                    // Draw destructible wall (brick style)
                    ctx.fillStyle = WALLS[tile];
                    ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                    
                    // Add brick pattern
                    ctx.fillStyle = '#800000';
                    ctx.fillRect(screenX, screenY + GAME_CONSTANTS.TILE_SIZE/3, GAME_CONSTANTS.TILE_SIZE, 2);
                    ctx.fillRect(screenX, screenY + 2*GAME_CONSTANTS.TILE_SIZE/3, GAME_CONSTANTS.TILE_SIZE, 2);
                    ctx.fillRect(screenX + GAME_CONSTANTS.TILE_SIZE/2, screenY, 2, GAME_CONSTANTS.TILE_SIZE);
                } else if (tile === '^') {
                    // Draw spider platform (blue)
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                    
                    // Draw spider
                    const time = performance.now() / 1000;
                    const legOffset = Math.sin(time * 2) * 4;
                    
                    // Draw legs
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let i = 0; i < 4; i++) {
                        const angle = (i * Math.PI/2) + Math.sin(time * 2) * 0.2;
                        ctx.moveTo(
                            screenX + GAME_CONSTANTS.TILE_SIZE/2,
                            screenY + GAME_CONSTANTS.TILE_SIZE/2
                        );
                        ctx.lineTo(
                            screenX + GAME_CONSTANTS.TILE_SIZE/2 + Math.cos(angle) * (GAME_CONSTANTS.TILE_SIZE/3 + legOffset),
                            screenY + GAME_CONSTANTS.TILE_SIZE/2 + Math.sin(angle) * (GAME_CONSTANTS.TILE_SIZE/3 + legOffset)
                        );
                    }
                    ctx.stroke();
                    
                    // Draw body
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(
                        screenX + GAME_CONSTANTS.TILE_SIZE/2,
                        screenY + GAME_CONSTANTS.TILE_SIZE/2,
                        GAME_CONSTANTS.TILE_SIZE/4,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                } else if (tile === '&') {
                    // Draw snake platform (green)
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                    
                    // Draw snake
                    const time = performance.now() / 300;
                    ctx.strokeStyle = '#004400';
                    ctx.lineWidth = 8;
                    ctx.lineCap = 'round';
                    
                    // Snake body
                    ctx.beginPath();
                    ctx.moveTo(screenX + 4, screenY + GAME_CONSTANTS.TILE_SIZE/2);
                    for (let i = 0; i <= GAME_CONSTANTS.TILE_SIZE - 8; i += 4) {
                        const waveHeight = Math.sin(time + i/10) * 6;
                        ctx.lineTo(
                            screenX + i + 4,
                            screenY + GAME_CONSTANTS.TILE_SIZE/2 + waveHeight
                        );
                    }
                    ctx.stroke();
                    
                    // Snake head
                    ctx.fillStyle = '#004400';
                    ctx.beginPath();
                    ctx.arc(
                        screenX + GAME_CONSTANTS.TILE_SIZE - 8,
                        screenY + GAME_CONSTANTS.TILE_SIZE/2 + Math.sin(time + Math.PI) * 6,
                        6, 0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Snake eye
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(
                        screenX + GAME_CONSTANTS.TILE_SIZE - 10,
                        screenY + GAME_CONSTANTS.TILE_SIZE/2 + Math.sin(time + Math.PI) * 6 - 2,
                        2, 0, Math.PI * 2
                    );
                    ctx.fill();
                } else if (tile === '*') {
                    // Draw lamp platform (yellow)
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                    
                    // Draw lamp
                    ctx.beginPath();
                    ctx.arc(screenX + GAME_CONSTANTS.TILE_SIZE/2, 
                           screenY + GAME_CONSTANTS.TILE_SIZE/2,
                           GAME_CONSTANTS.TILE_SIZE/3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Glow effect
                    const gradient = ctx.createRadialGradient(
                        screenX + GAME_CONSTANTS.TILE_SIZE/2, screenY + GAME_CONSTANTS.TILE_SIZE/2, 0,
                        screenX + GAME_CONSTANTS.TILE_SIZE/2, screenY + GAME_CONSTANTS.TILE_SIZE/2, GAME_CONSTANTS.TILE_SIZE/2
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
                    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(screenX + GAME_CONSTANTS.TILE_SIZE/2, screenY + GAME_CONSTANTS.TILE_SIZE/2, GAME_CONSTANTS.TILE_SIZE/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // Render miners
        for (const miner of this.miners) {
            if (!miner.rescued) {
                const screenX = miner.x * GAME_CONSTANTS.TILE_SIZE;
                const screenY = miner.y * GAME_CONSTANTS.TILE_SIZE - cameraY;
                ctx.fillStyle = 'white';
                ctx.font = '40px Arial';
                ctx.fillText('👷', screenX, screenY + GAME_CONSTANTS.TILE_SIZE - 8);
            }
        }
    }
}

class LevelManager {
    constructor() {
        this.currentLevel = 0;
        this.grid = [];
        this.miners = [];
        this.dynamites = [];
        this.loadLevel(this.currentLevel);
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.grid = [];
        this.miners = [];
        this.dynamites = [];
        
        const level = LEVELS[levelNumber];
        if (!level) return false;

        // Initialize grid
        for (let y = 0; y < GAME_CONSTANTS.GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GAME_CONSTANTS.GRID_SIZE; x++) {
                this.grid[y][x] = {
                    type: level.map[y][x],
                    health: level.map[y][x] === 2 ? 100 : 0 // Destructible walls have health
                };
            }
        }

        // Load miners
        this.miners = level.miners.map(miner => ({
            x: miner.x * GAME_CONSTANTS.TILE_SIZE,
            y: miner.y * GAME_CONSTANTS.TILE_SIZE,
            rescued: false
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
        if (tile && tile.type === 2) { // Destructible wall
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

    rescueMiner(x, y) {
        const miner = this.miners.find(m => 
            !m.rescued &&
            Math.abs(m.x - x) < GAME_CONSTANTS.TILE_SIZE &&
            Math.abs(m.y - y) < GAME_CONSTANTS.TILE_SIZE
        );

        if (miner) {
            miner.rescued = true;
            return true;
        }
        return false;
    }

    isLevelComplete() {
        return this.miners.every(miner => miner.rescued);
    }
}
