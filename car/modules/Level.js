import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Level {
    constructor(name, trackPoints, startPosition, aiCars) {
        this.name = name;
        this.trackPoints = trackPoints;
        this.startPosition = startPosition;
        this.aiCars = aiCars;
    }
}
