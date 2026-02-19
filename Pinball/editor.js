const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const levelDataTextarea = document.getElementById('level-data');

let level = {
  description: 'New Level',
  backgroundColor: '#000000',
  wallColor: '#ffffff',
  wallLight: '#ffffff',
  wallDark: '#777777',
  backgroundImage: null,
  backgroundAlpha: 1,
  launchRandomness: 0,
  walls: [],
  elements: []
};

// Background image cache
let _bgImage = null;
let _bgImageSrc = null;

// Plunger state (shooter lane on right side)
let plungerActive = false;
let plungerStartY = 0;
let plungerPull = 0;
const PLUNGER_MAX_PULL = 140;
const PLUNGER_X = 770; // visual x position for plunger

let selectedTool = 'wall';
let currentWall = null;
let selectedItem = null;
let dragging = false;
let dragOffset = { x: 0, y: 0 };
let pointerDownPos = null;
let movedDuringDrag = false;
let suppressNextClick = false;

// Physics State
let isPlaying = false;
// Make the ball 1.5x larger (default 15) and keep trail data
let ball = { x: 770, y: 1100, vx: 0, vy: 0, r: 15, trail: [] };
let physicsInterval = null;
let keys = {};
let score = 0;
const SUB_STEPS = 8;
const GRAVITY = 2200;
const RESTITUTION = 0.6;
const FRICTION = 0.02;
const BUMPER_RESTITUTION = 1.2;
// `launchRandomness` on the level controls initial horizontal jitter (0 => straight)

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function ensureBgImageLoaded() {
  if (!level.backgroundImage) {
    _bgImage = null; _bgImageSrc = null; return;
  }
  if (_bgImageSrc === level.backgroundImage && _bgImage) return;
  _bgImageSrc = level.backgroundImage;
  _bgImage = new Image();
  _bgImage.crossOrigin = 'anonymous';
  _bgImage.onload = () => { /* loaded */ };
  // Fail silently if image cannot be loaded — fall back to background color
  _bgImage.onerror = () => { _bgImage = null; _bgImageSrc = null; };
  _bgImage.src = _bgImageSrc;
}

// Launch helper: accepts pull in range [0..1]
function launchBallFromPull(pullNorm) {
  const p = Math.max(0, Math.min(1, pullNorm || 0));
  // Use velocities (px/s) consistent with `game.js` scale so the ball moves up
  const minVy = 1200, maxVy = 3800;
  const launchVy = minVy + p * (maxVy - minVy);
  const jitter = (level.launchRandomness || 0) * (Math.random() * 2 - 1) * 2;
  ball.waiting = false;
  ball.vy = -launchVy;
  ball.vx = jitter;
  // keep ball near shooter lane to avoid tunnelling; align center with plunger
  ball.x = Math.min(canvas.width - ball.r - 6, PLUNGER_X);
  plungerActive = false;
  plungerPull = 0;
}

// Helper: temporarily press keys for touch/flipper taps
function triggerTempKeys(keysArr, duration = 150) {
  const prev = {};
  keysArr.forEach(k => { prev[k] = keys[k]; keys[k] = true; if (k.length === 1) keys[k.toLowerCase()] = true; });
  setTimeout(() => { keysArr.forEach(k => { keys[k] = !!prev[k]; if (k.length === 1) keys[k.toLowerCase()] = !!prev[k.toLowerCase()]; }); }, duration);
}

// Draw plunger rails and bar (draw this under walls)
function drawPlungerUnderlay() {
  const railX = PLUNGER_X;
  const railTop = 140;
  const railBottom = canvas.height - 80;
  ctx.save();
  // rails
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(railX - 10, railTop, 6, railBottom - railTop);
  ctx.fillRect(railX + 4, railTop, 6, railBottom - railTop);
  // Plunger base/shaft (visible in shooter lane)
  const px = PLUNGER_X - 5;
  const baseY = railBottom - 40;
  const pull = isPlaying ? plungerPull : 0;
  ctx.fillStyle = '#444';
  ctx.fillRect(px - 10, baseY + pull, 30, 100);
  // Metallic tip
  const pGrad = ctx.createLinearGradient(px - 15, 0, px + 15, 0);
  pGrad.addColorStop(0, '#888'); pGrad.addColorStop(0.5, '#fff'); pGrad.addColorStop(1, '#888');
  ctx.fillStyle = pGrad;
  ctx.fillRect(px - 7, baseY + pull - 5, 24, 15);
  // plunger bar (rest or pulled)
  const barY = baseY + Math.max(0, Math.min(PLUNGER_MAX_PULL, pull));
  const barW = 18, barH = 36;
  const g = ctx.createLinearGradient(railX - 6, barY, railX + 6, barY + barH);
  g.addColorStop(0, '#dddddd'); g.addColorStop(0.5, '#888888'); g.addColorStop(1, '#cccccc');
  ctx.fillStyle = g;
  const rx = railX - barW / 2, ry = barY, rw = barW, rh = barH, r = 4;
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
  ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
  ctx.arcTo(rx, ry + rh, rx, ry, r);
  ctx.arcTo(rx, ry, rx + rw, ry, r);
  ctx.closePath();
  ctx.fill();
  // small specular
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(railX - 6, barY + 4, 6, 6);
  ctx.restore();
}

function drawProceduralBackground(ctx) {
  // Removed as requested
}

// --- Toolbar and Load/Save (No Changes) ---
const toolbar = document.getElementById('toolbar');
toolbar.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const tool = e.target.id.replace('-tool', '');
    selectTool(tool);
  }
});
const _loadBtn = document.getElementById('load-button'); if (_loadBtn) _loadBtn.addEventListener('click', loadLevel);
const _saveBtn = document.getElementById('save-button'); if (_saveBtn) _saveBtn.addEventListener('click', saveLevel);
// New: load level.json directly
const _loadFileBtn = document.getElementById('load-file-button'); if (_loadFileBtn) _loadFileBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('level.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    level = normalizeLevel(data); // normalize after fetch
    levelDataTextarea.value = JSON.stringify(level, null, 2);
    // Update color inputs
      document.getElementById('bg-color').value = level.backgroundColor;
      // new: separate wall light/dark picks
      if (document.getElementById('wall-light')) document.getElementById('wall-light').value = level.wallLight || '#ffffff';
      if (document.getElementById('wall-dark')) document.getElementById('wall-dark').value = level.wallDark || '#777777';
  } catch (err) {
    alert('Failed to load level.json');
    console.error(err);
  }
});

// Update HUD and background controls
const _bgColor = document.getElementById('bg-color'); if (_bgColor) _bgColor.addEventListener('input', e => { level.backgroundColor = e.target.value; });
// wall light/dark controls (if present in DOM)
const wallLightInput = document.getElementById('wall-light');
const wallDarkInput = document.getElementById('wall-dark');
if (wallLightInput) wallLightInput.addEventListener('input', e => { level.wallLight = e.target.value; });
if (wallDarkInput) wallDarkInput.addEventListener('input', e => { level.wallDark = e.target.value; });
const _bgImageInput = document.getElementById('bg-image'); if (_bgImageInput) _bgImageInput.addEventListener('change', e => { level.backgroundImage = e.target.value; ensureBgImageLoaded(); });
const _bgAlpha = document.getElementById('bg-alpha'); if (_bgAlpha) _bgAlpha.addEventListener('input', e => { level.backgroundAlpha = parseFloat(e.target.value); });
const _launchRandom = document.getElementById('launch-random'); if (_launchRandom) _launchRandom.addEventListener('input', e => { level.launchRandomness = parseFloat(e.target.value); });

const _playToggle = document.getElementById('play-mode-toggle'); if (_playToggle) _playToggle.addEventListener('click', togglePlayMode);

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  keys[e.key.toLowerCase()] = true;
  // Spacebar quick-launch: behave like full plunger pull if not dragging
  if (e.code === 'Space' && isPlaying && ball.waiting) {
    const p = Math.max(0, Math.min(1, plungerPull / PLUNGER_MAX_PULL)) || 1;
    launchBallFromPull(p);
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  keys[e.key.toLowerCase()] = false;
});

function togglePlayMode() {
  isPlaying = !isPlaying;
  const btn = document.getElementById('play-mode-toggle');
  if (isPlaying) {
    btn.classList.add('playing');
    btn.innerText = 'Stop';
    startPhysics();
  } else {
    btn.classList.remove('playing');
    btn.innerText = 'Play';
    stopPhysics();
  }
}

function startPhysics() {
  score = 0;
  keys = {}; // Clear stale keys
  // Explicitly reset flippers to rest position
  level.elements.forEach(el => {
    if (el.type === 'flipper') {
      const isRight = !!el.isRight;
      el.currentRot = isRight ? (160 * Math.PI / 180) : (20 * Math.PI / 180);
    }
  });
  // Position ball at bottom of shooter lane
  // Place ball just above the plunger so it cannot fall below it while waiting
  // Position ball directly above the plunger center
  const startX = Math.min(canvas.width - (ball.r || 10) - 6, PLUNGER_X);
  const startBaseY = (canvas.height - 80) - 40; // matches drawPlungerUnderlay baseY
  const startY = startBaseY - (ball.r || 10) - 6;
  // Ball starts slightly larger (metallic feel)
  ball = { x: startX, y: startY, vx: 0, vy: 0, r: 15, waiting: true, trail: [] };
  if (physicsInterval) clearInterval(physicsInterval);
  physicsInterval = setInterval(updatePhysics, 16); // ~60fps
}

function stopPhysics() {
  clearInterval(physicsInterval);
  physicsInterval = null;
}

function updatePhysics() {
  // keep a short history to recover from numerical issues on launch
  if (!ball._history) ball._history = [];
  if (!ball._lastValid) ball._lastValid = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy };
  // 1. Update flipper rotation (Always, even if waiting)
  level.elements.forEach(el => {
    if (el.type === 'flipper') {
      const isRight = !!el.isRight;
      const active = isRight
        ? (keys['ArrowRight'] || keys['KeyK'] || keys['k'] || keys['KeyL'] || keys['l'] || keys['KeyM'] || keys['m'])
        : (keys['ArrowLeft'] || keys['KeyS'] || keys['s'] || keys['KeyD'] || keys['d'] || keys['KeyF'] || keys['f']);
      let restRot = isRight ? (160 * Math.PI / 180) : (20 * Math.PI / 180);
      let activeRot = isRight ? (200 * Math.PI / 180) : (-20 * Math.PI / 180);
      el.currentRot = el.currentRot || restRot;
      const targetRot = active ? activeRot : restRot;
      const rotSpeed = active ? 0.25 : 0.18; // Closer to game.js rad/frame
      if (el.currentRot < targetRot) el.currentRot = Math.min(targetRot, el.currentRot + rotSpeed);
      if (el.currentRot > targetRot) el.currentRot = Math.max(targetRot, el.currentRot - rotSpeed);
    }
  });

  // 2. Launch Wait
  if (ball.waiting) {
    if (plungerPull === 0 && keys['Space']) {
      // Allow space as a fallback for full launch if not dragging
      plungerPull = PLUNGER_MAX_PULL;
    }
    // Launch logic is handled by mouseup/touchend
    return;
  }

  // 3. Sub-steps loop
  // Adaptive sub-steps: increase resolution when ball is fast to avoid tunnelling
  const speed = Math.hypot(ball.vx, ball.vy);
  const steps = Math.max(SUB_STEPS, Math.min(64, Math.ceil(speed * 0.05)));
  const dt = 0.016 / steps; // Time step per sub-step (assuming 60fps)

  for (let s = 0; s < steps; s++) {
    ball.vy += GRAVITY * dt;
    // Removed air friction as requested (slow-motion fix)

    if (s === 0) {
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 30) ball.trail.shift();
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Safety Guard: if we detect invalid numbers, restore last valid state and damp velocities
    if (!isFinite(ball.x) || !isFinite(ball.y) || Math.abs(ball.vx) > 5000 || Math.abs(ball.vy) > 5000) {
      console.warn("Physics detected invalid ball state during sub-step", {
        step: s, pos: { x: ball.x, y: ball.y }, vel: { vx: ball.vx, vy: ball.vy }, lastValid: ball._lastValid, history: ball._history.slice(-8)
      });
      // restore last valid and damp velocities to avoid immediate re-trigger
      ball.x = ball._lastValid.x; ball.y = ball._lastValid.y;
      ball.vx = (ball._lastValid.vx || 0) * 0.3; ball.vy = (ball._lastValid.vy || 0) * 0.3;
      // do not force waiting; allow play to continue
      break;
    }

    // Bounds
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -0.8; }
    if (ball.x > canvas.width - ball.r) { ball.x = canvas.width - ball.r; ball.vx *= -0.8; }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -0.5; }
    if (ball.y > canvas.height + 100) {
      stopPhysics();
      togglePlayMode();
      console.log("Game Over - Ball Drained");
      return;
    }

    // Wall Collisions
    level.walls.forEach(wall => {
      const pts = wall.points;
      if (!pts || pts.length < 2) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const startHas = !!(p1.controls && p1.controls.c2);
        const endHas = !!(p2.controls && p2.controls.c1);
        if (startHas || endHas) {
          const c2 = startHas ? p1.controls.c2 : p1;
          const c1 = endHas ? p2.controls.c1 : p2;
          const samples = 48;
          let prev = { x: p1.x, y: p1.y };
          for (let sm = 1; sm <= samples; sm++) {
            const t = sm / samples;
            const curr = cubic(p1, c2, c1, p2, t);
            collideBallWithSegment(ball, prev, curr, RESTITUTION, FRICTION);
            prev = curr;
          }
        } else {
          collideBallWithSegment(ball, p1, p2, RESTITUTION, FRICTION);
        }
      }
    });

    // Element Collisions
    level.elements.forEach(el => {
      if (el.type === 'bumper') {
        const dist = Math.hypot(ball.x - el.position.x, ball.y - el.position.y);
        const r_hit = ball.r + (el.radius || 25);
        if (dist < r_hit) {
          const nx = (ball.x - el.position.x) / dist;
          const ny = (ball.y - el.position.y) / dist;

          // Positional correction (Prevent sinking)
          const pen = r_hit - dist;
          ball.x += nx * pen;
          ball.y += ny * pen;

          const vn = ball.vx * nx + ball.vy * ny;
          if (vn < 0) {
            ball.vx -= (1 + BUMPER_RESTITUTION) * vn * nx;
            ball.vy -= (1 + BUMPER_RESTITUTION) * vn * ny;
            score += 10;
          }
        }
      } else if (el.type === 'flipper') {
        const isRight = !!el.isRight;
        const active = isRight ? (keys['ArrowRight'] || keys['KeyM'] || keys['m']) : (keys['ArrowLeft'] || keys['KeyZ'] || keys['z']);
        const p1 = el.position;
        const L = el.length || 70;
        const p2 = { x: p1.x + Math.cos(el.currentRot) * L, y: p1.y + Math.sin(el.currentRot) * L };

        // Flipper "thickness" padding for collision
        const thickness = 10;
        const d = distPointToSeg(ball.x, ball.y, p1.x, p1.y, p2.x, p2.y);
        if (d < ball.r + thickness) {
          const savedR = ball.r;
          ball.r = savedR + thickness;
          collideBallWithSegment(ball, p1, p2, 0.4, 0.02);
          ball.r = savedR;

          // Velocity pulse based on flipper speed
          if (active) {
            const dx = ball.x - p1.x, dy = ball.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = dx / dist, ny = dy / dist;
            // Impulse scaled for substeps (total ~800 px/s over one frame)
            const boost = 800 * (1 / steps);
            ball.vx += nx * boost;
            ball.vy += ny * boost;
          }
        }
      }
    });
  }

  // Update history / last valid after completing sub-steps
  ball._history.push({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, t: Date.now() });
  if (ball._history.length > 120) ball._history.shift();
  if (isFinite(ball.x) && isFinite(ball.y)) ball._lastValid = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy };
}


// --- End Physics ---
// --- End Toolbar and Load/Save ---

function selectTool(tool) {
  if (currentWall) {
    if (currentWall.points.length > 1) level.walls.push(currentWall);
    currentWall = null;
  }
  selectedTool = tool;
  selectedItem = null;
  document.querySelectorAll('#toolbar button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`${tool}-tool`);
  if (btn) btn.classList.add('active');
}

function loadLevel() {
  try {
    const parsed = JSON.parse(levelDataTextarea.value);
    level = normalizeLevel(parsed); // normalize after paste
    document.getElementById('bg-color').value = level.backgroundColor;
    if (document.getElementById('wall-light')) document.getElementById('wall-light').value = level.wallLight || '#ffffff';
    if (document.getElementById('wall-dark')) document.getElementById('wall-dark').value = level.wallDark || '#777777';
    document.getElementById('bg-image').value = level.backgroundImage || '';
    document.getElementById('bg-alpha').value = level.backgroundAlpha ?? 1;
    document.getElementById('launch-random').value = level.launchRandomness ?? 0;
    ensureBgImageLoaded();
  } catch (e) { console.error('Invalid JSON data!'); }
}

function saveLevel() {
  levelDataTextarea.value = JSON.stringify(level, null, 2);
}

function draw() {
  // Rich Background Gradient
  const bg = level.backgroundColor || '#000000';
  if (bg === '#000000' || bg === '#000') {
    const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.height);
    grad.addColorStop(0, '#151525');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = level.backgroundColor || '#000000';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Background Image (Always at bottom)
  ensureBgImageLoaded();
  if (_bgImage && _bgImage.complete) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, level.backgroundAlpha || 1));
    const scale = canvas.width / _bgImage.width;
    const h = _bgImage.height * scale;
    ctx.drawImage(_bgImage, 0, 0, canvas.width, h);
    ctx.restore();
  }

  // Draw plunger under walls so it doesn't appear above wall geometry
  drawPlungerUnderlay();

  level.walls.forEach(wall => drawWall(wall, level.wallColor || 'black'));

  if (currentWall) {
    drawWall(currentWall, 'blue');
    // "If I click, the point doesnt appear immediately. Make sure points are visible in a different color"
    currentWall.points.forEach(p => {
      ctx.fillStyle = '#ff0'; // Yellow for new points
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  level.elements.forEach(element => drawElement(element));

  if (isPlaying) {
    // Draw Trail
    if (ball.trail) {
      ctx.lineWidth = 4;
      for (let i = 1; i < ball.trail.length; i++) {
        const p1 = ball.trail[i - 1];
        const p2 = ball.trail[i];
        ctx.strokeStyle = `rgba(0, 255, 255, ${i / ball.trail.length * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }


    // Draw ball (Metallic chrome finish)
    // Ground shadow (subtle)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 3, ball.y + 6, ball.r * 0.9, ball.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Main metallic body
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    const bGrad = ctx.createRadialGradient(ball.x - ball.r * 0.25, ball.y - ball.r * 0.25, ball.r * 0.05, ball.x, ball.y, ball.r * 1.2);
    bGrad.addColorStop(0, '#ffffff');
    bGrad.addColorStop(0.2, '#e6e6e6');
    bGrad.addColorStop(0.5, '#bfbfbf');
    bGrad.addColorStop(0.85, '#6e6e6e');
    bGrad.addColorStop(1, '#2f2f2f');
    ctx.fillStyle = bGrad;
    ctx.fill();

    // Thin rim highlight
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();

    // Specular highlight (small, sharp)
    const hx = ball.x - ball.r * 0.28, hy = ball.y - ball.r * 0.36;
    ctx.beginPath();
    ctx.ellipse(hx, hy, ball.r * 0.28, ball.r * 0.18, -0.6, 0, Math.PI * 2);
    const spec = ctx.createRadialGradient(hx - 1, hy - 1, 0, hx, hy, ball.r * 0.4);
    spec.addColorStop(0, 'rgba(255,255,255,0.98)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.fill();

    // Subtle lower reflection band to add chrome feel
    ctx.beginPath();
    const bandY = ball.y + ball.r * 0.25;
    ctx.ellipse(ball.x, bandY, ball.r * 0.85, ball.r * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();

    ctx.restore();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    ctx.fillText('SCORE: ' + score.toString().padStart(6, '0'), 30, 50);

    // Debug Monitor (Small and unobtrusive)
    ctx.font = '12px Courier New';
    ctx.shadowBlur = 0;
    ctx.fillText(`X:${Math.round(ball.x)} Y:${Math.round(ball.y)} | VX:${ball.vx.toFixed(1)} VY:${ball.vy.toFixed(1)}`, 30, 80);

    // Instructions when waiting for launch
    if (ball.waiting) {
      const pull = plungerPull;
      // Instructions if not dragging
      if (pull < 5) {
        ctx.save();
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.fillText('PULL DOWN TO LAUNCH', canvas.width / 2, canvas.height / 2 + 100);
        ctx.font = '20px sans-serif';
        ctx.fillText('Z / M or Arrows to Flip', canvas.width / 2, canvas.height / 2 + 150);
        ctx.restore();
      }
    }
  }

  if (selectedItem) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    if (selectedItem.wall) {
      selectedItem.wall.points.forEach(p => {
        if (!isPoint(p)) return;
        ctx.fillStyle = '#f0f'; // Magenta for selected wall points
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      if (selectedItem.point && isPoint(selectedItem.point)) {
        ctx.strokeStyle = '#0ff';
        ctx.beginPath();
        ctx.arc(selectedItem.point.x, selectedItem.point.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        if (selectedItem.point.controls) {
          const c1 = isPoint(selectedItem.point.controls?.c1) ? selectedItem.point.controls.c1 : null;
          const c2 = isPoint(selectedItem.point.controls?.c2) ? selectedItem.point.controls.c2 : null;
          if (c1) drawControlPoint(c1);
          if (c2) drawControlPoint(c2);
          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          if (c1) { ctx.beginPath(); ctx.moveTo(selectedItem.point.x, selectedItem.point.y); ctx.lineTo(c1.x, c1.y); ctx.stroke(); }
          if (c2) { ctx.beginPath(); ctx.moveTo(selectedItem.point.x, selectedItem.point.y); ctx.lineTo(c2.x, c2.y); ctx.stroke(); }
          ctx.setLineDash([]);
        }
      }
    } else if (selectedItem.position) {
      const pos = selectedItem.position;
      ctx.beginPath();
      ctx.rect(pos.x - 25, pos.y - 25, 50, 50);
      ctx.stroke();
    }
  }

  requestAnimationFrame(draw);
}

function collideBallWithSegment(b, A, B, e, mu) {
  const ABx = B.x - A.x, ABy = B.y - A.y;
  const APx = b.x - A.x, APy = b.y - A.y;
  const ab2 = ABx * ABx + ABy * ABy;
  if (ab2 === 0) return;
  let t_val = (APx * ABx + APy * ABy) / ab2;
  t_val = Math.max(0, Math.min(1, t_val));
  const Cx = A.x + ABx * t_val, Cy = A.y + ABy * t_val;
  let nx = b.x - Cx, ny = b.y - Cy;
  let dist2 = nx * nx + ny * ny;
  const r_ball = b.r;
  if (dist2 >= r_ball * r_ball) return;
  const dist = Math.sqrt(dist2) || 1e-6;
  nx /= dist; ny /= dist;
  const penetration = r_ball - dist;
  b.x += nx * penetration;
  b.y += ny * penetration;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    b.vx -= (1 + e) * vn * nx;
    b.vy -= (1 + e) * vn * ny;
    const tx = -ny, ty = nx;
    const vt = b.vx * tx + b.vy * ty;
    b.vx -= mu * vt * tx;
    b.vy -= mu * vt * ty;
  }
}

// Helper: cubic bezier point
function cubic(p0, p1, p2, p3, t) {
  const it = 1 - t;
  const x = it * it * it * p0.x + 3 * it * it * t * p1.x + 3 * it * t * t * p2.x + t * t * t * p3.x;
  const y = it * it * it * p0.y + 3 * it * it * t * p1.y + 3 * it * t * t * p2.y + t * t * t * p3.y;
  return { x, y };
}

// Helper: distance from point to segment AB
function distPointToSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return Math.hypot(px - ax, py - ay);
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + abx * t, cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}

// New: validators and normalizer to handle pasted JSON safely
function isPoint(p) { return p && typeof p.x === 'number' && typeof p.y === 'number'; }
function normalizeLevel(src) {
  const out = {
    description: src?.description || 'Level',
    backgroundColor: src?.backgroundColor || '#000000',
    wallColor: src?.wallColor || '#ffffff',
    backgroundImage: src?.backgroundImage || null,
    backgroundAlpha: typeof src?.backgroundAlpha === 'number' ? src.backgroundAlpha : 1,
    launchRandomness: typeof src?.launchRandomness === 'number' ? src.launchRandomness : 0,
    walls: [],
    elements: []
  };
  if (Array.isArray(src?.walls)) {
    for (const w of src.walls) {
      const pts = Array.isArray(w?.points) ? w.points.filter(isPoint).map(p => {
        const np = { x: +p.x, y: +p.y };
        if (p.controls) {
          const c1 = p.controls.c1; const c2 = p.controls.c2;
          const nc1 = isPoint(c1) ? { x: +c1.x, y: +c1.y } : undefined;
          const nc2 = isPoint(c2) ? { x: +c2.x, y: +c2.y } : undefined;
          if (nc1 || nc2) np.controls = { ...(nc1 ? { c1: nc1 } : {}), ...(nc2 ? { c2: nc2 } : {}) };
        }
        return np;
      }) : [];
      out.walls.push({ points: pts });
    }
  }
  if (Array.isArray(src?.elements)) {
    for (const el of src.elements) {
      if (!el || typeof el.type !== 'string') continue;
      const pos = el.position;
      if (!isPoint(pos)) continue;
      out.elements.push({
        type: el.type,
        position: { x: +pos.x, y: +pos.y },
        radius: el.radius,
        rotation: el.rotation,
        isRight: !!el.isRight // Preserve isRight
      });
    }
  }
  return out;
}

function drawWall(wall, color) {
  ctx.save();
  // Use separate dark/light wall colors for metallic gradient
  const dark = level.wallDark || '#777777';
  const light = level.wallLight || '#ffffff';
  const baseColor = dark;

  // Define the path once for multiple strokes
  const path = () => {
    ctx.beginPath();
    if (!wall.points || wall.points.length === 0) return;
    ctx.moveTo(wall.points[0].x, wall.points[0].y);
    for (let i = 0; i < wall.points.length - 1; i++) {
      const start = wall.points[i];
      const end = wall.points[i + 1];
      const startHas = !!(start.controls && start.controls.c2);
      const endHas = !!(end.controls && end.controls.c1);
      if (startHas || endHas) {
        const c2 = startHas ? start.controls.c2 : start;
        const c1 = endHas ? end.controls.c1 : end;
        ctx.bezierCurveTo(c2.x, c2.y, c1.x, c1.y, end.x, end.y);
      } else {
        ctx.lineTo(end.x, end.y);
      }
    }
  };

  // Layer 1: Thick neon base with glow
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = color === 'blue' ? 0 : 25;
  ctx.shadowColor = baseColor;
  path();
  ctx.stroke();

  // Layer 2: Inner highlight using wallLight
  ctx.shadowBlur = 0;
  ctx.strokeStyle = hexToRgba(light, 0.7);
  ctx.lineWidth = 6;
  path();
  ctx.stroke();

  // Layer 3: Thin crisp core
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  path();
  ctx.stroke();

  ctx.restore();
}

// Utility: convert hex color to rgba string with alpha
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawElement(element) {
  ctx.save();
  const pos = element.position;
  if (element.type === 'bumper') {
    // Pseudo-3D bumper with rim, inner glow and specular
    const R = element.radius || 25;
    // Outer rim (dark)
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, R + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,0,30,0.85)';
    ctx.fill();
    ctx.restore();

    // Slight elevation shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(pos.x + 2, pos.y + R * 0.45, R * 0.9, R * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Main colorful core
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff66ff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(pos.x - R * 0.25, pos.y - R * 0.35, 0, pos.x, pos.y, R);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.15, '#ffd6ff');
    grad.addColorStop(0.45, '#ff88ff');
    grad.addColorStop(1, '#b00088');
    ctx.fillStyle = grad;
    ctx.fill();

    // Thin chrome rim
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();

    // Inner ring for depth
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, R * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Specular crescent highlight
    ctx.beginPath();
    ctx.ellipse(pos.x - R * 0.32, pos.y - R * 0.45, R * 0.55, R * 0.28, -0.6, 0, Math.PI * 2);
    const spec = ctx.createLinearGradient(pos.x - R, pos.y - R, pos.x + R, pos.y + R);
    spec.addColorStop(0, 'rgba(255,255,255,0.85)');
    spec.addColorStop(0.6, 'rgba(255,255,255,0.05)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.fill();

    ctx.restore();
  } else if (element.type === 'slingshot') {
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 25);
    ctx.lineTo(pos.x - 22, pos.y + 25);
    ctx.lineTo(pos.x + 22, pos.y + 25);
    ctx.closePath();
    const sGrad = ctx.createLinearGradient(pos.x - 22, pos.y, pos.x + 22, pos.y);
    sGrad.addColorStop(0, '#ff4400');
    sGrad.addColorStop(0.5, '#ffaa00');
    sGrad.addColorStop(1, '#ff4400');
    ctx.fillStyle = sGrad;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner "slingshot" rubber detail
    ctx.beginPath();
    ctx.moveTo(pos.x - 12, pos.y - 10);
    ctx.lineTo(pos.x + 12, pos.y - 10);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.stroke();
  } else if (element.type === 'flipper') {
    ctx.translate(pos.x, pos.y);
    const isRight = !!element.isRight;
    let baseRot = isRight ? (160 * Math.PI / 180) : (20 * Math.PI / 180);

    // Draw Pivot point first so it's always visible at the "hinge"
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();

    const rot = (isPlaying && element.currentRot) ? element.currentRot : baseRot;
    ctx.rotate(rot);

    const L = element.length || 70;
    const W = 14; // Slightly wider flipper

    // Main body with depth: darker base + highlight strip
    ctx.save();
    // soft shadow under flipper for elevation
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';

    const fGrad = ctx.createLinearGradient(0, 0, L, 0);
    fGrad.addColorStop(0, '#005f6b');
    fGrad.addColorStop(0.35, '#00b8c4');
    fGrad.addColorStop(0.7, '#00888a');
    fGrad.addColorStop(1, '#004d52');
    ctx.fillStyle = fGrad;

    ctx.beginPath();
    // Capsule shape for flipper
    ctx.arc(0, 0, W, Math.PI / 2, 3 * Math.PI / 2);
    ctx.lineTo(L, -W / 2);
    ctx.arc(L, 0, W / 2, 3 * Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Thin bright edge on top
    ctx.beginPath();
    ctx.moveTo(6, -W * 0.6);
    ctx.lineTo(L - 6, -W * 0.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Subtle inner highlight strip
    ctx.beginPath();
    ctx.moveTo(10, -W * 0.2);
    ctx.lineTo(L - 10, -W * 0.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Outline
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Pivot Detail (metallic)
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    const pGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
    pGrad.addColorStop(0, '#fff');
    pGrad.addColorStop(0.5, '#cfcfcf');
    pGrad.addColorStop(1, '#666');
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.stroke();
  } else if (element.type === 'rollover') {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#a0f';
    const rGrad = ctx.createLinearGradient(pos.x - 20, 0, pos.x + 20, 0);
    rGrad.addColorStop(0, '#a0f');
    rGrad.addColorStop(0.5, '#fff');
    rGrad.addColorStop(1, '#a0f');
    ctx.fillStyle = rGrad;
    ctx.fillRect(pos.x - 20, pos.y - 4, 40, 8);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x - 20, pos.y - 4, 40, 8);
  } else if (element.type === 'target') {
    // Beveled target with inset and shiny top band
    const S = 30;
    ctx.save();
    // Shadow to lift target
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(0, 80, 0, 0.5)';
    const tGrad = ctx.createLinearGradient(pos.x - S / 2, pos.y - S / 2, pos.x + S / 2, pos.y + S / 2);
    tGrad.addColorStop(0, '#e8ffe8');
    tGrad.addColorStop(0.35, '#c8ffcc');
    tGrad.addColorStop(1, '#117711');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.roundRect(pos.x - 15, pos.y - 15, 30, 30, 6);
    ctx.fill();

    // Thin outer rim
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();

    // Inner inset to suggest depth
    ctx.beginPath();
    ctx.roundRect(pos.x - 11, pos.y - 11, 22, 22, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();

    // Shiny top band
    ctx.beginPath();
    ctx.roundRect(pos.x - 12, pos.y - 15, 24, 10, 4);
    const shine = ctx.createLinearGradient(0, pos.y - 15, 0, pos.y - 5);
    shine.addColorStop(0, 'rgba(255,255,255,0.85)');
    shine.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = shine;
    ctx.fill();

    ctx.restore();
  } else if (element.type === 'hole') {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 18, 0, 2 * Math.PI);
    const hGrad = ctx.createRadialGradient(pos.x, pos.y, 5, pos.x, pos.y, 18);
    hGrad.addColorStop(0, '#000');
    hGrad.addColorStop(0.8, '#222');
    hGrad.addColorStop(1, '#444');
    ctx.fillStyle = hGrad;
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner depth ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 14, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrid() {
  const gridSize = 50;
  // Use adaptive grid color based on background
  const bg = level.backgroundColor || '#000000';
  ctx.strokeStyle = (bg === '#000000' || bg === '#000') ? '#333' : '#eee';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function drawControlPoint(p) {
  ctx.beginPath();
  ctx.rect(p.x - 5, p.y - 5, 10, 10);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.fill();
}

function deleteSelectedItem() {
  if (!selectedItem) return;

  if (selectedItem.type) { // Elements have a type property
    const index = level.elements.indexOf(selectedItem);
    if (index > -1) level.elements.splice(index, 1);
  } else if (selectedItem.wall) {
    if (selectedItem.point) {
      // Deleting a specific point
      const wall = selectedItem.wall;
      const index = wall.points.indexOf(selectedItem.point);
      if (index > -1) {
        wall.points.splice(index, 1);
        if (wall.points.length < 2) {
          const wIndex = level.walls.indexOf(wall);
          if (wIndex > -1) level.walls.splice(wIndex, 1);
        }
      }
    } else {
      // Deleting the entire wall
      const index = level.walls.indexOf(selectedItem.wall);
      if (index > -1) level.walls.splice(index, 1);
    }
  }
  selectedItem = null;
}

const _delBtn = document.getElementById('delete-tool'); if (_delBtn) _delBtn.addEventListener('click', deleteSelectedItem);

canvas.addEventListener('mousedown', (e) => {
  const pos = getMousePos(e);

  if (isPlaying && ball.waiting && pos.x > canvas.width - 65) {
    plungerActive = true;
    plungerStartY = pos.y;
    plungerPull = 0;
    return;
  }
  // Bottom tap area to trigger flippers (quick play control)
  if (isPlaying && pos.y > canvas.height - 140) {
    if (pos.x < canvas.width / 2) {
      triggerTempKeys(['ArrowLeft', 'KeyZ', 'z'], 160);
    } else {
      triggerTempKeys(['ArrowRight', 'KeyM', 'm'], 160);
    }
    return;
  }
  pointerDownPos = pos;
  movedDuringDrag = false;

  const hoverItem = getSelectedItem(pos);

  if (hoverItem) {
    selectedItem = hoverItem;
    dragging = true;
    if (selectedItem.control) {
      dragOffset = { x: pos.x - selectedItem.point.controls[selectedItem.control].x, y: pos.y - selectedItem.point.controls[selectedItem.control].y };
    } else if (selectedItem.point) {
      dragOffset = { x: pos.x - selectedItem.point.x, y: pos.y - selectedItem.point.y };
      // If we clicked a point, show its handles
      if (!selectedItem.point.controls) {
        selectedItem.point.controls = {
          c1: { x: selectedItem.point.x - 30, y: selectedItem.point.y },
          c2: { x: selectedItem.point.x + 30, y: selectedItem.point.y }
        };
      }
    } else if (selectedItem.wall) {
      dragOffset = { x: pos.x - selectedItem.wall.points[0].x, y: pos.y - selectedItem.wall.points[0].y };
    } else {
      dragOffset = { x: pos.x - selectedItem.position.x, y: pos.y - selectedItem.position.y };
    }
    return;
  }

  if (selectedTool === 'wall') {
    if (!currentWall) {
      currentWall = { type: 'wall', points: [] };
    }
    const newPoint = { x: pos.x, y: pos.y };
    currentWall.points.push(newPoint);
  } else if (isElementTool(selectedTool)) {
    const el = { type: 'flipper', position: pos };
    if (selectedTool === 'right-flipper') {
      el.isRight = true;
    } else if (selectedTool === 'left-flipper') {
      el.isRight = false;
    } else {
      el.type = selectedTool;
    }
    level.elements.push(el);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const pos = getMousePos(e);

  if (isPlaying && plungerActive) {
    plungerPull = Math.max(0, Math.min(PLUNGER_MAX_PULL, pos.y - plungerStartY));
    return;
  }

  if (dragging && selectedItem) {
    if (pointerDownPos && !movedDuringDrag) {
      const dx0 = pos.x - pointerDownPos.x;
      const dy0 = pos.y - pointerDownPos.y;
      movedDuringDrag = Math.hypot(dx0, dy0) > 3;
    }

    if (selectedItem.control) {
      const point = selectedItem.point;
      const control = selectedItem.control;
      // Be defensive: ensure controls object and the specific control exist
      if (!point.controls) point.controls = {};
      if (!point.controls[control]) point.controls[control] = { x: point.x, y: point.y };
      point.controls[control].x = pos.x - dragOffset.x;
      point.controls[control].y = pos.y - dragOffset.y;
    } else if (selectedItem.point) {
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;
      const dx = newX - selectedItem.point.x;
      const dy = newY - selectedItem.point.y;
      selectedItem.point.x = newX;
      selectedItem.point.y = newY;
      // Move handles with the point to keep them attached
      if (selectedItem.point.controls) {
        if (selectedItem.point.controls.c1) { selectedItem.point.controls.c1.x += dx; selectedItem.point.controls.c1.y += dy; }
        if (selectedItem.point.controls.c2) { selectedItem.point.controls.c2.x += dx; selectedItem.point.controls.c2.y += dy; }
      }
    } else if (selectedItem.wall) {
      const dx = (pos.x - dragOffset.x) - selectedItem.wall.points[0].x;
      const dy = (pos.y - dragOffset.y) - selectedItem.wall.points[0].y;
      selectedItem.wall.points.forEach(p => {
        p.x += dx; p.y += dy;
        if (p.controls) {
          if (p.controls.c1) { p.controls.c1.x += dx; p.controls.c1.y += dy; }
          if (p.controls.c2) { p.controls.c2.x += dx; p.controls.c2.y += dy; }
        }
      });
    } else if (selectedItem.position) {
      selectedItem.position.x = pos.x - dragOffset.x;
      selectedItem.position.y = pos.y - dragOffset.y;
    }
  }

  updateCursor(pos);
});

canvas.addEventListener('mouseup', (e) => {
  if (isPlaying && plungerActive) {
    if (plungerPull > 6 && ball.waiting) {
      const p = Math.max(0, Math.min(1, plungerPull / PLUNGER_MAX_PULL));
      launchBallFromPull(p);
    }
    plungerActive = false;
    plungerPull = 0;
    e.preventDefault();
    return;
  }
  dragging = false;
  pointerDownPos = null;
});

// Touch controls for Plunger / Mobile
canvas.addEventListener('touchstart', (e) => {
  if (!isPlaying) return;
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const tx = (t.clientX - rect.left) * (canvas.width / rect.width);
  const ty = (t.clientY - rect.top) * (canvas.height / rect.height);

  // Plunger touch (shooter lane)
  if (ball.waiting && tx > canvas.width - 65) {
    plungerActive = true;
    plungerStartY = ty;
    plungerPull = 0;
    e.preventDefault();
    return;
  }

  // Bottom tap areas: left/right to toggle flippers briefly
  if (ty > canvas.height - 140) {
    if (tx < canvas.width / 2) {
      triggerTempKeys(['ArrowLeft', 'KeyZ', 'z'], 160);
    } else {
      triggerTempKeys(['ArrowRight', 'KeyM', 'm'], 160);
    }
    e.preventDefault();
    return;
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (isPlaying && plungerActive) {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const ty = (t.clientY - rect.top) * (canvas.height / rect.height);
    plungerPull = Math.max(0, Math.min(PLUNGER_MAX_PULL, ty - plungerStartY));
    e.preventDefault();
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (isPlaying && plungerActive) {
    if (plungerPull > 6 && ball.waiting) {
      const p = Math.max(0, Math.min(1, plungerPull / PLUNGER_MAX_PULL));
      launchBallFromPull(p);
    }
    plungerActive = false;
    plungerPull = 0;
  }
}, { passive: false });

canvas.addEventListener('dblclick', (e) => {
  if (selectedTool === 'wall' && currentWall) {
    if (currentWall.points.length > 1) level.walls.push(currentWall);
    currentWall = null;
  }
});

canvas.addEventListener('click', (e) => {
  if (suppressNextClick) { suppressNextClick = false; return; }

  const pos = getMousePos(e);
  const clickedItem = getSelectedItem(pos);

  if (clickedItem && clickedItem.point && !clickedItem.control) {
    const point = clickedItem.point;
    // "when click on a point, I should get the spline controls to edit the curve"
    if (!point.controls) {
      point.controls = {
        c1: { x: point.x - 30, y: point.y },
        c2: { x: point.x + 30, y: point.y }
      };
    } else if (!movedDuringDrag) {
      // Toggle off if clicked exactly without dragging
      // point.controls = null; 
    }
    selectedItem = clickedItem;
  } else if (clickedItem) {
    selectedItem = clickedItem;
  } else if (!currentWall) {
    selectedItem = null;
  }
});

function getSelectedItem(pos) {
  // Prefer handles/anchors first for precision
  for (const wall of level.walls) {
    const pts = Array.isArray(wall?.points) ? wall.points : [];
    for (const p of pts) {
      if (!isPoint(p)) continue;
      // Handles (if visible)
      if (selectedItem && (selectedItem.point === p || selectedItem.wall === wall)) {
        const c1 = p.controls?.c1, c2 = p.controls?.c2;
        if (isPoint(c1) && Math.hypot(pos.x - c1.x, pos.y - c1.y) < 10) return { wall, point: p, control: 'c1' };
        if (isPoint(c2) && Math.hypot(pos.x - c2.x, pos.y - c2.y) < 10) return { wall, point: p, control: 'c2' };
      }
      // Anchor points
      if (p && typeof p.x === 'number' && Math.hypot(pos.x - p.x, pos.y - p.y) < 10) return { wall, point: p };
    }
  }

  // Elements (topmost first)
  for (let i = level.elements.length - 1; i >= 0; i--) {
    const element = level.elements[i];
    const p = element?.position;
    if (isPoint(p) && Math.hypot(pos.x - p.x, pos.y - p.y) < 15) return element;
  }

  // Walls: segment hit-test to allow selecting/moving an entire wall
  const threshold = 6; // pixels
  for (const wall of level.walls) {
    const pts = Array.isArray(wall?.points) ? wall.points : [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (!isPoint(a) || !isPoint(b)) continue;
      const startHas = isPoint(a.controls?.c2);
      const endHas = isPoint(b.controls?.c1);
      if (startHas || endHas) {
        // Sample bezier into short segments
        const c2 = startHas ? a.controls.c2 : { x: a.x, y: a.y };
        const c1 = endHas ? b.controls.c1 : { x: b.x, y: b.y };
        const samples = 16;
        let prev = { x: a.x, y: a.y };
        for (let s = 1; s <= samples; s++) {
          const t = s / samples;
          const p = cubic(a, c2, c1, b, t);
          const d = distPointToSeg(pos.x, pos.y, prev.x, prev.y, p.x, p.y);
          if (d < threshold) return { wall };
          prev = p;
        }
      } else {
        const d = distPointToSeg(pos.x, pos.y, a.x, a.y, b.x, b.y);
        if (d < threshold) return { wall };
      }
    }
  }
  return null;
}

function updateCursor(pos) {
  const item = getSelectedItem(pos);
  if (item) {
    canvas.style.cursor = 'move';
  } else if (selectedTool === 'wall') {
    canvas.style.cursor = 'crosshair';
  } else if (isElementTool(selectedTool)) {
    canvas.style.cursor = 'copy';
  } else {
    canvas.style.cursor = 'default';
  }
}

function isElementTool(tool) {
  return ['left-flipper', 'right-flipper', 'bumper', 'slingshot', 'rollover', 'target', 'hole', 'ramp'].includes(tool);
}

draw();