import * as THREE from 'three';

export default class Hazard {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type;
        this.position = new THREE.Vector3(x, y, 0);
        this.dead = false;
        this.createMesh();
    }

    createMesh() {
        if (this.type === 'dog') {
            const group = new THREE.Group();
            const brown = new THREE.MeshStandardMaterial({ color: '#5d4037' });

            // Body
            const body = new THREE.Mesh(new THREE.BoxGeometry(10, 18, 10), brown);
            body.position.z = 10;
            group.add(body);

            // Head
            const head = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), brown);
            head.position.set(0, 10, 16);
            group.add(head);

            // Ears
            const earGeo = new THREE.BoxGeometry(2, 4, 6);
            const lEar = new THREE.Mesh(earGeo, brown);
            lEar.position.set(-4, 10, 20);
            group.add(lEar);
            const rEar = new THREE.Mesh(earGeo, brown);
            rEar.position.set(4, 10, 20);
            group.add(rEar);

            // Legs
            const legGeo = new THREE.BoxGeometry(3, 3, 10);
            const legs = [
                { x: -3, y: -6 }, { x: 3, y: -6 },
                { x: -3, y: 6 }, { x: 3, y: 6 }
            ];
            legs.forEach(l => {
                const leg = new THREE.Mesh(legGeo, brown);
                leg.position.set(l.x, l.y, 5);
                group.add(leg);
            });

            // Tail
            const tail = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2), brown);
            tail.position.set(0, -10, 14);
            tail.rotation.x = -Math.PI / 4;
            group.add(tail);

            this.mesh = group;
        } else if (this.type === 'skateboarder') {
            const group = new THREE.Group();
            const deck = new THREE.Mesh(new THREE.BoxGeometry(15, 30, 2), new THREE.MeshStandardMaterial({ color: '#333' }));
            deck.position.z = 4;
            group.add(deck);

            // Person
            const shirt = new THREE.MeshStandardMaterial({ color: '#3498db' });
            const skin = new THREE.MeshStandardMaterial({ color: '#ffdbac' });

            const body = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 20), shirt);
            body.position.z = 15;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), skin);
            head.position.z = 30;
            group.add(head);

            this.mesh = group;
        }
        this.mesh.position.copy(this.position);
        this.game.scene.add(this.mesh);
    }

    update(dt) {
        if (this.dead) return;

        if (this.type === 'dog') {
            const dist = this.position.distanceTo(this.game.bike.position);
            if (dist < 300) {
                // Chase
                const dir = new THREE.Vector3().subVectors(this.game.bike.position, this.position).normalize();
                this.position.add(dir.multiplyScalar(180 * dt));
                this.mesh.lookAt(this.game.bike.position.x, this.game.bike.position.y, 0);
            }
        } else if (this.type === 'skateboarder') {
            this.position.x += 200 * dt; // Cross road faster
            if (this.position.x > 400) this.dead = true;
        }

        this.mesh.position.copy(this.position);
        this.checkCollision();

        if (this.position.y < this.game.bike.position.y - 1000) {
            this.cleanup();
        }
    }

    checkCollision() {
        const dist = this.position.distanceTo(this.game.bike.position);
        if (dist < 30) {
            this.game.crash();
        }
    }

    cleanup() {
        this.dead = true;
        this.game.scene.remove(this.mesh);
    }
}
