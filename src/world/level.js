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
  [5660, 6250, G, 'toGlow'],       // paving gives way to glowing grass near the gateway
  // --- Stage 3: the Discovery Forest (beyond the gateway)
  [6250, 6820, G, 'forest'],
  // 6820..6940: a stream crossed by a little wooden bridge
  [6940, 8280, G, 'forest'],
  [8280, 8300, G - 11, 'forest'],
  [8300, 8524, G - 22, 'forest'],  // the hill at the heart of the world of possibilities
  [8524, 8544, G - 11, 'forest'],
  [8544, 9900, G, 'forest'],
  // --- Stage 4: inside the first design studio (a separate interior region)
  [9900, WORLD.width, G, 'studio'],
];

// Where the industrial look fades in and out (used by art, sky tint and audio).
export const REGIONS = {
  industryStart: 2450,
  industryFull: 3150,
  industryEnd: 5700,
  gatewayFull: 6150,
  forestStart: 6200,
};

export const HALL = { x0: 3640, x1: 5000, roof: G - 238 };
export const GATE = { x: 3020 };
export const CONVEYOR = { x0: 4090, x1: 4400, top: G - 26, speed: 34 };
export const CATWALK = { x0: 4732, x1: 4892, top: G - 72 };
export const STAIRS = { up: 4660, down: 4892, step: 12, count: 6 };
export const BREAK = { table: 5352, friends: [5374, 5412] };
export const PORTAL = { x: 6150, y: G };

// Stage 3
export const STREAM = { x0: 6820, x1: 6940, y: G + 24 };
export const WOOD_BRIDGE = { x0: 6810, x1: 6950, y: G };
export const STATION = { x: 7420 };
export const HILL = { x: 8412, top: G - 22 };
export const STUDIO = { x: 9560, door: 9650 };
export const ISLANDS = [
  { id: 'healthcare', name: 'Healthcare', x: 8058, y: G - 150, at: 7950 },
  { id: 'education', name: 'Education', x: 8172, y: G - 226, at: 8030 },
  { id: 'finance', name: 'Finance', x: 8286, y: G - 166, at: 8110 },
  { id: 'ecommerce', name: 'E-commerce', x: 8540, y: G - 170, at: 8190 },
  { id: 'transport', name: 'Transportation', x: 8654, y: G - 228, at: 8270 },
  { id: 'technology', name: 'Technology', x: 8768, y: G - 150, at: 8350 },
];
// Stage 4: the studio interior lives to the right of the forest, behind its own walls.
export const INTERIOR = { x0: 10100, x1: WORLD.width - 30, entry: 10190, exitTo: 9640 };
export const STATIONS = [
  { id: 'graphic', num: '01', name: 'Graphic Design', x: 10650 },
  { id: 'motion', num: '02', name: 'Motion Design', x: 10930 },
  { id: 'visual', num: '03', name: 'Visual Design', x: 11210 },
  { id: 'product', num: '04', name: 'Product Design', x: 11490 },
];
export const DESIGN_WALL = { x: 11780 };
export const ACADEMY = { sign: 11990, door: 12165 };
export const STATION_GATE = { x: 11690, y: -800, w: 10, h: 1400, kind: 'stationGate' };

// Until the gateway is opened, the world beyond it is out of reach.
export const PORTAL_WALL = { x: 6172, y: -800, w: 10, h: 1400, kind: 'portalWall' };

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
  solids.push({ x: WOOD_BRIDGE.x0, y: WOOD_BRIDGE.y, w: WOOD_BRIDGE.x1 - WOOD_BRIDGE.x0, h: 8, kind: 'bridge' });
  solids.push({ ...PORTAL_WALL });
  // the forest ends at the studio; the studio interior has its own walls
  solids.push({ x: 9870, y: -800, w: 260, h: 1400, kind: 'wall' });
  solids.push({ ...STATION_GATE });
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
  if (x >= WOOD_BRIDGE.x0 && x <= WOOD_BRIDGE.x1) return WOOD_BRIDGE.y;
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
  // --- Stage 3: the Discovery Forest
  { type: 'rubble', x: 6270 },
  { type: 'pipeBranch', x: 6305, h: 96 },
  { type: 'glowFlowers', x: 6220, w: 150 },
  { type: 'overgrownLamp', x: 6392 },
  { type: 'pipeBranch', x: 6468, h: 70 },
  { type: 'mushrooms', x: 6510 },
  { type: 'questionSign', x: 6570 },
  { type: 'bigForestTree', x: 6700, h: 200, r: 54, kind: 'green' },
  { type: 'ferns', x: 6760, w: 50 },
  { type: 'crystals', x: 6790 },
  { type: 'woodBridge', x: 6810 },
  { type: 'bigForestTree', x: 7010, h: 180, r: 46, kind: 'blossom' },
  { type: 'mushrooms', x: 7080 },
  { type: 'glowFlowers', x: 7100, w: 120 },
  { type: 'bigForestTree', x: 7200, h: 210, r: 52, kind: 'green' },
  { type: 'ferns', x: 7250, w: 40 },
  { type: 'station', x: 7420 },
  { type: 'bigForestTree', x: 7640, h: 190, r: 48, kind: 'blossom' },
  { type: 'crystals', x: 7700 },
  { type: 'mushrooms', x: 7760 },
  { type: 'glowFlowers', x: 7800, w: 140 },
  { type: 'ferns', x: 7960, w: 60 },
  { type: 'hillStones', x: 8412 },
  { type: 'glowFlowers', x: 8320, w: 180 },
  { type: 'ferns', x: 8600, w: 60 },
  { type: 'crystals', x: 8880 },
  { type: 'bigForestTree', x: 9000, h: 200, r: 50, kind: 'green' },
  { type: 'mushrooms', x: 9080 },
  { type: 'glowFlowers', x: 9120, w: 100 },
  { type: 'bigForestTree', x: 9220, h: 170, r: 44, kind: 'blossom' },
  { type: 'studioSign', x: 9420 },
  { type: 'glowFlowers', x: 9460, w: 80 },
  { type: 'studio', x: 9560 },
  { type: 'bigForestTree', x: 9810, h: 190, r: 50, kind: 'green' },
  // --- Stage 4: inside the studio
  { type: 'studioInterior', x: 10100 },
  ...STATIONS.map((st) => ({ type: 'creativeStation', x: st.x, id: st.id, num: st.num, name: st.name })),
  { type: 'designWall', x: 11780 },
  { type: 'academySign', x: 11990 },
  { type: 'academyDoor', x: 12165 },
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
  // stage 3
  { x: 6392, y: G - 80, r: 36, kind: 'glow' },
  { x: 6512, y: G - 8, r: 24, kind: 'glow' },
  { x: 6570, y: G - 70, r: 40, kind: 'lantern' },
  { x: 6792, y: G - 10, r: 26, kind: 'glow' },
  { x: 7082, y: G - 8, r: 24, kind: 'glow' },
  { x: 7360, y: G - 92, r: 40, kind: 'lantern' },
  { x: 7486, y: G - 92, r: 40, kind: 'lantern' },
  { x: 7426, y: G - 72, r: 50, kind: 'screen' },
  { x: 7702, y: G - 10, r: 26, kind: 'glow' },
  { x: 7762, y: G - 8, r: 24, kind: 'glow' },
  { x: 8412, y: G - 40, r: 60, kind: 'glow' },
  { x: 8882, y: G - 10, r: 26, kind: 'glow' },
  { x: 9082, y: G - 8, r: 24, kind: 'glow' },
  { x: 9420, y: G - 120, r: 70, kind: 'neon' },
  { x: 9610, y: G - 70, r: 40, kind: 'window' },
  { x: 9700, y: G - 70, r: 40, kind: 'window' },
  { x: 9650, y: G - 150, r: 50, kind: 'window' },
  // stage 4: studio pendants, station screens (lit when switched on), academy glow
  ...[10260, 10520, 10790, 11070, 11350, 11620, 11880].map((x) => ({ x, y: G - 172, r: 60, kind: 'hanglamp' })),
  ...STATIONS.map((st) => ({ x: st.x, y: G - 66, r: 46, kind: 'screen', station: st.id })),
  { x: 10300, y: G - 140, r: 46, kind: 'neon' },
  { x: 11990, y: G - 130, r: 70, kind: 'academy' },
  { x: 12165, y: G - 60, r: 110, kind: 'academy' },
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
  // stage 3
  { id: 'course', x: 7426, y: G, label: 'Use computer', range: 34 },
  ...ISLANDS.map((i) => ({ id: `island-${i.id}`, x: i.x, y: i.x > 8290 && i.x < 8530 ? G - 22 : G, label: `Look at ${i.name}`, range: 22, island: i.id })),
  { id: 'studio', x: 9650, y: G, label: 'Enter studio', range: 44 },
  // stage 4
  { id: 'studio-exit', x: 10150, y: G, label: 'Go outside', range: 26 },
  ...STATIONS.map((st) => ({ id: `station-${st.id}`, x: st.x - 10, y: G, label: `${st.name} station`, range: 40, station: st.id })),
  { id: 'design-wall', x: 11780, y: G, label: 'Look at the wall', range: 40 },
  { id: 'academy', x: 12165, y: G, label: 'Explore', range: 46 },
];

// Scripted scenes, fired once when the protagonist reaches them (both modes).
export const TRIGGERS = [
  { id: 'enter-workshop', x: 3060 },
  { id: 'observation', x: 4790, maxY: CATWALK.top + 4 },
  { id: 'break-talk', x: 5150 },
  { id: 'memory', x: 5300 },
  // stage 3 (in Scroll Journey these play by themselves; in Explore World press E)
  { id: 'gateway', x: 6096, mode: 'scroll' },
  { id: 'first-question', x: 6600 },
  { id: 'course', x: 7404, mode: 'scroll' },
  { id: 'curiosity', x: 8404, maxY: G - 18 },
  // stage 4
  { id: 'studio-door', x: 9616, mode: 'scroll' },
  { id: 'studio-enter', x: 10290 },
  { id: 'one-team', x: 10520 },
  ...STATIONS.map((st) => ({ id: `station-${st.id}`, x: st.x - 40, mode: 'scroll' })),
  { id: 'missing-piece', x: 11760, needs: 'hats' },
  { id: 'decision', x: 11990, needs: 'missing-piece' },
];

// Checkpoints for "continue where you left off".
export const CHECKPOINTS = [
  { id: 'start', x: 380, name: 'the start' },
  { id: 'workshop', x: 3080, name: 'The Old Workshop' },
  { id: 'hall', x: 3700, name: 'the factory floor' },
  { id: 'break', x: 5060, name: 'the break yard' },
  { id: 'gateway', x: 5800, name: 'the gateway' },
  { id: 'forest', x: 6330, name: 'The Discovery Path' },
  { id: 'station', x: 7300, name: 'the learning station' },
  { id: 'possibilities', x: 7900, name: 'the world of possibilities' },
  { id: 'studio', x: 9300, name: 'the path to the studio' },
  { id: 'workplace', x: 10190, name: 'the first design studio' },
  { id: 'academy-door', x: 11900, name: 'the Knowledge Academy door' },
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
  { id: 'green', x: 6430, who: 'girl', text: 'The factory\'s gone… everything is turning green.' },
  { id: 'brook', x: 6780, mode: 'explore', who: 'girl', text: 'Careful on the little bridge!' },
  { id: 'nook', x: 7240, who: 'girl', text: 'Look, a little study nook under the trees.' },
  { id: 'rising', x: 7900, who: 'boy', text: 'Wait… is the ground moving?' },
  { id: 'studio-seen', x: 9160, who: 'girl', text: 'There\'s a studio up ahead!' },
  { id: 'desks', x: 10600, mode: 'explore', who: 'girl', text: 'Let\'s check out every desk. Press E at each one!' },
];

export const LANDMARKS = {
  start: 380,
  workshop: 3000,     // 01 The Old Workshop
  gateway: 6150,      // 02 The Discovery Path (through the gateway)
  station: 7420,      // 03 The Learning Camp (the learning station)
  studio: 9650,       // doorstep of 04 The First Workplace
  workplace: 10190,   // 04 The First Workplace (inside the studio)
  academy: 12165,     // doorstep of 05 The Knowledge Academy
};
