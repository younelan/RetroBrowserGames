import * as THREE from 'three';

export default class Projectile {
    constructor(game, x, y, direction) {
        this.game = game;
        this.direction = direction;
        this.position = new THREE.Vector3(x, y + 20, 30);
        this.velocity = new THREE.Vector3(250 * direction, 200, 100);
        this.gravity = -400;
        this.dead = false;

        this.createMesh();
    }

    createMesh() {
        const geo = new THREE.BoxGeometry(10, 15, 6);
        const mat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.game.scene.add(this.mesh);
    }

    update(dt) {
        if (this.dead) return;

        this.velocity.z += this.gravity * dt;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        this.mesh.position.copy(this.position);
        this.mesh.rotation.x += 10 * dt;
        this.mesh.rotation.y += 5 * dt;

        // Ground collision
        if (this.position.z < 3) {
            this.position.z = 3;
            this.dead = true;

            // Ground impact particles
            if (this.game.particles) {
                this.game.particles.spawn('dust', this.position.x, this.position.y, 3, 5);
            }

            // Leave on ground for a bit then remove
            setTimeout(() => {
                this.game.scene.remove(this.mesh);
            }, 1000);
        }

        this.checkCollisions();

        // Cleanup if far away
        if (Math.abs(this.position.y - this.game.bike.position.y) > 1000) {
            this.dead = true;
            this.game.scene.remove(this.mesh);
        }
    }

    checkCollisions() {
        if (this.dead) return;

        // Check mailbox collisions
        this.game.road.segments.forEach(seg => {
            const mailboxes = [
                { group: seg.leftMailboxMesh, side: 'left' },
                { group: seg.rightMailboxMesh, side: 'right' }
            ];

            mailboxes.forEach(m => {
                if (m.group) {
                    const mailPos = new THREE.Vector3();
                    m.group.getWorldPosition(mailPos);
                    const dist = this.position.distanceTo(mailPos);
                    if (dist < 45) { // More forgiving
                        this.hitMailbox(seg, m.group, m.side);
                    }
                }
            });

            // Check house window collisions (both sides)
            if (!this.dead && seg.mesh) {
                const houseX = (350 / 2 + 60 + 120); // Sync with Road.js constants
                const houses = [
                    { data: seg.leftHouse, xOff: -houseX },
                    { data: seg.rightHouse, xOff: houseX }
                ];

                houses.forEach(h => {
                    const dx = Math.abs(this.position.x - h.xOff);
                    const dy = Math.abs(this.position.y - seg.y);
                    const dz = this.position.z;

                    // House volume check: Body is 100 wide (x), 150 deep (y), up to 130 high (z)
                    if (dx < 60 && dy < 85 && dz < 140) {
                        this.hitHouse(seg, h.data);
                    }
                });
            }
        });
    }

    hitHouse(seg, houseData) {
        this.dead = true;
        this.game.scene.remove(this.mesh);

        // Impact Particles
        if (this.game.particles) {
            this.game.particles.spawn('impact', this.position.x, this.position.y, this.position.z, 20);
        }

        // Window Shatter Effect (Legacy points keep for extra flare?)
        this.spawnShatter(this.position.clone());

        if (houseData.type === 'non-subscriber') {
            this.game.updateScore(150);
        } else {
            this.game.updateScore(-200);
        }
    }

    spawnShatter(pos) {
        const count = 40;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                Math.random() * 8
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: '#ffffff', size: 4 });
        const points = new THREE.Points(geo, mat);
        this.game.scene.add(points);

        let frames = 0;
        const animate = () => {
            frames++;
            if (frames > 45) {
                this.game.scene.remove(points);
                return;
            }

            const posArray = geo.attributes.position.array;
            for (let i = 0; i < count; i++) {
                posArray[i * 3] += velocities[i].x;
                posArray[i * 3 + 1] += velocities[i].y;
                posArray[i * 3 + 2] += velocities[i].z;
                velocities[i].z -= 0.3; // gravity
            }
            geo.attributes.position.needsUpdate = true;
            requestAnimationFrame(animate);
        };
        animate();
    }

    hitMailbox(seg, group, side) {
        this.dead = true;
        this.game.scene.remove(this.mesh);

        const hData = side === 'left' ? seg.leftHouse : seg.rightHouse;
        const isSubscriber = hData.type === 'subscriber';

        if (isSubscriber) {
            this.game.updateScore(250);

            // Visual feedback: Pop the indicator if it exists
            if (group.indicatorMesh) {
                const originalMat = group.indicatorMesh.material;
                const hitMat = new THREE.MeshStandardMaterial({
                    color: '#4caf50',
                    emissive: '#4caf50',
                    emissiveIntensity: 1
                });
                group.indicatorMesh.material = hitMat;
                group.indicatorMesh.scale.set(2.5, 2.5, 2.5);

                setTimeout(() => {
                    if (group.indicatorMesh) {
                        group.indicatorMesh.material = originalMat;
                        group.indicatorMesh.scale.set(1.5, 1.5, 1.5);
                    }
                }, 500);
            }
        } else {
            this.game.updateScore(50);
        }

        // Animated feedback: Flip/Rotate the flag
        if (group.flagMesh) {
            group.flagMesh.rotation.x = Math.PI / 2;
        }

        // Disable hit for this mailbox
        if (side === 'left') seg.leftMailboxMesh = null;
        else seg.rightMailboxMesh = null;

        // Impact Particles
        if (this.game.particles) {
            this.game.particles.spawn('impact', this.position.x, this.position.y, this.position.z, 15);
        }
    }
}
