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

// Toolbar
const toolbar = document.getElementById('toolbar');
toolbar.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const tool = e.target.id.replace('-tool', '');
    selectTool(tool);
  }
});

// Load and Save buttons
document.getElementById('load-button').addEventListener('click', loadLevel);
document.getElementById('save-button').addEventListener('click', saveLevel);

function selectTool(tool) {
  if (currentWall) {
    if (currentWall.points.length > 1) {
      level.walls.push(currentWall);
    }
    currentWall = null;
  }
  selectedTool = tool;
  selectedItem = null;
  const buttons = document.querySelectorAll('#toolbar button');
  buttons.forEach(button => {
    if (button.id === `${tool}-tool`) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

function loadLevel() {
  try {
    level = JSON.parse(levelDataTextarea.value);
  } catch (e) {
    alert('Invalid JSON data!');
  }
}

function saveLevel() {
  levelDataTextarea.value = JSON.stringify(level, null, 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  level.walls.forEach(wall => drawWall(wall, 'black'));
  if (currentWall) {
    drawWall(currentWall, 'blue');
    if (currentWall.points.length > 0) {
      ctx.beginPath();
      ctx.arc(currentWall.points[0][0], currentWall.points[0][1], 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
    }
  }

  level.elements.forEach(element => drawElement(element));

  if (selectedItem) {
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 2;
    if (selectedItem.wall) {
      selectedItem.wall.points.forEach(p => {
        ctx.beginPath();
        ctx.rect(p[0] - 5, p[1] - 5, 10, 10);
        ctx.stroke();
      });
      if (selectedItem.point) {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.beginPath();
        ctx.rect(selectedItem.point[0] - 7, selectedItem.point[1] - 7, 14, 14);
        ctx.fill();
      }
      // Draw control points for selected wall
      if (selectedItem.wall.segments) {
        selectedItem.wall.segments.forEach((seg, i) => {
            if (seg.type === 'bezier') {
                drawControlPoint(seg.control1);
                drawControlPoint(seg.control2);
            } else if (seg.type === 'arc') {
                drawControlPoint(seg.center);
            }
        });
      }
    } else if (selectedItem.position){
      const pos = selectedItem.position;
      ctx.beginPath();
      ctx.rect(pos[0] - 25, pos[1] - 25, 50, 50);
      ctx.stroke();
    }
  }

  requestAnimationFrame(draw);
}

function drawWall(wall, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < wall.points.length - 1; i++) {
    const start = wall.points[i];
    const segment = wall.segments ? wall.segments[i] : {type: 'line'};
    const end = wall.points[i + 1];
    ctx.moveTo(start[0], start[1]);
    if (segment.type === 'bezier') {
        ctx.bezierCurveTo(segment.control1[0], segment.control1[1], segment.control2[0], segment.control2[1], end[0], end[1]);
    } else if (segment.type === 'arc') {
        const angle = Math.atan2(start[1] - segment.center[1], start[0] - segment.center[0]);
        const angle2 = Math.atan2(end[1] - segment.center[1], end[0] - segment.center[0]);
        ctx.arc(segment.center[0], segment.center[1], segment.radius, angle, angle2);
    } else {
        ctx.lineTo(end[0], end[1]);
    }
  }
  ctx.stroke();
}

function drawElement(element) {
    ctx.beginPath();
    const pos = element.position;
    if (element.type === 'bumper') {
      ctx.arc(pos[0], pos[1], 20, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
    } else if (element.type === 'slingshot') {
      ctx.moveTo(pos[0], pos[1] - 20);
      ctx.lineTo(pos[0] - 20, pos[1] + 20);
      ctx.lineTo(pos[0] + 20, pos[1] + 20);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    } else if (element.type === 'flipper') {
        ctx.save();
        ctx.translate(pos[0], pos[1]);
        ctx.rotate(element.rotation || 0);
        ctx.fillStyle = 'red';
        ctx.fillRect(-10, -5, 60, 10);
        ctx.restore();
    } else if (element.type === 'rollover') {
        ctx.fillStyle = 'purple';
        ctx.fillRect(pos[0] - 20, pos[1] - 5, 40, 10);
    } else if (element.type === 'target') {
        ctx.fillStyle = 'green';
        ctx.fillRect(pos[0] - 15, pos[1] - 15, 30, 30);
    } else if (element.type === 'hole') {
        ctx.arc(pos[0], pos[1], 15, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}

function drawGrid() {
  const gridSize = 50;
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawControlPoint(p) {
    ctx.beginPath();
    ctx.rect(p[0] - 4, p[1] - 4, 8, 8);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
}

canvas.addEventListener('mousedown', (e) => {
    const pos = [e.offsetX, e.offsetY];
    if (selectedTool === 'wall') {
        if (!currentWall) {
            currentWall = { type: 'wall', points: [pos], segments: [] };
        } else {
            currentWall.points.push(pos);
            currentWall.segments.push({type: 'line'});
        }
    } else if (isElementTool(selectedTool)) {
        level.elements.push({ type: selectedTool, position: pos });
    } else if (selectedTool === 'select') {
        selectedItem = getSelectedItem(pos);
        if (selectedItem) {
            dragging = true;
            if (selectedItem.point) {
                dragOffset = { x: pos[0] - selectedItem.point[0], y: pos[1] - selectedItem.point[1] };
            } else if (selectedItem.controlPoint) {
                dragOffset = { x: pos[0] - selectedItem.controlPoint[0], y: pos[1] - selectedItem.controlPoint[1] };
            } else if (selectedItem.wall) {
                dragOffset = { x: pos[0] - selectedItem.wall.points[0][0], y: pos[1] - selectedItem.wall.points[0][1] };
            } else {
                dragOffset = { x: pos[0] - selectedItem.position[0], y: pos[1] - selectedItem.position[1] };
            }
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
  const pos = [e.offsetX, e.offsetY];
  if (dragging && selectedItem) {
    if (selectedItem.point) {
      selectedItem.point[0] = pos[0] - dragOffset.x;
      selectedItem.point[1] = pos[1] - dragOffset.y;
    } else if (selectedItem.controlPoint) {
        selectedItem.controlPoint[0] = pos[0] - dragOffset.x;
        selectedItem.controlPoint[1] = pos[1] - dragOffset.y;
    } else if (selectedItem.wall) {
        const dx = (pos[0] - dragOffset.x) - selectedItem.wall.points[0][0];
        const dy = (pos[1] - dragOffset.y) - selectedItem.wall.points[0][1];
        selectedItem.wall.points.forEach(p => {
            p[0] += dx;
            p[1] += dy;
        });
        if (selectedItem.wall.segments) {
            selectedItem.wall.segments.forEach(seg => {
                if (seg.type === 'bezier') {
                    seg.control1[0] += dx; seg.control1[1] += dy;
                    seg.control2[0] += dx; seg.control2[1] += dy;
                } else if (seg.type === 'arc') {
                    seg.center[0] += dx; seg.center[1] += dy;
                }
            });
        }
    } else if (selectedItem.position) {
      selectedItem.position[0] = pos[0] - dragOffset.x;
      selectedItem.position[1] = pos[1] - dragOffset.y;
    }
  }
  updateCursor(pos);
});

canvas.addEventListener('mouseup', (e) => {
  dragging = false;
});

canvas.addEventListener('dblclick', (e) => {
  if (selectedTool === 'wall' && currentWall) {
    if (currentWall.points.length > 1) {
      level.walls.push(currentWall);
    }
    currentWall = null;
  }
});

canvas.addEventListener('click', (e) => {
    if (selectedTool === 'select' && selectedItem && selectedItem.segment) {
        const segment = selectedItem.segment;
        if (segment.type === 'line') {
            segment.type = 'bezier';
            const p1 = selectedItem.wall.points[selectedItem.segmentIndex];
            const p2 = selectedItem.wall.points[selectedItem.segmentIndex+1];
            segment.control1 = [p1[0] + (p2[0] - p1[0]) * 0.25, p1[1] + (p2[1] - p1[1]) * 0.25];
            segment.control2 = [p1[0] + (p2[0] - p1[0]) * 0.75, p1[1] + (p2[1] - p1[1]) * 0.75];
        } else if (segment.type === 'bezier') {
            segment.type = 'arc';
            const p1 = selectedItem.wall.points[selectedItem.segmentIndex];
            const p2 = selectedItem.wall.points[selectedItem.segmentIndex+1];
            const mid = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2];
            segment.center = mid;
            segment.radius = Math.sqrt(Math.pow(p1[0] - mid[0], 2) + Math.pow(p1[1] - mid[1], 2));
        } else {
            segment.type = 'line';
        }
    }
});

function getSelectedItem(pos) {
  // Check elements first
  for (let i = level.elements.length - 1; i >= 0; i--) {
    const element = level.elements[i];
    const elPos = element.position;
    if (Math.abs(pos[0] - elPos[0]) < 25 && Math.abs(pos[1] - elPos[1]) < 25) {
      return element;
    }
  }
  // Check walls
  for (let i = 0; i < level.walls.length; i++) {
    const wall = level.walls[i];
    // Check control points
    if (wall.segments) {
        for (let j = 0; j < wall.segments.length; j++) {
            const seg = wall.segments[j];
            if (seg.type === 'bezier') {
                if (Math.abs(pos[0] - seg.control1[0]) < 5 && Math.abs(pos[1] - seg.control1[1]) < 5) return { wall: wall, controlPoint: seg.control1 };
                if (Math.abs(pos[0] - seg.control2[0]) < 5 && Math.abs(pos[1] - seg.control2[1]) < 5) return { wall: wall, controlPoint: seg.control2 };
            } else if (seg.type === 'arc') {
                if (Math.abs(pos[0] - seg.center[0]) < 5 && Math.abs(pos[1] - seg.center[1]) < 5) return { wall: wall, controlPoint: seg.center };
            }
        }
    }

    for (let j = 0; j < wall.points.length; j++) {
      const p = wall.points[j];
      if (Math.abs(pos[0] - p[0]) < 7 && Math.abs(pos[1] - p[1]) < 7) {
        return { wall: wall, point: p };
      }
    }
    for (let j = 0; j < wall.points.length - 1; j++) {
        const p1 = wall.points[j];
        const p2 = wall.points[j+1];
        const dist = Math.abs((p2[1]-p1[1])*pos[0] - (p2[0]-p1[0])*pos[1] + p2[0]*p1[1] - p2[1]*p1[0]) / Math.sqrt(Math.pow(p2[1]-p1[1], 2) + Math.pow(p2[0]-p1[0], 2));
        if (dist < 5) {
            return { wall: wall, segment: wall.segments[j], segmentIndex: j };
        }
    }
  }
  return null;
}

function isElementTool(tool) {
    return tool === 'bumper' || tool === 'slingshot' || tool === 'flipper' || tool === 'rollover' || tool === 'target' || tool === 'hole';
}

function updateCursor(pos) {
    if (selectedTool === 'select') {
        const item = getSelectedItem(pos);
        if (item) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

// Initial setup
selectTool('select');
draw();
