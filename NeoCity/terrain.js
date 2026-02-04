// terrain.js
// Exports a single function to populate a provided grid with terrain/elevation.
export function generateTerrain(grid, gridSize) {
    const seed = Math.floor(Math.random() * 1000000);
    console.log("Generating terrain with seed:", seed);
    function hash(i, j) {
        const x = i * 374761393 + j * 668265263 + seed;
        let z = (x ^ (x >> 13)) * 1274126177;
        return ((z ^ (z >> 16)) >>> 0) / 4294967295;
    }

    function smoothNoise(x, y) {
        const xf = Math.floor(x);
        const yf = Math.floor(y);
        const fracX = x - xf;
        const fracY = y - yf;
        const v00 = hash(xf, yf);
        const v10 = hash(xf + 1, yf);
        const v01 = hash(xf, yf + 1);
        const v11 = hash(xf + 1, yf + 1);
        const u = fracX * fracX * (3 - 2 * fracX);
        const v = fracY * fracY * (3 - 2 * fracY);
        const ix0 = v00 * (1 - u) + v10 * u;
        const ix1 = v01 * (1 - u) + v11 * u;
        return ix0 * (1 - v) + ix1 * v;
    }

    function fbm(x, y, octaves = 4) {
        let value = 0;
        let amp = 1;
        let freq = 1;
        let max = 0;
        for (let o = 0; o < octaves; o++) {
            value += smoothNoise(x * freq, y * freq) * amp;
            max += amp;
            amp *= 0.5;
            freq *= 2;
        }
        return value / max;
    }

    const cx = gridSize / 2;
    const cy = gridSize / 2;
    const maxDist = Math.hypot(cx, cy);

    const elevMap = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const nx = x / gridSize - 0.5;
            const ny = y / gridSize - 0.5;
            let e = fbm(nx * 2.2, ny * 2.2, 4);
            e = Math.pow(e, 1.0);
            const dist = Math.hypot(x - cx, y - cy) / maxDist;
            const falloff = Math.max(0.55, 1 - dist * 0.8);
            e = e * (0.7 + 0.3 * falloff);
            elevMap[y][x] = e;
        }
    }

    for (let pass = 0; pass < 2; pass++) {
        const temp = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                let sum = 0; let count = 0;
                for (let oy = -1; oy <= 1; oy++) {
                    for (let ox = -1; ox <= 1; ox++) {
                        const nx = x + ox; const ny = y + oy;
                        if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
                        sum += elevMap[ny][nx]; count++;
                    }
                }
                temp[y][x] = sum / count;
            }
        }
        for (let y = 0; y < gridSize; y++) for (let x = 0; x < gridSize; x++) elevMap[y][x] = temp[y][x];
    }

    let minE = Infinity, maxE = -Infinity;
    for (let y = 0; y < gridSize; y++) for (let x = 0; x < gridSize; x++) {
        minE = Math.min(minE, elevMap[y][x]);
        maxE = Math.max(maxE, elevMap[y][x]);
    }
    const range = Math.max(0.0001, maxE - minE);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let e = (elevMap[y][x] - minE) / range;
            e = Math.min(1, e * 1.05 + 0.02);
            grid[y][x].elevation = Math.floor(e * 10);
            if (e < 0.20) grid[y][x].terrain = 'water';
            else if (e < 0.26) grid[y][x].terrain = 'beach';
            else if (e < 0.75) grid[y][x].terrain = 'grass';
            else if (e < 0.9) grid[y][x].terrain = 'hill';
            else grid[y][x].terrain = 'mountain';
        }
    }

    const attempts = 4;
    for (let a = 0; a < attempts; a++) {
        let sx = Math.floor(Math.random() * gridSize);
        let sy = Math.floor(Math.random() * gridSize);
        if (grid[sy][sx].elevation < 6) continue;
        for (let step = 0; step < 400; step++) {
            grid[sy][sx].river = true;
            const neighbors = [[sx - 1, sy], [sx + 1, sy], [sx, sy - 1], [sx, sy + 1]];
            if (neighbors.some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && grid[ny][nx].terrain === 'water')) break;
            let lowest = grid[sy][sx].elevation;
            let next = null;
            for (const [nx, ny] of neighbors) {
                if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
                const elev = grid[ny][nx].elevation;
                if (elev <= lowest) {
                    lowest = elev;
                    next = [nx, ny];
                }
            }
            if (!next) break;
            sx = next[0]; sy = next[1];
        }
    }
}
