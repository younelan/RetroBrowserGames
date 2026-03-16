Rummy 71 - Mobile-first client

This is a minimal, client-side implementation of Rummy 71 intended for mobile-first play with a square aspect ratio.

How to run

- Open `index.html` in a browser on your device (mobile or desktop). No server required.

What is implemented

- Two decks (no jokers).
- Deals 14 cards to each player; dealer receives 15 and discards one to start.
- Initial lay must total at least 71 points (cannot use jokers).
- Each subsequent player who lays must lay more than the previous player's lay.
- Players may only draw from the stock (center) if they check "Will lay down this turn" before drawing.
- Ace scoring: 1 point when used in A-2-3 runs; 10 points when used in Q-K-A runs or AAA sets.

Notes & limitations

- This is a simple hotseat prototype for 2 players (local play on same device).
- The implementation validates basic sets and runs and computes points for laid groups, but does not implement all Rummy features (e.g., adding to other players' melds, jokers, automatic detection of multiple melds at once).
- Feel free to extend: add networking, AI opponents, improved UI, drag-and-drop, animations.
