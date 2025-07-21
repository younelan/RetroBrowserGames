class Dirt extends Tile {
    constructor(x, y, width, height, type, dirtScheme, surfaceScheme, decay = 0) {
        super(x, y, width, height, type);
        this.dirtScheme = dirtScheme;
        this.surfaceScheme = surfaceScheme;
        this.decay = decay;
        this.crumbled = false; // Track if tile has fully crumbled
    }

    setPlayer(player) {
        this.player = player;
    }

    update() {
        // Only process crumbling logic for crumbling dirt types
        if ((this.type === '-' || this.type === ';') && this.player && !this.crumbled) {
            // Check if player is standing on this tile (player's bottom edge touching or overlapping tile's top)
            const playerBottom = this.player.y + this.player.height;
            const playerLeft = this.player.x;
            const playerRight = this.player.x + this.player.width;
            const tileTop = this.y;
            const tileLeft = this.x;
            const tileRight = this.x + this.width;
            
            // Player is on the platform if:
            // 1. Player's bottom is at or just below the platform top
            // 2. Player horizontally overlaps with the platform
            // 3. Player is not moving upward (velocityY >= 0)
            if (playerBottom >= tileTop && playerBottom <= tileTop + 8 && // Allow some tolerance
                playerRight > tileLeft && playerLeft < tileRight && // Horizontal overlap
                this.player.velocityY >= 0) { // Not jumping up
                
                this.decay++;
                if (this.decay > 30) {
                    this.crumbled = true;
                }
            }
        }
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
        // Skip rendering if the tile is fully crumbled
        if (this.crumbled) {
            return;
        }

        const s = TILE_SIZE / 16; // Scale factor for drawing details

        // Determine if it's a crumbling platform
        const isCrumbling = this.type === '-' || this.type === ';';
        const colorScheme = DIRT_COLOR_SCHEMES[this.dirtScheme] || DIRT_COLOR_SCHEMES[DEFAULT_DIRT_SCHEME];

        // For crumbling platforms, show decay effect (even at decay = 0, they should look different)
        if (isCrumbling) {
            const crumbleProgress = Math.min(this.decay / 30, 1); // Normalize decay to 0-1
            
            context.save();
            context.beginPath();
            
            // Start from top-left corner
            context.moveTo(this.x, this.y);
            // Top edge (straight)
            context.lineTo(this.x + this.width, this.y);
            // Right edge down to jagged bottom area
            context.lineTo(this.x + this.width, this.y + this.height - 8);

            // Create natural jagged bottom edge - same as normal dirt
            const pointSpacing = 1;
            const numPoints = Math.floor(this.width / pointSpacing);
            
            const globalTileX = this.x / TILE_SIZE;
            const globalTileY = this.y / TILE_SIZE;

            for (let i = numPoints; i >= 0; i--) {
                const globalX = this.x + (i * pointSpacing);
                const variation1 = Math.sin(globalX * 0.08 + globalTileY * 0.05) * 6;
                const variation2 = Math.sin(globalX * 0.15 + globalTileY * 0.08) * 4;
                const variation3 = Math.sin(globalX * 0.3 + globalTileY * 0.12) * 3;
                const variation4 = Math.sin(globalX * 0.6 + globalTileY * 0.2) * 2;
                const totalVariation = variation1 + variation2 + variation3 + variation4;
                const y = this.y + this.height - 8 + totalVariation;
                context.lineTo(globalX, y);
            }
            
            context.lineTo(this.x, this.y);
            context.closePath();
            context.clip();

            // Base dirt color for crumbling platforms
            context.fillStyle = colorScheme.crumbleBase;
            context.fillRect(this.x, this.y, this.width, this.height);

            // Create patchy, uneven dirt surface - same sophisticated approach
            for (let patch = 0; patch < 15; patch++) {
                const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
                const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
                
                const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; 
                const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
                const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
                const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
                
                const patchX = this.x - 8 + Math.floor(patchRandX * (this.width + 16)); 
                const patchY = this.y + Math.floor(patchRandY * 8); 
                const patchWidth = Math.floor(4 + patchRandSize * 8);
                const patchHeight = Math.floor(4 + patchRandSize * 8);
                
                // Apply decay effect - make patches disappear/shrink as it crumbles
                const patchVisible = (patch / 15) > crumbleProgress;
                const scaleFactor = Math.max(0.3, 1 - crumbleProgress);
                
                if (patchVisible && patchY >= this.y && patchY + patchHeight <= this.y + this.height) {
                    let patchColor;
                    if (patchRandColor < 0.3) {
                        patchColor = colorScheme.patch1;
                    } else if (patchRandColor < 0.6) {
                        patchColor = colorScheme.patch2;
                    } else {
                        patchColor = colorScheme.patch3;
                    }
                    context.fillStyle = patchColor;
                    context.fillRect(patchX, patchY, Math.floor(patchWidth * scaleFactor), Math.floor(patchHeight * scaleFactor));
                }
            }

            // Add rocks for texture - same sophisticated approach with decay
            for (let i = 0; i < 8; i++) {
                const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
                const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
                
                const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5; 
                const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.7 + 0.3;
                const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
                const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
                
                const rockX = this.x - 6 + Math.floor(pseudoRandX * (this.width + 12)); 
                const rockY = this.y + 4 + Math.floor(pseudoRandY * (this.height - 16)); 
                const rockSize = Math.floor(pseudoRandSize * 5) + 3; 
                
                // Apply decay effect - make rocks disappear/shrink as it crumbles
                const rockVisible = (i / 8) > crumbleProgress;
                const rockScaleFactor = Math.max(0.4, 1 - crumbleProgress);
                
                if (rockVisible) {
                    let rockColor;
                    if (pseudoRandColor < 0.4) {
                        rockColor = colorScheme.rock1;
                    } else if (pseudoRandColor < 0.7) {
                        rockColor = colorScheme.rock2;
                    } else {
                        rockColor = colorScheme.rock3;
                    }
                    context.fillStyle = rockColor;
                    context.fillRect(rockX, rockY, Math.floor(rockSize * rockScaleFactor), Math.floor(rockSize * rockScaleFactor));
                }
            }
            
            // Add crumbling cracks that get more prominent as decay increases
            if (this.decay > 0) {
                context.strokeStyle = this.darkenColor(colorScheme.crumbleBase, 0.4);
                context.lineWidth = Math.max(1, Math.floor(crumbleProgress * 3));
                context.beginPath();
                
                // Dynamic cracks that grow with decay
                const numCracks = Math.floor(crumbleProgress * 6) + 2;
                for (let crack = 0; crack < numCracks; crack++) {
                    const crackSeed = globalTileX * 13 + globalTileY * 17 + crack * 23;
                    const startX = this.x + (Math.sin(crackSeed) * 0.5 + 0.5) * this.width;
                    const startY = this.y + (Math.sin(crackSeed * 1.3) * 0.5 + 0.5) * this.height;
                    const endX = this.x + (Math.sin(crackSeed * 1.7) * 0.5 + 0.5) * this.width;
                    const endY = this.y + (Math.sin(crackSeed * 2.1) * 0.5 + 0.5) * this.height;
                    
                    context.moveTo(startX, startY);
                    context.lineTo(endX, endY);
                }
                context.stroke();
            }
            
            // Draw surface layer for crumbling two-layer platforms
            if (this.type === ';') {
                const surfaceColorScheme = SURFACE_COLOR_SCHEMES[this.surfaceScheme] || SURFACE_COLOR_SCHEMES[DEFAULT_SURFACE_SCHEME];
                if (this.surfaceScheme === 'grass') {
                    this.drawGrassSurface(context, surfaceColorScheme);
                } else if (this.surfaceScheme === 'ice') {
                    this.drawIceSurface(context, surfaceColorScheme);
                }
            }
            
            context.restore();
            return; // Exit early for crumbling platforms
        }
        
        // Normal dirt drawing (not crumbling) - restore original sophisticated rendering
        context.save();
        context.beginPath();
        
        // Start from top-left corner
        context.moveTo(this.x, this.y);
        // Top edge (straight)
        context.lineTo(this.x + this.width, this.y);
        // Right edge down to jagged bottom area
        context.lineTo(this.x + this.width, this.y + this.height - 8);

        // Create natural jagged bottom edge - much more jagged and irregular
        const pointSpacing = 1; // Smaller spacing for more detailed jagged edge
        const numPoints = Math.floor(this.width / pointSpacing);
        
        // Generate jagged points from right to left using GLOBAL position for seamless tiles
        const globalTileX = this.x / TILE_SIZE;
        const globalTileY = this.y / TILE_SIZE;

        for (let i = numPoints; i >= 0; i--) {
            const globalX = this.x + (i * pointSpacing);
            // Create much more dramatic jagged variation
            const variation1 = Math.sin(globalX * 0.08 + globalTileY * 0.05) * 6;
            const variation2 = Math.sin(globalX * 0.15 + globalTileY * 0.08) * 4;
            const variation3 = Math.sin(globalX * 0.3 + globalTileY * 0.12) * 3;
            const variation4 = Math.sin(globalX * 0.6 + globalTileY * 0.2) * 2;
            const totalVariation = variation1 + variation2 + variation3 + variation4;
            const y = this.y + this.height - 8 + totalVariation;
            context.lineTo(globalX, y);
        }
        
        // Left edge back to start
        context.lineTo(this.x, this.y);
        context.closePath();
        context.clip();

        // Base dirt color
        context.fillStyle = colorScheme.base;
        context.fillRect(this.x, this.y, this.width, this.height);

        // Create patchy, uneven dirt surface
        for (let patch = 0; patch < 15; patch++) {
            const globalPatchX = (globalTileX * 47 + globalTileY * 31 + patch * 13) % 7;
            const globalPatchY = (globalTileX * 23 + globalTileY * 41 + patch * 17) % 5;
            
            const patchRandX = Math.sin(globalPatchX + patch * 2.3) * 0.8 + 0.5; 
            const patchRandY = Math.sin(globalPatchY + patch * 4.7) * 0.5 + 0.5;
            const patchRandSize = Math.sin(globalTileX * 19 + globalTileY * 23 + patch * 6.1) * 0.5 + 0.5;
            const patchRandColor = Math.sin(globalTileX * 29 + globalTileY * 31 + patch * 8.9) * 0.5 + 0.5;
            
            const patchX = this.x - 8 + Math.floor(patchRandX * (this.width + 16)); 
            const patchY = this.y + Math.floor(patchRandY * 8); 
            const patchWidth = Math.floor(4 + patchRandSize * 8);
            const patchHeight = Math.floor(4 + patchRandSize * 8);
            
            if (patchY >= this.y && patchY + patchHeight <= this.y + this.height) {
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

        // Add rocks for texture
        for (let i = 0; i < 8; i++) {
            const globalRockX = (globalTileX * 37 + globalTileY * 43 + i * 19) % 11;
            const globalRockY = (globalTileX * 17 + globalTileY * 29 + i * 23) % 7;
            
            const pseudoRandX = Math.sin(globalRockX + i * 3.7) * 0.8 + 0.5; 
            const pseudoRandY = Math.sin(globalRockY + i * 5.1) * 0.7 + 0.3;
            const pseudoRandSize = Math.sin(globalTileX * 37 + globalTileY * 41 + i * 7.3) * 0.5 + 0.5;
            const pseudoRandColor = Math.sin(globalTileX * 43 + globalTileY * 47 + i * 9.7) * 0.5 + 0.5;
            
            const rockX = this.x - 6 + Math.floor(pseudoRandX * (this.width + 12)); 
            const rockY = this.y + 4 + Math.floor(pseudoRandY * (this.height - 16)); 
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
        
        context.restore();
    }

    drawGrassSurface(context, colorScheme) {
        const grassHeight = Math.floor(this.height / 4);
        const inset = 2;

        context.fillStyle = colorScheme.base;
        context.fillRect(this.x + inset, this.y + inset, this.width - inset * 2, grassHeight - inset);

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