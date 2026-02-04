// renderer.js
// Exports drawing and coordinate helpers for isometric rendering

export function isoToScreen(ix, iy, cellSize) {
    const tileW = cellSize;
    const tileH = Math.floor(cellSize / 2);
    const sx = (ix - iy) * (tileW / 2);
    const sy = (ix + iy) * (tileH / 2);
    return { x: sx, y: sy };
}

export function screenToGrid(sx, sy, cellSize) {
    const tileW = cellSize;
    const tileH = Math.floor(cellSize / 2);
    const rx = sx / (tileW / 2);
    const ry = sy / (tileH / 2);
    const gx = Math.floor((rx + ry) / 2);
    const gy = Math.floor((ry - rx) / 2);
    return { x: gx, y: gy };
}

export function draw(game) {
    const ctx = game.ctx;
    const canvas = game.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(game.camera.x, game.camera.y);
    ctx.scale(game.camera.zoom, game.camera.zoom);

    const gridSize = game.gridSize;
    const tileW = game.cellSize;
    const tileH = Math.floor(game.cellSize / 2);

    for (let layer = 0; layer < gridSize * 2; layer++) {
        for (let x = 0; x <= layer; x++) {
            const y = layer - x;
            if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) continue;
            const cell = game.grid[y][x];
            const iso = isoToScreen(x, y, game.cellSize);
            const sx = iso.x;
            const sy = iso.y;

            // Terrain base
            let baseColor = '#4ade80';
            if (cell.terrain === 'water') baseColor = '#38bdf8';
            else if (cell.terrain === 'hill') baseColor = '#a3a380';
            else if (cell.terrain === 'beach') baseColor = '#fef3c7';
            else if (cell.terrain === 'mountain') baseColor = '#9ca3af';

            const elev = cell.elevation || 0;
            const elevPx = elev * 3;

            const top = { x: sx, y: sy - tileH / 2 - elevPx };
            const right = { x: sx + tileW / 2, y: sy - elevPx };
            const bottom = { x: sx, y: sy + tileH / 2 - elevPx };
            const left = { x: sx - tileW / 2, y: sy - elevPx };

            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(right.x, right.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.lineTo(left.x, left.y);
            ctx.closePath();
            ctx.fill();

            // River overlay
            if (cell.river) {
                ctx.strokeStyle = 'rgba(40,120,200,0.9)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(sx, sy - 4 - elevPx);
                ctx.lineTo(sx, sy + 4 - elevPx);
                ctx.stroke();
                ctx.lineWidth = 1;
            }

            // elevation shadow
            if (elev > 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.06)';
                ctx.beginPath();
                ctx.moveTo(bottom.x, bottom.y);
                ctx.lineTo(bottom.x, bottom.y + elevPx);
                ctx.lineTo(right.x, right.y + elevPx);
                ctx.lineTo(right.x, right.y);
                ctx.closePath();
                ctx.fill();
            }

            // draw object
            if (cell.type !== 'none') {
                drawCell(game, x, y, cell);
            }

            // subtle grid stroke
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(right.x, right.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.lineTo(left.x, left.y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    // hover highlight
    if (game.mouse.gridX >= 0 && game.mouse.gridX < game.gridSize &&
        game.mouse.gridY >= 0 && game.mouse.gridY < game.gridSize) {
        const iso = isoToScreen(game.mouse.gridX, game.mouse.gridY, game.cellSize);
        const sx = iso.x;
        const sy = iso.y;
        const tileH = Math.floor(game.cellSize / 2);
        const elev = game.grid[game.mouse.gridY][game.mouse.gridX].elevation || 0;
        const elevPx = elev * 3;
        const top = { x: sx, y: sy - tileH / 2 - elevPx };
        const right = { x: sx + game.cellSize / 2, y: sy - elevPx };
        const bottom = { x: sx, y: sy + tileH / 2 - elevPx };
        const left = { x: sx - game.cellSize / 2, y: sy - elevPx };
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(right.x, right.y);
        ctx.lineTo(bottom.x, bottom.y);
        ctx.lineTo(left.x, left.y);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawCell(game, x, y, cell) {
    const ctx = game.ctx;
    const tileW = game.cellSize;
    const tileH = Math.floor(game.cellSize / 2);
    const iso = isoToScreen(x, y, game.cellSize);
    const sx = iso.x;
    const sy = iso.y;
    const elev = cell.elevation || 0;
    const elevPx = elev * 3;

    const footprintW = Math.floor(tileW * 0.5);
    const footprintH = Math.floor(tileH * 0.4);

    if (cell.type === 'road') {
        // road top strip (elevation-aware)
        const roadH = 4;
        const rt = { x: sx, y: sy - tileH/6 - elevPx - roadH };
        const rr = { x: sx + tileW/6, y: sy - elevPx - roadH };
        const rb = { x: sx, y: sy + tileH/6 - elevPx - roadH };
        const rl = { x: sx - tileW/6, y: sy - elevPx - roadH };
        ctx.fillStyle = '#3b4652';
        ctx.beginPath();
        ctx.moveTo(rl.x, rl.y);
        ctx.lineTo(rr.x, rr.y);
        ctx.lineTo(rb.x, rb.y);
        ctx.lineTo(rt.x, rt.y);
        ctx.closePath();
        ctx.fill();

        // slight side shading to suggest depth
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.moveTo(rr.x, rr.y);
        ctx.lineTo(rb.x, rb.y);
        ctx.lineTo(sx + tileW/2, sy - elevPx);
        ctx.lineTo(sx + tileW/2 - 2, sy - tileH/2 + 4 - elevPx);
        ctx.closePath();
        ctx.fill();

        // sidewalks (on slight higher plane)
        ctx.fillStyle = '#bfc6cc';
        ctx.beginPath();
        ctx.moveTo(sx - tileW/2 + 2, sy - tileH/2 - elevPx);
        ctx.lineTo(sx + tileW/2 - 2, sy - tileH/2 - elevPx);
        ctx.lineTo(sx + tileW/2 - 2, sy - tileH/2 + 4 - elevPx);
        ctx.lineTo(sx - tileW/2 + 2, sy - tileH/2 + 4 - elevPx);
        ctx.closePath();
        ctx.fill();
        return;
    }

    if (cell.type === 'residential') {
        // ground patch
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.ellipse(sx, sy - elevPx + 6, footprintW/2, footprintH/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // building roof and sides
        const buildingH = 8 + Math.floor(cell.level * 3);
        const roofTop = { x: sx, y: sy - tileH/2 - elevPx - buildingH };
        const roofRight = { x: sx + tileW/4, y: sy - elevPx - buildingH };
        const roofBottom = { x: sx, y: sy + tileH/2 - elevPx - buildingH };
        const roofLeft = { x: sx - tileW/4, y: sy - elevPx - buildingH };

        ctx.fillStyle = cell.level > 3 ? '#2563eb' : '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(roofTop.x, roofTop.y);
        ctx.lineTo(roofRight.x, roofRight.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(roofLeft.x, roofLeft.y);
        ctx.closePath();
        ctx.fill();

        // right face
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.moveTo(roofRight.x, roofRight.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(sx, sy + tileH/2 - elevPx);
        ctx.lineTo(sx + tileW/2, sy - elevPx);
        ctx.closePath();
        ctx.fill();

        // left/front face
        ctx.fillStyle = 'rgba(0,0,0,0.09)';
        ctx.beginPath();
        ctx.moveTo(roofLeft.x, roofLeft.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(sx, sy + tileH/2 - elevPx);
        ctx.lineTo(sx - tileW/2, sy - elevPx);
        ctx.closePath();
        ctx.fill();

        // windows
        ctx.fillStyle = '#fff';
        for (let i = 0; i < Math.min(3, Math.max(1, Math.floor(cell.level))); i++) {
            ctx.fillRect(sx - 6 + i * 6, roofTop.y + 6, 3, 3);
        }

        // disaster
        if (cell.disaster === 'fire') {
            ctx.fillStyle = 'rgba(255,120,40,0.6)';
            ctx.beginPath();
            ctx.arc(sx, roofTop.y + 6, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        return;
    }

    if (cell.type === 'commercial') {
        ctx.fillStyle = '#e0e7ff';
        ctx.beginPath();
        ctx.ellipse(sx, sy - elevPx + 6, footprintW/2, footprintH/2, 0, 0, Math.PI * 2);
        ctx.fill();
        const bh = 10 + Math.floor(cell.level * 3);
        const roofTop = { x: sx, y: sy - tileH/2 - elevPx - bh };
        const roofRight = { x: sx + tileW/4, y: sy - elevPx - bh };
        const roofBottom = { x: sx, y: sy + tileH/2 - elevPx - bh };
        const roofLeft = { x: sx - tileW/4, y: sy - elevPx - bh };
        ctx.fillStyle = '#1e40af';
        ctx.beginPath();
        ctx.moveTo(roofTop.x, roofTop.y);
        ctx.lineTo(roofRight.x, roofRight.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(roofLeft.x, roofLeft.y);
        ctx.closePath();
        ctx.fill();
        // faces
        ctx.fillStyle = 'rgba(0,0,0,0.11)';
        ctx.beginPath();
        ctx.moveTo(roofRight.x, roofRight.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(sx, sy + tileH/2 - elevPx);
        ctx.lineTo(sx + tileW/2, sy - elevPx);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.moveTo(roofLeft.x, roofLeft.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(sx, sy + tileH/2 - elevPx);
        ctx.lineTo(sx - tileW/2, sy - elevPx);
        ctx.closePath();
        ctx.fill();
        return;
    }

    if (cell.type === 'industrial') {
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.ellipse(sx, sy - elevPx + 6, footprintW/2, footprintH/2, 0, 0, Math.PI * 2);
        ctx.fill();
        // taller industrial stack
        const stackH = 12 + Math.floor(cell.level * 4);
        const roofTop = { x: sx, y: sy - tileH/2 - elevPx - stackH };
        const roofRight = { x: sx + tileW/4, y: sy - elevPx - stackH };
        const roofBottom = { x: sx, y: sy + tileH/2 - elevPx - stackH };
        const roofLeft = { x: sx - tileW/4, y: sy - elevPx - stackH };
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(roofTop.x, roofTop.y);
        ctx.lineTo(roofRight.x, roofRight.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(roofLeft.x, roofLeft.y);
        ctx.closePath();
        ctx.fill();
        // side faces
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.moveTo(roofRight.x, roofRight.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(sx, sy + tileH/2 - elevPx);
        ctx.lineTo(sx + tileW/2, sy - elevPx);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.beginPath();
        ctx.moveTo(roofLeft.x, roofLeft.y);
        ctx.lineTo(roofBottom.x, roofBottom.y);
        ctx.lineTo(sx, sy + tileH/2 - elevPx);
        ctx.lineTo(sx - tileW/2, sy - elevPx);
        ctx.closePath();
        ctx.fill();
        return;
    }

    if (cell.type === 'park') {
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.ellipse(sx, sy - elevPx + 6, footprintW/2, footprintH/2, 0, 0, Math.PI * 2);
        ctx.fill();
        // small tree
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(sx - 4, sy - tileH/2 - elevPx - 6, 4, 6);
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(sx, sy - tileH/2 - elevPx - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        return;
    }
}
