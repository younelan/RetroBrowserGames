class Level {
    constructor(name, trackPoints, startPosition, aiCars) {
        this.name = name;
        this.trackPoints = trackPoints;
        this.startPosition = startPosition;
        this.aiCars = aiCars;
    }
}

const LEVELS = {
    level1: new Level(
        "Beginner Circuit",
        [
            new THREE.Vector3(-50, 0, -50),
            new THREE.Vector3(50, 0, -50),
            new THREE.Vector3(100, 0, 0),
            new THREE.Vector3(50, 0, 50),
            new THREE.Vector3(-50, 0, 50),
            new THREE.Vector3(-100, 0, 0)
        ],
        new THREE.Vector3(-50, 0.5, -40),
        [
            { startPosition: new THREE.Vector3(-50, 0.5, -45), color: 0x00ff00 },
            { startPosition: new THREE.Vector3(-50, 0.5, -35), color: 0x0000ff }
        ]
    ),
    
    level2: new Level(
        "Pro Circuit",
        [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(100, 0, 0),
            new THREE.Vector3(150, 0, 50),
            new THREE.Vector3(150, 0, 100),
            new THREE.Vector3(100, 0, 150),
            new THREE.Vector3(0, 0, 150),
            new THREE.Vector3(-50, 0, 100),
            new THREE.Vector3(-50, 0, 50)
        ],
        new THREE.Vector3(0, 0.5, 10),
        [
            { startPosition: new THREE.Vector3(0, 0.5, -5), color: 0xff0000 },
            { startPosition: new THREE.Vector3(0, 0.5, 5), color: 0x00ff00 },
            { startPosition: new THREE.Vector3(0, 0.5, 15), color: 0x0000ff }
        ]
    )
};
