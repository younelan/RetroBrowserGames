class Key {
    constructor(x, y, width, height, colorIndex, keyColors) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = '+';
        this.colorIndex = colorIndex; // Index into the keyColors array
        this.keyColors = keyColors || DEFAULT_KEY_COLORS;
        this.color = this.keyColors[this.colorIndex % this.keyColors.length];
    }

    draw(context) {
        context.save(); // Save current context state

        // Translate to the center of the key's tile for rotation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        context.translate(centerX, centerY);

        // Rotate by -90 degrees (counter-clockwise) to make a vertical key appear horizontal
        context.rotate(-Math.PI / 2);

        // Translate back so that drawing coordinates are relative to the top-left of the key's *original* bounding box
        // This means (0,0) is now the top-left of the key's tile, but the canvas is rotated.
        context.translate(-this.width / 2, -this.height / 2);

        const s = this.width / 16; // Scale factor for a 16x16 sprite

        // Key Bow (circular outline)
        context.beginPath();
        context.arc(8 * s, 4 * s, 4 * s, 0, Math.PI * 2); // Center at (8s, 4s), radius 4s
        context.strokeStyle = this.color;
        context.lineWidth = 2;
        context.stroke();

        // Key Shaft (rectangle)
        context.fillStyle = this.color;
        context.fillRect(7.5 * s, 8 * s, 1 * s, 8 * s);

        // Key Bit (teeth)
        context.fillRect(6 * s, 14 * s, 1 * s, 2 * s);
        context.fillRect(9 * s, 14 * s, 1 * s, 2 * s);

        context.restore(); // Restore context to original state
    }
}
