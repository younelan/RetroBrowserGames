(() => {
  const keys = {};
  let touchControls = {
    active: false,
    joystickStartX: 0,
    joystickStartY: 0,
    joystickX: 0,
    joystickY: 0,
    shootButton: false
  };

  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Prevent scrolling when using arrow keys
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  // Touch controls for mobile
  window.addEventListener('touchstart', (e) => {
    touchControls.active = true;
    
    // Prevent default to avoid scrolling
    e.preventDefault();
    
    // Determine if this is a joystick or button touch
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth / 2) {
      // Left side of screen is movement joystick
      touchControls.joystickStartX = touch.clientX;
      touchControls.joystickStartY = touch.clientY;
      touchControls.joystickX = touch.clientX;
      touchControls.joystickY = touch.clientY;
    } else {
      // Right side is action button (shoot/jump)
      touchControls.shootButton = true;
      // Simulate space key for jumping
      keys[' '] = true;
      // Simulate F key for shooting
      keys['f'] = true;
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    // Update joystick position
    if (touchControls.active && e.touches[0].clientX < window.innerWidth / 2) {
      const touch = e.touches[0];
      touchControls.joystickX = touch.clientX;
      touchControls.joystickY = touch.clientY;
      
      // Calculate joystick displacement
      const dx = touchControls.joystickX - touchControls.joystickStartX;
      const dy = touchControls.joystickY - touchControls.joystickStartY;
      
      // Map displacement to direction keys
      keys['ArrowRight'] = dx > 20;
      keys['ArrowLeft'] = dx < -20;
      keys['ArrowDown'] = dy > 20;
      keys['ArrowUp'] = dy < -20;
      
      // Prevent default to avoid scrolling
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    // Reset controls
    if (e.touches.length === 0) {
      touchControls.active = false;
      
      // Reset direction keys
      keys['ArrowRight'] = false;
      keys['ArrowLeft'] = false;
      keys['ArrowDown'] = false;
      keys['ArrowUp'] = false;
      
      // Reset action buttons
      keys[' '] = false;
      keys['f'] = false;
      touchControls.shootButton = false;
    }
  });

  // Draw on-screen controls for mobile
  function drawTouchControls(ctx) {
    if (!touchControls.active) return;
    
    // Draw joystick base
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(touchControls.joystickStartX, touchControls.joystickStartY, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw joystick handle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(touchControls.joystickX, touchControls.joystickY, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw shoot button
    ctx.fillStyle = touchControls.shootButton ? '#ff6666' : '#ff0000';
    ctx.beginPath();
    ctx.arc(window.innerWidth - 80, window.innerHeight - 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', window.innerWidth - 80, window.innerHeight - 80);
    
    // Draw jump button
    ctx.fillStyle = keys[' '] ? '#6666ff' : '#0000ff';
    ctx.beginPath();
    ctx.arc(window.innerWidth - 80, window.innerHeight - 170, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('JUMP', window.innerWidth - 80, window.innerHeight - 170);
    
    ctx.globalAlpha = 1.0;
  }

  // Export keys object and functions for other modules to use
  window.controls = {
    keys,
    touchControls,
    drawTouchControls
  };
})();