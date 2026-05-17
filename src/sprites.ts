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
