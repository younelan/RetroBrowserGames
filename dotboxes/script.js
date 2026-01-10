class DotsAndBoxes {
    constructor() {
        this.gridSize = 4; // default to 4x4 boxes
        this.currentPlayer = 1; // 1 = human (P1), 2 = human or AI (P2)
        this.scores = { 1: 0, 2: 0 };
        this.lineOwners = {}; // map lineId -> player
        this.boxes = {}; // map boxId -> player
        // read modal defaults if present (script loaded at end of body)
        const vsModal = document.getElementById('modal-vs-computer');
        this.aiEnabled = !!(vsModal && vsModal.checked);

        const pn = document.getElementById('modal-player-name');
        const on = document.getElementById('modal-opponent-name');
        this.playerName = pn && pn.value ? pn.value.trim() : 'You';
        this.opponentName = on && on.value ? on.value.trim() : 'Computer';

        if (pn) pn.addEventListener('input', (e) => { this.playerName = e.target.value || 'You'; });
        if (on) on.addEventListener('input', (e) => { this.opponentName = e.target.value || 'Computer'; });

        // load persisted settings if present
        try {
            const savedGrid = localStorage.getItem('dotboxes:gridSize');
            if (savedGrid) this.gridSize = parseInt(savedGrid, 10) || this.gridSize;

            const savedStarter = localStorage.getItem('dotboxes:starter');
            if (savedStarter) {
                if (savedStarter === 'player') this.currentPlayer = 1;
                else if (savedStarter === 'computer') this.currentPlayer = 2;
                else if (savedStarter === 'random') this.currentPlayer = (Math.random() < 0.5) ? 1 : 2;
            }
        } catch (err) {}

        this.initializeGame();
        this.setupEventListeners();
    }

    // Generic modal open/close helpers that manage focus and inert background for accessibility
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // save previously focused element
        this._lastFocusedElement = document.activeElement;

        // show modal and make it visible to AT
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');

        // find first focusable element inside modal
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable && typeof focusable.focus === 'function') {
            focusable.focus({ preventScroll: true });
        } else {
            modal.setAttribute('tabindex', '-1');
            modal.focus({ preventScroll: true });
        }

        // mark main content inert and hidden to AT after focus moved
        const main = document.querySelector('.container');
        if (main) {
            main.setAttribute('inert', '');
            main.setAttribute('aria-hidden', 'true');
        }

        // prevent background scroll
        document.body.style.overflow = 'hidden';

        // escape key closes modal
        this._modalKeyHandler = (e) => { if (e.key === 'Escape') this.closeModal(modalId); };
        document.addEventListener('keydown', this._modalKeyHandler);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');

        const main = document.querySelector('.container');
        if (main) {
            main.removeAttribute('inert');
            main.removeAttribute('aria-hidden');
        }

        document.body.style.overflow = '';

        if (this._modalKeyHandler) {
            document.removeEventListener('keydown', this._modalKeyHandler);
            this._modalKeyHandler = null;
        }

        // restore focus
        try {
            if (this._lastFocusedElement && typeof this._lastFocusedElement.focus === 'function') {
                this._lastFocusedElement.focus({ preventScroll: true });
            }
        } catch (err) {}
        this._lastFocusedElement = null;
    }

    initializeGame() {
        this.scores = { 1: 0, 2: 0 };
        this.lineOwners = {};
        this.boxes = {};
        this.updateScores();
        this.updatePlayerTurn();
        this.renderBoard();

        // Update player labels in header
        const labels = document.querySelectorAll('.player-label');
        if (labels && labels.length >= 2) {
            labels[0].textContent = this.playerName || 'You';
            labels[1].textContent = this.opponentName || 'Computer';
        }

        // If playing vs computer and computer starts, schedule its move
        if (this.aiEnabled && this.currentPlayer === 2) {
            this.scheduleAIMove();
        }
    }

    setupEventListeners() {
        // Header New button opens New Game modal
        const topNew = document.getElementById('top-new');
        if (topNew) topNew.addEventListener('click', () => this.openNewGameModal());

        // Help modal open/close via accessible helpers
        const helpBtn = document.getElementById('help-btn');
        const helpClose = document.getElementById('help-close');
        if (helpBtn) helpBtn.addEventListener('click', () => this.openModal('help-modal'));
        if (helpClose) helpClose.addEventListener('click', () => this.closeModal('help-modal'));



        // New Game modal buttons
        const modalStart = document.getElementById('modal-start');
        const modalCancel = document.getElementById('modal-cancel');
        const modal = document.getElementById('newgame-modal');
        if (modalStart) {
            modalStart.addEventListener('click', () => this.applyNewGameOptions());
        }
        if (modalCancel) {
            modalCancel.addEventListener('click', () => { this.closeModal('newgame-modal'); });
        }

        // Toggle groups (grid size and starter) - use event delegation
        const gridGroup = document.getElementById('modal-grid-size-group');
        if (gridGroup) {
            gridGroup.addEventListener('click', (e) => {
                const btn = e.target.closest('.toggle-btn');
                if (!btn) return;
                // clear active
                gridGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const val = btn.dataset.value;
                const hidden = document.getElementById('modal-grid-size');
                if (hidden) hidden.value = val;
            });
            // set default active based on current/remembered selection
            const sel = (function(){ try { return localStorage.getItem('dotboxes:gridSize') || String(this.gridSize); } catch(e){ return String(this.gridSize); } }).call(this);
            const btn = gridGroup.querySelector(`.toggle-btn[data-value="${sel}"]`) || gridGroup.querySelector('.toggle-btn');
            if (btn) btn.classList.add('active');
        }

        const starterGroup = document.getElementById('modal-starter-group');
        if (starterGroup) {
            starterGroup.addEventListener('click', (e) => {
                const btn = e.target.closest('.toggle-btn');
                if (!btn) return;
                starterGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const val = btn.dataset.value;
                const hidden = document.getElementById('modal-starter');
                if (hidden) hidden.value = val;
            });
            const selStarter = (function(){ try { return localStorage.getItem('dotboxes:starter') || (this.currentPlayer === 2 ? 'computer' : 'player'); } catch(e){ return (this.currentPlayer === 2 ? 'computer' : 'player'); } }).call(this);
            const btn2 = starterGroup.querySelector(`.toggle-btn[data-value="${selStarter}"]`) || starterGroup.querySelector('.toggle-btn');
            if (btn2) btn2.classList.add('active');
        }
    }

    openNewGameModal() {
        const modal = document.getElementById('newgame-modal');
        if (!modal) return;

        // populate current values
        const g = document.getElementById('modal-grid-size');
        if (g) g.value = String(this.gridSize);
        // update active button for grid sizes
        const gridGroup = document.getElementById('modal-grid-size-group');
        if (gridGroup) {
            gridGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.value === String(this.gridSize)));
        }

        const starter = document.getElementById('modal-starter');
        if (starter) {
            if (this.currentPlayer === 1) starter.value = 'player';
            else if (this.currentPlayer === 2) starter.value = 'computer';
            else starter.value = 'player';
        }
        const starterGroup = document.getElementById('modal-starter-group');
        if (starterGroup) {
            const sel = starter ? starter.value : (this.currentPlayer === 2 ? 'computer' : 'player');
            starterGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.value === sel));
        }

        const vs = document.getElementById('modal-vs-computer');
        if (vs) vs.checked = !!this.aiEnabled;

        const pn = document.getElementById('modal-player-name');
        const on = document.getElementById('modal-opponent-name');
        if (pn) pn.value = this.playerName || 'You';
        if (on) on.value = this.opponentName || 'Computer';

        // use accessible open
        this.openModal('newgame-modal');
    }

    applyNewGameOptions() {
        const modal = document.getElementById('newgame-modal');
        if (!modal) return;

        const g = document.getElementById('modal-grid-size');
        const starter = document.getElementById('modal-starter');
        const vs = document.getElementById('modal-vs-computer');
        const pn = document.getElementById('modal-player-name');
        const on = document.getElementById('modal-opponent-name');

        // Apply options
        const newGrid = parseInt(g ? g.value : this.gridSize, 10) || this.gridSize;
        this.gridSize = newGrid;

        this.aiEnabled = !!(vs && vs.checked);

        this.playerName = pn && pn.value ? pn.value.trim() : this.playerName;
        this.opponentName = on && on.value ? on.value.trim() : this.opponentName;

        const starterVal = starter ? starter.value : 'player';
        if (starterVal === 'player') this.currentPlayer = 1;
        else if (starterVal === 'computer') this.currentPlayer = 2;
        else if (starterVal === 'random') this.currentPlayer = (Math.random() < 0.5) ? 1 : 2;

        // close modal and start game
        // persist choices
        try {
            localStorage.setItem('dotboxes:gridSize', String(this.gridSize));
            localStorage.setItem('dotboxes:starter', starterVal);
        } catch (err) {}

        this.closeModal('newgame-modal');
        this.initializeGame();
    }

    renderBoard() {
        const svg = document.getElementById('game-board');
        svg.innerHTML = '';

        const padding = 30;
        const svgSize = 500;
        svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);

        const dotsPerSide = this.gridSize + 1;
        const spacing = (svgSize - 2 * padding) / this.gridSize;
        const dotRadius = 3; // smaller dots (half size)

        // Draw horizontal lines
        for (let row = 0; row < dotsPerSide; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x1 = padding + col * spacing;
                const y1 = padding + row * spacing;
                const x2 = x1 + spacing;
                const y2 = y1;

                const lineId = `h-${row}-${col}`;
                const line = this.createLine(x1, y1, x2, y2, lineId, 'h', row, col);
                svg.appendChild(line);
            }
        }

        // Draw vertical lines
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < dotsPerSide; col++) {
                const x1 = padding + col * spacing;
                const y1 = padding + row * spacing;
                const x2 = x1;
                const y2 = y1 + spacing;

                const lineId = `v-${row}-${col}`;
                const line = this.createLine(x1, y1, x2, y2, lineId, 'v', row, col);
                svg.appendChild(line);
            }
        }

        // Draw dots
        for (let row = 0; row < dotsPerSide; row++) {
            for (let col = 0; col < dotsPerSide; col++) {
                const cx = padding + col * spacing;
                const cy = padding + row * spacing;

                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', cx);
                dot.setAttribute('cy', cy);
                dot.setAttribute('r', dotRadius);
                dot.classList.add('dot');
                svg.appendChild(dot);
            }
        }

        // Redraw existing boxes
        this.redrawBoxes();
    }

    createLine(x1, y1, x2, y2, lineId, orientation, row, col) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.classList.add('line');
        line.dataset.id = lineId;
        line.dataset.orientation = orientation;
        line.dataset.row = row;
        line.dataset.col = col;

        const owner = this.lineOwners[lineId];
        if (owner) {
            line.classList.add('active', `player${owner}`);
            line.style.pointerEvents = 'none';
        } else {
            // only allow human clicks; if it's AI turn, clicks shouldn't register
            line.addEventListener('click', () => {
                if (this.aiEnabled && this.currentPlayer === 2) return; // AI's turn
                this.handleLineClick(lineId, line);
            });
        }

        return line;
    }

    handleLineClick(lineId, lineElement) {
        if (this.lineOwners[lineId]) return;

        // Claim line
        this.lineOwners[lineId] = this.currentPlayer;

        lineElement.classList.add('active', `player${this.currentPlayer}`);
        lineElement.style.pointerEvents = 'none';

        // Check for completed boxes
        const completedBoxes = this.checkCompletedBoxes(lineId);

        if (completedBoxes.length > 0) {
            completedBoxes.forEach(box => {
                this.boxes[box] = this.currentPlayer;
                this.scores[this.currentPlayer]++;
                this.drawCompletedBox(box, this.currentPlayer);
            });

            this.updateScores();

            // Check for game over
            if (this.isGameOver()) {
                setTimeout(() => this.showWinner(), 300);
                return;
            }

            // Player gets another turn; auto-claim further immediate captures for this player
            if (this.currentPlayer === 2 && this.aiEnabled) {
                this.scheduleAIMove();
            } else {
                // For human player, auto-claim any immediate captures (chain) for them as the AI does
                this.autoClaimCapturesForPlayer(this.currentPlayer);
            }
        } else {
            // Switch player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updatePlayerTurn();

            // If new player is AI, schedule AI move
            if (this.aiEnabled && this.currentPlayer === 2) {
                this.scheduleAIMove();
            }
        }
    }

    autoClaimCapturesForPlayer(player) {
        // repeatedly find any available move that would complete at least one box for `player` and apply it
        const tryNext = () => {
            if (this.currentPlayer !== player) return; // player's turn must still be active

            const available = this.getAvailableLines();
            let best = null;
            let bestCount = 0;
            for (let lid of available) {
                const tempOwners = Object.assign({}, this.lineOwners);
                tempOwners[lid] = player;
                const completed = this.checkCompletedBoxesSim(lid, tempOwners, this.boxes);
                if (completed.length > bestCount) {
                    bestCount = completed.length;
                    best = lid;
                }
            }

            if (best) {
                const el = document.querySelector(`line[data-id="${best}"]`);
                if (el) {
                    // Small delay so player sees the chain happening
                    setTimeout(() => {
                        this.handleLineClick(best, el);
                        // schedule next check after this capture resolves
                        setTimeout(tryNext, 160);
                    }, 120);
                }
            }
        };

        // start after a short delay so UI updates
        setTimeout(tryNext, 120);
    }

    checkCompletedBoxes(lineId) {
        const parts = lineId.split('-');
        const orientation = parts[0];
        const row = parseInt(parts[1], 10);
        const col = parseInt(parts[2], 10);

        const completedBoxes = [];

        if (orientation === 'h') {
            // Check box above
            if (row > 0) {
                const boxId = `${row - 1}-${col}`;
                if (this.isBoxComplete(row - 1, col)) completedBoxes.push(boxId);
            }
            // Check box below
            if (row < this.gridSize) {
                const boxId = `${row}-${col}`;
                if (this.isBoxComplete(row, col)) completedBoxes.push(boxId);
            }
        } else if (orientation === 'v') {
            // Check left box
            if (col > 0) {
                const boxId = `${row}-${col - 1}`;
                if (this.isBoxComplete(row, col - 1)) completedBoxes.push(boxId);
            }
            // Check right box
            if (col < this.gridSize) {
                const boxId = `${row}-${col}`;
                if (this.isBoxComplete(row, col)) completedBoxes.push(boxId);
            }
        }

        return completedBoxes;
    }

    isBoxComplete(row, col) {
        if (this.boxes[`${row}-${col}`]) return false;

        const top = this.hasLine(`h-${row}-${col}`);
        const bottom = this.hasLine(`h-${row + 1}-${col}`);
        const left = this.hasLine(`v-${row}-${col}`);
        const right = this.hasLine(`v-${row}-${col + 1}`);

        return top && bottom && left && right;
    }

    hasLine(lineId) {
        return !!this.lineOwners[lineId];
    }

    drawCompletedBox(boxId, player) {
        const [row, col] = boxId.split('-').map(Number);
        const svg = document.getElementById('game-board');

        const padding = 30;
        const svgSize = 500;
        const spacing = (svgSize - 2 * padding) / this.gridSize;

        const x = padding + col * spacing;
        const y = padding + row * spacing;

        // Draw filled rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', spacing);
        rect.setAttribute('height', spacing);
        rect.classList.add('box-fill', `player${player}`);

        svg.insertBefore(rect, svg.firstChild);

        // Draw player initial
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + spacing / 2);
        text.setAttribute('y', y + spacing / 2);
        text.classList.add('box-text');
        const name = player === 1 ? this.playerName : this.opponentName;
        text.textContent = name ? (name[0] || (player === 1 ? 'Y' : 'C')).toUpperCase() : (player === 1 ? 'Y' : 'C');
        svg.appendChild(text);
    }

    redrawBoxes() {
        for (let boxId in this.boxes) {
            const player = this.boxes[boxId];
            const [row, col] = boxId.split('-').map(Number);
            const svg = document.getElementById('game-board');

            const padding = 30;
            const svgSize = 500;
            const spacing = (svgSize - 2 * padding) / this.gridSize;

            const x = padding + col * spacing;
            const y = padding + row * spacing;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', spacing);
            rect.setAttribute('height', spacing);
            rect.classList.add('box-fill', `player${player}`);
            svg.insertBefore(rect, svg.firstChild);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + spacing / 2);
            text.setAttribute('y', y + spacing / 2);
            text.classList.add('box-text');
            const name = player === 1 ? this.playerName : this.opponentName;
            text.textContent = name ? (name[0] || (player === 1 ? 'Y' : 'C')).toUpperCase() : (player === 1 ? 'Y' : 'C');
            svg.appendChild(text);
        }
        // Ensure existing claimed lines are visually active
        for (let lid in this.lineOwners) {
            const el = document.querySelector(`line[data-id="${lid}"]`);
            if (el) {
                el.classList.add('active', `player${this.lineOwners[lid]}`);
                el.style.pointerEvents = 'none';
            }
        }
    }

    isGameOver() {
        const totalBoxes = this.gridSize * this.gridSize;
        return this.scores[1] + this.scores[2] === totalBoxes;
    }

    showWinner() {
        const modal = document.getElementById('end-modal');
        const title = document.getElementById('end-title');
        const msg = document.getElementById('end-message');
        const restart = document.getElementById('restart-btn');
        const close = document.getElementById('close-modal');

        let winnerText = '';
        if (this.scores[1] > this.scores[2]) {
            winnerText = `${this.playerName} Wins! 🎉`;
        } else if (this.scores[2] > this.scores[1]) {
            winnerText = `${this.opponentName} Wins! 🎉`;
        } else {
            winnerText = `It's a Tie! 🤝`;
        }

        title.textContent = winnerText;
        msg.textContent = `Final score: ${this.scores[1]} — ${this.scores[2]}`;

        // open end modal accessibly
        this.openModal('end-modal');

        restart.onclick = () => { this.closeModal('end-modal'); this.initializeGame(); };
        close.onclick = () => { this.closeModal('end-modal'); };
    }

    updateScores() {
        document.getElementById('score1').textContent = this.scores[1];
        document.getElementById('score2').textContent = this.scores[2];
    }

    updatePlayerTurn() {
        // Highlight the active player's score box instead of showing text
        const scoreBoxes = document.querySelectorAll('.score');
        if (scoreBoxes && scoreBoxes.length >= 2) {
            scoreBoxes.forEach((el, idx) => {
                el.classList.toggle('active', (idx + 1) === this.currentPlayer);
            });
        }
    }

    scheduleAIMove() {
        // Slight delay to simulate thinking and allow UI to update
        setTimeout(() => this.aiMove(), 400 + Math.random() * 400);
    }

    aiMove() {
        // AI is player 2
        if (!this.aiEnabled || this.currentPlayer !== 2) return;

        const available = this.getAvailableLines();
        if (available.length === 0) return;

        // 1) If any move completes a box for AI, take it (prefer multiple)
        for (let lid of available) {
            // simulate claiming this line and see if it completes any boxes
            const tempOwners = Object.assign({}, this.lineOwners);
            tempOwners[lid] = 2;
            const completed = this.checkCompletedBoxesSim(lid, tempOwners, this.boxes);
            if (completed.length > 0) {
                const el = document.querySelector(`line[data-id="${lid}"]`);
                if (el) this.handleLineClick(lid, el);
                return;
            }
        }
        // 2) Otherwise use lookahead: simulate each move and how many boxes the opponent
        //    can capture immediately (including chains). Choose the move minimizing opponent captures.
        let bestMoves = [];
        let bestScore = Infinity; // lower is better (opponent captures)

        for (let lid of available) {
            // simulate temporary line owners
            const tempOwners = Object.assign({}, this.lineOwners);
            tempOwners[lid] = 2;

            // simulate opponent (player 1) capturing chain after this move
            const opponentCaptured = this.simulateOpponentCaptures(tempOwners);

            // also use tie-breaker: prefer moves that create fewer 3-sided boxes for opponent
            const affected = this.getAdjacentBoxes(lid);
            let threeCount = 0;
            for (let b of affected) {
                const sides = this.countBoxSidesSim(b.row, b.col, tempOwners);
                if (sides === 3) threeCount++;
            }

            const score = opponentCaptured * 100 + threeCount; // primary minimize opponentCaptured

            if (score < bestScore) {
                bestScore = score;
                bestMoves = [lid];
            } else if (score === bestScore) {
                bestMoves.push(lid);
            }
        }

        const choice = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        const el = document.querySelector(`line[data-id="${choice}"]`);
        if (el) this.handleLineClick(choice, el);
    }

    simulateOpponentCaptures(tempOwners) {
        // Simulate opponent (player 1) repeatedly taking any immediate captures
        let captured = 0;
        const tempBoxes = Object.assign({}, this.boxes);

        while (true) {
            const available = [];
            // find any move that would complete a box for player1
            const allLines = this.getAvailableLinesSim(tempOwners);
            for (let lid of allLines) {
                // if playing this line would complete any box
                const completed = this.checkCompletedBoxesSim(lid, tempOwners, tempBoxes);
                if (completed.length > 0) available.push({ lid, completed });
            }
            if (available.length === 0) break;

            // opponent will pick one of these; to be pessimistic, assume they pick the one that gives most boxes
            available.sort((a, b) => b.completed.length - a.completed.length);
            const pick = available[0];

            // apply pick
            tempOwners[pick.lid] = 1;
            for (let boxId of pick.completed) {
                tempBoxes[boxId] = 1;
                captured++;
            }
            // continue loop to see chain captures
        }

        return captured;
    }

    // Helper variants that operate on simulated owners/boxes
    getAvailableLinesSim(tempOwners) {
        const list = [];
        const dotsPerSide = this.gridSize + 1;
        for (let row = 0; row < dotsPerSide; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const lid = `h-${row}-${col}`;
                if (!tempOwners[lid]) list.push(lid);
            }
        }
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < dotsPerSide; col++) {
                const lid = `v-${row}-${col}`;
                if (!tempOwners[lid]) list.push(lid);
            }
        }
        return list;
    }

    countBoxSidesSim(row, col, tempOwners) {
        let count = 0;
        if (tempOwners[`h-${row}-${col}`]) count++;
        if (tempOwners[`h-${row + 1}-${col}`]) count++;
        if (tempOwners[`v-${row}-${col}`]) count++;
        if (tempOwners[`v-${row}-${col + 1}`]) count++;
        return count;
    }

    checkCompletedBoxesSim(lineId, tempOwners, tempBoxes) {
        const parts = lineId.split('-');
        const orientation = parts[0];
        const row = parseInt(parts[1], 10);
        const col = parseInt(parts[2], 10);

        const completedBoxes = [];

        if (orientation === 'h') {
            if (row > 0) {
                const boxId = `${row - 1}-${col}`;
                if (!tempBoxes[boxId]) {
                    const top = !!tempOwners[`h-${row - 1}-${col}`];
                    const bottom = !!tempOwners[`h-${row}-${col}`];
                    const left = !!tempOwners[`v-${row - 1}-${col}`];
                    const right = !!tempOwners[`v-${row - 1}-${col + 1}`];
                    if (top && bottom && left && right) completedBoxes.push(boxId);
                }
            }
            if (row < this.gridSize) {
                const boxId = `${row}-${col}`;
                if (!tempBoxes[boxId]) {
                    const top = !!tempOwners[`h-${row}-${col}`];
                    const bottom = !!tempOwners[`h-${row + 1}-${col}`];
                    const left = !!tempOwners[`v-${row}-${col}`];
                    const right = !!tempOwners[`v-${row}-${col + 1}`];
                    if (top && bottom && left && right) completedBoxes.push(boxId);
                }
            }
        } else if (orientation === 'v') {
            if (col > 0) {
                const boxId = `${row}-${col - 1}`;
                if (!tempBoxes[boxId]) {
                    const top = !!tempOwners[`h-${row}-${col - 1}`];
                    const bottom = !!tempOwners[`h-${row + 1}-${col - 1}`];
                    const left = !!tempOwners[`v-${row}-${col - 1}`];
                    const right = !!tempOwners[`v-${row}-${col}`];
                    if (top && bottom && left && right) completedBoxes.push(boxId);
                }
            }
            if (col < this.gridSize) {
                const boxId = `${row}-${col}`;
                if (!tempBoxes[boxId]) {
                    const top = !!tempOwners[`h-${row}-${col}`];
                    const bottom = !!tempOwners[`h-${row + 1}-${col}`];
                    const left = !!tempOwners[`v-${row}-${col}`];
                    const right = !!tempOwners[`v-${row}-${col + 1}`];
                    if (top && bottom && left && right) completedBoxes.push(boxId);
                }
            }
        }

        return completedBoxes;
    }

    getAvailableLines() {
        const list = [];
        // horizontal
        const dotsPerSide = this.gridSize + 1;
        for (let row = 0; row < dotsPerSide; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const lid = `h-${row}-${col}`;
                if (!this.lineOwners[lid]) list.push(lid);
            }
        }
        // vertical
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < dotsPerSide; col++) {
                const lid = `v-${row}-${col}`;
                if (!this.lineOwners[lid]) list.push(lid);
            }
        }
        return list;
    }

    getAdjacentBoxes(lineId) {
        const parts = lineId.split('-');
        const orientation = parts[0];
        const row = parseInt(parts[1], 10);
        const col = parseInt(parts[2], 10);
        const boxes = [];
        if (orientation === 'h') {
            if (row > 0) boxes.push({ row: row - 1, col });
            if (row < this.gridSize) boxes.push({ row, col });
        } else {
            if (col > 0) boxes.push({ row, col: col - 1 });
            if (col < this.gridSize) boxes.push({ row, col });
        }
        return boxes;
    }

    countBoxSides(row, col) {
        let count = 0;
        if (this.hasLine(`h-${row}-${col}`)) count++;
        if (this.hasLine(`h-${row + 1}-${col}`)) count++;
        if (this.hasLine(`v-${row}-${col}`)) count++;
        if (this.hasLine(`v-${row}-${col + 1}`)) count++;
        return count;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DotsAndBoxes();
});
