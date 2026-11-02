import { WORLD } from '../config.js';

// Level layout for Stage 1: the starting world that leads to the Old Workshop.
// Collision, decoration placement, interactables and story beats all live here
// so art, physics and story share one source of truth.

const G = WORLD.ground;

export const TERRAIN = [
  // [x0, x1, top]
  [0, 860, G],
  [860, 1060, G - 24],
  [1060, 1084, G - 48],
  [1084, 1200, G - 72],   // plateau with the Journey Map
  [1200, 1224, G - 48],
  [1224, 1330, G - 24],
  // 1330..1530: stream + waterfall, crossed by the stone bridge
  [1530, 1680, G - 24],
  [1680, WORLD.width, G],
];

export const BRIDGE = { x0: 1318, x1: 1542, y: G - 24 };

export const PLATFORMS = [
  // one-way floating platforms (jump up through, stand on top, S/↓ to drop)
  { x: 1772, y: G - 60, w: 54, kind: 'log' },
  { x: 1872, y: G - 112, w: 104, kind: 'island' },
  { x: 2010, y: G - 66, w: 40, kind: 'stone' },
];

export const CRATES = [
  { x: 2570, w: 26, h: 22 },
];

export function buildSolids() {
  const solids = [];
  const deep = WORLD.height + 80;
  for (const [x0, x1, top] of TERRAIN) {
    solids.push({ x: x0, y: top, w: x1 - x0, h: deep - top, kind: 'ground' });
  }
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
  { type: 'flowers', x: 2440, w: 80 },
  { type: 'bush', x: 2520, s: 0.9 },
  { type: 'gearProp', x: 2660 },
  { type: 'bannerPole', x: 2712 },
  { type: 'workshop', x: 2740 },
  { type: 'barrel', x: 3075 },
  { type: 'barrel', x: 3092 },
  { type: 'tree', x: 3200, h: 140, r: 40, kind: 'green' },
  { type: 'bush', x: 3290, s: 1.2 },
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
  { x: 2890, y: G - 162, r: 48, kind: 'window' },
  { x: 2830, y: G - 70, r: 34, kind: 'lamp' },
  { x: 2950, y: G - 70, r: 34, kind: 'lamp' },
];

export const SMOKE = [
  { x: 731, y: G - 122 },
  { x: 3007, y: G - 212 },
];

export const WATERFALL = { x: 1392, w: 52, top: 132, bottom: G + 40 };
export const POND = { x0: 1330, x1: 1530, y: G + 28 };

// Interactable objects: E / tap to interact.
export const INTERACTABLES = [
  { id: 'welcome-sign', x: 296, y: G, label: 'Read sign', range: 34 },
  { id: 'home', x: 668, y: G, label: 'Knock', range: 26 },
  { id: 'journey-map', x: 1142, y: G - 72, label: 'View map', range: 34 },
  { id: 'lookout', x: 1924, y: G - 112, label: 'Look out', range: 40 },
  { id: 'workshop-door', x: 2890, y: G, label: 'Try the door', range: 44 },
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
  { id: 'remember', x: 2700, who: 'boy', text: 'I remember this place.' },
];

export const LANDMARKS = {
  start: 380,
  workshop: 2880,
};
