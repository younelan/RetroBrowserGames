import * as THREE from 'three';
import Bike from './Bike.js';
import Road from './Road.js';
import Projectile from './Projectile.js';
import Hazard from './Hazard.js';
import Particles from './Particles.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');

        // Initialize Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#87ceeb');

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);

        // Sun
        const sunGeo = new THREE.SphereGeometry(400, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: '#f1c40f' });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        this.sun.position.set(0, 8000, 1000);
        this.scene.add(this.sun);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.resize();

        this.score = 0;
        this.papers = 10;
        this.lives = 3;
        this.isRunning = false;

        // Lighting
        this.setupLights();

        this.bike = new Bike(this);
        this.road = new Road(this);
        this.projectiles = [];
        this.hazards = [];
        this.effects = [];
        this.particles = new Particles(this);

        this.lastTime = performance.now();
        this.setupEventListeners();

        // Initial render
        this.draw();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(2000, 4000, 6000);
        dirLight.castShadow = true;

        dirLight.shadow.camera.left = -2000;
        dirLight.shadow.camera.right = 2000;
        dirLight.shadow.camera.top = 2000;
        dirLight.shadow.camera.bottom = -2000;
        dirLight.shadow.camera.far = 10000;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0001;

        this.scene.add(dirLight);
        this.dirLight = dirLight;

        // Warm "Golden Hour" hemisphere light
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x2ecc71, 0.6);
        this.scene.add(hemiLight);
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('overlay').classList.add('hidden');
            this.start();
        });

        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            if (e.code === 'Space') {
                this.throwPaper();
            }
        });

        // Mobile Tap to Throw
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        window.addEventListener('touchend', (e) => {
            if (!this.isRunning) return;
            const duration = Date.now() - touchStartTime;
            const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
            const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);

            // If touch was short and didn't move much, it's a tap
            if (duration < 250 && deltaX < 15 && deltaY < 15) {
                this.throwPaper();
            }
        });
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.spawnHazards();
        requestAnimationFrame((t) => this.loop(t));
    }

    spawnHazards() {
        if (this.hazardInterval) clearInterval(this.hazardInterval);
        this.hazardInterval = setInterval(() => {
            if (!this.isRunning) return;
            const type = Math.random() > 0.5 ? 'dog' : 'skateboarder';
            const x = (Math.random() - 0.5) * 300;
            const y = this.bike.position.y + 1200;
            this.hazards.push(new Hazard(this, type, x, y));
        }, 4000);
    }

    throwPaper() {
        if (this.papers > 0) {
            this.papers--;
            document.getElementById('papers').innerText = this.papers;
            const direction = this.bike.position.x < 0 ? -1 : 1;
            this.projectiles.push(new Projectile(this, this.bike.position.x, this.bike.position.y, direction));
        }
    }

    update(dt) {
        this.bike.update(dt);
        this.road.update(dt, this.bike.position.y);

        this.projectiles = this.projectiles.filter(p => !p.dead);
        this.projectiles.forEach(p => p.update(dt));

        this.hazards = this.hazards.filter(h => !h.dead);
        this.hazards.forEach(h => h.update(dt));

        this.particles.update(dt);

        // Horizontal, further back camera
        this.camera.position.set(
            this.bike.position.x,
            this.bike.position.y - 600,
            400
        );
        this.camera.lookAt(this.bike.position.x, this.bike.position.y + 200, 100);

        // Update light to follow bike
        this.dirLight.position.set(
            this.bike.position.x + 200,
            this.bike.position.y + 500,
            800
        );
        this.sun.position.y = this.bike.position.y + 12000;
        this.sun.position.x = this.bike.position.x * 0.5;
        this.dirLight.target = this.bike.mesh;

        this.checkBikeCollisions();
    }

    checkBikeCollisions() {
        const segs = this.road.segments;
        segs.forEach(seg => {
            if (seg.obstacleMesh) {
                const dx = this.bike.position.x - seg.obstacle.x;
                const relY = Math.abs(this.bike.position.y - (seg.y + 20));
                if (relY < 25 && Math.abs(dx) < 25) {
                    if (seg.obstacle.type === 'papers') {
                        this.papers = Math.min(this.papers + 5, 20);
                        document.getElementById('papers').innerText = this.papers;
                        this.scene.remove(seg.obstacleMesh);
                        seg.obstacleMesh = null;
                    } else {
                        this.crash();
                    }
                }
            }
            // Car collision (both sides)
            const cars = [seg.leftCarMesh, seg.rightCarMesh];
            cars.forEach(car => {
                if (car) {
                    const dx = this.bike.position.x - car.position.x;
                    const dy = Math.abs(this.bike.position.y - (seg.y + car.position.y));
                    if (dy < 60 && Math.abs(dx) < 40) {
                        this.crash();
                    }
                }
            });
        });
    }

    crash() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.lives--;
        this.updateLivesUI();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            setTimeout(() => this.resetAfterCrash(), 1500);
        }
    }

    updateLivesUI() {
        const livesIcons = document.getElementById('lives-icons');
        livesIcons.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const icon = document.createElement('div');
            icon.className = 'bike-icon';
            livesIcons.appendChild(icon);
        }
    }

    resetAfterCrash() {
        this.bike.reset();
        this.road.reset();

        // Clear hazards and projectiles
        this.hazards.forEach(h => this.scene.remove(h.mesh));
        this.hazards = [];
        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.projectiles = [];

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    gameOver() {
        document.getElementById('overlay').classList.remove('hidden');
        document.querySelector('.overlay-content h1').innerText = 'GAME OVER';
        document.getElementById('start-btn').innerText = 'RETRY';
        this.score = 0;
        this.papers = 10;
        this.lives = 3;
        this.updateScore(0);
        this.updateLivesUI();
        document.getElementById('papers').innerText = this.papers;

        this.bike.reset();
        this.road.reset();
        this.hazards.forEach(h => this.scene.remove(h.mesh));
        this.hazards = [];
        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.projectiles = [];
    }

    draw() {
        this.renderer.render(this.scene, this.camera);
    }

    loop(time) {
        if (!this.isRunning) return;
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    updateScore(amount) {
        this.score += amount;
        document.getElementById('score').innerText = this.score.toString().padStart(6, '0');
    }
}

window.onload = () => {
    window.game = new Game();
};
