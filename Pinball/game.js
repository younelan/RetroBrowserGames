// Basic canvas and timing
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const HUD = document.getElementById('hud');
const W = canvas.width, H = canvas.height;

// Background image cache
let _bgImage = null;
let _bgImageSrc = null;
// Track failed background URLs to avoid repeated 404 retries
let _bgImageFailed = new Set();

function ensureBgImageLoaded() {
  if (!level.backgroundImage) {
    _bgImage = null; _bgImageSrc = null; return;
  }
  if (_bgImageFailed.has(level.backgroundImage)) { _bgImage = null; _bgImageSrc = null; return; }
  if (_bgImageSrc === level.backgroundImage && _bgImage) return;
  _bgImageSrc = level.backgroundImage;
  _bgImage = new Image();
  _bgImage.crossOrigin = 'anonymous';
  _bgImage.onload = () => { /* loaded */ };
  _bgImage.onerror = () => { _bgImageFailed.add(_bgImageSrc); _bgImage = null; _bgImageSrc = null; };
  _bgImage.src = _bgImageSrc;
}

// Game constants
const GRAVITY = 2200;            // px/s^2
const RESTITUTION = 0.6;         // wall bounce
const FRICTION = 0.02;           // tangent damping on wall
const BUMPER_RESTITUTION = 1.2;  // lively bumper bounce
const BALL_RADIUS = 12;
const STEP = 1 / 60;

// Flippers
function toRad(deg) { return deg * Math.PI / 180; }
function makeFlipper({ pivot, length, restDeg, activeDeg, isRight }) {
  return {
    pivot, length, isRight,
    angle: toRad(restDeg),
    rest: toRad(restDeg),
    active: toRad(activeDeg),
    upSpeed: 9.0,
    downSpeed: 7.0,
    thickness: 10,
    pressed: false,
    omega: 0
  };
}
const flippers = [];
function initFlippers() {
  flippers.length = 0;
  for (const el of level.elements) {
    if (el.type === 'flipper') {
      const isRight = !!el.isRight;
      const restDeg = isRight ? 160 : 20;
      const activeDeg = isRight ? 110 : 70;
      flippers.push(makeFlipper({
        pivot: { x: el.position.x, y: el.position.y },
        length: el.length || 140,
        restDeg: el.restDeg || restDeg,
        activeDeg: el.activeDeg || activeDeg,
        isRight: isRight
      }));
    }
  }
}
// Level (loaded by loader.js into window.LEVELS)
const level = (window.LEVELS && window.LEVELS[0]) || { description: 'Empty', walls: [], elements: [] };

// For backward compatibility if level.json doesn't have flippers yet
if ((level.elements || []).filter(el => el.type === 'flipper').length === 0) {
  level.elements = level.elements || [];
  level.elements.push({ type: 'flipper', position: { x: 260, y: 1080 }, isRight: false });
  level.elements.push({ type: 'flipper', position: { x: 540, y: 1080 }, isRight: true });
}

// Initialize flippers after we have the level
initFlippers();

// Build render + collision segments from walls (bezier sampling if needed)
let wallSegments = [];
function cubic(p0, p1, p2, p3, t) {
  const it = 1 - t;
  const x = it * it * it * p0.x + 3 * it * it * t * p1.x + 3 * it * t * t * p2.x + t * t * t * p3.x;
  const y = it * it * it * p0.y + 3 * it * it * t * p1.y + 3 * it * t * t * p2.y + t * t * t * p3.y;
  return { x, y };
}
function rebuildSegments() {
  wallSegments = [];
  for (const wall of level.walls) {
    const pts = wall.points || [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const hasStart = !!(a.controls && a.controls.c2);
      const hasEnd = !!(b.controls && b.controls.c1);
      if (hasStart || hasEnd) {
        const c2 = hasStart ? a.controls.c2 : { x: a.x, y: a.y };
        const c1 = hasEnd ? b.controls.c1 : { x: b.x, y: b.y };
        const samples = 18;
        let prev = { x: a.x, y: a.y };
        for (let s = 1; s <= samples; s++) {
          const t = s / samples;
          const p = cubic(a, c2, c1, b, t);
          wallSegments.push({ a: prev, b: p });
          prev = p;
        }
      } else {
        wallSegments.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
      }
    }
  }
}
rebuildSegments();

// Ball state
const ballStart = { x: 765, y: 1080 }; // shooter lane
const ball = {
  x: ballStart.x,
  y: ballStart.y,
  vx: 0,
  vy: 0,
  r: BALL_RADIUS,
  inShooter: true
};

let score = 0;
let ballsLeft = 3;

// Stronger plunger
let plungerActive = false;
let plungerStartY = 0;
let plungerPull = 0;
const plungerMax = 220; // was 160

// Input
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    flippers.forEach(f => { if (!f.isRight) f.pressed = true; });
    keys.add('left');
  }
  if (e.key === 'ArrowRight') {
    flippers.forEach(f => { if (f.isRight) f.pressed = true; });
    keys.add('right');
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') {
    flippers.forEach(f => { if (!f.isRight) f.pressed = false; });
    keys.delete('left');
  }
  if (e.key === 'ArrowRight') {
    flippers.forEach(f => { if (f.isRight) f.pressed = false; });
    keys.delete('right');
  }
});

canvas.addEventListener('mousedown', (e) => {
  const p = getPointer(e);
  if (ball.inShooter && p.x > 735) {
    plungerActive = true;
    plungerStartY = p.y;
    plungerPull = 0;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!plungerActive) return;
  const p = getPointer(e);
  const d = Math.max(0, Math.min(plungerMax, p.y - plungerStartY));
  plungerPull = d;
});
window.addEventListener('mouseup', () => {
  if (plungerActive) {
    launchBall(plungerPull);
    plungerActive = false;
    plungerPull = 0;
  }
});

// Touch controls: left/right half for flippers; drag in shooter for plunger
let plungerTouchId = null;
canvas.addEventListener('touchstart', (e) => {
  for (const t of e.changedTouches) {
    const p = touchPoint(t);
    if (ball.inShooter && p.x > 735 && plungerTouchId === null) {
      plungerTouchId = t.identifier;
      plungerActive = true;
      plungerStartY = p.y;
      plungerPull = 0;
    } else {
      if (p.x < W * 0.5) flippers.forEach(f => { if (!f.isRight) f.pressed = true; });
      else flippers.forEach(f => { if (f.isRight) f.pressed = true; });
    }
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === plungerTouchId && plungerActive) {
      const p = touchPoint(t);
      const d = Math.max(0, Math.min(plungerMax, p.y - plungerStartY));
      plungerPull = d;
    }
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    const p = touchPoint(t);
    if (t.identifier === plungerTouchId && plungerActive) {
      launchBall(plungerPull);
      plungerActive = false;
      plungerTouchId = null;
      plungerPull = 0;
    } else {
      if (p.x < W * 0.5) flippers.forEach(f => { if (!f.isRight) f.pressed = false; });
      else flippers.forEach(f => { if (f.isRight) f.pressed = false; });
    }
  }
  e.preventDefault();
}, { passive: false });

function launchBall(pull) {
  if (!ball.inShooter) return;
  // Stronger upward velocity so the ball clears the lane at max pull
  ball.vx = -40 + Math.random() * 80;
  ball.vy = -(1200 + pull * 12);
  ball.inShooter = false;
}

function resetBall() {
  ball.x = ballStart.x;
  ball.y = ballStart.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.inShooter = true;
  plungerActive = false;
  plungerPull = 0;
}

// Main loop with fixed timestep
let last = performance.now();
let acc = 0;
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  acc += Math.min(0.1, dt);
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Update
function update(dt) {
  flippers.forEach(f => updateFlipper(f, dt));

  // Gravity
  if (!ball.inShooter) ball.vy += GRAVITY * dt;

  // Integrate
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Collide with walls
  for (const s of wallSegments) {
    collideBallWithSegment(ball, s.a, s.b, RESTITUTION, FRICTION);
  }

  // Collide with flippers
  flippers.forEach(f => collideWithFlipper(ball, f));

  // Collide with bumpers
  for (const el of level.elements) {
    if (el.type !== 'bumper') continue;
    collideBallWithBumper(ball, el);
  }

  // Drain check
  if (ball.y > H + 80) {
    ballsLeft--;
    if (ballsLeft > 0) {
      resetBall();
    } else {
      score = 0;
      ballsLeft = 3;
      resetBall();
    }
  }

  // HUD
  HUD.textContent = `Score: ${score} | Balls: ${ballsLeft}`;
}

function updateFlipper(f, dt) {
  const target = f.pressed ? f.active : f.rest;
  const prev = f.angle;
  if (f.pressed) {
    if (f.isRight) f.angle = Math.max(target, f.angle - f.upSpeed * dt);
    else f.angle = Math.min(target, f.angle + f.upSpeed * dt);
  } else {
    if (f.isRight) f.angle = Math.min(target, f.angle + f.downSpeed * dt);
    else f.angle = Math.max(target, f.angle - f.downSpeed * dt);
  }
  f.omega = (f.angle - prev) / dt;
}

// Rendering
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawTable();

  // Draw elements
  for (const el of level.elements) drawElement(el);

  // Draw flippers
  flippers.forEach(f => drawFlipper(f));

  // Draw ball
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(ball.x - 4, ball.y - 4, 2, ball.x, ball.y, ball.r);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(1, '#999');
  ctx.fillStyle = grad;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.fill();
  ctx.restore();

  // Draw plunger pull indicator
  if (ball.inShooter) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(740, 900, 50, 280);
    if (plungerActive && plungerPull > 0) {
      ctx.fillStyle = 'rgba(74, 144, 226, 0.4)';
      ctx.fillRect(740, 900 + (plungerMax - plungerPull), 50, plungerPull);
    }
  }
}

function drawTable() {
  // Background
  ctx.fillStyle = level.backgroundColor || '#000000';
  ctx.fillRect(0, 0, W, H);

  ensureBgImageLoaded();
  if (_bgImage && _bgImage.complete) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, level.backgroundAlpha ?? 1));
    const scale = W / _bgImage.width;
    const h = _bgImage.height * scale;
    ctx.drawImage(_bgImage, 0, 0, W, h);
    ctx.restore();
  }

  // Walls
  ctx.strokeStyle = level.wallColor || '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const wall of level.walls) {
    const pts = wall.points;
    if (!pts || pts.length === 0) continue;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const hasStart = !!(a.controls && a.controls.c2);
      const hasEnd = !!(b.controls && b.controls.c1);
      if (hasStart || hasEnd) {
        const c2 = hasStart ? a.controls.c2 : { x: a.x, y: a.y };
        const c1 = hasEnd ? b.controls.c1 : { x: b.x, y: b.y };
        ctx.bezierCurveTo(c2.x, c2.y, c1.x, c1.y, b.x, b.y);
      } else {
        ctx.lineTo(b.x, b.y);
      }
    }
  }
  ctx.stroke();

  // Remove static shooter lane divider lines; the level walls now define visuals
  // ctx.strokeStyle = '#888';
  // ctx.lineWidth = 2;
  // ctx.beginPath();
  // ctx.moveTo(740, 40); ctx.lineTo(740, 900);
  // ctx.moveTo(790, 40); ctx.lineTo(790, 1180);
  // ctx.stroke();
}

function drawElement(el) {
  if (el.type === 'bumper') {
    const r = el.radius || 26;
    ctx.beginPath();
    ctx.arc(el.position.x, el.position.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#3a7';
    ctx.fill();
    ctx.strokeStyle = '#285';
    ctx.stroke();
  }
}

function drawFlipper(f) {
  const tip = {
    x: f.pivot.x + Math.cos(f.angle) * f.length * (f.isRight ? -1 : 1),
    y: f.pivot.y + Math.sin(f.angle) * f.length
  };
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#b22';
  ctx.lineWidth = f.thickness * 2;
  ctx.beginPath();
  ctx.moveTo(f.pivot.x, f.pivot.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  // Pivot
  ctx.beginPath();
  ctx.arc(f.pivot.x, f.pivot.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#800';
  ctx.fill();
}

// Collisions
function collideBallWithSegment(ball, A, B, e, mu) {
  const ABx = B.x - A.x, ABy = B.y - A.y;
  const APx = ball.x - A.x, APy = ball.y - A.y;
  const ab2 = ABx * ABx + ABy * ABy;
  if (ab2 === 0) return;
  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));
  const Cx = A.x + ABx * t, Cy = A.y + ABy * t;
  let nx = ball.x - Cx, ny = ball.y - Cy;
  let dist2 = nx * nx + ny * ny;
  const r = ball.r;
  if (dist2 >= r * r) return;
  const dist = Math.sqrt(dist2) || 1e-6;
  nx /= dist; ny /= dist;
  const penetration = r - dist;
  // Positional correction
  ball.x += nx * penetration;
  ball.y += ny * penetration;
  // Velocity reflection
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + e) * vn * nx;
    ball.vy -= (1 + e) * vn * ny;
    // Tangential friction
    const tx = -ny, ty = nx;
    const vt = ball.vx * tx + ball.vy * ty;
    ball.vx -= mu * vt * tx;
    ball.vy -= mu * vt * ty;
  }
}

function collideBallWithBumper(ball, bumper) {
  const r = (bumper.radius || 26) + ball.r;
  const dx = ball.x - bumper.position.x;
  const dy = ball.y - bumper.position.y;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return;
  const d = Math.sqrt(d2) || 1e-6;
  const nx = dx / d, ny = dy / d;
  const penetration = r - d;
  ball.x += nx * penetration;
  ball.y += ny * penetration;
  const vn = ball.vx * nx + ball.vy * ny;
  ball.vx -= (1 + BUMPER_RESTITUTION) * vn * nx;
  ball.vy -= (1 + BUMPER_RESTITUTION) * vn * ny;
  score += 100;
}

function collideWithFlipper(ball, f) {
  const dir = f.isRight ? -1 : 1;
  const tip = {
    x: f.pivot.x + Math.cos(f.angle) * f.length * dir,
    y: f.pivot.y + Math.sin(f.angle) * f.length
  };
  // Enlarge ball radius by flipper thickness to approximate capsule
  const savedR = ball.r;
  ball.r = savedR + f.thickness;
  collideBallWithSegment(ball, f.pivot, tip, 0.4, 0.02);
  // Add impulse from flipper motion
  const omega = f.omega;
  if (Math.abs(omega) > 0.1) {
    const dx = ball.x - f.pivot.x;
    const dy = ball.y - f.pivot.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    const boost = Math.max(0, (f.isRight ? -omega : omega)) * 450;
    ball.vx += nx * boost * 0.1; // Balanced impulse
    ball.vy += ny * boost;
  }
  ball.r = savedR;
}

// Helpers
function getPointer(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
function touchPoint(t) {
  const rect = canvas.getBoundingClientRect();
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}
