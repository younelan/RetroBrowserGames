(() => {
  // Global variables for Three.js
  let scene, camera, renderer;
  let court, scoreBoard;

  // Game state
  const gameState = {
    ball: null,
    players: [],
    possession: 1,
    gameTime: 0,
    clock: {
      minutes: 12,
      seconds: 0
    },
    courtWidth: 94,
    courtHeight: 50
  };

  // Initialize Three.js scene
  function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4488ff); // Blue sky

    // Create camera - position closer for better view
    camera = new THREE.PerspectiveCamera(
      70, // Field of view - wider for better visibility
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );

    // Position camera to see court better
    camera.position.set(0, 40, 40);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Add lights
    createLights();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
  }

  function createLights() {
    // Add ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient light
    scene.add(ambientLight);

    // Add directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;

    // Configure shadow properties
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -70;
    sunLight.shadow.camera.right = 70;
    sunLight.shadow.camera.top = 70;
    sunLight.shadow.camera.bottom = -70;

    scene.add(sunLight);

    // Add spotlight over center court for better visibility
    const centerSpotlight = new THREE.SpotLight(0xffffff, 1.0);
    centerSpotlight.position.set(0, 70, 0);
    centerSpotlight.angle = Math.PI / 3;
    centerSpotlight.penumbra = 0.2;
    centerSpotlight.castShadow = true;
    scene.add(centerSpotlight);
  }

  function onWindowResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function createPlayers() {
    // Get court dimensions
    const courtDimensions = court.getDimensions();

    // Team 1 (blue) - INCREASED TO 5 PLAYERS with better court positioning
    const blueTeam = [
      { position: 'pointGuard', x: -30, z: 0, isUser: true },
      { position: 'shootingGuard', x: -20, z: -15 },
      { position: 'smallForward', x: -15, z: 15 },
      { position: 'powerForward', x: -25, z: -8 },
      { position: 'center', x: -10, z: 5 }
    ];

    // Team 2 (red) - INCREASED TO 5 PLAYERS with better court positioning
    const redTeam = [
      { position: 'pointGuard', x: 30, z: 0 },
      { position: 'shootingGuard', x: 20, z: -15 },
      { position: 'smallForward', x: 15, z: 15 },
      { position: 'powerForward', x: 25, z: -8 },
      { position: 'center', x: 10, z: 5 }
    ];

    // Create blue team (team 1)
    blueTeam.forEach(player => {
      const newPlayer = new Player(player.x, 0, player.z, 1, 'blue', player.position, scene);
      if (player.isUser) {
        newPlayer.isUserControlled = true;
      }
      gameState.players.push(newPlayer);
    });

    // Create red team (team 2)
    redTeam.forEach(player => {
      const newPlayer = new Player(player.x, 0, player.z, 2, 'red', player.position, scene);
      gameState.players.push(newPlayer);
    });

    // Ensure we have exactly 10 players
    console.log(`Created ${gameState.players.length} players (should be 10)`);
  }

  // Main game loop
  let lastUpdateTime = 0;
  function gameLoop(currentTime) {
    // Request next frame
    requestAnimationFrame(gameLoop);

    // Calculate delta time in seconds
    const now = currentTime || 0;
    const deltaTime = Math.min(0.1, (now - lastUpdateTime) / 1000); // Cap at 100ms
    lastUpdateTime = now;

    // Update game state
    gameState.gameTime += deltaTime;

    // Update all objects
    updateGame(deltaTime);

    // Render scene
    renderer.render(scene, camera);
  }

  function updateGame(deltaTime) {
    // Update game time (clock)
    updateGameClock(deltaTime);

    // Always update ball physics
    if (gameState.ball) {
      gameState.ball.update(deltaTime, gameState, scene);
    }

    // Update player AI and controls
    updatePlayers(deltaTime);

    // Check for scoring and collisions
    checkCollisions();
  }

  // Add function to update game clock
  function updateGameClock(deltaTime) {
    // Update total game time
    gameState.gameTime += deltaTime;

    // Update clock time (counting down)
    gameState.clock.seconds -= deltaTime;

    // Handle minute/second rollover
    if (gameState.clock.seconds < 0) {
      gameState.clock.seconds += 60;
      gameState.clock.minutes--;

      // Check for end of quarter
      if (gameState.clock.minutes < 0) {
        // Reset clock for next quarter
        gameState.clock.minutes = 12;
        gameState.clock.seconds = 0;

        // Update scoreboard
        scoreBoard.updateQuarter(scoreBoard.quarter + 1);
        scoreBoard.showMessage(`END OF QUARTER ${scoreBoard.quarter - 1}`);
      }
    }

    // Update scoreboard display
    scoreBoard.updateGameClock(gameState.clock.minutes, Math.floor(gameState.clock.seconds));
  }

  // Helper function to visualize ball trajectory during debugging
  function drawDebugLine(ball) {
    // Create a simple line showing ball's velocity direction
    if (!ball.debugLine) {
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      });
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      ball.debugLine = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(ball.debugLine);
    }

    // Only update if velocity is significant
    if (ball.velocity.length() > 1) {
      const lineScale = 0.1;
      const startPoint = ball.position.clone();
      const endPoint = startPoint.clone().add(
        ball.velocity.clone().multiplyScalar(lineScale)
      );

      // Update line geometry
      const positions = [
        startPoint.x, startPoint.y, startPoint.z,
        endPoint.x, endPoint.y, endPoint.z
      ];
      ball.debugLine.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    }
  }

  function updatePlayers(deltaTime) {
    // Determine which team has ball possession
    const team1HasBall = gameState.ball && gameState.ball.heldBy && gameState.ball.heldBy.team === 1;
    const team2HasBall = gameState.ball && gameState.ball.heldBy && gameState.ball.heldBy.team === 2;

    // Update each player
    gameState.players.forEach(player => {
      // Determine if player is on offense or defense
      const isOnOffense = (player.team === 1 && team1HasBall) || (player.team === 2 && team2HasBall);

      if (player.isUserControlled) {
        player.handleUserInput(deltaTime, gameState);
      } else if (isOnOffense) {
        player.updateOffense(deltaTime, gameState);
      } else {
        player.updateDefense(deltaTime, gameState);
      }
    });
  }

  function checkCollisions() {
    // Skip if no ball
    if (!gameState.ball) return;

    // Only check for scoring if ball is not held
    if (!gameState.ball.held) {
      // Get basket triggers from the court
      const leftBasket = court.getLeftBasket();
      const rightBasket = court.getRightBasket();

      // Get ball position
      const ballPos = gameState.ball.mesh.position;

      // IMPROVED SCORING: Check if ball is near basket height and falling
      if (gameState.ball.velocity.y < 0 && ballPos.y < 12 && ballPos.y > 8) {
        // WIDER SCORING ZONE: Increased detection radius
        if (leftBasket && isInBasket(ballPos, leftBasket.position)) {
          scoreBasket(2, gameState.ball.shotDistance);
        }

        if (rightBasket && isInBasket(ballPos, rightBasket.position)) {
          scoreBasket(1, gameState.ball.shotDistance);
        }
      }
    }

    // IMPROVED BALL PICKUP: Check if loose ball can be picked up
    if (!gameState.ball.held) {
      gameState.players.forEach(player => {
        if (!player.hasBall) {
          const playerPos = player.mesh.position;
          const ballPos = gameState.ball.mesh.position;

          // Calculate distance in XZ plane
          const dx = playerPos.x - ballPos.x;
          const dz = playerPos.z - ballPos.z;
          const distanceXZ = Math.sqrt(dx * dx + dz * dz);

          // LARGER PICKUP RADIUS: Increased from 3 to 4
          // HIGHER VERTICAL REACH: Increased from 3 to 5
          if (distanceXZ < 4 && Math.abs(playerPos.y - ballPos.y) < 5) {
            player.pickupBall(gameState.ball);
          }
        }
      });
    }
  }

  function isInBasket(ballPos, basketPos) {
    // EVEN MORE FORGIVING: Increased from 2.0 to 3.0
    return (
      Math.abs(ballPos.x - basketPos.x) < 3.0 &&
      Math.abs(ballPos.z - basketPos.z) < 3.0
    );
  }

  function scoreBasket(scoringTeam, distance) {
    // Calculate points based on distance
    const points = distance > 23.75 ? 3 : 2; // 23.75 feet = NBA 3-point line

    // Update score using the ScoreBoard class
    if (scoringTeam === 1) {
      scoreBoard.addPointsToTeam1(points);
    } else {
      scoreBoard.addPointsToTeam2(points);
    }

    // Show message
    scoreBoard.showMessage(`Team ${scoringTeam === 1 ? 'BLUE' : 'RED'} scored ${points} points!`);

    // Reset ball
    resetAfterScore(scoringTeam === 1 ? 2 : 1); // Other team gets the ball

    // Reset shot clock
    resetShotClock();
  }

  // Add function to reset shot clock
  function resetShotClock() {
    // Reset to 24 seconds per NBA rules
    scoreBoard.updateShotClock(24);
  }

  function resetAfterScore(teamWithPossession) {
    // Reset ball to center court
    gameState.ball.reset();

    // Delay giving ball to allow for inbounding
    setTimeout(() => {
      // Find point guard from team with possession
      const players = gameState.players.filter(p => p.team === teamWithPossession);
      const pointGuard = players.find(p => p.position === 'pointGuard') || players[0];

      // Position at inbound position
      const courtDimensions = court.getDimensions();
      const inboundX = teamWithPossession === 1 ? -courtDimensions.width / 2 + 5 : courtDimensions.width / 2 - 5;
      pointGuard.mesh.position.set(inboundX, 0, 0);

      // Give ball to player
      pointGuard.pickupBall(gameState.ball);
    }, 1000);
  }

  // Initialize game
  function initGame() {
    // Set up Three.js
    initThreeJS();

    // Create scoreboard
    scoreBoard = new ScoreBoard('scoreBoard');

    // Create court and environment
    court = new Court(scene); // Create court with default NBA dimensions
    const dims = court.getDimensions();
    gameState.courtWidth = dims.width;
    gameState.courtHeight = dims.height;

    // Create ball
    gameState.ball = new Ball(0, 5, 0, scene);

    // Create players
    createPlayers();

    // Start the game with team 1 having possession
    const pointGuard = gameState.players.find(p => p.team === 1 && p.position === 'pointGuard');
    if (pointGuard) {
      pointGuard.pickupBall(gameState.ball);
    }

    // NEW: Set up event listener for ball control transfers
    setupControlTransfer();

    // Start game loop
    gameLoop();
  }

  // NEW: Function to set up ball control transfer system
  function setupControlTransfer() {
    document.addEventListener('ballCaught', (event) => {
      const newBallHandler = event.detail.player;

      // Only proceed if this is actually a new player
      if (!newBallHandler.isUserControlled) {
        console.log(`Transferring control to ${newBallHandler.position}`);

        // Remove control from current player
        gameState.players.forEach(player => {
          if (player.isUserControlled) {
            player.isUserControlled = false;

            // Remove visual indicators of control
            if (player.controlArrow) {
              player.controlArrow.visible = false;
            }

            // Find and hide the control ring under the player
            player.mesh.children.forEach(child => {
              if (child instanceof THREE.Mesh &&
                child.geometry instanceof THREE.RingGeometry) {
                child.visible = false;
              }
            });
          }
        });

        // Give control to new player
        newBallHandler.isUserControlled = true;

        // Add visual indicators to new controlled player
        if (newBallHandler.controlArrow) {
          newBallHandler.controlArrow.visible = true;
        }

        // Find and show the control ring under the player
        newBallHandler.mesh.children.forEach(child => {
          if (child instanceof THREE.Mesh &&
            child.geometry instanceof THREE.RingGeometry) {
            child.visible = true;
          }
        });

        // Show message about the control change
        scoreBoard.showMessage(`Now controlling: ${newBallHandler.position}`, 1500);
      }
    });
  }

  // Start game when window loads
  window.addEventListener('load', initGame);
})();