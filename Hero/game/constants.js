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
        // Blues
        LIGHT_BLUE: 'B',
        MED_BLUE: 'C',
        DARK_BLUE: 'D',
        
        // Browns
        LIGHT_BROWN: 'N',
        MED_BROWN: 'M',
        DARK_BROWN: 'K',
        
        // Reds
        LIGHT_RED: 'R',
        MED_RED: 'S',
        DARK_RED: 'T',
        
        // Greens
        LIGHT_GREEN: 'G',
        MED_GREEN: 'H',
        DARK_GREEN: 'I',
        
        // Additional colors
        ORANGE: 'O',
        PURPLE: 'P',
        GOLD: 'Y',
        
        // Special tiles
        LAVA: '!',
        MINER: '+',
        PLAYER: '@'
    }
};

const WALLS = {
    // Blues (B, C, D)
    B: "#87CEEB",  // Light blue
    C: "#4169E1",  // Medium blue
    D: "#00008B",  // Dark blue
    
    // Browns (N, M, K)
    N: "#D2B48C",  // Light brown (tan)
    M: "#8B4513",  // Medium brown
    K: "#3E2723",  // Dark brown
    
    // Reds (R, S, T)
    R: "#FF6B6B",  // Light red
    S: "#DC143C",  // Medium red
    T: "#8B0000",  // Dark red
    
    // Greens (G, H, I)
    G: "#90EE90",  // Light green
    H: "#228B22",  // Medium green
    I: "#006400",  // Dark green
    
    // Golds (Y, U, V)
    Y: "#FFD700",  // Light gold
    U: "#DAA520",  // Medium gold
    V: "#B8860B",  // Dark gold
    
    // Additional colors
    O: "#FFA500",  // Orange
    P: "#800080",  // Purple

    W: "#A9A9A9",  // Light gray
    X: "#696969",  // Dark gray
    Z: "#800000",  // Maroon
};
