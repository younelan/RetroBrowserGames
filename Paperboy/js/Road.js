import * as THREE from 'three';

export default class Road {
    constructor(game) {
        this.game = game;
        this.currentSegmentIndex = 0;
        this.routeLength = 40; // Default route length
        this.isTrainingCourse = false;

        this.segments = [];
        this.segmentPool = [];
        this.poolSize = 15;
        this.segmentLength = 300;
        this.roadWidth = 350;
        this.sidewalkWidth = 60;
        this.grassWidth = 1000;

        this.geometries = {
            road: new THREE.PlaneGeometry(this.roadWidth, this.segmentLength),
            sidewalk: new THREE.PlaneGeometry(this.sidewalkWidth, this.segmentLength),
            grass: new THREE.PlaneGeometry(this.grassWidth, this.segmentLength),
            driveway: new THREE.PlaneGeometry(80, 140),
            // House - Now a real 3D volume
            houseBody: new THREE.BoxGeometry(100, 130, 80),
            roofSide: new THREE.BoxGeometry(65, 140, 5),
            door: new THREE.BoxGeometry(20, 2, 40),
            garage: new THREE.BoxGeometry(70, 2, 60),
            window: new THREE.BoxGeometry(25, 2, 25),
            windowFrame: new THREE.BoxGeometry(28, 1, 28),
            siding: new THREE.BoxGeometry(105, 1, 2), // Thin strips for front facade
            // Car parts
            carBody: new THREE.BoxGeometry(45, 90, 15),
            carCabin: new THREE.BoxGeometry(40, 50, 15),
            carWheel: new THREE.CylinderGeometry(8, 8, 10, 8),
            carHeadlight: new THREE.BoxGeometry(12, 2, 8),
            carTaillight: new THREE.BoxGeometry(10, 2, 6),
            // Mailbox
            mailboxBody: new THREE.BoxGeometry(18, 22, 10),
            mailboxTop: new THREE.CylinderGeometry(9, 9, 22, 12, 1, false, 0, Math.PI),
            mailboxFlag: new THREE.BoxGeometry(2, 8, 4),
            pole: new THREE.CylinderGeometry(2, 2, 40),
            mailboxIndicator: new THREE.CylinderGeometry(3, 3, 2, 8),
            // Obstacles
            obstacle: new THREE.BoxGeometry(30, 30, 20),
            trashcan: new THREE.CylinderGeometry(14, 14, 30, 8),
            lid: new THREE.CylinderGeometry(16, 16, 4, 8),
            trashHandle: new THREE.BoxGeometry(2, 6, 2),
            puddle: new THREE.CircleGeometry(40, 8),
            paperStack: new THREE.BoxGeometry(25, 25, 2),
            // Environment
            treeTrunk: new THREE.BoxGeometry(10, 10, 80),
            treeLayer1: new THREE.BoxGeometry(60, 60, 30),
            treeLayer2: new THREE.BoxGeometry(45, 45, 25),
            treeLayer3: new THREE.BoxGeometry(30, 30, 20),
            bush: new THREE.SphereGeometry(15, 8, 8),
            flower: new THREE.SphereGeometry(3, 8, 8),
            fenceBar: new THREE.BoxGeometry(2, 300, 4),
            fencePost: new THREE.BoxGeometry(4, 4, 30),
            // Backyard
            poolRimLong: new THREE.BoxGeometry(160, 10, 6),
            poolRimShort: new THREE.BoxGeometry(10, 110, 6),
            poolWater: new THREE.PlaneGeometry(140, 90),
            poolLadder: new THREE.TorusGeometry(8, 1.5, 8, 12, Math.PI),
            bbqBody: new THREE.BoxGeometry(15, 20, 15),
            bbqStand: new THREE.CylinderGeometry(2, 2, 20),
            cloud: new THREE.SphereGeometry(30, 8, 8),
            grassTuft: new THREE.PlaneGeometry(8, 8),
            pebble: new THREE.SphereGeometry(3, 4, 4)
        };

        this.materials = {
            road: new THREE.MeshStandardMaterial({ color: '#2c3e50' }),
            sidewalk: new THREE.MeshStandardMaterial({ color: '#bdc3c7' }),
            grass: new THREE.MeshStandardMaterial({ color: '#2ecc71' }),
            driveway: new THREE.MeshStandardMaterial({ color: '#7f8c8d' }),
            subscriber: new THREE.MeshStandardMaterial({ color: '#f1c40f', emissive: '#f1c40f', emissiveIntensity: 0.6 }),
            mailbox: new THREE.MeshStandardMaterial({ color: '#95a5a6', metalness: 0.6, roughness: 0.3 }),
            mailboxPole: new THREE.MeshStandardMaterial({ color: '#7f8c8d' }),
            mailboxFlag: new THREE.MeshStandardMaterial({ color: '#c0392b' }),
            carCabin: new THREE.MeshStandardMaterial({ color: '#2c3e50', metalness: 0.8, roughness: 0.2 }),
            carWheel: new THREE.MeshStandardMaterial({ color: '#333333' }),
            carHeadlight: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.8 }),
            carTaillight: new THREE.MeshStandardMaterial({ color: '#c0392b', emissive: '#c0392b', emissiveIntensity: 0.5 }),
            door: new THREE.MeshStandardMaterial({ color: '#34495e' }),
            garage: new THREE.MeshStandardMaterial({ color: '#ecf0f1' }),
            window: new THREE.MeshStandardMaterial({ color: '#82ccdd', emissive: '#82ccdd', emissiveIntensity: 0.2 }),
            windowFrame: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
            roof: new THREE.MeshStandardMaterial({ color: '#34495e' }),
            trunk: new THREE.MeshStandardMaterial({ color: '#5d4037' }),
            leaves: new THREE.MeshStandardMaterial({ color: '#1b5e20' }),
            bush: new THREE.MeshStandardMaterial({ color: '#27ae60' }),
            flowerRed: new THREE.MeshStandardMaterial({ color: '#e74c3c' }),
            flowerYellow: new THREE.MeshStandardMaterial({ color: '#f1c40f' }),
            trashcan: new THREE.MeshStandardMaterial({ color: '#7f8c8d', metalness: 0.6, roughness: 0.4 }),
            puddle: new THREE.MeshStandardMaterial({ color: '#3498db', transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
            paper: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
            fence: new THREE.MeshStandardMaterial({ color: '#ecf0f1' }),
            poolRim: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
            poolWater: new THREE.MeshStandardMaterial({ color: '#00d2ff', transparent: true, opacity: 0.8, emissive: '#00d2ff', emissiveIntensity: 0.2 }),
            silver: new THREE.MeshStandardMaterial({ color: '#bdc3c7', metalness: 0.8, roughness: 0.2 }),
            bbq: new THREE.MeshStandardMaterial({ color: '#2c3e50' }),
            cloud: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, emissive: '#ffffff', emissiveIntensity: 0.2 }),
            detailGrass: new THREE.MeshStandardMaterial({ color: '#27ae60', side: THREE.DoubleSide, alphaTest: 0.5 })
        };

        this.init();
    }

    init() {
        // Initialize with some segments
        for (let i = 0; i < this.poolSize; i++) {
            const y = i * this.segmentLength;
            const data = this.createSegmentData(y);
            const mesh = this.createSegmentMesh(data);
            this.game.scene.add(mesh);
            this.segments.push({ y: y, mesh, ...data });
        }
    }

    update(dt, bikeY) {
        this.currentSegmentIndex = Math.floor(bikeY / this.segmentLength);

        // Remove segments that are far behind the bike
        while (this.segments.length > 0 && bikeY - this.segments[0].y > this.poolSize * this.segmentLength) {
            const oldSegment = this.segments.shift();
            this.game.scene.remove(oldSegment.mesh);
            // Optionally add to a pool for reuse
            this.segmentPool.push(oldSegment.mesh);
        }

        // Add new segments ahead of the bike
        if (this.segments.length === 0 || bikeY > this.segments[this.segments.length - 1].y - this.poolSize * this.segmentLength) {
            const nextY = this.segments.length > 0 ? this.segments[this.segments.length - 1].y + this.segmentLength : 0;

            // Only spawn up to routeLength
            if (nextY / this.segmentLength < this.routeLength) {
                const data = this.createSegmentData(nextY);
                let mesh;
                if (this.segmentPool.length > 0) {
                    mesh = this.segmentPool.pop();
                    // Reset mesh properties if reusing
                    mesh.clear(); // Clear children
                    this.createSegmentMesh(data, mesh); // Re-populate with new data
                } else {
                    mesh = this.createSegmentMesh(data);
                }
                mesh.position.y = nextY;
                this.game.scene.add(mesh);
                this.segments.push({ y: nextY, mesh, ...data });
            }
        }
    }

    getRandomHouseColor() {
        return [
            '#f5f5dc', '#e67e22', '#faf0e6', '#3498db', '#fdf5e6',
            '#2ecc71', '#f5fffa', '#e74c3c', '#f0ffff', '#9b59b6'
        ][Math.floor(Math.random() * 10)];
    }

    getRandomCarColor() {
        return [
            '#c0c0c0', '#3498db', '#2c3e50', '#c0392b', '#ffffff',
            '#111111', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad'
        ][Math.floor(Math.random() * 10)];
    }

    getRandomTreeType() {
        const types = ['round', 'pointy', 'tall'];
        return types[Math.floor(Math.random() * types.length)];
    }

    createSegmentData(y) {
        const index = Math.floor(y / this.segmentLength);
        const isEnd = index >= this.routeLength - 10; // Last 10 segments are training
        const isFinish = index === this.routeLength - 1;

        const data = {
            y: y,
            index: index,
            isTraining: isEnd,
            isFinish: isFinish,
            leftHouse: !isEnd ? {
                color: this.getRandomHouseColor(),
                hasSecondStory: Math.random() > 0.6,
                hasWing: Math.random() > 0.4,
                hasDormer: Math.random() > 0.3,
                hasChimney: Math.random() > 0.5,
                hasGarage: Math.random() > 0.5
            } : null,
            rightHouse: !isEnd ? {
                color: this.getRandomHouseColor(),
                hasSecondStory: Math.random() > 0.6,
                hasWing: Math.random() > 0.4,
                hasDormer: Math.random() > 0.3,
                hasChimney: Math.random() > 0.5,
                hasGarage: Math.random() > 0.5
            } : null,
            mailbox: !isEnd ? {
                side: Math.random() > 0.5 ? 1 : -1,
                isSubscriber: Math.random() > 0.3
            } : null,
            obstacle: (Math.random() > 0.7 && !isFinish) ? {
                type: Math.random() > 0.5 ? 'puddle' : 'papers',
                x: (Math.random() - 0.5) * 200
            } : null,
            car: (Math.random() > 0.6 && !isEnd) ? {
                side: Math.random() > 0.5 ? 1 : -1,
                color: this.getRandomCarColor()
            } : null,
            rhythm: index % 2 === 0 // Used for alternating trees/mailboxes
        };

        // Training Course specific obstacles
        if (isEnd && !isFinish) {
            data.trainingObstacle = {
                type: Math.random() > 0.5 ? 'ramp' : 'target',
                x: (Math.random() - 0.5) * 200
            };
        }

        return data;
    }

    createSegmentMesh(data) {
        const group = new THREE.Group();
        group.position.y = data.y;

        // Road
        const road = new THREE.Mesh(this.geometries.road, this.materials.road);
        road.receiveShadow = true;
        group.add(road);

        // Lines
        const lineGeo = new THREE.PlaneGeometry(5, 50);
        const lineMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
        for (let i = -1; i <= 1; i++) {
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.position.set(0, i * 100, 0.2);
            group.add(line);
        }

        // Add stuff to both sides
        if (data.leftHouse) this.addSideElements(group, data, -1);
        if (data.rightHouse) this.addSideElements(group, data, 1);

        // Finish Line
        if (data.isFinish) {
            const finishLineGeo = new THREE.PlaneGeometry(this.roadWidth, 100);
            const finishLineMat = new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide });
            // Simple checkered pattern simulation with two meshes
            const f1 = new THREE.Mesh(finishLineGeo, finishLineMat);
            f1.position.z = 0.5;
            group.add(f1);

            const txt = new THREE.Mesh(new THREE.PlaneGeometry(this.roadWidth, 40), new THREE.MeshStandardMaterial({ color: '#888' }));
            txt.position.z = 0.6;
            group.add(txt);
        }

        // Training Course Obstacles
        if (data.trainingObstacle) {
            const obs = data.trainingObstacle;
            if (obs.type === 'ramp') {
                const rampGeo = new THREE.BoxGeometry(60, 100, 30);
                const rampMat = new THREE.MeshStandardMaterial({ color: '#e67e22' });
                const ramp = new THREE.Mesh(rampGeo, rampMat);
                ramp.rotation.x = -0.3;
                ramp.position.set(obs.x, 0, 10);
                group.add(ramp);
                data.obstacleMesh = ramp;
            } else if (obs.type === 'target') {
                const targetGroup = new THREE.Group();
                const sign = new THREE.Mesh(new THREE.BoxGeometry(40, 5, 40), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
                sign.position.z = 50;
                targetGroup.add(sign);
                const post = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 60), this.materials.trunk);
                post.position.z = 30;
                targetGroup.add(post);
                targetGroup.position.set(obs.x, 0, 0);
                group.add(targetGroup);
                data.obstacleMesh = targetGroup;
            }
        }

        // Trees on the far grass
        for (let side of [-1, 1]) {
            const hData = side === -1 ? data.leftHouse : data.rightHouse;
            if (hData && Math.random() > 0.4) {
                const tree = this.createTreeMesh(hData.treeType || 'round');
                tree.position.x = (this.roadWidth / 2 + this.sidewalkWidth + 400 + Math.random() * 200) * side;
                tree.position.y = (Math.random() - 0.5) * 200;
                group.add(tree);
            }
        }

        // Backyard & Fences
        for (let side of [-1, 1]) {
            const hData = side === -1 ? data.leftHouse : data.rightHouse;
            if (!hData) continue; // Skip for training segments

            const houseX = (this.roadWidth / 2 + this.sidewalkWidth + 120) * side;

            // Fence along the side property
            if (hData.hasFence) {
                const fGroup = new THREE.Group();
                for (let i = -1; i <= 1; i++) {
                    const post = new THREE.Mesh(this.geometries.fencePost, this.materials.fence);
                    post.position.set(0, i * 150, 15);
                    fGroup.add(post);
                }
                const barTop = new THREE.Mesh(this.geometries.fenceBar, this.materials.fence);
                barTop.position.set(0, 0, 25);
                fGroup.add(barTop);
                const barBot = new THREE.Mesh(this.geometries.fenceBar, this.materials.fence);
                barBot.position.set(0, 0, 10);
                fGroup.add(barBot);

                fGroup.position.x = houseX + 100 * side;
                group.add(fGroup);
            }

            // Backyard items
            const backX = houseX + 250 * side;
            if (hData.hasPool) {
                const poolGroup = new THREE.Group();
                poolGroup.position.set(backX, 0, 0);

                // Rim (4 Pieces)
                const r1 = new THREE.Mesh(this.geometries.poolRimLong, this.materials.poolRim);
                r1.position.set(0, 50, 3);
                poolGroup.add(r1);
                const r2 = new THREE.Mesh(this.geometries.poolRimLong, this.materials.poolRim);
                r2.position.set(0, -50, 3);
                poolGroup.add(r2);
                const r3 = new THREE.Mesh(this.geometries.poolRimShort, this.materials.poolRim);
                r3.position.set(75, 0, 3);
                poolGroup.add(r3);
                const r4 = new THREE.Mesh(this.geometries.poolRimShort, this.materials.poolRim);
                r4.position.set(-75, 0, 3);
                poolGroup.add(r4);

                // Water (Recessed and slightly above ground)
                const water = new THREE.Mesh(this.geometries.poolWater, this.materials.poolWater);
                water.position.z = 2; // Slightly above ground but below rim top (3+3=6)
                poolGroup.add(water);

                // Ladder Handles
                const l1 = new THREE.Mesh(this.geometries.poolLadder, this.materials.silver);
                l1.position.set(-60, 40, 5);
                l1.rotation.y = Math.PI / 2;
                poolGroup.add(l1);

                const l2 = new THREE.Mesh(this.geometries.poolLadder, this.materials.silver);
                l2.position.set(-60, 25, 5);
                l2.rotation.y = Math.PI / 2;
                poolGroup.add(l2);

                group.add(poolGroup);
            }
            if (hData.hasBBQ) {
                const bbq = new THREE.Group();
                const stand = new THREE.Mesh(this.geometries.bbqStand, this.materials.bbq);
                stand.position.z = 10;
                stand.rotation.x = Math.PI / 2;
                bbq.add(stand);
                const body = new THREE.Mesh(this.geometries.bbqBody, this.materials.bbq);
                body.position.z = 25;
                bbq.add(body);
                bbq.position.set(backX + 40 * side, 50, 0);
                group.add(bbq);
            }
        }

        // Obstacle
        if (data.obstacle) {
            if (data.obstacle.type === 'trashcan') {
                const canGroup = new THREE.Group();
                const body = new THREE.Mesh(this.geometries.trashcan, this.materials.trashcan);
                body.rotation.x = Math.PI / 2;
                body.position.z = 15;
                canGroup.add(body);
                const lid = new THREE.Mesh(this.geometries.lid, this.materials.trashcan);
                lid.rotation.x = Math.PI / 2;
                lid.position.z = 32;
                canGroup.add(lid);

                const h1 = new THREE.Mesh(this.geometries.trashHandle, this.materials.trashcan);
                h1.position.set(-15, 0, 20);
                canGroup.add(h1);
                const h2 = new THREE.Mesh(this.geometries.trashHandle, this.materials.trashcan);
                h2.position.set(15, 0, 20);
                canGroup.add(h2);

                canGroup.position.set(data.obstacle.x, 0, 0);
                group.add(canGroup);
                data.obstacleMesh = canGroup;
            } else if (data.obstacle.type === 'puddle') {
                const puddle = new THREE.Mesh(this.geometries.puddle, this.materials.puddle);
                puddle.position.set(data.obstacle.x, 0, 0.5);
                puddle.rotation.z = Math.random() * Math.PI;
                group.add(puddle);
                data.obstacleMesh = puddle;
            } else {
                const pGroup = new THREE.Group();
                for (let i = 0; i < 3; i++) {
                    const paper = new THREE.Mesh(this.geometries.paperStack, this.materials.paper);
                    paper.position.set(0, 0, i * 2 + 1);
                    paper.rotation.z = i * 0.2;
                    pGroup.add(paper);
                }
                pGroup.position.set(data.obstacle.x, 0, 0);
                group.add(pGroup);
                data.obstacleMesh = pGroup;
            }
        }

        // --- CLOUDS ---
        data.clouds = [];
        if (Math.random() > 0.4) {
            const cloud = this.createCloudMesh();
            cloud.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 200, 800 + Math.random() * 400);
            group.add(cloud);
            data.clouds.push(cloud);
        }

        return group;
    }

    addSideElements(group, data, side) {
        const xOffset = (this.roadWidth / 2 + this.sidewalkWidth / 2) * side;

        // Sidewalk
        const sw = new THREE.Mesh(this.geometries.sidewalk, this.materials.sidewalk);
        sw.position.x = xOffset;
        sw.receiveShadow = true;
        group.add(sw);

        // Grass
        const grass = new THREE.Mesh(this.geometries.grass, this.materials.grass);
        grass.position.x = (this.roadWidth / 2 + this.sidewalkWidth + this.grassWidth / 2) * side;
        grass.receiveShadow = true;
        group.add(grass);

        // Driveway
        const driveway = new THREE.Mesh(this.geometries.driveway, this.materials.driveway);
        driveway.position.set(xOffset + (this.sidewalkWidth / 2 + 40) * side, 0, 0.5); // Increased from 0.1
        driveway.receiveShadow = true;
        group.add(driveway);

        // House
        const hData = side === -1 ? data.leftHouse : data.rightHouse;
        const houseGroup = this.createHouseMesh(hData, side);
        houseGroup.position.x = (this.roadWidth / 2 + this.sidewalkWidth + 120) * side;
        group.add(houseGroup);

        // Mailbox assembly - Only if rhythm is true (Alternation)
        const mailX = (this.roadWidth / 2 + 15) * side;
        if (data.rhythm) {
            const mGroup = new THREE.Group();
            mGroup.position.set(mailX, 0, 20);

            // Pole
            const pole = new THREE.Mesh(this.geometries.pole, this.materials.mailboxPole);
            pole.rotation.x = Math.PI / 2;
            mGroup.add(pole);

            // Mailbox Body
            const mBodyGroup = new THREE.Group();
            mBodyGroup.position.z = 25;

            const base = new THREE.Mesh(this.geometries.mailboxBody, this.materials.mailbox);
            base.castShadow = true;
            mBodyGroup.add(base);

            const top = new THREE.Mesh(this.geometries.mailboxTop, this.materials.mailbox);
            top.rotation.x = Math.PI / 2;
            top.rotation.y = Math.PI / 2;
            top.position.z = 5;
            mBodyGroup.add(top);

            const flag = new THREE.Mesh(this.geometries.mailboxFlag, this.materials.mailboxFlag);
            flag.position.set(10 * side, 5, 5);
            mBodyGroup.add(flag);
            mBodyGroup.flagMesh = flag;

            // Subscriber Indicator
            if (hData.type === 'subscriber') {
                const indicator = new THREE.Mesh(this.geometries.mailboxIndicator, this.materials.subscriber);
                indicator.position.set(0, 5, 12);
                indicator.rotation.x = Math.PI / 2;
                indicator.scale.set(1.5, 1.5, 1.5);
                mBodyGroup.add(indicator);
                mBodyGroup.indicatorMesh = indicator;
            }

            mGroup.add(mBodyGroup);
            group.add(mGroup);

            if (side === -1) data.leftMailboxMesh = mBodyGroup;
            else data.rightMailboxMesh = mBodyGroup;
        } else {
            // Place a tree instead of a mailbox for alternation
            const tree = this.createTreeMesh(hData.treeType);
            tree.position.set(mailX, 0, 0);
            group.add(tree);
        }

        // Car
        if (data.hasCar && data.carSide === side) {
            const carGroup = new THREE.Group();
            const carMat = new THREE.MeshStandardMaterial({ color: data.carColor });

            // Body
            const body = new THREE.Mesh(this.geometries.carBody, carMat);
            body.position.z = 15;
            body.castShadow = true;
            carGroup.add(body);

            // Cabin
            const cabin = new THREE.Mesh(this.geometries.carCabin, this.materials.carCabin);
            cabin.position.set(0, -5, 30);
            carGroup.add(cabin);

            // Wheels
            const wheelX = 22;
            const wheelZ = 8;
            const wheelY = 30;
            const wheelPos = [
                { x: -wheelX, y: -wheelY }, { x: wheelX, y: -wheelY },
                { x: -wheelX, y: wheelY }, { x: wheelX, y: wheelY }
            ];
            wheelPos.forEach(p => {
                const wheel = new THREE.Mesh(this.geometries.carWheel, this.materials.carWheel);
                wheel.position.set(p.x, p.y, wheelZ);
                wheel.rotation.z = Math.PI / 2;
                carGroup.add(wheel);
            });

            // Headlights
            const h1 = new THREE.Mesh(this.geometries.carHeadlight, this.materials.carHeadlight);
            h1.position.set(-15, 46, 15);
            carGroup.add(h1);
            const h2 = new THREE.Mesh(this.geometries.carHeadlight, this.materials.carHeadlight);
            h2.position.set(15, 46, 15);
            carGroup.add(h2);

            // Taillights (Distinct dots instead of bar)
            const t1 = new THREE.Mesh(this.geometries.carTaillight, this.materials.carTaillight);
            t1.position.set(-15, -46, 15);
            carGroup.add(t1);
            const t2 = new THREE.Mesh(this.geometries.carTaillight, this.materials.carTaillight);
            t2.position.set(15, -46, 15);
            carGroup.add(t2);

            carGroup.position.set(xOffset, 50, 0);
            group.add(carGroup);

            if (side === -1) data.leftCarMesh = carGroup;
            else data.rightCarMesh = carGroup;
        }
    }

    createTreeMesh(type) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(this.geometries.treeTrunk, this.materials.trunk);
        trunk.position.z = 40;
        trunk.scale.set(0.8, 0.8, 0.8);
        tree.add(trunk);

        let layers = [];
        if (type === 'pointy') {
            layers = [
                { geo: new THREE.ConeGeometry(30, 80, 4), z: 80 },
                { geo: new THREE.ConeGeometry(20, 60, 4), z: 110 }
            ];
        } else if (type === 'tall') {
            layers = [
                { geo: new THREE.BoxGeometry(30, 30, 100), z: 90 }
            ];
        } else {
            // Round
            layers = [
                { geo: this.geometries.treeLayer1, z: 70 },
                { geo: this.geometries.treeLayer2, z: 95 }
            ];
        }

        layers.forEach(l => {
            const leaf = new THREE.Mesh(l.geo, this.materials.leaves);
            leaf.position.z = l.z;
            if (type === 'pointy') leaf.rotation.x = Math.PI / 2;
            leaf.castShadow = true;
            tree.add(leaf);
        });

        return tree;
    }

    createHouseMesh(data, side) {
        const group = new THREE.Group();
        const houseMat = new THREE.MeshStandardMaterial({ color: data.color });
        const roofMat = this.materials.roof;

        // --- BASE ARCHITECTURE ---
        const bodyWidth = 100;
        const bodyDepth = 150;
        const floorHeight = data.hasSecondStory ? 130 : 80;
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyDepth, floorHeight), houseMat);
        mainBody.position.z = floorHeight / 2;
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        group.add(mainBody);

        // --- ATTIC / TOP FLOOR (A-Frame) ---
        const atticHeight = 40;
        const atticShape = new THREE.Shape();
        atticShape.moveTo(-bodyWidth / 2, 0);
        atticShape.lineTo(bodyWidth / 2, 0);
        atticShape.lineTo(0, atticHeight);
        atticShape.lineTo(-bodyWidth / 2, 0);

        const atticGeo = new THREE.ExtrudeGeometry(atticShape, {
            depth: bodyDepth,
            bevelEnabled: false
        });
        const attic = new THREE.Mesh(atticGeo, houseMat);
        attic.rotation.x = Math.PI / 2;
        attic.position.set(0, -bodyDepth / 2, floorHeight);
        group.add(attic);

        // --- THE WING / ARCHITECTURAL BREAK ---
        if (data.hasWing) {
            const wingDepth = 80;
            const wingWidth = 70;
            const wingH = floorHeight * 0.9;
            const wing = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, wingDepth, wingH), houseMat);
            wing.position.set(35 * side, bodyDepth / 2 - 30, wingH / 2);
            group.add(wing);

            // Wing A-Frame Attic
            const wAtticH = 15;
            const wAtticShape = new THREE.Shape();
            wAtticShape.moveTo(-wingWidth / 2, 0);
            wAtticShape.lineTo(wingWidth / 2, 0);
            wAtticShape.lineTo(0, wAtticH);
            wAtticShape.lineTo(-wingWidth / 2, 0);

            const wAtticGeo = new THREE.ExtrudeGeometry(wAtticShape, {
                depth: wingDepth,
                bevelEnabled: false
            });
            const wAttic = new THREE.Mesh(wAtticGeo, houseMat);
            wAttic.rotation.x = Math.PI / 2;
            wAttic.position.set(35 * side, bodyDepth / 2 - 30 - wingDepth / 2, wingH);
            group.add(wAttic);

            // Wing Roof Boards
            const wrB = new THREE.BoxGeometry(wingWidth * 0.8, wingDepth + 10, 5);
            const wl = new THREE.Mesh(wrB, roofMat);
            wl.position.set(35 * side - 20, bodyDepth / 2 - 30, wingH + 10);
            wl.rotation.y = -Math.PI / 6;
            group.add(wl);
            const wr = new THREE.Mesh(wrB, roofMat);
            wr.position.set(35 * side + 20, bodyDepth / 2 - 30, wingH + 10);
            wr.rotation.y = Math.PI / 6;
            group.add(wr);
        }

        // --- MAIN ROOF BOARDS ---
        const peakZ = floorHeight + atticHeight;
        const boardWidth = bodyWidth * 0.75;
        const boardGeo = new THREE.BoxGeometry(boardWidth, bodyDepth + 40, 5);

        const leftBoard = new THREE.Mesh(boardGeo, roofMat);
        leftBoard.position.set(-30, 0, peakZ - 20);
        leftBoard.rotation.y = -Math.PI / 5.2;
        group.add(leftBoard);

        const rightBoard = new THREE.Mesh(boardGeo, roofMat);
        rightBoard.position.set(30, 0, peakZ - 20);
        rightBoard.rotation.y = Math.PI / 5.2;
        group.add(rightBoard);

        // --- DORMERS (Roof Windows) ---
        if (data.hasDormer) {
            const dX = 35 * side;
            const dY = 0;
            const dZ = peakZ - 5;
            const dWidth = 30;
            const dDepth = 40;
            const dGableHeight = 12;

            const dBody = new THREE.Mesh(new THREE.BoxGeometry(dWidth, dDepth, 30), houseMat);
            dBody.position.set(dX, dY, dZ);
            group.add(dBody);

            // Dormer Gables
            const dgShape = new THREE.Shape();
            dgShape.moveTo(-dWidth / 2, 0);
            dgShape.lineTo(dWidth / 2, 0);
            dgShape.lineTo(0, dGableHeight);
            dgShape.lineTo(-dWidth / 2, 0);
            const dgGeo = new THREE.ShapeGeometry(dgShape);

            const dgFront = new THREE.Mesh(dgGeo, houseMat);
            dgFront.position.set(dX, dY - dDepth / 2, dZ + 15);
            dgFront.rotation.x = Math.PI / 2;
            group.add(dgFront);

            const dgBack = new THREE.Mesh(dgGeo, houseMat);
            dgBack.position.set(dX, dY + dDepth / 2, dZ + 15);
            dgBack.rotation.x = Math.PI / 2;
            group.add(dgBack);

            // Dormer Roof boards (Two boards for V shape)
            const drB = new THREE.BoxGeometry(22, dDepth + 10, 3);
            const drL = new THREE.Mesh(drB, roofMat);
            drL.position.set(dX - 9, dY, dZ + 15 + dGableHeight / 2);
            drL.rotation.y = -Math.PI / 4;
            group.add(drL);
            const drR = new THREE.Mesh(drB, roofMat);
            drR.position.set(dX + 9, dY, dZ + 15 + dGableHeight / 2);
            drR.rotation.y = Math.PI / 4;
            group.add(drR);

            const dWin = new THREE.Mesh(new THREE.BoxGeometry(5, 20, 15), this.materials.window);
            dWin.position.set(dX + 15 * -side, dY, dZ + 5);
            group.add(dWin);
        }

        // Chimney
        if (data.hasChimney) {
            const chimney = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 70), new THREE.MeshStandardMaterial({ color: '#5d4037' }));
            chimney.position.set(-35 * side, 50, peakZ + 10);
            group.add(chimney);
        }

        // --- FRONT FACADE DETAILS ---
        const frontWallRelX = (bodyWidth / 2) * -side;
        const roadDir = -side;

        // More Detailed Siding (Using actual geometry strips)
        for (let i = 1; i < (bodyHeight / 10); i++) {
            const strip = new THREE.Mesh(new THREE.BoxGeometry(bodyDepth, 2, 2), houseMat);
            strip.position.set(frontWallRelX + 1 * roadDir, 0, i * 12);
            strip.rotation.z = Math.PI / 2;
            group.add(strip);
        }

        // Entry Porch
        const entryX = frontWallRelX + 15 * roadDir;
        const entryY = -30;
        const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(30, 60, 5), this.materials.sidewalk);
        porchFloor.position.set(entryX, entryY, 2.5);
        group.add(porchFloor);

        const porchPost = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 50), this.materials.windowFrame);
        porchPost.position.set(entryX + 12 * roadDir, entryY + 25, 25);
        group.add(porchPost);

        const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(40, 70, 4), roofMat);
        porchRoof.position.set(entryX + 5 * roadDir, entryY, 55);
        porchRoof.rotation.y = 0.3 * -roadDir;
        group.add(porchRoof);

        // Door
        const door = new THREE.Mesh(new THREE.BoxGeometry(4, 35, 55), this.materials.door);
        door.position.set(frontWallRelX + 1 * roadDir, entryY, 27.5);
        group.add(door);

        // Window Layout
        const wins = [];
        if (data.hasSecondStory) {
            wins.push({ y: -30, z: 95, s: 30 }); // Upper door
            wins.push({ y: 40, z: 95, s: 30 });  // Upper garage
        }
        wins.push({ y: 40, z: 30, s: 40 }); // Ground garage side
        wins.push({ y: -70, z: 30, s: 35 }); // Far ground

        wins.forEach(pos => {
            const wX = frontWallRelX + 1 * roadDir;
            const winG = new THREE.Group();
            winG.position.set(wX, pos.y, pos.z);

            // Shutter
            const sB = new THREE.BoxGeometry(2, pos.s / 3, pos.s + 10);
            const sl = new THREE.Mesh(sB, new THREE.MeshStandardMaterial({ color: '#2c3e50' }));
            sl.position.y = -pos.s / 2 - 6;
            winG.add(sl);
            const sr = new THREE.Mesh(sB, new THREE.MeshStandardMaterial({ color: '#2c3e50' }));
            sr.position.y = pos.s / 2 + 6;
            winG.add(sr);

            // Frame & Panes
            const fr = new THREE.Mesh(new THREE.BoxGeometry(4, pos.s + 4, pos.s + 4), this.materials.windowFrame);
            winG.add(fr);
            const bX = new THREE.Mesh(new THREE.BoxGeometry(5, pos.s, 2), this.materials.windowFrame);
            winG.add(bX);
            const bY = new THREE.Mesh(new THREE.BoxGeometry(5, 2, pos.s), this.materials.windowFrame);
            winG.add(bY);

            const glass = new THREE.Mesh(new THREE.BoxGeometry(3, pos.s, pos.s), this.materials.window);
            glass.position.x = 0.5 * roadDir;
            winG.add(glass);
            group.add(winG);
        });

        // Garage
        if (data.hasGarage) {
            const gx = frontWallRelX + 1 * roadDir;
            const garage = new THREE.Mesh(new THREE.BoxGeometry(4, 90, 65), this.materials.garage);
            garage.position.set(gx, 45, 32.5);
            group.add(garage);

            const arch = new THREE.Mesh(new THREE.BoxGeometry(6, 100, 6), this.materials.windowFrame);
            arch.position.set(gx, 45, 68);
            group.add(arch);
        }

        // Landscaping
        const b1 = new THREE.Mesh(this.geometries.bush, this.materials.leaves);
        b1.position.set(frontWallRelX + 40 * roadDir, -80, 10);
        group.add(b1);
        const b2 = new THREE.Mesh(this.geometries.bush, this.materials.leaves);
        b2.position.set(frontWallRelX + 40 * roadDir, 80, 10);
        group.add(b2);

        for (let i = 0; i < 15; i++) {
            const flower = new THREE.Mesh(this.geometries.flower, Math.random() > 0.5 ? this.materials.flowerRed : this.materials.flowerYellow);
            flower.position.set(frontWallRelX + (25 + Math.random() * 50) * roadDir, -bodyDepth / 2 + Math.random() * bodyDepth, 3);
            group.add(flower);
        }

        return group;
    }

    update(dt, bikeY) {
        if (this.segments.length === 0) return;

        // Animate Clouds
        this.segments.forEach(seg => {
            if (seg.clouds) {
                seg.clouds.forEach(c => {
                    c.position.x += 20 * dt; // Slow drift
                    if (c.position.x > 3000) c.position.x = -3000;
                });
            }
        });

        const firstSegment = this.segments[0];
        if (bikeY - firstSegment.y > this.segmentLength * 5) {
            const oldSeg = this.segments.shift();
            this.game.scene.remove(oldSeg.mesh);
            const lastSegment = this.segments[this.segments.length - 1];
            this.addSegment(lastSegment.y + this.segmentLength);
        }
    }

    reset() {
        this.segments.forEach(seg => {
            this.game.scene.remove(seg.mesh);
        });
        this.segments = [];
        this.init();
    }

    createCloudMesh() {
        const group = new THREE.Group();
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const part = new THREE.Mesh(this.geometries.cloud, this.materials.cloud);
            part.position.set(Math.random() * 60 - 30, Math.random() * 30 - 15, Math.random() * 15 - 7);
            const s = 0.6 + Math.random() * 0.8;
            part.scale.set(s, s * 0.6, s);
            group.add(part);
        }
        return group;
    }
}
