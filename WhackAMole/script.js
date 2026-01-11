const holes = document.querySelectorAll('.hole');
const scoreDisplay = document.getElementById('score');
const timeLeftDisplay = document.getElementById('time-left');
const startButton = document.getElementById('start-button');

let score = 0;
let timeLeft = 30;
let lastHole;
let timerId;
let gameTimerId;

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    const time = Math.random() * 1000 + 500; // random time between 0.5s and 1.5s
    const hole = randomHole(holes);
    hole.classList.add('up');
    setTimeout(() => {
        hole.classList.remove('up');
        if (gameTimerId) peep(); // Keep moles peeping until game ends
    }, time);
}

function startGame() {
    score = 0;
    timeLeft = 30;
    scoreDisplay.textContent = 'Score: 0';
    timeLeftDisplay.textContent = `Time: 30`;
    startButton.disabled = true;

    peep();
    gameTimerId = setInterval(countdown, 1000);
}

function countdown() {
    timeLeft--;
    timeLeftDisplay.textContent = `Time: ${timeLeft}`;

    if (timeLeft === 0) {
        clearInterval(gameTimerId);
        gameTimerId = null;
        alert(`Game Over! Your final score is: ${score}`);
        startButton.disabled = false;
    }
}

function whack(event) {
    if (!event.isTrusted) return; // Cheater!
    score++;
    this.parentNode.classList.remove('up'); // Remove 'up' from the hole, not the mole
    scoreDisplay.textContent = `Score: ${score}`;
}

holes.forEach(hole => {
    hole.addEventListener('click', (event) => {
        if (event.target.classList.contains('mole')) {
            whack.call(event.target, event); // Ensure 'this' in whack refers to the mole
        }
    });
});

startButton.addEventListener('click', startGame);