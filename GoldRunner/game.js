const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const GRID_W = 20, GRID_H = 20, TILE_SIZE = 32;

// --- ASCII DATA MAP ---
const TILES = {
    EMPTY: ' ',
    BRICK: '#',
    BEDROCK: 'B',
    LADDER: 'H',
    ROPE: '-',
    GOLD: 'o',
    PLAYER: '@',
    GUARD: '+'
};

const COLORS = {
    BLACK: '#000000', WHITE: '#FFFFFF', GREEN: '#00FF44',
    RED: '#BB3322', BLUE: '#0055FF', GOLD: '#FFDD00',
    LADDER: '#EEEEEE', ROPE: '#AAAAAA'
};

// Sound Engine
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration, type = 'square') {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// --- ASSET LOADING ---
const assets = { player: new Image(), guard: new Image() };
assets.player.src = 'assets/player.png';
assets.guard.src = 'assets/guard.png';

class Entity {
    constructor(x, y, color) {
        this.px = x * TILE_SIZE;
        this.py = y * TILE_SIZE;
        this.color = color;
        this.speed = 2;
        this.dir = 1;
        this.animFrame = 0;
        this.state = 'idle';
        this.frameW = 80;
        this.frameH = 96;
        this.yOff = 2; // Offset to skip top border
    }
    get gx() { return Math.floor(this.px / TILE_SIZE); }
    get gy() { return Math.floor(this.py / TILE_SIZE); }

    draw(ctx, img) {
        if (!img || !img.complete) return;
        const s = TILE_SIZE;

        let row = 0;
        if (this.state === 'climb') row = 4;
        if (this.state === 'fall') row = 5;
        if (this.state === 'hang') row = 3;

        const maxFrames = 8;
        if (this.state !== 'idle') {
            this.animFrame = (this.animFrame + 0.15) % maxFrames;
        } else {
            this.animFrame = 0;
        }

        const col = Math.floor(this.animFrame);

        ctx.save();
        ctx.translate(this.px + s / 2, this.py + s / 2);
        if (this.dir === -1 && this.state !== 'climb') ctx.scale(-1, 1);

        const drawSize = s * 1.35;
        const px = 6, py = 4;
        // Restore literal 96px spacing for Player
        ctx.drawImage(
            img,
            col * this.frameW + px, row * this.frameH + this.yOff + py, this.frameW - px * 2, this.frameH - py * 2,
            -drawSize / 2, -drawSize / 2, drawSize, drawSize
        );
        ctx.restore();
    }
}

class Guard extends Entity {
    constructor(x, y) {
        super(x, y, COLORS.GREEN);
        this.speed = 1.4;
        this.trapped = 0;
        this.frameH = 110;
    }
    // Isolated surgical draw for Guard's 640px sheet
    draw(ctx, img) {
        if (!img || !img.complete) return;
        const s = TILE_SIZE, rowH = 106.66;
        let row = 0;
        if (this.state === 'climb') row = 4;
        if (this.state === 'fall') row = 5;
        if (this.state === 'hang') row = 3;

        const maxFrames = 8;
        this.animFrame = this.state !== 'idle' ? (this.animFrame + 0.15) % maxFrames : 0;
        const col = Math.floor(this.animFrame);

        ctx.save();
        ctx.translate(this.px + s / 2, this.py + s / 2);
        if (this.dir === -1 && this.state !== 'climb') ctx.scale(-1, 1);

        const drawSize = s * 1.35;
        const sx = col * this.frameW + 4;
        const sy = row * rowH + 4; // Absolute spacing for Guard sheet

        ctx.drawImage(
            img,
            sx, sy, 72, 98,
            -drawSize / 2, -drawSize / 2, drawSize, drawSize
        );
        ctx.restore();
    }
    update(game) {
        if (this.trapped > 0) {
            this.state = 'climb';
            if (--this.trapped === 0) { this.py -= TILE_SIZE; }
            return;
        }

        const s = this.speed;
        const gx = Math.round(this.px / TILE_SIZE);
        const gy = Math.round(this.py / TILE_SIZE);
        const isXAli = Math.abs(this.px - gx * TILE_SIZE) < 1;
        const isYAli = Math.abs(this.py - gy * TILE_SIZE) < 1;

        const curTile = game.get(gx, gy);
        const belTile = game.get(gx, Math.floor((this.py + TILE_SIZE) / TILE_SIZE));

        // Fall logic
        const wasFalling = this.state === 'fall';
        const mustFall = (belTile === TILES.EMPTY || belTile === TILES.ROPE || belTile === TILES.GOLD) &&
            curTile !== TILES.LADDER && (wasFalling || curTile !== TILES.ROPE) && isXAli;

        if (mustFall) {
            this.px = gx * TILE_SIZE;
            this.py += s * 1.5; this.state = 'fall';
            return;
        }
        if (wasFalling) { this.py = gy * TILE_SIZE; this.state = 'run'; }

        const p = game.player;
        const pGY = Math.round(p.py / TILE_SIZE);

        // 1. Vertical priority at junctions
        if (isXAli) {
            const upT = game.get(gx, gy - 1);
            const dnT = game.get(gx, gy + 1);
            if (pGY < gy && (curTile === TILES.LADDER || upT === TILES.LADDER)) {
                this.px = gx * TILE_SIZE; this.py -= s; this.state = 'climb'; return;
            }
            if (pGY > gy && (dnT === TILES.LADDER || (curTile === TILES.LADDER && this.py < (gy + 1) * TILE_SIZE))) {
                if (game.can(gx, gy + 1) || dnT === TILES.LADDER) {
                    this.px = gx * TILE_SIZE; this.py += s; this.state = 'climb'; return;
                }
            }
        }

        // 2. Horizontal: Seek target
        let tx = p.px;
        if (Math.round(p.py / TILE_SIZE) !== gy) {
            let bestDist = Infinity;
            for (let x = 0; x < GRID_W; x++) {
                if (game.get(x, gy) === TILES.LADDER || game.get(x, gy + 1) === TILES.LADDER) {
                    const d = Math.abs(x - gx);
                    if (d < bestDist) { bestDist = d; tx = x * TILE_SIZE; }
                }
            }
        }

        if (isYAli) {
            this.py = gy * TILE_SIZE;
            const dist = Math.abs(this.px - tx);
            if (dist > 4) { // Jitter deadzone
                const dx = this.px < tx ? 1 : -1;
                const nextX = this.px + dx * s;
                const checkGX = dx === 1 ? Math.floor((nextX + TILE_SIZE - 0.1) / TILE_SIZE) : Math.floor(nextX / TILE_SIZE);
                if (game.can(checkGX, gy)) {
                    this.px = nextX; this.dir = dx;
                    this.state = (curTile === TILES.ROPE) ? 'hang' : 'run';
                } else this.state = 'idle';
            } else {
                this.px = tx; this.state = 'idle';
            }
        }

        if (Math.abs(this.px - p.px) < 10 && Math.abs(this.py - p.py) < 10) this.state = 'idle';
    }
}

class Game {
    constructor() {
        canvas.width = canvas.height = 640;
        this.lives = 5; this.score = 0; this.level = 0; this.shake = 0;
        this.init(); this.loop();
    }
    init() {
        const d = LEVELS[this.level];
        // Safely parse map and pad short rows to GRID_W
        this.map = d.map.map(r => {
            let row = r.split('');
            while (row.length < GRID_W) row.push(TILES.EMPTY);
            return row;
        });

        // Viewport & Camera Setup (square viewport: width x height)
        this.viewport = d.viewport || GRID_W;
        canvas.width = this.viewport * TILE_SIZE;
        canvas.height = this.viewport * TILE_SIZE;
        this.cameraX = 0;
        this.cameraY = 0;

        let px = 10, py = 10;
        this.guards = [];
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                if (this.map[y][x] === TILES.PLAYER) { px = x; py = y; this.map[y][x] = TILES.EMPTY; }
                if (this.map[y][x] === TILES.GUARD) { this.guards.push(new Guard(x, y)); this.map[y][x] = TILES.EMPTY; }
            }
        }
        this.player = new Entity(px, py, COLORS.WHITE);
        this.holes = []; this.gold = 0; this.exit = false; this.inputs = {};
        this.map.forEach(r => r.forEach(t => { if (t === TILES.GOLD) this.gold++; }));
        document.getElementById('lives').innerText = this.lives.toString().padStart(2, '0');
        document.getElementById('level').innerText = (this.level + 1).toString().padStart(2, '0');
        this.bind();
        // Ensure canvas is scaled to fit the wrapper/display on init
        this.updateCanvasScaling();
    }
    bind() {
        const b = (id, k) => {
            const el = document.getElementById(id);
            if (!el) return;
            const down = (e) => { e.preventDefault(); this.inputs[k] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); };
            const up = (e) => { try { e.preventDefault(); } catch (e) {} this.inputs[k] = false; };
            el.addEventListener('pointerdown', down);
            el.addEventListener('pointerup', up);
            el.addEventListener('pointercancel', up);
            el.addEventListener('pointerleave', up);
            el.addEventListener('touchstart', down, { passive: false });
            el.addEventListener('touchend', up);
        };
        const dl = document.getElementById('btn-dig-left'), dr = document.getElementById('btn-dig-right');
        if (dl) {
            dl.addEventListener('pointerdown', (e) => { e.preventDefault(); this.dig(-1); });
            dl.addEventListener('touchstart', (e) => { e.preventDefault(); this.dig(-1); }, { passive: false });
        }
        if (dr) {
            dr.addEventListener('pointerdown', (e) => { e.preventDefault(); this.dig(1); });
            dr.addEventListener('touchstart', (e) => { e.preventDefault(); this.dig(1); }, { passive: false });
        }

        // Touch-to-move: pointer on canvas controls movement direction
        const canvasEl = canvas;
        let activePointer = null;
        let pointerStartX = 0, pointerStartY = 0;
        let snappedToLadder = false;
        const clearMove = () => { this.inputs.l = this.inputs.r = this.inputs.u = this.inputs.d = false; snappedToLadder = false; };

        const findNearbyLadderColumn = () => {
            // Search for a ladder column within +/-3 tiles of player
            const py = Math.round(this.player.py / TILE_SIZE);
            let best = { dist: Infinity, col: -1 };
            for (let x = 0; x < GRID_W; x++) {
                for (let y = Math.max(0, py - 2); y <= Math.min(GRID_H - 1, py + 2); y++) {
                    if (this.get(x, y) === TILES.LADDER) {
                        const dx = Math.abs(x - Math.round(this.player.px / TILE_SIZE));
                        if (dx <= 3 && dx < best.dist) { best = { dist: dx, col: x }; }
                    }
                }
            }
            return best.col >= 0 ? best.col : -1;
        };

        const handlePointer = (e, isMove = false) => {
            const rect = canvasEl.getBoundingClientRect();
            const x = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX)) - rect.left;
            const y = (e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY)) - rect.top;
            const w = rect.width, h = rect.height;

            // Horizontal left/right based on thirds (still useful)
            const wantLeft = x < w / 3;
            const wantRight = x > (w * 2 / 3);
            // compute vertical drag from pointer start
            const deltaY = y - pointerStartY; // positive => moved down, negative => moved up
            const vThreshold = Math.max(12, h * 0.05);

            if (isMove) {
                // Upwards drag -> climb (snap to ladder)
                if (-deltaY > vThreshold) {
                    this.inputs.u = true; this.inputs.d = false; this.inputs.l = false; this.inputs.r = false;
                    if (!snappedToLadder) {
                        const col = findNearbyLadderColumn();
                        if (col >= 0) {
                            this.player.px = col * TILE_SIZE;
                            snappedToLadder = true;
                        }
                    }
                    return;
                }

                // Downwards drag requires stronger intent and no horizontal desire
                if (deltaY > vThreshold && !wantLeft && !wantRight) {
                    this.inputs.d = true; this.inputs.u = false; this.inputs.l = false; this.inputs.r = false;
                    return;
                }

                // Otherwise apply horizontal movement and clear accidental verticals
                this.inputs.l = wantLeft;
                this.inputs.r = wantRight;
                this.inputs.u = false; this.inputs.d = false;
                return;
            }

            // Non-move (initial touch) use thirds but don't immediately set vertical unless clear
            this.inputs.l = wantLeft;
            this.inputs.r = wantRight;
            if (Math.abs(deltaY) < vThreshold) {
                this.inputs.u = false; this.inputs.d = false;
            } else {
                this.inputs.u = y < h / 3;
                this.inputs.d = y > (h * 2 / 3);
            }
        };

        canvasEl.addEventListener('pointerdown', (e) => { activePointer = e.pointerId; const rect = canvasEl.getBoundingClientRect(); pointerStartX = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX)) - rect.left; pointerStartY = (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY)) - rect.top; handlePointer(e, false); e.preventDefault(); }, { passive: false });
        canvasEl.addEventListener('pointermove', (e) => { if (activePointer === e.pointerId) { handlePointer(e, true); e.preventDefault(); } }, { passive: false });
        canvasEl.addEventListener('pointerup', (e) => { if (activePointer === e.pointerId) { activePointer = null; clearMove(); } }, { passive: false });
        canvasEl.addEventListener('pointercancel', () => { activePointer = null; clearMove(); });
        // Touch fallback
        canvasEl.addEventListener('touchstart', (e) => { const rect = canvasEl.getBoundingClientRect(); pointerStartX = e.touches[0].clientX - rect.left; pointerStartY = e.touches[0].clientY - rect.top; handlePointer(e, false); e.preventDefault(); }, { passive: false });
        canvasEl.addEventListener('touchmove', (e) => { handlePointer(e, true); e.preventDefault(); }, { passive: false });
        canvasEl.addEventListener('touchend', (e) => { clearMove(); }, { passive: false });

        // Keyboard handling
        window.addEventListener('keydown', (e) => {
            const map = { 'ArrowUp': 'u', 'ArrowDown': 'd', 'ArrowLeft': 'l', 'ArrowRight': 'r', 'z': 'dl', 'x': 'dr' };
            const k = map[e.key];
            if (!k) return;
            if (k === 'dl' || k === 'dr') this.dig(k === 'dl' ? -1 : 1);
            else this.inputs[k] = true;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            const map = { 'ArrowUp': 'u', 'ArrowDown': 'd', 'ArrowLeft': 'l', 'ArrowRight': 'r' };
            const k = map[e.key]; if (k) this.inputs[k] = false;
        });

        // Global pointerup to ensure inputs clear when releasing outside buttons
        window.addEventListener('pointerup', () => { this.inputs.l = this.inputs.r = this.inputs.u = this.inputs.d = false; });
        window.addEventListener('resize', () => this.updateCanvasScaling());
    }

    updateCanvasScaling() {
        const wrapper = document.getElementById('screen-wrapper');
        if (!wrapper) return;
        // Desired logical canvas size (game coordinate space)
        const desiredW = this.viewport * TILE_SIZE;
        const desiredH = this.viewport * TILE_SIZE;

        // Visible wrapper size (CSS pixels)
        const maxW = Math.min(wrapper.clientWidth, window.innerWidth);
        const maxH = Math.min(wrapper.clientHeight || window.innerHeight, window.innerHeight);

        // Scale down if wrapper is smaller than the logical size, but never upscale
        const scale = Math.min(maxW / desiredW, maxH / desiredH, 1);
        const displayW = Math.max(1, Math.floor(desiredW * scale));
        const displayH = Math.max(1, Math.floor(desiredH * scale));

        const dpr = window.devicePixelRatio || 1;
        // Set CSS display size (do NOT touch container styles)
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';

        // Internal canvas resolution in device pixels
        canvas.width = Math.round(desiredW * dpr);
        canvas.height = Math.round(desiredH * dpr);
        // Map drawing coordinates to logical CSS pixels
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Adjust action button sizes to be a consistent proportion of the canvas CSS width
        try {
            const cssCanvasW = displayW; // CSS pixels
            // choose a button ratio relative to canvas width (12% default)
            let btnSize = Math.round(cssCanvasW * 0.12);
            // clamp to sensible min/max
            btnSize = Math.max(40, Math.min(88, btnSize));
            const buttons = document.querySelectorAll('.action-btn');
            buttons.forEach(b => {
                b.style.width = btnSize + 'px';
                b.style.height = btnSize + 'px';
                b.style.fontSize = Math.max(12, Math.round(btnSize * 0.22)) + 'px';
            });
            // keep controls container compact relative to canvas
            const controls = document.getElementById('controls');
            if (controls) {
                controls.style.maxWidth = Math.round(cssCanvasW * 0.48) + 'px';
            }
        } catch (e) { /* ignore if DOM not ready */ }
    }
    get(x, y) { return (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) ? TILES.BEDROCK : this.map[y][x]; }
    can(x, y) { const t = this.get(x, y); return t !== TILES.BRICK && t !== TILES.BEDROCK; }
    dig(dir) {
        const x = this.player.gx + dir, y = this.player.gy + 1;
        if ((this.get(x, y) === TILES.BRICK) && this.get(x, y - 1) === TILES.EMPTY) {
            this.map[y][x] = TILES.EMPTY; this.holes.push({ x, y, t: 300 });
            playSound(150, 0.2, 'sawtooth');
            this.shake = 5;
        }
    }
    update() {
        if (this.shake > 0) this.shake--;
        const p = this.player;
        const s = p.speed;
        const curGX = Math.round(p.px / TILE_SIZE);
        const curGY = Math.round(p.py / TILE_SIZE);

        let isYAli = Math.abs(p.py - curGY * TILE_SIZE) < 1;
        let isXAli = Math.abs(p.px - curGX * TILE_SIZE) < 1;

        const curTile = this.get(curGX, curGY);
        const belTile = this.get(curGX, Math.floor((p.py + TILE_SIZE - 1 + s) / TILE_SIZE));

        const wasFalling = p.state === 'fall';
        const onLadder = (curTile === TILES.LADDER) || (p.py % TILE_SIZE !== 0 && (curTile === TILES.LADDER || belTile === TILES.LADDER));

        // Critical: Fall if not on ladder/rope AND (off-gap OR mid-air)
        const mustFall = (belTile === TILES.EMPTY || belTile === TILES.ROPE || belTile === TILES.GOLD) &&
            !onLadder && (curTile !== TILES.ROPE) && (isXAli || !isYAli || wasFalling);

        if (mustFall) {
            if (!wasFalling) p.px = curGX * TILE_SIZE;
            p.py += s * 2; p.state = 'fall';
        } else {
            if (wasFalling) {
                p.state = 'idle';
                p.py = curGY * TILE_SIZE;
            }
            if (isYAli && p.state !== 'climb') p.py = curGY * TILE_SIZE;
            if (this.inputs.l || this.inputs.r) {
                const dx = this.inputs.l ? -1 : 1;
                // Standard: Horizontal move if aligned with floor OR on a rope OR on a ladder
                if (isYAli || curTile === TILES.ROPE || onLadder) {
                    const nextX = p.px + dx * s;
                    // Check collision at both top and bottom of player (vital for mid-ladder exits)
                    const checkGX = (dx === 1) ? Math.floor((nextX + TILE_SIZE - 0.1) / TILE_SIZE) : Math.floor(nextX / TILE_SIZE);
                    const gy1 = Math.floor(p.py / TILE_SIZE);
                    const gy2 = Math.floor((p.py + TILE_SIZE - 1) / TILE_SIZE);

                    if (this.can(checkGX, gy1) && (isYAli || this.can(checkGX, gy2))) {
                        p.px = nextX; p.dir = dx;
                        const midGX = Math.round(p.px / TILE_SIZE);
                        const midGY = Math.round(p.py / TILE_SIZE);
                        if (this.get(midGX, midGY) === TILES.ROPE) p.state = 'hang';
                        else p.state = (onLadder && !isYAli ? 'climb' : 'run');
                    }
                }
            } else {
                if (p.state !== 'climb' && p.state !== 'fall') p.state = 'idle';
            }

            // Improved ladder tolerance: find nearest grid X and check if it's a ladder
            const nearGX = Math.round(p.px / TILE_SIZE);
            const isNearX = Math.abs(p.px - nearGX * TILE_SIZE) < (TILE_SIZE * 0.7);
            const tAtNear = this.get(nearGX, curGY);
            const bAtNear = this.get(nearGX, Math.floor((p.py + TILE_SIZE - 1 + s) / TILE_SIZE));
            const canUP_atNear = tAtNear === TILES.LADDER || (p.py % TILE_SIZE !== 0 && (tAtNear === TILES.LADDER || bAtNear === TILES.LADDER));
            const canDN_atNear = bAtNear === TILES.LADDER || (p.py % TILE_SIZE !== 0 && tAtNear === TILES.LADDER);

            if (this.inputs.u && isNearX && canUP_atNear) {
                p.px = nearGX * TILE_SIZE; p.py -= s; p.state = 'climb';
            } else if (this.inputs.d && isNearX && canDN_atNear) {
                p.px = nearGX * TILE_SIZE; p.py += s; p.state = 'climb';
            }
            if ((p.state === 'idle' || p.state === 'run' || p.state === 'hang') && !this.inputs.l && !this.inputs.r) {
                const midGX = Math.round(p.px / TILE_SIZE);
                const midGY = Math.round(p.py / TILE_SIZE);
                if (this.get(midGX, midGY) === TILES.ROPE) p.state = 'hang';
                else if (curTile === TILES.LADDER && p.py % TILE_SIZE !== 0) p.state = 'climb';
            }
        }

        const collGX = Math.round(p.px / TILE_SIZE);
        const collGY = Math.round(p.py / TILE_SIZE);
        if (this.get(collGX, collGY) === TILES.GOLD) {
            this.map[collGY][collGX] = TILES.EMPTY; this.gold--; this.score += 100;
            document.getElementById('score').innerText = this.score.toString().padStart(6, '0');
            playSound(1200, 0.1);
        }

        this.guards.forEach(g => {
            g.update(this);
            if (Math.abs(g.px - p.px) < 20 && Math.abs(g.py - p.py) < 20) this.die();
        });

        for (let i = this.holes.length - 1; i >= 0; i--) {
            if (--this.holes[i].t <= 0) {
                const h = this.holes[i]; this.map[h.y][h.x] = TILES.BRICK;
                if (p.gx === h.x && p.gy === h.y) this.die();
                this.guards.forEach(g => { if (g.gx === h.x && g.gy === h.y) { g.trapped = 100; g.px = h.x * TILE_SIZE; g.py = h.y * TILE_SIZE; } });
                this.holes.splice(i, 1);
            }
        }
        if (this.gold === 0 && !this.exit) {
            const exit = LEVELS[this.level].exit;
            exit.tiles.forEach(t => this.map[t.y][t.x] = TILES.LADDER);
            this.exit = true; playSound(800, 0.3);
        }
        if (p.gy < 0 && this.exit) { this.level = (this.level + 1) % LEVELS.length; this.init(); }

        // Camera Tracking
        const viewPx = this.viewport * TILE_SIZE;
        const totalPx = GRID_W * TILE_SIZE;
        const targetCamX = p.px - viewPx / 2 + TILE_SIZE / 2;
        this.cameraX = Math.max(0, Math.min(totalPx - viewPx, targetCamX));
        // Vertical camera (center on player, clamp so viewport stays within level)
        const totalPy = GRID_H * TILE_SIZE;
        const targetCamY = p.py - viewPx / 2 + TILE_SIZE / 2;
        this.cameraY = Math.max(0, Math.min(totalPy - viewPx, targetCamY));
    }
    die() {
        this.lives--; this.shake = 10;
        playSound(100, 0.5, 'sawtooth');
        if (this.lives < 0) { this.lives = 5; this.score = 0; this.level = 0; }
        this.init();
    }

    // --- PREMIUM PROCEDURAL DRAWING ---
    drawBrick(x, y) {
        const px = x * TILE_SIZE, py = y * TILE_SIZE;
        const s = TILE_SIZE;
        // Background base
        ctx.fillStyle = '#992211'; // Deep Brick Red
        ctx.fillRect(px, py, s, s);

        // Mortar lines
        ctx.fillStyle = '#220000';
        ctx.fillRect(px, py + s / 2 - 1, s, 2); // Horizontal middle
        ctx.fillRect(px, py + s - 1, s, 1);     // Horizontal bottom

        // Individual Bricks
        const drawSegment = (sx, sy, sw, sh, isTop) => {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(sx, sy + sh - 2, sw, 2);
            // Highlight
            ctx.fillStyle = isTop ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)';
            ctx.fillRect(sx, sy, sw, 2);
            ctx.fillRect(sx, sy, 2, sh);
        };

        // Row 1: Two half bricks
        drawSegment(px, py, s / 2 - 1, s / 2 - 1, true);
        drawSegment(px + s / 2 + 1, py, s / 2 - 1, s / 2 - 1, true);
        // Row 2: One offset brick
        drawSegment(px + 4, py + s / 2 + 1, s - 8, s / 2 - 2, false);
    }
    drawLadder(x, y) {
        const px = x * TILE_SIZE, py = y * TILE_SIZE;
        const s = TILE_SIZE;
        const time = Date.now() * 0.005;
        const shimmer = Math.sin(time + y) * 15;

        // 1. Rails with depth
        // Left Rail
        const railColorBase = 210 + shimmer;
        ctx.fillStyle = `rgb(${railColorBase - 20}, ${railColorBase - 20}, ${railColorBase - 20})`;
        ctx.fillRect(px + 4, py, 6, s); // Shadow side
        ctx.fillStyle = `rgb(${railColorBase + 20}, ${railColorBase + 20}, ${railColorBase + 20})`;
        ctx.fillRect(px + 4, py, 2, s); // Highlight side

        // Right Rail
        ctx.fillStyle = `rgb(${railColorBase - 20}, ${railColorBase - 20}, ${railColorBase - 20})`;
        ctx.fillRect(px + s - 10, py, 6, s);
        ctx.fillStyle = `rgb(${railColorBase + 20}, ${railColorBase + 20}, ${railColorBase + 20})`;
        ctx.fillRect(px + s - 10, py, 2, s);

        // 2. Rungs with shading
        const rungCount = 4;
        const rungSpacing = s / rungCount;
        for (let i = 0; i < rungCount; i++) {
            const ry = py + i * rungSpacing + 4;

            // Rung body
            ctx.fillStyle = `rgb(${railColorBase}, ${railColorBase}, ${railColorBase})`;
            ctx.fillRect(px + 4, ry, s - 8, 4);

            // Rung top highlight
            ctx.fillStyle = `rgba(255,255,255,0.4)`;
            ctx.fillRect(px + 4, ry, s - 8, 1);

            // Rung bottom shadow
            ctx.fillStyle = `rgba(0,0,0,0.4)`;
            ctx.fillRect(px + 4, ry + 3, s - 8, 1);

            // Metal caps where rung meets rail
            ctx.fillStyle = `rgba(0,0,0,0.2)`;
            ctx.fillRect(px + 4, ry, 2, 4);
            ctx.fillRect(px + s - 10, ry, 2, 4);
        }
    }

    drawRope(x, y) {
        const px = x * TILE_SIZE, py = y * TILE_SIZE;
        const s = TILE_SIZE;
        const midY = py + 12;

        // 1. Shadow for depth
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(px, midY + 2, s, 4);

        // 2. Bar Base (Segmented / Twisted look)
        const segments = 8;
        const segW = s / segments;

        for (let i = 0; i < segments; i++) {
            const sx = px + i * segW;

            // Alternate colors for a "twisted rope" or "notched metal" look
            const isAlt = i % 2 === 0;
            ctx.fillStyle = isAlt ? '#88AAFF' : '#5588EE';
            ctx.fillRect(sx, midY, segW, 4);

            // Highlight top
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(sx, midY, segW, 1);

            // Shadow bottom
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(sx, midY + 3, segW, 1);
        }

        // 3. Mount points if adjacent to blocks
        const leftT = this.get(x - 1, y);
        const rightT = this.get(x + 1, y);

        ctx.fillStyle = '#666';
        if (leftT === TILES.BRICK || leftT === TILES.BEDROCK) {
            ctx.fillRect(px, midY - 2, 4, 8); // Wall mount
        }
        if (rightT === TILES.BRICK || rightT === TILES.BEDROCK) {
            ctx.fillRect(px + s - 4, midY - 2, 4, 8); // Wall mount
        }
    }
    drawGold(x, y) {
        const px = x * TILE_SIZE, py = y * TILE_SIZE;
        const time = Date.now() * 0.01;
        const pulse = Math.sin(time) * 2;

        // Shiny gold coin
        const grad = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 10);
        grad.addColorStop(0, '#FFFCAA');
        grad.addColorStop(1, '#FFCC00');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px + 16, py + 16, 8 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Rim
        ctx.strokeStyle = '#EE9900';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px + 12, py + 12, 4, 4);
    }
    drawBlueBlock(x, y) {
        const px = x * TILE_SIZE, py = y * TILE_SIZE;
        const s = TILE_SIZE;

        // 1. Vibrant Sapphire Base (Solid, No blink)
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(px, py, s, s);

        // 2. Crystal Bevel Borders
        ctx.fillStyle = '#3b82f6'; // Bright highlight (Top/Left)
        ctx.fillRect(px, py, s, 4);
        ctx.fillRect(px, py, 4, s);

        ctx.fillStyle = '#172554'; // Deep shadow (Bottom/Right)
        ctx.fillRect(px, py + s - 4, s, 4);
        ctx.fillRect(px + s - 4, py, 4, s);

        // 3. Central Diamond Motif (Instead of a plus)
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + s / 2, py + 10);
        ctx.lineTo(px + s - 10, py + s / 2);
        ctx.lineTo(px + s / 2, py + s - 10);
        ctx.lineTo(px + 10, py + s / 2);
        ctx.closePath();
        ctx.stroke();

        // 4. Subtle Specular Corners
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(px + 4, py + 4, 3, 3);
        ctx.fillRect(px + s - 7, py + 4, 3, 3);
    }

    draw() {
        const dpr = window.devicePixelRatio || 1;
        const vw = canvas.width / dpr;
        const vh = canvas.height / dpr;
        ctx.fillStyle = COLORS.BLACK;
        ctx.fillRect(0, 0, vw, vh);
        ctx.save();
        ctx.translate(-this.cameraX, -this.cameraY);
        if (this.shake > 0) ctx.translate(Math.random() * 6 - 3, Math.random() * 6 - 3);

        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const t = this.map[y][x];
                if (t === TILES.BRICK) this.drawBrick(x, y);
                else if (t === TILES.BEDROCK) this.drawBlueBlock(x, y);
                else if (t === TILES.LADDER) this.drawLadder(x, y);
                else if (t === TILES.ROPE) this.drawRope(x, y);
                else if (t === TILES.GOLD) this.drawGold(x, y);
            }
        }
        this.holes.forEach(h => {
            ctx.fillStyle = COLORS.BLACK;
            ctx.fillRect(h.x * TILE_SIZE, h.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });

        this.player.draw(ctx, assets.player);
        this.guards.forEach(g => g.draw(ctx, assets.guard));
        ctx.restore();

        // Soft Vignette - Screen Space (use logical CSS pixels)
        const dpr2 = window.devicePixelRatio || 1;
        const vw2 = canvas.width / dpr2, vh2 = canvas.height / dpr2;
        const grad = ctx.createRadialGradient(vw2 / 2, vh2 / 2, vh2 * 0.4, vw2 / 2, vh2 / 2, vh2 * 0.8);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, vw2, vh2);
    }
    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }
}
new Game();
