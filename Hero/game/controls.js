class Controls {
    constructor() {
        this.pressedKeys = new Set();
        
        // Add weapon keys to touch controls
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            drill: false,
            laser: false,  // Space bar
            dynamite: false // X key
        };

        // Bind keyboard event handlers
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'x') {
                e.preventDefault(); // Prevent page scroll
            }
            this.pressedKeys.add(e.key.toLowerCase());
        });

        window.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key.toLowerCase());
        });

        // Bind touch event handlers
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const upBtn = document.getElementById('upBtn');
        const drillBtn = document.getElementById('drillBtn');

        // Touch start events
        leftBtn?.addEventListener('touchstart', () => this.touchControls.left = true);
        rightBtn?.addEventListener('touchstart', () => this.touchControls.right = true);
        upBtn?.addEventListener('touchstart', () => this.touchControls.up = true);
        drillBtn?.addEventListener('touchstart', () => this.touchControls.drill = true);

        // Touch end events
        leftBtn?.addEventListener('touchend', () => this.touchControls.left = false);
        rightBtn?.addEventListener('touchend', () => this.touchControls.right = false);
        upBtn?.addEventListener('touchend', () => this.touchControls.up = false);
        drillBtn?.addEventListener('touchend', () => this.touchControls.drill = false);

        // Mouse events for testing on desktop
        leftBtn?.addEventListener('mousedown', () => this.touchControls.left = true);
        rightBtn?.addEventListener('mousedown', () => this.touchControls.right = true);
        upBtn?.addEventListener('mousedown', () => this.touchControls.up = true);
        drillBtn?.addEventListener('mousedown', () => this.touchControls.drill = true);

        leftBtn?.addEventListener('mouseup', () => this.touchControls.left = false);
        rightBtn?.addEventListener('mouseup', () => this.touchControls.right = false);
        upBtn?.addEventListener('mouseup', () => this.touchControls.up = false);
        drillBtn?.addEventListener('mouseup', () => this.touchControls.drill = false);

        // Add weapon touch controls
        const laserBtn = document.getElementById('laserBtn');
        const dynamiteBtn = document.getElementById('dynamiteBtn');

        if (laserBtn) {
            laserBtn.addEventListener('touchstart', () => this.touchControls.laser = true);
            laserBtn.addEventListener('touchend', () => this.touchControls.laser = false);
            laserBtn.addEventListener('mousedown', () => this.touchControls.laser = true);
            laserBtn.addEventListener('mouseup', () => this.touchControls.laser = false);
        }

        if (dynamiteBtn) {
            dynamiteBtn.addEventListener('touchstart', () => this.touchControls.dynamite = true);
            dynamiteBtn.addEventListener('touchend', () => this.touchControls.dynamite = false);
            dynamiteBtn.addEventListener('mousedown', () => this.touchControls.dynamite = true);
            dynamiteBtn.addEventListener('mouseup', () => this.touchControls.dynamite = false);
        }

        // Touch controls
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStart = { x: touch.clientX, y: touch.clientY };
            this.touchDrag = { x: 0, y: 0 };
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.touchStart) {
                const touch = e.touches[0];
                this.touchDrag = {
                    x: touch.clientX - this.touchStart.x,
                    y: touch.clientY - this.touchStart.y
                };
            }
        });
        
        document.addEventListener('touchend', () => {
            this.touchStart = null;
            this.touchDrag = null;
        });
        
        // Double tap for bomb
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                this.pressedKeys.add('Space');
                setTimeout(() => this.pressedKeys.delete('Space'), 100);
            }
            lastTap = currentTime;
        });
    }

    handleKeyDown(event) {
        this.pressedKeys.add(event.code);
    }

    handleKeyUp(event) {
        this.pressedKeys.delete(event.code);
    }

    isPressed(key) {
        if (this.touchDrag) {
            const DRAG_THRESHOLD = 30;
            switch(key) {
                case 'ArrowLeft':
                    return this.touchDrag.x < -DRAG_THRESHOLD || this.touchControls.left;
                case 'ArrowRight':
                    return this.touchDrag.x > DRAG_THRESHOLD || this.touchControls.right;
                case 'ArrowUp':
                    return this.touchDrag.y < -DRAG_THRESHOLD || this.touchControls.up;
            }
        }
        // Add weapon controls to touch check
        if (key === 'Space') return this.pressedKeys.has(key.toLowerCase()) || this.touchControls.laser;
        if (key === 'KeyX') return this.pressedKeys.has(key.toLowerCase()) || this.touchControls.dynamite;
        return this.pressedKeys.has(key.toLowerCase()) || (key === 'Space' && this.touchControls.drill);
    }
}
