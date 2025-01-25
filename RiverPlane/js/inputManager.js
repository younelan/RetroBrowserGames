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

        this.touchState = {
            isPressed: false,
            lastX: null,
            lastY: null,
            movementThreshold: 3,
            gridSection: { h: -1, v: -1 }
        };

        this.touchData = {
            active: false,
            lastX: 0,
            lastY: 0,
            rect: null
        };

        this.lastTouch = {
            x: 0,
            y: 0,
            active: false,
            moveThreshold: 5 // pixels of movement needed to trigger direction change
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
        
        // Touch controls now handled directly by game canvas
    }

    handleGameAreaTouch(horizontalSection, verticalSection, touch, isMove) {
        const rect = this.game.canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        if (!isMove) {
            // Initial touch - use grid system
            this.touchState.isPressed = true;
            this.touchState.lastX = currentX;
            this.touchState.lastY = currentY;
            this.touchState.gridSection.h = horizontalSection;
            this.touchState.gridSection.v = verticalSection;
            
            // Apply grid-based controls
            this.processGridControls(horizontalSection, verticalSection);
        } else if (this.touchState.isPressed) {
            // Reset controls before applying new ones
            this.resetTouchControls();

            if (this.touchState.lastX !== null && this.touchState.lastY !== null) {
                // Calculate movement from last position
                const deltaX = currentX - this.touchState.lastX;
                const deltaY = currentY - this.touchState.lastY;

                // Immediate direction change based on current movement
                if (Math.abs(deltaX) > this.touchState.movementThreshold) {
                    this.touchControls.left = deltaX < 0;
                    this.touchControls.right = deltaX > 0;
                } else if (this.touchState.gridSection.h === 0) {
                    this.touchControls.left = true;
                } else if (this.touchState.gridSection.h === 2) {
                    this.touchControls.right = true;
                }

                if (Math.abs(deltaY) > this.touchState.movementThreshold) {
                    this.touchControls.up = deltaY < 0;
                    this.touchControls.down = deltaY > 0;
                } else if (this.touchState.gridSection.v === 0) {
                    this.touchControls.up = true;
                } else if (this.touchState.gridSection.v === 2) {
                    this.touchControls.down = true;
                }
            }
        }

        // Always shoot while touching
        const currentTime = performance.now();
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            this.touchControls.shoot = true;
            this.lastShootTime = currentTime;
        }

        // Update last position
        this.touchState.lastX = currentX;
        this.touchState.lastY = currentY;
    }

    processGridControls(horizontalSection, verticalSection) {
        // Original grid-based controls
        if (horizontalSection === 0) {
            this.touchControls.left = true;
        } else if (horizontalSection === 2) {
            this.touchControls.right = true;
        }

        if (verticalSection === 0) {
            this.touchControls.up = true;
        } else if (verticalSection === 2) {
            this.touchControls.down = true;
        }

        // Always shoot on touch
        const currentTime = performance.now();
        if (currentTime - this.lastShootTime >= this.shootCooldown) {
            this.touchControls.shoot = true;
            this.lastShootTime = currentTime;
        }
    }

    resetTouchControls() {
        Object.keys(this.touchControls).forEach(key => {
            this.touchControls[key] = false;
        });

        // Only reset last positions if not pressed
        if (!this.touchState.isPressed) {
            this.touchState.lastX = null;
            this.touchState.lastY = null;
            this.touchState.gridSection.h = -1;
            this.touchState.gridSection.v = -1;
        }
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
