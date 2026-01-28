/* Connect4 — mobile-first vanilla JS with simple AI
 * - 7 columns x 7 rows
 * - player = 1 (human), ai = 2
 * - AI: minimax with alpha-beta and shallow depth for responsiveness
 */

const COLS = 7, ROWS = 7;
let board = []; // board[row][col], 0 empty, 1 player, 2 ai
let currentPlayer = 1; // human starts
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restartBtn');
let animating = false;

function init(){
  board = Array.from({length:ROWS}, ()=>Array(COLS).fill(0));
  currentPlayer = 1;
  renderBoard();
  setStatus("Your turn");
}

function renderBoard(){
  // legacy DOM render replaced by canvas rendering; call canvas render if available
  if(typeof render === 'function') return render();
}

function setStatus(txt){ statusEl.textContent = txt; }

// DOM-based functions removed; canvas rendering is used instead

function checkWin(r,c, player){ // check from (r,c)
  // vertical
  let cnt=0; for(let i=0;i<ROWS;i++){ if(board[i][c]===player) cnt++; else cnt=0; if(cnt>=4) return true; }
  // horizontal
  for(let row=0;row<ROWS;row++){ cnt=0; for(let col=0;col<COLS;col++){ if(board[row][col]===player) cnt++; else cnt=0; if(cnt>=4) return true; } }
  // diag \
  for(let row=0;row<ROWS;row++){ for(let col=0;col<COLS;col++){ if(checkDir(row,col,1,1,player)) return true; if(checkDir(row,col,1,-1,player)) return true; } }
  return false;
}

function checkDir(r,c,dr,dc,player){ let cnt=0; for(let i=0;i<4;i++){ const rr=r+i*dr, cc=c+i*dc; if(rr<0||rr>=ROWS||cc<0||cc>=COLS) return false; if(board[rr][cc]===player) cnt++; else return false; } return cnt===4; }

function checkDraw(){ return board.every(row=>row.every(cell=>cell!==0)); }

// AI: minimax with alpha-beta
function aiMove(){ aiMoveCanvas(); }

function findBestMove(depth){
  let bestScore = -Infinity; let bestMove = null;
  for(let c=0;c<COLS;c++){
    const r = firstEmptyRow(c); if(r<0) continue;
    board[r][c]=2; // ai
    const score = minimax(depth-1, -Infinity, Infinity, false);
    board[r][c]=0;
    if(score>bestScore){ bestScore=score; bestMove=c; }
  }
  return {move:bestMove, score:bestScore};
}

function firstEmptyRow(col){ for(let r=0;r<ROWS;r++) if(board[r][col]===0) return r; return -1; }

function minimax(depth, alpha, beta, maximizing){
  if(checkAnyWin(2)) return 100000 + depth; // ai wins
  if(checkAnyWin(1)) return -100000 - depth; // player wins
  if(depth===0 || checkDraw()) return evaluateBoard();
  if(maximizing){
    let maxEval = -Infinity;
    for(let c=0;c<COLS;c++){
      const r = firstEmptyRow(c); if(r<0) continue;
      board[r][c]=2;
      const val = minimax(depth-1, alpha, beta, false);
      board[r][c]=0;
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if(beta<=alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(let c=0;c<COLS;c++){
      const r = firstEmptyRow(c); if(r<0) continue;
      board[r][c]=1;
      const val = minimax(depth-1, alpha, beta, true);
      board[r][c]=0;
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if(beta<=alpha) break;
    }
    return minEval;
  }
}

function checkAnyWin(player){
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(board[r][c]!==player) continue;
    // horizontal
    if(c<=COLS-4){ let ok=true; for(let k=0;k<4;k++) if(board[r][c+k]!==player) ok=false; if(ok) return true; }
    // vertical
    if(r<=ROWS-4){ let ok=true; for(let k=0;k<4;k++) if(board[r+k][c]!==player) ok=false; if(ok) return true; }
    // diag
    if(r<=ROWS-4 && c<=COLS-4){ let ok=true; for(let k=0;k<4;k++) if(board[r+k][c+k]!==player) ok=false; if(ok) return true; }
    if(r<=ROWS-4 && c>=3){ let ok=true; for(let k=0;k<4;k++) if(board[r+k][c-k]!==player) ok=false; if(ok) return true; }
  }
  return false;
}

function evaluateBoard(){
  // simple heuristic: count possible 2/3 in a row for AI minus player
  return scorePosition(2) - scorePosition(1);
}

function scorePosition(player){
  let score = 0;
  const lines = getAllLines();
  lines.forEach(line=>{
    const counts = line.reduce((acc,idx)=>{ if(idx===player) acc.my++; else if(idx===0) acc.empty++; else acc.opp++; return acc; }, {my:0,opp:0,empty:0});
    if(counts.opp===0){
      if(counts.my===4) score += 1000;
      else if(counts.my===3 && counts.empty===1) score += 50;
      else if(counts.my===2 && counts.empty===2) score += 10;
    }
  });
  return score;
}

function getAllLines(){
  const lines = [];
  // horizontal
  for(let r=0;r<ROWS;r++) for(let c=0;c<=COLS-4;c++) lines.push([board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]]);
  // vertical
  for(let c=0;c<COLS;c++) for(let r=0;r<=ROWS-4;r++) lines.push([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]]);
  // diag down-right
  for(let r=0;r<=ROWS-4;r++) for(let c=0;c<=COLS-4;c++) lines.push([board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]]);
  // diag down-left
  for(let r=0;r<=ROWS-4;r++) for(let c=3;c<COLS;c++) lines.push([board[r][c],board[r+1][c-1],board[r+2][c-2],board[r+3][c-3]]);
  return lines;
}

restartBtn.addEventListener('click', ()=>{ init(); });

/* Canvas-based rendering + input */
const canvas = document.getElementById('c4');
const ctx = canvas.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);
const CELL_GAP = 8; // px gap between holes in logical pixels
let CELL_SIZE = 0; // computed
let BOARD_X = 0, BOARD_Y = 0, BOARD_W = 0, BOARD_H = 0;
// caches to improve animation smoothness
let tokenCache = Object.create(null); // key: `${color}@${Math.round(r)}` -> offscreen canvas
let rimPattern = null;

function makeTokenCanvas(color, r){
  // ensure offscreen canvas is large enough to contain outer rim (avoid clipping)
  const rimFactor = 1.18; // allow rim to extend beyond token radius
  const rOut = r * rimFactor;
  const PAD = Math.max(4, Math.round(r*0.08));
  const diameter = rOut * 2;
  const sizeCss = diameter + PAD*2; // size in CSS pixels
  const sizePx = Math.max(4, Math.round(sizeCss * DPR));
  const off = document.createElement('canvas');
  off.width = sizePx; off.height = sizePx;
  const octx = off.getContext('2d');
  octx.setTransform(DPR,0,0,DPR,0,0);
  const cx = PAD + rOut, cy = PAD + rOut;

  // draw same token visuals but to offscreen canvas
  // soft shadow base
  octx.save();
  octx.shadowColor = 'rgba(0,0,0,0.26)';
  octx.shadowBlur = Math.max(8, r*0.5);
  octx.shadowOffsetY = Math.max(3, r*0.14);
  octx.beginPath(); octx.fillStyle = shadeColor(color, -10); octx.ellipse(cx, cy, r, r, 0, 0, Math.PI*2); octx.fill();
  octx.restore();

  // rim
  // outer rim
  const rimGrad = octx.createLinearGradient(cx - rOut, cy - rOut, cx + rOut, cy + rOut);
  rimGrad.addColorStop(0, shadeColor(color, 36));
  rimGrad.addColorStop(0.5, shadeColor(color, 8));
  rimGrad.addColorStop(1, shadeColor(color, -36));
  octx.beginPath(); octx.fillStyle = rimGrad; octx.ellipse(cx, cy, rOut, rOut, 0, 0, Math.PI*2); octx.fill();

  // main bevel
  const bevel = octx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  bevel.addColorStop(0, shadeColor(color, 22));
  bevel.addColorStop(0.45, color);
  bevel.addColorStop(1, shadeColor(color, -14));
  octx.beginPath(); octx.fillStyle = bevel; octx.ellipse(cx, cy, r, r, 0, 0, Math.PI*2); octx.fill();

  // inner ambient
  const inner = octx.createRadialGradient(cx, cy, r*0.15, cx, cy, r);
  inner.addColorStop(0, 'rgba(255,255,255,0.06)');
  inner.addColorStop(0.6, 'rgba(0,0,0,0.06)');
  inner.addColorStop(1, 'rgba(0,0,0,0.22)');
  octx.beginPath(); octx.fillStyle = inner; octx.ellipse(cx, cy, r, r, 0, 0, Math.PI*2); octx.fill();

  // crisp highlight
  const hx = cx - r*0.14;
  const hy = cy - r*0.2;
  const hrx = r*0.28;
  const hry = r*0.2;
  const gloss = octx.createRadialGradient(hx, hy, 0, hx, hy, hrx);
  gloss.addColorStop(0, 'rgba(255,255,255,0.98)');
  gloss.addColorStop(0.18, 'rgba(255,255,255,0.36)');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  octx.beginPath(); octx.fillStyle = gloss; octx.ellipse(hx, hy, hrx, hry, 0, 0, Math.PI*2); octx.fill();

  // inner edge stroke
  octx.beginPath();
  octx.lineWidth = Math.max(2, r*0.12);
  const edgeGr = octx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  edgeGr.addColorStop(0, 'rgba(255,255,255,0.6)');
  edgeGr.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  edgeGr.addColorStop(1, 'rgba(0,0,0,0.6)');
  octx.strokeStyle = edgeGr;
  octx.ellipse(cx, cy, r*0.96, r*0.96, 0, 0, Math.PI*2);
  octx.stroke();

  return off;
}

function resizeCanvas(){
  const wrap = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.floor(wrap.width * DPR);
  canvas.height = Math.floor(wrap.height * DPR);
  canvas.style.width = `${wrap.width}px`;
  canvas.style.height = `${wrap.height}px`;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  // compute cell size to fit 7x6 with gaps
  const availableW = wrap.width - (CELL_GAP*(COLS+1));
  const availableH = wrap.height - (CELL_GAP*(ROWS+1));
  CELL_SIZE = Math.min(availableW / COLS, availableH / ROWS);
  BOARD_W = CELL_SIZE*COLS + CELL_GAP*(COLS+1);
  BOARD_H = CELL_SIZE*ROWS + CELL_GAP*(ROWS+1);
  BOARD_X = (wrap.width - BOARD_W)/2;
  BOARD_Y = (wrap.height - BOARD_H)/2;
  // force rim pattern rebuild on resize so texture matches new sizing
  rimPattern = null;
  tokenCache = Object.create(null);
  render();
}

window.addEventListener('resize', ()=>{ resizeCanvas(); });

function render(){
  // clear
  const w = canvas.width/DPR, h = canvas.height/DPR;
  ctx.clearRect(0,0,w,h);
  // board background
  const grd = ctx.createLinearGradient(0,BOARD_Y,0,BOARD_Y+BOARD_H);
  grd.addColorStop(0,'#0f3a61'); grd.addColorStop(1,'#072033');
  roundRect(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, 12, grd);

  // decorative board edge: draw a textured frame (ring) as part of the canvas
  ctx.save();
  const edgeW = Math.max(6, CELL_SIZE*0.1);
  // create or reuse a brushed-metal pattern for the rim
  if(!rimPattern){
    const psize = Math.max(64, Math.round(CELL_SIZE*1.2));
    const pcan = document.createElement('canvas'); pcan.width = pcan.height = psize * DPR;
    const pct = pcan.getContext('2d'); pct.setTransform(DPR,0,0,DPR,0,0);
    const g = pct.createLinearGradient(0,0,psize,psize);
    g.addColorStop(0,'rgba(220,235,255,0.85)'); g.addColorStop(1,'rgba(190,210,230,0.85)');
    pct.fillStyle = g; pct.fillRect(0,0,psize,psize);
    pct.strokeStyle = 'rgba(255,255,255,0.10)'; pct.lineWidth = 1; pct.globalAlpha = 0.12;
    for(let x=-psize;x<psize*2;x+=5){ pct.beginPath(); pct.moveTo(x,0); pct.lineTo(x+psize,psize); pct.stroke(); }
    pct.strokeStyle = 'rgba(0,0,0,0.06)'; pct.lineWidth = 0.5; pct.globalAlpha = 0.3;
    for(let x=-psize;x<psize*2;x+=14){ pct.beginPath(); pct.moveTo(x,0); pct.lineTo(x+psize,psize); pct.stroke(); }
    rimPattern = ctx.createPattern(pcan, 'repeat');
  }

  // draw ring as outer rounded rect minus inner rounded rect (even-odd fill)
  const framePad = Math.max(10, CELL_SIZE*0.12);
  const outerX = BOARD_X - framePad;
  const outerY = BOARD_Y - framePad;
  const outerW = BOARD_W + framePad*2;
  const outerH = BOARD_H + framePad*2;
  const rrect = Math.max(12, Math.round(CELL_SIZE*0.06));
  ctx.beginPath();
  // outer rounded rect
  ctx.moveTo(outerX + rrect, outerY);
  ctx.arcTo(outerX + outerW, outerY, outerX + outerW, outerY + outerH, rrect);
  ctx.arcTo(outerX + outerW, outerY + outerH, outerX, outerY + outerH, rrect);
  ctx.arcTo(outerX, outerY + outerH, outerX, outerY, rrect);
  ctx.arcTo(outerX, outerY, outerX + outerW, outerY, rrect);
  ctx.closePath();
  // inner rounded rect (the board) as a hole
  ctx.moveTo(BOARD_X + rrect, BOARD_Y);
  ctx.arcTo(BOARD_X + BOARD_W, BOARD_Y, BOARD_X + BOARD_W, BOARD_Y + BOARD_H, rrect);
  ctx.arcTo(BOARD_X + BOARD_W, BOARD_Y + BOARD_H, BOARD_X, BOARD_Y + BOARD_H, rrect);
  ctx.arcTo(BOARD_X, BOARD_Y + BOARD_H, BOARD_X, BOARD_Y, rrect);
  ctx.arcTo(BOARD_X, BOARD_Y, BOARD_X + BOARD_W, BOARD_Y, rrect);
  ctx.closePath();
  ctx.fillStyle = rimPattern;
  ctx.fill('evenodd');
  ctx.restore();

  // draw holes and tokens
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const cx = BOARD_X + CELL_GAP + c*(CELL_SIZE+CELL_GAP) + CELL_SIZE/2;
      const cy = BOARD_Y + CELL_GAP + (ROWS-1-r)*(CELL_SIZE+CELL_GAP) + CELL_SIZE/2; // bottom-up
      // hole shadow
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.ellipse(cx+3, cy+4, CELL_SIZE*0.44, CELL_SIZE*0.44, 0, 0, Math.PI*2);
      ctx.fill();
      // hole (lighter rim)
      ctx.beginPath();
      ctx.fillStyle = '#0b2030';
      ctx.ellipse(cx, cy, CELL_SIZE*0.44, CELL_SIZE*0.44, 0, 0, Math.PI*2);
      ctx.fill();
      // token
      const v = board[r][c];
      if(v!==0){
        drawToken(cx, cy, v===1?getColor('--p1') : getColor('--p2'));
      }
    }
  }
}

function roundRect(ctx,x,y,w,h,r,fillStyle){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fillStyle = (fillStyle||'#072033'); if(typeof fillStyle === 'string') ctx.fillStyle = fillStyle; if(fillStyle && typeof fillStyle !== 'string') ctx.fillStyle = fillStyle; ctx.fill(); }

function getColor(varName){
  const appEl = document.querySelector('.app');
  const target = appEl || document.documentElement;
  const v = getComputedStyle(target).getPropertyValue(varName);
  if(v && v.trim()) return v.trim();
  // sensible fallbacks
  if(varName === '--p2') return '#facc15';
  return '#ef4444';
}


function drawToken(cx, cy, color){ // glossed circle
  const r = CELL_SIZE*0.42;
  const key = `${color}@${Math.round(r)}@${Math.round(DPR)}`;
  let img = tokenCache[key];
  if(!img){
    img = makeTokenCanvas(color, r);
    tokenCache[key] = img;
  }
  // compute CSS padding present in the offscreen canvas
  const imgCssW = img.width / DPR;
  const pad = Math.max(0, (imgCssW - (r*2)) / 2);
  // draw full cached token including padding so rim isn't clipped
  ctx.drawImage(img, cx - r - pad, cy - r - pad, (r*2) + pad*2, (r*2) + pad*2);
}

function shadeColor(hex, percent){
  // hex may be like #rrggbb
  const c = hex.replace('#','');
  const num = parseInt(c,16);
  let r = (num >> 16) + Math.round(255 * (percent/100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent/100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent/100));
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

/* End screen modal handling */
const endModal = document.getElementById('endModal');
const endTitle = document.getElementById('endTitle');
const endMsg = document.getElementById('endMsg');
const endRestart = document.getElementById('endRestart');
const endClose = document.getElementById('endClose');
endRestart.addEventListener('click', ()=>{ hideEndModal(); init(); });
endClose.addEventListener('click', ()=>{ hideEndModal(); });

function showEndModal(title, msg){
  if(!endModal) return;
  endTitle.textContent = title;
  endMsg.textContent = msg;
  endModal.classList.remove('hidden');
}

function hideEndModal(){ if(!endModal) return; endModal.classList.add('hidden'); }

function canvasToCol(x){ const wrap = canvas.getBoundingClientRect(); const rx = x - wrap.left; // client x
  const localX = rx - BOARD_X - CELL_GAP; if(localX < 0) return -1;
  const col = Math.floor(localX / (CELL_SIZE + CELL_GAP)); if(col < 0 || col >= COLS) return -1; return col;
}

canvas.addEventListener('click', (e)=>{ if(animating) return; if(currentPlayer!==1) return; const col = canvasToCol(e.clientX); if(col<0) return; const r = firstEmptyRow(col); if(r<0) return; animating = true; animateDropCanvas(col, 1, r, ()=>{ board[r][col]=1; animating=false; render(); if(checkWin(r,col,1)){ showEndModal('You Win!','Congratulations — you connected four!'); return; } if(checkDraw()){ showEndModal('Draw','Board is full — it\'s a draw.'); return; } currentPlayer=2; setStatus('AI thinking...'); setTimeout(()=>aiMoveCanvas(), 200); }); });

function animateDropCanvas(col, player, targetRow, cb){
  const wrap = canvas.getBoundingClientRect();
  const startX = wrap.left + BOARD_X + CELL_GAP + col*(CELL_SIZE+CELL_GAP) + CELL_SIZE/2;
  const startY = wrap.top + BOARD_Y + CELL_GAP - CELL_SIZE; // start slightly above board
  const endY = wrap.top + BOARD_Y + CELL_GAP + (ROWS-1-targetRow)*(CELL_SIZE+CELL_GAP) + CELL_SIZE/2;
  const color = player===1? getColor('--p1'): getColor('--p2');
  const duration = 210;
  const start = performance.now();
  function step(t){
    const dt = Math.min(1, (t-start)/duration);
    const ease = 1 - Math.pow(1-dt,3);
    const y = startY + (endY - startY) * ease;
    // clear overlay
    render();
    // draw floating token on top
    const cx = startX - wrap.left;
    const cy = y - wrap.top;
    drawToken(cx, cy, color);
    if(dt < 1) requestAnimationFrame(step); else { cb && cb(); }
  }
  requestAnimationFrame(step);
}

function aiMoveCanvas(){ if(animating) return; const best = findBestMove(4); if(best.move===null){ showEndModal('Draw','Board is full — it\'s a draw.'); return; } const col = best.move; const row = firstEmptyRow(col); if(row<0){ showEndModal('Draw','Board is full — it\'s a draw.'); return; } animating=true; animateDropCanvas(col,2,row, ()=>{ board[row][col]=2; animating=false; render(); if(checkWin(row,col,2)){ showEndModal('You Lose','AI connected four.'); return; } if(checkDraw()){ showEndModal('Draw','Board is full — it\'s a draw.'); return; } currentPlayer=1; setStatus('Your turn'); }); }

// initialize canvas sizing and draw
// ensure board exists before render is ever called
board = Array.from({length:ROWS}, ()=>Array(COLS).fill(0));
currentPlayer = 1;
resizeCanvas();
// now initialize game state after canvas exists
init();
