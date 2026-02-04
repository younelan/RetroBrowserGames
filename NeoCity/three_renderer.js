// three_renderer.js
import * as THREE from 'https://esm.sh/three@0.154.0';
import { OrbitControls } from 'https://esm.sh/three@0.154.0/examples/jsm/controls/OrbitControls.js';

export function initThree(game) {
    const parent = game.canvas;
    let glCanvas = parent.querySelector('#three-canvas');
    if (!glCanvas) {
        glCanvas = document.createElement('canvas');
        glCanvas.id = 'three-canvas';
        glCanvas.style.position = 'absolute';
        glCanvas.style.top = '0';
        glCanvas.style.left = '0';
        glCanvas.style.width = '100%';
        glCanvas.style.height = '100%';
        glCanvas.style.zIndex = '5';
        glCanvas.style.pointerEvents = 'auto'; // Enable interactions for OrbitControls + Raycasting
        parent.appendChild(glCanvas);
    }

    const w = glCanvas.clientWidth;
    const h = glCanvas.clientHeight;
    const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true });
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);

    // Enable shadows for depth
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    // Dark background for contrast with white text, or match CSS theme
    scene.background = new THREE.Color(0x111827); // Dark gray/navy (Tailwind gray-900ish)

    // Isometric Camera Setup
    const aspect = w / h;
    const viewSize = game.gridSize * 1.8;
    const camera = new THREE.OrthographicCamera(
        -viewSize * aspect / 2, viewSize * aspect / 2,
        viewSize / 2, -viewSize / 2,
        -500, 1000
    );

    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(100, 200, 50);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    dir.shadow.camera.left = -50;
    dir.shadow.camera.right = 50;
    dir.shadow.camera.top = 50;
    dir.shadow.camera.bottom = -50;
    scene.add(dir);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minZoom = 0.5;
    controls.maxZoom = 4.0;

    // Groups
    const terrainGroup = new THREE.Group();
    const cityGroup = new THREE.Group();
    const uiGroup = new THREE.Group(); // For highlighter/ghosts
    scene.add(terrainGroup);
    scene.add(cityGroup);
    scene.add(uiGroup);

    // Selection Highlighter
    const highGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const highMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const highlighter = new THREE.Mesh(highGeo, highMat);
    highlighter.visible = false;
    uiGroup.add(highlighter);

    // Bulldozer Cursor Model
    const dozerGroup = new THREE.Group();
    // Yellow body
    const dozerBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.5 })
    );
    dozerBody.position.y = 0.2;
    dozerGroup.add(dozerBody);
    // Blade
    const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    blade.position.set(0.3, 0.15, 0);
    dozerGroup.add(blade);
    // Tracks
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const trackL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), trackMat);
    trackL.position.set(0, 0.05, 0.2);
    dozerGroup.add(trackL);
    const trackR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), trackMat);
    trackR.position.set(0, 0.05, -0.2);
    dozerGroup.add(trackR);

    dozerGroup.visible = false;
    uiGroup.add(dozerGroup);

    // Initial Terrain Mesh setup
    const size = game.gridSize;
    const count = size * size;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, 0.5, 0);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const terrainMesh = new THREE.InstancedMesh(geometry, material, count);
    terrainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    terrainMesh.receiveShadow = true;
    terrainGroup.add(terrainMesh);

    const raycaster = new THREE.Raycaster();

    // Store references
    game._three = {
        renderer,
        scene,
        camera,
        controls,
        terrainGroup,
        cityGroup,
        uiGroup,
        highlighter,
        dozerModel: dozerGroup,
        canvas: glCanvas,
        raycaster,
        terrainMesh: terrainMesh
    };

    // Initial Terrain Build
    rebuildTerrain(game);

    // Initial City Build
    rebuildCity(game);

    // Resize Handler
    window.addEventListener('resize', () => {
        const w2 = glCanvas.clientWidth;
        const h2 = glCanvas.clientHeight;
        renderer.setSize(w2, h2, false);
        const aspect2 = w2 / h2;
        camera.left = -viewSize * aspect2 / 2;
        camera.right = viewSize * aspect2 / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
        camera.updateProjectionMatrix();
    });
}

export function getVisualHeight(cell) {
    if (!cell) return 1.0;
    let h = 1.0;
    if (cell.terrain === 'water') h = 0.8;
    else if (cell.terrain === 'grass') {
        if (cell.elevation > 0) h += cell.elevation * 0.2;
    } else if (cell.terrain === 'hill') {
        h = 1.5 + cell.elevation * 0.2;
    } else if (cell.terrain === 'mountain') {
        h = 2.0 + cell.elevation * 0.3;
    }
    return h;
}

export function getGridFromScreen(game, clientX, clientY, anchorHeight = null) {
    if (!game._three || !game._three.terrainMesh) return null;
    const { camera, raycaster, canvas, terrainMesh } = game._three;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX / rect.width) * 2 - 1;
    const y = -(clientY / rect.height) * 2 + 1;

    raycaster.setFromCamera({ x, y }, camera);

    if (anchorHeight !== null) {
        // Raycast against a virtual horizontal plane at anchorHeight
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -anchorHeight);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
            const half = game.gridSize / 2;
            let gx = Math.floor(intersectPoint.x + half);
            let gy = Math.floor(intersectPoint.z + half);
            gx = Math.max(0, Math.min(game.gridSize - 1, gx));
            gy = Math.max(0, Math.min(game.gridSize - 1, gy));
            return { x: gx, y: gy };
        }
        return null;
    }

    const intersects = raycaster.intersectObject(terrainMesh);
    if (intersects.length > 0) {
        const i = intersects[0];
        const half = game.gridSize / 2;
        let gx = Math.floor(i.point.x + half);
        let gy = Math.floor(i.point.z + half);
        gx = Math.max(0, Math.min(game.gridSize - 1, gx));
        gy = Math.max(0, Math.min(game.gridSize - 1, gy));
        return { x: gx, y: gy };
    }
    return null;
}

export function updateHighlighter(game, gridX, gridY) {
    if (!game._three || !game._three.highlighter) return;
    const { highlighter, dozerModel } = game._three;

    if (gridX >= 0 && gridY >= 0) {
        highlighter.visible = true;
        const half = game.gridSize / 2;
        const px = gridX - half + 0.5;
        const pz = gridY - half + 0.5;

        const cell = game.grid[gridY] ? game.grid[gridY][gridX] : null;
        if (!cell) {
            highlighter.visible = false;
            if (dozerModel) dozerModel.visible = false;
            return;
        }

        const terrainH = getVisualHeight(cell);

        highlighter.position.set(px, 0, pz);
        highlighter.scale.set(1, terrainH, 1);
        highlighter.position.y = terrainH / 2;

        // Visual feedback for Bulldozer
        if (game.selectedTool === 'bulldozer') {
            highlighter.material.color.setHex(0xef4444); // Red
            if (dozerModel) {
                dozerModel.visible = true;
                dozerModel.position.set(px, terrainH, pz);
            }
        } else {
            highlighter.material.color.setHex(0xffffff); // White
            if (dozerModel) dozerModel.visible = false;
        }
    } else {
        highlighter.visible = false;
        if (dozerModel) dozerModel.visible = false;
    }
}

function rebuildTerrain(game) {
    const { terrainMesh } = game._three;
    if (!terrainMesh) return;

    const size = game.gridSize;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const half = size / 2;

    let idx = 0;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = game.grid[y][x];
            const px = x - half + 0.5;
            const pz = y - half + 0.5;

            let h = 1;
            let py = 0;

            if (cell.terrain === 'water') {
                h = 0.8;
                py = -0.2;
                color.setHex(0x3b82f6);
            } else if (cell.terrain === 'beach') {
                h = 1.0;
                py = 0;
                color.setHex(0xfde68a);
            } else if (cell.terrain === 'grass') {
                h = 1.0;
                py = 0;
                color.setHex(0x4ade80);
                if (cell.elevation > 0) h += cell.elevation * 0.2;
            } else if (cell.terrain === 'hill') {
                h = 1.5 + cell.elevation * 0.2;
                color.setHex(0x84cc16);
            } else { // mountain
                h = 2.0 + cell.elevation * 0.3;
                color.setHex(0x9ca3af);
            }

            dummy.position.set(px, py, pz);
            dummy.scale.set(1, h, 1);
            dummy.updateMatrix();

            terrainMesh.setMatrixAt(idx, dummy.matrix);
            terrainMesh.setColorAt(idx, color);
            idx++;
        }
    }

    terrainMesh.instanceMatrix.needsUpdate = true;
    if (terrainMesh.instanceColor) terrainMesh.instanceColor.needsUpdate = true;
    terrainMesh.computeBoundingSphere();
}

function createBuildingGeometry(type, level, colorHex) {
    const group = new THREE.Group();
    const width = type === 'commercial' ? 0.9 : 0.8;
    const depth = width;
    const height = 0.6 + (level || 1) * 0.4;

    // Foundation / Base
    const baseH = 0.05;
    const baseGeo = new THREE.BoxGeometry(width + 0.05, baseH, depth + 0.05);
    baseGeo.translate(0, baseH / 2, 0);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.2, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Main Body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    bodyGeo.translate(0, height / 2 + baseH, 0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.1, roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Windows Detail
    const winColor = 0xe0f2fe;
    const winMat = new THREE.MeshStandardMaterial({
        color: winColor,
        emissive: winColor,
        emissiveIntensity: 0.2,
        metalness: 0.9,
        roughness: 0.1
    });

    const winSize = 0.1;
    const winGap = 0.20;
    const winRows = Math.floor((height - 0.2) / winGap);
    const winCols = Math.floor((width - 0.1) / winGap);

    for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
            const wy = baseH + 0.25 + r * winGap;
            const wx = -width / 2 + 0.2 + c * winGap;

            // Front face windows
            const frontWin = new THREE.BoxGeometry(winSize, winSize, 0.02);
            frontWin.translate(wx, wy, depth / 2 + 0.01);
            group.add(new THREE.Mesh(frontWin, winMat));

            // Side face windows
            const sideWin = new THREE.BoxGeometry(0.02, winSize, winSize);
            sideWin.translate(width / 2 + 0.01, wy, wx);
            group.add(new THREE.Mesh(sideWin, winMat));
        }
    }

    // Door
    const doorGeo = new THREE.BoxGeometry(0.2, 0.3, 0.02);
    doorGeo.translate(0, baseH + 0.15, depth / 2 + 0.01);
    group.add(new THREE.Mesh(doorGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b })));

    // Type-specific details
    if (type === 'residential') {
        const roofH = 0.4;
        const roofGeo = new THREE.ConeGeometry(width * 0.9, roofH, 4);
        roofGeo.rotateY(Math.PI / 4);
        roofGeo.translate(0, height + baseH + roofH / 2, 0);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
        group.add(new THREE.Mesh(roofGeo, roofMat));

        // Solar panel or skylight
        if (Math.random() > 0.5) {
            const solarGeo = new THREE.BoxGeometry(0.3, 0.02, 0.3);
            const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, emissive: 0x1e3a8a, emissiveIntensity: 0.1 });
            const solar = new THREE.Mesh(solarGeo, solarMat);
            solar.position.set(0.15, height + baseH + 0.2, 0);
            solar.rotation.x = -Math.PI / 6;
            group.add(solar);
        }
    }
    else if (type === 'commercial') {
        const topGeo = new THREE.BoxGeometry(width * 0.7, 0.1, depth * 0.7);
        topGeo.translate(0, height + baseH + 0.05, 0);
        group.add(new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 })));

        const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.5);
        antGeo.translate(width * 0.3, height + baseH + 0.25, width * 0.3);
        group.add(new THREE.Mesh(antGeo, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })));

        if (Math.random() > 0.3) {
            const ant2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.3),
                new THREE.MeshStandardMaterial({ color: 0x334155 })
            );
            ant2.position.set(-width * 0.2, height + baseH + 0.15, -depth * 0.2);
            group.add(ant2);
        }
    }
    else if (type === 'industrial') {
        const stackGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8);
        stackGeo.translate(width * 0.2, height + baseH + 0.4, depth * 0.2);
        group.add(new THREE.Mesh(stackGeo, new THREE.MeshStandardMaterial({ color: 0x475569 })));

        const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6);
        pipeGeo.rotateZ(Math.PI / 2);
        pipeGeo.translate(0, height + baseH + 0.1, -depth * 0.2);
        group.add(new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: 0x64748b })));

        const ventGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const vent = new THREE.Mesh(ventGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
        vent.position.set(-width * 0.25, height + baseH + 0.075, depth * 0.25);
        group.add(vent);
    }

    return group;
}

function rebuildCity(game) {
    const { cityGroup } = game._three;
    cityGroup.clear();

    const size = game.gridSize;
    const half = size / 2;

    // Geometry Cache
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const roadGeo = new THREE.PlaneGeometry(1, 1);
    roadGeo.rotateX(-Math.PI / 2);

    const parkMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const parkGeo = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    parkGeo.translate(0, 0.1, 0);
    // Add simple tree to park
    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3);
    trunkGeo.translate(0, 0.15, 0);
    const leavesGeo = new THREE.SphereGeometry(0.3);
    leavesGeo.translate(0, 0.5, 0);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = game.grid[y][x];
            if (cell.type === 'none') continue;

            const px = x - half + 0.5;
            const pz = y - half + 0.5;

            // Calculate base Y based on terrain at this spot
            // Re-calc height logic from terrain
            let terrainH = 1.0;
            if (cell.terrain === 'grass' && cell.elevation > 0) terrainH += cell.elevation * 0.2;
            if (cell.terrain === 'hill') terrainH = 1.5 + cell.elevation * 0.2;
            if (cell.terrain === 'mountain') terrainH = 2.0 + cell.elevation * 0.3;

            let baseY = terrainH;
            if (cell.terrain === 'water') baseY = 0.6;

            if (cell.type === 'road') {
                const r = new THREE.Mesh(roadGeo, roadMat);
                r.position.set(px, baseY + 0.02, pz);
                r.receiveShadow = true;

                if (game.lastBuiltTile && game.lastBuiltTile.x === x && game.lastBuiltTile.y === y) {
                    r.scale.set(0.1, 1, 0.1); // Scale horizontally
                }

                cityGroup.add(r);
            }
            else if (cell.type === 'park') {
                const group = new THREE.Group();
                const p = new THREE.Mesh(parkGeo, parkMat);
                p.receiveShadow = true;
                group.add(p);

                // Add 2-3 trees per park
                const treeCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < treeCount; i++) {
                    const treeGroup = new THREE.Group();
                    const t = new THREE.Mesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x78350f }));
                    const l = new THREE.Mesh(leavesGeo, new THREE.MeshLambertMaterial({ color: 0x22c55e }));
                    treeGroup.add(t);
                    treeGroup.add(l);

                    // Offset trees randomly within 0.8x0.8 area
                    treeGroup.position.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
                    treeGroup.rotation.y = Math.random() * Math.PI * 2;
                    group.add(treeGroup);
                }

                group.position.set(px, baseY, pz);

                if (game.lastBuiltTile && game.lastBuiltTile.x === x && game.lastBuiltTile.y === y) {
                    group.scale.set(0.1, 0.1, 0.1);
                }

                cityGroup.add(group);
            }
            else {
                // Buildings
                let color = 0x2563eb;
                if (cell.type === 'residential') color = 0xfefce8; // cream walls
                else if (cell.type === 'commercial') color = 0x60a5fa; // glass blue
                else if (cell.type === 'industrial') color = 0x9ca3af; // factory gray

                const bldg = createBuildingGeometry(cell.type, cell.level, color);
                bldg.position.set(px, baseY, pz);

                // Pop-in animation initial state
                if (game.lastBuiltTile && game.lastBuiltTile.x === x && game.lastBuiltTile.y === y) {
                    bldg.scale.set(0.1, 0.1, 0.1);
                }

                cityGroup.add(bldg);
            }
        }
    }
}

export function updateThree(game) {
    if (!game._three) return;
    const { renderer, scene, camera, controls, cityGroup, dozerModel } = game._three;

    // Only rebuild if grid changed
    if (game.isDirty) {
        rebuildTerrain(game);
        rebuildCity(game);
        game.isDirty = false;
    }

    // Stabilize controls
    if (game.isMouseDown && game.selectedTool !== 'select') {
        controls.enableRotate = false;
    } else {
        controls.enableRotate = true;
    }
    controls.update();

    // Bulldozer orientation
    if (dozerModel && dozerModel.visible) {
        // Face the direction of travel
        if (game.mouse.prevGridX !== -1) {
            const dx = game.mouse.gridX - game.mouse.prevGridX;
            const dz = game.mouse.gridY - game.mouse.prevGridY;

            if (dx !== 0 || dz !== 0) {
                // Front of bulldozer is +X. We want to point towards (dx, dz)
                // In world space, increasing gridX is +X, increasing gridY is +Z
                const targetAngle = Math.atan2(dz, dx);

                // Smooth rotation
                const diff = targetAngle - dozerModel.rotation.y;
                // Normalize angle to avoid spinning around
                const shortestDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
                dozerModel.rotation.y += shortestDiff * 0.2;
            }
        }
    }

    // Smooth scaling for "pop-in" animations
    cityGroup.children.forEach(obj => {
        if (obj.scale.x < 1.0) {
            const next = Math.min(1.0, obj.scale.x + 0.08);
            const nextY = Math.min(1.0, obj.scale.y + 0.08);
            obj.scale.set(next, nextY, next);
        }
    });

    // Reset lastBuiltTile after one frame of animation start (so rebuild doesn't re-trigger it)
    if (game.lastBuiltTile) game.lastBuiltTile = null;

    renderer.render(scene, camera);
}
