/*
Week 4 — Example 4: Playable Maze (JSON + Level class + Player class)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This is the "orchestrator" file:
- Loads JSON levels (preload)
- Builds Level objects
- Creates/positions the Player
- Handles input + level switching

It is intentionally light on "details" because those are moved into:
- Level.js (grid + drawing + tile meaning)
- Player.js (position + movement rules)

Based on the playable maze structure from Example 3
*/

const TS = 32;

// Raw JSON data (from levels.json).
let levelsData;

// Array of Level instances.
let levels = [];

// Current level index.
let li = 0;

// Player instance (tile-based).
let player;

// Character face orientation
let chr = {};
let chrOrientation = "front";
let wall = {};
let wallState = "back";
let floor = {};
let floorState = "back";
let randomizedWalls = false;

function preload() {
  // Ensure level data is ready before setup runs.
  levelsData = loadJSON("levels.json");

  //sprite images
  // i miss rpgmaker
  chr.front = loadImage("images/chrfront.png");
  chr.back = loadImage("images/chrback.png");
  chr.right = loadImage("images/chrright.png");
  chr.left = loadImage("images/chrleft.png");
  wall.back = loadImage("images/backroomwall.png");
  wall.pool = loadImage("images/poolroomwall.png");
  wall.mall = loadImage("images/mallroomwall.png");
  wall.creepy = loadImage("images/creepywall.png");
  floor.back = loadImage("images/backroomfloor.png");
  floor.pool = loadImage("images/poolroomfloor.png");
  floor.mall = loadImage("images/mallroomfloor.png");
  floor.creepy = loadImage("images/creepyfloor.png");

  shadow = loadImage("images/shadow.png");
}

function setup() {
  /*
  Convert raw JSON grids into Level objects.
  levelsData.levels is an array of 2D arrays. 
  */
  levels = levelsData.levels.map((grid) => new Level(copyGrid(grid), TS));

  // Create a player.
  player = new Player(TS);

  // Load the first level (sets player start + canvas size).
  loadLevel(0);

  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  // Draw current level then player on top.
  levels[li].draw();
  player.draw();

  drawHUD();
}

function drawHUD() {
  // HUD matches your original idea: show level count and controls.
  fill(255);
  text(`Level ${li + 1}/${levels.length} — WASD/Arrows to move`, 10, 16);
  text("Escape the Backrooms.", 10, height - 16);

  if (li === 3) {
    print("hello my sigma console");
    text("THERE IS NO ESCAPE. ONLY LOOPS.", 20, 200);
  }
}

function keyPressed() {
  /*
  Convert key presses into a movement direction. (WASD + arrows)
  */
  let dr = 0;
  let dc = 0;

  if (keyCode === LEFT_ARROW || key === "a" || key === "A")
    ((dc = -1), (chrOrientation = "left"));
  else if (keyCode === RIGHT_ARROW || key === "d" || key === "D")
    ((dc = 1), (chrOrientation = "right"));
  else if (keyCode === UP_ARROW || key === "w" || key === "W")
    ((dr = -1), (chrOrientation = "back"));
  else if (keyCode === DOWN_ARROW || key === "s" || key === "S")
    ((dr = 1), (chrOrientation = "front"));
  else return; // not a movement key

  // Try to move. If blocked, nothing happens.
  const moved = player.tryMove(levels[li], dr, dc);

  // If the player moved onto a goal tile, advance levels.
  if (moved && levels[li].isGoal(player.r, player.c)) {
    nextLevel();
  }

  print(levelsData.levels);

  // on the third stage, walls are randomized
  if (randomizedWalls === true) {
    let randomStage = levels[2].grid;
    for (let r = 1; r < randomStage.length; r++) {
      for (let c = 0; c < randomStage[r].length; c++) {
        if (randomStage[r][c] === 1) {
          if (random() > 0.5) {
            randomStage[r][c] = 0;
          }
          // checking to make sure the player doesnt get stuck inside a newly
          // generated wall
        } else if (randomStage[r][c] === 0 && c != player.c) {
          if (random() > 0.5) {
            randomStage[r][c] = 1;
          }
        }
      }
    }
  }
}

// ----- Level switching -----

function loadLevel(idx) {
  li = idx;

  const level = levels[li];

  // Place player at the level's start tile (2), if present.
  if (level.start) {
    player.setCell(level.start.r, level.start.c);
  } else {
    // Fallback spawn: top-left-ish (but inside bounds).
    player.setCell(1, 1);
  }

  if (li === 1) {
    wallState = "pool";
    floorState = "pool";
    shadow.resize(3000, 3000);
  } else if (li === 0) {
    wallState = "back";
    floorState = "back";
    shadow.resize(4000, 4000);
  } else if (li === 2) {
    wallState = "mall";
    floorState = "mall";
    shadow.resize(2000, 2000);
    randomizedWalls = true;
  } else if (li === 3) {
    wallState = "creepy";
    floorState = "creepy";
    shadow.resize(1000, 1000);
    randomizedWalls = false;
  }

  // Ensure the canvas matches this level’s dimensions.
  resizeCanvas(level.pixelWidth(), level.pixelHeight());
}

function nextLevel() {
  // Wrap around when we reach the last level.
  const next = (li + 1) % levels.length;
  loadLevel(next);
}

// ----- Utility -----

function copyGrid(grid) {
  /*
  Make a deep-ish copy of a 2D array:
  - new outer array
  - each row becomes a new array

  Why copy?
  - Because Level constructor may normalize tiles (e.g., replace 2 with 0)
  - And we don’t want to accidentally mutate the raw JSON data object. 
  */
  return grid.map((row) => row.slice());
}
