const levels = [

    {

        viewportWidth: 32,  // Smaller viewport (scrolling)
        viewportHeight: 16, // Smaller viewport (scrolling)
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X                              X
X                              X
X                              X
X                              X
X                              X
X                    J    A    X
X  X@              XXXXXXXX    X
X  DDDX                        X
X                  X           X
X     +                E    I  X
X   XGGMMQQWW  GGG XXXCB><XXXCCX
X                              X
X                              X
X   =    2    3  2  V 1 Z 4FFF X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        backgroundColor: '#0000AA', // Dark blue for the first level
        oxygenLevel: 2000, // Correct key for oxygen level
    },
    {
        name: "The Cold Room",
        viewportWidth: 32,  // Full level width (no scrolling)
        viewportHeight: 16, // Full level height (no scrolling)
        map: `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X                              X
X                              X
X                              X
X                              X
X                              X
X                              X
X   =                          X
X  XXX>>>                      X
X                              X
X     +                      + X
X   XXXCCCCBDDBBB       <<<XXXCX
X   C                          X
X   @                          X
X             F                X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        background: 'cold_room_bg.png', // Background image for the second level
        oxygenLevel: 2050, // Correct key for oxygen level
    }
];
