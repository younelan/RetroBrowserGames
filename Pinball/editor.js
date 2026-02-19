const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const levelDataTextarea = document.getElementById('level-data');

let level = {
  description: 'New Level',
  backgroundColor: '#000000',
  wallColor: '#ffffff',
  walls: [],
  elements: []
};

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
let ball = { x: 770, y: 1100, vx: 0, vy: 0, r: 10, trail: [] };
let physicsInterval = null;
let keys = {};
let score = 0;
const SUB_STEPS = 8;

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// --- Toolbar and Load/Save (No Changes) ---
const toolbar = document.getElementById('toolbar');
toolbar.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const tool = e.target.id.replace('-tool', '');
    selectTool(tool);
  }
});
document.getElementById('load-button').addEventListener('click', loadLevel);
document.getElementById('save-button').addEventListener('click', saveLevel);
// New: load level.json directly
document.getElementById('load-file-button').addEventListener('click', async () => {
  try {
    const res = await fetch('level.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    level = normalizeLevel(data); // normalize after fetch
    levelDataTextarea.value = JSON.stringify(level, null, 2);
    // Update color inputs
    document.getElementById('bg-color').value = level.backgroundColor;
    document.getElementById('wall-color').value = level.wallColor;
  } catch (err) {
    alert('Failed to load level.json');
    console.error(err);
  }
});

document.getElementById('play-mode-toggle').addEventListener('click', togglePlayMode);

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  keys[e.key.toLowerCase()] = true;
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
  ball = { x: 770, y: 1100, vx: 0, vy: 0, r: 10, waiting: true, trail: [] };
  physicsInterval = setInterval(updatePhysics, 16); // ~60fps
}

function stopPhysics() {
  clearInterval(physicsInterval);
  physicsInterval = null;
}

function updatePhysics() {
  // Update Flipper State (Always even when waiting)
  level.elements.forEach(el => {
    if (el.type === 'flipper') {
      const isRight = !!el.isRight;
      // Map both Arrow keys and Z/M (case insensitive)
      const active = isRight ? (keys['ArrowRight'] || keys['KeyM'] || keys['m']) : (keys['ArrowLeft'] || keys['KeyZ'] || keys['z']);

      // RESTING: Left=20deg, Right=160deg. ACTIVE: 40deg flip
      let restRot = isRight ? (160 * Math.PI / 180) : (20 * Math.PI / 180);
      let activeRot = isRight ? (200 * Math.PI / 180) : (-20 * Math.PI / 180);
      el.currentRot = el.currentRot || restRot;
      const targetRot = active ? activeRot : restRot;
      const rotSpeed = 0.6;
      if (el.currentRot < targetRot) el.currentRot = Math.min(targetRot, el.currentRot + rotSpeed);
      if (el.currentRot > targetRot) el.currentRot = Math.max(targetRot, el.currentRot - rotSpeed);
    }
  });

  if (ball.waiting) {
    if (keys['Space']) {
      ball.waiting = false;
      ball.vy = -35;
      ball.vx = -1 + Math.random() * 2;
    }
    return;
  }

  for (let s = 0; s < SUB_STEPS; s++) {
    // Gravity (scaled by sub-steps)
    ball.vy += 0.25 / SUB_STEPS;

    // Air friction (continuous approximation)
    ball.vx *= Math.pow(0.992, 1 / SUB_STEPS);
    ball.vy *= Math.pow(0.992, 1 / SUB_STEPS);

    // Update trail occasionally
    if (s === 0) {
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 20) ball.trail.shift();
    }

    // Move
    ball.x += ball.vx / SUB_STEPS;
    ball.y += ball.vy / SUB_STEPS;

    // Boundary Guards: reset if NaN or extreme out of bounds
    if (isNaN(ball.x) || isNaN(ball.y) || Math.abs(ball.vx) > 500) {
      console.warn("Physics reset: Ball entered invalid state");
      ball.x = 770; ball.y = 1100; ball.vx = 0; ball.vy = 0; ball.waiting = true;
      return;
    }

    // Screen Bounds (with bounce)
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -0.5; }
    if (ball.x > canvas.width - ball.r) { ball.x = canvas.width - ball.r; ball.vx *= -0.5; }
    // Top bounce - prevent disappearing off top!
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -0.5; }

    if (ball.y > canvas.height + 100) {
      stopPhysics();
      togglePlayMode();
      alert('Game Over! Score: ' + score);
      return;
    }

    // Use the robust collision logic (shared with game.js)
    collideBallWithSegment(ball, { x: 0, y: 0 }, { x: 0, y: 0 }, 0, 0); // Placeholder to show it's here

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
          const samples = 48; // Significantly increased for curves
          let prev = { x: p1.x, y: p1.y };
          for (let s = 1; s <= samples; s++) {
            const t = s / samples;
            const curr = cubic(p1, c2, c1, p2, t);
            collideBallWithSegment(ball, prev, curr, 0.5, 0.05);
            prev = curr;
          }
        } else {
          collideBallWithSegment(ball, p1, p2, 0.5, 0.05);
        }
      }
    });

    // Element Collisions
    level.elements.forEach(el => {
      if (el.type === 'bumper') {
        const dist = Math.hypot(ball.x - el.position.x, ball.y - el.position.y);
        const r_hit = ball.r + (el.radius || 20);
        if (dist < r_hit) {
          const nx = (ball.x - el.position.x) / dist;
          const ny = (ball.y - el.position.y) / dist;
          const vn = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2.2 * vn * nx;
          ball.vy -= 2.2 * vn * ny;
          ball.vx += nx * 8; ball.vy += ny * 8; // Extra kick
          score += 10;
        }
      } else if (el.type === 'flipper') {
        const isRight = !!el.isRight;
        const active = isRight ? (keys['ArrowRight'] || keys['KeyM'] || keys['m']) : (keys['ArrowLeft'] || keys['KeyZ'] || keys['z']);

        const L = el.length || 70;
        const p1 = el.position;
        const p2 = { x: p1.x + Math.cos(el.currentRot) * L, y: p1.y + Math.sin(el.currentRot) * L };
        const d = distPointToSeg(ball.x, ball.y, p1.x, p1.y, p2.x, p2.y);
        if (d < ball.r + 10) {
          collideBallWithSegment(ball, p1, p2, 0.4, 0.02);
          if (active) {
            // Kick the ball
            ball.vy -= 18;
            ball.vx += (ball.x - p1.x) * 0.1;
          }
        }
      }
    });

    if (ball.x > 750 && ball.y > 1050 && keys['Space']) {
      ball.vy = -35;
      ball.vx = -1 + Math.random() * 2;
    }
  }
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
    document.getElementById('wall-color').value = level.wallColor;
  } catch (e) { alert('Invalid JSON data!'); }
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
    ctx.fillStyle = bg;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

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


    // Draw ball (Neon Style orb)
    ctx.save();
    ctx.shadowBlur = 25; // More glow
    ctx.shadowColor = '#0ff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    const bGrad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, ball.r);
    bGrad.addColorStop(0, '#fff');
    bGrad.addColorStop(0.3, '#0ff');
    bGrad.addColorStop(1, '#0088bb');
    ctx.fillStyle = bGrad;
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0ff';
    ctx.fillText('SCORE: ' + score.toString().padStart(6, '0'), 30, 50);

    if (ball.waiting) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE to Launch', canvas.width / 2, 800);
      ctx.font = '16px Arial';
      ctx.fillText('Use ARROW KEYS or Z / M for Flippers', canvas.width / 2, 830);
      ctx.textAlign = 'left';
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
  const APx = b.x - A.x, ABy_p = b.y - A.y;
  const ab2 = ABx * ABx + ABy * ABy;
  if (ab2 === 0) return;
  let t_val = (APx * ABx + ABy_p * ABy) / ab2;
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
  const baseColor = color === 'blue' ? '#4488ff' : '#00ffff';

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

  // Layer 2: Transparent inner highlight for "texture"
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
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

function drawElement(element) {
  ctx.save();
  const pos = element.position;
  if (element.type === 'bumper') {
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI); // Slightly larger
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.2, '#ffbbff');
    grad.addColorStop(1, '#ff00ff');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 18, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();
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

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0ff';

    // Glassmorphism/Gradient effect for flipper body
    const fGrad = ctx.createLinearGradient(0, 0, L, 0);
    fGrad.addColorStop(0, '#0ff');
    fGrad.addColorStop(1, '#008888');
    ctx.fillStyle = fGrad;

    ctx.beginPath();
    // Capsule shape for flipper
    ctx.arc(0, 0, W, Math.PI / 2, 3 * Math.PI / 2);
    ctx.lineTo(L, -W / 2);
    ctx.arc(L, 0, W / 2, 3 * Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pivot Detail
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
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
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#0f0';
    const tGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20);
    tGrad.addColorStop(0, '#fff');
    tGrad.addColorStop(0.3, '#0f0');
    tGrad.addColorStop(1, '#004400');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.roundRect(pos.x - 15, pos.y - 15, 30, 30, 5);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
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

document.getElementById('delete-tool').addEventListener('click', deleteSelectedItem);

canvas.addEventListener('mousedown', (e) => {
  const pos = getMousePos(e);
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

  if (dragging && selectedItem) {
    if (pointerDownPos && !movedDuringDrag) {
      const dx0 = pos.x - pointerDownPos.x;
      const dy0 = pos.y - pointerDownPos.y;
      movedDuringDrag = Math.hypot(dx0, dy0) > 3;
    }

    if (selectedItem.control) {
      const point = selectedItem.point;
      const control = selectedItem.control;
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
        selectedItem.point.controls.c1.x += dx; selectedItem.point.controls.c1.y += dy;
        selectedItem.point.controls.c2.x += dx; selectedItem.point.controls.c2.y += dy;
      }
    } else if (selectedItem.wall) {
      const dx = (pos.x - dragOffset.x) - selectedItem.wall.points[0].x;
      const dy = (pos.y - dragOffset.y) - selectedItem.wall.points[0].y;
      selectedItem.wall.points.forEach(p => {
        p.x += dx; p.y += dy;
        if (p.controls) {
          p.controls.c1.x += dx; p.controls.c1.y += dy;
          p.controls.c2.x += dx; p.controls.c2.y += dy;
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
  // If we dragged, suppress the click that follows so we don't toggle handles off.
  if (dragging && movedDuringDrag) suppressNextClick = true;

  if (dragging && selectedItem && selectedItem.control) {
    const point = selectedItem.point;
    // Keep the point selected (handles visible)
    selectedItem = { wall: selectedItem.wall, point: point };
  }
  dragging = false;
  pointerDownPos = null;
});

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