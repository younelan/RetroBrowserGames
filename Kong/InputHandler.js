export class InputHandler {
  constructor(game) {
    this.game = game;
    this.player = game.level.player;
    this.attachEvents();
  }

  attachEvents() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  handleKeyDown(e) {
    const player = this.player;
    if (!player) return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        player.moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
        player.moveRight();
        break;
      case 'ArrowUp':
      case 'w':
        player.climbUp();
        player.jump(); // Attempt to jump if not climbing
        break;
      case 'ArrowDown':
      case 's':
        player.climbDown();
        break;
      case ' ':
        player.jump();
        break;
    }
  }

  handleKeyUp(e) {
    const player = this.player;
    if (!player) return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'ArrowRight':
      case 'd':
        player.stopMovingX();
        break;
      case 'ArrowUp':
      case 'w':
      case 'ArrowDown':
      case 's':
        player.stopClimbing();
        break;
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    this.touchStartX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    this.touchStartY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const player = this.player;
    if (!player) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const touchCurrentX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    const touchCurrentY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    const dx = touchCurrentX - this.touchStartX;
    const dy = touchCurrentY - this.touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        player.moveRight();
      } else {
        player.moveLeft();
      }
    } else if (player.isOnLadder) {
      if (dy > 0) {
        player.climbDown();
      } else {
        player.climbUp();
      }
    }
  }

  handleTouchEnd(e) {
    const player = this.player;
    if (!player) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const touchEndX = (e.changedTouches[0].clientX - rect.left) * (canvas.width / rect.width);
    const touchEndY = (e.changedTouches[0].clientY - rect.top) * (canvas.height / rect.height);
    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      player.jump();
    }
    player.stopMovingX();
    player.stopClimbing();
  }
}
