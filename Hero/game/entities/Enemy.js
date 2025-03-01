class Enemy {
    constructor(x, y, type) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.width = GAME_CONSTANTS.TILE_SIZE;
        this.height = GAME_CONSTANTS.TILE_SIZE;
        this.type = type;
        this.alive = true;
        this.time = 0;
    }
    
    hit() {
        this.alive = false;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
    }

    render(ctx, cameraX, cameraY) {
        // Each enemy type will implement their own render method
    }
}

window.Enemy = Enemy;