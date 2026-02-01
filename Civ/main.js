import { WorldMap } from './engine/Map.js';
import { TerrainType, FeatureType, ResourceType } from './engine/Tile.js';
import { Camera } from './engine/Camera.js';
import { Renderer } from './engine/Renderer.js';
import { Player } from './engine/Player.js';
import { AIPlayer } from './engine/AIPlayer.js';
import { Unit, UnitType } from './entities/Unit.js';
import { City, BuildingType, WonderType } from './entities/City.js';
import { UIManager } from './ui/UIManager.js';
import { Pathfinding } from './systems/Pathfinding.js';
import { TechnologyData, TechTree } from './systems/Research.js';
import { CombatSystem } from './systems/Combat.js';

class Game {
    constructor() {
        window.game = this;
        this.canvas = document.getElementById('game-canvas');
        this.resize();

        this.UnitType = UnitType;
        this.BuildingType = BuildingType;
        this.TechnologyData = TechnologyData;
        this.TerrainType = TerrainType;
        this.FeatureType = FeatureType;
        this.ResourceType = ResourceType;
        this.WonderType = WonderType;

        this.turn = 1;
        this.players = [
            new Player(0, 'Player One', '#58a6ff'),
            new AIPlayer(1, 'Roman Empire', '#ff7b72'),
            new AIPlayer(2, 'Egyptian Empire', '#f2cc60'),
            new AIPlayer(3, 'Greek Empire', '#7ee787')
        ];
        this.currentPlayerIndex = 0;
        this.isAiTurn = false;
        this.wondersBuilt = new Set();
        this.victoryReached = false;

        this.worldMap = new WorldMap(60, 60);
        this.camera = new Camera(this.canvas);
        this.renderer = new Renderer(this.canvas, this.camera, this.worldMap);
        this.ui = new UIManager(this);
        this.techTree = new TechTree();

        this.selectedEntity = null;
        this.reachableTiles = new Map();

        // Initial Setup
        this.spawnInitialUnits();
        this.autoAssignResearch(this.getCurrentPlayer());

        this.setupEvents();
        this.ui.updateHUD(this.getCurrentPlayer());

        if (this.players[0].units.length > 0) {
            setTimeout(() => {
                this.centerOn(this.players[0].units[0]);
                this.ui.updateHUD(this.getCurrentPlayer());
            }, 100);
        }

        this.loop();
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    autoAssignResearch(player) {
        if (!player.currentTech) {
            const available = this.techTree.getAvailableTechs(player.unlockedTechs);
            if (available.length > 0) {
                player.currentTech = available[0];
            }
        }
    }

    spawnInitialUnits() {
        const p1 = this.players[0];
        const tiles = Array.from(this.worldMap.tiles.values());

        let startTile = tiles.find(t => t.terrain.name === 'Grassland' && t.feature.name === 'None');
        if (!startTile) startTile = tiles.find(t => t.terrain.name === 'Plains' && t.feature.name === 'None');
        if (!startTile) startTile = tiles.find(t => !t.terrain.impassable && t.terrain.name !== 'Ocean');

        if (startTile) {
            new Unit(UnitType.SETTLER, startTile.q, startTile.r, p1);
            new Unit(UnitType.WARRIOR, startTile.q + 1, startTile.r, p1);
            p1.updateDiscovery(startTile.q, startTile.r, 5); // Increased initial vision
        }
    }

    spawnUnit(type, q, r, owner) {
        let targetQ = q;
        let targetR = r;

        // Check if occupied
        const allUnits = this.players.flatMap(p => p.units);
        const occupied = allUnits.some(u => u.q === q && u.r === r);

        if (occupied) {
            const neighbors = this.worldMap.getNeighbors(q, r);
            const empty = neighbors.find(n => !allUnits.some(u => u.q === n.q && u.r === n.r));
            if (empty) {
                targetQ = empty.q;
                targetR = empty.r;
            }
        }

        const unit = new Unit(type, targetQ, targetR, owner);
        return unit;
    }

    centerOn(target) {
        const { x, y } = this.camera.hexToScreen(target.q, target.r);
        // hexToScreen returns current screen pos based on camera.x/y
        // We want to ADJUST camera.x/y so that hexToScreen returns center screen
        const dx = (this.canvas.width / 2) - x;
        const dy = (this.canvas.height / 2) - y;
        this.camera.x += dx;
        this.camera.y += dy;
        this.camera.clamp(this.worldMap.width, this.worldMap.height);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.camera.isPanning = true;
            this.camera.lastMousePos = { x: e.clientX, y: e.clientY };
            this.mouseDownPos = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (this.camera.isPanning) {
                const dx = e.clientX - this.camera.lastMousePos.x;
                const dy = e.clientY - this.camera.lastMousePos.y;
                this.camera.x += dx;
                this.camera.y += dy;
                this.camera.clamp(this.worldMap.width, this.worldMap.height);
                this.camera.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.camera.isPanning) {
                // Determine if this was a click or a drag
                const dx = Math.abs(e.clientX - this.mouseDownPos.x);
                const dy = Math.abs(e.clientY - this.mouseDownPos.y);

                if (dx < 5 && dy < 5) {
                    const hex = this.camera.screenToHex(e.clientX, e.clientY);
                    this.handleHexClick(hex.q, hex.r);
                }
            }
            this.camera.isPanning = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.95 : 1.05;
            this.camera.zoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.camera.zoom * delta));
            this.camera.clamp(this.worldMap.width, this.worldMap.height);
        }, { passive: false });

        // Mini-map interaction
        const mm = document.getElementById('minimap-canvas');
        if (mm) {
            mm.addEventListener('mousedown', (e) => {
                const rect = mm.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const target = this.minimapToWorld(x, y);
                this.centerOn(target);
            });
        }

        // Hover handling for tooltips
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.camera.isPanning) return;
            const hex = this.camera.screenToHex(e.clientX, e.clientY);
            this.handleHexHover(hex.q, hex.r, e.clientX, e.clientY);
        });
    }

    minimapToWorld(mmX, mmY) {
        const mm = document.getElementById('minimap-canvas');
        const q = (mmX / mm.width) * this.worldMap.width - (this.worldMap.width / 4); // Basic offset correction
        const r = (mmY / mm.height) * this.worldMap.height;
        return { q: Math.round(q), r: Math.round(r) };
    }

    screenToMinimap(sx, sy) {
        const mm = document.getElementById('minimap-canvas');
        if (!mm) return { x: 0, y: 0 };
        const hex = this.camera.screenToHex(sx, sy);
        const pSize = mm.width / this.worldMap.width;
        const ySize = mm.height / this.worldMap.height;
        return {
            x: (hex.q + (hex.r / 2)) * pSize,
            y: hex.r * ySize
        };
    }

    handleHexHover(q, r, x, y) {
        const tile = this.worldMap.getTile(q, r);
        if (!tile) {
            this.ui.hideTooltip();
            return;
        }

        const player = this.getCurrentPlayer();
        const isDiscovered = player.discoveredTiles.has(`${q},${r}`);

        if (!isDiscovered) {
            this.ui.hideTooltip();
            return;
        }

        let content = `<strong>${tile.terrain.name}</strong>`;
        if (tile.feature.name !== 'None') content += `<br><em>${tile.feature.name}</em>`;
        if (tile.resource.name !== 'None') content += `<br><span style="color:var(--gold)">${tile.resource.name}</span>`;
        if (tile.improvement) content += `<br><span style="color:var(--food)">${tile.improvement.name}</span>`;

        // Add city or unit info
        const city = this.players.flatMap(p => p.cities).find(c => c.q === q && c.r === r);
        if (city) content += `<br><hr>City: ${city.name} (${city.owner.name})`;

        const unit = this.players.flatMap(p => p.units).find(u => u.q === q && u.r === r);
        if (unit) content += `<br><hr>${unit.type.name} - ${unit.owner.name}`;

        this.ui.showTooltip(content, x, y);
    }

    handleHexClick(q, r) {
        const tile = this.worldMap.getTile(q, r);
        if (!tile) return;

        const player = this.getCurrentPlayer();

        if (this.selectedEntity instanceof Unit && this.reachableTiles.has(`${q},${r}`)) {
            const cost = this.reachableTiles.get(`${q},${r}`);

            // Check for combat
            const enemy = this.players.flatMap(p => p.units).find(u => u.q === q && u.r === r && u.owner !== player);
            if (enemy) {
                if (this.selectedEntity.type.category === 'military') {
                    this.resolveCombat(this.selectedEntity, enemy);
                    this.selectedEntity.movementPoints = 0;
                    this.ui.showSelection(this.selectedEntity);
                    return;
                } else {
                    this.ui.notify('Civilian units cannot attack!');
                    return;
                }
            }

            // Check for City Capture
            const enemyCity = this.players.flatMap(p => p.cities).find(c => c.q === q && c.r === r && c.owner !== player);
            if (enemyCity) {
                if (this.selectedEntity.type.category === 'military') {
                    this.captureCity(enemyCity, player);
                } else {
                    this.ui.notify('Civilian units cannot capture cities!');
                    return;
                }
            }

            if (this.selectedEntity.move(q, r, cost)) {
                player.updateDiscovery(q, r, 2);

                // Check for collecting village
                if (tile && tile.village) {
                    this.collectVillageReward(player);
                    tile.village = false;
                }

                this.checkForMeetings(player);
                this.ui.updateSelection();

                this.reachableTiles = Pathfinding.getReachableTiles(this.worldMap.getTile(this.selectedEntity.q, this.selectedEntity.r), this.worldMap, this.selectedEntity.movementPoints);
                this.ui.showSelection(this.selectedEntity);
                return;
            }
        }

        const unit = player.units.find(u => u.q === q && u.r === r);
        if (unit) {
            this.selectedEntity = unit;
            this.reachableTiles = Pathfinding.getReachableTiles(tile, this.worldMap, unit.movementPoints);
            this.ui.showSelection(unit);
            return;
        }

        const city = player.cities.find(c => c.q === q && c.r === r);
        if (city) {
            this.selectedEntity = city;
            this.reachableTiles = new Map();
            this.ui.showSelection(city);
            return;
        }

        // Just select the tile if nothing else
        this.selectedEntity = { type: 'tile', tile: tile };
        this.reachableTiles = new Map();
        this.ui.showSelection(this.selectedEntity);
    }

    handleAction(entity, action) {
        if (action === 'Settle' && entity instanceof Unit) {
            const cityName = entity.owner.getNextCityName();
            const city = new City(cityName, entity.q, entity.r, entity.owner);
            entity.owner.units = entity.owner.units.filter(u => u !== entity);
            this.selectedEntity = city;
            this.ui.showSelection(city);
            this.ui.notify(`Established the city of ${cityName}!`);
            entity.owner.updateDiscovery(entity.q, entity.r, 3);
            this.ui.updateHUD(entity.owner);
        }

        // Worker Improvements
        if (entity instanceof Unit && entity.type.name === 'Worker') {
            const tile = this.worldMap.getTile(entity.q, entity.r);
            if (action === 'Build Farm') {
                entity.task = 'Building Farm';
                entity.workRemaining = 3; // Example: 3 turns to build a farm
                entity.workCallback = () => {
                    tile.improvement = { name: 'Farm', icon: '🚜', food: 1, prod: 0, gold: 0 };
                    this.ui.notify('Farm Built');
                };
                entity.movementPoints = 0;
                this.ui.notify(`Worker started building a Farm (${entity.workRemaining} turns)`);
            }
            if (action === 'Build Mine') {
                entity.task = 'Building Mine';
                entity.workRemaining = 4; // Example: 4 turns to build a mine
                entity.workCallback = () => {
                    tile.improvement = { name: 'Mine', icon: '⚒️', food: 0, prod: 2, gold: 0 };
                    this.ui.notify('Mine Built');
                };
                entity.movementPoints = 0;
                this.ui.notify(`Worker started building a Mine (${entity.workRemaining} turns)`);
            }
            if (action === 'Build Pasture') {
                entity.task = 'Building Pasture';
                entity.workRemaining = 3;
                entity.workCallback = () => {
                    tile.improvement = { name: 'Pasture', icon: '🛖', food: 1, prod: 1, gold: 0 };
                    this.ui.notify('Pasture Built');
                };
                entity.movementPoints = 0;
                this.ui.notify(`Worker started building a Pasture (${entity.workRemaining} turns)`);
            }
            if (action === 'Harvest Resource' && tile.resource.name !== 'None') {
                const goldGained = 150;
                entity.owner.gold += goldGained;
                this.ui.notify(`Harvested ${tile.resource.name}! (+${goldGained} Gold)`);
                tile.resource = ResourceType.NONE;
                entity.movementPoints = 0;
                entity.task = 'Harvested';
            }
            if (action === 'Clear Forest' && tile.feature.name === 'Forest') {
                const city = entity.owner.cities[0];
                if (city) city.productionStored += 30;
                this.ui.notify('Forest Cleared (+30 Production)');
                tile.feature = FeatureType.NONE;
                entity.movementPoints = 0;
                entity.task = 'Cleared Forest';
            }
            this.ui.showSelection(entity);
        }

        // Military Actions
        if (action === 'Fortify' && entity instanceof Unit) {
            entity.isFortified = true;
            entity.movementPoints = 0;
            entity.task = 'Fortified';
            this.ui.notify('Unit Fortified (+50% Defense)');
            this.ui.showSelection(entity);
        }
        if (action === 'Skip Turn' && entity instanceof Unit) {
            entity.movementPoints = 0;
            entity.task = 'Sentry';
            this.ui.showSelection(entity);
            this.ui.notify('Turn Skipped');
        }
        if (action === 'Explore' && entity instanceof Unit) {
            this.autoMove(entity);
        }

        // Dynamic City Production
        if (action.startsWith('Build ') && entity instanceof City) {
            const name = action.substring(6);
            const unitType = Object.values(this.UnitType).find(u => u.name === name);
            const buildingType = Object.values(this.BuildingType).find(b => b.name === name);

            if (unitType) {
                // Check Resource Requirement
                if (unitType.resourceRequired) {
                    const res = unitType.resourceRequired.toUpperCase();
                    if (entity.owner.strategicResources[res] <= 0) {
                        this.ui.notify(`Need ${res} to build ${name}!`, 'error');
                        return;
                    }
                }
                entity.addToQueue(unitType);
                this.ui.notify(`Queued ${name}`);
            } else if (buildingType) {
                entity.addToQueue(buildingType);
                this.ui.notify(`Queued ${name}`);
            } else if (name === 'Wealth' || name === 'Research') {
                entity.addToQueue({ name, cost: 0, icon: name === 'Wealth' ? '💰' : '🔬' });
                this.ui.notify(`City focus set to ${name}`);
            }
        }
    }

    autoMove(unit) {
        const neighbors = this.worldMap.getNeighbors(unit.q, unit.r);
        const undiscovered = neighbors.filter(n => !unit.owner.discoveredTiles.has(`${n.q},${n.r}`) && !n.terrain.impassable);

        const target = undiscovered.length > 0
            ? undiscovered[Math.floor(Math.random() * undiscovered.length)]
            : neighbors.find(n => !n.terrain.impassable);

        if (target) {
            this.handleHexClick(target.q, target.r);
        } else {
            unit.movementPoints = 0; // Stuck
            this.ui.notify('Unit cannot move further');
        }
    }

    collectVillageReward(player) {
        const rewards = [
            { name: 'Gold', value: 50, apply: p => p.gold += 50 },
            { name: 'Large Map', value: 0, apply: p => p.updateDiscovery(this.selectedEntity.q, this.selectedEntity.r, 8) },
            {
                name: 'Survivors', value: 0, apply: p => {
                    const city = p.cities[0];
                    if (city) city.population++;
                }
            },
            {
                name: 'Advanced Weaponry', value: 0, apply: p => {
                    new Unit(UnitType.ARCHER, this.selectedEntity.q, this.selectedEntity.r, p);
                }
            }
        ];

        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        reward.apply(player);
        this.ui.notify(`Tribal Village rewarded you with: ${reward.name}!`);
        this.ui.updateHUD(player);
    }

    captureCity(city, newOwner) {
        const oldOwner = city.owner;
        oldOwner.cities = oldOwner.cities.filter(c => c !== city);
        city.owner = newOwner;
        newOwner.cities.push(city);

        // Convert territory
        city.territory.forEach(key => {
            const tile = this.worldMap.getTile(...key.split(',').map(Number));
            if (tile) tile.owner = newOwner;
        });

        this.ui.notify(`CITY CAPTURED! ${city.name} is now yours.`);
        this.ui.updateHUD(newOwner);
    }

    checkForMeetings(player) {
        this.players.forEach(other => {
            if (player === other || player.metPlayers.has(other.id)) return;

            // Check if any of player's units are near other's units/cities
            const isNear = player.units.some(u => {
                return other.units.some(ou => this.worldMap.getDistance(u.q, u.r, ou.q, ou.r) <= 2) ||
                    other.cities.some(oc => this.worldMap.getDistance(u.q, u.r, oc.q, oc.r) <= 3);
            });

            if (isNear) {
                player.metPlayers.add(other.id);
                other.metPlayers.add(player.id);
                this.ui.showDiplomacy(other);
            }
        });
    }

    async endTurn() {
        const player = this.getCurrentPlayer();

        // Reset and update current player
        player.units.forEach(u => u.resetTurn());
        player.cities.forEach(c => c.update());
        player.updateYields();

        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const nextPlayer = this.getCurrentPlayer();

        if (nextPlayer instanceof AIPlayer) {
            this.isAiTurn = true;
            this.ui.notify(`${nextPlayer.name}'s turn...`);
            await new Promise(resolve => setTimeout(resolve, 800)); // Pause for dramatic effect
            nextPlayer.takeTurn(this);
            this.endTurn(); // Recursive call for next AI or Player
        } else {
            this.isAiTurn = false;
            this.turn++;
            this.spawnBarbarians();
            this.checkVictory(nextPlayer);
            this.ui.updateHUD(nextPlayer);
            this.ui.notify(`Turn ${this.turn} started`);
        }
    }

    checkVictory(player) {
        if (this.victoryReached) return;

        // Science Victory
        if (player.unlockedTechs.size >= 10) { // Should be all techs
            this.handleVictory(player, 'SCIENCE');
        }

        // Score Victory
        if (this.turn >= 200) {
            const winner = this.players.reduce((a, b) => this.getScore(a) > this.getScore(b) ? a : b);
            this.handleVictory(winner, 'SCORE');
        }
    }

    getScore(player) {
        return (player.cities.length * 50) + (player.units.length * 10) + (player.unlockedTechs.size * 20) + (player.gold / 10);
    }

    handleVictory(player, type) {
        this.victoryReached = true;
        this.ui.showVictoryModal(player, type);
    }

    spawnBarbarians() {
        const barbarianPlayer = this.players[2];
        if (this.turn % 5 === 0) {
            const tiles = Array.from(this.worldMap.tiles.values());
            const possibleSpawns = tiles.filter(t =>
                !this.players[0].discoveredTiles.has(`${t.q},${t.r}`) &&
                t.terrain.name !== 'Ocean' &&
                t.terrain.name !== 'Mountain'
            );

            if (possibleSpawns.length > 0) {
                const spawnTile = possibleSpawns[Math.floor(Math.random() * possibleSpawns.length)];
                new Unit(UnitType.WARRIOR, spawnTile.q, spawnTile.r, barbarianPlayer);
                this.ui.notify('BARBARIANS SPOTTED!');
            }
        }

        // AI Move & Attack
        barbarianPlayer.units.forEach(u => {
            const nearestCity = this.players[0].cities[0];
            if (nearestCity) {
                const dist = Math.max(Math.abs(u.q - nearestCity.q), Math.abs(u.r - nearestCity.r));

                // Attack if adjacent
                if (dist <= 1) {
                    const targetCity = this.players[0].cities.find(c => Math.max(Math.abs(u.q - c.q), Math.abs(u.r - c.r)) <= 1);
                    if (targetCity) {
                        targetCity.population = Math.max(1, targetCity.population - 1);
                        this.ui.notify(`Barbarians are raiding ${targetCity.name}!`);
                        u.movementPoints = 0;
                        return;
                    }
                }

                const neighbors = this.worldMap.getNeighbors(u.q, u.r);
                let best = neighbors[0];
                let minDist = 999;
                neighbors.forEach(n => {
                    const d = Math.max(Math.abs(n.q - nearestCity.q), Math.abs(n.r - nearestCity.r));
                    if (d < minDist) {
                        minDist = d;
                        best = n;
                    }
                });
                if (best) u.move(best.q, best.r, 1);
            }
        });
    }

    resolveCombat(attacker, defender) {
        const attackerTile = this.worldMap.getTile(attacker.q, attacker.r);
        const defenderTile = this.worldMap.getTile(defender.q, defender.r);

        const result = CombatSystem.resolveCombat(attacker, defender, attackerTile, defenderTile);

        this.ui.notify(`Combat! ${attacker.type.name} vs ${defender.type.name}`);

        if (result.killed.attacker) {
            attacker.owner.units = attacker.owner.units.filter(u => u !== attacker);
            this.selectedEntity = null;
            this.ui.notify(`${attacker.type.name} destroyed!`);
        }
        if (result.killed.defender) {
            defender.owner.units = defender.owner.units.filter(u => u !== defender);
            this.ui.notify(`${defender.type.name} defeated!`);
        }
    }

    loop() {
        this.renderer.draw();

        if (this.selectedEntity instanceof Unit) {
            this.renderer.ctx.save();
            for (const key of this.reachableTiles.keys()) {
                const [q, r] = key.split(',').map(Number);
                const tile = this.worldMap.getTile(q, r);
                if (tile) this.renderer.drawHighlight(tile, 'rgba(88, 166, 255, 0.15)');
            }
            this.renderer.ctx.restore();
        }

        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
