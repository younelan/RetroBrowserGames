# Slingshot Garden Gnome Gladiators: 

## Game Pitch
In a whimsical backyard, garden gnomes have come to life and are 
engaged in an epic battle for territory control. You control a 
wizard gnome armed with a magical slingshot, launching yourself at 
enemy gnomes who have taken over strategic positions in the 
flowerbeds, and your mission is to conquer the garden and become 
the supreme gnome overlord.

## Prompt
Create a classical slingshot physics-based game similar to classics
- artillery duel on the Atari 2600
- Gorillas.bas for DOS in 1990
- Scorched Earth for DOS in 1991
- Angry Birds on mobile

The games has evolve quite a bit over the years. From a simple text prompt where you would input an angle and power to more advanced mobile versions. Lots of good memories playing it.

Except we are playing with garden gnomes

### Core Mechanic
- Player controls a wizard gnome (🧙) that can be launched from a slingshot
- Slingshot can be positioned anywhere on any platform in the level
- Gnome starts positioned at the center of slingshot's V-shape (fork)
- Pull back the slingshot to aim and control launch power
- Physics system includes gravity, velocity, and collision detection
- Camera follows the launched gnome's trajectory

### Slingshot Mechanics
- Slingshot has a wooden base, fork, and visible rubber band
- Rubber band stretches realistically between fork tips and gnome
- Fork arms visually bend based on pull direction and force
- Rubber band color or thickness indicates launch power
- Gnome position is always relative to slingshot position
- Maximum pull distance limits launch power

### Slingshot Control Mechanics
- Circular drag control system:
  * Drag gnome in a circle around slingshot center
  * Direction is opposite of drag position (like a real slingshot)
  * Dragging down launches upward
  * Dragging left launches right
  * Distance from center determines launch power
  * Visual circle shows maximum power radius
  * Power indicator grows as drag distance increases
  * Rubber band stretches to follow drag position
  * Release point determines exact launch angle
  * Haptic feedback increases with drag distance

### Core Drag Control Implementation

#### Mouse/Touch Position Handling
- Track mouse/touch coordinates relative to slingshot center:
  * startX, startY: Initial touch position
  * currentX, currentY: Current drag position
  * centerX, centerY: Slingshot center point
  * Calculate delta: (currentX - centerX, currentY - centerY)

#### Circular Boundary Logic
- Maximum drag radius = 100 pixels
- Calculate current radius:
  * radius = sqrt((deltaX)² + (deltaY)²)
  * If radius > maxRadius, normalize position to circle
  * normalizedX = centerX + (deltaX * maxRadius / radius)
  * normalizedY = centerY + (deltaY * maxRadius / radius)

#### Launch Vector Calculation
- Angle calculation:
  * angle = atan2(deltaY, deltaX)
  * Launch angle = angle + π (opposite direction)
- Power calculation:
  * power = min(radius / maxRadius, 1.0)
  * initialVelocity = power * maxVelocity
  * velocityX = cos(launchAngle) * initialVelocity
  * velocityY = sin(launchAngle) * initialVelocity

#### Visual Feedback During Drag
- Draw circular boundary:
  * Circle centered at slingshot
  * Radius = maxRadius
  * Opacity increases with drag
- Power indicator:
  * Color gradient: green (20%) to red (100%)
  * Width/intensity based on current power
- Direction arrow:
  * Length proportional to power
  * Points in launch direction
  * Starts at gnome center

#### Event Flow
1. Touch Start:
   - Record initial touch position
   - Begin tracking drag
   - Show boundary circle
   
2. Touch Move:
   - Update current position
   - Calculate new radius and angle
   - Update visual feedback
   - Move gnome to drag position
   - Stretch rubber band
   
3. Touch End:
   - Calculate final launch vector
   - Apply velocity to gnome
   - Hide boundary and indicators
   - Begin physics simulation

#### Rubber Band Mechanics
- Two anchor points at slingshot fork tips
- Control point at gnome center
- Bezier curve between points
- Thickness varies with stretch
- Color changes with power
- Vibrates slightly when at max power

### Launch Physics
- Initial velocity based on circle radius:
  * Minimum radius = 20% power
  * Maximum radius = 100% power
  * Power scales linearly with radius
- Launch angle calculation:
  * Angle = opposite of drag angle
  * 0° = straight right
  * 90° = straight up
  * 180° = straight left
  * 270° = straight down
- Visual Feedback:
  * Trajectory preview line
  * Power meter fills with radius
  * Rubber band color indicates power
  * Arrow shows launch direction
  * Circle shows drag boundary

### Trajectory Preview System

#### Trajectory Calculation
- Calculate points along parabolic path:
  * Use initial velocity (vx, vy) from drag
  * Apply gravity constant (9.81 m/s²)
  * Time step = 1/60 second
  * For each step (t):
    - x = startX + vx * t
    - y = startY + vy * t + (0.5 * gravity * t²)
  * Generate 30 points along path
  * Stop at ground collision

#### Visual Preview
- Dotted line shows predicted path:
  * White dots with 50% opacity
  * Dots get smaller toward end of path
  * Spacing increases with velocity
  * Fade out at maximum distance
  * Updates in real-time during drag
  * Line thickness matches gnome size

#### Preview Accuracy
- Preview considers:
  * Initial velocity
  * Launch angle
  * Gravity
  * Ground level
  * Platform collisions
  * Screen boundaries
- Does not show:
  * Special ability effects
  * Wind resistance
  * Moving obstacles

#### Implementation Details
- Preview calculation:
```javascript
function calculateTrajectoryPoints(startX, startY, vx, vy) {
    const points = [];
    const dt = 1/60;  // Time step
    const steps = 30; // Number of preview points
    
    for(let i = 0; i < steps; i++) {
        const t = i * dt;
        const x = startX + vx * t;
        const y = startY + vy * t + 0.5 * GRAVITY * t * t;
        
        points.push({x, y});
        
        // Stop if we hit ground or platform
        if(y > GROUND_LEVEL || hitsPlatform(x, y)) break;
    }
    return points;
}
```

#### Interactive Elements
- Preview updates instantly with drag
- Dots pulse when at optimal power
- Color indicates special ability zones
- Fade out when passing through obstacles
- Show potential ricochet points
- Highlight platform collision points

### Player Interaction
- Click and drag the gnome to pull back the slingshot
- Rubber band visual shows launch direction and power
- Release to launch the gnome
- Gnome follows a realistic arc based on launch angle and power
- Auto-reset when gnome stops moving or goes off-screen after 3 seconds

### Visual Elements
- Sky gradient background with clouds
- Ground with grass line
- Wooden slingshot with fork and rubber band
- Wizard gnome emoji (🧙) as the projectile
- Evil gnome targets (👺) to hit
- All game objects scale appropriately for visibility

### Level Design
- Multiple platforms at different heights
- Each platform can hold slingshot and targets
- Each level has multiple evil gnome targets to hit
- Targets can be positioned on any platform or ground
- Strategic placement of targets creates interesting trajectories
- Win level by hitting all targets within move limit
- Three-star rating based on number of launches used

### Platform Mechanics
- Platforms can be different materials (wood, stone)
- Platforms provide solid collision for gnomes
- Slingshot can be placed on any platform edge
- Platform edges affect gnome bouncing
- Some platforms may be destructible

### Technical Implementation
- Canvas-based rendering system
- Frame-based animation loop
- Physics calculations for projectile motion
- Event handling for mouse/touch input
- Object pooling for performance
- Configurable parameters for easy tuning

### Gnome Types and Abilities
- Wizard Gnome (🧙): Base projectile, can cast a mid-flight speed boost
- Bomber Gnome (🧨): Explodes on impact, dealing area damage
- Fairy Gnome (🧚): Floats and can change direction once mid-flight
- Warrior Gnome (⚔️): Heavy hitter that breaks through obstacles
- Ninja Gnome (🥷): Splits into three smaller gnomes at tap
- Ghost Gnome (👻): Phases through first obstacle it hits
- Rainbow Gnome (🌈): Leaves trail that turns blocks into crystal
- Stone Gnome (🗿): Extra heavy, great for smashing foundations

### Projectile Mechanics
- Each gnome type has unique weight and size properties
- Special abilities activate with screen tap while in flight
- Some gnomes have passive abilities (e.g., Ghost's phasing)
- Limited number of each type per level
- Strategic choice of gnome order matters
- Special effects show ability activation
- Unique sound effects per gnome type
- Power-ups can enhance gnome abilities

### Level Strategy
- Each level provides specific gnome types
- Puzzles require using right gnome at right time
- Some targets only vulnerable to certain gnomes
- Chain reactions possible with correct gnome choice
- Bonus points for creative use of abilities
- Hidden paths discoverable with special gnomes
- Tutorial levels introduce each gnome type

### Game UI and Scoring
- Score display shows current points and high score
- Remaining gnomes shown as emoji lineup at top
- Current level and stars progress always visible
- Pause button and level restart option
- Score multiplier for consecutive hits
- Bonus points for unused gnomes
- Special achievement notifications
- Combo system for quick successive hits

### Level Progress
- Each world has multiple themed levels.
- for now implement 3 levels and one world
- Levels unlock sequentially
- Three-star rating per level:
  * ⭐: Complete level
  * ⭐⭐: Under par number of shots
  * ⭐⭐⭐: Perfect score with all bonuses
- Progress saved to localStorage
- Level select screen shows all stars earned
- Bonus levels unlock at star thresholds
- Weekly challenges for extra points

### Mobile-First Design
- Pure JavaScript implementation, no frameworks
- Square aspect ratio (1:1) for consistent experience
- Responsive canvas that fills screen width in portrait mode
- Maintains square ratio by limiting height in landscape
- Touch controls optimized for mobile:
  * Drag to aim and power
  * Tap for mid-flight abilities
  * Pinch to zoom view
  * Swipe to pan camera
- Works equally well with mouse on desktop
- No text-based instructions, all visual
- Haptic feedback on mobile devices
- Offline play supported via PWA

### Technical Requirements
- Vanilla JavaScript ES6+
- HTML5 Canvas for rendering
- Touch events API for mobile
- RequestAnimationFrame for smooth animation
- Responsive viewport meta tags
- Hardware acceleration enabled
- Asset preloading system
- Efficient sprite batching
- Sound sprite support
- Debug mode for development

### Future Features
- Obstacles and destructible elements
- Power-ups and special effects
- Level editor
- Sound effects and background music
- High score system

## Game Features
The game now features:

Different types of gnomes with special abilities:
    Warrior Gnome (Red) - Basic gnome
    Wizard Gnome (Blue) - Can split into three
    Bomber Gnome (Black) - Explodes on impact
    Garden-themed obstacles:
    Fences with wood grain texture
    Rocks with crack details
    Bushes with leaf patterns
    Evil gnome targets:
    Regular evil gnomes
    Boss gnomes with more health
    Visual improvements:
    Gnomes have distinctive red hats
    Evil gnomes have black hats
    Grass details on the ground
    Garden-themed color scheme
