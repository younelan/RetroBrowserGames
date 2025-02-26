const LEVELS = [
    {
        id: 1,
        name: "Level 1",
        slingshot: {
            x: 0.25, // percentage of screen width
            y: 0.9  // percentage of screen height
        },
        enemies: [
            { x: 0.75, y: 0.9, type: 'basic' },
            { x: 0.85, y: 0.9, type: 'basic' }
        ],
        platforms: [
            {
                x: 0.25,
                y: 0.8,
                width: 0.2,
                height: 0.1,
                type: "ground"
            }
        ]
    }
];
