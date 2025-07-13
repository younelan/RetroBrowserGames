// levels.js
// All level data for the game

export const START_LEVEL = 2; // Change to 1 to start at level 1, etc.

export const LEVELS = [
  // Level 1 (reverted: whichever is top is now bottom, ladders reach top of above platform)
  {
    name: "Stage 1",
    time: 5000,
    player_start: { x: 50, y: 560 },
    pauline_pos: { x: 700, y: 120 },
    dk_pos: { x: 100, y: 220 },
    barrel_speed: 50,
    barrel_release_frequency: 400,
    platforms: [
      { start_x: 0, start_y: 730, end_x: 800, end_y: 740 }, // 0 (bottom)
      { start_x: 100, start_y: 600, end_x: 750, end_y: 580 }, // 1
      { start_x: 50, start_y: 450, end_x: 600, end_y: 470 }, // 2
      { start_x: 0, start_y: 300, end_x: 700, end_y: 280 }, // 3
      { start_x: 220, start_y: 150, end_x: 800, end_y: 170 } // 4 (top)
    ],
    ladders: [
      { x: 380, top_y: 150, bottom_y: 280 }, // between 3 and 4
      { x: 320, top_y: 280, bottom_y: 470 }, // between 2 and 3
      { x: 460, top_y: 470, bottom_y: 580 }, // between 1 and 2
      { x: 600, top_y: 580, bottom_y: 740 } // between 0 and 1
    ],
    items: [
      { type: "hammer", x: 150, y: 560 }
    ]
  },
  // Level 2 (new, different layout)
  {
    name: "Stage 2",
    time: 5000,
    player_start: { x: 100, y: 650 },
    pauline_pos: { x: 700, y: 130 },
    dk_pos: { x: 120, y: 180 },
    barrel_speed: 60,
    barrel_release_frequency: 350,
    platforms: [
      { start_x: 0, start_y: 780, end_x: 800, end_y: 770 }, // 0
      { start_x: 100, start_y: 600, end_x: 700, end_y: 610 }, // 1
      { start_x: 150, start_y: 450, end_x: 800, end_y: 440 }, // 2
      { start_x: 150, start_y: 320, end_x: 650, end_y: 320 }, // 3
      { start_x: 300, start_y: 180, end_x: 800, end_y: 180 } // 4
    ],
    ladders: [
      { x: 200, top_y: 610, bottom_y: 770 },
      { x: 600, top_y: 450, bottom_y: 610 },
      { x: 400, top_y: 320, bottom_y: 440 },
      { x: 600, top_y: 180, bottom_y: 320 },
      { x: 350, top_y: 320, bottom_y: 610 } // long ladder
    ],
    items: [
      { type: "hammer", x: 400, y: 420 }
    ]
  }
  ,
  // Level 3 (new layout)
  {
    name: "Stage 3",
    time: 5000,
    player_start: { x: 60, y: 700 },
    pauline_pos: { x: 720, y: 110 },
    dk_pos: { x: 80, y: 180 },
    barrel_speed: 70,
    barrel_release_frequency: 300,
    platforms: [
      { start_x: 0, start_y: 760, end_x: 800, end_y: 750 }, // 0
      { start_x: 120, start_y: 630, end_x: 700, end_y: 640 }, // 1
      { start_x: 0, start_y: 500, end_x: 650, end_y: 510 }, // 2
      { start_x: 180, start_y: 370, end_x: 800, end_y: 360 }, // 3
      { start_x: 100, start_y: 240, end_x: 700, end_y: 250 }, // 4
      { start_x: 250, start_y: 120, end_x: 800, end_y: 130 } // 5 (top)
    ],
    ladders: [
      { x: 200, top_y: 640, bottom_y: 750 },
      { x: 600, top_y: 510, bottom_y: 640 },
      { x: 400, top_y: 360, bottom_y: 510 },
      { x: 700, top_y: 250, bottom_y: 360 },
      { x: 300, top_y: 130, bottom_y: 250 }, // long ladder
      { x: 500, top_y: 250, bottom_y: 360 }
    ],
    items: [
      { type: "hammer", x: 350, y: 480 },
      { type: "hammer", x: 600, y: 350 }
    ]
  }
  ,
  // Level 3 (new layout)
  {
    name: "Stage 3",
    time: 5000,
    player_start: { x: 60, y: 700 },
    pauline_pos: { x: 720, y: 110 },
    dk_pos: { x: 80, y: 180 },
    barrel_speed: 70,
    barrel_release_frequency: 300,
    platforms: [
      { start_x: 0, start_y: 760, end_x: 800, end_y: 750 }, // 0
      { start_x: 120, start_y: 630, end_x: 700, end_y: 640 }, // 1
      { start_x: 0, start_y: 500, end_x: 650, end_y: 510 }, // 2
      { start_x: 180, start_y: 370, end_x: 800, end_y: 360 }, // 3
      { start_x: 100, start_y: 240, end_x: 700, end_y: 250 }, // 4
      { start_x: 250, start_y: 120, end_x: 800, end_y: 130 } // 5 (top)
    ],
    ladders: [
      { x: 200, top_y: 640, bottom_y: 750 },
      { x: 600, top_y: 510, bottom_y: 640 },
      { x: 400, top_y: 360, bottom_y: 510 },
      { x: 700, top_y: 250, bottom_y: 360 },
      { x: 300, top_y: 130, bottom_y: 250 }, // long ladder
      { x: 500, top_y: 250, bottom_y: 360 }
    ],
    items: [
      { type: "hammer", x: 350, y: 480 },
      { type: "hammer", x: 600, y: 350 }
    ]
  },
  // Level 3 (new layout)
  {
    name: "Stage 3",
    time: 5000,
    player_start: { x: 60, y: 700 },
    pauline_pos: { x: 720, y: 110 },
    dk_pos: { x: 80, y: 180 },
    barrel_speed: 70,
    barrel_release_frequency: 300,
    platforms: [
      { start_x: 0, start_y: 760, end_x: 800, end_y: 750 }, // 0
      { start_x: 120, start_y: 630, end_x: 700, end_y: 640 }, // 1
      { start_x: 0, start_y: 500, end_x: 650, end_y: 510 }, // 2
      { start_x: 180, start_y: 370, end_x: 800, end_y: 360 }, // 3
      { start_x: 100, start_y: 240, end_x: 700, end_y: 250 }, // 4
      { start_x: 250, start_y: 120, end_x: 800, end_y: 130 } // 5 (top)
    ],
    ladders: [
      { x: 200, top_y: 640, bottom_y: 750 },
      { x: 600, top_y: 510, bottom_y: 640 },
      { x: 400, top_y: 360, bottom_y: 510 },
      { x: 700, top_y: 250, bottom_y: 360 },
      { x: 300, top_y: 130, bottom_y: 250 }, // long ladder
      { x: 500, top_y: 250, bottom_y: 360 }
    ],
    items: [
      { type: "hammer", x: 350, y: 480 },
      { type: "hammer", x: 600, y: 350 }
    ]
  }
];
