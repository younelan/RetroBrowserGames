const TILE_SIZE = 32;
const LEVEL_WIDTH = 32;
const UI_HEIGHT_TILES = 3;
const LEVEL_HEIGHT = 16 + UI_HEIGHT_TILES; // Total height including UI

const PLAYER_SPEED = 4;
const PLAYER_JUMP_FORCE = 12;
const GRAVITY = 0.6;
const MAX_FALL_DISTANCE = 0; // Default: no fall damage (disabled)

const START_LIVES = 5;
const START_OXYGEN = 1000;

const DEFAULT_BACKGROUND_COLOR = '#000000'; // Default background color for levels

// Brick color schemes for different levels
const BRICK_COLOR_SCHEMES = {
    red: {
        brick: '#AA2C0B',    // Dark brown brick
        mortar: '#FFBBCC'      // Sandy brown mortar (original)
    },
    blue: {
        brick: '#1E3ADF',    // Dark blue brick
        mortar: '#AAAAFF'      // Light blue mortar
    },
    green: {
        brick: '#168833',    // Dark green brick
        mortar: '#86EF77'      // Light green mortar
    },
    gray: {
        brick: '#777777',    // Dark gray brick
        mortar: '#FFFFFF'      // Light gray mortar
    }
};

// Default brick color scheme
const DEFAULT_BRICK_SCHEME = 'red';

// Dirt color schemes for different levels
const DIRT_COLOR_SCHEMES = {
    brown: {
        base: '#4A3B28',      // Dark earth brown (current default)
        patch1: '#524135',    // Medium dirt
        patch2: '#5A4A3D',    // Lighter dirt
        patch3: '#3F342A',    // Darker dirt
        rock1: '#3A2F2A',     // Dark brown rock
        rock2: '#4A3B35',     // Medium brown rock
        rock3: '#5A4A45',     // Lighter brown rock
        crumbleBase: '#2A1F18' // Much darker base for crumbling dirt
    },
    red: {
        base: '#A0522D',      // Red/orange sand (current red sand)
        patch1: '#B8713A',    // Lighter red sand
        patch2: '#CD853F',    // Orange sand
        patch3: '#8B4513',    // Darker red sand
        rock1: '#654321',     // Dark brown rock
        rock2: '#8B4513',     // Saddle brown rock
        rock3: '#A0522D',     // Red sand rock
        crumbleBase: '#5A2E10' // Much darker red base for crumbling
    },
    blue: {
        base: '#2E4A6B',      // Dark blue dirt
        patch1: '#3D5A7C',    // Medium blue dirt
        patch2: '#4C6B8D',    // Lighter blue dirt
        patch3: '#1F3A5B',    // Darker blue dirt
        rock1: '#1A2F4A',     // Dark blue rock
        rock2: '#2A3F5A',     // Medium blue rock
        rock3: '#3A4F6A',     // Lighter blue rock
        crumbleBase: '#0F1F3B' // Much darker blue base for crumbling
    },
    green: {
        base: '#2D4A2E',      // Dark green dirt
        patch1: '#3C5A3D',    // Medium green dirt
        patch2: '#4B6B4C',    // Lighter green dirt
        patch3: '#1E3A1F',    // Darker green dirt
        rock1: '#193A1A',     // Dark green rock
        rock2: '#294A2A',     // Medium green rock
        rock3: '#395A3A',     // Lighter green rock
        crumbleBase: '#0F1F10' // Much darker green base for crumbling
    },
    pink: {
        base: '#8B4A6B',      // Pink-purple dirt
        patch1: '#9B5A7B',    // Medium pink dirt
        patch2: '#AB6A8B',    // Lighter pink dirt
        patch3: '#7B3A5B',    // Darker pink dirt
        rock1: '#6B2A4B',     // Dark pink rock
        rock2: '#7B3A5B',     // Medium pink rock
        rock3: '#8B4A6B',     // Lighter pink rock
        crumbleBase: '#4B1A3B' // Much darker pink base for crumbling
    },
    desert: {
        base: '#D2B48C',      // Light tan desert sand
        patch1: '#DDD5AC',    // Light desert sand
        patch2: '#E6D8BC',    // Lighter desert sand
        patch3: '#C2A47C',    // Darker desert sand
        rock1: '#A0906C',     // Dark desert rock
        rock2: '#B0A07C',     // Medium desert rock
        rock3: '#C0B08C',     // Lighter desert rock
        crumbleBase: '#8A6A4C' // Much darker desert base for crumbling
    },
    ice: {
        base: '#4A6B8D',      // Icy blue-gray dirt
        patch1: '#5A7B9D',    // Medium ice dirt
        patch2: '#6A8BAD',    // Lighter ice dirt
        patch3: '#3A5B7D',    // Darker ice dirt
        rock1: '#2A4B6D',     // Dark ice rock
        rock2: '#3A5B7D',     // Medium ice rock
        rock3: '#4A6B8D',     // Lighter ice rock
        crumbleBase: '#1A2B4D' // Much darker ice base for crumbling
    },
    yellow: {
        base: '#B8A532',      // Golden yellow dirt
        patch1: '#C8B542',    // Medium yellow dirt
        patch2: '#D8C552',    // Lighter yellow dirt
        patch3: '#A89522',    // Darker yellow dirt
        rock1: '#987512',     // Dark yellow rock
        rock2: '#A89522',     // Medium yellow rock
        rock3: '#B8A532',     // Lighter yellow rock
        crumbleBase: '#685512' // Much darker yellow base for crumbling
    }
};

// Default dirt color scheme
const DEFAULT_DIRT_SCHEME = 'brown';

// Surface color schemes for different levels
const SURFACE_COLOR_SCHEMES = {
    grass: {
        base: '#4A7C59',      // Medium green
        patch1: '#3E6B4A',    // Darker green
        patch2: '#5A8C69',    // Lighter green
        patch3: '#567A61',    // Medium-dark green
        blade: '#6B9A7A'       // Bright green
    },
    ice: {
        base: '#ADD8E6',      // Light blue
        patch1: '#B0E0E6',    // Powder blue
        patch2: '#AFEEEE',    // Pale turquoise
        patch3: '#98D8D8',    // Lighter blue
        crack: '#FFFFFF'       // White
    }
};
START_LEVEL_INDEX = 0; 
// Default surface color scheme
const DEFAULT_SURFACE_SCHEME = 'grass';

const TILE_ATTRIBUTES = {
    ' ': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },
    'X': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false },
    '-': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: true }, // Crumbling
    '_': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // Brick
    '=': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // Dirt
    ':': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: false }, // 2 Layer Platform
    ';': { isSolid: true, isPlatform: true, isHazard: false, isMoving: false, isCrumble: true }, // 2 Layer Crumbling Platform
    '<': { isSolid: true, isPlatform: true, isHazard: false, isMoving: true, moveDirection: -1, isCrumble: false }, // Moving Left
    '>': { isSolid: true, isPlatform: true, isHazard: false, isMoving: true, moveDirection: 1, isCrumble: false },  // Moving Right
    '+': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }, // Key
    '*': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }, // Portal
    'H': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false, isCrumble: false },  // Generic Hazard
    'I': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false, isCrumble: false },  // Spikes
    'F': { isSolid: false, isPlatform: false, isHazard: true, isMoving: false, isCrumble: false },  // Fire
    'E': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Horizontal)
    'V': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Bat)
    'Z': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Robot)
    'J': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Goose)
    'A': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Seal)
    'N': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Dinosaur)
    'P': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Penguin)
    '1': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tall Tree
    '2': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tree/Cactus
    '3': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Shrub/Bush
    '4': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tall Cactus
    '@': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }   // Player Start
};