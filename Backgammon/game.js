/**
 * Backgammon Game Logic
 */

class Backgammon {
    constructor() {
        this.board = Array(24).fill(null).map(() => ({ player: null, count: 0 }));
        this.bar = { white: 0, black: 0 };
        this.off = { white: 0, black: 0 };
        this.currentPlayer = 'white';
        this.dice = [];
        this.selectedPoint = null;
        this.gameOver = false;
        this.moveLog = [];
        this.turnSnapshot = null; // To store state at start of turn
        this.theme = localStorage.getItem('backgammon-theme') || 'theme-luxury';
        document.body.className = this.theme;

        this.initBoard();
        this.setupEventListeners();
        this.render();

        // Start first turn
        setTimeout(() => this.rollDice(), 1000);
    }

    initBoard() {
        // Standard Backgammon setup
        // Point indices are 0-23. 
        // White moves 0 -> 23. Black moves 23 -> 0.

        this.setPoint(0, 'white', 2);
        this.setPoint(11, 'white', 5);
        this.setPoint(16, 'white', 3);
        this.setPoint(18, 'white', 5);

        this.setPoint(23, 'black', 2);
        this.setPoint(12, 'black', 5);
        this.setPoint(7, 'black', 3);
        this.setPoint(5, 'black', 5);
    }

    setPoint(idx, player, count) {
        this.board[idx] = { player, count };
    }

    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.restart());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoTurn());
        document.getElementById('finish-btn').addEventListener('click', () => this.endTurn());
        document.getElementById('theme-btn').addEventListener('click', () => this.toggleTheme());

        document.querySelectorAll('.point').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.getAttribute('data-id'));
                this.handlePointClick(id);
            });
        });

        document.querySelectorAll('.off-zone').forEach(el => {
            el.addEventListener('click', () => {
                this.handlePointClick('off');
            });
        });

        document.querySelectorAll('.bar-zone').forEach(el => {
            el.addEventListener('click', () => {
                this.handlePointClick('bar');
            });
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'theme-luxury' ? 'theme-classic' : 'theme-luxury';
        document.body.className = this.theme;
        localStorage.setItem('backgammon-theme', this.theme);
        this.updateStatus(`Switched to ${this.theme.replace('theme-', '')} theme`);
    }

    async rollDice() {
        if (this.dice.length > 0) return;

        const d1El = document.getElementById('die-1');
        const d2El = document.getElementById('die-2');
        d1El.classList.add('rolling');
        d2El.classList.add('rolling');
        this.updateStatus("Rolling...");

        // Simulate rolling time
        await new Promise(resolve => setTimeout(resolve, 600));

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;

        if (d1 === d2) {
            this.dice = [d1, d1, d1, d1];
        } else {
            this.dice = [d1, d2];
        }

        d1El.classList.remove('rolling');
        d2El.classList.remove('rolling');

        this.updateDiceUI();
        this.updateStatus(`${this.currentPlayer.toUpperCase()} rolled ${this.dice.join(', ')}`);

        // Save snapshot for possible undo
        this.saveTurnSnapshot();

        if (!this.hasPossibleMoves()) {
            this.updateStatus(`No moves possible for ${this.currentPlayer}.`);
            setTimeout(() => this.endTurn(), 1500);
        } else {
            this.checkAutoSelectBar();
        }
    }

    checkAutoSelectBar() {
        if (this.currentPlayer === 'white' && this.bar.white > 0) {
            this.selectedPoint = 'bar';
            this.updateStatus("Must move from bar! Choose destination.");
            this.render();
        }
    }

    updateDiceUI() {
        const d1El = document.getElementById('die-1');
        const d2El = document.getElementById('die-2');

        if (this.dice.length === 0) {
            d1El.textContent = '?';
            d2El.textContent = '?';
        } else {
            d1El.textContent = this.dice[0] || '';
            d2El.textContent = this.dice[1] || this.dice[0] || '';
            // If doubles, we might have 3 or 4 dice, but visually we just show the numbers
        }
    }

    async handlePointClick(id) {
        if (this.currentPlayer !== 'white' || this.dice.length === 0 || this.gameOver) return;

        if (this.selectedPoint === null || (this.bar.white > 0 && id !== 'bar')) {
            // Force bar selection if pieces are there
            if (this.bar.white > 0) {
                this.selectedPoint = 'bar';
            }

            // If clicked off, ignore
            if (id === 'off') return;

            // Normal piece selection
            if (this.bar.white === 0 && this.canSelectPoint(id)) {
                this.selectedPoint = id;
            }
        } else {
            // Moving a piece
            if (this.selectedPoint === id && this.bar.white === 0) {
                this.selectedPoint = null; // Deselect only if not from bar
            } else {
                if (this.isValidMove(this.selectedPoint, id)) {
                    await this.executeMove(this.selectedPoint, id);
                } else {
                    // Try to select the new point instead if it's yours and not blocked by bar
                    if (id !== 'off' && id !== 'bar' && this.bar[this.currentPlayer] === 0 && this.canSelectPoint(id)) {
                        this.selectedPoint = id;
                    }
                }
            }
        }
        this.render();
    }

    canSelectPoint(id) {
        // If game is over, no selection
        if (this.gameOver) return false;

        // If bar has pieces, player MUST move them first
        if (this.bar[this.currentPlayer] > 0) {
            this.updateStatus(`Must move from BAR first!`);
            return false;
        }

        const point = this.board[id];
        return point.player === this.currentPlayer && point.count > 0;
    }

    getValidDestinations(fromIdx) {
        const destinations = [];
        if (fromIdx === null) return destinations;

        // Check each die
        const uniqueDice = [...new Set(this.dice)];
        uniqueDice.forEach(d => {
            let toIdx;
            if (fromIdx === 'bar') {
                toIdx = this.currentPlayer === 'white' ? d - 1 : 24 - d;
            } else {
                toIdx = this.currentPlayer === 'white' ? fromIdx + d : fromIdx - d;
            }

            // Check if toIdx is bearing off
            if ((this.currentPlayer === 'white' && toIdx >= 24) || (this.currentPlayer === 'black' && toIdx < 0)) {
                if (this.isValidMove(fromIdx, 'off')) {
                    destinations.push('off');
                }
            } else if (toIdx >= 0 && toIdx < 24) {
                if (this.isValidMove(fromIdx, toIdx)) {
                    destinations.push(toIdx);
                }
            }
        });
        return destinations;
    }

    canBearOff() {
        if (this.bar[this.currentPlayer] > 0) return false;

        // Check if all pieces are in home board
        if (this.currentPlayer === 'white') {
            // White home: 18-23
            for (let i = 0; i < 18; i++) {
                if (this.board[i].player === 'white' && this.board[i].count > 0) return false;
            }
        } else {
            // Black home: 5-0
            for (let i = 6; i < 24; i++) {
                if (this.board[i].player === 'black' && this.board[i].count > 0) return false;
            }
        }
        return true;
    }

    isValidMove(fromIdx, toIdx) {
        if (toIdx === 'off') {
            if (!this.canBearOff()) return false;

            let distToOff = this.currentPlayer === 'white' ? 24 - fromIdx : fromIdx + 1;

            if (this.dice.includes(distToOff)) return true;

            const maxDie = Math.max(...this.dice);
            if (maxDie > distToOff) {
                if (this.currentPlayer === 'white') {
                    for (let i = 18; i < fromIdx; i++) {
                        if (this.board[i].player === 'white' && this.board[i].count > 0) return false;
                    }
                } else {
                    for (let i = 5; i > fromIdx; i--) {
                        if (this.board[i].player === 'black' && this.board[i].count > 0) return false;
                    }
                }
                return true;
            }
            return false;
        }

        let dist;
        if (fromIdx === 'bar') {
            dist = this.currentPlayer === 'white' ? toIdx + 1 : 24 - toIdx;
        } else {
            dist = this.currentPlayer === 'white' ? toIdx - fromIdx : fromIdx - toIdx;
        }

        if (dist <= 0 || !this.dice.includes(dist)) return false;

        if (fromIdx === 'bar') {
            if (this.currentPlayer === 'white' && (toIdx < 0 || toIdx > 5)) return false;
            if (this.currentPlayer === 'black' && (toIdx < 18 || toIdx > 23)) return false;
        }

        const target = this.board[toIdx];
        if (target.player !== null && target.player !== this.currentPlayer && target.count > 1) {
            return false;
        }

        return true;
    }

    async executeMove(fromIdx, toIdx) {
        let dist;
        const playerMoving = this.currentPlayer;

        // --- 1. Animation Phase ---
        await this.animateChecker(fromIdx, toIdx, playerMoving);

        // --- 2. State Update Phase ---
        if (toIdx === 'off') {
            dist = playerMoving === 'white' ? 24 - fromIdx : fromIdx + 1;
            this.board[fromIdx].count--;
            if (this.board[fromIdx].count === 0) this.board[fromIdx].player = null;
            this.off[playerMoving]++;

            // Consume exact die if possible, else largest
            let dieIdx = this.dice.indexOf(dist);
            if (dieIdx === -1) {
                const maxDie = Math.max(...this.dice);
                dieIdx = this.dice.indexOf(maxDie);
            }
            this.dice.splice(dieIdx, 1);

            this.checkWin();
        } else {
            if (fromIdx === 'bar') {
                dist = playerMoving === 'white' ? toIdx + 1 : 24 - toIdx;
                this.bar[playerMoving]--;
            } else {
                dist = playerMoving === 'white' ? toIdx - fromIdx : fromIdx - toIdx;
                this.board[fromIdx].count--;
                if (this.board[fromIdx].count === 0) this.board[fromIdx].player = null;
            }

            const target = this.board[toIdx];
            if (target.player !== null && target.player !== playerMoving) {
                // It's a blot! Hit it.
                this.bar[target.player]++;
                target.count = 0;
                this.showCaptureFlash(target.player);
            }

            target.player = playerMoving;
            target.count++;

            const dieIdx = this.dice.indexOf(dist);
            this.dice.splice(dieIdx, 1);
        }

        this.selectedPoint = null;
        this.updateDiceUI();
        this.render();

        // For AI, we still want automatic progression
        if (playerMoving === 'black') {
            if (this.dice.length === 0) {
                this.endTurn();
            } else if (!this.hasPossibleMoves()) {
                this.updateStatus(`AI has no more moves. Turn passes.`);
                setTimeout(() => this.endTurn(), 1000);
            }
        } else {
            // For Human, check if they are stuck
            if (this.dice.length > 0 && !this.hasPossibleMoves()) {
                this.updateStatus(`No more moves possible. Click 'Finish Turn'`);
            } else {
                this.checkAutoSelectBar();
            }
        }
    }

    animateChecker(from, to, player) {
        return new Promise(resolve => {
            // Find start and end elements
            let startEl, endEl;
            if (from === 'bar') {
                startEl = document.getElementById(`bar-${player}`);
            } else {
                startEl = document.querySelector(`.point[data-id="${from}"]`);
            }

            if (to === 'off') {
                endEl = document.getElementById(`off-${player}`);
            } else if (to === 'bar') {
                endEl = document.getElementById(`bar-${player}`);
            } else {
                endEl = document.querySelector(`.point[data-id="${to}"]`);
            }

            if (!startEl || !endEl) return resolve();

            // Create phantom checker
            const phantom = document.createElement('div');
            phantom.className = `checker ${player} phantom`;

            // Get positions
            const startRect = startEl.getBoundingClientRect();
            const endRect = endEl.getBoundingClientRect();

            phantom.style.width = '40px';
            phantom.style.height = '40px';
            phantom.style.top = `${startRect.top + startRect.height / 2 - 20}px`;
            phantom.style.left = `${startRect.left + startRect.width / 2 - 20}px`;

            document.body.appendChild(phantom);

            // Force reflow
            phantom.offsetHeight;

            // Move to end
            phantom.style.top = `${endRect.top + endRect.height / 2 - 20}px`;
            phantom.style.left = `${endRect.left + endRect.width / 2 - 20}px`;

            setTimeout(() => {
                phantom.remove();
                resolve();
            }, 450); // Matches CSS transition duration
        });
    }

    hasPossibleMoves() {
        if (this.dice.length === 0) return false;

        // If in bar, check if any die can get out
        if (this.bar[this.currentPlayer] > 0) {
            for (let d of this.dice) {
                const toIdx = this.currentPlayer === 'white' ? d - 1 : 24 - d;
                if (this.isValidMove('bar', toIdx)) return true;
            }
            return false;
        }

        // Check every point the player owns
        for (let i = 0; i < 24; i++) {
            if (this.board[i].player === this.currentPlayer && this.board[i].count > 0) {
                for (let d of this.dice) {
                    const toIdx = this.currentPlayer === 'white' ? i + d : i - d;
                    // Check normal moves
                    if (toIdx >= 0 && toIdx < 24) {
                        if (this.isValidMove(i, toIdx)) return true;
                    }
                    // Check bearing off
                    if ((this.currentPlayer === 'white' && toIdx >= 24) || (this.currentPlayer === 'black' && toIdx < 0)) {
                        if (this.isValidMove(i, 'off')) return true;
                    }
                }
            }
        }

        return false;
    }

    checkWin() {
        if (this.off[this.currentPlayer] === 15) {
            this.gameOver = true;
            this.updateStatus(`GAME OVER! ${this.currentPlayer.toUpperCase()} WINS!`);
            return true;
        }
        return false;
    }

    endTurn() {
        if (this.gameOver) return;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.dice = [];
        this.selectedPoint = null;
        this.updateDiceUI();
        this.updateStatus(`${this.currentPlayer.toUpperCase()}'s turn`);
        this.render();

        if (this.currentPlayer === 'black' && !this.gameOver) {
            setTimeout(() => this.aiTurn(), 1000);
        } else if (this.currentPlayer === 'white' && !this.gameOver) {
            setTimeout(() => this.rollDice(), 1000);
        }
    }

    async aiTurn() {
        if (this.currentPlayer !== 'black' || this.gameOver) return;

        if (this.dice.length === 0) {
            this.updateStatus("AI is thinking...");
            await new Promise(r => setTimeout(r, 800));
            await this.rollDice();
            if (this.currentPlayer === 'black' && this.dice.length > 0) {
                setTimeout(() => this.aiTurn(), 800);
            }
            return;
        }

        this.updateStatus("AI is analyzing board...");
        await new Promise(r => setTimeout(r, 600));

        const move = this.getBestAiMove();
        if (move && this.currentPlayer === 'black') {
            await this.executeMove(move.from, move.to);
            if (this.currentPlayer === 'black' && this.dice.length > 0) {
                setTimeout(() => this.aiTurn(), 1000);
            }
        } else if (this.currentPlayer === 'black') {
            this.updateStatus("AI is passing turn.");
            setTimeout(() => this.endTurn(), 1000);
        }
    }

    getBestAiMove() {
        const possibleMoves = [];

        // Check moves from bar
        if (this.bar.black > 0) {
            const dests = this.getValidDestinations('bar');
            dests.forEach(to => possibleMoves.push({ from: 'bar', to }));
        } else {
            // Check moves from all points
            this.board.forEach((p, i) => {
                if (p.player === 'black' && p.count > 0) {
                    const dests = this.getValidDestinations(i);
                    dests.forEach(to => possibleMoves.push({ from: i, to }));
                }
            });
        }

        if (possibleMoves.length === 0) return null;

        // Simple heuristic ranking
        possibleMoves.forEach(move => {
            move.score = 0;
            if (move.to === 'off') move.score += 100;
            else {
                const target = this.board[move.to];
                if (target.player === 'white') move.score += 50; // Hit blot
                if (target.player === 'black') move.score += 10; // Make point
            }
        });

        possibleMoves.sort((a, b) => b.score - a.score);
        return possibleMoves[0];
    }

    updateStatus(msg) {
        document.getElementById('status-msg').textContent = msg;
    }

    render() {
        // Highlight active turn
        document.getElementById('player-white-info').classList.toggle('active-turn', this.currentPlayer === 'white');
        document.getElementById('player-black-info').classList.toggle('active-turn', this.currentPlayer === 'black');

        // Reset points classes
        document.querySelectorAll('.point, .off-zone').forEach(el => {
            el.classList.remove('selectable', 'suggested-destination');
        });

        // Get suggestions if piece selected
        const suggestions = this.getValidDestinations(this.selectedPoint);

        // Render points
        this.board.forEach((point, i) => {
            const pointEl = document.querySelector(`.point[data-id="${i}"]`);
            pointEl.innerHTML = '';

            if (this.selectedPoint === i) pointEl.classList.add('selectable');
            if (suggestions.includes(i)) pointEl.classList.add('suggested-destination');

            for (let c = 0; c < Math.min(point.count, 5); c++) {
                const checker = document.createElement('div');
                checker.className = `checker ${point.player}`;
                pointEl.appendChild(checker);
            }

            if (point.count > 5) {
                const count = document.createElement('span');
                count.className = 'checker-stack-count';
                count.textContent = `+${point.count - 5}`;
                pointEl.appendChild(count);
            }
        });

        // Render bar
        const barWhite = document.getElementById('bar-white');
        const barBlack = document.getElementById('bar-black');
        barWhite.innerHTML = '';
        barBlack.innerHTML = '';

        for (let i = 0; i < this.bar.white; i++) {
            const checker = document.createElement('div');
            checker.className = 'checker white';
            barWhite.appendChild(checker);
        }
        for (let i = 0; i < this.bar.black; i++) {
            const checker = document.createElement('div');
            checker.className = 'checker black';
            barBlack.appendChild(checker);
        }

        if (this.selectedPoint === 'bar') {
            if (this.currentPlayer === 'white') barWhite.classList.add('selectable');
            else barBlack.classList.add('selectable');
        } else {
            barWhite.classList.remove('selectable');
            barBlack.classList.remove('selectable');
        }

        // Render off
        const offWhite = document.getElementById('off-white');
        const offBlack = document.getElementById('off-black');
        offWhite.textContent = `W: ${this.off.white}`;
        offBlack.textContent = `B: ${this.off.black}`;

        if (suggestions.includes('off')) {
            if (this.currentPlayer === 'white') offWhite.classList.add('suggested-destination');
            else offBlack.classList.add('suggested-destination');
        }

        // Toggle turn controls
        const undoBtn = document.getElementById('undo-btn');
        const finishBtn = document.getElementById('finish-btn');
        const showTurnControls = this.currentPlayer === 'white' && !this.gameOver && this.turnSnapshot;

        if (showTurnControls) {
            const hasMoved = this.dice.length < this.turnSnapshot.dice.length;
            const noMovesLeft = this.dice.length === 0 || !this.hasPossibleMoves();

            undoBtn.style.display = hasMoved ? 'block' : 'none';
            finishBtn.style.display = noMovesLeft ? 'block' : 'none';
            finishBtn.textContent = (this.dice.length === 0) ? "Confirm Turn" : "Skip Remainder";
        } else {
            undoBtn.style.display = 'none';
            finishBtn.style.display = 'none';
        }

        // Update moves left counter
        document.getElementById('moves-count').textContent = this.dice.length;
    }

    saveTurnSnapshot() {
        this.turnSnapshot = {
            board: JSON.parse(JSON.stringify(this.board)),
            bar: { ...this.bar },
            off: { ...this.off },
            dice: [...this.dice]
        };
    }

    showCaptureFlash(player) {
        const flash = document.createElement('div');
        flash.className = 'capture-notification';
        flash.innerHTML = `
            <div class="capture-title">Event Log</div>
            <div class="capture-msg">${player.toUpperCase()} CAPTURED</div>
        `;
        document.body.appendChild(flash);
        this.triggerShake();
        setTimeout(() => flash.remove(), 1200);
    }

    triggerShake() {
        const board = document.getElementById('game-container');
        board.style.animation = 'none';
        board.offsetHeight; // trigger reflow
        board.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';

        // Add shake keyframes dynamically if not present
        if (!document.getElementById('shake-style')) {
            const style = document.createElement('style');
            style.id = 'shake-style';
            style.textContent = `
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    undoTurn() {
        if (!this.turnSnapshot || this.currentPlayer === 'black') return;

        this.board = JSON.parse(JSON.stringify(this.turnSnapshot.board));
        this.bar = { ...this.turnSnapshot.bar };
        this.off = { ...this.turnSnapshot.off };
        this.dice = [...this.turnSnapshot.dice];
        this.selectedPoint = null;

        this.updateDiceUI();
        this.updateStatus("Moves undone. Still your turn.");
        this.checkAutoSelectBar();
        this.render();
    }

    restart() {
        this.board = Array(24).fill(null).map(() => ({ player: null, count: 0 }));
        this.bar = { white: 0, black: 0 };
        this.off = { white: 0, black: 0 };
        this.currentPlayer = 'white';
        this.dice = [];
        this.selectedPoint = null;
        this.gameOver = false;
        this.turnSnapshot = null;

        this.initBoard();
        this.updateDiceUI();
        this.updateStatus("Game Restarted. White's turn.");
        this.checkAutoSelectBar();
        this.render();
        setTimeout(() => this.rollDice(), 1000);
    }
}

// Start game
window.addEventListener('load', () => {
    window.game = new Backgammon();
});
