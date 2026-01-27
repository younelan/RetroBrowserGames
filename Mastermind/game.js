/* Mastermind — simple, mobile-first vanilla JS
 * - 4 pegs, 10 attempts
 * - per-row validate button
 * - inline color picker + palette
 * - per-position feedback dots (correct/near/wrong)
 */

const COLORS = [
  {name:'Red', hex:'#ef4444'},
  {name:'Orange', hex:'#f97316'},
  {name:'Yellow', hex:'#facc15'},
  {name:'Green', hex:'#10b981'},
  {name:'Blue', hex:'#3b82f6'},
  {name:'Purple', hex:'#8b5cf6'}
];
const PEGS = 4;
const ATTEMPTS = 10;

let secret = [];
let attempt = 0;
let selectedColor = null;
let activePeg = null;
// track globally eliminated colors (proven not present)
let eliminated = Array(COLORS.length).fill(false);

const boardEl = document.getElementById('board');
const paletteEl = document.getElementById('palette');
const restartBtn = document.getElementById('restartBtn');
const statusEl = document.getElementById('status');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalMsg = document.getElementById('modalMsg');
const modalRestart = document.getElementById('modalRestart');
const pickerEl = document.getElementById('picker');

function randChoice(){ return Math.floor(Math.random()*COLORS.length); }

function newGame(){
  secret = Array.from({length:PEGS}, ()=>randChoice());
  attempt = 0; selectedColor = null; activePeg = null;
  eliminated = Array(COLORS.length).fill(false);
  renderPalette(); renderBoard(); updateStatus(); hideModal();
}

function renderPalette(){
  paletteEl.innerHTML = '';
  COLORS.forEach((c,idx)=>{
    const b = document.createElement('button');
    b.className = 'color';
    if(eliminated[idx]) b.classList.add('eliminated');
    b.style.background = c.hex; b.title = c.name; b.setAttribute('data-index', idx);
    b.addEventListener('click', ()=>{ selectedColor = idx; document.querySelectorAll('.palette .color').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); });
    paletteEl.appendChild(b);
  });
}

function renderBoard(){
  boardEl.innerHTML = '';
  for(let r=0;r<ATTEMPTS;r++){
    const row = document.createElement('div'); row.className = 'row'; row.setAttribute('data-row', r);
    const pegs = document.createElement('div'); pegs.className = 'pegs';
    for(let p=0;p<PEGS;p++){ const peg = document.createElement('button'); peg.className='peg empty'; peg.setAttribute('data-row', r); peg.setAttribute('data-pos', p); peg.addEventListener('click', onPegClick); peg.addEventListener('touchstart', onPegClick, {passive:true}); pegs.appendChild(peg); }
    const feedback = document.createElement('div'); feedback.className='feedback';
    for(let d=0; d<PEGS; d++){ const fd = document.createElement('div'); fd.className='fb-dot wrong'; fd.setAttribute('aria-label','No match'); fd.setAttribute('title','No match'); feedback.appendChild(fd); }
    const validateBtn = document.createElement('button'); validateBtn.className='validate-btn disabled'; validateBtn.textContent='Validate'; validateBtn.setAttribute('data-row', r);
    validateBtn.addEventListener('click', ()=>{ if(r!==attempt){ flashStatus('Only the active row can be validated'); return; } submitGuess(); });
    const clearBtnRow = document.createElement('button'); clearBtnRow.className='clear-btn disabled'; clearBtnRow.textContent='Clear'; clearBtnRow.setAttribute('data-row', r);
    clearBtnRow.addEventListener('click', ()=>{ if(r!==attempt){ flashStatus('Only the active row can be cleared'); return; } clearCurrent(); });
    row.appendChild(pegs); row.appendChild(feedback); row.appendChild(validateBtn); row.appendChild(clearBtnRow);
    boardEl.appendChild(row);
  }
  showActiveRow();
}

function showActiveRow(){
  document.querySelectorAll('.row').forEach((row, idx)=>{
    row.classList.toggle('active', idx===attempt);
    row.classList.toggle('locked', idx<attempt);
    row.style.opacity = idx===attempt ? '1' : idx<attempt ? '0.7' : '0.95';
    if(idx===attempt){ row.querySelectorAll('.peg').forEach(p=>p.classList.remove('active')); const first = row.querySelector('.peg.empty'); if(first) first.classList.add('active'); row.scrollIntoView({behavior:'smooth', block:'center'}); }
    const btn = row.querySelector('.validate-btn'); if(btn){ if(idx===attempt){ btn.classList.add('enabled'); btn.classList.remove('disabled'); btn.disabled=false; } else { btn.classList.remove('enabled'); btn.classList.add('disabled'); btn.disabled=true; } }
    const cbtn = row.querySelector('.clear-btn'); if(cbtn){ if(idx===attempt){ cbtn.classList.add('enabled'); cbtn.classList.remove('disabled'); cbtn.disabled=false; } else { cbtn.classList.remove('enabled'); cbtn.classList.add('disabled'); cbtn.disabled=true; } }
  });
}

function onPegClick(e){
  const el = e.currentTarget; const row = Number(el.getAttribute('data-row'));
  if(row !== attempt) return;
  // ignore clicks on locked (prefilled) pegs
  if(el.getAttribute('data-locked') === 'true' || el.classList.contains('locked')) return;
  if(selectedColor !== null){ setPegColor(el, selectedColor); selectedColor = null; document.querySelectorAll('.palette .color').forEach(x=>x.classList.remove('selected')); return; }
  showPicker(el);
}

function setPegColor(pegEl, colorIdx){ pegEl.classList.remove('empty'); pegEl.style.background = COLORS[colorIdx].hex; pegEl.setAttribute('data-color', colorIdx); const r = pegEl.getAttribute('data-row'); const pos = Number(pegEl.getAttribute('data-pos')); const rowEl = document.querySelector(`.row[data-row="${r}"]`); if(rowEl){ const dots = rowEl.querySelectorAll('.fb-dot'); if(dots[pos]){ dots[pos].classList.remove('correct','near'); dots[pos].classList.add('wrong'); dots[pos].setAttribute('title','No match'); dots[pos].setAttribute('aria-label','No match'); } } }

function clearCurrent(){
  const row = document.querySelector(`.row[data-row="${attempt}"]`);
  if(!row) return;
  row.querySelectorAll('.peg').forEach(p=>{
    // don't clear locked/prefilled pegs
    if(p.getAttribute('data-locked') === 'true' || p.classList.contains('locked')) return;
    p.classList.add('empty'); p.style.background=''; p.removeAttribute('data-color');
  });
  const dots = row.querySelectorAll('.fb-dot');
  dots.forEach(d=>{ d.classList.remove('correct','near'); d.classList.add('wrong'); d.setAttribute('title','No match'); d.setAttribute('aria-label','No match'); });
  hidePicker();
}

function getCurrentGuess(){ const row = document.querySelector(`.row[data-row="${attempt}"]`); if(!row) return Array.from({length:PEGS}).map(()=>null); const colors = []; row.querySelectorAll('.peg').forEach(p=>{ const c = p.getAttribute('data-color'); colors.push(c===null?null:Number(c)); }); return colors; }

function submitGuess(){
  const guess = getCurrentGuess();
  if(guess.some(v=>v===null)){
    flashStatus('Fill all pegs before validating');
    return;
  }

  const fb = computeFeedbackPerPosition(guess, secret);
  showFeedbackForRow(attempt, fb);

  // Update elimination: if a color in this guess has no black/white hits, mark it eliminated
  const unique = Array.from(new Set(guess));
  unique.forEach(c=>{
    if(c === null) return;
    const positions = guess.map((g,i)=>g===c?i:-1).filter(i=>i>=0);
    const anyMatch = positions.some(i=> fb[i] === 'black' || fb[i] === 'white');
    eliminated[c] = !anyMatch;
  });
  updateEliminationUI();

  // Prefill exact matches (black) into the next attempt row and lock them
  const nextIndex = attempt + 1;
  if(nextIndex < ATTEMPTS){
    const nextRow = document.querySelector(`.row[data-row="${nextIndex}"]`);
    if(nextRow){
      guess.forEach((g, pos)=>{
        if(fb[pos] === 'black' && g != null){
          const peg = nextRow.querySelector(`.peg[data-pos="${pos}"]`);
          if(peg){
            setPegColor(peg, g);
            peg.classList.add('locked');
            peg.setAttribute('data-locked','true');
            peg.setAttribute('title','Correct (locked)');
          }
        }
      });
    }
  }

  attempt++;
  showActiveRow();
  updateStatus();

  if(fb.filter(x=>x==='black').length === PEGS){ showModal('You Win!','Congratulations — you cracked the code!'); revealSecret(); return; }
  if(attempt >= ATTEMPTS){ showModal('Game Over', `Out of attempts — code was ${formatSecret()}`); revealSecret(); }
}

function computeFeedbackPerPosition(guess, secretArr){
  // returns array of length PEGS with 'black'|'white'|'wrong' for each position
  const res = Array(PEGS).fill('wrong');
  const secretLeft = {};
  // first pass: mark exact matches
  for(let i=0;i<PEGS;i++){
    if(guess[i] === secretArr[i]) res[i] = 'black';
    else secretLeft[secretArr[i]] = (secretLeft[secretArr[i]]||0) + 1;
  }
  // second pass: for non-exact, assign white if color exists in secretLeft
  for(let i=0;i<PEGS;i++){
    if(res[i] === 'black') continue;
    const g = guess[i];
    if(g != null && secretLeft[g]){ res[i] = 'white'; secretLeft[g]--; }
  }
  return res;
}

function showFeedbackForRow(rowIndex, fbArr){
  const row = document.querySelector(`.row[data-row="${rowIndex}"]`); if(!row) return;
  const dots = Array.from(row.querySelectorAll('.fb-dot'));
  for(let i=0;i<dots.length;i++){ dots[i].classList.remove('correct','near','wrong'); const v = fbArr[i]; if(v === 'black'){ dots[i].classList.add('correct'); dots[i].setAttribute('title','Exact match'); dots[i].setAttribute('aria-label','Exact match'); }
    else if(v === 'white'){ dots[i].classList.add('near'); dots[i].setAttribute('title','Wrong place'); dots[i].setAttribute('aria-label','Wrong place'); }
    else { dots[i].classList.add('wrong'); dots[i].setAttribute('title','No match'); dots[i].setAttribute('aria-label','No match'); } }
  // mark validated and disable validate button
  let val = row.querySelector('.validation'); if(!val){ val = document.createElement('div'); val.className='validation'; row.appendChild(val); }
  val.innerHTML = '<span class="check" aria-hidden="true">✓</span>';
  const btn = row.querySelector('.validate-btn'); if(btn){ btn.disabled=true; btn.classList.remove('enabled'); btn.classList.add('disabled'); btn.textContent='Validated'; }
}

function formatSecret(){ return secret.map(i=>COLORS[i].name).join(', '); }

function revealSecret(){ const reveal = document.createElement('div'); reveal.className='row'; const pegs = document.createElement('div'); pegs.className='pegs'; secret.forEach(i=>{ const p = document.createElement('div'); p.className='peg'; p.style.background = COLORS[i].hex; pegs.appendChild(p); }); reveal.appendChild(pegs); boardEl.prepend(reveal); }

function updateStatus(){ statusEl.textContent = `Attempt ${Math.min(attempt+1, ATTEMPTS)}/${ATTEMPTS}`; }
function flashStatus(msg){ statusEl.textContent = msg; setTimeout(updateStatus, 1200); }

function showModal(title,msg){ modalTitle.textContent = title; modalMsg.textContent = msg; modal.classList.remove('hidden'); }
function hideModal(){ modal.classList.add('hidden'); }

restartBtn.addEventListener('click', ()=>newGame());
modalRestart.addEventListener('click', ()=>{ hideModal(); newGame(); });

newGame();

function buildPicker(){
  if(!pickerEl) return;
  pickerEl.innerHTML = '';
  COLORS.forEach((c,idx)=>{
    const sw = document.createElement('button');
    sw.className='swatch';
    if(eliminated[idx]) sw.classList.add('eliminated');
    sw.style.background=c.hex; sw.title=c.name; sw.setAttribute('data-index', idx);
    sw.addEventListener('click', ()=>{
      if(activePeg){ setPegColor(activePeg, idx); activePeg.classList.remove('active'); }
      // selecting an eliminated color should still allow choosing it if user insists
      hidePicker();
    });
    pickerEl.appendChild(sw);
  });
}

function updateEliminationUI(){
  // update palette
  document.querySelectorAll('.palette .color').forEach(b=>{
    const idx = Number(b.getAttribute('data-index'));
    if(eliminated[idx]) b.classList.add('eliminated'); else b.classList.remove('eliminated');
  });
  // update picker if present
  if(pickerEl){ pickerEl.querySelectorAll('.swatch').forEach(s=>{
    const idx = Number(s.getAttribute('data-index'));
    if(eliminated[idx]) s.classList.add('eliminated'); else s.classList.remove('eliminated');
  }); }
}



function showPicker(pegEl){
  if(!pickerEl) return;
  activePeg = pegEl;
  buildPicker();
  // ensure picker is interactive
  if ('inert' in HTMLElement.prototype) pickerEl.inert = false;
  pickerEl.classList.remove('hidden');
  const r = pegEl.getBoundingClientRect();
  const width = pickerEl.offsetWidth || (COLORS.length*48);
  let left = r.left + (r.width/2) - (width/2);
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  const top = r.top - 64;
  pickerEl.style.left = `${left}px`;
  pickerEl.style.top = `${Math.max(12, top)}px`;
  pickerEl.setAttribute('aria-hidden','false');
  // focus first swatch for keyboard users
  const first = pickerEl.querySelector('.swatch');
  if(first) first.focus();
}

function hidePicker(){
  if(!pickerEl) return;
  // If a descendant of picker currently has focus, move focus back to the originating peg
  const active = document.activeElement;
  if(pickerEl.contains(active)){
    if(activePeg && typeof activePeg.focus === 'function'){
      activePeg.focus();
    } else if(boardEl && typeof boardEl.focus === 'function'){
      boardEl.focus();
    } else {
      // blur as a last resort
      try{ active.blur(); }catch(e){}
    }
  }
  // use inert when available to prevent focusability
  if ('inert' in HTMLElement.prototype) pickerEl.inert = true;
  pickerEl.classList.add('hidden');
  pickerEl.setAttribute('aria-hidden','true');
  activePeg = null;
}

document.addEventListener('click', (e)=>{ if(!pickerEl) return; if(!pickerEl.contains(e.target) && !(e.target.closest('.peg'))) hidePicker(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') hidePicker(); });
