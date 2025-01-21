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
    }

    isMovingLeft() {
        return this.keys.ArrowLeft || 
               (this.touch.moving && this.touch.x < this.game.controlsCanvas.width / 2);
    }

    isMovingRight() {
        return this.keys.ArrowRight || 
               (this.touch.moving && this.touch.x >= this.game.controlsCanvas.width / 2);
    }
    isMovingUp() {
        return this.keys.ArrowUp;
    }

    isMovingDown() {
        return this.keys.ArrowDown;
    }

    isShooting() {
        return this.keys.Space;
    }
}
