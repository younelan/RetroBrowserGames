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

        // Get all tiles the player is overlapping with
        const tiles = this.getEntityTiles(player);
        let collided = false;

        // Check each tile for collision
        for (const {x, y} of tiles) {
            if (this.level.isWall(x, y)) {
                // A wall collision was detected
                this.resolveWallCollision(player, {
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                });
                collided = true;
            }
        }

        return collided;
    }

    resolveWallCollision(player, wall) {
        // Calculate overlap on each axis
        const overlapLeft = player.x + player.width - wall.x;
        const overlapRight = wall.x + wall.width - player.x;
        const overlapTop = player.y + player.height - wall.y;
        const overlapBottom = wall.y + wall.height - player.y;

        // Find the smallest overlap to determine which direction to push the player
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        // Resolve collision based on the smallest overlap
        if (minOverlap === overlapLeft) {
            // Collision from the right side of player
            player.x = wall.x - player.width;
            player.velocityX = Math.min(player.velocityX, 0); // Stop any rightward movement
        } else if (minOverlap === overlapRight) {
            // Collision from the left side of player
            player.x = wall.x + wall.width;
            player.velocityX = Math.max(player.velocityX, 0); // Stop any leftward movement
        } else if (minOverlap === overlapTop) {
            // Collision from the bottom of player
            player.y = wall.y - player.height;
            player.velocityY = Math.min(player.velocityY, 0); // Stop any downward movement
        } else if (minOverlap === overlapBottom) {
            // Collision from the top of player
            player.y = wall.y + wall.height;
            player.velocityY = Math.max(player.velocityY, 0); // Stop any upward movement
        }
    }

    getExpandedEntityTiles(entity, margin = 1) {
        const left = Math.floor((entity.x - margin * this.tileSize) / this.tileSize);
        const right = Math.floor((entity.x + entity.width + margin * this.tileSize) / this.tileSize);
        const top = Math.floor((entity.y - margin * this.tileSize) / this.tileSize);
        const bottom = Math.floor((entity.y + entity.height + margin * this.tileSize) / this.tileSize);

        const tiles = [];
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                // Skip tiles already in the basic entity tiles area
                if (x >= Math.floor(entity.x / this.tileSize) &&
                    x <= Math.floor((entity.x + entity.width) / this.tileSize) &&
                    y >= Math.floor(entity.y / this.tileSize) &&
                    y <= Math.floor((entity.y + entity.height) / this.tileSize)) {
                    continue;
                }
                tiles.push({x, y});
            }
        }
        return tiles;
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
        // Adjust this method to detect collision with the larger exit portal
        const tiles = this.getEntityTiles(player);
        
        // Additional margin to check nearby tiles for the larger portal
        const expandedTiles = this.getExpandedEntityTiles(player, 1);
        
        // Check first our direct tiles, then expanded tiles for exit collision
        for (const {x, y} of [...tiles, ...expandedTiles]) {
            if (this.level.isExit(x, y)) {
                return this.level.getExitAt(x, y);
            }
        }
        return null;
    }
}

window.CollisionManager = CollisionManager;