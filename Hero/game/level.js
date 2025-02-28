class Level {
    constructor(levelData) {
        this.map = levelData.map.trim().split('\n').map(row => row.split(''));
        this.viewport = levelData.viewport;
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
        return (tile in WALLS && tile !== '+') || tile === '=' || tile === '^' || tile === '&' || tile === '*' || tile === '!';
    }

    isComplete() {
        return this.miners.every(miner => miner.rescued);
    }

    render(ctx, cameraX, cameraY) {
        // Draw level
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const screenX = x * GAME_CONSTANTS.TILE_SIZE - cameraX;
                const screenY = y * GAME_CONSTANTS.TILE_SIZE - cameraY;
                
                // Only render tiles that are within the viewport
                if (screenX >= -GAME_CONSTANTS.TILE_SIZE && 
                    screenX <= ctx.canvas.width &&
                    screenY >= -GAME_CONSTANTS.TILE_SIZE && 
                    screenY <= ctx.canvas.height) {
                    
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
                    } else if (tile === '!') {
                        // Draw lava with animated bubbles
                        ctx.fillStyle = '#FF4500';  // Orange-red base
                        ctx.fillRect(screenX, screenY, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                        
                        // Add bubbles
                        const time = performance.now() / 1000;
                        ctx.fillStyle = '#FFA500';  // Lighter orange for bubbles
                        for (let i = 0; i < 3; i++) {
                            const bubbleX = screenX + (Math.sin(time * 2 + i) + 1) * GAME_CONSTANTS.TILE_SIZE/3;
                            const bubbleY = screenY + ((Math.sin(time * 3 + i) + 1) / 2) * GAME_CONSTANTS.TILE_SIZE;
                            ctx.beginPath();
                            ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                        // Add glow effect
                        ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
                        ctx.fillRect(screenX - 2, screenY - 2, GAME_CONSTANTS.TILE_SIZE + 4, GAME_CONSTANTS.TILE_SIZE + 4);
                    } else if (tile === '^') {
                        const centerX = screenX + GAME_CONSTANTS.TILE_SIZE/2;
                        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE/2;
                        const time = performance.now() / 1000;
                        const bobY = Math.sin(time * 2) * 6;  // Slower, wider bob
                        
                        // Draw web
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.lineWidth = 1;
                        // Main thread
                        ctx.beginPath();
                        ctx.moveTo(centerX, screenY);
                        ctx.lineTo(centerX, centerY + bobY);
                        ctx.stroke();
                        // Cross threads
                        for (let i = 0; i < 3; i++) {
                            const y = screenY + 5 + i * 8;
                            const width = 3 + i * 2;
                            ctx.beginPath();
                            ctx.moveTo(centerX - width, y);
                            ctx.lineTo(centerX + width, y);
                            ctx.stroke();
                        }
                        
                        // Draw spider
                        const bodyGradient = ctx.createRadialGradient(
                            centerX, centerY + bobY, 0,
                            centerX, centerY + bobY, 8
                        );
                        bodyGradient.addColorStop(0, '#AA0000');
                        bodyGradient.addColorStop(1, '#660000');
                        
                        // Body segments
                        ctx.fillStyle = bodyGradient;
                        // Rear segment
                        ctx.beginPath();
                        ctx.ellipse(centerX, centerY + bobY + 2, 6, 8, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Front segment
                        ctx.beginPath();
                        ctx.ellipse(centerX, centerY + bobY - 4, 5, 6, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Eyes
                        ctx.fillStyle = 'white';
                        const eyeX = 2;
                        const eyeY = -6;
                        ctx.beginPath();
                        ctx.arc(centerX - eyeX, centerY + bobY + eyeY, 1.5, 0, Math.PI * 2);
                        ctx.arc(centerX + eyeX, centerY + bobY + eyeY, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Legs
                        ctx.strokeStyle = '#AA0000';
                        ctx.lineWidth = 2;
                        const legCount = 4;
                        for (let side = -1; side <= 1; side += 2) {
                            for (let i = 0; i < legCount; i++) {
                                const baseAngle = (i / (legCount-1) - 0.5) * Math.PI * 0.8;
                                const legTime = time * 3 + i * Math.PI / 3;
                                const legBend = Math.sin(legTime) * 0.2;
                                
                                ctx.beginPath();
                                ctx.moveTo(centerX, centerY + bobY);
                                
                                // Middle joint
                                const mid1X = centerX + Math.cos(baseAngle) * 8 * side;
                                const mid1Y = centerY + bobY + Math.sin(baseAngle) * 8;
                                ctx.lineTo(mid1X, mid1Y);
                                
                                // End point
                                const endX = mid1X + Math.cos(baseAngle + legBend) * 8 * side;
                                const endY = mid1Y + Math.sin(baseAngle + legBend) * 8;
                                ctx.lineTo(endX, endY);
                                
                                ctx.stroke();
                            }
                        }
                    } else if (tile === '&') {
                        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE/2;
                        const time = performance.now() / 1000;
                        const wiggle = Math.sin(time * 3) * 6;
                        
                        // Snake body
                        const gradient = ctx.createLinearGradient(
                            screenX, centerY,
                            screenX + GAME_CONSTANTS.TILE_SIZE, centerY
                        );
                        gradient.addColorStop(0, '#50C878');  // Emerald green
                        gradient.addColorStop(1, '#228B22');  // Forest green
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 10;
                        ctx.lineCap = 'round';
                        
                        // Wavy body
                        ctx.beginPath();
                        ctx.moveTo(screenX + 6, centerY);
                        const points = 3;
                        for (let i = 0; i <= points; i++) {
                            const x = screenX + 6 + (GAME_CONSTANTS.TILE_SIZE - 12) * (i/points);
                            const y = centerY + Math.sin(time * 4 + i * 2) * wiggle;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                        
                        // Head
                        const headX = screenX + GAME_CONSTANTS.TILE_SIZE - 6;
                        const headY = centerY + Math.sin(time * 4 + 6) * wiggle;
                        
                        ctx.fillStyle = '#228B22';  // Forest green
                        ctx.beginPath();
                        ctx.ellipse(headX, headY, 6, 5, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Eyes
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(headX + 2, headY - 2, 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(headX + 2, headY - 2, 1, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Tongue
                        const tongueTime = time * 8;
                        const tongueLength = (Math.sin(tongueTime) + 1) * 3;  // Flicking animation
                        ctx.strokeStyle = '#FF3333';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(headX + 4, headY);
                        ctx.lineTo(headX + 4 + tongueLength, headY - 2);
                        ctx.moveTo(headX + 4 + tongueLength - 1, headY);
                        ctx.lineTo(headX + 4 + tongueLength, headY + 2);
                        ctx.stroke();
                    } else if (tile === '*') {
                        const centerX = screenX + GAME_CONSTANTS.TILE_SIZE/2;
                        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE/2;
                        const time = performance.now() / 1000;
                        
                        // Outer glow
                        const glowSize = 1 + Math.sin(time * 3) * 0.1;  // Pulsing effect
                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, GAME_CONSTANTS.TILE_SIZE/1.5 * glowSize
                        );
                        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
                        gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.2)');
                        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(
                            screenX - GAME_CONSTANTS.TILE_SIZE/3,
                            screenY - GAME_CONSTANTS.TILE_SIZE/3,
                            GAME_CONSTANTS.TILE_SIZE * 1.6,
                            GAME_CONSTANTS.TILE_SIZE * 1.6
                        );
                        
                        // Chain
                        ctx.strokeStyle = '#B8860B';
                        ctx.lineWidth = 2;
                        const chainLinks = 3;
                        for (let i = 0; i < chainLinks; i++) {
                            const y = screenY + 4 + i * 6;
                            ctx.beginPath();
                            ctx.moveTo(centerX - 3, y);
                            ctx.lineTo(centerX + 3, y);
                            ctx.stroke();
                        }
                        
                        // Lamp body
                        const lampGradient = ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, 8
                        );
                        lampGradient.addColorStop(0, '#FFF7B3');  // Bright center
                        lampGradient.addColorStop(0.5, '#FFD700');  // Gold
                        lampGradient.addColorStop(1, '#B8860B');  // Dark gold edge
                        
                        ctx.fillStyle = lampGradient;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Highlight
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.beginPath();
                        ctx.arc(centerX - 2, centerY - 2, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
        
        // Render miners
        for (const miner of this.miners) {
            if (!miner.rescued) {
                const screenX = miner.x * GAME_CONSTANTS.TILE_SIZE - cameraX;
                const screenY = miner.y * GAME_CONSTANTS.TILE_SIZE - cameraY;
                
                // Only render miners that are within the viewport
                if (screenX >= -GAME_CONSTANTS.TILE_SIZE && 
                    screenX <= ctx.canvas.width &&
                    screenY >= -GAME_CONSTANTS.TILE_SIZE && 
                    screenY <= ctx.canvas.height) {
                    
                    ctx.fillStyle = 'white';
                    ctx.font = '40px Arial';
                    ctx.fillText('👷', screenX, screenY + GAME_CONSTANTS.TILE_SIZE - 8);
                }
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
