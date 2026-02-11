import * as THREE from 'three';
import { TerrainType } from './Tile.js';

// ============================================================================
//  THREE.JS 3D RENDERER for Civilization-style hex game
//  Flat-top hexagonal tiles with axial coordinates (q, r)
// ============================================================================

const SQRT3 = Math.sqrt(3);
console.log("--- ANTIGRAVITY OVERHAUL V11 LOADED ---");

// Terrain color palette
const TERRAIN_COLORS = {
    'Ocean': 0x0a2a4a,
    'Coast': 0x1a5a8a,
    'Grassland': 0x4da643,
    'Plains': 0xc8b44a,
    'Hills': 0x7a8a3e,
    'Desert': 0xdcc060,
    'Tundra': 0x8a9a9a,
    'Snow': 0xe0eaf0,
    'Mountain': 0x5a5a5a
};

// Hex direction vectors (flat-top orientation)
const HEX_DIRS = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

export class Renderer {
    constructor(canvas, camera, worldMap) {
        // The canvas and the 2D camera wrapper from the existing codebase
        this.canvas = canvas;
        this.cameraWrapper = camera;
        this.worldMap = worldMap;

        // Provide a stub 2D context for backward compatibility with main.js
        // (WebGL canvas cannot also have a 2D context, so we use a no-op proxy)
        this.ctx = new Proxy({}, {
            get: () => (...args) => { }
        });

        // ---- THREE.JS SETUP ----
        this.threeRenderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false
        });
        this.threeRenderer.setSize(canvas.width, canvas.height);
        this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.threeRenderer.shadowMap.enabled = true;
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.threeRenderer.toneMappingExposure = 1.1;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x08080c);
        this.scene.fog = new THREE.FogExp2(0x0a1525, 0.00015);

        // Constants
        this.hexSize = worldMap.hexSize || 40;
        this.heightScale = 80;

        // Storage
        this.hexMeshes = new Map();       // "q,r" -> THREE.Mesh
        this.hexMaterials = new Map();    // "q,r" -> THREE.MeshStandardMaterial
        this.unitSprites = new Map();     // "ownerIdx-unitIdx" or unit ref -> sprite group
        this.cityMeshes = new Map();      // city ref -> mesh group
        this.highlightMeshes = [];
        this.borderLines = null;
        this.featureInstances = [];
        this.riverMeshes = [];

        // Use the camera from Camera.js wrapper (Three.js PerspectiveCamera)
        this.threeCamera = camera.camera || new THREE.PerspectiveCamera(55, canvas.width / canvas.height, 10, 30000);

        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Time for animations
        this.time = 0;

        // Combat effects
        this.combatEffects = [];

        // Water plane reference
        this.waterMesh = null;

        // Minimap
        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }

        // Fog of war state
        this._fogState = new Map(); // "q,r" -> 'visible' | 'discovered' | 'hidden'

        // Shared geometries (reusable)
        this._hexGeomCache = new Map();
        this._materialCache = new Map();

        // Build the scene
        this.setupLighting();
        this.createTerrain();
        this.createWater();
        this.createRivers();
        this.createFeatures();

        // Initial camera sync (sun light follows camera)
        setTimeout(() => this._syncCamera(), 100);
    }

    // ========================================================================
    //  COORDINATE CONVERSION
    // ========================================================================

    hexToWorld(q, r, elevation = 0) {
        // FLAT-TOP HEX COORDINATES
        const x = this.hexSize * (3 / 2 * q);
        const z = this.hexSize * (SQRT3 / 2 * q + SQRT3 * r);
        const y = elevation * this.heightScale;
        return new THREE.Vector3(x, y, z);
    }

    getHexVertices(cx, cz, size) {
        const verts = [];
        for (let i = 0; i < 6; i++) {
            // Flat-top vertices: 0, 60, 120, 180, 240, 300 degrees
            const angle = (60 * i) * Math.PI / 180;
            verts.push({
                x: cx + size * Math.cos(angle),
                z: cz + size * Math.sin(angle)
            });
        }
        return verts;
    }

    // ========================================================================
    //  LIGHTING
    // ========================================================================

    setupLighting() {
        // Ambient light for base illumination
        const ambient = new THREE.AmbientLight(0x6688aa, 0.6);
        this.scene.add(ambient);

        // Hemisphere light for sky/ground color variation
        const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 0.5);
        hemi.position.set(0, 500, 0);
        this.scene.add(hemi);

        // Main directional sun light with shadows
        const sun = new THREE.DirectionalLight(0xfff4d6, 1.2);
        sun.position.set(800, 1200, -400);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.left = -3000;
        sun.shadow.camera.right = 3000;
        sun.shadow.camera.top = 3000;
        sun.shadow.camera.bottom = -3000;
        sun.shadow.camera.near = 100;
        sun.shadow.camera.far = 5000;
        sun.shadow.bias = -0.001;
        this.scene.add(sun);
        this.sunLight = sun;

        // Soft fill light from opposite side
        const fill = new THREE.DirectionalLight(0x8899bb, 0.3);
        fill.position.set(-600, 400, 600);
        this.scene.add(fill);
    }

    // ========================================================================
    //  TERRAIN MESH CREATION
    // ========================================================================

    createTerrain() {
        console.log("--- ANTIGRAVITY OVERHAUL V12 LOADED ---");
        // Clear old hex meshes
        for (const m of this.hexMeshes.values()) this.scene.remove(m);
        this.hexMeshes.clear();

        // Calculate true map bounds in world units to avoid shift
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const [key, tile] of this.worldMap.tiles) {
            const worldPos = this.hexToWorld(tile.q, tile.r, 0);
            minX = Math.min(minX, worldPos.x);
            maxX = Math.max(maxX, worldPos.x);
            minZ = Math.min(minZ, worldPos.z);
            maxZ = Math.max(maxZ, worldPos.z);
        }

        // Add a small margin around the map
        const margin = this.hexSize * 4;
        const totalW = (maxX - minX) + margin * 2;
        const totalH = (maxZ - minZ) + margin * 2;

        // Resolution for the terrain plane
        const res = 160;
        const geometry = new THREE.PlaneGeometry(totalW, totalH, res, res);
        geometry.rotateX(-Math.PI / 2);

        // Exact alignment: Plane is centered at the true map center.
        const centerX = (minX + maxX) * 0.5;
        const centerZ = (minZ + maxZ) * 0.5;
        geometry.translate(centerX, 0, centerZ);

        const posAttr = geometry.attributes.position;
        const colors = [];

        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vz = posAttr.getZ(i);

            // Fractional axial coordinates (Inverse of axialToWorld)
            const fq = vx / (1.5 * this.hexSize);
            const fr = (vz / (SQRT3 * this.hexSize)) - (fq / 2);

            // DIRECT NOISE SAMPLING (No more "blurred hexagons")
            const elevation = this.worldMap.sampleElevation(fq, fr);

            // Biome color sampling
            const hq = Math.round(fq);
            const hr = Math.round(fr);
            const tile = this.worldMap.getTile(hq, hr);

            let terrainColor = new THREE.Color(0x0a2a4a);
            if (tile) {
                terrainColor.setHex(TERRAIN_COLORS[tile.terrain.name] || 0x4da643);
                // Subtle shading based on height
                const tName = tile.terrain.name;
                if (tName === 'Ocean' || tName === 'Coast') terrainColor.multiplyScalar(0.7);
                else terrainColor.offsetHSL(0, 0, (elevation - 0.5) * 0.1);
            }

            posAttr.setY(i, elevation * this.heightScale);
            colors.push(terrainColor.r, terrainColor.g, terrainColor.b);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: false
        });

        const terrainMesh = new THREE.Mesh(geometry, material);
        terrainMesh.castShadow = true;
        terrainMesh.receiveShadow = true;
        this.scene.add(terrainMesh);

        this.mainTerrainMesh = terrainMesh;

        // Keep a simple hex-indexing mesh for selection/raycasting data
        // We'll use invisible hex meshes for picking q/r coordinates efficiently
        this.createPickingMeshes();
    }

    createPickingMeshes() {
        const pickingGeo = new THREE.CylinderGeometry(this.hexSize, this.hexSize, 10, 6);
        const pickingMat = new THREE.MeshBasicMaterial({ visible: false });

        for (const [key, tile] of this.worldMap.tiles) {
            const worldPos = this.hexToWorld(tile.q, tile.r, tile.elevation);
            const mesh = new THREE.Mesh(pickingGeo, pickingMat);
            mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
            mesh.userData.q = tile.q;
            mesh.userData.r = tile.r;
            this.scene.add(mesh);
            this.hexMeshes.set(key, mesh);
        }
    }

    // ========================================================================
    //  PICKING (RAYCASTING)
    // ========================================================================

    getHexAtPosition(screenX, screenY) {
        this.mouse.x = (screenX / this.canvas.width) * 2 - 1;
        this.mouse.y = -(screenY / this.canvas.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.threeCamera);

        const meshArray = Array.from(this.hexMeshes.values());
        const intersects = this.raycaster.intersectObjects(meshArray, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            return { q: hit.userData.q, r: hit.userData.r };
        }
        return null;
    }

    // ========================================================================
    //  WATER PLANE
    // ========================================================================

    createWater() {
        // Large water plane at coast level
        const waterLevel = this.heightScale * 0.38;
        const width = this.worldMap.width;
        const height = this.worldMap.height;
        const size = Math.max(width, height) * this.hexSize * 3;

        const waterGeo = new THREE.PlaneGeometry(size, size, 64, 64);
        waterGeo.rotateX(-Math.PI / 2);

        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x1a6090,
            transparent: true,
            opacity: 0.7,
            roughness: 0.05,
            metalness: 0.5,
            emissive: 0x0a1a2a,
            emissiveIntensity: 0.2,
            side: THREE.FrontSide // Use FrontSide only to fix "black patches"
        });

        this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.waterMesh.position.y = waterLevel;
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);

        this.waterBaseY = waterLevel;
    }

    // ========================================================================
    //  RIVERS
    // ========================================================================

    createRivers() {
        // Remove old river meshes
        for (const rm of this.riverMeshes) {
            this.scene.remove(rm);
            rm.geometry.dispose();
            if (rm.material.dispose) rm.material.dispose();
        }
        this.riverMeshes = [];

        const riverMaterial = new THREE.MeshStandardMaterial({
            color: 0x3377bb,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.5,
            emissive: 0x112244,
            emissiveIntensity: 0.3
        });

        if (!this.worldMap.riverPaths || this.worldMap.riverPaths.length === 0) return;

        for (const path of this.worldMap.riverPaths) {
            const points = [];

            for (let i = 0; i < path.length; i++) {
                const key = path[i];
                const tile = this.worldMap.getTileByCoords(key);
                if (!tile) continue;

                const pos = this.hexToWorld(tile.q, tile.r, tile.elevation);
                const pCenter = new THREE.Vector3(pos.x, pos.y + 0.6, pos.z);

                points.push(pCenter);

                if (i < path.length - 1) {
                    const nextKey = path[i + 1];
                    const nextTile = this.worldMap.getTileByCoords(nextKey);
                    if (nextTile) {
                        const nextPos = this.hexToWorld(nextTile.q, nextTile.r, nextTile.elevation);
                        const pNext = new THREE.Vector3(nextPos.x, nextPos.y + 0.6, nextPos.z);
                        const mid = new THREE.Vector3().lerpVectors(pCenter, pNext, 0.5);

                        // Deterministic meander
                        const bendAmount = 14;
                        const seedX = (tile.q + nextTile.q) * 0.5;
                        const seedZ = (tile.r + nextTile.r) * 0.3;
                        mid.x += Math.sin(seedX * 1.6 + seedZ) * bendAmount;
                        mid.z += Math.cos(seedX * 0.8 + seedZ * 1.3) * bendAmount;

                        points.push(mid);
                    }
                }
            }

            if (points.length < 2) continue;

            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeo = new THREE.TubeGeometry(curve, points.length * 10, 3.2, 8, false);
            const riverMesh = new THREE.Mesh(tubeGeo, riverMaterial);

            riverMesh.receiveShadow = true;
            this.scene.add(riverMesh);
            this.riverMeshes.push(riverMesh);
        }
    }

    // ========================================================================
    //  FEATURES (Trees, Jungle canopies)
    // ========================================================================

    createFeatures() {
        // Clean up old
        for (const inst of this.featureInstances) {
            this.scene.remove(inst);
            inst.geometry.dispose();
            if (inst.material.dispose) inst.material.dispose();
        }
        this.featureInstances = [];

        // Collect forest and jungle tiles
        const forestTiles = [];
        const jungleTiles = [];

        for (const [key, tile] of this.worldMap.tiles) {
            if (tile.feature.name === 'Forest') forestTiles.push(tile);
            else if (tile.feature.name === 'Jungle') jungleTiles.push(tile);
        }

        // Forest: instanced green cones (like pine trees)
        if (forestTiles.length > 0) {
            this._createTreeInstances(forestTiles, 'forest');
        }

        // Jungle: instanced round green canopies
        if (jungleTiles.length > 0) {
            this._createTreeInstances(jungleTiles, 'jungle');
        }
    }

    _createTreeInstances(tiles, type) {
        const treesPerHex = 3;
        const count = tiles.length * treesPerHex;

        let geometry, material;

        if (type === 'forest') {
            geometry = new THREE.ConeGeometry(4, 16, 6);
            material = new THREE.MeshStandardMaterial({
                color: 0x2d6b1e,
                roughness: 0.9,
                metalness: 0.0,
                flatShading: true
            });
        } else {
            geometry = new THREE.SphereGeometry(5, 6, 4);
            material = new THREE.MeshStandardMaterial({
                color: 0x1a8a2a,
                roughness: 0.85,
                metalness: 0.0,
                flatShading: true
            });
        }

        const instMesh = new THREE.InstancedMesh(geometry, material, count);
        instMesh.castShadow = true;
        instMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        let idx = 0;

        for (const tile of tiles) {
            // Robust name checking
            const tName = tile.terrain.name;
            if (tName === 'Ocean' || tName === 'Coast') continue;

            const worldPos = this.hexToWorld(tile.q, tile.r, tile.elevation);
            const baseY = Math.max(worldPos.y, this.heightScale * 0.34) + 1;

            for (let t = 0; t < treesPerHex; t++) {
                // Scatter within the hex using deterministic pseudo-random
                const seed = tile.q * 137 + tile.r * 251 + t * 79;
                const angle = ((seed * 2654435761) % 1000) / 1000 * Math.PI * 2;
                const dist = ((seed * 1103515245 + 12345) % 1000) / 1000 * this.hexSize * 0.5;

                const ox = Math.cos(angle) * dist;
                const oz = Math.sin(angle) * dist;

                // Size variation
                const scaleFactor = 0.7 + ((seed * 48271) % 1000) / 1000 * 0.8;

                dummy.position.set(
                    worldPos.x + ox,
                    baseY + (type === 'forest' ? 8 * scaleFactor : 5 * scaleFactor),
                    worldPos.z + oz
                );
                dummy.scale.set(scaleFactor, scaleFactor, scaleFactor);
                dummy.updateMatrix();
                instMesh.setMatrixAt(idx, dummy.matrix);

                // Color variation per instance
                const colorVar = 0.85 + ((seed * 16807) % 1000) / 1000 * 0.3;
                const col = new THREE.Color(type === 'forest' ? 0x2d6b1e : 0x1a8a2a);
                col.r *= colorVar;
                col.g *= colorVar;
                col.b *= colorVar;
                instMesh.setColorAt(idx, col);

                idx++;
            }
        }

        instMesh.instanceMatrix.needsUpdate = true;
        if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;

        this.scene.add(instMesh);
        this.featureInstances.push(instMesh);
    }

    // ========================================================================
    //  FOG OF WAR
    // ========================================================================

    updateFogOfWar(player) {
        if (!player) return;

        for (const [key, material] of this.hexMaterials) {
            const isDiscovered = player.discoveredTiles.has(key);
            const isVisible = player.visibleTiles.has(key);

            const prevState = this._fogState.get(key);
            let newState;

            if (!isDiscovered) {
                newState = 'hidden';
            } else if (!isVisible) {
                newState = 'discovered';
            } else {
                newState = 'visible';
            }

            // Only update material if state changed
            if (prevState !== newState) {
                this._fogState.set(key, newState);

                const mesh = this.hexMeshes.get(key);
                if (!mesh) continue;

                if (newState === 'hidden') {
                    mesh.visible = false;
                } else if (newState === 'discovered') {
                    mesh.visible = true;
                    material.opacity = 0.45;
                    material.transparent = true;
                    material.emissive.set(0x000000);
                    material.emissiveIntensity = 0;
                } else {
                    mesh.visible = true;
                    material.opacity = 1.0;
                    material.transparent = false;
                    material.emissive.set(0x000000);
                    material.emissiveIntensity = 0;
                }
                material.needsUpdate = true;
            }
        }
    }

    // ========================================================================
    //  TERRITORY BORDERS
    // ========================================================================

    updateTerritoryBorders(game) {
        // Remove old borders
        if (this.borderLines) {
            this.scene.remove(this.borderLines);
            this.borderLines.geometry.dispose();
            this.borderLines.material.dispose();
            this.borderLines = null;
        }

        if (!game) return;

        const positions = [];
        const colors = [];
        const player = game.getCurrentPlayer();

        for (const [key, tile] of this.worldMap.tiles) {
            if (!tile.owner) continue;
            if (player && !player.discoveredTiles.has(key)) continue;

            const worldPos = this.hexToWorld(tile.q, tile.r, tile.elevation);
            const topY = Math.max(worldPos.y, this.heightScale * 0.35) + 2;
            const hexVerts = this.getHexVertices(worldPos.x, worldPos.z, this.hexSize);

            const ownerColor = new THREE.Color(tile.owner.color);

            for (let d = 0; d < 6; d++) {
                const dir = HEX_DIRS[d];
                const neighbor = this.worldMap.getTile(tile.q + dir.q, tile.r + dir.r);

                if (!neighbor || neighbor.owner !== tile.owner) {
                    const v1 = hexVerts[d % 6];
                    const v2 = hexVerts[(d + 1) % 6];

                    positions.push(v1.x, topY, v1.z);
                    positions.push(v2.x, topY, v2.z);

                    colors.push(ownerColor.r, ownerColor.g, ownerColor.b);
                    colors.push(ownerColor.r, ownerColor.g, ownerColor.b);
                }
            }
        }

        if (positions.length === 0) return;

        const borderGeo = new THREE.BufferGeometry();
        borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        borderGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const borderMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
        });

        this.borderLines = new THREE.LineSegments(borderGeo, borderMat);
        this.scene.add(this.borderLines);
    }

    // ========================================================================
    //  UNIT SPRITES
    // ========================================================================

    updateUnits(game) {
        if (!game) return;

        const player = game.getCurrentPlayer();

        // Remove old unit sprites
        for (const [, sprite] of this.unitSprites) {
            this.scene.remove(sprite);
            sprite.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }
        this.unitSprites.clear();

        // Create new unit sprites
        for (const p of game.players) {
            for (let i = 0; i < p.units.length; i++) {
                const unit = p.units[i];
                const unitKey = `${p.id}_${i}`;

                // Visibility check
                if (player && unit.owner !== player) {
                    if (!player.visibleTiles.has(`${unit.q},${unit.r}`)) continue;
                }
                if (player && !player.discoveredTiles.has(`${unit.q},${unit.r}`)) continue;

                const group = this._createUnitSprite(unit);
                this.unitSprites.set(unitKey, group);
                this.scene.add(group);
            }
        }
    }

    _createUnitSprite(unit) {
        const group = new THREE.Group();

        const tile = this.worldMap.getTile(unit.q, unit.r);
        const elevation = tile ? tile.elevation : 0.35;
        const worldPos = this.hexToWorld(unit.q, unit.r, elevation);
        const baseY = Math.max(worldPos.y, this.heightScale * 0.35) + 5;

        // Colored base disc
        const discGeo = new THREE.CylinderGeometry(12, 12, 3, 16);
        const discMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(unit.owner.color),
            roughness: 0.4,
            metalness: 0.3,
            emissive: new THREE.Color(unit.owner.color),
            emissiveIntensity: 0.3
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(0, 0, 0);
        disc.castShadow = true;
        group.add(disc);

        // Billboard sprite with emoji
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 128;
        spriteCanvas.height = 128;
        const sctx = spriteCanvas.getContext('2d');

        // Background circle
        sctx.beginPath();
        sctx.arc(64, 64, 58, 0, Math.PI * 2);
        sctx.fillStyle = unit.owner.color;
        sctx.fill();
        sctx.strokeStyle = '#ffffff';
        sctx.lineWidth = 4;
        sctx.stroke();

        // Emoji icon
        sctx.font = '56px serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText(unit.type.icon, 64, 68);

        const texture = new THREE.CanvasTexture(spriteCanvas);
        texture.needsUpdate = true;

        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            sizeAttenuation: true
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(28, 28, 1);
        sprite.position.set(0, 18, 0);
        group.add(sprite);

        // Health bar (if damaged)
        if (unit.health < 100) {
            const hpRatio = unit.health / 100;
            const barWidth = 20;
            const barHeight = 2;

            // Background bar
            const bgGeo = new THREE.BoxGeometry(barWidth + 1, barHeight, 1);
            const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const bgBar = new THREE.Mesh(bgGeo, bgMat);
            bgBar.position.set(0, 6, 8);
            group.add(bgBar);

            // Health fill
            const hpColor = hpRatio > 0.6 ? 0x4ade80 : hpRatio > 0.25 ? 0xfacc15 : 0xef4444;
            const hpGeo = new THREE.BoxGeometry(barWidth * hpRatio, barHeight - 0.5, 1.1);
            const hpMat = new THREE.MeshBasicMaterial({ color: hpColor });
            const hpBar = new THREE.Mesh(hpGeo, hpMat);
            hpBar.position.set(-(barWidth * (1 - hpRatio)) / 2, 6, 8);
            group.add(hpBar);
        }

        // Fortified indicator
        if (unit.isFortified) {
            const shieldGeo = new THREE.RingGeometry(10, 14, 6);
            const shieldMat = new THREE.MeshBasicMaterial({
                color: 0x44aaff,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.rotation.x = -Math.PI / 2;
            shield.position.set(0, 2, 0);
            group.add(shield);
        }

        group.position.set(worldPos.x, baseY, worldPos.z);
        return group;
    }

    // ========================================================================
    //  CITY MESHES
    // ========================================================================

    updateCities(game) {
        if (!game) return;

        const player = game.getCurrentPlayer();

        // Remove old city meshes
        for (const [, group] of this.cityMeshes) {
            this.scene.remove(group);
            group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }
        this.cityMeshes.clear();

        for (const p of game.players) {
            for (const city of p.cities) {
                if (player && !player.discoveredTiles.has(`${city.q},${city.r}`)) continue;

                const group = this._createCityMesh(city);
                this.cityMeshes.set(city, group);
                this.scene.add(group);
            }
        }
    }

    _createCityMesh(city) {
        const group = new THREE.Group();

        const tile = this.worldMap.getTile(city.q, city.r);
        const elevation = tile ? tile.elevation : 0.4;
        const worldPos = this.hexToWorld(city.q, city.r, elevation);
        const baseY = Math.max(worldPos.y, this.heightScale * 0.35) + 2;

        // City base platform
        const baseGeo = new THREE.CylinderGeometry(22, 25, 6, 8);
        const baseMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(city.owner.color),
            roughness: 0.5,
            metalness: 0.2,
            emissive: new THREE.Color(city.owner.color),
            emissiveIntensity: 0.15
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(0, 0, 0);
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Main building (scaled by population)
        const bldgHeight = 12 + Math.min(city.population, 20) * 2;
        const bldgGeo = new THREE.BoxGeometry(14, bldgHeight, 14);
        const bldgMat = new THREE.MeshStandardMaterial({
            color: 0xccbbaa,
            roughness: 0.7,
            metalness: 0.1,
            flatShading: true
        });
        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.position.set(0, 3 + bldgHeight / 2, 0);
        bldg.castShadow = true;
        group.add(bldg);

        // Smaller side buildings for larger cities
        if (city.population >= 4) {
            const sideH = 8 + Math.min(city.population, 15);
            const sideGeo = new THREE.BoxGeometry(8, sideH, 8);
            const side1 = new THREE.Mesh(sideGeo, bldgMat);
            side1.position.set(10, 3 + sideH / 2, 5);
            side1.castShadow = true;
            group.add(side1);

            const side2 = new THREE.Mesh(sideGeo, bldgMat);
            side2.position.set(-8, 3 + sideH / 2, -6);
            side2.castShadow = true;
            group.add(side2);
        }

        // Capital star
        if (city.isCapital) {
            const starGeo = new THREE.OctahedronGeometry(5, 0);
            const starMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.5,
                roughness: 0.3,
                metalness: 0.6
            });
            const star = new THREE.Mesh(starGeo, starMat);
            star.position.set(0, 3 + bldgHeight + 8, 0);
            star.castShadow = true;
            group.add(star);
        }

        // City name label sprite
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 512;
        labelCanvas.height = 128;
        const lctx = labelCanvas.getContext('2d');

        // Background banner
        lctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        const textWidth = Math.max(200, city.name.length * 26 + 80);
        const startX = (512 - textWidth) / 2;
        lctx.beginPath();
        lctx.roundRect(startX, 20, textWidth, 70, 8);
        lctx.fill();

        // Border
        lctx.strokeStyle = city.owner.color;
        lctx.lineWidth = 4;
        lctx.beginPath();
        lctx.roundRect(startX, 20, textWidth, 70, 8);
        lctx.stroke();

        // Population circle
        lctx.beginPath();
        lctx.arc(startX + 35, 55, 22, 0, Math.PI * 2);
        lctx.fillStyle = '#2ea043';
        lctx.fill();
        lctx.fillStyle = '#ffffff';
        lctx.font = 'bold 28px sans-serif';
        lctx.textAlign = 'center';
        lctx.textBaseline = 'middle';
        lctx.fillText(String(city.population), startX + 35, 57);

        // City name
        lctx.fillStyle = '#ffffff';
        lctx.font = 'bold 26px sans-serif';
        lctx.textAlign = 'center';
        lctx.fillText(city.name.toUpperCase(), 256 + 15, 58);

        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.needsUpdate = true;

        const labelMat = new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthTest: false,
            sizeAttenuation: true
        });
        const label = new THREE.Sprite(labelMat);
        label.scale.set(80, 20, 1);
        label.position.set(0, 3 + bldgHeight + 22, 0);
        group.add(label);

        // HP bar if damaged
        if (city.cityHP < city.maxCityHP) {
            const hpRatio = city.cityHP / city.maxCityHP;
            const barWidth = 30;

            const bgGeo = new THREE.BoxGeometry(barWidth + 1, 2, 1);
            const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const bgBar = new THREE.Mesh(bgGeo, bgMat);
            bgBar.position.set(0, -3, 16);
            group.add(bgBar);

            const hpColor = hpRatio > 0.6 ? 0x4ade80 : hpRatio > 0.25 ? 0xfacc15 : 0xef4444;
            const hpGeo = new THREE.BoxGeometry(barWidth * hpRatio, 1.5, 1.1);
            const hpMat = new THREE.MeshBasicMaterial({ color: hpColor });
            const hpBar = new THREE.Mesh(hpGeo, hpMat);
            hpBar.position.set(-(barWidth * (1 - hpRatio)) / 2, -3, 16);
            group.add(hpBar);
        }

        group.position.set(worldPos.x, baseY, worldPos.z);
        return group;
    }

    // ========================================================================
    //  SELECTION HIGHLIGHTS
    // ========================================================================

    drawHighlight(tile, color) {
        // Clear previous highlights
        this.clearHighlights();

        if (!tile) return;

        const worldPos = this.hexToWorld(tile.q, tile.r, tile.elevation);
        const topY = Math.max(worldPos.y, this.heightScale * 0.35) + 1.5;

        // Create a glowing hex ring
        const ringPoints = [];
        for (let i = 0; i <= 6; i++) {
            const angle = (60 * (i % 6)) * Math.PI / 180;
            ringPoints.push(new THREE.Vector3(
                worldPos.x + this.hexSize * 0.98 * Math.cos(angle),
                topY,
                worldPos.z + this.hexSize * 0.98 * Math.sin(angle)
            ));
        }

        const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);

        // Parse color string
        let threeColor = new THREE.Color(0xffffff);
        let opacity = 0.7;
        if (typeof color === 'string') {
            if (color.startsWith('rgba')) {
                const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                if (match) {
                    threeColor = new THREE.Color(
                        parseInt(match[1]) / 255,
                        parseInt(match[2]) / 255,
                        parseInt(match[3]) / 255
                    );
                    opacity = parseFloat(match[4]);
                }
            } else {
                threeColor = new THREE.Color(color);
            }
        }

        const ringMat = new THREE.LineBasicMaterial({
            color: threeColor,
            transparent: true,
            opacity: Math.min(1, opacity + 0.3),
            linewidth: 2
        });

        const ring = new THREE.LineLoop(ringGeo, ringMat);
        this.scene.add(ring);
        this.highlightMeshes.push(ring);

        // Add a filled hex overlay for area highlight
        const hexShape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (60 * i) * Math.PI / 180;
            const vx = this.hexSize * 0.95 * Math.cos(angle);
            const vz = this.hexSize * 0.95 * Math.sin(angle);
            if (i === 0) hexShape.moveTo(vx, vz);
            else hexShape.lineTo(vx, vz);
        }
        hexShape.closePath();

        const fillGeo = new THREE.ShapeGeometry(hexShape);
        fillGeo.rotateX(-Math.PI / 2);

        const fillMat = new THREE.MeshBasicMaterial({
            color: threeColor,
            transparent: true,
            opacity: Math.min(0.3, opacity),
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const fill = new THREE.Mesh(fillGeo, fillMat);
        fill.position.set(worldPos.x, topY + 0.2, worldPos.z);
        this.scene.add(fill);
        this.highlightMeshes.push(fill);
    }

    clearHighlights() {
        for (const hl of this.highlightMeshes) {
            this.scene.remove(hl);
            if (hl.geometry) hl.geometry.dispose();
            if (hl.material) hl.material.dispose();
        }
        this.highlightMeshes = [];
    }

    // ========================================================================
    //  COMBAT EFFECTS
    // ========================================================================

    addCombatEffect(q, r, color = '#ff4444') {
        this.combatEffects.push({
            q, r,
            startTime: this.time,
            duration: 1.0,
            color,
            mesh: null
        });
    }

    _updateCombatEffects() {
        const toRemove = [];

        for (let i = 0; i < this.combatEffects.length; i++) {
            const effect = this.combatEffects[i];
            const elapsed = this.time - effect.startTime;
            const progress = elapsed / effect.duration;

            if (progress >= 1.0) {
                if (effect.mesh) {
                    this.scene.remove(effect.mesh);
                    effect.mesh.geometry.dispose();
                    effect.mesh.material.dispose();
                }
                toRemove.push(i);
                continue;
            }

            const tile = this.worldMap.getTile(effect.q, effect.r);
            if (!tile) continue;

            const worldPos = this.hexToWorld(effect.q, effect.r, tile.elevation);
            const topY = Math.max(worldPos.y, this.heightScale * 0.35) + 3;

            // Create expanding ring if not yet created
            if (!effect.mesh) {
                const ringGeo = new THREE.RingGeometry(1, 3, 24);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(effect.color),
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide,
                    depthWrite: false
                });
                effect.mesh = new THREE.Mesh(ringGeo, ringMat);
                effect.mesh.rotation.x = -Math.PI / 2;
                effect.mesh.position.set(worldPos.x, topY, worldPos.z);
                this.scene.add(effect.mesh);
            }

            // Animate: expand ring and fade
            const maxRadius = this.hexSize * 1.5;
            const currentRadius = maxRadius * this._easeOutCubic(progress);
            const alpha = 1.0 - progress * progress;

            // Update geometry by scaling
            effect.mesh.scale.set(currentRadius / 3, currentRadius / 3, 1);
            effect.mesh.material.opacity = alpha * 0.7;
            effect.mesh.position.y = topY + progress * 10;
        }

        // Remove expired
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.combatEffects.splice(toRemove[i], 1);
        }
    }

    // ========================================================================
    //  HEX PICKING (RAYCASTING)
    // ========================================================================

    getHexAtPosition(screenX, screenY) {
        // Normalize to [-1, 1]
        this.mouse.x = (screenX / this.canvas.width) * 2 - 1;
        this.mouse.y = -(screenY / this.canvas.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.threeCamera);

        // Raycast against all hex meshes
        const meshArray = Array.from(this.hexMeshes.values());
        const intersects = this.raycaster.intersectObjects(meshArray, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (hit.userData.q !== undefined && hit.userData.r !== undefined) {
                return { q: hit.userData.q, r: hit.userData.r };
            }
        }
        return null;
    }

    // ========================================================================
    //  CAMERA SYNCHRONIZATION
    // ========================================================================

    _syncCamera() {
        // Camera is managed by OrbitControls in Camera.js
        // Just update the sun light to follow the camera target
        if (this.sunLight && this.cameraWrapper?.controls) {
            const target = this.cameraWrapper.controls.target;
            this.sunLight.position.set(target.x + 800, 1200, target.z - 400);
            this.sunLight.target.position.set(target.x, 0, target.z);
            this.sunLight.target.updateMatrixWorld();
        }
    }

    // ========================================================================
    //  MINIMAP
    // ========================================================================

    drawMiniMap() {
        if (!this.minimapCtx) return;
        const mm = this.minimapCanvas;
        const ctx = this.minimapCtx;

        if (mm.width !== 220) {
            mm.width = 220;
            mm.height = 160;
        }

        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, mm.width, mm.height);

        const w = this.worldMap.width;
        const h = this.worldMap.height;
        const pSize = mm.width / w;
        const ySize = mm.height / h;

        const player = window.game?.getCurrentPlayer();

        // Terrain colors for minimap
        const mmColors = {
            'Ocean': '#0f2b4a', 'Coast': '#1a4a7a', 'Grassland': '#3d8b37',
            'Plains': '#b8a44c', 'Hills': '#7a8a3e', 'Desert': '#c4a84e',
            'Tundra': '#7a8a8a', 'Snow': '#d0dde6', 'Mountain': '#3a3a3a'
        };

        for (const [key, tile] of this.worldMap.tiles) {
            const isDiscovered = !player || player.discoveredTiles.has(key);

            if (!isDiscovered) {
                ctx.fillStyle = '#0a0a12';
            } else {
                ctx.fillStyle = mmColors[tile.terrain.name] || tile.terrain.color;
                if (tile.owner) {
                    ctx.fillStyle = this._blendColors(
                        mmColors[tile.terrain.name] || tile.terrain.color,
                        tile.owner.color,
                        0.4
                    );
                }
            }

            const px = (tile.q + (tile.r / 2)) * pSize;
            const py = tile.r * ySize;
            ctx.fillRect(px, py, Math.ceil(pSize) + 0.5, Math.ceil(ySize) + 0.5);
        }

        // City markers
        if (window.game) {
            for (const p of window.game.players) {
                for (const city of p.cities) {
                    if (player && !player.discoveredTiles.has(`${city.q},${city.r}`)) continue;
                    const cx = (city.q + (city.r / 2)) * pSize;
                    const cy = city.r * ySize;
                    ctx.fillStyle = city.owner.color;
                    ctx.fillRect(cx - 2, cy - 2, 5, 5);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(cx - 2, cy - 2, 5, 5);
                }

                for (const unit of p.units) {
                    const isVis = !player || player.visibleTiles.has(`${unit.q},${unit.r}`) || unit.owner === player;
                    if (!isVis) continue;
                    const ux = (unit.q + (unit.r / 2)) * pSize;
                    const uy = unit.r * ySize;
                    ctx.beginPath();
                    ctx.arc(ux, uy, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = unit.owner.color;
                    ctx.fill();
                }
            }
        }

        // Viewport indicator
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        try {
            const topLeft = window.game.screenToMinimap(0, 0);
            const bottomRight = window.game.screenToMinimap(this.canvas.width, this.canvas.height);
            const vw = bottomRight.x - topLeft.x;
            const vh = bottomRight.y - topLeft.y;
            ctx.strokeRect(topLeft.x, topLeft.y, vw, vh);
        } catch (e) {
            // Viewport calculation failed
        }

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, mm.width, mm.height);
    }

    // ========================================================================
    //  MAIN DRAW LOOP
    // ========================================================================

    draw(gameRef) {
        this.time += 0.016;

        const game = gameRef || window.game;
        const player = game?.getCurrentPlayer();

        // Sync 3D camera from 2D camera wrapper
        this._syncCamera();

        // Animate water
        if (this.waterMesh) {
            this.waterMesh.position.y = this.waterBaseY + Math.sin(this.time * 0.8) * 0.5;

            // Subtle vertex animation for waves
            const posAttr = this.waterMesh.geometry.attributes.position;
            if (posAttr) {
                for (let i = 0; i < posAttr.count; i++) {
                    const x = posAttr.getX(i);
                    const z = posAttr.getZ(i);
                    const waveY = Math.sin(x * 0.005 + this.time * 1.2) * 1.5
                        + Math.cos(z * 0.007 + this.time * 0.9) * 1.0;
                    posAttr.setY(i, waveY);
                }
                posAttr.needsUpdate = true;
            }
        }

        // Update fog of war
        this.updateFogOfWar(player);

        // Update dynamic objects
        this.updateUnits(game);
        this.updateCities(game);

        // Update territory borders (throttled - only every ~30 frames)
        if (Math.floor(this.time * 60) % 30 === 0) {
            this.updateTerritoryBorders(game);
        }

        // Update combat effects
        this._updateCombatEffects();

        // Handle highlight for selected entity
        this.clearHighlights();
        if (game) {
            // Draw reachable tile highlights
            if (game.reachableTiles) {
                for (const key of game.reachableTiles.keys()) {
                    const [q, r] = key.split(',').map(Number);
                    const tile = this.worldMap.getTile(q, r);
                    if (tile) {
                        this._addHighlightHex(tile, 0x58a6ff, 0.15);
                    }
                }
            }

            // Selected entity highlight
            if (game.selectedEntity) {
                const e = game.selectedEntity;
                const tile = e.tile || this.worldMap.getTile(e.q, e.r);
                if (tile) {
                    this._addHighlightHex(tile, 0xffffff, 0.4);
                }
            }
        }

        // Golden age glow (adjust scene tint)
        if (player && player.goldenAge) {
            const pulse = 0.08 + Math.sin(this.time * 1.5) * 0.03;
            this.scene.fog.color.set(0x2a1800);
            this.scene.fog.density = 0.00008;
        } else {
            this.scene.fog.color.set(0x0a1525);
            this.scene.fog.density = 0.00015;
        }

        // Render the 3D scene
        this.threeRenderer.render(this.scene, this.threeCamera);

        // Minimap (drawn to separate 2D canvas)
        this.drawMiniMap();
    }

    _addHighlightHex(tile, color, opacity) {
        const worldPos = this.hexToWorld(tile.q, tile.r, tile.elevation);
        const topY = Math.max(worldPos.y, this.heightScale * 0.35) + 1.5;

        // Filled hex overlay
        const hexShape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (60 * i) * Math.PI / 180;
            const vx = this.hexSize * 0.95 * Math.cos(angle);
            const vz = this.hexSize * 0.95 * Math.sin(angle);
            if (i === 0) hexShape.moveTo(vx, vz);
            else hexShape.lineTo(vx, vz);
        }
        hexShape.closePath();

        const fillGeo = new THREE.ShapeGeometry(hexShape);
        fillGeo.rotateX(-Math.PI / 2);

        const fillMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const fill = new THREE.Mesh(fillGeo, fillMat);
        fill.position.set(worldPos.x, topY + 0.3, worldPos.z);
        this.scene.add(fill);
        this.highlightMeshes.push(fill);
    }

    // ========================================================================
    //  RESIZE
    // ========================================================================

    resize(width, height) {
        this.threeRenderer.setSize(width, height);
        this.threeCamera.aspect = width / height;
        this.threeCamera.updateProjectionMatrix();
    }

    // ========================================================================
    //  UTILITY METHODS
    // ========================================================================

    _easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    _easeInQuad(t) {
        return t * t;
    }

    _parseColor(hex) {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        return {
            r: parseInt(c.substring(0, 2), 16),
            g: parseInt(c.substring(2, 4), 16),
            b: parseInt(c.substring(4, 6), 16)
        };
    }

    _blendColors(hex1, hex2, ratio) {
        const c1 = this._parseColor(hex1);
        const c2 = this._parseColor(hex2);
        const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
        const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
        const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
        return `rgb(${r},${g},${b})`;
    }

    // Dispose all Three.js resources (for cleanup)
    dispose() {
        // Dispose hex meshes
        for (const [, mesh] of this.hexMeshes) {
            this.scene.remove(mesh);
        }
        for (const [, mat] of this.hexMaterials) {
            mat.dispose();
        }
        for (const [, geom] of this._hexGeomCache) {
            geom.dispose();
        }

        // Dispose water
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh.material.dispose();
        }

        // Dispose rivers
        for (const rm of this.riverMeshes) {
            this.scene.remove(rm);
            rm.geometry.dispose();
            rm.material.dispose();
        }

        // Dispose features
        for (const inst of this.featureInstances) {
            this.scene.remove(inst);
            inst.geometry.dispose();
            inst.material.dispose();
        }

        // Dispose borders
        if (this.borderLines) {
            this.scene.remove(this.borderLines);
            this.borderLines.geometry.dispose();
            this.borderLines.material.dispose();
        }

        // Dispose units
        for (const [, sprite] of this.unitSprites) {
            this.scene.remove(sprite);
            sprite.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }

        // Dispose cities
        for (const [, group] of this.cityMeshes) {
            this.scene.remove(group);
            group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }

        // Dispose highlights
        this.clearHighlights();

        // Dispose renderer
        this.threeRenderer.dispose();
    }
}
