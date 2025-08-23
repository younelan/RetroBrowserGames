// Simple client-side Rummy 71 (hotseat) implementation
// Rules implemented (subset):
// - Two decks (no jokers)
// - Deal 14 cards to each player, dealer gets 15 and discards one
// - Minimum initial lay down: 71 points (no jokers)
// - Each subsequent player who lays must lay more than previous
// - Players may only draw from Stock (center) if they checked "Will lay down this turn"
// - Ace is 1 point in A-2-3 runs, 10 points in Q-K-A runs or AAA sets

(function(){
  // --- Data helpers ---
  const SUITS = ['♠','♥','♦','♣'];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const RANK_VALUE = (r)=>{
    if(r==='A') return 1; // base value 1, special-cased later
    if(r==='J'||r==='Q'||r==='K') return 10;
    return parseInt(r,10);
  }

  function createDeck(twoDecks=true){
    const deck = [];
    const times = twoDecks?2:1;
    for(let t=0;t<times;t++){
      for(const s of SUITS){
        for(const r of RANKS){
          deck.push({suit:s,rank:r,id: `${r}${s}${t}`} )
        }
      }
    }
    return deck;
  }
  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  // --- Game state ---
  const state = {
    players:[], // {name,hand:[],laid:[]}
    current:0,
    stock:[],
    discard:[],
    lastLayValue:0,
    mustLayFlag:false // when player drew from stock they must lay this turn
  };

  // DOM refs
  const startBtn = document.getElementById('start-btn');
  const stockCount = document.getElementById('stock-count');
  const discardTop = document.getElementById('discard-top');
  const stockEl = document.getElementById('stock');
  const discardEl = document.getElementById('discard');
  const handEl = document.getElementById('hand');
  const playerInfo = document.getElementById('player-info');
  const drawStockBtn = document.getElementById('draw-stock');
  const drawDiscardBtn = document.getElementById('draw-discard');
  const layDownBtn = document.getElementById('lay-down');
  const discardBtn = document.getElementById('discard-btn');
  const willLayCheckbox = document.getElementById('will-lay');
  const laidSetsEl = document.getElementById('laid-sets');

  startBtn.addEventListener('click', startGame);
  drawStockBtn.addEventListener('click', ()=>{ drawFromStock(); });
  drawDiscardBtn.addEventListener('click', drawFromDiscard);
  // allow clicking the visible pile elements to draw
  stockEl.addEventListener('click', ()=>{ drawFromStock(); });
  discardEl.addEventListener('click', drawFromDiscard);
  layDownBtn.addEventListener('click', layDownSelected);
  discardBtn.addEventListener('click', discardSelected);

  // selection tracking
  let selectedIndexes = new Set();
  // when true, renderPlayer will skip rebuilding the hand DOM to avoid
  // intermediate reflows while we animate removals.
  let suppressHandRenders = false;

  function startGame(){
  // two players: human (index 0) and computer dealer (index 1)
  const numPlayers = 2;
  state.players = [];
  state.players.push({name:'You', hand:[], laid:[], ai:false});
  state.players.push({name:'Computer', hand:[], laid:[], ai:true});
  // human goes first after the computer (dealer) discards to start
  state.current = 0;
    state.lastLayValue = 0;
    state.mustLayFlag = false;

    // prepare deck
    const deck = shuffle(createDeck(true));
    // deal 14 each, dealer (last) gets 15
    for(let p=0;p<numPlayers;p++){
      const handCount = (p===numPlayers-1)?15:14;
      for(let k=0;k<handCount;k++) state.players[p].hand.push(deck.pop());
    }
  // record initial visual order for each player
  // no separate visual order; p.hand is authoritative and updated on drag
    // remaining deck is stock
    state.stock = deck;
    state.discard = [];
  // computer (dealer) discards one random card to start
  const dealerIdx = (numPlayers-1);
  const dealerHand = state.players[dealerIdx].hand;
  const discardIndex = Math.floor(Math.random()*dealerHand.length);
  const disc = dealerHand.splice(discardIndex,1)[0];
  state.discard.push(disc);

    selectedIndexes.clear();
    willLayCheckbox.checked = false;
    renderAll();
  }

  function renderAll(){
  stockCount.textContent = state.stock.length;
    // show top discard as a full card (no label) and stock as face-down back only
    const top = state.discard.length?state.discard[state.discard.length-1]:null;
    if(top){
      discardEl.innerHTML = '';
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      // choose color class for suits
      const suitClass = (top.suit==='♥' || top.suit==='♦') ? 'suit red' : 'suit black';
      cardEl.innerHTML = `
        <div class="corner top-left"><div class="rank">${top.rank}</div><div class="${suitClass}">${top.suit}</div></div>
        <div class="corner bottom-right"><div class="rank">${top.rank}</div><div class="${suitClass}">${top.suit}</div></div>
      `;
      // remove overlap margin for single card in pile
      cardEl.style.marginLeft = '0';
      discardEl.appendChild(cardEl);
      discardEl.classList.add('clickable');
    } else {
      discardEl.innerHTML = '';
      discardEl.classList.remove('clickable');
    }
    // render stock back card visual (no count text)
    stockEl.innerHTML = '';
    if(state.stock && state.stock.length>0){
      const back = document.createElement('div'); back.className='back';
      stockEl.appendChild(back);
      stockEl.classList.add('clickable');
    } else {
      stockEl.classList.remove('clickable');
    }
    // render computer (face-down) cards at top
    const compEl = document.getElementById('computer-hand');
    compEl.innerHTML = '';
    if(state.players && state.players.length>1){
      const comp = state.players[1];
      for(let i=0;i<comp.hand.length;i++){
        const cc = document.createElement('div'); cc.className='computer-card';
        compEl.appendChild(cc);
      }
    }
    if(state.players && state.players.length>0){
      // ensure current index is valid
      if(state.current < 0 || state.current >= state.players.length) state.current = 0;
  renderPlayer();
      renderLaidSets();
  // sync quick-discard visibility
  const quick = document.getElementById('quick-discard');
  if(selectedIndexes.size>0) quick.style.display='block'; else quick.style.display='none';
    } else {
      // no game started yet - show placeholder
      playerInfo.innerHTML = 'No game started. Press Start / Reset to deal.';
      handEl.innerHTML = '<div class="small">No hand</div>';
      laidSetsEl.innerHTML = '';
    }
  }

  function renderPlayer(){
  if(!state.players || state.players.length===0) return;
  const p = state.players[state.current];
  if(!p){ playerInfo.innerHTML = 'No active player'; handEl.innerHTML=''; return; }
  playerInfo.innerHTML = `${p.name} — Hand: ${p.hand.length} cards — Last lay: ${state.lastLayValue}`;
  // if we're suppressing hand renders (e.g. during removal animation) leave
  // the existing DOM as-is so the visual order doesn't briefly revert.
    if(!suppressHandRenders){
      handEl.innerHTML = '';
      p.hand.forEach((c,i)=>{
        const d = document.createElement('div');
        d.className='card'+(selectedIndexes.has(i)?' selected':'');
    d.dataset.cardid = c.id;
    d.dataset.index = i;
        if(selectedIndexes.has(i)) d.classList.add('picked'); else d.classList.remove('picked');
        d.setAttribute('draggable','true');
      // choose color class for suits
      const suitClass = (c.suit==='♥' || c.suit==='♦') ? 'suit red' : 'suit black';
      d.innerHTML = `
        <div class="corner top-left"><div class="rank">${c.rank}</div><div class="${suitClass}">${c.suit}</div></div>
        <div class="corner bottom-right"><div class="rank">${c.rank}</div><div class="${suitClass}">${c.suit}</div></div>
      `;
      // click selection (separate from drag)
      let isDragging = false;
      d.addEventListener('dragstart', (ev)=>{
        isDragging = true;
  ev.dataTransfer.setData('text/plain', String(i));
        ev.dataTransfer.effectAllowed = 'move';
        d.classList.add('dragging');
      });
      d.addEventListener('dragend', ()=>{ isDragging = false; d.classList.remove('dragging'); renderAll(); });
      d.addEventListener('click', (ev)=>{
        // ignore click if it was a drag
        if(isDragging) return;
        // support ctrl/meta for multi-select
        const multi = ev.ctrlKey || ev.metaKey || ev.shiftKey;
        if(!multi){ selectedIndexes.clear(); }
        if(selectedIndexes.has(i)) selectedIndexes.delete(i); else selectedIndexes.add(i);
  // quick-discard visibility handled globally in renderAll; just update classes here
        renderAll();
      });
  // drag handlers for reordering (handlers above manage dragstart/dragend)
      d.addEventListener('dragover', (ev)=>{ ev.preventDefault(); ev.dataTransfer.dropEffect='move'; });
      d.addEventListener('drop', (ev)=>{
        ev.preventDefault();
        const from = Number(ev.dataTransfer.getData('text/plain'));
        const to = Number(d.dataset.index);
        if(Number.isNaN(from) || Number.isNaN(to)) return;
        // reorder the actual hand array immediately
        const card = p.hand.splice(from,1)[0];
        p.hand.splice(to,0,card);
        selectedIndexes.clear();
        renderAll();
      });
        handEl.appendChild(d);
  });
  }
      // quick-discard handler
      const quick = document.getElementById('quick-discard');
      quick.onclick = ()=>{
        const p = state.players[state.current];
        if(selectedIndexes.size===0) return;
        // animate removals first to avoid a brief reflow showing original order
  const idxs = Array.from(selectedIndexes).sort((a,b)=>b-a);
  const handNodes = Array.from(handEl.children);
        const removingNodes = [];
        // suppress any automatic hand re-renders while animation runs
        suppressHandRenders = true;
        for(const idx of idxs){
          const node = handNodes[idx];
          if(node){ node.classList.add('removing'); removingNodes.push(node); }
        }
        // wait for transitionend or fallback timeout
        const wait = new Promise(res => {
          let pending = removingNodes.length;
          if(pending===0) return res();
          const done = ()=>{ if(--pending===0) res(); };
          removingNodes.forEach(n=>{
            n.addEventListener('transitionend', done, {once:true});
          });
          // safety fallback
          setTimeout(res, 260);
        });
        wait.then(()=>{
          // perform actual state mutation
          suppressHandRenders = false;
          for(const idx of idxs){
                  const card = p.hand.splice(idx,1)[0];
                  state.discard.push(card);
                }
          selectedIndexes.clear();
          quick.style.display='none';
          // next player
          state.current = (state.current+1)%state.players.length;
          renderAll();
          handleAIAfterTurn();
        });
      };
  }

  function renderLaidSets(){
    laidSetsEl.innerHTML='';
    state.players.forEach((pl,pi)=>{
      if(pl.laid.length===0) return;
      const box = document.createElement('div');
      box.className='laid-box';
      box.style.padding='6px';
      box.style.background='#1f1f1f';
      box.style.borderRadius='6px';
      box.innerHTML = `<div class="small">${pl.name} laid</div>`;
      pl.laid.forEach(group=>{
        const g = document.createElement('div');
        g.style.display='inline-block';g.style.margin='4px';
        g.style.padding='4px';g.style.background='#fff';g.style.color='#000';g.style.borderRadius='4px';
        g.textContent = group.map(cardToStr).join(' ')+` (${computeGroupPoints(group)} pts)`;
        box.appendChild(g);
      });
      laidSetsEl.appendChild(box);
    })
  }

  function cardToStr(c){return `${c.rank}${c.suit}`}

  function drawFromStock(){
    if(state.stock.length===0){alert('Stock empty');return}
    // pop the top card and show it briefly as dealt from stock
    const card = state.stock.pop();
    // create a temporary face-up card over the stock to simulate dealing
    const temp = document.createElement('div');
    temp.className = 'card dealt-temp';
    const suitClass = (card.suit==='♥' || card.suit==='♦') ? 'suit red' : 'suit black';
    temp.innerHTML = `
      <div class="corner top-left"><div class="rank">${card.rank}</div><div class="${suitClass}">${card.suit}</div></div>
      <div class="corner bottom-right"><div class="rank">${card.rank}</div><div class="${suitClass}">${card.suit}</div></div>
    `;
    // position temp over the stock element
    temp.style.position = 'absolute';
    temp.style.zIndex = 50;
    const rect = stockEl.getBoundingClientRect();
    const parentRect = stockEl.parentElement.getBoundingClientRect();
    // compute position relative to parent
    temp.style.left = (rect.left - parentRect.left + (rect.width - 56)/2) + 'px';
    temp.style.top = (rect.top - parentRect.top + 6) + 'px';
    // append to table area so absolute positioning is relative to it
    const table = document.getElementById('table');
    table.appendChild(temp);
    // after a short delay, add to player's hand and remove temp
    setTimeout(()=>{
  table.removeChild(temp);
  const p = state.players[state.current];
  p.hand.push(card);
  // select the newly drawn card by default
  selectedIndexes.clear();
  selectedIndexes.add(p.hand.length - 1);
  state.mustLayFlag = willLayCheckbox.checked;
  renderAll();
    }, 220);
  }
  function drawFromDiscard(){
    if(state.discard.length===0){alert('Discard empty');return}
    const card = state.discard.pop();
  const p = state.players[state.current];
  p.hand.push(card);
  // select the newly drawn card by default
  selectedIndexes.clear();
  selectedIndexes.add(p.hand.length - 1);
  // picking from discard does not set mustLayFlag
  renderAll();
  }

  function discardSelected(){
    const p = state.players[state.current];
    if(selectedIndexes.size!==1){alert('Select exactly one card to discard');return}
    const idx = Array.from(selectedIndexes)[0];
    // animate the specific card out before mutating state
    const handNodes = Array.from(handEl.children);
    const node = handNodes[idx];
      if(node){
        // prevent renderPlayer from rebuilding hand DOM while animation runs
        suppressHandRenders = true;
        node.classList.add('removing');
        const finish = ()=>{
          // cleanup listener
          node.removeEventListener('transitionend', finish);
          // mutate state
          const card = p.hand.splice(idx,1)[0];
          state.discard.push(card);
          selectedIndexes.clear();
          willLayCheckbox.checked=false; state.mustLayFlag=false;
          // next player
          state.current = (state.current+1)%state.players.length;
          suppressHandRenders = false;
          renderAll();
          // if next player is AI, let it analyze and play
          handleAIAfterTurn();
        };
        node.addEventListener('transitionend', finish, {once:true});
        // safety fallback
        setTimeout(()=>{
          if(node.classList.contains('removing')) finish();
        }, 300);
      } else {
        // fallback if node not found
        const card = p.hand.splice(idx,1)[0];
        state.discard.push(card);
        selectedIndexes.clear();
        willLayCheckbox.checked=false; state.mustLayFlag=false;
        state.current = (state.current+1)%state.players.length;
        renderAll();
        handleAIAfterTurn();
      }
  }

  function layDownSelected(){
    const p = state.players[state.current];
    if(selectedIndexes.size<3){alert('Select at least 3 cards to lay down (set or run)');return}
    const idxsDesc = Array.from(selectedIndexes).sort((a,b)=>b-a); // remove high to low
    // record removed cards with their original indices so we can restore them
    // at the same positions if validation fails.
    const removed = [];
    for(const i of idxsDesc) removed.push({index:i, card: p.hand.splice(i,1)[0]});
    const group = removed.map(r=>r.card);
    // validate group
    if(!isValidGroup(group)){ alert('Selected cards do not form a valid set or run');
  // return cards back to their original positions
  removed.sort((a,b)=>a.index - b.index);
  for(const r of removed){ p.hand.splice(r.index,0,r.card); }
      selectedIndexes.clear(); renderAll(); return;
    }
    const pts = computeGroupPoints(group);
    if(state.lastLayValue===0){ // first to lay
      if(pts<71){ alert('Initial lay must be at least 71 points and cannot use jokers');
  // restore removed cards to their original positions
  removed.sort((a,b)=>a.index - b.index);
  for(const r of removed){ p.hand.splice(r.index,0,r.card); }
        selectedIndexes.clear(); renderAll(); return; }
    } else {
      if(pts<=state.lastLayValue){ alert(`You must lay more points than previous: ${state.lastLayValue}`);
  removed.sort((a,b)=>a.index - b.index);
  for(const r of removed){ p.hand.splice(r.index,0,r.card); }
        selectedIndexes.clear(); renderAll(); return; }
    }
    // accept lay
    p.laid.push(group);
    state.lastLayValue = pts;
  // remove the laid cards from the hand (they were already removed into group)
    selectedIndexes.clear();
    willLayCheckbox.checked=false; state.mustLayFlag=false;
    // if player emptied hand they win
    if(p.hand.length===0){ alert(`${p.name} wins!`); }
    renderAll();
  }

  // --- Group validation ---
  function isValidGroup(cards){
    if(cards.length<3) return false;
    // check set: all same rank
    const allSameRank = cards.every(c=>c.rank===cards[0].rank);
    if(allSameRank) return true;
    // check run: same suit and consecutive
    const suit = cards[0].suit;
    if(!cards.every(c=>c.suit===suit)) return false;
    // map ranks to numbers, allow Ace low or high
    const ranksNum = cards.map(c=>rankNum(c.rank)).sort((a,b)=>a-b);
    // check consecutive (either low-A or high-A)
    let consecutive = true;
    for(let i=1;i<ranksNum.length;i++) if(ranksNum[i]!==ranksNum[i-1]+1) consecutive=false;
    if(consecutive) return true;
    // try Ace-high conversion: replace 1 with 14
    const ranksHigh = cards.map(c=>c.rank==='A'?14:rankNum(c.rank)).sort((a,b)=>a-b);
    consecutive = true;
    for(let i=1;i<ranksHigh.length;i++) if(ranksHigh[i]!==ranksHigh[i-1]+1) consecutive=false;
    return consecutive;
  }
  function rankNum(r){ if(r==='A') return 1; if(r==='J') return 11; if(r==='Q') return 12; if(r==='K') return 13; return parseInt(r,10); }

  function computeGroupPoints(cards){
    // For sets of A's, each Ace = 10
    const allSameRank = cards.every(c=>c.rank===cards[0].rank);
    let total=0;
    if(allSameRank && cards[0].rank==='A'){
      return cards.length * 10;
    }
    // check if run A-2-3 specifically
    const ranks = cards.map(c=>c.rank);
    const isA23 = ranks.includes('A') && ranks.includes('2') && ranks.includes('3') && cards.length>=3;
    for(const c of cards){
      if(c.rank==='A'){
        if(isA23) total += 1; else total += 10; // Q-K-A or other uses count as 10 per rules
      } else if(c.rank==='J' || c.rank==='Q' || c.rank==='K') total += 10;
      else total += parseInt(c.rank,10);
    }
    return total;
  }

  // expose small helper for testing
  // If the current player is AI, run its simple analyze/play sequence
  function handleAIAfterTurn(){
    const cur = state.current;
    if(!state.players || !state.players[cur]) return;
    const pl = state.players[cur];
    if(!pl.ai) return;
    // small delay so UI updates show the turn change
    setTimeout(()=> analyzeNextPlay(cur), 350);
  }

  function analyzeNextPlay(aiIndex){
    const ai = state.players[aiIndex];
    if(!ai || !ai.ai) return;
    // AI picks from stock (if available) then discards that same card
    if(state.stock.length===0){
      // no stock: just pass back to human
      state.current = 0;
      renderAll();
      return;
    }
  const card = state.stock.pop();
  ai.hand.push(card);
  // no separate visual order for AI
    renderAll();
    setTimeout(()=>{
      const discarded = ai.hand.pop();
  // no separate visual order for AI
      state.discard.push(discarded);
      // return turn to human (assumed index 0)
      state.current = 0;
      renderAll();
    }, 300);
  }

  window.__rummy = {state, startGame};

  // start automatically on load
  startGame();
})();
