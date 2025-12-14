document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const computerBoardContainer = document.getElementById('computer-board-main-container');
    const shipOptions = document.getElementById('ship-options');
    const orientationToggle = document.getElementById('orientation-toggle');
    const startButton = document.getElementById('start-button');
    const deleteButton = document.getElementById('delete-button');
    const info = document.getElementById('info');
    const turnInfo = document.getElementById('turn-info');
    const shipPlacementContainer = document.getElementById('ship-placement-container');

    const width = 10;
    const playerGrid = [];
    const computerGrid = [];
    let isHorizontal = true;
    let selectedShipName = null;

    const ships = [
        { name: 'destroyer', size: 2, placed: false, isHorizontal: true },
        { name: 'submarine', size: 3, placed: false, isHorizontal: true },
        { name: 'cruiser', size: 3, placed: false, isHorizontal: true },
        { name: 'battleship', size: 4, placed: false, isHorizontal: true },
        { name: 'carrier', size: 5, placed: false, isHorizontal: true }
    ];

    function createGrid(board, grid) {
        for (let i = 0; i < width * width; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.id = i;
            board.appendChild(cell);
            grid.push(cell);
        }
    }

    function renderShipOptions() {
        shipOptions.innerHTML = '';
        ships.forEach(ship => {
            if (!ship.placed) {
                const shipOption = document.createElement('div');
                shipOption.classList.add('ship-option');
                shipOption.draggable = true;
                shipOption.dataset.ship = ship.name;
                shipOption.dataset.size = ship.size;

                const shipPreview = document.createElement('div');
                shipPreview.classList.add('ship-preview');
                for (let i = 0; i < ship.size; i++) {
                    const segment = document.createElement('div');
                    segment.classList.add('ship-segment');
                    shipPreview.appendChild(segment);
                }
                shipOption.appendChild(shipPreview);
                shipOptions.appendChild(shipOption);
                shipOption.addEventListener('dragstart', dragStart);
            }
        });
    }

    function dragStart(e) {
        const target = e.target.closest('.ship-option') || e.target;
        const shipName = target.dataset.ship || ships.find(s => target.classList.contains(s.name))?.name;
        const ship = ships.find(s => s.name === shipName);

        if (ship) {
            const isReDragging = ship.placed;
            const currentOrientationIsHorizontal = isReDragging ? ship.isHorizontal : isHorizontal;

            e.dataTransfer.setData('text/plain', JSON.stringify({
                shipName: ship.name,
                shipSize: ship.size,
                isReDrag: isReDragging,
                isHorizontal: currentOrientationIsHorizontal
            }));

            if (isReDragging) {
                setTimeout(() => removeShip(parseInt(target.dataset.id), true), 0);
            }
            
            const dragImage = document.createElement('div');
            const shipPreview = document.createElement('div');
            dragImage.appendChild(shipPreview);
            shipPreview.classList.add('ship-preview');

            if (!currentOrientationIsHorizontal) {
                shipPreview.style.flexDirection = 'column';
            }

            for (let i = 0; i < ship.size; i++) {
                const segment = document.createElement('div');
                segment.classList.add('ship-segment');
                shipPreview.appendChild(segment);
            }
            dragImage.style.position = 'absolute';
            dragImage.style.left = '-1000px'; // Move off-screen
            dragImage.style.top = '-1000px';  // Move off-screen
            document.body.appendChild(dragImage);

            // Set the drag image to be the custom visual, with an offset of (0,0)
            // This means the top-left of our custom dragImage will be at the cursor. 
            e.dataTransfer.setDragImage(dragImage, 0, 0); 

            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
    }

    function placeShip(startId, shipSize, isHorizontalPlacement, shipName, isReDrag = false) {
        const cellsToOccupy = [];
        let validPlacement = true;

        for (let i = 0; i < shipSize; i++) {
            let currentId;
            if (isHorizontalPlacement) {
                currentId = startId + i;
                if (Math.floor(currentId / width) !== Math.floor(startId / width)) {
                    validPlacement = false;
                    break;
                }
            } else {
                currentId = startId + i * width;
                if (currentId >= width * width) {
                    validPlacement = false;
                    break;
                }
            }
            cellsToOccupy.push(currentId);
        }

        const isOccupied = cellsToOccupy.some(id => playerGrid[id].classList.contains('ship'));

        if (validPlacement && !isOccupied) {
            const ship = ships.find(s => s.name === shipName);
            cellsToOccupy.forEach(id => {
                playerGrid[id].classList.add('ship', shipName);
                playerGrid[id].dataset.ship = shipName;
                playerGrid[id].draggable = true;
            });
            ship.placed = true;
            ship.isHorizontal = isHorizontalPlacement;
            renderShipOptions();
        } else {
            info.textContent = 'Invalid placement.';
            if (isReDrag) {
                 const ship = ships.find(s => s.name === shipName);
                 ship.placed = false;
                 renderShipOptions();
            }
        }
    }

    function removeShip(startId, isReDragging = false) {
        const shipName = playerGrid[startId].dataset.ship;
        if (!shipName) return;

        const ship = ships.find(s => s.name === shipName);
        if (!ship) return;

        for (let i = 0; i < width * width; i++) {
            if (playerGrid[i].classList.contains(shipName)) {
                playerGrid[i].classList.remove('ship', shipName, 'selected-ship');
                playerGrid[i].draggable = false;
                delete playerGrid[i].dataset.ship;
            }
        }

        ship.placed = false;
        if (selectedShipName === shipName) {
            selectedShipName = null;
            deleteButton.classList.add('hidden');
        }
        if (!isReDragging) {
            renderShipOptions();
        }
    }

    function rotateShip(startId) {
        const shipName = playerGrid[startId].dataset.ship;
        if (!shipName) return;

        const ship = ships.find(s => s.name === shipName);
        if (!ship) return;

        const isCurrentlyHorizontal = ship.isHorizontal;
        const newIsHorizontal = !isCurrentlyHorizontal;
        
        const shipCells = playerGrid.filter(cell => cell.classList.contains(shipName));
        const firstCellId = parseInt(shipCells[0].dataset.id);

        removeShip(firstCellId, true);

        const cellsToOccupy = [];
        let validPlacement = true;

        for (let i = 0; i < ship.size; i++) {
            let currentId;
            if (newIsHorizontal) {
                currentId = firstCellId + i;
                if (Math.floor(currentId / width) !== Math.floor(firstCellId / width)) {
                    validPlacement = false;
                    break;
                }
            } else {
                currentId = firstCellId + i * width;
                if (currentId >= width * width) {
                    validPlacement = false;
                    break;
                }
            }
            cellsToOccupy.push(currentId);
        }

        const isOccupied = cellsToOccupy.some(id => playerGrid[id].classList.contains('ship'));

        if (validPlacement && !isOccupied) {
            placeShip(firstCellId, ship.size, newIsHorizontal, ship.name, true);
        } else {
            placeShip(firstCellId, ship.size, isCurrentlyHorizontal, ship.name, true);
            info.textContent = 'Invalid rotation.';
        }
    }

    function selectShip(shipName) {
        playerGrid.forEach(cell => cell.classList.remove('selected-ship'));
        if (shipName) {
            playerGrid.forEach(cell => {
                if (cell.classList.contains(shipName)) {
                    cell.classList.add('selected-ship');
                }
            });
            deleteButton.classList.remove('hidden');
        } else {
            deleteButton.classList.add('hidden');
        }
        selectedShipName = shipName;
    }

    createGrid(playerBoard, playerGrid);
    createGrid(computerBoard, computerGrid);

    playerGrid.forEach(cell => {
        cell.addEventListener('dragstart', dragStart);
        cell.addEventListener('dragover', e => e.preventDefault());
        cell.addEventListener('drop', e => {
            e.preventDefault();
            let data;
            try {
                const dataString = e.dataTransfer.getData('text/plain');
                data = JSON.parse(dataString);
            } catch (error) {
                info.textContent = 'Error during drop: Invalid ship data.';
                return;
            }

            if (data && data.shipName) {
                placeShip(parseInt(e.target.dataset.id), data.shipSize, data.isHorizontal, data.shipName, data.isReDrag);
            } else {
                info.textContent = 'Drop failed: Missing ship data.';
            }
        });
        cell.addEventListener('click', e => {
            const shipName = e.target.dataset.ship;
            selectShip(shipName);
        });
        cell.addEventListener('dblclick', e => {
            const shipName = e.target.dataset.ship;
            if (shipName) {
                rotateShip(parseInt(e.target.dataset.id));
            }
        });
    });

    renderShipOptions();
    computerBoardContainer.style.setProperty('display', 'none', 'important');

    orientationToggle.addEventListener('change', () => {
        isHorizontal = !orientationToggle.checked;
    });

    deleteButton.addEventListener('click', () => {
        if (selectedShipName) {
            const shipCell = playerGrid.find(cell => cell.classList.contains(selectedShipName));
            if (shipCell) {
                removeShip(parseInt(shipCell.dataset.id));
            }
        }
    });
    
    startButton.addEventListener('click', () => {
        if (ships.every(s => s.placed)) {
            startGame();
        } else {
            info.textContent = 'Please place all your ships before starting the game.';
        }
    });

    function placeComputerShips() {
        const computerShips = [
            { name: 'destroyer', size: 2 },
            { name: 'submarine', size: 3 },
            { name: 'cruiser', size: 3 },
            { name: 'battleship', size: 4 },
            { name: 'carrier', size: 5 }
        ];

        computerShips.forEach(ship => {
            let placed = false;
            while (!placed) {
                const isHorizontalPlacement = Math.random() < 0.5;
                const startId = Math.floor(Math.random() * (width * width));
                
                const cellsToOccupy = [];
                let validPlacement = true;

                for (let i = 0; i < ship.size; i++) {
                    let currentId;
                    if (isHorizontalPlacement) {
                        currentId = startId + i;
                        if (Math.floor(currentId / width) !== Math.floor(startId / width)) {
                            validPlacement = false;
                            break;
                        }
                    } else {
                        currentId = startId + i * width;
                        if (currentId >= width * width) {
                            validPlacement = false;
                            break;
                        }
                    }
                    cellsToOccupy.push(currentId);
                }

                if (validPlacement) {
                    const isOccupied = cellsToOccupy.some(id => computerGrid[id].classList.contains('ship'));
                    if (!isOccupied) {
                        cellsToOccupy.forEach(id => {
                            computerGrid[id].classList.add('ship', ship.name);
                        });
                        placed = true;
                    }
                }
            }
        });
    }

    let gameOver = false;
    let playerTurn = true;
    let playerHits = 0;
    let computerHits = 0;
    const totalShipSize = ships.reduce((sum, ship) => sum + ship.size, 0);

    function checkPlayerWin() {
        if (playerHits === totalShipSize) {
            info.textContent = 'You win!';
            gameOver = true;
        }
    }

    function checkComputerWin() {
        if (computerHits === totalShipSize) {
            info.textContent = 'Computer wins!';
            gameOver = true;
        }
    }

    function playerAttack(cell) {
        if (!gameOver && playerTurn && !cell.classList.contains('hit') && !cell.classList.contains('miss')) {
            if (cell.classList.contains('ship')) {
                cell.classList.add('hit');
                info.textContent = 'It\'s a hit!';
                playerHits++;
                checkPlayerWin();
            } else {
                cell.classList.add('miss');
                info.textContent = 'It\'s a miss!';
            }
            playerTurn = false;
            turnInfo.textContent = "Computer's turn.";
            setTimeout(computerAttack, 1000);
        }
    }

    function computerAttack() {
        if (!gameOver) {
            let attackId;
            do {
                attackId = Math.floor(Math.random() * (width * width));
            } while (playerGrid[attackId].classList.contains('hit') || playerGrid[attackId].classList.contains('miss'));

            if (playerGrid[attackId].classList.contains('ship')) {
                playerGrid[attackId].classList.add('hit');
                info.textContent = 'The computer hit your ship!';
                computerHits++;
                checkComputerWin();
            } else {
                playerGrid[attackId].classList.add('miss');
                info.textContent = 'The computer missed.';
            }
            playerTurn = true;
            turnInfo.textContent = "Your turn.";
        }
    }

    computerGrid.forEach(cell => {
        cell.addEventListener('click', () => {
            playerAttack(cell);
        });
    });

    function startGame() {
        playerGrid.forEach(cell => {
            cell.draggable = false;
        });
        
        placeComputerShips();
        shipPlacementContainer.style.display = 'none';
        computerBoardContainer.style.display = 'flex';
        info.textContent = 'Game Started!';
        turnInfo.textContent = "Your turn.";
    }
});
