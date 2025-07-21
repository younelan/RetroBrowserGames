class Wall extends Tile {
    constructor(x, y, width, height, type, brickScheme) {
        super(x, y, width, height, type);
        this.brickScheme = brickScheme;
    }

    draw(context) {
        if (this.type === 'X') {
            // Generic solid wall
            context.fillStyle = '#888';
            context.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === '_') {
            // Brick wall
            const colorScheme = BRICK_COLOR_SCHEMES[this.brickScheme] || BRICK_COLOR_SCHEMES[DEFAULT_BRICK_SCHEME];
            
            // Base brick color (mortar background)
            context.fillStyle = colorScheme.mortar;
            context.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw individual small bricks to fill entire tile
            const brickWidth = 7;
            const brickHeight = 3;
            const mortarGap = 1;
            
            context.fillStyle = colorScheme.brick;
            
            // Calculate how many rows we need to fill the height
            const rowHeight = brickHeight + mortarGap;
            const numRows = Math.ceil(this.height / rowHeight);
            
            for (let row = 0; row < numRows; row++) {
                const rowY = this.y + row * rowHeight;
                
                // Alternate offset for staggered pattern
                const isEvenRow = row % 2 === 0;
                const startX = isEvenRow ? 0 : -(brickWidth + mortarGap) / 2;
                
                // Draw bricks across the width
                for (let x = startX; x < this.width; x += brickWidth + mortarGap) {
                    const brickX = this.x + x;
                    
                    // Only draw if brick is within the tile bounds
                    if (brickX >= this.x && brickX + brickWidth <= this.x + this.width && 
                        rowY >= this.y && rowY + brickHeight <= this.y + this.height) {
                        context.fillRect(brickX, rowY, brickWidth, brickHeight);
                    }
                    // Handle partial bricks at edges
                    else if (brickX < this.x + this.width && brickX + brickWidth > this.x && 
                            rowY >= this.y && rowY + brickHeight <= this.y + this.height) {
                        const clippedX = Math.max(brickX, this.x);
                        const clippedWidth = Math.min(brickX + brickWidth, this.x + this.width) - clippedX;
                        if (clippedWidth > 0) {
                            context.fillRect(clippedX, rowY, clippedWidth, brickHeight);
                        }
                    }
                }
            }
        }
    }
}