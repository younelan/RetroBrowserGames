# Pinball Game

A multi-level pinball game designed for both mobile and desktop platforms.

## Features

*   **Multi-level:** The game will feature multiple levels, each with a unique layout and challenges. Levels are defined in a `levels.js` file.
*   **Mobile First:** The primary platform is mobile, with intuitive touch controls for the flippers.
*   **Desktop Support:** The game is also playable on desktop using keyboard controls for the flippers.
*   **Scoring:** Players can score points by hitting various elements on the board.
*   **Lives:** Players will have a limited number of balls (lives).

## Controls

*   **Mobile:**
    *   Tap on the left side of the screen to activate the left flipper.
    *   Tap on the right side of the screen to activate the right flipper.
*   **Desktop:**
    *   Press the left arrow key to activate the left flipper.
    *   Press the right arrow key to activate the right flipper.

## Levels

The game's levels will be defined in an array in `levels.js`. Each level object will have a `description` property to describe the level's layout and objectives.

## Game Elements

The pinball board will contain various interactive elements:

*   **Flippers:** The primary player-controlled element to hit the ball.
*   **Bumpers:** Circular or triangular objects that "bump" the ball away and award points.
*   **Slingshots:** Triangular bumpers at the bottom of the board that shoot the ball sideways.
*   **Rollovers:** Lanes or switches on the board that the ball can roll over to score points or trigger events.
*   **Targets:** Stationary or drop targets that award points when hit.
*   **Holes/Traps:** Areas where the ball can be temporarily trapped, potentially leading to bonus points or a mini-game.
*   **Ramps:** Inclined paths that the ball can travel up to reach other parts of the board.

## Ball Launch

Before the ball is in play, it will be visible in a designated "launch area" on the right side of the screen. The player will launch the ball by dragging it downwards and releasing it. The distance the ball is dragged will determine its initial launch velocity. A longer drag will result in a more powerful launch.

## Walls

The playfield will be enclosed by walls. These walls can be defined as complex polygons, including curved segments, to create interesting and challenging board layouts. This allows for non-rectangular playfields and the creation of intricate paths for the ball.

## Gameplay Features

*   **Tilt:** A mechanism to prevent players from shaking or nudging the machine too much. If the player shakes the device or presses a key to nudge the table too many times, the flippers will be disabled and the ball will be lost.
*   **Multi-ball:** A special mode where multiple balls are in play at the same time, often leading to high scores.
*   **Jackpot:** A high-value target that can be awarded for completing a difficult sequence of shots.
*   **End-of-Ball Bonus:** A bonus awarded at the end of each ball, based on the player's accomplishments during that ball.

## Audio and Visuals

*   **Sound and Music:** Sound effects for all game events (bumpers, flippers, etc.) and background music that changes with the game state.
*   **Display/Scoreboard:** A virtual display to show the score, current player, ball number, and other information.

## Sample Level Format

The `levels.js` file will contain an array of level objects. Here is an example of what a level object might look like:

```javascript
{
  "description": "A level with both straight and curved walls.",
  "walls": [
    { "type": "line", "start": [0, 0], "end": [800, 0] },
    { "type": "bezier", "start": [800, 0], "end": [800, 1200], "control1": [900, 400], "control2": [900, 800] },
    { "type": "line", "start": [800, 1200], "end": [0, 1200] },
    { "type": "arc", "start": [0, 1200], "end": [0, 0], "center": [-200, 600], "radius": 200 }
  ],
  "elements": [
    { "type": "bumper", "position": [200, 400], "radius": 30 },
    { "type": "bumper", "position": [600, 400], "radius": 30 },
    { "type": "ramp", "path": [ [100, 800], [300, 1000], [500, 800] ] },
    { "type": "slingshot", "position": [100, 1000], "orientation": "left" },
    { "type": "slingshot", "position": [700, 1000], "orientation": "right" }
  ]
}
```

This new format for `walls` introduces different types of segments:

*   **`line`**: A straight line segment from a `start` point to an `end` point.
*   **`bezier`**: A Bezier curve defined by a `start` point, an `end` point, and two `control` points.
*   **`arc`**: A circular arc defined by a `start` point, an `end` point, a `center` point, and a `radius`.

This approach provides the flexibility to create complex wall shapes with both straight and curved edges.