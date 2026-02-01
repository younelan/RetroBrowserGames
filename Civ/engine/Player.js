export class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;

        this.gold = 10;
        this.science = 0;
        this.happiness = 10;
        this.strategicResources = {
            IRON: 0,
            HORSES: 0
        };
        this.luxuryResources = new Set(); // Unique luxuries provide +4 happiness each

        this.cities = [];
        this.units = [];
        this.metPlayers = new Set(); // IDs of players met

        this.discoveredTiles = new Set();
        this.visibleTiles = new Set();

        this.currentTech = null;
        this.researchProgress = 0;
        this.unlockedTechs = new Set();

        this.cityNames = ['Babylon', 'Nineveh', 'Ashur', 'Mari', 'Uruk', 'Eridu', 'Larsa', 'Kish'];
        this.cityCounter = 0;
    }

    getNextCityName() {
        const name = this.cityNames[this.cityCounter % this.cityNames.length];
        this.cityCounter++;
        return name;
    }

    updateYields() {
        let totalGold = 0;
        let totalScience = 0;
        let baseHappiness = 10 - (this.cities.length * 3); // -3 per city
        let populationPenalty = 0;

        // Reset strategic resources
        this.strategicResources.IRON = 0;
        this.strategicResources.HORSES = 0;
        this.luxuryResources.clear();

        for (const city of this.cities) {
            const yields = city.calculateYields();
            totalGold += yields.gold;
            totalScience += yields.science;
            populationPenalty += city.population;

            // Check for resources in city radius
            city.territory.forEach(tileCoords => {
                const tile = window.game.worldMap.getTileByCoords(tileCoords);
                if (tile && tile.improvement && tile.owner === this) {
                    if (tile.resource.type === 'strategic') {
                        this.strategicResources[tile.resource.name.toUpperCase()] += tile.improvement.prod;
                    } else if (tile.resource.type === 'luxury') {
                        this.luxuryResources.add(tile.resource.name);
                    }
                }
            });
        }

        this.gold += totalGold;
        this.science += totalScience;
        this.happiness = baseHappiness - populationPenalty + (this.luxuryResources.size * 4);

        if (this.currentTech) {
            this.researchProgress += totalScience;
            if (this.researchProgress >= this.currentTech.cost) {
                this.completeResearch();
            }
        }
    }

    completeResearch() {
        if (!this.currentTech) return;
        this.unlockedTechs.add(this.currentTech.id);
        const name = this.currentTech.name;
        window.game.ui.notify(`Discovered ${name}!`);
        this.researchProgress = 0;
        this.currentTech = null;

        // Auto-select next if none
        window.game.autoAssignResearch(this);
    }

    updateDiscovery(q, r, radius = 2) {
        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
                this.discoveredTiles.add(`${q + dq},${r + dr}`);
            }
        }
    }
}
