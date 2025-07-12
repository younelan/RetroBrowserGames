class Tile {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.player = null; // Will be set later if needed
        this.level = null; // Will be set later if needed
    }

    setPlayer(player) {
        this.player = player;
    }

    setLevel(level) {
        this.level = level;
    }

    // Default update method - can be overridden by subclasses
    update() {
        // Base tiles don't need updating by default
    }

    // Default collision detection
    checkCollision(rect) {
        return rect.x < this.x + this.width &&
               rect.x + rect.width > this.x &&
               rect.y < this.y + this.height &&
               rect.y + rect.height > this.y;
    }

    // Abstract draw method - must be implemented by subclasses
    draw(context) {
        throw new Error("draw() method must be implemented by subclass");
    }
}
