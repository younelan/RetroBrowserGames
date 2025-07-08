const TILE_SIZE = 32;
const LEVEL_WIDTH = 32;
const UI_HEIGHT_TILES = 3;
const LEVEL_HEIGHT = 16 + UI_HEIGHT_TILES; // Total height including UI

const PLAYER_SPEED = 4;
const PLAYER_JUMP_FORCE = 12;
const GRAVITY = 0.6;
const MAX_FALL_DISTANCE = TILE_SIZE * 8; // Example: 8 tiles high

const START_LIVES = 10;
const START_OXYGEN = 5000;
