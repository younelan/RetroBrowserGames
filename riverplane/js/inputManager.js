export class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            Space: false
        };
        this.touch = {
            moving: false,
            x: 0,
            y: 0
        };
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false
        };

        this.initListeners();
    }

    initListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = true;
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
                e.preventDefault();
            }
        });
        
        // Touch controls
        this.game.controlsCanvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.game.controlsCanvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.game.controlsCanvas.addEventListener('touchend', () => {
            this.touch.moving = false;
        });
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.game.controlsCanvas.getBoundingClientRect();
        this.touch.moving = true;
        this.touch.x = touch.clientX - rect.left;

        const horizontalSection = Math.floor((touch.clientX - rect.left) / (rect.width / 3));
        const verticalSection = Math.floor((touch.clientY - rect.top) / (rect.height / 3));
        this.handleGameAreaTouch(horizontalSection, verticalSection);
    }

    handleGameAreaTouch(horizontalSection, verticalSection) {
        // Reset touch controls
        this.resetTouchControls();

        // Always shoot in any zone
        this.touchControls.shoot = true;

        // Horizontal controls
        if (horizontalSection === 0) {
            this.touchControls.left = true;
        } else if (horizontalSection === 2) {
            this.touchControls.right = true;
        }

        // Vertical controls
        if (verticalSection === 0) {
            this.touchControls.up = true;
        } else if (verticalSection === 2) {
            this.touchControls.down = true;
        }
    }

    resetTouchControls() {
        Object.keys(this.touchControls).forEach(key => {
            this.touchControls[key] = false;
        });
    }

    isMovingLeft() {
        return this.keys.ArrowLeft || this.touchControls.left;
    }

    isMovingRight() {
        return this.keys.ArrowRight || this.touchControls.right;
    }

    isMovingUp() {
        return this.keys.ArrowUp || this.touchControls.up;
    }

    isMovingDown() {
        return this.keys.ArrowDown || this.touchControls.down;
    }

    isShooting() {
        return this.keys.Space || this.touchControls.shoot;
    }
}
