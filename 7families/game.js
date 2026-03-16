// Game data - 7 families with 6 members each
const FAMILIES = [
    { name: 'Baker', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] },
    { name: 'Fisher', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] },
    { name: 'Astronaut', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] },
    { name: 'Athlete', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] },
    { name: 'Circus', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] },
    { name: 'Musician', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] },
    { name: 'Farmer', members: ['Grandpa', 'Grandma', 'Dad', 'Mom', 'Son', 'Daughter'] }
];

// Asset directory
const ASSET_DIR = 'assets';

// Game state
let deck = [];
let playerHand = [];
let aiHand = [];
let playerFamilies = [];
let aiFamilies = [];
let currentPlayer = 'player';
let lastTurnAction = '';
let gameActive = false;

// DOM elements
const playerHandEl = document.getElementById('player-hand');
const playerFamiliesEl = document.getElementById('player-families');
const aiFamiliesEl = document.getElementById('ai-families');
const deckCountEl = document.getElementById('deck-count');
const turnIndicatorEl = document.getElementById('turn-indicator');
const questionTextEl = document.getElementById('question-text');
const topBarEl = document.getElementById('top-bar');
const familySelectEl = document.getElementById('family-select');
const memberSelectEl = document.getElementById('member-select');
const laydownAreaEl = document.getElementById('laydown-area');
const gameOverEl = document.getElementById('game-over');
const winnerTextEl = document.getElementById('winner-text');
const restartBtn = document.getElementById('restart-btn');

// Initialize game
function initGame() {
    // Create deck
    deck = [];
    FAMILIES.forEach(family => {
        family.members.forEach(member => {
            deck.push({ family: family.name, member: member });
        });
    });
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Deal cards (7 cards each)
    playerHand = deck.splice(0, 7);
    aiHand = deck.splice(0, 7);
    
    // Reset families
    playerFamilies = [];
    aiFamilies = [];
    
    // Reset game state
    currentPlayer = 'player';
    gameActive = true;
    // start with no verbose last action; top-bar is single source of truth
    lastTurnAction = '';
    
    // Initialize dropdowns
    initializeDropdowns();
    
    // Update UI
    updateUI();
    gameOverEl.classList.add('hidden');
}

// Initialize dropdown selectors
function initializeDropdowns() {
    // Populate family select
    familySelectEl.innerHTML = '<option value="">Select Family...</option>';
    FAMILIES.forEach(family => {
        const option = document.createElement('option');
        option.value = family.name;
        option.textContent = family.name;
        familySelectEl.appendChild(option);
    });
    
    // Reset member select
    memberSelectEl.innerHTML = '<option value="">Select Member...</option>';
    memberSelectEl.disabled = true;
    
    // Add event listeners
    familySelectEl.addEventListener('change', onFamilySelect);
    memberSelectEl.addEventListener('change', onMemberSelect);
}

// Handle family selection
function onFamilySelect() {
    if (currentPlayer !== 'player' || !gameActive) return;
    
    const selectedFamily = familySelectEl.value;
    
    if (selectedFamily) {
        // Populate member select with checkmarks for owned cards
        const family = FAMILIES.find(f => f.name === selectedFamily);
        memberSelectEl.innerHTML = '<option value="">Select Member...</option>';
        
        if (family) {
            family.members.forEach(member => {
                const option = document.createElement('option');
                option.value = member;
                
                // Check if player has this card
                const hasCard = playerHand.some(card => 
                    card.family === selectedFamily && card.member === member
                );
                
                option.textContent = hasCard ? `✓ ${member}` : member;
                memberSelectEl.appendChild(option);
            });
        }
        
        memberSelectEl.disabled = false;
        lastTurnAction = `Select a member of ${selectedFamily}`;
        updateUI();
    } else {
        memberSelectEl.innerHTML = '<option value="">Select Member...</option>';
        memberSelectEl.disabled = true;
        lastTurnAction = 'Select a family to ask about';
        updateUI();
    }
}

// Handle member selection
function onMemberSelect() {
    if (currentPlayer !== 'player' || !gameActive) return;
    
    const selectedFamily = familySelectEl.value;
    const selectedMember = memberSelectEl.value;
    
    if (selectedFamily && selectedMember) {
        lastTurnAction = `Asking: Do you have ${selectedMember} from ${selectedFamily}?`;
        updateUI();

        // Delay before asking
        setTimeout(() => {
            playerAsk(selectedFamily, selectedMember);
        }, 700);
    }
}

// Create card HTML
function createCardHTML(card, isNew = false, compact = false) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card' + (compact ? ' compact' : '');
    if (isNew) {
        cardEl.classList.add('new-card');
        // Remove the animation class after it completes
        setTimeout(() => {
            cardEl.classList.remove('new-card');
        }, 2000);
    }
    cardEl.dataset.family = card.family;
    cardEl.dataset.member = card.member;
    
    cardEl.innerHTML = `
        <div class="card-image">
            <img src="${ASSET_DIR}/${card.family.toLowerCase()}.${card.member.toLowerCase()}.png" 
                 alt="${card.member}" 
                 onerror="this.style.display='none'">
        </div>
        <div class="card-content">
            <div class="card-family">${card.family}</div>
            <div class="card-name">${card.member}</div>
        </div>
    `;
    
    return cardEl;
}

// Update UI
function updateUI(newCardFamily = null, newCardMember = null) {
    // Update player hand - grouped by family
    updatePlayerHand(newCardFamily, newCardMember);
    
    // Update families
    updateFamilies();
    
    // Update player info
    updatePlayerInfo();
    
    // Update deck count
    deckCountEl.textContent = deck.length;
    
    // Compact top bar: show turn and card counts on a single line
    if (topBarEl) {
        const who = currentPlayer === 'player' ? 'Your turn' : 'AI turn';
        const count = currentPlayer === 'player' ? playerHand.length : aiHand.length;
        topBarEl.textContent = `${who} (${count} card${count !== 1 ? 's' : ''}) • Deck ${deck.length}`;
    }
    
    // No persistent "last turn" UI — top bar is single source of truth.
    
    // Enable/disable dropdowns based on turn
    familySelectEl.disabled = currentPlayer !== 'player' || !gameActive;
    if (currentPlayer !== 'player') {
        memberSelectEl.disabled = true;
    }
    
    // Show lay down button if player has a complete family
    showLayDownButton();
}

// Update player hand - grouped by family
function updatePlayerHand(newCardFamily = null, newCardMember = null) {
    playerHandEl.innerHTML = '';
    // On small screens render compact family rows (one family per line)
    const isSmallScreen = window.matchMedia && window.matchMedia('(max-width:600px)').matches;
    
    // Determine compact mode: few cards or single family -> minimal padding/layout
    const familiesSet = new Set(playerHand.map(c => c.family));
    const compactMode = isSmallScreen && (playerHand.length <= 2 || familiesSet.size <= 1);
    if (compactMode) playerHandEl.classList.add('compact-mode'); else playerHandEl.classList.remove('compact-mode');

    if (isSmallScreen) {
        // Group cards by family
        const grouped = {};
        playerHand.forEach(card => {
            if (!grouped[card.family]) grouped[card.family] = [];
            grouped[card.family].push(card);
        });

        const families = Object.keys(grouped).sort((a,b) => {
            const diff = grouped[a].length - grouped[b].length;
            return diff !== 0 ? diff : a.localeCompare(b);
        });
        families.forEach(familyName => {
            const familyGroup = document.createElement('div');
            familyGroup.className = 'family-group compact';

            const header = document.createElement('div');
            header.className = 'family-group-header compact';
            header.textContent = `${familyName} (${grouped[familyName].length}/6)`;

            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'family-cards compact';

            grouped[familyName]
                .sort((a, b) => a.member.localeCompare(b.member))
                .forEach(card => {
                    const isNew = newCardFamily && newCardMember &&
                                  card.family === newCardFamily &&
                                  card.member === newCardMember;
                    cardsContainer.appendChild(createCardHTML(card, isNew, true));
                });

            familyGroup.appendChild(header);
            familyGroup.appendChild(cardsContainer);
            playerHandEl.appendChild(familyGroup);
        });

        return;
    }

    // Group cards by family (desktop / larger screens)
    const groupedCards = {};
    playerHand.forEach(card => {
        if (!groupedCards[card.family]) {
            groupedCards[card.family] = [];
        }
        groupedCards[card.family].push(card);
    });

    // Sort families by ascending member count, then alphabetically
    const sortedFamilies = Object.keys(groupedCards).sort((a,b) => {
        const diff = groupedCards[a].length - groupedCards[b].length;
        return diff !== 0 ? diff : a.localeCompare(b);
    });

    // Create family groups
    sortedFamilies.forEach(familyName => {
        const familyGroup = document.createElement('div');
        familyGroup.className = 'family-group';

        const header = document.createElement('div');
        header.className = 'family-group-header';
        header.textContent = `${familyName} (${groupedCards[familyName].length}/6)`;
        familyGroup.appendChild(header);

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'family-cards';

        // Sort members within family
        groupedCards[familyName]
            .sort((a, b) => a.member.localeCompare(b.member))
            .forEach(card => {
                // Mark as new if it matches the newly drawn card
                const isNew = newCardFamily && newCardMember && 
                              card.family === newCardFamily && 
                              card.member === newCardMember;
                cardsContainer.appendChild(createCardHTML(card, isNew));
            });

        familyGroup.appendChild(cardsContainer);
        playerHandEl.appendChild(familyGroup);
    });
}

// Update player info displays
function updatePlayerInfo() {
    // Player info
    const playerHandCount = document.querySelector('#player-area .hand-count');
    const playerFamiliesCount = document.querySelector('#player-area .families-count');
    
    if (playerHandCount) {
        playerHandCount.textContent = `${playerHand.length} card${playerHand.length !== 1 ? 's' : ''}`;
    }
    if (playerFamiliesCount) {
        playerFamiliesCount.textContent = `${playerFamilies.length} famil${playerFamilies.length !== 1 ? 'ies' : 'y'}`;
    }
    
    // AI info
    const aiHandCount = document.querySelector('#ai-area .hand-count');
    const aiFamiliesCount = document.querySelector('#ai-area .families-count');
    
    if (aiHandCount) {
        aiHandCount.textContent = `${aiHand.length} card${aiHand.length !== 1 ? 's' : ''}`;
    }
    if (aiFamiliesCount) {
        aiFamiliesCount.textContent = `${aiFamilies.length} famil${aiFamilies.length !== 1 ? 'ies' : 'y'}`;
    }
}

// Update families display
function updateFamilies() {
    playerFamiliesEl.innerHTML = '';
    playerFamilies.forEach(family => {
        const badge = document.createElement('div');
        badge.className = 'family-badge';
        badge.textContent = family;
        playerFamiliesEl.appendChild(badge);
    });
    
    aiFamiliesEl.innerHTML = '';
    aiFamilies.forEach(family => {
        const badge = document.createElement('div');
        badge.className = 'family-badge';
        badge.textContent = family;
        aiFamiliesEl.appendChild(badge);
    });
}

// Show lay down button
function showLayDownButton() {
    if (currentPlayer !== 'player' || !gameActive) {
        laydownAreaEl.innerHTML = '';
        return;
    }
    
    const family = canLayDownFamily();
    if (family) {
        laydownAreaEl.innerHTML = '';
        const btn = document.createElement('button');
        btn.id = 'laydown-btn';
        btn.textContent = `Lay Down ${family}`;
        btn.addEventListener('click', () => layDownFamily(family));
        laydownAreaEl.appendChild(btn);
    } else {
        laydownAreaEl.innerHTML = '';
    }
}

// Player asks for card
function playerAsk(askFamily, askMember) {
    if (!gameActive) return;
    
    // Find matching cards in AI hand
    const matchingCards = aiHand.filter(card => card.family === askFamily && card.member === askMember);
    
    setTimeout(() => {
        if (matchingCards.length > 0) {
            // AI has cards - transfer them
            playerHand.push(...matchingCards);
            aiHand = aiHand.filter(card => !(card.family === askFamily && card.member === askMember));
            
            // Check for complete families
            checkFamilies(playerHand, playerFamilies, 'player');
            
            lastTurnAction = `You got ${askMember} from ${askFamily}!`;
            
            // Player goes again
            setTimeout(() => {
                resetDropdowns();
                lastTurnAction = 'Your turn! Ask for another card.';
                updateUI();
            }, 700);
        } else {
            // AI doesn't have cards - go fish
            lastTurnAction = `AI said "Go Fish!" - You asked for ${askMember} from ${askFamily}`;
            
            setTimeout(() => {
                let drawnCard = null;
                if (deck.length > 0) {
                    drawnCard = deck.pop();
                    playerHand.push(drawnCard);
                    lastTurnAction += ` - You drew a card`;
                    
                    // Check for complete families
                    checkFamilies(playerHand, playerFamilies, 'player');
                }
                
                // Switch to AI turn
                currentPlayer = 'ai';
                resetDropdowns();
                updateUI(drawnCard ? drawnCard.family : null, drawnCard ? drawnCard.member : null);
                
                setTimeout(() => {
                    aiTurn();
                }, 1000);
            }, 1000);
        }
    }, 1000);
}

// Reset dropdowns
function resetDropdowns() {
    familySelectEl.value = '';
    memberSelectEl.value = '';
    memberSelectEl.innerHTML = '<option value="">Select Member...</option>';
    memberSelectEl.disabled = true;
}

// AI turn
function aiTurn() {
    if (!gameActive) return;
    
    // Check if AI has cards
    if (aiHand.length === 0) {
        if (deck.length > 0) {
            const drawnCard = deck.pop();
            aiHand.push(drawnCard);
            lastTurnAction = 'AI drew a card';
            updateUI();
            setTimeout(aiTurn, 1000);
            return;
        }
        checkWinCondition();
        return;
    }
    
    // AI selects random card from its hand
    const randomCard = aiHand[Math.floor(Math.random() * aiHand.length)];
    const askFamily = randomCard.family;
    const askMember = randomCard.member;
    
    lastTurnAction = `AI asks: Do you have ${askMember} from ${askFamily}?`;
    updateUI();
    
    // Check if player has matching cards
    const matchingCards = playerHand.filter(card => card.family === askFamily && card.member === askMember);
    
    setTimeout(() => {
        if (matchingCards.length > 0) {
            // Player has cards - transfer them
            aiHand.push(...matchingCards);
            playerHand = playerHand.filter(card => !(card.family === askFamily && card.member === askMember));
            
            // Check for complete families
            checkFamilies(aiHand, aiFamilies, 'ai');
            
            lastTurnAction = `AI got ${askMember} from ${askFamily}!`;
            
            // AI goes again
            setTimeout(() => {
                updateUI();
                setTimeout(aiTurn, 1000);
            }, 1000);
        } else {
            // Player doesn't have cards - go fish
            lastTurnAction = `You said "Go Fish!" - AI asked for ${askMember} from ${askFamily}`;
            
            setTimeout(() => {
                if (deck.length > 0) {
                    const drawnCard = deck.pop();
                    aiHand.push(drawnCard);
                    lastTurnAction += ` - AI drew a card`;
                    
                    // Check for complete families
                    checkFamilies(aiHand, aiFamilies, 'ai');
                }
                
                // Switch to player turn
                currentPlayer = 'player';
                lastTurnAction = 'Your turn! Select a family to ask about.';
                updateUI();
            }, 1000);
        }
    }, 1000);
}

// Check for complete families
function checkFamilies(hand, families, who) {
    // Count cards per family
    const familyCounts = {};
    hand.forEach(card => {
        familyCounts[card.family] = (familyCounts[card.family] || 0) + 1;
    });
    
    // Check for complete families (6 cards)
    Object.keys(familyCounts).forEach(family => {
        if (familyCounts[family] === 6 && !families.includes(family)) {
            families.push(family);
            
            // Remove cards from hand
            if (who === 'player') {
                playerHand = playerHand.filter(card => card.family !== family);
            } else {
                aiHand = aiHand.filter(card => card.family !== family);
            }
            
            lastTurnAction = `${who === 'player' ? 'You' : 'AI'} completed the ${family} family!`;
            
            // Check win condition
            checkWinCondition();
        }
    });
}

// Check if player can lay down a family
function canLayDownFamily() {
    // Count cards per family
    const familyCounts = {};
    playerHand.forEach(card => {
        familyCounts[card.family] = (familyCounts[card.family] || 0) + 1;
    });
    
    // Check for complete families
    for (const [family, count] of Object.entries(familyCounts)) {
        if (count === 6 && !playerFamilies.includes(family)) {
            return family;
        }
    }
    return null;
}

// Lay down a family
function layDownFamily(family) {
    // Remove cards from hand
    playerHand = playerHand.filter(card => card.family !== family);
    playerFamilies.push(family);
    
    // Show confirmation
    lastTurnAction = `You laid down the ${family} family!`;
    updateUI();
    
    // Check win condition
    setTimeout(() => {
        checkWinCondition();
    }, 1000);
}

// Check win condition
function checkWinCondition() {
    if (deck.length === 0 || (playerHand.length === 0 && aiHand.length === 0)) {
        gameActive = false;
        
        setTimeout(() => {
            if (playerFamilies.length > aiFamilies.length) {
                winnerTextEl.textContent = 'You Win!';
                winnerTextEl.style.color = '#4caf50';
            } else if (aiFamilies.length > playerFamilies.length) {
                winnerTextEl.textContent = 'AI Wins!';
                winnerTextEl.style.color = '#e91e63';
            } else {
                winnerTextEl.textContent = 'It\'s a Tie!';
                winnerTextEl.style.color = '#ff9800';
            }
            
            gameOverEl.classList.remove('hidden');
        }, 1000);
    }
}

// Event listeners
restartBtn.addEventListener('click', initGame);

// Start game
initGame();
