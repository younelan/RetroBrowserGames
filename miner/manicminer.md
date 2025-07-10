# Manic Miner: Game Design Deep Dive

This document details the specific features, mechanics, and unique elements of the classic ZX Spectrum game, Manic Miner, to guide our JavaScript implementation.

## 1. Core Objective

The primary goal is to guide **Miner Willy** through all 20 caverns. To complete a single cavern, the player must:
1.  Collect all the flashing keys scattered throughout the level.
2.  Avoid running out of oxygen.
3.  Reach the now-flashing portal *after* all keys have been collected.

## 2. Gameplay Mechanics & Controls

### Miner Willy
*   **Movement:** Willy can only move left and right.
*   **The Jump:** This is the most critical and defining mechanic.
    *   The jump is a **fixed, high arc**. The player cannot control the height or trajectory of the jump once initiated.
    *   Mastery of the game is entirely dependent on learning the precise timing and positioning for this jump to navigate platforms and avoid enemies.
*   **Lives:**
    *   The player starts with **3 lives**.
    *   An extra life is awarded every **10,000 points**.
    *   A life is lost by:
        1.  Touching an enemy or hazard.
        2.  Falling too far (typically more than the height of a single platform block).
        3.  The oxygen supply running out.

### Oxygen Supply
*   This acts as the level timer. It's a bar at the bottom of the screen that constantly depletes.
*   The time is generous but adds pressure, especially on more complex caverns.

### Scoring
*   **Collecting a key:** Points are awarded (value varies slightly by version, but it's a core scoring action).
*   **Finishing the level:** A bonus is awarded based on the remaining oxygen.

## 3. Cavern Elements

### Platforms
*   **Standard Platforms:** Solid ground Willy can walk and jump on.
*   **Crumbling Platforms:** These platforms (often visually distinct, e.g., a different color or pattern) will disintegrate and disappear a moment after Willy walks off them. They can only be traversed once per life.

### Enemies & Hazards
Enemies are a key part of the challenge. They are **indestructible** and move in simple, fixed, and eternally repeating patterns. The player must learn and predict their movements.

*   **Common Enemy Archetypes:**
    *   **Horizontal Patrol:** Move back and forth on a platform (e.g., `Spiders`, `Penguins`).
    *   **Vertical Patrol:** Move up and down a fixed path (e.g., `Slime` dripping from the ceiling).
    *   **Static Hazards:** Remain in one place but are deadly to touch (e.g., `Poisonous Pansies`, `Spikes`).
    *   **Complex Paths:** Some enemies follow more unusual paths, like the `Manic Mining Robots` that patrol the edges of the screen or specific structures.
*   **Notable Enemies by Level:**
    *   **"The Cold Room":** Patrolling penguins.
    *   **"The Menagerie":** Spiders and what appear to be seals.
    *   **"Abandoned Uranium Workings":** Slime drips and patrolling robots.
    *   **"Eugene's Lair":** "Eugene," a large, aggressive creature that patrols a central platform.
    *   **"Attack of the Mutant Telephones":** Bouncing telephones that serve as mobile hazards.

## 4. Level Structure (The 20 Caverns)

The game consists of 20 distinct, single-screen levels. Each has a unique and often bizarre name that hints at its theme.

1.  Central Cavern
2.  The Cold Room
3.  The Menagerie
4.  Abandoned Uranium Workings
5.  Eugene's Lair
6.  Processing Plant
7.  The Vat
8.  Miner Willy meets the Kong Beast
9.  Wacky Amoebatrons
10. The Endorian Forest
11. Attack of the Mutant Telephones
12. Return of the Alien Kong Beast
13. Ore Refinery
14. Skylab Landing Bay
15. The Bank
16. The Sixteenth Cavern
17. The Warehouse
18. Amoebatrons' Revenge
19. Solar Power Generator
20. The Final Barrier

## 5. Audio

*   **Title Screen:** A chiptune version of Johann Strauss II's **"The Blue Danube"**.
*   **In-Game Music:** A continuous, looping chiptune arrangement of Edvard Grieg's **"In the Hall of the Mountain King"**. This is iconic and directly contributes to the "manic" feeling of the gameplay.

## 6. Level Data Format

To facilitate easy creation and editing, the game levels will be stored in a JavaScript array of objects.

### Structure
```javascript
const levels = [
  {
    "name": "Cavern Name",
    "map": `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`
  },
  // ... more levels
];
```

### Map Legend
The `map` string is a direct visual representation of the level. Each character corresponds to a game element:

| Character | Element                 | Description                                            |
| :-------: | ----------------------- | ------------------------------------------------------ |
|   ` `     | Empty Space             | Willy can fall through this.                           |
|    `@`    | Player Start            | Willy's initial position for the level.                |
|    `X`    | Wall / Platform         | Solid ground. Blocks movement.                         |
|    `C`    | Crumbling Platform      | Disappears after Willy walks off it.                   |
|    `D`    | Dirt Platform           | Brown earth with textured bottom surface.              |
|    `G`    | Grass Platform          | Dirt platform with green grass on top quarter.        |
|    `M`    | Crumbling Grass         | Darker dirt with green grass that crumbles like C.     |
|    `Q`    | Red Sand Platform       | Red/orange sandy platform with granular texture.      |
|    `W`    | Crumbling Red Sand      | Darker red sand platform that crumbles like C.        |
|    `B`    | Brick Platform          | Brick platform with mortar lines and texture.         |
|    `L`    | Moving Left Floor       | Conveyor belt that moves player left.                 |
|    `R`    | Moving Right Floor      | Conveyor belt that moves player right.                |
|    `K`    | Key                     | An item to be collected.                               |
|    `P`    | Portal                  | The exit, becomes active after all keys are taken.     |
|    `H`    | Hazard (Generic)        | A static object that is deadly to touch (e.g. spikes). |
|    `I`    | Spikes                  | A static hazard with a spiky appearance.               |
|    `F`    | Fire / Poisonous Pansy  | A static hazard with a fiery/pulsating appearance.     |
|    `E`    | Enemy (Horizontal)      | A simple enemy patrolling horizontally.                |
|    `V`    | Enemy (Vertical)        | A simple enemy patrolling vertically.                  |
|    `Z`    | Enemy (Complex)         | An enemy following a more complex, switching path.     |
|    `J`    | Enemy (Goose)           | A goose/duck enemy that walks on platforms like E.     |
|    `A`    | Enemy (Seal)            | A seal enemy juggling a ball on its nose.              |
|    `N`    | Enemy (Dinosaur)        | A dinosaur enemy that walks on platforms.              |
|    `T`    | Tree / Cactus           | A purely decorative element, no collision.             |
|    `%`    | Shrub / Bush            | A purely decorative element, no collision.             |
|    `Y`    | Tall Tree               | A 2-tile high decorative tree element.                 |
|    `U`    | Tall Cactus             | A 2-tile high decorative cactus element.               |

This format allows us to design levels visually right in the code.

## 7. File & Class Structure

To ensure the project is modular and easy to maintain, we will adopt the following file and class structure.

### File Organization

*   `index.html`: The main entry point of the application. Contains the canvas and loads all scripts and styles.
*   `style.css`: Contains all the CSS for styling the game page and UI elements.
*   `constants.js`: Stores global game constants (e.g., `TILE_SIZE`, `GRAVITY`, `PLAYER_SPEED`).
*   `levels.js`: Contains the `levels` array with all the level map data.
*   `game.js`: The main game engine. Contains the `Game` class responsible for the game loop, state management, and coordinating all other objects.
*   `level.js`: Contains the `Level` class, responsible for parsing the map data and managing all elements within a single level (platforms, keys, etc.).
*   `player.js`: Contains the `Player` class (representing Miner Willy), responsible for player movement, input handling, and state.
*   `horizontalEnemy.js`: Contains the `HorizontalEnemy` class for enemies that patrol horizontally.
*   `verticalEnemy.js`: Contains the `VerticalEnemy` class for enemies that patrol vertically.
*   `complexEnemy.js`: Contains the `ComplexEnemy` class for enemies with complex switching paths.
*   `gooseEnemy.js`: Contains the `GooseEnemy` class for goose/duck enemies that walk on platforms.
*   `sealEnemy.js`: Contains the `SealEnemy` class for seal enemies that juggle a ball on their nose.
*   `hazard.js`: Contains the `Hazard` class for static dangerous objects.

### Class Structure

*   **`Game`**:
    *   `constructor(canvasId)`
    *   `loadLevel(levelNumber)`
    *   `startGameLoop()`
    *   `update()`
    *   `draw()`
*   **`Level`**:
    *   `constructor(levelData)`
    *   `parseMap()`
    *   `draw(context)`
*   **`Player`**:
    *   `constructor(x, y)`
    *   `update(input, level)`
    *   `draw(context)`
    *   `jump()`
    *   `moveLeft()`
    *   `moveRight()`
*   **`Enemy`**:
    *   `constructor(x, y, type)`
    *   `update()`
    *   `draw(context)`

## 8. Layout & Controls

To ensure a consistent and playable experience across devices, the game will feature a responsive, square layout and a dual control scheme.

### Aspect Ratio & Layout

*   **Square Aspect Ratio:** The game canvas will maintain a 1:1 aspect ratio.
*   **Responsive Scaling:** The canvas will be centered on the page and will scale to fit the smaller of the viewport's width or height, ensuring it never looks stretched or cropped.
*   **Styling:** The page background will be black, framing the canvas area.

### Desktop Controls

*   **Keyboard:**
    *   `Left Arrow`: Move Willy left.
    *   `Right Arrow`: Move Willy right.
    *   `Space Bar` or `Up Arrow`: Jump.

### Mobile (Touch) Controls

*   **Fluid Drag Controls:** The primary mobile interaction will be a fluid, drag-based "virtual joystick" that can be initiated by touching anywhere on the game canvas. This keeps the screen free of UI clutter.
*   **How it Works:**
    1.  The player touches the screen. This initial touch-down point becomes the control "anchor".
    2.  The player drags their finger away from the anchor to control Willy.
        *   **Horizontal Drag:** Dragging left or right of the anchor moves Willy left or right.
        *   **Vertical Drag:** Dragging upwards from the anchor initiates a jump.
*   **Continuous & Intuitive:** This system allows for seamless transitions between moving and jumping. A player can be moving right and then flick their finger upwards to jump, all in one continuous motion.
*   **Release to Stop:** When the player lifts their finger, all movement input ceases.
*   **Dead Zone:** A small radius around the anchor point will be a "dead zone" to prevent accidental inputs from slight finger movements.