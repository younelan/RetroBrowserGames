class Match3Game {
    constructor(rows, cols, colors, assetsPath = 'assets') {
        this.rows = rows;
        this.cols = cols;
        this.colors = colors;
        this.assetsPath = assetsPath;
        this.tileSize = 64;
        this.margin = 4;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.cols * (this.tileSize + this.margin) + this.margin;
        this.canvas.height = this.rows * (this.tileSize + this.margin) + this.margin;

        this.board = [];
        this.assets = {};
        this.selectedTile = null;
        this.isAnimating = false;
        this.pendingSpecial = null;

        this.init();
    }

    async init() {
        await this.loadAssets();
        this.initBoard();
        this.requestRender();
        this.setupEventListeners();
    }

    async loadAssets() {
        const assetNames = [...this.colors, 'color-bomb'];
        const loads = assetNames.map(name => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `${this.assetsPath}/${name}.png`;
                img.onload = () => {
                    this.assets[name] = img;
                    resolve();
                };
            });
        });
        await Promise.all(loads);
    }

    initBoard() {
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c] = this.createTileObject(r, c, this.getRandomColor());
            }
        }
        this.checkAndRemoveMatches(true);
    }

    createTileObject(r, c, color, cell_type = 'standard', direction = null) {
        return {
            r, c,
            color,
            cell_type,
            direction,
            x: c * (this.tileSize + this.margin) + this.margin,
            y: r * (this.tileSize + this.margin) + this.margin,
            alpha: 1,
            scale: 1,
            rotation: 0
        };
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        }, { passive: false });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleMouseDown(e) {
        if (this.isAnimating) return;
        const pos = this.getMousePos(e);
        const col = Math.floor(pos.x / (this.tileSize + this.margin));
        const row = Math.floor(pos.y / (this.tileSize + this.margin));

        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.selectedTile = { row, col, startX: pos.x, startY: pos.y };
        }
    }

    handleMouseMove(e) {
        if (!this.selectedTile || this.isAnimating) return;
        const pos = this.getMousePos(e);
        const deltaX = pos.x - this.selectedTile.startX;
        const deltaY = pos.y - this.selectedTile.startY;
        const threshold = this.tileSize / 3;

        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            let tr2 = this.selectedTile.row;
            let tc2 = this.selectedTile.col;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                tc2 += deltaX > 0 ? 1 : -1;
            } else {
                tr2 += deltaY > 0 ? 1 : -1;
            }

            if (tr2 >= 0 && tr2 < this.rows && tc2 >= 0 && tc2 < this.cols) {
                this.swapTiles(this.selectedTile.row, this.selectedTile.col, tr2, tc2);
            }
            this.selectedTile = null;
        }
    }

    handleMouseUp() {
        this.selectedTile = null;
    }

    async swapTiles(r1, c1, r2, c2) {
        this.isAnimating = true;
        const t1 = this.board[r1][c1];
        const t2 = this.board[r2][c2];

        await this.animateSwap(t1, t2);

        this.board[r1][c1] = t2;
        this.board[r2][c2] = t1;
        if (t1) { t1.r = r2; t1.c = c2; }
        if (t2) { t2.r = r1; t2.c = c1; }

        if (t1?.cell_type !== 'standard' || t2?.cell_type !== 'standard') {
            const isT1Special = t1?.cell_type !== 'standard';
            const isT2Special = t2?.cell_type !== 'standard';

            if (isT1Special && isT2Special) {
                await this.handleSpecialCombination(t1, t2);
                this.isAnimating = false;
                return;
            } else if (t1?.cell_type === 'color-bomb' || t2?.cell_type === 'color-bomb') {
                await this.handleColorBombSwap(t1, t2);
                this.isAnimating = false;
                return;
            }
        }

        const matches = this.findMatches();
        if (matches.size === 0) {
            await this.animateSwap(t1, t2);
            this.board[r1][c1] = t1;
            this.board[r2][c2] = t2;
            if (t1) { t1.r = r1; t1.c = c1; }
            if (t2) { t2.r = r2; t2.c = c2; }
        } else {
            await this.processMatches(matches);
        }

        this.isAnimating = false;
    }

    async handleColorBombSwap(t1, t2) {
        const bomb = t1.cell_type === 'color-bomb' ? t1 : t2;
        const target = t1.cell_type === 'color-bomb' ? t2 : t1;

        if (target.cell_type === 'color-bomb') {
            // Two color bombs - clear whole board
            const toRemove = new Set();
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    toRemove.add(`${r},${c}`);
                }
            }
            await this.processMatches(toRemove);
            return;
        }

        const colorToRemove = target.color;
        const toRemove = new Set();
        toRemove.add(`${bomb.r},${bomb.c}`);

        if (target.cell_type === 'striped' || target.cell_type === 'wrapped') {
            // Color bomb + special: convert all of that color to that special type
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c]?.color === colorToRemove) {
                        const tile = this.board[r][c];
                        tile.cell_type = target.cell_type;
                        tile.direction = target.direction || (Math.random() > 0.5 ? 'horizontal' : 'vertical');
                        toRemove.add(`${r},${c}`);
                    }
                }
            }
        } else {
            // Standard color removal
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c]?.color === colorToRemove) {
                        toRemove.add(`${r},${c}`);
                    }
                }
            }
        }
        await this.processMatches(toRemove);
    }

    async handleSpecialCombination(t1, t2) {
        const toRemove = new Set();
        const r = t2.r;
        const c = t2.c;

        if (t1.cell_type === 'striped' && t2.cell_type === 'striped') {
            // Stripe + Stripe: Row and Column
            for (let cc = 0; cc < this.cols; cc++) toRemove.add(`${r},${cc}`);
            for (let rr = 0; rr < this.rows; rr++) toRemove.add(`${rr},${c}`);
        } else if ((t1.cell_type === 'striped' && t2.cell_type === 'wrapped') || (t1.cell_type === 'wrapped' && t2.cell_type === 'striped')) {
            // Stripe + Wrapped: 3 Rows and 3 Columns
            for (let dr = -1; dr <= 1; dr++) {
                const nr = r + dr;
                if (nr >= 0 && nr < this.rows) {
                    for (let cc = 0; cc < this.cols; cc++) toRemove.add(`${nr},${cc}`);
                }
            }
            for (let dc = -1; dc <= 1; dc++) {
                const nc = c + dc;
                if (nc >= 0 && nc < this.cols) {
                    for (let rr = 0; rr < this.rows; rr++) toRemove.add(`${rr},${nc}`);
                }
            }
        } else if (t1.cell_type === 'wrapped' && t2.cell_type === 'wrapped') {
            // Wrapped + Wrapped: 5x5 Area
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        toRemove.add(`${nr},${nc}`);
                    }
                }
            }
        } else if (t1.cell_type === 'color-bomb' || t2.cell_type === 'color-bomb') {
            // This case should be handled by handleColorBombSwap if prioritized correctly, 
            // but just in case, redirect it.
            return this.handleColorBombSwap(t1, t2);
        }

        await this.processMatches(toRemove);
    }

    animateSwap(t1, t2) {
        return new Promise((resolve) => {
            const duration = 200;
            const start = performance.now();
            const x1 = t1.x, y1 = t1.y;
            const x2 = t2.x, y2 = t2.y;

            const step = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const ease = this.easeInOutQuad(progress);

                t1.x = x1 + (x2 - x1) * ease;
                t1.y = y1 + (y2 - y1) * ease;
                t2.x = x2 + (x1 - x2) * ease;
                t2.y = y2 + (y1 - y2) * ease;

                if (progress < 1) requestAnimationFrame(step);
                else {
                    t1.x = x2; t1.y = y2;
                    t2.x = x1; t2.y = y1;
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    findMatches() {
        const toRemove = new Set();
        const horizontalMatches = [];
        const verticalMatches = [];

        // Horizontal matches
        for (let r = 0; r < this.rows; r++) {
            let count = 1;
            for (let c = 1; c <= this.cols; c++) {
                if (c < this.cols && this.board[r][c]?.color === this.board[r][c - 1]?.color && this.board[r][c]?.color) {
                    count++;
                } else {
                    if (count >= 3) {
                        const match = [];
                        for (let k = 0; k < count; k++) {
                            const col = c - 1 - k;
                            toRemove.add(`${r},${col}`);
                            match.push({ r, c: col });
                        }
                        horizontalMatches.push({ tiles: match, length: count, color: this.board[r][c - 1].color });
                    }
                    count = 1;
                }
            }
        }

        // Vertical matches
        for (let c = 0; c < this.cols; c++) {
            let count = 1;
            for (let r = 1; r <= this.rows; r++) {
                if (r < this.rows && this.board[r][c]?.color === this.board[r - 1][c]?.color && this.board[r][c]?.color) {
                    count++;
                } else {
                    if (count >= 3) {
                        const match = [];
                        for (let k = 0; k < count; k++) {
                            const row = r - 1 - k;
                            toRemove.add(`${row},${c}`);
                            match.push({ r: row, c });
                        }
                        verticalMatches.push({ tiles: match, length: count, color: this.board[r - 1][c].color });
                    }
                    count = 1;
                }
            }
        }

        // Identify special tiles
        const handledHoriz = new Set();
        const handledVert = new Set();

        // 1. Color Bombs (5+)
        horizontalMatches.forEach((hm, hIdx) => {
            if (hm.length >= 5) {
                const center = hm.tiles[Math.floor(hm.length / 2)];
                this.queueSpecialTile(center.r, center.c, 'black', 'color-bomb');
                handledHoriz.add(hIdx);
            }
        });
        verticalMatches.forEach((vm, vIdx) => {
            if (vm.length >= 5) {
                const center = vm.tiles[Math.floor(vm.length / 2)];
                this.queueSpecialTile(center.r, center.c, 'black', 'color-bomb');
                handledVert.add(vIdx);
            }
        });

        // 2. Wrapped Candies (L/T shapes - intersection of horiz and vert)
        horizontalMatches.forEach((hm, hIdx) => {
            if (handledHoriz.has(hIdx)) return;
            verticalMatches.forEach((vm, vIdx) => {
                if (handledVert.has(vIdx)) return;
                // Check for intersection
                const intersection = hm.tiles.find(ht => vm.tiles.some(vt => vt.r === ht.r && vt.c === ht.c));
                if (intersection) {
                    this.queueSpecialTile(intersection.r, intersection.c, hm.color, 'wrapped');
                    handledHoriz.add(hIdx);
                    handledVert.add(vIdx);
                }
            });
        });

        // 3. Striped Candies (4)
        horizontalMatches.forEach((hm, hIdx) => {
            if (handledHoriz.has(hIdx)) return;
            if (hm.length === 4) {
                const center = hm.tiles[Math.floor(hm.length / 2)];
                this.queueSpecialTile(center.r, center.c, hm.color, 'striped', 'horizontal');
            }
        });
        verticalMatches.forEach((vm, vIdx) => {
            if (handledVert.has(vIdx)) return;
            if (vm.length === 4) {
                const center = vm.tiles[Math.floor(vm.length / 2)];
                this.queueSpecialTile(center.r, center.c, vm.color, 'striped', 'vertical');
            }
        });

        return toRemove;
    }

    queueSpecialTile(r, c, color, type, direction = null) {
        this.pendingSpecial = { r, c, color, type, direction };
    }

    checkAndRemoveMatches(initial = false) {
        const matches = this.findMatches();
        if (matches.size > 0) {
            if (initial) {
                this.removeAndRefillImmediate(matches);
                return this.checkAndRemoveMatches(true);
            } else {
                this.processMatches(matches);
            }
            return true;
        }
        return false;
    }

    async processMatches(toRemove) {
        this.isAnimating = true;

        let expanded = true;
        while (expanded) {
            expanded = false;
            const currentToRemove = Array.from(toRemove);
            for (const key of currentToRemove) {
                const [r, c] = key.split(',').map(Number);
                const tile = this.board[r][c];
                if (!tile) continue;

                if (tile.cell_type === 'striped') {
                    if (tile.direction === 'horizontal') {
                        for (let cc = 0; cc < this.cols; cc++) {
                            const newKey = `${r},${cc}`;
                            if (!toRemove.has(newKey)) { toRemove.add(newKey); expanded = true; }
                        }
                    } else {
                        for (let rr = 0; rr < this.rows; rr++) {
                            const newKey = `${rr},${c}`;
                            if (!toRemove.has(newKey)) { toRemove.add(newKey); expanded = true; }
                        }
                    }
                } else if (tile.cell_type === 'wrapped') {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                                const newKey = `${nr},${nc}`;
                                if (!toRemove.has(newKey)) { toRemove.add(newKey); expanded = true; }
                            }
                        }
                    }
                }
            }
        }

        await this.animatePop(Array.from(toRemove));

        toRemove.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            this.board[r][c] = null;
        });

        if (this.pendingSpecial) {
            const { r, c, color, type, direction } = this.pendingSpecial;
            this.board[r][c] = this.createTileObject(r, c, color, type, direction);
            this.pendingSpecial = null;
        }

        await this.applyGravity();
        await this.addNewTiles();
        this.checkAndRemoveMatches();
        this.isAnimating = false;
    }

    async animatePop(coords) {
        return new Promise((resolve) => {
            const duration = 250;
            const start = performance.now();
            const tiles = coords.map(k => {
                const [r, c] = k.split(',').map(Number);
                return this.board[r][c];
            }).filter(t => t);

            const step = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);

                tiles.forEach(t => {
                    t.scale = 1 + progress * 0.5;
                    t.alpha = 1 - progress;
                });

                if (progress < 1) requestAnimationFrame(step);
                else resolve();
            };
            requestAnimationFrame(step);
        });
    }

    async applyGravity() {
        const moves = [];
        for (let c = 0; c < this.cols; c++) {
            let emptySpaces = 0;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.board[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    const tile = this.board[r][c];
                    const newR = r + emptySpaces;
                    this.board[newR][c] = tile;
                    this.board[r][c] = null;
                    tile.r = newR;
                    moves.push(this.animateTileTo(tile, newR, c));
                }
            }
        }
        await Promise.all(moves);
    }

    async addNewTiles() {
        const moves = [];
        for (let c = 0; c < this.cols; c++) {
            let emptyCount = 0;
            for (let r = 0; r < this.rows; r++) {
                if (this.board[r][c] === null) emptyCount++;
            }
            for (let r = 0; r < emptyCount; r++) {
                const tile = this.createTileObject(-r - 1, c, this.getRandomColor());
                const targetR = emptyCount - r - 1;
                this.board[targetR][c] = tile;
                tile.r = targetR;
                moves.push(this.animateTileTo(tile, targetR, c, 400 + r * 50));
            }
        }
        await Promise.all(moves);
    }

    animateTileTo(tile, r, c, duration = 400) {
        return new Promise((resolve) => {
            const start = performance.now();
            const startY = tile.y;
            const targetY = r * (this.tileSize + this.margin) + this.margin;

            const step = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const ease = this.easeInOutQuad(progress);

                tile.y = startY + (targetY - startY) * ease;

                if (progress < 1) requestAnimationFrame(step);
                else {
                    tile.y = targetY;
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    }

    removeAndRefillImmediate(toRemove) {
        toRemove.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            this.board[r][c] = this.createTileObject(r, c, this.getRandomColor());
        });
    }

    requestRender() {
        this.render();
        requestAnimationFrame(() => this.requestRender());
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.ctx.fillRect(
                    c * (this.tileSize + this.margin) + this.margin,
                    r * (this.tileSize + this.margin) + this.margin,
                    this.tileSize, this.tileSize
                );
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.board[r][c];
                if (tile) this.drawTile(tile);
            }
        }
    }

    drawTile(tile) {
        const assetName = tile.cell_type === 'color-bomb' ? 'color-bomb' : tile.color;
        const img = this.assets[assetName];
        if (!img) return;

        this.ctx.save();
        this.ctx.globalAlpha = tile.alpha;

        const centerX = tile.x + this.tileSize / 2;
        const centerY = tile.y + this.tileSize / 2;

        this.ctx.translate(centerX, centerY);
        this.ctx.scale(tile.scale, tile.scale);

        if (tile.cell_type === 'striped') {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'white';
            this.ctx.rotate(tile.direction === 'horizontal' ? 0 : Math.PI / 2);
        } else {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = tile.color === 'black' ? 'white' : tile.color;
        }

        this.ctx.drawImage(img, -this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);

        if (tile.cell_type === 'striped') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(-this.tileSize / 2, 0);
            this.ctx.lineTo(this.tileSize / 2, 0);
            this.ctx.stroke();
        } else if (tile.cell_type === 'wrapped') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 6;
            this.ctx.strokeRect(-this.tileSize / 2 + 5, -this.tileSize / 2 + 5, this.tileSize - 10, this.tileSize - 10);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(-this.tileSize / 2 + 5, -this.tileSize / 2 + 5, this.tileSize - 10, this.tileSize - 10);
        }

        this.ctx.restore();
    }
}

