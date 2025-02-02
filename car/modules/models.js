import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createVehicle(color) {
    // Build common F1-style car body
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-2, -1);
    bodyShape.quadraticCurveTo(-2.8, -0.2, -2.4, 0);
    bodyShape.quadraticCurveTo(-2, 0.6, -1.2, 0.7);
    bodyShape.lineTo(0, 0.7);
    bodyShape.quadraticCurveTo(1.2, 0.8, 1.8, 0.5);
    bodyShape.quadraticCurveTo(2.4, 0.2, 2.6, 0);
    bodyShape.quadraticCurveTo(2.4, -0.6, 1.8, -1);
    bodyShape.lineTo(-2, -1);
    
    const extrudeSettings = {
        steps: 1,
        depth: 1.6,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 4
    };
    
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 150,
        specular: 0x888888
    });
    
    const vehicle = new THREE.Group();
    const bodyMesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(bodyShape, extrudeSettings),
        bodyMaterial
    );
    bodyMesh.scale.set(0.6, 0.6, 0.6);
    // Shift only the car body 50% its width (width ~4 => offset = 2)
    // Changed from bodyMesh.position.x += 2 to subtract 2 so it moves toward the wheels.
    bodyMesh.position.x -= 0;
    vehicle.add(bodyMesh);
    
    // Common wheel creation
    const wheelBase = 0.8;
    const wheelOffset = (wheelBase+1)* 0.5;
    const wheelOffset2 = (wheelBase)* 0.5;
    const wheelPositions = [
        { x: 1.2, y: 0, z: +wheelOffset },
        { x: 1.2, y: 0, z: -wheelOffset+1 },
        { x: -1.2, y: 0, z: +wheelOffset },
        { x: -1.2, y: 0, z: 0 },
    ];
    wheelPositions.forEach(pos => {
        const wheel = createWheel();
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.x = Math.PI / 2;
        vehicle.add(wheel);
    });
    
    // Common driver figure
    const driverGroup = new THREE.Group();
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xffdbac })
    );
    head.position.set(0, 0.18, 0);
    const driverBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.16, 0.4, 8),
        new THREE.MeshPhongMaterial({ color: color })
    );
    driverBody.position.y = -2.25;
    const cockpit = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.6, 1.2),
        new THREE.MeshPhongMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.8
        })
    );
    cockpit.position.set(0.2, 0.3, 0.5);
    driverGroup.add(cockpit);
    driverGroup.add(head);
    driverGroup.add(driverBody);
    vehicle.add(driverGroup);
    
    return vehicle;
}

function createWheel() {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32),
        new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 30
        })
    );
    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16),
        new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            shininess: 100
        })
    );
    wheelGroup.add(tire);
    wheelGroup.add(rim);
    return wheelGroup;
}
