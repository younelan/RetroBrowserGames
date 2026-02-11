export const BuildingType = {
    // Ancient
    GRANARY: { name: 'Granary', cost: 60, food: 2, description: '+2 Food', era: 'ancient', tech: 'POTTERY', maintenance: 1 },
    MONUMENT: { name: 'Monument', cost: 40, culture: 2, description: '+2 Culture', era: 'ancient', maintenance: 0 },
    SHRINE: { name: 'Shrine', cost: 40, faith: 1, happiness: 1, description: '+1 Faith, +1 Happiness', era: 'ancient', maintenance: 1 },
    WALLS: { name: 'Walls', cost: 80, defense: 5, description: '+5 City Defense, +50 HP', era: 'ancient', tech: 'MASONRY', maintenance: 0, cityHP: 50 },
    BARRACKS: { name: 'Barracks', cost: 75, xpBonus: 15, description: '+15 XP for new units', era: 'ancient', tech: 'BRONZE_WORKING', maintenance: 1 },

    // Classical
    LIBRARY: { name: 'Library', cost: 75, science: 0, sciencePerPop: 0.5, description: '+0.5 Science/pop', era: 'classical', tech: 'WRITING', maintenance: 1 },
    MARKET: { name: 'Market', cost: 100, gold: 2, goldPercent: 0.25, description: '+2 Gold, +25% Gold', era: 'classical', tech: 'CURRENCY', maintenance: 0 },
    COLOSSEUM: { name: 'Colosseum', cost: 100, happiness: 3, description: '+3 Happiness', era: 'classical', tech: 'CONSTRUCTION', maintenance: 1 },
    WATER_MILL: { name: 'Water Mill', cost: 75, food: 2, production: 1, description: '+2 Food, +1 Prod (requires river)', era: 'classical', tech: 'WHEEL', maintenance: 1, requiresRiver: true },
    AMPHITHEATER: { name: 'Amphitheater', cost: 100, culture: 3, description: '+3 Culture', era: 'classical', tech: 'DRAMA', maintenance: 1 },

    // Medieval
    CASTLE: { name: 'Castle', cost: 150, defense: 7, description: '+7 City Defense, +75 HP', era: 'medieval', tech: 'CHIVALRY', maintenance: 2, requires: 'WALLS', cityHP: 75 },
    UNIVERSITY: { name: 'University', cost: 160, science: 0, sciencePercent: 0.33, description: '+33% Science', era: 'medieval', tech: 'EDUCATION', maintenance: 2, requires: 'LIBRARY' },
    FORGE: { name: 'Forge', cost: 120, production: 2, description: '+2 Production, +15% Production', era: 'medieval', tech: 'METAL_CASTING', maintenance: 1, prodPercent: 0.15 },
    WORKSHOP: { name: 'Workshop', cost: 100, production: 2, description: '+2 Production', era: 'medieval', tech: 'METAL_CASTING', maintenance: 1 },
    MINT: { name: 'Mint', cost: 120, gold: 0, goldPerLuxury: 2, description: '+2 Gold per luxury resource', era: 'medieval', tech: 'CHIVALRY', maintenance: 1 },

    // Renaissance
    BANK: { name: 'Bank', cost: 200, gold: 0, goldPercent: 0.25, description: '+25% Gold', era: 'renaissance', tech: 'BANKING', maintenance: 2, requires: 'MARKET' },
    OBSERVATORY: { name: 'Observatory', cost: 180, science: 0, sciencePercent: 0.50, description: '+50% Science (requires mountain)', era: 'renaissance', tech: 'ASTRONOMY', maintenance: 2, requiresMountain: true },
    THEATER: { name: 'Theater', cost: 200, culture: 4, happiness: 2, description: '+4 Culture, +2 Happiness', era: 'renaissance', tech: 'PRINTING_PRESS', maintenance: 2 },
    ARMORY: { name: 'Armory', cost: 150, xpBonus: 15, description: '+15 more XP for new units', era: 'renaissance', tech: 'GUNPOWDER', maintenance: 1, requires: 'BARRACKS' },

    // Industrial
    FACTORY: { name: 'Factory', cost: 300, production: 0, prodPercent: 0.50, description: '+50% Production', era: 'industrial', tech: 'INDUSTRIALIZATION', maintenance: 3, requires: 'WORKSHOP' },
    PUBLIC_SCHOOL: { name: 'Public School', cost: 250, science: 0, sciencePerPop: 1, description: '+1 Science/pop', era: 'industrial', tech: 'SCIENTIFIC_THEORY', maintenance: 2, requires: 'UNIVERSITY' },
    HOSPITAL: { name: 'Hospital', cost: 300, food: 0, foodPercent: 0.50, description: '+50% Food surplus', era: 'industrial', tech: 'BIOLOGY', maintenance: 2 },
    MILITARY_ACADEMY: { name: 'Military Academy', cost: 250, xpBonus: 15, description: '+15 more XP for new units', era: 'industrial', tech: 'MILITARY_SCIENCE', maintenance: 2, requires: 'ARMORY' },
    ZOO: { name: 'Zoo', cost: 200, happiness: 3, description: '+3 Happiness', era: 'industrial', tech: 'BIOLOGY', maintenance: 2 }
};

export const WonderType = {
    // Ancient
    PYRAMIDS: { name: 'Pyramids', cost: 185, description: '+25% worker improvement speed', era: 'ancient', tech: 'MASONRY', workerBonus: 0.25 },
    STONEHENGE: { name: 'Stonehenge', cost: 185, happiness: 5, culture: 5, description: '+5 Happiness, +5 Culture', era: 'ancient' },
    GREAT_LIBRARY: { name: 'Great Library', cost: 250, science: 3, description: 'Free tech + Library + 3 Science', era: 'ancient', tech: 'WRITING', freeTech: true, freeBuilding: 'LIBRARY' },
    HANGING_GARDENS: { name: 'Hanging Gardens', cost: 250, food: 6, description: '+6 Food in city', era: 'ancient', tech: 'MATHEMATICS' },

    // Classical
    COLOSSUS: { name: 'Colossus', cost: 250, gold: 5, description: '+5 Gold, +1 trade route', era: 'classical', tech: 'IRON_WORKING' },
    ORACLE: { name: 'Oracle', cost: 250, culture: 3, description: '+3 Culture, free policy', era: 'classical', tech: 'CONSTRUCTION', freePolicy: true },
    PETRA: { name: 'Petra', cost: 250, production: 2, food: 2, gold: 2, description: '+2 Food/Prod/Gold on desert tiles', era: 'classical', tech: 'CURRENCY', requiresDesert: true },

    // Medieval
    NOTRE_DAME: { name: 'Notre Dame', cost: 400, happiness: 10, culture: 4, description: '+10 Happiness, +4 Culture', era: 'medieval', tech: 'EDUCATION' },
    CHICHEN_ITZA: { name: 'Chichen Itza', cost: 400, happiness: 4, description: '+4 Happiness, +50% Golden Age duration', era: 'medieval', tech: 'CIVIL_SERVICE', goldenAgeBonus: 0.5 },
    MACHU_PICCHU: { name: 'Machu Picchu', cost: 400, gold: 5, description: '+5 Gold, +25% trade route income', era: 'medieval', tech: 'ENGINEERING', requiresMountain: true },

    // Renaissance
    SISTINE_CHAPEL: { name: 'Sistine Chapel', cost: 500, culture: 0, culturePercent: 0.25, description: '+25% Culture in all cities', era: 'renaissance', tech: 'ARCHITECTURE' },
    FORBIDDEN_PALACE: { name: 'Forbidden Palace', cost: 500, happiness: 0, unhappinessReduction: 0.10, description: '-10% Unhappiness from population', era: 'renaissance', tech: 'BANKING' },
    TAJ_MAHAL: { name: 'Taj Mahal', cost: 500, description: 'Triggers Golden Age', era: 'renaissance', tech: 'ARCHITECTURE', triggersGoldenAge: true },

    // Industrial
    BIG_BEN: { name: 'Big Ben', cost: 625, description: '-15% purchase cost in all cities', era: 'industrial', tech: 'INDUSTRIALIZATION', purchaseDiscount: 0.15 },
    STATUE_OF_LIBERTY: { name: 'Statue of Liberty', cost: 625, production: 0, prodPercent: 0.15, description: '+15% Production in all cities', era: 'industrial', tech: 'REPLACEABLE_PARTS' },
    EIFFEL_TOWER: { name: 'Eiffel Tower', cost: 625, happiness: 5, description: '+5 Happiness, +12 Tourism', era: 'industrial', tech: 'RADIO', tourism: 12 }
};

export class City {
    constructor(name, q, r, owner) {
        this.name = name;
        this.q = q;
        this.r = r;
        this.owner = owner;
        this.isCity = true;

        this.population = 1;
        this.food = 0;
        this.productionStored = 0;

        this.buildings = new Set();
        this.productionQueue = [];

        this.territory = new Set();
        this.cultureStored = 0;
        this.cultureNeeded = 15;
        this.territoryRadius = 1;

        this.cityHP = 200;
        this.maxCityHP = 200;
        this.cityStrength = 8;

        this.tradeRoutes = [];
        this.specialists = { scientist: 0, merchant: 0, engineer: 0, artist: 0 };
        this.greatPersonPoints = { general: 0, scientist: 0, merchant: 0, engineer: 0 };

        this.isCapital = owner.cities.length === 0;

        this.addInitialTerritory();
        owner.cities.push(this);
    }

    addInitialTerritory() {
        this.territory.add(`${this.q},${this.r}`);
        if (window.game) {
            const neighbors = window.game.worldMap.getNeighbors(this.q, this.r);
            neighbors.forEach(n => {
                if (!n.owner || n.owner === this.owner) {
                    n.owner = this.owner;
                    this.territory.add(`${n.q},${n.r}`);
                }
            });
        }
    }

    calculateYields() {
        let yields = {
            gold: 2,
            science: this.population * 1,
            production: 2,
            food: 2,
            culture: 1,
            happiness: 0
        };

        // Territory yields
        this.territory.forEach(key => {
            const tile = window.game?.worldMap?.tiles?.get(key);
            if (tile) {
                const tileYield = tile.getYield();
                yields.gold += tileYield.gold;
                yields.science += tileYield.science;
                yields.production += tileYield.production;
                yields.food += tileYield.food;
            }
        });

        // Building bonuses
        let goldPercent = 0, sciencePercent = 0, prodPercent = 0, foodPercent = 0;
        this.buildings.forEach(bId => {
            const b = BuildingType[bId] || WonderType[bId];
            if (!b) return;
            if (b.gold) yields.gold += b.gold;
            if (b.science) yields.science += b.science;
            if (b.food) yields.food += b.food;
            if (b.production) yields.production += b.production;
            if (b.culture) yields.culture += b.culture;
            if (b.happiness) yields.happiness += b.happiness;
            if (b.goldPercent) goldPercent += b.goldPercent;
            if (b.sciencePercent) sciencePercent += b.sciencePercent;
            if (b.prodPercent) prodPercent += b.prodPercent;
            if (b.foodPercent) foodPercent += b.foodPercent;
            if (b.sciencePerPop) yields.science += b.sciencePerPop * this.population;
            if (b.goldPerLuxury) yields.gold += b.goldPerLuxury * (this.owner?.luxuryResources?.size || 0);
        });

        // Apply percentage bonuses
        yields.gold *= (1 + goldPercent);
        yields.science *= (1 + sciencePercent);
        yields.production *= (1 + prodPercent);

        // Specialist yields
        yields.science += this.specialists.scientist * 3;
        yields.gold += this.specialists.merchant * 3;
        yields.production += this.specialists.engineer * 2;
        yields.culture += this.specialists.artist * 3;

        // Happiness penalty
        const happiness = this.owner?.happiness || 0;
        if (happiness < 0) {
            const penalty = happiness < -10 ? 0.25 : 0.5;
            yields.food *= penalty;
            yields.production *= (happiness < -10 ? 0.5 : 0.75);
            yields.gold *= (happiness < -10 ? 0.5 : 0.75);
        } else if (this.owner?.goldenAge) {
            yields.gold += 1;
            yields.production += 1;
        }

        // Food surplus after penalty
        if (foodPercent > 0) {
            const surplus = yields.food - (this.population * 2);
            if (surplus > 0) yields.food += surplus * foodPercent;
        }

        // Trade route gold
        this.tradeRoutes.forEach(() => {
            yields.gold += 3;
        });

        return yields;
    }

    getMaintenance() {
        let cost = 0;
        this.buildings.forEach(bId => {
            const b = BuildingType[bId] || WonderType[bId];
            if (b?.maintenance) cost += b.maintenance;
        });
        return cost;
    }

    getCityDefense() {
        let defense = this.cityStrength + (this.population * 0.5);
        this.buildings.forEach(bId => {
            const b = BuildingType[bId] || WonderType[bId];
            if (b?.defense) defense += b.defense;
        });
        return defense;
    }

    update() {
        const yields = this.calculateYields();

        // Production
        if (this.productionQueue.length > 0) {
            const currentItem = this.productionQueue[0];
            if (currentItem.name === 'Wealth') {
                this.owner.gold += yields.production * 0.25;
            } else if (currentItem.name === 'Research') {
                this.owner.researchProgress += yields.production * 0.25;
            } else {
                this.productionStored += yields.production;
                if (this.productionStored >= currentItem.cost) {
                    this.completeProduction(currentItem);
                }
            }
        }

        // Growth
        const foodConsumed = this.population * 2;
        const foodSurplus = yields.food - foodConsumed;
        this.food += foodSurplus;

        const foodNeeded = 15 + Math.pow(this.population, 1.8);
        if (this.food >= foodNeeded) {
            this.population++;
            this.food -= foodNeeded;
            this.owner?.updateDiscovery(this.q, this.r, 2 + Math.floor(this.population / 3));
            window.game?.ui?.notify(`${this.name} grows to ${this.population}!`);
        } else if (this.food < 0 && this.population > 1) {
            this.population--;
            this.food = 0;
            window.game?.ui?.notify(`Starvation in ${this.name}!`);
        }

        // Culture / Border expansion
        this.cultureStored += yields.culture;
        if (this.cultureStored >= this.cultureNeeded) {
            this.expandTerritory();
            this.cultureStored -= this.cultureNeeded;
            this.cultureNeeded = Math.floor(this.cultureNeeded * 1.5);
            this.territoryRadius = Math.min(4, this.territoryRadius + 1);
        }

        // Great Person points
        this.greatPersonPoints.scientist += this.specialists.scientist * 3 + (this.buildings.has('LIBRARY') ? 1 : 0) + (this.buildings.has('UNIVERSITY') ? 2 : 0);
        this.greatPersonPoints.merchant += this.specialists.merchant * 3 + (this.buildings.has('MARKET') ? 1 : 0) + (this.buildings.has('BANK') ? 2 : 0);
        this.greatPersonPoints.engineer += this.specialists.engineer * 3 + (this.buildings.has('FORGE') ? 1 : 0) + (this.buildings.has('FACTORY') ? 2 : 0);
        this.greatPersonPoints.general += this.buildings.has('BARRACKS') ? 1 : 0;

        // City HP regen
        if (this.cityHP < this.maxCityHP) {
            this.cityHP = Math.min(this.maxCityHP, this.cityHP + 10);
        }

        // Maintenance
        this.owner.gold -= this.getMaintenance();
    }

    expandTerritory() {
        if (!window.game) return;
        const map = window.game.worldMap;
        const radius = this.territoryRadius + 1;

        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
                const tq = this.q + dq;
                const tr = this.r + dr;
                const tile = map.getTile(tq, tr);
                if (tile && !tile.owner && !tile.terrain.impassable) {
                    const key = `${tq},${tr}`;
                    tile.owner = this.owner;
                    this.territory.add(key);
                }
            }
        }
    }

    completeProduction(item) {
        this.productionQueue.shift();
        this.productionStored = 0;

        if (item.category || item.icon) {
            // It's a Unit
            const unit = window.game?.spawnUnit(item, this.q, this.r, this.owner);

            // XP bonus from buildings
            if (unit) {
                let bonusXP = 0;
                if (this.buildings.has('BARRACKS')) bonusXP += 15;
                if (this.buildings.has('ARMORY')) bonusXP += 15;
                if (this.buildings.has('MILITARY_ACADEMY')) bonusXP += 15;
                unit.experience = bonusXP;
            }

            window.game?.ui?.notify(`${item.name} trained in ${this.name}!`);
        } else {
            // Building or Wonder
            const bId = Object.keys(BuildingType).find(key => BuildingType[key] === item) ||
                Object.keys(WonderType).find(key => WonderType[key] === item);

            if (bId) {
                this.buildings.add(bId);

                if (BuildingType[bId]?.cityHP) {
                    this.maxCityHP += BuildingType[bId].cityHP;
                    this.cityHP += BuildingType[bId].cityHP;
                }

                if (WonderType[bId]) {
                    window.game.wondersBuilt.add(bId);
                    window.game?.ui?.notify(`WONDER COMPLETED: ${item.name}!`);

                    // Wonder special effects
                    if (WonderType[bId].freeTech) {
                        const available = window.game.techTree.getAvailableTechs(this.owner.unlockedTechs);
                        if (available.length > 0) {
                            this.owner.unlockedTechs.add(available[0].id);
                            window.game?.ui?.notify(`Free tech: ${available[0].name}!`);
                        }
                    }
                    if (WonderType[bId].freeBuilding) {
                        this.buildings.add(WonderType[bId].freeBuilding);
                    }
                    if (WonderType[bId].triggersGoldenAge) {
                        this.owner.startGoldenAge();
                    }
                } else {
                    window.game?.ui?.notify(`${item.name} completed in ${this.name}`);
                }
            }
        }
    }

    purchaseItem(item) {
        let cost = item.cost * 2;
        // Apply purchase discounts from wonders
        if (window.game) {
            for (const wId of window.game.wondersBuilt) {
                const w = WonderType[wId];
                if (w?.purchaseDiscount && this.owner.cities.some(c => c.buildings.has(wId))) {
                    cost *= (1 - w.purchaseDiscount);
                }
            }
        }
        cost = Math.floor(cost);
        if (this.owner.gold >= cost) {
            this.owner.gold -= cost;
            this.productionQueue.unshift(item);
            this.productionStored = item.cost;
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

    canBuild(buildingId) {
        if (this.buildings.has(buildingId)) return false;
        const b = BuildingType[buildingId];
        if (!b) return false;
        if (b.requires && !this.buildings.has(b.requires)) return false;
        if (b.tech && !this.owner.unlockedTechs.has(b.tech)) return false;
        if (b.requiresRiver) {
            const tile = window.game?.worldMap?.getTile(this.q, this.r);
            if (!tile || tile.rivers.length === 0) return false;
        }
        if (b.requiresMountain) {
            const neighbors = window.game?.worldMap?.getNeighbors(this.q, this.r) || [];
            if (!neighbors.some(n => n.terrain.name === 'Mountain')) return false;
        }
        return true;
    }
}
