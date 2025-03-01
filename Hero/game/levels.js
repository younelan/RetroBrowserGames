// Define the game levels
const LEVELS = [
    {
        map: `BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
B@    =                ^     B
B     =                  &   B
B     =                      B
B     =                      B
B     =      .      *      o B
BBBBBBBBBBBBBB    BBBBB~BBBBBB
B                            B
B                        !   B
B                        !   B
B    (                $  !  )B
BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB`,
        viewport: 30,
    },
    {
        map: `BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
B@      =    L               B
B     + =    L        +      B
B       =    L               B
B     + =    L         +     B
BRRRRRRRR           RRRRRRRRRB
B                            B
B     +      L         +     B
B            L               B
B     +      L         +     B
BRRRRRRR     L      RRRRRRRRRB
B                            B
B                            B
B     +               +      B
BBBBBBBBB    !     BBBBBBBBBBB
B                            B
B            !               B
B     +      !         +     B
BRRRRRRR            RRRRRRRRRB
B                            B
B     +      !         +     B
B            !               B
B     +      !         +     B
BRRRRRRR     !      RRRRRRRRRB
B            G               B
B                            B
B     +      G         +     B
BBBBBBBBB    G     BBBBBBBBBBB
B            G               B
B            G               B
B     +      G         +     B
BRRRRRRR            RRRRRRRRRB
B                            B
B     +      !         +     B
B            !               B
B     +      !         +     B
BRRRRRRR     !      RRRRRRRRRB
B                            B
B     +                +   ) B
BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB`,
        viewport: 20,
        lights: true
    }
];

// Make LEVELS available globally
window.LEVELS = LEVELS;
