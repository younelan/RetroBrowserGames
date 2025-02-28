const GAME_CONSTANTS = {
    // Canvas size (viewable area)
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Grid settings (full level size)
    GRID_SIZE: 32,
    TILE_SIZE: 32,
    
    // Player settings
    PLAYER: {
        SCALE: 2.0,  // Player scale factor
        WIDTH: 48,  // Keep original collision size
        HEIGHT: 48,
        MOVE_SPEED: 200,
        FLY_SPEED: 300,
        GRAVITY: 600,
        MAX_FUEL: 1000,
        FUEL_CONSUMPTION: 100, // per second
        STARTING_LIVES: 10,
        EMOJI: {
            STANDING: '🦸',
            HOVERING: '🚁',
            DRILLING: '⚡'
        }
    },
    
    // Miner settings
    MINER: {
        WIDTH: 40,
        HEIGHT: 40,
        EMOJI: '👷'
    },
    
    // Physics settings
    PHYSICS: {
        TERMINAL_VELOCITY: 6,
        HOVER_POWER: 0.3
    },
    
    // Weapon settings
    WEAPONS: {
        DYNAMITE_THROW_SPEED: 6,
        DYNAMITE_TIMER: 1500,
        EXPLOSION_RADIUS: 2,
        EMOJI: '💣'
    },
    
    // Collectible settings
    COLLECTIBLES: {
        '$': {
            SYMBOL: '$',
            POINTS: 100,
            COLOR: '#FFD700',
            EMOJI: '🪙'
        },
        '+': {
            SYMBOL: '+',
            POINTS: 500,
            COLOR: '#FF0000',
            EMOJI: '👷'
        },
        '.': {
            SYMBOL: '.',
            POINTS: 1000,
            COLOR: '#00FF00',
            EMOJI: '💎'
        }
    },
    
    // Colors
    COLORS: {
        WALL: '#0000FF',      // Blue wall
        DESTRUCTIBLE_WALL: '#8B4513',  // Red wall
        LAVA: '#FF4500',       // Orange lava
        SPIKE: '#808080',
        SNAKE: '#228B22',
        SPIDER: '#800000',
        WATER: '#4169E1',  // Royal Blue
        PLAYER: '#00ff00',
        PLAYER_DRILL: '#ffff00',
        PLAYER_HOVER: '#00ffff',
        MINER: '#ffff00',
        BACKGROUND: '#000000'      // Black
    },
    
    // Level symbols
    SYMBOLS: {
        EMPTY: ' ',
        BLUE_WALL: 'B',
        RED_WALL: 'R',
        LAVA: 'L',
        MINER: '+',
        PLAYER: '@'
    }
};

const WALLS = {
    B : "blue",
    R : "red",
    G : "green",
    Y : "yellow"
};
