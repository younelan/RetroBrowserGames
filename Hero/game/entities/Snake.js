class Snake extends Enemy {
    constructor(x, y) {
        super(x, y, '&');
        this.segments = 8;
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const centerY = screenY + GAME_CONSTANTS.TILE_SIZE/2;
        const wiggle = Math.sin(this.time * 3) * 6;

        // Draw snake body segments
        this.renderBody(ctx, screenX, centerY, wiggle);
        
        // Draw snake head
        this.renderHead(ctx, screenX, centerY, wiggle);
    }

    renderBody(ctx, screenX, centerY, wiggle) {
        for (let i = 0; i < this.segments; i++) {
            const segX = screenX + 6 + (GAME_CONSTANTS.TILE_SIZE - 12) * (i/this.segments);
            const segY = centerY + Math.sin(this.time * 4 + i * 1.5) * wiggle;
            
            const segGradient = ctx.createRadialGradient(
                segX, segY, 0,
                segX, segY, 12
            );
            segGradient.addColorStop(0, '#90EE90');
            segGradient.addColorStop(0.4, '#32CD32');
            segGradient.addColorStop(1, '#228B22');
            
            ctx.fillStyle = segGradient;
            ctx.beginPath();
            ctx.arc(segX, segY, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHead(ctx, screenX, centerY, wiggle) {
        const headX = screenX + GAME_CONSTANTS.TILE_SIZE - 8;
        const headY = centerY + Math.sin(this.time * 4 + 6) * wiggle;

        // Head gradient
        const headGradient = ctx.createRadialGradient(
            headX, headY, 0,
            headX, headY, 8
        );
        headGradient.addColorStop(0, '#90EE90');
        headGradient.addColorStop(0.6, '#32CD32');
        headGradient.addColorStop(1, '#228B22');
        
        // Draw head
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(headX, headY, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw eyes
        this.renderEyes(ctx, headX, headY);

        // Draw tongue
        this.renderTongue(ctx, headX, headY);
    }

    renderEyes(ctx, headX, headY) {
        ctx.fillStyle = '#000000';
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(headX + i * 4, headY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderTongue(ctx, headX, headY) {
        const tongueLength = (Math.sin(this.time * 8) + 1) * 4;
        ctx.strokeStyle = '#FF3333';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(headX + 6, headY);
        ctx.lineTo(headX + 6 + tongueLength, headY - 2);
        ctx.moveTo(headX + 6 + tongueLength - 1, headY);
        ctx.lineTo(headX + 6 + tongueLength, headY + 2);
        ctx.stroke();
    }
}

window.Snake = Snake;
