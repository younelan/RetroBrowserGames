import * as THREE from 'three';

// --- Constants & Config ---
const CONFIG = {
  ROAD_WIDTH: 286, // Wider road (+30%)
  SEGMENT_COUNT: 1200,
  MAX_SPEED: 800,
  ACCEL: 220,
  DECEL: 180,
  FRICTION: 40,
  STEER_SENSITIVITY: 160,
  AI_COUNT: 10, // Reduced from 20 to 10
  LAPS_TO_WIN: 3,
  COLOR: {
    SKY: 0x72d7ee,
    GRASS: 0x14a314,
    ROAD: 0x333333,
    RUMBLE_1: 0xffffff,
    RUMBLE_2: 0xff0000,
    LANE: 0xffffff,
    MOUNTAIN: 0x3d4e5c
  }
};

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.speedEl = document.getElementById('speed');
    this.timeEl = document.getElementById('time');
    this.lapEl = document.getElementById('lap');
    this.rankEl = document.getElementById('rank');
    this.overlay = document.getElementById('overlay');
    this.startBtn = document.getElementById('start-btn');

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 40000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.speed = 0;
    this.playerX = CONFIG.ROAD_WIDTH / 4; // Start in right lane
    this.playerZ = 0;
    this.time = 0;
    this.laps = 0;

    this.keys = {};
    this.curve = null;
    this.trackLength = 0;
    this.opponents = [];

    // Mobile controls
    this.isTouching = false;
    this.touchX = 0;

    // Effects
    this.shake = 0;
    this.particles = [];
    this.scenery = [];

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupSky();
    this.buildTrack();
    this.setupCheckpoints();
    this.setupScenery();
    this.setupParticles();
    this.setupPlayer();
    this.setupOpponents();

    this.bindEvents();
    this.animate();
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(500, 1000, 500);
    this.scene.add(sun);
  }

  setupSky() {
    this.scene.background = new THREE.Color(CONFIG.COLOR.SKY);
    this.scene.fog = new THREE.Fog(CONFIG.COLOR.SKY, 5000, 30000);

    const mtGroup = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(5000, 2500, 4),
        new THREE.MeshStandardMaterial({ color: CONFIG.COLOR.MOUNTAIN })
      );
      m.position.set(Math.cos(angle) * 30000, 1000, Math.sin(angle) * 30000);
      mtGroup.add(m);
    }
    this.bg = mtGroup;
    this.scene.add(this.bg);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100000, 100000),
      new THREE.MeshStandardMaterial({ color: CONFIG.COLOR.GRASS })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    this.scene.add(floor);
  }

  buildTrack() {
    const pts = [];
    const radius = 6000;
    const totalPoints = 150;
    for (let i = 0; i < totalPoints; i++) {
      const a = (i / totalPoints) * Math.PI * 2;
      const r = radius + Math.sin(a * 3) * 1200 + Math.cos(a * 6) * 600;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      pts.push(new THREE.Vector3(x, 0, z));
    }
    this.curve = new THREE.CatmullRomCurve3(pts);
    this.curve.closed = true;
    this.trackLength = this.curve.getLength();

    const segments = CONFIG.SEGMENT_COUNT;
    const roadGeo = new THREE.BufferGeometry();
    const roadPos = [];
    const roadUv = [];

    const rumbleWidth = 20;
    const fullWidth = CONFIG.ROAD_WIDTH + rumbleWidth * 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      const norm = new THREE.Vector3(tan.z, 0, -tan.x).normalize();

      const p1 = p.clone().add(norm.clone().multiplyScalar(-fullWidth / 2));
      const p2 = p.clone().add(norm.clone().multiplyScalar(fullWidth / 2));

      roadPos.push(p1.x, 0, p1.z);
      roadPos.push(p2.x, 0, p2.z);

      const dist = t * this.trackLength;
      roadUv.push(0, dist / 80.0);
      roadUv.push(1, dist / 80.0);
    }

    const indices = [];
    for (let i = 0; i < segments; i++) {
      const st = i * 2;
      indices.push(st, st + 1, st + 2);
      indices.push(st + 1, st + 3, st + 2);
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUv, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.ShaderMaterial({
      uniforms: {
        uRoadColor: { value: new THREE.Color(CONFIG.COLOR.ROAD) },
        uRumble1: { value: new THREE.Color(CONFIG.COLOR.RUMBLE_1) },
        uRumble2: { value: new THREE.Color(CONFIG.COLOR.RUMBLE_2) },
        uLaneColor: { value: new THREE.Color(CONFIG.COLOR.LANE) }
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                varying vec2 vUv;
                uniform vec3 uRoadColor;
                uniform vec3 uRumble1;
                uniform vec3 uRumble2;
                uniform vec3 uLaneColor;
                
                void main() {
                    float x = vUv.x;
                    float z = vUv.y;
                    
                    bool isStripe = mod(z, 2.0) < 1.0;
                    vec3 color = uRoadColor;
                    
                    if (x < 0.1 || x > 0.9) {
                        color = isStripe ? uRumble1 : uRumble2;
                    } 
                    else if (x > 0.495 && x < 0.505) { // Center divider
                        if (mod(z, 6.0) < 3.0) color = uLaneColor;
                    }
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
      side: THREE.DoubleSide
    });

    const trackMesh = new THREE.Mesh(roadGeo, roadMat);
    trackMesh.position.y = 0.05;
    this.scene.add(trackMesh);
  }

  createChequeredTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const step = size / 4;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(x * step, y * step, step, step);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }

  createGantry(label) {
    const group = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
    // Use MeshBasicMaterial for the banner to ensure pure white/black contrast without shading interference
    const bannerMat = new THREE.MeshBasicMaterial({
      map: this.createChequeredTexture(),
      side: THREE.DoubleSide
    });

    const height = 80;
    const width = CONFIG.ROAD_WIDTH * 1.5;

    // Pillars
    const pillarGeo = new THREE.BoxGeometry(8, height, 8);
    const pL = new THREE.Mesh(pillarGeo, pillarMat);
    pL.position.set(-width / 2, height / 2, 0);
    group.add(pL);

    const pR = new THREE.Mesh(pillarGeo, pillarMat);
    pR.position.set(width / 2, height / 2, 0);
    group.add(pR);

    // Crossbar
    const crossGeo = new THREE.BoxGeometry(width, 4, 4);
    const cross = new THREE.Mesh(crossGeo, pillarMat);
    cross.position.set(0, height, 0);
    group.add(cross);

    // Chequered Banner
    const bannerGeo = new THREE.PlaneGeometry(width - 16, 25);
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, height - 12.5, 0);
    group.add(banner);

    return group;
  }

  setupCheckpoints() {
    const intervals = [0]; // Only at the start/finish line
    intervals.forEach(t => {
      const gantry = this.createGantry();
      const pos = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();

      gantry.position.copy(pos);
      const angle = Math.atan2(tan.x, tan.z);
      gantry.rotation.y = angle;
      this.scene.add(gantry);
    });
  }

  setupScenery() {
    const intervals = [0.05, 0.15, 0.35, 0.45, 0.6, 0.7, 0.85, 0.95];
    const sideOffset = CONFIG.ROAD_WIDTH * 0.9;

    intervals.forEach((t, i) => {
      const pos = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      const norm = new THREE.Vector3(tan.z, 0, -tan.x).normalize();

      // Billboard
      const bb = this.createBillboard(i % 2 === 0 ? "SPEED" : "POLE");
      const side = (i % 2 === 0) ? 1 : -1;
      bb.position.copy(pos).add(norm.clone().multiplyScalar(sideOffset * side));
      bb.position.y = 20;
      bb.lookAt(pos);
      this.scene.add(bb);
      this.scenery.push(bb);
    });
  }

  createBillboard(text) {
    const group = new THREE.Group();
    const posterMat = new THREE.MeshBasicMaterial({ color: 0xffdd57 });
    const poster = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 2), posterMat);
    group.add(poster);

    const post = new THREE.Mesh(new THREE.BoxGeometry(4, 40, 4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    post.position.y = -15;
    group.add(post);

    return group;
  }

  setupParticles() {
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 30; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.visible = false;
      this.scene.add(p);
      this.particles.push({ mesh: p, life: 0 });
    }
  }

  spawnParticle(pos) {
    const p = this.particles.find(p => !p.mesh.visible);
    if (p) {
      p.mesh.visible = true;
      p.mesh.position.copy(pos);
      p.life = 1.0;
    }
  }

  createCar(color) {
    const carModel = new THREE.Group();
    // Use more vibrant color and emissive for visibility
    const bodyColor = color || 0xff0000;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.1,
      metalness: 0.5,
      emissive: bodyColor,
      emissiveIntensity: 0.2
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.2, emissive: 0x111111, emissiveIntensity: 0.1 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });

    // 1. Chassis - Tapered from back to front
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 24), bodyMat);
    mainBody.position.set(0, 3, -2);
    carModel.add(mainBody);

    // 2. Nose - Long and Low
    const nose = new THREE.Mesh(new THREE.BoxGeometry(7, 2.5, 18), bodyMat);
    nose.position.set(0, 1.25, 15);
    carModel.add(nose);

    // 3. Sidepods - Wide and aerodynamic
    const sidePodL = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 12), bodyMat);
    sidePodL.position.set(-10, 3.5, -2);
    carModel.add(sidePodL);
    const sidePodR = sidePodL.clone();
    sidePodR.position.x = 10;
    carModel.add(sidePodR);

    // 4. Cockpit & Intake
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), carbonMat);
    cockpit.position.set(0, 5, -2);
    carModel.add(cockpit);

    const intake = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), bodyMat);
    intake.position.set(0, 7.5, -5);
    carModel.add(intake);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), silverMat);
    helmet.position.set(0, 7, -2);
    carModel.add(helmet);

    // 5. Front Wing - Wide and low
    const fWingBody = new THREE.Mesh(new THREE.BoxGeometry(32, 1.5, 8), carbonMat);
    fWingBody.position.set(0, 0.75, 24);
    carModel.add(fWingBody);

    // 6. Rear Wing - Large and Elevated
    const rWingBody = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 12), carbonMat);
    rWingBody.position.set(0, 10, -12);
    carModel.add(rWingBody);

    // Rear Wing Endplates
    const rPlateL = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 12), bodyMat);
    rPlateL.position.set(-14, 7, -12);
    carModel.add(rPlateL);
    const rPlateR = rPlateL.clone();
    rPlateR.position.x = 14;
    carModel.add(rPlateR);

    // 7. Wheels - Lighter grey to pop from road
    const fWheelL = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 5, 24), tireMat);
    fWheelL.rotation.z = Math.PI / 2;
    fWheelL.position.set(-14, 4.5, 18);
    carModel.add(fWheelL);

    const fWheelR = fWheelL.clone();
    fWheelR.position.x = 14;

    const frontWheels = new THREE.Group();
    frontWheels.add(fWheelL, fWheelR);
    carModel.add(frontWheels);
    carModel.userData.frontWheels = frontWheels;

    const rWheelL = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 8, 24), tireMat);
    rWheelL.rotation.z = Math.PI / 2;
    rWheelL.position.set(-15, 6, -8);
    carModel.add(rWheelL);

    const rWheelR = rWheelL.clone();
    rWheelR.position.x = 15;
    carModel.add(rWheelR);

    // Slimmer and Longer: 4/5 width (2 * 0.8 = 1.6), 110% length (2 * 1.1 = 2.2)
    carModel.scale.set(1.6, 1.6, 2.2);
    return carModel;
  }

  setupPlayer() {
    this.player = this.createCar(0xee1111);
    this.scene.add(this.player);
  }

  setupOpponents() {
    // Base AI speed slower than player max speed to allow passing
    const colors = [0x3366ff, 0x00cc44, 0xffcc00, 0xcc33ff, 0xffffff];
    const baseAISpeed = 350;
    for (let i = 0; i < CONFIG.AI_COUNT; i++) {
      const opp = {
        model: this.createCar(colors[i % colors.length]),
        z: (i + 1) * 1500 + Math.random() * 500,
        x: (Math.random() - 0.5) * CONFIG.ROAD_WIDTH * 0.7,
        speed: baseAISpeed + Math.random() * 150,
        personality: i % 2 === 0 ? 'perfect' : 'erratic',
        targetX: 0,
        mistakeTimer: Math.random() * 5
      };
      opp.targetX = opp.x;
      this.scene.add(opp.model);
      this.opponents.push(opp);
    }
  }

  bindEvents() {
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    this.startBtn.addEventListener('click', () => {
      this.overlay.classList.add('hidden');
      this.isRunning = true;
      this.clock.start();
    });

    // Touch events for mobile
    this.container.addEventListener('touchstart', (e) => {
      if (!this.isRunning) return;
      this.isTouching = true;
      this.handleTouch(e);
    }, { passive: false });

    this.container.addEventListener('touchmove', (e) => {
      if (!this.isRunning) return;
      this.handleTouch(e);
      e.preventDefault();
    }, { passive: false });

    this.container.addEventListener('touchend', () => {
      this.isTouching = false;
    });
  }

  handleTouch(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchX = (touch.clientX / window.innerWidth) * 2 - 1;
    }
  }

  update(dt) {
    if (!this.isRunning) return;

    // --- Driving ---
    const accelerating = this.keys['KeyW'] || this.keys['ArrowUp'] || this.isTouching;
    const braking = this.keys['KeyS'] || this.keys['ArrowDown'];

    if (accelerating) this.speed += CONFIG.ACCEL * dt;
    else if (braking) this.speed -= CONFIG.DECEL * dt;
    else this.speed -= CONFIG.FRICTION * dt;
    this.speed = Math.max(0, Math.min(this.speed, CONFIG.MAX_SPEED));

    // --- Steering: FIXED Inversion ---
    const speedFactor = Math.min(1.0, this.speed / 100);
    let steerInput = 0;

    // Keyboard steering (with inversion fix)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) steerInput = 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) steerInput = -1;

    // Mobile steering
    if (this.isTouching) {
      steerInput = -this.touchX * 1.5; // Sensitivity boost for touch
    }

    this.playerX += steerInput * CONFIG.STEER_SENSITIVITY * speedFactor * dt;

    // Allow wider motion (go into grass), but limit it to avoid going completely off-screen
    const maxOffRoad = CONFIG.ROAD_WIDTH * 0.8;
    this.playerX = Math.max(-maxOffRoad, Math.min(maxOffRoad, this.playerX));

    // --- Off-road Penalty ---
    const isOnGrass = Math.abs(this.playerX) > CONFIG.ROAD_WIDTH / 2;
    if (isOnGrass) {
      // Significantly reduced acceleration and top speed when on grass
      this.speed -= CONFIG.DECEL * 0.5 * dt; // Extra friction/braking effect
      this.speed = Math.min(this.speed, 250); // Cap top speed on grass

      this.shake = Math.max(this.shake, 4);
      if (this.speed > 50 && Math.random() < 0.3) {
        this.spawnParticle(this.player.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 20, 0, -20)));
      }
    }

    // --- Progress ---
    this.playerZ += this.speed * 4.5 * dt;
    if (this.playerZ >= this.trackLength) {
      this.playerZ -= this.trackLength;
      this.laps++;

      if (this.laps >= CONFIG.LAPS_TO_WIN) {
        this.finishRace();
      }
    }

    const t = (this.playerZ / this.trackLength) % 1;
    const pos = this.curve.getPointAt(t);
    const tan = this.curve.getTangentAt(t).normalize();
    const norm = new THREE.Vector3(tan.z, 0, -tan.x).normalize();

    // --- Update Model Position ---
    this.player.position.copy(pos).add(norm.clone().multiplyScalar(this.playerX));
    this.player.position.y = 0.1;

    // Fixed Rotation: Follow track tangent + manual steering angle
    const angle = Math.atan2(tan.x, tan.z);
    this.player.rotation.set(0, angle + (steerInput * 0.4), 0);
    // Add subtle lean/roll when steering
    this.player.rotation.z = -steerInput * 0.08;

    // Wheel animation
    this.player.userData.frontWheels.rotation.y = THREE.MathUtils.lerp(this.player.userData.frontWheels.rotation.y, steerInput * 0.7, 0.2);

    // --- Camera: Chase Locked ---
    // Dynamic FOV based on speed
    this.camera.fov = 65 + (this.speed / CONFIG.MAX_SPEED) * 15;
    this.camera.updateProjectionMatrix();

    // Adjusted for 4/5 width and 110% length, and lower on screen
    const camDist = 140;
    const camHeight = 35;
    const camPos = this.player.position.clone()
      .add(tan.clone().multiplyScalar(-camDist))
      .add(new THREE.Vector3(0, camHeight, 0));

    // Screen Shake
    if (this.shake > 0) {
      camPos.x += (Math.random() - 0.5) * this.shake;
      camPos.y += (Math.random() - 0.5) * this.shake;
      this.shake *= 0.9;
      if (this.shake < 0.1) this.shake = 0;
    }

    this.camera.position.copy(camPos);
    this.camera.lookAt(this.player.position.clone().add(tan.clone().multiplyScalar(400)));

    // --- Opponents Logic ---
    for (const opp of this.opponents) {
      opp.z += opp.speed * 4.5 * dt;
      if (opp.z >= this.trackLength) {
        opp.z -= this.trackLength;
        opp.laps = (opp.laps || 0) + 1;
      }

      const oppT = (opp.z / this.trackLength) % 1;
      const oppPosAtT = this.curve.getPointAt(oppT);
      const oppTan = this.curve.getTangentAt(oppT).normalize();
      const oppNorm = new THREE.Vector3(oppTan.z, 0, -oppTan.x).normalize();

      opp.model.position.copy(oppPosAtT).add(oppNorm.multiplyScalar(opp.x));
      opp.model.position.y = 0.1;

      // Fixed Opponent Rotation: Follow track tangent directly, matching player scale logic
      const oppAngle = Math.atan2(oppTan.x, oppTan.z);
      opp.model.rotation.set(0, oppAngle, 0);

      // --- AI Logic & Avoidance ---
      if (opp.personality === 'erratic') {
        opp.mistakeTimer -= dt;
        if (opp.mistakeTimer <= 0) {
          opp.targetX = (Math.random() - 0.5) * CONFIG.ROAD_WIDTH * 0.7;
          opp.mistakeTimer = 2 + Math.random() * 4;
        }
      }

      const relZ = (opp.z - this.playerZ + this.trackLength) % this.trackLength;

      // Avoidance: If close behind the player, steer around
      const distToPlayer = 250;
      if (relZ > this.trackLength - distToPlayer) {
        const xDiff = opp.x - this.playerX;
        if (Math.abs(xDiff) < 40) {
          // Steer away from player
          opp.targetX = this.playerX + (xDiff > 0 ? 50 : -50);
        }
      } else {
        // Return to original lane if not avoiding player
        if (opp.personality === 'perfect') opp.targetX = (opp.targetX || opp.x);
      }

      // Smoothly move towards target X
      opp.x = THREE.MathUtils.lerp(opp.x, opp.targetX, 2 * dt);
      opp.x = Math.max(-CONFIG.ROAD_WIDTH * 0.45, Math.min(CONFIG.ROAD_WIDTH * 0.45, opp.x));

      // --- Collision Detection ---
      const zCollisionDist = 60;
      const xCollisionDist = 30;
      const behindPlayer = relZ > this.trackLength - zCollisionDist;
      const inFrontPlayer = relZ < zCollisionDist;

      if ((behindPlayer || inFrontPlayer) && Math.abs(this.playerX - opp.x) < xCollisionDist) {
        if (this.speed > 100) this.shake = 15;
        this.speed = 0; // Stop car on collision
      }

      opp.model.visible = relZ < 8000 || relZ > this.trackLength - 1000;
    }

    // --- Particle Update ---
    this.particles.forEach(p => {
      if (p.mesh.visible) {
        p.life -= dt * 2;
        p.mesh.scale.setScalar(p.life);
        p.mesh.position.y += dt * 5;
        if (p.life <= 0) p.mesh.visible = false;
      }
    });

    // --- UI ---
    this.time += dt;
    this.timeEl.textContent = this.time.toFixed(2);
    this.speedEl.textContent = Math.floor(this.speed);
    this.lapEl.textContent = `${this.laps} / ${CONFIG.LAPS_TO_WIN}`;

    // --- Ranking System ---
    const cars = [
      { id: 'player', distance: this.laps * this.trackLength + this.playerZ },
      ...this.opponents.map((opp, i) => ({ id: `ai${i}`, distance: opp.z + (opp.laps || 0) * this.trackLength }))
    ];

    cars.sort((a, b) => b.distance - a.distance);
    const playerRank = cars.findIndex(c => c.id === 'player') + 1;
    this.updateRankDisplay(playerRank);

    // Parallax Backdrop
    this.bg.position.set(this.camera.position.x, 0, this.camera.position.z);
    this.bg.rotation.y = (this.playerX / 400) * Math.PI;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.update(this.clock.getDelta() || 0.016);
    this.renderer.render(this.scene, this.camera);
  }

  getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  updateRankDisplay(rank) {
    if (this.rankEl) {
      this.rankEl.textContent = this.getOrdinal(rank);
    }
    this.currentRank = rank;
  }

  finishRace() {
    this.isRunning = false;
    this.clock.stop();
    this.overlay.classList.remove('hidden');
    const finalRank = this.getOrdinal(this.currentRank);
    this.overlay.innerHTML = `
            <div class="content" style="text-align: center;">
                <h1>🏆 RACE FINISHED!</h1>
                <p style="font-size: 24px; margin: 10px 0;">Final Position: <span style="color: var(--primary); font-weight: 900;">${finalRank}</span></p>
                <p style="font-size: 20px; margin: 10px 0; opacity: 0.8;">Final Time: ${this.time.toFixed(2)}s</p>
                <button id="start-btn" onclick="location.reload()">PLAY AGAIN</button>
            </div>
        `;
  }
}

new Game();
