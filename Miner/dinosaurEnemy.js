class DinosaurEnemy {
    constructor(x, y) {
        console.log('DinosaurEnemy constructor called with x:', x, 'y:', y);
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = 2 * TILE_SIZE;
        this.direction = 1;
        this.speed = 1.2; // Slightly faster than seal, slower than goose
        this.walkCycle = 0; // For leg animation
        this.headBob = 0; // For head bobbing while walking
        this.tailSwing = 0; // For tail swaying animation
        this.eyeBlink = 0; // For blinking animation
    }

    update(level) {
        const nextX = this.x + this.direction * this.speed;
        const enemyLeadingEdgeX = (this.direction === 1) ? (nextX + this.width) : nextX;
        const lookAheadTileX = Math.floor(enemyLeadingEdgeX / TILE_SIZE);
        const tileBelowFeetY = Math.floor((this.y + this.height) / TILE_SIZE);

        let nextStepHasPlatformBelow = false;
        const probeX = this.direction === 1 ? nextX + this.width - 1 : nextX; // Probe at the leading edge
        const probeY = this.y + this.height + 1; // 1 pixel below feet

        const probeRect = {
            x: probeX,
            y: probeY,
            width: 1, // A single pixel probe
            height: 1
        };

        for (const platform of level.allPlatforms) {
            if (this.checkCollision(probeRect, platform)) {
                nextStepHasPlatformBelow = true;
                break;
            }
        }

        // Check for wall collision in the next horizontal step
        let isAboutToHitWall = false;
        const nextHorizontalRect = { x: nextX, y: this.y, width: this.width, height: this.height };

        const checkWallCollision = (p) => {
            if (this.checkCollision(nextHorizontalRect, p)) {
                isAboutToHitWall = true;
            }
        };

        level.allPlatforms.forEach(checkWallCollision);

        // Check for world bounds
        const atWorldEdge = (nextX < 0 || nextX + this.width > LEVEL_WIDTH * TILE_SIZE);

        // Turn around if no platform below, about to hit a wall, or at world edge
        if (!nextStepHasPlatformBelow || isAboutToHitWall || atWorldEdge) {
            this.direction *= -1;
        } else {
            this.x = nextX;
        }

        // Update animation timers
        this.walkCycle += 0.15;
        this.headBob += 0.10;
        this.tailSwing += 0.08;
        this.eyeBlink += 0.05;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(context) {
        context.save();

        // Apply horizontal flip based on direction
        if (this.direction === -1) {
            context.translate(this.x + this.width, this.y);
            context.scale(-1, 1);
            context.translate(-(this.x + this.width), -this.y);
        }

        const s = this.width / 16;
        
        // Walking animation effects
        const legMovement = Math.sin(this.walkCycle) * 1.5 * s;
        const headBobbing = Math.sin(this.headBob) * 0.8 * s;
        const tailSwaying = Math.sin(this.tailSwing) * 2 * s;
        const eyeBlinking = Math.sin(this.eyeBlink * 3) > 0.8;
        
        // Tail (long, thick dinosaur tail that sways)
        context.fillStyle = '#228B22'; // Forest green
        const tailBaseX = this.x + 2 * s;
        const tailBaseY = this.y + 20 * s;
        // Tail segments getting smaller toward the tip
        context.fillRect(tailBaseX - 2 * s + tailSwaying, tailBaseY, 4 * s, 3 * s); // Base
        context.fillRect(tailBaseX - 4 * s + tailSwaying * 1.5, tailBaseY + 1 * s, 3 * s, 2 * s); // Middle
        context.fillRect(tailBaseX - 6 * s + tailSwaying * 2, tailBaseY + 2 * s, 2 * s, 1 * s); // Tip
        
        // Tail spikes/ridges
        context.fillStyle = '#1F5F1F'; // Darker green
        context.fillRect(tailBaseX - 1 * s + tailSwaying, tailBaseY - 1 * s, 2 * s, 1 * s);
        context.fillRect(tailBaseX - 3 * s + tailSwaying * 1.5, tailBaseY, 1 * s, 1 * s);
        
        // Main body (dinosaur torso - upright but slightly forward-leaning)
        context.fillStyle = '#228B22'; // Forest green
        context.fillRect(this.x + 4 * s, this.y + 16 * s, 8 * s, 8 * s); // Main torso
        context.fillRect(this.x + 5 * s, this.y + 14 * s, 6 * s, 6 * s); // Upper chest
        
        // Body shading and texture
        context.fillStyle = '#32CD32'; // Lighter green highlights
        context.fillRect(this.x + 5 * s, this.y + 17 * s, 4 * s, 2 * s); // Belly highlight
        context.fillRect(this.x + 6 * s, this.y + 15 * s, 3 * s, 2 * s); // Chest highlight
        
        // Back spikes/ridges (distinctive dinosaur feature)
        context.fillStyle = '#1F5F1F'; // Darker green
        for (let i = 0; i < 4; i++) {
            context.fillRect(this.x + (6 + i * 1.5) * s, this.y + (14 - i * 0.5) * s, 1 * s, 2 * s);
        }
        
        // Powerful hind legs (typical dinosaur stance)
        context.fillStyle = '#228B22';
        const legBaseY = this.y + 24 * s;
        
        // Left leg (back leg when walking)
        const leftLegX = this.x + 5 * s + legMovement;
        context.fillRect(leftLegX, legBaseY, 3 * s, 6 * s); // Upper leg (thigh)
        context.fillRect(leftLegX + 1 * s, legBaseY + 6 * s, 2 * s, 4 * s); // Lower leg (shin)
        
        // Right leg (front leg when walking)
        const rightLegX = this.x + 8 * s - legMovement;
        context.fillRect(rightLegX, legBaseY, 3 * s, 6 * s); // Upper leg (thigh)
        context.fillRect(rightLegX + 1 * s, legBaseY + 6 * s, 2 * s, 4 * s); // Lower leg (shin)
        
        // Dinosaur feet with claws
        context.fillStyle = '#1F5F1F'; // Darker green for claws
        context.fillRect(leftLegX, legBaseY + 10 * s, 4 * s, 2 * s); // Left foot
        context.fillRect(rightLegX, legBaseY + 10 * s, 4 * s, 2 * s); // Right foot
        
        // Claws on feet
        context.fillStyle = '#000000'; // Black claws
        context.fillRect(leftLegX + 3 * s, legBaseY + 10 * s, 1 * s, 2 * s);
        context.fillRect(rightLegX + 3 * s, legBaseY + 10 * s, 1 * s, 2 * s);
        
        // Small arms (T-Rex style - tiny but visible)
        context.fillStyle = '#228B22';
        context.fillRect(this.x + 4 * s, this.y + 18 * s, 2 * s, 4 * s); // Left arm
        context.fillRect(this.x + 10 * s, this.y + 18 * s, 2 * s, 4 * s); // Right arm
        
        // Tiny hands
        context.fillStyle = '#1F5F1F';
        context.fillRect(this.x + 4 * s, this.y + 22 * s, 1 * s, 1 * s);
        context.fillRect(this.x + 11 * s, this.y + 22 * s, 1 * s, 1 * s);
        
        // Long neck (dinosaur characteristic)
        context.fillStyle = '#228B22';
        const neckX = this.x + 7 * s;
        const neckY = this.y + 10 * s + headBobbing;
        context.fillRect(neckX, neckY, 3 * s, 8 * s); // Neck
        
        // Neck shading
        context.fillStyle = '#32CD32';
        context.fillRect(neckX + 1 * s, neckY + 1 * s, 1 * s, 6 * s);
        
        // Dinosaur head (elongated snout like a raptor/allosaurus)
        const headY = this.y + 4 * s + headBobbing;
        context.fillStyle = '#228B22';
        context.fillRect(this.x + 6 * s, headY, 6 * s, 6 * s); // Main head
        context.fillRect(this.x + 10 * s, headY + 2 * s, 4 * s, 3 * s); // Snout/muzzle
        
        // Head crest/ridge (distinctive dinosaur feature)
        context.fillStyle = '#1F5F1F';
        context.fillRect(this.x + 7 * s, headY - 1 * s, 3 * s, 2 * s);
        
        // Eyes (predator eyes - alert and menacing)
        context.fillStyle = '#FFD700'; // Golden yellow eyes
        context.fillRect(this.x + 8 * s, headY + 1 * s, 2 * s, 1 * s); // Left eye
        context.fillRect(this.x + 10 * s, headY + 1 * s, 2 * s, 1 * s); // Right eye
        
        // Eye pupils (slit pupils like a reptile)
        context.fillStyle = '#000000';
        context.fillRect(this.x + 9 * s, headY + 1 * s, 0.5 * s, 1 * s);
        context.fillRect(this.x + 11 * s, headY + 1 * s, 0.5 * s, 1 * s);
        
        // Nostrils
        context.fillStyle = '#000000';
        context.fillRect(this.x + 12 * s, headY + 3 * s, 0.5 * s, 0.5 * s);
        context.fillRect(this.x + 13 * s, headY + 3 * s, 0.5 * s, 0.5 * s);
        
        // Mouth with sharp teeth
        context.fillStyle = '#000000';
        context.fillRect(this.x + 11 * s, headY + 4 * s, 3 * s, 1 * s); // Mouth opening
        
        // Sharp teeth
        context.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            context.fillRect(this.x + (11.5 + i * 0.8) * s, headY + 4 * s, 0.3 * s, 1 * s);
        }
        
        context.restore();
    }
}
