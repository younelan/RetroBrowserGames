/**
 * NeoCity City Builder Engine
 */
import { generateTerrain } from './terrain.js';
import { draw, screenToGrid } from './renderer.js';
import { processSimulation } from './simulation.js';
import { initThree, updateThree, getGridFromScreen, updateHighlighter, getVisualHeight } from './three_renderer.js';

class CityBuilder {
    constructor() {
        this.gridSize = 32;
        this.cellSize = 40;
        this.money = 100000;
        this.population = 0;
        this.date = { month: 0, year: 1 };

        // Grid with terrain/elevation
        this.grid = Array(this.gridSize).fill(null)
            .map(() => Array(this.gridSize).fill(null)
                .map(() => ({ type: 'none', level: 0, terrain: 'grass', elevation: 0 })));

        this.demand = { residential: 50, commercial: 50, industrial: 50, park: 0 };
        this.selectedTool = 'select';
        this.isDirty = true; // Track grid changes for renderer optimization

        this.canvas = document.getElementById('viewport');
        // Legacy 2D context no longer needed but keeping placeholder to avoid errors if referenced elsewhere
        this.ctx = null;

        this.camera = { x: 0, y: 0, zoom: 1 };
        this.mouse = { x: 0, y: 0, gridX: 0, gridY: 0 };
        this.happiness = 50;

        // generate terrain and initialize
        generateTerrain(this.grid, this.gridSize);
        this.init();

        // Initialize 3D immediately
        this.enableThree();
    }

    enableThree() {
        try {
            initThree(this);
            this.showNotification('Three.js enabled', 'info');

            // Re-attach listeners to the new canvas directly to ensure bubbling/blocking issues are bypassed
            if (this._three && this._three.canvas) {
                const c = this._three.canvas;
                c.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                c.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                c.addEventListener('mouseup', () => this.handleMouseUp());
                c.addEventListener('mouseleave', () => this.handleMouseUp());
            }
        } catch (err) {
            console.warn('Three.js init failed:', err);
            this.showNotification('Three.js init failed — staying in 2D', 'error');
        }
    }


    // Note: isometric helpers moved to renderer.js

    init() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.centerCamera();

        // Start Heartbeat
        this.lastHeartbeat = Date.now();
        this.simulationLoop();

        // Start Rendering
        this.renderLoop();
    }



    setupEventListeners() {
        const viewport = document.getElementById('viewport'); // Listen on shared container

        window.addEventListener('resize', () => this.resizeCanvas());

        viewport.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        viewport.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        viewport.addEventListener('mouseup', () => this.handleMouseUp());
        viewport.addEventListener('mouseleave', () => this.handleMouseUp());
        viewport.addEventListener('contextmenu', (e) => e.preventDefault());

        // Zoom with mouse wheel (handled by OrbitControls in 3D)
        viewport.addEventListener('wheel', (e) => {
            // No-op for legacy 2D zoom
        }, { passive: false });

        // Panning Support
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTool = btn.dataset.tool;
            });
        });
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    centerCamera() {
        // Center map for isometric projection
        const mapWidth = this.cellSize * this.gridSize;
        const mapHeight = Math.floor(this.cellSize / 2) * this.gridSize;
        this.camera.x = (this.canvas.width - mapWidth) / 2 + mapWidth / 2;
        this.camera.y = (this.canvas.height - mapHeight) / 2 - 40; // slight offset up
    }

    handleMouseMove(e) {
        // Use viewport rect? The canvas is same size as viewport usually.
        // But let's be safe and use current target or canvas
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (this.isDragging) {
            // No 2D dragging needed
            this.dragStart.x = mx;
            this.dragStart.y = my;
        }

        this.mouse.x = mx;
        this.mouse.y = my;

        // Convert to world coords (account for camera and zoom)
        // Three.js Raycasting only
        if (this._three) {
            // Use anchored raycasting if bulldozing to prevent feedback loop
            const anchorH = (this.isMouseDown && this.selectedTool === 'bulldozer') ? this.bulldozerAnchorH : null;
            const gridPos = getGridFromScreen(this, this.mouse.x, this.mouse.y, anchorH);

            if (gridPos) {
                const changed = this.mouse.gridX !== gridPos.x || this.mouse.gridY !== gridPos.y;

                // Track previous for rotation - always update if move is within 2 tiles to follow direction
                if (changed) {
                    const dx = Math.abs(this.mouse.gridX - gridPos.x);
                    const dy = Math.abs(this.mouse.gridY - gridPos.y);
                    if (dx + dy <= 2) {
                        this.mouse.prevGridX = this.mouse.gridX;
                        this.mouse.prevGridY = this.mouse.gridY;
                    }
                }

                this.mouse.gridX = gridPos.x;
                this.mouse.gridY = gridPos.y;

                // Drag to bulldoze or continuous play
                if (this.isMouseDown && changed) {
                    this.applyTool(this.mouse.gridX, this.mouse.gridY, true); // passing isDragging=true
                }
            } else {
                this.mouse.gridX = -1;
                this.mouse.gridY = -1;
            }
            updateHighlighter(this, this.mouse.gridX, this.mouse.gridY);
        }

        this.updateTooltip();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Space key or middle click or right click for dragging (OrbitControls)
        if (e.button === 1 || e.button === 2) {
            return;
        }

        this.isMouseDown = true;

        if (this.mouse.gridX >= 0 && this.mouse.gridX < this.gridSize &&
            this.mouse.gridY >= 0 && this.mouse.gridY < this.gridSize) {

            // For bulldozer, sample target elevation and VISUAL height
            if (this.selectedTool === 'bulldozer') {
                const cell = this.grid[this.mouse.gridY][this.mouse.gridX];
                this.bulldozerLevel = cell.elevation || 0;
                this.bulldozerAnchorH = getVisualHeight(cell);
            }

            this.applyTool(this.mouse.gridX, this.mouse.gridY, false);
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
        this.isDragging = false;
        this.bulldozerLevel = null;
        this.bulldozerAnchorH = null;
    }

    applyTool(x, y, isDragging = false) {
        const costs = { road: 50, residential: 100, commercial: 150, industrial: 200, park: 120, bulldozer: 20 };
        const tool = this.selectedTool;

        if (tool === 'select') return;

        if (tool === 'bulldozer') {
            const cell = this.grid[y][x];
            const targetElevation = (this.bulldozerLevel !== null) ? this.bulldozerLevel : 0;

            // Check if anything to bulldoze: building OR road OR elevation mismatch
            const hasBuilding = cell.type !== 'none';
            const elevationDiff = cell.elevation !== targetElevation;
            const isHillOrMountain = cell.terrain === 'hill' || cell.terrain === 'mountain';

            if (hasBuilding || elevationDiff || (isHillOrMountain && targetElevation === 0)) {
                this.money -= costs.bulldozer;
                this.grid[y][x].type = 'none';
                this.grid[y][x].level = 0;

                // Level terrain to target
                this.grid[y][x].elevation = targetElevation;

                // Unified terrain type mapping for leveling
                if (targetElevation >= 9) this.grid[y][x].terrain = 'mountain';
                else if (targetElevation >= 7) this.grid[y][x].terrain = 'hill';
                else if (targetElevation >= 2) this.grid[y][x].terrain = 'grass';
                else if (targetElevation >= 1) this.grid[y][x].terrain = 'beach';
                else this.grid[y][x].terrain = 'water';

                if (!isDragging) {
                    this.showNotification("Bulldozed site", "warning");
                }
                this.isDirty = true;
            }
            return;
        }

        if (this.money < costs[tool] || isNaN(this.money)) {
            this.money = Math.max(0, this.money);
            this.showNotification("Not enough funds!", "error");
            return;
        }

        if (this.grid[y][x].type === 'none') {
            // Prevent building on water
            if (this.grid[y][x].terrain === 'water' && tool !== 'road') {
                this.showNotification("Can't build on water!", "error");
                return;
            }
            console.log(`Applying ${tool} at ${x}, ${y}`);
            this.money -= costs[tool];
            this.grid[y][x].type = tool;
            this.grid[y][x].level = tool === 'road' ? 1 : 0;
            this.lastBuiltTile = { x, y };
            this.updateStatsUI();
            this.isDirty = true;
        } else {
            console.log(`Cell at ${x}, ${y} already has type: ${this.grid[y][x].type}`);
        }
    }

    simulationLoop() {
        const now = Date.now();
        if (now - this.lastHeartbeat > 2000) { // Every 2 seconds
            processSimulation(this);
            this.lastHeartbeat = now;
        }
        requestAnimationFrame(() => this.simulationLoop());
    }

    checkRoadAdjacency(x, y) {
        const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];
        return neighbors.some(([nx, ny]) => {
            return nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize &&
                this.grid[ny][nx].type === 'road';
        });
    }

    updateStatsUI() {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        document.getElementById('money-value').textContent = `$${isNaN(this.money) ? 0 : this.money.toLocaleString()}`;
        document.getElementById('population-value').textContent = this.population.toLocaleString();
        document.getElementById('game-date').textContent = `${months[this.date.month]}, YEAR ${this.date.year}`;

        // Demand bars
        document.querySelector('.demand-bar.residential').style.setProperty('--demand-val', `${this.demand.residential}%`);
        document.querySelector('.demand-bar.commercial').style.setProperty('--demand-val', `${this.demand.commercial}%`);
        document.querySelector('.demand-bar.industrial').style.setProperty('--demand-val', `${this.demand.industrial}%`);
    }

    renderLoop() {
        if (this._three) {
            updateThree(this);
        }
        requestAnimationFrame(() => this.renderLoop());
    }

    updateTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (this.mouse.gridX >= 0 && this.mouse.gridX < this.gridSize &&
            this.mouse.gridY >= 0 && this.mouse.gridY < this.gridSize) {
            const cell = this.grid[this.mouse.gridY][this.mouse.gridX];
            tooltip.classList.remove('hidden');
            // tooltip.style.left/top removed to allow CSS positioning (bottom-right)

            let html = `<strong>[${this.mouse.gridX}, ${this.mouse.gridY}]</strong><br>`;
            if (cell.type === 'none') html += "Empty Lot";
            else html += `${cell.type.toUpperCase()} (Lvl ${Math.floor(cell.level)})`;

            tooltip.innerHTML = html;
        } else {
            tooltip.classList.add('hidden');
        }
    }

    showNotification(text, type = 'info') {
        const area = document.getElementById('notification-area');
        const note = document.createElement('div');
        note.className = `notification ${type}`;
        note.textContent = text;
        area.appendChild(note);
        setTimeout(() => note.remove(), 4000);
    }
}

// Initialize on Load
window.addEventListener('load', () => {
    window.game = new CityBuilder();
});
