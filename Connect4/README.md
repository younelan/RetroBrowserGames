Connect4
========

Mobile-first Connect 4 implementation (vanilla JS) with a simple AI opponent.

Files:
- `index.html` — game container
- `style.css` — scoped styles (do not modify global `body`)
- `game.js` — game logic and AI (minimax with alpha-beta)

How to run:
Open `index.html` in a browser (mobile or desktop). Tap a column to drop your disc. Restart with the button.

Notes:
- AI uses a shallow minimax (depth 4) for responsiveness; it is not perfect but competitive.
- This is intentionally dependency-free and embeddable in larger pages (styles are scoped to `.app`).
