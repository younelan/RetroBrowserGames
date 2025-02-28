class Sprites {
    constructor(context) {
        this.ctx = context;
        this.sprites = {};
        this.loadSprites();
    }

    loadSprites() {
        // Create hero sprite frames
        this.sprites.hero = {
            standing: this.createHeroSprite(),
            flying: this.createHeroFlyingSprite(),
            drilling: this.createHeroDrillingSprite()
        };
        
        // Create environment sprites
        this.sprites.environment = {
            wall: this.createWallSprite(),
            destructibleWall: this.createDestructibleWallSprite(),
            lava: this.createLavaSprite()
        };
        
        // Create weapon sprites
        this.sprites.weapons = {
            dynamite: this.createDynamiteSprite(),
            explosion: this.createExplosionSprite()
        };
    }

    createHeroSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.PLAYER.WIDTH;
        canvas.height = GAME_CONSTANTS.PLAYER.HEIGHT;
        const ctx = canvas.getContext('2d');
        
        // Draw hero body
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(6, 8, 12, 16);
        
        // Draw helicopter pack
        ctx.fillStyle = '#888888';
        ctx.fillRect(4, 4, 16, 6);
        
        return canvas;
    }

    createHeroFlyingSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.PLAYER.WIDTH;
        canvas.height = GAME_CONSTANTS.PLAYER.HEIGHT;
        const ctx = canvas.getContext('2d');
        
        // Draw hero body
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(6, 8, 12, 16);
        
        // Draw helicopter pack with rotating blades
        ctx.fillStyle = '#888888';
        ctx.fillRect(4, 4, 16, 6);
        ctx.fillRect(0, 5, 24, 2);
        
        return canvas;
    }

    createHeroDrillingSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.PLAYER.WIDTH;
        canvas.height = GAME_CONSTANTS.PLAYER.HEIGHT;
        const ctx = canvas.getContext('2d');
        
        // Draw hero body
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(6, 8, 12, 16);
        
        // Draw drill
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(18, 16);
        ctx.lineTo(24, 20);
        ctx.lineTo(18, 24);
        ctx.closePath();
        ctx.fill();
        
        return canvas;
    }

    createWallSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.TILE_SIZE;
        canvas.height = GAME_CONSTANTS.TILE_SIZE;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = GAME_CONSTANTS.COLORS.WALL;
        ctx.fillRect(0, 0, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
        
        return canvas;
    }

    createDestructibleWallSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.TILE_SIZE;
        canvas.height = GAME_CONSTANTS.TILE_SIZE;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = GAME_CONSTANTS.COLORS.DESTRUCTIBLE_WALL;
        ctx.fillRect(0, 0, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
        
        // Add cracks pattern
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(5, 5);
        ctx.lineTo(20, 20);
        ctx.moveTo(20, 5);
        ctx.lineTo(5, 20);
        ctx.stroke();
        
        return canvas;
    }

    createLavaSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.TILE_SIZE;
        canvas.height = GAME_CONSTANTS.TILE_SIZE;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = GAME_CONSTANTS.COLORS.LAVA;
        ctx.fillRect(0, 0, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
        
        return canvas;
    }

    createDynamiteSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 12;
        const ctx = canvas.getContext('2d');
        
        // Draw dynamite stick
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(2, 2, 4, 8);
        
        // Draw fuse
        ctx.strokeStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(4, 2);
        ctx.lineTo(4, 0);
        ctx.stroke();
        
        return canvas;
    }

    createExplosionSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONSTANTS.TILE_SIZE * 3;
        canvas.height = GAME_CONSTANTS.TILE_SIZE * 3;
        const ctx = canvas.getContext('2d');
        
        // Draw explosion
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.7, '#ff0000');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return canvas;
    }

    getSprite(type, variant = 'standing') {
        return this.sprites[type][variant];
    }
}
