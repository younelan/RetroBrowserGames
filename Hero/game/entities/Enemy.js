class Enemy {
    constructor(x, y, type) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.width = GAME_CONSTANTS.TILE_SIZE;
        this.height = GAME_CONSTANTS.TILE_SIZE;
        this.type = type;
        this.alive = true;
    }
    
    hit() {
        this.alive = false;
    }
    
    update(deltaTime) {
        // Future enemy behavior updates
    }
}

window.Enemy = Enemy;