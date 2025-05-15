# Simple JavaScript Sport Game

- Square aspect ratio
- Basic controls with keyboard/mouse or touch
- Works on both mobile and desktop
- Real-time score updates
- Multiple team options (solo, 2v2)
- On-screen controls for mobile
- Collision and physics engine
- Timed matches with adjustable difficulty
- Leaderboard or scoring system
- Animations for scoring and victory
- Sport: 3-on-3 basketball
- Objective: first team to 21 points wins
- Controls: move players with arrow keys or WASD, shoot with spacebar
- Shots inside paint = 1 point, beyond arc = 2 points
- Fouls or turnovers reset possession at midcourt

## Implementation Outline
- Single-page architecture using a single HTML canvas
- Centralized game state (players, teams, ball, scoreboard)
- Update loop for collision detection, scoring, and animations
- Minimal external library usage (pure JavaScript preferred)

## Project Structure
- index.html: main entry point with canvas
- game.js: handles core logic, collisions, and score tracking
- player.js: handles player logic
- controls.js: manages keyboard, mouse, and touch input
- style.css: ensures the square ratio and responsive layout
...
add files for good structure.

## Additional Features
- Sound effects for dribble, shoot, and score
- Pause menu with resume or quit options
- Save or load match progress

## Best Practices
- Follow DRY: avoid duplicating logic by creating shared utility modules
- Implement OOP: use classes for players, teams, and the ball
- Use cohesive modules: split core logic, rendering, and input in separate files
- Maintain readability: name variables and methods clearly
- Enforce linting rules: ensure consistent formatting across the project
