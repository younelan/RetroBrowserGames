import { MonsterGame } from './MonsterGame.js';
import { Translator } from './Translator.js';
import { levels } from './levels.js';

document.addEventListener('DOMContentLoaded', () => {
    // Remove inline onclick from canvas first
    const canvas = document.getElementById('gameCanvas');
    canvas.removeAttribute('onclick');
    
    // Initialize game
    const game = new MonsterGame('gameCanvas', levels);
    
    // Debug logging
    console.log('DOM loaded, game created');
    
    // Initialize and start
    game.initialize();
    game.start();
    
    // Set up canvas click handler
    canvas.addEventListener('click', (e) => {
        console.log('Canvas clicked');
        game.ui.handleClick(e);
    });

    // Set up button
    const button = document.getElementById('startStopButton');
    button.textContent = game.translator.translate("Start");
    button.addEventListener('click', () => {
        console.log('Button clicked');
        game.toggleGame();
    });
});
