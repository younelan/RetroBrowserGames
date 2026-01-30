export const levels = [




  { //level 1
  grid: `
  CCCCCCCCCCCCCCCCCCCCCCCCCCC
  CC                       CC
  CC                       CC
  CC      +                CC
  CC                       CC
  CC        +              CC
  CC           +           CC
  CC                       CC
  CCCC    CCCCCCCCCCC    CCCC
  CC                       CC
  CC                       CC
  CC                       CC
  CCCC    CCCCCCCCCCC    CCCC
  CC                       CC
  CC                       CC
  CC                       CC
  CCCC  CCCCCCCCCCCCCC   CCCC
  CC                       CC
  CC                       CC
  CC1                      CC
  CCCCCCCCCCCCCCCCCCCCCCCCCCC
  `,
  jumpHeight: 1.5,
  bubbleSpeed: 16,  // Faster bubbles
  bubbleDelay: 120, // Longer delay before moving
  speedMultiplier: 1.2,
  color1: '#ed3e09ff', // define generic block colors for this level
  color2: '#feffffff',

  // define generic block colors for this level

    },
    { //level2
      jumpHeight: 1.5,
  color1: '#ed3e09ff', // define generic block colors for this level
  color2: '#feffffff',

      grid: `
  RRRRRRRRRRRRRRRRRRRRRRRRRRR
  RR                       RR
  RR                       RR
  RR     +                 RR
  RR    +                  RR
  RR      + RRRR           RR
  RR                       RR
  RR                       RR
  RR                       RR
  RR       RRR RRR         RR
  RR                       RR
  RR                       RR
  RR                       RR
  RR     RRRRRRRRRRR       RR
  RR                       RR
  RR                       RR
  RR                       RR
  RR  RRRR  RRRRRR  RRRR   RR
  RR                       RR
  RR                       RR
  RR1                      RR
  RRRRRRRRRRRRRRRRRRRRRRRRRRR
  `
    },  
    { //level3
      jumpHeight: 1.5,
      color1: '#3498db', // define generic block colors for this level
      color2: '#2980b9',
      grid: `
  BBBBBB    BBBBBBBB    BBBBB
  BB                       BB
  BB                       BB
  BB                  +    BB
  BB    +                  BB
  BB  BBBB          BBBBB  BB
  BB  B                 B  BB
  BB  B                 B  BB
  BB  B+             +  B  BB
  BB  BBBBBB       BBBBBB  BB
  BB  B                 B  BB
  BB  B                 B  BB
  BB  B                 B  BB
  BB  BBBBBBBB   BBBBBBBB  BB
  BB                       BB
  BB                       BB
  BB                       BB
  BBBBBB  BBB    BBB  BBBBBBB
  BB                       BB
  BB                       BB
  BB1                      BB
  BBBBBBBBBBBBBBBBBBBBBBBBBBB
  `
    },
    { //level4
      jumpHeight: 1.5,
      grid: `
  BBBBBB    BBBBBBBB    BBBBB
  BB   B                B  BB
  BB   BBB           BBBB  BB
  BB                  +    BB
  BB    +                  BB
  BB                       BB
  BB  BBBBBBBB    BBBBBBB  BB
  BB  B      B    B     B  BB
  BB  B+     B    B    +B  BB
  BB  BBB    B    B  BBBB  BB
  BB         B    B        BB
  BB         B    B        BB
  BB   +               +   BB
  BB  BBBB            BBB  BB
  BB  B                 B  BB
  BB  B                 B  BB
  BB  BBBBBB  BBB  BBBBBB  BB
  BB                       BB
  BB                       BB
  BB1                      BB
  BBBBBBBBBBBBBBBBBBBBBBBBBBB
  `
    },
  
  { //level5
    jumpHeight: 2,
    grid: `
BBBBBB    BBBBBBBB    BBBBB
BB                       BB
BB                       BB
BB                       BB
BB  B            +    B  BB
BB  B BBBBBBBBBBBBBBBBB  BB
BB                       BB
BB                       BB
BB  B         +       B  BB
BB  BBBBBBBBBBBBBBBBB B  BB
BB                       BB
BB                       BB
BB  B      +          B  BB
BB  B BBBBBBBBBBBBBBBBB  BB
BB                       BB
BB                       BB
BB  B   +             B  BB
BB  BBBBBBBB   BBBBBBBB  BB
BB                       BB
BB                       BB
BB1                      BB
BBBBBBBBBBBBBBBBBBBBBBBBBBB
`
  },

  { //level6
    jumpHeight: 2,
    grid: `
  BBBBBB    BBBBBBBB    BBBBB
  BB                       BB
  BB                       BB
  BB                       BB
  BB               +       BB
  BB    BBBBBBBBBBBBBBBBBBBBB
  BB                       BB
  BB                       BB
  BB            +          BB
  BBBBBBBBBBBBBBBBBBBBB    BB
  BB                       BB
  BB                       BB
  BB         +             BB
  BB    BBBBBBBBBBBBBBBBBBBBB
  BB                       BB
  BB                       BB
  BB      +                BB
  BBBBBBBBBBB     BBBBBBBBBBB
  BB                       BB
  BB                       BB
  BB1                      BB
  BBBBBBBBBBBBBBBBBBBBBBBBBBB
`
  },

  { //level7
    jumpHeight: 2,
    grid: `
  BBBBBB    BBBBBBBB    BBBBB
  BB                       BB
  BB                       BB
  BB                       BB
  BB+                     +BB
  BBBB                   BBBB
  BB                       BB
  BB                       BB
  BB+                     +BB
  BBBBBB               BBBBBB
  BB                       BB
  BB                       BB
  BB+                     +BB
  BBBBBBBBB         BBBBBBBBB
  BB                       BB
  BB                       BB
  BB                       BB
  BB  BBBBBBBB   BBBBBBBB  BB
  BB                       BB
  BB                       BB
  BB1                      BB
  BBBBBBBBBBBBBBBBBBBBBBBBBBB
`
  },
  
  { //level8
    jumpHeight: 2,
    grid: `
  BBBBBB    BBBBBBBB    BBBBB
  BB                       BB
  BB                       BB
  BB    B               B  BB
  BB    B  +         +  B  BB
  BB    B BB         BB B  BB
  BB    B               B  BB
  BB    B               B  BB
  BB    B +          +  B  BB
  BB    B BB         BB B  BB
  BB    B               B  BB
  BB                       BB
  BB                       BB
  BB      BBBBBBBBBBBBB    BB
  BB                       BB
  BB                       BB
  BB                       BB
  BB  BBBBBBBB   BBBBBBBB  BB
  BB                       BB
  BB                       BB
  BB1                      BB
  BBBBBBBBBBBBBBBBBBBBBBBBBBB
`
  },

  {
      jumpHeight: 2,
      grid: `
BBBBBB  
B    B
B   +B
B   BB
B1   B
BBBBBB`
    },
  ];
  
