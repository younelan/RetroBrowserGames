const levels = [
    {
        name: "The Central Cavern",
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
X     K                E    I  X
X   XGGMMQQWW  GGG XXXCBRLXXXCCX
X                              X
X                              X
X   P    T    %  T  V Y Z UFFF X
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
X   P                          X
X  XXXRRR                      X
X                              X
X     K                      K X
X   XXXCCCCBDDBBB       LLLXXXCX
X   C                          X
X   @         T                X
X             F                X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
        background: 'cold_room_bg.png', // Background image for the second level
        oxygenLevel: 2050, // Correct key for oxygen level
    }
];
