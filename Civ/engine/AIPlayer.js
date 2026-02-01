import { Player } from './Player.js';
import { UnitType } from '../entities/Unit.js';
import { BuildingType } from '../entities/City.js';

export class AIPlayer extends Player {
    constructor(id, name, color) {
        super(id, name, color);
    }

    takeTurn(game) {
        console.log(`AI Player ${this.name} taking turn...`);

        // 1. Manage Units
        this.units.forEach(unit => {
            this.manageUnit(unit, game);
        });

        // 2. Manage Cities
        this.cities.forEach(city => {
            this.manageCity(city, game);
        });

        // 3. Manage Research
        if (!this.currentTech) {
            this.chooseResearch(game);
        }

        // 4. Update yields (standard for all players)
        this.updateYields();
    }

    manageUnit(unit, game) {
        if (unit.movementPoints <= 0) return;

        if (unit.type.name === 'Settler') {
            this.manageSettler(unit, game);
        } else if (unit.type.name === 'Worker') {
            this.manageWorker(unit, game);
        } else {
            this.manageMilitary(unit, game);
        }
    }

    manageSettler(unit, game) {
        const tile = game.worldMap.getTile(unit.q, unit.r);
        const tileScore = tile ? tile.getYield().food + tile.getYield().production : 0;

        if (tileScore >= 3 && tile.terrain.name !== 'Ocean' && tile.terrain.name !== 'Coast' && !tile.city) {
            const nearbyCity = this.cities.some(c => game.worldMap.getDistance(c.q, c.r, unit.q, unit.r) < 4);
            if (!nearbyCity) {
                game.handleAction(unit, 'Settle');
                return;
            }
        }

        // Scout for better tiles in radius 3
        const candidates = [];
        for (let q = -3; q <= 3; q++) {
            for (let r = Math.max(-3, -q - 3); r <= Math.min(3, -q + 3); r++) {
                const t = game.worldMap.getTile(unit.q + q, unit.r + r);
                if (t && !t.terrain.impassable && t.terrain.name !== 'Ocean' && !t.city) {
                    const score = t.getYield().food + t.getYield().production;
                    candidates.push({ q: t.q, r: t.r, score });
                }
            }
        }

        if (candidates.length > 0) {
            const best = candidates.reduce((a, b) => a.score > b.score ? a : b);
            // Move towards best
            const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
            const target = neighbors.reduce((bestN, n) => {
                const d = game.worldMap.getDistance(n.q, n.r, best.q, best.r);
                const bestD = game.worldMap.getDistance(bestN.q, bestN.r, best.q, best.r);
                return d < bestD ? n : bestN;
            }, neighbors[0]);

            if (target && !target.terrain.impassable) {
                game.handleHexClick(target.q, target.r);
            }
        }
    }

    manageWorker(unit, game) {
        // Simple logic: If on a tile without improvement, build something.
        const tile = game.worldMap.getTile(unit.q, unit.r);
        if (tile && !tile.improvement && !tile.city) {
            if (tile.terrain.name === 'Hills' || (tile.resource && tile.resource.name === 'Minirals')) {
                game.handleAction(unit, 'Build Mine');
            } else {
                game.handleAction(unit, 'Build Farm');
            }
            return;
        }

        // Move towards a random neighbor
        const neighbors = game.worldMap.getNeighbors(unit.q, unit.r);
        const target = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (target && !target.terrain.impassable) {
            game.handleHexClick(target.q, target.r);
        }
    }

    manageMilitary(unit, game) {
        // Explore or defend cities
        game.autoMove(unit);
    }

    manageCity(city, game) {
        if (city.productionQueue.length === 0) {
            // Check for available wonders
            const availableWonders = Object.keys(game.WonderType).filter(wId => !game.wondersBuilt.has(wId));
            if (availableWonders.length > 0 && Math.random() < 0.3) {
                const wId = availableWonders[0];
                city.addToQueue(game.WonderType[wId]);
                return;
            }

            if (this.units.filter(u => u.type.name === 'Settler').length === 0 && this.cities.length < 3) {
                city.addToQueue(UnitType.SETTLER);
            } else if (this.units.filter(u => u.type.name === 'Warrior').length < this.cities.length * 2) {
                city.addToQueue(UnitType.WARRIOR);
            } else if (!city.buildings.has('GRANARY')) {
                city.addToQueue(BuildingType.GRANARY);
            } else {
                city.addToQueue({ name: 'Wealth', cost: 0, icon: '💰' });
            }
        }
    }

    chooseResearch(game) {
        const available = game.techTree.getAvailableTechs(this.unlockedTechs);
        if (available.length > 0) {
            this.currentTech = available[Math.floor(Math.random() * available.length)];
            console.log(`AI ${this.name} researching ${this.currentTech.name}`);
        }
    }
}
