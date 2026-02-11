export class Pathfinding {
    static getReachableTiles(startTile, worldMap, movementPoints, unit = null) {
        const reachable = new Map();
        const queue = [{ tile: startTile, cost: 0 }];

        reachable.set(`${startTile.q},${startTile.r}`, 0);

        while (queue.length > 0) {
            // Sort by cost for better pathfinding (priority queue behavior)
            queue.sort((a, b) => a.cost - b.cost);
            const { tile, cost } = queue.shift();

            const neighbors = worldMap.getNeighbors(tile.q, tile.r);
            for (const neighbor of neighbors) {
                // Naval units skip impassable land, land units skip impassable water
                if (unit && unit.type.naval) {
                    if (!neighbor.terrain.water) continue;
                    if (neighbor.terrain.deepWater && !unit.type.oceanCapable) continue;
                } else if (neighbor.terrain.impassable && !neighbor.terrain.water) {
                    continue;
                }

                // Calculate terrain-aware movement cost
                let moveCost = neighbor.getMoveCost ? neighbor.getMoveCost(unit) : 1;

                // Minimum of 0.5 for roads
                moveCost = Math.max(0.5, moveCost);

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

    // A* pathfinding for movement path visualization
    static findPath(startTile, endTile, worldMap, unit = null) {
        if (!startTile || !endTile) return [];

        const openSet = [startTile];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${startTile.q},${startTile.r}`;
        const endKey = `${endTile.q},${endTile.r}`;

        gScore.set(startKey, 0);
        fScore.set(startKey, worldMap.getDistance(startTile.q, startTile.r, endTile.q, endTile.r));

        while (openSet.length > 0) {
            // Find node with lowest fScore
            openSet.sort((a, b) =>
                (fScore.get(`${a.q},${a.r}`) || Infinity) - (fScore.get(`${b.q},${b.r}`) || Infinity)
            );
            const current = openSet.shift();
            const currentKey = `${current.q},${current.r}`;

            if (currentKey === endKey) {
                return this.reconstructPath(cameFrom, current);
            }

            const neighbors = worldMap.getNeighbors(current.q, current.r);
            for (const neighbor of neighbors) {
                if (unit && unit.type.naval) {
                    if (!neighbor.terrain.water) continue;
                    if (neighbor.terrain.deepWater && !unit.type.oceanCapable) continue;
                } else if (neighbor.terrain.impassable && !neighbor.terrain.water) {
                    continue;
                }

                const neighborKey = `${neighbor.q},${neighbor.r}`;
                const moveCost = neighbor.getMoveCost ? neighbor.getMoveCost(unit) : 1;
                const tentativeG = (gScore.get(currentKey) || Infinity) + moveCost;

                if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + worldMap.getDistance(neighbor.q, neighbor.r, endTile.q, endTile.r));

                    if (!openSet.some(n => `${n.q},${n.r}` === neighborKey)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return []; // No path found
    }

    static reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.q},${current.r}`;
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            currentKey = `${current.q},${current.r}`;
            path.unshift(current);
        }
        return path;
    }
}
