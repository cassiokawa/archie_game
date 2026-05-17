// =============================================================================
// THE ARCHITECT'S DESCENT: 8-BIT DEPRECATION
// Epic: ARCH-0 — Deploy the Refactor Patch before the Legacy Monolith collapses.
// Sprint goal (v0.7): Crispy 16-bit pixel art. Procedural level layouts (no two
// runs alike). A boss fight ending EVERY layer. Score tallies between levels.
// =============================================================================

import kaboom from "kaboom";
import {
  archie_idle, archie_run_a, archie_run_b, archie_jump_pose,
  archie_fall_pose, archie_drink_pose,
  scope_creep, weapon_blueprint, weapon_hammer, coffee_bean, ground_tile,
  coffee_cup, weapon_wand, trap_misplacement, item_shield,
  boss_cthulhu_idle, boss_cthulhu_stun, projectile_ticket,
  boss_kafka_roach, boss_ooze_large, boss_ooze_medium,
  projectile_sync, hazard_data_block, hazard_data_wave,
} from "./sprites";

const k = kaboom({
  width: 800,
  height: 600,
  background: [0, 0, 0],
  letterbox: true,
  crisp: true, // ARCH-121: nearest-neighbor. We want chunky pixels back.
});

// ARCH-400: Global difficulty flag — set on the title screen, read by the
// level scene to adjust Archie's HP, enemy count/speed/HP, and item density.
let difficulty: "easy" | "super" = "easy";


// -----------------------------------------------------------------------------
// ARCH-122: Pixel-art sprite factory. Draw functions work in a high-res "design"
// space, but we bake onto a CANVAS SHRUNK BY `PX` — so the smooth vector art is
// rasterized down to chunky pixels, then `crisp:true` upscales it nearest-
// neighbor. Net display multiplier PX*SCALE stays 1.5, so hitboxes are stable.
// -----------------------------------------------------------------------------
const PX = 0.5;
const SCALE = 3;

function defSprite(name: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cnv = document.createElement("canvas");
  cnv.width = Math.max(1, Math.round(w * PX));
  cnv.height = Math.max(1, Math.round(h * PX));
  const c = cnv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  c.scale(PX, PX);
  c.lineJoin = "round";
  c.miterLimit = 2;
  draw(c);
  k.loadSprite(name, cnv.toDataURL());
}
// ARCH-123: full-res bake — only the smooth lighting vignette wants this.
function defSpriteRaw(name: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cnv = document.createElement("canvas");
  cnv.width = w;
  cnv.height = h;
  draw(cnv.getContext("2d")!);
  k.loadSprite(name, cnv.toDataURL());
}

// ARCH-210: tiny 3×5 pixel font used inside defSprite-baked sprites so labels
// like "JRA-123", "FUND", "DS", "db" render as actual pixel art instead of
// browser-antialiased glyphs. `drawPixelText` bypasses the parent ctx scale
// for the text pass so each glyph cell rasterizes to an integer canvas pixel
// regardless of the surrounding PX bake — true crisp text.
const PIXFONT: Record<string, string[]> = {
  "A": [".X.", "X.X", "XXX", "X.X", "X.X"],
  "B": ["XX.", "X.X", "XX.", "X.X", "XX."],
  "C": [".XX", "X..", "X..", "X..", ".XX"],
  "D": ["XX.", "X.X", "X.X", "X.X", "XX."],
  "E": ["XXX", "X..", "XX.", "X..", "XXX"],
  "F": ["XXX", "X..", "XX.", "X..", "X.."],
  "G": [".XX", "X..", "X.X", "X.X", ".XX"],
  "H": ["X.X", "X.X", "XXX", "X.X", "X.X"],
  "I": ["XXX", ".X.", ".X.", ".X.", "XXX"],
  "J": [".XX", "..X", "..X", "X.X", ".X."],
  "K": ["X.X", "X.X", "XX.", "X.X", "X.X"],
  "L": ["X..", "X..", "X..", "X..", "XXX"],
  "M": ["X.X", "XXX", "XXX", "X.X", "X.X"],
  "N": ["X.X", "XXX", "XXX", "XXX", "X.X"],
  "O": [".X.", "X.X", "X.X", "X.X", ".X."],
  "P": ["XX.", "X.X", "XX.", "X..", "X.."],
  "Q": [".X.", "X.X", "X.X", "XXX", ".XX"],
  "R": ["XX.", "X.X", "XX.", "X.X", "X.X"],
  "S": [".XX", "X..", ".X.", "..X", "XX."],
  "T": ["XXX", ".X.", ".X.", ".X.", ".X."],
  "U": ["X.X", "X.X", "X.X", "X.X", ".X."],
  "V": ["X.X", "X.X", "X.X", ".X.", ".X."],
  "W": ["X.X", "X.X", "XXX", "XXX", "X.X"],
  "X": ["X.X", "X.X", ".X.", "X.X", "X.X"],
  "Y": ["X.X", "X.X", ".X.", ".X.", ".X."],
  "Z": ["XXX", "..X", ".X.", "X..", "XXX"],
  "0": [".X.", "X.X", "X.X", "X.X", ".X."],
  "1": [".X.", "XX.", ".X.", ".X.", "XXX"],
  "2": ["XX.", "..X", ".X.", "X..", "XXX"],
  "3": ["XX.", "..X", ".X.", "..X", "XX."],
  "4": ["X.X", "X.X", "XXX", "..X", "..X"],
  "5": ["XXX", "X..", "XX.", "..X", "XX."],
  "6": [".XX", "X..", "XX.", "X.X", ".X."],
  "7": ["XXX", "..X", ".X.", ".X.", ".X."],
  "8": [".X.", "X.X", ".X.", "X.X", ".X."],
  "9": [".X.", "X.X", ".XX", "..X", "XX."],
  "-": ["...", "...", "XXX", "...", "..."],
  ":": [".X.", "...", "...", "...", ".X."],
  ".": ["...", "...", "...", "...", ".X."],
  "!": [".X.", ".X.", ".X.", "...", ".X."],
  "?": ["XX.", "..X", ".X.", "...", ".X."],
  "+": ["...", ".X.", "XXX", ".X.", "..."],
  "_": ["...", "...", "...", "...", "XXX"],
  " ": ["...", "...", "...", "...", "..."],
  // ARCH-217: Λ for AWS Lambda labels — text.toUpperCase() maps "λ" → "Λ".
  "Λ": [".X.", ".X.", "X.X", "X.X", "X.X"],
  // "@" for old enemy shot strings — kept handy even though current shots
  // use "PASS!" now.
  "@": [".XX", "X.X", "XXX", "X..", ".XX"],
  "/": ["..X", "..X", ".X.", "X..", "X.."],
};

// Draws `text` at design-space (x, y) regardless of the parent ctx's PX
// scale. `scale` is glyph-cell size in CANVAS pixels (so 1 = 1 raw pixel,
// 2 = 2 raw pixels). Returns the advance-width in design units.
function drawPixelText(
  c: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color: string, cellSize = 1,
) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.fillStyle = color;
  // Pre-multiply (x, y) by the current transform's scale so we can reset to
  // identity and still land at the correct screen-space position.
  const m = c.getTransform();
  const cx0 = m.a * x + m.e;
  const cy0 = m.d * y + m.f;
  c.setTransform(1, 0, 0, 1, 0, 0);
  let cx = cx0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    const glyph = PIXFONT[ch] || PIXFONT[" "];
    if (ch === " ") { cx += 4 * cellSize; continue; }
    for (let row = 0; row < 5; row++) {
      const r = glyph[row];
      if (!r) continue;
      for (let col = 0; col < 3; col++) {
        if (r[col] === "X") {
          c.fillRect(cx + col * cellSize, cy0 + row * cellSize, cellSize, cellSize);
        }
      }
    }
    cx += 4 * cellSize;
  }
  c.restore();
  return text.length * 4 * cellSize;
}

// ARCH-136: TRUE pixel-art bake — one ASCII char = one pixel. The strict
// 8-color "Corporate Deprecation 8" palette lives here. No anti-aliasing,
// no gradients, no apologies. Crisp upscale handles the rest.
function pixelSprite(name: string, palette: Record<string, string>, rows: string[]) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const cnv = document.createElement("canvas");
  cnv.width = w; cnv.height = h;
  const c = cnv.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  k.loadSprite(name, cnv.toDataURL());
}

// ARCH-137: the Corporate Deprecation 8 palette — strict per the mockup.
const PAL = {
  BG: "#000000",
  OUT: "#0a0a0a",
  GRAY: "#5D6D7E",     // Archie primary / face / suit
  RED: "#E74C3C",      // Archie accent / hardhat / tie
  DARK: "#4D5656",     // Infrastructure / suit shadow
  DRED: "#A93226",     // Infrastructure red / hat shadow
  GREEN: "#229954",    // Scope Creep
  CUP: "#CB4335",      // UI Coffee Cup
  BLUE: "#85C1E9",     // UI Cognitive Blue
};

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function vgrad(c: CanvasRenderingContext2D, x: number, y: number, h: number, a: string, b: string) {
  const g = c.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, a); g.addColorStop(1, b);
  return g;
}
function rgrad(c: CanvasRenderingContext2D, x: number, y: number, r: number, a: string, b: string) {
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, a); g.addColorStop(1, b);
  return g;
}
const OL = "#0d0d14";

// ARCH-138: Archie Tect — ANIMATED true pixel art. Per the mockup spec sheet:
// IDLE, RUN×2 ("frantic waddle"), JUMP, FALL. Each pose has a suit variant
// and a tuxedo variant (Wand mode). All frames are 16w × 22h so the hitbox
// stays stable across the state machine.
// R = hat red, r = hat shadow, G = suit/face primary, D = suit shadow,
// T = tie, B = blueprint cyan, b = blueprint shadow.
const ARCHIE_POSES: Record<string, string[]> = {
  // standing tall, holding the blueprint horizontally across the chest
  idle: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGDDGGGGDDGK..",
    "..KGGGGGGGGGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    ".KGGGGGTTGGGGGK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbbbbbbbbbbBK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    ".KGGGK....KGGGK.",
    ".KGGGK....KGGGK.",
    ".KGGGK....KGGGK.",
    "KKDDDK....KDDDKK",
    "KKKKKK....KKKKKK",
  ],
  // frantic waddle frame A — legs wide, left forward
  run0: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGDDGGGGDDGK..",
    "..KGGGGGGGGGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    ".KGGGGGTTGGGGGK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbbbbbbbbbbBK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    "KKGGGK....KGGGK.",
    "KGGGK......KGGK.",
    "KGGGK.......KGK.",
    "KDDDK........KK",
    "KKKKK...........",
  ],
  // passing pose A — legs together, mid-stride
  run1: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGDDGGGGDDGK..",
    "..KGGGGGGGGGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    ".KGGGGGTTGGGGGK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbbbbbbbbbbBK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    ".KGGGGK..KGGGGK.",
    ".KGGGGK..KGGGGK.",
    ".KGGGGK..KGGGGK.",
    "KKDDDDK..KDDDDKK",
    "KKKKKKKK.KKKKKKK",
  ],
  // frantic waddle frame B — legs wide, right forward (mirror of run0)
  run2: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGDDGGGGDDGK..",
    "..KGGGGGGGGGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    ".KGGGGGTTGGGGGK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbbbbbbbbbbBK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    ".KGGGK....KGGGKK",
    ".KGGK......KGGGK",
    ".KGK.......KGGGK",
    "KK........KDDDKK",
    "...........KKKKK",
  ],
  // passing pose B — legs together, mid-stride (slightly different stance)
  run3: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGDDGGGGDDGK..",
    "..KGGGGGGGGGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    ".KGGGGGTTGGGGGK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbbbbbbbbbbBK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    "..KGGGK..KGGGK..",
    "..KGGGK..KGGGK..",
    "..KGGGK..KGGGK..",
    ".KKDDDK..KDDDKK.",
    ".KKKKKK..KKKKKK.",
  ],
  // jump — arms tucked, body slightly compact, legs spread mid-air
  jump: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGDDGGGGDDGK..",
    "..KGGGGGGGGGGK..",
    "..KKGGGGGGGGKK..",
    "KKGGGGGTTGGGGGKK",
    "KGGGGGGTTGGGGGGK",
    "KGGBBBBBBBBBBGGK",
    "KGGBbbbbbbbbBGGK",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    "KKGGGK....KGGGKK",
    "KGGGK......KGGGK",
    "KDDK........KDDK",
    ".KK..........KK.",
    "................",
    "................",
  ],
  // ARCH-195: "REPLACING COFFEE" pose per the Sprite Manual — eyes squinted
  // shut in a contented sip. Combined with a floating cup sprite spawned next
  // to Archie's face, sells the recharge animation.
  drink: [
    ".....KKKKKK.....",
    "....KRRRRRRK....",
    "...KRRRRRRRRK...",
    "...KRrrrrrrrK...",
    "..KKKKKKKKKKKK..",
    "..KGGGGGGGGGGK..",
    "..KGKKGGGGKKGK..",
    "..KGGGGGGGGGGK..",
    "..KGGGGGGGGGGK..",
    "..KKKKKKKKKKKK..",
    ".KGGGGGTTGGGGGK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbbbbbbbbbbBK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    ".KGGGK....KGGGK.",
    ".KGGGK....KGGGK.",
    ".KGGGK....KGGGK.",
    "KKDDDK....KDDDKK",
    "KKKKKK....KKKKKK",
  ],
  // fall — tucked into a ball, eyes wide, blueprint flailing
  fall: [
    "................",
    "....KKKKKK......",
    "...KRRRRRRK.....",
    "..KRRRRRRRRK....",
    "..KRrrrrrrrK....",
    ".KKKKKKKKKKKK...",
    ".KGGGGGGGGGGK...",
    ".KGDGGGGGGDGK...",
    ".KGGGGGGGGGGK...",
    "KKKGGGGGGGGGGKK.",
    "KGBBBBBBBBBBGGGK",
    "KGBbbbbbbbbbBGGK",
    ".KGGGGGTTGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KKKKKKKKKKKKKK.",
    "..KGGGGKKGGGGK..",
    "...KGGGKKGGGK...",
    "....KDDKKDDK....",
    ".....KKKKKK.....",
    "................",
    "................",
    "................",
  ],
};
const SUIT_PAL = {
  K: PAL.OUT, R: PAL.RED, r: PAL.DRED, G: PAL.GRAY, D: PAL.DARK,
  T: PAL.RED, B: PAL.BLUE, b: "#3a78a8",
};
const TUX_PAL = {
  K: PAL.OUT, R: PAL.RED, r: PAL.DRED, G: PAL.DARK, D: PAL.OUT,
  T: PAL.BLUE, B: PAL.BLUE, b: "#3a78a8",
};
for (const [pose, rows] of Object.entries(ARCHIE_POSES)) {
  pixelSprite(`archie_${pose}`, SUIT_PAL, rows);
  pixelSprite(`archie_tux_${pose}`, TUX_PAL, rows);
}

// ARCH-140: Blueprint Barrier — Weapon 1's deployable cyan grid. Per the
// mockup, attacking with the Blueprint now "unrolls" it into a stationary
// barrier that damages anything it touches. Damage still scales with Load.
pixelSprite("blueprint_barrier", {
  K: PAL.OUT, B: PAL.BLUE, b: "#3a78a8", W: "#cfeefe",
}, [
  "KKKKKKKKKKKKKKKKKK",
  "KBBBBKBBBBKBBBBBBK",
  "KBWWBKBWWBKBWWBBBK",
  "KBBBBKBBBBKBBBBBBK",
  "KKKKKKKKKKKKKKKKKK",
  "KBBBBKBBBBKBBBBBBK",
  "KBWWBKBWWBKBWWBBBK",
  "KBBBBKBBBBKBBBBBBK",
  "KKKKKKKKKKKKKKKKKK",
  "KBBBBKBBBBKBBBBBBK",
  "KBWWBKBWWBKBWWBBBK",
  "KBBBBKBBBBKBBBBBBK",
  "KKKKKKKKKKKKKKKKKK",
  "KbbbbKbbbbKbbbbbbK",
  "KKKKKKKKKKKKKKKKKK",
]);
// ARCH-36/85: (legacy) high-res Archie drawer — retained but unused.
function drawArchie(c: CanvasRenderingContext2D, tux: boolean) {
  c.lineWidth = 5; c.strokeStyle = OL;
  const suitTop = tux ? "#2c2c38" : "#3a4d78";
  const suitBot = tux ? "#101016" : "#212c4a";
  c.fillStyle = vgrad(c, 0, 66, 40, suitTop, suitBot);
  rr(c, 24, 66, 15, 34, 5); c.fill(); c.stroke();
  rr(c, 45, 66, 15, 34, 5); c.fill(); c.stroke();
  c.fillStyle = "#15151c";
  rr(c, 20, 96, 24, 12, 5); c.fill(); c.stroke();
  rr(c, 41, 96, 24, 12, 5); c.fill(); c.stroke();
  c.fillStyle = vgrad(c, 0, 40, 46, suitTop, suitBot);
  rr(c, 16, 42, 52, 42, 10); c.fill(); c.stroke();
  c.fillStyle = "#eef0f6";
  c.beginPath(); c.moveTo(34, 42); c.lineTo(50, 42); c.lineTo(42, 74); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = tux ? "#e8e8f0" : "#d23030";
  if (tux) {
    c.beginPath(); c.moveTo(42, 46); c.lineTo(34, 42); c.lineTo(34, 52); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(42, 46); c.lineTo(50, 42); c.lineTo(50, 52); c.closePath(); c.fill(); c.stroke();
  } else {
    c.beginPath(); c.moveTo(42, 46); c.lineTo(47, 52); c.lineTo(42, 70); c.lineTo(37, 52);
    c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = suitBot;
  c.beginPath(); c.moveTo(34, 42); c.lineTo(42, 44); c.lineTo(30, 60); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(50, 42); c.lineTo(42, 44); c.lineTo(54, 60); c.closePath(); c.fill();
  c.fillStyle = vgrad(c, 0, 44, 34, suitTop, suitBot);
  rr(c, 8, 44, 14, 34, 7); c.fill(); c.stroke();
  rr(c, 62, 44, 14, 34, 7); c.fill(); c.stroke();
  c.fillStyle = "#f0b890";
  c.beginPath(); c.arc(15, 80, 7, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(69, 80, 7, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#d89e78"; rr(c, 36, 33, 12, 11, 3); c.fill();
  c.fillStyle = rgrad(c, 42, 26, 24, "#ffd4ad", "#dc9f74");
  rr(c, 26, 12, 32, 28, 11); c.fill(); c.stroke();
  c.fillStyle = "rgba(150,90,60,0.22)"; rr(c, 26, 31, 32, 9, 8); c.fill();
  c.fillStyle = OL;
  c.beginPath(); c.arc(36, 26, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(48, 26, 3, 0, 7); c.fill();
  c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(31, 20); c.lineTo(39, 23); c.stroke();
  c.beginPath(); c.moveTo(53, 20); c.lineTo(45, 23); c.stroke();
  c.lineWidth = 5;
  c.fillStyle = "#bfe8ff";
  c.beginPath(); c.arc(58, 24, 3.5, 0, 7); c.fill();
  c.fillStyle = vgrad(c, 0, 8, 12, "#ffd633", "#caa011");
  rr(c, 19, 11, 47, 8, 3); c.fill(); c.stroke();
  c.fillStyle = vgrad(c, 0, -6, 22, "#ffe680", "#d9a800");
  c.beginPath(); c.arc(42, 13, 20, Math.PI, 2 * Math.PI); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#caa011"; rr(c, 40, -5, 4, 17, 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.5)";
  c.beginPath(); c.ellipse(35, 5, 6, 3, -0.5, 0, 7); c.fill();
}
// (legacy defSprite calls removed — Archie is now true pixel art above.)

// ARCH-37: ScopeCreep — Short-Term Sprint Devil per the Layer 1 mockup.
// Tiny red imp with horns, glowing eyes, fanged mouth, and a little forked
// foot. The mockup overrides the earlier "green blob" sketch.
pixelSprite("scopecreep", {
  K: PAL.OUT, R: PAL.RED, r: PAL.DRED, M: "#3a0a0c", P: "#ffffff",
}, [
  ".K..........K.",
  "KrK........KrK",
  "KrrKKKKKKKKrrK",
  "KKRRRRRRRRRRKK",
  ".KRPPRRRRPPRK.",
  ".KRRRRRRRRRRK.",
  ".KRRRMMMMRRRK.",
  ".KRRRRRRRRRRK.",
  ".KRrrrrrrrrRK.",
  "..KrrrrrrrrK..",
  "..KKRRRRRRKK..",
  "...KK....KK...",
  "...K......K...",
  "..KK......KK..",
]);

// ARCH-37b: Kafka Cockroach (Layer 2).
defSprite("cockroach", 84, 54, (c) => {
  c.strokeStyle = OL; c.lineWidth = 5; c.lineCap = "round";
  for (const lx of [22, 42, 62]) {
    c.beginPath(); c.moveTo(lx, 30); c.lineTo(lx - 9, 50); c.stroke();
    c.beginPath(); c.moveTo(lx, 30); c.lineTo(lx + 9, 50); c.stroke();
  }
  c.beginPath(); c.moveTo(20, 18); c.lineTo(6, 4); c.stroke();
  c.beginPath(); c.moveTo(20, 18); c.lineTo(14, 2); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = rgrad(c, 42, 26, 38, "#b87c35", "#5a3413");
  c.beginPath(); c.ellipse(44, 28, 34, 20, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#4f2f12";
  c.beginPath(); c.ellipse(20, 24, 12, 11, 0, 0, 7); c.fill(); c.stroke();
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(44, 10); c.lineTo(44, 46); c.stroke();
  c.fillStyle = "rgba(255,225,160,0.3)";
  c.beginPath(); c.ellipse(38, 18, 18, 7, 0, 0, 7); c.fill();
  c.fillStyle = "#ffce3a";
  c.beginPath(); c.arc(14, 20, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(14, 28, 3, 0, 7); c.fill();
});

// ARCH-37c: Data Lake Ooze (Layer 3).
defSprite("ooze", 96, 72, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = rgrad(c, 46, 36, 50, "#bb8ce8", "#5a2a8a");
  c.beginPath();
  c.moveTo(8, 44);
  c.bezierCurveTo(2, 16, 30, 6, 48, 12);
  c.bezierCurveTo(70, 6, 94, 18, 88, 46);
  c.bezierCurveTo(92, 64, 70, 72, 48, 66);
  c.bezierCurveTo(24, 72, 6, 66, 8, 44);
  c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(24, 67, 6, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(66, 69, 7, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(38, 36, 10, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(60, 36, 10, 0, 7); c.fill(); c.stroke();
  c.fillStyle = OL;
  c.beginPath(); c.arc(40, 38, 5, 0, 7); c.fill();
  c.beginPath(); c.arc(62, 38, 5, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,0.4)";
  c.beginPath(); c.ellipse(30, 22, 14, 7, -0.4, 0, 7); c.fill();
});

// ARCH-37d: PoC Monster (Layer 4).
defSprite("poc", 84, 72, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL; c.lineCap = "round";
  c.beginPath(); c.moveTo(42, 6); c.lineTo(42, -4); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = "#ff4040";
  c.beginPath(); c.arc(42, -5, 4, 0, 7); c.fill(); c.stroke();
  c.fillStyle = vgrad(c, 0, 28, 40, "#aab0ba", "#5f6470");
  rr(c, 18, 28, 48, 38, 6); c.fill(); c.stroke();
  c.fillStyle = vgrad(c, 0, 6, 26, "#c8ced6", "#7a8088");
  rr(c, 26, 6, 32, 24, 5); c.fill(); c.stroke();
  c.fillStyle = "#ff5252";
  c.beginPath(); c.arc(35, 18, 5, 0, 7); c.fill();
  c.beginPath(); c.arc(49, 18, 5, 0, 7); c.fill();
  c.fillStyle = OL;
  c.beginPath(); c.arc(35, 18, 2, 0, 7); c.fill();
  c.beginPath(); c.arc(49, 18, 2, 0, 7); c.fill();
  c.save(); c.translate(31, 41); c.rotate(0.3);
  c.fillStyle = "#e8c84a"; rr(c, -13, -5, 26, 10, 1); c.fill(); c.stroke(); c.restore();
  c.save(); c.translate(54, 53); c.rotate(-0.4);
  c.fillStyle = "#e8c84a"; rr(c, -13, -5, 26, 10, 1); c.fill(); c.stroke(); c.restore();
  c.fillStyle = "#5f6470";
  rr(c, 24, 64, 12, 8, 2); c.fill(); c.stroke();
  rr(c, 48, 64, 12, 8, 2); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.55)";
  c.beginPath(); c.arc(24, 34, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(60, 34, 3, 0, 7); c.fill();
});

// ARCH-37e: Exposed Credentials Villain (Layer 5).
defSprite("villain", 72, 84, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 34, 50, "#c2a874", "#6f5c38");
  rr(c, 12, 34, 48, 48, 8); c.fill(); c.stroke();
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(36, 38); c.lineTo(36, 82); c.stroke();
  c.lineWidth = 5;
  c.fillStyle = "#8a7344";
  c.beginPath(); c.moveTo(20, 34); c.lineTo(36, 30); c.lineTo(30, 50); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(52, 34); c.lineTo(36, 30); c.lineTo(42, 50); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#3a2f1c"; rr(c, 12, 55, 48, 7, 1); c.fill();
  c.fillStyle = "#caa078"; rr(c, 24, 14, 24, 22, 7); c.fill(); c.stroke();
  c.fillStyle = "rgba(0,0,0,0.45)"; rr(c, 24, 14, 24, 12, 6); c.fill();
  c.fillStyle = "#ff66ff";
  c.beginPath(); c.arc(31, 24, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(41, 24, 3, 0, 7); c.fill();
  c.fillStyle = vgrad(c, 0, 0, 18, "#2a2c36", "#15161c");
  rr(c, 18, 8, 36, 9, 3); c.fill(); c.stroke();
  rr(c, 26, -2, 20, 12, 3); c.fill(); c.stroke();
  c.fillStyle = "#2a2415";
  rr(c, 20, 80, 13, 4, 2); c.fill();
  rr(c, 39, 80, 13, 4, 2); c.fill();
});

// ARCH-37f: LLM Token Glutton (Layer 6).
defSprite("glutton", 96, 54, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 4, 42, "#4a6ad8", "#1f3aa0");
  rr(c, 8, 6, 80, 38, 18); c.fill(); c.stroke();
  c.fillStyle = rgrad(c, 48, 26, 36, "#e85a5f", "#7a1014");
  rr(c, 18, 14, 60, 22, 11); c.fill(); c.stroke();
  c.fillStyle = "#fff"; c.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.moveTo(22 + i * 10, 14); c.lineTo(27 + i * 10, 24); c.lineTo(32 + i * 10, 14);
    c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(22 + i * 10, 36); c.lineTo(27 + i * 10, 26); c.lineTo(32 + i * 10, 36);
    c.closePath(); c.fill(); c.stroke();
  }
  c.strokeStyle = OL; c.lineWidth = 5; c.lineCap = "round";
  for (const lx of [24, 48, 72]) { c.beginPath(); c.moveTo(lx, 42); c.lineTo(lx, 52); c.stroke(); }
  c.lineCap = "butt";
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(30, 8, 5, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(66, 8, 5, 0, 7); c.fill(); c.stroke();
  c.fillStyle = OL;
  c.beginPath(); c.arc(30, 9, 2, 0, 7); c.fill();
  c.beginPath(); c.arc(66, 9, 2, 0, 7); c.fill();
});

// ARCH-87: Tight Coupling Bat.
defSprite("bat", 72, 48, (c) => {
  c.lineWidth = 4; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 6, 32, "#5a4a72", "#241c30");
  c.beginPath();
  c.moveTo(36, 24);
  c.lineTo(2, 8); c.lineTo(14, 24); c.lineTo(4, 34); c.lineTo(36, 30);
  c.lineTo(68, 34); c.lineTo(58, 24); c.lineTo(70, 8); c.lineTo(36, 24);
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#2e2440";
  c.beginPath(); c.ellipse(36, 26, 10, 12, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(30, 16); c.lineTo(28, 5); c.lineTo(34, 14); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(42, 16); c.lineTo(44, 5); c.lineTo(38, 14); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#ff4040";
  c.beginPath(); c.arc(32, 24, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(40, 24, 3, 0, 7); c.fill();
});

// ARCH-88: Spaghetti Code — boss "rain" hazard.
defSprite("spaghetti", 60, 60, (c) => {
  c.lineWidth = 5; c.lineCap = "round";
  c.strokeStyle = "#caa83a";
  c.beginPath(); c.moveTo(8, 6); c.bezierCurveTo(24, 28, 40, -4, 54, 20); c.stroke();
  c.strokeStyle = "#e8c84a";
  c.beginPath(); c.moveTo(4, 30); c.bezierCurveTo(22, 10, 38, 50, 56, 28); c.stroke();
  c.strokeStyle = "#b8962e";
  c.beginPath(); c.moveTo(8, 54); c.bezierCurveTo(20, 34, 44, 60, 54, 40); c.stroke();
  c.strokeStyle = "#f0d666";
  c.beginPath(); c.moveTo(2, 44); c.bezierCurveTo(24, 58, 36, 30, 58, 52); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = "#c0392b";
  c.beginPath(); c.arc(28, 30, 5, 0, 7); c.fill();
  c.beginPath(); c.arc(44, 44, 4, 0, 7); c.fill();
});

// ARCH-89: Legacy Code block — TRUE pixel art with chunky "DS" lettering and
// stress sparks. Only the Refactoring Hammer breaks it. The "DS" is short for
// "Data Store", or "Don't Sue", depending on which architect you ask.
pixelSprite("legacycode", {
  K: PAL.OUT, G: PAL.DARK, W: PAL.GRAY, R: PAL.RED,
}, [
  "KKKKKKKKKKKKKKKK",
  "KGGGGGGGGGGGGGGK",
  "KGGGGGGGGGGGGGGK",
  "KGGWWWGGGGWWWGGK",
  "KGGWGGWGGWGGGGGK",
  "KGGWGGWGGWGGGGGK",
  "KGGWGGWGGGWWGGGK",
  "KGGWGGWGGGGGWGGK",
  "KGGWGGWGGWGGWGGK",
  "KGGWWWGGGGWWGGGK",
  "KGGGGGGGGGGGGGGK",
  "KGGRGGGGGGGGGRGK",
  "KGGGGGGGGGGGGGGK",
  "KGGGGRGGGGGGRGGK",
  "KGGGGGGGGGGGGGGK",
  "KKKKKKKKKKKKKKKK",
]);

// ARCH-146: Bureaucratic Bottleneck Cloud — new floating hazard from the spec.
// A puffy gray cloud that drifts toward Archie. Damages on contact, takes
// damage from weapons. Carries the dread of an unresolved JIRA ticket.
pixelSprite("cloud", {
  K: PAL.OUT, D: PAL.DARK, G: PAL.GRAY, W: "#a0acb8",
}, [
  "....KKKKK..........",
  "..KKDDDDKK.........",
  ".KDDGGGGGDKK.......",
  "KDDGGGGGGGGDDK.....",
  "KDGWWGGGGGGGGDDK...",
  "KDGGGGGGGGGGGGGGDK.",
  "KDDDDDDDDDDDDDDDDDK",
  ".KDDDDDDDDDDDDDDDK.",
  "..KKKKKKKKKKKKKKK..",
  ".....KKKK..KKK.....",
]);

// ARCH-147 / ARCH-212: JIRA Swarm Hazard — now drawn with pixel-font labels.
// Three rows of red JRA-### text on black plate, plus an X warning glyph in
// the middle, all rasterized through drawPixelText so the swarm reads as a
// crisp dot-matrix terminal instead of fuzzy anti-aliased text.
defSprite("jirahazard", 80, 36, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 80, 36);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(1, 1, 78, 34);
  drawPixelText(c, "JRA-123", 4, 4, PAL.RED, 1);
  drawPixelText(c, "JRA-456", 44, 4, PAL.RED, 1);
  drawPixelText(c, "JRA-789", 4, 14, PAL.RED, 1);
  drawPixelText(c, "JRA-123", 44, 14, PAL.RED, 1);
  drawPixelText(c, "JRA-456", 4, 24, PAL.RED, 1);
  drawPixelText(c, "JRA-123", 44, 24, PAL.RED, 1);
  drawPixelText(c, "X", 36, 14, "#f0c0c0", 2);
});
defSprite("jirahazard_dim", 80, 36, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 80, 36);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(1, 1, 78, 34);
  drawPixelText(c, "JRA-123", 4, 4, "#7a2a22", 1);
  drawPixelText(c, "JRA-456", 44, 4, "#7a2a22", 1);
  drawPixelText(c, "JRA-789", 4, 14, "#7a2a22", 1);
  drawPixelText(c, "JRA-123", 44, 14, "#7a2a22", 1);
  drawPixelText(c, "JRA-456", 4, 24, "#7a2a22", 1);
  drawPixelText(c, "JRA-123", 44, 24, "#7a2a22", 1);
  drawPixelText(c, "X", 36, 14, "#a05a4a", 2);
});
defSprite("jirahazard_shift", 80, 36, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 80, 36);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(1, 1, 78, 34);
  drawPixelText(c, "JRA-456", 8, 4, PAL.RED, 1);
  drawPixelText(c, "JRA-789", 44, 4, PAL.RED, 1);
  drawPixelText(c, "JRA-123", 8, 14, PAL.RED, 1);
  drawPixelText(c, "JRA-456", 44, 14, PAL.RED, 1);
  drawPixelText(c, "JRA-789", 8, 24, PAL.RED, 1);
  drawPixelText(c, "JRA-123", 44, 24, PAL.RED, 1);
  drawPixelText(c, "X", 36, 14, "#f0c0c0", 2);
});

// ARCH-181 / ARCH-213: Funding Vendor — bean-to-key exchange. Canvas widened
// to 40×44 to accommodate the pixel-font "FUND" label and "50" cost stamp.
defSprite("vendor", 40, 44, (c) => {
  c.fillStyle = "#5D6D7E"; c.fillRect(2, 2, 36, 40);
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(2, 2, 36, 40);
  c.fillStyle = PAL.CUP; c.fillRect(3, 3, 34, 8);
  drawPixelText(c, "FUND", 8, 5, "#ffffff", 1);
  // window with key icon
  c.fillStyle = "#000"; c.fillRect(5, 14, 30, 16);
  c.fillStyle = "#e0b558"; // gold key icon
  c.fillRect(17, 17, 6, 6);
  c.fillRect(15, 22, 10, 3);
  c.fillRect(17, 25, 2, 3);
  // slot
  c.fillStyle = "#1a1a22"; c.fillRect(13, 32, 14, 3);
  // bean-cost label + "50"
  c.fillStyle = "#a06030"; c.fillRect(6, 37, 4, 4);
  drawPixelText(c, "50", 14, 37, "#ffffff", 1);
});

// ARCH-151: The Release Demo(n) — hulking red demonic robot. Random spawn in
// Layer 1. On contact with Archie, INVERTS HIS CONTROLS for 5 seconds because
// the release was, predictably, unstable.
pixelSprite("demon", {
  K: PAL.OUT, R: PAL.RED, r: PAL.DRED, M: "#3a0a0c", P: "#ffe6e6",
}, [
  "....KKKKKKKKKKK....",
  "...KrrrrrrrrrrrK...",
  "..KrrRRRRRRRRRrrK..",
  "..KRRRRRRRRRRRRRK..",
  "..KRPPRRRRRRPPRRK..",
  "..KRRRRRRRRRRRRRK..",
  "..KRRMMMMMMMMRRRK..",
  "..KRRRRRRRRRRRRRK..",
  "..KKKKKKKKKKKKKKK..",
  ".KRRRRRRRRRRRRRRRK.",
  "KRRRRRRRRRRRRRRRRRK",
  "KRRRRRRRRRRRRRRRRRK",
  "KRRRRRMMMMMMRRRRRRK",
  "KRRRRRMRRRRMRRRRRRK",
  "KRRRRRMMMMMMRRRRRRK",
  "KRRRRRRRRRRRRRRRRRK",
  "KRrrrrrrrrrrrrrrrrK",
  ".KrrrrrrrrrrrrrrrK.",
  "..KKKKKKKKKKKKKKK..",
  "..KRRRRK...KRRRRK..",
  "..KRRRRK...KRRRRK..",
  "..KRRRRK...KRRRRK..",
  "..KKKKKK...KKKKKK..",
]);

// ARCH-162: Cross-Domain Phantom (Layer 2). Ghostly silhouette that drifts in
// the DDD ether. IMMUNE to weapon attacks — the only way to defeat it is to
// lure it into the matching Bounded Context zone.
pixelSprite("phantom", {
  K: PAL.OUT, G: "#cfddef", g: "#7e92ab", P: PAL.OUT,
}, [
  "....KKKKK....",
  "...KGGGGGK...",
  "..KGGGGGGGK..",
  "..KGPPGGPPGK.",
  "..KGGGGGGGGK.",
  "..KGGGGGGGGK.",
  "..KGGGGGGGGK.",
  "..KGGGGGGGGK.",
  "..KGGGGGGGGK.",
  "..KgggKgggKK.",
  "..KKKK.KKK.K.",
]);

// ARCH-163 / ARCH-219: Unnecessary Lambda Function — projectile with a crisp
// pixel-art Λ glyph instead of antialiased text.
defSprite("lambda", 28, 28, (c) => {
  c.lineWidth = 3; c.strokeStyle = OL;
  c.fillStyle = rgrad(c, 14, 14, 14, "#cfeefe", "#2f7faf");
  rr(c, 4, 4, 20, 20, 3); c.fill(); c.stroke();
  // Λ glyph (3×5 cells × cellSize=2 = 6×10 canvas = 12×20 design). Centered.
  drawPixelText(c, "λ", 8, 4, "#fff", 2);
});

// ARCH-164: Cost Management Web — the AWS Spider's ground hazard.
defSprite("costweb", 60, 30, (c) => {
  c.fillStyle = "rgba(168,111,208,0.32)";
  c.beginPath(); c.ellipse(30, 18, 26, 12, 0, 0, 7); c.fill();
  c.strokeStyle = "#a86fd0"; c.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath(); c.moveTo(30, 15);
    c.lineTo(30 + Math.cos(a) * 24, 15 + Math.sin(a) * 10);
    c.stroke();
  }
  for (let r = 5; r < 24; r += 5) {
    c.beginPath(); c.ellipse(30, 15, r, r * 0.42, 0, 0, 7); c.stroke();
  }
});

// ARCH-165: The Overcomplicated AWS Design — Layer 2 MINIBOSS. A mechanical
// spider made of AWS service icons. Only the Refactoring Hammer can refactor
// it. Fires Unnecessary Lambda Functions and drops Cost Management Webs.
defSprite("awsspider", 100, 88, (c) => {
  c.strokeStyle = OL; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(40, 30); c.lineTo(10, 8); c.stroke();
  c.beginPath(); c.moveTo(60, 30); c.lineTo(90, 8); c.stroke();
  c.beginPath(); c.moveTo(40, 60); c.lineTo(10, 80); c.stroke();
  c.beginPath(); c.moveTo(60, 60); c.lineTo(90, 80); c.stroke();
  c.lineCap = "butt";
  // ARCH-218: AWS service tags rendered as pixel-font glyphs. Boxes are
  // 18×18 design → 9×9 canvas after PX=0.5, so labels are kept to ≤2 chars.
  const drawBox = (x: number, y: number, col: string, txt: string) => {
    c.fillStyle = col; rr(c, x - 9, y - 9, 18, 18, 2); c.fill();
    c.strokeStyle = OL; c.lineWidth = 3; c.stroke();
    // Each glyph cell = 1 canvas px = 2 design px. Drawn-width in design =
    // chars*8 - 2 (no trailing space after the last glyph).
    const wDesign = txt.length * 8 - 2;
    drawPixelText(c, txt, x - Math.floor(wDesign / 2), y - 5, "#fff", 1);
  };
  drawBox(10, 8, "#5fd0ff", "λ");
  drawBox(90, 8, "#a86fd0", "S3");
  drawBox(10, 80, "#a86fd0", "DB");
  drawBox(90, 80, "#a86fd0", "EC");
  c.lineWidth = 4;
  c.fillStyle = rgrad(c, 50, 46, 36, "#c89af0", "#5f2e8a");
  rr(c, 30, 28, 40, 36, 4); c.fill();
  c.strokeStyle = OL; c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.4)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(36, 32); c.lineTo(64, 60); c.stroke();
  c.beginPath(); c.moveTo(64, 32); c.lineTo(36, 60); c.stroke();
  c.strokeStyle = OL; c.lineWidth = 2;
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(40, 42, 4, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(60, 42, 4, 0, 7); c.fill(); c.stroke();
  c.fillStyle = OL;
  c.beginPath(); c.arc(40, 43, 2, 0, 7); c.fill();
  c.beginPath(); c.arc(60, 43, 2, 0, 7); c.fill();
});

// ARCH-152: Approved Funding key — the only thing that dissolves the
// No-Budget Block Golem. Almost as mythical as a real architectural review.
pixelSprite("key", {
  K: PAL.OUT, Y: "#e0b040", W: "#f8d878",
}, [
  "....KKKK....",
  "...KYYYYK...",
  "..KYWWWYK...",
  ".KYWKKWYK...",
  ".KYWKKWYK...",
  "..KYWWWYK...",
  "...KYYYYK...",
  "....KYYK....",
  "....KYYK....",
  "....KYYK....",
  "....KYYK....",
  "....KYYK....",
  "...KYYYKK...",
  "...KYK..K...",
  "....KK......",
]);

// ARCH-38: The (Incomplete) Blueprint — TRUE pixel art (cyan rolled diagram).
pixelSprite("blueprint", {
  K: PAL.OUT, B: PAL.BLUE, b: "#3a78a8",
}, [
  "..KKKKKKKKKKKKKKKKK..",
  ".KBBBBBBBBBBBBBBBBBK.",
  "KBbBKBBKBBKBBKBBKbBBK",
  "KBBBBBBBBBBBBBBBBBBBK",
  "KBbBKBBKBBKBBKBBKbBBK",
  ".KbbbbbbbbbbbbbbbbbK.",
  "..KKKKKKKKKKKKKKKKK..",
]);

// ARCH-90: The Refactoring Hammer — TRUE pixel art (steel head + wood handle).
pixelSprite("hammer", {
  K: PAL.OUT, G: PAL.GRAY, D: PAL.DARK, W: "#8a5a2a", w: "#5a3a18",
}, [
  "...KKKKKKKKKK...",
  "..KGGGGGGGGGGK..",
  ".KGGDGGGGGDGGK..",
  ".KGGGGGGGGGGGK..",
  ".KGGDGGGGGDGGK..",
  "..KGGGGGGGGGGK..",
  "..KKKKKWWKKKK...",
  "......KWWK......",
  "......KWwK......",
  "......KWWK......",
  "......KWwK......",
  "......KWWK......",
  "......KWwK......",
  "......KWWK......",
  "......KKKK......",
]);

// ARCH-91: API note — the Orchestrator Wand's swirling 8-bit melody.
defSprite("note", 54, 60, (c) => {
  c.fillStyle = "rgba(95,208,255,0.3)";
  c.beginPath(); c.arc(22, 42, 24, 0, 7); c.fill();
  c.lineWidth = 4; c.strokeStyle = "#0d2a3a";
  c.fillStyle = rgrad(c, 20, 44, 16, "#cdf4ff", "#2f9fd0");
  c.beginPath(); c.ellipse(20, 44, 13, 10, -0.3, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#3aa8d8";
  rr(c, 30, 6, 6, 40, 2); c.fill(); c.stroke();
  c.beginPath();
  c.moveTo(36, 6); c.quadraticCurveTo(52, 12, 44, 30);
  c.quadraticCurveTo(48, 16, 36, 18); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.65)";
  c.beginPath(); c.ellipse(15, 40, 4, 3, 0, 0, 7); c.fill();
});

// ARCH-38c / ARCH-220: Password string — enemy / boss projectile, now with
// pixel-font "PASS!" instead of antialiased "p@ss!".
defSprite("enemyshot", 60, 30, (c) => {
  c.fillStyle = "rgba(255,64,255,0.3)";
  c.beginPath(); c.ellipse(30, 15, 28, 12, 0, 0, 7); c.fill();
  c.fillStyle = vgrad(c, 0, 6, 18, "#ff9bff", "#c020c0");
  rr(c, 8, 8, 44, 14, 7); c.fill();
  c.lineWidth = 4; c.strokeStyle = "#5a005a"; c.stroke();
  // "PASS!" = 5 chars × cellSize=1 = ~20 canvas px = 40 design wide.
  // Centered around (30, 15) → top-left design (10, 10).
  drawPixelText(c, "PASS!", 12, 10, "#ffd0ff", 1);
});

// ARCH-38d: Unprocessed Message — the Kafka Cockroach's trail. Per the Layer
// 2 mockup this is now a RED puddle (a fresh consumer-lag puddle) rather than
// the earlier green poison. Same "hazard" tag, same damage.
defSprite("poison", 48, 30, (c) => {
  c.fillStyle = "rgba(231,76,60,0.4)";
  c.beginPath(); c.ellipse(24, 18, 22, 11, 0, 0, 7); c.fill();
  c.fillStyle = rgrad(c, 24, 14, 20, "#f08585", "#8a1f12");
  c.beginPath(); c.ellipse(24, 16, 18, 9, 0, 0, 7); c.fill();
  c.lineWidth = 4; c.strokeStyle = "#3a0a0c"; c.stroke();
  c.fillStyle = "#f6c6c6";
  c.beginPath(); c.arc(16, 14, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(30, 12, 4, 0, 7); c.fill();
});

// ARCH-179: Coffee Bean — primary currency. 3-frame pulse animation per the
// Sprite Manual mockup. Bean entities cycle bean → bean1 → bean2 → bean1 → bean.
// C = lighter bean body, c = darker bean shadow, K = outline.
pixelSprite("bean", {
  K: PAL.OUT, C: "#a06030", c: "#5a3010",
}, [
  "..............",
  "..............",
  "......KKKK....",
  ".....KCcCCK...",
  "....KCcKcCCK..",
  "....KCcKccCK..",
  "....KCccccCK..",
  "....KCccccCK..",
  "....KCccccCK..",
  ".....KCccCK...",
  "......KKKK....",
  "..............",
  "..............",
  "..............",
]);
pixelSprite("bean1", {
  K: PAL.OUT, C: "#a06030", c: "#5a3010",
}, [
  "..............",
  "......KKKK....",
  ".....KCcCCK...",
  "....KCcCCCCK..",
  "...KCcKccCCCK.",
  "...KCcKcccccK.",
  "...KCccccccCK.",
  "...KCcccccccK.",
  "....KCccccccK.",
  "....KCcccccCK.",
  ".....KCccCCK..",
  "......KKKK....",
  "..............",
  "..............",
]);
pixelSprite("bean2", {
  K: PAL.OUT, C: "#a06030", c: "#5a3010",
}, [
  "......KKKK....",
  ".....KCCCCK...",
  "....KCcCCCCK..",
  "...KCcCCCCCCK.",
  "..KCcCKCccccCK",
  "..KCcCKcccccCK",
  "..KCccccccccCK",
  "..KCccccccccCK",
  "..KCccccccccCK",
  "..KCcccccccCK.",
  "...KCcccccCK..",
  "....KCccCCK...",
  ".....KKKKK....",
  "..............",
]);

// ARCH-180: HUD Coffee Cup frames — empty / half / full. The Sprite Manual
// shows a 4-state filling animation; we collapse to 3 (matches our half-cup
// granularity). R = cup red, C = coffee, B = cognitive-blue surface line.
const CUP_PAL = { K: PAL.OUT, R: PAL.CUP, C: "#3a1a08", B: PAL.BLUE };
pixelSprite("cup_empty", CUP_PAL, [
  "..............",
  ".KKKKKKKKKK...",
  "KRRRRRRRRRRK..",
  "KR........RKK.",
  "KR........RK.K",
  "KR........RK.K",
  "KR........RK.K",
  "KR........RKK.",
  "KR........RK..",
  "KRRRRRRRRRRK..",
  ".KKKKKKKKKK...",
  "..............",
]);
pixelSprite("cup_half", CUP_PAL, [
  "..............",
  ".KKKKKKKKKK...",
  "KRRRRRRRRRRK..",
  "KR........RKK.",
  "KR........RK.K",
  "KRBBBBBBBBRK.K",
  "KRCCCCCCCCRK.K",
  "KRCCCCCCCCRKK.",
  "KRCCCCCCCCRK..",
  "KRRRRRRRRRRK..",
  ".KKKKKKKKKK...",
  "..............",
]);
pixelSprite("cup_full", CUP_PAL, [
  "..............",
  ".KKKKKKKKKK...",
  "KRRRRRRRRRRK..",
  "KRBBBBBBBBRKK.",
  "KRCCCCCCCCRK.K",
  "KRCCCCCCCCRK.K",
  "KRCCCCCCCCRK.K",
  "KRCCCCCCCCRKK.",
  "KRCCCCCCCCRK..",
  "KRRRRRRRRRRK..",
  ".KKKKKKKKKK...",
  "..............",
]);

// ARCH-92 / ARCH-211: JIRA Ticket (alternative currency). Now uses crisp
// pixel-font text. Canvas widened to 60×20 design so "JRA-123" at cell=1
// (= 28 design px) fits with margins.
defSprite("jira", 60, 20, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 60, 20);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(2, 2, 56, 16);
  drawPixelText(c, "JRA-123", 16, 8, PAL.RED, 1);
});
defSprite("jira_flicker", 60, 20, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 60, 20);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(2, 2, 56, 16);
  drawPixelText(c, "FLICKER", 16, 8, "#7a3322", 1);
});
defSprite("jira_scroll1", 60, 20, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 60, 20);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(2, 2, 56, 16);
  drawPixelText(c, "-123 JR", 16, 8, PAL.RED, 1);
});
defSprite("jira_scroll2", 60, 20, (c) => {
  c.fillStyle = "#000000"; c.fillRect(0, 0, 60, 20);
  c.strokeStyle = PAL.DRED; c.lineWidth = 2;
  c.strokeRect(2, 2, 56, 16);
  drawPixelText(c, "RA-456", 18, 8, PAL.RED, 1);
});

// ARCH-93: Stakeholder Support Armor — the CTO's blessing.
// ASSET-1138: armor sprite retired — replaced by item_shield SVG loaded above.

// ARCH-94: Double Espresso — speed boost + Cognitive Load locked at 100%.
defSprite("espresso", 72, 60, (c) => {
  c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 3; c.lineCap = "round";
  c.beginPath(); c.moveTo(28, 10); c.quadraticCurveTo(34, 4, 28, -2); c.stroke();
  c.beginPath(); c.moveTo(40, 10); c.quadraticCurveTo(46, 4, 40, -2); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = vgrad(c, 0, 12, 42, "#e85a5f", "#8a1418");
  c.beginPath();
  c.moveTo(12, 14); c.lineTo(56, 14); c.lineTo(50, 50);
  c.quadraticCurveTo(34, 58, 18, 50); c.closePath();
  c.lineWidth = 5; c.strokeStyle = "#3a0a0c"; c.fill(); c.stroke();
  c.fillStyle = "#2a1208";
  c.beginPath(); c.ellipse(34, 16, 21, 5, 0, 0, 7); c.fill();
  c.lineWidth = 6; c.strokeStyle = "#8a1418";
  c.beginPath(); c.arc(56, 28, 9, -1.2, 1.2); c.stroke();
  c.fillStyle = "#fff"; c.font = "bold 13px monospace";
  c.textBaseline = "middle"; c.textAlign = "center";
  c.fillText("x2", 33, 35); c.textAlign = "left";
  c.fillStyle = "rgba(255,255,255,0.4)"; rr(c, 16, 18, 5, 24, 2); c.fill();
});

// ARCH-40: The Refactor Patch — now the per-level EXIT PORTAL.
defSprite("patch", 54, 54, (c) => {
  c.fillStyle = "rgba(58,208,122,0.35)";
  c.beginPath(); c.arc(27, 27, 26, 0, 7); c.fill();
  c.fillStyle = rgrad(c, 27, 27, 24, "#c2f4d6", "#1f8f4f");
  c.beginPath(); c.arc(27, 27, 20, 0, 7); c.fill();
  c.lineWidth = 5; c.strokeStyle = "#0d3a22"; c.stroke();
  c.lineWidth = 4; c.lineCap = "round";
  c.beginPath(); c.arc(27, 27, 12, 0, 4); c.stroke();
  c.beginPath(); c.arc(27, 27, 6, 2, 6); c.stroke();
  c.strokeStyle = "#fff";
  c.beginPath(); c.moveTo(20, 28); c.lineTo(26, 35); c.lineTo(37, 20); c.stroke();
  c.lineCap = "butt";
});

// ---------------------------------------------------------------------------
// ARCH-124: BOSS SPRITES — one show-stopper per Layer of Architecture Hell.
// ---------------------------------------------------------------------------
// Layer 1 — The Product Definition Cthulhu.
defSprite("boss1", 140, 116, (c) => {
  c.strokeStyle = "#2f6a3a"; c.lineWidth = 13; c.lineCap = "round";
  for (const tx of [24, 52, 88, 116]) {
    c.beginPath(); c.moveTo(tx, 70); c.quadraticCurveTo(tx - 14, 96, tx + 8, 110); c.stroke();
  }
  c.lineCap = "butt";
  c.fillStyle = rgrad(c, 70, 56, 64, "#5fae5f", "#2f6a3a");
  c.beginPath(); c.ellipse(70, 58, 58, 42, 0, 0, 7); c.fill();
  c.lineWidth = 5; c.strokeStyle = OL; c.stroke();
  c.fillStyle = "#fff";
  for (const [ex, ey] of [[34, 40], [106, 40], [44, 74], [96, 74]]) {
    c.beginPath(); c.arc(ex, ey, 8, 0, 7); c.fill(); c.stroke();
  }
  c.fillStyle = OL;
  for (const [ex, ey] of [[34, 42], [106, 42], [44, 76], [96, 76]]) {
    c.beginPath(); c.arc(ex, ey, 4, 0, 7); c.fill();
  }
  // ARCH-153: Scope Creep Core — cyan glow per the Layer 1 mockup. This is
  // the boss's only true weak point.
  c.fillStyle = "rgba(133,193,233,0.55)"; c.beginPath(); c.arc(70, 56, 28, 0, 7); c.fill();
  c.fillStyle = rgrad(c, 70, 56, 22, "#dff4ff", "#2f7faf");
  c.beginPath(); c.arc(70, 56, 18, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(70, 56, 8, 0, 7); c.fill();
  c.fillStyle = OL; c.beginPath(); c.arc(70, 56, 4, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,0.25)";
  c.beginPath(); c.ellipse(50, 34, 16, 8, -0.4, 0, 7); c.fill();
});
// Layer 3 — The Data Lake Leviathan.
defSprite("boss3", 140, 112, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = "#8d4fc0";
  for (const cx of [40, 70, 100]) { c.beginPath(); c.arc(cx, 24, 14, 0, 7); c.fill(); c.stroke(); }
  c.fillStyle = rgrad(c, 70, 64, 70, "#b07fe0", "#5a2a8a");
  c.beginPath();
  c.moveTo(10, 64);
  c.bezierCurveTo(6, 30, 40, 18, 70, 24);
  c.bezierCurveTo(104, 18, 134, 32, 130, 68);
  c.bezierCurveTo(134, 96, 100, 108, 70, 102);
  c.bezierCurveTo(36, 108, 8, 98, 10, 64);
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(54, 58, 13, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(90, 58, 13, 0, 7); c.fill(); c.stroke();
  c.fillStyle = OL;
  c.beginPath(); c.arc(56, 60, 6, 0, 7); c.fill();
  c.beginPath(); c.arc(92, 60, 6, 0, 7); c.fill();
  c.fillStyle = "#3a1a5a"; c.beginPath(); c.ellipse(72, 84, 22, 10, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff";
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.moveTo(54 + i * 9, 77); c.lineTo(58 + i * 9, 86); c.lineTo(62 + i * 9, 77);
    c.closePath(); c.fill();
  }
  c.fillStyle = "rgba(255,255,255,0.35)";
  c.beginPath(); c.ellipse(44, 40, 18, 9, -0.4, 0, 7); c.fill();
});
// Layer 4 — The SaaS / PaaS Shapeshifter.
defSprite("boss4", 120, 122, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 16, 90, "#c0c6d0", "#5a6070");
  rr(c, 16, 16, 88, 88, 8); c.fill(); c.stroke();
  c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 3;
  c.strokeRect(34, 34, 52, 52);
  c.beginPath(); c.moveTo(16, 60); c.lineTo(104, 60); c.stroke();
  c.beginPath(); c.moveTo(60, 16); c.lineTo(60, 104); c.stroke();
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = rgrad(c, 60, 60, 22, "#ffd060", "#e07820");
  c.beginPath(); c.arc(60, 60, 18, 0, 7); c.fill(); c.stroke();
  c.fillStyle = OL; c.beginPath(); c.arc(60, 60, 7, 0, 7); c.fill();
  c.fillStyle = "#3a3a44";
  for (const [bx, by] of [[26, 26], [94, 26], [26, 94], [94, 94]]) {
    c.beginPath(); c.arc(bx, by, 5, 0, 7); c.fill(); c.stroke();
  }
  c.strokeStyle = "#2a2a30"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(60, 16); c.lineTo(60, 2); c.stroke();
  c.fillStyle = "#ff4040"; c.beginPath(); c.arc(60, 2, 4, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.4)"; rr(c, 24, 22, 30, 8, 3); c.fill();
});
// Layer 5 — The Exposed Credentials Kingpin.
defSprite("boss5", 110, 134, (c) => {
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 46, 84, "#1f3a6a", "#0e1a34");
  rr(c, 14, 46, 82, 84, 10); c.fill(); c.stroke();
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(55, 50); c.lineTo(55, 130); c.stroke();
  c.fillStyle = "#f0c040";
  for (const by of [62, 82, 102]) {
    c.beginPath(); c.arc(46, by, 4, 0, 7); c.fill();
    c.beginPath(); c.arc(64, by, 4, 0, 7); c.fill();
  }
  c.lineWidth = 5; c.fillStyle = "#16294d";
  c.beginPath(); c.moveTo(26, 46); c.lineTo(55, 40); c.lineTo(44, 68); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(84, 46); c.lineTo(55, 40); c.lineTo(66, 68); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#caa078"; rr(c, 36, 16, 38, 32, 9); c.fill(); c.stroke();
  c.fillStyle = "rgba(0,0,0,0.5)"; rr(c, 36, 16, 38, 16, 8); c.fill();
  c.fillStyle = "#ff66ff";
  c.beginPath(); c.arc(47, 30, 4, 0, 7); c.fill();
  c.beginPath(); c.arc(63, 30, 4, 0, 7); c.fill();
  c.fillStyle = vgrad(c, 0, -6, 22, "#23252e", "#101118");
  rr(c, 24, 8, 62, 11, 4); c.fill(); c.stroke();
  rr(c, 38, -6, 34, 16, 4); c.fill(); c.stroke();
  c.fillStyle = "#3a2f1c"; rr(c, 38, 4, 34, 5, 1); c.fill();
  c.fillStyle = "#caa078";
  c.beginPath(); c.arc(20, 98, 9, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(90, 98, 9, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#f0c040"; c.beginPath(); c.arc(90, 98, 4, 0, 7); c.fill();
});
// Layer 6 — The Clawd n8n Paperclip Hype Guy.
defSprite("boss6", 116, 134, (c) => {
  c.strokeStyle = "#c8ccd6"; c.lineWidth = 13; c.lineCap = "round";
  c.beginPath();
  c.moveTo(42, 122); c.lineTo(42, 52);
  c.arc(60, 52, 18, Math.PI, 0, true);
  c.lineTo(78, 98);
  c.arc(62, 98, 16, 0, Math.PI, false);
  c.lineTo(46, 66);
  c.stroke();
  c.lineCap = "butt"; c.lineWidth = 6; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 8, 40, "#d8dce4", "#8a8f9c");
  rr(c, 32, 8, 52, 40, 10); c.fill(); c.stroke();
  c.fillStyle = "#fff"; rr(c, 42, 30, 32, 12, 4); c.fill(); c.stroke();
  c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    c.beginPath(); c.moveTo(42 + i * 6.4, 30); c.lineTo(42 + i * 6.4, 42); c.stroke();
  }
  c.lineWidth = 6; c.strokeStyle = OL;
  c.fillStyle = "#3aa8e0";
  c.beginPath(); c.arc(46, 22, 7, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(70, 22, 7, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(48, 20, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(72, 20, 3, 0, 7); c.fill();
  c.fillStyle = "#d23030";
  c.beginPath(); c.moveTo(58, 48); c.lineTo(66, 56); c.lineTo(60, 88); c.lineTo(52, 56);
  c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "#9aa0aa"; c.lineWidth = 11; c.lineCap = "round";
  c.beginPath(); c.moveTo(82, 72); c.lineTo(100, 46); c.stroke();
  c.lineCap = "butt"; c.lineWidth = 6; c.strokeStyle = OL;
  c.fillStyle = "#c8ccd6"; c.beginPath(); c.arc(100, 44, 8, 0, 7); c.fill(); c.stroke();
});
// Layer 2 & 7 — Legacy Monolith & TOGAF (also used as level-2/7 bosses).
defSprite("monolith", 144, 114, (c) => {
  c.fillStyle = vgrad(c, 0, 4, 108, "#7a7a88", "#33333c");
  rr(c, 6, 4, 132, 106, 6); c.fill();
  c.lineWidth = 6; c.strokeStyle = OL; c.stroke();
  c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 2;
  for (let y = 18; y < 104; y += 20) {
    c.beginPath(); c.moveTo(8, y); c.lineTo(136, y); c.stroke();
  }
  for (let x = 28; x < 136; x += 28) {
    c.beginPath(); c.moveTo(x, 6); c.lineTo(x, 108); c.stroke();
  }
  c.strokeStyle = "#2a2a30"; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(20, 40); c.bezierCurveTo(60, 20, 90, 70, 124, 46); c.stroke();
  c.beginPath(); c.moveTo(16, 76); c.bezierCurveTo(50, 60, 100, 96, 128, 72); c.stroke();
  c.lineCap = "butt";
  c.fillStyle = "#d23030"; rr(c, 30, 24, 18, 14, 2); c.fill();
  c.fillStyle = "#e07820"; rr(c, 96, 24, 18, 14, 2); c.fill();
  c.fillStyle = "#c9a227"; rr(c, 40, 84, 20, 12, 2); c.fill();
  c.lineWidth = 5; c.strokeStyle = OL;
  c.fillStyle = "#ff5050";
  c.beginPath(); c.arc(54, 58, 9, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(92, 58, 9, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(56, 56, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(94, 56, 3, 0, 7); c.fill();
  c.strokeStyle = "#15151c"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(72, 8); c.lineTo(66, 30); c.lineTo(78, 52); c.lineTo(70, 80); c.stroke();
});
defSprite("boss", 144, 90, (c) => {
  c.fillStyle = "rgba(168,111,208,0.3)";
  c.beginPath(); c.ellipse(72, 24, 54, 16, 0, 0, 7); c.fill();
  c.lineWidth = 6; c.strokeStyle = OL;
  c.fillStyle = rgrad(c, 72, 46, 90, "#6a589c", "#251d40");
  rr(c, 8, 10, 128, 72, 24); c.fill(); c.stroke();
  const cols = ["#d23030", "#3ad07a", "#f2c200", "#a86fd0", "#5fd0ff"];
  c.globalAlpha = 0.9;
  for (let i = 0; i < 8; i++) {
    c.fillStyle = cols[i % 5];
    rr(c, 20 + i * 14, 16 + (i % 2) * 8, 12, 12, 3); c.fill();
  }
  c.globalAlpha = 1;
  c.fillStyle = "#1a1322"; rr(c, 52, 40, 40, 26, 8); c.fill(); c.stroke();
  c.fillStyle = "#fff"; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.moveTo(54 + i * 8, 40); c.lineTo(58 + i * 8, 50); c.lineTo(62 + i * 8, 40);
    c.closePath(); c.fill();
  }
  c.lineWidth = 6;
  c.fillStyle = "#fff";
  c.beginPath(); c.arc(30, 34, 9, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(114, 34, 9, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#d23030";
  c.beginPath(); c.arc(30, 35, 4, 0, 7); c.fill();
  c.beginPath(); c.arc(114, 35, 4, 0, 7); c.fill();
  c.fillStyle = "#f2c200";
  for (let i = 0; i < 4; i++) { rr(c, 24 + i * 28, 70, 18, 5, 2); c.fill(); }
});

// -----------------------------------------------------------------------------
// ARCH-111: ENVIRONMENT ART — detailed parallax city + props + vignette.
// -----------------------------------------------------------------------------
function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function drawBuilding(c: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = mulberry(seed);
  const warm = r() > 0.5;
  const top = warm ? "#8a7c6a" : "#797d86";
  const bot = warm ? "#52483c" : "#43454d";
  c.fillStyle = vgrad(c, 0, 0, h, top, bot);
  c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(0,0,0,0.30)"; c.fillRect(w - 11, 0, 11, h);
  c.fillStyle = "rgba(255,255,255,0.06)"; c.fillRect(0, 0, 5, h);
  c.fillStyle = bot; c.fillRect(-4, 0, w + 8, 16);
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(-4, 14, w + 8, 4);
  if (r() > 0.5) {
    c.fillStyle = "#6b5b46"; rr(c, w * 0.3, -28, 44, 30, 4); c.fill();
    c.fillStyle = "#3a3128"; c.fillRect(w * 0.3 + 6, -4, 8, 10); c.fillRect(w * 0.3 + 30, -4, 8, 10);
  } else {
    c.fillStyle = "#7d7f86"; rr(c, w * 0.48, -24, 48, 26, 3); c.fill();
    c.strokeStyle = "#3a3a40"; c.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      c.beginPath(); c.moveTo(w * 0.48 + i * 9, -24); c.lineTo(w * 0.48 + i * 9, 2); c.stroke();
    }
  }
  c.strokeStyle = "#2a2a30"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(w * 0.7, 0); c.lineTo(w * 0.7, -34); c.stroke();
  const cols = 3 + Math.floor(r() * 2);
  const floors = Math.max(2, Math.floor((h - 96) / 46));
  const mx = 22, gw = (w - mx * 2) / cols;
  for (let f = 0; f < floors; f++) {
    const wy = 28 + f * 46;
    for (let cc = 0; cc < cols; cc++) {
      const wx = mx + cc * gw + 7;
      const ww = gw - 18, wh = 30;
      c.fillStyle = "#2e2a26"; rr(c, wx - 3, wy - 3, ww + 6, wh + 6, 2); c.fill();
      const lit = r() > 0.5;
      c.fillStyle = lit
        ? vgrad(c, 0, wy, wh, "#ffd98a", "#e8a23a")
        : vgrad(c, 0, wy, wh, "#3a4654", "#222a34");
      rr(c, wx, wy, ww, wh, 1); c.fill();
      c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
      c.beginPath(); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
      c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(wx - 3, wy + wh + 3, ww + 6, 3);
    }
  }
  if (r() > 0.4) {
    c.strokeStyle = "#1f1f26"; c.lineWidth = 3;
    for (let f = 0; f < floors; f++) {
      const fy = 28 + f * 46 + 36;
      c.beginPath(); c.moveTo(mx - 2, fy); c.lineTo(mx + gw * 1.25, fy); c.stroke();
    }
  }
  c.strokeStyle = "#33302c"; c.lineWidth = 5;
  c.beginPath(); c.moveTo(w - 16, 18); c.lineTo(w - 16, h - 74); c.stroke();
  const sy = h - 74;
  c.fillStyle = "#241f1b"; c.fillRect(8, sy, w - 16, 74);
  c.fillStyle = vgrad(c, 0, sy + 10, 44, "#ffcf7a", "#b9742a");
  c.fillRect(20, sy + 12, w - 96, 48);
  c.fillStyle = "#15120f"; c.fillRect(w - 60, sy + 8, 42, 62);
  c.fillStyle = "#3a2f24"; c.fillRect(w - 56, sy + 12, 34, 54);
  const sg = (w - 16) / 8;
  const ac1 = r() > 0.5 ? "#b6402f" : "#2f5fb6";
  for (let i = 0; i < 8; i++) {
    c.fillStyle = i % 2 ? ac1 : "#e8e2d4";
    c.beginPath();
    c.moveTo(8 + i * sg, sy); c.lineTo(8 + (i + 1) * sg, sy);
    c.lineTo(8 + (i + 0.5) * sg, sy + 16); c.closePath(); c.fill();
  }
  c.fillStyle = "rgba(0,0,0,0.3)"; c.fillRect(8, sy - 5, w - 16, 5);
  c.fillStyle = "#c4382b"; rr(c, w * 0.16, sy - 60, 58, 32, 3); c.fill();
  c.strokeStyle = "#2a2a30"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(w * 0.16 + 29, sy - 60); c.lineTo(w * 0.16 + 29, sy - 70); c.stroke();
  c.fillStyle = "#f0e8d8";
  c.fillRect(w * 0.16 + 10, sy - 52, 11, 15);
  c.fillRect(w * 0.16 + 24, sy - 52, 11, 15);
  c.fillRect(w * 0.16 + 38, sy - 52, 11, 15);
  c.fillStyle = "rgba(0,0,0,0.12)";
  for (let i = 0; i < 4; i++) { c.fillRect(12 + r() * (w - 24), 20, 3, h * 0.45 * r() + 40); }
  c.strokeStyle = OL; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 2);
}
const BPAD = 46;
([
  ["bldg0", 280, 420, 11], ["bldg1", 320, 380, 29],
  ["bldg2", 240, 470, 57], ["bldg3", 300, 400, 83],
] as [string, number, number, number][]).forEach(([nm, w, h, sd]) => {
  defSprite(nm, w, h + BPAD, (c) => { c.translate(0, BPAD); drawBuilding(c, w, h, sd); });
});
const BUILDINGS = ["bldg0", "bldg1", "bldg2", "bldg3"];

defSprite("groundtile", 80, 60, (c) => {
  c.fillStyle = vgrad(c, 0, 0, 60, "#6a625a", "#3c3833");
  c.fillRect(0, 0, 80, 60);
  c.fillStyle = "#8c8377"; c.fillRect(0, 0, 80, 5);
  c.fillStyle = "#a89c8c"; c.fillRect(0, 0, 80, 2);
  c.strokeStyle = "rgba(0,0,0,0.45)"; c.lineWidth = 2;
  c.strokeRect(1, 7, 78, 24); c.strokeRect(1, 32, 78, 26);
  c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(20, 9); c.lineTo(28, 20); c.lineTo(24, 30); c.stroke();
  c.beginPath(); c.moveTo(58, 34); c.lineTo(50, 46); c.stroke();
  const rr2 = mulberry(7);
  for (let i = 0; i < 30; i++) {
    c.fillStyle = rr2() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.20)";
    c.fillRect((i * 13) % 76, 8 + ((i * 7) % 48), 2, 2);
  }
  c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(40, 33, 38, 24);
});
defSprite("crate", 44, 40, (c) => {
  c.fillStyle = vgrad(c, 0, 0, 40, "#a9763e", "#6e4a23");
  rr(c, 2, 2, 40, 36, 2); c.fill();
  c.lineWidth = 3; c.strokeStyle = OL; c.stroke();
  c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(2, 14); c.lineTo(42, 14); c.stroke();
  c.beginPath(); c.moveTo(2, 26); c.lineTo(42, 26); c.stroke();
  c.beginPath(); c.moveTo(2, 38); c.lineTo(42, 2); c.stroke();
  c.fillStyle = "rgba(255,220,150,0.25)"; c.fillRect(4, 4, 34, 3);
});
defSprite("cone", 30, 38, (c) => {
  c.fillStyle = vgrad(c, 0, 4, 32, "#ff7a2a", "#c24a10");
  c.beginPath(); c.moveTo(15, 2); c.lineTo(26, 34); c.lineTo(4, 34); c.closePath(); c.fill();
  c.lineWidth = 3; c.strokeStyle = OL; c.stroke();
  c.fillStyle = "#f0ece0";
  c.beginPath(); c.moveTo(9, 18); c.lineTo(21, 18); c.lineTo(23, 26); c.lineTo(7, 26); c.closePath(); c.fill();
  c.fillStyle = "#2a2a30"; rr(c, 1, 32, 28, 6, 2); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.3)"; c.fillRect(13, 4, 3, 12);
});
defSprite("hydrant", 28, 40, (c) => {
  c.lineWidth = 3; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 4, 36, "#d83a2a", "#8a1f12");
  rr(c, 6, 9, 16, 28, 4); c.fill(); c.stroke();
  c.fillStyle = "#b02e1f"; rr(c, 9, 2, 10, 9, 2); c.fill(); c.stroke();
  c.fillStyle = "#a52a1c";
  c.beginPath(); c.arc(6, 21, 4, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(22, 21, 4, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#f0c040"; c.beginPath(); c.arc(14, 7, 2.5, 0, 7); c.fill();
  c.fillStyle = "#2a2a30"; rr(c, 4, 34, 20, 5, 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.25)"; c.fillRect(9, 12, 3, 18);
});
defSprite("trashbag", 42, 36, (c) => {
  c.lineWidth = 3; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 0, 36, "#3a3a42", "#18181e");
  c.beginPath(); c.ellipse(21, 24, 19, 12, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(21, 13, 13, 10, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#15151a";
  c.beginPath(); c.moveTo(16, 4); c.lineTo(26, 4); c.lineTo(24, 11); c.lineTo(18, 11); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,0.12)";
  c.beginPath(); c.ellipse(13, 17, 5, 3, -0.5, 0, 7); c.fill();
});
defSprite("lamppost", 44, 182, (c) => {
  c.fillStyle = "#1c1c22"; rr(c, 12, 168, 22, 12, 3); c.fill();
  c.fillStyle = vgrad(c, 16, 0, 182, "#42424e", "#15151c");
  c.fillRect(18, 8, 9, 164);
  c.lineWidth = 3; c.strokeStyle = OL; c.strokeRect(18, 8, 9, 164);
  c.fillStyle = "#1a1a20"; c.fillRect(15, 44, 15, 5); c.fillRect(15, 116, 15, 5);
  c.fillStyle = "#2a2a32"; c.fillRect(22, 10, 18, 7);
  c.fillStyle = vgrad(c, 0, -2, 26, "#4a4a54", "#222228");
  rr(c, 32, 2, 20, 22, 3); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,210,120,0.95)"; rr(c, 35, 8, 14, 13, 2); c.fill();
  c.fillStyle = "rgba(255,210,120,0.28)";
  c.beginPath(); c.arc(42, 16, 26, 0, 7); c.fill();
});
defSprite("plank", 48, 22, (c) => {
  c.fillStyle = vgrad(c, 0, 0, 22, "#b5823f", "#6e4a22");
  c.fillRect(0, 0, 48, 22);
  c.fillStyle = "rgba(255,225,160,0.3)"; c.fillRect(0, 1, 48, 3);
  c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(0, 18, 48, 4);
  c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, 11); c.lineTo(48, 11); c.stroke();
  c.fillStyle = "#2a2a30";
  for (const bx of [6, 42]) {
    c.beginPath(); c.arc(bx, 6, 2.5, 0, 7); c.fill();
    c.beginPath(); c.arc(bx, 16, 2.5, 0, 7); c.fill();
  }
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(1, 1, 46, 20);
});
// ARCH-172: AGILE BOARD platform — Layer 1's tile per the mockup. Stacked
// post-it / index-card style on a dark cork backing. Replaces the wooden
// plank for idx===0 only; same 48×22 footprint so addPlatform stays simple.
defSprite("agileboard", 48, 22, (c) => {
  c.fillStyle = "#2e2415"; c.fillRect(0, 0, 48, 22);
  const Y = "#e0b558", y = "#a07a30";
  const card = (x: number, ty: number, w: number) => {
    c.fillStyle = Y; c.fillRect(x, ty, w, 5);
    c.fillStyle = y; c.fillRect(x, ty + 4, w, 1);
  };
  card(2, 2, 12); card(16, 2, 16); card(34, 2, 12);
  card(2, 9, 18); card(22, 9, 12); card(36, 9, 10);
  card(2, 15, 14); card(18, 15, 11); card(31, 15, 15);
  c.strokeStyle = "#0a0a0a"; c.lineWidth = 2;
  c.strokeRect(1, 1, 46, 20);
});

// ARCH-173: floating background architecture diagrams — gray UML-ish skeletons
// that scroll past at parallax. Three variants for visual variety.
defSprite("diagram0", 200, 100, (c) => {
  c.strokeStyle = "#5D6D7E"; c.lineWidth = 2;
  c.strokeRect(80, 42, 40, 14);
  c.strokeRect(10, 12, 40, 14);
  c.strokeRect(150, 12, 40, 14);
  c.strokeRect(10, 74, 40, 14);
  c.strokeRect(150, 74, 40, 14);
  c.setLineDash([3, 3]);
  c.beginPath(); c.moveTo(100, 42); c.lineTo(50, 26); c.stroke();
  c.beginPath(); c.moveTo(100, 42); c.lineTo(150, 26); c.stroke();
  c.beginPath(); c.moveTo(100, 56); c.lineTo(50, 81); c.stroke();
  c.beginPath(); c.moveTo(100, 56); c.lineTo(150, 81); c.stroke();
  c.setLineDash([]);
});
defSprite("diagram1", 200, 100, (c) => {
  c.strokeStyle = "#5D6D7E"; c.lineWidth = 2;
  c.strokeRect(80, 5, 40, 14);
  c.strokeRect(150, 43, 40, 14);
  c.strokeRect(80, 81, 40, 14);
  c.strokeRect(10, 43, 40, 14);
  c.setLineDash([3, 3]);
  c.beginPath(); c.arc(100, 50, 56, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
});
defSprite("diagram2", 200, 100, (c) => {
  c.strokeStyle = "#5D6D7E"; c.lineWidth = 2;
  c.strokeRect(10, 43, 40, 14);
  c.strokeRect(80, 43, 40, 14);
  c.strokeRect(150, 43, 40, 14);
  c.setLineDash([3, 3]);
  c.beginPath(); c.moveTo(50, 50); c.lineTo(80, 50); c.stroke();
  c.beginPath(); c.moveTo(120, 50); c.lineTo(150, 50); c.stroke();
  c.setLineDash([]);
});

// ARCH-174 / ARCH-214: floating DS micro-block — pixel-font "DS" instead of
// antialiased browser text.
defSprite("dsfloating", 40, 40, (c) => {
  c.fillStyle = "#4D5656"; c.fillRect(6, 6, 28, 28);
  c.strokeStyle = "#0a0a0a"; c.lineWidth = 2;
  c.strokeRect(6, 6, 28, 28);
  drawPixelText(c, "DS", 12, 14, "#a0a8b0", 2);
  c.fillStyle = "#e0782a";
  c.fillRect(0, 4, 3, 3);
  c.fillRect(36, 8, 3, 3);
  c.fillRect(2, 28, 3, 3);
  c.fillRect(34, 30, 3, 3);
  c.fillRect(20, 0, 3, 3);
});

// ARCH-175 / ARCH-215: floor "db" tag — pixel-font letters.
defSprite("dbtag", 28, 16, (c) => {
  c.fillStyle = "#85C1E9"; c.fillRect(2, 2, 24, 12);
  c.strokeStyle = "#0a0a0a"; c.lineWidth = 2;
  c.strokeRect(2, 2, 24, 12);
  drawPixelText(c, "DB", 8, 5, "#0a0a0a", 1);
});

// ARCH-221: Layer 2 ETHER VORTEX background sprite. Dark-navy base with a
// concentric arc pattern that reads as a slow-spiral DDD vortex. Drawn fixed
// to screen, rotated slowly each frame for ambient motion.
defSprite("vortex", 800, 600, (c) => {
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#0a1530"; c.fillRect(0, 0, 800, 600);
  c.lineWidth = 6;
  for (let i = 0; i < 16; i++) {
    const r = 40 + i * 30;
    c.strokeStyle = `rgba(60, 120, 220, ${0.45 - i * 0.022})`;
    c.beginPath();
    c.arc(400, 300, r, i * 0.55, i * 0.55 + Math.PI * 1.45);
    c.stroke();
  }
  // Bright center glow
  const grd = c.createRadialGradient(400, 300, 0, 400, 300, 180);
  grd.addColorStop(0, "rgba(140, 200, 255, 0.5)");
  grd.addColorStop(1, "rgba(60, 120, 220, 0)");
  c.fillStyle = grd; c.fillRect(0, 0, 800, 600);
  // Sparse outer radial ticks for the energy-line feel
  c.strokeStyle = "rgba(100, 180, 240, 0.32)";
  c.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const ang = i * Math.PI / 7 + 0.3;
    c.beginPath();
    c.moveTo(400 + Math.cos(ang) * 200, 300 + Math.sin(ang) * 200);
    c.lineTo(400 + Math.cos(ang) * 380, 300 + Math.sin(ang) * 380);
    c.stroke();
  }
});

// ARCH-222: Layer 2 cyan TKT-board platform tile. Same 48×22 footprint as
// agileboard / plank, but the cards are bright cyan on a dark-navy backing
// (per the DDD Ether Maze mockup).
defSprite("tktboard", 48, 22, (c) => {
  c.fillStyle = "#0a1a32"; c.fillRect(0, 0, 48, 22);
  const Y = "#5db5e0", y = "#1a4880", hi = "#9de0f0";
  const card = (cx: number, ty: number, cw: number) => {
    c.fillStyle = Y; c.fillRect(cx, ty, cw, 5);
    c.fillStyle = hi; c.fillRect(cx, ty, cw, 1);
    c.fillStyle = y; c.fillRect(cx, ty + 4, cw, 1);
  };
  card(2, 2, 12); card(16, 2, 16); card(34, 2, 12);
  card(2, 9, 18); card(22, 9, 12); card(36, 9, 10);
  card(2, 15, 14); card(18, 15, 11); card(31, 15, 15);
  c.strokeStyle = "#0a0a0a"; c.lineWidth = 2;
  c.strokeRect(1, 1, 46, 20);
});

// ARCH-233: LGPD / GDPR Leech — Layer 3 specialty enemy. Touch Archie and
// trigger a "GDPR VIOLATION" state that drains his coffee until cleansed.
// Single frame, purple, with a white eye on the head.
pixelSprite("leech", {
  K: PAL.OUT, P: "#a86fd0", p: "#5a2a8a", W: "#ffffff",
}, [
  "...KKK..........",
  "..KPPPK.........",
  ".KPWPPKK........",
  "KPPPPPPPKK......",
  ".KKPPPPPPPKK....",
  "...KKPPPPPPPK...",
  "......KKPPPK....",
  "........KKK.....",
]);

// ARCH-242: Migration Puzzle — Fragmented Master Data BLOCK A. Yellow base
// with orange "fragmentation" spots and a pixel-font "A" stamp, per the
// Layer 3 design reference.
defSprite("pushblock_a", 24, 24, (c) => {
  c.fillStyle = "#e8b048"; c.fillRect(2, 2, 20, 20);
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(2, 2, 20, 20);
  c.fillStyle = "#f8d878"; c.fillRect(2, 2, 20, 2);
  c.fillStyle = "#9a7028"; c.fillRect(2, 20, 20, 2);
  c.fillStyle = "#e07820";
  c.fillRect(5, 5, 3, 2); c.fillRect(13, 6, 3, 2);
  c.fillRect(8, 11, 2, 2); c.fillRect(15, 13, 3, 2);
  c.fillRect(6, 17, 2, 2); c.fillRect(14, 18, 3, 2);
  drawPixelText(c, "A", 10, 9, "#5a3010", 1);
});

// ARCH-243: Migration Puzzle — BLOCK B (consolidated gray data block).
defSprite("pushblock_b", 24, 24, (c) => {
  c.fillStyle = "#9a9aa4"; c.fillRect(2, 2, 20, 20);
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(2, 2, 20, 20);
  c.fillStyle = "#c0c0cc"; c.fillRect(2, 2, 20, 2);
  c.fillStyle = "#6a6a74"; c.fillRect(2, 20, 20, 2);
  drawPixelText(c, "B", 10, 9, "#1a1a22", 1);
});

// ARCH-244: Storage Silo container — receives pushed data blocks. One sprite,
// label ("CUST" vs "PROD") is drawn as a separate text object at placement.
defSprite("silo", 28, 40, (c) => {
  // body
  c.fillStyle = "#7a7a88"; c.fillRect(2, 4, 24, 34);
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(2, 4, 24, 34);
  // top rim
  c.fillStyle = "#3a3a44"; c.fillRect(2, 2, 24, 4);
  c.strokeRect(2, 2, 24, 4);
  // top opening slit
  c.fillStyle = "#0a0a0a"; c.fillRect(6, 4, 16, 2);
  // vertical ribs
  c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 1;
  for (let x = 8; x < 22; x += 5) {
    c.beginPath(); c.moveTo(x, 7); c.lineTo(x, 37); c.stroke();
  }
  // base flange
  c.fillStyle = "#5a5a64"; c.fillRect(0, 36, 28, 4);
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(0, 36, 28, 4);
});

// ARCH-234: Data Cleansing power-up — cyan diamond with inner sparkle. On
// pickup, clears any active GDPR violation and grants a small CP bonus.
pixelSprite("cleanse", {
  K: PAL.OUT, B: PAL.BLUE, b: "#3a78a8", W: "#cfeefe",
}, [
  ".......KK.......",
  "......KBBK......",
  ".....KBWWBK.....",
  "....KBWbbWBK....",
  "...KBWbWWbWBK...",
  "..KBWbWWWWbWBK..",
  ".KBWbWWWWWWbWBK.",
  "KBWbWWWWWWWWbWBK",
  ".KBWbWWWWWWbWBK.",
  "..KBWbWWWWbWBK..",
  "...KBWbWWbWBK...",
  "....KBWbbWBK....",
  ".....KBWWBK.....",
  "......KBBK......",
  ".......KK.......",
]);

// ARCH-247: Layer 4 server rack — tall dark gray cabinet with horizontal
// server units and blinking LEDs. Drawn at mid-parallax so the player reads
// "Hardware Hell" instantly.
defSprite("serverrack", 32, 64, (c) => {
  c.fillStyle = "#2a2a32"; c.fillRect(2, 2, 28, 60);
  c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(2, 2, 28, 60);
  // top vent slats
  c.fillStyle = "#1a1a22"; c.fillRect(4, 4, 24, 6);
  for (let y = 5; y < 9; y += 2) {
    c.fillStyle = "#3a3a44"; c.fillRect(6, y, 20, 1);
  }
  // server units (horizontal lines)
  c.fillStyle = "#3a3a44";
  for (let y = 12; y < 60; y += 6) {
    c.fillRect(4, y, 24, 4);
    c.fillStyle = "#1a1a22"; c.fillRect(4, y + 3, 24, 1);
    c.fillStyle = "#3a3a44";
  }
  // LEDs — mix green/red
  for (let i = 0; i < 7; i++) {
    c.fillStyle = i % 3 === 0 ? "#d83a2a" : "#3ad07a";
    c.fillRect(6 + (i % 2) * 22, 14 + i * 6, 2, 2);
  }
  // base feet
  c.fillStyle = "#1a1a22"; c.fillRect(2, 60, 6, 2);
  c.fillRect(24, 60, 6, 2);
});

// ARCH-248: Cooling fan — circular fan, 4 blades. Spun in Layer 4 bg.onDraw
// via the drawSprite `angle` parameter for ambient industrial motion.
defSprite("coolfan", 30, 30, (c) => {
  c.fillStyle = "#3a3a44";
  c.beginPath(); c.arc(15, 15, 13, 0, 7); c.fill();
  c.strokeStyle = OL; c.lineWidth = 2; c.stroke();
  c.fillStyle = "#6a6a74";
  for (let i = 0; i < 4; i++) {
    c.save();
    c.translate(15, 15);
    c.rotate((i * Math.PI) / 2);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(2, -11);
    c.lineTo(6, -7);
    c.closePath();
    c.fill();
    c.restore();
  }
  c.fillStyle = "#0a0a0a";
  c.beginPath(); c.arc(15, 15, 3, 0, 7); c.fill();
  // outer ring
  c.strokeStyle = "#5a5a64"; c.lineWidth = 1;
  c.beginPath(); c.arc(15, 15, 12, 0, 7); c.stroke();
});

// ARCH-279: Circuit Floor tile — Layer 6 specialty floor. Glowing cyan
// trapezoid pattern with bright top edge + subtle perspective lines. Slots
// into the same 80×60 footprint as `groundtile`.
defSprite("circuit_floor", 80, 60, (c) => {
  c.fillStyle = "#0e2342"; c.fillRect(0, 0, 80, 60);
  // bright cyan glow top edge (the "panel" feel)
  c.fillStyle = "#85C1E9"; c.fillRect(0, 0, 80, 3);
  c.fillStyle = "#cfeefe"; c.fillRect(0, 0, 80, 1);
  // horizontal "tile" lines
  c.strokeStyle = "rgba(133,193,233,0.45)"; c.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const yy = 9 + i * 13;
    c.beginPath(); c.moveTo(0, yy); c.lineTo(80, yy); c.stroke();
  }
  // verticals with slight perspective skew
  for (let i = 0; i < 5; i++) {
    const xx = 6 + i * 18;
    c.beginPath(); c.moveTo(xx, 0); c.lineTo(xx - 2, 60); c.stroke();
  }
  // mid-panel cyan haze
  c.fillStyle = "rgba(133,193,233,0.12)";
  c.fillRect(0, 20, 80, 26);
  // bright pixel dots scattered (data "blips")
  c.fillStyle = "#cfeefe";
  c.fillRect(12, 32, 2, 2); c.fillRect(42, 36, 2, 2);
  c.fillRect(62, 40, 2, 2); c.fillRect(24, 48, 2, 2);
});

// ARCH-280: Sagemaker Sad Monster — depressed gray cyborg, weeping binary
// tears. Pixel-art, slow random shuffle, contact damage only.
pixelSprite("sad_monster", {
  K: PAL.OUT, G: "#7a8088", D: "#3a3a44", E: "#85C1E9", T: "#5fd0ff",
}, [
  "...KKKKKK....",
  "..KGGGGGGGK..",
  ".KGDGGGGGDGK.",
  ".KGGGGGGGGGK.",
  ".KGEGGGGGEGK.",
  ".KGTGGGGGTGK.",
  ".KGGGGGGGGGK.",
  ".KGDDDGDDDGGK",
  "..KGGGGGGGK..",
  ".KKKKKKKKKKK.",
  ".KGGK..KGGK..",
  ".KGGK..KGGK..",
  "KKKKK..KKKKK.",
]);

// ARCH-281: Transformer Attention Seeker — big mech. Standing pose with a
// glowing chest core. Attention meter drawn separately as a child rect.
defSprite("transformer_seeker", 60, 84, (c) => {
  c.lineWidth = 3; c.strokeStyle = OL;
  // body torso
  c.fillStyle = vgrad(c, 0, 22, 36, "#6a7080", "#3a3a44");
  rr(c, 12, 22, 36, 36, 4); c.fill(); c.stroke();
  // head
  c.fillStyle = vgrad(c, 0, 4, 18, "#8a9098", "#5a6068");
  rr(c, 18, 4, 24, 18, 3); c.fill(); c.stroke();
  // visor band
  c.fillStyle = "#85C1E9"; c.fillRect(22, 12, 16, 4);
  c.fillStyle = "#cfeefe"; c.fillRect(22, 13, 16, 1);
  // chest core (charging)
  c.fillStyle = rgrad(c, 30, 38, 12, "#cfeefe", "#3a78a8");
  c.beginPath(); c.arc(30, 38, 9, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#cfeefe";
  c.beginPath(); c.arc(30, 38, 4, 0, 7); c.fill();
  // shoulders
  c.fillStyle = "#5a6068";
  rr(c, 2, 26, 12, 14, 3); c.fill(); c.stroke();
  rr(c, 46, 26, 12, 14, 3); c.fill(); c.stroke();
  // arms
  c.fillStyle = "#3a3a44";
  rr(c, 0, 40, 10, 18, 2); c.fill(); c.stroke();
  rr(c, 50, 40, 10, 18, 2); c.fill(); c.stroke();
  // legs
  rr(c, 16, 58, 12, 22, 3); c.fill(); c.stroke();
  rr(c, 32, 58, 12, 22, 3); c.fill(); c.stroke();
  // feet
  c.fillStyle = "#1a1a22";
  rr(c, 14, 78, 14, 5, 2); c.fill();
  rr(c, 32, 78, 14, 5, 2); c.fill();
});

// ARCH-277: Neural network panel — Layer 6 parallax decoration. 4 columns of
// 3 nodes each, fully-connected lines. Cyan-on-dark; tiled in bg.onDraw.
defSprite("neuralnet", 400, 200, (c) => {
  c.imageSmoothingEnabled = false;
  const nodes: Array<{ x: number; y: number; col: number }> = [];
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      nodes.push({ x: 40 + col * 110, y: 30 + row * 70, col });
    }
  }
  c.strokeStyle = "rgba(133, 193, 233, 0.55)"; c.lineWidth = 1;
  for (const a of nodes) {
    for (const b of nodes) {
      if (b.col === a.col + 1) {
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
    }
  }
  for (const n of nodes) {
    c.fillStyle = "rgba(120, 200, 255, 0.7)";
    c.beginPath(); c.arc(n.x, n.y, 9, 0, 7); c.fill();
    c.fillStyle = "rgba(220, 250, 255, 0.95)";
    c.beginPath(); c.arc(n.x, n.y, 5, 0, 7); c.fill();
    c.fillStyle = "#85C1E9";
    c.beginPath(); c.arc(n.x, n.y, 2, 0, 7); c.fill();
  }
});

// ARCH-262: Firewall Node (Layer 5) — ACTIVE state. Cyan grid square with
// a glowing core. Invulnerable while the DDoS Tide is flooding.
defSprite("firewall_active", 64, 64, (c) => {
  c.fillStyle = "#1f4a6e"; c.fillRect(2, 2, 60, 60);
  c.strokeStyle = OL; c.lineWidth = 3; c.strokeRect(2, 2, 60, 60);
  c.fillStyle = "#3a78a8"; c.fillRect(4, 4, 56, 56);
  // grid lines
  c.strokeStyle = "rgba(207,238,254,0.4)"; c.lineWidth = 1;
  for (let i = 12; i < 60; i += 8) {
    c.beginPath(); c.moveTo(i, 4); c.lineTo(i, 60); c.stroke();
    c.beginPath(); c.moveTo(4, i); c.lineTo(60, i); c.stroke();
  }
  // glowing core
  c.fillStyle = "rgba(133,193,233,0.5)";
  c.beginPath(); c.arc(32, 32, 16, 0, 7); c.fill();
  c.fillStyle = "#cfeefe";
  c.beginPath(); c.arc(32, 32, 8, 0, 7); c.fill();
  c.fillStyle = "#85C1E9";
  c.beginPath(); c.arc(32, 32, 4, 0, 7); c.fill();
});

// ARCH-263: Firewall Node — SPINNING / EXPOSED state. Tide has receded, the
// node's binary heart is visible and vulnerable to the Refactoring Hammer.
defSprite("firewall_spin", 64, 64, (c) => {
  c.fillStyle = "#0e2a44"; c.fillRect(2, 2, 60, 60);
  c.strokeStyle = OL; c.lineWidth = 3; c.strokeRect(2, 2, 60, 60);
  // binary scroll
  const rngSeed = mulberry(101);
  c.font = "bold 6px monospace"; c.textBaseline = "top";
  for (let y = 6; y < 60; y += 7) {
    for (let x = 5; x < 60; x += 5) {
      const v = rngSeed();
      c.fillStyle = v > 0.5 ? "#5db5e0" : "#3a78a8";
      c.fillText(v > 0.5 ? "1" : "0", x, y);
    }
  }
  // pulsing exposed core
  c.fillStyle = "rgba(133,193,233,0.7)";
  c.beginPath(); c.arc(32, 32, 18, 0, 7); c.fill();
  c.fillStyle = "#e8f8ff";
  c.beginPath(); c.arc(32, 32, 10, 0, 7); c.fill();
  c.fillStyle = "#85C1E9";
  c.beginPath(); c.arc(32, 32, 5, 0, 7); c.fill();
  // crosshair indicating vulnerability
  c.strokeStyle = "rgba(232,76,60,0.7)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(32, 6); c.lineTo(32, 14); c.stroke();
  c.beginPath(); c.moveTo(32, 50); c.lineTo(32, 58); c.stroke();
  c.beginPath(); c.moveTo(6, 32); c.lineTo(14, 32); c.stroke();
  c.beginPath(); c.moveTo(50, 32); c.lineTo(58, 32); c.stroke();
});

// ARCH-264: DDoS wave — a rolling carpet of green 1s and 0s drawn at the
// bottom of the screen during flood phase. Baked once, tiled+animated via
// camera-x parallax + opacity sinewave in Layer 5 bg.onDraw.
defSprite("ddos_wave", 400, 60, (c) => {
  c.font = "bold 7px monospace"; c.textBaseline = "top";
  const rng = mulberry(73);
  for (let x = 0; x < 400; x += 6) {
    const waveH = 32 + Math.sin(x * 0.04) * 14;
    for (let y = 60 - waveH; y < 60; y += 7) {
      const v = rng();
      const intensity = (60 - y) / waveH;
      c.fillStyle = `rgba(58, 208, 122, ${0.25 + intensity * 0.65})`;
      c.fillText(v > 0.5 ? "1" : "0", x, y);
    }
  }
});

// ARCH-250: Cloud Zone Stalker — Layer 4 specialty enemy. Cyan cloud puff
// with three "lumps" and dark eyes. Visibility/immunity is driven at runtime
// via the cloud-zone touch tracker; the sprite itself just renders the cloud.
defSprite("cloudstalker", 36, 28, (c) => {
  c.lineWidth = 2; c.strokeStyle = OL;
  c.fillStyle = rgrad(c, 18, 16, 18, "#cfeefe", "#3a78a8");
  c.beginPath(); c.ellipse(18, 16, 16, 9, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = "#9fd0f0";
  c.beginPath(); c.arc(10, 10, 5, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(20, 7, 6, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(28, 11, 5, 0, 7); c.fill(); c.stroke();
  c.fillStyle = OL;
  c.beginPath(); c.arc(14, 14, 2, 0, 7); c.fill();
  c.beginPath(); c.arc(22, 14, 2, 0, 7); c.fill();
});

// ARCH-251: SaaS form — humanoid robot. Walks toward Archie and lunges. The
// "managed service that's not really managed" form.
defSprite("shape_saas", 56, 64, (c) => {
  c.lineWidth = 4; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 18, 30, "#aab0ba", "#5f6470");
  rr(c, 12, 18, 32, 30, 4); c.fill(); c.stroke();
  c.fillStyle = vgrad(c, 0, 2, 18, "#c8ced6", "#7a8088");
  rr(c, 16, 2, 24, 18, 4); c.fill(); c.stroke();
  c.fillStyle = "#ff5252";
  c.fillRect(20, 9, 4, 3);
  c.fillRect(32, 9, 4, 3);
  c.fillStyle = "#5f6470";
  rr(c, 2, 22, 12, 26, 4); c.fill(); c.stroke();
  rr(c, 42, 22, 12, 26, 4); c.fill(); c.stroke();
  rr(c, 16, 48, 10, 14, 3); c.fill(); c.stroke();
  rr(c, 30, 48, 10, 14, 3); c.fill(); c.stroke();
  c.fillStyle = "#3a3a44";
  rr(c, 22, 26, 12, 12, 2); c.fill();
  // Tiny "SaaS" stamp
  drawPixelText(c, "S", 26, 30, "#5fd0ff", 1);
});

// ARCH-252: PaaS form — stationary turret on a red base. Spawns Scope Creeps
// every couple of seconds. The "platform that owns you" form.
defSprite("shape_paas", 56, 50, (c) => {
  c.lineWidth = 4; c.strokeStyle = OL;
  c.fillStyle = vgrad(c, 0, 32, 18, "#d83a2a", "#8a1f12");
  rr(c, 4, 32, 48, 16, 3); c.fill(); c.stroke();
  c.fillStyle = "#7a7a88";
  rr(c, 10, 22, 36, 12, 2); c.fill(); c.stroke();
  c.fillStyle = vgrad(c, 0, 6, 18, "#aab0ba", "#5f6470");
  rr(c, 16, 6, 24, 18, 4); c.fill(); c.stroke();
  c.fillStyle = "#3a3a44";
  rr(c, 38, 12, 14, 6, 2); c.fill(); c.stroke();
  c.fillStyle = "#ff5252";
  c.beginPath(); c.arc(24, 14, 4, 0, 7); c.fill();
  c.strokeStyle = OL; c.stroke();
  c.fillStyle = OL;
  c.beginPath(); c.arc(24, 14, 1.5, 0, 7); c.fill();
  drawPixelText(c, "P", 12, 38, "#ffffff", 1);
});

// ARCH-226: Layer 3 "Sinking Legacy Schema" platform tile — mossy waterlogged
// plank for the Swamp of Duplication. Two horizontal plank-rows with moss
// patches, a wet-edge highlight, and cracks that read as decaying tables.
defSprite("schema", 48, 22, (c) => {
  c.fillStyle = "#0e1c14"; c.fillRect(0, 0, 48, 22);
  const W = "#4a6230", w = "#283418", hi = "#7a9050", moss = "#5a8030";
  // top plank
  c.fillStyle = W; c.fillRect(0, 2, 48, 7);
  c.fillStyle = hi; c.fillRect(0, 2, 48, 1);
  c.fillStyle = w; c.fillRect(0, 8, 48, 1);
  // bottom plank
  c.fillStyle = W; c.fillRect(0, 11, 48, 8);
  c.fillStyle = hi; c.fillRect(0, 11, 48, 1);
  c.fillStyle = w; c.fillRect(0, 18, 48, 1);
  // moss spots
  c.fillStyle = moss;
  c.fillRect(4, 3, 4, 2); c.fillRect(20, 12, 5, 2);
  c.fillRect(34, 4, 4, 2); c.fillRect(40, 15, 3, 2);
  c.fillRect(12, 14, 3, 2);
  // hairline cracks
  c.strokeStyle = "rgba(0,0,0,0.6)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(14, 2); c.lineTo(16, 8); c.stroke();
  c.beginPath(); c.moveTo(30, 11); c.lineTo(28, 18); c.stroke();
  c.beginPath(); c.moveTo(40, 3); c.lineTo(42, 8); c.stroke();
  // dripping water marks
  c.fillStyle = "rgba(140, 180, 200, 0.4)";
  c.fillRect(6, 9, 1, 2); c.fillRect(24, 9, 1, 1); c.fillRect(36, 9, 1, 2);
  // outline
  c.strokeStyle = "#0a0a0a"; c.lineWidth = 2;
  c.strokeRect(1, 1, 46, 20);
});

// ARCH-204: Pixelated vignette — baked at 1/4 resolution (200x150) so the
// radial darkening reads as chunky bands instead of a smooth painterly blur.
// Drawn at scale(4) over the full 800x600 frame, sampled nearest-neighbor.
// ARCH-306: Horizon glow — Future-Healer-style atmospheric haze. A vertical
// white-alpha gradient that's tinted per layer via drawSprite's color param.
// Brightest at the floor, fades to transparent over ~200 px upward.
defSpriteRaw("horizon_glow", 200, 200, (c) => {
  const g = c.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.4, "rgba(255,255,255,0.18)");
  g.addColorStop(0.85, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0.85)");
  c.fillStyle = g; c.fillRect(0, 0, 200, 200);
});

// ARCH-307: City lights tile — a 200×100 sprite filled with scattered bright
// pixel dots (yellow/orange) on a transparent background. Tiles infinitely
// at any parallax depth to fake the distant lit-window glow you see in
// Future Healer's cyberpunk skyline screenshots.
defSpriteRaw("city_lights", 200, 100, (c) => {
  const rng = mulberry(421);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rng() * 200);
    const y = Math.floor(rng() * 100);
    const sz = rng() > 0.7 ? 3 : 2;
    const hue = rng();
    const col = hue > 0.7 ? "rgba(255, 200, 100, 0.95)"
              : hue > 0.35 ? "rgba(255, 240, 180, 0.85)"
              : "rgba(255, 170, 80, 0.9)";
    c.fillStyle = col;
    c.fillRect(x, y, sz, sz);
  }
});

defSpriteRaw("vignette", 200, 150, (c) => {
  c.imageSmoothingEnabled = false;
  const g = c.createRadialGradient(100, 62, 28, 100, 77, 135);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.68, "rgba(0,0,0,0.12)");
  g.addColorStop(1, "rgba(8,5,12,0.62)");
  c.fillStyle = g; c.fillRect(0, 0, 200, 150);
  const g2 = c.createRadialGradient(100, -10, 8, 100, -10, 110);
  g2.addColorStop(0, "rgba(255,232,170,0.22)");
  g2.addColorStop(1, "rgba(255,232,170,0)");
  c.fillStyle = g2; c.fillRect(0, 0, 200, 150);
});

// -----------------------------------------------------------------------------
// ARCH-350: Pre-level dossier — one briefing entry per layer.
// Each entry explains the architectural context, lists active threats,
// available supplies, and reveals the boss intel.
// -----------------------------------------------------------------------------
const BRIEFINGS: {
  lore:    string;
  threats: string[];
  supplies: string[];
  bossIntel: string;
}[] = [
  // Layer 1 — The Agile Trenches
  {
    lore: `The sprint never ends. Post-its have replaced documentation.\nEveryone calls themselves a "product owner" — nobody ships.\nScope Creep colonises every corner while standups stretch\ninto existential crisis. Archie must survive before the\nretro demands a root-cause analysis of his existence.`,
    threats: [
      "Scope Creep  — green blobs that absorb unfinished tickets",
      "Release Demon — touches you, inverts your controls for 5s",
      "Misplacement Traps — corrupted folders on the floor (damage)",
      "Feature Tickets — projectiles dropped by the boss",
    ],
    supplies: [
      "Coffee Bean     (+5 Caffeine Points — the only real currency)",
      "CEO Approved Shield  (brief invulnerability window)",
      "Double Espresso (1.8× speed, locks Cognitive Load at 100%)",
    ],
    bossIntel: `THE PRODUCT DEFINITION CTHULHU  [26 HP]\nFloats unreachable. Drops Feature Tickets. Sweeps the arena.\nSLAM phase: shakes then plunges to the ground.\nTHAT is your window — hit it. Hard. With anything.`,
  },
  // Layer 2 — Solutions Architecture
  {
    lore: `Where PowerPoints go to die and diagrams achieve sentience.\nEvery solution spawns three new problems. The AWS spider\nhas nested its infra inside a monolith that predates the\nInternet. Nobody knows what it does. Nobody dares touch it.\nYou have been assigned the ticket anyway.`,
    threats: [
      "AWS Spider Miniboss — webs immobilise Archie, charges hard",
      "Phantom Architect   — invisible until it's on top of you",
      "Password Stream     — red credential columns, instant damage",
      "GDPR Leech          — drains half a coffee on contact",
    ],
    supplies: [
      "Coffee Bean     (+5 CP — ground floor currency)",
      "CEO Approved Shield  (invulnerability — use before the web)",
      "Double Espresso (outrun the spider's charge)",
    ],
    bossIntel: `THE LEGACY MONOLITH MONSTER  [56 HP]\n⚠ HAMMER ONLY — Blueprint and Wand do nothing.\nRains debris, shoots spreads, summons phantoms.\nStay mobile. Upgrade to Hammer before the gate.`,
  },
  // Layer 3 — The Swamp of Duplication
  {
    lore: `Copy-paste architecture gone feral. Every class exists in\ntriplicate; every service is a fork of a fork of a fork.\nThe swamp absorbs everything — effort, deadlines, hope.\nThe GDPR Leech is a compliance team that was never funded.\nMigration blocks have been "in progress" since 2019.`,
    threats: [
      "Code Ooze      — multiplies when hit by the wrong weapon",
      "GDPR Leech     — attaches and drains coffee over time",
      "Migration Puzzle Blocks — must be broken in the right order",
      "Misplacement Traps — angry folders, same as Layer 1",
    ],
    supplies: [
      "Coffee Bean     (+5 CP — scarcer here, ration carefully)",
      "CEO Approved Shield  (needed against the Leech swarms)",
      "Double Espresso (break migration blocks at full speed)",
    ],
    bossIntel: `MINI-BOSS: THE KAFKA ROACH  [22 HP]\nLeft head (Sync) fires every 1s. Right head (Async) dumps 5 shots at past positions every 4s.\nUse the WAND to stun the Async head and clear its queue.\n─────────────────────────────────────\nFINAL BOSS: THE MONOLITHIC SCHEMA OOZ  [44 HP → splits]\nIMMUNE except during EXHAUSTED (3s after LEAK wave). Hammer only.\nSplits into 2 medium oozes at 50% HP — 1.5s out of phase.`,
  },
  // Layer 4 — Hardware Hell
  {
    lore: `The cloud migration proposal was rejected for the third year.\nEverything is on-prem, overheating, and underfunded.\nPoC monsters roam the server room — each one a project\nthat proved the concept but never got productionised.\nCloud Zones exist. Entering one without prep hurts.`,
    threats: [
      "PoC Monster      — proof-of-concept creature, fast and angry",
      "Cloud Stalker    — immune outside Cloud Zones",
      "Shapeshifter     — invulnerable during 1s transform windows",
      "Cloud Zone tiles — standing outside them drains your coffee",
    ],
    supplies: [
      "Coffee Bean     (+5 CP — prioritise before Cloud Zones)",
      "CEO Approved Shield  (survive the Shapeshifter burst)",
      "Double Espresso (cross Cloud Zones before timer triggers)",
    ],
    bossIntel: `THE SAAS / PAAS SHAPESHIFTER  [44 HP]\nShoots 3-way spread. Summons PoC minions.\nInvulnerable for 1s on every transformation — wait it out.\nBlueprint Barrier is safest: place it, back off, repeat.`,
  },
  // Layer 5 — The Vulnerability Vaults
  {
    lore: `847 critical CVEs. Zero patches. Credentials hard-coded in\nthe repo since 2017 — it's fine, it's a private repo.\nThe pen-test report sits unread in a Confluence page that\nno one has permission to edit. The DDoS tide rolls in\nevery 15 seconds regardless of SLA commitments.`,
    threats: [
      "Credentials Villain — spawns password streams on contact",
      "DDoS Tide       — periodic flood, push through or die",
      "Firewall Nodes  — Hammer-only destruction, Recede phase only",
      "Hash Stream     — green matrix columns, instant damage",
    ],
    supplies: [
      "Coffee Bean     (+5 CP — Firewall destruction grants +25)",
      "CEO Approved Shield  (ride out the DDoS Tide safely)",
      "Double Espresso (sprint through Hash Streams)",
    ],
    bossIntel: `THE EXPOSED CREDENTIALS KINGPIN  [46 HP]\nAimshots track Archie precisely. Fires 3-way spreads.\nSummons Villain minions mid-fight.\nStay at max horizontal range — punish with Wand AOE.`,
  },
  // Layer 6 — The Cyborg Sanctum
  {
    lore: `AI has infiltrated the architecture layer. The Gluttons\nconsume every remaining compute budget. The Attention\nSeeker trained on engagement metrics and now fires\nprojectiles labelled "DISRUPT". The Sagemaker Sad Monster\nwas deprecated mid-project. Nobody told it.`,
    threats: [
      "Glutton         — compute hog, large hitbox, relentless",
      "Sagemaker Sad Monster — slow but fires grief-projectiles",
      "Attention Seeker — ranged, fires Disrupt shots in arcs",
      "Misplacement Traps — now the whole floor is a ticket",
    ],
    supplies: [
      "Coffee Bean     (+5 CP — Gluttons drop extras on death)",
      "CEO Approved Shield  (absorb one Attention Seeker volley)",
      "Double Espresso (dodge the Sad Monster grief-spam)",
    ],
    bossIntel: `THE CLAWD n8n PAPERCLIP HYPE GUY  [48 HP]\nRains debris constantly. Charges across the arena.\nSummons Gluttons every 4s. High HP — bring full coffee.\nHammer Overload clears summons AND dents the boss.`,
  },
  // Layer 7 — The Final Framework
  {
    lore: `TOGAF. The Architecture Development Method. Eight phases.\nSeven layers. One framework nobody has ever shipped intact.\nEvery previous mistake in this descent feeds the monster\nbefore you. It wears the faces of all the bosses you've\nalready beaten. There is no ticket for this. Only the patch.`,
    threats: [
      "All previous enemies — every layer's mob roster returns",
      "ADM Platforms A→H — must be landed in order to expose boss",
      "Wrong ADM order  — boss heals and resets the cycle",
      "Everything you have survived now attacks at once",
    ],
    supplies: [
      "Coffee Bean      (+5 CP — maximum stock before engaging)",
      "CEO Approved Shield  (mandatory — boss hits hard)",
      "Double Espresso  (required for ADM platform timing)",
    ],
    bossIntel: `THE TOGAF ADM FRAMEWORK MONSTER  [64 HP]\nInvulnerable until you land platforms A → B → C → D → E → F → G → H\nin sequence. Wrong order resets the cycle and partially heals.\nOn exposure: 7 mutation forms. CTO Blessing bypasses all gates.\nThis is the final ticket. Close it.`,
  },
];

// -----------------------------------------------------------------------------
// ARCH-42: The 7 Layers of Architecture Hell — now discrete, boss-capped levels.
// -----------------------------------------------------------------------------
type EnemyKind = "scopecreep" | "cockroach" | "ooze" | "poc" | "villain" | "glutton";
const SEGMENTS: {
  name: string;
  sky: [number, number, number];
  accent: [number, number, number];
  enemy: EnemyKind;
}[] = [
  { name: "LAYER 1: THE AGILE TRENCHES", sky: [34, 30, 52], accent: [255, 230, 120], enemy: "scopecreep" },
  { name: "LAYER 2: SOLUTIONS ARCHITECTURE", sky: [12, 22, 60], accent: [120, 200, 255], enemy: "cockroach" },
  { name: "LAYER 3: THE SWAMP OF DUPLICATION", sky: [22, 42, 30], accent: [150, 230, 130], enemy: "ooze" },
  { name: "LAYER 4: HARDWARE HELL", sky: [44, 28, 28], accent: [255, 140, 90], enemy: "poc" },
  { name: "LAYER 5: THE VULNERABILITY VAULTS", sky: [16, 16, 22], accent: [255, 80, 80], enemy: "villain" },
  { name: "LAYER 6: THE CYBORG SANCTUM", sky: [40, 46, 60], accent: [180, 230, 255], enemy: "glutton" },
  { name: "LAYER 7: THE FINAL FRAMEWORK", sky: [20, 12, 30], accent: [200, 120, 255], enemy: "scopecreep" },
];

// ARCH-125: one boss per Layer. `attacks` are composed from a generic toolkit.
type Attack = "shoot3" | "aimshot" | "summon" | "rain" | "charge";
const BOSSES: {
  name: string; sprite: string; hp: number; mult: number;
  needsHammer?: boolean; attacks: Attack[];
}[] = [
  { name: "THE PRODUCT DEFINITION CTHULHU", sprite: "boss1", hp: 26, mult: 1.05, attacks: ["summon", "aimshot"] },
  { name: "THE LEGACY MONOLITH MONSTER", sprite: "monolith", hp: 56, mult: 1.0, needsHammer: true, attacks: ["rain", "shoot3", "summon"] },
  { name: "THE MONOLITHIC SCHEMA OOZE", sprite: "boss_ooze_large", hp: 44, mult: 1.0, attacks: ["charge"] },
  { name: "THE SAAS / PAAS SHAPESHIFTER", sprite: "boss4", hp: 44, mult: 1.0, attacks: ["shoot3", "summon"] },
  { name: "THE EXPOSED CREDENTIALS KINGPIN", sprite: "boss5", hp: 46, mult: 1.0, attacks: ["aimshot", "shoot3"] },
  { name: "THE CLAWD n8n PAPERCLIP HYPE GUY", sprite: "boss6", hp: 48, mult: 1.0, attacks: ["rain", "charge", "summon"] },
  { name: "THE TOGAF ADM FRAMEWORK MONSTER", sprite: "boss", hp: 64, mult: 1.05, attacks: ["shoot3", "summon", "charge"] },
];

const GROUND_H = 60;
const MAX_HALVES = 10;

// ARCH-287: ADM (Architecture Development Method) phases — Layer 7's final
// boss cycle. The player must land on the 8 phase platforms in order A→H to
// briefly expose the TOGAF ADM Multi-Step Monster to damage. Wrong order
// resets the cycle and partially heals the boss.
const ADM_PHASES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ADM_COLORS: Array<[number, number, number]> = [
  [232, 76, 60],   // A — red
  [180, 100, 60],  // B — brown
  [220, 130, 60],  // C — orange
  [220, 200, 60],  // D — yellow
  [60, 200, 100],  // E — green
  [60, 180, 200],  // F — teal
  [80, 130, 220],  // G — blue
  [180, 100, 220], // H — purple
];
// ARCH-288: 7 boss-form sprites the Final Boss mutates through. Each form
// reuses an earlier-layer boss sprite, with TOGAF (`boss`) as the apex.
const FINAL_BOSS_FORMS = ["boss", "boss1", "monolith", "boss3", "boss4", "boss5", "boss6"];

// ARCH-43: cognitiveLoad component. THE damage stat. Build it; deal crits.
function cognitiveLoad() {
  return {
    id: "cognitiveLoad",
    cognitiveLoad: 0.5,
    locked: false,
    add(this: any) {
      this.onUpdate(() => {
        if (this.locked) { this.cognitiveLoad = 1.0; return; }
        this.cognitiveLoad = Math.max(0, this.cognitiveLoad - 0.035 * k.dt());
      });
    },
    buildLoad(this: any, amt: number) {
      if (this.locked) return;
      this.cognitiveLoad = Math.min(1, this.cognitiveLoad + amt);
    },
    dmgMult(this: any) {
      return 0.3 + this.cognitiveLoad * 1.2;
    },
  };
}

// ARCH-265: DDoS Tide cycle — drives Layer 5's Firewall Node vulnerability
// window. Flood for ~5s (Firewalls invulnerable, screen-bottom wave visible),
// then Recede for ~3s (Firewalls exposed, hammerable). Pure function of
// k.time() so no scene state is required.
const DDOS_CYCLE = 8;
const DDOS_FLOOD_END = 5;
function isDdosFlood() {
  return (k.time() % DDOS_CYCLE) < DDOS_FLOOD_END;
}
function ddosPhase() {
  // 0 = start of flood, 1 = end of cycle (just before next flood)
  return (k.time() % DDOS_CYCLE) / DDOS_CYCLE;
}

type WeaponKind = "melee" | "heavy" | "aoe";
const WEAPONS: { name: string; short: string; kind: WeaponKind; dmg: number }[] = [
  { name: "THE (INCOMPLETE) BLUEPRINT", short: "BLUEPRINT", kind: "melee", dmg: 3 },
  { name: "THE REFACTORING HAMMER", short: "HAMMER", kind: "heavy", dmg: 7 },
  { name: "THE ORCHESTRATOR WAND", short: "WAND", kind: "aoe", dmg: 2 },
];

// =============================================================================
// SCENE: level — one procedurally-built Layer, ending in a boss fight.
// =============================================================================
// ASSET-1138: Graphics department lost funding. Rendering SVGs directly from
// the terminal to save budget. Loaded AFTER all the canvas-baked sprites so
// the SVG versions WIN for any name collisions (currently just `blueprint`
// — the canvas-drawn cyan diagram gets replaced by this lean SVG schematic).
k.loadSprite("archie", archie_idle);
k.loadSprite("archie_run_a", archie_run_a);
k.loadSprite("archie_run_b", archie_run_b);
k.loadSprite("archie_jump", archie_jump_pose);
k.loadSprite("archie_fall", archie_fall_pose);
k.loadSprite("archie_drink", archie_drink_pose);
k.loadSprite("creep", scope_creep);
k.loadSprite("scopecreep", scope_creep); // override the canvas-baked one
k.loadSprite("blueprint", weapon_blueprint);
k.loadSprite("hammer", weapon_hammer); // override canvas hammer
k.loadSprite("bean", coffee_bean); // override pixel bean (kills the 3-frame cycle)
k.loadSprite("bean1", coffee_bean); // alias so any leftover cycle refs stay valid
k.loadSprite("bean2", coffee_bean);
k.loadSprite("ground", ground_tile);
k.loadSprite("groundtile", ground_tile);
k.loadSprite("cup_full", coffee_cup);   // SVG cup replaces canvas cup_full
k.loadSprite("cup_half", coffee_cup);   // same visual; state shown via opacity
k.loadSprite("cup_empty", coffee_cup);
k.loadSprite("wand", weapon_wand);
k.loadSprite("misplacement", trap_misplacement);
k.loadSprite("armor", item_shield); // override blurry canvas arc shield
k.loadSprite("boss_cthulhu_idle", boss_cthulhu_idle);
k.loadSprite("boss_cthulhu_stun", boss_cthulhu_stun);
k.loadSprite("ticket", projectile_ticket);
k.loadSprite("boss_kafka_roach", boss_kafka_roach);
k.loadSprite("boss_ooze_large", boss_ooze_large);
k.loadSprite("boss_ooze_medium", boss_ooze_medium);
k.loadSprite("projectile_sync", projectile_sync);
k.loadSprite("hazard_data_block", hazard_data_block);
k.loadSprite("hazard_data_wave", hazard_data_wave);

k.scene("level", (data: { idx: number; score: number }) => {
  const idx = data.idx;
  const theme = SEGMENTS[idx];
  const bossCfg = BOSSES[idx];
  // ARCH-126: reseed the RNG every entry so no two layouts are ever alike.
  k.randSeed(Math.floor(Date.now()) + idx * 7919);
  k.setGravity(1900);

  // ARCH-401: Difficulty modifiers applied at scene boot.
  // ESPD  — enemy movement speed multiplier (×1.5 in Super Archie).
  // EHMULT — enemy hit-point multiplier (×2 in Super Archie).
  const ESPD   = difficulty === "super" ? 1.5 : 1.0;
  const EHMULT = difficulty === "super" ? 2   : 1;
  const eHealth = (n: number) => k.health(Math.round(n * EHMULT));

  let coffeeHalves = difficulty === "super" ? Math.ceil(MAX_HALVES / 2) : MAX_HALVES;
  let score = data.score;
  let weaponIdx = 0;
  let hammerBusy = false;
  let wandTimer = 0;
  let ghostTimer = 0;
  let bossPhase = false;
  let bossDefeated = false;
  let awsSpiderSpawned = false;
  let kafkaRoachSpawned = false;
  // ARCH-253: Layer-4 specific state. `cloudZoneTouchT` is the last time
  // Archie was overlapping a Cloud Zone (updated every frame via
  // onCollideUpdate); `shapeshifterSpawned` gates the mid-level miniboss.
  let cloudZoneTouchT = -10;
  let shapeshifterSpawned = false;
  // ARCH-290: Layer 7 ADM tracking. `admStep` is the next expected platform
  // index (0 = A, 7 = H). `admVulnerableUntil` = boss is damage-able until
  // this timestamp. `admJustExposed` flashes the "VULNERABLE" banner briefly.
  let admStep = 0;
  let admVulnerableUntil = 0;
  // ARCH-182: Caffeine Points — per-level currency. Beans give +5 CP.
  // 50 CP buys the Funding key from the Layer 1 vendor.
  let caffeinePoints = 0;
  let lastVendorPopup = 0;
  let bossRef: any = null;

  const GROUND_Y = k.height() - GROUND_H;
  // ARCH-127: procedural level length — varies per run, generously long now
  // so the enemy budget actually has room to breathe.
  const LW = Math.round(k.rand(3400, 4400));
  const bossGateX = LW - 760;
  const spawnPos = k.vec2(90, 200);

  // ---------------------------------------------------------------------------
  // ARCH-117: layered parallax city.
  // ---------------------------------------------------------------------------
  const bg = k.add([k.fixed(), k.z(-100)]);
  function buildingRow(camX: number, par: number, baseY: number, sc: number, tint: any) {
    const W = k.width();
    const SP = 232;
    const scroll = camX * par;
    const base = Math.floor(scroll / SP);
    const off = scroll - base * SP;
    for (let i = -1; i < W / SP + 3; i++) {
      const name = BUILDINGS[Math.abs(((base + i) * 2654435761) >>> 0) % BUILDINGS.length];
      k.drawSprite({
        sprite: name, pos: k.vec2(i * SP - off, baseY), anchor: "botleft",
        scale: k.vec2(sc),
        color: tint,
      });
    }
  }
  bg.onDraw(() => {
    const camX = k.camPos().x;
    const W = k.width(), H = k.height();

    // ARCH-176: LAYER 1 — "The Agile Trenches" indoor backdrop. Pure black
    // void crowded with floating architecture diagrams and burning legacy
    // DS blocks; no skyline, no buildings, no fresh air.
    if (idx === 0) {
      k.drawRect({ width: W, height: H, color: k.rgb(0, 0, 0) });

      // ARCH-308: Future-Healer-style city-lights backdrop + warm horizon
      // glow. Distant lit windows scattered at deep parallax give the
      // "corporate dystopia outside the window" feel, then a warm orange
      // sunset glow rises from the floor for atmospheric depth.
      {
        const par = 0.08, SP = 200;
        const scroll = camX * par;
        const off = (scroll % SP + SP) % SP;
        for (let i = -1; i < W / SP + 2; i++) {
          k.drawSprite({
            sprite: "city_lights",
            pos: k.vec2(i * SP - off, GROUND_Y - 120),
            opacity: 0.55,
          });
        }
      }
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(230, 110, 70),
        opacity: 0.42,
      });

      // floating architecture diagrams (parallax 0.25)
      {
        const par = 0.25, SP = 360;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 30 + (Math.abs(absIdx * 73) % 180);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny), opacity: 0.85,
          });
        }
      }

      // floating DS micro-blocks with embers (parallax 0.5)
      {
        const par = 0.5, SP = 240;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          if ((absIdx & 3) !== 0) continue; // sparse
          const ny = 220 + (Math.abs(absIdx * 113) % 100);
          k.drawSprite({
            sprite: "dsfloating",
            pos: k.vec2(i * SP - off, ny),
            scale: k.vec2(0.8 + ((absIdx & 1) * 0.4)),
          });
        }
      }

      // contact shadow + ground tiles (parallax 1.0)
      k.drawRect({ pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16, color: k.rgb(0, 0, 0), opacity: 0.5 });
      const startX = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({ sprite: "groundtile", pos: k.vec2(gx - camX + W / 2, GROUND_Y), scale: k.vec2(2) });
      }

      // floor JRA-### labels + occasional "db" tags (parallax 1.0)
      const labelSp = 200;
      const startLX = Math.floor((camX - W / 2) / labelSp) * labelSp;
      for (let lx = startLX; lx < camX + W / 2 + labelSp; lx += labelSp) {
        const li = (lx / labelSp) | 0;
        const label = li % 3 === 0 ? "JRA-456" : "JRA-123";
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: k.rgb(34, 153, 84),
        });
        if (li % 5 === 2) {
          k.drawSprite({
            sprite: "dbtag",
            pos: k.vec2(lx - camX + W / 2 + 80, GROUND_Y + 28),
          });
        }
      }
      return;
    }

    // ARCH-223: LAYER 2 — "DDD Ether Maze" backdrop. Dark-navy void with the
    // slowly-rotating ether vortex centered on the screen, cyan-tinted UML
    // diagrams floating at parallax, and mixed-color ticket labels on the
    // floor. No skyline — DDD lives in the abstract.
    if (idx === 1) {
      k.drawRect({ width: W, height: H, color: k.rgb(8, 18, 40) });
      k.drawSprite({
        sprite: "vortex",
        pos: k.vec2(W / 2, H / 2),
        anchor: "center",
        scale: k.vec2(1),
        angle: k.time() * 6,
      });
      // ARCH-309: cyan horizon glow + faint distant lights for atmospheric depth.
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(80, 150, 220),
        opacity: 0.40,
      });
      // Floating diagrams, tinted cyan, parallax 0.22
      {
        const par = 0.22, SP = 340;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 30 + (Math.abs(absIdx * 73) % 220);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny),
            opacity: 0.75,
            color: k.rgb(140, 190, 230),
          });
        }
      }
      // Contact shadow + tinted ground tiles
      k.drawRect({ pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16, color: k.rgb(0, 0, 0), opacity: 0.4 });
      const startX2 = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX2; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({
          sprite: "groundtile",
          pos: k.vec2(gx - camX + W / 2, GROUND_Y),
          scale: k.vec2(2),
          color: k.rgb(120, 150, 200),
        });
      }
      // Mixed-color floor labels: cyan / red / green per the mockup
      const labelSp2 = 200;
      const startLX2 = Math.floor((camX - W / 2) / labelSp2) * labelSp2;
      for (let lx = startLX2; lx < camX + W / 2 + labelSp2; lx += labelSp2) {
        const li = (lx / labelSp2) | 0;
        const which = ((li % 3) + 3) % 3;
        const label =
          which === 0 ? "JRA-123" : which === 1 ? "TKT-123" : "JRA-456";
        const col =
          which === 0 ? k.rgb(120, 200, 255)
            : which === 1 ? k.rgb(150, 220, 230)
              : k.rgb(232, 76, 60);
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: col,
        });
      }
      return;
    }

    // ARCH-227 / ARCH-231: LAYER 3 — "Swamp of Duplication" per the design
    // reference. Black void backdrop with gray UML diagrams floating overhead
    // (same as Layer 1's "Agile Trenches" feel), polluted dark-purple ground,
    // and red JIRA-### labels scattered across the floor — the visual signal
    // that this layer is drowning in mismanaged data.
    if (idx === 2) {
      k.drawRect({ width: W, height: H, color: k.rgb(0, 0, 0) });

      // ARCH-310: muddy amber/green horizon glow — toxic swamp sunset.
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(180, 130, 70),
        opacity: 0.38,
      });

      // Floating UML diagrams (parallax 0.22) — neutral gray, the LEGACY
      // SCHEMAS that everyone has been migrating "for the last 3 quarters".
      {
        const par = 0.22, SP = 340;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 20 + (Math.abs(absIdx * 73) % 200);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny),
            opacity: 0.75,
          });
        }
      }

      // contact shadow + purple-tinted ground tiles (data pollution)
      k.drawRect({
        pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16,
        color: k.rgb(0, 0, 0), opacity: 0.55,
      });
      const startX3 = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX3; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({
          sprite: "groundtile",
          pos: k.vec2(gx - camX + W / 2, GROUND_Y),
          scale: k.vec2(2),
          color: k.rgb(140, 100, 130),
        });
      }

      // RED JIRA-### floor labels — the unmerged tickets piling up
      const labelSp3 = 200;
      const startLX3 = Math.floor((camX - W / 2) / labelSp3) * labelSp3;
      for (let lx = startLX3; lx < camX + W / 2 + labelSp3; lx += labelSp3) {
        const li = (lx / labelSp3) | 0;
        const label = li % 2 === 0 ? "JIRA-123" : "JRA-123";
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: k.rgb(220, 60, 60),
        });
      }
      return;
    }

    // ARCH-249: LAYER 4 — "Hardware Hell" backdrop. Industrial dark gray
    // base, floating UML diagrams labeled with infrastructure pathologies
    // (CIRCULAR DEPENDENCY, ORPHANED SERVICE, UNDEFINED SCHEMA, MONOLITHIC
    // CHOKEPOINT), mid-layer server racks at parallax, ambient spinning
    // cooling fans at floor level, red JIRA floor stamps.
    if (idx === 3) {
      k.drawRect({ width: W, height: H, color: k.rgb(20, 25, 30) });

      // ARCH-311: hot red horizon glow + distant lit windows — server racks
      // glowing from internal heat, datacenter at sunset.
      {
        const par = 0.10, SP = 200;
        const scroll = camX * par;
        const off = (scroll % SP + SP) % SP;
        for (let i = -1; i < W / SP + 2; i++) {
          k.drawSprite({
            sprite: "city_lights",
            pos: k.vec2(i * SP - off, GROUND_Y - 140),
            opacity: 0.40,
            color: k.rgb(255, 180, 100),
          });
        }
      }
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(220, 90, 50),
        opacity: 0.50,
      });

      // Floating UML diagrams + label text at parallax 0.22
      const INFRA_LABELS = [
        "CIRCULAR DEPENDENCY",
        "ORPHANED SERVICE",
        "UNDEFINED SCHEMA",
        "MONOLITHIC CHOKEPOINT",
      ];
      {
        const par = 0.22, SP = 360;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 18 + (Math.abs(absIdx * 73) % 180);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny),
            opacity: 0.75,
            color: k.rgb(190, 210, 220),
          });
          const labelIdx = Math.abs((absIdx * 37) >>> 0) % INFRA_LABELS.length;
          k.drawText({
            text: INFRA_LABELS[labelIdx], size: 9,
            pos: k.vec2(i * SP - off + 100, ny - 10),
            anchor: "center",
            color: k.rgb(180, 200, 220),
            outline: { width: 2, color: k.rgb(16, 16, 24) },
          });
        }
      }

      // Mid-layer server racks at parallax 0.45 (every other slot)
      {
        const par = 0.45, SP = 200;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          if ((absIdx & 1) !== 0) continue;
          k.drawSprite({
            sprite: "serverrack",
            pos: k.vec2(i * SP - off, GROUND_Y - 96),
            scale: k.vec2(1.5),
          });
        }
      }

      // Contact shadow + cool-gray-tinted ground tiles (industrial concrete)
      k.drawRect({
        pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16,
        color: k.rgb(0, 0, 0), opacity: 0.55,
      });
      const startX4 = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX4; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({
          sprite: "groundtile",
          pos: k.vec2(gx - camX + W / 2, GROUND_Y),
          scale: k.vec2(2),
          color: k.rgb(110, 130, 130),
        });
      }

      // Spinning cooling fans at floor level (parallax 1.0)
      const fanSp = 220;
      const startFx = Math.floor((camX - W / 2) / fanSp) * fanSp;
      for (let fx = startFx; fx < camX + W / 2 + fanSp; fx += fanSp) {
        k.drawSprite({
          sprite: "coolfan",
          pos: k.vec2(fx - camX + W / 2 + 50, GROUND_Y + 14),
          anchor: "center",
          scale: k.vec2(1.4),
          angle: k.time() * 180,
        });
      }

      // Red JIRA floor labels (lots of open tickets, naturally)
      const labelSp4 = 200;
      const startLX4 = Math.floor((camX - W / 2) / labelSp4) * labelSp4;
      for (let lx = startLX4; lx < camX + W / 2 + labelSp4; lx += labelSp4) {
        const li = (lx / labelSp4) | 0;
        const label = li % 3 === 0 ? "JRA-456" : "JIRA-123";
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: k.rgb(220, 60, 60),
        });
      }
      return;
    }

    // ARCH-266: LAYER 5 — "Vulnerability Vaults" backdrop. Dark steel grid,
    // labeled UML diagrams, server racks at mid-parallax, ambient red
    // SECURITY LASER sweeps, faint green security mesh, plus the DDoS wave
    // at the floor during flood phase.
    if (idx === 4) {
      k.drawRect({ width: W, height: H, color: k.rgb(8, 14, 12) });

      // ARCH-312: green Matrix horizon glow — the security console terminal feel.
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(60, 200, 100),
        opacity: 0.35,
      });

      // ARCH-275: Matrix-rain background — dozens of falling 1/0/hex columns
      // scrolling vertically at varying speeds and parallax. Pure decoration.
      {
        const colSp = 18;
        const offX = (camX * 0.3) % colSp;
        const chars = ["1", "0", "1", "0", "F", "A", "E", "C"];
        for (let x = -offX; x < W + colSp; x += colSp) {
          const colSeed = Math.floor((x + camX * 0.3) / colSp);
          const speed = 70 + (Math.abs(colSeed * 17) % 90);
          const baseOff = (k.time() * speed + Math.abs(colSeed * 37) % 240) % (H + 140);
          for (let i = 0; i < 5; i++) {
            const yy = baseOff - i * 16;
            if (yy < -16 || yy > H) continue;
            const cidx = (Math.abs(colSeed * 13) + i + Math.floor(k.time() * 4)) % chars.length;
            k.drawText({
              text: chars[cidx], size: 10,
              pos: k.vec2(x, yy),
              color: i === 0 ? k.rgb(200, 255, 215) : k.rgb(40, 200, 100),
              opacity: 0.32 * (1 - i / 6),
            });
          }
        }
      }

      // Labeled UML diagrams (same set as Layer 4)
      const INFRA_LABELS = [
        "CIRCULAR DEPENDENCY",
        "ORPHANED SERVICE",
        "UNDEFINED SCHEMA",
        "MONOLITHIC CHOKEPOINT",
      ];
      {
        const par = 0.22, SP = 360;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 18 + (Math.abs(absIdx * 73) % 180);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny),
            opacity: 0.75,
            color: k.rgb(190, 210, 230),
          });
          const labelIdx = Math.abs((absIdx * 37) >>> 0) % INFRA_LABELS.length;
          k.drawText({
            text: INFRA_LABELS[labelIdx], size: 9,
            pos: k.vec2(i * SP - off + 100, ny - 10),
            anchor: "center",
            color: k.rgb(180, 200, 220),
            outline: { width: 2, color: k.rgb(16, 16, 24) },
          });
        }
      }

      // Server racks at parallax 0.45 (every other slot)
      {
        const par = 0.45, SP = 200;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          if ((absIdx & 1) !== 0) continue;
          k.drawSprite({
            sprite: "serverrack",
            pos: k.vec2(i * SP - off, GROUND_Y - 96),
            scale: k.vec2(1.5),
          });
        }
      }

      // Faint green security mesh — vertical scanlines drifting slowly
      {
        const gridSp = 80;
        const offX = (camX * 0.4) % gridSp;
        for (let x = -offX; x < W; x += gridSp) {
          k.drawLine({
            p1: k.vec2(x, 80), p2: k.vec2(x, GROUND_Y),
            color: k.rgb(58, 208, 122), width: 1, opacity: 0.16,
          });
        }
        for (let y = 80; y < GROUND_Y; y += gridSp) {
          k.drawLine({
            p1: k.vec2(0, y), p2: k.vec2(W, y),
            color: k.rgb(58, 208, 122), width: 1, opacity: 0.12,
          });
        }
      }

      // Sweeping red SECURITY LASERS — 4 beams rotating at different phases
      {
        const cx = W / 2, cy = GROUND_Y - 200;
        for (let i = 0; i < 4; i++) {
          const t = k.time() * 0.6 + (i * Math.PI) / 2;
          const len = 320;
          k.drawLine({
            p1: k.vec2(cx + Math.cos(t) * 50, cy + Math.sin(t) * 30),
            p2: k.vec2(cx + Math.cos(t) * len, cy + Math.sin(t) * (len * 0.6)),
            color: k.rgb(232, 76, 60), width: 2, opacity: 0.45,
          });
        }
      }

      // Contact shadow + cool-gray-tinted ground tiles
      k.drawRect({
        pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16,
        color: k.rgb(0, 0, 0), opacity: 0.55,
      });
      const startX5 = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX5; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({
          sprite: "groundtile",
          pos: k.vec2(gx - camX + W / 2, GROUND_Y),
          scale: k.vec2(2),
          color: k.rgb(95, 110, 130),
        });
      }

      // DDoS wave at the floor during flood phase. Opacity ramps up at the
      // start of the flood and ramps down before recede.
      if (isDdosFlood()) {
        const p = (k.time() % DDOS_CYCLE) / DDOS_FLOOD_END; // 0..1 during flood
        const op = Math.sin(p * Math.PI) * 0.85;
        const waveSp = 400;
        const offWave = (camX * 0.5) % waveSp;
        for (let x = -offWave; x < W; x += waveSp) {
          k.drawSprite({
            sprite: "ddos_wave",
            pos: k.vec2(x, GROUND_Y - 28),
            opacity: op,
          });
        }
      }

      // Red JIRA floor stamps
      const labelSp5 = 200;
      const startLX5 = Math.floor((camX - W / 2) / labelSp5) * labelSp5;
      for (let lx = startLX5; lx < camX + W / 2 + labelSp5; lx += labelSp5) {
        const li = (lx / labelSp5) | 0;
        const label = li % 3 === 0 ? "JRA-456" : "JIRA-123";
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: k.rgb(220, 60, 60),
        });
      }
      return;
    }

    // ARCH-278 / ARCH-282: LAYER 6 — "Cyborg Sanctum" per the design ref.
    // Near-black base, holographic neural-network panel up top with floating
    // security-threat labels (ZERO DAY EXPLOIT, UNSAFE ENCRYPTION, PRIVILEGE
    // ESCALATION, UNDEFINED POLICY), faint cyan circuit grid, glowing cyan
    // trapezoid-pattern floor tiles, AI/ML terminology stamps in cyan.
    if (idx === 5) {
      k.drawRect({ width: W, height: H, color: k.rgb(10, 14, 28) });

      // ARCH-313: bright cyan horizon glow — AI data-center luminance.
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(130, 200, 240),
        opacity: 0.40,
      });

      // Tiled holographic neural-network panels (parallax 0.16) up high
      {
        const par = 0.16, SP = 440;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 2; i++) {
          k.drawSprite({
            sprite: "neuralnet",
            pos: k.vec2(i * SP - off, 12),
            opacity: 0.55,
            color: k.rgb(160, 200, 240),
          });
        }
      }

      // Floating security-threat labels at parallax 0.18, in the upper band
      {
        const par = 0.18, SP = 280;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        const threats = [
          "ZERO DAY EXPLOIT",
          "UNSAFE ENCRYPTION",
          "PRIVILEGE ESCALATION",
          "UNDEFINED POLICY",
        ];
        for (let i = -1; i < W / SP + 2; i++) {
          const absIdx = base + i;
          const label = threats[Math.abs(absIdx * 37) % threats.length];
          const ty = 28 + (Math.abs(absIdx * 53) % 90);
          k.drawText({
            text: label, size: 10,
            pos: k.vec2(i * SP - off + 80, ty),
            anchor: "center",
            color: k.rgb(190, 210, 230),
            opacity: 0.7,
            outline: { width: 1, color: k.rgb(16, 16, 24) },
          });
        }
      }

      // Faint cyan circuit grid (vertical scanlines + sparse horizontals)
      {
        const gridSp = 60;
        const offX = (camX * 0.5) % gridSp;
        for (let x = -offX; x < W; x += gridSp) {
          k.drawLine({
            p1: k.vec2(x, 100), p2: k.vec2(x, GROUND_Y),
            color: k.rgb(133, 193, 233), width: 1, opacity: 0.10,
          });
        }
        for (let y = 130; y < GROUND_Y; y += gridSp) {
          k.drawLine({
            p1: k.vec2(0, y), p2: k.vec2(W, y),
            color: k.rgb(133, 193, 233), width: 1, opacity: 0.08,
          });
        }
      }

      // Tinted UML diagrams (white-cyan) drifting in the mid-band
      {
        const par = 0.35, SP = 360;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 130 + (Math.abs(absIdx * 73) % 140);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny),
            opacity: 0.65,
            color: k.rgb(210, 235, 255),
          });
        }
      }

      // Contact shadow + glowing CIRCUIT FLOOR tiles (replace groundtile)
      k.drawRect({
        pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16,
        color: k.rgb(0, 0, 0), opacity: 0.45,
      });
      const startX6 = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX6; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({
          sprite: "circuit_floor",
          pos: k.vec2(gx - camX + W / 2, GROUND_Y),
          scale: k.vec2(2),
        });
      }

      // AI/ML terminology floor stamps in cyan
      const labelSp6 = 200;
      const startLX6 = Math.floor((camX - W / 2) / labelSp6) * labelSp6;
      const labels6 = ["TOKEN-0xA1", "EMBED-D7", "LAYER-K", "ATTN-3"];
      for (let lx = startLX6; lx < camX + W / 2 + labelSp6; lx += labelSp6) {
        const li = (lx / labelSp6) | 0;
        const label = labels6[((li % labels6.length) + labels6.length) % labels6.length];
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: k.rgb(133, 193, 233),
        });
      }
      return;
    }

    // ARCH-289: LAYER 7 — "The Final Framework" cosmic horror backdrop.
    // Deep purple void, rotating cosmic vortex, drifting bureaucratic UML
    // diagrams + floating threat labels. The TOGAF ADM Framework is
    // mathematically a black hole.
    if (idx === 6) {
      k.drawRect({ width: W, height: H, color: k.rgb(12, 4, 20) });
      // Rotating cosmic vortex centered on screen (purple-tinted)
      k.drawSprite({
        sprite: "vortex",
        pos: k.vec2(W / 2, H / 2),
        anchor: "center",
        scale: k.vec2(1.4),
        angle: k.time() * 10,
        color: k.rgb(200, 120, 220),
      });
      // ARCH-314: cosmic purple/pink horizon glow — the void breathing.
      k.drawSprite({
        sprite: "horizon_glow",
        pos: k.vec2(0, GROUND_Y - 200),
        scale: k.vec2(W / 200, 1),
        color: k.rgb(200, 90, 200),
        opacity: 0.45,
      });
      // Floating bureaucratic UML diagrams in tinted purple
      {
        const par = 0.22, SP = 340;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        for (let i = -1; i < W / SP + 3; i++) {
          const absIdx = base + i;
          const variant = Math.abs((absIdx * 2654435761) >>> 0) % 3;
          const ny = 20 + (Math.abs(absIdx * 73) % 220);
          k.drawSprite({
            sprite: `diagram${variant}`,
            pos: k.vec2(i * SP - off, ny),
            opacity: 0.65,
            color: k.rgb(190, 150, 230),
          });
        }
      }
      // Floating cosmic threat labels
      {
        const par = 0.30, SP = 280;
        const scroll = camX * par;
        const base = Math.floor(scroll / SP);
        const off = scroll - base * SP;
        const threats = [
          "UNDEFINED POLICY",
          "CIRCULAR DEPENDENCY",
          "FRAGMENTED DATA SCHEMATIC",
          "COSMIC TECHNICAL DEBT",
        ];
        for (let i = -1; i < W / SP + 2; i++) {
          const absIdx = base + i;
          const label = threats[Math.abs(absIdx * 37) % threats.length];
          const ty = 40 + (Math.abs(absIdx * 53) % 200);
          k.drawText({
            text: label, size: 10,
            pos: k.vec2(i * SP - off + 80, ty),
            anchor: "center",
            color: k.rgb(210, 180, 230),
            opacity: 0.55,
            outline: { width: 1, color: k.rgb(16, 16, 24) },
          });
        }
      }
      // Contact shadow + purple-tinted ground tiles
      k.drawRect({
        pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16,
        color: k.rgb(0, 0, 0), opacity: 0.55,
      });
      const startX7 = Math.floor((camX - W / 2) / 80) * 80;
      for (let gx = startX7; gx < camX + W / 2 + 80; gx += 80) {
        k.drawSprite({
          sprite: "groundtile",
          pos: k.vec2(gx - camX + W / 2, GROUND_Y),
          scale: k.vec2(2),
          color: k.rgb(130, 100, 160),
        });
      }
      // Purple floor stamps — TOGAF jargon
      const labelSp7 = 200;
      const startLX7 = Math.floor((camX - W / 2) / labelSp7) * labelSp7;
      const labels7 = ["ADM-01", "ADM-04", "TOGAF-9.2", "ADM-CYCLE"];
      for (let lx = startLX7; lx < camX + W / 2 + labelSp7; lx += labelSp7) {
        const li = (lx / labelSp7) | 0;
        const label = labels7[((li % labels7.length) + labels7.length) % labels7.length];
        k.drawText({
          text: label, size: 11,
          pos: k.vec2(lx - camX + W / 2, GROUND_Y + 14),
          color: k.rgb(200, 130, 220),
        });
      }
      return;
    }

    // Default urban parallax (unused — all 7 Layers now have custom bgs).
    k.drawRect({ width: W, height: H, color: k.rgb(...theme.sky) });
    k.drawRect({
      width: W, height: 220,
      color: k.rgb(theme.sky[0] + 52, theme.sky[1] + 46, theme.sky[2] + 46), opacity: 0.5,
    });
    k.drawRect({
      pos: k.vec2(0, GROUND_Y - 200), width: W, height: 200,
      color: k.rgb(...theme.accent), opacity: 0.10,
    });
    buildingRow(camX, 0.18, GROUND_Y - 26, 1.24, k.rgb(96, 102, 132));
    buildingRow(camX, 0.46, GROUND_Y + 8, 1.92, k.rgb(176, 170, 168));
    k.drawRect({ pos: k.vec2(0, GROUND_Y - 16), width: W, height: 16, color: k.rgb(0, 0, 0), opacity: 0.28 });
    const startX = Math.floor((camX - W / 2) / 80) * 80;
    for (let gx = startX; gx < camX + W / 2 + 80; gx += 80) {
      k.drawSprite({ sprite: "groundtile", pos: k.vec2(gx - camX + W / 2, GROUND_Y), scale: k.vec2(2) });
    }
  });

  // ARCH-46: invisible physics ground + end walls.
  k.add([
    k.rect(LW, GROUND_H), k.pos(0, GROUND_Y), k.area(),
    k.body({ isStatic: true }), k.opacity(0), "ground",
  ]);
  k.add([k.rect(24, 700), k.pos(-24, -60), k.area(), k.body({ isStatic: true }), k.opacity(0)]);
  k.add([k.rect(24, 700), k.pos(LW, -60), k.area(), k.body({ isStatic: true }), k.opacity(0)]);

  // ARCH-118 / ARCH-205: wooden-plank platforms (or Agile Board tiles in
  // Layer 1). Optional `motion` makes the platform oscillate on x or y; when
  // present, all visual parts and any rider Archie shift with the body each
  // frame so Archie can ride a moving platform without sliding off.
  type PlatMotion = { axis: "x" | "y"; range: number; speed: number };
  function addPlatform(x: number, y: number, w: number, motion?: PlatMotion) {
    const body = k.add([
      k.rect(w, 22), k.pos(x, y), k.area(), k.body({ isStatic: true }),
      k.opacity(0), "platform",
      { baseX: x, baseY: y, phase: k.rand(0, Math.PI * 2) },
    ]);
    const shadow = k.add([
      k.rect(w, 7), k.pos(x, y + 22),
      k.color(0, 0, 0), k.opacity(0.28), k.z(3),
    ]);
    // ARCH-224 / ARCH-228 / ARCH-232: Layer 1 = AGILE BOARD, Layer 2 =
    // TKT-board cyan, Layer 3 reuses the AGILE BOARD tile to play the
    // "LEGACY SCHEMAS" role from the design ref (yellow stacked tickets
    // representing un-migrated tables). Everything else = wooden plank.
    const platformTile =
      idx === 0 ? "agileboard"
      : idx === 1 ? "tktboard"
      : idx === 2 ? "agileboard"
      : "plank";
    const planks: any[] = [];
    for (let px = 0; px < w; px += 48) {
      const pw = Math.min(48, w - px);
      planks.push(k.add([
        k.sprite(platformTile), k.pos(x + px, y),
        k.scale(pw / 24, 2), k.z(4),
      ]));
    }
    // ARCH-206: motion-marker accent — bright color for moving platforms so
    // the player reads them as kinetic.
    const lipColor: [number, number, number] = motion
      ? [255, 230, 80]
      : (theme.accent as [number, number, number]);
    const lipOpacity = motion ? 1.0 : 0.85;
    const lip = k.add([
      k.rect(w - 8, 4), k.pos(x + 4, y + 2),
      k.color(...lipColor), k.opacity(lipOpacity), k.z(5),
    ]);

    if (motion) {
      body.onUpdate(() => {
        const oldX = body.pos.x, oldY = body.pos.y;
        let dx = 0, dy = 0;
        if (motion.axis === "x") {
          dx = Math.sin(k.time() * motion.speed + body.phase) * motion.range;
        } else {
          dy = Math.sin(k.time() * motion.speed + body.phase) * motion.range;
        }
        body.pos.x = body.baseX + dx;
        body.pos.y = body.baseY + dy;
        // ARCH-207: carry Archie if he's standing on this specific platform.
        // (`curPlatform()` returns the body he's grounded on; we compare ids.)
        const standing: any = (archie as any).curPlatform
          ? (archie as any).curPlatform()
          : null;
        if (standing && standing.id === body.id) {
          archie.pos.x += body.pos.x - oldX;
          archie.pos.y += body.pos.y - oldY;
        }
        // shift the visual parts
        const ddx = body.pos.x - oldX, ddy = body.pos.y - oldY;
        shadow.pos.x += ddx; shadow.pos.y += ddy;
        lip.pos.x += ddx; lip.pos.y += ddy;
        for (const p of planks) { p.pos.x += ddx; p.pos.y += ddy; }
      });
    }
  }
  function addCollectible(sprite: string, x: number, y: number, tag: string) {
    k.add([
      k.sprite(sprite), k.pos(x, y), k.area(), k.anchor("center"),
      k.scale(SCALE), k.z(5), tag, { bob: y },
    ]);
  }
  const PROP_Y: Record<string, number> = {
    crate: 40, cone: 38, hydrant: 40, trashbag: 36, lamppost: 182,
  };
  function addProp(name: string, x: number, z: number) {
    k.add([k.sprite(name), k.pos(x, GROUND_Y - PROP_Y[name]), k.z(z), k.scale(2)]);
  }

  // ARCH-128 / ARCH-208: PROCEDURAL LAYOUT — denser platform fields with a
  // mix of static and moving variants. ~35% are moving (mostly horizontal,
  // occasionally vertical) with a yellow lip so they read as kinetic.
  let px = k.rand(190, 260);
  while (px < bossGateX - 160) {
    const w = k.rand(80, 150);
    const y = k.rand(180, 460);
    let motion: { axis: "x" | "y"; range: number; speed: number } | undefined;
    if (k.rand() < 0.35) {
      if (k.rand() < 0.65) {
        motion = { axis: "x", range: k.rand(50, 110), speed: k.rand(1.0, 2.2) };
      } else {
        motion = { axis: "y", range: k.rand(30, 70), speed: k.rand(1.0, 1.8) };
      }
    }
    addPlatform(px, y, w, motion);
    if (k.rand() < (difficulty === "super" ? 0.36 : 0.72)) {
      addCollectible("bean", px + w / 2, y - 42, "bean");
    }
    px += k.rand(140, 260);
  }
  // ARCH-209: a few HIGH-AIR platforms — bonus collectibles for jumpers,
  // independent of the main spacing pass.
  const highCount = Math.floor((bossGateX - 400) / 700);
  for (let i = 0; i < highCount; i++) {
    const hx = k.rand(400, bossGateX - 250);
    const hy = k.rand(130, 200);
    const hw = k.rand(70, 110);
    const hmotion: { axis: "x" | "y"; range: number; speed: number } | undefined =
      k.rand() < 0.5
        ? { axis: "x", range: k.rand(60, 120), speed: k.rand(0.9, 1.6) }
        : undefined;
    addPlatform(hx, hy, hw, hmotion);
    addCollectible("bean", hx + hw / 2, hy - 42, "bean");
  }
  // ARCH-216: ELEVATOR platforms — long-range slow vertical travel that
  // actually transports the player between the ground tier and the high-air
  // tier. ~1 per ~1600 px of level. Carries a bean as a small reward.
  const elevCount = 1 + Math.floor(LW / 1600);
  for (let i = 0; i < elevCount; i++) {
    const ex = k.rand(380, bossGateX - 320);
    const ey = GROUND_Y - 220; // mid-altitude resting point
    const ew = k.rand(72, 96);
    addPlatform(ex, ey, ew, {
      axis: "y",
      range: k.rand(170, 240),
      speed: k.rand(0.55, 0.85),
    });
    addCollectible("bean", ex + ew / 2, ey - 42, "bean");
  }
  // ARCH-133: collectible/prop counts scale with the longer level.
  // ARCH-404: Super Archie halves all help-item density.
  const playable = bossGateX - 220;
  const beanInterval = difficulty === "super" ? 440 : 220; // ½ density in super
  for (let i = 0; i < Math.round(playable / beanInterval); i++) {
    addCollectible("bean", k.rand(220, bossGateX), GROUND_Y - 36, "bean");
  }
  // Misplacement traps already placed above; no jira collectibles any more.
  addCollectible("armor", k.rand(320, bossGateX - 220), GROUND_Y - 40, "armor");
  if (playable > 2200 && difficulty !== "super") addCollectible("armor", k.rand(320, bossGateX - 220), GROUND_Y - 40, "armor");
  addCollectible("espresso", k.rand(320, bossGateX - 220), GROUND_Y - 40, "espresso");
  if (playable > 2200 && difficulty !== "super") addCollectible("espresso", k.rand(320, bossGateX - 220), GROUND_Y - 40, "espresso");
  // ARCH-89b: Solutions Architecture gets Legacy Code "DS" blocks (Hammer
  // required to break). Centered anchor for clean stacking, scale * 2 so each
  // native pixel becomes a satisfyingly chunky 6 screen pixels.
  if (idx === 1) {
    const lx = k.rand(500, bossGateX - 300);
    const BLK = 96; // on-screen block size
    for (let i = 0; i < 2; i++) {
      k.add([
        k.sprite("legacycode"),
        k.pos(lx, GROUND_Y - BLK / 2 - i * BLK),
        k.area(), k.anchor("center"), k.body({ isStatic: true }),
        k.scale(SCALE * 2), k.z(6), k.health(1), "legacycode",
      ]);
    }
  }

  // ARCH-157 / ARCH-229: Layer 1's "No-Budget Block Golem" — an immovable
  // wall of DS blocks. PREVIOUSLY parked at `LW - 220`, which sits INSIDE the
  // boss arena and softlocked the player out of the exit portal after killing
  // the boss without first buying the key. Now placed JUST BEFORE the boss
  // gate so it acts as the actual gate to Layer 1's boss fight — buy the
  // Funding key first, dissolve the wall, then engage Cthulhu.
  const golemBlocks: any[] = [];
  if (idx === 0) {
    const BLK = 96;
    const gx = bossGateX - 250;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        golemBlocks.push(k.add([
          k.sprite("legacycode"),
          k.pos(gx + col * BLK, GROUND_Y - BLK / 2 - row * BLK),
          k.area(), k.anchor("center"),
          k.body({ isStatic: true }),
          k.scale(SCALE * 2), k.z(6),
          k.color(180, 180, 195), // ARCH-158: cool tint so it reads as "Golem", not Hammer block
          "golem",
        ]));
      }
    }
    // ARCH-187: Funding Vendor — Layer 1's bean-to-key exchange. Placed in
    // the back half of the playable area but ALWAYS before the Golem wall so
    // it's reachable without first dissolving the wall.
    k.add([
      k.sprite("vendor"),
      k.pos(k.rand(LW * 0.4, gx - 140), GROUND_Y - 54),
      k.area(), k.anchor("center"), k.scale(SCALE), k.z(5),
      "vendor",
    ]);
    // Key bobbing — registered globally; fires once a key is dispensed.
    k.onUpdate("key", (b: any) => { b.pos.y = b.bob + Math.sin(k.time() * 4 + b.pos.x) * 6; });
  }

  // ARCH-238: Layer 3 — scatter 2 Data Cleansing power-ups. Picking one up
  // clears any active GDPR violation and grants a small Caffeine bonus.
  if (idx === 2) {
    for (let i = 0; i < 2; i++) {
      k.add([
        k.sprite("cleanse"),
        k.pos(k.rand(280, bossGateX - 200), GROUND_Y - 42),
        k.area(), k.anchor("center"), k.scale(SCALE), k.z(5),
        "cleanse", { bob: GROUND_Y - 42 },
      ]);
    }
    k.onUpdate("cleanse", (b: any) => {
      b.pos.y = b.bob + Math.sin(k.time() * 5 + b.pos.x) * 4;
    });

    // ARCH-245: Migration Puzzle — push the fragmented Master Data blocks
    // into the CORRECT silo ("CUST"). Pushing one into "PROD" (the wrong
    // silo) triggers a 5-second GDPR Violation. Silos/blocks are placed
    // here at setup; the push mechanic + collide outcomes are wired up
    // later, after `archie` exists (see ARCH-246).
    function addSilo(sx: number, label: string) {
      const isCust = label === "CUST";
      const labelCol = isCust ? k.rgb(150, 230, 150) : k.rgb(232, 76, 60);
      k.add([
        k.sprite("silo"), k.pos(sx, GROUND_Y - 60),
        k.area(), k.scale(SCALE), k.z(5),
        "silo", { label },
      ]);
      k.add([
        k.text(label, { size: 14 }),
        k.pos(sx + 42, GROUND_Y - 72), k.anchor("center"),
        k.color(labelCol), k.outline(2, k.rgb(16, 16, 24)), k.z(7),
      ]);
      k.add([
        k.text(isCust ? "CORRECT" : "INCORRECT", { size: 9 }),
        k.pos(sx + 42, GROUND_Y - 88), k.anchor("center"),
        k.color(labelCol), k.z(7),
      ]);
    }
    function addPushBlock(bx: number, type: "a" | "b") {
      const spriteName = type === "a" ? "pushblock_a" : "pushblock_b";
      k.add([
        k.sprite(spriteName), k.pos(bx, GROUND_Y - 36),
        k.area(), k.body({ isStatic: true }),
        k.scale(SCALE), k.z(5),
        "pushblock", { type, alive: true },
      ]);
    }
    addSilo(Math.round(LW * 0.55), "CUST");
    addSilo(Math.round(LW * 0.68), "PROD");
    addPushBlock(Math.round(LW * 0.32), "a");
    addPushBlock(Math.round(LW * 0.42), "b");
  }

  // ARCH-276: Layer 5 — Hash Damage Streams. Tall vertical columns of green
  // Matrix characters that damage Archie on contact (tagged "hazard" so the
  // existing damageArchie pipeline applies, with its 1s i-frames). 4 placed
  // per level at random x positions in the playable area.
  if (idx === 4) {
    const HSTREAM_CHARS = ["1", "0", "F", "A", "E", "C", "B", "D"];
    function spawnHashStream(sx: number) {
      const h = 360;
      const top = GROUND_Y - h;
      // Soft green glow halo behind the column (visual only)
      k.add([
        k.rect(28, h + 12), k.pos(sx - 3, top - 6),
        k.color(40, 220, 100), k.opacity(0.18), k.z(8),
      ]);
      // Damage hitbox (invisible thin column)
      const stream: any = k.add([
        k.rect(20, h), k.pos(sx, top), k.area(),
        k.opacity(0), k.z(9),
        "hazard", "hashstream",
        { startT: k.time() + k.rand(0, 1.5) },
      ]);
      // Draw the falling characters every frame
      stream.onDraw(() => {
        const speed = 240;
        const charSp = 16;
        const offset = (k.time() - stream.startT) * speed;
        for (let i = 0; i < 24; i++) {
          const yy = ((offset + i * charSp) % (h + 100)) - 24;
          if (yy < -16 || yy > h) continue;
          const cidx = (Math.floor(stream.startT * 31) + i + Math.floor(k.time() * 6))
            % HSTREAM_CHARS.length;
          k.drawText({
            text: HSTREAM_CHARS[cidx], size: 14,
            pos: k.vec2(stream.pos.x + 3, stream.pos.y + yy),
            color: i === 0 ? k.rgb(220, 255, 230) : k.rgb(40, 220, 100),
            opacity: 0.95 * (1 - Math.min(1, i / 18)),
          });
        }
      });
    }
    for (let i = 0; i < 4; i++) {
      spawnHashStream(k.rand(300, bossGateX - 200));
    }
  }

  // ARCH-267: Layer 5 — Firewall Nodes. Two 64×64 cyan blocks parked between
  // the level approach and the boss gate. Invulnerable while the DDoS Tide
  // is flooding; SPINS / EXPOSED during recede phase and destroyable with
  // the Refactoring Hammer. Each node destroyed pays out +500 score + 25CP.
  const firewallNodes: any[] = [];
  if (idx === 4) {
    const fwY = GROUND_Y - 80; // sits flush on ground (sprite anchored topleft, on-screen 80×80)
    for (let i = 0; i < 2; i++) {
      const fwX = bossGateX - 220 - i * 130;
      const node: any = k.add([
        k.sprite("firewall_active"),
        k.pos(fwX, fwY),
        k.area(), k.body({ isStatic: true }),
        k.scale(2.5), k.z(6),
        "firewall", { spriteName: "firewall_active" },
      ]);
      node.onUpdate(() => {
        const want = isDdosFlood() ? "firewall_active" : "firewall_spin";
        if (node.spriteName !== want) {
          node.spriteName = want;
          node.use(k.sprite(want));
        }
      });
      firewallNodes.push(node);
    }
  }

  // ARCH-254: Layer 4 — Cloud Zones. Cyan dashed rectangles on the ground
  // matching the Bounded Context style. While Archie stands inside one, the
  // Cloud Zone Stalkers become visible AND damageable (handled in the weapon
  // collide and the stalker's onUpdate via `cloudZoneTouchT`).
  if (idx === 3) {
    const addCloudZone = (zx: number) => {
      const w = 170, h = 80;
      const zoneY = GROUND_Y - h - 4;
      const col: [number, number, number] = [133, 193, 233];
      k.add([
        k.rect(w, h), k.pos(zx, zoneY),
        k.color(col[0] * 0.18, col[1] * 0.18, col[2] * 0.22),
        k.opacity(0.45), k.area(),
        "cloudzone",
      ]);
      const dash = 10, gap = 5;
      for (let dx = 0; dx < w; dx += dash + gap) {
        const seg = Math.min(dash, w - dx);
        k.add([k.rect(seg, 3), k.pos(zx + dx, zoneY), k.color(...col), k.z(3)]);
        k.add([k.rect(seg, 3), k.pos(zx + dx, zoneY + h - 3), k.color(...col), k.z(3)]);
      }
      for (let dy = 0; dy < h; dy += dash + gap) {
        const seg = Math.min(dash, h - dy);
        k.add([k.rect(3, seg), k.pos(zx, zoneY + dy), k.color(...col), k.z(3)]);
        k.add([k.rect(3, seg), k.pos(zx + w - 3, zoneY + dy), k.color(...col), k.z(3)]);
      }
      k.add([
        k.text("CLOUD ZONE", { size: 16 }),
        k.pos(zx + w / 2, zoneY + 24), k.anchor("center"),
        k.color(...col), k.outline(2, k.rgb(16, 16, 24)), k.z(5),
      ]);
      k.add([
        k.text("(AWS)", { size: 12 }),
        k.pos(zx + w / 2, zoneY + 48), k.anchor("center"),
        k.color(...col), k.z(5),
      ]);
    };
    addCloudZone(Math.round(LW * 0.28));
    addCloudZone(Math.round(LW * 0.6));
  }

  // ARCH-291: Layer 7 ADM Phase Platforms. 8 color-coded platforms (A–H)
  // scattered across the boss arena at varying heights. Player must LAND
  // on them in order — wrong order resets the cycle. addAdmPlatform
  // mirrors addPlatform's "invisible body + visual rect" pattern but the
  // visual is a single solid colored rect with the letter stamped on top.
  function addAdmPlatform(px: number, py: number, step: number) {
    const w = 56, h = 22;
    const [r, g, b] = ADM_COLORS[step];
    k.add([
      k.rect(w, h), k.pos(px, py), k.area(), k.body({ isStatic: true }),
      k.opacity(0), "platform", "admplat",
      { step, label: ADM_PHASES[step] },
    ]);
    // soft drop shadow
    k.add([k.rect(w, 6), k.pos(px, py + h), k.color(0, 0, 0), k.opacity(0.4), k.z(3)]);
    // colored tile face
    k.add([
      k.rect(w, h), k.pos(px, py),
      k.color(r, g, b), k.z(4),
      k.outline(2, k.rgb(16, 16, 24)),
    ]);
    // bright top edge highlight
    k.add([
      k.rect(w - 4, 3), k.pos(px + 2, py + 2),
      k.color(Math.min(255, r + 60), Math.min(255, g + 60), Math.min(255, b + 60)),
      k.z(5),
    ]);
    // letter label
    k.add([
      k.text(ADM_PHASES[step], { size: 16 }),
      k.pos(px + w / 2, py + 11), k.anchor("center"),
      k.color(255, 255, 255), k.outline(2, k.rgb(16, 16, 24)), k.z(6),
    ]);
  }
  if (idx === 6) {
    // 8 platforms staggered through the boss arena, forcing a zig-zag path
    // that the player has to climb in A→H order. Heights chosen so the
    // sequence demands actual platforming, not just a straight run.
    const admLayout: Array<[number, number]> = [
      [bossGateX + 60,  GROUND_Y - 70],   // A — easy entry
      [bossGateX + 180, GROUND_Y - 160],  // B — jump up
      [bossGateX + 320, GROUND_Y - 80],   // C — drop forward
      [bossGateX + 460, GROUND_Y - 200],  // D — jump high again
      [LW - 380,        GROUND_Y - 110],  // E — descent toward boss
      [LW - 250,        GROUND_Y - 240],  // F — climb back up
      [LW - 380,        GROUND_Y - 280],  // G — top tier
      [LW - 520,        GROUND_Y - 200],  // H — backtrack down-left to finish
    ];
    admLayout.forEach(([x, y], i) => addAdmPlatform(x, y, i));
  }

  // ARCH-168 / ARCH-225: Bounded Context zones — full-height columns with
  // dashed borders + bold labels, per the Layer 2 mockup. Order = cyan,
  // Inventory = red. The collision area covers the whole column so phantoms
  // floating at any altitude get exorcised on entry.
  function addZone(x: number, label: string) {
    const w = 180, h = 86;
    const zoneY = GROUND_Y - h - 4;
    const isOrder = label === "Order";
    const col: [number, number, number] = isOrder ? [120, 200, 255] : [255, 100, 100];
    // Filled column (collision body)
    k.add([
      k.rect(w, h), k.pos(x, zoneY),
      k.color(col[0] * 0.18, col[1] * 0.18, col[2] * 0.18),
      k.opacity(0.55), k.area(),
      "zone", { label },
    ]);
    // Dashed border — 4 sides, drawn as 3px-thick segments
    const dash = 10, gap = 5;
    for (let dx = 0; dx < w; dx += dash + gap) {
      const seg = Math.min(dash, w - dx);
      k.add([k.rect(seg, 3), k.pos(x + dx, zoneY), k.color(...col), k.z(3)]);
      k.add([k.rect(seg, 3), k.pos(x + dx, zoneY + h - 3), k.color(...col), k.z(3)]);
    }
    for (let dy = 0; dy < h; dy += dash + gap) {
      const seg = Math.min(dash, h - dy);
      k.add([k.rect(3, seg), k.pos(x, zoneY + dy), k.color(...col), k.z(3)]);
      k.add([k.rect(3, seg), k.pos(x + w - 3, zoneY + dy), k.color(...col), k.z(3)]);
    }
    // Big label + subtitle inside the column
    k.add([
      k.text(label, { size: 22 }),
      k.pos(x + w / 2, zoneY + 22), k.anchor("center"),
      k.color(...col), k.outline(2, k.rgb(16, 16, 24)), k.z(5),
    ]);
    k.add([
      k.text("Context", { size: 14 }),
      k.pos(x + w / 2, zoneY + 50), k.anchor("center"),
      k.color(...col), k.z(5),
    ]);
  }
  if (idx === 1) {
    addZone(Math.round(LW * 0.28), "Order");
    addZone(Math.round(LW * 0.58), "Inventory");
  }

  // ASSET-1138 / ARCH-148: Misplacement Traps — corrupted folders on the floor.
  // Replace the old JIRA Swarm Hazard. Same "hazard" tag → same damage path.
  const hazardCount = Math.floor(playable / 520) + 2;
  for (let i = 0; i < hazardCount; i++) {
    const hx = k.rand(280, bossGateX - 80);
    k.add([
      k.sprite("misplacement"), k.pos(hx, GROUND_Y - 14),
      k.area(), k.anchor("center"), k.scale(SCALE), k.z(6),
      "hazard", "misplacementtrap",
    ]);
  }
  // ARCH-150: 2 Bureaucratic Bottleneck Clouds drift through every level.
  // ARCH-178: Layer 1 is indoors — only "office boxes" (crates + trash bags).
  // Streetlights, cones, hydrants are reserved for the outdoor Layers (2–7).
  if (idx === 0) {
    for (let i = 0; i < Math.round(LW / 380); i++) {
      addProp(k.choose(["crate", "trashbag"]), k.rand(150, LW - 150), 4);
    }
  } else {
    for (let i = 0; i < Math.round(LW / 280); i++) {
      addProp(k.choose(["crate", "cone", "hydrant", "trashbag"]), k.rand(150, LW - 150), 4);
    }
    for (let i = 0; i < Math.round(LW / 600); i++) addProp("lamppost", k.rand(180, LW - 180), 13);
  }
  // ARCH-183: bean pulse animation. The SVG bean is one sprite now (the
  // 3-frame canvas cycle was retired with ASSET-1138), so we breathe it via
  // a scale pulse instead — gives a livelier, less jittery sip-of-caffeine
  // bob than the old frame swap.
  k.onUpdate("bean", (b: any) => {
    b.pos.y = b.bob + Math.sin(k.time() * 4 + b.pos.x) * 5;
    const baseScale = b.baseScale ?? (b.baseScale = b.scale?.x ?? 1);
    const pulse = 1 + Math.sin(k.time() * 6 + b.pos.x * 0.05) * 0.08;
    b.scale = k.vec2(baseScale * pulse, baseScale * pulse);
  });
  // ASSET-1138: Misplacement Trap pulse — angry folder breathes with a red
  // tint flicker to signal danger. Scale-based, no multi-frame sprites needed.
  k.onUpdate("misplacementtrap", (h: any) => {
    const t = k.time() + (h.pos?.x ?? 0) * 0.03;
    const pulse = 1 + Math.sin(t * 5) * 0.05;
    const baseScale = h.baseScale ?? (h.baseScale = h.scale?.x ?? SCALE);
    h.scale = k.vec2(baseScale * pulse, baseScale * pulse);
    // Flash red every ~0.9s
    const angry = Math.sin(t * 3.5) > 0.7;
    h.color = angry ? k.rgb(255, 160, 160) : k.rgb(255, 255, 255);
  });
  k.onUpdate("armor", (b: any) => { b.pos.y = b.bob + Math.sin(k.time() * 5 + b.pos.x) * 4; });
  k.onUpdate("espresso", (b: any) => { b.pos.y = b.bob + Math.sin(k.time() * 5 + b.pos.x) * 4; });

  // ---------------------------------------------------------------------------
  // ARCH-54: Archie Tect.
  // ---------------------------------------------------------------------------
  // ASSET-1138: Archie now uses the lean SVG sprite. Scaled up MUCH bigger
  // since the SVG is 16×16 native (vs the old 18×22 ASCII art). The previous
  // multi-frame state machine (idle/run0-3/jump/fall/drink + tuxedo variants)
  // is replaced by programmatic squash-and-stretch via the scale component —
  // lower code overhead and cleaner asset pipeline.
  const ARCHIE_SCALE = 4;
  const archie = k.add([
    k.sprite("archie"), k.pos(spawnPos), k.area({ scale: 0.8 }), k.body(),
    k.anchor("center"), k.scale(ARCHIE_SCALE), k.z(10), k.color(255, 255, 255),
    cognitiveLoad(),
    "archie",
    {
      facing: 1 as 1 | -1, frozen: false,
      blessedUntil: 0, espressoUntil: 0, exposedUntil: 0,
      invertedUntil: 0, controlsInverted: false,
      drinkingUntil: 0,
      gdprUntil: 0, gdprDrainT: 0,
      decryptingUntil: 0,
    },
  ]);
  // Wand mode (tuxedo) is now signalled by a color tint instead of a sprite
  // swap, since we have a single SVG. `archieMode` is kept as a flag for
  // existing callsites (e.g. switchWeapon, playDrink).
  let archieMode: "suit" | "tux" = "suit";
  let currentArchieFrame = "archie"; // kept for espresso afterimage spawning
  let runAnimT = 0;
  // ARCH-315: dual-channel animation — SVG sprite swap AND scale squash/stretch
  // stack on top of each other for maximum readability. State priority:
  //   drinking (archie_drink) → in-air (archie_jump rising / archie_fall falling)
  //   → running (archie_run_a/b at ~9 fps Y-bob) → idle (archie_idle, breathing).
  // Tux mode (Wand) adds a slight cyan tint via color() since we share one
  // pose set across both weapon modes.
  function updateArchieSprite() {
    let sx = ARCHIE_SCALE, sy = ARCHIE_SCALE;
    let nextFrame = "archie";
    const drinking = k.time() < archie.drinkingUntil;
    const grounded = archie.isGrounded();
    const walking = k.isKeyDown("left") || k.isKeyDown("right");
    if (drinking) {
      // Quick pulse for the sip
      const p = (archie.drinkingUntil - k.time()) / 0.55;
      const pulse = Math.sin((1 - p) * Math.PI) * 0.12;
      sx = ARCHIE_SCALE * (1 - pulse * 0.4);
      sy = ARCHIE_SCALE * (1 + pulse);
      nextFrame = "archie_drink";
    } else if (!grounded) {
      if (archie.vel.y < 0) {
        // Rising — vertical stretch + tucked-legs jump pose
        sx = ARCHIE_SCALE * 0.86;
        sy = ARCHIE_SCALE * 1.14;
        nextFrame = "archie_jump";
      } else {
        // Falling — horizontal squash + spread-legs panic pose
        sx = ARCHIE_SCALE * 1.12;
        sy = ARCHIE_SCALE * 0.88;
        nextFrame = "archie_fall";
      }
    } else if (walking) {
      runAnimT += k.dt();
      const bob = Math.sin(runAnimT * 18) * 0.06;
      sx = ARCHIE_SCALE * (1 - bob * 0.5);
      sy = ARCHIE_SCALE * (1 + bob);
      // Two-frame run cycle ~9 fps (alternates every 0.11s).
      nextFrame = Math.floor(runAnimT * 9) % 2 === 0 ? "archie_run_a" : "archie_run_b";
    } else {
      runAnimT = 0;
      // Gentle breathing idle
      const breathe = Math.sin(k.time() * 2) * 0.012;
      sx = ARCHIE_SCALE * (1 - breathe);
      sy = ARCHIE_SCALE * (1 + breathe);
      nextFrame = "archie";
    }
    // archie.flipX is set by walk() — keep scale positive.
    archie.scale = k.vec2(sx, sy);
    // ASSET-1141: only swap if the target sprite asset is actually resolved.
    // SVG data URIs decode async; an unresolved swap leaves Archie invisible.
    if (nextFrame !== currentArchieFrame) {
      const asset = k.getSprite(nextFrame);
      if (asset && (asset as any).loaded !== false) {
        archie.use(k.sprite(nextFrame));
        currentArchieFrame = nextFrame;
      }
    }
    // Tux mode (Wand) gets a cyan tint instead of a sprite swap. Espresso
    // overrides with the existing red tint (set in archie.onUpdate).
    if (k.time() >= archie.espressoUntil) {
      archie.color = archieMode === "tux"
        ? k.rgb(180, 220, 255)
        : k.rgb(255, 255, 255);
    }
  }
  const SPEED = 230;
  const JUMP_FORCE = 720;

  function walk(sign: 1 | -1) {
    if (archie.frozen) return;
    const speed = k.time() < archie.espressoUntil ? SPEED * 1.8 : SPEED;
    // ARCH-154: Release Demon contact inverts controls for 5s.
    const dir = (archie.controlsInverted ? -sign : sign) as 1 | -1;
    archie.move(speed * dir, 0);
    archie.facing = dir;
    archie.flipX = dir < 0;
    archie.buildLoad(0.018 * k.dt());
  }
  k.onKeyDown("left", () => walk(-1));
  k.onKeyDown("right", () => walk(1));
  // ARCH-301: tight platformer feel — COYOTE TIME (jump shortly after leaving
  // a platform) + JUMP BUFFER (queue a jump press that fires the moment
  // Archie lands). Both windows are 0.12s. ARCH-310 adds DOUBLE JUMP:
  // Archie gets one extra mid-air jump (slightly weaker, 85 % force) before
  // he must land to reset. The air-jump is consumed immediately on press so
  // it feels responsive; the coyote window still acts as the "first" jump,
  // keeping the controls forgiving near platform edges.
  let jumpBufferedT = -10;
  let lastGroundedT = -10;
  let airJumpsLeft = 0;        // reset to 1 on every landing
  const MAX_AIR_JUMPS = 1;
  const DOUBLE_JUMP_FORCE = JUMP_FORCE * 0.85;
  k.onKeyPress("up", () => {
    if (archie.frozen) return;
    jumpBufferedT = k.time();
  });

  function switchWeapon(i: number) {
    if (i < 0 || i >= WEAPONS.length || i === weaponIdx) return;
    weaponIdx = i;
    archieMode = WEAPONS[i].kind === "aoe" ? "tux" : "suit";
    updateArchieSprite();
    popup(archie.pos, WEAPONS[i].short, theme.accent);
  }
  k.onKeyPress("1", () => switchWeapon(0));
  k.onKeyPress("2", () => switchWeapon(1));
  k.onKeyPress("3", () => switchWeapon(2));

  // ARCH-142: BLUEPRINT BARRIER — Weapon 1 no longer swings; per the mockup it
  // "unrolls" into a stationary cyan grid in front of Archie. The barrier
  // damages anything that touches it (multiple enemies, multiple ticks) and
  // sticks around for ~0.9s. Damage still scales with Cognitive Load.
  function doBlueprint() {
    if (archie.frozen) return;
    const hi = archie.cognitiveLoad > 0.65;
    const barrier = k.add([
      k.sprite("blueprint_barrier"),
      k.pos(archie.pos.x + archie.facing * 36, archie.pos.y - 2),
      k.area(), k.anchor("center"),
      k.scale(SCALE * (hi ? 1.15 : 1)), k.z(11),
      k.color(hi ? k.rgb(220, 255, 255) : k.rgb(255, 255, 255)),
      k.opacity(0.95),
      k.lifespan(0.9, { fade: 0.3 }),
      "weapon",
      { hits: new Set<number>(), weaponDmg: WEAPONS[0].dmg, tick: 0 },
    ]);
    barrier.flipX = archie.facing < 0;
    // ARCH-143: the barrier re-ticks every 0.18s so it keeps damaging stragglers.
    barrier.onUpdate(() => {
      barrier.tick += k.dt();
      if (barrier.tick > 0.18) { barrier.tick = 0; barrier.hits.clear(); }
    });
  }
  // ---------------------------------------------------------------------------
  // ARCH-315: Refactoring Hammer — two-tier attack system.
  //   TAP  space → normal swing (0.45s wind-up, destroys golem + legacy blocks)
  //   HOLD space → charge accumulates; release fires OVERLOAD EXPLOSION
  //                (radius 120, damages all enemies + archie, destroys all blocks)
  // ---------------------------------------------------------------------------
  let hammerChargeT = 0;
  let hammerCharging = false;
  let hammerChargeLabel: any = null;

  function fireHammerSwing(overload = false) {
    const swingDmg = overload ? WEAPONS[1].dmg * 4 : WEAPONS[1].dmg;
    const swingR   = overload ? 120 : 52;
    const pos      = k.vec2(archie.pos.x, archie.pos.y);

    if (overload) {
      // Overload: circular shockwave that hits everything in radius
      k.shake(10);
      k.addKaboom(pos, { scale: 1.4 });
      // Visual ring
      k.add([
        k.circle(swingR), k.pos(pos), k.anchor("center"),
        k.color(255, 160, 40), k.opacity(0.7),
        k.lifespan(0.25, { fade: 0.2 }), k.z(22),
      ]);
      // Hit every enemy in radius
      let hitAny = false;
      for (const e of k.get("enemy")) {
        if (e.pos.dist(pos) < swingR) {
          hitAny = true;
          e.hurt(swingDmg);
          if (e.exists()) {
            k.addKaboom(e.pos, { scale: 0.6 });
            popup(e.pos, `OVERLOADED -${swingDmg}`, [255, 120, 40]);
          }
        }
      }
      // Destroy all golem / legacy blocks in radius
      for (const blk of [...golemBlocks, ...k.get("legacycode")]) {
        if (blk.exists() && blk.pos.dist(pos) < swingR) {
          k.addKaboom(blk.pos, { scale: 0.5 });
          k.destroy(blk);
          score += 120;
        }
      }
      // Self-damage — overload costs Archie 1 coffee half
      damageArchie(1);
      popup(archie.pos, "OVERLOAD BACKFIRE!", [255, 80, 80]);
      if (!hitAny) popup(archie.pos, "REGRESSION BUG!", [255, 80, 80]);
    } else {
      // Normal swing: directional hitbox in front of Archie
      let hit = false;
      const swing = k.add([
        k.sprite("hammer"),
        k.pos(archie.pos.x + archie.facing * 36, archie.pos.y + 6),
        k.area({ scale: 1.5 }), k.anchor("center"), k.scale(SCALE), k.z(11),
        k.lifespan(0.2), "weapon", "heavy",
        { hits: new Set<number>(), weaponDmg: swingDmg },
      ]);
      swing.flipX = archie.facing < 0;
      swing.onCollide("enemy", () => { hit = true; });
      // Destroy golem DS blocks on normal hit
      swing.onCollide("golem", (b: any) => {
        hit = true;
        if (b.exists()) {
          k.addKaboom(b.pos, { scale: 0.5 });
          const idx2 = golemBlocks.indexOf(b);
          if (idx2 !== -1) golemBlocks.splice(idx2, 1);
          k.destroy(b);
          score += 150;
          popup(b.pos, "DS BLOCK SMASHED!", [150, 255, 150]);
        }
      });
      swing.onCollide("legacycode", (b: any) => {
        hit = true;
        if (b.exists()) {
          k.addKaboom(b.pos); k.destroy(b); score += 120;
          popup(b.pos, "LEGACY CODE SMASHED", [150, 255, 150]);
        }
      });
      k.wait(0.22, () => {
        archie.frozen = false; hammerBusy = false;
        if (!hit) {
          popup(archie.pos, "REGRESSION BUG!", [255, 80, 80]);
          archie.exposedUntil = k.time() + 1.5;
        }
      });
    }
  }

  function doHammer() {
    if (hammerBusy || archie.frozen) return;
    hammerBusy = true;
    archie.frozen = true;
    const charge = k.add([
      k.text("* WIND-UP *", { size: 13 }),
      k.pos(archie.pos.x, archie.pos.y - 60), k.anchor("center"),
      k.color(255, 180, 60), k.outline(2, k.rgb(16, 16, 24)), k.z(30),
    ]);
    const follow = charge.onUpdate(() => {
      charge.pos.x = archie.pos.x; charge.pos.y = archie.pos.y - 60;
    });
    k.wait(0.45, () => {
      follow.cancel();
      if (charge.exists()) k.destroy(charge);
      fireHammerSwing(false);
    });
  }

  // Space press → normal swing (or start charge if held)
  // Space release → if charged enough, fire overload
  k.onKeyPress("space", () => {
    const w = WEAPONS[weaponIdx];
    if (w.kind === "melee") { doBlueprint(); return; }
    if (w.kind === "heavy") {
      if (hammerBusy || archie.frozen) return;
      hammerChargeT = k.time();
      hammerCharging = true;
      // Show a growing charge bar label above Archie
      hammerChargeLabel = k.add([
        k.text("▮ CHARGING... ▮", { size: 12 }),
        k.pos(archie.pos.x, archie.pos.y - 72), k.anchor("center"),
        k.color(255, 140, 0), k.outline(2, k.rgb(16, 16, 24)), k.z(30),
        k.opacity(1),
      ]);
    }
  });

  k.onKeyRelease("space", () => {
    if (WEAPONS[weaponIdx].kind !== "heavy") return;
    if (!hammerCharging) return;
    hammerCharging = false;
    const held = k.time() - hammerChargeT;
    if (hammerChargeLabel && hammerChargeLabel.exists()) k.destroy(hammerChargeLabel);
    hammerChargeLabel = null;

    if (held >= 0.9 && !hammerBusy && !archie.frozen) {
      // Overload path — charged long enough
      hammerBusy = true;
      archie.frozen = true;
      k.add([
        k.text("★ OVERLOAD ★", { size: 18 }),
        k.pos(archie.pos.x, archie.pos.y - 72), k.anchor("center"),
        k.color(255, 80, 0), k.outline(3, k.rgb(16, 16, 24)), k.z(30),
        k.lifespan(0.7, { fade: 0.3 }), k.opacity(1),
      ]);
      k.wait(0.15, () => {
        fireHammerSwing(true);
        k.wait(0.25, () => { archie.frozen = false; hammerBusy = false; });
      });
    } else {
      // Not charged enough — do a normal swing
      doHammer();
    }
  });

  // Update the charge label to follow Archie and pulse colour
  k.onUpdate(() => {
    if (!hammerCharging || !hammerChargeLabel || !hammerChargeLabel.exists()) return;
    const held = k.time() - hammerChargeT;
    hammerChargeLabel.pos.x = archie.pos.x;
    hammerChargeLabel.pos.y = archie.pos.y - 72;
    const ready = held >= 0.9;
    hammerChargeLabel.color = ready
      ? k.rgb(255, 60, 0)                                    // red = READY
      : k.rgb(255, Math.round(140 + held / 0.9 * 80), 0);  // orange ramp
    const bars = Math.min(8, Math.floor((held / 0.9) * 8));
    hammerChargeLabel.text = ready
      ? "★ RELEASE = OVERLOAD ★"
      : `[${"▮".repeat(bars)}${"▯".repeat(8 - bars)}] CHARGING`;
  });

  function popup(p: any, txt: string, col: number[]) {
    k.add([
      k.text(txt, { size: 16 }), k.pos(p.x, p.y), k.anchor("center"),
      k.color(col[0], col[1], col[2]), k.outline(2, k.rgb(16, 16, 24)),
      k.z(30), k.lifespan(0.6), k.move(k.UP, 60),
    ]);
  }

  let invulnUntil = 0;
  function damageArchie(halves: number) {
    if (k.time() < archie.blessedUntil) return;
    if (k.time() < invulnUntil) return;
    invulnUntil = k.time() + 1.0;
    let amt = halves;
    if (k.time() < archie.exposedUntil) amt *= 2;
    coffeeHalves -= amt;
    if (!archie.locked) archie.cognitiveLoad = Math.max(0, archie.cognitiveLoad - 0.3);
    popup(archie.pos, amt === 1 ? "-1/2 CUP" : `-${amt / 2} CUPS`, [255, 80, 80]);
    // ARCH-304: hit feedback — red burst at Archie's position + a tiny
    // screen shake. Matches the "Future Healer" feel where every hit on the
    // player is unmistakable.
    k.add([
      k.circle(28), k.pos(archie.pos), k.anchor("center"),
      k.color(255, 80, 80), k.opacity(0.75),
      k.lifespan(0.15, { fade: 0.12 }),
      k.z(15),
    ]);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + k.rand(-0.4, 0.4);
      k.add([
        k.rect(2, 2),
        k.pos(archie.pos.x, archie.pos.y), k.anchor("center"),
        k.color(255, 100, 100), k.opacity(0.95),
        k.lifespan(0.28, { fade: 0.2 }),
        k.move(k.vec2(Math.cos(ang), Math.sin(ang)), 100),
        k.z(16),
      ]);
    }
    k.shake(amt > 1 ? 5 : 2);
    if (coffeeHalves <= 0) burnoutCrash();
  }
  function burnoutCrash() {
    coffeeHalves = MAX_HALVES;
    archie.pos = spawnPos.clone();
    archie.cognitiveLoad = 0.4;
    archie.blessedUntil = 0; archie.espressoUntil = 0;
    archie.locked = false; archie.exposedUntil = 0;
    score = Math.max(0, score - 400);
    popup(archie.pos, "BURNOUT CRASH — RESTARTED THE LAYER", [255, 120, 60]);
  }
  function killReward(e: any, pts: number) {
    score += pts;
    popup(e.pos, `+${pts}`, [255, 230, 120]);
    // ARCH-305: chunky death burst — gold radial spread (8 particles) + a
    // brighter inner ring. Replaces the bland addKaboom-only death effect
    // with a punchier kill sting for the Future-Healer feel.
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      k.add([
        k.rect(3, 3),
        k.pos(e.pos.x, e.pos.y), k.anchor("center"),
        k.color(255, 220, 100), k.opacity(0.95),
        k.lifespan(0.42, { fade: 0.32 }),
        k.move(k.vec2(Math.cos(ang), Math.sin(ang) - 0.25), 160),
        k.z(20),
      ]);
    }
    k.add([
      k.circle(18), k.pos(e.pos), k.anchor("center"),
      k.color(255, 240, 180), k.opacity(0.75),
      k.lifespan(0.16, { fade: 0.13 }),
      k.z(19),
    ]);
    k.addKaboom(e.pos);
    k.destroy(e);
  }
  function isStunned(e: any) { return e.stunned && k.time() < e.stunned; }

  // ---------------------------------------------------------------------------
  // ARCH-76: Enemy factories.
  // ---------------------------------------------------------------------------
  function spawnScopeCreep(x: number) {
    const e = k.add([
      k.sprite("scopecreep"), k.pos(x, GROUND_Y - 60), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(2),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "fragile", { stunned: 0 },
    ]);
    const bubble = k.add([
      k.text(k.choose(["MVP!", "SHIP IT!", "JUST ONE MORE THING"]), { size: 14 }),
      k.pos(e.pos), k.anchor("center"), k.color(255, 255, 255),
      k.outline(2, k.rgb(16, 16, 24)), k.z(20),
    ]);
    e.onUpdate(() => {
      bubble.pos = e.pos.add(0, -56);
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(95 * ESPD * dir, 0); e.flipX = dir < 0;
    });
    e.onDeath(() => killReward(e, 100));
    e.onDestroy(() => { if (bubble.exists()) k.destroy(bubble); });
  }
  function spawnCockroach(x: number) {
    const e = k.add([
      k.sprite("cockroach"), k.pos(x, GROUND_Y - 40), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(5),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", { stunned: 0, dropTimer: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(40 * ESPD * dir, 0); e.flipX = dir < 0;
      e.dropTimer += k.dt();
      if (e.dropTimer > 0.8) {
        e.dropTimer = 0;
        k.add([
          k.sprite("poison"), k.pos(e.pos.x, GROUND_Y - 16), k.area(),
          k.anchor("center"), k.scale(SCALE), k.z(6),
          k.lifespan(4, { fade: 1 }), k.opacity(1), "hazard",
        ]);
      }
    });
    e.onDeath(() => killReward(e, 150));
  }
  function spawnOoze(x: number, y: number, big: boolean) {
    const e = k.add([
      k.sprite("ooze"), k.pos(x, y), k.area(), k.body(),
      k.anchor("center"), k.scale(big ? SCALE : SCALE * 0.6), k.z(8),
      eHealth(big ? 6 : 3),
      k.offscreen({ destroy: true, distance: 1000 }),
      "enemy", { stunned: 0, big },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(55 * ESPD * dir, 0);
    });
    e.onDeath(() => {
      if (e.big) {
        spawnOoze(e.pos.x - 20, e.pos.y, false);
        spawnOoze(e.pos.x + 20, e.pos.y, false);
        killReward(e, 120);
      } else killReward(e, 60);
    });
  }
  function spawnPoC(x: number) {
    const e = k.add([
      k.sprite("poc"), k.pos(x, GROUND_Y - 50), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(2),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "fragile", { stunned: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(190 * ESPD * dir, 0); e.flipX = dir < 0;
    });
    e.onDeath(() => { k.addKaboom(e.pos); killReward(e, 130); });
  }
  function spawnVillain(x: number) {
    const e = k.add([
      k.sprite("villain"), k.pos(x, GROUND_Y - 50), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(8),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", { stunned: 0, shootTimer: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dist = archie.pos.x - e.pos.x;
      const dir = dist > 0 ? 1 : -1;
      e.flipX = dir < 0;
      if (Math.abs(dist) > 320) e.move(70 * ESPD * dir, 0);
      else if (Math.abs(dist) < 200) e.move(-60 * ESPD * dir, 0);
      e.shootTimer += k.dt();
      if (e.shootTimer > 1.4) {
        e.shootTimer = 0;
        const to = archie.pos.sub(e.pos).unit();
        k.add([
          k.sprite("enemyshot"), k.pos(e.pos), k.area(), k.anchor("center"),
          k.scale(SCALE), k.z(9), k.move(to, 280),
          k.offscreen({ destroy: true, distance: 500 }), k.lifespan(3), "enemyShot",
        ]);
      }
    });
    e.onDeath(() => killReward(e, 200));
  }

  // ARCH-270: Exposed Credentials Villain — Layer 5 specialty variant of the
  // generic Villain. More HP, faster fire rate, faster projectiles, and the
  // shots are tagged "credentialShot" so they also trigger a DECRYPTING HUD
  // overlay on hit (see ARCH-272). Drops a Coffee Bean on death.
  function spawnCredentialsVillain(x: number) {
    const e = k.add([
      k.sprite("villain"), k.pos(x, GROUND_Y - 50), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8),
      k.color(255, 200, 200), // pink tint marks the Layer-5 variant
      eHealth(12),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "credentialsvillain",
      { stunned: 0, shootTimer: k.rand(0, 0.6) },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dist = archie.pos.x - e.pos.x;
      const dir = dist > 0 ? 1 : -1;
      e.flipX = dir < 0;
      // tighter kiting range
      if (Math.abs(dist) > 300) e.move(80 * ESPD * dir, 0);
      else if (Math.abs(dist) < 180) e.move(-70 * ESPD * dir, 0);
      e.shootTimer += k.dt();
      if (e.shootTimer > 0.9) {
        e.shootTimer = 0;
        const to = archie.pos.sub(e.pos).unit();
        k.add([
          k.sprite("enemyshot"), k.pos(e.pos), k.area(), k.anchor("center"),
          k.scale(SCALE), k.z(9),
          k.move(to, 320),
          k.offscreen({ destroy: true, distance: 500 }),
          k.lifespan(3),
          "enemyShot", "credentialShot",
        ]);
      }
    });
    e.onDeath(() => {
      killReward(e, 250);
      // ARCH-271: dropped Bean — small bean pickup at the death spot. Tagged
      // bean + animated by the global bean.onUpdate cycle.
      const bean = k.add([
        k.sprite("bean"), k.pos(e.pos.x, GROUND_Y - 36),
        k.area(), k.anchor("center"), k.scale(SCALE), k.z(5),
        "bean", { bob: GROUND_Y - 36 },
      ]);
      // gentle pop upward
      bean.pos.y -= 6;
    });
  }

  function spawnGlutton(x: number) {
    const e = k.add([
      k.sprite("glutton"), k.pos(x, GROUND_Y - 45), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(9),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "glutton", { stunned: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(150 * ESPD * dir, 0); e.flipX = dir < 0;
    });
    e.onDeath(() => killReward(e, 220));
  }

  // ARCH-283: Sagemaker Sad Monster — Layer 6 specialty. Slow random shuffle,
  // contact damage only. Occasionally drips a small green "1"/"0" binary
  // tear that hangs in the air briefly for flavor (non-damaging).
  function spawnSadMonster(x: number) {
    const e = k.add([
      k.sprite("sad_monster"), k.pos(x, GROUND_Y - 50), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(4),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "sadmonster",
      { stunned: 0, wanderT: 0, wanderDir: k.choose([-1, 0, 0, 1]), tearT: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      e.wanderT += k.dt();
      // Re-pick direction every 1.5s; 50% chance of "inactivity" pause.
      if (e.wanderT > 1.5) {
        e.wanderT = 0;
        e.wanderDir = k.choose([-1, -1, 0, 0, 0, 1, 1]);
      }
      e.move(28 * ESPD * e.wanderDir, 0);
      if (e.wanderDir !== 0) e.flipX = e.wanderDir < 0;
      // Binary tear drops every ~1.2s
      e.tearT += k.dt();
      if (e.tearT > 1.2) {
        e.tearT = 0;
        const tear = k.add([
          k.text(k.rand() < 0.5 ? "1" : "0", { size: 10 }),
          k.pos(e.pos.x + k.rand(-4, 4), e.pos.y - 8),
          k.color(95, 208, 122), k.opacity(0.85),
          k.lifespan(1.0, { fade: 0.5 }),
          k.move(k.DOWN, 60), k.z(7),
        ]);
      }
    });
    e.onDeath(() => killReward(e, 180));
  }

  // ARCH-284: Transformer Attention Seeker — Layer 6 specialty. Big mech that
  // builds an ATTENTION charge whenever Archie isn't facing it; when full,
  // fires a screen-wide blast that hurts Archie. Facing the seeker (Archie's
  // facing dir points TOWARD its position) drains the charge fast. CTO
  // blessing bypasses the blast.
  function spawnTransformerSeeker(x: number) {
    const e: any = k.add([
      k.sprite("transformer_seeker"),
      k.pos(x, GROUND_Y - 60), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE * 0.7), k.z(8),
      eHealth(18),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "seeker",
      { stunned: 0, attention: 0, lastBlast: 0, shootT: k.rand(0, 1.5) },
    ]);
    // Floating attention meter — two stacked rects following the seeker.
    const meterBg = k.add([
      k.rect(44, 5), k.pos(e.pos.x - 22, e.pos.y - 56),
      k.color(30, 30, 40),
      k.outline(1, k.rgb(133, 193, 233)),
      k.z(20),
    ]);
    const meterFill = k.add([
      k.rect(1, 3), k.pos(e.pos.x - 21, e.pos.y - 55),
      k.color(133, 193, 233), k.z(21),
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      // Is Archie facing the seeker?
      const dx = e.pos.x - archie.pos.x;
      const facingSeeker = Math.sign(dx) === archie.facing;
      if (facingSeeker) {
        e.attention = Math.max(0, e.attention - 0.55 * k.dt());
      } else {
        e.attention = Math.min(1, e.attention + 0.20 * k.dt());
      }
      // Cosmetic body sway
      e.pos.x += Math.sin(k.time() * 1.4) * 0.4;
      // ARCH-286: Low-energy bolt — fires every ~2.2s when Archie is facing
      // AWAY (i.e. attention is building). Slower projectile (cyan tinted) so
      // it's distinguishable from villain shots, deals normal enemyShot
      // damage via the existing handler. Skipped while attention is full
      // (mech is busy charging the screen-wide blast).
      e.shootT += k.dt();
      if (!facingSeeker && e.attention < 0.95 && e.shootT > 2.2) {
        e.shootT = 0;
        const to = archie.pos.sub(e.pos).unit();
        k.add([
          k.sprite("enemyshot"), k.pos(e.pos), k.area(), k.anchor("center"),
          k.scale(SCALE * 0.85), k.z(9),
          k.color(133, 193, 233), // cyan AI tint
          k.move(to, 220),
          k.offscreen({ destroy: true, distance: 500 }),
          k.lifespan(3.5), "enemyShot",
        ]);
      }
      // Sync meter
      meterBg.pos.x = e.pos.x - 22;
      meterBg.pos.y = e.pos.y - 56;
      meterFill.pos.x = e.pos.x - 21;
      meterFill.pos.y = e.pos.y - 55;
      meterFill.width = Math.max(1, 42 * e.attention);
      meterFill.color = e.attention > 0.8
        ? k.rgb(232, 76, 60)
        : k.rgb(133, 193, 233);
      // Fire when full (with a 3s cooldown)
      if (e.attention >= 1 && k.time() - e.lastBlast > 3) {
        e.lastBlast = k.time();
        e.attention = 0;
        if (k.time() >= archie.blessedUntil) {
          damageArchie(2);
          popup(archie.pos, "ATTENTION CHARGE!", [255, 100, 100]);
        }
        // Cyan screen flash
        k.add([
          k.fixed(), k.rect(k.width(), k.height()), k.pos(0, 0),
          k.color(133, 193, 233), k.opacity(0.45), k.z(95),
          k.lifespan(0.35, { fade: 0.3 }),
        ]);
      }
    });
    e.onDeath(() => {
      killReward(e, 380);
      if (meterBg.exists()) k.destroy(meterBg);
      if (meterFill.exists()) k.destroy(meterFill);
    });
    e.onDestroy(() => {
      if (meterBg.exists()) k.destroy(meterBg);
      if (meterFill.exists()) k.destroy(meterFill);
    });
  }

  function spawnBat(x: number, y: number) {
    const e = k.add([
      k.sprite("bat"), k.pos(x, y), k.area(), k.anchor("center"),
      k.scale(SCALE), k.z(8), eHealth(2),
      k.offscreen({ destroy: true, distance: 1000 }),
      "enemy", { stunned: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const to = archie.pos.sub(e.pos).unit();
      e.move(to.scale(110 * ESPD)); e.flipX = to.x < 0;
    });
    e.onDeath(() => killReward(e, 80));
  }

  // ARCH-149: Bureaucratic Bottleneck Cloud — floating hazard-enemy. Drifts
  // toward Archie at altitude, bobs lazily, takes weapon damage like any
  // other enemy. Worth a chunk of points because nobody enjoys fighting one.
  function spawnCloud(x: number, y: number) {
    const e = k.add([
      k.sprite("cloud"), k.pos(x, y), k.area(), k.anchor("center"),
      k.scale(SCALE), k.z(8), eHealth(4),
      "enemy", { stunned: 0, baseY: y, t: k.rand(0, 6) },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      e.t += k.dt();
      e.pos.y = e.baseY + Math.sin(e.t * 0.8) * 18;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(38 * ESPD * dir, 0);
      e.flipX = dir < 0;
    });
    e.onDeath(() => killReward(e, 180));
  }
  // ARCH-150: place 2 Bottleneck Clouds drifting through every level.
  spawnCloud(k.rand(280, bossGateX - 280), k.rand(140, 220));
  spawnCloud(k.rand(280, bossGateX - 280), k.rand(140, 220));

  // ARCH-155: The Release Demo(n) — rare hulking red demon. On contact with
  // Archie it inverts his controls for 5 seconds (the release was unstable).
  // Currently only spawns in Layer 1 per the mockup, but the mechanic is
  // generic so you can flip it on for other Layers later.
  function spawnDemon(x: number) {
    const e = k.add([
      k.sprite("demon"), k.pos(x, GROUND_Y - 90), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(6),
      k.offscreen({ destroy: true, distance: 1000 }),
      "enemy", "demon", { stunned: 0 },
    ]);
    const bubble = k.add([
      k.text(k.choose(["ERROR", "404", "P0!", "GLITCH"]), { size: 14 }),
      k.pos(e.pos), k.anchor("center"),
      k.color(255, 80, 80), k.outline(2, k.rgb(16, 16, 24)), k.z(20),
    ]);
    e.onUpdate(() => {
      bubble.pos = e.pos.add(0, -92);
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(80 * ESPD * dir, 0);
      e.flipX = dir < 0;
    });
    e.onDeath(() => killReward(e, 300));
    e.onDestroy(() => { if (bubble.exists()) k.destroy(bubble); });
  }

  // ARCH-166: Cross-Domain Phantom (Layer 2). Tagged "phantom" — NOT "enemy"
  // — so the weapon-vs-enemy path doesn't fire. Phantom dies only when it
  // overlaps a Bounded Context zone whose label matches its `context`.
  function spawnPhantom(x: number, ctx: string) {
    const baseY = GROUND_Y - k.rand(90, 170);
    const e = k.add([
      k.sprite("phantom"), k.pos(x, baseY), k.area(),
      k.anchor("center"), k.scale(SCALE), k.z(8), k.opacity(0.85),
      k.offscreen({ destroy: true, distance: 1100 }),
      "phantom", { context: ctx, baseY, t: k.rand(0, 6), stunned: 0 },
    ]);
    const lbl = k.add([
      k.text(ctx.toUpperCase(), { size: 12 }),
      k.pos(e.pos), k.anchor("center"),
      k.color(200, 230, 255), k.outline(2, k.rgb(16, 16, 24)), k.z(20),
    ]);
    e.onUpdate(() => {
      e.t += k.dt();
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(45 * ESPD * dir, 0);
      e.pos.y = e.baseY + Math.sin(e.t * 1.2) * 14;
      e.flipX = dir < 0;
      lbl.pos = e.pos.add(0, -54);
    });
    e.onCollide("zone", (z: any) => {
      if (!e.exists()) return;
      if (z.label === ctx) {
        popup(e.pos, "PHANTOM EXORCISED!", [150, 255, 150]);
        score += 200;
        k.destroy(e);
      }
    });
    e.onDestroy(() => { if (lbl.exists()) k.destroy(lbl); });
  }

  // ARCH-167: The Overcomplicated AWS Design — Layer 2 miniboss. needsHammer:
  // only the Refactoring Hammer dents it. Lambda spray + ground webs.
  // ARCH-235: LGPD / GDPR Leech — slow ground crawler. Tagged "enemy" so the
  // weapon-vs-enemy path damages it normally, but the "leech" tag short-circuits
  // archie.onCollide("enemy") into a GDPR VIOLATION effect instead of a flat
  // coffee hit. CTO blessing makes Archie immune.
  function spawnLeech(x: number) {
    const e = k.add([
      k.sprite("leech"), k.pos(x, GROUND_Y - 16), k.area(), k.body(),
      k.anchor("center"), k.scale(SCALE), k.z(8), eHealth(1),
      k.offscreen({ destroy: true, distance: 900 }),
      "enemy", "leech", { stunned: 0 },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(40 * ESPD * dir, 0);
      e.flipX = dir < 0;
    });
    e.onDeath(() => killReward(e, 120));
  }

  // ARCH-256: Cloud Zone Stalker (Layer 4). Tagged "enemy" + "cloud". Floats
  // toward Archie slowly; opacity ramps based on whether Archie is currently
  // touching a Cloud Zone. The weapon collide handler also gates damage on
  // zone state (see ARCH-258).
  function spawnCloudStalker(x: number) {
    const baseY = GROUND_Y - k.rand(120, 200);
    const e = k.add([
      k.sprite("cloudstalker"), k.pos(x, baseY),
      k.area(), k.anchor("center"), k.scale(SCALE), k.z(8),
      eHealth(3), k.opacity(0.25),
      k.offscreen({ destroy: true, distance: 1100 }),
      "enemy", "cloud", { stunned: 0, baseY, t: k.rand(0, 6) },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      e.t += k.dt();
      // Drift toward Archie (slow)
      const dir = archie.pos.x > e.pos.x ? 1 : -1;
      e.move(45 * ESPD * dir, 0);
      e.pos.y = e.baseY + Math.sin(e.t * 0.8) * 18;
      e.flipX = dir < 0;
      // Visibility cross-fades smoothly toward target
      const inZone = (k.time() - cloudZoneTouchT) < 0.08;
      const target = inZone ? 1.0 : 0.22;
      e.opacity = e.opacity + (target - e.opacity) * Math.min(1, k.dt() * 8);
    });
    e.onDeath(() => killReward(e, 160));
  }

  // ARCH-257: SaaS / PaaS Shapeshifter — Layer 4 MINIBOSS. Switches forms
  // every ~9s. SaaS form walks and contact-damages; PaaS form is stationary
  // and spawns Scope Creeps. A 1-second transformation window cloaks it in
  // dust and makes it temporarily invulnerable.
  function spawnShapeshifter() {
    const e: any = k.add([
      k.sprite("shape_saas"),
      k.pos(Math.min(LW - 220, archie.pos.x + 380), GROUND_Y - 50),
      k.area(), k.body(), k.anchor("center"), k.scale(SCALE * 0.85), k.z(8),
      k.health(36),
      "enemy", "shapeshifter",
      {
        stunned: 0, maxHp: 36, form: "saas",
        formT: 0, transformingUntil: 0, spawnT: 0, spriteName: "shape_saas",
      },
    ]);
    e.onUpdate(() => {
      if (isStunned(e)) return;
      e.formT += k.dt();

      // Trigger transformation every 9 seconds
      if (e.formT > 9 && k.time() > e.transformingUntil) {
        e.formT = 0;
        e.transformingUntil = k.time() + 1.0;
        // Dust burst — 14 gray particles flying outward
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2;
          k.add([
            k.rect(3, 3),
            k.pos(e.pos.x + Math.cos(ang) * 10, e.pos.y + Math.sin(ang) * 10),
            k.anchor("center"),
            k.color(180, 180, 188),
            k.opacity(0.85),
            k.lifespan(0.6, { fade: 0.4 }),
            k.move(k.vec2(Math.cos(ang), Math.sin(ang) - 0.3), 70),
            k.z(9),
          ]);
        }
        popup(e.pos, "TRANSFORMING!", [255, 220, 100]);
      }

      // Complete transformation at the END of the window
      if (e.transformingUntil > 0 && k.time() > e.transformingUntil) {
        e.form = e.form === "saas" ? "paas" : "saas";
        e.spriteName = e.form === "saas" ? "shape_saas" : "shape_paas";
        e.use(k.sprite(e.spriteName));
        e.transformingUntil = 0;
        e.spawnT = 0;
        const which = e.form === "saas" ? "SAAS ACTIVE" : "PAAS ACTIVE: SPAWNING CREEPS";
        popup(e.pos, which, [255, 220, 100]);
      }

      // Invulnerable + frozen during transformation window
      if (k.time() < e.transformingUntil) return;

      // Form-specific behavior
      if (e.form === "saas") {
        // Walk toward Archie like a SaaS rep at a conference
        const dir = archie.pos.x > e.pos.x ? 1 : -1;
        e.move(72 * ESPD * dir, 0);
        e.flipX = dir < 0;
      } else {
        // PaaS turret — stationary, summons creeps every 2.5s
        e.spawnT += k.dt();
        if (e.spawnT > 2.5) {
          e.spawnT = 0;
          spawnScopeCreep(e.pos.x + (k.rand() < 0.5 ? -50 : 50));
        }
      }
    });
    e.onDeath(() => {
      killReward(e, 1400);
      popup(e.pos, "SHAPESHIFTER REFACTORED", [150, 255, 150]);
    });
  }

  function spawnAwsSpider() {
    const e = k.add([
      k.sprite("awsspider"),
      k.pos(Math.min(LW - 220, archie.pos.x + 380), 240),
      k.area(), k.anchor("center"), k.scale(SCALE), k.z(8), k.health(30),
      "enemy", "spider",
      { stunned: 0, maxHp: 30, needsHammer: true, baseY: 240, t: 0, lambdaT: 0, webT: 0 },
    ]);
    e.onUpdate(() => {
      e.t += k.dt();
      e.pos.y = e.baseY + Math.sin(e.t * 0.9) * 18;
      if (!isStunned(e)) {
        const to = archie.pos.sub(e.pos);
        if (Math.abs(to.x) > 240) e.move(to.unit().scale(50 * ESPD));
        e.flipX = archie.pos.x < e.pos.x;
      }
      e.lambdaT += k.dt();
      if (e.lambdaT > 1.8) {
        e.lambdaT = 0;
        const baseAng = Math.atan2(archie.pos.y - e.pos.y, archie.pos.x - e.pos.x);
        for (let i = 0; i < 4; i++) {
          const ang = baseAng + (i - 1.5) * 0.18;
          k.add([
            k.sprite("lambda"), k.pos(e.pos), k.area(), k.anchor("center"),
            k.scale(SCALE), k.z(9),
            k.move(k.vec2(Math.cos(ang), Math.sin(ang)), 280),
            k.offscreen({ destroy: true, distance: 600 }),
            k.lifespan(4), "enemyShot",
          ]);
        }
      }
      e.webT += k.dt();
      if (e.webT > 3.5) {
        e.webT = 0;
        k.add([
          k.sprite("costweb"), k.pos(archie.pos.x, GROUND_Y - 18),
          k.area(), k.anchor("center"), k.scale(SCALE), k.z(6),
          k.lifespan(5, { fade: 1 }), k.opacity(1), "hazard",
        ]);
      }
    });
    e.onDeath(() => {
      killReward(e, 1200);
      popup(e.pos, "AWS DESIGN REFACTORED", [150, 255, 150]);
    });
  }

  function spawnLayerMob(x: number) {
    switch (theme.enemy) {
      case "scopecreep": spawnScopeCreep(x); break;
      case "cockroach": spawnCockroach(x); break;
      case "ooze": spawnOoze(x, GROUND_Y - 80, true); break;
      case "poc": spawnPoC(x); break;
      // ARCH-273: Layer 5 routes through the buffed Credentials Villain
      // variant; every other Layer keeps the baseline villain mob.
      case "villain": (idx === 4 ? spawnCredentialsVillain : spawnVillain)(x); break;
      case "glutton": spawnGlutton(x); break;
    }
  }

  // ---------------------------------------------------------------------------
  // ARCH-129: generic boss attack toolkit + the per-Layer boss itself.
  // ---------------------------------------------------------------------------
  function bossShoot(e: any, spread: number[]) {
    const base = archie.pos.sub(e.pos).unit();
    const baseAng = Math.atan2(base.y, base.x);
    for (const off of spread) {
      const a = baseAng + off;
      k.add([
        k.sprite("enemyshot"), k.pos(e.pos), k.area(), k.anchor("center"),
        k.scale(SCALE), k.z(9), k.move(k.vec2(Math.cos(a), Math.sin(a)), 260),
        k.offscreen({ destroy: true, distance: 600 }), k.lifespan(4), "enemyShot",
      ]);
    }
  }
  function bossRain() {
    k.add([
      k.sprite("spaghetti"), k.pos(archie.pos.x + k.rand(-70, 70), archie.pos.y - 360),
      k.area(), k.anchor("center"), k.scale(SCALE), k.z(9),
      k.move(k.DOWN, 340), k.offscreen({ destroy: true, distance: 260 }),
      k.lifespan(5), "hazard",
    ]);
  }
  // ARCH-292: Final Boss for Layer 7 — the TOGAF ADM Framework Multi-Step
  // Monster. Mutates through 7 boss-form sprites on a 10-second cycle.
  // INVULNERABLE by default; the player must land on ADM platforms in order
  // A→H to expose it for an 8-second vulnerability window during which
  // weapons actually damage it. Wrong-order ADM lands trigger a HEAL on the
  // boss + reset the cycle.
  function spawnFinalBoss() {
    const e: any = k.add([
      k.sprite("boss"), k.pos(Math.min(LW - 160, archie.pos.x + 380), 220),
      k.area(), k.anchor("center"), k.scale(SCALE * 1.05), k.z(8),
      k.health(100),
      "enemy", "boss", "finalboss",
      {
        stunned: 0, maxHp: 100,
        formIdx: 0, formT: 0,
        shootT: 0, summonT: 0, chargeUntil: 0, chargeDir: 1,
      },
    ]);
    e.onUpdate(() => {
      // Float toward Archie (slower than regular bosses; gravitas)
      if (!isStunned(e)) {
        if (k.time() < e.chargeUntil) {
          e.move(e.chargeDir * 320, 0);
        } else {
          const to = archie.pos.sub(e.pos);
          e.move(to.unit().scale(55));
        }
      }
      e.flipX = archie.pos.x < e.pos.x;

      // ARCH-293: mutation timer — every 10s, swap to next form sprite.
      // 7 forms total, cycles back to TOGAF at the end.
      e.formT += k.dt();
      if (e.formT > 10) {
        e.formT = 0;
        e.formIdx = (e.formIdx + 1) % FINAL_BOSS_FORMS.length;
        e.use(k.sprite(FINAL_BOSS_FORMS[e.formIdx]));
        // dust burst on mutation
        for (let i = 0; i < 18; i++) {
          const ang = (i / 18) * Math.PI * 2;
          k.add([
            k.rect(3, 3),
            k.pos(e.pos.x + Math.cos(ang) * 14, e.pos.y + Math.sin(ang) * 14),
            k.anchor("center"),
            k.color(200, 130, 220), k.opacity(0.85),
            k.lifespan(0.6, { fade: 0.4 }),
            k.move(k.vec2(Math.cos(ang), Math.sin(ang) - 0.3), 80),
            k.z(9),
          ]);
        }
        popup(e.pos, `MUTATION ${e.formIdx + 1}/7`, [220, 150, 240]);
      }

      // Composite attack pattern — varies by form
      e.shootT += k.dt();
      e.summonT += k.dt();
      const shootEvery = [2.0, 1.6, 2.4, 1.4, 2.0, 1.2, 1.8][e.formIdx];
      const summonEvery = [4.0, 3.0, 5.0, 4.0, 3.5, 4.0, 3.0][e.formIdx];

      if (e.shootT > shootEvery) {
        e.shootT = 0;
        // 3-way spread
        const base = archie.pos.sub(e.pos).unit();
        const baseAng = Math.atan2(base.y, base.x);
        for (const off of [-0.25, 0, 0.25]) {
          const a = baseAng + off;
          k.add([
            k.sprite("enemyshot"), k.pos(e.pos), k.area(), k.anchor("center"),
            k.scale(SCALE), k.z(9),
            k.move(k.vec2(Math.cos(a), Math.sin(a)), 250),
            k.offscreen({ destroy: true, distance: 600 }),
            k.lifespan(4), "enemyShot",
          ]);
        }
      }
      if (e.summonT > summonEvery) {
        e.summonT = 0;
        spawnScopeCreep(e.pos.x + k.rand(-80, 80));
      }
      // Occasional charge dash (every form 4-second window)
      if (k.rand() < 0.005 && k.time() > e.chargeUntil + 4) {
        e.chargeUntil = k.time() + 0.5;
        e.chargeDir = archie.pos.x < e.pos.x ? -1 : 1;
      }
    });
    e.onDeath(() => {
      bossRef = null;
      killReward(e, 5000);
      popup(e.pos, "TOGAF FRAMEWORK COLLAPSED — REFACTOR PATCH AVAILABLE", [180, 255, 200]);
      k.shake(12);
      onBossDefeated();
    });
    bossRef = e;
    return e;
  }

  // ===========================================================================
  // BOSS-101: THE MVP CTHULHU — Layer 1 boss. Kaboom state() machine.
  //   hover     → sweeps left/right above the arena (invulnerable)
  //   brainstorm → rains 5 Feature Ticket projectiles then transitions
  //   slam      → warning shake then plunges to ground → vulnerable
  //   stunned   → sits on ground for 3s, fully damageable, then rises
  // The boss is ONLY damageable in "stunned". The weapon collision handler
  // checks boss.curState() and rejects hits in all other states.
  // ===========================================================================
  // BOSS-201: Kafka Roach mini-boss — Layer 3. Stationary dual-headed turret.
  // Left head (Sync): fires fast cyan bullets at Archie every 1s.
  // Right head (Async): logs Archie's past positions, dumps 5 shots every 4s.
  // Wand hits stun the async head and clear its position queue.
  function spawnKafkaRoach() {
    const roachX = Math.min(LW - 600, archie.pos.x + 350);
    const roachY = GROUND_Y - 44;
    const posLog: Array<{ x: number; y: number }> = [];
    let asyncStunUntil = 0;

    const roach = k.add([
      k.sprite("boss_kafka_roach"),
      k.pos(roachX, roachY),
      k.area({ scale: 0.85 }),
      k.anchor("center"),
      k.scale(SCALE * 1.6),
      k.z(8),
      k.health(22),
      k.color(255, 255, 255),
      "enemy", "boss", "kafkaroach",
      { stunned: 0, maxHp: 22, needsHammer: false, asyncStunUntil: 0 },
    ]);
    bossRef = roach;

    // Log Archie's position every 0.25s for the async dump
    const logLoop = k.loop(0.25, () => {
      if (!roach.exists()) return;
      posLog.push({ x: archie.pos.x, y: archie.pos.y });
      if (posLog.length > 40) posLog.shift();
    });

    // Sync head: fires fast cyan bullet at Archie every 1s
    const syncLoop = k.loop(1.0, () => {
      if (!roach.exists() || roach.stunned > k.time()) return;
      const dir = archie.pos.sub(roach.pos).unit();
      k.add([
        k.sprite("projectile_sync"),
        k.pos(roach.pos.x - (SCALE * 1.6 * 6), roach.pos.y),
        k.area(),
        k.anchor("center"),
        k.scale(2.2),
        k.z(9),
        k.move(dir, 400),
        k.offscreen({ destroy: true, distance: 700 }),
        k.lifespan(4),
        "enemyShot",
      ]);
    });

    // Async head: every 4s, dump 5 bullets at past logged positions (unless stunned)
    const asyncLoop = k.loop(4.0, () => {
      if (!roach.exists()) return;
      if (roach.asyncStunUntil > k.time()) {
        posLog.length = 0;
        popup(roach.pos, "QUEUE CLEARED!", [120, 200, 255]);
        return;
      }
      const targets = posLog.splice(0, Math.min(5, posLog.length));
      if (targets.length === 0) return;
      popup(roach.pos, "ASYNC DUMP!", [255, 140, 60]);
      for (let i = 0; i < targets.length; i++) {
        k.wait(i * 0.14, () => {
          if (!roach.exists()) return;
          const t = targets[i];
          const dx = t.x - roach.pos.x;
          const dy = t.y - roach.pos.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          k.add([
            k.sprite("ticket"),
            k.pos(roach.pos.x + (SCALE * 1.6 * 6), roach.pos.y),
            k.area(),
            k.anchor("center"),
            k.scale(2),
            k.z(9),
            k.move(k.vec2(dx / len, dy / len), 230),
            k.offscreen({ destroy: true, distance: 700 }),
            k.lifespan(4),
            "enemyShot",
          ]);
        });
      }
    });

    roach.onDeath(() => {
      logLoop.cancel();
      syncLoop.cancel();
      asyncLoop.cancel();
      bossRef = null;
      killReward(roach, 900);
      popup(roach.pos, "KAFKA REFACTORED!", [150, 255, 150]);
      k.add([
        k.fixed(),
        k.text("SYNC/ASYNC PARADOX RESOLVED!", { size: 20 }),
        k.pos(k.width() / 2, 180),
        k.anchor("center"),
        k.color(100, 220, 255),
        k.outline(3, k.rgb(16, 16, 24)),
        k.z(90),
        k.lifespan(3, { fade: 1 }),
        k.opacity(1),
      ]);
    });
  }

  function spawnCthulhuBoss() {
    const ARENA_LEFT  = bossGateX + 60;
    const ARENA_RIGHT = LW - 80;
    const ARENA_MID   = (ARENA_LEFT + ARENA_RIGHT) / 2;
    const HOVER_Y     = 80;
    const SLAM_Y      = GROUND_Y - 56; // sits just above ground

    const boss = k.add([
      k.sprite("boss_cthulhu_idle"),
      k.pos(ARENA_MID, HOVER_Y),
      k.area({ scale: 0.65 }),
      k.anchor("center"),
      k.scale(7),
      k.z(8),
      k.health(bossCfg.hp),
      k.state("hover", ["hover", "brainstorm", "slam", "stunned"]),
      k.color(255, 255, 255),
      "enemy", "boss", "cthulhu",
      { stunned: 0, maxHp: bossCfg.hp, needsHammer: false },
    ]);
    bossRef = boss;

    // ── STATE: HOVER ──────────────────────────────────────────────────────────
    boss.onStateEnter("hover", async () => {
      boss.use(k.sprite("boss_cthulhu_idle"));
      boss.color = k.rgb(255, 255, 255);
      await k.tween(boss.pos.x, ARENA_LEFT + 60, 2.0,
        (v) => { boss.pos.x = v; }, k.easings.easeInOutSine);
      await k.tween(boss.pos.x, ARENA_RIGHT - 60, 2.5,
        (v) => { boss.pos.x = v; }, k.easings.easeInOutSine);
      await k.tween(boss.pos.x, ARENA_MID, 1.0,
        (v) => { boss.pos.x = v; }, k.easings.easeInOutSine);
      boss.enterState("brainstorm");
    });

    boss.onStateUpdate("hover", () => {
      boss.pos.y = HOVER_Y + Math.sin(k.time() * 2.2) * 10;
    });

    // ── STATE: BRAINSTORM — drop Feature Ticket rain ──────────────────────────
    boss.onStateEnter("brainstorm", () => {
      let dropped = 0;
      const dropHandle = k.loop(0.45, () => {
        const tx = boss.pos.x + k.rand(-70, 70);
        k.add([
          k.sprite("ticket"),
          k.pos(tx, boss.pos.y + 36),
          k.area({ scale: 0.8 }),
          k.body(),
          k.anchor("center"),
          k.scale(2.5),
          k.z(7),
          k.lifespan(5, { fade: 0.5 }),
          "hazard", "ticket",
        ]);
        dropped++;
        if (dropped >= 6) {
          dropHandle.cancel();
          boss.enterState("slam");
        }
      });
    });

    boss.onStateUpdate("brainstorm", () => {
      boss.pos.y = HOVER_Y + Math.sin(k.time() * 3) * 6;
    });

    // ── STATE: SLAM — judder → 3-clone shuffle with PM buzzwords → AOE slam ────
    boss.onStateEnter("slam", async () => {
      const BUZZWORDS = [
        "SYNERGIZE!", "CIRCLE BACK!", "MOVE THE NEEDLE!", "LEVERAGE!",
        "LOW-HANGING FRUIT!", "PARADIGM SHIFT!", "DEEP DIVE!", "BANDWIDTH!",
        "TOUCH BASE!", "PIVOT!", "UNPACK!", "DISRUPTIVE!", "IDEATE!",
        "ALIGNMENT!", "HOLISTIC!", "AGILE!", "ITERATE!", "BOIL THE OCEAN!",
        "STAKEHOLDER BUY-IN!", "ACTION ITEMS!", "DOUBLE-CLICK ON THAT!",
        "TAKE THIS OFFLINE!", "LET'S PARK THAT!", "AT THE END OF THE DAY!",
        "VALUE-ADD!", "THOUGHT LEADERSHIP!", "CORE COMPETENCY!", "SCALABLE!",
      ];
      const buzzword = () =>
        BUZZWORDS[Math.floor(k.rand(0, BUZZWORDS.length))];

      // Red tint + 5-tick horizontal judder as warning
      boss.color = k.rgb(255, 100, 100);
      for (let i = 0; i < 5; i++) {
        boss.pos.x += k.rand(-18, 18);
        await k.wait(0.08);
      }
      boss.color = k.rgb(255, 255, 255);

      // Three fixed lane X positions across the arena
      const lanes = [
        ARENA_LEFT  + (ARENA_RIGHT - ARENA_LEFT) * 0.18,
        ARENA_MID,
        ARENA_RIGHT - (ARENA_RIGHT - ARENA_LEFT) * 0.18,
      ];

      // Assign boss to a random lane to start
      const initShuffle = (arr: number[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(k.rand(0, i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };
      initShuffle(lanes);

      boss.pos.x = lanes[0];
      boss.pos.y = HOVER_Y;

      // Spawn 2 ghost decoys — identical look, impossible to tell apart
      const decoys = [lanes[1], lanes[2]].map(dx => k.add([
        k.sprite("boss_cthulhu_idle"),
        k.pos(dx, HOVER_Y),
        k.anchor("center"),
        k.scale(7),
        k.opacity(1),
        k.z(7),
        k.color(255, 255, 255),
        "cthulhu_decoy",
      ]));

      const allEntities = [boss as any, ...decoys];

      // ── SWAP PHASE — entities shuffle lanes 3-5 times with PM buzzwords ──────
      const SWAP_ROUNDS = Math.floor(k.rand(3, 6));
      for (let round = 0; round < SWAP_ROUNDS; round++) {
        if (!boss.exists()) break;

        // New shuffled lane assignment
        const order = [0, 1, 2];
        for (let i = 2; i > 0; i--) {
          const j = Math.floor(k.rand(0, i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }

        // Tween each entity to its new lane + spray a PM buzzword above it
        for (let ei = 0; ei < 3; ei++) {
          const ent = allEntities[ei];
          if (!ent.exists()) continue;
          const targetX = lanes[order[ei]];

          k.add([
            k.text(buzzword(), { size: 11 }),
            k.pos(ent.pos.x, ent.pos.y - 68),
            k.anchor("center"),
            k.color(255, 220, 80),
            k.outline(2, k.rgb(16, 16, 24)),
            k.z(25),
            k.lifespan(0.5, { fade: 0.25 }),
          ]);

          k.tween(ent.pos.x, targetX, 0.42,
            (v) => { if (ent.exists()) ent.pos.x = v; },
            k.easings.easeInOutSine);
        }

        await k.wait(0.52);
      }

      if (!boss.exists()) {
        decoys.forEach(d => { if (d.exists()) k.destroy(d); });
        return;
      }

      // ── FINAL PLUNGE — all three drop simultaneously ──────────────────────────
      for (const d of decoys) {
        if (d.exists()) k.tween(d.pos.y, SLAM_Y, 0.18,
          (v) => { if (d.exists()) d.pos.y = v; }, k.easings.easeInQuad);
      }
      await k.tween(boss.pos.y, SLAM_Y, 0.18,
        (v) => { boss.pos.y = v; }, k.easings.easeInQuad);

      k.shake(10);

      // Decoys burst and vanish
      for (const d of decoys) {
        if (!d.exists()) continue;
        k.addKaboom(d.pos, { scale: 0.9 });
        k.destroy(d);
      }

      // ── AOE EXPLOSION — shockwave rings + damage in radius ───────────────────
      const AOE_R = 190;
      // Outer shockwave (orange)
      k.add([
        k.circle(AOE_R), k.pos(boss.pos), k.anchor("center"),
        k.color(255, 100, 40), k.opacity(0.55), k.z(15),
        k.lifespan(0.35, { fade: 0.30 }),
      ]);
      // Mid ring (yellow)
      k.add([
        k.circle(AOE_R * 0.6), k.pos(boss.pos), k.anchor("center"),
        k.color(255, 200, 60), k.opacity(0.72), k.z(16),
        k.lifespan(0.22, { fade: 0.18 }),
      ]);
      // Core flash (white)
      k.add([
        k.circle(44), k.pos(boss.pos), k.anchor("center"),
        k.color(255, 255, 220), k.opacity(0.95), k.z(17),
        k.lifespan(0.12, { fade: 0.10 }),
      ]);
      // Debris sparks radiating outward
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2 + k.rand(-0.2, 0.2);
        k.add([
          k.rect(5, 5), k.pos(boss.pos), k.anchor("center"),
          k.color(255, 160, 40), k.opacity(0.9), k.z(18),
          k.move(k.vec2(Math.cos(ang), Math.sin(ang)), k.rand(160, 320)),
          k.lifespan(0.4, { fade: 0.3 }),
        ]);
      }

      // AOE damage to Archie if in range
      const distToArchie = boss.pos.dist(archie.pos);
      if (distToArchie < AOE_R && k.time() >= archie.blessedUntil) {
        const dmg = distToArchie < AOE_R * 0.5 ? 2 : 1;
        damageArchie(dmg);
        popup(archie.pos,
          distToArchie < AOE_R * 0.5 ? "DIRECT IMPACT!" : "SHOCKWAVE!",
          [255, 120, 60]);
      }

      // Final PM buzzword at landing
      popup(boss.pos.add(k.vec2(0, -72)), buzzword(), [255, 230, 100]);

      boss.enterState("stunned");
    });

    // ── STATE: STUNNED — on ground, fully damageable ──────────────────────────
    boss.onStateEnter("stunned", async () => {
      boss.use(k.sprite("boss_cthulhu_stun"));
      boss.color = k.rgb(255, 255, 255);
      popup(boss.pos, "VULNERABLE!", [120, 255, 180]);
      await k.wait(3.0);
      // Rise back to hover altitude
      await k.tween(boss.pos.y, HOVER_Y, 0.9,
        (v) => { boss.pos.y = v; }, k.easings.easeOutQuad);
      boss.enterState("hover");
    });

    boss.onStateUpdate("stunned", () => {
      // Slight wobble while sitting stunned
      boss.pos.x += Math.sin(k.time() * 12) * 0.4;
    });

    boss.onDeath(() => {
      bossRef = null;
      killReward(boss, 1000 + idx * 300);
      onBossDefeated();
    });
  }

  // BOSS-202: Monolithic Schema Ooze — Layer 3 final boss.
  // States: idle (immune/breathing) → table_scan (drops DB blocks) →
  //         leak (floor wave, enters exhausted) → exhausted (3s hammer window)
  // At 50% HP: splits into two medium oozes, 1.5s out of phase.
  function spawnSchemaOoze(size: "large" | "medium", startX: number, phaseOffset = 0) {
    const isLarge = size === "large";
    const hp = isLarge ? 44 : 20;
    const sc = isLarge ? 5.5 : 3.2;
    const oozeY = GROUND_Y - (isLarge ? 56 : 32);
    const ARENA_LEFT = bossGateX + 60;
    const ARENA_RIGHT = LW - 80;

    const ooze = k.add([
      k.sprite(isLarge ? "boss_ooze_large" : "boss_ooze_medium"),
      k.pos(startX, oozeY),
      k.area({ scale: 0.72 }),
      k.anchor("center"),
      k.scale(sc),
      k.z(8),
      k.health(hp),
      k.color(255, 255, 255),
      k.state("idle", ["idle", "table_scan", "leak", "exhausted"]),
      "enemy", "boss", "schemaooze",
      { stunned: 0, maxHp: hp, needsHammer: true, sizeCategory: size, splitDone: false },
    ]);

    if (isLarge) bossRef = ooze;

    let idleCycle = 0;

    // ── STATE: IDLE — breathing pulse, fully immune ───────────────────────────
    ooze.onStateEnter("idle", async () => {
      ooze.use(k.color(140, 40, 180));
      ooze.needsHammer = true;
      // Breathing tween: expand then contract
      const breatheOut = async () => {
        if (!ooze.exists() || ooze.state !== "idle") return;
        await k.tween(sc, sc * 1.14, 0.55,
          (v: number) => { if (ooze.exists()) { ooze.scale.x = v; ooze.scale.y = v; } },
          k.easings.easeInOutSine);
        await k.tween(sc * 1.14, sc * 0.9, 0.55,
          (v: number) => { if (ooze.exists()) { ooze.scale.x = v; ooze.scale.y = v; } },
          k.easings.easeInOutSine);
        await k.tween(sc * 0.9, sc, 0.3,
          (v: number) => { if (ooze.exists()) { ooze.scale.x = v; ooze.scale.y = v; } },
          k.easings.easeOutSine);
        if (ooze.exists() && ooze.state === "idle") breatheOut();
      };
      breatheOut();
      const waitTime = (idleCycle === 0 ? 2.0 + phaseOffset : 1.5);
      await k.wait(waitTime);
      if (!ooze.exists()) return;
      if (idleCycle % 2 === 0) {
        ooze.enterState("table_scan");
      } else {
        ooze.enterState("leak");
      }
      idleCycle++;
    });

    // ── STATE: TABLE_SCAN — drops Data Blocks that become static walls ────────
    ooze.onStateEnter("table_scan", async () => {
      ooze.use(k.color(255, 140, 40));
      popup(ooze.pos, "TABLE SCAN INITIATED", [255, 160, 60]);
      let dropped = 0;
      const dropHandle = k.loop(0.55, () => {
        if (!ooze.exists()) { dropHandle.cancel(); return; }
        const bx = ARENA_LEFT + k.rand(40, Math.max(60, ARENA_RIGHT - ARENA_LEFT - 40));
        const block = k.add([
          k.sprite("hazard_data_block"),
          k.pos(bx, 50),
          k.area(),
          k.body(),
          k.anchor("center"),
          k.scale(SCALE),
          k.z(7),
          "hazard", "datablock",
        ]);
        // When the block lands it freezes in place
        block.onGround(() => {
          if (block.exists()) {
            block.use(k.body({ isStatic: true }));
          }
        });
        k.wait(14, () => { if (block.exists()) k.destroy(block); });
        dropped++;
        if (dropped >= 4) {
          dropHandle.cancel();
          k.wait(1.0, () => { if (ooze.exists()) ooze.enterState("idle"); });
        }
      });
    });

    // ── STATE: LEAK — squish + horizontal wave + → exhausted ─────────────────
    ooze.onStateEnter("leak", async () => {
      ooze.use(k.color(220, 50, 80));
      popup(ooze.pos, "DATA LEAK!", [255, 80, 80]);
      // Telegraph: squish vertically
      await k.tween(sc, sc * 0.42, 0.22,
        (v: number) => { if (ooze.exists()) { ooze.scale.y = v; } },
        k.easings.easeOutQuad);
      if (!ooze.exists()) return;
      // Fire horizontal wave in both directions at floor level
      for (const dir of [-1, 1]) {
        k.add([
          k.sprite("hazard_data_wave"),
          k.pos(ooze.pos.x, GROUND_Y - 10),
          k.area(),
          k.anchor("center"),
          k.scale(SCALE),
          k.z(7),
          k.move(k.vec2(dir, 0), 340),
          k.offscreen({ destroy: true, distance: 500 }),
          k.lifespan(5),
          "hazard", "datawave",
        ]);
      }
      k.shake(5);
      // Restore scale
      await k.tween(sc * 0.42, sc, 0.28,
        (v: number) => { if (ooze.exists()) { ooze.scale.y = v; } },
        k.easings.easeOutBack);
      if (ooze.exists()) ooze.enterState("exhausted");
    });

    // ── STATE: EXHAUSTED — 3s window, vulnerable to Hammer ──────────────────
    ooze.onStateEnter("exhausted", async () => {
      ooze.use(k.color(80, 220, 140));
      ooze.needsHammer = false;        // open to any weapon during window
      popup(ooze.pos, "EXHAUSTED — HIT IT NOW!", [80, 255, 150]);
      await k.wait(3.0);
      if (!ooze.exists()) return;
      ooze.needsHammer = true;
      ooze.enterState("idle");
    });

    // ── SPLIT at 50% HP ───────────────────────────────────────────────────────
    ooze.on("hurt", () => {
      if (!ooze.exists()) return;
      if (isLarge && !ooze.splitDone && ooze.hp() <= ooze.maxHp * 0.5) {
        ooze.splitDone = true;
        k.shake(8);
        popup(ooze.pos, "SCHEMA SPLITS!", [220, 100, 255]);
        spawnSchemaOoze("medium", ooze.pos.x - 80, 0);
        spawnSchemaOoze("medium", ooze.pos.x + 80, 1.5);
        bossRef = null;
        k.wait(0.15, () => { if (ooze.exists()) k.destroy(ooze); });
      }
    });

    ooze.onDeath(() => {
      killReward(ooze, isLarge ? 1800 : 700);
      if (isLarge) {
        bossRef = null;
      } else {
        // Only trigger victory when both medium oozes are gone
        k.wait(0.3, () => {
          if (k.get("schemaooze").filter((e: any) => e.exists()).length === 0) {
            bossRef = null;
            onBossDefeated();
          }
        });
      }
    });
  }

  function spawnBoss() {
    // ARCH-294: Layer 7 routes to the custom Final Boss instead of the
    // generic spawnBoss factory (which has no mutation cycle or ADM gate).
    if (idx === 6) return spawnFinalBoss();
    // BOSS-101: Layer 1 uses the state-machine Cthulhu instead of the generic boss.
    if (idx === 0) return spawnCthulhuBoss();
    if (idx === 2) return spawnSchemaOoze("large", Math.min(LW - 200, archie.pos.x + 420));
    const e = k.add([
      k.sprite(bossCfg.sprite), k.pos(Math.min(LW - 160, archie.pos.x + 380), 240),
      k.area(), k.anchor("center"), k.scale(SCALE * bossCfg.mult), k.z(8),
      k.health(bossCfg.hp),
      "enemy", "boss",
      {
        stunned: 0, maxHp: bossCfg.hp, needsHammer: !!bossCfg.needsHammer,
        timers: {} as Record<string, number>, chargeUntil: 0, chargeDir: 1,
      },
    ]);
    bossRef = e;
    for (const a of bossCfg.attacks) e.timers[a] = k.rand(0, 1.2);
    e.onUpdate(() => {
      if (!isStunned(e)) {
        if (k.time() < e.chargeUntil) {
          e.move(e.chargeDir * 380, 0);
        } else {
          const to = archie.pos.sub(e.pos);
          e.move(to.unit().scale(72));
        }
      }
      e.flipX = archie.pos.x < e.pos.x;
      for (const a of bossCfg.attacks) {
        e.timers[a] += k.dt();
        if (a === "shoot3" && e.timers[a] > 2.0) { e.timers[a] = 0; bossShoot(e, [-0.35, 0, 0.35]); }
        if (a === "aimshot" && e.timers[a] > 1.2) { e.timers[a] = 0; bossShoot(e, [0]); }
        if (a === "summon" && e.timers[a] > 4.2) {
          e.timers[a] = 0;
          if (theme.enemy === "cockroach" || idx === 1) { spawnBat(e.pos.x - 40, e.pos.y); spawnBat(e.pos.x + 40, e.pos.y); }
          else spawnLayerMob(e.pos.x + k.rand(-80, 80));
        }
        if (a === "rain" && e.timers[a] > 1.0) { e.timers[a] = 0; bossRain(); }
        if (a === "charge" && e.timers[a] > 3.2) {
          e.timers[a] = 0;
          e.chargeUntil = k.time() + 0.5;
          e.chargeDir = archie.pos.x < e.pos.x ? -1 : 1;
        }
      }
    });
    e.onDeath(() => {
      bossRef = null;
      killReward(e, 1000 + idx * 300);
      onBossDefeated();
    });
  }

  function onBossDefeated() {
    bossDefeated = true;
    // ARCH-230: defensive — dissolve any remaining No-Budget Block Golem
    // blocks so the path to the exit portal is never blocked after the boss
    // dies. (The wall is now positioned before the boss gate so it should be
    // dissolved before engaging, but this catches any edge cases.)
    for (const blk of golemBlocks) {
      if (blk.exists()) { k.addKaboom(blk.pos, { scale: 0.4 }); k.destroy(blk); }
    }
    k.add([
      k.sprite("patch"), k.pos(LW - 90, GROUND_Y - 70), k.area(),
      k.anchor("center"), k.scale(SCALE), k.z(5), "patch",
    ]);
    k.add([
      k.fixed(), k.text("LAYER CLEARED — REACH THE REFACTOR PORTAL >>", { size: 19 }),
      k.pos(k.width() / 2, 150), k.anchor("center"),
      k.color(150, 255, 150), k.outline(3, k.rgb(16, 16, 24)), k.z(90),
      k.lifespan(4.5, { fade: 1.2 }), k.opacity(1),
    ]);
  }

  // ARCH-80: regular-enemy spawner — runs until the boss phase begins.
  // ARCH-134: spawn rarely + far ahead + capped by living count, so the level
  // feels populated, not infested. The backlog is large enough already.
  // ARCH-403: Super Archie — 50% more enemies on-screen at once, faster wave interval.
  const MAX_LIVE_ENEMIES = difficulty === "super" ? 5 : 3;
  k.loop(difficulty === "super" ? 1.8 : 2.8, () => {
    if (bossPhase) return;
    if (k.get("enemy").length >= MAX_LIVE_ENEMIES) return;
    const camX = k.camPos().x;
    // ARCH-135: spawn well off-screen, biased ahead of Archie's facing, so
    // mobs arrive as ambushes rather than infestations.
    const ahead = archie.facing > 0;
    const dist = k.rand(560, 760);
    const x = ahead ? camX + dist : camX - dist;
    if (x < 40 || x > bossGateX - 40) return;
    spawnLayerMob(x);
  });
  // ARCH-161: Layer 1 — rare Release Demon spawns. Heavy, hits hard, and
  // inverts your controls if it touches you. About once every 18 seconds.
  if (idx === 0) {
    k.loop(18, () => {
      if (bossPhase) return;
      const camX = k.camPos().x;
      const x = camX + (k.rand() < 0.5 ? -600 : 600);
      if (x < 80 || x > bossGateX - 80) return;
      spawnDemon(x);
    });
  }
  // ARCH-285: Layer 6 — Sagemaker Sad Monster + Transformer Attention Seeker
  // sprinkled in alongside the regular Glutton mob. Sad Monsters spawn every
  // ~5s (capped 2). Transformer Seekers are much rarer — every ~16s, capped 1.
  if (idx === 5) {
    k.loop(5, () => {
      if (bossPhase) return;
      if (k.get("sadmonster").length >= 2) return;
      const camX = k.camPos().x;
      const x = camX + (k.rand() < 0.5 ? -440 : 440);
      if (x < 80 || x > bossGateX - 40) return;
      spawnSadMonster(x);
    });
    k.loop(16, () => {
      if (bossPhase) return;
      if (k.get("seeker").length >= 1) return;
      const camX = k.camPos().x;
      const x = camX + (k.rand() < 0.5 ? -480 : 480);
      if (x < 80 || x > bossGateX - 60) return;
      spawnTransformerSeeker(x);
    });
  }

  // ARCH-260: Layer 4 — Cloud Zone Stalker spawner. Mid-altitude floaters
  // that are invisible/immune outside Cloud Zones; capped at 2 live.
  if (idx === 3) {
    k.loop(5, () => {
      if (bossPhase) return;
      if (k.get("cloud").length >= 2) return;
      const camX = k.camPos().x;
      const x = camX + (k.rand() < 0.5 ? -460 : 460);
      if (x < 80 || x > bossGateX - 40) return;
      spawnCloudStalker(x);
    });
  }

  // ARCH-237: Layer 3 — LGPD / GDPR Leech spawner. Slow, sparse, periodic;
  // the threat is the VIOLATION drain, not raw spawn pressure.
  if (idx === 2) {
    k.loop(7, () => {
      if (bossPhase) return;
      if (k.get("leech").length >= 2) return;
      const camX = k.camPos().x;
      const x = camX + (k.rand() < 0.5 ? -460 : 460);
      if (x < 80 || x > bossGateX - 40) return;
      spawnLeech(x);
    });
  }

  // ARCH-169: Layer 2 — Cross-Domain Phantom spawner. Alternates contexts so
  // the player has reason to use both Bounded Context zones.
  if (idx === 1) {
    let nextCtx = "Order";
    k.loop(6, () => {
      if (bossPhase) return;
      const camX = k.camPos().x;
      const x = camX + (k.rand() < 0.5 ? -450 : 450);
      if (x < 80 || x > bossGateX - 40) return;
      spawnPhantom(x, nextCtx);
      nextCtx = nextCtx === "Order" ? "Inventory" : "Order";
    });
  }

  // ---------------------------------------------------------------------------
  // ARCH-82: collisions.
  // ---------------------------------------------------------------------------
  k.onCollide("weapon", "enemy", (w: any, e: any) => {
    if (w.hits.has(e.id)) return;
    w.hits.add(e.id);
    const blessed = k.time() < archie.blessedUntil;
    if (e.needsHammer && !w.is("heavy") && !blessed) {
      popup(e.pos, "NEEDS REFACTORING", [255, 140, 140]);
      return;
    }
    // ARCH-258: Cloud Zone Stalker is IMMUNE outside a Cloud Zone — only
    // damageable while Archie is currently touching a "cloudzone" rect.
    if (e.is("cloud")) {
      const inZone = (k.time() - cloudZoneTouchT) < 0.08;
      if (!inZone && !blessed) {
        popup(e.pos, "OUT-OF-ZONE — IMMUNE", [200, 200, 220]);
        return;
      }
    }
    // ARCH-259: Shapeshifter is invulnerable during its 1s transform window.
    if (e.is("shapeshifter") && k.time() < e.transformingUntil) {
      popup(e.pos, "TRANSFORMING — INVULNERABLE", [255, 220, 100]);
      return;
    }
    // BOSS-101: Cthulhu is only damageable while in "stunned" (on the ground).
    // Any hit in hover/brainstorm/slam gets deflected with a taunt popup.
    if (e.is("cthulhu") && e.state !== "stunned" && !blessed) {
      popup(e.pos, "WAIT FOR THE SLAM!", [200, 150, 255]);
      return;
    }
    // BOSS-202: Schema Ooze is immune in all states except "exhausted".
    // During idle/table_scan/leak, hitting it bounces Archie back.
    if (e.is("schemaooze") && e.state !== "exhausted" && !blessed) {
      archie.pos.x -= archie.facing * 50;
      archie.jump(320);
      popup(e.pos, "IMMUNE — WAIT FOR EXHAUSTION", [180, 80, 220]);
      return;
    }

    // BOSS-201: Kafka Roach — Wand (aoe) hits stun the Async head & clear queue.
    if (e.is("kafkaroach") && !w.is("heavy") && !w.is("projectile")) {
      e.asyncStunUntil = k.time() + 4.0;
      popup(e.pos, "ASYNC HEAD STUNNED (4s)", [80, 200, 255]);
      // Still allow damage to fall through
    }
    // ARCH-296: Final Boss is INVULNERABLE unless the ADM A→H cycle has just
    // been completed (admVulnerableUntil > now). CTO blessing bypasses.
    if (e.is("finalboss") && k.time() >= admVulnerableUntil && !blessed) {
      popup(e.pos, "COMPLETE THE ADM CYCLE", [200, 130, 220]);
      return;
    }
    // ARCH-297: "punch" — screen shake on heavy weapon hits + on any hit to
    // the final boss when it's actually vulnerable.
    if (w.is("heavy")) k.shake(3);
    if (e.is("finalboss")) k.shake(2);
    const dmg = Math.max(1, Math.round(w.weaponDmg * archie.dmgMult()));
    e.hurt(dmg);
    archie.buildLoad(0.06);
    // ARCH-299: HIT FLASH burst — a brief expanding white circle at the
    // impact site, sized by weapon class. Universal: works for every enemy
    // regardless of whether they have a color comp. Plus a quick yellow
    // spark ring for that "Future Healer"-style snap-of-juice.
    {
      const r = w.is("heavy") ? 26 : w.is("projectile") ? 14 : 18;
      k.add([
        k.circle(r), k.pos(e.pos), k.anchor("center"),
        k.color(255, 255, 255), k.opacity(0.85),
        k.lifespan(0.10, { fade: 0.08 }),
        k.z(22),
      ]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + k.rand(-0.3, 0.3);
        k.add([
          k.rect(2, 2),
          k.pos(e.pos.x, e.pos.y), k.anchor("center"),
          k.color(255, 230, 120), k.opacity(0.95),
          k.lifespan(0.18, { fade: 0.15 }),
          k.move(k.vec2(Math.cos(a), Math.sin(a)), 130),
          k.z(23),
        ]);
      }
    }
    // ARCH-300: knockback — instant horizontal nudge away from Archie. Skips
    // bosses, minibosses, the final boss, monolith, and anything tagged
    // "boss" so they don't slide off-screen from a tickling Blueprint.
    if (!e.is("boss") && !e.is("monolith") && !e.is("miniboss") && !e.is("shapeshifter")) {
      const kb = w.is("heavy") ? 14 : w.is("projectile") ? 4 : 7;
      const dir = Math.sign(e.pos.x - archie.pos.x) || 1;
      e.pos.x += dir * kb;
    }
    if (w.is("heavy")) e.stunned = k.time() + 0.8;
    k.addKaboom(e.pos, { scale: 0.5 });
    if (w.is("projectile")) k.destroy(w);
  });
  archie.onCollide("enemy", (e: any) => {
    if (k.time() < archie.blessedUntil) {
      if (!e.is("boss")) { popup(e.pos, "APPROVED [OK]", [120, 255, 120]); k.destroy(e); }
      return;
    }
    // ARCH-236: LGPD / GDPR Leech short-circuit — instead of a flat -1/2 cup,
    // it latches on for 4 seconds, displaying the GDPR VIOLATION overlay and
    // draining coffee periodically. The leech is consumed on attach.
    if (e.is("leech")) {
      if (k.time() < archie.gdprUntil) return; // already attached
      archie.gdprUntil = k.time() + 4;
      archie.gdprDrainT = 0;
      popup(archie.pos, "!! GDPR VIOLATION !!", [232, 76, 60]);
      k.addKaboom(e.pos, { scale: 0.4 });
      k.destroy(e);
      return;
    }
    damageArchie(1);
    if (e.is("fragile")) { k.addKaboom(e.pos); k.destroy(e); }
    else if (e.is("glutton")) {
      score = Math.max(0, score - 75);
      popup(e.pos, "-75 (EATEN)", [255, 80, 80]);
    }
  });
  // ARCH-171: Cross-Domain Phantom — IMMUNE TO ATTACK. Weapons just bounce
  // off; only the matching Bounded Context zone exorcises them.
  k.onCollide("weapon", "phantom", (w: any, p: any) => {
    if (w.hits.has(p.id)) return;
    w.hits.add(p.id);
    popup(p.pos, "IMMUNE TO ATTACK", [200, 200, 220]);
  });
  archie.onCollide("phantom", () => damageArchie(1));

  // ARCH-156: Release Demon — separate collide handler for the inversion side
  // effect; the regular enemy collision above already deals the damage.
  archie.onCollide("demon", () => {
    if (k.time() < archie.blessedUntil) return;
    if (k.time() < archie.invertedUntil) return; // already inverted
    archie.invertedUntil = k.time() + 5;
    popup(archie.pos, "!! UNSTABLE RELEASE — CONTROLS INVERTED !!", [255, 100, 255]);
  });
  archie.onCollide("hazard", () => damageArchie(1));
  archie.onCollide("enemyShot", (s: any) => { damageArchie(1); k.destroy(s); });
  // ARCH-272: Credentials shots ALSO trigger a brief DECRYPTING window — the
  // HUD's coffee row gets overlaid with a "DECRYPTING…" loading bar for ~1.6s.
  // Damage from the same shot is already applied via the enemyShot handler.
  archie.onCollide("credentialShot", () => {
    if (k.time() < archie.blessedUntil) return;
    archie.decryptingUntil = k.time() + 1.6;
  });
  // ARCH-198: "REPLACING COFFEE" — Archie raises a coffee cup to his face,
  // squints contentedly, and recharges some Cognitive Load. Triggered by any
  // bean / JIRA pickup, and by purchasing Funding at the Layer-1 vendor.
  //
  // The cup follows Archie's animation cycle properly via 3 phases:
  //   • RISE  (0–0.15s) — full cup ascends from waist to face on the front side
  //   • SIP   (0.15–0.42s) — cup tilts back; fill drains FULL → HALF → EMPTY
  //   • LOWER (0.42–0.55s) — empty cup returns to waist, untilting
  // The cup mirrors `archie.facing`, tilts via the rotate() component, and the
  // sprite is only swapped when the phase actually changes (no per-frame
  // .use() spam).
  const DRINK_DURATION = 0.55;
  function playDrink(loadAmt: number) {
    const startT = k.time();
    archie.drinkingUntil = startT + DRINK_DURATION;
    archie.buildLoad(loadAmt);

    // ARCH-200: cup hand depends on Wand-mode. In tuxedo (Wand), the implied
    // wand-hand is on the FRONT side, so the cup goes in the OPPOSITE hand.
    // `cupSide` flips the offset/rotation sign and the sprite mirror.
    const cupSide = archieMode === "tux" ? -1 : 1;

    const cup = k.add([
      k.sprite("cup_full"),
      k.pos(archie.pos.x + archie.facing * cupSide * 12, archie.pos.y + 18),
      k.anchor("center"), k.scale(SCALE * 0.55),
      k.rotate(0), k.z(11), k.opacity(1),
      k.lifespan(DRINK_DURATION, { fade: 0.15 }),
      { currentSprite: "cup_full" },
    ]);
    cup.flipX = (archie.facing * cupSide) < 0;

    let steamT = 0;
    let prevSprite = "cup_full";
    cup.onUpdate(() => {
      if (!archie.exists()) { k.destroy(cup); return; }
      const t = k.time() - startT;
      // Effective direction = which screen-side the cup physically lives on.
      // Recomputed every frame so flipping facing mid-drink tracks correctly.
      const effDir = archie.facing * cupSide;
      let offX = 0, offY = 0, rot = 0, want = "cup_full";
      let inSip = false, inLower = false;

      if (t < 0.15) {
        // RISE — full cup pulled up from waist to face
        const p = t / 0.15;
        offX = effDir * (12 + p * 2);
        offY = 18 - p * 36;
        rot = 0;
        want = "cup_full";
      } else if (t < 0.42) {
        // SIP — cup at face, tilts back, fill drains
        const p = (t - 0.15) / 0.27;
        offX = effDir * 14;
        offY = -18 - Math.sin(p * Math.PI) * 2;
        rot = effDir * (15 + p * 35);
        want = p < 0.35 ? "cup_full" : p < 0.70 ? "cup_half" : "cup_empty";
        inSip = true;
      } else {
        // LOWER — empty cup returns to waist, untilts
        const p = Math.min(1, (t - 0.42) / 0.13);
        offX = effDir * (14 - p * 2);
        offY = -18 + p * 36;
        rot = effDir * 50 * (1 - p);
        want = "cup_empty";
        inLower = true;
      }

      cup.pos.x = archie.pos.x + offX;
      cup.pos.y = archie.pos.y + offY;
      cup.angle = rot;
      cup.flipX = effDir < 0;

      // ARCH-201: steam emitter — fires during SIP and LOWER phases.
      // The color warms (cool blue → amber brown) as the coffee gets drained
      // and the cup goes down. LOWER spawns a sparser "final wisp".
      if (inSip || inLower) {
        steamT += k.dt();
        const interval = inLower ? 0.12 : 0.06;
        if (steamT > interval) {
          steamT = 0;
          // warmth 0 = fresh hot puff (white-blue), 1 = cooled amber wisp
          const phaseP = (t - 0.15) / 0.40;
          const warmth = Math.min(1, Math.max(0, (phaseP - 0.35) / 0.6));
          const r = Math.round(225 + (200 - 225) * warmth);
          const g = Math.round(232 + (150 - 232) * warmth);
          const b = Math.round(240 + (100 - 240) * warmth);
          k.add([
            k.rect(2, 2),
            k.pos(cup.pos.x + k.rand(-5, 5), cup.pos.y - 10),
            k.anchor("center"),
            k.color(r, g, b),
            k.opacity(0.75 * (1 - warmth * 0.2)),
            k.lifespan(inLower ? 0.6 : 0.5, { fade: 0.4 }),
            k.move(k.vec2(k.rand(-0.4, 0.4), -1), inLower ? 32 : 55),
            k.z(12),
          ]);
        }
      }

      // ARCH-202: SLURP particles — short brown droplet burst when the cup
      // fill state actually changes (full→half, half→empty). The droplets
      // fly TOWARD Archie's face (opposite the cup's side).
      if (want !== prevSprite && inSip) {
        const isFillDrop =
          (prevSprite === "cup_full" && want === "cup_half") ||
          (prevSprite === "cup_half" && want === "cup_empty");
        if (isFillDrop) {
          for (let i = 0; i < 3; i++) {
            k.add([
              k.rect(2, 2),
              k.pos(cup.pos.x, cup.pos.y - 4),
              k.anchor("center"),
              k.color(170, 100, 60),
              k.opacity(0.95),
              k.lifespan(0.2, { fade: 0.14 }),
              k.move(
                k.vec2(-effDir * (0.5 + k.rand(0, 0.4)), k.rand(-0.4, 0.2)),
                95,
              ),
              k.z(13),
            ]);
          }
        }
      }

      if (cup.currentSprite !== want) {
        cup.currentSprite = want;
        cup.use(k.sprite(want));
      }
      prevSprite = want;
    });
  }

  // ARCH-184: small golden dissolve particles when a bean is collected.
  function goldenBurst(p: any) {
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + k.rand(-0.3, 0.3);
      k.add([
        k.rect(3, 3), k.pos(p.x, p.y), k.anchor("center"),
        k.color(255, 220, 100), k.opacity(1),
        k.lifespan(0.45, { fade: 0.35 }), k.z(30),
        k.move(k.vec2(Math.cos(ang), Math.sin(ang) - 1), 90),
      ]);
    }
  }
  archie.onCollide("bean", (b: any) => {
    if (!b.exists()) return;
    caffeinePoints += 5;
    popup(b.pos, "CAFFEINE +5", [255, 220, 100]);
    goldenBurst(b.pos);
    playDrink(0.08); // small sip — brief recharge
    k.destroy(b);
  });
  // ASSET-1138: jira collectibles retired — replaced by misplacement traps.
  // Beans are now the sole currency pickup (coffee_bean SVG).
  // ARCH-186: Funding Vendor — buy the Approved Funding key with 50 CP.
  archie.onCollide("vendor", (v: any) => {
    if (!v.exists()) return;
    if (caffeinePoints >= 50) {
      caffeinePoints -= 50;
      const vp = v.pos.clone();
      k.destroy(v);
      k.add([
        k.sprite("key"), k.pos(vp.x, GROUND_Y - 44),
        k.area(), k.anchor("center"), k.scale(SCALE), k.z(5),
        "key", { bob: GROUND_Y - 44 },
      ]);
      popup(vp, "FUNDING PURCHASED — 50 BEANS", [255, 220, 80]);
      goldenBurst(vp);
      playDrink(0.15); // celebratory sip on a successful purchase
    } else {
      if (k.time() - lastVendorPopup < 1.2) return;
      lastVendorPopup = k.time();
      popup(v.pos, `NEED ${50 - caffeinePoints} MORE BEANS`, [255, 100, 100]);
    }
  });
  // ARCH-268: Layer 5 Firewall Node destruction. Only the Refactoring Hammer
  // damages a node, AND only during DDoS Recede phase. Each destruction
  // awards score + caffeine; CTO blessing bypasses the tide gate.
  if (idx === 4) {
    k.onCollide("weapon", "firewall", (w: any, f: any) => {
      if (!f.exists()) return;
      const blessed = k.time() < archie.blessedUntil;
      if (!w.is("heavy") && !blessed) {
        popup(f.pos, "USE THE HAMMER", [255, 140, 140]);
        return;
      }
      if (isDdosFlood() && !blessed) {
        popup(f.pos, "FIREWALL ACTIVE — WAIT FOR RECEDE", [100, 200, 255]);
        return;
      }
      k.addKaboom(f.pos, { scale: 0.6 });
      k.destroy(f);
      score += 500;
      caffeinePoints += 25;
      popup(f.pos, "FIREWALL BREACHED — +500 +25CP", [150, 255, 150]);
    });
  }

  // ARCH-295: Layer 7 ADM Cycle — when Archie touches a phase platform, check
  // whether it's the next expected step. Correct → advance, A→H reaches
  // exposed state. Wrong → reset to 0 and HEAL the final boss by 12 HP, with
  // a screen shake for emphasis.
  if (idx === 6) {
    archie.onCollide("admplat", (p: any) => {
      if (!bossRef || !bossRef.exists()) return;
      if (k.time() < admVulnerableUntil) return; // already exposed, ignore
      if (p.step === admStep) {
        admStep++;
        popup(p.pos, `PHASE ${p.label} ✓`, [120, 255, 120]);
        if (admStep >= 8) {
          admStep = 0;
          admVulnerableUntil = k.time() + 8;
          popup(bossRef.pos, "!! ADM CYCLE COMPLETE — BOSS VULNERABLE !!", [120, 200, 255]);
          k.shake(6);
        }
      } else if (p.step !== admStep) {
        // Wrong order — reset + heal
        const oldStep = admStep;
        admStep = (p.step === 0) ? 1 : 0; // touching A starts over cleanly
        const healAmt = 12;
        if (bossRef.heal) bossRef.heal(healAmt);
        popup(p.pos, `WRONG ORDER — BOSS HEALED +${healAmt}`, [232, 76, 60]);
        k.shake(4);
      }
    });
  }

  // ARCH-255: Cloud Zone touch tracker — refreshed every frame Archie overlaps
  // a "cloudzone" tagged rect. Used by the Cloud Stalker enemy + weapon
  // collision to gate visibility and damage.
  archie.onCollideUpdate("cloudzone", () => { cloudZoneTouchT = k.time(); });

  // ARCH-246: Layer 3 Migration Puzzle — push mechanic + silo outcomes,
  // wired up here because they reference `archie`. Block-vs-silo collision
  // dispatches success (CUST) or GDPR Violation (PROD).
  if (idx === 2) {
    k.onCollide("pushblock", "silo", (bl: any, s: any) => {
      if (!bl.alive || !bl.exists()) return;
      bl.alive = false;
      if (s.label === "CUST") {
        popup(bl.pos, "DATA MIGRATED — +500 +25CP", [150, 255, 150]);
        score += 500;
        caffeinePoints += 25;
        goldenBurst(bl.pos);
      } else {
        popup(bl.pos, "WRONG SILO — GDPR VIOLATION!", [232, 76, 60]);
        archie.gdprUntil = k.time() + 5;
        archie.gdprDrainT = 0;
      }
      k.addKaboom(bl.pos, { scale: 0.4 });
      k.destroy(bl);
    });
    // Push mechanic — when Archie is touching a block and walking toward
    // it, the block slides at ~95 px/s. Direction respects controls
    // inversion; standing on top of the block doesn't push it.
    archie.onCollideUpdate("pushblock", (bl: any) => {
      if (archie.pos.y < bl.pos.y - 14) return;
      const left = k.isKeyDown(archie.controlsInverted ? "right" : "left");
      const right = k.isKeyDown(archie.controlsInverted ? "left" : "right");
      const dir = right ? 1 : left ? -1 : 0;
      if (dir === 0) return;
      const blockSide = Math.sign(bl.pos.x - archie.pos.x);
      if (dir === blockSide) bl.pos.x += dir * 95 * k.dt();
    });
  }

  // ARCH-239: Data Cleansing — clears GDPR Violation + small CP bonus.
  archie.onCollide("cleanse", (b: any) => {
    if (!b.exists()) return;
    const wasViolating = k.time() < archie.gdprUntil;
    archie.gdprUntil = 0;
    archie.gdprDrainT = 0;
    caffeinePoints += 15;
    popup(b.pos, wasViolating ? "DATA CLEANSED — VIOLATION CLEARED" : "DATA CLEANSED — +15 CP", [120, 200, 255]);
    goldenBurst(b.pos);
    playDrink(0.12);
    k.destroy(b);
  });
  archie.onCollide("armor", (b: any) => {
    if (!b.exists()) return;
    archie.blessedUntil = k.time() + 10;
    popup(b.pos, "STAKEHOLDER SUPPORT ARMOR — CTO APPROVES", [255, 220, 80]);
    k.destroy(b);
  });
  archie.onCollide("espresso", (b: any) => {
    if (!b.exists()) return;
    archie.espressoUntil = k.time() + 15; archie.locked = true;
    popup(b.pos, "DOUBLE ESPRESSO — VENTI MODE", [255, 90, 90]);
    k.destroy(b);
  });
  // ARCH-160: pick up the Approved Funding key → dissolve the Block Golem.
  archie.onCollide("key", (b: any) => {
    if (!b.exists()) return;
    score += 250;
    popup(b.pos, "APPROVED FUNDING ACQUIRED — GOLEM DISSOLVING", [255, 220, 80]);
    k.destroy(b);
    for (const blk of golemBlocks) {
      if (blk.exists()) {
        k.addKaboom(blk.pos, { scale: 0.4 });
        k.destroy(blk);
      }
    }
  });

  archie.onCollide("patch", () => {
    if (!bossDefeated) return;
    k.go("intermission", { idx, score: score + 1000 });
  });

  // ---------------------------------------------------------------------------
  // ARCH-66: per-frame Archie logic.
  // ---------------------------------------------------------------------------
  archie.onUpdate(() => {
    if (archie.locked && k.time() >= archie.espressoUntil) archie.locked = false;
    archie.controlsInverted = k.time() < archie.invertedUntil;

    // ARCH-240: GDPR Violation periodic drain — 1 half-cup every 1.5s while
    // the leech is attached. Bypasses normal i-frames so it actually bites.
    if (k.time() < archie.gdprUntil) {
      archie.gdprDrainT = (archie.gdprDrainT ?? 0) + k.dt();
      if (archie.gdprDrainT > 1.5) {
        archie.gdprDrainT = 0;
        coffeeHalves -= 1;
        popup(archie.pos, "COMPLIANCE FINE -1/2", [232, 76, 60]);
        if (coffeeHalves <= 0) burnoutCrash();
      }
    }
    archie.color = k.time() < archie.espressoUntil
      ? k.rgb(255, 150, 150) : k.rgb(255, 255, 255);

    if (k.time() < archie.espressoUntil) {
      ghostTimer += k.dt();
      if (ghostTimer > 0.05) {
        ghostTimer = 0;
        const g = k.add([
          k.sprite(currentArchieFrame), k.pos(archie.pos), k.anchor("center"),
          k.scale(SCALE), k.color(255, 120, 120), k.opacity(0.45), k.z(9),
          k.lifespan(0.3, { fade: 0.3 }),
        ]);
        g.flipX = archie.flipX;
      }
    }

    // ARCH-144: drive the animation state machine each frame.
    updateArchieSprite();

    const w = WEAPONS[weaponIdx];
    if (w.kind === "aoe" && k.isKeyDown("space") && !archie.frozen && archie.cognitiveLoad > 0) {
      if (!archie.locked) archie.cognitiveLoad = Math.max(0, archie.cognitiveLoad - 0.5 * k.dt());
      wandTimer += k.dt();
      if (wandTimer > 0.16) {
        wandTimer = 0;
        for (let i = 0; i < 6; i++) {
          const a = k.time() * 5 + (i * Math.PI) / 3;
          k.add([
            k.sprite("note"),
            k.pos(archie.pos.x + Math.cos(a) * 48, archie.pos.y + Math.sin(a) * 48),
            k.area(), k.anchor("center"), k.scale(SCALE), k.z(11),
            k.lifespan(0.18), "weapon",
            { hits: new Set<number>(), weaponDmg: WEAPONS[2].dmg },
          ]);
        }
      }
    }

    // ARCH-302 / ARCH-310: coyote-time + jump-buffer + double-jump.
    //   • Landing resets airJumpsLeft to MAX_AIR_JUMPS (1).
    //   • First jump: buffered press inside coyote window → full JUMP_FORCE.
    //   • Second jump: buffered press while airborne + airJumpsLeft > 0
    //     → 85 % force air-jump; also squirts a small dust burst upward.
    const grounded = archie.isGrounded();
    if (grounded) {
      lastGroundedT = k.time();
      airJumpsLeft = MAX_AIR_JUMPS;  // refill air jump on landing
    }
    const buffered = k.time() - jumpBufferedT < 0.12;
    const coyote  = k.time() - lastGroundedT  < 0.10;
    if (buffered && !archie.frozen) {
      if (coyote) {
        // Normal / coyote jump
        archie.jump(JUMP_FORCE);
        jumpBufferedT = -10;
        lastGroundedT = -10;
        airJumpsLeft = MAX_AIR_JUMPS; // still has one air jump available
      } else if (!grounded && airJumpsLeft > 0) {
        // Double jump — slightly weaker, with a visual "poof" burst
        archie.jump(DOUBLE_JUMP_FORCE);
        airJumpsLeft--;
        jumpBufferedT = -10;
        // Mini dust-ring so the player gets feedback
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          k.add([
            k.rect(4, 4), k.anchor("center"),
            k.pos(archie.pos.x + Math.cos(angle) * 10,
                  archie.pos.y + Math.sin(angle) * 10),
            k.color(k.rgb(200, 220, 255)),
            k.opacity(0.9),
            k.move(k.vec2(Math.cos(angle), Math.sin(angle)), 55),
            k.lifespan(0.22, { fade: 1 }), k.z(20),
          ]);
        }
        popup(archie.pos, "↑↑", [160, 200, 255]);
      }
    }

    // ARCH-303: smooth camera lerp (Future-Healer-style). Replaces the old
    // instant snap with a velocity-bound chase at ~10/s — keeps the player
    // visually leading the camera by a small amount during fast moves.
    const halfW = k.width() / 2;
    const targetX = Math.max(halfW, Math.min(LW - halfW, archie.pos.x));
    const curCam = k.camPos();
    const smoothedX = curCam.x + (targetX - curCam.x) * Math.min(1, 10 * k.dt());
    k.camPos(smoothedX, k.height() / 2);

    if (archie.pos.y > k.height() + 120) {
      coffeeHalves -= 2;
      popup(k.camPos(), "P0: FELL OFF THE ROADMAP", [255, 80, 80]);
      archie.pos = k.vec2(targetX, 80);
      if (coffeeHalves <= 0) burnoutCrash();
    }

    // ARCH-170: Layer 2 — the AWS Spider miniboss appears mid-level.
    if (idx === 1 && !awsSpiderSpawned && archie.pos.x > LW * 0.55) {
      awsSpiderSpawned = true;
      spawnAwsSpider();
      k.add([
        k.fixed(), k.text("!! THE OVERCOMPLICATED AWS DESIGN APPEARS !!", { size: 20 }),
        k.pos(k.width() / 2, 220), k.anchor("center"),
        k.color(168, 111, 208), k.outline(3, k.rgb(16, 16, 24)), k.z(90),
        k.lifespan(3, { fade: 0.8 }), k.opacity(1),
      ]);
    }

    // BOSS-201: Layer 3 Kafka Roach mini-boss appears at ~45% of level width.
    if (idx === 2 && !kafkaRoachSpawned && archie.pos.x > LW * 0.45) {
      kafkaRoachSpawned = true;
      spawnKafkaRoach();
      k.add([
        k.fixed(),
        k.text("!! THE KAFKA ROACH APPEARS !!\nSYNC/ASYNC PARADOX", { size: 20, align: "center" }),
        k.pos(k.width() / 2, 220),
        k.anchor("center"),
        k.color(0, 188, 212),
        k.outline(3, k.rgb(16, 16, 24)),
        k.z(90),
        k.lifespan(3.2, { fade: 0.8 }),
        k.opacity(1),
      ]);
    }

    // ARCH-261: Layer 4 — the SaaS / PaaS Shapeshifter miniboss appears mid-
    // level. Starts in SaaS humanoid form, transforms to PaaS turret every
    // ~9 seconds, with a 1-second invulnerability dust-burst between.
    if (idx === 3 && !shapeshifterSpawned && archie.pos.x > LW * 0.5) {
      shapeshifterSpawned = true;
      spawnShapeshifter();
      k.add([
        k.fixed(), k.text("!! THE SAAS / PAAS SHAPESHIFTER APPEARS !!", { size: 20 }),
        k.pos(k.width() / 2, 220), k.anchor("center"),
        k.color(200, 130, 70), k.outline(3, k.rgb(16, 16, 24)), k.z(90),
        k.lifespan(3, { fade: 0.8 }), k.opacity(1),
      ]);
    }

    // ARCH-130: cross the boss gate → the Layer's boss fight begins.
    if (!bossPhase && archie.pos.x > bossGateX) {
      bossPhase = true;
      spawnBoss();
      k.add([
        k.fixed(), k.text(`BOSS FIGHT\n${bossCfg.name}`, { size: 24, align: "center" }),
        k.pos(k.width() / 2, 160), k.anchor("center"),
        k.color(255, 90, 90), k.outline(3, k.rgb(16, 16, 24)), k.z(90),
        k.lifespan(3.2, { fade: 1 }), k.opacity(1),
      ]);
    }
  });

  // ---------------------------------------------------------------------------
  // ARCH-69: HUD.
  // ---------------------------------------------------------------------------
  const hud = k.add([k.fixed(), k.z(100)]);
  hud.onDraw(() => {
    // ARCH-188: Coffee Cup HUD — pixel-art sprites per the Sprite Manual.
    // Each slot picks cup_empty / cup_half / cup_full from coffeeHalves.
    for (let i = 0; i < 5; i++) {
      const cx = 16 + i * 34;
      const filled = Math.max(0, Math.min(2, coffeeHalves - i * 2));
      const cupSprite = filled === 0 ? "cup_empty" : filled === 1 ? "cup_half" : "cup_full";
      k.drawSprite({ sprite: cupSprite, pos: k.vec2(cx, 10), scale: k.vec2(2) });
    }

    // ARCH-274: DECRYPTING overlay — when a Credentials Villain's PASSWORD
    // shot lands, the coffee row briefly becomes a "DECRYPTING…" loading bar
    // (per the Layer 5 design ref). Coffee cups stay drawn underneath so the
    // player still tracks their HP, just visually obscured for ~1.6s.
    if (k.time() < archie.decryptingUntil) {
      const total = 1.6;
      const remaining = archie.decryptingUntil - k.time();
      const progress = 1 - Math.max(0, Math.min(1, remaining / total));
      // Darkening strip over the cup row
      k.drawRect({
        pos: k.vec2(10, 8), width: 5 * 34 + 4, height: 36,
        color: k.rgb(8, 8, 12), opacity: 0.75,
      });
      // Loading-bar background
      k.drawRect({
        pos: k.vec2(14, 16), width: 5 * 34 - 4, height: 8,
        color: k.rgb(30, 30, 40),
        outline: { width: 1, color: k.rgb(120, 200, 255) },
      });
      // Loading-bar fill
      k.drawRect({
        pos: k.vec2(15, 17), width: (5 * 34 - 6) * progress, height: 6,
        color: k.rgb(120, 200, 255),
      });
      // Flashing "DECRYPTING…" label
      if (Math.floor(k.time() * 5) % 2 === 0) {
        k.drawText({
          text: "DECRYPTING…", size: 11,
          pos: k.vec2(14, 28),
          color: k.rgb(200, 230, 255),
          outline: { width: 2, color: k.rgb(16, 16, 24) },
        });
      }
    }
    const load = archie.cognitiveLoad;
    const mult = (0.3 + load * 1.2).toFixed(2);
    k.drawText({ text: `COGNITIVE LOAD  —  DAMAGE x${mult}`, size: 12, pos: k.vec2(16, 50), color: k.rgb(220, 220, 220) });
    k.drawRect({ pos: k.vec2(16, 66), width: 240, height: 16, color: k.rgb(34, 34, 40) });
    k.drawRect({
      pos: k.vec2(18, 68), width: Math.max(1, 236 * load), height: 12,
      color: load > 0.65 ? k.rgb(255, 220, 80) : k.rgb(255, 140, 0),
    });
    k.drawText({
      text: `WEAPON [${weaponIdx + 1}]: ${WEAPONS[weaponIdx].name}`,
      size: 14, pos: k.vec2(16, 90), color: k.rgb(180, 230, 255),
      outline: { width: 2, color: k.rgb(16, 16, 24) },
    });
    // ARCH-189: Caffeine Points — primary currency. Drawn just below weapon
    // (avoiding the centered status banner line at y=110).
    k.drawText({
      text: `CAFFEINE: ${caffeinePoints} CP`,
      size: 13, pos: k.vec2(16, 128), color: k.rgb(255, 220, 100),
      outline: { width: 2, color: k.rgb(16, 16, 24) },
    });

    // ARCH-241: GDPR Violation HUD overlay — flashing "COMPLIANCE FINES"
    // tag next to the coffee cups + center banner + corner screen tint.
    // Active while the LGPD/GDPR Leech is attached.
    if (k.time() < archie.gdprUntil) {
      const flash = Math.floor(k.time() * 5) % 2 === 0;
      k.drawText({
        text: "COMPLIANCE FINES", size: 12,
        pos: k.vec2(190, 16),
        color: k.rgb(232, 76, 60),
        outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
      // Top-right corner red wash — exactly the "25% of screen covered" feel
      // from the mockup. Wash on, wash off (flashing).
      if (flash) {
        k.drawRect({
          pos: k.vec2(k.width() * 0.6, 0),
          width: k.width() * 0.4, height: k.height() * 0.45,
          color: k.rgb(255, 0, 0), opacity: 0.18,
        });
      }
      // Big center banner
      if (flash) {
        k.drawText({
          text: "!! GDPR VIOLATION !!", size: 28,
          pos: k.vec2(k.width() / 2, 160), anchor: "center",
          color: k.rgb(255, 60, 60),
          outline: { width: 3, color: k.rgb(16, 16, 24) },
        });
      }
    }
    k.drawText({
      text: `${theme.name}`, size: 13, pos: k.vec2(k.width() - 16, 40),
      anchor: "topright", color: k.rgb(...theme.accent),
      outline: { width: 2, color: k.rgb(16, 16, 24) },
    });
    k.drawText({
      text: `STORY POINTS: ${score}`, size: 20, pos: k.vec2(k.width() - 16, 14),
      anchor: "topright", color: k.rgb(217, 168, 106),
      outline: { width: 2, color: k.rgb(16, 16, 24) },
    });

    // ARCH-298: Layer 7 — COSMIC DEPRECATION ALERT + ADM Cycle progress
    // strip. 8 colored cells across the top center, each lit when its phase
    // has been completed in the current cycle, with a white outline on the
    // NEXT-expected cell. The boss form indicator sits below.
    if (idx === 6) {
      k.drawText({
        text: "COSMIC DEPRECATION ALERT", size: 11,
        pos: k.vec2(k.width() - 16, 62),
        anchor: "topright",
        color: k.rgb(220, 130, 240),
        outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
      const totalW = 8 * 26;
      const startX = k.width() / 2 - totalW / 2;
      for (let i = 0; i < 8; i++) {
        const [r, g, b] = ADM_COLORS[i];
        const done = i < admStep || k.time() < admVulnerableUntil;
        const isNext = i === admStep && k.time() >= admVulnerableUntil;
        k.drawRect({
          pos: k.vec2(startX + i * 26, 20), width: 22, height: 22,
          color: done ? k.rgb(r, g, b) : k.rgb(40, 40, 50),
          outline: {
            width: isNext ? 3 : 2,
            color: isNext ? k.rgb(255, 255, 255) : k.rgb(16, 16, 24),
          },
        });
        k.drawText({
          text: ADM_PHASES[i], size: 13,
          pos: k.vec2(startX + i * 26 + 11, 31), anchor: "center",
          color: done ? k.rgb(255, 255, 255) : k.rgb(120, 120, 130),
          outline: { width: 1, color: k.rgb(16, 16, 24) },
        });
      }
      // Boss-form mutation indicator
      if (bossRef && bossRef.exists()) {
        const formIdx = bossRef.formIdx ?? 0;
        k.drawText({
          text: `MUTATION ${formIdx + 1}/7`, size: 11,
          pos: k.vec2(k.width() / 2, 48), anchor: "center",
          color: k.rgb(220, 150, 240),
          outline: { width: 2, color: k.rgb(16, 16, 24) },
        });
      }
      // Vulnerability countdown banner
      if (k.time() < admVulnerableUntil) {
        const rem = Math.ceil(admVulnerableUntil - k.time());
        k.drawText({
          text: `BOSS VULNERABLE — ${rem}s`, size: 16,
          pos: k.vec2(k.width() / 2, 90), anchor: "center",
          color: k.rgb(133, 193, 233),
          outline: { width: 2, color: k.rgb(16, 16, 24) },
        });
      }
    }

    // ARCH-269: Layer 5 — VAULT LOCKDOWN STATUS indicator + DDoS Tide meter.
    // 8 cells colored red during the 5s flood and cyan during the 3s recede,
    // so the player can read "when to hammer" at a glance.
    if (idx === 4) {
      k.drawText({
        text: "VAULT LOCKDOWN STATUS", size: 11,
        pos: k.vec2(k.width() - 16, 62),
        anchor: "topright",
        color: isDdosFlood() ? k.rgb(232, 76, 60) : k.rgb(133, 193, 233),
        outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
      // 8-cell meter
      const phase = ddosPhase(); // 0..1 over the full DDOS_CYCLE
      const cellsLit = Math.min(8, Math.floor(phase * 8));
      const meterY = 78;
      const meterX = k.width() - 16 - 8 * 12;
      for (let i = 0; i < 8; i++) {
        const inFloodCell = i < Math.floor((DDOS_FLOOD_END / DDOS_CYCLE) * 8);
        const baseColor = inFloodCell ? k.rgb(232, 76, 60) : k.rgb(133, 193, 233);
        const dim = i <= cellsLit;
        k.drawRect({
          pos: k.vec2(meterX + i * 12, meterY),
          width: 10, height: 12,
          color: dim ? baseColor : k.rgb(50, 50, 60),
          outline: { width: 1, color: k.rgb(16, 16, 24) },
        });
      }
      // Phase label
      k.drawText({
        text: isDdosFlood() ? "FLOOD" : "RECEDE — NODE EXPOSED",
        size: 11,
        pos: k.vec2(k.width() - 16, 94),
        anchor: "topright",
        color: isDdosFlood() ? k.rgb(232, 76, 60) : k.rgb(150, 255, 150),
        outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
    }
    let status = "", scol = k.rgb(255, 255, 255);
    if (k.time() < archie.blessedUntil) {
      status = `CTO APPROVED — INVULNERABLE (${Math.ceil(archie.blessedUntil - k.time())}s)`;
      scol = k.rgb(255, 220, 80);
    } else if (k.time() < archie.espressoUntil) {
      status = `VENTI MODE — MAX CONTEXT (${Math.ceil(archie.espressoUntil - k.time())}s)`;
      scol = k.rgb(255, 120, 120);
    } else if (k.time() < archie.exposedUntil) {
      status = "EXPOSED — REGRESSION BUG WINDOW";
      scol = k.rgb(255, 80, 80);
    }
    if (status) {
      k.drawText({
        text: status, size: 16, pos: k.vec2(k.width() / 2, 110),
        anchor: "center", color: scol, outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
    }
    if (bossRef && bossRef.exists()) {
      k.drawRect({ pos: k.vec2(120, 524), width: 560, height: 18, color: k.rgb(34, 34, 40) });
      k.drawRect({
        pos: k.vec2(122, 526), width: Math.max(1, 556 * (bossRef.hp() / bossRef.maxHp)),
        height: 14, color: k.rgb(255, 90, 90),
      });
      k.drawText({
        text: bossCfg.name, size: 12, pos: k.vec2(400, 508), anchor: "center",
        color: k.rgb(255, 120, 120), outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
    }
    k.drawText({
      text: "ARROWS: MOVE/JUMP   SPACE: ATTACK (hold for Wand)   1/2/3: WEAPON",
      size: 12, pos: k.vec2(16, k.height() - 22), color: k.rgb(150, 150, 160),
    });
  });

  // ARCH-120: cinematic lighting pass.
  const lighting = k.add([k.fixed(), k.z(94)]);
  lighting.onDraw(() => {
    k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(...theme.accent), opacity: 0.05 });
    k.drawSprite({ sprite: "vignette", pos: k.vec2(0, 0), scale: k.vec2(4) });
  });

  // ARCH-107: CTO blessing aura.
  k.onDraw(() => {
    if (k.time() < archie.blessedUntil) {
      const pulse = 44 + Math.sin(k.time() * 12) * 6;
      k.drawCircle({ pos: archie.pos, radius: pulse, color: k.rgb(255, 220, 80), opacity: 0.25 });
      k.drawText({
        text: "CTO: APPROVED", size: 12, pos: archie.pos.add(0, -64),
        anchor: "center", color: k.rgb(255, 230, 120),
        outline: { width: 2, color: k.rgb(16, 16, 24) },
      });
    }
  });

  // ARCH-131: opening title card for the Layer.
  k.add([
    k.fixed(), k.text(theme.name, { size: 26 }),
    k.pos(k.width() / 2, 150), k.anchor("center"),
    k.color(...theme.accent), k.outline(3, k.rgb(16, 16, 24)), k.z(90),
    k.lifespan(3, { fade: 0.8 }), k.opacity(1),
  ]);
});

// =============================================================================
// SCENE: intermission — tally the score, ask before descending further.
// =============================================================================
k.scene("intermission", (data: { idx: number; score: number }) => {
  const cleared = SEGMENTS[data.idx];
  const hasNext = data.idx + 1 < SEGMENTS.length;
  const next = hasNext ? SEGMENTS[data.idx + 1] : null;

  k.add([
    k.rect(k.width(), k.height()), k.pos(0, 0), k.color(14, 12, 20),
  ]);
  k.add([
    k.text(`${cleared.name}\nCLEARED`, { size: 30, align: "center" }),
    k.pos(k.width() / 2, 130), k.anchor("center"),
    k.color(...cleared.accent), k.outline(4, k.rgb(8, 8, 12)),
  ]);
  k.add([
    k.text("LAYER CLEAR BONUS  ............  +1000", { size: 18 }),
    k.pos(k.width() / 2, 230), k.anchor("center"), k.color(150, 230, 150),
  ]);
  k.add([
    k.text(`TOTAL STORY POINTS:  ${data.score}`, { size: 26 }),
    k.pos(k.width() / 2, 290), k.anchor("center"), k.color(217, 168, 106),
    k.outline(3, k.rgb(8, 8, 12)),
  ]);
  k.add([
    k.text(
      hasNext
        ? `Next: ${next!.name}\n\nPress SPACE to descend deeper.\nPress ESC to walk away (you can't).`
        : "Every Layer of Architecture Hell: cleared.\n\nPress SPACE for the final descent.",
      { size: 18, align: "center", width: 640 },
    ),
    k.pos(k.width() / 2, 420), k.anchor("center"), k.color(220, 220, 230),
  ]);
  // ARCH-132: pulsing prompt.
  const prompt = k.add([
    k.text(">> PRESS SPACE <<", { size: 22 }),
    k.pos(k.width() / 2, 520), k.anchor("center"), k.color(255, 240, 120),
    k.opacity(1),
  ]);
  prompt.onUpdate(() => {
    prompt.opacity = 0.5 + Math.sin(k.time() * 6) * 0.5;
  });

  k.onKeyPress("space", () => {
    if (hasNext) k.go("briefing", { idx: data.idx + 1, score: data.score });
    else k.go("win", data.score);
  });
});

// =============================================================================
// SCENE: win
// =============================================================================
// =============================================================================
// SCENE: briefing — pre-level dossier. One page per layer.
// Layout: header band → LORE → THREATS → SUPPLIES → BOSS INTEL → prompt.
// =============================================================================
k.scene("briefing", (data: { idx: number; score: number }) => {
  const seg  = SEGMENTS[data.idx];
  const info = BRIEFINGS[data.idx];
  const W = k.width();   // 800
  const H = k.height();  // 600

  // ── background + scanlines ────────────────────────────────────────────────
  k.add([k.rect(W, H), k.pos(0, 0), k.color(10, 8, 18)]);
  for (let y = 0; y < H; y += 4)
    k.add([k.rect(W, 1), k.pos(0, y), k.color(0, 0, 0), k.opacity(0.15)]);

  // ── header (h=44) ─────────────────────────────────────────────────────────
  k.add([k.rect(W, 44), k.pos(0, 0), k.color(...seg.sky)]);
  k.add([
    k.text(`◈  ${seg.name}  ◈`, { size: 20 }),
    k.pos(W / 2, 22), k.anchor("center"),
    k.color(...seg.accent), k.outline(3, k.rgb(0, 0, 0)),
  ]);

  // ── vertical centre divider ────────────────────────────────────────────────
  k.add([k.rect(1, H - 44 - 38), k.pos(W / 2, 44), k.color(50, 44, 70)]);

  // ── helper: labelled section block at a fixed Y ────────────────────────────
  //  Returns nothing — Y positions are hardcoded per block below.
  const L = 28;          // left column x
  const R = W / 2 + 20;  // right column x
  const CW = W / 2 - 48; // column content width (≈376px each)
  const FS = 11;         // body font size — small enough to avoid overflow

  function head(x: number, y: number, label: string, col: [number,number,number]) {
    k.add([k.rect(CW, 1), k.pos(x, y - 2), k.color(...col), k.opacity(0.6)]);
    k.add([
      k.text(label, { size: 13 }),
      k.pos(x, y), k.color(...col), k.outline(2, k.rgb(0, 0, 0)),
    ]);
  }
  function txt(x: number, y: number, t: string) {
    k.add([k.text(t, { size: FS, width: CW }), k.pos(x, y), k.color(205, 205, 220)]);
  }

  // ── LEFT COLUMN ────────────────────────────────────────────────────────────
  // SITUATION REPORT  y=50..175
  head(L, 50, "▸ SITUATION REPORT", [255, 230, 120]);
  txt(L, 68, info.lore);

  // BOSS INTEL  y=220..360
  head(L, 218, "▸ BOSS INTEL", [255, 100, 100]);
  txt(L, 236, info.bossIntel);

  // ARSENAL reminder  y=380..460
  head(L, 374, "▸ ARSENAL", [140, 180, 255]);
  txt(L, 392,
    "[1] Blueprint  — barrier, low dmg\n" +
    "[2] Hammer     — heavy; destroys DS blocks\n" +
    "    HOLD SPACE 0.9s → OVERLOAD (self-dmg!)\n" +
    "[3] Wand       — AOE beam drain");

  // ── RIGHT COLUMN ───────────────────────────────────────────────────────────
  // ACTIVE THREATS  y=50..190
  head(R, 50, "▸ ACTIVE THREATS", [255, 130, 100]);
  txt(R, 68, info.threats.map(t => `• ${t}`).join("\n"));

  // AVAILABLE SUPPLIES  y=235..310
  head(R, 232, "▸ SUPPLIES", [120, 220, 150]);
  txt(R, 250, info.supplies.map(s => `• ${s}`).join("\n"));

  // CONTROLS  y=370..460
  head(R, 372, "▸ CONTROLS", [180, 180, 255]);
  txt(R, 390,
    "← → Move     ↑ Jump (↑↑ = double jump)\n" +
    "SPACE Attack  1 / 2 / 3 Switch weapon\n" +
    "SPACE (hold)  Hammer charge / Wand drain");

  // ── footer bar ─────────────────────────────────────────────────────────────
  k.add([k.rect(W, 38), k.pos(0, H - 38), k.color(...seg.sky), k.opacity(0.45)]);
  k.add([
    k.text(`STORY POINTS: ${data.score}   |   NEXT DEPLOYMENT: ${seg.name}`, { size: 12 }),
    k.pos(W / 2, H - 20), k.anchor("center"), k.color(180, 180, 200),
  ]);

  // ── pulsing prompt ─────────────────────────────────────────────────────────
  const prompt = k.add([
    k.text(">> PRESS SPACE TO DEPLOY <<", { size: 17 }),
    k.pos(W / 2, H - 62), k.anchor("center"),
    k.color(...seg.accent), k.outline(3, k.rgb(0, 0, 0)), k.opacity(1),
  ]);
  prompt.onUpdate(() => { prompt.opacity = 0.5 + Math.sin(k.time() * 5) * 0.5; });

  k.onKeyPress("space", () => k.go("level", { idx: data.idx, score: data.score }));
  k.onKeyPress("enter", () => k.go("level", { idx: data.idx, score: data.score }));
});

k.scene("win", (score: number) => {
  k.add([k.rect(k.width(), k.height()), k.pos(0, 0), k.color(10, 16, 12)]);
  k.add([
    k.text(
      `REFACTOR PATCH DEPLOYED.\n\nAll seven Layers of Architecture Hell: survived.\nThe Legacy Monolith: refactored.\n\nFinal Story Points: ${score}\n\n(A new ticket has already been assigned to you.)\n\nPress R to descend again.`,
      { size: 24, align: "center", width: 700 },
    ),
    k.pos(k.width() / 2, k.height() / 2), k.anchor("center"),
    k.color(58, 208, 122),
  ]);
  k.onKeyPress("r", () => k.go("title"));
});

// =============================================================================
// ARCH-400: TITLE SCREEN — Start Game / Options. Visual splash with Archie + Blueprint.
// =============================================================================
k.scene("title", () => {
  const W = k.width(), H = k.height();

  // ── Background ──────────────────────────────────────────────────────────────
  k.add([k.rect(W, H), k.pos(0, 0), k.color(6, 4, 18)]);
  // Subtle scanlines
  for (let y = 0; y < H; y += 4)
    k.add([k.rect(W, 1), k.pos(0, y), k.color(255, 255, 255), k.opacity(0.03)]);

  // Dim ground stripe at the bottom so sprites "stand on" something
  k.add([k.rect(W, 28), k.pos(0, H - 28), k.color(20, 16, 36)]);
  k.add([k.rect(W, 2), k.pos(0, H - 28), k.color(192, 58, 43), k.opacity(0.5)]);

  // ── Title ───────────────────────────────────────────────────────────────────
  k.add([
    k.text("THE\nARCHITECT'S\nDESCENT", { size: 64, align: "center" }),
    k.pos(W / 2, 126), k.anchor("center"),
    k.color(192, 58, 43), k.outline(4, k.rgb(0, 0, 0)), k.z(10),
  ]);

  // ── ARCHIE — left side, animated walk cycle ──────────────────────────────
  const ARCHIE_SC = 9;
  const archieX = 120;
  const archieY = H - 28 - 34; // "feet on the ground stripe"
  const archieSprite = k.add([
    k.sprite("archie"), k.pos(archieX, archieY),
    k.anchor("bot"), k.scale(ARCHIE_SC), k.z(8),
  ]);
  let runT = 0;
  let currentFrame = "archie";
  archieSprite.onUpdate(() => {
    runT += k.dt();
    // 2-frame run cycle at ~8fps
    const frame = Math.floor(runT * 8) % 2 === 0 ? "archie_run_a" : "archie_run_b";
    const bob = Math.sin(runT * 16) * 0.06;
    archieSprite.scale = k.vec2(ARCHIE_SC * (1 - bob * 0.4), ARCHIE_SC * (1 + bob));
    if (frame !== currentFrame) {
      const asset = k.getSprite(frame);
      if (asset && (asset as any).loaded !== false) {
        archieSprite.use(k.sprite(frame));
        currentFrame = frame;
      }
    }
  });
  // "ARCHIE" label under the sprite
  k.add([
    k.text("ARCHIE", { size: 13 }),
    k.pos(archieX, H - 10), k.anchor("center"),
    k.color(160, 180, 220), k.opacity(0.8), k.z(10),
  ]);

  // ── BLUEPRINT — right side, floating gently ──────────────────────────────
  const BPSC = 9;
  const bpX = W - 110;
  const bpBaseY = H - 28 - 64;
  const blueprint = k.add([
    k.sprite("blueprint"), k.pos(bpX, bpBaseY),
    k.anchor("center"), k.scale(BPSC), k.z(8),
  ]);
  blueprint.onUpdate(() => {
    blueprint.pos.y = bpBaseY + Math.sin(k.time() * 2.2) * 8;
    // Gentle sway via scale (no rotate component added, so we can't tilt)
    const sway = Math.sin(k.time() * 1.4) * 0.03;
    blueprint.scale = k.vec2(BPSC * (1 + sway), BPSC * (1 - sway * 0.5));
  });
  k.add([
    k.text("BLUEPRINT", { size: 13 }),
    k.pos(bpX, H - 10), k.anchor("center"),
    k.color(120, 180, 255), k.opacity(0.8), k.z(10),
  ]);

  // ── Decorative weapons row — centre bottom ────────────────────────────────
  const weapons = [
    { name: "hammer", color: k.rgb(210, 140, 60) },
    { name: "wand",   color: k.rgb(120, 200, 255) },
    { name: "bean",   color: k.rgb(200, 160, 80)  },
  ];
  weapons.forEach((w, i) => {
    const wx = W / 2 - 60 + i * 60;
    const wBaseY = H - 28 - 28;
    const ws = k.add([
      k.sprite(w.name), k.pos(wx, wBaseY),
      k.anchor("center"), k.scale(5), k.color(w.color.r, w.color.g, w.color.b), k.z(7),
    ]);
    ws.onUpdate(() => {
      ws.pos.y = wBaseY + Math.sin(k.time() * 2.5 + i * 1.2) * 5;
    });
  });

  // ── Menu items ───────────────────────────────────────────────────────────
  const startY = 440;
  const menuDefs = [
    { label: "(1)  START GAME", col: k.rgb(80, 220, 120) },
    { label: "(2)  OPTIONS",    col: k.rgb(90,  160, 200) },
  ];
  const menuTexts = menuDefs.map((m, i) => {
    return k.add([
      k.text(m.label, { size: 28 }),
      k.pos(W / 2, startY + i * 62), k.anchor("center"),
      k.color(m.col.r, m.col.g, m.col.b), k.outline(2, k.rgb(0, 0, 0)),
      k.opacity(1), k.z(12),
    ]);
  });
  menuTexts.forEach((t, i) => {
    t.onUpdate(() => { t.opacity = 0.72 + Math.sin(k.time() * 3.2 + i * 1.8) * 0.28; });
  });

  k.onKeyPress("1", () => {
    difficulty = "easy";
    k.go("briefing", { idx: 0, score: 0 });
  });
  k.onKeyPress("2", () => k.go("options"));
});

// =============================================================================
// ARCH-401: OPTIONS SCREEN — Easy vs Super Archie difficulty selection.
// Two-column layout: sprite art left/right, stat text in the middle.
// =============================================================================
k.scene("options", () => {
  const W = k.width(), H = k.height();
  k.add([k.rect(W, H), k.pos(0, 0), k.color(6, 4, 18)]);
  for (let y = 0; y < H; y += 4)
    k.add([k.rect(W, 1), k.pos(0, y), k.color(255, 255, 255), k.opacity(0.04)]);

  // Thin accent line under header
  k.add([k.text("SELECT DIFFICULTY", { size: 34 }),
    k.pos(W / 2, 46), k.anchor("center"),
    k.color(200, 200, 230), k.outline(3, k.rgb(0, 0, 0)), k.z(10)]);
  k.add([k.rect(W - 80, 2), k.pos(40, 76), k.color(70, 60, 100), k.opacity(0.8)]);

  // Vertical divider between the two columns
  k.add([k.rect(2, H - 120), k.pos(W / 2, 86), k.color(60, 50, 90), k.opacity(0.8)]);

  // ── LEFT COLUMN: EASY ─────────────────────────────────────────────────────
  const LX = W / 4;   // centre of left column (200px)

  // Archie sprite — idle breathing
  const eArchie = k.add([
    k.sprite("archie"), k.pos(LX, 200),
    k.anchor("center"), k.scale(10), k.z(8),
  ]);
  eArchie.onUpdate(() => {
    const b = Math.sin(k.time() * 2.1) * 0.018;
    eArchie.scale = k.vec2(10 * (1 - b), 10 * (1 + b));
  });
  k.add([k.text("ARCHIE", { size: 11 }),
    k.pos(LX, 248), k.anchor("center"), k.color(160, 220, 170), k.z(10)]);

  // Blueprint floating beside Archie
  const eBp = k.add([
    k.sprite("blueprint"), k.pos(LX + 66, 188),
    k.anchor("center"), k.scale(5.5), k.z(7),
  ]);
  eBp.onUpdate(() => { eBp.pos.y = 188 + Math.sin(k.time() * 2.4) * 6; });
  k.add([k.text("BLUEPRINT", { size: 10 }),
    k.pos(LX + 66, 216), k.anchor("center"), k.color(120, 180, 255), k.z(10)]);

  // Cup icon — 5 cups = full health
  for (let i = 0; i < 5; i++) {
    k.add([k.sprite("cup_full"),
      k.pos(LX - 48 + i * 22, 276),
      k.anchor("center"), k.scale(2.8), k.z(8)]);
  }

  // Easy title & stats
  k.add([k.text("(1)  EASY", { size: 28 }),
    k.pos(LX, 316), k.anchor("center"),
    k.color(80, 220, 120), k.outline(2, k.rgb(0, 0, 0)), k.z(10)]);
  k.add([k.text(
    "5 coffee cups\nNormal enemy speed\nNormal enemy HP\nNormal enemy count\nFull item drops",
    { size: 14, align: "center", width: 220 }),
    k.pos(LX, 390), k.anchor("center"),
    k.color(160, 220, 170), k.z(10)]);

  // ── RIGHT COLUMN: SUPER ARCHIE ────────────────────────────────────────────
  const RX = W * 3 / 4;  // centre of right column (600px)

  // Archie sprite — red-tinted, scale pulsing (danger feel)
  const sArchie = k.add([
    k.sprite("archie"), k.pos(RX, 200),
    k.anchor("center"), k.scale(10), k.color(255, 100, 100), k.z(8),
  ]);
  let sRunT = 0;
  let sCurFrame = "archie";
  sArchie.onUpdate(() => {
    sRunT += k.dt();
    const frame = Math.floor(sRunT * 10) % 2 === 0 ? "archie_run_a" : "archie_run_b";
    const b = Math.sin(sRunT * 18) * 0.08;
    sArchie.scale = k.vec2(10 * (1 - b * 0.5), 10 * (1 + b));
    if (frame !== sCurFrame) {
      const asset = k.getSprite(frame);
      if (asset && (asset as any).loaded !== false) {
        sArchie.use(k.sprite(frame));
        sCurFrame = frame;
      }
    }
  });
  k.add([k.text("SUPER ARCHIE", { size: 11 }),
    k.pos(RX, 248), k.anchor("center"), k.color(255, 140, 140), k.z(10)]);

  // Hammer beside — symbol of punishment
  const hammer = k.add([
    k.sprite("hammer"), k.pos(RX + 64, 192),
    k.anchor("center"), k.scale(5.5), k.color(210, 100, 60), k.z(7),
  ]);
  hammer.onUpdate(() => { hammer.pos.y = 192 + Math.sin(k.time() * 2.8 + 1) * 7; });
  k.add([k.text("HAMMER", { size: 10 }),
    k.pos(RX + 64, 218), k.anchor("center"), k.color(210, 120, 80), k.z(10)]);

  // Cup row — only 2.5 cups (show 2 full, 1 half-faded)
  for (let i = 0; i < 5; i++) {
    k.add([k.sprite("cup_full"),
      k.pos(RX - 48 + i * 22, 276),
      k.anchor("center"), k.scale(2.8),
      k.color(i < 2 ? 255 : 100, i < 2 ? 255 : 100, i < 2 ? 255 : 100),
      k.opacity(i < 3 ? 1.0 : 0.18),
      k.z(8)]);
  }
  // Red "½" label over the partial cup
  k.add([k.text("½", { size: 12 }),
    k.pos(RX - 48 + 2 * 22, 264), k.anchor("center"),
    k.color(255, 80, 80), k.opacity(0.9), k.z(10)]);

  // Super title & stats
  k.add([k.text("(2)  SUPER ARCHIE", { size: 22 }),
    k.pos(RX, 316), k.anchor("center"),
    k.color(230, 80, 80), k.outline(2, k.rgb(0, 0, 0)), k.z(10)]);
  k.add([k.text(
    "½ coffee cups\nEnemies 50% faster\nEnemies take 2× hits\n50% more enemies\n50% fewer pickups",
    { size: 14, align: "center", width: 220 }),
    k.pos(RX, 390), k.anchor("center"),
    k.color(230, 160, 160), k.z(10)]);

  // ── Footer ────────────────────────────────────────────────────────────────
  k.add([k.text("ESC / BACKSPACE — Back to title", { size: 13 }),
    k.pos(W / 2, H - 22), k.anchor("center"),
    k.color(100, 100, 130), k.opacity(0.7), k.z(10)]);

  k.onKeyPress("1", () => { difficulty = "easy";  k.go("briefing", { idx: 0, score: 0 }); });
  k.onKeyPress("2", () => { difficulty = "super"; k.go("briefing", { idx: 0, score: 0 }); });
  k.onKeyPress("escape",    () => k.go("title"));
  k.onKeyPress("backspace", () => k.go("title"));
});

// ARCH-71: boot into the title screen.
k.go("title");
