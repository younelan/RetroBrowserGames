import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Camera {
    constructor(canvas, worldMap) {
        this.canvas = canvas;
        this.worldMap = worldMap;
        this.hexSize = worldMap.hexSize || 40;
        this.heightScale = 80;

        // Perspective camera – angled top-down (like Civ 5)
        this.camera = new THREE.PerspectiveCamera(
            50,
            canvas.width / canvas.height,
            10,
            20000
        );

        // Initial position: above center of map, looking down at angle
        const centerWorld = worldMap.hexToWorld(
            Math.floor(worldMap.width / 2),
            Math.floor(worldMap.height / 2)
        );
        this.camera.position.set(centerWorld.x, 800, centerWorld.z + 600);

        // Orbit controls for pan/rotate/zoom
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.target.set(centerWorld.x, 0, centerWorld.z);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = true;

        // Zoom limits
        // Zoom limits — allow much closer and farther zoom for flexibility
        this.controls.minDistance = 40;
        this.controls.maxDistance = 8000;

        // Angle limits (keep it strategy-view, not looking up)
        this.controls.maxPolarAngle = Math.PI * 0.42; // Max ~75 degrees from top
        this.controls.minPolarAngle = Math.PI * 0.05;  // Min ~9 degrees

        // Pan speed
        this.controls.panSpeed = 1.5;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 1.0; // Base speed, will be adaptive
        
        // Setup adaptive zoom speed
        this.lastWheelTime = 0;
        this.wheelVelocity = 0;
        this.setupAdaptiveZoom();

        // Mouse buttons: left=pan, middle=rotate, right=rotate
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.ROTATE
        };

        // Enable keyboard panning (arrow keys)
        this.controls.keys = {
            LEFT: 'ArrowLeft',
            UP: 'ArrowUp',
            RIGHT: 'ArrowRight',
            BOTTOM: 'ArrowDown'
        };
        this.controls.listenToKeyEvents(window);

        this.controls.update();

        // Smooth centering animation
        this.targetPos = null;
        this.targetLookAt = null;
        this.animating = false;
        this.animSpeed = 0.08;
    }

    setupAdaptiveZoom() {
        // Override wheel event for adaptive zoom speed
        this.canvas.addEventListener('wheel', (event) => {
            const now = Date.now();
            const timeDelta = now - this.lastWheelTime;
            this.lastWheelTime = now;
            
            // Calculate wheel velocity (how fast user is scrolling)
            const wheelDelta = Math.abs(event.deltaY);
            
            // Adaptive zoom: faster scrolling = higher speed multiplier
            if (timeDelta < 100) {
                // Quick successive scrolls - increase velocity
                this.wheelVelocity = Math.min(this.wheelVelocity + wheelDelta * 0.02, 5.0);
            } else {
                // Slow scroll - use lower speed
                this.wheelVelocity = Math.max(wheelDelta * 0.01, 0.3);
            }
            
            // Apply adaptive speed (0.5x to 4x base speed)
            this.controls.zoomSpeed = 0.5 + this.wheelVelocity * 0.7;
            
            // Decay velocity over time
            setTimeout(() => {
                this.wheelVelocity *= 0.85;
            }, 50);
        }, { passive: true });
    }

    // Smoothly center camera on a hex position
    centerOn(q, r) {
        const pos = this.worldMap.hexToWorld(q, r);
        const y = 0;

        // Calculate camera offset from current target
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);

        this.targetLookAt = new THREE.Vector3(pos.x, y, pos.z);
        this.targetPos = new THREE.Vector3(pos.x + offset.x, offset.y, pos.z + offset.z);
        this.animating = true;
    }

    // Instantly jump to a position
    jumpTo(q, r) {
        const pos = this.worldMap.hexToWorld(q, r);
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
        this.controls.target.set(pos.x, 0, pos.z);
        this.camera.position.set(pos.x + offset.x, offset.y, pos.z + offset.z);
        this.controls.update();
    }

    // Update each frame
    update() {
        // Smooth centering animation
        if (this.animating && this.targetPos && this.targetLookAt) {
            const t = this.animSpeed;
            this.camera.position.lerp(this.targetPos, t);
            this.controls.target.lerp(this.targetLookAt, t);

            const dx = this.camera.position.distanceTo(this.targetPos);
            if (dx < 2) {
                this.camera.position.copy(this.targetPos);
                this.controls.target.copy(this.targetLookAt);
                this.animating = false;
                this.targetPos = null;
                this.targetLookAt = null;
            }
        }

        this.controls.update();
    }

    // Resize handler
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    // Get zoom level (distance from target, normalized)
    getZoom() {
        return this.camera.position.distanceTo(this.controls.target);
    }

    // Legacy compatibility - hex to screen position (for UI overlay positioning)
    hexToScreen(q, r) {
        const world = this.worldMap.hexToWorld(q, r);
        const tile = this.worldMap.getTile(q, r);
        const y = tile ? tile.elevation * this.heightScale : 0;

        const vec = new THREE.Vector3(world.x, y + 5, world.z);
        vec.project(this.camera);

        return {
            x: (vec.x * 0.5 + 0.5) * this.canvas.width,
            y: (-vec.y * 0.5 + 0.5) * this.canvas.height
        };
    }

    // Convert screen position to hex coordinates via raycasting
    screenToHex(screenX, screenY, raycaster, hexMeshes) {
        // Use the canvas DOM rect (CSS pixels) so clicks align with displayed size
        const rect = this.canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((screenX - rect.left) / rect.width) * 2 - 1,
            -((screenY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(mouse, this.camera);
        const meshArray = Array.from(hexMeshes.values());
        const intersects = raycaster.intersectObjects(meshArray);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            if (mesh.userData && mesh.userData.q !== undefined) {
                return { q: mesh.userData.q, r: mesh.userData.r };
            }
        }
        return null;
    }
}
