/**
 * Pitfall! Retro Remix v2
 * Focus: Visual Excellence & Robust Mechanics
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 160;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;
const SCALE = CANVAS_WIDTH / SCREEN_WIDTH;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- ASSET LOADING ---
const ASSETS = { loaded: false, imgs: {} };
const assetNames = ['hero', 'croc', 'log', 'treasure', 'tree', 'tree2', 'tree3'];
let assetsLoadedCount = 0;

assetNames.forEach(name => {
    const img = new Image();
    img.src = `assets/${name}.png`;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const xctx = c.getContext('2d');
        xctx.drawImage(img, 0, 0);
        // Remove white background (assumes white background from AI generation)
        const imgData = xctx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                data[i + 3] = 0; // Transparent
            }
        }
        xctx.putImageData(imgData, 0, 0);
        const tImg = new Image();
        tImg.src = c.toDataURL();
        ASSETS.imgs[name] = tImg;
        assetsLoadedCount++;
        if (assetsLoadedCount === assetNames.length) {
            ASSETS.loaded = true;
            if (!state.running) renderFrame();
        }
    };
});

// Colors & Design Tokens
const COLORS = {
    SKY_TOP: '#81d4fa',
    SKY_BOTTOM: '#29b6f6',
    LEAVES_DARK: '#1b5e20',
    LEAVES_MID: '#2e7d32',
    LEAVES_LIGHT: '#4caf50',
    TRUNK: '#4e342e',
    GROUND: '#388e3c',
    WATER: '#0288d1',
    WATER_SHIMMER: '#03a9f4',
    PIT: '#212121',
    GOLD: '#ffd600',
    DIRT: '#5d4037',
    HARRY_HAT: '#a1887f',
    HARRY_SHIRT: '#ffffff',
    HARRY_PANTS: '#2e7d32',
    HARRY_SKIN: '#ffccbc',
    HARRY_STOOL: '#795548'
};

// Game State
// Game State
const MAP_SIZE = 255;
const mapData = new Uint8Array(MAP_SIZE);

function initMap() {
    let lfsr = 0xC4; // Authentic seed
    for (let i = 0; i < MAP_SIZE; i++) {
        mapData[i] = lfsr;
        let b3 = (lfsr >> 3) & 1;
        let b4 = (lfsr >> 4) & 1;
        let b5 = (lfsr >> 5) & 1;
        let b7 = (lfsr >> 7) & 1;
        let nb = b3 ^ b4 ^ b5 ^ b7;
        lfsr = ((lfsr << 1) | nb) & 0xFF;
    }
}

let state = {
    worldX: 0,
    worldY: 0,
    player: {
        x: 20,
        y: 80,
        vx: 0,
        vy: 0,
        width: 10,
        height: 18,
        isJumping: false,
        isClimbing: false,
        isSwinging: false,
        isCrouching: false,
        direction: 1,
        animFrame: 0,
        jumpPower: -5.5,
        ropeCooldown: 0
    },
    rope: {
        angle: 0,
        dir: 1,
        speed: 0.04
    },
    score: 0,
    time: 20 * 60,
    lives: 3,
    running: false,
    initialized: false,
    collectedTreasures: {}
};

// --- CORE UTILS ---

function getCurrentScreen() {
    // Handling cave vs surface logic: Cave screens are essentially shifted. 
    // In authentic Pitfall, cave moves backwards by 3 units, but here we just shift a bit or use same pattern 
    // depending on depth, to keep navigation consistent visually.
    const screenX = ((state.worldX % MAP_SIZE) + MAP_SIZE) % MAP_SIZE;

    const surfaceByte = mapData[screenX];
    const isTop = (state.worldY === 0);
    const byte = isTop ? surfaceByte : mapData[(screenX + state.worldY * 13) % MAP_SIZE];

    const hazardType = byte & 0x07;
    let hasPit = false;
    let pitType = 'none';
    let obstacles = [];

    switch (hazardType) {
        case 1: case 2: case 3:
            obstacles.push({ type: 'logs', count: hazardType, x: 100 });
            break;
        case 4: hasPit = true; pitType = 'water'; break;
        case 5: hasPit = true; pitType = 'tar'; break;
        case 6: hasPit = true; pitType = 'quicksand'; break;
        case 7: hasPit = true; pitType = 'crocodiles'; break;
    }

    const treeDensity = ((byte >> 3) & 0x07) + 3; // ensure minimum lushness
    const treeSeeds = [];
    for (let i = 0; i < treeDensity; i++) {
        treeSeeds.push(((byte ^ (i * 17)) * 31) & 0xFF);
    }

    const treasureType = (byte >> 6) & 0x03;
    const treasures = [];
    if (treasureType > 0 && state.worldY === 0) {
        const types = ['none', 'money', 'gold', 'diamond'];
        const tId = `${state.worldX}_${state.worldY}`;
        if (!state.collectedTreasures[tId]) {
            treasures.push({ id: tId, type: types[treasureType], x: 80, y: 75 });
        }
    }

    // Authentic Pitfall logic: Ladders ALWAYS match the surface directly above!
    let ladders = [];
    if (surfaceByte % 3 === 0) {
        ladders.push({ x: 130, y1: isTop ? 80 : -20, y2: isTop ? 180 : 140 });
    }

    const holes = [];
    if (isTop && hazardType >= 4) {
        holes.push({ x: 50, w: 60, platformIdx: 0 }); // Hazard Pit
    }
    if (isTop && ladders.length > 0) {
        holes.push({ x: 128, w: 14, platformIdx: 0, isLadder: true }); // Visual Hole for Ladder
    }

    return {
        type: isTop ? 'jungle' : 'cave',
        platforms: isTop ? [
            { y: 80, x: 0, w: 160, type: 'grass' }
        ] : [
            { y: 140, x: 0, w: 160, type: 'stone' } // Single underground floor
        ],
        holes: holes,
        ladders: ladders,
        obstacles: isTop ? obstacles : [], // Hazards only on surface usually
        hasRope: isTop && hazardType >= 4 && (byte % 2 === 0),
        hasPit: isTop && hasPit,
        pitType,
        treeSeeds,
        treasures
    };
}

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
}

// --- RENDERING ENGINE ---

function drawHarry(p) {
    if (!ASSETS.loaded || !ASSETS.imgs.hero) return; // Wait for assets

    const px = Math.floor(p.x * SCALE);
    const py = Math.floor(p.y * SCALE); // py is the floor level (feet)
    const pw = p.width * SCALE;

    ctx.save();
    // Translate to center of hit box horizontally, and floor vertically
    ctx.translate(px + pw / 2, py);
    if (p.direction === -1) ctx.scale(-1, 1);

    // Subtle modern squash/stretch
    let squashY = 1, squashX = 1;
    if (p.isJumping || p.vy > 1) {
        squashY = 1.05; squashX = 0.95;
    } else if (p.vy === 0 && Math.abs(p.vx) > 0.1) {
        ctx.rotate(0.05);
    }
    ctx.scale(squashX, squashY);

    // Draw Hero image.
    const drawSize = 36 * SCALE;
    // Offset X to center horizontally, offset Y to place feet at the bottom
    const offsetX = -drawSize / 2;
    const offsetY = -drawSize * 0.85; // shift up so his feet touch 0

    // Active walk wobble
    const walkPhase = p.animFrame * 0.8;
    const wobbleY = (Math.abs(p.vx) > 0.1 && !p.isJumping) ? Math.abs(Math.sin(walkPhase)) * 2 * SCALE : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, pw * 0.8, pw * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(ASSETS.imgs.hero, offsetX, offsetY - wobbleY, drawSize, drawSize);

    ctx.restore();
}

function renderBackground(screen) {
    if (!screen) return;

    if (screen.type === 'jungle') {
        const sky = ctx.createLinearGradient(0, 0, 0, 80 * SCALE);
        sky.addColorStop(0, COLORS.SKY_TOP);
        sky.addColorStop(1, COLORS.SKY_BOTTOM);
        drawRect(0, 0, SCREEN_WIDTH, 80, sky);

        if (screen.treeSeeds) {
            screen.treeSeeds.forEach((seed, i) => {
                const tx = (seed % SCREEN_WIDTH);

                if (ASSETS.loaded && ASSETS.imgs.tree && ASSETS.imgs.tree2 && ASSETS.imgs.tree3) {
                    const treeType = seed % 3;
                    const img = [ASSETS.imgs.tree, ASSETS.imgs.tree2, ASSETS.imgs.tree3][treeType];
                    const scaleF = Math.max(0.4, (seed % 100) / 100) * 0.4;
                    const drawW = img.width * scaleF * SCALE;
                    const drawH = img.height * scaleF * SCALE;
                    // Draw tree so the roots sink slightly into the grass
                    ctx.drawImage(img, tx * SCALE - drawW / 2, 80 * SCALE - drawH + 12 * SCALE, drawW, drawH);
                } else {
                    const tw = 20 + (seed % 10);
                    const th = 60 + (seed % 15);
                    drawRect(tx, 80 - th, tw / 4, th, COLORS.TRUNK);
                    ctx.fillStyle = i % 2 === 0 ? COLORS.LEAVES_MID : COLORS.LEAVES_DARK;
                    for (let j = 0; j < 3; j++) {
                        ctx.beginPath();
                        ctx.arc((tx + tw / 8) * SCALE, (80 - th + j * 6) * SCALE, (tw - j * 2) * SCALE, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        }

        // Proper Cross-Section
        // Surface grass with texture
        ctx.fillStyle = COLORS.GROUND;
        ctx.fillRect(0, 80 * SCALE, SCREEN_WIDTH * SCALE, 4 * SCALE);
        ctx.fillStyle = COLORS.LEAVES_LIGHT;
        for (let i = 0; i < SCREEN_WIDTH; i += 4) {
            ctx.fillRect((i + (state.worldX % 2) * 2) * SCALE, 79 * SCALE, 1.5 * SCALE, 2 * SCALE);
        }

        // Deep dirt with gradient and texture
        const dirt = ctx.createLinearGradient(0, 84 * SCALE, 0, SCREEN_HEIGHT * SCALE);
        dirt.addColorStop(0, '#5D4037');
        dirt.addColorStop(1, '#3E2723');
        ctx.fillStyle = dirt;
        ctx.fillRect(0, 84 * SCALE, SCREEN_WIDTH * SCALE, (SCREEN_HEIGHT - 84) * SCALE);

        ctx.fillStyle = '#4E342E';
        for (let i = 0; i < 40; i++) {
            // Predictable pseudo-random dirt specks based on world coordinates
            const rx = (((i * 17) + state.worldX * 31) % SCREEN_WIDTH);
            const ry = 86 + (((i * 23) + state.worldX * 13) % (SCREEN_HEIGHT - 86));
            ctx.fillRect(rx * SCALE, ry * SCALE, 2 * SCALE, 1.5 * SCALE);
        }

        // Excavated tunnel
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 110 * SCALE, SCREEN_WIDTH * SCALE, 30 * SCALE); // Tunnel Background
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(0, 106 * SCALE, SCREEN_WIDTH * SCALE, 4 * SCALE); // Tunnel ceiling outline
    } else {
        drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, '#1a1a1a');
        const wallW = 12;
        drawRect(0, 0, wallW, SCREEN_HEIGHT, '#3e2723');
        drawRect(SCREEN_WIDTH - wallW, 0, wallW, SCREEN_HEIGHT, '#3e2723');
        ctx.fillStyle = '#2d1a10';
        for (let i = 0; i < 3; i++) drawRect(20 + i * 40, 20 + i * 30, 25, 12, '#2d1a10');
    }

    if (screen.platforms) {
        screen.platforms.forEach((p, idx) => {
            const isGrass = (screen.type === 'jungle' && idx === 0);
            if (isGrass) {
                drawRect(p.x, p.y, p.w, 4, COLORS.GROUND);
            } else {
                // Stone brick texture for cave floor
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(p.x * SCALE, p.y * SCALE, p.w * SCALE, 4 * SCALE);

                ctx.fillStyle = '#3e2723';
                for (let i = 0; i < p.w; i += 8) {
                    ctx.fillRect((p.x + i) * SCALE, (p.y + 1 + (i % 2 === 0 ? 0 : 2)) * SCALE, 1 * SCALE, 2 * SCALE);
                    ctx.fillRect((p.x + i) * SCALE, p.y * SCALE, 8 * SCALE, 1 * SCALE);
                    ctx.fillRect((p.x + i) * SCALE, (p.y + 4) * SCALE, 8 * SCALE, 1 * SCALE);
                }
            }
        });
    }

    if (screen.holes) {
        screen.holes.forEach(h => {
            const plat = screen.platforms[h.platformIdx];
            if (plat) {
                // Dig through the dirt all the way to the tunnel
                drawRect(h.x, plat.y, h.w, 4, '#1A1A1A');
                drawRect(h.x, plat.y + 4, h.w, 110 - plat.y - 4, '#1A1A1A'); // Hole down to tunnel
            }
        });
    }

    if (screen.ladders) {
        screen.ladders.forEach(l => {
            const railColor = '#8d6e63';
            const rungColor = '#d7ccc8';
            drawRect(l.x - 1, l.y1, 1.5, l.y2 - l.y1, railColor);
            drawRect(l.x + 8.5, l.y1, 1.5, l.y2 - l.y1, railColor);
            for (let r = l.y1 + 4; r < l.y2; r += 6) drawRect(l.x, r, 9, 1.5, rungColor);
        });
    }

    if (screen.hasPit) {
        const px = 50, pw = 60;
        let pitColor = '#1a1a1a'; // deep hole color
        let surfaceColor = pitColor;

        if (screen.pitType === 'water') surfaceColor = COLORS.WATER_SHIMMER;
        else if (screen.pitType === 'quicksand') surfaceColor = '#d7ccc8'; // Sandy
        else if (screen.pitType === 'crocodiles') surfaceColor = COLORS.WATER_SHIMMER;
        else if (screen.pitType === 'tar') surfaceColor = '#212121';

        // Draw the fluid surface with gradient
        const liquid = ctx.createLinearGradient(0, 80 * SCALE, 0, 120 * SCALE);
        liquid.addColorStop(0, surfaceColor);
        liquid.addColorStop(1, pitColor);
        ctx.fillStyle = liquid;
        ctx.fillRect(px * SCALE, 80 * SCALE, pw * SCALE, (110 - 80) * SCALE);

        // Add details to liquid
        if (screen.pitType === 'water' || screen.pitType === 'crocodiles') {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            const t = Date.now() / 200;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect((px + 5 + i * 12 + t % 10) * SCALE, (84 + i * 4) * SCALE, 8 * SCALE, 1.5 * SCALE);
            }
        } else if (screen.pitType === 'quicksand') {
            // Flowing mud ripples instead of gray dot speckles
            ctx.fillStyle = '#8d6e63';
            const phase = (Date.now() / 150) % 10;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect((px + 5 + i * 14 - phase) * SCALE, (84 + i * 2) * SCALE, 6 * SCALE, 1 * SCALE);
                ctx.fillRect((px + 12 + i * 14 + phase) * SCALE, (85 + i * 2) * SCALE, 4 * SCALE, 1 * SCALE);
            }
        } else if (screen.pitType === 'tar') {
            // Bubbling tar surface
            ctx.fillStyle = '#111111';
            const t = Date.now() / 300;
            for (let i = 0; i < 5; i++) {
                const bx = px + 8 + i * 10;
                const by = 84 + Math.sin(t + i) * 4;
                ctx.beginPath();
                ctx.arc(bx * SCALE, by * SCALE, (5 + Math.sin(t + i * 2) * 1.5) * SCALE, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (screen.pitType === 'crocodiles') {
            const crocBaseX = px;
            for (let i = 0; i < 3; i++) {
                const cx = crocBaseX + 6 + i * 18;
                const phase = Date.now() / 600 + i;
                const open = (Math.sin(phase) > 0);

                ctx.save();
                ctx.translate(cx * SCALE, 80 * SCALE);

                if (ASSETS.loaded && ASSETS.imgs.croc) {
                    const drawSize = 18 * SCALE;
                    if (!open) {
                        ctx.scale(1, 0.6); // simulate closing jaw by flattening image
                    }
                    ctx.drawImage(ASSETS.imgs.croc, -drawSize / 2 + 3 * SCALE, -drawSize + 8 * SCALE, drawSize, drawSize);
                }

                ctx.restore();
            }
        }
    }

    if (screen.obstacles) {
        screen.obstacles.forEach(obs => {
            if (obs.type === 'logs') {
                const count = obs.count || 1;
                for (let i = 0; i < count; i++) {
                    const lx = obs.x + i * 50 - (Date.now() / 15 % 160);
                    const realX = ((lx % 160) + 160) % 160;

                    ctx.save();
                    ctx.translate(realX * SCALE, 80 * SCALE);

                    if (ASSETS.loaded && ASSETS.imgs.log) {
                        const drawSize = 18 * SCALE;
                        const rot = (Date.now() / 150) % (Math.PI * 2);
                        // Shift center of rotation
                        ctx.translate(5 * SCALE, -5 * SCALE);
                        ctx.rotate(-rot); // rolling
                        ctx.drawImage(ASSETS.imgs.log, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                    }
                    ctx.restore();
                }
            }
        });
    }

    if (screen.treasures) {
        screen.treasures.forEach(t => {
            const tx = t.x * SCALE;
            const ty = (t.y - 2) * SCALE; // bump up slightly

            ctx.save();
            ctx.translate(tx, ty);

            // Floating bounce
            const floatOffset = Math.sin(Date.now() / 200 + t.x) * 2 * SCALE;
            ctx.translate(5 * SCALE, 5 * SCALE + floatOffset);

            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 10;

            if (ASSETS.loaded && ASSETS.imgs.treasure) {
                const drawSize = 20 * SCALE;
                ctx.drawImage(ASSETS.imgs.treasure, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            }

            ctx.restore();
        });
    }

}

function renderFrame() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const screen = getCurrentScreen();
    if (!screen) return;

    renderBackground(screen);

    if (screen.hasRope) {
        const pivotX = 80 * SCALE;
        const pivotY = 20 * SCALE;
        const ropeLen = 58;
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 1.5 * SCALE;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        const endX = (80 + Math.sin(state.rope.angle) * ropeLen) * SCALE;
        const endY = (15 + Math.cos(state.rope.angle) * ropeLen) * SCALE;
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    drawHarry(state.player);
}

// --- GAME LOOP ---

function update() {
    const p = state.player;
    const screen = getCurrentScreen();
    if (!screen || !state.running) return;

    if (p.ropeCooldown > 0) p.ropeCooldown--;

    if (p.isSwinging) {
        state.rope.angle += state.rope.dir * state.rope.speed;
        if (Math.abs(state.rope.angle) > Math.PI / 4) state.rope.dir *= -1;
        const ropeLen = 58;
        p.x = 80 + Math.sin(state.rope.angle) * ropeLen;
        p.y = 15 + Math.cos(state.rope.angle) * ropeLen;
    } else {
        // Climbing bounds Check
        let touchingLadder = false;
        let ladderCenterX = 0;
        if (screen.ladders) {
            screen.ladders.forEach(l => {
                if (p.x + p.width > l.x && p.x < l.x + 8) {
                    if (p.y >= l.y1 - 18 && p.y <= l.y2) {
                        touchingLadder = true;
                        ladderCenterX = l.x + 4 - p.width / 2;
                    }
                }
            });
        }

        if (touchingLadder) {
            if (!p.isClimbing && (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'])) {
                p.isClimbing = true;
                p.x = ladderCenterX; // snap
                p.vx = 0; p.vy = 0;
            }
        } else {
            p.isClimbing = false;
        }

        if (p.isClimbing) {
            p.vx = 0;
            if (Math.abs(p.x - ladderCenterX) > 1) {
                p.x += (ladderCenterX - p.x) * 0.2;
            } else {
                p.x = ladderCenterX;
            }

            if (keys['ArrowUp'] || keys['w']) {
                p.y -= 2;
                p.vy = 0;
                p.animFrame += 0.2;
            } else if (keys['ArrowDown'] || keys['s']) {
                p.y += 2;
                p.vy = 0;
                p.animFrame += 0.2;
            } else {
                p.vy = 0;
            }

            // Allow dismounting by moving left/right
            if ((keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d']) &&
                !(keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'])) {
                p.isClimbing = false;
            }
        } else {
            p.vx = 0;
            p.isCrouching = false;
            if (keys['ArrowRight'] || keys['d']) { p.vx = 2.2; p.direction = 1; }
            if (keys['ArrowLeft'] || keys['a']) { p.vx = -2.2; p.direction = -1; }
            if ((keys['ArrowDown'] || keys['s']) && !p.isJumping) p.isCrouching = true;

            p.x += p.isCrouching ? p.vx * 0.5 : p.vx;
            if (Math.abs(p.vx) > 0) p.animFrame += 0.2;
        }

        let groundY = 1000;
        if (screen.platforms) {
            screen.platforms.forEach((plat, idx) => {
                // Check if horizontally within platform bounds
                if (p.x + p.width > plat.x && p.x < plat.x + plat.w) {
                    const inHole = screen.holes && screen.holes.some(h =>
                        !h.isLadder && h.platformIdx === idx && (p.x + p.width / 2 > h.x && p.x + p.width / 2 < h.x + h.w)
                    );

                    if (!inHole) {
                        // Find the highest platform that is AT or BELOW the player's previous/current feet position
                        // We allow a generous lookback (p.y - p.vy - 10) to catch high speed falls
                        if (p.vy >= 0 && plat.y >= (p.y - p.vy - 10) && plat.y < groundY) {
                            groundY = plat.y;
                        }
                    } else if (idx === 0) {
                        if (screen.pitType === 'quicksand') {
                            if (plat.y + 12 < groundY) groundY = plat.y + 12; // Sinking depth
                        }
                    }
                }
            });
        }

        if (!p.isClimbing) {
            if (p.y < groundY) {
                p.vy += 0.5; // gravity
            }

            // If applying gravity pushed us past or exactly onto the ground, snap and stop
            if (p.y + p.vy >= groundY) {
                p.y = groundY;
                p.vy = 0;
                p.isJumping = false;
            } else {
                p.y += p.vy;
            }
        }

        // --- HAZARD COLLISIONS ---
        if (!p.isSwinging) {
            // Crocodiles
            if (screen.pitType === 'crocodiles' && p.y <= 90 && p.y > 60 && Math.abs(p.x - 80) < 30) {
                const open = (Math.sin(Date.now() / 600) > 0);
                if (open) die();
            }
            // Water/Tar Falls
            if (screen.hasPit && p.y > 85 && p.y < 120 && Math.abs(p.x + p.width / 2 - 80) < 25) {
                if (screen.pitType === 'water' || screen.pitType === 'tar') {
                    die();
                }
            }
            // Logs
            if (screen.obstacles) {
                screen.obstacles.forEach(obs => {
                    if (obs.type === 'logs') {
                        const count = obs.count || 1;
                        for (let i = 0; i < count; i++) {
                            const lx = obs.x + i * 50 - (Date.now() / 30 % 160);
                            const realX = ((lx % 160) + 160) % 160;
                            if (Math.abs(p.x - realX) < 10 && Math.abs(p.y - 80) < 5) {
                                state.score = Math.max(0, state.score - 1); // Point penalty
                            }
                        }
                    }
                });
            }
            // Treasures
            if (screen.treasures) {
                for (let i = screen.treasures.length - 1; i >= 0; i--) {
                    const t = screen.treasures[i];
                    if (Math.abs(p.x - t.x) < 10 && Math.abs(p.y - t.y) < 10) {
                        const values = { money: 200, gold: 500, diamond: 1000 };
                        state.score += values[t.type] || 100;
                        state.collectedTreasures[t.id] = true;
                        screen.treasures.splice(i, 1);
                        updateUI();
                    }
                }
            }
        }

        // For climbing we already handled p.y updates directly, but just in case:
        if (p.isClimbing) {
            // Let climbing logic control Y completely
        }
    }

    // Transitions
    if (p.y > SCREEN_HEIGHT + 15) {
        if (state.worldY < 3 - 1) { // 3 layers deep
            state.worldY++; p.y = -10; onScreenChange();
        } else die();
    } else if (p.y < -15) {
        if (state.worldY > 0) {
            state.worldY--; p.y = SCREEN_HEIGHT + 10; onScreenChange();
        } else p.y = 0;
    }

    if (p.x > SCREEN_WIDTH) {
        if (state.worldX < MAP_SIZE - 1) {
            state.worldX++; p.x = 5; onScreenChange();
        } else p.x = SCREEN_WIDTH;
    } else if (p.x < 0) {
        if (state.worldX > 0) {
            state.worldX--; p.x = SCREEN_WIDTH - 5; onScreenChange();
        } else p.x = 0;
    }

    // Rope Catch
    if (screen.hasRope && !p.isSwinging && p.y < 100 && p.ropeCooldown === 0) {
        const rx = 80 + Math.sin(state.rope.angle) * 58;
        const ry = 15 + Math.cos(state.rope.angle) * 58;
        if (Math.abs(p.x - rx) < 12 && Math.abs(p.y - ry) < 12) {
            p.isSwinging = true; p.vx = 0; p.vy = 0;
        }
    }

    renderFrame();
    if (state.running) requestAnimationFrame(update);
}

function onScreenChange() {
    state.rope.angle = 0; state.rope.dir = 1; updateUI();
}

function die() {
    state.lives--;
    if (state.lives <= 0) {
        state.running = false;
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        state.player.x = 20; state.player.y = 80; state.player.vy = 0;
        state.player.isSwinging = false; updateUI();
    }
}

// --- INITIALIZATION ---

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    const p = state.player;
    const screen = getCurrentScreen();
    if (!screen) return;

    if (p.isSwinging && [' ', 'ArrowUp', 'w', 'ArrowRight', 'd', 'ArrowLeft', 'a'].includes(e.key)) {
        p.isSwinging = false; p.isJumping = true; p.ropeCooldown = 40; p.vy = -6;
        const boost = 7;
        if (e.key === 'ArrowRight' || e.key === 'd') p.vx = boost;
        else if (e.key === 'ArrowLeft' || e.key === 'a') p.vx = -boost;
        else p.vx = state.rope.dir * boost;
        keys[e.key] = false; e.preventDefault(); return;
    }
    // Jump only if not climbing
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !p.isJumping && !p.isSwinging && !p.isClimbing) {
        p.vy = p.jumpPower; p.isJumping = true;
    }
    if (!state.running && state.initialized) startGame();
});
window.addEventListener('keyup', e => keys[e.key] = false);

function updateUI() {
    document.getElementById('score-val').textContent = state.score.toString().padStart(6, '0');
    // We map 255 screens into worldX
    document.getElementById('screen-info').textContent = `X:${state.worldX % MAP_SIZE} Y:${state.worldY}`;
    const livesDiv = document.getElementById('lives-icons');
    livesDiv.innerHTML = '';
    for (let i = 0; i < state.lives; i++) {
        const heart = document.createElement('span'); heart.textContent = '🏃';
        livesDiv.appendChild(heart);
    }
}

function startGame() {
    if (state.lives <= 0) {
        state.lives = 3; state.score = 0; state.worldX = 0; state.worldY = 0;
        state.player.x = 20; state.player.y = 80;
    }
    state.running = true;
    document.getElementById('overlay').classList.add('hidden');
    requestAnimationFrame(update);
}

setInterval(() => {
    if (state.running) {
        state.time--; if (state.time <= 0) die(); updateUI();
    }
}, 1000);

initMap();
state.initialized = true;
updateUI();
renderFrame();
