class Collectible {
    constructor(x, y, type) {
        this.x = x * GAME_CONSTANTS.TILE_SIZE;
        this.y = y * GAME_CONSTANTS.TILE_SIZE;
        this.type = type;
        this.width = GAME_CONSTANTS.TILE_SIZE;
        this.height = GAME_CONSTANTS.TILE_SIZE;
        this.collected = false;
        this.value = GAME_CONSTANTS.COLLECTIBLES[type].POINTS;
    }

    update(player) {
        return 0;
    }

    render(ctx, cameraX, cameraY) {
        if (this.collected) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;

        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.width / 2
        );
        gradient.addColorStop(0, GAME_CONSTANTS.COLLECTIBLES[this.type].COLOR);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw collectible emoji
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = GAME_CONSTANTS.COLLECTIBLES[this.type].COLOR;
        ctx.fillText(
            GAME_CONSTANTS.COLLECTIBLES[this.type].EMOJI,
            centerX,
            centerY
        );
    }
}

window.Collectible = Collectible;