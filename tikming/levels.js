// levels.js

const levels = [
    {
        name: "Level 1: Just Dig!",
        levelNumber: 1,
        tikmingCount: 10,
        requiredToSave: 5,
        tikmingTypes: {
            digger: 30
        },
        properties: {
            timeLimit: 180,
            startX: 320,
            startY: 80,
            exitX: 320,
            exitY: 620,
            terrain: [
                { x: 80, y: 150, width: 480, height: 20, type: 'platform' },
                { x: 80, y: 170, width: 480, height: 350, type: 'earth' },
                { x: 0, y: 620, width: 640, height: 20, type: 'floor' },
                { x: 0, y: 0, width: 10, height: 640, type: 'wall' },
                { x: 630, y: 0, width: 10, height: 640, type: 'wall' }
            ]
        }
    },
    {
        name: "Level 2: One Small Step...",
        levelNumber: 2,
        tikmingCount: 15,
        requiredToSave: 10,
        tikmingTypes: {
            floater: 15
        },
        properties: {
            timeLimit: 180,
            startX: 100,
            startY: 50,
            exitX: 540,
            exitY: 620,
            terrain: [
                { x: 50, y: 100, width: 100, height: 20, type: 'platform' },
                { x: 0, y: 620, width: 640, height: 20, type: 'floor' },
                { x: 0, y: 0, width: 10, height: 640, type: 'wall' },
                { x: 630, y: 0, width: 10, height: 640, type: 'wall' }
            ]
        }
    },
    {
        name: "Level 3: Block and Bash",
        levelNumber: 3,
        tikmingCount: 20,
        requiredToSave: 15,
        tikmingTypes: {
            blocker: 5,
            basher: 10
        },
        properties: {
            timeLimit: 240,
            startX: 80,
            startY: 100,
            exitX: 580,
            exitY: 300,
            terrain: [
                { x: 0, y: 150, width: 400, height: 20, type: 'platform' },
                { x: 20, y: 170, width: 250, height: 10, type: 'earth' },
                // Wall to bash through
                { x: 350, y: 0, width: 40, height: 300, type: 'earth' },
                // Exit platform - 150px drop from bash tunnel
                { x: 350, y: 300, width: 220, height: 20, type: 'platform' },
                { x: 0, y: 620, width: 640, height: 20, type: 'floor' },
                { x: 0, y: 0, width: 10, height: 640, type: 'wall' },
                { x: 630, y: 0, width: 10, height: 640, type: 'wall' }
            ]
        }
    },
    {
        name: "Level 4: Bridge Over Water",
        levelNumber: 4,
        tikmingCount: 20,
        requiredToSave: 15,
        tikmingTypes: {
            builder: 20
        },
        properties: {
            timeLimit: 300,
            startX: 100,
            startY: 250,
            exitX: 540,
            exitY: 350,
            terrain: [
                { x: 40, y: 300, width: 150, height: 20, type: 'platform' },
                // Gap
                { x: 450, y: 350, width: 150, height: 20, type: 'platform' },
                // Deep water/pit below
                { x: 0, y: 620, width: 640, height: 20, type: 'floor' },
                { x: 0, y: 0, width: 10, height: 640, type: 'wall' },
                { x: 630, y: 0, width: 10, height: 640, type: 'wall' }
            ]
        }
    },
    {
        name: "Level 5: The Grand Tour",
        levelNumber: 5,
        tikmingCount: 30,
        requiredToSave: 20,
        tikmingTypes: {
            blocker: 5,
            basher: 5,
            builder: 10,
            digger: 10,
            floater: 10
        },
        properties: {
            timeLimit: 600,
            startX: 320,
            startY: 50,
            exitX: 320,
            exitY: 620,
            terrain: [
                { x: 220, y: 100, width: 200, height: 20, type: 'platform' },
                // Middle block - requires digging or building around
                { x: 100, y: 250, width: 440, height: 100, type: 'earth' },
                // Float down to bottom
                { x: 200, y: 620, width: 240, height: 20, type: 'floor' },
                { x: 0, y: 0, width: 10, height: 640, type: 'wall' },
                { x: 630, y: 0, width: 10, height: 640, type: 'wall' }
            ]
        }
    }
];
