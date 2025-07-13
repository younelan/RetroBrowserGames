export class InputHandler {
  constructor(game) {
    this.game = game; // Store the game instance directly
    this._boundKeyDown = this.handleKeyDown.bind(this);
    this._boundKeyUp = this.handleKeyUp.bind(this);
    this._boundTouchStart = this.handleTouchStart.bind(this);
    this._boundTouchMove = this.handleTouchMove.bind(this);
    this._boundTouchEnd = this.handleTouchEnd.bind(this);
    this.attachEvents();
  }

  // No setGame needed if Game instance is persistent

  attachEvents() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
    document.addEventListener('touchstart', this._boundTouchStart, { passive: false });
    document.addEventListener('touchmove', this._boundTouchMove, { passive: false });
    document.addEventListener('touchend', this._boundTouchEnd);
  }

  detachEvents() {
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    document.removeEventListener('touchstart', this._boundTouchStart, { passive: false });
    document.removeEventListener('touchmove', this._boundTouchMove, { passive: false });
    document.removeEventListener('touchend', this._boundTouchEnd);
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        this.game.movePlayerLeft();
        break;
      case 'ArrowRight':
      case 'd':
        this.game.movePlayerRight();
        break;
      case 'ArrowUp':
      case 'w':
        this.game.climbPlayerUp();
        this.game.jumpPlayer(); // Attempt to jump if not climbing
        break;
      case 'ArrowDown':
      case 's':
        this.game.climbPlayerDown();
        break;
      case ' ':
        this.game.jumpPlayer();
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'ArrowRight':
      case 'd':
        this.game.stopPlayerMovingX();
        break;
      case 'ArrowUp':
      case 'w':
      case 'ArrowDown':
      case 's':
        this.game.stopPlayerClimbing();
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
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const touchCurrentX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    const touchCurrentY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    const dx = touchCurrentX - this.touchStartX;
    const dy = touchCurrentY - this.touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        this.game.movePlayerRight();
      } else {
        this.game.movePlayerLeft();
      }
    } else if (this.game.level.player.isOnLadder) {
      if (dy > 0) {
        this.game.climbPlayerDown();
      } else {
        this.game.climbPlayerUp();
      }
    }
  }

  handleTouchEnd(e) {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const touchEndX = (e.changedTouches[0].clientX - rect.left) * (canvas.width / rect.width);
    const touchEndY = (e.changedTouches[0].clientY - rect.top) * (canvas.height / rect.height);
    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Tap or any upward swipe triggers jump
    if (absDx < 10 && absDy < 10) {
      this.game.jumpPlayer();
    } else if (dy < -10) { // Any upward swipe
      this.game.jumpPlayer();
    }
    this.game.stopPlayerMovingX();
    this.game.stopPlayerClimbing();
  }
}