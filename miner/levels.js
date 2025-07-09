const levels = [
    {
        name: "The Central Cavern",
        viewportWidth: 20,  // Smaller viewport (scrolling)
        viewportHeight: 12, // Smaller viewport (scrolling)
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
X   P    T    %  T  V Y Z U    X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`
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
X   XXXCCCCBDDB         LLLXXXCX
X   C                          X
X   @         T                X
X             F                X
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`
    }
];
