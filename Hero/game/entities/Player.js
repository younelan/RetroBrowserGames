class Player {
    constructor(x, y) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.width = GAME_CONSTANTS.PLAYER.WIDTH * GAME_CONSTANTS.TILE_SIZE;
        this.height = GAME_CONSTANTS.PLAYER.HEIGHT * GAME_CONSTANTS.TILE_SIZE;
        this.velocityX = 0;
        this.velocityY = 0;
        this.fuel = GAME_CONSTANTS.PLAYER.MAX_FUEL;
        this.facingLeft = false;
    }

    update(deltaTime, controls, isOnGround) {
        this.handleInput(deltaTime, controls);
        this.applyPhysics(deltaTime, isOnGround);
    }

    handleInput(deltaTime, controls) {
        // Movement
        if (controls.ArrowLeft) {
            this.velocityX = -GAME_CONSTANTS.PLAYER.MOVE_SPEED * deltaTime;
            this.facingLeft = true;
        } else if (controls.ArrowRight) {
            this.velocityX = GAME_CONSTANTS.PLAYER.MOVE_SPEED * deltaTime;
            this.facingLeft = false;
        } else {
            this.velocityX = 0;
        }

        // Jetpack
        if (controls.ArrowUp && this.fuel > 0) {
            this.velocityY = -GAME_CONSTANTS.PLAYER.FLY_SPEED * deltaTime;
            this.fuel = Math.max(0, this.fuel - GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * deltaTime);
        }
    }

    applyPhysics(deltaTime, isOnGround) {
        // Only apply gravity when not on ground
        if (!isOnGround) {
            this.velocityY += GAME_CONSTANTS.PLAYER.GRAVITY * deltaTime;
        }
        
        // Apply velocities
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

window.Player = Player;