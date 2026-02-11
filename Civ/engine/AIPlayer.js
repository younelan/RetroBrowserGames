import { Player } from './Player.js';
import { UnitType } from '../entities/Unit.js';
import { BuildingType, WonderType } from '../entities/City.js';

export class AIPlayer extends Player {
    constructor(id, name, color) {
        super(id, name, color);
        this.personality = this.generatePersonality();
    }

    generatePersonality() {
        const types = ['aggressive', 'builder', 'scientist', 'balanced'];
        return types[this.id % types.length];
    }

    takeTurn(game) {
        // 1. Manage Units
        const unitsCopy = [...this.units];
        unitsCopy.forEach(unit => {
            if (this.units.includes(unit)) {
                this.manageUnit(unit, game);
            }
        });

        // 2. Manage Cities
        this.cities.forEach(city => {
            this.manageCity(city, game);
        });

        // 3. Research
        if (!this.currentTech) {
            this.chooseResearch(game);
        }

        // 4. Diplomacy
        this.manageDiplomacy(game);

        // 5. Promotions
        this.units.forEach(unit => {
            if (unit.canPromote && unit.canPromote()) {
                const promos = unit.getAvailablePromotions();
                if (promos.length > 0) {
                    unit.promote(promos[0].id);
                }
            }
        });

        // 6. Update yields
        this.updateVisibility();
        this.updateYields();
    }

    manageUnit(unit, game) {
        if (unit.movementPoints <= 0) return;

        if (unit.type.name === 'Settler') {
            this.manageSettler(unit, game);
        } else if (unit.type.name === 'Worker') {
            this.manageWorker(unit, game);
        } else if (unit.type.category === 'great_person') {
            this.manageGreatPerson(unit, game);
        } else {
            this.manageMilitary(unit, game);
        }
    }

    manageSettler(unit, game) {
        const tile = game.worldMap.getTile(unit.q, unit.r);
        if (!tile) return;

        const tileScore = this.evaluateSettleLocation(unit.q, unit.r, game);

        if (tileScore >= 8 && !tile.terrain.impassable && tile.terrain.name !== 'Ocean' && tile.terrain.name !== 'Coast' && !tile.city) {
            const nearbyCity = this.cities.some(c => game.worldMap.getDistance(c.q, c.r, unit.q, unit.r) < 5);
            if (!nearbyCity || this.cities.length === 0) {
                game.handleAction(unit, 'Settle');
                return;
            }
        }

        // Search for better location
        let bestQ = unit.q, bestR = unit.r, bestScore = 0;
        for (let dq = -5; dq <= 5; dq++) {
            for (let dr = Math.max(-5, -dq - 5); dr <= Math.min(5, -dq + 5); dr++) {
                const q = unit.q + dq;
                const r = unit.r + dr;
                const t = game.worldMap.getTile(q, r);
                if (!t || t.terrain.impassable || t.terrain.name === 'Ocean' || t.city) continue;

                const score = this.evaluateSettleLocation(q, r, game);
                const nearbyCity = this.cities.some(c => game.worldMap.getDistance(c.q, c.r, q, r) < 5);
                if (score > bestScore && !nearbyCity) {
                    bestScore = score;
                    bestQ = q;
                    bestR = r;
                }
            }
        }

        this.moveToward(unit, bestQ, bestR, game);
    }

    evaluateSettleLocation(q, r, game) {
        let score = 0;
        const neighbors = game.worldMap.getNeighbors(q, r);
        neighbors.forEach(n => {
            const y = n.getYield();
            score += y.food * 2 + y.production * 1.5 + y.gold;
            if (n.rivers.length > 0) score += 3;
            if (n.resource.name !== 'None') score += 2;
            if (n.resource.type === 'luxury') score += 3;
            if (n.resource.type === 'strategic') score += 2;
        });
        return score;
    }

    manageWorker(unit, game) {
        const tile = game.worldMap.getTile(unit.q, unit.r);
        if (unit.workRemaining > 0) return;

        if (tile && !tile.improvement && !tile.city && tile.owner === this) {
            if (tile.terrain.name === 'Hills' || tile.resource?.name === 'Iron' || tile.resource?.name === 'Coal') {
                game.handleAction(unit, 'Build Mine');
                return;
            } else if (tile.resource?.type === 'luxury') {
                game.handleAction(unit, 'Build Plantation');
                return;
            } else if (tile.terrain === game.TerrainType.GRASSLAND || tile.terrain === game.TerrainType.PLAINS) {
                game.handleAction(unit, 'Build Farm');
                return;
            }
        }

        // Move to unimproved tile in territory
        const targetTile = this.findUnimprovedTile(unit, game);
        if (targetTile) {
            this.moveToward(unit, targetTile.q, targetTile.r, game);
        } else {
            // Build roads between cities
            if (!tile?.hasRoad && tile?.owner === this) {
                game.handleAction(unit, 'Build Road');
            } else {
                this.randomMove(unit, game);
            }
        }
    }

    findUnimprovedTile(unit, game) {
        for (const city of this.cities) {
            for (const coords of city.territory) {
                const tile = game.worldMap.getTileByCoords(coords);
                if (tile && !tile.improvement && !tile.city &&
                    !tile.terrain.impassable && tile.terrain.name !== 'Ocean' &&
                    tile.owner === this) {
                    return tile;
                }
            }
        }
        return null;
    }

    manageMilitary(unit, game) {
        // Check for nearby enemies
        const enemies = game.players.flatMap(p => {
            if (p === this) return [];
            if (game.diplomacy && !game.diplomacy.isAtWar(this.id, p.id)) return [];
            return p.units;
        });

        // Find nearest enemy in range
        let nearestEnemy = null;
        let nearestDist = Infinity;
        enemies.forEach(enemy => {
            const dist = game.worldMap.getDistance(unit.q, unit.r, enemy.q, enemy.r);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });

        // Attack if adjacent
        if (nearestEnemy && nearestDist <= (unit.type.range || 1)) {
            game.resolveCombat(unit, nearestEnemy);
            unit.movementPoints = 0;
            return;
        }

        // Move toward enemy if at war
        if (nearestEnemy && nearestDist < 8) {
            this.moveToward(unit, nearestEnemy.q, nearestEnemy.r, game);
            return;
        }

        // Defend cities
        const undefendedCity = this.cities.find(city => {
            return !this.units.some(u =>
                u.type.category === 'military' &&
                game.worldMap.getDistance(u.q, u.r, city.q, city.r) <= 2 &&
                u !== unit
            );
        });

        if (undefendedCity) {
            this.moveToward(unit, undefendedCity.q, undefendedCity.r, game);
            return;
        }

        // Explore
        game.autoMove(unit);
    }

    manageGreatPerson(unit, game) {
        // Use great person in capital
        if (this.cities.length > 0) {
            const capital = this.cities[0];
            if (unit.q === capital.q && unit.r === capital.r) {
                const action = unit.type.actions[0]; // Use primary ability
                if (action !== 'Skip Turn') {
                    game.handleAction(unit, action);
                    return;
                }
            }
            this.moveToward(unit, capital.q, capital.r, game);
        }
    }

    manageCity(city, game) {
        if (city.productionQueue.length > 0) return;

        const militaryCount = this.units.filter(u => u.type.category === 'military').length;
        const workerCount = this.units.filter(u => u.type.name === 'Worker').length;

        // Priority queue based on personality
        if (this.personality === 'aggressive') {
            this.aggressiveCityProduction(city, game, militaryCount, workerCount);
        } else if (this.personality === 'builder') {
            this.builderCityProduction(city, game, militaryCount, workerCount);
        } else if (this.personality === 'scientist') {
            this.scientistCityProduction(city, game, militaryCount, workerCount);
        } else {
            this.balancedCityProduction(city, game, militaryCount, workerCount);
        }
    }

    balancedCityProduction(city, game, militaryCount, workerCount) {
        // Workers first
        if (workerCount < this.cities.length && workerCount < 3) {
            city.addToQueue(UnitType.WORKER);
            return;
        }

        // Settlers
        if (this.units.filter(u => u.type.name === 'Settler').length === 0 && this.cities.length < 4) {
            city.addToQueue(UnitType.SETTLER);
            return;
        }

        // Buildings
        const buildingPriority = ['MONUMENT', 'GRANARY', 'LIBRARY', 'WALLS', 'BARRACKS', 'MARKET', 'COLOSSEUM',
            'UNIVERSITY', 'WORKSHOP', 'FORGE', 'BANK', 'FACTORY'];
        for (const bId of buildingPriority) {
            if (city.canBuild(bId)) {
                city.addToQueue(BuildingType[bId]);
                return;
            }
        }

        // Military
        if (militaryCount < this.cities.length * 3) {
            const bestUnit = this.getBestAvailableUnit(game);
            city.addToQueue(bestUnit);
            return;
        }

        // Wonders
        const availableWonders = Object.entries(WonderType).filter(([wId, w]) => {
            if (game.wondersBuilt.has(wId)) return false;
            if (w.tech && !this.unlockedTechs.has(w.tech)) return false;
            return true;
        });
        if (availableWonders.length > 0 && Math.random() < 0.4) {
            city.addToQueue(availableWonders[0][1]);
            return;
        }

        city.addToQueue({ name: 'Wealth', cost: 0, icon: '💰' });
    }

    aggressiveCityProduction(city, game, militaryCount, workerCount) {
        if (militaryCount < this.cities.length * 4) {
            city.addToQueue(this.getBestAvailableUnit(game));
            return;
        }
        this.balancedCityProduction(city, game, militaryCount, workerCount);
    }

    builderCityProduction(city, game, militaryCount, workerCount) {
        if (workerCount < this.cities.length + 1) {
            city.addToQueue(UnitType.WORKER);
            return;
        }
        this.balancedCityProduction(city, game, militaryCount, workerCount);
    }

    scientistCityProduction(city, game, militaryCount, workerCount) {
        const scienceBuildings = ['LIBRARY', 'UNIVERSITY', 'PUBLIC_SCHOOL', 'OBSERVATORY'];
        for (const bId of scienceBuildings) {
            if (city.canBuild(bId)) {
                city.addToQueue(BuildingType[bId]);
                return;
            }
        }
        this.balancedCityProduction(city, game, militaryCount, workerCount);
    }

    getBestAvailableUnit(game) {
        const units = Object.values(UnitType).filter(u => {
            if (u.category !== 'military') return false;
            if (u.techRequired && !this.unlockedTechs.has(u.techRequired)) return false;
            if (u.resourceRequired && this.strategicResources[u.resourceRequired] <= 0) return false;
            return true;
        });

        if (units.length === 0) return UnitType.WARRIOR;
        return units.reduce((best, u) => u.strength > best.strength ? u : best, units[0]);
    }

    chooseResearch(game) {
        const available = game.techTree.getAvailableTechs(this.unlockedTechs);
        if (available.length === 0) return;

        // Prioritize based on personality
        if (this.personality === 'scientist') {
            const scienceTech = available.find(t => t.unlocks?.some(u => u.includes('Science') || u.includes('Library') || u.includes('University')));
            if (scienceTech) { this.currentTech = scienceTech; return; }
        } else if (this.personality === 'aggressive') {
            const militaryTech = available.find(t => t.unlocks?.some(u => u.includes('man') || u.includes('Knight') || u.includes('Cannon')));
            if (militaryTech) { this.currentTech = militaryTech; return; }
        }

        // Default: pick cheapest
        available.sort((a, b) => a.cost - b.cost);
        this.currentTech = available[0];
    }

    manageDiplomacy(game) {
        if (!game.diplomacy) return;

        game.players.forEach(other => {
            if (other === this || !this.metPlayers.has(other.id)) return;

            // Aggressive AI might declare war
            if (this.personality === 'aggressive' && game.diplomacy.shouldDeclareWar(this, other)) {
                game.diplomacy.declareWar(this, other);
                game.ui?.notify(`${this.name} declares WAR on ${other.name}!`);
            }

            // Consider peace
            if (game.diplomacy.isAtWar(this.id, other.id) && game.diplomacy.shouldAcceptPeace(this, other)) {
                game.diplomacy.makePeace(this, other);
                game.ui?.notify(`${this.name} and ${other.name} make peace`);
            }
        });
    }

    moveToward(unit, targetQ, targetR, game) {
        if (unit.movementPoints <= 0) return;
        const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
        const passable = neighbors.filter(n => !n.terrain.impassable && n.terrain.name !== 'Ocean');
        if (passable.length === 0) return;

        const target = passable.reduce((best, n) => {
            const d = game.worldMap.getDistance(n.q, n.r, targetQ, targetR);
            const bestD = game.worldMap.getDistance(best.q, best.r, targetQ, targetR);
            return d < bestD ? n : best;
        }, passable[0]);

        if (target) {
            unit.move(target.q, target.r, 1);
            this.updateDiscovery(target.q, target.r, 2);
        }
    }

    randomMove(unit, game) {
        const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
        const passable = neighbors.filter(n => !n.terrain.impassable && n.terrain.name !== 'Ocean');
        if (passable.length > 0) {
            const target = passable[Math.floor(Math.random() * passable.length)];
            unit.move(target.q, target.r, 1);
            this.updateDiscovery(target.q, target.r, 2);
        }
    }
}
