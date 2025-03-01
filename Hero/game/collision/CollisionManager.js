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
            return enemy.alive && this.hasCollision(player, enemy);
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
        const bottom = Math.floor((player.y + player.height) / this.tileSize);
        const left = Math.floor(player.x / this.tileSize);
        const right = Math.floor((player.x + player.width) / this.tileSize);
        
        return this.level.isWall(left, bottom) || this.level.isWall(right, bottom);
    }

    hasCollision(entity1, entity2) {
        return entity1.x < entity2.x + entity2.width &&
               entity1.x + entity1.width > entity2.x &&
               entity1.y < entity2.y + entity2.height &&
               entity1.y + entity2.height > entity2.y;
    }

    resolveCollision(entity, obstacle) {
        const overlap = {
            x: (entity.x + entity.width / 2) - (obstacle.x + obstacle.width / 2),
            y: (entity.y + entity.height / 2) - (obstacle.y + obstacle.height / 2)
        };

        const minTranslate = {
            x: entity.width / 2 + obstacle.width / 2 - Math.abs(overlap.x),
            y: entity.height / 2 + obstacle.height / 2 - Math.abs(overlap.y)
        };

        if (minTranslate.x < minTranslate.y) {
            entity.x += overlap.x > 0 ? minTranslate.x : -minTranslate.x;
            entity.velocityX = 0;
        } else {
            entity.y += overlap.y > 0 ? minTranslate.y : -minTranslate.y;
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
}

window.CollisionManager = CollisionManager;