# Space Wars Horizontal Shooter Game

This is a horizontal shoot 'em up game built with JavaScript, HTML, and CSS, featuring terrain, highly detailed spaceship designs with gradients, animated rocket fire, and multiple distinct enemy types.

## How to Play

### Objective

Navigate your advanced spaceship through varying terrain, shoot down incoming enemy spacecraft, and avoid collisions with both enemies and the ground. Your goal is to achieve the highest score possible.

### Controls

#### Desktop (Keyboard)

*   **Arrow Keys (Up, Down, Left, Right):** Move your spaceship.
*   **Spacebar:** Shoot bullets.

#### Mobile (Touch)

*   **Drag:** Touch and drag your finger on the screen to move your spaceship. The ship will follow your finger's position.

### Game Elements

*   **Player Spaceship (Highly Detailed Blue/Grey with Animated Rocket Fire):** Your advanced vehicle now boasts a sleek, futuristic design with intricate details, multiple layers, gradients for a 3D-like appearance, a distinct cockpit with reflection, and a dynamic, flickering rocket exhaust correctly positioned at the rear.
*   **Bullets (Yellow Rectangles):** Powerful projectiles fired from your spaceship. They are larger and faster, making it easier to hit enemies.
*   **Enemy Spaceships (Multiple Highly Detailed Types with Animated Rocket Fire):** Incoming enemy spacecraft now come in three distinct, highly detailed types: 
    *   **Scout (Red):** Sleek and fast, designed for reconnaissance.
    *   **Fighter (Indigo):** Agile and angular, built for combat.
    *   **Bomber (Dark Grey):** Large and imposing, capable of heavy attacks.
    Each type features complex designs with main bodies, cockpits, wings/cannons, gradients for a 3D-like effect, and animated rocket exhausts correctly positioned at the rear. Enemies consistently fly above the terrain. Colliding with them reduces your health.
*   **Terrain (Brown/Green):** The ground that scrolls horizontally. Avoid colliding with it.
*   **Score:** Increases when you destroy enemy ships.
*   **Health:** Represents how many hits your ship can take before the game ends. Terrain collision is instant death.

## Game Mechanics

*   **Horizontal Scrolling:** Enemies and terrain appear from the right side of the screen and move towards the left.
*   **Collision Detection:** 
    *   Bullets destroy enemies.
    *   Player colliding with enemies reduces player health.
    *   Player colliding with terrain results in instant game over.
*   **Game Over:** The game ends when your player spaceship's health reaches zero.
*   **Restart:** Refresh the page (F5) to restart the game after a Game Over.

## Technical Details

*   **Square Ratio:** The game view area maintains a square ratio and scales to fit the screen, ensuring a consistent experience across devices.
*   **Responsive Design:** Works on both mobile and desktop browsers.
*   **JavaScript:** Handles all game logic, rendering, and input.
*   **HTML:** Provides the canvas element for rendering.
*   **CSS:** Styles the canvas and ensures proper scaling and centering.
