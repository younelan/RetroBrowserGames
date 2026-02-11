import { HexTile, TerrainType, FeatureType, ResourceType } from './Tile.js';

// ========================================================================
//  SIMPLEX NOISE  –  Seeded 2D implementation (Stefan Gustavson's algorithm)
// ========================================================================

class SimplexNoise {
    constructor(seed = 0) {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];

        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;

        // Seeded Fisher-Yates shuffle
        let s = (seed * 16807 + 1) & 0x7fffffff;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807 + 1) & 0x7fffffff;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }

        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    noise2D(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;

        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const x0 = xin - (i - t);
        const y0 = yin - (j - t);

        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;

        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.permMod12[ii + this.perm[jj]];
        const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
        const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

        const g = this.grad3;
        let n0, n1, n2;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        n0 = t0 < 0 ? 0 : (t0 *= t0, t0 * t0 * (g[gi0][0] * x0 + g[gi0][1] * y0));

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        n1 = t1 < 0 ? 0 : (t1 *= t1, t1 * t1 * (g[gi1][0] * x1 + g[gi1][1] * y1));

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        n2 = t2 < 0 ? 0 : (t2 *= t2, t2 * t2 * (g[gi2][0] * x2 + g[gi2][1] * y2));

        return 70 * (n0 + n1 + n2); // Range [-1, 1]
    }
}

// ========================================================================
//  WORLD MAP  –  Proper terrain generation with continents, rivers, biomes
// ========================================================================

export class WorldMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Map();
        this.riverPaths = []; // Final traced paths
        this.seed = Math.floor(Math.random() * 100000);
        this.noise = new SimplexNoise(this.seed);
        this.hexSize = 40;
        this.generate();
    }

    // Fractal Brownian Motion (multi-octave simplex noise)
    fbm(x, y, octaves = 6, lacunarity = 2.0, persistence = 0.5, offX = 0, offY = 0) {
        let value = 0, amplitude = 1, frequency = 1, maxAmp = 0;
        for (let i = 0; i < octaves; i++) {
            value += this.noise.noise2D((x + offX) * frequency, (y + offY) * frequency) * amplitude;
            maxAmp += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return value / maxAmp;
    }

    // Ridge noise for mountain chains – produces sharp ridges
    ridgeNoise(x, y, octaves = 5, lacunarity = 2.0, gain = 0.5, offX = 0, offY = 0) {
        let value = 0, amplitude = 1, frequency = 1, maxAmp = 0, prev = 1;
        for (let i = 0; i < octaves; i++) {
            let n = this.noise.noise2D((x + offX) * frequency, (y + offY) * frequency);
            n = 1 - Math.abs(n);   // Create ridges
            n = n * n * prev;       // Sharpen and weight by previous
            prev = n;
            value += n * amplitude;
            maxAmp += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return value / maxAmp;
    }

    // Normalize noise value from [-1,1] to [0,1]
    norm(val) {
        return val * 0.5 + 0.5;
    }

    // Direct noise sampling for any fractional axial coordinate (q, r)
    // Used by the renderer for smooth terrain and feature placement
    sampleElevation(q, r) {
        const scale = 0.018;
        const nx = q * scale;
        const ny = r * scale;

        // Continental base (primary driver)
        const continental = this.norm(this.fbm(nx, ny, 5, 1.7, 0.4, 0, 0));
        // Sharp mountain ridges
        const ridges = this.ridgeNoise(nx * 1.8, ny * 1.8, 4, 2.0, 0.5, 1200, 1200);

        // Edge falloff (looser for massive continents)
        const centerQ = this.width / 2;
        const centerR = this.height / 2;
        const distToCenter = Math.sqrt(Math.pow(q + r / 2 - centerQ, 2) + Math.pow(r - centerR, 2));
        const maxDist = Math.max(this.width, this.height) * 0.55;
        const falloff = Math.max(0, 1 - Math.pow(distToCenter / maxDist, 4));

        let elevation = (continental * 0.75 + ridges * 0.25);
        return Math.pow(elevation, 0.7) * falloff;
    }

    sampleMoisture(q, r) {
        const scale = 0.018;
        return this.norm(this.fbm(q * scale + 2.1, r * scale + 9.3, 5, 2.0, 0.5, 2000, 2000));
    }

    generate() {
        const scale = 0.018; // Even smaller for massive continents

        // Phase 1: Collect all hex coordinates
        const allCoords = [];
        for (let r = 0; r < this.height; r++) {
            const r_offset = Math.floor(r / 2);
            for (let q = -r_offset; q < this.width - r_offset; q++) {
                allCoords.push({ q, r });
            }
        }

        // Phase 2: Compute elevation, moisture, temperature for every position
        allCoords.forEach(({ q, r }) => {
            const nx = q * scale;
            const ny = r * scale;

            // Continental base (primary driver of landmass shape)
            const continental = this.norm(this.fbm(nx, ny, 5, 1.7, 0.4, 0, 0));

            // Sharp mountain ridges
            const ridges = this.ridgeNoise(nx * 1.8, ny * 1.8, 4, 2.0, 0.5, 1200, 1200);

            // Edge falloff (looser to allow larger continents)
            const centerQ = this.width / 2;
            const centerR = this.height / 2;
            const distToCenter = Math.sqrt(Math.pow(q + r / 2 - centerQ, 2) + Math.pow(r - centerR, 2));
            const maxDist = Math.max(this.width, this.height) * 0.55;
            const falloff = Math.max(0, 1 - Math.pow(distToCenter / maxDist, 4));

            // Weighting for massive continents
            let elevation = (continental * 0.75 + ridges * 0.25);
            elevation = Math.pow(elevation, 0.7) * falloff;

            // Moisture (separate noise field)
            const moisture = this.norm(this.fbm(nx + 2.1, ny + 9.3, 5, 2.0, 0.5, 2000, 2000));

            // Temperature (latitude-based + noise)
            const latitude = Math.abs(r - this.height / 2) / (this.height / 2);
            const tempNoise = this.fbm(nx + 4.5, ny + 1.2, 3, 2.0, 0.4, 3000, 3000) * 0.1;
            const temperature = Math.max(0, Math.min(1, 1 - latitude * 0.8 + tempNoise));

            // Select terrain
            const terrain = this.selectTerrain(elevation, moisture, temperature);
            const tile = new HexTile(q, r, terrain);
            tile.elevation = elevation;
            tile.moisture = moisture;
            tile.temperature = temperature;

            // Features (ONLY on appropriate land)
            const isLand = terrain !== TerrainType.OCEAN && terrain !== TerrainType.COAST;
            if (isLand && !terrain.impassable) {
                this.addFeatures(tile, moisture, temperature, latitude);
            }

            // Resources (More picky about land)
            if (isLand) {
                this.addResources(tile);
            }

            // Tribal villages (rare, only on land)
            if (isLand && !terrain.impassable) {
                if (this.pseudoRandom(q * 31 + r * 17 + this.seed) < 0.015) {
                    tile.village = true;
                }
            }

            this.tiles.set(`${q},${r}`, tile);
        });

        // Phase 3: Rivers via flow accumulation
        this.generateRivers();

        // Phase 4: Starting locations
        this.generateStartingLocations();
    }

    // ====================================================================
    //  TERRAIN SELECTION
    // ====================================================================

    selectTerrain(elevation, moisture, temperature) {
        // Precise thresholds for better land/ocean distribution
        // Slightly lower thresholds to increase land area
        if (elevation < 0.38) return TerrainType.OCEAN;
        if (elevation < 0.44) return TerrainType.COAST;

        // High elevation
        if (elevation > 0.85) return TerrainType.MOUNTAIN;
        if (elevation > 0.70) return TerrainType.HILLS;

        // Biome logic based on temp/moisture (Whittaker diagram)
        if (temperature < 0.15) return TerrainType.SNOW;
        if (temperature < 0.25) return TerrainType.TUNDRA;

        if (temperature > 0.5) {
            if (moisture < 0.25) return TerrainType.DESERT;
            if (moisture < 0.45) return TerrainType.PLAINS;
            return TerrainType.GRASSLAND;
        }

        if (moisture < 0.35) return TerrainType.PLAINS;
        return TerrainType.GRASSLAND;
    }

    // ====================================================================
    //  FEATURES
    // ====================================================================

    addFeatures(tile, moisture, temperature, latitude) {
        // Double check it's really land
        if (tile.terrain === TerrainType.OCEAN || tile.terrain === TerrainType.COAST) return;

        const fnx = tile.q * 0.08;
        const fny = tile.r * 0.08;
        const fNoise = this.norm(this.fbm(fnx, fny, 3, 2, 0.5, 4000, 4000));

        // Desert specific features
        if (tile.terrain === TerrainType.DESERT) {
            if (fNoise > 0.82) tile.feature = FeatureType.OASIS;
            return;
        }

        // Tropical features
        if (temperature > 0.7 && moisture > 0.6) {
            if (fNoise > 0.4) tile.feature = FeatureType.JUNGLE;
            return;
        }

        // Forest distribution
        if (moisture > 0.45 && fNoise > 0.45) {
            if (tile.terrain === TerrainType.GRASSLAND || tile.terrain === TerrainType.PLAINS || tile.terrain === TerrainType.HILLS) {
                tile.feature = FeatureType.FOREST;
            }
        }

        // Marsh in wet lowlands
        if (moisture > 0.75 && tile.elevation < 0.5 && fNoise > 0.65 && tile.terrain === TerrainType.GRASSLAND) {
            tile.feature = FeatureType.MARSH;
        }
    }

    // ====================================================================
    //  RESOURCES
    // ====================================================================

    addResources(tile) {
        if (tile.terrain.impassable) return;

        const rNoise = this.norm(this.fbm(tile.q * 0.1, tile.r * 0.1, 3, 2, 0.5, 5000, 5000));
        if (rNoise < 0.72) return;

        const rng = this.pseudoRandom(tile.q * 37 + tile.r * 53 + this.seed);
        const rng2 = this.pseudoRandom(tile.q * 71 + tile.r * 97 + this.seed * 3);

        // Strategic resources (terrain-dependent)
        if (tile.terrain === TerrainType.HILLS || tile.feature === FeatureType.FOREST) {
            if (rng < 0.12) { tile.resource = ResourceType.IRON; return; }
            if (rng < 0.20) { tile.resource = ResourceType.COAL; return; }
            if (rng < 0.25) { tile.resource = ResourceType.NITER; return; }
        }

        if (tile.terrain === TerrainType.GRASSLAND || tile.terrain === TerrainType.PLAINS) {
            if (rng < 0.10) { tile.resource = ResourceType.HORSES; return; }
            if (rng < 0.16) { tile.resource = ResourceType.WHEAT; return; }
            if (rng < 0.22) { tile.resource = ResourceType.CATTLE; return; }
            if (rng < 0.26) { tile.resource = ResourceType.SHEEP; return; }
        }

        if (tile.terrain === TerrainType.TUNDRA || tile.feature === FeatureType.FOREST) {
            if (rng < 0.08) { tile.resource = ResourceType.FURS; return; }
            if (rng < 0.14) { tile.resource = ResourceType.DEER; return; }
        }

        // Luxury resources
        if (tile.resource.name === 'None') {
            if (rng2 < 0.04) tile.resource = ResourceType.GOLD_RES;
            else if (rng2 < 0.08) tile.resource = ResourceType.GEMS;
            else if (rng2 < 0.11 && tile.feature === FeatureType.JUNGLE) tile.resource = ResourceType.SPICES;
            else if (rng2 < 0.14) tile.resource = ResourceType.SILK;
            else if (rng2 < 0.17 && tile.terrain === TerrainType.GRASSLAND) tile.resource = ResourceType.WINE;
            else if (rng2 < 0.19) tile.resource = ResourceType.IVORY;
            else if (rng2 < 0.21) tile.resource = ResourceType.INCENSE;
            else if (rng2 < 0.23 && tile.terrain === TerrainType.HILLS) tile.resource = ResourceType.MARBLE;
            else if (rng2 < 0.25 && tile.terrain === TerrainType.HILLS) tile.resource = ResourceType.STONE;
        }

        // Coastal
        if (tile.terrain === TerrainType.COAST && rng < 0.22) tile.resource = ResourceType.FISH;

        // Desert specials
        if (tile.terrain === TerrainType.DESERT) {
            if (rng < 0.08) tile.resource = ResourceType.OIL;
            else if (rng < 0.15) tile.resource = ResourceType.GOLD_RES;
        }
    }

    // ====================================================================
    //  RIVERS  –  D8 Flow Direction + Flow Accumulation
    // ====================================================================

    generateRivers() {
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];

        // Step 1: Compute steepest descent direction for all land
        const flowDir = new Map(); // tileKey -> neighborKey
        const potentialSources = [];

        for (const [key, tile] of this.tiles) {
            const tName = tile.terrain.name;
            if (tName === 'Ocean' || tName === 'Coast') continue;

            potentialSources.push(tile);

            const neighbors = this.getNeighbors(tile.q, tile.r);
            let lowestElev = tile.elevation;
            let lowestKey = null;

            for (const n of neighbors) {
                if (n.elevation < lowestElev) {
                    lowestElev = n.elevation;
                    lowestKey = `${n.q},${n.r}`;
                }
            }
            if (lowestKey) flowDir.set(key, lowestKey);
        }

        // Step 2: Pick 4 "Grand Sources" spread across the map
        potentialSources.sort((a, b) => b.elevation - a.elevation);
        const selectedSources = [];
        for (const tile of potentialSources) {
            if (selectedSources.length >= 4) break;

            // Check distance from existing sources to ensure variety
            const tooClose = selectedSources.some(s => this.getDistance(s.q, s.r, tile.q, tile.r) < 15);
            if (!tooClose) selectedSources.push(tile);
        }

        // Step 3: Trace the flow from source to sea
        this.riverPaths = [];
        for (const source of selectedSources) {
            let currentKey = `${source.q},${source.r}`;
            let flowValue = 40; // High initial flow for these grand rivers
            let safety = 0;
            const visited = new Set();
            const currentPath = [currentKey];

            while (currentKey && safety < 100) {
                visited.add(currentKey);
                safety++;

                const nextKey = flowDir.get(currentKey);
                if (!nextKey || visited.has(nextKey)) break;

                const tile = this.tiles.get(currentKey);
                const nextTile = this.tiles.get(nextKey);

                // Find direction index
                const [nq, nr] = nextKey.split(',').map(Number);
                const dirIndex = directions.findIndex(d =>
                    d.q === nq - tile.q && d.r === nr - tile.r
                );

                if (dirIndex !== -1) {
                    if (!tile.rivers.includes(dirIndex)) tile.rivers.push(dirIndex);
                    tile.riverFlow = Math.max(tile.riverFlow || 0, flowValue);

                    if (nextTile) {
                        const opposite = (dirIndex + 3) % 6;
                        if (!nextTile.rivers.includes(opposite)) nextTile.rivers.push(opposite);
                        nextTile.riverFlow = Math.max(nextTile.riverFlow || 0, flowValue);
                    }
                }

                currentPath.push(nextKey);
                if (nextTile && (nextTile.terrain.name === 'Ocean' || nextTile.terrain.name === 'Coast')) break;
                currentKey = nextKey;
                flowValue += 5; // Accumulate flow as it goes downhill
            }
            if (currentPath.length > 2) {
                this.riverPaths.push(currentPath);
            }
        }

        // Step 4: Add flood plains along desert rivers
        for (const tile of this.tiles.values()) {
            if (tile.terrain.name === 'Desert' && tile.rivers.length > 0 && tile.feature.name === 'None') {
                tile.feature = FeatureType.FLOOD_PLAINS;
            }
        }
    }

    // ====================================================================
    //  STARTING LOCATIONS
    // ====================================================================

    generateStartingLocations() {
        this.startLocations = [];
        const tiles = Array.from(this.tiles.values());
        const landTiles = tiles.filter(t =>
            !t.terrain.impassable &&
            t.terrain !== TerrainType.OCEAN &&
            t.terrain !== TerrainType.COAST &&
            t.terrain !== TerrainType.SNOW &&
            t.terrain !== TerrainType.MOUNTAIN &&
            (t.terrain === TerrainType.GRASSLAND || t.terrain === TerrainType.PLAINS)
        );

        const numStarts = 6;
        const minDist = Math.floor(Math.min(this.width, this.height) / 3.5);

        for (let i = 0; i < numStarts && landTiles.length > 0; i++) {
            let bestTile = null;
            let bestScore = -1;

            for (let attempt = 0; attempt < 80; attempt++) {
                const candidate = landTiles[Math.floor(this.pseudoRandom(i * 137 + attempt * 53 + this.seed) * landTiles.length)];
                if (!candidate) continue;

                const tooClose = this.startLocations.some(s =>
                    this.getDistance(s.q, s.r, candidate.q, candidate.r) < minDist
                );
                if (tooClose) continue;

                let score = 0;
                const neighbors = this.getNeighbors(candidate.q, candidate.r);
                for (const n of neighbors) {
                    const y = n.getYield();
                    score += y.food * 2.5 + y.production * 1.5 + y.gold;
                    if (n.rivers.length > 0) score += 4;
                    if (n.resource.name !== 'None') score += 2;
                    if (n.resource.type === 'luxury') score += 3;
                    if (n.resource.type === 'strategic') score += 2;
                    if (n.feature === FeatureType.FOREST) score += 1;
                }
                // Bonus for having diverse terrain nearby
                const terrainTypes = new Set(neighbors.map(n => n.terrain.name));
                score += terrainTypes.size * 2;

                if (score > bestScore) {
                    bestScore = score;
                    bestTile = candidate;
                }
            }

            if (bestTile) {
                this.startLocations.push(bestTile);
            }
        }
    }

    // ====================================================================
    //  UTILITY
    // ====================================================================

    pseudoRandom(seed) {
        const x = Math.sin(seed * 12345.6789) * 43758.5453;
        return x - Math.floor(x);
    }

    getTile(q, r) {
        return this.tiles.get(`${q},${r}`);
    }

    getTileByCoords(coords) {
        return this.tiles.get(coords);
    }

    getNeighbors(q, r) {
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];
        return directions
            .map(d => this.getTile(q + d.q, r + d.r))
            .filter(t => t !== undefined);
    }

    getDistance(q1, r1, q2, r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }

    // Convert hex to world position (for 3D renderer)
    hexToWorld(q, r) {
        return {
            x: this.hexSize * (3 / 2 * q),
            z: this.hexSize * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r)
        };
    }
}
