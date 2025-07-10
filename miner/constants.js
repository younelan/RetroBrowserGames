const TILE_SIZE = 32;
const LEVEL_WIDTH = 32;
const UI_HEIGHT_TILES = 3;
const LEVEL_HEIGHT = 16 + UI_HEIGHT_TILES; // Total height including UI

const PLAYER_SPEED = 4;
const PLAYER_JUMP_FORCE = 12;
const GRAVITY = 0.6;
const MAX_FALL_DISTANCE = TILE_SIZE * 8; // Example: 8 tiles high

const START_LIVES = 3;
const START_OXYGEN = 1000;

const DEFAULT_BACKGROUND_COLOR = '#000000'; // Default background color for levels

const TILE_ATTRIBUTES = {
    ' ': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },
    'X': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false },
    'C': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: true }, // Crumbling
    'B': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // Brick
    'D': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // Dirt
    'G': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // Grass
    'M': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: true }, // Crumbling Grass
    'Q': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // Red Sand
    'W': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: true }, // Crumbling Red Sand
    '<': { isSolid: true, isPlatform: true, isHazard: false, isMoving: true, moveDirection: -1, isCrumble: false }, // Moving Left
    '>': { isSolid: true, isPlatform: true, isHazard: false, isMoving: true, moveDirection: 1, isCrumble: false },  // Moving Right
    '+': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }, // Key
    '=': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }, // Portal
    'H': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false, isCrumble: false },  // Generic Hazard
    'I': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false, isCrumble: false },  // Spikes
    'F': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false, isCrumble: false },  // Fire
    'E': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Horizontal)
    'V': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Vertical)
    'Z': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Complex)
    'J': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Goose)
    'A': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Seal)
    'N': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Dinosaur)
    '1': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tall Tree
    '2': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tree/Cactus
    '3': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Shrub/Bush
    '4': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tall Cactus
    '@': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }   // Player Start
};
