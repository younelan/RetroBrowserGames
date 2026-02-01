import { HexTile, TerrainType, FeatureType, ResourceType } from './Tile.js';

export class WorldMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Map();
        this.generate();
    }

    generate() {
        // Simple Simplex/Perlin-like noise implementation for better seed-based worlds
        const seed = Math.random();

        for (let r = 0; r < this.height; r++) {
            let r_offset = Math.floor(r / 2);
            for (let q = -r_offset; q < this.width - r_offset; q++) {
                // Determine terrain based on Y (latitudinal) and random noise
                const noise = this.getNoise(q, r, 0.1, seed);
                const latitude = Math.abs(r - this.height / 2) / (this.height / 2);

                let terrain = TerrainType.GRASSLAND;

                if (noise < 0.3) {
                    terrain = (noise < 0.25) ? TerrainType.OCEAN : TerrainType.COAST;
                } else if (latitude > 0.8) {
                    terrain = (latitude > 0.9) ? TerrainType.SNOW : TerrainType.TUNDRA;
                } else if (latitude < 0.2 && noise > 0.6) {
                    terrain = TerrainType.DESERT;
                } else if (noise > 0.75) {
                    terrain = TerrainType.MOUNTAIN;
                } else if (noise > 0.55) {
                    terrain = TerrainType.PLAINS;
                }

                const tile = new HexTile(q, r, terrain);

                // Add Features (Forests, Jungles)
                if (!terrain.impassable && terrain !== TerrainType.OCEAN && terrain !== TerrainType.COAST) {
                    const featureNoise = this.getNoise(q, r, 0.2, seed + 1);
                    if (terrain === TerrainType.GRASSLAND && latitude < 0.4 && featureNoise > 0.6) {
                        tile.feature = FeatureType.JUNGLE;
                    } else if (featureNoise > 0.65) {
                        tile.feature = FeatureType.FOREST;
                    } else if (terrain === TerrainType.DESERT && featureNoise > 0.8) {
                        tile.feature = FeatureType.MARSH; // Some oasis/marsh
                    }
                }

                // Add Resources with higher probability in clusters
                const resourceNoise = this.getNoise(q, r, 0.4, seed + 2);
                if (!terrain.impassable && resourceNoise > 0.8) {
                    const rando = Math.random();
                    if (rando < 0.3) tile.resource = ResourceType.IRON;
                    else if (rando < 0.6) tile.resource = ResourceType.WHEAT;
                    else if (rando < 0.8) tile.resource = ResourceType.HORSES;
                    else tile.resource = ResourceType.GOLD;
                }

                // Add Tribal Villages (Goody Huts)
                if (!terrain.impassable && !terrain.name.includes('Ocean') && Math.random() < 0.02) {
                    tile.village = true;
                }

                this.tiles.set(`${q},${r}`, tile);
            }
        }

        this.generateRivers();
    }

    generateRivers() {
        const directions = [
            { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 },
            { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }
        ];

        // Fewer starting points for longer, more significant rivers
        const tiles = Array.from(this.tiles.values());
        const startPoints = tiles.filter(t => t.terrain === TerrainType.MOUNTAIN);

        startPoints.forEach(startTile => {
            if (Math.random() > 0.15) return; // Rare river starts

            let current = startTile;
            let riverLength = 0;
            const maxLen = 30; // Longer rivers
            const visited = new Set();

            while (riverLength < maxLen) {
                visited.add(`${current.q},${current.r}`);
                const neighbors = this.getNeighbors(current.q, current.r);

                // Prioritize movement towards lower noise (simulating downhill flow)
                let possible = neighbors.filter(n => !visited.has(`${n.q},${n.r}`));
                if (possible.length === 0) break;

                // Sort by noise to find downhill path
                possible.sort((a, b) => this.getNoise(a.q, a.r, 0.1, 0) - this.getNoise(b.q, b.r, 0.1, 0));
                let next = possible[0];

                if (next.terrain === TerrainType.OCEAN) {
                    const dirIndex = directions.findIndex(d => d.q === next.q - current.q && d.r === next.r - current.r);
                    if (dirIndex !== -1) current.rivers.push(dirIndex);
                    break;
                }

                const dirIndex = directions.findIndex(d => d.q === next.q - current.q && d.r === next.r - current.r);
                if (dirIndex !== -1) {
                    current.rivers.push(dirIndex);
                    const opposite = (dirIndex + 3) % 6;
                    next.rivers.push(opposite);
                }

                current = next;
                riverLength++;
            }
        });
    }

    getNoise(q, r, scale, seed) {
        // Fake noise function for variety
        return (Math.sin(q * scale + seed) * 0.5 + Math.cos(r * scale + seed) * 0.5 + 1) / 2;
    }

    getTile(q, r) {
        return this.tiles.get(`${q},${r}`);
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
}
