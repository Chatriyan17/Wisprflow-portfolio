import { WORLD } from '../config.js';

// Level layout. Stage 1: the starting village. Stage 2: the road into the
// industrial district, the Old Workshop factory hall, the break yard and the
// gateway to the World of UX.
// Collision, decoration placement, interactables and story beats all live here
// so art, physics and story share one source of truth.

const G = WORLD.ground;

export const TERRAIN = [
  // [x0, x1, top, material]
  [0, 860, G, 'grass'],
  [860, 1060, G - 24, 'grass'],
  [1060, 1084, G - 48, 'grass'],
  [1084, 1200, G - 72, 'grass'],   // plateau with the Journey Map
  [1200, 1224, G - 48, 'grass'],
  [1224, 1330, G - 24, 'grass'],
  // 1330..1530: stream + waterfall, crossed by the stone bridge
  [1530, 1680, G - 24, 'grass'],
  [1680, 2480, G, 'grass'],
  [2480, 3000, G, 'toConcrete'],   // grass gives way to paving
  [3000, 3640, G, 'concrete'],     // industrial district
  [3640, 5000, G, 'factory'],      // the Old Workshop hall floor
  [5000, 5660, G, 'concrete'],     // break yard
  [5660, WORLD.width, G, 'toGlow'], // paving gives way to glowing grass near the gateway
];

// Where the industrial look fades in and out (used by art, sky tint and audio).
export const REGIONS = {
  industryStart: 2450,
  industryFull: 3150,
  industryEnd: 5700,
  gatewayFull: 6150,
};

export const HALL = { x0: 3640, x1: 5000, roof: G - 238 };
export const GATE = { x: 3020 };
export const CONVEYOR = { x0: 4090, x1: 4400, top: G - 26, speed: 34 };
export const CATWALK = { x0: 4732, x1: 4892, top: G - 72 };
export const STAIRS = { up: 4660, down: 4892, step: 12, count: 6 };
export const BREAK = { table: 5352, friends: [5374, 5412] };
export const PORTAL = { x: 6150, y: G };

export const BRIDGE = { x0: 1318, x1: 1542, y: G - 24 };

export const PLATFORMS = [
  // one-way floating platforms (jump up through, stand on top, S/↓ to drop)
  { x: 1772, y: G - 60, w: 54, kind: 'log' },
  { x: 1872, y: G - 112, w: 104, kind: 'island' },
  { x: 2010, y: G - 66, w: 40, kind: 'stone' },
];

export const CRATES = [
  { x: 2570, w: 26, h: 22 },
  { x: 3462, w: 26, h: 22 },
  { x: 4018, w: 28, h: 22 },
];

export function buildSolids() {
  const solids = [];
  const deep = WORLD.height + 80;
  for (const [x0, x1, top, mat] of TERRAIN) {
    solids.push({ x: x0, y: top, w: x1 - x0, h: deep - top, kind: 'ground', mat });
  }
  // factory: conveyor (carries you along), observation catwalk with stairs and
  // the generator underneath it
  solids.push({ x: CONVEYOR.x0, y: CONVEYOR.top, w: CONVEYOR.x1 - CONVEYOR.x0, h: G - CONVEYOR.top, kind: 'conveyor', speed: CONVEYOR.speed });
  for (let i = 0; i < STAIRS.count; i++) {
    const h = STAIRS.step * (i + 1);
    solids.push({ x: STAIRS.up + i * STAIRS.step, y: G - h, w: STAIRS.step, h, kind: 'stairs' });
    solids.push({ x: STAIRS.down + i * STAIRS.step, y: CATWALK.top + STAIRS.step * (i + 1) - STAIRS.step, w: STAIRS.step, h: G - (CATWALK.top + STAIRS.step * i), kind: 'stairs' });
  }
  solids.push({ x: CATWALK.x0, y: CATWALK.top, w: CATWALK.x1 - CATWALK.x0, h: 8, kind: 'catwalk' });
  solids.push({ x: CATWALK.x0 + 6, y: G - 58, w: CATWALK.x1 - CATWALK.x0 - 12, h: 58, kind: 'generator' });
  solids.push({ x: BRIDGE.x0, y: BRIDGE.y, w: BRIDGE.x1 - BRIDGE.x0, h: 10, kind: 'bridge' });
  for (const p of PLATFORMS) solids.push({ x: p.x, y: p.y, w: p.w, h: 8, oneWay: true, kind: p.kind });
  for (const c of CRATES) solids.push({ x: c.x, y: G - c.h, w: c.w, h: c.h, kind: 'crate' });
  // world edges
  solids.push({ x: -60, y: -800, w: 80, h: 1400, kind: 'wall' });
  solids.push({ x: WORLD.width - 30, y: -800, w: 80, h: 1400, kind: 'wall' });
  return solids;
}

export function groundTopAt(x) {
  if (x >= BRIDGE.x0 && x <= BRIDGE.x1) return BRIDGE.y;
  if (x >= STAIRS.up && x < CATWALK.x1 + STAIRS.step * STAIRS.count) return CATWALK.top;
  if (x >= CONVEYOR.x0 && x < CONVEYOR.x1) return CONVEYOR.top;
  for (const [x0, x1, top] of TERRAIN) if (x >= x0 && x < x1) return top;
  return G;
}

// Static props (baked into the main layer). Positions are on the ground unless y is given.
export const PROPS = [
  { type: 'bigTree', x: 120 },
  { type: 'welcomeSign', x: 296 },
  { type: 'flowers', x: 240, w: 60 },
  { type: 'bush', x: 470, s: 1 },
  { type: 'lampPost', x: 528 },
  { type: 'fence', x: 548, w: 46 },
  { type: 'house', x: 600 },
  { type: 'barrel', x: 790 },
  { type: 'flowers', x: 800, w: 50 },
  { type: 'bush', x: 838, s: 0.8 },
  { type: 'rock', x: 930, s: 1 },
  { type: 'tree', x: 985, h: 120, r: 34, kind: 'green' },
  { type: 'mapBoard', x: 1142 },
  { type: 'tree', x: 1262, h: 100, r: 28, kind: 'blossom' },
  { type: 'lampPost', x: 1300 },
  { type: 'lampPost', x: 1562 },
  { type: 'bush', x: 1610, s: 1.1, kind: 'blossom' },
  { type: 'tree', x: 1700, h: 135, r: 38, kind: 'blossom' },
  { type: 'flowers', x: 1730, w: 70 },
  { type: 'rock', x: 1850, s: 0.8 },
  { type: 'tree', x: 2105, h: 150, r: 42, kind: 'green' },
  { type: 'bench', x: 2170 },
  { type: 'tree', x: 2270, h: 120, r: 34, kind: 'blossom' },
  { type: 'lampPost', x: 2330 },
  { type: 'pathSign', x: 2400 },
  { type: 'flowers', x: 2440, w: 50 },
  { type: 'bush', x: 2500, s: 0.9 },
  // --- Stage 2: the road into the industrial district
  { type: 'tree', x: 2560, h: 110, r: 30, kind: 'green' },
  { type: 'utilityPole', x: 2640 },
  { type: 'chainFence', x: 2690, w: 110 },
  { type: 'gearProp', x: 2830 },
  { type: 'streetLamp', x: 2870 },
  { type: 'barrel', x: 2910 },
  { type: 'barrel', x: 2926 },
  { type: 'gate', x: 3020 },
  { type: 'pallets', x: 3110 },
  { type: 'streetLamp', x: 3180 },
  { type: 'chainFence', x: 3220, w: 140 },
  { type: 'utilityPole', x: 3400 },
  { type: 'streetLamp', x: 3540 },
  { type: 'barrel', x: 3590 },
  // --- the Old Workshop hall (machines are drawn by the hall painter)
  { type: 'hall', x: 3640 },
  // --- break yard
  { type: 'vending', x: 5070 },
  { type: 'stringLights', x: 5130, w: 400 },
  { type: 'pottedPlant', x: 5160 },
  { type: 'bench', x: 5240 },
  { type: 'breakTable', x: 5352 },
  { type: 'canteen', x: 5450 },
  { type: 'pallets', x: 5600 },
  // --- the gateway
  { type: 'glowFlowers', x: 5700, w: 120 },
  { type: 'streetLamp', x: 5720 },
  { type: 'uxSign', x: 5880 },
  { type: 'glowFlowers', x: 5930, w: 160 },
  { type: 'curiositySign', x: 6020 },
  { type: 'portal', x: 6150 },
  { type: 'glowFlowers', x: 6220, w: 150 },
];

// Light sources for the lighting pass (world coords).
export const LIGHTS = [
  { x: 218, y: 150, r: 46, kind: 'lantern' },
  { x: 254, y: 118, r: 40, kind: 'lantern' },
  { x: 50, y: 124, r: 40, kind: 'lantern' },
  { x: 692, y: G - 30, r: 26, kind: 'lantern' },
  { x: 528, y: G - 54, r: 42, kind: 'lantern' },
  { x: 1300, y: G - 78, r: 42, kind: 'lantern' },
  { x: 1562, y: G - 78, r: 42, kind: 'lantern' },
  { x: 2330, y: G - 54, r: 42, kind: 'lantern' },
  { x: 632, y: G - 43, r: 30, kind: 'window' },
  { x: 708, y: G - 43, r: 30, kind: 'window' },
  // stage 2
  { x: 2870, y: G - 76, r: 46, kind: 'sodium' },
  { x: 3180, y: G - 76, r: 46, kind: 'sodium' },
  { x: 3540, y: G - 76, r: 46, kind: 'sodium' },
  { x: 3020, y: G - 112, r: 40, kind: 'sodium' },
  { x: 3760, y: G - 176, r: 40, kind: 'beacon' },
  { x: 4300, y: G - 176, r: 40, kind: 'beacon' },
  { x: 4940, y: G - 176, r: 40, kind: 'beacon' },
  { x: 3900, y: G - 196, r: 54, kind: 'hanglamp' },
  { x: 4220, y: G - 196, r: 54, kind: 'hanglamp' },
  { x: 4540, y: G - 196, r: 54, kind: 'hanglamp' },
  { x: 4820, y: G - 196, r: 54, kind: 'hanglamp' },
  { x: 3842, y: G - 82, r: 18, kind: 'panel' },
  { x: 5070, y: G - 34, r: 34, kind: 'vending' },
  { x: 5500, y: G - 40, r: 36, kind: 'window' },
  { x: 5720, y: G - 76, r: 46, kind: 'sodium' },
  { x: 5880, y: G - 74, r: 70, kind: 'portal' },
  { x: 6150, y: G - 56, r: 130, kind: 'portal' },
];

// string-light bulbs over the break yard (also light sources)
for (let i = 0; i <= 16; i++) {
  const t = i / 16;
  LIGHTS.push({ x: 5130 + t * 400, y: G - 96 + Math.round(Math.sin(t * Math.PI) * 18), r: 14, kind: 'bulb' });
}

export const SMOKE = [
  { x: 731, y: G - 122 },
  { x: 5532, y: G - 98 },   // canteen kettle chimney
];

export const STEAM = [
  { x: 3712, y: G - 150 },
  { x: 4486, y: G - 168 },
  { x: 4980, y: G - 120 },
];

export const WATERFALL = { x: 1392, w: 52, top: 132, bottom: G + 40 };
export const POND = { x0: 1330, x1: 1530, y: G + 28 };

// Interactable objects: E / tap to interact.
export const INTERACTABLES = [
  { id: 'welcome-sign', x: 296, y: G, label: 'Read sign', range: 34 },
  { id: 'home', x: 668, y: G, label: 'Knock', range: 26 },
  { id: 'journey-map', x: 1142, y: G - 72, label: 'View map', range: 34 },
  { id: 'lookout', x: 1924, y: G - 112, label: 'Look out', range: 40 },
  // stage 2
  { id: 'machine', x: 3826, y: G, label: 'Inspect machine', range: 36 },
  { id: 'blueprint', x: 4600, y: G, label: 'Read blueprint', range: 34 },
  { id: 'gateway', x: 6150, y: G, label: 'Explore', range: 48 },
];

// Scripted scenes, fired once when the protagonist reaches them (both modes).
export const TRIGGERS = [
  { id: 'enter-workshop', x: 3060 },
  { id: 'observation', x: 4790, maxY: CATWALK.top + 4 },
  { id: 'break-talk', x: 5150 },
  { id: 'memory', x: 5300 },
];

// Checkpoints for "continue where you left off".
export const CHECKPOINTS = [
  { id: 'start', x: 380, name: 'the start' },
  { id: 'workshop', x: 3080, name: 'The Old Workshop' },
  { id: 'hall', x: 3700, name: 'the factory floor' },
  { id: 'break', x: 5060, name: 'the break yard' },
  { id: 'gateway', x: 5800, name: 'the gateway' },
];

// Story beats: shared by Scroll Journey and Explore World. Fired once each when the
// protagonist passes their x position. `mode` limits a beat to one navigation mode.
export const BEATS = [
  { id: 'home', x: 560, who: 'girl', text: 'That\'s home base. Try knocking!' },
  { id: 'ledge', x: 820, mode: 'explore', who: 'girl', text: 'Hop up! SPACE to jump.' },
  { id: 'map', x: 1060, who: 'girl', text: 'The journey map is up on that ledge.' },
  { id: 'bridge', x: 1380, who: 'girl', text: 'Listen to that waterfall…' },
  { id: 'island', x: 1760, mode: 'explore', who: 'girl', text: 'Climb onto the floating island. Great view from up there!' },
  { id: 'smoke', x: 2240, who: 'girl', text: 'See the chimney smoke ahead? That\'s our first stop.' },
  { id: 'remember', x: 2760, who: 'boy', text: 'I remember this place.' },
  { id: 'hall', x: 3660, who: 'girl', text: 'Whoa. Listen to those machines.' },
  { id: 'conveyor', x: 4060, mode: 'explore', who: 'girl', text: 'Hop on the conveyor. It\'ll carry you!' },
  { id: 'stairs', x: 4630, mode: 'explore', who: 'girl', text: 'Let\'s take the stairs up to the platform.' },
  { id: 'glow', x: 5560, who: 'girl', text: 'Look! Something\'s glowing up ahead.' },
  { id: 'newpath', x: 5800, who: 'boy', text: 'A new path…?' },
];

export const LANDMARKS = {
  start: 380,
  workshop: 3000,
  gateway: 6150,
};
