class Player {
    constructor(x, y) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.width = 2 * GAME_CONSTANTS.TILE_SIZE;     // 2 tiles wide
        this.height = 2 * GAME_CONSTANTS.TILE_SIZE;    // 2 tiles high
        this.velocityX = 0;
        this.velocityY = 0;
        this.facingLeft = false;
        this.rotorAngle = 0;
        this.isFlying = false;
    }

    handlePlayerDeath() {
        // Method for the collision manager to call
    }

    // Basic update and render methods
    update(deltaTime) {
        // Will be handled by game.updatePlayerMovement
    }
}

window.Player = Player;