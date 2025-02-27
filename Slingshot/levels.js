const GRID_SIZE = 32; // Base unit for our grid

const LEVELS = [
    {
        id: 1,
        name: "Level 1",
        width: 1024,  // 32 * 32
        height: 768,  // 24 * 32
        viewport: 768,
        slingshot: {
            x: 256,
            y: 730
        },
      enemies: [
            { x: 768, y: 700, type: 'basic' },
            { x: 864, y: 700, type: 'basic' }
        ],
        platforms: [
            {
                x: 0,
                y: 728,
                width: 1024,
                height: 40,
                type: "ground"
            },
            { x: 864, y: 500, type: 'basic' },
        ]
    },
    {
        id: 2,
        name: "Level 2",
        width: 1024,
        height: 768,
        slingshot: {
            x: 256,
            y: 728
        },
        enemies: [
            { x: 768, y: 700, type: 'basic' },
            { x: 864, y: 700, type: 'basic' },
            { x: 832, y: 380, type: 'basic' }
        ],
        platforms: [
            {
                x: 0,
                y: 728,
                width: 1024,
                height: 40,
                type: "ground"
            },
            {
                x: 704,
                y: 400,
                width: 192,
                height: 32,
                type: "ground"
            },
            {
                x: 416,
                y: 192,
                width: 192,
                height: 32,
                type: "ground"
            }
        ]
    }
];
