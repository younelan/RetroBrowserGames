export class Pathfinding {
    static getReachableTiles(startTile, worldMap, movementPoints) {
        const reachable = new Map(); // Key: Tile, Value: Cost
        const queue = [{ tile: startTile, cost: 0 }];

        reachable.set(`${startTile.q},${startTile.r}`, 0);

        while (queue.length > 0) {
            const { tile, cost } = queue.shift();

            const neighbors = worldMap.getNeighbors(tile.q, tile.r);
            for (const neighbor of neighbors) {
                if (neighbor.terrain.impassable) continue;

                const moveCost = 1; // Basic cost, could be 2 for forests etc.
                const newCost = cost + moveCost;

                if (newCost <= movementPoints) {
                    const key = `${neighbor.q},${neighbor.r}`;
                    if (!reachable.has(key) || newCost < reachable.get(key)) {
                        reachable.set(key, newCost);
                        queue.push({ tile: neighbor, cost: newCost });
                    }
                }
            }
        }

        return reachable;
    }
}
