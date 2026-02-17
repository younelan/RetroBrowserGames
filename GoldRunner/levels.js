const LEVELS = [
    {
        // Level 1
        // ' ': Empty, '#': Brick, 'B': Bedrock, 'H': Ladder, '-': Rope, 'o': Gold, '@': Player, '+': Guard
        map: [
            "BBBBBBBBBBBBBBBBBBBB",
            "H                  H",
            "H    o  +          H",
            "H ##H#########H### H",
            "H # H         H  # H",
            "H # H#########H# # H",
            "H # H    H    H  # H",
            "H #######H######## H",
            "H        H         H",
            "H -------H-------  H",
            "H        H         H",
            "H ### H###### H####H",
            "H     H       H    H",
            "H##################H",
            "H              o   H",
            "BB####H###########BB",
            "BB    H    @        ",
            "BB H##############  ",
            "BB H     o       H  ",
            "BBBBBBBBBBBBBBBBBBBB",
        ],
        // Note: Coordinates are handled internally by game.js parsing '@' and '+'
        // but kept for compatibility if needed.
        viewport: 10,
        spawn: { x: 10, y: 16 },
        exit: { x: 10, y: 0, tiles: [{ x: 10, y: 0 }, { x: 10, y: 1 }, { x: 10, y: 2 }] },
        enemies: [
            { x: 3, y: 2 },
            { x: 16, y: 2 }
        ]
    }
];
