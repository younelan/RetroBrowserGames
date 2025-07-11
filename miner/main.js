const jsFiles = [
    "constants.js",
    "player.js",
    "bigFoot.js",
    "verticalEnemy.js",
    "complexEnemy.js",
    "gooseEnemy.js",
    "sealEnemy.js",
    "dinosaurEnemy.js",
    "hazard.js",
    "level.js",
    "levels.js",
    "game.js"
];

function loadScript(index) {
    if (index < jsFiles.length) {
        const script = document.createElement('script');
        script.src = jsFiles[index] + '?v=' + Date.now(); // Cache busting
        script.onload = () => loadScript(index + 1);
        document.head.appendChild(script);
    }
}

loadScript(0);