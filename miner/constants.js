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

const TILE_ATTRIBUTES = {
    ' ': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false },
    'X': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false },
    'C': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false }, // Crumbling
    'B': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false }, // Brick
    'L': { isSolid: true, isPlatform: true, isHazard: false, isMoving: true, moveDirection: -1 }, // Moving Left
    'R': { isSolid: true, isPlatform: true, isHazard: false, isMoving: true, moveDirection: 1 },  // Moving Right
    'K': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false }, // Key
    'P': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false }, // Portal
    'H': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false },  // Generic Hazard
    'S': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false },  // Spikes
    'F': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false },  // Fire
    'E': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false },  // Enemy (Horizontal)
    'V': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false },  // Enemy (Vertical)
    'Z': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false },  // Enemy (Complex)
    '@': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false }   // Player Start
};
