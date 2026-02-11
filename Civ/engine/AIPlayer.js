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
        // Barbarian AI: just move and attack, nothing else
        if (this.isBarbarian) {
            const unitsCopy = [...this.units];
            unitsCopy.forEach(unit => {
                if (this.units.includes(unit)) {
                    this.manageBarbarianUnit(unit, game);
                }
            });
            return;
        }

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

    manageBarbarianUnit(unit, game) {
        if (unit.movementPoints <= 0) return;

        // Find nearest non-barbarian unit or city within 6 tiles
        let bestTarget = null;
        let bestDist = Infinity;
        for (const p of game.players) {
            if (p.isBarbarian) continue;
            for (const u of p.units) {
                const dist = game.worldMap.getDistance(unit.q, unit.r, u.q, u.r);
                if (dist < bestDist && dist <= 6) {
                    bestDist = dist;
                    bestTarget = { q: u.q, r: u.r, isUnit: true, entity: u };
                }
            }
            for (const c of p.cities) {
                const dist = game.worldMap.getDistance(unit.q, unit.r, c.q, c.r);
                if (dist < bestDist && dist <= 6) {
                    bestDist = dist;
                    bestTarget = { q: c.q, r: c.r, isUnit: false, entity: c };
                }
            }
        }

        if (bestTarget && bestDist <= 1) {
            // Attack adjacent target
            try {
                game.resolveCombat(unit, bestTarget.entity);
                unit.movementPoints = 0;
            } catch (e) { /* ignore combat errors */ }
        } else if (bestTarget) {
            // Move toward target
            this.moveToward(unit, bestTarget.q, bestTarget.r, game);
        } else {
            // Wander randomly
            this.randomMove(unit, game);
        }
    }

    manageUnit(unit, game) {
        if (unit.movementPoints <= 0) return;

        if (unit.type.name === 'Settler') {
            this.manageSettler(unit, game);
        } else if (unit.type.name === 'Worker') {
            this.manageWorker(unit, game);
        } else if (unit.type.name === 'Scout') {
            this.manageScout(unit, game);
        } else if (unit.type.category === 'great_person') {
            this.manageGreatPerson(unit, game);
        } else {
            this.manageMilitary(unit, game);
        }
    }

    manageSettler(unit, game) {
        const tile = game.worldMap.getTile(unit.q, unit.r);
        if (!tile) return;

        // Initialize settler tracking
        if (!unit.settlerData) {
            const origin = this.cities.length > 0 ? this.cities[0] : { q: unit.q, r: unit.r };
            unit.settlerData = {
                originQ: origin.q,
                originR: origin.r,
                turnsSearching: 0,
                visitedTiles: new Set()
            };
        }
        
        unit.settlerData.turnsSearching++;
        unit.settlerData.visitedTiles.add(`${unit.q},${unit.r}`);
        
        const distanceFromOrigin = game.worldMap.getDistance(
            unit.q, unit.r,
            unit.settlerData.originQ, unit.settlerData.originR
        );
        
        const tileScore = this.evaluateSettleLocation(unit.q, unit.r, game);
        
        // Progressive settling: lower threshold over distance and time
        let settleThreshold = 8;
        if (distanceFromOrigin >= 8 || unit.settlerData.turnsSearching >= 12) {
            settleThreshold = 5;
        } else if (distanceFromOrigin >= 5 || unit.settlerData.turnsSearching >= 6) {
            settleThreshold = 6.5;
        }

        if (tileScore >= settleThreshold && !tile.terrain.impassable && tile.terrain.name !== 'Ocean' && tile.terrain.name !== 'Coast' && !tile.city) {
            const nearbyCity = this.cities.some(c => game.worldMap.getDistance(c.q, c.r, unit.q, unit.r) < 5);
            if (!nearbyCity || this.cities.length === 0) {
                game.handleAction(unit, 'Settle');
                return;
            }
        }

        // Search for better location within view, but prioritize distance if we haven't traveled far
        let bestQ = unit.q, bestR = unit.r, bestScore = -Infinity;
        const searchRadius = distanceFromOrigin < 6 ? 3 : 5; // Smaller radius if still close to origin
        
        for (let dq = -searchRadius; dq <= searchRadius; dq++) {
            for (let dr = Math.max(-searchRadius, -dq - searchRadius); dr <= Math.min(searchRadius, -dq + searchRadius); dr++) {
                const q = unit.q + dq;
                const r = unit.r + dr;
                const t = game.worldMap.getTile(q, r);
                if (!t || t.terrain.impassable || t.terrain.water || t.city) continue;
                
                // Skip recently visited tiles
                if (unit.settlerData.visitedTiles.has(`${q},${r}`)) continue;

                let score = this.evaluateSettleLocation(q, r, game);
                const nearbyCity = this.cities.some(c => game.worldMap.getDistance(c.q, c.r, q, r) < 5);
                if (nearbyCity) continue;
                
                // Bonus for moving away from origin if we haven't traveled far
                if (distanceFromOrigin < 8) {
                    const distToOrigin = game.worldMap.getDistance(q, r, unit.settlerData.originQ, unit.settlerData.originR);
                    if (distToOrigin > distanceFromOrigin) {
                        score += 5; // Bonus for expanding outward
                    }
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestQ = q;
                    bestR = r;
                }
            }
        }
        
        // If no better location found and we're far enough, just settle here if decent
        if (bestQ === unit.q && bestR === unit.r && distanceFromOrigin >= 6 && tileScore >= 5) {
            if (!tile.city && !tile.terrain.water && !tile.terrain.impassable) {
                const nearbyCity = this.cities.some(c => game.worldMap.getDistance(c.q, c.r, unit.q, unit.r) < 5);
                if (!nearbyCity) {
                    game.handleAction(unit, 'Settle');
                    return;
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

    manageScout(unit, game) {
        // Scouts are dedicated explorers - always push toward fog of war
        const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
        const passable = neighbors.filter(n => !n.terrain.impassable && !n.terrain.water);
        
        if (passable.length === 0) {
            unit.movementPoints = 0;
            return;
        }
        
        // Prioritize moving toward unexplored territory
        let bestMove = null;
        let bestScore = -Infinity;
        
        passable.forEach(neighbor => {
            let score = 0;
            
            // Heavily prefer undiscovered tiles
            if (!this.discoveredTiles.has(`${neighbor.q},${neighbor.r}`)) {
                score += 150;
            }
            
            // Count fog of war in extended range
            const nearTiles = game.worldMap.getNeighbors(neighbor.q, neighbor.r);
            const unexploredNear = nearTiles.filter(t => !this.discoveredTiles.has(`${t.q},${t.r}`)).length;
            score += unexploredNear * 20;
            
            // Look further ahead for fog
            nearTiles.forEach(furtherTile => {
                const evenFurther = game.worldMap.getNeighbors(furtherTile.q, furtherTile.r);
                const unexploredFar = evenFurther.filter(t => !this.discoveredTiles.has(`${t.q},${t.r}`)).length;
                score += unexploredFar * 5;
            });
            
            // Strongly prefer hills for vision advantage
            if (neighbor.terrain.name === 'Hills') {
                score += 25;
            }
            
            // Avoid staying in already-explored areas
            const visibleNearby = nearTiles.filter(t => this.visibleTiles.has(`${t.q},${t.r}`)).length;
            score -= visibleNearby * 10;
            
            // Small randomness to break ties
            score += Math.random() * 3;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = neighbor;
            }
        });
        
        if (bestMove) {
            unit.move(bestMove.q, bestMove.r, 1);
            this.updateDiscovery(bestMove.q, bestMove.r, 2);
            this.updateVisibility();
        } else {
            unit.movementPoints = 0;
        }
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
            return p.units.filter(u => this.visibleTiles.has(`${u.q},${u.r}`));
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
            try {
                game.resolveCombat(unit, nearestEnemy);
            } catch (e) { /* ignore combat errors */ }
            unit.movementPoints = 0;
            return;
        }

        // Move toward enemy threat if close
        if (nearestEnemy && nearestDist <= 5) {
            this.moveToward(unit, nearestEnemy.q, nearestEnemy.r, game);
            return;
        }

        // Strategic city defense
        const undefendedCity = this.cities.find(city => {
            const defenders = this.units.filter(u =>
                u.type.category === 'military' &&
                game.worldMap.getDistance(u.q, u.r, city.q, city.r) <= 2 &&
                u !== unit
            );
            return defenders.length < 2; // Want at least 2 defenders per city
        });

        if (undefendedCity) {
            const distToCity = game.worldMap.getDistance(unit.q, unit.r, undefendedCity.q, undefendedCity.r);
            
            // If already near city, find defensive position
            if (distToCity <= 2) {
                const tile = game.worldMap.getTile(unit.q, unit.r);
                const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
                const passable = neighbors.filter(n => !n.terrain.impassable && !n.terrain.water);
                
                let bestPos = tile;
                let bestScore = this.getDefensiveScore(tile);
                
                passable.forEach(n => {
                    const score = this.getDefensiveScore(n);
                    if (score > bestScore) {
                        bestScore = score;
                        bestPos = n;
                    }
                });
                
                if (bestPos !== tile) {
                    unit.move(bestPos.q, bestPos.r, 1);
                } else {
                    unit.isFortified = true;
                    unit.movementPoints = 0;
                }
            } else {
                this.moveToward(unit, undefendedCity.q, undefendedCity.r, game);
            }
            return;
        }

        // Patrol borders - explore territory edges
        const borderTile = this.findBorderTile(unit, game);
        if (borderTile) {
            this.moveToward(unit, borderTile.q, borderTile.r, game);
            return;
        }

        // Default: explore
        this.smartExplore(unit, game);
    }

    getDefensiveScore(tile) {
        let score = 0;
        if (tile.terrain.name === 'Hills') score += 10;
        if (tile.feature.name === 'Forest') score += 5;
        if (tile.rivers && tile.rivers.length > 0) score += 3;
        if (tile.owner === this) score += 5;
        return score;
    }

    findBorderTile(unit, game) {
        // Find tiles near fog of war for border patrol
        for (let radius = 1; radius <= 5; radius++) {
            for (let dq = -radius; dq <= radius; dq++) {
                for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
                    const tile = game.worldMap.getTile(unit.q + dq, unit.r + dr);
                    if (!tile) continue;
                    
                    const neighbors = game.worldMap.getNeighbors(tile.q, tile.r);
                    const hasUnexplored = neighbors.some(n => !this.discoveredTiles.has(`${n.q},${n.r}`));
                    
                    if (hasUnexplored && tile.owner === this && !tile.terrain.impassable && !tile.terrain.water) {
                        return tile;
                    }
                }
            }
        }
        return null;
    }

    smartExplore(unit, game) {
        // Intelligent exploration toward unexplored regions
        const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
        const passable = neighbors.filter(n => {
            if (unit.type.naval) return n.terrain.water && !(n.terrain.deepWater && !unit.type.oceanCapable);
            return !n.terrain.impassable && !n.terrain.water;
        });
        
        if (passable.length === 0) {
            unit.movementPoints = 0;
            return;
        }
        
        // Score moves based on exploration value
        let bestMove = passable[0];
        let bestScore = -Infinity;
        
        passable.forEach(neighbor => {
            let score = 0;
            
            // Prefer undiscovered tiles
            if (!this.discoveredTiles.has(`${neighbor.q},${neighbor.r}`)) {
                score += 100;
            }
            
            // Count nearby fog of war
            const nearTiles = game.worldMap.getNeighbors(neighbor.q, neighbor.r);
            const unexploredCount = nearTiles.filter(t => !this.discoveredTiles.has(`${t.q},${t.r}`)).length;
            score += unexploredCount * 10;
            
            // Prefer hills for scouts (better vision)
            if (unit.type.name === 'Scout' && neighbor.terrain.name === 'Hills') {
                score += 15;
            }
            
            // Slight randomness to avoid patterns
            score += Math.random() * 5;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = neighbor;
            }
        });
        
        unit.move(bestMove.q, bestMove.r, 1);
        this.updateDiscovery(bestMove.q, bestMove.r, 2);
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
        const passable = neighbors.filter(n => {
            if (unit.type.naval) return n.terrain.water && !(n.terrain.deepWater && !unit.type.oceanCapable);
            return !n.terrain.impassable && !n.terrain.water;
        });
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
        const passable = neighbors.filter(n => {
            if (unit.type.naval) return n.terrain.water && !(n.terrain.deepWater && !unit.type.oceanCapable);
            return !n.terrain.impassable && !n.terrain.water;
        });
        if (passable.length > 0) {
            const target = passable[Math.floor(Math.random() * passable.length)];
            unit.move(target.q, target.r, 1);
            this.updateDiscovery(target.q, target.r, 2);
        }
    }
}
