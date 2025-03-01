class Controls {
    constructor() {
        this.pressedKeys = new Set();
        
        // Touch control state
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false,
            laser: false,
            dynamite: false
        };

        // Touch tracking
        this.touchStart = null;
        this.touchDrag = null;
        this.isDrawingJoystick = false;
        this.touchId = null;
        this.lastTap = 0;

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

        // Set up weapon buttons
        this.setupWeaponButtons();
        
        // Set up touch controls
        this.setupTouchControls();
    }
    
    setupWeaponButtons() {
        const laserBtn = document.getElementById('laserBtn');
        const bombBtn = document.getElementById('bombBtn');
        
        if (laserBtn) {
            // Touch events for laser button
            laserBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.laser = true;
            });
            laserBtn.addEventListener('touchend', () => {
                this.touchControls.laser = false;
            });
            
            // Mouse events for laser button (desktop testing)
            laserBtn.addEventListener('mousedown', () => {
                this.touchControls.laser = true;
            });
            laserBtn.addEventListener('mouseup', () => {
                this.touchControls.laser = false;
            });
            laserBtn.addEventListener('mouseleave', () => {
                this.touchControls.laser = false;
            });
        }
        
        if (bombBtn) {
            // Touch events for dynamite button
            bombBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls.dynamite = true;
                setTimeout(() => {
                    this.touchControls.dynamite = false;
                }, 100); // Short press to prevent multiple bombs
            });
            
            // Mouse events for dynamite button (desktop testing)
            bombBtn.addEventListener('mousedown', () => {
                this.touchControls.dynamite = true;
                setTimeout(() => {
                    this.touchControls.dynamite = false;
                }, 100); // Short press to prevent multiple bombs
            });
        }
    }
    
    setupTouchControls() {
        const gameCanvas = document.getElementById('gameCanvas');
        
        // Add virtual joystick controls via touch drag
        gameCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.touchId === null) {
                const touch = e.touches[0];
                this.touchId = touch.identifier;
                this.touchStart = { x: touch.clientX, y: touch.clientY };
                this.isDrawingJoystick = true;
            }
        }, { passive: false });
        
        gameCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            // Find our tracked touch
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    const DRAG_THRESHOLD = 20;
                    
                    this.touchDrag = {
                        x: touch.clientX - this.touchStart.x,
                        y: touch.clientY - this.touchStart.y
                    };
                    
                    // Update control states based on drag direction
                    this.touchControls.left = this.touchDrag.x < -DRAG_THRESHOLD;
                    this.touchControls.right = this.touchDrag.x > DRAG_THRESHOLD;
                    this.touchControls.up = this.touchDrag.y < -DRAG_THRESHOLD;
                    this.touchControls.down = this.touchDrag.y > DRAG_THRESHOLD;
                    
                    break;
                }
            }
        }, { passive: false });
        
        gameCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Find if our tracked touch ended
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    // Reset touch states
                    this.touchId = null;
                    this.touchStart = null;
                    this.touchDrag = null;
                    this.isDrawingJoystick = false;
                    
                    // Reset control states
                    this.touchControls.left = false;
                    this.touchControls.right = false;
                    this.touchControls.up = false;
                    this.touchControls.down = false;
                    
                    // Check for double-tap for dynamite
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - this.lastTap;
                    if (tapLength < 300 && tapLength > 0) {
                        this.touchControls.dynamite = true;
                        setTimeout(() => {
                            this.touchControls.dynamite = false;
                        }, 100);
                    }
                    this.lastTap = currentTime;
                    
                    break;
                }
            }
        }, { passive: false });
        
        // Handle canvas cancellation events
        gameCanvas.addEventListener('touchcancel', (e) => {
            this.touchId = null;
            this.touchStart = null;
            this.touchDrag = null;
            this.isDrawingJoystick = false;
            
            // Reset all touch controls
            Object.keys(this.touchControls).forEach(key => {
                this.touchControls[key] = false;
            });
        });
    }
    
    handleKeyDown(event) {
        this.pressedKeys.add(event.code);
    }

    handleKeyUp(event) {
        this.pressedKeys.delete(event.code);
    }

    isPressed(key) {
        switch(key) {
            case 'ArrowLeft':
                return this.pressedKeys.has(key.toLowerCase()) || 
                       this.pressedKeys.has('a') || 
                       this.touchControls.left;
            case 'ArrowRight':
                return this.pressedKeys.has(key.toLowerCase()) || 
                       this.pressedKeys.has('d') || 
                       this.touchControls.right;
            case 'ArrowUp':
                return this.pressedKeys.has(key.toLowerCase()) || 
                       this.pressedKeys.has('w') || 
                       this.touchControls.up;
            case 'ArrowDown':
                return this.pressedKeys.has(key.toLowerCase()) || 
                       this.pressedKeys.has('s') || 
                       this.touchControls.down;
            case ' ': // Space for laser
                return this.pressedKeys.has(' ') || 
                       this.touchControls.laser;
            case 'KeyX': // X key for dynamite
                return this.pressedKeys.has('x') || 
                       this.touchControls.dynamite;
            default:
                return this.pressedKeys.has(key.toLowerCase());
        }
    }
    
    drawVirtualJoystick(ctx) {
        if (!this.isDrawingJoystick || !this.touchStart) return;
        
        const baseRadius = 50;
        const stickRadius = 20;
        
        // Draw joystick base (semi-transparent circle)
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.touchStart.x, this.touchStart.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Calculate stick position (clamped to base circle)
        let stickX = this.touchStart.x;
        let stickY = this.touchStart.y;
        
        if (this.touchDrag) {
            // Calculate distance and angle
            const distance = Math.sqrt(
                this.touchDrag.x * this.touchDrag.x + 
                this.touchDrag.y * this.touchDrag.y
            );
            
            // Clamp to base radius
            const clampedDistance = Math.min(distance, baseRadius - stickRadius);
            const angle = Math.atan2(this.touchDrag.y, this.touchDrag.x);
            
            // Calculate clamped position
            stickX = this.touchStart.x + Math.cos(angle) * clampedDistance;
            stickY = this.touchStart.y + Math.sin(angle) * clampedDistance;
        }
        
        // Draw joystick thumb
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(stickX, stickY, stickRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

window.Controls = Controls;
