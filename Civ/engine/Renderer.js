export class Renderer {
    constructor(canvas, camera, worldMap) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;
        this.worldMap = worldMap;

        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw hexes
        for (const tile of this.worldMap.tiles.values()) {
            this.drawHex(tile);
        }

        // Draw Player entities
        if (window.game) {
            window.game.players.forEach(player => {
                player.cities.forEach(city => this.drawCity(city));
                player.units.forEach(unit => this.drawUnit(unit));
            });

            // Highlight selected entity
            if (window.game.selectedEntity) {
                const e = window.game.selectedEntity;
                const tile = e.tile || this.worldMap.getTile(e.q, e.r);
                if (tile) this.drawHighlight(tile, 'rgba(255, 255, 255, 0.4)', true);
            }
        }

        this.drawMiniMap();
    }

    drawHex(tile) {
        const { x, y } = this.camera.hexToScreen(tile.q, tile.r);
        const size = this.camera.hexSize * this.camera.zoom;

        if (this.isOffScreen(x, y, size)) return;

        const player = window.game?.getCurrentPlayer();
        const isDiscovered = !player || player.discoveredTiles.has(`${tile.q},${tile.r}`);

        this.drawHexPath(x, y, size);

        // Fill with terrain color or fog
        if (isDiscovered) {
            // High fidelity terrain rendering
            this.ctx.fillStyle = tile.terrain.color;
            this.ctx.fill();

            // Add a subtle hatched texture or noise for depth
            this.ctx.save();
            this.ctx.clip();
            this.drawTerrainTexture(tile, x, y, size);
            this.ctx.restore();

            // Gradient overlay for spherical feel
            const grd = this.ctx.createRadialGradient(x, y, size * 0.2, x, y, size);
            grd.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            grd.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            this.ctx.fillStyle = grd;
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#050505';
            this.ctx.fill();
        }

        // Subtle border
        this.ctx.strokeStyle = isDiscovered ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Inner highlight for a "paper" or "rim" effect
        if (isDiscovered) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.save();
            this.ctx.scale(0.9, 0.9);
            // This is a bit complex for a simple multiplier, but gives a nice inset look
            this.ctx.restore();
        }

        if (isDiscovered) {
            this.drawRivers(tile, x, y, size);
            this.drawImprovements(tile, x, y, size);
            this.drawFeatures(tile, x, y, size);
            this.drawYields(tile, x, y, size);
            if (tile.village) this.drawVillage(tile, x, y, size);
        }
    }

    drawRivers(tile, x, y, size) {
        if (!tile.rivers || tile.rivers.length === 0) return;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        tile.rivers.forEach(dirIndex => {
            const angle1 = (Math.PI / 3) * (dirIndex - 0.5);
            const angle2 = (Math.PI / 3) * (dirIndex + 0.5);
            const x1 = x + size * Math.cos(angle1);
            const y1 = y + size * Math.sin(angle1);
            const x2 = x + size * Math.cos(angle2);
            const y2 = y + size * Math.sin(angle2);

            // Shadow/Depth
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.lineWidth = size * 0.2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();

            // Water
            this.ctx.strokeStyle = '#4299e1';
            this.ctx.lineWidth = size * 0.12;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        });
    }

    adjustColor(hex, amt) {
        let usePound = false;
        if (hex[0] === '#') {
            hex = hex.slice(1);
            usePound = true;
        }
        let num = parseInt(hex, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255; else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255; else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255; else if (g < 0) g = 0;
        return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    drawYields(tile, x, y, size) {
        if (this.camera.zoom < 0.8) return;
        const yields = tile.getYield();
        this.ctx.font = `bold ${size * 0.15}px Inter`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let offset = 0;
        if (yields.food > 0) {
            this.ctx.fillStyle = '#aff5b4';
            this.ctx.fillText('●'.repeat(yields.food), x, y + size * 0.6);
            offset += 10;
        }
        if (yields.production > 0) {
            this.ctx.fillStyle = '#ff7b72';
            this.ctx.fillText('⚒️'.repeat(yields.production), x, y + size * 0.75);
        }
    }

    drawImprovements(tile, x, y, size) {
        if (!tile.improvement || this.camera.zoom < 0.4) return;

        this.ctx.font = `${size * 0.4}px Inter`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tile.improvement.icon, x - size * 0.4, y + size * 0.4);

        // Draw a small background for improvement icon to make it pop
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.4, y + size * 0.4, size * 0.25, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(tile.improvement.icon, x - size * 0.4, y + size * 0.4);
    }

    drawFeatures(tile, x, y, size) {
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Terrain Base Icon (Static feature like mountain)
        if (tile.terrain.icon && this.camera.zoom > 0.5) {
            this.ctx.font = `${size * 0.8}px Inter`;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillText(tile.terrain.icon, x, y);
            this.ctx.globalAlpha = 1.0;
        }

        // Feature (Forest, Jungle)
        if (tile.feature.icon && this.camera.zoom > 0.4) {
            this.ctx.font = `${size * 0.7}px Inter`;
            // Draw multiple trees for forest
            if (tile.feature.name === 'Forest') {
                this.ctx.fillText('🌲', x - size * 0.3, y - size * 0.2);
                this.ctx.fillText('🌲', x + size * 0.3, y - size * 0.1);
                this.ctx.fillText('🌲', x, y + size * 0.2);
            } else {
                this.ctx.fillText(tile.feature.icon, x, y);
            }
        }

        // Resource
        if (tile.resource.icon && this.camera.zoom > 0.6) {
            this.ctx.font = `${size * 0.5}px Inter`;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillText(tile.resource.icon, x + size * 0.4, y + size * 0.4);
            this.ctx.shadowBlur = 0;
        }
    }

    drawHexPath(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
    }

    drawUnit(unit) {
        const { x, y } = this.camera.hexToScreen(unit.q, unit.r);
        const size = this.camera.hexSize * this.camera.zoom;
        if (this.isOffScreen(x, y, size)) return;

        const player = window.game?.getCurrentPlayer();
        if (player && !player.discoveredTiles.has(`${unit.q},${unit.r}`)) return;

        // Player marker (ring) with subtle glow
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
        this.ctx.strokeStyle = unit.owner.color;
        this.ctx.lineWidth = 3 * this.camera.zoom;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = unit.owner.color;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Base circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${size * 0.7}px Outfit`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(unit.type.icon, x, y);

        // Status Indicators
        if (unit.isFortified) {
            this.ctx.font = `${size * 0.3}px Outfit`;
            this.ctx.fillText('🛡️', x + size * 0.35, y - size * 0.35);
        } else if (unit.task === 'Sentry') {
            this.ctx.font = `${size * 0.3}px Outfit`;
            this.ctx.fillText('💤', x + size * 0.35, y - size * 0.35);
        } else if (unit.workRemaining > 0) {
            this.ctx.font = `${size * 0.3}px Outfit`;
            this.ctx.fillText('🚧', x + size * 0.35, y - size * 0.35);
        }

        // Health Bar (Modern Style)
        if (unit.health < 100) {
            const barW = size * 0.8;
            const barH = 4 * this.camera.zoom;
            const barX = x - barW / 2;
            const barY = y + size * 0.5;

            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(barX, barY, barW, barH);

            this.ctx.fillStyle = unit.health > 25 ? '#7ee787' : '#ff7b72';
            this.ctx.fillRect(barX, barY, barW * (unit.health / 100), barH);
        }
    }

    drawCity(city) {
        const { x, y } = this.camera.hexToScreen(city.q, city.r);
        const size = this.camera.hexSize * this.camera.zoom;
        if (this.isOffScreen(x, y, size)) return;

        const player = window.game?.getCurrentPlayer();
        if (player && !player.discoveredTiles.has(`${city.q},${city.r}`)) return;

        // City Banner (Glassmorphic style)
        const bannerW = size * 2.2;
        const bannerH = size * 0.5;
        const bannerX = x - bannerW / 2;
        const bannerY = y - size * 0.95;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(bannerX, bannerY, bannerW, bannerH);

        this.ctx.strokeStyle = city.owner.color;
        this.ctx.lineWidth = 2 * this.camera.zoom;
        this.ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

        this.ctx.fillStyle = 'white';
        this.ctx.font = `600 ${size * 0.3}px Outfit`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(city.name.toUpperCase(), x, y - size * 0.65);

        // City Icon with glow
        this.ctx.font = `bold ${size * 1.0}px Outfit`;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = city.owner.color;
        this.ctx.fillText('🏰', x, y);
        this.ctx.shadowBlur = 0;

        // Population indicator (Clean pill style)
        const popX = x - size * 0.85;
        const popY = y;
        this.ctx.beginPath();
        this.ctx.arc(popX, popY, size * 0.22, 0, Math.PI * 2);
        this.ctx.fillStyle = '#2ea043';
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${size * 0.22}px Outfit`;
        this.ctx.fillText(city.population, popX, popY);
    }

    drawHighlight(tile, color, glowing = false) {
        const { x, y } = this.camera.hexToScreen(tile.q, tile.r);
        const size = this.camera.hexSize * this.camera.zoom;
        this.drawHexPath(x, y, size);

        if (glowing) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'white';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
    }

    drawVillage(tile, x, y, size) {
        if (this.camera.zoom < 0.4) return;
        this.ctx.font = `${size * 0.7}px Inter`;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#f2cc60';
        this.ctx.fillText('🏡', x, y);
        this.ctx.shadowBlur = 0;
    }

    isOffScreen(x, y, size) {
        return x < -size * 2 || x > this.canvas.width + size * 2 ||
            y < -size * 2 || y > this.canvas.height + size * 2;
    }

    drawTerrainTexture(tile, x, y, size) {
        // Deterministic pseudo-random based on tile coords
        const seed = Math.abs(tile.q * 12345 + tile.r * 6789) % 1000;

        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;

        // Add some noise dots
        for (let i = 0; i < 15; i++) {
            const rx = x + (Math.sin(seed + i) * size * 0.8);
            const ry = y + (Math.cos(seed * i) * size * 0.8);
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, size * 0.05, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Terrain-specific patterns
        if (tile.terrain.name === 'Desert') {
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                const ox = x + Math.cos(seed + i) * size * 0.5;
                const oy = y + Math.sin(seed + i) * size * 0.5;
                this.ctx.moveTo(ox - size * 0.2, oy);
                this.ctx.quadraticCurveTo(ox, oy - size * 0.2, ox + size * 0.2, oy);
                this.ctx.stroke();
            }
        }

        this.ctx.globalAlpha = 1.0;
    }

    drawMiniMap() {
        if (!this.minimapCtx) return;
        const mm = this.minimapCanvas;
        const ctx = this.minimapCtx;

        if (mm.width !== 200) {
            mm.width = 200;
            mm.height = 150;
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, mm.width, mm.height);

        const w = this.worldMap.width;
        const h = this.worldMap.height;
        const pSize = mm.width / w;
        const ySize = mm.height / h;

        for (const tile of this.worldMap.tiles.values()) {
            const player = window.game?.getCurrentPlayer();
            const isDiscovered = !player || player.discoveredTiles.has(`${tile.q},${tile.r}`);

            if (!isDiscovered) {
                ctx.fillStyle = '#050505';
            } else {
                ctx.fillStyle = tile.terrain.color;
                if (tile.owner) ctx.fillStyle = tile.owner.color;
            }

            const px = (tile.q + (tile.r / 2)) * pSize;
            const py = tile.r * ySize;
            ctx.fillRect(px, py, pSize, ySize);
        }

        // Draw viewport box
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        const viewX = (-this.camera.x / (this.camera.hexSize * this.camera.zoom * this.worldMap.width * 1.5)) * mm.width + (this.worldMap.width / 4 * pSize); // Simplified mapping
        const viewY = (-this.camera.y / (this.camera.hexSize * this.camera.zoom * this.worldMap.height)) * mm.height;
        const viewW = (this.canvas.width / (this.camera.hexSize * this.camera.zoom * this.worldMap.width)) * mm.width;
        const viewH = (this.canvas.height / (this.camera.hexSize * this.camera.zoom * this.worldMap.height)) * mm.height;

        // This math is complex because of hex coordinates, let's use a simpler screen-to-minimap approach for the box
        const topLeft = window.game.screenToMinimap(0, 0);
        const bottomRight = window.game.screenToMinimap(this.canvas.width, this.canvas.height);
        ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }
}
