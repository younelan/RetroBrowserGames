// simulation.js
// Exports a processSimulation(game) function that advances game state

export function processSimulation(game) {
    // Advance Date
    game.date.month++;
    if (game.date.month >= 12) {
        game.date.month = 0;
        game.date.year++;
    }

    // Update Population and Growth
    let totalPop = 0;
    let parkCount = 0;
    for (let y = 0; y < game.gridSize; y++) {
        for (let x = 0; x < game.gridSize; x++) {
            const cell = game.grid[y][x];
            if (cell.type === 'none' || cell.type === 'road') continue;
            if (cell.type === 'park') {
                parkCount++;
                continue;
            }
            // Disasters: random fire or flood
            if (Math.random() < 0.0005) {
                if (cell.type !== 'road' && cell.type !== 'park') {
                    cell.disaster = (cell.terrain === 'water') ? 'flood' : 'fire';
                    cell.level = Math.max(0, cell.level - 2);
                    game.showNotification(`${cell.type.charAt(0).toUpperCase() + cell.type.slice(1)} hit by ${cell.disaster}!`, 'warning');
                }
            }
            // Remove disaster after a few ticks
            if (cell.disaster && Math.random() < 0.1) {
                cell.disaster = null;
            }
            const hasRoad = game.checkRoadAdjacency(x, y);
            // Growth logic
            if (hasRoad && !cell.disaster) {
                if (game.demand[cell.type] > 20 && cell.level < 5) {
                    cell.level += 0.1; // Slow growth
                    game.demand[cell.type] -= 2;
                }
            } else if (cell.level > 0) {
                cell.level -= 0.05; // Decay if no road or disaster
            }
            // Population effect: higher level = more pop
            if (cell.type === 'residential') totalPop += Math.floor(cell.level * (10 + cell.level * 5));
        }
    }
    // Parks increase happiness and residential demand
    game.happiness = Math.min(100, 50 + parkCount * 5);
    game.demand.residential = Math.min(100, game.demand.residential + parkCount * 2);
    const happyEl = document.getElementById('happiness-value');
    if (happyEl) happyEl.textContent = `${game.happiness}%`;

    game.population = totalPop;
    game.money += Math.floor(game.population * 0.5);
    if (isNaN(game.money)) game.money = 0;

    // Adjust demand
    game.demand.residential = Math.min(100, game.demand.residential + 5);
    game.demand.commercial = Math.min(100, game.demand.commercial + 2);
    game.demand.industrial = Math.min(100, game.demand.industrial + 1);

    game.updateStatsUI();
}
