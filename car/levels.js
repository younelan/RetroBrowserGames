class Level {
    constructor(name, trackPoints, startPosition, aiCars) {
        this.name = name;
        this.trackPoints = trackPoints;
        this.startPosition = startPosition;
        this.aiCars = aiCars;
    }
}

// Create a perfect circle of points
const radius = 80;
const circlePoints = [];
const segments = 32;  // More segments for smoother circle

for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
    ));
}

const LEVELS = {
    level1: new Level(
        "Circle Track",
        circlePoints,
        new THREE.Vector3(radius, 0.5, 0),  // Start on the right side of circle
        [
            { startPosition: new THREE.Vector3(radius, 0.5, 5), color: 0x00ff00 },
            { startPosition: new THREE.Vector3(radius, 0.5, -5), color: 0x0000ff }
        ]
    )
};
