class Controls {
    constructor() {
        // Initialize pressed keys Set
        this.pressedKeys = new Set();
        
        // Initialize touch state
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            drill: false
        };

        // Bind keyboard event handlers
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

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
        return this.pressedKeys.has(key) || (key === 'Space' && this.touchControls.drill);
    }
}
