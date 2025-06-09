import { SpanishDeck } from './js/SpanishDeck.js';

class TkGame {
    constructor(settings = {}) {
        this.deck = new SpanishDeck();
        this.players = [
            { name: 'You', hand: [], score: 0, wonCards: [] },
            { name: 'Computer', hand: [], score: 0, wonCards: [] }
        ];
        this.tableCards = [];
        this.currentPlayerIndex = settings.firstPlayer === 'computer' ? 1 : 0;
        this.cardsPerDeal = settings.cardsPerDeal || 4;
        this.gamePhase = 'dealing'; // 'dealing', 'relationship', 'finished'
        this.activeRelationship = null;
        this.lastWinner = null;
        this.message = 'Welcome to Tk! Game starting...';
        this.gameHistory = [];
        
        // Auto-deal first round
        setTimeout(() => {
            this.dealCards();
        }, 500);
        
        this.render();
    }

    dealCards() {
        if (this.deck.getCardsRemaining() === 0) {
            this.endGame();
            return;
        }

        // Deal cards based on settings
        for (let i = 0; i < this.cardsPerDeal; i++) {
            for (let player of this.players) {
                const card = this.deck.drawCard();
                if (card) {
                    player.hand.push(card);
                }
            }
        }

        this.gamePhase = 'playing';
        this.message = 'Cards dealt. Click a card to play it.';
        
        // If computer goes first, make first move
        if (this.currentPlayerIndex === 1) {
            setTimeout(() => this.computerPlay(), 1000);
        }
        
        this.render();
    }

    checkForRelationships() {
        // Check if there are any relationships in the cards on the table
        const relationship = this.findRelationship(this.tableCards);
        
        if (relationship && !this.activeRelationship) {
            this.activeRelationship = relationship;
            this.gameHistory.push(`Relationship activated: ${this.describeRelationship(relationship)}`);
            this.message = `Relationship activated: ${this.describeRelationship(relationship)}`;
        } else if (!relationship && this.activeRelationship) {
            // Relationship was broken, but keep it active until someone can't play
        }
        
        return relationship;
    }

    findRelationship(cards) {
        const cardsByValue = {};
        
        // Group cards by value
        cards.forEach(card => {
            if (!cardsByValue[card.value]) {
                cardsByValue[card.value] = [];
            }
            cardsByValue[card.value].push(card);
        });

        // Check for three identical cards
        for (let value in cardsByValue) {
            const val = parseInt(value);
            if (cardsByValue[val].length >= 3) {
                return this.expandRelationship([val], cardsByValue);
            }
        }

        // Check for two aces
        if (cardsByValue[1] && cardsByValue[1].length >= 2) {
            return this.expandRelationship([1], cardsByValue);
        }

        // Check for pairs + adjacent cards
        for (let value in cardsByValue) {
            const val = parseInt(value);
            if (cardsByValue[val].length >= 2) {
                // Check for adjacent cards
                const nextVal = this.getNextValue(val);
                const prevVal = this.getPrevValue(val);
                
                if (cardsByValue[nextVal] && cardsByValue[nextVal].length >= 1) {
                    return this.expandRelationship([val, nextVal], cardsByValue);
                }
                
                if (cardsByValue[prevVal] && cardsByValue[prevVal].length >= 1) {
                    return this.expandRelationship([prevVal, val], cardsByValue);
                }
            }
        }

        return null;
    }

    expandRelationship(baseValues, cardsByValue) {
        const sortedValues = baseValues.sort((a, b) => {
            // Handle wrapping (12 -> 1)
            if (a === 12 && b === 1) return -1;
            if (a === 1 && b === 12) return 1;
            return a - b;
        });

        let relationship = [...sortedValues];
        
        // Expand upward
        let currentVal = sortedValues[sortedValues.length - 1];
        while (true) {
            const nextVal = this.getNextValue(currentVal);
            if (cardsByValue[nextVal] && cardsByValue[nextVal].length >= 1) {
                relationship.push(nextVal);
                currentVal = nextVal;
            } else {
                break;
            }
        }

        // Expand downward
        currentVal = sortedValues[0];
        while (true) {
            const prevVal = this.getPrevValue(currentVal);
            if (cardsByValue[prevVal] && cardsByValue[prevVal].length >= 1) {
                relationship.unshift(prevVal);
                currentVal = prevVal;
            } else {
                break;
            }
        }

        return relationship;
    }

    getNextValue(value) {
        const sequence = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
        const index = sequence.indexOf(value);
        return index === -1 || index === sequence.length - 1 ? sequence[0] : sequence[index + 1];
    }

    getPrevValue(value) {
        const sequence = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
        const index = sequence.indexOf(value);
        return index === -1 || index === 0 ? sequence[sequence.length - 1] : sequence[index - 1];
    }

    describeRelationship(relationship) {
        if (!relationship) return 'None';
        return `Values: ${relationship.join(', ')}`;
    }

    playCard(playerIndex, cardIndex) {
        if (this.gamePhase !== 'playing') return;
        if (playerIndex !== this.currentPlayerIndex) return;

        const player = this.players[playerIndex];
        const card = player.hand[cardIndex];
        
        // Remove card from hand and add to table
        player.hand.splice(cardIndex, 1);
        this.tableCards.push(card);
        
        this.gameHistory.push(`${player.name} played ${this.cardToString(card)}`);
        this.message = `${player.name} played ${this.cardToString(card)}`;
        
        // Check for relationships after each card is played
        this.checkForRelationships();
        
        // Check if this card breaks the relationship
        if (this.activeRelationship && !this.isCardPlayable(card)) {
            // Player played a non-relationship card, previous player wins
            this.gameHistory[this.gameHistory.length - 1] += ' (breaks relationship)';
            const winnerIndex = (this.currentPlayerIndex - 1 + this.players.length) % this.players.length;
            this.currentPlayerIndex = winnerIndex;
            this.endRelationshipRound();
            return;
        }
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Check if all hands are empty (no relationships active)
        if (!this.activeRelationship && this.players.every(p => p.hand.length === 0)) {
            if (this.deck.getCardsRemaining() === 0) {
                setTimeout(() => this.endGame(), 1000);
                return;
            } else {
                setTimeout(() => {
                    this.dealCards();
                }, 1000);
                return;
            }
        }
        
        // Check if both players have no more relationship cards
        if (this.activeRelationship) {
            const player1CanPlay = this.canPlayerPlay(0);
            const player2CanPlay = this.canPlayerPlay(1);
            
            if (!player1CanPlay && !player2CanPlay) {
                // No one can play relationship cards, last player to play wins
                this.currentPlayerIndex = (this.currentPlayerIndex - 1 + this.players.length) % this.players.length;
                this.gameHistory.push(`No more relationship cards available`);
                this.endRelationshipRound();
                return;
            }
            
            const nextPlayerCanPlay = this.canPlayerPlay(this.currentPlayerIndex);
            
            if (!nextPlayerCanPlay) {
                // Next player can't play relationship cards, force them to play any card
                if (this.currentPlayerIndex === 1) {
                    // Computer's turn but can't play relationship card
                    setTimeout(() => this.computerPlayAnyCard(), 1000);
                }
                // If it's human's turn, they need to manually play a non-relationship card
                this.render();
                return;
            }
        }
        
        // If it's computer's turn, play automatically
        if (this.currentPlayerIndex === 1) {
            setTimeout(() => this.computerPlay(), 1000);
        }
        this.render();
    }

    canPlayerPlay(playerIndex) {
        const player = this.players[playerIndex];
        if (!this.activeRelationship) {
            return player.hand.length > 0; // Can play any card if no relationship
        }
        return player.hand.some(card => this.isCardPlayable(card));
    }

    computerPlay() {
        const computer = this.players[1];
        let cardToPlay = null;
        let cardIndex = -1;
        
        if (this.activeRelationship) {
            // During relationship, try to play a valid card
            const playableCards = computer.hand.filter(card => this.isCardPlayable(card));
            if (playableCards.length > 0) {
                cardToPlay = playableCards[0];
                cardIndex = computer.hand.indexOf(cardToPlay);
            } else {
                // Computer has no relationship cards, must play any card and lose
                if (computer.hand.length > 0) {
                    cardToPlay = computer.hand[0];
                    cardIndex = 0;
                }
            }
        } else {
            // No relationship, play any card
            if (computer.hand.length > 0) {
                cardToPlay = computer.hand[0];
                cardIndex = 0;
            }
        }
        
        if (cardIndex >= 0) {
            this.playCard(1, cardIndex);
        }
    }

    computerPlayAnyCard() {
        const computer = this.players[1];
        if (computer.hand.length > 0) {
            // Play any card (will break relationship)
            this.playCard(1, 0);
        }
    }

    isCardPlayable(card) {
        if (!this.activeRelationship) {
            return true; // Any card can be played if no relationship
        }
        return this.activeRelationship.includes(card.value);
    }

    anyPlayerCanPlay() {
        return this.players.some(player => 
            player.hand.some(card => this.isCardPlayable(card))
        );
    }

    endRelationshipRound() {
        // Current player wins the relationship
        const winner = this.players[this.currentPlayerIndex];
        
        // Separate relationship cards from non-relationship cards
        const relationshipCards = [];
        const remainingCards = [];
        
        this.tableCards.forEach(card => {
            if (this.activeRelationship && this.activeRelationship.includes(card.value)) {
                relationshipCards.push(card);
            } else {
                remainingCards.push(card);
            }
        });
        
        // Winner gets only the relationship cards
        winner.wonCards.push(...relationshipCards);
        this.calculateScores();
        
        this.lastWinner = this.currentPlayerIndex;
        const cardList = relationshipCards.map(card => this.cardToString(card)).join(', ');
        this.message = `${winner.name} wins the relationship and takes: ${cardList}`;
        this.gameHistory.push(`${winner.name} wins relationship cards: ${cardList}`);
        
        // Keep non-relationship cards on the table
        this.tableCards = remainingCards;
        this.activeRelationship = null;
        this.gamePhase = 'playing';
        
        // After relationship ends, move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Check if game should end
        if (this.deck.getCardsRemaining() === 0 && this.players.every(p => p.hand.length === 0)) {
            setTimeout(() => this.endGame(), 2000);
        } else if (this.players.every(p => p.hand.length === 0)) {
            // All hands empty, deal more cards
            setTimeout(() => {
                this.dealCards();
            }, 2000);
        } else {
            setTimeout(() => {
                this.message = 'Relationship complete. Continue playing with remaining cards.';
                
                // If it's computer's turn, play automatically
                if (this.currentPlayerIndex === 1) {
                    setTimeout(() => this.computerPlay(), 1000);
                }
                this.render();
            }, 2000);
        }
        
        this.render();
    }

    calculateScores() {
        this.players.forEach(player => {
            let score = 0;
            player.wonCards.forEach(card => {
                score += card.value === 1 ? 2 : 1; // Aces are worth 2 points
            });
            player.score = score;
        });
    }

    endGame() {
        // Give remaining table cards to last winner
        if (this.lastWinner !== null && this.tableCards.length > 0) {
            this.players[this.lastWinner].wonCards.push(...this.tableCards);
            this.tableCards = [];
        }
        
        this.calculateScores();
        this.gamePhase = 'finished';
        
        const winner = this.players.reduce((prev, current) => 
            prev.score > current.score ? prev : current
        );
        
        this.message = `Game Over! ${winner.name} wins with ${winner.score} points!`;
        this.render();
    }

    cardToString(card) {
        const suitNames = {
            'dheb': '♥', 'lekhel': '♦', 'koubbas': '♣', 'chbada': '♠'
        };
        return `${card.value}${suitNames[card.suit] || card.suit}`;
    }

    render() {
        // Update deck count
        document.getElementById('deck-count').textContent = this.deck.getCardsRemaining();
        
        // Update scores in header with current player highlighting
        const player0Score = document.getElementById('player-0-score');
        const player1Score = document.getElementById('player-1-score');
        const player0Name = document.getElementById('player-0-name');
        const player1Name = document.getElementById('player-1-name');
        
        player0Score.textContent = this.players[0].score;
        player1Score.textContent = this.players[1].score;
        
        // Highlight current player name
        if (this.currentPlayerIndex === 0) {
            player0Name.style.color = '#4CAF50';
            player0Name.style.fontWeight = 'bold';
            player1Name.style.color = 'white';
            player1Name.style.fontWeight = 'normal';
        } else {
            player1Name.style.color = '#4CAF50';
            player1Name.style.fontWeight = 'bold';
            player0Name.style.color = 'white';
            player0Name.style.fontWeight = 'normal';
        }
        
        // Update game phase
        document.getElementById('game-phase').textContent = 
            this.gamePhase.charAt(0).toUpperCase() + this.gamePhase.slice(1);

        // Update relationship info
        const relationshipInfo = document.getElementById('relationship-info');
        if (this.activeRelationship) {
            relationshipInfo.style.display = 'block';
            relationshipInfo.textContent = `Active Relationship: ${this.describeRelationship(this.activeRelationship)}`;
        } else {
            relationshipInfo.style.display = 'none';
        }

        // Update table cards
        const tableCardsDiv = document.getElementById('table-cards');
        tableCardsDiv.innerHTML = '';
        this.tableCards.forEach(card => {
            const cardDiv = this.createCardElement(card);
            tableCardsDiv.appendChild(cardDiv);
        });

        // Update players
        const playersArea = document.getElementById('players-area');
        playersArea.innerHTML = '';
        
        this.players.forEach((player, index) => {
            // Only show human player (index 0)
            if (index === 0) {
                const playerDiv = document.createElement('div');
                playerDiv.className = `player ${index === this.currentPlayerIndex ? 'active' : ''} ${this.gamePhase === 'finished' && player.score === Math.max(...this.players.map(p => p.score)) ? 'winner' : ''}`;
                
                playerDiv.innerHTML = `
                    <div class="player-header">
                        <div class="player-name">${player.name}</div>
                    </div>
                    <div class="player-hand" id="player-${index}-hand"></div>
                `;
                
                playersArea.appendChild(playerDiv);
                
                // Add hand cards
                const handDiv = document.getElementById(`player-${index}-hand`);
                
                player.hand.forEach((card, cardIndex) => {
                    const cardDiv = this.createCardElement(card, true);
                    if (this.gamePhase === 'playing' && index === this.currentPlayerIndex) {
                        // During relationship, show all cards as playable but highlight relationship cards
                        if (this.activeRelationship) {
                            if (this.isCardPlayable(card)) {
                                cardDiv.classList.add('playable');
                            } else {
                                cardDiv.style.opacity = '0.7';
                                cardDiv.title = 'Playing this card will break the relationship';
                            }
                        } else {
                            cardDiv.classList.add('playable');
                        }
                        cardDiv.onclick = () => this.playCard(index, cardIndex);
                    }
                    handDiv.appendChild(cardDiv);
                });
            }
            // Computer player area is completely hidden
        });

        // Update buttons
        const dealBtn = document.getElementById('deal-btn');
        dealBtn.disabled = this.gamePhase !== 'dealing' || this.deck.getCardsRemaining() === 0;
        dealBtn.textContent = this.gamePhase === 'dealing' ? `Deal ${this.cardsPerDeal} Cards` : 'Playing Relationship';

        // Update messages
        document.getElementById('game-messages').textContent = this.message;

        // Update game history
        const historyContent = document.getElementById('history-content');
        if (this.gameHistory.length > 0) {
            historyContent.innerHTML = this.gameHistory.map(entry => `<div>${entry}</div>`).join('');
        } else {
            historyContent.textContent = 'No moves yet...';
        }
    }

    createCardElement(card, clickable = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.suit}`;
        if (clickable) cardDiv.style.cursor = 'pointer';
        
        const suitSymbols = {
            'dheb': '♥', 'lekhel': '♦', 'koubbas': '♣', 'chbada': '♠'
        };
        
        cardDiv.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${suitSymbols[card.suit] || card.suit}</div>
        `;
        
        return cardDiv;
    }
}

// Global game instance
let game;

// Global functions for buttons
window.dealCards = function() {
    if (game) game.dealCards();
};

window.startNewGame = function() {
    document.getElementById('new-game-modal').style.display = 'block';
};

window.toggleNewGameModal = function() {
    const modal = document.getElementById('new-game-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
};

window.startNewGameWithSettings = function() {
    const firstPlayer = document.querySelector('input[name="firstPlayer"]:checked').value;
    const cardsPerDeal = parseInt(document.querySelector('input[name="cardsPerDeal"]:checked').value);
    
    const settings = {
        firstPlayer: firstPlayer,
        cardsPerDeal: cardsPerDeal
    };
    
    game = new TkGame(settings);
    document.getElementById('new-game-modal').style.display = 'none';
};

window.toggleHelp = function() {
    const modal = document.getElementById('help-modal');
    modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
};

// Initialize game
game = new TkGame();