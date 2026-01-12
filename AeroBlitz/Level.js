export default class Level {
    constructor() {
        this.scrollSpeed = 60; // pixels per second
        this.scrollOffset = 0;
        this.levelLength = window.NATIVE_HEIGHT * 10;

        this.levelCanvas = document.createElement('canvas');
        this.levelCanvas.width = window.NATIVE_WIDTH;
        this.levelCanvas.height = this.levelLength;
        this.levelCtx = this.levelCanvas.getContext('2d');

        this.generate();
    }

    generate() {
        const ctx = this.levelCtx;
        
        // Base layer
        ctx.fillStyle = '#013220'; // Dark green
        ctx.fillRect(0, 0, window.NATIVE_WIDTH, this.levelLength);

        // Ground texture (dots/noise)
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * window.NATIVE_WIDTH;
            const y = Math.random() * this.levelLength;
            const size = Math.random() * 2;
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
            ctx.fillRect(x, y, size, size);
        }

        const riverPaths = [];
        this.generateRiver(ctx, riverPaths);
        this.generateRiver(ctx, riverPaths);

        const sandAreaPaths = [];
        this.generateSandAreas(ctx, riverPaths, sandAreaPaths);

        this.generateGrassTexture(ctx, riverPaths, sandAreaPaths);

        // Rock formations
        const rockCount = 100;
        for (let i = 0; i < rockCount; i++) {
            const x = Math.random() * window.NATIVE_WIDTH;
            const y = Math.random() * this.levelLength;
            const size = Math.random() * 80 + 20;
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x + size / 3, y + size / 3, size / 2, size / 4, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();

            // Rock
            ctx.fillStyle = `rgb(${100 + Math.random() * 20}, ${100 + Math.random() * 20}, ${100 + Math.random() * 20})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let j = 1; j < 6; j++) {
                ctx.lineTo(x + (Math.random() - 0.5) * size, y + (Math.random() - 0.5) * size);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Trees (now more like bushes from top-down)
        this.generateTrees(ctx, riverPaths, sandAreaPaths);
    }

    generateRiver(ctx, riverPaths) {
        ctx.save();
        let x = Math.random() * window.NATIVE_WIDTH;
        let y = 0;
        const riverWidth = Math.random() * 50 + 20;
        ctx.lineWidth = riverWidth;
        ctx.strokeStyle = `rgba(0, 50, 100, 0.6)`;
        ctx.beginPath();
        const path = [];
        ctx.moveTo(x, y);
        path.push({x, y});
        while (y < this.levelLength) {
            x = Math.max(riverWidth / 2, Math.min(window.NATIVE_WIDTH - riverWidth / 2, x + (Math.random() - 0.5) * 40));
            y += 20;
            ctx.lineTo(x, y);
            path.push({x, y});
        }
        ctx.stroke();
        ctx.restore();
        riverPaths.push({path, width: riverWidth});
    }
    
    generateTrees(ctx, riverPaths, sandAreaPaths) {
        const treeCount = 100; // Fewer, more detailed trees (bushes)
        const bushColors = [
            '#004d00', '#005a00', '#004000', // Darker greens for depth
            '#006400', '#007200', '#005500'  // Lighter greens for highlights
        ];

        // Helper to check for overlap
        const checkOverlap = (px, py, radius) => {
            for (const river of riverPaths) {
                for (let i = 0; i < river.path.length - 1; i++) {
                    const p1 = river.path[i];
                    const p2 = river.path[i+1];
                    const dist = this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
                    if (dist < radius + river.width / 2) return true;
                }
            }
            // Simple circular check for sand areas for now
            for (const sandArea of sandAreaPaths) {
                const dx = px - sandArea.x;
                const dy = py - sandArea.y;
                if (Math.sqrt(dx*dx + dy*dy) < radius + sandArea.radius) return true; // Approximation
            }
            return false;
        };


        for (let i = 0; i < treeCount; i++) {
            const x = Math.random() * window.NATIVE_WIDTH;
            const y = Math.random() * this.levelLength;
            const baseSize = Math.random() * 30 + 25; // Base size of the bush

            if (checkOverlap(x, y, baseSize)) continue;

            // Draw shadow for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x + baseSize * 0.2, y + baseSize * 0.2, baseSize * 0.8, baseSize * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();

            // Draw irregular bush shape
            ctx.fillStyle = bushColors[Math.floor(Math.random() * bushColors.length)];
            ctx.beginPath();
            const startAngle = Math.random() * Math.PI * 2;
            ctx.moveTo(x + Math.cos(startAngle) * baseSize, y + Math.sin(startAngle) * baseSize);
            for (let j = 0; j < 5; j++) {
                const angle = startAngle + (j + 1) * (Math.PI * 2 / 5) + (Math.random() - 0.5) * Math.PI / 4;
                const radius = baseSize * (0.8 + Math.random() * 0.4);
                ctx.quadraticCurveTo(
                    x + Math.cos(startAngle + j * (Math.PI * 2 / 5) + Math.PI / 5) * baseSize * 1.2,
                    y + Math.sin(startAngle + j * (Math.PI * 2 / 5) + Math.PI / 5) * baseSize * 1.2,
                    x + Math.cos(angle) * radius,
                    y + Math.sin(angle) * radius
                );
            }
            ctx.closePath();
            ctx.fill();

            // Add subtle highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(x - baseSize * 0.3, y - baseSize * 0.3, baseSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    generateSandAreas(ctx, riverPaths, sandAreaPaths) {
        const sandAreaCount = 30;
        const sandColors = ['#C2B280', '#D4C79B', '#B5A778']; // Sandy colors

        // Helper to check for overlap with rivers
        const checkRiverOverlap = (px, py, radius) => {
            for (const river of riverPaths) {
                for (let i = 0; i < river.path.length - 1; i++) {
                    const p1 = river.path[i];
                    const p2 = river.path[i+1];
                    const dist = this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
                    if (dist < radius + river.width / 2) return true;
                }
            }
            return false;
        };

        for (let i = 0; i < sandAreaCount; i++) {
            const x = Math.random() * window.NATIVE_WIDTH;
            const y = Math.random() * this.levelLength;
            const baseWidth = Math.random() * 150 + 80;
            const baseHeight = Math.random() * 100 + 50;
            const radius = Math.max(baseWidth, baseHeight) / 2; // Approximate radius for overlap check

            if (checkRiverOverlap(x, y, radius)) continue;

            // Store for other overlap checks
            sandAreaPaths.push({x, y, radius});

            // Draw shadow for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x + baseWidth * 0.1, y + baseHeight * 0.1, baseWidth * 0.9, baseHeight * 0.9, Math.random() * Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw irregular sand patch
            ctx.fillStyle = sandColors[Math.floor(Math.random() * sandColors.length)];
            ctx.beginPath();
            const startAngle = Math.random() * Math.PI * 2;
            ctx.moveTo(x + Math.cos(startAngle) * baseWidth / 2, y + Math.sin(startAngle) * baseHeight / 2);
            for (let j = 0; j < 6; j++) {
                const angle = startAngle + (j + 1) * (Math.PI * 2 / 6) + (Math.random() - 0.5) * Math.PI / 6;
                const radiusX = baseWidth / 2 * (0.8 + Math.random() * 0.4);
                const radiusY = baseHeight / 2 * (0.8 + Math.random() * 0.4);
                ctx.quadraticCurveTo(
                    x + Math.cos(startAngle + j * (Math.PI * 2 / 6) + Math.PI / 6) * baseWidth * 0.6,
                    y + Math.sin(startAngle + j * (Math.PI * 2 / 6) + Math.PI / 6) * baseHeight * 0.6,
                    x + Math.cos(angle) * radiusX,
                    y + Math.sin(angle) * radiusY
                );
            }
            ctx.closePath();
            ctx.fill();

            // Add grainy texture to sand
            const textureCount = 300;
            for(let k = 0; k < textureCount; k++) {
                const tx = x + (Math.random() - 0.5) * baseWidth * 0.8;
                const ty = y + (Math.random() - 0.5) * baseHeight * 0.8;
                const tsize = Math.random() * 1.5;
                if (ctx.isPointInPath(x,y)) { // Only draw texture within the sand area
                   ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
                   ctx.fillRect(tx, ty, tsize, tsize);
                }
            }
        }
    }

    generateGrassTexture(ctx, riverPaths, sandAreaPaths) {
        const grassCount = 10000;
        const grassColors = ['#013220', '#024d27', '#03662f']; // Shades of green

        // Helper to check for overlap with existing features
        const checkOverlap = (px, py, radius) => {
            for (const river of riverPaths) {
                for (let i = 0; i < river.path.length - 1; i++) {
                    const p1 = river.path[i];
                    const p2 = river.path[i+1];
                    const dist = this.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
                    if (dist < radius + river.width / 2) return true;
                }
            }
            for (const sandArea of sandAreaPaths) {
                const dx = px - sandArea.x;
                const dy = py - sandArea.y;
                if (Math.sqrt(dx*dx + dy*dy) < radius + sandArea.radius) return true;
            }
            return false;
        };

        for (let i = 0; i < grassCount; i++) {
            const x = Math.random() * window.NATIVE_WIDTH;
            const y = Math.random() * this.levelLength;
            const size = Math.random() * 3 + 1; // Size of grass blade
            const radius = size / 2; // For overlap check

            if (checkOverlap(x, y, radius)) continue;

            ctx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
            ctx.beginPath();
            ctx.ellipse(x, y, size / 2, size, Math.random() * Math.PI * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Helper function to calculate distance from a point to a line segment
    distToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        const closestX = x1 + t * (x2 - x1);
        const closestY = y1 + t * (y2 - y1);
        return Math.hypot(px - closestX, py - closestY);
    }


    update(deltaTime) {
        this.scrollOffset += this.scrollSpeed * deltaTime;
        // The scrollOffset represents the player's progress into the level.
        // It should max out at the point where the end of the level aligns with the bottom of the screen.
        const maxScroll = this.levelLength - window.NATIVE_HEIGHT;
        if (this.scrollOffset > maxScroll) {
            this.scrollOffset = 0; // Loop the level for now
        }
    }

    draw() {
        // sourceY determines which part of the levelCanvas to draw.
        // To make the background scroll DOWNWARDS as scrollOffset increases,
        // we need to take a slice from further UP the levelCanvas.
        const sourceY = this.levelLength - window.NATIVE_HEIGHT - this.scrollOffset;
        const remaining = this.levelCanvas.height - sourceY;

        if (remaining < window.NATIVE_HEIGHT) {
            const sliceHeight = remaining;
            window.ctx.drawImage(this.levelCanvas, 0, sourceY, window.NATIVE_WIDTH, sliceHeight, 0, 0, window.canvas.width, sliceHeight * window.scaleFactor);
            window.ctx.drawImage(this.levelCanvas, 0, 0, window.NATIVE_WIDTH, window.NATIVE_HEIGHT - sliceHeight, 0, sliceHeight * window.scaleFactor, window.canvas.width, (window.NATIVE_HEIGHT - sliceHeight) * window.scaleFactor);
        } else {
            window.ctx.drawImage(this.levelCanvas, 0, sourceY, window.NATIVE_WIDTH, window.NATIVE_HEIGHT, 0, 0, window.canvas.width, window.canvas.height);
        }
    }

    get levelCanvasElement() {
        return this.levelCanvas;
    }
}