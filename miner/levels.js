const levels = [

    {
        name: "The Ice Palace",
        viewportWidth: 32,  // Smaller viewport (scrolling)
        viewportHeight: 16, // Smaller viewport (scrolling)
        brickScheme: 'blue', // Blue brick scheme for ice theme
        dirtScheme: 'ice', // Blue dirt scheme for ice theme
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X                              X
X                              X
X                              X
X                              X
X                              X
X                    J    A    X
X   @              XXXXXXXX    X
X  ====                        X
X                  X           X
X     +                E    I  X
X   ====-----  ::: XXX-_><XXX--X
X                              X
X                              X
X   *    2    3  2  V 1 Z 4FFF X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        backgroundColor: '#0000AA', // Dark blue for the first level
        oxygenLevel: 2000, // Correct key for oxygen level
    },
    {
        name: "The Cold Room",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 16, // Full level height (no scrolling)
        brickScheme: 'gray', // Gray brick scheme for cold/metallic theme
        dirtScheme: 'desert', // Desert dirt scheme for contrast
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X   *                          X
X  XXX>>>                      X
X                              X
X     +                      + X
X   XXX----_==___       <<<XXX-X
X   -                          X
X   @                          X
X             F                X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        background: 'cold_room_bg.png', // Background image for the second level
        oxygenLevel: 2050, // Correct key for oxygen level
    },
    {
        name: "The Forest Temple",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 16, // Full level height (no scrolling)
        brickScheme: 'green', // Green brick scheme for forest theme
        dirtScheme: 'green', // Green dirt scheme for forest theme
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X  1    2      3        4      X
X                              X
X         +                    X
X      _____                   X
X                              X
X               A   J          X
X        >>>>_____===          X
X  @                           X
X ___          _            E  X
X         <<<<<_           ____X
X                              X
X    +                         X
X   ___     2     3    4     1 X
X                            * X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        backgroundColor: '#166534', // Dark green background for forest theme
        oxygenLevel: 1800, // Lower oxygen for difficulty
    },
    {
        name: "The Crystal Cavern",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 16, // Full level height (no scrolling)
        brickScheme: 'red', // Red brick scheme
        dirtScheme: 'pink', // Pink dirt scheme for magical theme
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X  4      3       2       1    X
X                              X
X    +                         X
X  ===___                      X
X                          A   X
X           J                  X
X    >>>>                      X
X                          E   X
X  @     ==_            ______X
X      ----_          ________X
X                              X
X        +                     X
X    ===___   3   2   1   4    X
X                            * X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        backgroundColor: '#8B4A6B', // Pink-purple background for magical theme
        oxygenLevel: 1900, // Medium oxygen level
    },
    {
        name: "The Frozen Tundra",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 16, // Full level height (no scrolling)
        brickScheme: 'blue', // Blue brick scheme for ice theme
        dirtScheme: 'ice', // Ice dirt scheme for arctic theme
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X  1         2         3       X
X                              X
X    +                    A    X
X  ===___                _____ X
X                              X
X                 J            X
X     <<<<<<                   X
X                        E     X
X  @     ===        ===    ____X
X      -----       ----    ____X
X                              X
X         +              V     X
X     ===___===   3   2   1  ===
X                            * X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        backgroundColor: '#4A6B8D', // Icy blue background
        oxygenLevel: 1700, // Lower oxygen for challenge
    },
    {
        name: "The Golden Mine",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 16, // Full level height (no scrolling)
        brickScheme: 'gray', // Gray brick scheme for mining equipment
        dirtScheme: 'yellow', // Yellow dirt scheme for gold mine theme
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X  4    +    3    +    2    1  X
X                              X
X         =======              X
X      ___=======___       A   X
X         =======              X
X               J              X
X        >>>>>>>               X
X                        E     X
X  @      ===      ===     ____X
X       -----     ----     ____X
X                              X
X    +                   V   + X
X  ===___======   4   3   2  ===
X                            * X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        backgroundColor: '#B8A532', // Golden yellow background
        oxygenLevel: 2100, // Higher oxygen for treasure hunting
    }
];