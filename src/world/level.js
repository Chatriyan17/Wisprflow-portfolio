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
  // --- Stage 4: inside the first workplace, Valluva HCM Cloud Suite (a separate interior region)
  [9900, 12320, G, 'studio'],
  // --- Stage 5: the Knowledge Academy campus (outdoors again, its own area)
  [12320, 15900, G, 'campus'],
  // --- Stage 6: the Mentor's Camp (an evening forest) ...
  [15900, 16460, G, 'campforest'],
  // 16460..16560: a stream under a little wooden bridge
  [16560, 17520, G, 'campforest'],
  // --- Stage 7: ... opening onto the Great Overlook at sunrise
  [17520, 18200, G, 'overlook'],
  [18200, 18212, G - 10, 'overlook'],
  [18212, 18224, G - 20, 'overlook'],
  [18224, 18236, G - 30, 'overlook'],
  [18236, 18720, G - 40, 'overlook'],   // the observation platform
  [18720, 18732, G - 30, 'overlook'],
  [18732, 18744, G - 20, 'overlook'],
  [18744, 18756, G - 10, 'overlook'],
  [18756, 19300, G, 'overlook'],
  // --- Stage 6 memory: the school classroom (its own space, reached only through the memory)
  [19300, WORLD.width, G, 'classroom'],
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
export const INTERIOR = { x0: 10100, x1: 12290, entry: 10190, exitTo: 9640 };

// Stage 5: the Knowledge Academy campus
export const CAMPUS = { x0: 12420, entry: 12520, exitTo: 12130, gate: 12700, board: 12850 };
export const CLASSROOM = { x0: 13080, x1: 13460 };
export const LIBRARY = { x0: 13560, x1: 13960 };
export const LAB = { x0: 14060, x1: 14460, station: 14270 };
export const FOUNDATION = { x0: 14600, x1: 15080 };
export const MENTOR = { sign: 15560, door: 15660 };
export const GATE_BARRIER = { x: CAMPUS.gate + 4, y: -800, w: 10, h: 1400, kind: 'campusGate' };
// The Chapter 02 gateway is closed until the chapter's last conversation.
export const FINALE_GATE = { x: 19150, y: -800, w: 10, h: 1400, kind: 'finaleGate' };

// Learning objects: optional to explore, each opens a short explanation with an example.
export const LEARNING = [
  { id: 'hierarchy', area: 'fundamentals', name: 'Visual hierarchy', x: 13140 },
  { id: 'gestalt', area: 'fundamentals', name: 'Gestalt principles', x: 13200 },
  { id: 'typography', area: 'fundamentals', name: 'Typography', x: 13260 },
  { id: 'composition', area: 'fundamentals', name: 'Composition', x: 13320 },
  { id: 'colour', area: 'fundamentals', name: 'Colour theory', x: 13380 },
  { id: 'usability-principles', area: 'fundamentals', name: 'Usability principles', x: 13430 },
  { id: 'research', area: 'library', name: 'User research', x: 13620 },
  { id: 'interviews', area: 'library', name: 'User interviews', x: 13680 },
  { id: 'empathy-map', area: 'library', name: 'Empathy mapping', x: 13740 },
  { id: 'personas', area: 'library', name: 'Persona creation', x: 13800 },
  { id: 'affinity', area: 'library', name: 'Affinity mapping', x: 13860 },
  { id: 'problem', area: 'library', name: 'Problem identification', x: 13920 },
];

// The Foundation Wall: each principle lights up as he walks past it.
export const PRINCIPLES = [
  { id: 'hierarchy', name: 'Visual hierarchy', x: 14660 },
  { id: 'gestalt', name: 'Gestalt principles', x: 14725 },
  { id: 'typography', name: 'Typography', x: 14790 },
  { id: 'research', name: 'User research', x: 14855 },
  { id: 'empathy', name: 'Empathy', x: 14920 },
  { id: 'patterns', name: 'Interaction patterns', x: 14985 },
  { id: 'usability', name: 'Usability', x: 15050 },
];

// Stage 6: the Mentor's Camp
export const CAMP = { x0: 16000, entry: 16100, exitTo: 15600, stream: { x0: 16460, x1: 16560, y: G + 24 }, sign: 16690, cabin: { x0: 16820, x1: 17240 }, mentor: 17110, board: 17030, nextSign: 17390 };
// the school memory
export const SCHOOL = { x0: 19420, x1: 20280, entry: 19560, desk: 19700, board: 19940, teacher: 20030, girl: 19480 };
// Stage 7: the Great Overlook
export const OVERLOOK = { x0: 17520, platform: { x0: 18236, x1: 18720, top: G - 40 }, canvas: 18560, gate: 19100 };
// miniature worlds floating above the overlook, one per part of the journey
export const MEMORIES = [
  { id: 'workshop', num: '01', name: 'The Old Workshop', x: 17880, y: G - 236 },
  { id: 'discovery', num: '02', name: 'The Discovery Path', x: 18030, y: G - 268 },
  { id: 'studio', num: '03', name: 'The First Workplace', x: 18180, y: G - 232 },
  { id: 'academy', num: '04', name: 'The Knowledge Academy', x: 18330, y: G - 270 },
  { id: 'camp', num: '05', name: "The Mentor's Camp", x: 18480, y: G - 236 },
  { id: 'classroom', num: '06', name: 'The School Classroom', x: 18630, y: G - 272 },
];

// Separate areas of the world: the camera stays inside the one you're in,
// and doors move you between them.
export const AREAS = [
  { id: 'outdoor', min: 0, max: 9870 },
  { id: 'studio', min: INTERIOR.x0 - 20, max: 12320 },
  { id: 'campus', min: CAMPUS.x0 - 20, max: 15880 },
  { id: 'camp', min: CAMP.x0 - 20, max: 19300 },
  { id: 'classroom', min: SCHOOL.x0 - 20, max: WORLD.width },
];
export function areaOf(x) {
  if (x < 9990) return AREAS[0];
  if (x < 12360) return AREAS[1];
  if (x < 15950) return AREAS[2];
  if (x < 19360) return AREAS[3];
  return AREAS[4];
}
export const STATIONS = [
  { id: 'graphic', num: '01', name: 'Graphic Design', x: 10650 },
  { id: 'motion', num: '02', name: 'Motion Design', x: 10930 },
  { id: 'visual', num: '03', name: 'Visual Design', x: 11210 },
  { id: 'product', num: '04', name: 'Product Design', x: 11490 },
];
export const DESIGN_WALL = { x: 11780 };
export const ACADEMY = { sign: 11990, door: 12165 };
// The Four-Armed Creative Golem sits in the corner between the desks and the design wall.
export const GOLEM = { x: 11650, arena: 11520, girl: 11468, book: 11572 };
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
  // the studio's back wall, and the campus gates (closed until they open)
  solids.push({ x: 12290, y: -800, w: 140, h: 1400, kind: 'wall' });
  solids.push({ ...GATE_BARRIER });
  // walls between the campus, the camp and the classroom memory; the camp's bridge
  solids.push({ x: 15880, y: -800, w: 140, h: 1400, kind: 'wall' });
  solids.push({ x: 19290, y: -800, w: 150, h: 1400, kind: 'wall' });
  solids.push({ x: CAMP.stream.x0 - 10, y: G, w: CAMP.stream.x1 - CAMP.stream.x0 + 20, h: 8, kind: 'bridge' });
  solids.push({ ...FINALE_GATE });
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
  if (x >= 16450 && x <= 16570) return G;
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
  // --- Stage 5: the Knowledge Academy campus
  { type: 'campusBackdrop', x: 12420 },
  { type: 'arrivalArch', x: CAMPUS.entry - 30 },
  { type: 'noticeBoard', x: 12600 },
  { type: 'campusTree', x: 12640, h: 150, r: 42, kind: 'green' },
  { type: 'campusGate', x: CAMPUS.gate },
  { type: 'infoBoard', x: CAMPUS.board },
  { type: 'campusLamp', x: 12940 },
  { type: 'flowerbed', x: 12990, w: 70 },
  { type: 'classroom', x: CLASSROOM.x0 },
  { type: 'campusLamp', x: 13510 },
  { type: 'library', x: LIBRARY.x0 },
  { type: 'campusLamp', x: 14010 },
  { type: 'lab', x: LAB.x0 },
  { type: 'campusLamp', x: 14520 },
  { type: 'foundationWall', x: FOUNDATION.x0 },
  { type: 'campusTree', x: 15160, h: 160, r: 46, kind: 'blossom' },
  { type: 'bench', x: 15250 },
  { type: 'fountain', x: 15360 },
  { type: 'flowerbed', x: 15420, w: 60 },
  { type: 'campusTree', x: 15480, h: 140, r: 40, kind: 'green' },
  { type: 'mentorPath', x: MENTOR.sign },
  { type: 'campusTree', x: 15800, h: 170, r: 48, kind: 'green' },
  // --- Stage 6: the Mentor's Camp
  { type: 'campArrival', x: 16100 },
  { type: 'bigForestTree', x: 16180, h: 200, r: 50, kind: 'green' },
  { type: 'campLantern', x: 16260 },
  { type: 'ferns', x: 16290, w: 60 },
  { type: 'bigForestTree', x: 16380, h: 180, r: 44, kind: 'blossom' },
  { type: 'campStream', x: 16460 },
  { type: 'campLantern', x: 16600 },
  { type: 'mentorSign', x: 16690 },
  { type: 'mushrooms', x: 16760 },
  { type: 'cabin', x: 16820 },
  { type: 'campLantern', x: 17280 },
  { type: 'nextChapterSign', x: 17390 },
  { type: 'bigForestTree', x: 17460, h: 210, r: 52, kind: 'green' },
  // --- Stage 7: the Great Overlook
  { type: 'overlookRocks', x: 17600 },
  { type: 'flowers', x: 17680, w: 90 },
  { type: 'glowFlowers', x: 17820, w: 120 },
  { type: 'flowers', x: 18020, w: 120 },
  { type: 'platform', x: OVERLOOK.platform.x0 },
  { type: 'designCanvas', x: OVERLOOK.canvas },
  { type: 'glowFlowers', x: 18800, w: 160 },
  { type: 'chapterGate', x: OVERLOOK.gate },
  // --- the school memory
  { type: 'schoolroom', x: SCHOOL.x0 },
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
  // stage 5
  { x: CAMPUS.entry - 30, y: G - 50, r: 70, kind: 'academy' },
  { x: CAMPUS.gate - 58, y: G - 104, r: 40, kind: 'lantern' },
  { x: CAMPUS.gate + 58, y: G - 104, r: 40, kind: 'lantern' },
  ...[12940, 13510, 14010, 14520].map((x) => ({ x, y: G - 76, r: 44, kind: 'lantern' })),
  { x: 13270, y: G - 150, r: 60, kind: 'window' },
  { x: 13760, y: G - 150, r: 60, kind: 'window' },
  { x: LAB.station, y: G - 90, r: 60, kind: 'screen' },
  { x: 14860, y: G - 120, r: 120, kind: 'academy' },
  { x: MENTOR.sign, y: G - 120, r: 80, kind: 'campfire' },
  { x: MENTOR.door + 60, y: G - 20, r: 60, kind: 'campfire' },
  // stage 6: the camp at dusk
  ...[16260, 16600, 17280].map((x) => ({ x, y: G - 60, r: 46, kind: 'lantern' })),
  { x: CAMP.sign, y: G - 110, r: 50, kind: 'lantern' },
  { x: 16940, y: G - 150, r: 48, kind: 'lantern' },
  { x: 17140, y: G - 150, r: 48, kind: 'lantern' },
  { x: 17200, y: G - 20, r: 60, kind: 'campfire' },
  { x: CAMP.nextSign, y: G - 110, r: 70, kind: 'academy', after: 'mentor-return' },
  // stage 7: the overlook
  { x: OVERLOOK.canvas, y: G - 120, r: 90, kind: 'academy', after: 'identity' },
  { x: OVERLOOK.gate, y: G - 90, r: 120, kind: 'campfire', after: 'next-adventure' },
  // the school memory: morning sunlight through the windows
  ...[19520, 19760, 20000, 20220].map((x) => ({ x, y: G - 150, r: 70, kind: 'window' })),
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
  { id: 'studio', x: 9650, y: G, label: 'Go inside', range: 44 },
  // stage 4
  { id: 'studio-exit', x: 10150, y: G, label: 'Go outside', range: 26 },
  ...STATIONS.map((st) => ({ id: `station-${st.id}`, x: st.x - 10, y: G, label: `${st.name} station`, range: 40, station: st.id })),
  { id: 'boss-book', x: GOLEM.book, y: G, label: 'Boss Book', range: 22, after: 'golem-defeated' },
  { id: 'design-wall', x: 11780, y: G, label: 'Look at the wall', range: 40 },
  { id: 'academy', x: 12165, y: G, label: 'Explore', range: 46 },
  // stage 5
  { id: 'campus-exit', x: CAMPUS.entry - 30, y: G, label: 'Back to the studio', range: 24 },
  { id: 'info-board', x: CAMPUS.board, y: G, label: 'Read board', range: 30 },
  ...LEARNING.map((o) => ({ id: `learn-${o.id}`, x: o.x, y: G, label: o.name, range: 22, learn: o.id })),
  { id: 'lab', x: LAB.station, y: G, label: 'Try the interface', range: 40 },
  ...PRINCIPLES.map((pr) => ({ id: `principle-${pr.id}`, x: pr.x, y: G, label: pr.name, range: 22, principle: pr.id })),
  { id: 'mentor', x: MENTOR.door, y: G, label: 'Explore', range: 46 },
  // stage 6
  { id: 'camp-exit', x: CAMP.entry - 20, y: G, label: 'Back to the campus', range: 22 },
  { id: 'blackboard', x: SCHOOL.board, y: G, label: 'Solve it', range: 50, only: 'puzzle' },
  { id: 'mentor-talk', x: CAMP.mentor - 30, y: G, label: 'Talk to UX Anudeep', range: 30, after: 'mentor-return' },
  // stage 7
  ...MEMORIES.map((m) => ({ id: `memory-${m.id}`, x: m.x, y: m.x > 18236 && m.x < 18720 ? G - 40 : G, label: m.name, range: 22, memory: m.id })),
  { id: 'chapter2', x: OVERLOOK.gate, y: G, label: 'Continue', range: 50, after: 'next-adventure' },
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
  { id: 'golem', x: 11470, needs: 'hats' },
  { id: 'missing-piece', x: 11760, needs: 'golem-defeated' },
  { id: 'decision', x: 11990, needs: 'missing-piece' },
  // stage 5
  { id: 'academy-door', x: 12150, mode: 'scroll', needs: 'decision' },
  { id: 'campus-arrive', x: CAMPUS.gate - 90 },
  { id: 'campus-enter', x: CAMPUS.board + 60, needs: 'campus-arrive' },
  { id: 'fundamentals', x: CLASSROOM.x0 + 40 },
  { id: 'library', x: LIBRARY.x0 + 30 },
  { id: 'lab', x: LAB.station - 40, mode: 'scroll' },
  { id: 'horizon', x: 15400 },
  // stage 6
  { id: 'mentor-door', x: MENTOR.door - 6, mode: 'scroll', needs: 'horizon' },
  { id: 'camp-arrive', x: CAMP.sign - 30 },
  { id: 'mentor-meet', x: CAMP.mentor - 120 },
  // stage 7
  { id: 'overlook-arrive', x: 17700, needs: 'mentor-return' },
  { id: 'recap', x: 18100, needs: 'overlook-arrive' },
  { id: 'identity', x: OVERLOOK.canvas - 40, needs: 'recap' },
  { id: 'next-adventure', x: OVERLOOK.gate - 120, needs: 'identity' },
  { id: 'chapter2', x: OVERLOOK.gate - 50, mode: 'scroll', needs: 'next-adventure' },
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
  { id: 'workplace', x: 10190, name: 'Valluva HCM Cloud Suite' },
  { id: 'golem', x: 11470, name: 'the Creative Golem' },
  { id: 'academy-door', x: 11900, name: 'the Knowledge Academy door' },
  { id: 'campus', x: CAMPUS.entry, name: 'The Knowledge Academy' },
  { id: 'lab', x: LAB.x0, name: 'the interaction design lab' },
  { id: 'courtyard', x: 15150, name: 'the courtyard' },
  { id: 'camp', x: CAMP.entry, name: "The Mentor's Camp" },
  { id: 'overlook', x: 17700, name: 'the Great Overlook' },
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
  { id: 'studio-seen', x: 9160, who: 'girl', text: 'There\'s an office up ahead!' },
  { id: 'desks', x: 10600, mode: 'explore', who: 'girl', text: 'Let\'s check out every desk. Press E at each one!' },
  { id: 'golem-seen', x: 11330, who: 'girl', text: 'What is that huge old machine in the corner…?' },
  { id: 'classroom-hint', x: CLASSROOM.x0 + 90, mode: 'explore', who: 'girl', text: 'Everything in here has a lesson. Press E to look closer!' },
  { id: 'wall-hint', x: FOUNDATION.x0 - 30, who: 'girl', text: 'Look at that wall… it\'s lighting up!' },
  { id: 'camp-quiet', x: 16300, who: 'girl', text: 'It\'s so peaceful out here.' },
  { id: 'sunrise', x: 17600, who: 'girl', text: 'Look… the sun is coming up.' },
];

export const LANDMARKS = {
  start: 380,
  workshop: 3000,     // 01 The Old Workshop
  gateway: 6150,      // 02 The Discovery Path (through the gateway)
  station: 7420,      // 03 The Learning Camp (the learning station)
  studio: 9650,       // doorstep of 04 The First Workplace
  workplace: 10190,   // 04 The First Workplace (inside the studio)
  academy: 12165,     // doorstep of 05 The Knowledge Academy
  campus: 12520,      // 05 The Knowledge Academy (on campus)
  mentor: 15660,      // doorstep of 06 The Mentor's Camp
  camp: 16100,        // 06 The Mentor's Camp
  overlook: 17700,    // 07 The Awakening
  finale: 19050,      // the Chapter 02 gateway
};
