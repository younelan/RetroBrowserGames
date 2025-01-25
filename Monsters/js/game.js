import { MonsterGame } from './MonsterGame.js';
import { Translator } from './Translator.js';
import { levels } from './levels.js';

document.addEventListener('DOMContentLoaded', () => {
    // Remove inline onclick from canvas first
    const canvas = document.getElementById('gameCanvas');
    canvas.removeAttribute('onclick');
    
    // Initialize game
    const game = new MonsterGame('gameCanvas', levels);
    
    // Initialize and start
    game.initialize();
    game.start();
    
    // Set up canvas event handlers
    canvas.addEventListener('mousedown', (e) => {
        game.ui.isDragging = true;
        game.ui.handleMove(e);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (game.ui.isDragging) {
            game.ui.handleMove(e);
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        game.ui.handleEnd(e);
    });

    canvas.addEventListener('mouseleave', (e) => {
        game.ui.handleEnd(e);
    });

    canvas.addEventListener('touchstart', (e) => {
        game.ui.isDragging = true;
        game.ui.handleMove(e);
    });

    canvas.addEventListener('touchmove', (e) => {
        if (game.ui.isDragging) {
            game.ui.handleMove(e);
        }
    });

    canvas.addEventListener('touchend', (e) => {
        game.ui.handleEnd(e);
    });

    canvas.addEventListener('touchcancel', (e) => {
        game.ui.handleEnd(e);
    });

    // Set up button
    const button = document.getElementById('startStopButton');
    button.textContent = game.translator.translate("Start");
    button.addEventListener('click', () => {
        game.toggleGame();
    });
});
