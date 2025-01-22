function translate(str) {
    return translations[str] || str;
}
// function translate(str, replacements = {}) {
//             let retval = i18n[str] || str;
//             if (Object.keys(replacements).length > 0) {
//                 Object.keys(replacements).forEach((key) => {
//                     const value = replacements[key];
//                     retval = retval.replace('{' + key + '}', value);
//                 });
//             }
//             return retval;
//         }

const colors = {
    'A': '#ff6347',
    'B': 'blue',
    'C': 'cyan',
    'D': '#a9a9a9',
    'E': '#ff1493',
    'F': 'magenta',
    'G': 'lightgreen',
    'L': '#008080',
    'M': 'maroon',
    'N': 'brown',
    'O': 'orange',
    'P': 'purple',
    'R': 'red',
    'S': '#ff8c00',
    'T': 'teal',
    'U': '#696969',
    'W': 'white',
    'X': '#ffd700',
    'Y': 'yellow',
    1: 'blue',
    2: 'green',
    3: 'red',
    4: 'purple',
    5: 'brown',
    6: 'cyan',
    7: 'magenta',
    8: 'black',
    'default': 'black',
    "-": 'brown'

};
const translations = {
    "Level Complete": "Niveau Terminé",
    "Memory Game": "Jeu de Mémoire",
    "Time": "Temps",
    "Score": "Score",
    "Level": "Niveau",
    "Clear": "Vider",
    "Total Rays": "Enemis",
    "Missiles": "Missiles",
    "Remaining Missiles": "Missiles Restants",
    "Remaining Cities": "Villes Restantes",
    "Bonus": "Bonus",
    "Easy": "Facile",
    "Medium": "Moyen",
    "Validate": "Valider",
    "Hard": "Dur",
    "Generate": "Générer",
    "Hint": "Indice",
    "Solve": "Résoudre",
    "Time left": "Temps restant",
    "Total Score": "Score Total",
    "Click or Press Enter to Continue": "Cliquer pour continuer",
    "Click or Press Enter to Restart": "Cliquer pour redémarrer",
    "Round": "Coup",
    "Congratulations": "Félicitations",
    "Jump": "Sauter",
    "You Won": "Vous Avez Gagné",
    "You Lost": "Vous Avez Perdu",
    "Final Score": "Score Final",
    "Game Over": "Partie Perdue",
    "Final Score": "Score Final",
    "High Score": "Score Maximum",
    "Level Cleared": "Niveau Terminé",
    "Final Level": "Niveau Final",
    "Restart": "Redémarrer",
    "Release Water": "Lacher L'eau",
    "Water Flowing": "L'eau Coule",
    "Restart Game": "Redémarrer la Partie",
    "Lives": "Vies",
    "Next Piece": "Prochaine Pièce",
    "Restart": "Redémarrer",
    "Left": "Gauche",
    "Right": "Droite",
    "Rotate": "Rotation",
    "Drop": "Tomber",
    "Tap to Start": "Clic pour commencer",
    "Current Player": "Joueur Actuel",
    "Winner": "Gagnant",
    "Loser": "Perdant",
    "Computer": "Ordinateur",
    "Human": "Humain",
    "Start": "Démarrer",
    "Stop": "Stopper",
    "Player": "Joueur",
    "Good Luck": "Bonne Chance",
    "Congratulations, You Win!": "Félicitations, vous avez Gagné",
    "Current Player": "Joueur actuel",
    "Restart Game": "Rejouer",
    "Congratulations": "Félicitations",
    "You completed all levels": "Vous avez terminé tous les niveaux",
    "You collided with a wall or yourself": "Vous avez touché un obstacle",
    "You collided with a monster": "Vous avez touché un monstre",
    "mines must be less": "Le nombre de mines doit etre moins que le total de cellules",
    "click to start": "Cliquez une cellule pour commencer",
    "start game": "Commencer Partie",
    "you win": "Vous avez Gagné!",
    "game over": "Vous avez Perdu!",
    "Rows": "Rangées",
    "Columns": "Colonnes",
    "human": "Vous",
    "computer": "Ordi",
    "ate": "Mangé",
    "wins": "gagnant de",
    "winner": "Gagnant",
    "won": "Gagné",
    "game_won": "Fin Partie: Vous Gagnez",
    "game_lost": "Fin Partie: Ordi Gagnant",
    "victory_str": "Fin Partie: {name} Vainqueur",
    "game_tie": "Fin Partie: Egalité",
    "Ronda Game": "Jeu Ronda",
    "play-first": "Vous Jouez en premier, Cliquez une carte pour commencer.",
    "table-award": "<span class=playertext>{name}</span> a <span class=eventtext>mangé en dernier</span>, <span class=highlight>{points} points</span> pour les cartes sur la table",
    "9a3a-as": "<span class='playertext'>Le Donneur</span> a <span class='eventtext'>mangé avec un AS</span> <span class=highlight>+5</span> pour les autres",
    "9a3a-rey": "<span class='playertext'>Le Donneur</span> <span class='eventtext'>a mangé avec un 12</span>, <span class=highlight>+5</span>",
    "9a3a-lost": "<span class='playertext'>Le Donneur</span> <span class='eventtext'>n'a pas mangé en dernier</span>, <span class=highlight>+5</span> pour les autres",

}

function translate(str) {
    return translations[str] || str;
}

function replace_text(div, text) {
    const element = document.getElementById(div);
    element.innerHTML = text;
}