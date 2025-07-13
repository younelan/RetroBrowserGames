# Donkey Kong Game Specification

## 1. Game Description

A Javascript-based, mobile-first recreation of the classic arcade game, Donkey Kong. The player must ascend a construction site to rescue Damsel from the clutches of Donkey Kong. The game is played on a single screen with multiple levels of increasing difficulty.

## 2. Core Gameplay Mechanics

### Player Controls

The game will support multiple input methods for maximum accessibility:

*   **Keyboard:**
    *   `ArrowLeft` / `A`: Move left
    *   `ArrowRight` / `D`: Move right
    *   `ArrowUp` / `W`: Climb up a ladder
    *   `ArrowDown` / `S`: Climb down a ladder
    *   `Space`: Jump
*   **Touch / Click:**
    *   Tap to the left/right of the player to move.
    *   Tap on a ladder to start climbing.
    *   Tap above the player to jump.
*   **Drag (Mobile):**
    *   A primary design focus. The player can drag their finger across the screen to control the player. A continuous drag allows for seamless direction changes (e.g., moving right then immediately left) without lifting the finger.
    *   Dragging up or down a ladder initiates climbing.
    *   A quick upward flick will trigger a jump.

### Player Movement Rules

*   **Jump Height:** The player can jump approximately their own height. Jumps are designed to allow traversal across the current platform, not to reach platforms directly above.
*   **Mid-Air Jumps:** The player cannot perform multiple jumps while in the air. A jump can only be initiated when the player is on a platform.
*   **Platform Collision:** Upon landing, the player will always remain on the platform they jumped from or landed on, without falling through.
*   **Ladder Movement:** The player can move both up and down ladders. Movement on ladders is restricted to vertical motion.

### Platforms and Ladders

*   **Platforms:** These are the main surfaces for movement. They will be implemented as line segments and can be either perfectly horizontal or diagonal, faithfully recreating the original game's level design.
*   **Ladders:** Allow for vertical movement between platforms. Some ladders may be broken and cannot be fully climbed.

### Barrels, Obstacles, and Enemies

*   **Rolling Barrels:** The primary obstacle. Thrown by Donkey Kong from his perch. They roll along platforms and descend ladders, always moving towards the lower side of an inclined platform.
*   **Blue Barrels:** Identical to rolling barrels but visually distinct.
*   **Wild Barrels:** Bounce diagonally and unpredictably.
*   **Fireballs (Firefoxes):** Emerge from oil drums. They are intelligent enemies that actively track the player.
*   **Cement Pies (Springs):** Appear in later levels on conveyor belts.

### Power-ups

*   **Hammer:** A temporary item that grants invincibility and allows the player to smash barrels and other enemies for bonus points.

## 3. Characters

*   **the player (Jumpman):** The player-controlled protagonist.
*   **Donkey Kong:** The main antagonist who throws obstacles from the top of the screen.
*   **Damsel (Lady):** The damsel-in-distress. Reaching her completes the level.

## 4. Scoring

*   **Jumping over barrels:** 100 points
*   **Destroying items with hammer:** 300-800 points
*   **Collecting Damsel's items (parasol, hat, purse):** 300, 500, 800 points respectively.
*   **Level Completion:** A bonus score is awarded based on the time remaining on a countdown timer.

## 5. Levels

### Level Structure

The game will support multiple, distinct levels. Each level will have a unique configuration of platforms, ladders, and enemy patterns. The initial release will aim to recreate the original arcade levels.

### Level Format

To facilitate the creation of multiple levels, a simple and extensible **JSON format** will be used. This allows level data to be stored separately from the game logic.

**Example `level-1.json`:**

```json
{
  "name": "Stage 1",
  "time": 5000,
  "player_start": { "x": 50, "y": 550 },
  "damsel_pos": { "x": 250, "y": 80 },
  "dk_pos": { "x": 100, "y": 120 },
  "platforms": [
    { "start_x": 0, "start_y": 600, "end_x": 400, "end_y": 600 },
    { "start_x": 0, "start_y": 500, "end_x": 350, "end_y": 510 },
    { "start_x": 50, "start_y": 420, "end_x": 400, "end_y": 410 }
  ],
  "ladders": [
    { "x": 300, "top_y": 510, "bottom_y": 600 },
    { "x": 100, "top_y": 420, "bottom_y": 500, "broken": true }
  ],
  "items": [
    { "type": "hammer", "x": 150, "y": 480 }
  ]
}
```

## 6. Technical Specifications

*   **Engine:** The game will be built using **vanilla JavaScript** and the **HTML5 Canvas API**. No external game engines or rendering libraries will be used, keeping the project lightweight and focused on fundamentals.
*   **Display:** A square aspect ratio will be enforced. The canvas will scale to fit the user's screen, with letterboxing added if the screen is not square. This is ideal for portrait-oriented mobile displays.
*   **Modularity:** The code will be organized into modules (e.g., `game.js`, `player.js`, `input.js`, `renderer.js`, `levels.js`) to ensure maintainability.
