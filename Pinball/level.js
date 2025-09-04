window.LEVELS = [
  {
    description: 'Default',
    walls: [
      // Outer boundary
      { points: [
        {x: 30, y: 1180}, {x: 30, y: 40}, {x: 790, y: 40}, {x: 790, y: 1180}
      ]},

      // Shooter inner wall up to lowered exit
      { points: [
        {x: 740, y: 1180}, {x: 740, y: 180}
      ]},

      // Shooter exit inner curve (lower + wider turn into playfield)
      { points: [
        { x: 740, y: 180, controls: { c2: { x: 740, y: 130 } } },
        { x: 660, y: 150, controls: { c1: { x: 705, y: 150 } } }
      ]},

      // Shooter exit outer curve (right rail) to guide the ball as well
      { points: [
        { x: 790, y: 160, controls: { c2: { x: 790, y: 110 } } },
        { x: 700, y: 130, controls: { c1: { x: 760, y: 130 } } }
      ]},

      // Lower apron/guide (keeps right side open enough near flippers)
      { points: [
        {x: 30,  y: 990}, {x: 220, y: 1120},
        {x: 580, y: 1120}, {x: 700, y: 1040}
      ]}
    ],
    elements: [
      { type: 'bumper', position: {x: 220, y: 420}, radius: 28 },
      { type: 'bumper', position: {x: 400, y: 320}, radius: 28 },
      { type: 'bumper', position: {x: 580, y: 420}, radius: 28 }
    ]
  }
];
