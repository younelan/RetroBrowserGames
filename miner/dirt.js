class Dirt {
    constructor(x, y, width, height, type, dirtScheme, surfaceScheme, decay = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.dirtScheme = dirtScheme;
        this.surfaceScheme = surfaceScheme;
        this.decay = decay;
    }

    // Helper function to darken a color for gradient effects
    darkenColor(color, factor) {
        // Convert hex color to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Apply darkening factor
        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    draw(context) {
        const s = TILE_SIZE / 16; // Scale factor for drawing details

        // Determine if it's a crumbling platform
        const isCrumbling = this.type === '-' || this.type === ';';
        const colorScheme = DIRT_COLOR_SCHEMES[this.dirtScheme] || DIRT_COLOR_SCHEMES[DEFAULT_DIRT_SCHEME];

        const crumbleProgress = this.decay / 30; // Normalize decay to 0-1
        const currentHeight = this.height * (1 - crumbleProgress); // Ensure currentHeight is defined
        const currentY = this.y + (this.height - currentHeight);

        context.save();
        context.beginPath();
        
        // Start from top-left corner
        context.moveTo(this.x, currentY);
        // Top edge (straight)
        context.lineTo(this.x + this.width, currentY);
        // Right edge down to jagged bottom area
        context.lineTo(this.x + this.width, this.y + this.height - 8); // This is where the jagged part starts

        // Create natural jagged bottom edge - much more jagged and irregular
        const pointSpacing = 1; // Smaller spacing for more detailed jagged edge
        const numPoints = Math.floor(this.width / pointSpacing);
        
        // Generate jagged points from right to left using GLOBAL position for seamless tiles
        const globalTileX = this.x / TILE_SIZE;
        const globalTileY = this.y / TILE_SIZE;

        for (let i = numPoints; i >= 0; i--) {
            const globalX = this.x + (i * pointSpacing); // Use global coordinate
            // Create much more dramatic jagged variation
            const variation1 = Math.sin(globalX * 0.08 + globalTileY * 0.05) * 6; // Bigger, faster variation
            const variation2 = Math.sin(globalX * 0.15 + globalTileY * 0.08) * 4; // Medium spikes
            const variation3 = Math.sin(globalX * 0.3 + globalTileY * 0.12) * 3;  // Small details
            const variation4 = Math.sin(globalX * 0.6 + globalTileY * 0.2) * 2;   // Fine texture
            const totalVariation = variation1 + variation2 + variation3 + variation4;
            const y = this.y + this.height - 8 + totalVariation; // Much more jagged variation
            context.lineTo(globalX, y);
        }
        
        // Left edge back to start
        context.lineTo(this.x, currentY);
        context.closePath();
        context.clip(); // Clip the context to this jagged shape

        // Now fill the dirt within the clipped area
        // Base dirt color
        context.fillStyle = isCrumbling ? colorScheme.crumbleBase : colorScheme.base;
        context.fillRect(this.x, currentY, this.width, currentHeight);

        // Create patchy, uneven dirt surface
        for (let patch = 0; patch < 15; patch++) {
            const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7; // Global patch position
            const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
            
            const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; 
            const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
            const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
            const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
            
            const patchX = this.x - 8 + Math.floor(patchRandX * (this.width + 16)); 
            const patchY = currentY + Math.floor(patchRandY * 8); 
            const patchWidth = Math.floor(4 + patchRandSize * 8);
            const patchHeight = Math.floor(4 + patchRandSize * 8);
            
            if (patchY >= currentY && patchY + patchHeight <= currentY + currentHeight) {
                let patchColor;
                if (patchRandColor < 0.3) {
                    patchColor = colorScheme.patch1;
                } else if (patchRandColor < 0.6) {
                    patchColor = colorScheme.patch2;
                } else {
                    patchColor = colorScheme.patch3;
                }
                context.fillStyle = patchColor;
                context.fillRect(patchX, patchY, patchWidth, patchHeight);
            }
        }

        for (let i = 0; i < 8; i++) {
            const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
            const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
            
            const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5; 
            const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.7 + 0.3;
            const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
            const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
            
            const rockX = this.x - 6 + Math.floor(pseudoRandX * (this.width + 12)); 
            const rockY = currentY + 4 + Math.floor(pseudoRandY * (currentHeight - 16)); 
            const rockSize = Math.floor(pseudoRandSize * 5) + 3; 
            
            let rockColor;
            if (pseudoRandColor < 0.4) {
                rockColor = colorScheme.rock1;
            } else if (pseudoRandColor < 0.7) {
                rockColor = colorScheme.rock2;
            } else {
                rockColor = colorScheme.rock3;
            }
            context.fillStyle = rockColor;
            context.fillRect(rockX, rockY, rockSize, rockSize);
        }
        
        // Draw surface layer for two-layer platforms
        if (this.type === ':' || this.type === ';') {
            const surfaceColorScheme = SURFACE_COLOR_SCHEMES[this.surfaceScheme] || SURFACE_COLOR_SCHEMES[DEFAULT_SURFACE_SCHEME];
            if (this.surfaceScheme === 'grass') {
                this.drawGrassSurface(context, surfaceColorScheme);
            } else if (this.surfaceScheme === 'ice') {
                this.drawIceSurface(context, surfaceColorScheme);
            }
        }
        context.restore(); // Restore context after all drawing for this tile
    }

    drawGrassSurface(context, colorScheme) {
        const grassHeight = Math.floor(this.height / 4); // Top quarter
        const inset = 2; // Leave a border of dirt showing around the grass

        // Fill with base grass color, but inset from edges
        context.fillStyle = colorScheme.base;
        context.fillRect(this.x + inset, this.y + inset, this.width - inset * 2, grassHeight - inset);

        // Add static grass texture patches (adjusted for inset)
        context.fillStyle = colorScheme.patch1;
        context.fillRect(this.x + 4, this.y + 3, 5, 2);
        context.fillStyle = colorScheme.patch2;
        context.fillRect(this.x + 10, this.y + 2, 4, 2);
        context.fillStyle = colorScheme.patch3;
        context.fillRect(this.x + 17, this.y + 4, 4, 2);

        // Add static grass blades (adjusted for inset)
        context.fillStyle = colorScheme.blade;
        context.fillRect(this.x + 5, this.y + inset, 1, 2);
        context.fillRect(this.x + 12, this.y + inset + 1, 1, 3);
        context.fillRect(this.x + 20, this.y + inset, 1, 2);
    }

    drawIceSurface(context, colorScheme) {
        const iceHeight = Math.floor(this.height / 4);
        const inset = 2; // Leave a border of dirt showing around the ice

        // Fill with base ice color, but inset from edges
        context.fillStyle = colorScheme.base;
        context.fillRect(this.x + inset, this.y + inset, this.width - inset * 2, iceHeight - inset);

        // Add static patches of different blue colors (adjusted for inset)
        context.fillStyle = colorScheme.patch1;
        context.fillRect(this.x + 5, this.y + 2, 6, 2);
        context.fillStyle = colorScheme.patch2;
        context.fillRect(this.x + 12, this.y + 3, 5, 2);
        context.fillStyle = colorScheme.patch3;
        context.fillRect(this.x + 20, this.y + 2, 4, 2);

        // Draw static cracks (adjusted for inset)
        context.strokeStyle = colorScheme.crack;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(this.x + 7, this.y + inset);
        context.lineTo(this.x + 12, this.y + iceHeight - 1);
        context.moveTo(this.x + 17, this.y + inset);
        context.lineTo(this.x + 22, this.y + iceHeight - 1);
        context.stroke();
    }
}