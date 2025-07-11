const levels = [
    {
        name: "The Central Cavern",
        viewportWidth: 32,  // Smaller viewport (scrolling)
        viewportHeight: 24, // Smaller viewport (scrolling)
        surfaceScheme: 'ice',
        dirtScheme: 'red',
        brickScheme: 'red', // Default red/brown brick scheme
        map: `
_         +                 +  _
_                              _
_                              _
_                       2 + 1  _
_===<<<<============-----======_
_                              _
_                              _
_           E  ___  2          _
_===    <<<<<<<<<<<<<<<        _
_                          ====_
_                              _
_                              _
_====                          _
_                    P         _
_         4        ___=========_
_   ============               _
_                              _
_                              _
_   @                        * _
_==============================_
_                              _

`,
        backgroundColor: '#0000AA', // Dark blue for the first level
        oxygenLevel: 2000, // Correct key for oxygen level
    },
    {
        name: "The Ice Palace",
        viewportWidth: 32,  // Smaller viewport (scrolling)
        viewportHeight: 18, // Smaller viewport (scrolling)
        brickScheme: 'blue', // Blue brick scheme for ice theme
        dirtScheme: 'ice', // Blue dirt scheme for ice theme
        surfaceScheme: 'ice',
        map: `
_                        T     _
_                              _
_              +               _
_            ====              _
_                              _
_                              _
_          +                   _
_         =====      J    A    _
_   @               =======    _
_  ===                         _
_                              _
_     +                E    I  _
_   ====-----  ::: _-__-__>>>>>_
_                              _
_                              _
_   *    2    3  2  V 1 Z 4FFF _
_==============================_
_                              _
`,
        backgroundColor: '#0000AA', // Dark blue for the first level
        oxygenLevel: 2000, // Correct key for oxygen level
    },
    {
        name: "The Cold Room",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 17, // Full level width (no scrolling)
        brickScheme: 'gray', // Gray brick scheme for cold/metallic theme
        dirtScheme: 'desert', // Desert dirt scheme for contrast
        surfaceScheme: 'grass',
        map: `
_                              _
_                              _
_                              _
_             +                _
_           ====               _
_                              _
_                              _
_             ========---      _
_   *                          _
_  XXX>>>                      _
_                              _
_     +                      + _
_   XXX----_==___       <<<XXX-_
_                              _
_   @                          _
_             F                _
_==============================_
_                              _
`,
        background: 'cold_room_bg.png', // Background image for the second level
        oxygenLevel: 2050, // Correct key for oxygen level
    },
    {
        name: "The Forest Temple",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 20, // Full level height (no scrolling)
        brickScheme: 'green', // Green brick scheme for forest theme
        dirtScheme: 'green', // Green dirt scheme for forest theme
        surfaceScheme: 'grass',
        map: `
_                              _
_                              _
_                              _
_                114 233 211   _
_                ===========   _
_                              _
_         +                    _
_      _____                   _
_                              _
_           1   A 2 J          _
_        >>>>=========-        _
_  @                           _
_   ___                     E  _
_             <<<<<_       ====_
_                              _
_    +                         _
_                              _
_           2     3    4    1* _
_==============================_
_                              _
`,
        backgroundColor: '#002200', // Dark green background for forest theme
        oxygenLevel: 1800, // Lower oxygen for difficulty
    },
    {
        name: "The Crystal Cavern",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 30, // Full level height (no scrolling)
        brickScheme: 'red', // Red brick scheme
        dirtScheme: 'pink', // Pink dirt scheme for magical theme
        surfaceScheme: 'grass',
        map: `
_                              _
_                              _
_                              _
_  4      3       2    21      _
_====-----==========-----======_
_                              _
_                              _
_    +                         _
_  ===___                      _
_                          A   _
_                    =======   _
_           J                  _
_    >>>>>>>>>>                _
_                              _
_                              _
_                          E   _
_  @     ==_             _______
_                              _
_                              _
_                              _
_      ----_           _________
_                              _
_                              _
_        +                     _
_    ===___                    _
_                              _
_                              _
_            433  22  11  3  * _
_==============================_
_                              _
`,
        backgroundColor: '#472100', // Pink-purple background for magical theme
        oxygenLevel: 1900, // Medium oxygen level
    },
    {
        name: "The Frozen Tundra",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 26, // Full level height (no scrolling)
        brickScheme: 'blue', // Blue brick scheme for ice theme
        dirtScheme: 'ice', // Ice dirt scheme for arctic theme
        surfaceScheme: 'ice',
        map: `
_                              _
_                              _
_                              _
_    +                    A    _
_  ===___                _____ _
_                              _
_             J                _
_     <<<<<<<<<                _
_                        E     _
_  @     ===        ===  ======_
_                              _
_                              _
_      -----       ----    _____
_                              _
_         +              V     _
_     ===___===          ======_
_                              _
_                              _
_  *            333 44 2 111   _
_==============================_
_                              _
`,
        backgroundColor: '#234477', // Icy blue background
        oxygenLevel: 1700, // Lower oxygen for challenge
    },
    {
        name: "The Golden Mine",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 29, // Full level height (no scrolling)
        brickScheme: 'gray', // Gray brick scheme for mining equipment
        dirtScheme: 'yellow', // Yellow dirt scheme for gold mine theme
        surfaceScheme: 'grass',
        map: `
_                              _
_                              _
_                              _
_  4    +    3    +    2    1  _
_===--------===--------==---===_
_                              _
_                              _
_         =======              _
_      ___=======___       A   _
_         =======          ====_
_                              _
_                              _
_               J              _
_        >>>>>>>>>>            _
_                              _
_                              _
_                        E     _
_  @      ===      ===---- _____
_                              _
_                              _
_                              _
_       -----     ----     _____
_                              _
_                              _
_    +      43           V   + _
_  ===___======    =====     ==_
_                              _
_                              _
_                   Z        * _
_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX_
`,
        backgroundColor: '#776432', // Golden yellow background
        oxygenLevel: 2100, // Higher oxygen for treasure hunting
    }
];