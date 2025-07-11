class Plant {
    constructor(x, y, width, height, type, berries = []) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.berries = berries; // Only for SHRUB type
    }

    draw(context, s) {
        switch(this.type) {
            case '1': // Tall tree (2 tiles high)
                // Tree trunk (more natural, slightly irregular)
                context.fillStyle = '#6B4423'; // Brown
                context.fillRect(this.x + 7 * s, this.y + 20 * s, 2 * s, 12 * s); // Main trunk
                context.fillRect(this.x + 6 * s, this.y + 18 * s, 4 * s, 4 * s); // Base of trunk
                
                // Foliage (multiple overlapping rounded shapes for a more organic look)
                context.fillStyle = '#228B22'; // Dark green
                context.beginPath();
                context.arc(this.x + 8 * s, this.y + 10 * s, 10 * s, 0, Math.PI * 2); // Main canopy
                context.arc(this.x + 4 * s, this.y + 14 * s, 6 * s, 0, Math.PI * 2); // Left cluster
                context.arc(this.x + 12 * s, this.y + 14 * s, 6 * s, 0, Math.PI * 2); // Right cluster
                context.fill();
                
                // Lighter green highlights for depth
                context.fillStyle = '#32CD32'; // Medium green
                context.beginPath();
                context.arc(this.x + 7 * s, this.y + 9 * s, 8 * s, 0, Math.PI * 2);
                context.arc(this.x + 5 * s, this.y + 13 * s, 4 * s, 0, Math.PI * 2);
                context.fill();
                
                context.fillStyle = '#90EE90'; // Light green
                context.beginPath();
                context.arc(this.x + 8 * s, this.y + 8 * s, 5 * s, 0, Math.PI * 2);
                context.fill();
                break;
                
            case '2': // Small cactus (1 tile high, organic shape with dangling arms)
                // Helper function to draw a rounded rectangle
                const drawRoundedRect = (ctx, x, y, width, height, radius) => {
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + width - radius, y);
                    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                    ctx.lineTo(x + width, y + height - radius);
                    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    ctx.lineTo(x + radius, y + height);
                    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                };

                // Main cactus body (rounded rectangle)
                context.fillStyle = '#228B22'; // Dark green
                drawRoundedRect(context, this.x + 6 * s, this.y + 2 * s, 4 * s, 12 * s, 2 * s);
                context.fill();
                
                // Highlights for main body
                context.fillStyle = '#32CD32'; // Medium green
                drawRoundedRect(context, this.x + 7 * s, this.y + 3 * s, 2 * s, 10 * s, 1 * s);
                context.fill();

                // Left arm (dangling, aimed up)
                context.save();
                context.translate(this.x + 6 * s, this.y + 10 * s); // Pivot point at connection to main body
                context.rotate(-Math.PI / 8); // Rotate slightly upwards
                context.fillStyle = '#228B22';
                drawRoundedRect(context, -4 * s, -6 * s, 4 * s, 6 * s, 2 * s); // Draw arm relative to pivot
                context.fill();
                context.fillStyle = '#32CD32'; // Highlight
                drawRoundedRect(context, -3 * s, -5 * s, 2 * s, 4 * s, 1 * s);
                context.fill();
                context.restore();

                // Right arm (dangling, aimed up)
                context.save();
                context.translate(this.x + 10 * s, this.y + 8 * s); // Pivot point at connection to main body
                context.rotate(Math.PI / 8); // Rotate slightly upwards
                context.fillStyle = '#228B22';
                drawRoundedRect(context, 0, -6 * s, 4 * s, 6 * s, 2 * s); // Draw arm relative to pivot
                context.fill();
                context.fillStyle = '#32CD32'; // Highlight
                drawRoundedRect(context, 1 * s, -5 * s, 2 * s, 4 * s, 1 * s);
                context.fill();
                context.restore();
                
                // Spines (subtle lines)
                context.strokeStyle = '#90EE90'; // Light green, almost white
                context.lineWidth = 0.5;
                for(let i = 0; i < 5; i++) {
                    // Main body spines
                    context.beginPath();
                    context.moveTo(this.x + 6 * s + (i % 2) * 4 * s, this.y + 4 * s + i * 2 * s);
                    context.lineTo(this.x + 6 * s + (i % 2) * 4 * s + 1 * s, this.y + 4 * s + i * 2 * s + 1 * s);
                    context.stroke();

                    // Left arm spines
                    if (i < 3) {
                        context.beginPath();
                        context.moveTo(this.x + 2 * s + (i % 2) * 3 * s, this.y + 7 * s + i * 2 * s);
                        context.lineTo(this.x + 2 * s + (i % 2) * 3 * s + 1 * s, this.y + 7 * s + i * 2 * s + 1 * s);
                        context.stroke();
                    }

                    // Right arm spines
                    if (i < 3) {
                        context.beginPath();
                        context.moveTo(this.x + 12 * s + (i % 2) * 3 * s, this.y + 5 * s + i * 2 * s);
                        context.lineTo(this.x + 12 * s + (i % 2) * 3 * s + 1 * s, this.y + 5 * s + i * 2 * s + 1 * s);
                        context.stroke();
                    }
                }
                break;
                
            case '3':
            case 'SHRUB': // Small shrub (highly irregular, organic shape)
                // Base shape (darkest green)
                context.fillStyle = '#1A6B1A'; // Darker green
                context.beginPath();
                context.moveTo(this.x + 4 * s, this.y + 15 * s);
                context.bezierCurveTo(this.x + 2 * s, this.y + 10 * s, this.x + 6 * s, this.y + 5 * s, this.x + 8 * s, this.y + 4 * s);
                context.bezierCurveTo(this.x + 10 * s, this.y + 3 * s, this.x + 14 * s, this.y + 7 * s, this.x + 12 * s, this.y + 12 * s);
                context.bezierCurveTo(this.x + 16 * s, this.y + 16 * s, this.x + 8 * s, this.y + 16 * s, this.x + 4 * s, this.y + 15 * s);
                context.closePath();
                context.fill();
                
                // Mid-tone layer
                context.fillStyle = '#228B22'; // Forest green
                context.beginPath();
                context.moveTo(this.x + 5 * s, this.y + 14 * s);
                context.bezierCurveTo(this.x + 3 * s, this.y + 10 * s, this.x + 7 * s, this.y + 6 * s, this.x + 9 * s, this.y + 5 * s);
                context.bezierCurveTo(this.x + 11 * s, this.y + 4 * s, this.x + 13 * s, this.y + 8 * s, this.x + 11 * s, this.y + 11 * s);
                context.bezierCurveTo(this.x + 15 * s, this.y + 15 * s, this.x + 9 * s, this.y + 15 * s, this.x + 5 * s, this.y + 14 * s);
                context.closePath();
                context.fill();
                
                // Highlight layer
                context.fillStyle = '#32CD32'; // Medium green
                context.beginPath();
                context.moveTo(this.x + 6 * s, this.y + 13 * s);
                context.bezierCurveTo(this.x + 5 * s, this.y + 10 * s, this.x + 7 * s, this.y + 7 * s, this.x + 9 * s, this.y + 6 * s);
                context.bezierCurveTo(this.x + 10 * s, this.y + 5 * s, this.x + 12 * s, this.y + 8 * s, this.x + 10 * s, this.y + 10 * s);
                context.bezierCurveTo(this.x + 13 * s, this.y + 13 * s, this.x + 9 * s, this.y + 14 * s, this.x + 6 * s, this.y + 13 * s);
                context.closePath();
                context.fill();

                // Small, subtle berries/fruits (static and subtle color)
                const berryColor = '#104010'; // Very dark green, almost black
                const berryHighlight = '#205020'; // Slightly lighter dark green

                this.berries.forEach(berry => {
                    const berryX = this.x + berry.x * this.width;
                    const berryY = this.y + berry.y * this.height;
                    const berrySize = berry.size * s; // Use pre-calculated size

                    context.fillStyle = berryColor;
                    context.beginPath();
                    context.arc(berryX, berryY, berrySize, 0, Math.PI * 2);
                    context.fill();

                    // Subtle highlight
                    context.fillStyle = berryHighlight;
                    context.beginPath();
                    context.arc(berryX - berrySize * 0.3, berryY - berrySize * 0.3, berrySize * 0.5, 0, Math.PI * 2);
                    context.fill();
                });
                break;
                
            case '4': // Tall cactus (2 tiles high)
                // Main cactus body
                context.fillStyle = '#228B22'; // Dark green
                context.fillRect(this.x + 6 * s, this.y, 4 * s, 32 * s); // Main vertical body
                
                // Cactus arms
                context.fillRect(this.x + 2 * s, this.y + 8 * s, 4 * s, 8 * s); // Left arm
                context.fillRect(this.x + 10 * s, this.y + 4 * s, 4 * s, 8 * s); // Right arm
                
                // Highlights
                context.fillStyle = '#32CD32'; // Medium green
                context.fillRect(this.x + 7 * s, this.y + 1 * s, 2 * s, 30 * s); // Main body highlight
                context.fillRect(this.x + 3 * s, this.y + 9 * s, 2 * s, 6 * s); // Left arm highlight
                context.fillRect(this.x + 11 * s, this.y + 5 * s, 2 * s, 6 * s); // Right arm highlight
                
                // Spines (subtle, small lines)
                context.strokeStyle = '#90EE90'; // Light green, almost white
                context.lineWidth = 0.5;
                for(let i = 0; i < 15; i++) {
                    // Main body spines
                    context.beginPath();
                    context.moveTo(this.x + 6 * s + (i % 2) * 4 * s, this.y + 2 * s + i * 2 * s);
                    context.lineTo(this.x + 6 * s + (i % 2) * 4 * s + 1 * s, this.y + 2 * s + i * 2 * s + 1 * s);
                    context.stroke();

                    // Arm spines
                    if (i < 5) {
                        context.beginPath();
                        context.moveTo(this.x + 2 * s + (i % 2) * 4 * s, this.y + 9 * s + i * 2 * s);
                        context.lineTo(this.x + 2 * s + (i % 2) * 4 * s + 1 * s, this.y + 9 * s + i * 2 * s + 1 * s);
                        context.stroke();

                        context.beginPath();
                        context.moveTo(this.x + 10 * s + (i % 2) * 4 * s, this.y + 5 * s + i * 2 * s);
                        context.lineTo(this.x + 10 * s + (i % 2) * 4 * s + 1 * s, this.y + 5 * s + i * 2 * s + 1 * s);
                        context.stroke();
                    }
                }
                break;
        }
    }
}