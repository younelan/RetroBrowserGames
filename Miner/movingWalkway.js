class MovingWalkway {
    constructor(x, y, width, height, type, level) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.level = level; // Reference to the level to access isEmptyTile and color schemes
    }

    draw(context, frameCounter) {
        const tileX = Math.floor(this.x / TILE_SIZE);
        const tileY = Math.floor(this.y / TILE_SIZE);
        const leftEmpty = this.level.isEmptyTile(tileX - 1, tileY);
        const rightEmpty = this.level.isEmptyTile(tileX + 1, tileY);

        // Get color scheme for this level
        const colorScheme = MOVING_PLATFORM_COLOR_SCHEMES[this.level.movingPlatformScheme];

        context.save();
        
        // Helper function to create the belt shape path
        const createBeltPath = () => {
            if (leftEmpty || rightEmpty) {
                const radius = 6;
                context.beginPath();
                
                // Manually create rounded rectangle path
                context.moveTo(this.x + (leftEmpty ? radius : 0), this.y);
                context.lineTo(this.x + this.width - (rightEmpty ? radius : 0), this.y);
                if (rightEmpty) {
                    context.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + radius, radius);
                }
                context.lineTo(this.x + this.width, this.y + this.height - (rightEmpty ? radius : 0));
                if (rightEmpty) {
                    context.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height, radius);
                }
                context.lineTo(this.x + (leftEmpty ? radius : 0), this.y + this.height);
                if (leftEmpty) {
                    context.arcTo(this.x, this.y + this.height, this.x, this.y + this.height - radius, radius);
                }
                context.lineTo(this.x, this.y + (leftEmpty ? radius : 0));
                if (leftEmpty) {
                    context.arcTo(this.x, this.y, this.x + radius, this.y, radius);
                }
                context.closePath();
            } else {
                context.beginPath();
                context.rect(this.x, this.y, this.width, this.height);
            }
        };

        // Conveyor belt base (metal platform) - using color scheme
        createBeltPath();
        const gradient = context.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, colorScheme.base);
        gradient.addColorStop(0.3, this.level.darkenColor(colorScheme.base, 0.3));
        gradient.addColorStop(0.7, this.level.darkenColor(colorScheme.base, 0.5));
        gradient.addColorStop(1, this.level.darkenColor(colorScheme.base, 0.7));
        context.fillStyle = gradient;
        context.fill();

        // Clip for the internal elements only
        createBeltPath();
        context.clip();

        // Metal side rails - using color scheme
        context.fillStyle = colorScheme.rail;
        const railThickness = 3;
        context.fillRect(this.x, this.y, this.width, railThickness); // Top rail
        context.fillRect(this.x, this.y + this.height - railThickness, this.width, railThickness); // Bottom rail
        
        // Moving belt surface - using color scheme
        context.fillStyle = colorScheme.surface;
        context.fillRect(this.x, this.y + railThickness, this.width, this.height - railThickness * 2);

        // Moving belt pattern (diagonal lines) - using color scheme
        context.strokeStyle = colorScheme.pattern;
        context.lineWidth = 1;
        const beltSpeed = this.type === '<' ? frameCounter * -0.8 : frameCounter * 0.8; // Slower moving pattern
        const lineSpacing = 8;
        
        for (let i = Math.floor(beltSpeed / lineSpacing) - 1; i < Math.ceil((this.width + beltSpeed) / lineSpacing) + 1; i++) {
            const x = this.x + (i * lineSpacing) - (beltSpeed % lineSpacing);
            context.beginPath();
            if (this.type === '<') {
                context.moveTo(x, this.y + railThickness);
                context.lineTo(x + lineSpacing/2, this.y + this.height - railThickness);
            } else { // type is '>'
                context.moveTo(x, this.y + railThickness);
                context.lineTo(x - lineSpacing/2, this.y + this.height - railThickness);
            }
            context.stroke();
        }

        // Rotating gears for direction indication - using color scheme
        context.fillStyle = colorScheme.gear;
        const gearRotation = this.type === '<' ? (frameCounter * -0.02) % (Math.PI * 2) : (frameCounter * 0.02) % (Math.PI * 2); // Slow rotation
        const gearRadius = 36; // Much larger radius - 3x the previous size
        
        // Center one gear per tile
        const numTiles = Math.floor(this.width / TILE_SIZE);
        for (let tileIndex = 0; tileIndex < numTiles; tileIndex++) {
            const centerX = this.x + ( tileIndex * TILE_SIZE) + (TILE_SIZE / 2);
            const centerY = this.y + this.height/2; // Center of belt
            
            context.save();
            context.translate(centerX, centerY);
            context.rotate(gearRotation);
            
            // Draw gear with thick propeller-like blades
            context.beginPath();
            const numTeeth = 8;
            const outerRadius = gearRadius * 0.9; // Main circle
            const dentRadius = gearRadius * 0.5; // Deeper dent for thicker blades
            
            // Create circle with thick triangular blades
            for (let i = 0; i <= numTeeth * 12; i++) {
                const angle = (i / (numTeeth * 12)) * Math.PI * 2;
                const dentProgress = (i % 12) / 12; // 0 to 1 within each tooth
                
                let radius;
                if (dentProgress < 0.2 || dentProgress > 0.8) {
                    // Outside blade - normal radius
                    radius = outerRadius;
                } else {
                    // Inside blade - much thicker triangular blade
                    const bladeDepth = Math.min(dentProgress - 0.2, 0.8 - dentProgress) / 0.3; // 0 to 1
                    radius = outerRadius - (outerRadius - dentRadius) * bladeDepth;
                }
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }
            }
            context.closePath();
            context.fill();
            
            // Center hole - using color scheme
            context.fillStyle = colorScheme.gearCenter;
            context.beginPath();
            context.arc(0, 0, gearRadius * 0.25, 0, Math.PI * 2);
            context.fill();
            
            // Add visible spokes for better rotation visibility
            context.strokeStyle = colorScheme.gearCenter;
            context.lineWidth = 2;
            for (let spoke = 0; spoke < 4; spoke++) {
                const spokeAngle = (spoke / 4) * Math.PI * 2;
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(Math.cos(spokeAngle) * dentRadius, Math.sin(spokeAngle) * dentRadius);
                context.stroke();
            }
            
            context.restore();
            context.fillStyle = colorScheme.gear; // Reset color for next gear
        }

        // Moving rail segments (visible pieces on the light gray rails) - using color scheme
        context.fillStyle = colorScheme.segment;
        const segmentWidth = 6;
        const segmentSpacing = 12;
        const globalSegmentSpeed = this.type === '<' ? (frameCounter * -0.3) % segmentSpacing : (frameCounter * 0.3) % segmentSpacing; // Global animation for seamless belts
        
        // Calculate seamless starting position based on world position
        const startOffset = -(this.x % segmentSpacing);
        for (let i = -1; i <= Math.ceil(this.width / segmentSpacing) + 1; i++) {
            const segmentX = this.x + startOffset + (i * segmentSpacing) + globalSegmentSpeed;
            if (segmentX + segmentWidth > this.x && segmentX < this.x + this.width) {
                context.fillRect(segmentX, this.y, segmentWidth, railThickness);
            }
        }
        
        // Bottom rail segments moving in opposite direction
        const globalBottomSegmentSpeed = this.type === '<' ? (frameCounter * 0.3) % segmentSpacing : (frameCounter * -0.3) % segmentSpacing; // Opposite direction
        for (let i = -1; i <= Math.ceil(this.width / segmentSpacing) + 1; i++) {
            const segmentX = this.x + startOffset + (i * segmentSpacing) + globalBottomSegmentSpeed;
            if (segmentX + segmentWidth > this.x && segmentX < this.x + this.width) {
                context.fillRect(segmentX, this.y + this.height - railThickness, segmentWidth, railThickness);
            }
        }
        context.restore();
    }
}