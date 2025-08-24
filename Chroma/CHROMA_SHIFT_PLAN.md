# Web Game: Chroma Shift (Enhanced)

This document outlines the plan for creating a unique puzzle game called "Chroma Shift". The game is designed for web browsers with a mobile-first, responsive approach. The play area will be a square and will always fit the viewport.

## 1. Game Objective

The player is presented with a grid of colored tiles and a smaller "target" pattern. The objective is to rearrange the tiles on the main grid to match the target pattern by shifting rows and columns.

## 2. Gameplay Mechanics

*   **The Board:** The game is played on a square grid of colored tiles (e.g., 4x4, 5x5).
*   **Shifting:** The player shifts entire rows horizontally or columns vertically. Tiles wrap around to the other side of the grid.
*   **Controls:**
    *   **Mobile:** Drag rows left/right and columns up/down.
    *   **Desktop:** Click and drag rows or columns with the mouse.
*   **Levels:** The game is level-based with increasing difficulty (larger grids, more colors, more complex patterns).
*   **Special Tiles:**
    *   **Locked Tiles:** These tiles are fixed in place and cannot be shifted, adding a stationary obstacle to puzzles.
    *   **Wildcard Tiles:** These versatile tiles can match any color, acting as a free space in the target pattern.
*   **Scoring System:**
    *   Each level has a target number of moves to be solved in for a perfect score.
    *   Players are awarded a star rating (1, 2, or 3 stars) based on the number of moves taken. This encourages replaying levels to find the optimal solution.
*   **Hint System:**
    *   If a player is stuck, they can use a hint.
    *   A hint will show one optimal move (e.g., highlighting a row/column and the direction to shift it).
    *   Hints will be limited (e.g., one hint per level or a cooldown timer).

## 3. Visual Design

*   **Aesthetic:** A clean, minimalist, and modern design.
*   **Game Board:** A clear grid with distinct, vibrant colors. Special tiles will have unique visual indicators (e.g., a lock icon for locked tiles).
*   **Target Pattern:** Displayed clearly next to or above the game board.
*   **Animations:** Smooth animations for tile shifting.
*   **Feedback:** Clear visual feedback for completing a level, including the star rating achieved.

## 4. Technical Requirements

*   **HTML5:** For the game's structure.
*   **CSS3:** For styling and responsive layout.
*   **JavaScript (ES6+):** For all game logic.
*   **No external libraries or frameworks.**

## 5. File Structure

*   `index.html`: The main HTML file.
*   `style.css`: The stylesheet.
*   `script.js`: The JavaScript file for the game logic.

## 6. Development Steps

1.  **HTML Structure:** Set up the HTML for the game board, target pattern, move counter, star display, and hint button.
2.  **CSS Styling:** Style all game elements, including indicators for special tiles.
3.  **JavaScript - Core Logic:**
    *   Develop the data structure for the game board, including special tile properties.
    *   Implement the row/column shifting logic, respecting locked tiles.
    *   Implement the win-condition check (matching the target pattern, with wildcards).
4.  **JavaScript - Game Flow:**
    *   Design and implement the level data, including the board layout, target pattern, and star rating thresholds.
    *   Handle player input (drag events).
    *   Implement the hint system logic.
    *   Manage level completion, star calculation, and transitioning to the next level.
5.  **Final Touches:**
    *   Polish the UI and animations.
    *   Test thoroughly across devices.