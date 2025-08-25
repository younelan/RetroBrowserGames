// levels.js
const levels = [
    // Level 1
    {
        grid: `
                01
                20
            `,
        target: `
                00
                12
            `,
        stars: { 3: 2, 2: 4 }
    },
    // Level 2
    {
        grid: `
                012
                120
                201
            `,
        target: `
                111
                000
                222
            `,
        stars: { 3: 4, 2: 6 }
        },
    // Level 3 
    {
        grid: `
                201
                L34
                567
            `,
        target: `
                012
                L34
                567
            `,
        stars: { 3: 5, 2: 7 }
    },
    // Level 4 
    {
        grid: `
                201
                3W4
                567
            `,
        target: `
                012
                3W4
                567
            `,
        stars: { 3: 3, 2: 5 }
    },
    // Level 5 
    {
        grid: `
                120
                L34
                65W
            `,
        target: `
                012
                L34
                56W
            `,
        stars: { 3: 6, 2: 9 }
    },

];
