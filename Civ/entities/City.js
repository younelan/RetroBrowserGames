export const BuildingType = {
    GRANARY: { name: 'Granary', cost: 60, food: 2, description: '+2 Food' },
    LIBRARY: { name: 'Library', cost: 75, science: 3, description: '+3 Science' },
    MONUMENT: { name: 'Monument', cost: 40, culture: 2, description: '+2 Culture' },
    WALLS: { name: 'Walls', cost: 80, defense: 5, description: '+5 City Defense' },
    MARKET: { name: 'Market', cost: 100, gold: 4, description: '+4 Gold' }
};

export const WonderType = {
    PYRAMIDS: { name: 'Pyramids', cost: 180, production: 5, description: 'Ancient Wonder: +5 Production' },
    STONEHENGE: { name: 'Stonehenge', cost: 180, happiness: 10, description: 'Ancient Wonder: +10 Happiness' },
    GREAT_LIBRARY: { name: 'Great Library', cost: 250, science: 10, description: 'Classical Wonder: +10 Science' }
};

export class City {
    constructor(name, q, r, owner) {
        this.name = name;
        this.q = q;
        this.r = r;
        this.owner = owner;

        this.population = 1;
        this.food = 0;
        this.productionStored = 0;

        this.buildings = new Set();
        this.productionQueue = []; // Array of types (UnitType or BuildingType)

        this.territory = new Set();
        this.addInitialTerritory();

        owner.cities.push(this);
    }

    addInitialTerritory() {
        this.territory.add(`${this.q},${this.r}`);
        // Neighbors are handled by the game manager to ensure they exist on map
    }

    calculateYields() {
        let yields = {
            gold: 2,
            science: this.population * 1.5,
            production: 2,
            food: 2
        };

        // Add yields from territory tiles
        this.territory.forEach(key => {
            const tile = window.game.worldMap.tiles.get(key);
            if (tile) {
                const tileYield = tile.getYield();
                yields.gold += tileYield.gold;
                yields.science += tileYield.science;
                yields.production += tileYield.production;
                yields.food += tileYield.food;
            }
        });

        // Building bonuses
        this.buildings.forEach(bId => {
            const b = BuildingType[bId] || WonderType[bId];
            if (b.gold) yields.gold += b.gold;
            if (b.science) yields.science += b.science;
            if (b.food) yields.food += b.food;
            if (b.production) yields.production += b.production;
            // Happiness is handled globally in Player.updateYields for wonders
        });

        // Apply Happiness Modifiers
        const happiness = this.owner.happiness;
        if (happiness < 0) {
            // Unhappy
            yields.food *= (happiness < -10 ? 0.25 : 0.5); // Growth penalty
            yields.production *= (happiness < -10 ? 0.5 : 0.75); // Prod penalty
            yields.gold *= (happiness < -10 ? 0.5 : 0.75); // Gold penalty
        } else if (happiness >= 15) {
            // Golden Age feel (optional, maybe just bonus growth)
            yields.food *= 1.2;
        }

        return yields;
    }

    update() {
        const yields = this.calculateYields();

        // Handle Production
        if (this.productionQueue.length > 0) {
            const currentItem = this.productionQueue[0];

            // Special Focus projects
            if (currentItem.name === 'Wealth') {
                this.owner.gold += yields.production * 0.25;
            } else if (currentItem.name === 'Research') {
                this.owner.science += yields.production * 0.25;
            } else {
                this.productionStored += yields.production;
                if (this.productionStored >= currentItem.cost) {
                    this.completeProduction(currentItem);
                }
            }
        }

        // Handle Growth
        this.food += yields.food;
        const foodNeeded = 15 + Math.pow(this.population, 1.8);
        if (this.food >= foodNeeded) {
            this.population++;
            this.food -= foodNeeded;
            this.owner.updateDiscovery(this.q, this.r, 2 + Math.floor(this.population / 2));
            this.expandTerritory();
        }
    }

    expandTerritory() {
        const neighbors = window.game.worldMap.getNeighbors(this.q, this.r);
        neighbors.forEach(n => {
            const key = `${n.q},${n.r}`;
            if (!n.owner) {
                n.owner = this.owner;
                this.territory.add(key);
            }
        });
    }

    completeProduction(item) {
        this.productionQueue.shift();
        this.productionStored = 0;

        if (item.icon) { // It's a Unit
            window.game.spawnUnit(item, this.q, this.r, this.owner);
            window.game.ui.notify(`${item.name} trained in ${this.name}`);
        } else { // It's a Building or Wonder
            const bId = Object.keys(BuildingType).find(key => BuildingType[key] === item) ||
                Object.keys(WonderType).find(key => WonderType[key] === item);
            this.buildings.add(bId);
            if (WonderType[bId]) {
                window.game.wondersBuilt.add(bId);
                window.game.ui.notify(`GLOBAL WONDER COMPLETED: ${item.name}!`, 'success');
            } else {
                window.game.ui.notify(`${item.name} completed in ${this.name}`);
            }
        }
    }

    purchaseItem(item) {
        if (this.owner.gold >= item.cost * 2) { // Rush cost is 2x
            this.owner.gold -= item.cost * 2;
            this.completeProduction(item);
            return true;
        }
        return false;
    }

    addToQueue(item) {
        this.productionQueue.push(item);
    }

    rename(newName) {
        if (newName && newName.trim()) {
            this.name = newName.trim();
        }
    }
}
