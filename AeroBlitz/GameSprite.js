export default class GameSprite {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
    }

    update(deltaTime) {
        // Base update method
    }

    draw() {
        // Base draw method
    }
}