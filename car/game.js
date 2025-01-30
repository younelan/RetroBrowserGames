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
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(10, 10);
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        this.scene.add(ground);

        // Create a flat circular road
        const radius = 80;
        const trackWidth = 16;
        const segments = 64;

        // Create road geometry
        const roadShape = new THREE.Shape();
        roadShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, radius - trackWidth, 0, Math.PI * 2, true);
        roadShape.holes.push(holePath);

        const roadGeometry = new THREE.ShapeGeometry(roadShape, segments);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,  // Dark gray for asphalt
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.track = new THREE.Mesh(roadGeometry, roadMaterial);
        this.track.rotation.x = -Math.PI / 2;
        this.track.position.y = 0.01;  // Slightly above ground
        this.scene.add(this.track);

        // Create white border lines
        const innerRadius = radius - trackWidth;
        const outerRadius = radius;

        // Inner white line
        const innerLineGeometry = new THREE.RingGeometry(innerRadius - 0.5, innerRadius, segments);
        const linesMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        const innerLine = new THREE.Mesh(innerLineGeometry, linesMaterial);
        innerLine.rotation.x = -Math.PI / 2;
        innerLine.position.y = 0.02;
        this.scene.add(innerLine);

        // Outer white line
        const outerLineGeometry = new THREE.RingGeometry(outerRadius, outerRadius + 0.5, segments);
        const outerLine = new THREE.Mesh(outerLineGeometry, linesMaterial);
        outerLine.rotation.x = -Math.PI / 2;
        outerLine.position.y = 0.02;
        this.scene.add(outerLine);

        // Create start/finish line
        const startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(trackWidth - 1, 2),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide
            })
        );
        startLine.position.set(radius - trackWidth/2, 0.03, 0);
        startLine.rotation.x = -Math.PI / 2;
        this.scene.add(startLine);

        // Create checkpoints (less visible)
        this.checkpoints = [];
        const checkpointCount = 8;
        
        for (let i = 0; i < checkpointCount; i++) {
            const angle = (i / checkpointCount) * Math.PI * 2;
            const x = Math.cos(angle) * (radius - trackWidth/2);
            const z = Math.sin(angle) * (radius - trackWidth/2);
            
            const checkpoint = new THREE.Mesh(
                new THREE.PlaneGeometry(trackWidth - 2, 1),
                new THREE.MeshBasicMaterial({ 
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.2,
                    side: THREE.DoubleSide
                })
            );
            
            checkpoint.position.set(x, 0.02, z);
            checkpoint.rotation.x = -Math.PI / 2;
            checkpoint.rotation.z = angle;
            
            this.scene.add(checkpoint);
            this.checkpoints.push(checkpoint);
        }

        // Store track parameters for AI
        this.trackRadius = radius;
        this.trackWidth = trackWidth;
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
            if (!this.trackRadius) return;

            const carPos = aiCar.model.position;
            
            // Calculate target point on track
            const angle = Math.atan2(carPos.z, carPos.x);
            const targetX = Math.cos(angle + 0.1) * this.trackRadius;
            const targetZ = Math.sin(angle + 0.1) * this.trackRadius;
            
            // Calculate direction to target
            const direction = new THREE.Vector3(targetX - carPos.x, 0, targetZ - carPos.z).normalize();
            
            // Calculate target angle
            const targetAngle = Math.atan2(direction.x, direction.z);
            let angleDiff = targetAngle - aiCar.angle;
            
            // Normalize angle difference
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Adjust steering
            aiCar.angle += angleDiff * 0.1;
            
            // Calculate distance from ideal radius
            const currentRadius = Math.sqrt(carPos.x * carPos.x + carPos.z * carPos.z);
            const radiusDiff = Math.abs(currentRadius - this.trackRadius);
            
            // Adjust speed based on how close to track we are
            const speedFactor = Math.max(0.5, 1 - radiusDiff / 20);
            aiCar.speed = aiCar.maxSpeed * speedFactor;

            // Update position
            const moveX = Math.sin(aiCar.angle) * aiCar.speed;
            const moveZ = Math.cos(aiCar.angle) * aiCar.speed;
            aiCar.model.position.x += moveX;
            aiCar.model.position.z += moveZ;
            aiCar.model.rotation.y = aiCar.angle;
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
        directionalLight.position.set(0, 100, 0);
        this.scene.add(directionalLight);

        // Set initial camera position higher and looking down
        this.camera.position.set(0, 120, 0);
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

        // Update player position
        const moveX = Math.sin(this.playerAngle) * this.speed;
        const moveZ = Math.cos(this.playerAngle) * this.speed;
        
        this.playerCar.position.x += moveX;
        this.playerCar.position.z += moveZ;
        this.playerCar.rotation.y = this.playerAngle;

        // Update AI cars
        this.updateAICars(deltaTime);

        // Update camera to follow player from behind and above
        const cameraHeight = 15;
        const cameraDistance = 20;
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
