class CarGame {
    constructor() {
        this.setupGame();
        this.setupEventListeners();
    }

    setupGame() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        
        const container = document.getElementById('game-container');
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        
        // Game state
        this.gameStarted = false;
        this.currentLevel = null;
        this.raceTime = 0;
        this.bestLapTime = Infinity;
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.lapsCompleted = 0;
        this.totalLaps = 3;
        this.aiCars = [];
        
        // Car physics
        this.speed = 0;
        this.maxSpeed = 3.0;
        this.acceleration = 0.12;
        this.deceleration = 0.05;
        this.turnSpeed = 0.05;
        this.playerAngle = 0;
        this.driftFactor = 0.99;
        this.isBraking = false;
        this.steeringAmount = 0;
        
        this.lastTime = 0;
        
        // Set sky color
        this.scene.background = new THREE.Color(0x87CEEB);
        
        this.handleResize();
        this.setupScene();
        this.loadLevel(LEVELS.level1);
        
        // Start animation loop
        this.animate();
    }

    loadLevel(level) {
        // Clear existing level
        if (this.track) {
            this.scene.remove(this.track);
            this.scene.remove(this.trackBorders);
            this.checkpoints.forEach(cp => this.scene.remove(cp));
            this.aiCars.forEach(car => this.scene.remove(car.model));
        }

        this.currentLevel = level;
        this.createTrack(level.trackPoints);
        this.createPlayer();
        this.createAICars(level.aiCars);
        
        // Position player car at start
        this.playerCar.position.copy(level.startPosition);
        this.camera.position.set(
            level.startPosition.x,
            level.startPosition.y + 8,
            level.startPosition.z - 12
        );
    }

    createTrack(trackPoints) {
        // Create a flat track using the points
        const trackWidth = 15;
        const trackShape = new THREE.Shape();
        const curve = new THREE.CatmullRomCurve3(trackPoints);
        curve.closed = true;

        // Create track surface
        const trackGeometry = new THREE.PlaneGeometry(1000, 1000);
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(50, 50);
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(trackGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // Create the actual race track on top of the ground
        const segments = 100;
        const trackPositions = [];
        const trackIndices = [];
        const trackUVs = [];

        // Generate track vertices
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const centerPoint = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // Create vertices for both sides of the track
            const leftPoint = centerPoint.clone().add(normal.clone().multiplyScalar(trackWidth/2));
            const rightPoint = centerPoint.clone().add(normal.clone().multiplyScalar(-trackWidth/2));

            trackPositions.push(
                leftPoint.x, 0.1, leftPoint.z,
                rightPoint.x, 0.1, rightPoint.z
            );

            // UV coordinates for road texture
            trackUVs.push(
                0, t * 10,
                1, t * 10
            );

            // Create faces (triangles)
            if (i < segments) {
                const baseIndex = i * 2;
                trackIndices.push(
                    baseIndex, baseIndex + 1, baseIndex + 2,
                    baseIndex + 1, baseIndex + 3, baseIndex + 2
                );
            }
        }

        // Create track geometry
        const roadGeometry = new THREE.BufferGeometry();
        roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trackPositions, 3));
        roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(trackUVs, 2));
        roadGeometry.setIndex(trackIndices);
        roadGeometry.computeVertexNormals();

        // Load and apply road texture
        const roadTexture = textureLoader.load('https://threejs.org/examples/textures/asphalt.jpg');
        roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(1, 50);

        const roadMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.7,
            metalness: 0.1
        });

        this.track = new THREE.Mesh(roadGeometry, roadMaterial);
        this.scene.add(this.track);

        // Add track borders (white lines)
        const borderWidth = 0.5;
        const leftBorderPositions = [];
        const rightBorderPositions = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const centerPoint = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // Left border
            const leftOuter = centerPoint.clone().add(normal.clone().multiplyScalar(trackWidth/2 + borderWidth));
            const leftInner = centerPoint.clone().add(normal.clone().multiplyScalar(trackWidth/2));
            
            // Right border
            const rightOuter = centerPoint.clone().add(normal.clone().multiplyScalar(-(trackWidth/2 + borderWidth)));
            const rightInner = centerPoint.clone().add(normal.clone().multiplyScalar(-trackWidth/2));

            leftBorderPositions.push(
                leftOuter.x, 0.11, leftOuter.z,
                leftInner.x, 0.11, leftInner.z
            );

            rightBorderPositions.push(
                rightOuter.x, 0.11, rightOuter.z,
                rightInner.x, 0.11, rightInner.z
            );
        }

        // Create border geometries
        const createBorderMesh = (positions) => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            const indices = [];
            for (let i = 0; i < segments; i++) {
                const baseIndex = i * 2;
                indices.push(
                    baseIndex, baseIndex + 1, baseIndex + 2,
                    baseIndex + 1, baseIndex + 3, baseIndex + 2
                );
            }
            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            return new THREE.Mesh(
                geometry,
                new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    roughness: 0.4,
                    metalness: 0.3
                })
            );
        };

        const leftBorder = createBorderMesh(leftBorderPositions);
        const rightBorder = createBorderMesh(rightBorderPositions);
        this.scene.add(leftBorder);
        this.scene.add(rightBorder);

        // Create start/finish line
        const startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(trackWidth, 3),
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
                map: textureLoader.load('https://threejs.org/examples/textures/checkerboard.jpg')
            })
        );
        const startPoint = curve.getPoint(0);
        const startTangent = curve.getTangent(0);
        startLine.position.set(startPoint.x, 0.12, startPoint.z);
        startLine.rotation.x = -Math.PI / 2;
        startLine.rotation.z = Math.atan2(startTangent.x, startTangent.z);
        this.scene.add(startLine);

        // Create checkpoints
        this.checkpoints = [];
        const checkpointCount = 8;
        
        for (let i = 0; i < checkpointCount; i++) {
            const t = i / checkpointCount;
            const position = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            
            const checkpoint = new THREE.Mesh(
                new THREE.PlaneGeometry(trackWidth, 1),
                new THREE.MeshPhongMaterial({ 
                    color: i === 0 ? 0xff0000 : 0x00ff00,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );
            
            checkpoint.position.set(position.x, 0.13, position.z);
            checkpoint.rotation.x = -Math.PI / 2;
            checkpoint.rotation.z = Math.atan2(tangent.x, tangent.z);
            
            this.scene.add(checkpoint);
            this.checkpoints.push(checkpoint);
        }
    }

    createAICars(aiCarConfigs) {
        aiCarConfigs.forEach(config => {
            const aiCar = this.createCarModel(config.color);
            aiCar.position.copy(config.startPosition);
            this.scene.add(aiCar);
            
            this.aiCars.push({
                model: aiCar,
                speed: 0,
                maxSpeed: 2.5 + Math.random() * 0.5,
                angle: 0,
                checkpoint: 0,
                progress: 0
            });
        });
    }

    updateAICars(deltaTime) {
        this.aiCars.forEach(aiCar => {
            // Simple AI logic: follow the track
            const nextCheckpoint = this.checkpoints[aiCar.checkpoint];
            const carPos = aiCar.model.position;
            const targetPos = nextCheckpoint.position;
            
            // Calculate direction to next checkpoint
            const direction = new THREE.Vector3()
                .subVectors(targetPos, carPos)
                .normalize();
            
            // Calculate angle to target
            const targetAngle = Math.atan2(direction.x, direction.z);
            let angleDiff = targetAngle - aiCar.angle;
            
            // Normalize angle difference
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Adjust steering
            aiCar.angle += angleDiff * 0.1;
            
            // Adjust speed based on turn sharpness
            const turnFactor = Math.abs(angleDiff) / Math.PI;
            const targetSpeed = aiCar.maxSpeed * (1 - turnFactor * 0.7);
            aiCar.speed += (targetSpeed - aiCar.speed) * 0.1;
            
            // Update position
            const moveX = Math.sin(aiCar.angle) * aiCar.speed;
            const moveZ = Math.cos(aiCar.angle) * aiCar.speed;
            aiCar.model.position.x += moveX;
            aiCar.model.position.z += moveZ;
            aiCar.model.rotation.y = aiCar.angle;
            
            // Check if reached checkpoint
            const distance = carPos.distanceTo(targetPos);
            if (distance < 8) {
                aiCar.checkpoint = (aiCar.checkpoint + 1) % this.checkpoints.length;
            }
        });
    }

    setupEventListeners() {
        // Start and restart buttons
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const startScreen = document.getElementById('start-screen');

        startButton.addEventListener('click', () => {
            startScreen.style.display = 'none';
            startButton.style.display = 'none';
            restartButton.style.display = 'block';
            this.startGame();
        });

        restartButton.addEventListener('click', () => {
            this.resetGame();
            startScreen.style.display = 'none';
            this.startGame();
        });

        // Keyboard controls with smooth steering
        const pressedKeys = new Set();
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted) return;
            pressedKeys.add(e.key);
            
            if (e.key === 'ArrowDown') {
                this.isBraking = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.gameStarted) return;
            pressedKeys.delete(e.key);
            
            if (e.key === 'ArrowDown') {
                this.isBraking = false;
            }
        });

        // Touch controls with improved handling
        const touchArea = document.getElementById('touch-area');
        let touchStartX = null;
        let touchStartY = null;
        
        touchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameStarted) return;
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            // Start accelerating
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        }, { passive: false });

        touchArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.gameStarted || !touchStartX || !touchStartY) return;
            
            const touch = e.touches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            // Calculate horizontal movement for steering
            const diffX = touchX - touchStartX;
            // Calculate vertical movement for acceleration/braking
            const diffY = touchY - touchStartY;
            
            // Update steering based on horizontal movement
            this.steeringAmount = -(diffX / touchArea.clientWidth) * 2;
            
            // Update speed based on vertical movement
            if (diffY > 50) { // Moving down - brake
                this.isBraking = true;
            } else {
                this.isBraking = false;
            }
            
            touchStartX = touchX;
            touchStartY = touchY;
        }, { passive: false });

        touchArea.addEventListener('touchend', () => {
            if (!this.gameStarted) return;
            touchStartX = null;
            touchStartY = null;
            this.steeringAmount = 0;
            this.isBraking = false;
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Game loop for continuous input handling
        const processInput = () => {
            if (this.gameStarted) {
                // Handle keyboard input
                if (pressedKeys.has('ArrowUp')) {
                    this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
                }
                
                if (pressedKeys.has('ArrowLeft')) {
                    this.steeringAmount = 1;
                } else if (pressedKeys.has('ArrowRight')) {
                    this.steeringAmount = -1;
                } else if (!touchStartX) { // Only reset if not touching
                    this.steeringAmount = 0;
                }
                
                // Apply steering
                if (Math.abs(this.speed) > 0.1) {
                    this.playerAngle += this.turnSpeed * this.steeringAmount * Math.sign(this.speed);
                }
                
                // Apply braking/deceleration
                if (this.isBraking) {
                    this.speed = Math.max(this.speed - this.deceleration * 2, -this.maxSpeed/2);
                } else if (!pressedKeys.has('ArrowUp') && !touchStartX) {
                    // Natural deceleration when not accelerating
                    this.speed *= this.driftFactor;
                }
            }
            requestAnimationFrame(processInput);
        };
        processInput();
    }

    startGame() {
        this.gameStarted = true;
        this.raceTime = 0;
        this.lapsCompleted = 0;
        this.currentCheckpoint = 0;
        this.speed = 0;
        this.playerCar.position.set(0, 0.5, 0);
        this.playerCar.rotation.y = 0;
        this.playerAngle = 0;
        document.getElementById('lapValue').textContent = `${this.lapsCompleted}/${this.totalLaps}`;
        this.checkpoints.forEach(cp => cp.material.color.setHex(0xffff00));
    }

    resetGame() {
        this.startGame();
    }

    handleResize() {
        const container = document.getElementById('game-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    setupScene() {
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);

        // Set camera position and angle
        this.camera.position.set(0, 50, 0);
        this.camera.lookAt(0, 0, 0);
    }

    createCarModel(color = 0xff0000) {
        const carGroup = new THREE.Group();

        // Car body - more aerodynamic shape
        const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        carGroup.add(body);

        // Car roof - sloped design
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.4, 2);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.position.y = 1;
        roof.position.z = -0.5;
        carGroup.add(roof);

        // Front windshield
        const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.4, 0.1);
        const windshieldMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            transparent: true,
            opacity: 0.7
        });
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.y = 0.8;
        windshield.position.z = 0.7;
        windshield.rotation.x = Math.PI * 0.2;
        carGroup.add(windshield);

        // Wheels with better detail
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const wheelPositions = [
            [-0.9, 0.4, 1.2],   // front left
            [0.9, 0.4, 1.2],    // front right
            [-0.9, 0.4, -1.2],  // back left
            [0.9, 0.4, -1.2]    // back right
        ];

        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...position);
            carGroup.add(wheel);

            // Add wheel rim
            const rimGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.31, 8);
            const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            rim.position.set(...position);
            carGroup.add(rim);
        });

        return carGroup;
    }

    createPlayer() {
        this.playerCar = this.createCarModel();
        this.playerCar.position.set(0, 0.5, 0);
        this.scene.add(this.playerCar);
    }

    checkCheckpoint() {
        const checkpoint = this.checkpoints[this.currentCheckpoint];
        const distance = this.playerCar.position.distanceTo(checkpoint.position);
        
        if (distance < 6) {
            checkpoint.material.color.setHex(0x00ff00);
            this.currentCheckpoint++;
            
            if (this.currentCheckpoint === this.checkpoints.length) {
                this.lapsCompleted++;
                document.getElementById('lapValue').textContent = 
                    `${this.lapsCompleted}/${this.totalLaps}`;
                
                // Check for race completion
                if (this.lapsCompleted === this.totalLaps) {
                    if (this.raceTime < this.bestLapTime) {
                        this.bestLapTime = this.raceTime;
                        const minutes = Math.floor(this.bestLapTime / 60);
                        const seconds = Math.floor(this.bestLapTime % 60);
                        document.getElementById('bestValue').textContent = 
                            `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                    this.gameStarted = false;
                    document.getElementById('start-screen').style.display = 'block';
                    return;
                }
                
                // Reset for next lap
                this.currentCheckpoint = 0;
                this.checkpoints.forEach(cp => cp.material.color.setHex(0xffff00));
            }
        }
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!deltaTime || !this.gameStarted) return;

        // Update race time
        this.raceTime += deltaTime;
        document.getElementById('timeValue').textContent = 
            Math.floor(this.raceTime);

        // Update player position with improved physics
        const moveX = Math.sin(this.playerAngle) * this.speed;
        const moveZ = Math.cos(this.playerAngle) * this.speed;
        
        this.playerCar.position.x += moveX;
        this.playerCar.position.z += moveZ;
        this.playerCar.rotation.y = this.playerAngle;

        // Update AI cars
        this.updateAICars(deltaTime);

        // Apply drift/friction
        this.speed *= this.driftFactor;

        // Update camera position with smoother following
        const cameraDistance = 12;
        const cameraHeight = 8;
        const targetX = this.playerCar.position.x - Math.sin(this.playerAngle) * cameraDistance;
        const targetZ = this.playerCar.position.z - Math.cos(this.playerAngle) * cameraDistance;
        
        this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
        this.camera.position.y = cameraHeight;
        this.camera.lookAt(this.playerCar.position);

        // Check checkpoints
        this.checkCheckpoint();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CarGame();
});
