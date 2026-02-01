export class UIManager {
    constructor(game) {
        this.game = game;
        this.setupListeners();
    }

    setupListeners() {
        document.getElementById('end-turn-btn').addEventListener('click', () => {
            this.game.endTurn();
        });

        document.getElementById('research-tracker').addEventListener('click', () => {
            this.showTechTree();
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
        });
    }

    showTechTree() {
        const modal = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-content-body');
        document.querySelector('.modal header h2').textContent = 'TECHNOLOGY TREE';
        modal.classList.remove('hidden');
        body.innerHTML = '';
        body.className = 'tech-grid';

        const player = this.game.getCurrentPlayer();
        const techData = this.game.techTree.techs;

        Object.values(techData).forEach(tech => {
            const div = document.createElement('div');
            div.className = 'tech-node';
            if (player.unlockedTechs.has(tech.id)) div.classList.add('unlocked');
            if (player.currentTech?.id === tech.id) div.classList.add('researching');

            div.innerHTML = `
                <div class="tech-name">${tech.name}</div>
                <div class="tech-cost">${tech.cost} Science</div>
            `;

            div.onclick = () => {
                const available = this.game.techTree.getAvailableTechs(player.unlockedTechs);
                if (available.find(t => t.id === tech.id)) {
                    player.currentTech = tech;
                    this.updateHUD(player);
                    modal.classList.add('hidden');
                }
            };
            grid.appendChild(div);
        });
    }

    updateHUD(player) {
        document.getElementById('stat-gold').innerHTML = `🪙 ${Math.floor(player.gold)} <span class="rate">(+${Math.floor(player.cities.reduce((sum, c) => sum + c.calculateYields().gold, 0))})</span>`;
        document.getElementById('stat-science').innerHTML = `🔬 ${Math.floor(player.science)} <span class="rate">(+${Math.floor(player.cities.reduce((sum, c) => sum + c.calculateYields().science, 0))})</span>`;

        const hEl = document.getElementById('stat-happiness');
        hEl.innerHTML = `😃 ${Math.round(player.happiness)}`;
        hEl.style.color = player.happiness < 0 ? '#ff7b72' : '#7ee787';

        // Add resources to HUD if they exist
        const hudStats = document.querySelector('.stats-group');
        let resEl = document.getElementById('hud-resources');
        if (!resEl) {
            resEl = document.createElement('div');
            resEl.id = 'hud-resources';
            resEl.className = 'stats-group';
            resEl.style.marginLeft = '20px';
            hudStats.appendChild(resEl);
        }
        resEl.innerHTML = `
            <div class="stat" title="Iron (Strategic)">⚙️ ${player.strategicResources.IRON}</div>
            <div class="stat" title="Horses (Strategic)">🐎 ${player.strategicResources.HORSES}</div>
        `;

        document.getElementById('stat-turn').textContent = `TURN ${this.game.turn}`;

        const yearBase = 4000;
        const year = yearBase - (this.game.turn - 1) * 40;
        document.getElementById('game-year').textContent = year > 0 ? `${year} BC` : `${Math.abs(year)} AD`;

        if (player.currentTech) {
            document.getElementById('research-tracker').classList.remove('hidden');
            document.getElementById('current-tech-name').textContent = player.currentTech.name.toUpperCase();
            const progress = (player.researchProgress / player.currentTech.cost) * 100;
            document.getElementById('tech-progress-bar').style.width = `${Math.min(100, progress)}%`;
        } else {
            document.getElementById('research-tracker').classList.add('hidden');
        }

        let goldRate = 0;
        let scienceRate = 0;
        player.cities.forEach(c => {
            const y = c.calculateYields();
            goldRate += y.gold;
            scienceRate += y.science;
        });

        const goldRateEl = document.querySelector('#stat-gold + .rate');
        const scienceRateEl = document.querySelector('#stat-science + .rate');
        if (goldRateEl) goldRateEl.textContent = `(+${Math.floor(goldRate)})`;
        if (scienceRateEl) scienceRateEl.textContent = `(+${Math.floor(scienceRate)})`;

        this.updateCityList(player);
    }

    updateCityList(player) {
        const list = document.getElementById('city-list');
        list.innerHTML = '';
        player.cities.forEach(city => {
            const div = document.createElement('div');
            div.className = 'city-item';
            div.innerHTML = `
                <div class="city-item-name">${city.name}</div>
                <div class="city-item-stats">Pop: ${city.population} | Food: ${Math.floor(city.food)}</div>
            `;
            div.onclick = () => {
                this.game.centerOn(city);
                this.game.handleHexClick(city.q, city.r);
            };
            list.appendChild(div);
        });
    }

    showSelection(entity) {
        const pane = document.getElementById('selection-pane');
        const header = document.getElementById('selection-header');
        const sub = document.getElementById('selection-sub');
        const icon = document.getElementById('selection-icon');
        const stats = document.getElementById('selection-stats');
        const actions = document.getElementById('selection-actions');

        pane.classList.remove('hidden');
        actions.innerHTML = '';
        stats.innerHTML = '';

        if (entity.type === 'tile') {
            const tile = entity.tile;
            icon.textContent = tile.terrain.icon;
            header.textContent = tile.terrain.name.toUpperCase();
            sub.textContent = `Coordinates: ${tile.q}, ${tile.r}`;

            const yields = tile.getYield();
            this.addStat(stats, 'FOOD', yields.food);
            this.addStat(stats, 'PROD', yields.production);
            this.addStat(stats, 'GOLD', yields.gold);

            if (tile.resource && tile.resource.name !== 'None') {
                const resDiv = document.createElement('div');
                resDiv.style.gridColumn = '1 / span 2';
                resDiv.style.color = 'var(--gold)';
                resDiv.style.marginTop = '10px';
                resDiv.style.padding = '10px';
                resDiv.style.background = 'rgba(242, 204, 96, 0.1)';
                resDiv.style.border = '1px solid var(--gold)';
                resDiv.style.borderRadius = '4px';
                resDiv.innerHTML = `
                    <div style="font-weight:900;margin-bottom:5px">💎 ${tile.resource.name.toUpperCase()}</div>
                    <div style="font-size:0.75rem;opacity:0.8">Military units cannot interact with resources.</div>
                    <div style="font-size:0.75rem;margin-top:5px;color:white">Build a <b>WORKER</b> in your city to mine or harvest this resource!</div>
                `;
                stats.appendChild(resDiv);
            }

            if (tile.village) {
                const vilDiv = document.createElement('div');
                vilDiv.style.gridColumn = '1 / span 2';
                vilDiv.style.color = 'var(--accent-color)';
                vilDiv.innerHTML = `TRIBAL VILLAGE!<br><small>Move a unit here to enter</small>`;
                stats.appendChild(vilDiv);
            }
            return;
        }

        if (entity.type && entity.type.name) { // Unit
            icon.textContent = entity.type.icon;
            header.textContent = entity.type.name;
            sub.textContent = entity.owner.name;

            this.addStat(stats, 'HEALTH', `${Math.round(entity.health)}%`);
            this.addStat(stats, 'MOVES', `${entity.movementPoints}/${entity.type.move}`);
            this.addStat(stats, 'STR', entity.type.strength);

            // Show Task
            const taskDiv = document.createElement('div');
            taskDiv.style.gridColumn = '1 / span 2';
            taskDiv.style.color = 'var(--accent-color)';
            taskDiv.style.fontSize = '0.75rem';
            taskDiv.style.marginTop = '5px';
            const workDisplay = entity.workRemaining > 0 ? ` (${entity.workRemaining} turns)` : '';
            taskDiv.innerHTML = `<strong>STATUS:</strong> ${entity.task}${workDisplay}`;
            stats.appendChild(taskDiv);

            entity.type.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'premium-btn';
                btn.textContent = action.toUpperCase();
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.game.handleAction(entity, action);
                };
                actions.appendChild(btn);
            });
        } else { // City
            icon.textContent = '🏰';
            header.textContent = entity.name;
            sub.textContent = `${entity.owner.name} Colony`;

            this.addStat(stats, 'POP', entity.population);
            this.addStat(stats, 'FOOD', Math.floor(entity.food));
            this.addStat(stats, 'PROD', Math.floor(entity.productionStored));

            // Rename Button
            const renameBtn = document.createElement('button');
            renameBtn.className = 'premium-btn';
            renameBtn.textContent = '✏️ RENAME';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                this.showRenameModal(entity);
            };
            actions.appendChild(renameBtn);

            // Show production queue
            if (entity.productionQueue.length > 0) {
                const qDiv = document.createElement('div');
                qDiv.style.gridColumn = '1 / span 2';
                qDiv.style.color = 'var(--production)';
                qDiv.style.fontSize = '0.7rem';
                qDiv.style.marginTop = '10px';
                qDiv.style.background = 'rgba(255, 255, 255, 0.05)';
                qDiv.style.padding = '8px';
                qDiv.style.borderRadius = '4px';

                const current = entity.productionQueue[0];
                let queueHtml = `<strong>PRODUCING:</strong> ${current.name.toUpperCase()} (${Math.floor(entity.productionStored)}/${current.cost})`;

                if (entity.productionQueue.length > 1) {
                    queueHtml += `<br><span style="color:var(--text-dim);font-size:0.6rem">UP NEXT: `;
                    queueHtml += entity.productionQueue.slice(1).map(item => item.name).join(', ');
                    queueHtml += `</span>`;
                }

                qDiv.innerHTML = queueHtml;
                stats.appendChild(qDiv);
            }

            // Dynamic production actions
            const productionOptions = [
                ...Object.values(this.game.UnitType).map(u => ({ ...u, type: 'unit' })),
                ...Object.values(this.game.BuildingType).map(b => ({ ...b, type: 'building' })),
                ...(this.game.WonderType ? Object.values(this.game.WonderType).map(w => ({ ...w, type: 'wonder' })) : []),
                { name: 'Wealth', cost: 0, icon: '💰', description: 'Convert 25% Production to Gold' },
                { name: 'Research', cost: 0, icon: '🔬', description: 'Convert 25% Production to Science' }
            ];

            productionOptions.forEach(opt => {
                // Skip if wonder already built
                if (opt.type === 'wonder') {
                    const wId = Object.keys(this.game.WonderType).find(key => this.game.WonderType[key].name === opt.name);
                    if (this.game.wondersBuilt.has(wId)) return;
                }
                // Check requirements (very basic)
                if (opt.techRequired && !entity.owner.unlockedTechs.has(opt.techRequired)) return;

                const btn = document.createElement('button');
                btn.className = 'premium-btn primary';
                btn.innerHTML = `<span style="font-size:0.8rem">${opt.icon || '🏗️'}</span> ${opt.name.toUpperCase()}`;
                const rushCost = opt.cost * 2;
                btn.title = `Queue: ${opt.cost} Prod | Buy Now: ${rushCost} Gold (Shift+Click)`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (e.shiftKey) {
                        if (entity.purchaseItem(opt)) {
                            this.showSelection(entity);
                            this.updateHUD(entity.owner);
                        } else {
                            this.notify('Not enough gold to rush production!');
                        }
                    } else {
                        this.game.handleAction(entity, `Build ${opt.name}`);
                        this.showSelection(entity);
                    }
                };
                actions.appendChild(btn);
            });
        }
    }

    addStat(container, label, value) {
        const div = document.createElement('div');
        div.innerHTML = `<span style="color:var(--text-dim)">${label}:</span> ${value}`;
        container.appendChild(div);
    }

    hideSelection() {
        document.getElementById('selection-pane').classList.add('hidden');
    }

    notify(message) {
        const container = document.getElementById('notifications');
        const note = document.createElement('div');
        note.className = 'glass-panel';
        note.style.padding = '0.75rem 1.5rem';
        note.style.marginBottom = '0.75rem';
        note.style.borderRight = '4px solid var(--accent-color)';
        note.style.fontSize = '0.8rem';
        note.style.fontWeight = '700';
        note.style.pointerEvents = 'none';
        note.textContent = message.toUpperCase();

        container.appendChild(note);
        setTimeout(() => {
            note.style.opacity = '0';
            note.style.transition = 'opacity 0.5s';
            setTimeout(() => note.remove(), 500);
        }, 3000);
    }

    showHelp() {
        const content = `
            <div style="line-height:1.6;font-size:1rem;height:100%;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:30px;overflow-y:auto">
                <div>
                    <div style="margin-bottom:20px">
                        <h3 style="color:var(--gold)">🌐 FOUNDING YOUR EMPIRE</h3>
                        <p>Every journey begins with a <b>SETTLER</b> (👤). Move to a fertile spot (Grasslands/Plains near water) and click <b>SETTLE</b>. Your city borders will grow naturally as you gain culture and population. <b>Rivers</b> provide a vital +1 Food bonus, so try to settle next to them!</p>
                    </div>

                    <div style="margin-bottom:20px">
                        <h3 style="color:var(--production)">🛠️ WORKERS & IMPROVEMENTS</h3>
                        <p>Workers are the backbone of your expansion. Build them in cities to harvest the earth:</p>
                        <ul style="margin-left:20px">
                            <li><b>MINES (⚒️):</b> Built on hills or minerals for massive Production.</li>
                            <li><b>FARMS (🚜):</b> Built on flat land for Food and growth.</li>
                            <li><b>PASTURES (🛖):</b> Built on Horses or Cattle for gold and production.</li>
                            <li><b>HARVEST:</b> A desperate move! Instantly "pick up" a resource for <b>150 Gold</b>, but it's gone from the map forever.</li>
                        </ul>
                    </div>

                    <div style="margin-bottom:20px">
                        <h3 style="color:var(--science)">🔬 RESEARCH & KNOWLEDGE</h3>
                        <p>Click the <b>Blue Tracker</b> (top left) to open the Tech Tree. Researching <b>Mining</b> allows mines; <b>Archery</b> unlocks Archers. Knowledge allows you to build stronger units and buildings.</p>
                    </div>
                </div>

                <div>
                    <div style="margin-bottom:20px">
                        <h3 style="color:#ff7b72">🛡️ DEFENSE & SURVIVAL</h3>
                        <p><b>Barbarians</b> are aggressive and will raid your cities. <b>FORTIFY</b> your military units inside city borders or nearby to gain a 50% defense bonus. Archers are your best defense—they can strike from 2 tiles away!</p>
                    </div>

                    <div style="margin-bottom:20px">
                        <h3 style="color:var(--accent-color)">🗺️ EXPLORATION</h3>
                        <p>Don't just sit idle! Seek out <b>TRIBAL VILLAGES</b> (🏡). They grant massive random treasures: free gold, new technology, or even veteran units who join your cause.</p>
                    </div>

                    <div style="margin-bottom:20px">
                        <h3 style="color:white;background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">💡 PRO TIPS</h3>
                        <ul style="margin-left:20px;font-size:0.9rem">
                            <li><b>SHIFT + CLICK:</b> Purchase units or buildings instantly with Gold (Rush).</li>
                            <li><b>CITY NAMES:</b> Use the Rename button to personalize your capital city.</li>
                            <li><b>PRODUCTION:</b> The more production a city has, the faster it builds units.</li>
                            <li><b>HEALTH:</b> Units heal over time if they don't move or are fortified.</li>
                        </ul>
                    </div>
                    
                    <button class="premium-btn primary" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="width:100%;height:60px;font-size:1.2rem;margin-top:20px;cursor:pointer">RESUME CONQUEST</button>
                </div>
            </div>
        `;
        this.openModalContent(content, '📖 CIVILOPEDIA');
    }

    showRenameModal(city) {
        const content = `
            <div style="padding:40px;text-align:center">
                <input type="text" id="city-rename-input" class="rename-input" value="${city.name}" autofocus>
                <div style="display:flex;gap:20px">
                    <button class="premium-btn primary" id="save-rename-btn" style="flex:1;height:50px">SAVE CHANGES</button>
                    <button class="premium-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="flex:1">CANCEL</button>
                </div>
            </div>
        `;
        this.openModalContent(content, '✏️ RENAME CITY');

        const input = document.getElementById('city-rename-input');
        input.select();
        input.onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('save-rename-btn').click(); };

        document.getElementById('save-rename-btn').onclick = () => {
            const newName = input.value.trim();
            if (newName) {
                city.rename(newName);
                this.updateCityList(city.owner);
                this.showSelection(city);
                this.notify(`Renamed to ${newName}`);
                document.getElementById('modal-overlay').classList.add('hidden');
            }
        };
    }

    openModalContent(content, title = 'CIVILOPEDIA') {
        const modal = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-content-body');
        document.querySelector('.modal header h2').textContent = title;
        modal.classList.remove('hidden');
        body.innerHTML = content;
        body.className = ''; // Remove tech-grid layout
    }

    showTooltip(content, x, y) {
        let el = document.getElementById('tooltip');
        if (!el) {
            el = document.createElement('div');
            el.id = 'tooltip';
            el.className = 'glass-panel';
            document.body.appendChild(el);
        }
        el.style.display = 'block';
        el.innerHTML = content;

        // Position intelligently
        const width = 180;
        const offset = 20;
        let finalX = x + offset;
        let finalY = y + offset;

        if (finalX + width > window.innerWidth) finalX = x - width - offset;

        el.style.left = `${finalX}px`;
        el.style.top = `${finalY}px`;
    }

    hideTooltip() {
        const el = document.getElementById('tooltip');
        if (el) el.style.display = 'none';
    }

    showVictoryModal(player, type) {
        const content = `
            <div style="text-align:center; padding: 3rem;">
                <h1 style="font-size: 3rem; margin-bottom: 1rem; color: var(--gold); border:none">VICTORY REACHED</h1>
                <p style="font-size: 1.5rem; margin-bottom: 2rem;">${player.name} has achieved a ${type} VICTORY!</p>
                <div class="glass-panel" style="display:inline-block; padding: 2rem; border-radius: 20px;">
                    <p>Total Cities: ${player.cities.length}</p>
                    <p>Units Command: ${player.units.length}</p>
                    <p>Techs Research: ${player.unlockedTechs.size}</p>
                    <hr style="margin: 15px 0">
                    <p style="font-size: 1.25rem; color: var(--accent-color)">TOTAL SCORE: ${Math.round(this.game.getScore(player))}</p>
                </div>
                <br><br>
                <button class="premium-btn primary" onclick="location.reload()" style="margin: 0 auto">RESTART WORLD</button>
            </div>
        `;
        this.openModalContent(content, 'GAME OVER');
    }

    showDiplomacy(otherPlayer) {
        const content = `
            <div style="text-align:center; padding: 4rem; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 5rem; margin-bottom: 1rem;">👤</div>
                <h1 style="font-size: 3.5rem; color: ${otherPlayer.color}; text-shadow: 0 0 20px ${otherPlayer.color}44; border:none; margin-bottom: 0;">${otherPlayer.name.toUpperCase()}</h1>
                <p style="font-size: 1.2rem; color: var(--text-dim); margin-bottom: 3rem;">You have encountered a new civilization.</p>
                
                <div style="font-style: italic; font-size: 1.4rem; max-width: 600px; margin-bottom: 4rem; position: relative; padding: 2rem;">
                    <span style="font-size: 4rem; position: absolute; left: -20px; top: -10px; opacity: 0.2;">"</span>
                    Greetings, traveler. I am the leader of the ${otherPlayer.name}. We seek only peace and prosperity in these lands. Shall we coexist?
                    <span style="font-size: 4rem; position: absolute; right: -10px; bottom: -40px; opacity: 0.2;">"</span>
                </div>

                <div style="display: flex; gap: 2rem;">
                    <button class="premium-btn primary" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="padding: 1rem 3rem; font-size: 1.1rem;">WE SEEK PEACE</button>
                    <button class="premium-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="padding: 1rem 3rem; font-size: 1.1rem; border-color: #ff7b72; color: #ff7b72;">YOUR LANDS ARE OURS</button>
                </div>
            </div>
        `;
        this.openModalContent(content, 'DIPLOMATIC ENCOUNTER');
    }
}
