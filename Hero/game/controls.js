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
            dynamite: false,
            leftIntensity: 0,
            rightIntensity: 0,
            upIntensity: 0,
            downIntensity: 0
        };

        // Touch tracking
        this.touchStart = null;
        this.touchDrag = null;
        this.isDrawingJoystick = false;
        this.touchId = null;
        this.lastTap = 0;

        // Add property to track when the down/dynamite controls were activated
        this.downControlStartedOnGround = false;

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
                // Remove the setTimeout to allow the press to be detected properly
            });
            
            bombBtn.addEventListener('touchend', () => {
                this.touchControls.dynamite = false;
            });
            
            // Mouse events for dynamite button (desktop testing)
            bombBtn.addEventListener('mousedown', () => {
                this.touchControls.dynamite = true;
            });
            
            bombBtn.addEventListener('mouseup', () => {
                this.touchControls.dynamite = false;
            });
            
            bombBtn.addEventListener('mouseleave', () => {
                this.touchControls.dynamite = false;
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
                
                // Reset the ground tracking state on new touch
                this.downControlStartedOnGround = false;
            }
        }, { passive: false });
        
        gameCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            // Find our tracked touch
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchId) {
                    const DRAG_THRESHOLD = 20;
                    // Require a larger threshold for downward movement to prevent accidental dynamite drops
                    const DOWN_DRAG_THRESHOLD = 40; 
                    
                    this.touchDrag = {
                        x: touch.clientX - this.touchStart.x,
                        y: touch.clientY - this.touchStart.y
                    };
                    
                    // Calculate normalized intensity (0-1+) based on drag distance
                    const MAX_DRAG = 80; // Maximum distance for full speed
                    
                    // Reset all directional values first to handle direction changes properly
                    this.touchControls.leftIntensity = 0;
                    this.touchControls.rightIntensity = 0;
                    this.touchControls.upIntensity = 0;
                    this.touchControls.downIntensity = 0;
                    this.touchControls.left = false;
                    this.touchControls.right = false;
                    this.touchControls.up = false;
                    this.touchControls.down = false;
                    
                    // Get horizontal and vertical intensities separately
                    const horizontalIntensity = Math.min(Math.abs(this.touchDrag.x) / MAX_DRAG, 1.5);
                    const verticalIntensity = Math.min(Math.abs(this.touchDrag.y) / MAX_DRAG, 1.5);
                    
                    // Set the appropriate direction based on current drag
                    if (this.touchDrag.x < -DRAG_THRESHOLD) {
                        this.touchControls.leftIntensity = horizontalIntensity;
                        this.touchControls.left = true;
                    } else if (this.touchDrag.x > DRAG_THRESHOLD) {
                        this.touchControls.rightIntensity = horizontalIntensity;
                        this.touchControls.right = true;
                    }
                    
                    // Use standard threshold for upward, larger threshold for downward
                    if (this.touchDrag.y < -DRAG_THRESHOLD) {
                        this.touchControls.upIntensity = verticalIntensity;
                        this.touchControls.up = true;
                    } else if (this.touchDrag.y > DOWN_DRAG_THRESHOLD) { // Higher threshold for down
                        this.touchControls.downIntensity = verticalIntensity;
                        this.touchControls.down = true;
                    }
                    
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

    // Track if controls should allow dynamite based on being on ground
    setOnGround(isOnGround) {
        // If player is on ground and pressing down with a significant intensity, mark this as a valid dynamite trigger
        if (isOnGround) {
            if (this.pressedKeys.has('arrowdown') || this.pressedKeys.has('s')) {
                // For keyboard controls, just check if the key is pressed
                this.downControlStartedOnGround = true;
            } else if (this.touchControls.down && this.touchControls.downIntensity > 0.6) {
                // For touch controls, require a significant downward intensity
                this.downControlStartedOnGround = true;
            } else {
                // Reset if we don't have enough downward force
                this.downControlStartedOnGround = false;
            }
        } else {
            // If player is not on ground anymore, they can't drop dynamite
            this.downControlStartedOnGround = false;
        }
    }
    
    canDropDynamite() {
        // For keyboard controls, any press of down arrow will trigger dynamite
        const keyboardTrigger = this.downControlStartedOnGround && 
                             (this.pressedKeys.has('arrowdown') || this.pressedKeys.has('s'));
        
        // For touch controls, require a significant downward intensity
        const touchTrigger = this.downControlStartedOnGround && 
                          this.touchControls.down && 
                          this.touchControls.downIntensity > 0.6;
        
        return keyboardTrigger || touchTrigger;
    }

    // Add new methods to get movement intensities (0-1+)
    getHorizontalIntensity() {
        if (this.pressedKeys.has('arrowleft') || this.pressedKeys.has('a')) {
            return -1; // Full intensity for keyboard
        } else if (this.pressedKeys.has('arrowright') || this.pressedKeys.has('d')) {
            return 1; // Full intensity for keyboard
        } else if (this.touchControls.left) {
            return -this.touchControls.leftIntensity;
        } else if (this.touchControls.right) {
            return this.touchControls.rightIntensity;
        }
        return 0;
    }

    getVerticalIntensity() {
        if (this.pressedKeys.has('arrowup') || this.pressedKeys.has('w')) {
            return -1; // Full intensity for keyboard
        } else if (this.pressedKeys.has('arrowdown') || this.pressedKeys.has('s')) {
            return 1; // Full intensity for keyboard
        } else if (this.touchControls.up) {
            return -this.touchControls.upIntensity;
        } else if (this.touchControls.down) {
            return this.touchControls.downIntensity;
        }
        return 0;
    }
}

window.Controls = Controls;
