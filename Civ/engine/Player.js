import { GovernmentSystem } from '../systems/Government.js';

export class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;

        this.gold = 20;
        this.science = 0;
        this.happiness = 10;
        this.culture = 0;
        this.totalCulture = 0;

        this.strategicResources = {
            IRON: 0,
            HORSES: 0,
            COAL: 0,
            OIL: 0,
            NITER: 0
        };
        this.luxuryResources = new Set();

        this.cities = [];
        this.units = [];
        this.metPlayers = new Set();

        this.discoveredTiles = new Set();
        this.visibleTiles = new Set();

        this.currentTech = null;
        this.researchProgress = 0;
        this.unlockedTechs = new Set();

        // Government
        this.government = new GovernmentSystem(this);

        // Golden Age
        this.goldenAge = false;
        this.goldenAgeTurns = 0;
        this.goldenAgeProgress = 0;
        this.goldenAgeThreshold = 100;

        // Great Person tracking
        this.greatGeneralPoints = 0;
        this.greatPersonThreshold = { general: 100, scientist: 100, merchant: 100, engineer: 100 };

        // Score
        this.totalScore = 0;

        // City names per civilization
        this.cityNameSets = {
            'Player One': ['Babylon', 'Nineveh', 'Ashur', 'Mari', 'Uruk', 'Eridu', 'Larsa', 'Kish', 'Sippar', 'Akkad'],
            'Roman Empire': ['Rome', 'Antium', 'Cumae', 'Ravenna', 'Puteoli', 'Arretium', 'Mediolanum', 'Pisae', 'Neapolis', 'Pompeii'],
            'Egyptian Empire': ['Thebes', 'Memphis', 'Heliopolis', 'Alexandria', 'Pi-Ramesses', 'Giza', 'Elephantine', 'Abydos', 'Akhetaten', 'Edfu'],
            'Greek Empire': ['Athens', 'Sparta', 'Corinth', 'Argos', 'Knossos', 'Mycenae', 'Thebes', 'Ephesus', 'Halicarnassus', 'Rhodes'],
            'Chinese Empire': ['Beijing', 'Shanghai', 'Guangzhou', 'Nanjing', 'Xian', 'Hangzhou', 'Chengdu', 'Luoyang', 'Kaifeng', 'Suzhou'],
            'Persian Empire': ['Persepolis', 'Pasargadae', 'Susa', 'Ecbatana', 'Tus', 'Ctesiphon', 'Balkh', 'Merv', 'Herat', 'Isfahan']
        };
        this.cityNames = this.cityNameSets[name] || this.cityNameSets['Player One'];
        this.cityCounter = 0;

        // Era tracking
        this.currentEra = 'ancient';
    }

    getNextCityName() {
        const name = this.cityNames[this.cityCounter % this.cityNames.length];
        this.cityCounter++;
        return name;
    }

    updateYields() {
        let totalGold = 0;
        let totalScience = 0;
        let totalCulture = 0;
        let baseHappiness = 9 + (this.government.currentGovernment.bonuses?.happiness || 0);
        let populationPenalty = 0;
        let cityPenalty = this.cities.length * 3;

        // Reset strategic resources
        Object.keys(this.strategicResources).forEach(k => this.strategicResources[k] = 0);
        this.luxuryResources.clear();

        for (const city of this.cities) {
            const yields = city.calculateYields();
            totalGold += yields.gold;
            totalScience += yields.science;
            totalCulture += yields.culture;
            baseHappiness += yields.happiness;
            populationPenalty += city.population;

            // Resources from improved tiles in city territory
            city.territory.forEach(tileCoords => {
                const tile = window.game?.worldMap?.getTileByCoords(tileCoords);
                if (tile && tile.improvement && tile.owner === this) {
                    if (tile.resource.type === 'strategic') {
                        const resKey = Object.keys(this.strategicResources).find(k =>
                            k === tile.resource.name.toUpperCase() ||
                            tile.resource.name.toUpperCase().includes(k)
                        );
                        if (resKey) this.strategicResources[resKey]++;
                    } else if (tile.resource.type === 'luxury') {
                        this.luxuryResources.add(tile.resource.name);
                    }
                }
            });
        }

        // Government bonuses
        const govBonuses = this.government.getBonuses();
        if (govBonuses.gold) totalGold *= (1 + govBonuses.gold);
        if (govBonuses.science) totalScience *= (1 + govBonuses.science);
        if (govBonuses.culture) totalCulture *= (1 + govBonuses.culture);
        if (govBonuses.production) {
            // Applied per city in calculateYields
        }

        // Anarchy penalty
        if (this.government.isInAnarchy()) {
            totalGold *= 0.25;
            totalScience *= 0.25;
            totalCulture *= 0.25;
        }

        // Unit maintenance
        const unitMaintenance = this.units.length * 1;
        const maintenanceReduction = govBonuses.unitMaintenance || 0;
        totalGold -= unitMaintenance * (1 + maintenanceReduction);

        this.gold += totalGold;
        this.science += totalScience;
        this.culture += totalCulture;
        this.totalCulture += totalCulture;

        // Happiness
        this.happiness = baseHappiness - cityPenalty - populationPenalty + (this.luxuryResources.size * 4);
        if (this.goldenAge) this.happiness += 3;

        // Research
        if (this.currentTech) {
            this.researchProgress += totalScience;
            if (this.researchProgress >= this.currentTech.cost) {
                this.completeResearch();
            }
        }

        // Golden Age progress
        if (!this.goldenAge) {
            if (this.happiness > 0) {
                this.goldenAgeProgress += this.happiness;
                if (this.goldenAgeProgress >= this.goldenAgeThreshold) {
                    this.startGoldenAge();
                }
            }
        } else {
            this.goldenAgeTurns--;
            if (this.goldenAgeTurns <= 0) {
                this.goldenAge = false;
                this.goldenAgeThreshold = Math.floor(this.goldenAgeThreshold * 1.5);
                if (window.game?.players && this === window.game.players[0]) {
                    window.game?.ui?.notify('Golden Age has ended');
                }
            }
        }

        // Great Person checks
        this.checkGreatPeople();

        // Government turn update
        this.government.updateTurn();

        // Score
        this.totalScore = this.calculateScore();
    }

    startGoldenAge(duration = 10) {
        this.goldenAge = true;
        this.goldenAgeTurns = duration;
        this.goldenAgeProgress = 0;
        if (window.game?.players && this === window.game.players[0]) {
            window.game?.ui?.notify('GOLDEN AGE BEGINS! (+1 Gold/Production in all cities)');
        }
    }

    completeResearch() {
        if (!this.currentTech) return;
        this.unlockedTechs.add(this.currentTech.id);
        const name = this.currentTech.name;
        if (window.game?.players && this === window.game.players[0]) {
            window.game?.ui?.notify(`Discovered ${name}!`);
        }
        this.researchProgress = 0;
        this.currentTech = null;

        // Update era
        if (window.game?.techTree) {
            this.currentEra = window.game.techTree.getCurrentEra(this.unlockedTechs);
        }

        window.game?.autoAssignResearch(this);
    }

    checkGreatPeople() {
        // Aggregate great person points from cities
        let totalPoints = { general: this.greatGeneralPoints, scientist: 0, merchant: 0, engineer: 0 };
        this.cities.forEach(city => {
            Object.keys(city.greatPersonPoints).forEach(type => {
                totalPoints[type] = (totalPoints[type] || 0) + city.greatPersonPoints[type];
            });
        });

        // Government bonus
        const govBonuses = this.government.getBonuses();
        const gpRate = 1 + (govBonuses.greatPersonRate || 0);

        Object.keys(totalPoints).forEach(type => {
            const points = totalPoints[type] * gpRate;
            if (points >= this.greatPersonThreshold[type]) {
                this.spawnGreatPerson(type);
                this.greatPersonThreshold[type] = Math.floor(this.greatPersonThreshold[type] * 1.5);
                // Reset points
                if (type === 'general') this.greatGeneralPoints = 0;
                this.cities.forEach(city => city.greatPersonPoints[type] = 0);
            }
        });
    }

    spawnGreatPerson(type) {
        const UnitType = window.game?.UnitType;
        if (!UnitType) return;

        const typeMap = {
            general: UnitType.GREAT_GENERAL,
            scientist: UnitType.GREAT_SCIENTIST,
            merchant: UnitType.GREAT_MERCHANT,
            engineer: UnitType.GREAT_ENGINEER
        };

        const unitType = typeMap[type];
        if (!unitType || this.cities.length === 0) return;

        const capital = this.cities[0];
        window.game?.spawnUnit(unitType, capital.q, capital.r, this);
        if (window.game?.players && this === window.game.players[0]) {
            window.game?.ui?.notify(`A Great ${type.charAt(0).toUpperCase() + type.slice(1)} has been born!`);
        }
    }

    calculateScore() {
        let score = 0;
        score += this.cities.length * 50;
        score += this.cities.reduce((sum, c) => sum + c.population * 10, 0);
        score += this.unlockedTechs.size * 20;
        score += this.units.length * 5;
        score += Math.floor(this.totalCulture / 10);
        score += Math.floor(this.gold / 20);
        return score;
    }

    updateDiscovery(q, r, radius = 2) {
        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
                this.discoveredTiles.add(`${q + dq},${r + dr}`);
            }
        }
    }

    // Calculate visibility (units + cities)
    updateVisibility() {
        this.visibleTiles.clear();
        this.units.forEach(u => {
            const vision = (u.type.name === 'Scout' ? 3 : 2) + (u.promotions?.some(p => p === 'SENTRY') ? 1 : 0);
            for (let dq = -vision; dq <= vision; dq++) {
                for (let dr = Math.max(-vision, -dq - vision); dr <= Math.min(vision, -dq + vision); dr++) {
                    const key = `${u.q + dq},${u.r + dr}`;
                    this.visibleTiles.add(key);
                    this.discoveredTiles.add(key);
                }
            }
        });
        this.cities.forEach(c => {
            const vision = 2 + Math.floor(c.population / 3);
            for (let dq = -vision; dq <= vision; dq++) {
                for (let dr = Math.max(-vision, -dq - vision); dr <= Math.min(vision, -dq + vision); dr++) {
                    const key = `${c.q + dq},${c.r + dr}`;
                    this.visibleTiles.add(key);
                    this.discoveredTiles.add(key);
                }
            }
        });
    }
}
