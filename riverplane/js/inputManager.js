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
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false
        };

        this.lastShootTime = 0;
        this.shootCooldown = 100; // Milliseconds between shots

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
        
        // Touch controls now handled directly by game canvas
    }

    handleGameAreaTouch(horizontalSection, verticalSection) {
        // Reset touch controls
        this.resetTouchControls();

        // Add shoot cooldown check
        const currentTime = performance.now();
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            this.touchControls.shoot = true;
            this.lastShootTime = currentTime;
        }

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
