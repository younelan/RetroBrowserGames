# 🏃 Lode Runner Classic: Design Doc

## 🎮 Core Gameplay
Lode Runner is a tactical puzzle-platformer where the player (The Runner) must collect all gold chests in a level while being pursued by Guards.

### Key Features
- **The Dig**: The Runner cannot jump. Instead, they dig holes into brick floors to trap guards or reach lower areas.
- **Regeneration**: Dug holes eventually fill back up. If a guard (or the runner) is in a hole when it fills, they are crushed/captured.
- **The Exit**: Once all gold is collected, a hidden ladder appears leading to the top of the screen to finish the level.
- **Enemy Stun**: Guards trapped in holes can be walked over. They will eventually climb out if the hole hasn't filled.

## 🧱 Tile Types
- **Empty (0)**: Air.
- **Brick (1)**: Solid, can be dug.
- **Bedrock (2)**: Solid, cannot be dug.
- **Ladder (3)**: Vertical movement.
- **Rope (4)**: Horizontal hand-over-hand movement.
- **Gold (5)**: Collectible.
- **False Floor (6)**: Looks like brick but allows falling through.

## 🛠️ Implementation Strategy
- **Grid-Based**: 20x15 grid for classic 4:3 or modern proportional layout.
- **Entity Component**: Shared logic for Runner and Guards.
- **Tick Engine**: Holes managed by a timer object for regeneration.
- **Levels**: Exported from `levels.js` for easy community/manual expansion.
