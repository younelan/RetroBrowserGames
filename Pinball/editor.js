const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const levelDataTextarea = document.getElementById('level-data');

let level = {
  description: 'New Level',
  walls: [],
  elements: []
};

let selectedTool = 'select';
let currentWall = null;
let selectedItem = null;
let dragging = false;
let dragOffset = { x: 0, y: 0 };

// Add pointer state to suppress click-after-drag and detect movement
let pointerDownPos = null;
let movedDuringDrag = false;
let suppressNextClick = false;

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
  } catch (err) {
    alert('Failed to load level.json');
    console.error(err);
  }
});
// --- End Toolbar and Load/Save ---

function selectTool(tool) {
  if (currentWall) {
    if (currentWall.points.length > 1) level.walls.push(currentWall);
    currentWall = null;
  }
  selectedTool = tool;
  selectedItem = null;
  document.querySelectorAll('#toolbar button').forEach(b => b.classList.remove('active'));
  document.getElementById(`${tool}-tool`).classList.add('active');
}

function loadLevel() {
  try {
    const parsed = JSON.parse(levelDataTextarea.value);
    level = normalizeLevel(parsed); // normalize after paste
  } catch (e) { alert('Invalid JSON data!'); }
}

function saveLevel() {
  levelDataTextarea.value = JSON.stringify(level, null, 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  level.walls.forEach(wall => drawWall(wall, 'black'));
  if (currentWall) drawWall(currentWall, 'blue');

  level.elements.forEach(element => drawElement(element));

  if (selectedItem) {
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 1;
    if (selectedItem.wall) {
      // Guard invalid points so selection rendering doesn't crash
      selectedItem.wall.points.forEach(p => {
        if (!isPoint(p)) return;
        ctx.beginPath();
        ctx.rect(p.x - 5, p.y - 5, 10, 10);
        ctx.stroke();
      });
      if (selectedItem.point && isPoint(selectedItem.point)) {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.beginPath();
        ctx.rect(selectedItem.point.x - 7, selectedItem.point.y - 7, 14, 14);
        ctx.fill();

        if (selectedItem.point.controls) {
          const c1 = isPoint(selectedItem.point.controls?.c1) ? selectedItem.point.controls.c1 : null;
          const c2 = isPoint(selectedItem.point.controls?.c2) ? selectedItem.point.controls.c2 : null;
          if (c1) drawControlPoint(c1);
          if (c2) drawControlPoint(c2);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          if (c1) { ctx.beginPath(); ctx.moveTo(selectedItem.point.x, selectedItem.point.y); ctx.lineTo(c1.x, c1.y); ctx.stroke(); }
          if (c2) { ctx.beginPath(); ctx.moveTo(selectedItem.point.x, selectedItem.point.y); ctx.lineTo(c2.x, c2.y); ctx.stroke(); }
        }
      }
    } else if (selectedItem.position){
      const pos = selectedItem.position;
      ctx.beginPath();
      ctx.rect(pos.x - 25, pos.y - 25, 50, 50);
      ctx.stroke();
    }
  }

  requestAnimationFrame(draw);
}

// Helper: cubic bezier point
function cubic(p0, p1, p2, p3, t) {
  const it = 1 - t;
  const x = it*it*it*p0.x + 3*it*it*t*p1.x + 3*it*t*t*p2.x + t*t*t*p3.x;
  const y = it*it*it*p0.y + 3*it*it*t*p1.y + 3*it*t*t*p2.y + t*t*t*p3.y;
  return { x, y };
}

// Helper: distance from point to segment AB
function distPointToSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const ab2 = abx*abx + aby*aby;
  if (ab2 === 0) return Math.hypot(px - ax, py - ay);
  let t = (apx*abx + apy*aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + abx * t, cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}

// New: validators and normalizer to handle pasted JSON safely
function isPoint(p) { return p && typeof p.x === 'number' && typeof p.y === 'number'; }
function normalizeLevel(src) {
  const out = { description: src?.description || 'Level', walls: [], elements: [] };
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
      out.elements.push({ type: el.type, position: { x: +pos.x, y: +pos.y }, radius: el.radius, rotation: el.rotation });
    }
  }
  return out;
}

function drawWall(wall, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (wall.points.length === 0) return;
  ctx.moveTo(wall.points[0].x, wall.points[0].y);
  for (let i = 0; i < wall.points.length - 1; i++) {
    const start = wall.points[i];
    const end = wall.points[i + 1];

    // Use bezier if either side has controls.
    const startHas = !!(start.controls && start.controls.c2);
    const endHas = !!(end.controls && end.controls.c1);
    if (startHas || endHas) {
      const c2 = startHas ? start.controls.c2 : { x: start.x, y: start.y };
      const c1 = endHas ? end.controls.c1 : { x: end.x, y: end.y };
      ctx.bezierCurveTo(c2.x, c2.y, c1.x, c1.y, end.x, end.y);
    } else {
      ctx.lineTo(end.x, end.y);
    }
  }
  ctx.stroke();
}

function drawElement(element) {
    ctx.beginPath();
    const pos = element.position;
    if (element.type === 'bumper') {
      ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
    } else if (element.type === 'slingshot') {
      ctx.moveTo(pos.x, pos.y - 20);
      ctx.lineTo(pos.x - 20, pos.y + 20);
      ctx.lineTo(pos.x + 20, pos.y + 20);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    } else if (element.type === 'flipper') {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(element.rotation || 0);
        ctx.fillStyle = 'red';
        ctx.fillRect(-10, -5, 60, 10);
        ctx.restore();
    } else if (element.type === 'rollover') {
        ctx.fillStyle = 'purple';
        ctx.fillRect(pos.x - 20, pos.y - 5, 40, 10);
    } else if (element.type === 'target') {
        ctx.fillStyle = 'green';
        ctx.fillRect(pos.x - 15, pos.y - 15, 30, 30);
    } else if (element.type === 'hole') {
        ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}

function drawGrid() {
  const gridSize = 50;
  ctx.strokeStyle = '#eee';
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

canvas.addEventListener('mousedown', (e) => {
  const pos = {x: e.offsetX, y: e.offsetY};
  pointerDownPos = pos;
  movedDuringDrag = false;

  if (selectedTool === 'wall') {
    if (!currentWall) {
        currentWall = { type: 'wall', points: [] };
    }
    currentWall.points.push(pos);
  } else if (isElementTool(selectedTool)) {
    level.elements.push({ type: selectedTool, position: pos });
    selectTool('select');
  } else if (selectedTool === 'select') {
    selectedItem = getSelectedItem(pos);
    if (selectedItem) {
      dragging = true;
      if (selectedItem.point && !selectedItem.control) {
        dragOffset = { x: pos.x - selectedItem.point.x, y: pos.y - selectedItem.point.y };
      } else if (selectedItem.control) {
        dragOffset = { x: pos.x - selectedItem.point.controls[selectedItem.control].x, y: pos.y - selectedItem.point.controls[selectedItem.control].y };
      } else if (selectedItem.wall) {
        dragOffset = { x: pos.x - selectedItem.wall.points[0].x, y: pos.y - selectedItem.wall.points[0].y };
      } else {
        dragOffset = { x: pos.x - selectedItem.position.x, y: pos.y - selectedItem.position.y };
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const pos = {x: e.offsetX, y: e.offsetY};

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
  if (selectedTool !== 'select') return;

  const pos = {x: e.offsetX, y: e.offsetY};
  const clickedItem = getSelectedItem(pos);

  // Only toggle handles when clicking the anchor point (not a handle)
  if (clickedItem && clickedItem.point && !clickedItem.control) {
    const point = clickedItem.point;
    if (!point.controls) {
      point.controls = {
        c1: {x: point.x - 50, y: point.y},
        c2: {x: point.x + 50, y: point.y}
      };
    } else {
      point.controls = null;
    }
    selectedItem = { wall: clickedItem.wall, point: point };
  } else {
    selectedItem = clickedItem;
  }
});

function getSelectedItem(pos) {
  // Elements (topmost first)
  for (let i = level.elements.length - 1; i >= 0; i--) {
    const element = level.elements[i];
    const p = element?.position;
    if (isPoint(p) && Math.abs(pos.x - p.x) < 25 && Math.abs(pos.y - p.y) < 25) return element;
  }

  // Walls: prefer handles/anchors first
  for (const wall of level.walls) {
    const pts = Array.isArray(wall?.points) ? wall.points : [];
    for (const p of pts) {
      if (!isPoint(p)) continue;
      const c1 = p.controls?.c1, c2 = p.controls?.c2;
      if (isPoint(c1) && Math.abs(pos.x - c1.x) < 7 && Math.abs(pos.y - c1.y) < 7) return { wall, point: p, control: 'c1' };
      if (isPoint(c2) && Math.abs(pos.x - c2.x) < 7 && Math.abs(pos.y - c2.y) < 7) return { wall, point: p, control: 'c2' };
      if (Math.abs(pos.x - p.x) < 7 && Math.abs(pos.y - p.y) < 7) return { wall, point: p };
    }
  }

  // Walls: segment hit-test to allow selecting/moving an entire wall
  const threshold = 6; // pixels
  for (const wall of level.walls) {
    const pts = Array.isArray(wall?.points) ? wall.points : [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (!isPoint(a) || !isPoint(b)) continue;
      const startHas = isPoint(a.controls?.c2);
      const endHas   = isPoint(b.controls?.c1);
      if (startHas || endHas) {
        // Sample bezier into short segments
        const c2 = startHas ? a.controls.c2 : { x: a.x, y: a.y };
        const c1 = endHas   ? b.controls.c1 : { x: b.x, y: b.y };
        const samples = 16;
        let prev = { x: a.x, y: a.y };
        for (let s = 1; s <= samples; s++) {
          const t = s / samples;
          const p = cubic(a, c2, c1, b, t);
          if