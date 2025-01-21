export class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'fuel' ? 20 : 15;
        this.height = this.width;
    }

    draw(ctx) {
        ctx.fillStyle = this.type === 'fuel' ? '#0f0' : '#ff0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    collect(game) {
        if (this.type === 'fuel') {
            game.player.fuel = Math.min(100, game.player.fuel + 30);
        } else {
            game.score += 100;
        }
    }
}
