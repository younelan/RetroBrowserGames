import { Collectible } from './collectible.js';
import { Enemy } from './enemy.js';

export class CorridorManager {
    constructor(game) {
        this.game = game;
        this.segments = [];
        this.segmentHeight = 100;
        this.minWidth = 200;
        this.maxWidth = 400;
        this.currentDirection = 1;
        this.directionChangeChance = 0.02;
    }

    initCorridor() {
        for (let i = 0; i < Math.ceil(this.game.height / this.segmentHeight) + 1; i++) {
            this.addSegment();
        }
    }

    addSegment() {
        const lastSegment = this.segments[this.segments.length - 1];
        let leftWall, width;
        
        if (!lastSegment) {
            width = this.minWidth + (this.maxWidth - this.minWidth) / 2;
            leftWall = (this.game.width - width) / 2;
        } else {
            if (Math.random() < this.directionChangeChance) {
                this.currentDirection *= -1;
            }
            
            const movement = this.currentDirection * 30;
            width = lastSegment.width + (Math.random() - 0.5) * 20;
            width = Math.max(this.minWidth, Math.min(this.maxWidth, width));
            leftWall = lastSegment.leftWall + movement;
            
            if (leftWall + width > this.game.width - 50) {
                this.currentDirection = -1;
                leftWall = this.game.width - width - 50;
            } else if (leftWall < 50) {
                this.currentDirection = 1;
                leftWall = 50;
            }
        }

        const segment = {
            leftWall,
            width,
            y: this.segments.length ? 
               this.segments[this.segments.length - 1].y - this.segmentHeight : 
               0,
            collectibles: [],
            enemies: [],
            game: this.game  // Add game reference to segment
        };

        // Add collectibles and enemies
        this.addCollectibles(segment);
        this.addEnemies(segment);
        
        this.segments.push(segment);
    }

    addCollectibles(segment) {
        if (Math.random() < 0.3) {  // Fuel
            segment.collectibles.push(new Collectible(
                segment.leftWall + Math.random() * (segment.width - 20),
                segment.y,
                'fuel'
            ));
        }
        
        if (Math.random() < 0.2) {  // Points
            segment.collectibles.push(new Collectible(
                segment.leftWall + Math.random() * (segment.width - 15),
                segment.y,
                'points'
            ));
        }
    }

    addEnemies(segment) {
        if (Math.random() < 0.3) {
            segment.enemies.push(new Enemy(
                segment.leftWall + Math.random() * (segment.width - 25),
                segment.y,
                segment
            ));
        }
    }

    getCurrentSegment(y) {
        return this.segments.find(seg => 
            seg.y <= y && seg.y + this.segmentHeight > y
        );
    }

    update() {
        // Scroll segments
        this.segments.forEach(segment => {
            segment.y += this.game.scrollSpeed;
            segment.enemies.forEach(enemy => enemy.update());
            
            // Check collisions with player
            const playerHitbox = this.game.player.getHitbox();
            
            segment.collectibles = segment.collectibles.filter(collectible => {
                if (collectible.checkCollision(playerHitbox)) {
                    collectible.collect(this.game);
                    return false;
                }
                return true;
            });
            
            segment.enemies = segment.enemies.filter(enemy => {
                if (enemy.checkCollision(playerHitbox)) {
                    this.game.player.lives--;
                    if (this.game.player.lives <= 0) {
                        this.game.gameOver = true;
                    }
                    return false;
                }
                return true;
            });
        });
        
        // Remove off-screen segments and add new ones
        if (this.segments[0].y > this.game.height) {
            this.segments.shift();
            this.addSegment();
        }
        // Check bullet collisions with enemies
        this.segments.forEach(segment => {
            segment.enemies = segment.enemies.filter(enemy => {
                const enemyHit = this.game.player.bullets.some((bullet, bulletIndex) => {
                    if (enemy.checkCollision(bullet)) {
                        this.game.player.bullets.splice(bulletIndex, 1);
                        this.game.score += 50;
                        return true;
                    }
                    return false;
                });
                return !enemyHit;
            });
        });
    }

    draw() {
        this.segments.forEach(segment => {
            // Draw river (corridor)
            this.game.ctx.fillStyle = '#00f';
            this.game.ctx.fillRect(
                segment.leftWall,
                segment.y,
                segment.width,
                this.segmentHeight
            );

            // Draw walls (green terrain)
            this.game.ctx.fillStyle = '#0a0';
            this.game.ctx.fillRect(0, segment.y, segment.leftWall, this.segmentHeight);
            this.game.ctx.fillRect(
                segment.leftWall + segment.width, 
                segment.y, 
                this.game.width - (segment.leftWall + segment.width), 
                this.segmentHeight
            );
            
            // Draw collectibles and enemies
            segment.collectibles.forEach(collectible => collectible.draw(this.game.ctx));
            segment.enemies.forEach(enemy => enemy.draw(this.game.ctx));
        });
    }
}
