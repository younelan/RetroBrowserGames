import { Collectible } from './collectible.js';
import { Enemy } from './enemy.js';

export class CorridorManager {
    constructor(game) {
        this.game = game;
        this.segments = [];
        this.segmentHeight = 100;
        // For mobile, adjust corridor width
        const isMobile = window.innerWidth <= 768;
        this.minWidth = isMobile ? this.game.width * 0.4 : 200;
        this.maxWidth = isMobile ? this.game.width * 0.8 : 400;
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
            game: this.game,  // Add game reference to segment
            isFinishLine: false
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
                'fuel',
                segment // Pass segment reference
            ));
        }

        if (Math.random() < 0.2) {  // Points
            segment.collectibles.push(new Collectible(
                segment.leftWall + Math.random() * (segment.width - 15),
                segment.y - this.segmentHeight / 2,
                'points',
                segment // Pass segment reference
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

    update(dt) {
        // Scroll segments with deltaTime
        this.segments.forEach(segment => {
            segment.y += this.game.scrollSpeed * dt;
            segment.enemies.forEach(enemy => enemy.update(dt));
            segment.collectibles.forEach(collectible => {
                if (collectible.update) {
                    collectible.update(dt);
                }
            });

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

            // Check collision with finish line
            if (segment.isFinishLine && segment.y + this.segmentHeight > this.game.player.y) {
                if (this.game.player.getHitbox().y < segment.y + this.segmentHeight) {
                    this.game.player.lives--;
                    if (this.game.player.lives <= 0) {
                        this.game.gameOver = true;
                    } else {
                        this.game.player.resetPosition();
                    }
                }
            }

            // Check bullet collision with finish line (bridge)
            if (segment.isFinishLine) {
                this.game.player.bullets.forEach((bullet, bulletIndex) => {
                    if (bullet.y < segment.y + this.segmentHeight && 
                        bullet.x > segment.leftWall && 
                        bullet.x < segment.leftWall + segment.width) {
                        this.game.player.bullets.splice(bulletIndex, 1);
                        segment.isFinishLine = false; // Bridge is destroyed
                        this.game.score += 200; // Add points for completing level
                        
                        if (this.game.currentLevel >= this.game.maxLevels) {
                            this.game.gameWon = true;
                        } else {
                            this.game.currentLevel++;
                            this.game.corridorManager.initCorridor();
                            this.game.player.resetPosition();
                            this.game.scrollSpeed += 0.5;
                        }
                    }
                });
            }
        });

        // Remove off-screen segments and add new ones
        if (this.segments[0].y > this.game.height) {
            this.segments.shift();
            this.addSegment();
        }

        // Check bullet collisions with enemies and collectibles
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

            segment.collectibles = segment.collectibles.filter(collectible => {
                const collectibleHit = this.game.player.bullets.some((bullet, bulletIndex) => {
                    if (collectible.checkCollision(bullet)) {
                        this.game.player.bullets.splice(bulletIndex, 1);
                        if (collectible.type === 'fuel') {
                            this.game.player.fuel = Math.min(100, this.game.player.fuel + 30);
                            this.game.score += 50; // Add points for shooting fuel
                        } else {
                            this.game.score += 100;
                        }
                        return true;
                    }
                    return false;
                });
                return !collectibleHit;
            });

            // Check bullet collision with finish line
            if (segment.isFinishLine) {
                const finishLineHit = this.game.player.bullets.some((bullet, bulletIndex) => {
                    if (bullet.y < segment.y + this.segmentHeight) {
                        this.game.player.bullets.splice(bulletIndex, 1);
                        segment.isFinishLine = false;
                        this.game.score += 200; // Add points for passing a level
                        if (this.game.currentLevel >= this.game.maxLevels) {
                            this.game.gameWon = true;
                        } else {
                            this.game.currentLevel++;
                            this.game.player.resetPosition();
                            this.game.scrollSpeed += 0.5;
                        }
                        return true;
                    }
                    return false;
                });
            }
        });

        // Check collision with corridor walls
        const playerHitbox = this.game.player.getHitbox();
        const currentSegment = this.getCurrentSegment(this.game.player.y);
        if (currentSegment) {
            const player = this.game.player;
            if (player.x < currentSegment.leftWall || 
                player.x + player.width > currentSegment.leftWall + currentSegment.width) {
                this.game.player.lives--;
                if (this.game.player.lives <= 0) {
                    this.game.gameOver = true;
                } else {
                    this.game.player.resetPosition();
                }
            }
        }

        // Check if player collected fuel
        this.segments.forEach(segment => {
            segment.collectibles = segment.collectibles.filter(collectible => {
                if (collectible.type === 'fuel' && collectible.checkCollision(playerHitbox)) {
                    this.game.player.fuel = Math.min(100, this.game.player.fuel + 30);
                    this.game.score += 50; // Add points for collecting fuel
                    return false;
                }
                return true;
            });
        });

        // Remove duplicate bridge creation and simplify level completion logic
        if (this.game.distance >= this.game.levelDistance * this.game.currentLevel && 
            !this.segments.some(seg => seg.isFinishLine)) {
            // Add bridge segment at current position
            const lastSegment = this.segments[this.segments.length - 1];
            const bridgeSegment = {
                leftWall: lastSegment.leftWall,
                width: lastSegment.width,
                y: lastSegment.y - this.segmentHeight,
                collectibles: [],
                enemies: [],
                game: this.game,
                isFinishLine: true
            };
            this.segments.push(bridgeSegment);
        }

        // Handle bridge collision and shooting
        this.segments.forEach(segment => {
            if (segment.isFinishLine) {
                // Check player collision with bridge
                if (this.game.player.getHitbox().y < segment.y + this.segmentHeight &&
                    this.game.player.getHitbox().y + this.game.player.height > segment.y) {
                    this.game.player.lives--;
                    segment.isFinishLine = false; // Remove bridge after collision
                    this.handleLevelComplete();
                }

                // Check bullets hitting bridge
                this.game.player.bullets = this.game.player.bullets.filter(bullet => {
                    if (bullet.y < segment.y + this.segmentHeight &&
                        bullet.x > segment.leftWall &&
                        bullet.x < segment.leftWall + segment.width) {
                        segment.isFinishLine = false; // Remove bridge after being shot
                        this.handleLevelComplete();
                        return false;
                    }
                    return true;
                });
            }
        });

        // Only check for game over condition
        if (this.game.player.lives <= 0) {
            this.game.gameOver = true;
        }
    }

    handleLevelComplete() {
        this.game.score += 200; // Add points for completing level
        
        if (this.game.currentLevel >= this.game.maxLevels) {
            this.game.gameWon = true;
        } else {
            this.game.currentLevel++;
            this.game.scrollSpeed += 30; // Increase speed for next level
            this.initCorridor();
            this.game.player.resetPosition();
        }
    }

    draw() {
        // Clear any transform
        this.game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.segments.forEach(segment => {
            // Ensure segment exists and has valid properties
            if (!segment || typeof segment.leftWall === 'undefined') return;

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

            // Draw bridge if it's a finish line
            if (segment.isFinishLine) {
                // Dark red top line
                this.game.ctx.fillStyle = '#800000';
                this.game.ctx.fillRect(
                    segment.leftWall,
                    segment.y,
                    segment.width,
                    this.segmentHeight/4
                );
                
                // Light gray middle section
                this.game.ctx.fillStyle = '#D3D3D3';
                this.game.ctx.fillRect(
                    segment.leftWall,
                    segment.y + this.segmentHeight/4,
                    segment.width,
                    this.segmentHeight/2
                );
                
                // Dark red bottom line
                this.game.ctx.fillStyle = '#800000';
                this.game.ctx.fillRect(
                    segment.leftWall,
                    segment.y + (this.segmentHeight * 3/4),
                    segment.width,
                    this.segmentHeight/4
                );
            }

            // Draw collectibles and enemies last
            segment.collectibles?.forEach(collectible => collectible?.draw(this.game.ctx));
            segment.enemies?.forEach(enemy => enemy?.draw(this.game.ctx));
        });
    }
}
