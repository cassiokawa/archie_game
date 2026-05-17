// ASSET-1138: Graphics department lost funding. Rendering SVGs directly
// from the terminal to save budget. (`#` color codes break un-encoded
// data:image/svg+xml URIs because `#` starts a URL fragment — we URL-encode
// the SVG body so browsers actually parse the thing.)
// ASSET-1141: Browsers give SVGs with only a viewBox a naturalWidth of 0,
// which makes kaboom texture them at 0×0 (invisible). Always emit explicit
// width/height so the asset loader gets a real bitmap to upload.
const wrapSVG = (svgContent: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ARCHIE — Idle pose. Red hardhat, gray suit, anxious energy.
// All poses share the same head/face/torso block (rows 0–13) and differ
// only in leg arrangement at rows 14–15.
const ARCHIE_HEAD_TORSO = `
  <rect x="4" y="2" width="8" height="4" fill="#E74C3C"/>
  <rect x="2" y="6" width="12" height="2" fill="#E74C3C"/>
  <rect x="5" y="8" width="6" height="4" fill="#FAD7A1"/>
  <rect x="6" y="9" width="1" height="1" fill="#000"/>
  <rect x="10" y="9" width="1" height="1" fill="#000"/>
  <rect x="4" y="12" width="8" height="2" fill="#5D6D7E"/>
  <rect x="7" y="12" width="2" height="2" fill="#FFFFFF"/>
  <rect x="7" y="13" width="2" height="1" fill="#E74C3C"/>
`;

export const archie_idle = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <rect x="4" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="9" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="4" y="15" width="3" height="1" fill="#000"/>
  <rect x="9" y="15" width="3" height="1" fill="#000"/>
`);

// ARCHIE — Run pose A (wide stance, feet apart). Pairs with run_b for a
// classic 2-frame run cycle.
export const archie_run_a = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <rect x="2" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="11" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="2" y="15" width="3" height="1" fill="#000"/>
  <rect x="11" y="15" width="3" height="1" fill="#000"/>
`);

// ARCHIE — Run pose B (close stance, passing frame).
export const archie_run_b = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <rect x="5" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="8" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="5" y="15" width="3" height="1" fill="#000"/>
  <rect x="8" y="15" width="3" height="1" fill="#000"/>
`);

// ARCHIE — Jump pose. Legs tucked up + arms slightly raised (extra red pixels
// at shoulders to suggest arms swung up).
export const archie_jump_pose = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <rect x="2" y="11" width="2" height="2" fill="#E74C3C"/>
  <rect x="12" y="11" width="2" height="2" fill="#E74C3C"/>
  <rect x="5" y="14" width="2" height="1" fill="#5D6D7E"/>
  <rect x="9" y="14" width="2" height="1" fill="#5D6D7E"/>
  <rect x="5" y="15" width="2" height="1" fill="#000"/>
  <rect x="9" y="15" width="2" height="1" fill="#000"/>
`);

// ARCHIE — Fall pose. Legs spread wide, eyes wider (panic).
export const archie_fall_pose = wrapSVG(`
  <rect x="4" y="2" width="8" height="4" fill="#E74C3C"/>
  <rect x="2" y="6" width="12" height="2" fill="#E74C3C"/>
  <rect x="5" y="8" width="6" height="4" fill="#FAD7A1"/>
  <rect x="5" y="9" width="2" height="2" fill="#000"/>
  <rect x="9" y="9" width="2" height="2" fill="#000"/>
  <rect x="4" y="12" width="8" height="2" fill="#5D6D7E"/>
  <rect x="7" y="12" width="2" height="2" fill="#FFFFFF"/>
  <rect x="7" y="13" width="2" height="1" fill="#E74C3C"/>
  <rect x="2" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="11" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="2" y="15" width="3" height="1" fill="#000"/>
  <rect x="11" y="15" width="3" height="1" fill="#000"/>
`);

// ARCHIE — Drink pose. Idle stance + a small red coffee cup beside the face
// with a white steam line above it. Eyes squinted (content sip).
export const archie_drink_pose = wrapSVG(`
  <rect x="4" y="2" width="8" height="4" fill="#E74C3C"/>
  <rect x="2" y="6" width="12" height="2" fill="#E74C3C"/>
  <rect x="5" y="8" width="6" height="4" fill="#FAD7A1"/>
  <rect x="6" y="10" width="1" height="1" fill="#000"/>
  <rect x="10" y="10" width="1" height="1" fill="#000"/>
  <rect x="11" y="7" width="3" height="3" fill="#CB4335"/>
  <rect x="11" y="7" width="3" height="1" fill="#A93226"/>
  <rect x="14" y="8" width="1" height="2" fill="#CB4335"/>
  <rect x="12" y="5" width="1" height="2" fill="#FFFFFF"/>
  <rect x="4" y="12" width="8" height="2" fill="#5D6D7E"/>
  <rect x="7" y="12" width="2" height="2" fill="#FFFFFF"/>
  <rect x="7" y="13" width="2" height="1" fill="#E74C3C"/>
  <rect x="4" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="9" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="4" y="15" width="3" height="1" fill="#000"/>
  <rect x="9" y="15" width="3" height="1" fill="#000"/>
`);

// ARCHIE — Crouch pose. Hat stays, torso compressed, legs bent wide and low.
// Visually reads as a fast dodge-duck; feet stay on the ground line.
export const archie_crouch = wrapSVG(`
  <!-- Hat — same crown + brim as idle so the silhouette is recognisable -->
  <rect x="4" y="2" width="8" height="4" fill="#E74C3C"/>
  <rect x="2" y="6" width="12" height="2" fill="#E74C3C"/>
  <!-- Face — compressed one row lower than idle -->
  <rect x="5" y="8" width="6" height="3" fill="#FAD7A1"/>
  <rect x="6" y="9" width="1" height="1" fill="#000"/>
  <rect x="10" y="9" width="1" height="1" fill="#000"/>
  <!-- Gritted mouth -->
  <rect x="7" y="10" width="2" height="1" fill="#8B4444"/>
  <!-- Torso — shorter/squashed, wide shoulder hints -->
  <rect x="3" y="11" width="10" height="2" fill="#5D6D7E"/>
  <rect x="7" y="11" width="2" height="2" fill="#FFFFFF"/>
  <rect x="7" y="12" width="2" height="1" fill="#E74C3C"/>
  <!-- Arms dropped to sides -->
  <rect x="1" y="11" width="2" height="2" fill="#E74C3C"/>
  <rect x="13" y="11" width="2" height="2" fill="#E74C3C"/>
  <!-- Bent legs — thighs splayed outward, feet planted -->
  <rect x="2" y="13" width="4" height="2" fill="#5D6D7E"/>
  <rect x="10" y="13" width="4" height="2" fill="#5D6D7E"/>
  <!-- Feet / shoes flat on the ground -->
  <rect x="1" y="15" width="5" height="1" fill="#000"/>
  <rect x="10" y="15" width="5" height="1" fill="#000"/>
`);

// =============================================================================
// ARCH-420: WHACK / SHIELD sprite set — implementing the dual-mode blueprint
// design from the spritesheet (image_3.png). All frames share the standard
// ARCHIE_HEAD_TORSO block; only the arm/weapon pixels differ.
// =============================================================================

// ARCHIE — Whack wind-up. Blueprint rolled like a bat, raised over right
// shoulder at diagonal. Body weight shifted back, left leg planted.
export const archie_whack_wind = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <!-- Right arm raised -->
  <rect x="11" y="11" width="2" height="2" fill="#FAD7A1"/>
  <!-- Rolled blueprint (bat) held at shoulder, diagonal: top-right to mid -->
  <rect x="13" y="3"  width="2" height="2" fill="#1A5276"/>
  <rect x="13" y="5"  width="2" height="2" fill="#2E86C1"/>
  <rect x="12" y="7"  width="2" height="2" fill="#2E86C1"/>
  <rect x="12" y="9"  width="2" height="2" fill="#3498DB"/>
  <rect x="12" y="9"  width="3" height="1" fill="#AED6F1"/>
  <!-- Tape band -->
  <rect x="12" y="11" width="3" height="1" fill="#FDFEFE"/>
  <!-- Weight-back: left foot back, right forward -->
  <rect x="3" y="14"  width="3" height="2" fill="#5D6D7E"/>
  <rect x="10" y="14" width="3" height="2" fill="#5D6D7E"/>
  <rect x="3" y="15"  width="3" height="1" fill="#000"/>
  <rect x="10" y="15" width="3" height="1" fill="#000"/>
`);

// ARCHIE — Whack mid-swing. Blueprint extended forward-right horizontally.
// Trailing arc effect is drawn in Kaboom (separate additive circles/particles).
export const archie_whack_swing = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <!-- Right arm extended -->
  <rect x="11" y="12" width="2" height="2" fill="#FAD7A1"/>
  <!-- Rolled blueprint horizontal, sweeping right -->
  <rect x="11" y="10" width="5" height="2" fill="#2E86C1"/>
  <rect x="11" y="10" width="5" height="1" fill="#AED6F1"/>
  <rect x="13" y="10" width="1" height="2" fill="#FDFEFE"/>
  <!-- Cyan impact flash pixel at tip -->
  <rect x="15" y="9"  width="1" height="4" fill="#85C1E9"/>
  <!-- Legs braced wide for momentum -->
  <rect x="2" y="14"  width="4" height="2" fill="#5D6D7E"/>
  <rect x="10" y="14" width="4" height="2" fill="#5D6D7E"/>
  <rect x="2" y="15"  width="4" height="1" fill="#000"/>
  <rect x="10" y="15" width="4" height="1" fill="#000"/>
`);

// ARCHIE — Shield hold. Unrolled blueprint raised like a panel in front.
// The large cyan diagram panel sits left-of-body; the Kaboom scene adds the
// protective bubble circle on top (drawn in spawnShieldBubble()).
export const archie_shield = wrapSVG(`
  ${ARCHIE_HEAD_TORSO}
  <!-- Blueprint panel (unrolled, held left-forward): cyan background -->
  <rect x="0" y="3"  width="5" height="12" fill="#1A5276"/>
  <rect x="0" y="3"  width="4" height="12" fill="#2471A3"/>
  <!-- Diagram lines: horizontal rails -->
  <rect x="1" y="5"  width="3" height="1" fill="#5DADE2"/>
  <rect x="1" y="8"  width="3" height="1" fill="#5DADE2"/>
  <rect x="1" y="11" width="3" height="1" fill="#5DADE2"/>
  <!-- Diagram nodes: tiny white dots -->
  <rect x="1" y="6"  width="1" height="1" fill="#AED6F1"/>
  <rect x="3" y="6"  width="1" height="1" fill="#AED6F1"/>
  <rect x="2" y="9"  width="1" height="1" fill="#AED6F1"/>
  <rect x="1" y="12" width="1" height="1" fill="#AED6F1"/>
  <rect x="3" y="12" width="1" height="1" fill="#AED6F1"/>
  <!-- Vertical connector -->
  <rect x="2" y="6"  width="1" height="3" fill="#5DADE2"/>
  <!-- Left arm holding the panel -->
  <rect x="4" y="11" width="2" height="2" fill="#FAD7A1"/>
  <!-- Legs: standing firm -->
  <rect x="4" y="14"  width="3" height="2" fill="#5D6D7E"/>
  <rect x="9" y="14"  width="3" height="2" fill="#5D6D7E"/>
  <rect x="4" y="15"  width="3" height="1" fill="#000"/>
  <rect x="9" y="15"  width="3" height="1" fill="#000"/>
`);

// ARCHIE — Damage / knocked-back pose. Hat tilted, body angled, eyes wide,
// legs flying apart. Used when Archie takes a heavy hit.
export const archie_damage = wrapSVG(`
  <!-- Hat (tilted right) -->
  <rect x="5" y="0"  width="8" height="3" fill="#E74C3C"/>
  <rect x="4" y="3"  width="10" height="2" fill="#E74C3C"/>
  <!-- Wide eyes (shock) -->
  <rect x="5" y="7"  width="6" height="4" fill="#FAD7A1"/>
  <rect x="5" y="8"  width="2" height="2" fill="#000"/>
  <rect x="9" y="8"  width="2" height="2" fill="#000"/>
  <!-- Body angled -->
  <rect x="4" y="11" width="8" height="2" fill="#5D6D7E"/>
  <rect x="6" y="11" width="2" height="2" fill="#FFFFFF"/>
  <rect x="6" y="12" width="2" height="1" fill="#E74C3C"/>
  <!-- Arms flying out -->
  <rect x="1" y="10" width="3" height="2" fill="#E74C3C"/>
  <rect x="12" y="10" width="3" height="2" fill="#E74C3C"/>
  <!-- Legs splayed wide -->
  <rect x="2" y="13"  width="3" height="3" fill="#5D6D7E"/>
  <rect x="11" y="13" width="3" height="3" fill="#5D6D7E"/>
  <rect x="1" y="15"  width="4" height="1" fill="#000"/>
  <rect x="11" y="15" width="4" height="1" fill="#000"/>
`);

// SCOPE CREEP — green amorphous blob.
export const scope_creep = wrapSVG(`
  <rect x="3" y="6" width="10" height="10" fill="#229954"/>
  <rect x="2" y="8" width="12" height="8" fill="#27AE60"/>
  <rect x="4" y="10" width="2" height="2" fill="#000"/>
  <rect x="10" y="10" width="2" height="2" fill="#000"/>
  <rect x="5" y="13" width="6" height="1" fill="#145A32"/>
`);

// THE BLUEPRINT (BAT) — rolled-up cyan schematic, reinforced with white tape.
export const weapon_blueprint = wrapSVG(`
  <rect x="12" y="2" width="2" height="12" fill="#2980B9"/>
  <rect x="11" y="2" width="2" height="12" fill="#3498DB"/>
  <rect x="11" y="8" width="3" height="2" fill="#FFF"/>
  <rect x="11" y="3" width="3" height="1" fill="#BDC3C7"/>
`);

// REFACTORING HAMMER (MJOLNIR) — heavy grey head, short brown handle, blue spark.
export const weapon_hammer = wrapSVG(`
  <rect x="7" y="8" width="2" height="8" fill="#8B4513"/>
  <rect x="6" y="15" width="4" height="1" fill="#7F8C8D"/>
  <rect x="3" y="2" width="10" height="6" fill="#95A5A6"/>
  <rect x="2" y="3" width="12" height="4" fill="#7F8C8D"/>
  <rect x="4" y="2" width="8" height="6" fill="#BDC3C7"/>
  <rect x="7" y="4" width="2" height="2" fill="#3498DB"/>
`);

// COFFEE BEAN — primary currency pickup. Cute rounded bean with centre groove.
export const coffee_bean = wrapSVG(`
  <rect x="4" y="3" width="8" height="10" fill="#8B4513" rx="4"/>
  <rect x="7" y="4" width="2" height="8" fill="#3E2723"/>
  <rect x="10" y="5" width="1" height="3" fill="#D2B48C"/>
`);

// AGILE TRENCH TILE — a shaky post-it note floor.
export const ground_tile = wrapSVG(`
  <rect x="0" y="0" width="16" height="16" fill="#F9E79F"/>
  <rect x="0" y="0" width="16" height="2" fill="#F1C40F"/>
  <rect x="14" y="0" width="2" height="16" fill="#D4AC0D"/>
`);

// CEO APPROVED SHIELD — crisp 8-bit heraldic shield. Golden yellow body,
// dark-gold pixel border, left-edge highlight stripe, white tick (✓).
// Replaces the blurry 72×72 canvas arc version (defSprite "armor").
export const item_shield = wrapSVG(`
  <!-- Dark gold border — top edge -->
  <rect x="3" y="2" width="10" height="1" fill="#7A5500"/>
  <!-- Left / right sides -->
  <rect x="2" y="3" width="1" height="6" fill="#7A5500"/>
  <rect x="13" y="3" width="1" height="6" fill="#7A5500"/>
  <!-- Bottom taper border -->
  <rect x="3" y="9"  width="10" height="1" fill="#7A5500"/>
  <rect x="4" y="10" width="8"  height="1" fill="#7A5500"/>
  <rect x="5" y="11" width="6"  height="1" fill="#7A5500"/>
  <rect x="6" y="12" width="4"  height="1" fill="#7A5500"/>
  <rect x="7" y="13" width="2"  height="1" fill="#7A5500"/>
  <!-- Golden yellow fill -->
  <rect x="3" y="3"  width="10" height="6" fill="#F1C40F"/>
  <rect x="4" y="9"  width="8"  height="1" fill="#F1C40F"/>
  <rect x="5" y="10" width="6"  height="1" fill="#F1C40F"/>
  <rect x="6" y="11" width="4"  height="1" fill="#F1C40F"/>
  <rect x="7" y="12" width="2"  height="1" fill="#F1C40F"/>
  <!-- Left highlight stripe (two-tone shimmer) -->
  <rect x="3" y="3" width="1" height="6" fill="#FFFAD4"/>
  <rect x="4" y="3" width="1" height="3" fill="#FFF5A0"/>
  <!-- White checkmark (✓) — right arm, junction, left arm -->
  <rect x="11" y="4" width="1" height="1" fill="#FFF"/>
  <rect x="10" y="5" width="1" height="1" fill="#FFF"/>
  <rect x="9"  y="6" width="1" height="1" fill="#FFF"/>
  <rect x="6"  y="7" width="3" height="1" fill="#FFF"/>
  <rect x="4"  y="8" width="3" height="1" fill="#FFF"/>
`);

// COFFEE CUP — white mug with dark roast fill and steam wisps.
export const coffee_cup = wrapSVG(`
  <rect x="3" y="6" width="10" height="8" fill="#ECF0F1"/>
  <rect x="13" y="8" width="2" height="4" fill="#ECF0F1"/>
  <rect x="13" y="9" width="1" height="2" fill="#000"/>
  <rect x="4" y="6" width="8" height="1" fill="#3E2723"/>
  <rect x="5" y="2" width="1" height="2" fill="#BDC3C7"/>
  <rect x="8" y="3" width="1" height="2" fill="#BDC3C7"/>
  <rect x="11" y="1" width="1" height="2" fill="#BDC3C7"/>
`);

// ORCHESTRATOR WAND — magic stick with glowing gold star tip.
export const weapon_wand = wrapSVG(`
  <rect x="7" y="6" width="2" height="10" fill="#34495E"/>
  <rect x="6" y="0" width="4" height="1" fill="#F1C40F"/>
  <rect x="5" y="1" width="6" height="1" fill="#F1C40F"/>
  <rect x="4" y="2" width="8" height="2" fill="#F1C40F"/>
  <rect x="5" y="4" width="6" height="1" fill="#F1C40F"/>
  <rect x="6" y="5" width="4" height="1" fill="#F1C40F"/>
  <rect x="7" y="1" width="2" height="4" fill="#FFF"/>
`);

// MISPLACEMENT TRAP — angry corrupted yellow folder; damages Archie on contact.
export const trap_misplacement = wrapSVG(`
  <rect x="2" y="4" width="5" height="2" fill="#F39C12"/>
  <rect x="1" y="6" width="14" height="9" fill="#F1C40F"/>
  <rect x="4" y="8" width="2" height="1" fill="#E74C3C"/>
  <rect x="10" y="8" width="2" height="1" fill="#E74C3C"/>
  <rect x="5" y="9" width="1" height="1" fill="#000"/>
  <rect x="10" y="9" width="1" height="1" fill="#000"/>
  <rect x="5" y="11" width="1" height="1" fill="#000"/>
  <rect x="6" y="12" width="4" height="1" fill="#000"/>
  <rect x="10" y="11" width="1" height="1" fill="#000"/>
  <rect x="12" y="12" width="2" height="2" fill="#E74C3C"/>
`);

// =============================================================================
// BOSS-101: THE MVP CTHULHU — Layer 1 final boss sprites + projectile.
// =============================================================================

// IDLE: Purple floating brain with a single giant eye (red iris) and yellow
// post-it tentacles. Two dangling legs hint at the Cthulhu silhouette.
export const boss_cthulhu_idle = wrapSVG(`
  <rect x="2" y="1" width="12" height="9"  fill="#7D3C98"/>
  <rect x="1" y="2" width="14" height="7"  fill="#8E44AD"/>
  <rect x="3" y="1" width="10" height="1"  fill="#9B59B6"/>
  <rect x="5" y="3" width="6"  height="5"  fill="#9B59B6"/>
  <rect x="5" y="5" width="6"  height="2"  fill="#ECF0F1"/>
  <rect x="6" y="5" width="4"  height="2"  fill="#ECF0F1"/>
  <rect x="7" y="5" width="2"  height="3"  fill="#ECF0F1"/>
  <rect x="7" y="6" width="2"  height="1"  fill="#E74C3C"/>
  <rect x="1" y="7" width="2"  height="3"  fill="#F1C40F"/>
  <rect x="13" y="5" width="2" height="3"  fill="#F1C40F"/>
  <rect x="3" y="10" width="2" height="4"  fill="#8E44AD"/>
  <rect x="11" y="10" width="2" height="4" fill="#8E44AD"/>
  <rect x="3" y="13" width="2" height="1"  fill="#7D3C98"/>
  <rect x="11" y="13" width="2" height="1" fill="#7D3C98"/>
`);

// STUNNED: Sagging, half-shut eye, drooping post-its — on the ground & exposed.
export const boss_cthulhu_stun = wrapSVG(`
  <rect x="1" y="6" width="14" height="8"  fill="#7D3C98"/>
  <rect x="2" y="7" width="12" height="6"  fill="#8E44AD"/>
  <rect x="5" y="8" width="6"  height="3"  fill="#ECF0F1"/>
  <rect x="6" y="9" width="4"  height="1"  fill="#E74C3C"/>
  <rect x="7" y="9" width="2"  height="1"  fill="#000"/>
  <rect x="5" y="11" width="6" height="1"  fill="#5D2A72"/>
  <rect x="1" y="12" width="3" height="2"  fill="#F1C40F"/>
  <rect x="12" y="10" width="3" height="2" fill="#F1C40F"/>
  <rect x="5" y="14" width="2" height="2"  fill="#8E44AD"/>
  <rect x="9" y="14" width="2" height="2"  fill="#8E44AD"/>
`);

// FEATURE TICKET: Falling yellow post-it with a dark-gold header stripe.
export const projectile_ticket = wrapSVG(`
  <rect x="3" y="2" width="10" height="12" fill="#F1C40F"/>
  <rect x="3" y="2" width="10" height="3"  fill="#E67E22"/>
  <rect x="5" y="6" width="6"  height="1"  fill="#D4AC0D"/>
  <rect x="5" y="8" width="4"  height="1"  fill="#D4AC0D"/>
  <rect x="5" y="10" width="5" height="1"  fill="#D4AC0D"/>
  <rect x="3" y="2" width="1"  height="12" fill="#F39C12"/>
`);

// =============================================================================
// BOSS-201: THE KAFKA ROACH — Layer 3 mini-boss sprites + projectiles.
// =============================================================================

// KAFKA ROACH: dual-headed cockroach. Left head = Sync (cyan), right = Async (orange).
export const boss_kafka_roach = wrapSVG(`
  <!-- Left head (Sync - cyan) -->
  <rect x="0" y="4" width="5" height="8" fill="#00838F"/>
  <rect x="1" y="5" width="3" height="6" fill="#00BCD4"/>
  <rect x="1" y="5" width="2" height="2" fill="#FFFFFF"/>
  <rect x="1" y="5" width="1" height="1" fill="#000000"/>
  <!-- Central body -->
  <rect x="5" y="5" width="6" height="6" fill="#4E342E"/>
  <rect x="5" y="6" width="6" height="4" fill="#6D4C41"/>
  <rect x="5" y="7" width="6" height="1" fill="#3E2723"/>
  <!-- Right head (Async - orange) -->
  <rect x="11" y="4" width="5" height="8" fill="#E65100"/>
  <rect x="12" y="5" width="3" height="6" fill="#FF6F00"/>
  <rect x="13" y="5" width="2" height="2" fill="#FFFFFF"/>
  <rect x="14" y="5" width="1" height="1" fill="#000000"/>
  <!-- Legs -->
  <rect x="1" y="11" width="1" height="3" fill="#212121"/>
  <rect x="3" y="12" width="1" height="2" fill="#212121"/>
  <rect x="6" y="10" width="1" height="3" fill="#212121"/>
  <rect x="9" y="10" width="1" height="3" fill="#212121"/>
  <rect x="12" y="11" width="1" height="3" fill="#212121"/>
  <rect x="14" y="12" width="1" height="2" fill="#212121"/>
  <!-- Antennae -->
  <rect x="0" y="1" width="1" height="3" fill="#00BCD4"/>
  <rect x="2" y="2" width="1" height="2" fill="#00BCD4"/>
  <rect x="14" y="1" width="1" height="3" fill="#FF6F00"/>
  <rect x="13" y="2" width="1" height="2" fill="#FF6F00"/>
`);

// =============================================================================
// BOSS-202: THE MONOLITHIC SCHEMA OOZE — Layer 3 final boss sprites + hazards.
// =============================================================================

// LARGE OOZE: big purple blob with table-scan lines and red core.
export const boss_ooze_large = wrapSVG(`
  <rect x="1" y="3" width="14" height="10" fill="#4A148C"/>
  <rect x="0" y="5" width="16" height="6" fill="#6A1B9A"/>
  <rect x="3" y="1" width="10" height="14" fill="#6A1B9A"/>
  <rect x="4" y="2" width="8" height="12" fill="#7B1FA2"/>
  <rect x="5" y="5" width="6" height="6" fill="#AD1457"/>
  <rect x="6" y="6" width="4" height="4" fill="#E91E63"/>
  <rect x="7" y="7" width="2" height="2" fill="#F48FB1"/>
  <rect x="3" y="4" width="10" height="1" fill="#38006B"/>
  <rect x="3" y="7" width="10" height="1" fill="#38006B"/>
  <rect x="3" y="10" width="10" height="1" fill="#38006B"/>
  <rect x="7" y="4" width="2" height="7" fill="#38006B"/>
`);

// MEDIUM OOZE: smaller darker blob (spawned at split).
export const boss_ooze_medium = wrapSVG(`
  <rect x="2" y="3" width="12" height="10" fill="#4A148C"/>
  <rect x="1" y="5" width="14" height="6" fill="#6A1B9A"/>
  <rect x="4" y="2" width="8" height="12" fill="#6A1B9A"/>
  <rect x="5" y="4" width="6" height="8" fill="#7B1FA2"/>
  <rect x="5" y="5" width="6" height="6" fill="#880E4F"/>
  <rect x="6" y="6" width="4" height="4" fill="#C2185B"/>
  <rect x="3" y="6" width="10" height="1" fill="#38006B"/>
  <rect x="3" y="9" width="10" height="1" fill="#38006B"/>
  <rect x="7" y="4" width="2" height="7" fill="#38006B"/>
`);

// SYNC PROJECTILE: fast cyan horizontal dart (Sync head bullet).
export const projectile_sync = wrapSVG(`
  <rect x="0" y="6" width="12" height="4" fill="#006064"/>
  <rect x="0" y="6" width="12" height="2" fill="#00BCD4"/>
  <rect x="12" y="7" width="2" height="2" fill="#00BCD4"/>
  <rect x="14" y="7" width="2" height="2" fill="#E0F7FA"/>
  <rect x="2" y="6" width="8" height="1" fill="#B2EBF2"/>
`);

// DATA BLOCK HAZARD: heavy grey falling DB block.
export const hazard_data_block = wrapSVG(`
  <rect x="0" y="0" width="16" height="16" fill="#37474F"/>
  <rect x="0" y="0" width="16" height="2" fill="#607D8B"/>
  <rect x="0" y="0" width="2" height="16" fill="#607D8B"/>
  <rect x="14" y="0" width="2" height="16" fill="#263238"/>
  <rect x="0" y="14" width="16" height="2" fill="#263238"/>
  <rect x="3" y="4" width="10" height="1" fill="#546E7A"/>
  <rect x="3" y="7" width="10" height="1" fill="#546E7A"/>
  <rect x="3" y="10" width="10" height="1" fill="#546E7A"/>
  <rect x="7" y="4" width="2" height="7" fill="#546E7A"/>
`);

// DATA WAVE HAZARD: horizontal red PII leak wave.
export const hazard_data_wave = wrapSVG(`
  <rect x="0" y="4" width="16" height="8" fill="#B71C1C"/>
  <rect x="0" y="5" width="16" height="6" fill="#E53935"/>
  <rect x="0" y="4" width="16" height="2" fill="#EF9A9A"/>
  <rect x="2" y="9" width="3" height="2" fill="#B71C1C"/>
  <rect x="7" y="9" width="3" height="2" fill="#B71C1C"/>
  <rect x="12" y="9" width="3" height="2" fill="#B71C1C"/>
  <rect x="3" y="6" width="2" height="1" fill="#FFCDD2"/>
  <rect x="8" y="6" width="2" height="1" fill="#FFCDD2"/>
`);
