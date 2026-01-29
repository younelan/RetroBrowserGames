/**
 * Othello Royale - Game Engine
 * Luxury AI Strategy Game
 */

class OthelloGame {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        this.currentPlayer = 1; // 1 = Black, 2 = White
        this.playerColor = 1; // Human defaults to Black (Obsidian)
        this.gameOver = false;
        this.history = [];
        this.isAnimating = false;
        this.hintMove = null;

        this.init();
    }

    init() {
        this.setupBoard();
        this.setupEventListeners();
        this.render();
        this.updateStatus("Waiting for your move...");
    }

    setupBoard() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        // Initial 4 pieces in the center
        this.board[3][3] = 2;
        this.board[3][4] = 1;
        this.board[4][3] = 1;
        this.board[4][4] = 2;
        this.currentPlayer = 1;
        this.gameOver = false;
        this.history = [];
    }

    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.setupBoard();
            this.render();
            this.updateStatus("Game Restarted");
            document.getElementById('game-over-overlay').classList.add('hidden');
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.setupBoard();
            this.render();
            document.getElementById('game-over-overlay').classList.add('hidden');
        });

        document.getElementById('switch-btn').addEventListener('click', () => this.switchSides());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    }

    showHint() {
        if (this.currentPlayer !== this.playerColor || this.gameOver || this.isAnimating) return;

        const moves = this.getValidMoves(this.currentPlayer);
        if (moves.length === 0) return;

        // Use same heuristic weights as AI to find best move for human
        const weights = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [10, -2, 5, 1, 1, 5, -2, 10],
            [5, -2, 1, 0, 0, 1, -2, 5],
            [5, -2, 1, 0, 0, 1, -2, 5],
            [10, -2, 5, 1, 1, 5, -2, 10],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [100, -20, 10, 5, 5, 10, -20, 100]
        ];

        let bestMove = moves[0];
        let maxWeight = -Infinity;

        for (let move of moves) {
            const w = weights[move.r][move.c];
            if (w > maxWeight) {
                maxWeight = w;
                bestMove = move;
            }
        }

        this.hintMove = bestMove;
        this.updateStatus("HINT: BEST SPOT HIGHLIGHTED");
        this.render();
    }

    switchSides() {
        if (this.isAnimating) return;
        this.playerColor = this.playerColor === 1 ? 2 : 1;
        this.setupBoard();
        this.render();
        this.updateStatus(`Now playing as ${this.playerColor === 1 ? 'Black' : 'White'}`);

        // If human is now White, AI goes first as Black
        if (this.playerColor === 2) {
            setTimeout(() => this.aiMove(), 800);
        }
    }

    // --- Core Logic ---

    isValidMove(r, c, player) {
        if (this.board[r][c] !== 0) return false;

        const opponent = player === 1 ? 2 : 1;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (let [dr, dc] of directions) {
            let nr = r + dr;
            let nc = c + dc;
            let foundOpponent = false;

            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (this.board[nr][nc] === opponent) {
                    foundOpponent = true;
                } else if (this.board[nr][nc] === player) {
                    if (foundOpponent) return true;
                    break;
                } else {
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
        return false;
    }

    getValidMoves(player) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(r, c, player)) {
                    moves.push({ r, c });
                }
            }
        }
        return moves;
    }

    async executeMove(r, c) {
        if (this.gameOver || this.isAnimating) return;
        if (!this.isValidMove(r, c, this.currentPlayer)) return;

        this.hintMove = null; // Clear hint on move

        // Save for undo
        this.history.push(JSON.stringify({
            board: this.board.map(row => [...row]),
            player: this.currentPlayer
        }));

        this.isAnimating = true;
        this.board[r][c] = this.currentPlayer;

        const piecesToFlip = this.getPiecesToFlip(r, c, this.currentPlayer);

        // Render immediate placement
        this.render();

        // Sequential flipping for visual impact
        for (let [fr, fc] of piecesToFlip) {
            this.board[fr][fc] = this.currentPlayer;
            // Trigger partial render for just this piece flip animation
            this.animateFlip(fr, fc);
            await new Promise(res => setTimeout(res, 80)); // Cascading effect
        }

        await new Promise(res => setTimeout(res, 300)); // Finish animations
        this.isAnimating = false;

        this.switchTurns();
    }

    getPiecesToFlip(r, c, player) {
        const opponent = player === 1 ? 2 : 1;
        const flipList = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (let [dr, dc] of directions) {
            let nr = r + dr;
            let nc = c + dc;
            const temp = [];

            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (this.board[nr][nc] === opponent) {
                    temp.push([nr, nc]);
                } else if (this.board[nr][nc] === player) {
                    flipList.push(...temp);
                    break;
                } else {
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
        return flipList;
    }

    switchTurns() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        const validMoves = this.getValidMoves(this.currentPlayer);
        const isAiTurn = this.currentPlayer !== this.playerColor;

        if (validMoves.length === 0) {
            // Check if other player has moves
            const otherPlayer = this.currentPlayer === 1 ? 2 : 1;
            const otherMoves = this.getValidMoves(otherPlayer);

            if (otherMoves.length === 0) {
                this.endGame();
            } else {
                this.updateStatus(`${this.currentPlayer === 1 ? 'Black' : 'White'} has no moves. Skipping...`);
                setTimeout(() => this.switchTurns(), 1000);
            }
        } else {
            this.updateStatus(isAiTurn ? "AI is thinking..." : "Your move");
            this.render();

            if (isAiTurn) {
                setTimeout(() => this.aiMove(), 800);
            }
        }
    }

    // --- AI Engine ---

    aiMove() {
        const aiColor = this.playerColor === 1 ? 2 : 1;
        const moves = this.getValidMoves(this.currentPlayer);
        if (moves.length === 0 || this.currentPlayer !== aiColor) return;

        // Heuristic Weights
        const weights = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [10, -2, 5, 1, 1, 5, -2, 10],
            [5, -2, 1, 0, 0, 1, -2, 5],
            [5, -2, 1, 0, 0, 1, -2, 5],
            [10, -2, 5, 1, 1, 5, -2, 10],
            [-20, -50, -2, -2, -2, -2, -50, -20],
            [100, -20, 10, 5, 5, 10, -20, 100]
        ];

        // Pick move with highest weight
        let bestMove = moves[0];
        let maxWeight = -Infinity;

        for (let move of moves) {
            const w = weights[move.r][move.c];
            if (w > maxWeight) {
                maxWeight = w;
                bestMove = move;
            }
        }

        this.executeMove(bestMove.r, bestMove.c);
    }

    // --- Visuals & Rendering ---

    render() {
        const boardEl = document.getElementById('othello-board');
        boardEl.innerHTML = '';

        const isUserTurn = this.currentPlayer === this.playerColor;
        const validMoves = isUserTurn ? this.getValidMoves(this.playerColor) : [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';

                const isValid = validMoves.some(m => m.r === r && m.c === c);
                if (isValid) cell.classList.add('valid-move');

                // Apply hint highlight
                if (this.hintMove && this.hintMove.r === r && this.hintMove.c === c) {
                    cell.classList.add('hint');
                }

                cell.addEventListener('click', () => {
                    if (isUserTurn) this.executeMove(r, c);
                });

                if (this.board[r][c] !== 0) {
                    const piece = document.createElement('div');
                    piece.className = 'piece';
                    piece.id = `piece-${r}-${c}`;

                    const blackFace = document.createElement('div');
                    blackFace.className = 'piece-face face-black';

                    const whiteFace = document.createElement('div');
                    whiteFace.className = 'piece-face face-white';

                    piece.appendChild(blackFace);
                    piece.appendChild(whiteFace);

                    // Set rotation based on color
                    if (this.board[r][c] === 2) {
                        piece.classList.add('flipping');
                    }

                    cell.appendChild(piece);
                }

                boardEl.appendChild(cell);
            }
        }

        this.updateStats();
    }

    animateFlip(r, c) {
        const piece = document.getElementById(`piece-${r}-${c}`);
        if (piece) {
            if (this.board[r][c] === 2) {
                piece.classList.add('flipping');
            } else {
                piece.classList.remove('flipping');
            }
        }
    }

    updateStats() {
        let black = 0;
        let white = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === 1) black++;
                if (this.board[r][c] === 2) white++;
            }
        }

        document.getElementById('score-black').textContent = black;
        document.getElementById('score-white').textContent = white;

        document.getElementById('score-black-panel').classList.toggle('active', this.currentPlayer === 1);
        document.getElementById('score-white-panel').classList.toggle('active', this.currentPlayer === 2);

        // Update Labels
        document.getElementById('label-black').textContent = this.playerColor === 1 ? "YOU" : "AI";
        document.getElementById('label-white').textContent = this.playerColor === 2 ? "YOU" : "AI";

        const isAiTurn = this.currentPlayer !== this.playerColor;
        document.getElementById('turn-text').textContent =
            isAiTurn ? "AI IS THINKING..." : "PLAYER'S TURN";
    }

    updateStatus(msg) {
        document.getElementById('status-msg').textContent = msg.toUpperCase();
    }

    undo() {
        if (this.history.length === 0 || this.isAnimating) return;

        const lastState = JSON.parse(this.history.pop());
        this.board = lastState.board;
        this.currentPlayer = lastState.player;
        this.render();
        this.updateStatus("Move Undone");
    }

    endGame() {
        this.gameOver = true;
        let black = 0;
        let white = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === 1) black++;
                if (this.board[r][c] === 2) white++;
            }
        }

        const overlay = document.getElementById('game-over-overlay');
        const winnerText = document.getElementById('winner-text');

        if (black === white) {
            winnerText.textContent = "IT'S A DRAW!";
        } else {
            const winnerColor = black > white ? 1 : 2;
            const userWon = winnerColor === this.playerColor;
            winnerText.textContent = userWon ? "YOU WIN!" : "AI WINS";

            // Add flavor text
            winnerText.innerHTML += `<br><span style="font-size: 0.8rem; letter-spacing: 1px; color: var(--text-secondary)">
                ${black > white ? 'OBSIDIAN' : 'MARBLE'} DOMINATES
            </span>`;
        }

        document.getElementById('final-score-black').textContent = black;
        document.getElementById('final-score-white').textContent = white;

        overlay.classList.remove('hidden');
    }
}

// Start Game
window.addEventListener('load', () => {
    new OthelloGame();
});
