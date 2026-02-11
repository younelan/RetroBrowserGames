import * as THREE from 'three';
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
import { DiplomacySystem } from './systems/Diplomacy.js';

class Game {
    constructor(config = {}) {
        window.game = this;
        this.canvas = document.getElementById('game-canvas');
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = size;
        this.canvas.height = size;

        // Expose types
        this.UnitType = UnitType;
        this.BuildingType = BuildingType;
        this.TechnologyData = TechnologyData;
        this.TerrainType = TerrainType;
        this.FeatureType = FeatureType;
        this.ResourceType = ResourceType;
        this.WonderType = WonderType;

        this.turn = 1;
        this.gameSpeed = config.gameSpeed || 'standard';
        this.mapWidth = config.mapWidth || 60;
        this.mapHeight = config.mapHeight || 60;
        this.numAI = config.numAI || 3;

        // Create players
        const civs = [
            { name: 'Player One', color: '#58a6ff' },
            { name: 'Roman Empire', color: '#ff6b6b' },
            { name: 'Egyptian Empire', color: '#ffd43b' },
            { name: 'Greek Empire', color: '#69db7c' },
            { name: 'Chinese Empire', color: '#da77f2' },
            { name: 'Persian Empire', color: '#ff922b' }
        ];

        this.players = [new Player(0, civs[0].name, civs[0].color)];
        for (let i = 1; i <= this.numAI; i++) {
            this.players.push(new AIPlayer(i, civs[i].name, civs[i].color));
        }

        // Barbarian player — always last, not a real civilization
        this.barbarianPlayer = new AIPlayer(99, 'Barbarians', '#888888');
        this.barbarianPlayer.isBarbarian = true;
        this.players.push(this.barbarianPlayer);

        this.currentPlayerIndex = 0;
        this.isAiTurn = false;
        this.wondersBuilt = new Set();
        this.victoryReached = false;

        // Systems
        this.worldMap = new WorldMap(this.mapWidth, this.mapHeight);
        this.camera = new Camera(this.canvas, this.worldMap);
        this.renderer = new Renderer(this.canvas, this.camera, this.worldMap);
        this.techTree = new TechTree();
        this.diplomacy = new DiplomacySystem();

        // UI (created after systems)
        this.ui = new UIManager(this);

        this.selectedEntity = null;
        this.reachableTiles = new Map();
        this.hoveredTile = null;

        // Raycaster for 3D hex picking
        this.raycaster = new THREE.Raycaster();

        // Combat effects
        this.combatEffects = [];

        // Click tracking
        this.mouseDownPos = null;
        this.isDragging = false;

        // Set barbarians at war with all civilizations
        for (const p of this.players) {
            if (p !== this.barbarianPlayer) {
                this.diplomacy.declareWar(this.barbarianPlayer, p);
            }
        }

        // Initial Setup
        this.spawnInitialUnits();
        this.autoAssignResearch(this.getCurrentPlayer());
        this.setupEvents();
        this.players.forEach(p => p.updateVisibility());
        this.ui.updateHUD(this.getCurrentPlayer());

        // Center on first unit
        if (this.players[0].units.length > 0) {
            const u = this.players[0].units[0];
            this.camera.jumpTo(u.q, u.r);
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
        const startLocations = this.worldMap.startLocations || [];

        this.players.forEach((player, index) => {
            if (player.isBarbarian) return; // Skip barbarian player
            let startTile = startLocations[index];

            if (!startTile) {
                const tiles = Array.from(this.worldMap.tiles.values());
                startTile = tiles.find(t =>
                    t.terrain.name === 'Grassland' && !t.terrain.impassable &&
                    (t.feature.name === 'None' || t.feature.name === 'Forest')
                );
                if (!startTile) startTile = tiles.find(t => !t.terrain.impassable && t.terrain.name !== 'Ocean');
            }

            if (startTile) {
                new Unit(UnitType.SETTLER, startTile.q, startTile.r, player);
                const neighbors = this.worldMap.getNeighbors(startTile.q, startTile.r);
                const safe = neighbors.filter(n => 
                    !n.terrain.impassable && 
                    n.terrain.name !== 'Ocean' && 
                    n.terrain.name !== 'Coast'
                );
                
                // Place warrior on first safe neighbor
                if (safe.length > 0) {
                    new Unit(UnitType.WARRIOR, safe[0].q, safe[0].r, player);
                } else {
                    new Unit(UnitType.WARRIOR, startTile.q, startTile.r, player);
                }
                
                // Place scout on second safe neighbor, or same as warrior if only one available
                if (safe.length > 1) {
                    new Unit(UnitType.SCOUT, safe[1].q, safe[1].r, player);
                } else if (safe.length > 0) {
                    new Unit(UnitType.SCOUT, safe[0].q, safe[0].r, player);
                } else {
                    new Unit(UnitType.SCOUT, startTile.q, startTile.r, player);
                }
                
                player.updateDiscovery(startTile.q, startTile.r, 5);
            }
        });
        
        // Recreate features after units are spawned to exclude unit positions
        this.renderer.createFeatures();
        this.renderer.createResources();
    }

    spawnUnit(type, q, r, owner) {
        let targetQ = q;
        let targetR = r;

        const allUnits = this.players.flatMap(p => p.units);
        const targetTile = this.worldMap.getTile(q, r);
        const occupied = allUnits.some(u => u.q === q && u.r === r);
        const isWater = targetTile && (targetTile.terrain.name === 'Ocean' || targetTile.terrain.name === 'Coast');

        if (occupied || isWater) {
            const neighbors = this.worldMap.getNeighbors(q, r);
            const empty = neighbors.find(n =>
                !allUnits.some(u => u.q === n.q && u.r === n.r) && 
                !n.terrain.impassable &&
                n.terrain.name !== 'Ocean' &&
                n.terrain.name !== 'Coast'
            );
            if (empty) {
                targetQ = empty.q;
                targetR = empty.r;
            }
        }

        return new Unit(type, targetQ, targetR, owner);
    }

    centerOn(target) {
        this.camera.centerOn(target.q, target.r);
    }

    resize() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.camera.resize(this.canvas.width, this.canvas.height);
        this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    // ====================================================================
    //  EVENT HANDLING (Three.js raycasting for hex picking)
    // ====================================================================

    setupEvents() {
        window.addEventListener('resize', () => this.resize());

        // Click detection: track mousedown position to distinguish click from drag
        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.button === 0) {
                this.mouseDownPos = { x: e.clientX, y: e.clientY };
                this.isDragging = false;
            }
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.mouseDownPos) {
                const dx = Math.abs(e.clientX - this.mouseDownPos.x);
                const dy = Math.abs(e.clientY - this.mouseDownPos.y);
                if (dx > 5 || dy > 5) this.isDragging = true;
            }

            // Hover tooltip
            if (!this.mouseDownPos) {
                const hex = this.getHexAtScreen(e.clientX, e.clientY);
                if (hex) {
                    this.hoveredTile = hex;
                    this.handleHexHover(hex.q, hex.r, e.clientX, e.clientY);
                } else {
                    this.hoveredTile = null;
                    this.ui.hideTooltip();
                }
            }
        });

        this.canvas.addEventListener('pointerup', (e) => {
            if (e.button === 0 && !this.isDragging && this.mouseDownPos) {
                const hex = this.getHexAtScreen(e.clientX, e.clientY);
                if (hex) {
                    this.handleHexClick(hex.q, hex.r);
                }
            }
            this.mouseDownPos = null;
            this.isDragging = false;
        });

        // Right click to deselect
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Don't deselect if we're using OrbitControls right-click rotation
            // Only deselect on quick right-click (not drag)
        });

        // Minimap click
        const mm = document.getElementById('minimap-canvas');
        if (mm) {
            mm.addEventListener('mousedown', (e) => {
                const rect = mm.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const r = (y / mm.height) * this.worldMap.height;
                const q = (x / mm.width) * this.worldMap.width - Math.floor(r / 2);
                this.camera.centerOn(Math.round(q), Math.round(r));
            });
        }
    }

    getHexAtScreen(screenX, screenY) {
        return this.camera.screenToHex(screenX, screenY, this.raycaster, this.renderer.hexMeshes);
    }

    // ====================================================================
    //  HEX INTERACTION
    // ====================================================================

    handleHexHover(q, r, x, y) {
        const tile = this.worldMap.getTile(q, r);
        if (!tile) { this.ui.hideTooltip(); return; }

        // ALWAYS show tooltips from human player's perspective
        const player = this.players[0];
        if (!player.discoveredTiles.has(`${q},${r}`)) { this.ui.hideTooltip(); return; }

        let content = `<strong>${tile.terrain.name}</strong>`;
        if (tile.feature.name !== 'None') content += ` <em>(${tile.feature.name})</em>`;
        if (tile.resource.name !== 'None') content += `<br><span style="color:var(--gold)">${tile.resource.icon} ${tile.resource.name}</span>`;
        if (tile.improvement) content += `<br><span style="color:var(--food)">${tile.improvement.icon} ${tile.improvement.name}</span>`;
        if (tile.hasRoad) content += `<br><span style="color:var(--text-dim)">Road</span>`;

        const yields = tile.getYield();
        content += `<br><span style="font-size:0.7rem;color:var(--text-dim)">F:${yields.food} P:${yields.production} G:${yields.gold}</span>`;

        if (tile.getDefenseBonus() > 0) content += `<br><span style="font-size:0.7rem;color:#69db7c">Defense: +${Math.round(tile.getDefenseBonus() * 100)}%</span>`;

        const city = this.players.flatMap(p => p.cities).find(c => c.q === q && c.r === r);
        if (city) content += `<br><hr>City: ${city.name} (${city.owner.name})`;

        const unit = this.players.flatMap(p => p.units).find(u => u.q === q && u.r === r);
        if (unit) content += `<br><hr>${unit.type.icon} ${unit.type.name} - ${unit.owner.name}<br>HP: ${Math.round(unit.health)}% | STR: ${unit.type.strength}`;

        if (tile.owner) content += `<br><span style="font-size:0.7rem;color:${tile.owner.color}">Territory: ${tile.owner.name}</span>`;

        this.ui.showTooltip(content, x, y);
    }

    handleHexClick(q, r) {
        // Block all interactions during AI turns
        if (this.isAiTurn) return;
        
        const tile = this.worldMap.getTile(q, r);
        if (!tile) return;

        // ALWAYS use human player for interactions, NEVER AI
        const player = this.players[0];

        // Movement / Combat
        if (this.selectedEntity instanceof Unit && this.reachableTiles.has(`${q},${r}`)) {
            const cost = this.reachableTiles.get(`${q},${r}`);

            // Combat check
            const enemy = this.players.flatMap(p => p.units).find(u => u.q === q && u.r === r && u.owner !== player);
            if (enemy) {
                if (this.selectedEntity.type.category === 'military') {
                    this.resolveCombat(this.selectedEntity, enemy);
                    this.selectedEntity.movementPoints = 0;
                    this.ui.showSelection(this.selectedEntity);
                    return;
                } else {
                    this.ui.notify('Civilian units cannot attack!', 'error');
                    return;
                }
            }

            // City capture
            const enemyCity = this.players.flatMap(p => p.cities).find(c => c.q === q && c.r === r && c.owner !== player);
            if (enemyCity) {
                if (this.selectedEntity.type.category === 'military') {
                    if (enemyCity.cityHP <= 0) {
                        this.captureCity(enemyCity, player);
                    } else {
                        this.resolveCombat(this.selectedEntity, enemyCity);
                        this.selectedEntity.movementPoints = 0;
                        this.ui.showSelection(this.selectedEntity);
                        return;
                    }
                } else {
                    this.ui.notify('Civilian units cannot capture cities!', 'error');
                    return;
                }
            }

            if (this.selectedEntity.move(q, r, cost)) {
                player.updateDiscovery(q, r, 2);
                player.updateVisibility();

                if (tile && tile.village) {
                    this.collectVillageReward(player);
                    tile.village = false;
                }

                this.checkForMeetings(player);
                this.ui.updateSelection();

                this.reachableTiles = Pathfinding.getReachableTiles(
                    this.worldMap.getTile(this.selectedEntity.q, this.selectedEntity.r),
                    this.worldMap, this.selectedEntity.movementPoints
                );
                this.ui.showSelection(this.selectedEntity);
                return;
            }
        }

        // Ranged attack check
        if (this.selectedEntity instanceof Unit && this.selectedEntity.type.range) {
            const enemy = this.players.flatMap(p => p.units).find(u => u.q === q && u.r === r && u.owner !== player);
            const enemyCity = this.players.flatMap(p => p.cities).find(c => c.q === q && c.r === r && c.owner !== player);
            const target = enemy || enemyCity;

            if (target && CombatSystem.canAttack(this.selectedEntity, q, r)) {
                this.resolveCombat(this.selectedEntity, target);
                this.selectedEntity.attacksThisTurn++;
                if (!this.selectedEntity.type.range) this.selectedEntity.movementPoints = 0;
                this.ui.showSelection(this.selectedEntity);
                return;
            }
        }

        // Select unit
        const unit = player.units.find(u => u.q === q && u.r === r);
        if (unit) {
            this.selectedEntity = unit;
            this.reachableTiles = Pathfinding.getReachableTiles(tile, this.worldMap, unit.movementPoints);
            this.ui.showSelection(unit);
            return;
        }

        // Select city
        const city = player.cities.find(c => c.q === q && c.r === r);
        if (city) {
            this.selectedEntity = city;
            this.reachableTiles = new Map();
            this.ui.showSelection(city);
            return;
        }

        // Select tile / deselect
        this.selectedEntity = { type: 'tile', tile: tile };
        this.reachableTiles = new Map();
        this.ui.showSelection(this.selectedEntity);
    }

    // ====================================================================
    //  ACTIONS
    // ====================================================================

    handleAction(entity, action) {
        const isHumanPlayer = entity.owner === this.players[0];
        
        if (action === 'Settle' && entity instanceof Unit) {
            const cityName = entity.owner.getNextCityName();
            const city = new City(cityName, entity.q, entity.r, entity.owner);
            entity.owner.units = entity.owner.units.filter(u => u !== entity);
            
            // Only update UI for human player
            if (isHumanPlayer) {
                this.selectedEntity = city;
                this.ui.showSelection(city);
                this.ui.notify(`Established the city of ${cityName}!`, 'production');
                this.ui.updateHUD(entity.owner);
            }
            
            entity.owner.updateDiscovery(entity.q, entity.r, 3);
            entity.owner.updateVisibility();
            // Remove trees around the new city and refresh resources
            this.renderer.createFeatures();
            this.renderer.createResources();
        }

        // Worker improvements
        if (entity instanceof Unit && entity.type.name === 'Worker') {
            const tile = this.worldMap.getTile(entity.q, entity.r);
            const workerActions = {
                'Build Farm': { task: 'Building Farm', turns: 3, cb: () => { tile.improvement = { name: 'Farm', icon: '🚜', food: 2, prod: 0, gold: 0 }; this.ui.notify('Farm built!', 'production'); } },
                'Build Mine': { task: 'Building Mine', turns: 4, cb: () => { tile.improvement = { name: 'Mine', icon: '⚒️', food: 0, prod: 2, gold: 0 }; this.ui.notify('Mine built!', 'production'); } },
                'Build Pasture': { task: 'Building Pasture', turns: 3, cb: () => { tile.improvement = { name: 'Pasture', icon: '🛖', food: 1, prod: 1, gold: 0 }; this.ui.notify('Pasture built!', 'production'); } },
                'Build Road': { task: 'Building Road', turns: 2, cb: () => { tile.hasRoad = true; this.ui.notify('Road built!', 'production'); } },
                'Build Trading Post': { task: 'Building Trading Post', turns: 3, cb: () => { tile.improvement = { name: 'Trading Post', icon: '🏪', food: 0, prod: 0, gold: 3 }; this.ui.notify('Trading Post built!', 'production'); } },
                'Build Lumber Mill': { task: 'Building Lumber Mill', turns: 3, cb: () => { tile.improvement = { name: 'Lumber Mill', icon: '🪵', food: 0, prod: 2, gold: 0 }; this.ui.notify('Lumber Mill built!', 'production'); } },
                'Build Plantation': { task: 'Building Plantation', turns: 3, cb: () => { tile.improvement = { name: 'Plantation', icon: '🏵️', food: 0, prod: 0, gold: 3 }; this.ui.notify('Plantation built!', 'production'); } },
            };

            const wa = workerActions[action];
            if (wa) {
                entity.task = wa.task;
                entity.workRemaining = wa.turns;
                entity.workCallback = wa.cb;
                entity.movementPoints = 0;
                if (isHumanPlayer) {
                    this.ui.notify(`Worker: ${wa.task} (${wa.turns} turns)`, 'production');
                }
            }

            if (action === 'Harvest Resource' && tile.resource.name !== 'None') {
                const goldGained = 150;
                entity.owner.gold += goldGained;
                if (isHumanPlayer) {
                    this.ui.notify(`Harvested ${tile.resource.name}! (+${goldGained} Gold)`, 'production');
                }
                tile.resource = ResourceType.NONE;
                entity.movementPoints = 0;
            }
            if (action === 'Clear Forest' && tile.feature.name === 'Forest') {
                const city = entity.owner.cities[0];
                if (city) city.productionStored += 30;
                if (isHumanPlayer) {
                    this.ui.notify('Forest Cleared (+30 Production)', 'production');
                }
                tile.feature = FeatureType.NONE;
                entity.movementPoints = 0;
            }
            if (isHumanPlayer) {
                this.ui.showSelection(entity);
            }
        }

        // Great Person actions
        if (entity instanceof Unit && entity.type.category === 'great_person') {
            const tile = this.worldMap.getTile(entity.q, entity.r);
            if (action === 'Academy') {
                tile.improvement = { name: 'Academy', icon: '🎓', food: 0, prod: 0, gold: 0, science: 8 };
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Academy created! (+8 Science)', 'research');
                }
            } else if (action === 'Eureka') {
                entity.owner.science += 200;
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Eureka! (+200 Science)', 'research');
                }
            } else if (action === 'Custom House') {
                tile.improvement = { name: 'Custom House', icon: '🏦', food: 0, prod: 0, gold: 8 };
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Custom House created! (+8 Gold)', 'production');
                }
            } else if (action === 'Trade Mission') {
                entity.owner.gold += 350;
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Trade Mission! (+350 Gold)', 'production');
                }
            } else if (action === 'Manufactory') {
                tile.improvement = { name: 'Manufactory', icon: '🏭', food: 0, prod: 6, gold: 0 };
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Manufactory created! (+6 Production)', 'production');
                }
            } else if (action === 'Rush Wonder') {
                const city = entity.owner.cities.find(c => c.q === entity.q && c.r === entity.r);
                if (city) city.productionStored += 300;
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Great Engineer rushes production! (+300)', 'production');
                }
            } else if (action === 'Citadel') {
                tile.improvement = { name: 'Citadel', icon: '🏰', food: 0, prod: 0, gold: 0 };
                tile.owner = entity.owner;
                entity.owner.units = entity.owner.units.filter(u => u !== entity);
                if (isHumanPlayer) {
                    this.ui.notify('Citadel created! (claims territory)', 'combat');
                }
            }
            if (isHumanPlayer && this.selectedEntity === entity) {
                this.selectedEntity = null;
                this.ui.hideSelection();
            }
        }

        // Military Actions
        if (action === 'Fortify' && entity instanceof Unit) {
            entity.isFortified = true;
            entity.movementPoints = 0;
            entity.task = 'Fortified';
            if (isHumanPlayer) {
                this.ui.notify('Unit Fortified! (+50% Defense) Defensive barricades constructed.', 'combat');
                this.ui.showSelection(entity);
            }
            // Force visual update by recreating the sprite
            this.renderer.updateUnits(this);
        }
        if (action === 'Skip Turn' && entity instanceof Unit) {
            entity.movementPoints = 0;
            entity.task = 'Sentry';
            if (isHumanPlayer) {
                this.ui.showSelection(entity);
            }
        }
        if (action === 'Explore' && entity instanceof Unit) {
            this.autoMove(entity);
        }
        if (action === 'Upgrade' && entity instanceof Unit) {
            const target = entity.getUpgradeType();
            if (target && entity.canUpgrade()) {
                const cost = entity.getUpgradeCost();
                entity.upgrade();
                this.ui.notify(`Upgraded to ${target.name}! (-${cost} Gold)`, 'production');
                this.ui.showSelection(entity);
                this.ui.updateHUD(this.getCurrentPlayer());
            } else {
                this.ui.notify('Cannot upgrade here!', 'warning');
            }
        }

        // City Production
        if (action.startsWith('Build ') && entity instanceof City) {
            const name = action.substring(6);
            const unitType = Object.values(this.UnitType).find(u => u.name === name);
            const buildingType = Object.values(this.BuildingType).find(b => b.name === name);

            if (unitType) {
                if (unitType.resourceRequired) {
                    if (entity.owner.strategicResources[unitType.resourceRequired] <= 0) {
                        this.ui.notify(`Need ${unitType.resourceRequired} to build ${name}!`, 'error');
                        return;
                    }
                }
                entity.addToQueue(unitType);
                this.ui.notify(`Queued ${name}`, 'production');
            } else if (buildingType) {
                entity.addToQueue(buildingType);
                this.ui.notify(`Queued ${name}`, 'production');
            } else if (name === 'Wealth' || name === 'Research') {
                entity.addToQueue({ name, cost: 0, icon: name === 'Wealth' ? '💰' : '🔬' });
                this.ui.notify(`City focus set to ${name}`, 'production');
            }
        }
    }

    // ====================================================================
    //  EXPLORATION & VILLAGES
    // ====================================================================

    autoMove(unit) {
        const neighbors = this.worldMap.getNeighbors(unit.q, unit.r);
        const undiscovered = neighbors.filter(n =>
            !unit.owner.discoveredTiles.has(`${n.q},${n.r}`) && !n.terrain.impassable && n.terrain.name !== 'Ocean'
        );

        const target = undiscovered.length > 0
            ? undiscovered[Math.floor(Math.random() * undiscovered.length)]
            : neighbors.find(n => !n.terrain.impassable && n.terrain.name !== 'Ocean');

        if (target) {
            unit.move(target.q, target.r, 1);
            unit.owner.updateDiscovery(target.q, target.r, 2);
            unit.owner.updateVisibility();
        } else {
            unit.movementPoints = 0;
        }
    }

    collectVillageReward(player) {
        const rewards = [
            { name: 'Gold', apply: p => { p.gold += 80; } },
            { name: 'Large Map', apply: p => p.updateDiscovery(this.selectedEntity.q, this.selectedEntity.r, 8) },
            { name: 'Survivors', apply: p => { const city = p.cities[0]; if (city) city.population++; } },
            { name: 'Free Warrior', apply: p => new Unit(UnitType.WARRIOR, this.selectedEntity.q, this.selectedEntity.r, p) },
            { name: 'Technology Boost', apply: p => { p.science += 40; } },
            { name: 'Cultural Artifacts', apply: p => { p.culture += 30; } }
        ];

        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        reward.apply(player);
        this.ui.notify(`Tribal Village: ${reward.name}!`, 'diplomacy');
        this.ui.updateHUD(player);
    }

    // ====================================================================
    //  COMBAT & CITY CAPTURE
    // ====================================================================

    captureCity(city, newOwner) {
        const oldOwner = city.owner;
        oldOwner.cities = oldOwner.cities.filter(c => c !== city);
        city.owner = newOwner;
        newOwner.cities.push(city);

        city.territory.forEach(key => {
            const tile = this.worldMap.getTile(...key.split(',').map(Number));
            if (tile) tile.owner = newOwner;
        });

        city.cityHP = city.maxCityHP;
        city.population = Math.max(1, Math.floor(city.population / 2));

        // Only show UI if human player is involved
        const isHumanPlayer = newOwner === this.players[0] || oldOwner === this.players[0];
        if (isHumanPlayer) {
            this.ui.notify(`CITY CAPTURED! ${city.name} is now ${newOwner === this.players[0] ? 'yours' : 'controlled by ' + newOwner.name}.`, 'combat');
            this.ui.updateHUD(this.players[0]);
        }

        if (oldOwner.cities.length === 0) {
            if (isHumanPlayer) {
                this.ui.notify(`${oldOwner.name} has been eliminated!`, 'combat');
            }
            this.checkVictory(newOwner);
        }
    }

    resolveCombat(attacker, defender) {
        const attackerTile = this.worldMap.getTile(attacker.q, attacker.r);
        const defenderTile = this.worldMap.getTile(defender.q || defender.q, defender.r || defender.r);

        const result = CombatSystem.resolveCombat(attacker, defender, attackerTile, defenderTile);

        // Combat effect
        if (this.renderer.addCombatEffect) {
            this.renderer.addCombatEffect(defender.q, defender.r, '#ff4444');
        }

        // Only show notifications if human player is involved
        const isHumanInvolved = attacker.owner === this.players[0] || defender.owner === this.players[0];
        
        const defName = defender.isCity ? defender.name : defender.type.name;
        if (isHumanInvolved) {
            this.ui.notify(`Combat! ${attacker.type.name} vs ${defName} (-${result.defenderDamage} / -${result.attackerDamage})`, 'combat');
        }

        if (result.killed.attacker) {
            attacker.owner.units = attacker.owner.units.filter(u => u !== attacker);
            if (attacker.owner === this.players[0]) {
                this.selectedEntity = null;
            }
            if (isHumanInvolved) {
                this.ui.notify(`${attacker.type.name} destroyed!`, 'combat');
            }
        }
        if (result.killed.defender) {
            if (defender.isCity) {
                if (isHumanInvolved) {
                    this.ui.notify(`${defender.name} defenses destroyed! Move in to capture!`, 'combat');
                }
            } else {
                defender.owner.units = defender.owner.units.filter(u => u !== defender);
                if (isHumanInvolved) {
                    this.ui.notify(`${defName} defeated!`, 'combat');
                }
            }
        }
    }

    // ====================================================================
    //  DIPLOMACY & MEETINGS
    // ====================================================================

    checkForMeetings(player) {
        this.players.forEach(other => {
            if (player === other || player.metPlayers.has(other.id)) return;

            const isNear = player.units.some(u => {
                return other.units.some(ou => this.worldMap.getDistance(u.q, u.r, ou.q, ou.r) <= 2) ||
                    other.cities.some(oc => this.worldMap.getDistance(u.q, u.r, oc.q, oc.r) <= 3);
            });

            if (isNear) {
                player.metPlayers.add(other.id);
                other.metPlayers.add(player.id);
                // Only show diplomacy UI if it's the HUMAN player meeting someone
                if (player === this.players[0]) {
                    this.ui.showDiplomacy(other);
                }
            }
        });
    }

    // ====================================================================
    //  TURN MANAGEMENT
    //  
    //  CRITICAL ARCHITECTURE:
    //  - UI/Camera/Selection: ALWAYS from human player (players[0]) perspective
    //  - Rendering: ALWAYS shows all visible units based on fog of war
    //  - During AI turns: Game state updates but NO UI/camera changes
    //  - Turn cycling only affects who can take actions, not what's displayed
    // ====================================================================

    async endTurn() {
        if (this.isAiTurn) return;

        const player = this.getCurrentPlayer();
        player.units.forEach(u => u.resetTurn());
        player.cities.forEach(c => c.update());
        player.updateVisibility();
        player.updateYields();

            // Auto-explore: units with task 'Explore' move one tile automatically on end-turn
            try {
                for (const u of [...player.units]) {
                    if (u.task === 'Explore' && u.movementPoints > 0) {
                        this.autoMove(u);
                    }
                }
            } catch (e) {
                // ignore errors during auto-move
            }

        // Clear selection when ending turn to prevent viewing/controlling other civs' entities
        this.selectedEntity = null;
        this.reachableTiles = new Map();

        // Loop through all AI players until we return to the human player
        while (true) {
            // Cycle to next player, skipping barbarians
            do {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            } while (this.players[this.currentPlayerIndex].isBarbarian);
            
            const nextPlayer = this.getCurrentPlayer();

            if (nextPlayer instanceof AIPlayer) {
                // AI turn - process it silently without UI updates
                this.isAiTurn = true;
                await new Promise(resolve => setTimeout(resolve, 100));
                nextPlayer.takeTurn(this);
                // Loop continues to next player
            } else {
                // It's the human player's turn again - exit the loop
                this.isAiTurn = false;
                this.turn++;

                this.diplomacy.updateTurn();
                this.spawnBarbarians();
                this.checkVictory(nextPlayer);

                if (this.turn % 10 === 0) {
                    this.autoSave();
                }

                this.ui.updateHUD(nextPlayer);
                this.ui.hideSelection(); // Hide panel since selection was cleared
                this.ui.notify(`Turn ${this.turn}`, 'info');

                const newEra = this.techTree.getCurrentEra(nextPlayer.unlockedTechs);
                if (newEra !== nextPlayer.currentEra) {
                    nextPlayer.currentEra = newEra;
                    this.ui.showEraNotification(newEra);
                }
                
                break; // Exit the loop - human's turn now
            }
        }
    }

    // ====================================================================
    //  VICTORY CONDITIONS
    // ====================================================================

    checkVictory(player) {
        if (this.victoryReached) return;

        const playersWithCities = this.players.filter(p => p.cities.length > 0);
        if (playersWithCities.length === 1) {
            this.handleVictory(playersWithCities[0], 'DOMINATION');
            return;
        }

        const totalTechs = Object.keys(TechnologyData).length;
        if (player.unlockedTechs.size >= totalTechs) {
            this.handleVictory(player, 'SCIENCE');
            return;
        }

        if (player.totalCulture >= 1000) {
            this.handleVictory(player, 'CULTURAL');
            return;
        }

        if (this.turn >= 300) {
            const winner = this.players.reduce((a, b) => a.calculateScore() > b.calculateScore() ? a : b);
            this.handleVictory(winner, 'SCORE');
        }
    }

    getScore(player) {
        return player.calculateScore();
    }

    handleVictory(player, type) {
        this.victoryReached = true;
        this.ui.showVictoryModal(player, type);
    }

    // ====================================================================
    //  BARBARIANS
    // ====================================================================

    spawnBarbarians() {
        if (this.turn % 7 === 0 && this.turn > 5) {
            const tiles = Array.from(this.worldMap.tiles.values());
            const possibleSpawns = tiles.filter(t =>
                !this.players[0].discoveredTiles.has(`${t.q},${t.r}`) &&
                !t.terrain.impassable && t.terrain.name !== 'Ocean' && t.terrain.name !== 'Coast'
            );

            if (possibleSpawns.length > 0) {
                let barbPlayer = this.players.find(p => p.name === 'Barbarians');
                if (!barbPlayer) {
                    barbPlayer = new AIPlayer(99, 'Barbarians', '#888888');
                }

                const spawnTile = possibleSpawns[Math.floor(Math.random() * possibleSpawns.length)];
                new Unit(UnitType.WARRIOR, spawnTile.q, spawnTile.r, barbPlayer);
            }
        }
    }

    // ====================================================================
    //  UNIT CYCLING
    // ====================================================================

    getNextUnit() {
        // ALWAYS get human player's units, NEVER AI units
        const player = this.players[0];
        const unitsWithMoves = player.units.filter(u => u.movementPoints > 0 && u.task === 'Ready');
        if (unitsWithMoves.length === 0) return null;

        // If current selection is a unit with moves, get the next one
        if (this.selectedEntity && this.selectedEntity.type && this.selectedEntity.type.name) {
            const idx = unitsWithMoves.indexOf(this.selectedEntity);
            if (idx >= 0) {
                // Return next unit in the list, wrapping around
                return unitsWithMoves[(idx + 1) % unitsWithMoves.length];
            }
        }
        // Otherwise return first unit with moves
        return unitsWithMoves[0];
    }

    selectNextUnit() {
        // Never allow this during AI turns
        if (this.isAiTurn) return;
        
        const next = this.getNextUnit();
        if (next) {
            this.selectedEntity = next;
            this.centerOn(next);
            const tile = this.worldMap.getTile(next.q, next.r);
            this.reachableTiles = Pathfinding.getReachableTiles(tile, this.worldMap, next.movementPoints);
            this.ui.showSelection(next);
        }
    }

    // ====================================================================
    //  SAVE / LOAD
    // ====================================================================

    autoSave() {
        try {
            const saveData = this.serialize();
            localStorage.setItem('civ_autosave', JSON.stringify(saveData));
        } catch (e) {
            console.warn('Auto-save failed:', e);
        }
    }

    serialize() {
        return {
            turn: this.turn,
            timestamp: Date.now(),
            playerData: this.players.map(p => ({
                id: p.id, name: p.name, gold: p.gold, science: p.science,
                cities: p.cities.length, units: p.units.length,
                techs: Array.from(p.unlockedTechs)
            }))
        };
    }

    // ====================================================================
    //  MAIN LOOP
    // ====================================================================

    loop() {
        this.camera.update();

        // Pass game state to renderer
        this.renderer.draw(this);

        requestAnimationFrame(() => this.loop());
    }
}

// ========================================================================
//  STARTUP
// ========================================================================

window.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        window.startGame = (config) => {
            startScreen.style.display = 'none';
            window.game = new Game(config);
        };
    } else {
        window.game = new Game();
    }
});
