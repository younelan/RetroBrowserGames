import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createCarModel(color = 0xff0000) {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(4, 2, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    carGroup.add(body);

    // Roof
    const roofGeometry = new THREE.BoxGeometry(3, 1.5, 4);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.y = 2.5;
    carGroup.add(roof);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    const wheelPositions = [
        { x: -2, y: 0.8, z: 2 },  // Front Left
        { x: 2, y: 0.8, z: 2 },   // Front Right
        { x: -2, y: 0.8, z: -2 }, // Back Left
        { x: 2, y: 0.8, z: -2 }   // Back Right
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, pos.y, pos.z);
        carGroup.add(wheel);
    });

    return carGroup;
}
