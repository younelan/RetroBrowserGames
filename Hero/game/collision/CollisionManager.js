class CollisionManager {
    constructor(level) {
        this.level = level;
        this.tileSize = GAME_CONSTANTS.TILE_SIZE;
    }

    checkPlayerCollisions(player, entities) {
        this.checkGridCollisions(player);
        this.checkEnemyCollisions(player, entities.enemies);
        this.checkCollectibleCollisions(player, entities.collectibles);
        this.checkHazardCollisions(player);
        return this.checkGroundCollision(player);
    }

    checkGridCollisions(player) {
        const tiles = this.getEntityTiles(player);
        
        tiles.forEach(({x, y}) => {
            if (this.level.isWall(x, y)) {
                const wall = {
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                };
                this.resolveCollision(player, wall);
            }
        });
    }

    checkEnemyCollisions(player, enemies) {
        return enemies.some(enemy => {
            if (enemy.alive && this.hasCollision(player, enemy)) {
                player.handlePlayerDeath();
                return true;
            }
            return false;
        });
    }

    checkLaserCollisions(laser, enemies) {
        const startX = laser.x;
        const endX = startX + (laser.length * laser.direction);
        const y = laser.y;

        return enemies.filter(enemy => {
            if (!enemy.alive) return false;

            const enemyBox = {
                top: enemy.y,
                bottom: enemy.y + enemy.height,
                left: enemy.x,
                right: enemy.x + enemy.width
            };

            return (y >= enemyBox.top && y <= enemyBox.bottom) && 
                   ((laser.direction > 0 && enemyBox.left <= endX && enemyBox.right >= startX) ||
                    (laser.direction < 0 && enemyBox.right >= endX && enemyBox.left <= startX));
        });
    }

    checkCollectibleCollisions(player, collectibles) {
        const playerTiles = this.getEntityTiles(player);
        const collected = [];

        playerTiles.forEach(({x, y}) => {
            collectibles.forEach(collectible => {
                const collectibleX = Math.floor(collectible.x / this.tileSize);
                const collectibleY = Math.floor(collectible.y / this.tileSize);
                if (x === collectibleX && y === collectibleY && !collectible.collected) {
                    collected.push(collectible);
                }
            });
        });
        return collected;
    }

    checkHazardCollisions(player) {
        const tiles = this.getEntityTiles(player);
        return tiles.some(({x, y}) => this.level.isHazard(x, y));
    }

    checkGroundCollision(player) {
        // Check the tiles just below the player's feet
        const bottomY = Math.floor((player.y + player.height + 1) / this.tileSize);
        const leftX = Math.floor(player.x / this.tileSize);
        const rightX = Math.floor((player.x + player.width - 1) / this.tileSize);

        // Check all tiles under the player's width
        for (let x = leftX; x <= rightX; x++) {
            if (this.level.isWall(x, bottomY)) {
                // Only snap to ground if moving downward
                if (player.velocityY >= 0) {
                    player.y = bottomY * this.tileSize - player.height;
                    return true;
                }
            }
        }
        return false;
    }

    hasCollision(entity1, entity2) {
        return entity1.x < entity2.x + entity2.width &&
               entity1.x + entity1.width > entity2.x &&
               entity1.y < entity2.y + entity2.height &&
               entity1.y + entity1.height > entity2.y;
    }

    resolveCollision(entity, wall) {
        const overlapX = (entity.x + entity.width/2) - (wall.x + wall.width/2);
        const overlapY = (entity.y + entity.height/2) - (wall.y + wall.height/2);

        const minDistX = (entity.width + wall.width) / 2;
        const minDistY = (entity.height + wall.height) / 2;

        // Determine shortest axis to resolve collision
        if (Math.abs(overlapX/minDistX) < Math.abs(overlapY/minDistY)) {
            entity.x = overlapX > 0 ? wall.x + wall.width : wall.x - entity.width;
            entity.velocityX = 0;
        } else {
            entity.y = overlapY > 0 ? wall.y + wall.height : wall.y - entity.height;
            entity.velocityY = 0;
        }
    }

    getEntityTiles(entity) {
        const left = Math.floor(entity.x / this.tileSize);
        const right = Math.floor((entity.x + entity.width) / this.tileSize);
        const top = Math.floor(entity.y / this.tileSize);
        const bottom = Math.floor((entity.y + entity.height) / this.tileSize);

        const tiles = [];
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                tiles.push({x, y});
            }
        }
        return tiles;
    }

    handleGridCollisions(player) {
        // First check and handle level boundaries
        const levelWidth = this.level.map[0].length * this.tileSize;
        const levelHeight = this.level.map.length * this.tileSize;

        // Keep player within level bounds
        player.x = Math.max(0, Math.min(player.x, levelWidth - player.width));
        player.y = Math.max(0, Math.min(player.y, levelHeight - player.height));

        // Get surrounding tiles
        const tiles = this.getEntityTiles(player);
        
        // Before attempting collision resolution, store current position
        const originalX = player.x;
        const originalY = player.y;
        let collided = false;

        // First pass: collect all wall collision tiles
        const collisionTiles = tiles.filter(({x, y}) => this.level.isWall(x, y)).map(({x, y}) => ({
            x: x * this.tileSize,
            y: y * this.tileSize,
            width: this.tileSize,
            height: this.tileSize
        }));

        if (collisionTiles.length === 0) {
            return false; // No collisions
        }

        // Simplify collision handling - separate X and Y axis resolution
        
        // First, try to resolve X-axis collisions
        let xResolved = false;
        if (player.velocityX !== 0) {
            for (const wall of collisionTiles) {
                // Skip if we don't have an horizontal overlap
                if (player.y >= wall.y + wall.height || player.y + player.height <= wall.y) {
                    continue;
                }
                
                // Going right and hit left side of wall
                if (player.velocityX > 0 && player.x + player.width > wall.x && player.x < wall.x) {
                    player.x = wall.x - player.width;
                    player.velocityX = 0;
                    xResolved = true;
                    collided = true;
                    break;
                }
                // Going left and hit right side of wall
                else if (player.velocityX < 0 && player.x < wall.x + wall.width && player.x + player.width > wall.x + wall.width) {
                    player.x = wall.x + wall.width;
                    player.velocityX = 0;
                    xResolved = true;
                    collided = true;
                    break;
                }
            }
        }
        
        // Then, try to resolve Y-axis collisions
        let yResolved = false;
        if (player.velocityY !== 0) {
            for (const wall of collisionTiles) {
                // Skip if we don't have a vertical overlap
                if (player.x >= wall.x + wall.width || player.x + player.width <= wall.x) {
                    continue;
                }
                
                // Going down and hit top side of wall
                if (player.velocityY > 0 && player.y + player.height > wall.y && player.y < wall.y) {
                    player.y = wall.y - player.height;
                    player.velocityY = 0;
                    yResolved = true;
                    collided = true;
                    break;
                }
                // Going up and hit bottom side of wall
                else if (player.velocityY < 0 && player.y < wall.y + wall.height && player.y + player.height > wall.y + wall.height) {
                    player.y = wall.y + wall.height;
                    player.velocityY = 0;
                    yResolved = true;
                    collided = true;
                    break;
                }
            }
        }
        
        // After both resolutions, check if we're still colliding with any walls
        // This could happen in corners or small spaces
        if (collided) {
            // Check if we still have collisions after resolution
            const stillColliding = collisionTiles.some(wall => this.hasCollision(player, wall));
            
            if (stillColliding) {
                // If we moved horizontally but not vertically, try just the vertical movement
                if (xResolved && !yResolved) {
                    player.x = originalX;
                    
                    // Try vertical resolution again
                    for (const wall of collisionTiles) {
                        if (this.hasCollision(player, wall)) {
                            if (player.velocityY > 0) {
                                player.y = wall.y - player.height;
                            } else {
                                player.y = wall.y + wall.height;
                            }
                            player.velocityY = 0;
                            break;
                        }
                    }
                }
                // If we moved vertically but not horizontally, try just the horizontal movement
                else if (yResolved && !xResolved) {
                    player.y = originalY;
                    
                    // Try horizontal resolution again
                    for (const wall of collisionTiles) {
                        if (this.hasCollision(player, wall)) {
                            if (player.velocityX > 0) {
                                player.x = wall.x - player.width;
                            } else {
                                player.x = wall.x + wall.width;
                            }
                            player.velocityX = 0;
                            break;
                        }
                    }
                }
                // If both were resolved or neither were resolved, just restore original position
                else {
                    player.x = originalX;
                    player.y = originalY;
                    player.velocityX = 0;
                    player.velocityY = 0;
                }
            }
        }

        return collided;
    }

    checkLightSwitchCollisions(player) {
        const tiles = this.getEntityTiles(player);
        for (const {x, y} of tiles) {
            if (this.level.isLightSwitch(x, y)) {
                return {x, y};
            }
        }
        return null;
    }

    checkLevelExitCollision(player) {
        const tiles = this.getEntityTiles(player);
        for (const {x, y} of tiles) {
            if (this.level.isExit(x, y)) {
                return this.level.getExitAt(x, y);
            }
        }
        return null;
    }
}

window.CollisionManager = CollisionManager;