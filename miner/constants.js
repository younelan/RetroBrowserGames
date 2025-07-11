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
START_LEVEL_INDEX = 3; 
// Default surface color scheme
const DEFAULT_SURFACE_SCHEME = 'grass';

// Moving platform color schemes for different levels
const MOVING_PLATFORM_COLOR_SCHEMES = {
    gray: {
        base: '#666666',      // Dark gray metal
        rail: '#888888',      // Medium gray for rails
        surface: '#2C2C2C',   // Very dark gray for belt surface
        pattern: '#444444',   // Dark gray for pattern lines
        gear: '#2E2E2E',      // Darkest gray for gears
        gearCenter: '#1A1A1A',// Even darker for gear center
        segment: '#555555'    // Medium dark gray for segments
    },
    green: {
        base: '#3A663A',      // Dark green metal
        rail: '#5A885A',      // Medium green for rails
        surface: '#1A331A',   // Very dark green for belt surface
        pattern: '#2A552A',   // Dark green for pattern lines
        gear: '#1E3A1E',      // Darkest green for gears
        gearCenter: '#0A1A0A',// Even darker for gear center
        segment: '#4A774A'    // Medium dark green for segments
    },
    red: {
        base: '#663A3A',      // Dark red metal
        rail: '#885A5A',      // Medium red for rails
        surface: '#331A1A',   // Very dark red for belt surface
        pattern: '#552A2A',   // Dark red for pattern lines
        gear: '#3A1E1E',      // Darkest red for gears
        gearCenter: '#1A0A0A',// Even darker for gear center
        segment: '#774A4A'    // Medium dark red for segments
    },
    brown: {
        base: '#664A3A',      // Dark brown metal
        rail: '#886A5A',      // Medium brown for rails
        surface: '#33251A',   // Very dark brown for belt surface
        pattern: '#553A2A',   // Dark brown for pattern lines
        gear: '#3A2A1E',      // Darkest brown for gears
        gearCenter: '#1A100A',// Even darker for gear center
        segment: '#775A4A'    // Medium dark brown for segments
    },
    blue: {
        base: '#3A3A66',      // Dark blue metal
        rail: '#5A5A88',      // Medium blue for rails
        surface: '#1A1A33',   // Very dark blue for belt surface
        pattern: '#2A2A55',   // Dark blue for pattern lines
        gear: '#1E1E3A',      // Darkest blue for gears
        gearCenter: '#0A0A1A',// Even darker for gear center
        segment: '#4A4A77'    // Medium dark blue for segments
    }
};

const DEFAULT_MOVING_PLATFORM_SCHEME = 'gray';

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
    'S': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Spider - Static)
    'T': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Spider - Moving)
    'Q': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Enemy (Toilet)
    '1': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tall Tree
    '2': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tree/Cactus
    '3': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Shrub/Bush
    '4': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false },  // Tall Cactus
    '@': { isSolid: false, isPlatform: false, isHazard: false, isMoving: false, isCrumble: false }   // Player Start
};