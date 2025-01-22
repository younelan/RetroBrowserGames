import { MonsterGame } from './MonsterGame.js';
import { Translator } from './Translator.js';
import { levels } from './levels.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new MonsterGame('gameCanvas', levels);
    game.initialize(); // Add explicit initialization
    // Auto-start the game
    game.start();

    // Set up button
    const button = document.getElementById('startStopButton');
    button.textContent = game.translator.translate("Start");
    button.addEventListener('click', () => game.toggleGame());
});
