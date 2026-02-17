class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.initKeyboard();
        this.initMoveZone();
        this.initActionButtons();
    }

    initKeyboard() {
        window.onkeydown = (e) => {
            const key = e.key.toLowerCase();
            this.keys.add(key);
            if (key === ' ' || key === 'z' || key === 'x' || key === 'c' || key === 'v') {
                this.handleAction();
            }
        };
        window.onkeyup = (e) => this.keys.delete(e.key.toLowerCase());
    }

    initMoveZone() {
        const zone = document.getElementById('move-zone');
        if (!zone) return;

        let active = false;
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        const move = (e) => {
            if (!active) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            const sensitivityX = 40;
            const thresholdY = 30;

            this.game.p1.moveIntent = Math.max(-1, Math.min(1, dx / sensitivityX));

            if (dy < -thresholdY) {
                this.game.p1.jump();
            } else if (dy > thresholdY) {
                this.game.p1.isDucking = true;
            } else {
                this.game.p1.isDucking = false;
            }
        };

        const end = (e) => {
            if (!active) return;
            active = false;

            // TAP DETECTION (Short duration + minimal movement)
            const duration = Date.now() - startTime;
            const touch = e.changedTouches ? e.changedTouches[0] : e;
            const dist = Math.sqrt(Math.pow(touch.clientX - startX, 2) + Math.pow(touch.clientY - startY, 2));

            if (duration < 250 && dist < 15) {
                this.game.p1.attack('mid'); // Tap like Space
            }

            this.game.p1.moveIntent = 0;
            this.game.p1.isDucking = false;
        };

        zone.addEventListener('touchstart', (e) => {
            active = true;
            startTime = Date.now();
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);
    }

    initActionButtons() {
        const bind = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.onpointerdown = (e) => {
                e.preventDefault();
                this.keys.add(key);
                this.handleAction();
            };
            btn.onpointerup = (e) => {
                e.preventDefault();
                this.keys.delete(key);
            };
        };
        bind('btn-jump', 'w');
        bind('btn-duck', 's');
        bind('btn-high', 'z');
        bind('btn-mid', ' ');
        bind('btn-low', 'c');
        bind('btn-kick', 'v');
    }

    handleAction() {
        const p = this.game.p1;
        if (this.keys.has(' ') || this.keys.has('x')) p.attack('mid');
        if (this.keys.has('w') || this.keys.has('arrowup')) p.jump();
        if (this.keys.has('z')) p.attack('high');
        if (this.keys.has('c')) p.attack('low');
        if (this.keys.has('v')) p.attack('kick');
    }

    update() {
        let moveDir = 0;
        const p = this.game.p1;
        if (this.keys.has('arrowleft') || this.keys.has('a')) moveDir -= 1;
        if (this.keys.has('arrowright') || this.keys.has('d')) moveDir += 1;

        if (moveDir !== 0) {
            p.moveIntent = moveDir;
        }

        p.isDucking = this.keys.has('arrowdown') || this.keys.has('s') || p.isDucking;
        this.handleAction();
    }
}
