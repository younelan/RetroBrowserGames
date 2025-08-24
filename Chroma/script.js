document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const boardContainer = document.getElementById('board-container');
    const targetGrid = document.getElementById('target-grid');
    const levelDisplay = document.getElementById('level');
    const movesDisplay = document.getElementById('moves');
    const hintButton = document.getElementById('hint-button');
    const helpButton = document.getElementById('help-button');
    const restartButton = document.getElementById('restart-button');
    const winModal = document.getElementById('win-modal');
    const helpModal = document.getElementById('help-modal');
    const restartModal = document.getElementById('restart-modal');
    const starContainer = document.getElementById('star-container');
    const finalMovesDisplay = document.getElementById('final-moves');
    const nextLevelButton = document.getElementById('next-level-button');
    const closeHelpButton = document.getElementById('close-help-button');
    const restartLevelButton = document.getElementById('restart-level-button');
    const restartFullGameButton = document.getElementById('restart-full-game-button');
    const cancelRestartButton = document.getElementById('cancel-restart-button');

    const colors = ['#ff6b6b', '#f0e68c', '#84fab0', '#8fd3f4', '#a18cd1'];

    const levels = [
        { grid: [[0, 1], [2, 0]], target: [[0, 0], [1, 2]], stars: { 3: 2, 2: 4 } },
        { grid: [[0, 1, 2], [1, 2, 0], [2, 0, 1]], target: [[1, 1, 1], [0, 0, 0], [2, 2, 2]], stars: { 3: 4, 2: 6 } },
        { grid: [[0, 1, 2], ['L', 2, 0], [2, 0, 1]], target: [[1, 1, 1], ['L', 0, 0], [2, 2, 2]], stars: { 3: 5, 2: 7 } },
        { grid: [[0, 1, 'W'], [1, 2, 0], [2, 0, 1]], target: [[1, 1, 1], [0, 0, 0], [2, 2, 2]], stars: { 3: 3, 2: 5 } }
    ];

    let currentLevel = 0;
    let moves = 0;
    let grid = [];
    let hintInCooldown = false;

    function deepCopy(arr) { return JSON.parse(JSON.stringify(arr)); }

    function resizeGame() {
        const gridSize = grid.length || 2;

        // Get the actual, rendered size of the containers which are controlled by CSS.
        const boardContainerSize = boardContainer.getBoundingClientRect().width;
        const infoAreaWrapperSize = document.getElementById('info-area-wrapper').getBoundingClientRect().width;

        // Calculate the size of the tiles within those containers.
        root.style.setProperty('--tile-size', `${boardContainerSize / gridSize}px`);

        // Calculate and set target grid size explicitly (40% of info-area-wrapper's width)
        const targetGridSize = infoAreaWrapperSize * 0.40;
        targetGrid.style.width = `${targetGridSize}px`;
        targetGrid.style.height = `${targetGridSize}px`;
        root.style.setProperty('--target-tile-size', `${targetGridSize / gridSize}px`);
    }

    function renderGrid(container, gridData) {
        container.innerHTML = '';
        const gridSize = gridData.length;
        container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        gridData.forEach((row, r) => {
            row.forEach((cell, c) => {
                const tile = document.createElement('div');
                tile.classList.add(container === boardContainer ? 'tile' : 'target-tile');
                if (typeof cell === 'number') tile.style.backgroundColor = colors[cell];
                else if (cell === 'L') tile.classList.add('locked-tile');
                else if (cell === 'W') tile.classList.add('wildcard-tile');
                tile.dataset.r = r;
                tile.dataset.c = c;
                container.appendChild(tile);
            });
        });
    }

    function loadLevel(levelIndex) {
        if (levelIndex >= levels.length) {
            alert("You've completed all levels!");
            return;
        }
        currentLevel = levelIndex;
        const levelData = levels[currentLevel];
        grid = deepCopy(levelData.grid);
        moves = 0;
        hintInCooldown = false;
        hintButton.disabled = false;

        levelDisplay.textContent = currentLevel + 1;
        movesDisplay.textContent = moves;

        renderGrid(boardContainer, grid);
        renderGrid(targetGrid, levelData.target);
        resizeGame(); // Resize after rendering
        winModal.classList.add('hidden');
        helpModal.classList.add('hidden');
        restartModal.classList.add('hidden'); // Hide restart modal on level load
    }

    function isGridSolved(gridState) {
        const target = levels[currentLevel].target;
        for (let r = 0; r < gridState.length; r++) {
            for (let c = 0; c < gridState[r].length; c++) {
                const boardCell = gridState[r][c];
                const targetCell = target[r][c];
                if (targetCell === 'W' || boardCell === 'W') continue;
                if (boardCell !== targetCell) return false;
            }
        }
        return true;
    }

    function showWinModal() {
        winModal.classList.remove('hidden');
        const levelData = levels[currentLevel];
        let stars = 1;
        if (moves <= levelData.stars[3]) stars = 3;
        else if (moves <= levelData.stars[2]) stars = 2;
        starContainer.innerHTML = '&#9733;'.repeat(stars) + '&#9734;'.repeat(3 - stars);
        finalMovesDisplay.textContent = moves;
    }

    function shift(r, c, dx, dy) {
        moves++;
        movesDisplay.textContent = moves;
        const tempGrid = deepCopy(grid);
        if (dx !== 0) {
            const row = tempGrid[r];
            const newRow = Array(row.length);
            for (let i = 0; i < row.length; i++) {
                if (row[i] === 'L') { newRow[i] = 'L'; continue; }
                let newIndex = i;
                do { newIndex = (newIndex - dx + row.length) % row.length; } while (row[newIndex] === 'L');
                newRow[i] = row[newIndex];
            }
            tempGrid[r] = newRow;
        } else {
            const col = tempGrid.map(row => row[c]);
            const newCol = Array(col.length);
            for (let i = 0; i < col.length; i++) {
                if (col[i] === 'L') { newCol[i] = 'L'; continue; }
                let newIndex = i;
                do { newIndex = (newIndex - dy + col.length) % col.length; } while (col[newIndex] === 'L');
                newCol[i] = col[newIndex];
            }
            for (let i = 0; i < tempGrid.length; i++) { tempGrid[i][c] = newCol[i]; }
        }
        grid = tempGrid;
        renderGrid(boardContainer, grid);
        if (isGridSolved(grid)) { setTimeout(showWinModal, 500); }
    }

    function getHint() {
        const queue = [{ state: deepCopy(grid), path: [] }];
        const visited = new Set([JSON.stringify(grid)]);
        while (queue.length > 0) {
            const { state, path } = queue.shift();
            if (isGridSolved(state)) return path[0];
            for (let i = 0; i < state.length; i++) {
                for (const dir of [-1, 1]) {
                    const nextStateRow = deepCopy(state);
                    const row = nextStateRow[i];
                    const newRow = Array(row.length);
                    for (let k = 0; k < row.length; k++) {
                        if (row[k] === 'L') { newRow[k] = 'L'; continue; }
                        let newIndex = k;
                        do { newIndex = (newIndex - dir + row.length) % row.length; } while (row[newIndex] === 'L');
                        newRow[k] = row[newIndex];
                    }
                    nextStateRow[i] = newRow;
                    const stateStr = JSON.stringify(nextStateRow);
                    if (!visited.has(stateStr)) {
                        visited.add(stateStr);
                        queue.push({ state: nextStateRow, path: path.concat({ type: 'row', index: i, dir }) });
                    }
                    const nextStateCol = deepCopy(state);
                    const col = nextStateCol.map(r => r[i]);
                    const newCol = Array(col.length);
                    for (let k = 0; k < col.length; k++) {
                        if (col[k] === 'L') { newCol[k] = 'L'; continue; }
                        let newIndex = k;
                        do { newIndex = (newIndex - dy + col.length) % col.length; } while (col[newIndex] === 'L');
                        newCol[k] = col[newIndex];
                    }
                    for (let k = 0; k < nextStateCol.length; k++) nextStateCol[k][i] = newCol[k];
                    const stateStrCol = JSON.stringify(nextStateCol);
                    if (!visited.has(stateStrCol)) {
                        visited.add(stateStrCol);
                        queue.push({ state: nextStateCol, path: path.concat({ type: 'col', index: i, dir }) });
                    }
                }
            }
        }
        return null;
    }

    function showVisualHint(hint) {
        if (!hint) return;
        hintInCooldown = true;
        hintButton.disabled = true;
        const arrow = document.createElement('div');
        arrow.classList.add('hint-arrow');
        if (hint.type === 'row') {
            arrow.textContent = hint.dir === 1 ? '→' : '←';
            const tile = boardContainer.querySelector(`[data-r='${hint.index}'][data-c='${Math.floor(grid.length / 2)}']`);
            if(tile) tile.appendChild(arrow);
            for (let c = 0; c < grid.length; c++) { boardContainer.querySelector(`[data-r='${hint.index}'][data-c='${c}']`).classList.add('hint-highlight'); }
        } else {
            arrow.textContent = hint.dir === 1 ? '↓' : '↑';
            const tile = boardContainer.querySelector(`[data-r='${Math.floor(grid.length / 2)}'][data-c='${hint.index}']`);
            if(tile) tile.appendChild(arrow);
            for (let r = 0; r < grid.length; r++) { boardContainer.querySelector(`[data-r='${r}'][data-c='${hint.index}']`).classList.add('hint-highlight'); }
        }
        setTimeout(() => {
            document.querySelectorAll('.hint-highlight').forEach(t => t.classList.remove('hint-highlight'));
            arrow.remove();
            setTimeout(() => { hintInCooldown = false; hintButton.disabled = false; }, 5000);
        }, 1500);
    }

    let dragStart = null;
    boardContainer.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('tile')) {
            dragStart = { x: e.clientX, y: e.clientY, r: e.target.dataset.r, c: e.target.dataset.c };
            e.target.style.cursor = 'grabbing';
        }
    });
    boardContainer.addEventListener('pointermove', (e) => {
        if (!dragStart) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const r = parseInt(dragStart.r), c = parseInt(dragStart.c);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            shift(r, c, dx > 0 ? 1 : -1, 0);
        } else {
            shift(r, c, 0, dy > 0 ? 1 : -1);
        }
        dragStart = null;
    });
    boardContainer.addEventListener('pointerup', (e) => {
        if (dragStart) { e.target.style.cursor = 'grab'; dragStart = null; }
    });

    hintButton.addEventListener('click', () => { if (!hintInCooldown) { showVisualHint(getHint()); } });
    helpButton.addEventListener('click', () => { helpModal.classList.remove('hidden'); });
    closeHelpButton.addEventListener('click', () => { helpModal.classList.add('hidden'); });
    restartButton.addEventListener('click', () => { restartModal.classList.remove('hidden'); });
    restartLevelButton.addEventListener('click', () => { loadLevel(currentLevel); });
    restartFullGameButton.addEventListener('click', () => { loadLevel(0); });
    cancelRestartButton.addEventListener('click', () => { restartModal.classList.add('hidden'); });
    nextLevelButton.addEventListener('click', () => { loadLevel(currentLevel + 1); });

    window.addEventListener('resize', resizeGame);
    loadLevel(0);
});