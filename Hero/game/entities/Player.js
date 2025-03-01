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
        this.handleInput(deltaTime, controls, isOnGround);
        this.applyPhysics(deltaTime, isOnGround);
    }

    handleInput(deltaTime, controls, isOnGround) {
        // Horizontal movement - smoother with constant speed
        if (controls.ArrowLeft) {
            this.velocityX = -GAME_CONSTANTS.PLAYER.MOVE_SPEED;
            this.facingLeft = true;
        } else if (controls.ArrowRight) {
            this.velocityX = GAME_CONSTANTS.PLAYER.MOVE_SPEED;
            this.facingLeft = false;
        } else {
            this.velocityX = 0;
        }

        // Vertical movement - jetpack
        if (controls.ArrowUp && this.fuel > 0) {
            this.velocityY = -GAME_CONSTANTS.PLAYER.FLY_SPEED;
            this.fuel = Math.max(0, this.fuel - GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * deltaTime);
        } else if (!isOnGround) {
            this.velocityY += GAME_CONSTANTS.PLAYER.GRAVITY * deltaTime;
        } else {
            this.velocityY = 0;
            if (this.fuel < GAME_CONSTANTS.PLAYER.MAX_FUEL) {
                this.fuel += GAME_CONSTANTS.PLAYER.FUEL_CONSUMPTION * deltaTime;
            }
        }
    }

    applyPhysics(deltaTime) {
        // Apply velocities with deltaTime
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
    }
}

window.Player = Player;