const LEVELS = [
    {
        id: 1,
        name: "Level 1",
        slingshot: {
            x: 0.25, 
            y: 0.9  
        },
        enemies: [
            { x: 0.75, y: 0.9, type: 'basic' },
            { x: 0.85, y: 0.9, type: 'basic' }
        ],
        platforms: [
            {
                x: 0,
                y: 0.91,
                width: 1,
                height: 0.1,
                type: "ground"
            }
        ]
    },
    {
        id: 2,
        name: "Level 2",
        slingshot: {
            x: 0.25,
            y: 0.9
        },
        enemies: [
            { x: 0.75, y: 0.9, type: 'basic' },
            { x: 0.85, y: 0.9, type: 'basic' },
            { x: 0.8, y: 0.5, type: 'basic' }
        ],
        platforms: [
            {
                x: 0,
                y: 0.91,
                width: 1,
                height: 0.1,
                type: "ground"
            },

            {
                x: 0.7,
                y: 0.5,
                width: 0.2,
                height: 0.05,
                type: "ground"
            },
            {
                x: 0.4,
                y: 0.2,
                width: 0.2,
                height: 0.05,
                type: "ground"
            }
        ]
    }
];
