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
        return collectibles.filter(collectible => {
            return !collectible.collected && this.hasCollision(player, collectible);
        });
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
               entity1.y + entity2.height > entity2.y;
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
        let collided = false;

        // Handle wall collisions
        for (const {x, y}of tiles) {
            if (this.level.isWall(x, y)) {
                const wall = {
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                };
                
                // Handle horizontal collision first
                if (this.hasCollision(player, wall)) {
                    if (player.velocityX > 0) {
                        player.x = wall.x - player.width;
                    } else if (player.velocityX < 0) {
                        player.x = wall.x + wall.width;
                    }
                    player.velocityX = 0;
                    collided = true;
                }

                // Then handle vertical collision
                if (this.hasCollision(player, wall)) {
                    if (player.velocityY > 0) {
                        player.y = wall.y - player.height;
                    } else if (player.velocityY < 0) {
                        player.y = wall.y + wall.height;
                    }
                    player.velocityY = 0;
                    collided = true;
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
}

window.CollisionManager = CollisionManager;