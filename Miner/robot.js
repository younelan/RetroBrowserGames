class Robot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 2;
        this.pathState = 'horizontal'; // 'horizontal' or 'vertical'
        this.pathCounter = 0;
        this.pathLimit = 60; // Number of frames to move in one direction
    }

    update(level) {
        if (this.pathState === 'horizontal') {
            this.x += this.direction * this.speed;
        } else { // vertical
            this.y += this.direction * this.speed;
        }
        
        this.pathCounter++;
        if (this.pathCounter >= this.pathLimit) {
            this.pathCounter = 0;
            this.direction *= -1; // Reverse direction
            this.pathState = (this.pathState === 'horizontal') ? 'vertical' : 'horizontal'; // Switch path state
        }

        // Use actual level height instead of hardcoded constant
        const actualLevelHeight = level.levelHeight * TILE_SIZE;
        
        // Simple boundary collision for vertical movement
        if (this.y < 0 || this.y + this.height > actualLevelHeight) {
            this.direction *= -1;
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        context.save();

        // Apply horizontal flip based on direction when moving horizontally
        if (this.pathState === 'horizontal' && this.direction === -1) {
            context.translate(this.x + this.width, this.y);
            context.scale(-1, 1);
            context.translate(-(this.x + this.width), -this.y);
        }

        const s = this.width / 16;
        const animTime = Date.now() * 0.01;
        
        // Robot Guardian - side view with animations
        // Main chassis (with slight mechanical vibration)
        const vibration = Math.sin(animTime * 4) * 0.5;
        context.fillStyle = '#666666'; // Steel grey
        context.fillRect(this.x + 2 * s + vibration, this.y + 6 * s, 12 * s, 16 * s);
        
        // Head/Sensor dome
        context.fillStyle = '#888888'; // Lighter grey
        context.fillRect(this.x + 4 * s + vibration, this.y + 2 * s, 8 * s, 6 * s);
        
        // Sensor eye (changes color and pulses based on path state)
        const eyePulse = 0.5 + 0.5 * Math.sin(animTime * 3);
        if (this.pathState === 'horizontal') {
            const red = Math.floor(255 * eyePulse);
            context.fillStyle = `rgb(${red}, 0, 0)`; // Pulsing red for horizontal
        } else {
            const blue = Math.floor(255 * eyePulse);
            context.fillStyle = `rgb(0, 0, ${blue})`; // Pulsing blue for vertical
        }
        context.fillRect(this.x + 7 * s + vibration, this.y + 4 * s, 2 * s, 2 * s);
        
        // Arm/Weapon (left side) - animated recoil
        const weaponRecoil = Math.sin(animTime * 2) * s;
        context.fillStyle = '#555555';
        context.fillRect(this.x + 1 * s + vibration, this.y + 8 * s, 3 * s, 6 * s);
        context.fillRect(this.x - 1 * s + weaponRecoil + vibration, this.y + 10 * s, 3 * s, 2 * s); // Weapon barrel
        
        // Arm/Weapon (right side) - animated recoil (opposite phase)
        context.fillRect(this.x + 12 * s + vibration, this.y + 8 * s, 3 * s, 6 * s);
        context.fillRect(this.x + 14 * s - weaponRecoil + vibration, this.y + 10 * s, 3 * s, 2 * s); // Weapon barrel
        
        // Legs/Treads (animated with more dynamic movement)
        context.fillStyle = '#333333';
        const treadSpeed = this.pathState === 'horizontal' ? 6 : 3; // Faster when moving horizontally
        const treadOffset = (Math.floor((this.x + this.y) / treadSpeed) % 8);
        context.fillRect(this.x + 3 * s + vibration, this.y + 22 * s, 10 * s, 6 * s); // Base
        
        // Tread details (more segments for smoother animation)
        context.fillStyle = '#222222';
        for (let i = 0; i < 4; i++) {
            const offset = (treadOffset + i * 2) % 10;
            context.fillRect(this.x + 3 * s + offset + vibration, this.y + 22 * s, 1 * s, 6 * s);
        }
        
        // Antenna (with slight sway)
        const antennaSway = Math.sin(animTime * 1.5) * 0.5 * s;
        context.fillStyle = '#777777';
        context.fillRect(this.x + 8 * s + antennaSway + vibration, this.y, 1 * s, 4 * s);
        context.fillRect(this.x + 7 * s + antennaSway + vibration, this.y, 3 * s, 1 * s); // Antenna tip
        
        // Status lights (blinking based on movement state)
        const blinkRate = this.pathState === 'horizontal' ? 8 : 4;
        if (Math.floor(animTime * blinkRate) % 2 === 0) {
            context.fillStyle = this.pathState === 'horizontal' ? '#ff0000' : '#0000ff';
            context.fillRect(this.x + 2 * s + vibration, this.y + 4 * s, 1 * s, 1 * s);
            context.fillRect(this.x + 13 * s + vibration, this.y + 4 * s, 1 * s, 1 * s);
        }

        context.restore();
    }
}
