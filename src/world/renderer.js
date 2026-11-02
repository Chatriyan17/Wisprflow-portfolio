// Layered world renderer: parallax backgrounds, the baked main layer, animated
// details (water, smoke, grass, lights) and the atmospheric lighting pass.
// Characters are drawn by the game between the main layer and the front pass.

import { WORLD, REDUCED_MOTION } from '../config.js';
import { makeCanvas } from '../engine/assets.js';
import { rng } from '../engine/rng.js';
import { px, disc, bayer, line, ellipse, dither, mix } from './pixel.js';
import * as Art from './art.js';
import * as Ind from './industrial.js';
import * as Forest from './forest.js';
import * as Studio from './studio.js';
import * as Campus from './campus.js';
import {
  TERRAIN, BRIDGE, PLATFORMS, CRATES, PROPS, LIGHTS, SMOKE, STEAM, WATERFALL, POND,
  REGIONS, HALL, CONVEYOR, PORTAL, STREAM, WOOD_BRIDGE, STATION, HILL, ISLANDS,
  STATIONS, DESIGN_WALL, ACADEMY, INTERIOR,
  CAMPUS, CLASSROOM, LIBRARY, LAB, FOUNDATION, MENTOR, PRINCIPLES, areaOf,
} from './level.js';

// The seven design principles on the Foundation Wall, as small pixel symbols.
export function drawPrinciple(ctx, id, x, y, lit) {
  x = Math.round(x); y = Math.round(y);
  const c = lit ? '#fff2c4' : '#5a5274';
  const a = lit ? '#ffd98a' : '#4a4264';
  if (id === 'hierarchy') { px(ctx, c, x - 9, y - 7, 18, 4); px(ctx, a, x - 9, y - 1, 12, 3); px(ctx, a, x - 9, y + 4, 7, 2); }
  else if (id === 'gestalt') { for (const [dx, dy] of [[-6, -5], [-2, -5], [-6, -1], [-2, -1], [4, 2], [8, 2], [4, 6], [8, 6]]) disc(ctx, dx < 0 ? c : a, x + dx, y + dy, 1); }
  else if (id === 'typography') { px(ctx, c, x - 8, y - 6, 2, 12); px(ctx, c, x - 2, y - 6, 2, 12); px(ctx, c, x - 6, y - 7, 4, 2); px(ctx, c, x - 6, y - 1, 4, 2); px(ctx, a, x + 2, y - 1, 6, 2); px(ctx, a, x + 7, y, 2, 6); px(ctx, a, x + 2, y + 2, 5, 2); px(ctx, a, x + 2, y + 5, 6, 2); }
  else if (id === 'research') { disc(ctx, c, x - 2, y - 2, 6); disc(ctx, lit ? '#3a2a5a' : '#251f36', x - 2, y - 2, 4); for (let k = 0; k < 5; k++) px(ctx, a, x + 2 + k, y + 2 + k, 2, 2); }
  else if (id === 'empathy') { disc(ctx, c, x - 3, y - 3, 4); disc(ctx, c, x + 3, y - 3, 4); for (let k = 0; k < 7; k++) px(ctx, c, x - 7 + k, y - 1 + k, 14 - k * 2, 1); }
  else if (id === 'patterns') { px(ctx, a, x - 9, y + 1, 12, 6); px(ctx, c, x - 9, y - 7, 12, 6); for (let k = 0; k < 6; k++) px(ctx, c, x + 3, y - 2 + k, Math.max(1, 5 - k), 1); }
  else if (id === 'usability') { disc(ctx, c, x, y, 8); disc(ctx, lit ? '#3a6a4a' : '#251f36', x, y, 6); for (let k = 0; k < 3; k++) px(ctx, c, x - 4 + k, y + k - 1, 2, 2); for (let k = 0; k < 5; k++) px(ctx, c, x - 1 + k, y + 1 - k, 2, 2); }
}

const HAT_COLORS = { graphic: '#e06a58', motion: '#9a7ad0', visual: '#4fb3a8', product: '#e3b13c' };

// Little creative-hat badges: a palette, a film frame, an eye and a cursor.
export function drawHatIcon(ctx, id, x, y, scale = 1) {
  x = Math.round(x); y = Math.round(y);
  const r = Math.round(8 * scale);
  disc(ctx, '#1d1222', x, y, r + 1);
  disc(ctx, HAT_COLORS[id] || '#5a4062', x, y, r);
  disc(ctx, '#f3e6d2', x, y, Math.max(2, r - 2));
  if (scale < 0.7) return;
  if (id === 'graphic') {
    ellipse(ctx, '#d8b890', x, y, 5, 4);
    px(ctx, '#e06a58', x - 3, y - 2, 2, 2); px(ctx, '#4fb3a8', x, y - 3, 2, 2); px(ctx, '#e3b13c', x + 2, y - 1, 2, 2);
    px(ctx, '#f3e6d2', x - 1, y + 1, 2, 2);
  } else if (id === 'motion') {
    px(ctx, '#2b2330', x - 5, y - 4, 10, 8);
    for (let k = 0; k < 3; k++) { px(ctx, '#f3e6d2', x - 4 + k * 3, y - 4, 2, 1); px(ctx, '#f3e6d2', x - 4 + k * 3, y + 3, 2, 1); }
    px(ctx, '#ff9ad5', x - 1, y - 2, 1, 4); px(ctx, '#ff9ad5', x, y - 1, 1, 2);
  } else if (id === 'visual') {
    ellipse(ctx, '#2b2330', x, y, 6, 3);
    ellipse(ctx, '#ffffff', x, y, 5, 2);
    disc(ctx, '#4fb3a8', x, y, 2);
    px(ctx, '#2b2330', x, y, 1, 1);
  } else if (id === 'product') {
    px(ctx, '#2b2330', x - 5, y - 4, 8, 7);
    px(ctx, '#ffffff', x - 4, y - 3, 6, 5);
    px(ctx, '#c8c8d8', x - 4, y - 3, 6, 1);
    for (let k = 0; k < 5; k++) px(ctx, '#1d1222', x + 1, y - 1 + k, Math.max(1, 4 - k), 1);
  } else {
    // the "hat": a painter's beret
    ellipse(ctx, '#5a3a7a', x, y + 1, 6, 3);
    px(ctx, '#7a5aa0', x - 4, y - 1, 8, 1);
    px(ctx, '#2b2330', x, y - 4, 1, 2);
  }
}

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// 0 in the village, 1 in the industrial district, fading again towards the gateway.
export function industryAt(x) {
  return smooth(REGIONS.industryStart, REGIONS.industryFull, x) * (1 - smooth(REGIONS.industryEnd - 200, REGIONS.gatewayFull, x));
}
export function forestAt(x) {
  return smooth(REGIONS.forestStart, REGIONS.forestStart + 300, x);
}
export function gatewayAt(x) {
  return smooth(REGIONS.industryEnd - 300, REGIONS.gatewayFull, x);
}

const LIGHT_COLORS = {
  lantern: [255, 200, 120], window: [255, 200, 120], lamp: [255, 200, 120],
  sodium: [255, 168, 70], hanglamp: [255, 214, 150], beacon: [255, 140, 40],
  panel: [120, 255, 170], vending: [255, 130, 100], bulb: [255, 222, 160], portal: [160, 130, 255],
  glow: [130, 220, 255], screen: [150, 200, 255], neon: [255, 150, 210], academy: [210, 228, 255],
  campfire: [255, 150, 70],
};

function gearRot(ctx, x, y, r, angle, colors) {
  const teeth = Math.max(6, Math.round(r * 0.6));
  for (let i = 0; i < teeth; i++) {
    const a = angle + (i / teeth) * Math.PI * 2;
    px(ctx, colors[0], x + Math.cos(a) * (r + 1) - 2, y + Math.sin(a) * (r + 1) - 2, 4, 4);
  }
  disc(ctx, colors[0], x, y, r);
  disc(ctx, colors[1], x, y, r - 2);
  for (let i = 0; i < 4; i++) {
    const a = angle + (i / 4) * Math.PI * 2 + 0.4;
    disc(ctx, colors[0], x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, Math.max(1, Math.round(r * 0.18)));
  }
  disc(ctx, colors[2], x, y, Math.max(1, Math.round(r * 0.25)));
}

const G = WORLD.ground;
const OY = 240;                 // canvas y = world y + OY  (room for tall trees / sky props)
const LAYER_H = WORLD.height + OY;
const MAX_VIEW_W = 1200;
const BASE_CAM_Y = 40;

// Draw a region of `img` 1:1 at (dx, dy), clipped to the image bounds (never stretched).
function blit(ctx, img, sx, sy, w, h, dx, dy) {
  sx = Math.round(sx); sy = Math.round(sy);
  const x0 = Math.max(0, sx), y0 = Math.max(0, sy);
  const x1 = Math.min(img.width, sx + w), y1 = Math.min(img.height, sy + h);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0, Math.round(dx + x0 - sx), Math.round(dy + y0 - sy), x1 - x0, y1 - y0);
}

// Tiny "Aa" glyph drawn with rects (cheap enough to draw every frame).
function pixelTextCentered(ctx, text, x, y, size, color, shadow) {
  Art.pixelTextOn(ctx, text, x, y, size, color, shadow);
}

function pixelLike(ctx, x, y, _text, c) {
  px(ctx, c, x, y + 2, 1, 7); px(ctx, c, x + 4, y + 2, 1, 7); px(ctx, c, x + 1, y + 1, 3, 1); px(ctx, c, x + 1, y + 5, 3, 1);
  px(ctx, c, x + 7, y + 4, 3, 1); px(ctx, c, x + 10, y + 5, 1, 4); px(ctx, c, x + 7, y + 6, 3, 1); px(ctx, c, x + 6, y + 7, 1, 2); px(ctx, c, x + 7, y + 8, 4, 1);
}

function poster2(ctx, x, y, c) {
  px(ctx, '#1d1222', x - 1, y - 1, 26, 40);
  px(ctx, c[0], x, y, 24, 38);
  disc(ctx, c[1], x + 12, y + 14, 7);
  px(ctx, c[2], x + 3, y + 28, 18, 3);
  px(ctx, c[2], x + 3, y + 33, 12, 2);
}

export class WorldRenderer {
  constructor() {
    this.layers = [];
    this.clouds = [];
    this.smoke = [];
    this.petals = [];
    this.fireflies = [];
    this.dust = [];
    this.time = 0;
  }

  build() {
    const r = rng(20221);

    // --- sky strip (virtual y -600 .. WORLD.height)
    const [sky, sctx] = makeCanvas(64, WORLD.height + 600);
    Art.paintSky(sctx, 64, WORLD.height + 600, -600);
    this.sky = sky;

    // --- sun
    const [sun, sunCtx] = makeCanvas(100, 100);
    Art.paintSun(sunCtx, 50, 50);
    this.sun = sun;

    // --- clouds
    for (let i = 0; i < 9; i++) {
      const w = r.int(40, 96);
      const [c, cctx] = makeCanvas(w, w * 0.5 + 8);
      Art.makeCloud(cctx, r, w);
      this.clouds.push({ img: c, x: r.range(0, 2400), y: r.range(-40, 150), f: r.range(0.06, 0.16), speed: r.range(2, 6) });
    }

    // --- parallax layers
    const layer = (f, paint) => {
      const w = Math.ceil(WORLD.width * f + MAX_VIEW_W);
      const [c, ctx] = makeCanvas(w, LAYER_H);
      ctx.translate(0, OY);
      paint(ctx, w);
      this.layers.push({ canvas: c, f });
    };
    // Replace nature with an industrial skyline in the part of each layer that is
    // seen while walking through the industrial district.
    const industrialize = (ctx, w, f, depth, baseY, fill) => {
      const L = (wx) => (wx - 320) * f + 320;
      const worldOf = (lx) => (lx - 320) / f + 320;
      const c0 = Math.round(L(REGIONS.industryFull + 120)), c1 = Math.round(L(REGIONS.industryEnd - 250));
      ctx.clearRect(c0, -OY, c1 - c0, LAYER_H);
      px(ctx, fill, c0, baseY, c1 - c0, 400);
      const rr = rng(101 + depth);
      Ind.paintSkyline(ctx, rr, L(REGIONS.industryStart - 100), L(REGIONS.industryEnd + 260), baseY, depth, (lx) => industryAt(worldOf(lx)) * 1.1);
    };
    layer(0.12, (ctx, w) => Art.paintMountains(ctx, w, G - 40, rng(7)));
    layer(0.25, (ctx, w) => { Art.paintRuinsAndIslands(ctx, w, G - 20, rng(11)); industrialize(ctx, w, 0.25, 0, G - 18, '#9d7aa8'); });
    layer(0.42, (ctx, w) => { Art.paintHills(ctx, w, G + 4, rng(13)); industrialize(ctx, w, 0.42, 1, G + 2, '#6c6676'); });
    layer(0.65, (ctx, w) => {
      const rr = rng(17);
      for (let x = 30; x < w; x += rr.int(60, 120)) {
        Art.paintTree(ctx, rr, x, G + 2, { h: rr.int(90, 150), r: rr.int(24, 40), kind: rr.chance(0.35) ? 'blossom' : 'green' });
      }
      for (let x = 0; x < w; x += rr.int(40, 80)) Art.paintBush(ctx, rr, x, G + 4, rr.range(0.8, 1.4), rr.chance(0.3) ? 'blossom' : 'green');
      px(ctx, '#4f6a2c', 0, G + 2, w, 200);
      industrialize(ctx, w, 0.65, 2, G + 2, '#4a3c48');
      // atmospheric perspective: tint toward the dusk haze
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(122, 84, 140, 0.42)';
      ctx.fillRect(0, -OY, w, LAYER_H);
      ctx.globalCompositeOperation = 'source-over';
    });

    // --- main layer (1:1 with world)
    const [main, mctx] = makeCanvas(WORLD.width, LAYER_H);
    mctx.translate(0, OY);
    this.paintMain(mctx);
    this.main = main;

    // --- bridge: drawn after the waterfall but behind the characters
    const [bridge, bctx] = makeCanvas(BRIDGE.x1 - BRIDGE.x0 + 24, LAYER_H);
    bctx.translate(-(BRIDGE.x0 - 12), OY);
    Art.paintBridge(bctx, rng(5150), BRIDGE.x0, BRIDGE.x1, BRIDGE.y + 6, POND.y + 2);
    this.bridge = bridge;

    // --- front pass (drawn after characters): bridge parapet
    const [front, fctx] = makeCanvas(5200, LAYER_H);   // only the bridge parapet and catwalk rails live here
    fctx.translate(0, OY);
    Art.paintBridgeRail(fctx, BRIDGE.x0 - 2, BRIDGE.x1 - 6, BRIDGE.y + 6);
    Ind.paintHallFront(fctx, G);
    this.front = front;

    // --- waterfall texture
    const [wf, wctx] = makeCanvas(WATERFALL.w, 128);
    for (let x = 0; x < WATERFALL.w; x++) {
      const phase = (x * 7) % 13;
      for (let y = 0; y < 128; y++) {
        const v = (y + phase * 5 + Math.sin(x * 0.7) * 6) % 32;
        const c = v < 3 ? '#ffffff' : v < 10 ? '#d6e2f6' : v < 22 ? '#a9bde8' : '#8ba0d8';
        px(wctx, c, x, y);
      }
    }
    px(wctx, '#ffffff', 0, 0, 1, 128);
    px(wctx, '#6f82c4', WATERFALL.w - 2, 0, 2, 128);
    this.waterfall = wf;

    // --- animated grass blades along walkable tops
    this.blades = [];
    const br = rng(29);
    for (const [x0, x1, top, mat] of TERRAIN) {
      if (mat === 'concrete' || mat === 'factory' || mat === 'studio' || mat === 'campus') continue;
      for (let x = x0 + 2; x < x1 - 2; x += br.int(3, 7)) {
        const t = (x - x0) / (x1 - x0);
        if (mat === 'toConcrete' && br() < t * 1.2) continue;
        if (mat === 'toGlow' && br() > t + 0.2) continue;
        if (mat === 'forest' && br() < 0.15) continue;
        this.blades.push({ x, y: top + br.int(0, 4), h: br.int(3, 8), c: br.pick(['#a8bc52', '#c3cf63', '#7f9a3e']), p: br.range(0, 6) });
      }
    }
    // --- foreground silhouettes (parallax 1.25)
    this.fg = [];
    const fr = rng(31);
    for (let x = 0; x < WORLD.width * 1.25 + MAX_VIEW_W; x += fr.int(18, 44)) {
      if (fr.chance(0.45)) continue;   // leave gaps so the world stays readable
      this.fg.push({ x, h: fr.int(10, 30), w: fr.int(3, 7), kind: fr.chance(0.12) ? 'daisy' : fr.chance(0.18) ? 'fern' : 'clump', p: fr.range(0, 6) });
    }

    // --- particles
    const pr = rng(37);
    for (let i = 0; i < (REDUCED_MOTION ? 0 : 36); i++) {
      this.petals.push({ x: pr.range(0, 1200), y: pr.range(-50, 400), vx: pr.range(-18, -6), vy: pr.range(8, 18), p: pr.range(0, 6), c: pr.pick(['#f2b3c8', '#fde3ec', '#d98aa6']) });
    }
    const cozy = LIGHTS.filter((l) => ['lantern', 'window', 'bulb', 'portal', 'glow'].includes(l.kind) && l.x < 6200);
    for (let i = 0; i < (REDUCED_MOTION ? 0 : 60); i++) {
      const anchor = cozy[i % cozy.length];
      this.fireflies.push({ ax: anchor.x + pr.range(-90, 90), ay: anchor.y + pr.range(-40, 50), p: pr.range(0, 10), s: pr.range(0.4, 1), c: anchor.kind === 'portal' ? '#b8f4ff' : '#fff2a8' });
    }
    // dust motes drifting in the factory window light
    this.motes = [];
    for (let i = 0; i < (REDUCED_MOTION ? 0 : 50); i++) {
      this.motes.push({ x: pr.range(HALL.x0 + 40, HALL.x1 - 40), y: pr.range(HALL.roof + 30, G - 20), p: pr.range(0, 10) });
    }
    // --- stage 3: industry islands, floating books / pages, discoveries
    this.islands = ISLANDS.map((isl, i) => ({ ...isl, img: Forest.makeIslandCanvas(isl.id, isl.name, rng(700 + i)), t: 0, shown: false, p: i * 1.3 }));
    this.links = 0;          // 0..1 how far the glowing pathways have grown
    this.linksOn = false;
    this.discoveries = 0;    // 0..1 the course discoveries floating out of the station
    this.discoveriesOn = false;
    this.books = [];
    const bkr = rng(77);
    for (let x = 6300; x < 7700; x += bkr.int(50, 110)) {
      this.books.push({ x, y: G - bkr.int(60, 150), p: bkr.range(0, 6), kind: bkr.chance(0.55) ? 'page' : 'book', c: bkr.pick(['#8c3b3b', '#3a6eb0', '#5b7a36', '#7a5ab8', '#c08a2a']) });
    }
    for (let i = 0; i < (REDUCED_MOTION ? 0 : 50); i++) {
      this.fireflies.push({ ax: pr.range(6300, 9800), ay: G - pr.range(10, 140), p: pr.range(0, 10), s: pr.range(0.3, 0.9), c: pr.pick(['#fff2a8', '#b8f4ff', '#ffc8ec']) });
    }

    // --- stage 4: the studio
    this.stations = Object.fromEntries(STATIONS.map((st) => [st.id, { on: false, t: 0, found: false }]));
    this.hats = { cycle: false, cycleT: 0, pops: [], orbit: 0, orbitT: 0 };
    this.quiet = 0;
    this.quietTarget = 0;
    this.studioDoorOpen = 0;
    this.designBits = [];
    const dbr = rng(99);
    for (let i = 0; i < (REDUCED_MOTION ? 8 : 40); i++) {
      this.designBits.push({ x: dbr.range(9150, 9760), y: G - dbr.range(10, 170), p: dbr.range(0, 6), kind: dbr.int(0, 3), c: dbr.pick(['#ff9ad5', '#8eeaff', '#ffd98a', '#9effc8', '#b79cff']) });
    }
    for (let x = 9200; x < 9620; x += 70) this.books.push({ x, y: G - 70 - ((x * 7) % 80), p: x * 0.01, kind: 'doc', c: '#ffffff' });

    // --- stage 5: the campus
    this.gateOpen = 0;
    this.gateTarget = 0;
    this.principlesLit = PRINCIPLES.map(() => 0);
    this.labSolved = false;
    this.mentorSign = 0;
    this.mentorTarget = 0;
    {
      const [mc, mctx2] = makeCanvas(230, 70);
      // a dark wooden panel behind the glowing words so they read over any background
      mctx2.fillStyle = '#1d1222'; mctx2.fillRect(2, 0, 226, 64);
      mctx2.fillStyle = '#3a2418'; mctx2.fillRect(4, 2, 222, 60);
      mctx2.fillStyle = '#f5a24a'; mctx2.fillRect(4, 2, 222, 1); mctx2.fillRect(4, 61, 222, 1);
      pixelTextCentered(mctx2, 'THE MENTOR\'S CAMP', 115, 6, 16, '#ffe8a8', '#5a3a1a');
      pixelTextCentered(mctx2, 'LEARNING THE PRINCIPLES IS ONE THING.', 115, 34, 8, '#f6ead2', '#3a2a1a');
      pixelTextCentered(mctx2, 'LEARNING HOW TO THINK IS ANOTHER.', 115, 46, 8, '#f6ead2', '#3a2a1a');
      this.mentorSignImg = mc;
    }

    // conveyor boxes and the press
    this.boxes = [];
    this.boxTimer = 0;
    this.press = { t: 0, hit: false };
    this.events = [];
  }

  paintMain(ctx) {
    const r = rng(4242);
    const bottom = WORLD.height + 10;
    Art.paintBackCliff(ctx, r, 1326, 1536, WATERFALL.top - 12, bottom);
    Art.paintPondBase(ctx, POND.x0 - 4, POND.x1 + 4, POND.y, bottom);
    Forest.paintStream(ctx, STREAM.x0, STREAM.x1, STREAM.y, bottom);

    // props behind the terrain lip (big tree canopy etc.)
    const sorted = [...TERRAIN].sort((a, b) => b[2] - a[2]);
    for (const [x0, x1, top, mat] of sorted) {
      if (mat === 'forest') Forest.paintForestGround(ctx, r, x0, x1, top, bottom);
      else if (mat === 'studio') Studio.paintStudioFloor(ctx, r, x0, x1, top, bottom);
      else if (mat === 'campus') Campus.paintCampusGround(ctx, r, x0, x1, top, bottom);
      else Ind.paintGround(ctx, r, x0, x1, top, bottom, mat);
    }

    const groundAt = (x) => {
      for (const [x0, x1, top] of TERRAIN) if (x >= x0 && x < x1) return top;
      return G;
    };
    for (const p of PROPS) {
      const gy = groundAt(p.x);
      switch (p.type) {
        case 'bigTree':
          Art.paintBigTree(ctx, r, p.x, gy);
          Art.paintHangingLantern(ctx, 218, 150, 132);
          Art.paintHangingLantern(ctx, 254, 118, 96);
          Art.paintHangingLantern(ctx, 50, 124, 104);
          break;
        case 'tree': Art.paintTree(ctx, r, p.x, gy, p); break;
        case 'welcomeSign': Art.paintWelcomeSign(ctx, p.x, gy); break;
        case 'flowers': Art.paintFlowers(ctx, r, p.x, gy, p.w); break;
        case 'bush': Art.paintBush(ctx, r, p.x, gy, p.s, p.kind); break;
        case 'lampPost': Art.paintLampPost(ctx, p.x, gy); break;
        case 'fence': Art.paintFence(ctx, p.x, gy, p.w); break;
        case 'house': Art.paintHouse(ctx, r, p.x, gy); break;
        case 'barrel': Art.paintBarrel(ctx, p.x, gy); break;
        case 'rock': Art.paintRock(ctx, p.x, gy, p.s); break;
        case 'mapBoard': Art.paintMapBoard(ctx, r, p.x, gy); break;
        case 'bench': Art.paintBench(ctx, p.x, gy); break;
        case 'pathSign': Art.paintPathSign(ctx, p.x, gy); break;
        case 'gearProp': Art.paintGearProp(ctx, p.x, gy); break;
        case 'workshop': Art.paintWorkshop(ctx, r, p.x, gy); break;
        case 'utilityPole': Ind.paintUtilityPole(ctx, p.x, gy); break;
        case 'chainFence': Ind.paintChainFence(ctx, p.x, gy, p.w); break;
        case 'streetLamp': Ind.paintStreetLamp(ctx, p.x, gy); break;
        case 'pallets': Ind.paintPallets(ctx, r, p.x, gy); break;
        case 'gate': Ind.paintGate(ctx, p.x, gy); break;
        case 'hall': Ind.paintHall(ctx, r, HALL.x0, HALL.x1, HALL.roof, gy); break;
        case 'vending': Ind.paintVending(ctx, p.x, gy); break;
        case 'stringLights': Ind.paintStringLights(ctx, p.x, gy, p.w); break;
        case 'pottedPlant': Ind.paintPottedPlant(ctx, p.x, gy); break;
        case 'breakTable': Ind.paintBreakTable(ctx, p.x, gy); break;
        case 'canteen': Ind.paintCanteen(ctx, p.x, gy); break;
        case 'glowFlowers': Ind.paintGlowFlowers(ctx, r, p.x, gy, p.w); break;
        case 'uxSign': Ind.paintUxSign(ctx, p.x, gy); break;
        case 'curiositySign': Ind.paintCuriositySign(ctx, p.x, gy); break;
        case 'portal': Ind.paintPortalFrame(ctx, p.x, gy); break;
        case 'rubble': Forest.paintRubble(ctx, r, p.x, gy); break;
        case 'pipeBranch': Forest.paintPipeBranch(ctx, r, p.x, gy, p.h); break;
        case 'overgrownLamp': Forest.paintOvergrownLamp(ctx, r, p.x, gy); break;
        case 'mushrooms': Forest.paintMushrooms(ctx, r, p.x, gy); break;
        case 'crystals': Forest.paintCrystals(ctx, p.x, gy); break;
        case 'ferns': Forest.paintFerns(ctx, r, p.x, gy, p.w); break;
        case 'questionSign': Forest.paintQuestionSign(ctx, p.x, gy); break;
        case 'bigForestTree': Forest.paintBigForestTree(ctx, r, p.x, gy, p); break;
        case 'woodBridge': Forest.paintWoodBridge(ctx, WOOD_BRIDGE.x0, WOOD_BRIDGE.x1, WOOD_BRIDGE.y); break;
        case 'station': Forest.paintStation(ctx, r, p.x, gy); break;
        case 'hillStones': Forest.paintHillStones(ctx, p.x, HILL.top); break;
        case 'studioSign': Forest.paintStudioSign(ctx, p.x, gy); break;
        case 'studio': Forest.paintStudio(ctx, r, p.x, gy); break;
        case 'studioInterior': Studio.paintStudioInterior(ctx, r, INTERIOR.x0 - 20, 12320, gy); break;
        case 'creativeStation': Studio.paintCreativeStation(ctx, r, p.x, gy, p); break;
        case 'designWall': Studio.paintDesignWall(ctx, p.x, gy); break;
        case 'academySign': Studio.paintAcademySign(ctx, p.x, gy); break;
        case 'academyDoor': Studio.paintAcademyDoor(ctx, p.x, gy); break;
        case 'campusBackdrop': this.flags = Campus.paintCampusBackdrop(ctx, r, p.x, WORLD.width, gy); break;
        case 'arrivalArch': Campus.paintArrivalArch(ctx, p.x, gy); break;
        case 'noticeBoard': Campus.paintNoticeBoard(ctx, p.x, gy); break;
        case 'campusTree': Campus.paintCampusTree(ctx, r, p.x, gy, p); break;
        case 'campusGate': Campus.paintCampusGatePillars(ctx, p.x, gy); break;
        case 'infoBoard': Campus.paintInfoBoard(ctx, p.x, gy); break;
        case 'campusLamp': Campus.paintCampusLamp(ctx, p.x, gy); break;
        case 'flowerbed': Campus.paintFlowerbed(ctx, r, p.x, gy, p.w); break;
        case 'classroom': Campus.paintClassroom(ctx, r, CLASSROOM.x0, CLASSROOM.x1, gy); break;
        case 'library': Campus.paintLibrary(ctx, r, LIBRARY.x0, LIBRARY.x1, gy); break;
        case 'lab': Campus.paintLab(ctx, r, LAB.x0, LAB.x1, gy); break;
        case 'foundationWall': Campus.paintFoundationWall(ctx, FOUNDATION.x0, gy); break;
        case 'fountain': Campus.paintFountain(ctx, p.x, gy); break;
        case 'mentorPath': Campus.paintMentorPath(ctx, r, p.x, gy); break;
        case 'bannerPole':
          px(ctx, '#3a2a35', p.x - 1, gy - 78, 3, 78);
          px(ctx, '#f5c35b', p.x - 2, gy - 81, 5, 3);
          Art.paintBanner(ctx, p.x + 2, gy - 74);
          break;
        default: break;
      }
    }
    for (const p of PLATFORMS) Art.paintPlatform(ctx, r, p);
    for (const c of CRATES) Art.paintCrate(ctx, c.x, G - c.h, c.w, c.h);
  }

  // Camera y when resting on the main ground for this view size (matches Camera.clampToWorld).
  restY(viewH) {
    const maxY = WORLD.height - viewH;
    const y = G - viewH * 0.75;
    return maxY < 0 ? maxY : Math.min(Math.max(y, -160), maxY);
  }

  layerY(f, camY, rest) {
    return -OY - (rest + (camY - rest) * f * 0.85);
  }

  update(dt) {
    this.time += dt;
    // chimney smoke
    if (!REDUCED_MOTION) {
      for (const s of SMOKE) {
        s.acc = (s.acc || 0) + dt;
        if (s.acc > 0.35) {
          s.acc = 0;
          this.smoke.push({ x: s.x + Math.random() * 4 - 2, y: s.y, r: 2, life: 0, max: 4 + Math.random() * 2 });
        }
      }
    }
    if (!REDUCED_MOTION) {
      for (const s of STEAM) {
        s.acc = (s.acc || Math.random()) + dt;
        if (s.acc > 1.8) {
          s.acc = 0;
          for (let k = 0; k < 4; k++) this.smoke.push({ x: s.x + k * 2, y: s.y, r: 1, life: k * 0.08, max: 1.4, steam: true });
        }
      }
    }
    // stage 5 animations
    this.gateOpen += (this.gateTarget - this.gateOpen) * Math.min(1, dt * 1.6);
    this.mentorSign += (this.mentorTarget - this.mentorSign) * Math.min(1, dt * 0.9);
    for (let i = 0; i < this.principlesLit.length; i++) if (this.principlesLit[i] > 0 && this.principlesLit[i] < 1) this.principlesLit[i] = Math.min(1, this.principlesLit[i] + dt * 2);
    // stage 4 animations
    for (const st of Object.values(this.stations)) if (st.on) st.t += dt * (1 - this.quiet * 0.75);
    if (this.hats.cycle) this.hats.cycleT += dt;
    for (const pop of this.hats.pops) pop.t += dt;
    this.hats.pops = this.hats.pops.filter((pop) => pop.t < 2.4);
    if (this.hats.orbit > 0) this.hats.orbitT += dt;
    this.quiet += (this.quietTarget - this.quiet) * Math.min(1, dt * 1.5);
    // stage 3 animations
    for (const isl of this.islands) if (isl.shown && isl.t < 1) isl.t = Math.min(1, isl.t + dt / (REDUCED_MOTION ? 0.01 : 1.8));
    if (this.linksOn && this.links < 1) this.links = Math.min(1, this.links + dt / (REDUCED_MOTION ? 0.01 : 3.2));
    if (this.discoveriesOn && this.discoveries < 1) this.discoveries = Math.min(1, this.discoveries + dt / (REDUCED_MOTION ? 0.01 : 2));
    // conveyor boxes
    this.boxTimer -= dt;
    if (this.boxTimer <= 0) {
      this.boxTimer = 2.4;
      this.boxes.push({ x: CONVEYOR.x0 + 4, y: 0, vy: 0, falling: false, c: Math.random() < 0.5 ? '#b98052' : '#a8704a' });
    }
    for (const b of this.boxes) {
      if (!b.falling) {
        b.x += CONVEYOR.speed * dt;
        if (b.x > CONVEYOR.x1 + 4) b.falling = true;
      } else {
        b.vy += 400 * dt;
        b.y += b.vy * dt;
        b.x += 20 * dt;
      }
    }
    this.boxes = this.boxes.filter((b) => b.y < 20);
    // hydraulic press cycle: rise, pause, slam, hold
    const pr = this.press;
    pr.t = (pr.t + dt) % 3.2;
    const down = pr.t > 1.8 && pr.t < 2.6;
    if (down && !pr.hit) {
      pr.hit = true;
      this.events.push({ type: 'press', x: 3826 });
      if (!REDUCED_MOTION) for (let k = 0; k < 8; k++) this.dust.push({ x: 3826 + (Math.random() - 0.5) * 30, y: G - 36, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 60, life: 0, max: 0.4, c: Math.random() < 0.5 ? '#ffd27a' : '#fff2c4', s: 1 });
    }
    if (!down) pr.hit = false;
    for (const p of this.smoke) {
      if (p.steam) {
        p.life += dt;
        p.y -= dt * 30;
        p.x -= dt * 8;
        p.r = 1 + p.life * 5;
        continue;
      }
      p.life += dt;
      p.y -= dt * 12;
      p.x += dt * (6 + Math.sin(p.life * 1.3) * 4);
      p.r = 2 + p.life * 2.2;
    }
    this.smoke = this.smoke.filter((p) => p.life < p.max);
    for (const d of this.dust) {
      d.life += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 30 * dt;
    }
    this.dust = this.dust.filter((d) => d.life < d.max);
  }

  exclaim(ent) {
    (this.exclaims || (this.exclaims = [])).push({ ent, t: 0 });
  }

  drawExclaims(ctx, cam, dt) {
    if (!this.exclaims) return;
    for (const e of this.exclaims) {
      e.t += dt;
      const x = Math.round(e.ent.x - cam.x + 6);
      const y = Math.round(e.ent.y - cam.y - e.ent.sheet.meta.spriteHeight - 10 - Math.min(1, e.t * 6) * 4);
      px(ctx, '#1d1222', x - 4, y - 10, 9, 15);
      px(ctx, '#ffe28a', x - 3, y - 9, 7, 13);
      px(ctx, '#a8503f', x - 1, y - 7, 3, 6);
      px(ctx, '#a8503f', x - 1, y, 3, 2);
    }
    this.exclaims = this.exclaims.filter((e) => e.t < 1.6);
  }

  activateStation(id) {
    const st = this.stations[id];
    if (!st || st.on) return;
    st.on = true;
    st.t = REDUCED_MOTION ? 10 : 0;
  }

  earnHat(id) {
    this.stations[id].found = true;
    this.hats.pops.push({ id, t: 0 });
  }

  raiseIsland(id) {
    const isl = this.islands.find((i) => i.id === id);
    if (!isl || isl.shown) return false;
    isl.shown = true;
    if (REDUCED_MOTION) isl.t = 1;
    this.sparkle(isl.x, isl.y + 20, 16);
    return true;
  }

  puff(x, y, count = 6, color = '#e9d6c4', spread = 30) {
    if (REDUCED_MOTION) return;
    for (let i = 0; i < count; i++) {
      this.dust.push({ x, y: y - 1, vx: (Math.random() - 0.5) * spread * 2, vy: -Math.random() * 20 - 4, life: 0, max: 0.35 + Math.random() * 0.3, c: color, s: Math.random() < 0.4 ? 2 : 1 });
    }
  }

  sparkle(x, y, count = 14) {
    if (REDUCED_MOTION) return;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const sp = 30 + Math.random() * 40;
      this.dust.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0, max: 0.6 + Math.random() * 0.4, c: Math.random() < 0.5 ? '#fff2c4' : '#f2b3c8', s: 1 });
    }
  }

  // Everything behind the characters.
  drawBack(ctx, cam) {
    const W = cam.viewW, H = cam.viewH;
    const t = this.time;
    const rest = this.restY(H);
    const lift = cam.y - rest;            // how far the camera is above/below its resting height
    // sky
    const skyY = Math.round(600 + rest + lift * 0.3);
    px(ctx, '#3d2b5e', 0, 0, W, H);
    for (let x = 0; x < W; x += 64) blit(ctx, this.sky, 0, skyY, 64, H, x, 0);
    if (skyY + H > this.sky.height) px(ctx, '#fbd89a', 0, this.sky.height - skyY, W, H);
    // sun
    const sunY = Math.round(155 - rest - lift * 0.25);
    ctx.drawImage(this.sun, Math.round(W * 0.7 - cam.x * 0.02 - 50), sunY - 50);
    // sun rays
    if (!REDUCED_MOTION) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#ffd9a0';
      const sx = W * 0.7 - cam.x * 0.02;
      for (let i = 0; i < 5; i++) {
        const a = -2.2 + i * 0.22 + Math.sin(t * 0.2 + i) * 0.03;
        ctx.beginPath();
        ctx.moveTo(sx, sunY);
        ctx.lineTo(sx + Math.cos(a) * 900, sunY - Math.sin(a) * 900);
        ctx.lineTo(sx + Math.cos(a + 0.06) * 900, sunY - Math.sin(a + 0.06) * 900);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // clouds
    for (const c of this.clouds) {
      const span = W + 300;
      let x = (c.x + (REDUCED_MOTION ? 0 : t * c.speed) - cam.x * c.f) % span;
      if (x < 0) x += span;
      ctx.drawImage(c.img, Math.round(x - 150), Math.round(c.y + BASE_CAM_Y - rest - lift * 0.2));
    }
    // parallax layers
    for (const L of this.layers) {
      const dx = Math.round(-cam.x * L.f);
      const dy = Math.round(this.layerY(L.f, cam.y, rest));
      blit(ctx, L.canvas, -dx, 0, W, L.canvas.height, 0, dy);
    }
    // the far world turns rusty and hazy over the industrial district,
    // and violet as the gateway comes into view
    const ind = industryAt(cam.x + W / 2);
    if (ind > 0.01) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = `rgba(128,128,128,${0.4 * ind})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(170,92,52,${0.16 * ind})`;
      ctx.fillRect(0, 0, W, H);
    }
    const gw = gatewayAt(cam.x + W / 2);
    if (gw > 0.01) {
      ctx.fillStyle = `rgba(110,80,200,${0.14 * gw})`;
      ctx.fillRect(0, 0, W, H);
    }
    // main layer slice
    blit(ctx, this.main, cam.x, cam.y + OY, W, H, 0, 0);

    this.drawIndustrial(ctx, cam);
    this.drawForest(ctx, cam);
    this.drawStudio(ctx, cam);
    this.drawCampus(ctx, cam);
    this.drawWater(ctx, cam);
    ctx.drawImage(this.bridge, Math.round(BRIDGE.x0 - 12 - cam.x), Math.round(-OY - cam.y));
    this.drawSmoke(ctx, cam);
  }

  drawWater(ctx, cam) {
    const t = this.time;
    const x = Math.round(WATERFALL.x - cam.x);
    if (x > cam.viewW || x + WATERFALL.w < 0) return;
    const top = Math.round(WATERFALL.top - cam.y);
    const bottom = Math.round(POND.y - cam.y);
    const h = bottom - top;
    const off = REDUCED_MOTION ? 0 : Math.floor((t * 70) % 128);
    // draw tiled scrolling texture
    for (let y = -off; y < h; y += 128) {
      const y0 = Math.max(0, y);
      const srcY = y0 - y;
      const hh = Math.min(128 - srcY, h - y0);
      if (hh > 0) ctx.drawImage(this.waterfall, 0, srcY, WATERFALL.w, hh, x, top + y0, WATERFALL.w, hh);
    }
    // rounded lip where the water spills over the cliff
    for (let i = -3; i < WATERFALL.w + 3; i++) {
      const k = (i + 3) / (WATERFALL.w + 6);
      const bulge = Math.round(Math.sin(k * Math.PI) * 3);
      px(ctx, '#d6e2f6', x + i, top - bulge, 1, bulge + 3);
      px(ctx, '#ffffff', x + i, top - bulge, 1, 1);
    }
    // foam + mist at the base
    for (let i = 0; i < 18; i++) {
      const fx = x - 6 + ((i * 37 + Math.floor(t * 20)) % (WATERFALL.w + 12));
      const fy = bottom - 2 - ((i * 13 + Math.floor(t * 30)) % 7);
      px(ctx, i % 3 ? '#f4eefa' : '#ffffff', fx, fy, 2 + (i % 2), 2);
    }
    // pond shimmer
    const py = Math.round(POND.y - cam.y);
    for (let i = 0; i < 14; i++) {
      const sx = Math.round(POND.x0 - cam.x + ((i * 53 + t * 8) % (POND.x1 - POND.x0 - 10)));
      const sy = py + 6 + ((i * 7) % 26);
      px(ctx, (i + Math.floor(t * 2)) % 3 ? '#9db0e6' : '#c8b8ea', sx, sy, 4 + (i % 3) * 2, 1);
    }
  }

  drawForest(ctx, cam) {
    const W = cam.viewW;
    const t = this.time;
    if (cam.x + W < 6200) return;
    // stream shimmer
    if (STREAM.x1 - cam.x > 0 && STREAM.x0 - cam.x < W) {
      for (let i = 0; i < 10; i++) {
        const sx = STREAM.x0 + ((i * 29 + t * 12) % (STREAM.x1 - STREAM.x0 - 8)) - cam.x;
        px(ctx, i % 3 ? '#bfe4ff' : '#ffc8ec', sx, STREAM.y + 4 + ((i * 7) % 20) - cam.y, 3 + (i % 3), 1);
      }
    }
    // floating books and pages: blueprints drifting out of the factory turn into paper
    for (const b of this.books) {
      const x = Math.round(b.x - cam.x + Math.sin(t * 0.5 + b.p) * 6);
      const y = Math.round(b.y - cam.y + Math.sin(t * 1.3 + b.p) * 4);
      if (x < -12 || x > W + 12) continue;
      const k = Math.max(0, Math.min(1, (b.x - 6260) / 600));
      if (b.kind === 'doc') {
        // forest pages becoming design documents near the studio
        px(ctx, '#1d1222', x - 1, y - 1, 12, 14);
        px(ctx, '#ffffff', x, y, 10, 12);
        px(ctx, '#4fb3a8', x + 1, y + 1, 8, 3);
        px(ctx, '#c8c8d8', x + 1, y + 6, 6, 1);
        px(ctx, '#c8c8d8', x + 1, y + 8, 8, 1);
        continue;
      }
      if (b.kind === 'page') {
        const c = k < 0.5 ? (k < 0.25 ? '#3a6eb0' : '#9cc0ee') : Forest.MAGIC.page;
        const flip = Math.sin(t * 2 + b.p) > 0;
        px(ctx, '#1d1222', x - 1, y - 1, 9, 11);
        px(ctx, c, x, y, flip ? 7 : 6, 9);
        px(ctx, k < 0.5 ? '#d6e8ff' : '#a8987e', x + 1, y + 2, 4, 1);
        px(ctx, k < 0.5 ? '#d6e8ff' : '#a8987e', x + 1, y + 4, 5, 1);
      } else {
        const open = Math.sin(t * 3 + b.p) > 0.2;
        px(ctx, '#1d1222', x - 1, y - 1, open ? 14 : 9, 8);
        px(ctx, b.c, x, y, open ? 12 : 7, 6);
        if (open) { px(ctx, Forest.MAGIC.page, x + 1, y, 5, 4); px(ctx, Forest.MAGIC.page, x + 6, y, 5, 4); }
        else px(ctx, Forest.MAGIC.page, x + 1, y + 4, 5, 1);
      }
      if ((Math.floor(t * 3 + b.p * 10)) % 7 === 0) px(ctx, '#fff2c4', x + 3, y - 3, 1, 1);
    }
    // course discoveries floating out of the learning station
    if (this.discoveries > 0) {
      const colors = ['#8eeaff', '#ff9ad5', '#ffd98a', '#9effc8', '#b79cff', '#f2a060'];
      for (let i = 0; i < 6; i++) {
        const k = Math.max(0, Math.min(1, this.discoveries * 6 - i * 0.8));
        if (k <= 0) continue;
        const a = (i / 6) * Math.PI * 2 + t * 0.4;
        const x = Math.round(STATION.x + 6 + Math.cos(a) * 70 * k - cam.x);
        const y = Math.round(G - 120 + Math.sin(a) * 18 * k - cam.y + Math.sin(t * 2 + i) * 2);
        px(ctx, '#1d1222', x - 5, y - 6, 11, 13);
        px(ctx, colors[i], x - 4, y - 5, 9, 11);
        px(ctx, '#ffffff', x - 2, y - 3, 5, 1);
        px(ctx, '#ffffff', x - 2, y - 1, 3, 1);
        px(ctx, '#ffffff', x - 2, y + 1, 4, 1);
      }
    }
    // the world of possibilities: islands rising, joined by glowing paths
    if (this.links > 0) this.drawLinks(ctx, cam);
    for (const isl of this.islands) {
      if (!isl.shown) continue;
      const e = 1 - Math.pow(1 - isl.t, 3);
      const bob = REDUCED_MOTION ? 0 : Math.sin(t * 0.9 + isl.p) * 2;
      const x = Math.round(isl.x - 58 - cam.x);
      const y = Math.round(isl.y - 70 - cam.y + (1 - e) * 160 + bob);
      if (x > W + 10 || x + isl.img.width < -10) continue;
      ctx.globalAlpha = Math.min(1, isl.t * 2);
      // soft halo
      ctx.globalCompositeOperation = 'lighter';
      const hg = ctx.createRadialGradient(x + 58, y + 70, 4, x + 58, y + 70, 70);
      hg.addColorStop(0, 'rgba(180,150,255,0.25)');
      hg.addColorStop(1, 'rgba(180,150,255,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(x - 20, y, 160, 150);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(isl.img, x, y);
      // a thin waterfall spilling off each island
      const wx = x + 84;
      for (let k = 0; k < 40; k += 2) {
        const v = (k + Math.floor(t * 30)) % 8;
        px(ctx, v < 3 ? '#ffffff' : '#a9d6f6', wx, y + 74 + k, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  // -------------------------------------------------------------- stage 5
  lightPrinciple(i) {
    if (this.principlesLit[i] > 0) return false;
    this.principlesLit[i] = 0.01;
    return true;
  }

  drawCampus(ctx, cam) {
    const W = cam.viewW;
    const t = this.time;
    if (cam.x + W < CAMPUS.x0) return;
    const gy = G - cam.y;
    // waving flags on the towers
    for (const f of this.flags || []) {
      const x = f.flagX - cam.x, y = f.flagY - cam.y;
      if (x < -30 || x > W + 30) continue;
      px(ctx, '#3a3346', x, y - 18, 1, 18);
      for (let i = 0; i < 16; i++) {
        const wave = REDUCED_MOTION ? 0 : Math.round(Math.sin(t * 4 - i * 0.5) * 1.5);
        px(ctx, i < 2 ? '#a84a6a' : '#8c3b5a', x + 1 + i, y - 18 + wave, 1, 9 - Math.floor(i / 6));
        if (i % 4 === 1) px(ctx, '#f5c35b', x + 1 + i, y - 14 + wave, 1, 1);
      }
    }
    // arrival arch shimmer
    const ax = CAMPUS.entry - 30 - cam.x;
    if (ax > -60 && ax < W + 60) {
      ctx.globalCompositeOperation = 'lighter';
      // a half-ellipse of light filling the top of the book arch
      for (let j = 0; j < 40; j++) {
        const half = Math.round(Math.sqrt(Math.max(0, 1 - (j / 40) ** 2)) * 26);
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 2 + j * 0.2);
        px(ctx, '#dfeaff', ax - half, gy - 60 - j, half * 2, 1);
      }
      ctx.fillStyle = 'rgba(223,234,255,0.18)';
      ctx.fillRect(Math.round(ax - 26), Math.round(gy - 60), 52, 60);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // iron gates (swing open after the arrival conversation)
    const gx = CAMPUS.gate - cam.x;
    if (gx > -80 && gx < W + 80) {
      const open = this.gateOpen;
      for (const side of [-1, 1]) {
        const w = Math.max(3, Math.round(44 * (1 - open * 0.88)));
        const hinge = gx + side * 46;
        const x0 = side < 0 ? hinge : hinge - w;
        px(ctx, '#2b2330', x0, gy - 96, w, 3);
        px(ctx, '#2b2330', x0, gy - 50, w, 2);
        px(ctx, '#2b2330', x0, gy - 8, w, 2);
        for (let k = 0; k <= w; k += Math.max(2, Math.round(6 * (1 - open * 0.6)))) {
          px(ctx, '#3a3346', x0 + k, gy - 96, 2, 96);
          px(ctx, '#f5c35b', x0 + k, gy - 100, 2, 4);
        }
      }
    }
    // the lab screen: a messy interface quietly waiting, or the tidy one once solved
    const lx = LAB.x0 + 163 - cam.x, ly = G - 170 + 75 - cam.y;
    if (lx > -110 && lx < W + 10) {
      px(ctx, '#f4f6fb', lx, ly, 94, 58);
      if (!this.labSolved) {
        const jig = REDUCED_MOTION ? 0 : Math.round(Math.sin(t * 2) * 1);
        px(ctx, '#e3b13c', lx + 52 + jig, ly + 4, 30, 9);
        px(ctx, '#c8c8d8', lx + 6, ly + 20, 40, 6);
        px(ctx, '#2b2330', lx + 30, ly + 34, 50, 5);
        px(ctx, '#c8c8d8', lx + 10, ly + 46, 60, 6);
        px(ctx, '#e04848', lx + 82, ly + 46, 6, 6);
      } else {
        px(ctx, '#2b2330', lx + 8, ly + 6, 60, 6);
        px(ctx, '#e8eef9', lx + 8, ly + 18, 78, 8);
        px(ctx, '#e8eef9', lx + 8, ly + 30, 78, 8);
        px(ctx, '#4fb3a8', lx + 8, ly + 43, 78, 9);
        px(ctx, '#ffffff', lx + 36, ly + 46, 22, 2);
      }
    }
    // the Foundation Wall: each principle glows once he has walked past it
    const fx0 = FOUNDATION.x0 - cam.x;
    if (fx0 > -500 && fx0 < W + 20) {
      PRINCIPLES.forEach((pr, i) => {
        const k = this.principlesLit[i];
        const x = pr.x - cam.x, y = G - 132 - cam.y;
        if (k > 0) {
          ctx.globalCompositeOperation = 'lighter';
          const rg = ctx.createRadialGradient(x, y, 2, x, y, 30);
          rg.addColorStop(0, `rgba(255, 220, 150, ${0.45 * k})`);
          rg.addColorStop(1, 'rgba(255, 220, 150, 0)');
          ctx.fillStyle = rg;
          ctx.fillRect(x - 30, y - 30, 60, 60);
          ctx.globalCompositeOperation = 'source-over';
        }
        drawPrinciple(ctx, pr.id, x, y, k > 0.5);
      });
    }
    // fountain water
    const fx = 15360 - cam.x;
    if (fx > -40 && fx < W + 40) {
      for (let i = 0; i < 12; i++) {
        const k = ((t * 1.2 + i / 12) % 1);
        const side = i % 2 ? 1 : -1;
        px(ctx, '#bfe4ff', fx + side * k * 16, gy - 42 - Math.sin(k * Math.PI) * 10 + k * 30, 2, 2);
      }
    }
    // the mentor's signal fades in over the path
    if (this.mentorSign > 0.01) {
      const mx = MENTOR.sign - cam.x, my = G - 168 - cam.y + Math.sin(t * 1.2) * 2;
      ctx.globalAlpha = this.mentorSign;
      ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(mx, my + 30, 4, mx, my + 30, 130);
      rg.addColorStop(0, 'rgba(255, 190, 110, 0.35)');
      rg.addColorStop(1, 'rgba(255, 190, 110, 0)');
      ctx.fillStyle = rg;
      ctx.fillRect(mx - 130, my - 100, 260, 260);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.mentorSignImg, Math.round(mx - 115), Math.round(my));
      for (let i = 0; i < 10; i++) {
        const life = (t * 0.4 + i / 10) % 1;
        ctx.globalAlpha = this.mentorSign * (1 - life);
        px(ctx, '#ffe8a8', mx - 100 + ((i * 47) % 200), my + 60 - life * 70, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  // -------------------------------------------------------------- stage 4
  drawStudio(ctx, cam) {
    const W = cam.viewW;
    const t = this.time;
    if (cam.x + W < 9100) return;
    // outside: forest sparks turning into little design elements, documents drifting
    for (const b of this.designBits) {
      const x = Math.round(b.x + Math.sin(t * 0.6 + b.p) * 8 - cam.x);
      const y = Math.round(b.y + Math.cos(t * 0.8 + b.p) * 6 - cam.y);
      if (x < -4 || x > W + 4) continue;
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 2 + b.p);
      if (b.kind === 0) px(ctx, b.c, x, y, 3, 3);
      else if (b.kind === 1) { px(ctx, b.c, x - 1, y, 3, 1); px(ctx, b.c, x, y - 1, 1, 3); }
      else if (b.kind === 2) { px(ctx, b.c, x, y, 4, 1); px(ctx, b.c, x, y + 2, 3, 1); }
      else { px(ctx, b.c, x, y, 2, 2); px(ctx, b.c, x + 3, y, 2, 2); }
    }
    ctx.globalAlpha = 1;
    if (this.studioDoorOpen > 0) {
      const dx = 9656 - cam.x, dy = G - 62 - cam.y;
      ctx.globalAlpha = this.studioDoorOpen;
      px(ctx, '#fff2c4', dx, dy, 28, 62);
      px(ctx, '#ffd98a', dx + 2, dy + 2, 24, 58);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 * this.studioDoorOpen;
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.moveTo(dx, G - cam.y); ctx.lineTo(dx + 28, G - cam.y); ctx.lineTo(dx + 70, G + 10 - cam.y); ctx.lineTo(dx - 42, G + 10 - cam.y); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    if (cam.x + W < INTERIOR.x0) return;
    // the four stations
    for (const st of STATIONS) {
      const s = this.stations[st.id];
      const x = st.x - cam.x;
      if (x < -140 || x > W + 140) continue;
      this.drawStationScreens(ctx, st.id, x, G - cam.y, s);
      if (s.found) {
        // discovered: a little check on the plaque
        const lw = (`${st.num} · ${st.name}`.length * 6 + 14) / 2;
        disc(ctx, '#1d1222', x + lw + 8, G - 207 - cam.y, 6);
        disc(ctx, '#5ef0a0', x + lw + 8, G - 207 - cam.y, 5);
        px(ctx, '#1d1222', x + lw + 5, G - 207 - cam.y, 2, 2);
        px(ctx, '#1d1222', x + lw + 7, G - 209 - cam.y, 1, 3);
        px(ctx, '#1d1222', x + lw + 8, G - 211 - cam.y, 2, 2);
      }
    }
    // the design wall gathers all four disciplines
    const wx = DESIGN_WALL.x - cam.x;
    if (wx > -120 && wx < W + 120) {
      STATIONS.forEach((st, i) => {
        if (!this.stations[st.id].found) return;
        const qx = Math.round(wx - 72 + (i % 2) * 76), qy = Math.round(G - 198 + Math.floor(i / 2) * 66 - cam.y);
        this.drawMini(ctx, st.id, qx, qy);
      });
    }
    // the academy doorway shimmers
    const ax = ACADEMY.door - cam.x;
    if (ax > -100 && ax < W + 100) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.25 + i / 5) % 1;
        ctx.globalAlpha = 0.12 * (1 - k);
        ctx.fillStyle = '#dfeaff';
        ctx.fillRect(Math.round(ax - 26 + i * 11), Math.round(G - 104 - cam.y), 3, 104);
      }
      for (let i = 0; i < 14; i++) {
        const life = (t * 0.3 + i / 14) % 1;
        ctx.globalAlpha = 1 - life;
        px(ctx, i % 2 ? '#ffe8a8' : '#cfe2ff', ax + Math.sin(i * 7.1 + t) * 22, G - 20 - life * 110 - cam.y, 1, 1);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // quiet moment: the room dims around the conversation
    if (this.quiet > 0.01) {
      ctx.fillStyle = `rgba(20, 12, 30, ${0.35 * this.quiet})`;
      ctx.fillRect(0, 0, W, cam.viewH);
    }
  }

  drawStationScreens(ctx, id, x, gy, s) {
    const T = s.t;
    const on = s.on;
    const L = { x: Math.round(x - 38), y: Math.round(gy - 89) }, R = { x: Math.round(x + 6), y: Math.round(gy - 89) };
    const B = { x: Math.round(x - 61), y: Math.round(gy - 193) };
    const ease = (v) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    if (!on) {
      // sleeping monitors: a slow standby light
      const blink = Math.sin(this.time * 2) > 0;
      for (const m of [L, R]) px(ctx, blink ? '#5a8a7a' : '#2f3a40', m.x + 30, m.y + 25, 2, 1);
      return;
    }
    const wake = Math.min(1, T / 0.4);
    for (const m of [L, R]) {
      px(ctx, '#f6f0e6', m.x, m.y, 32, Math.round(24 * wake));
    }
    if (T < 0.4) return;
    const t = this.time;
    if (id === 'graphic') {
      // left: type specimen; right: palette
      pixelLike(ctx, L.x + 3, L.y + 3, 'Aa', '#a8503f');
      px(ctx, '#2b2330', L.x + 3, L.y + 16, 24, 2); px(ctx, '#8a8090', L.x + 3, L.y + 20, 18, 1);
      ['#a8503f', '#f2b58a', '#e3b13c', '#4fb3a8', '#5a4062'].forEach((c, i) => px(ctx, c, R.x + 2 + i * 6, R.y + 4, 5, 16));
      // board: a poster assembling itself piece by piece
      const px0 = B.x + 41, py0 = B.y + 6;
      const pieces = [
        [0.5, () => px(ctx, '#2b2330', px0 - 1, py0 - 1, 42, 72)],
        [0.6, (k) => px(ctx, '#f2b58a', px0 - (1 - k) * 40, py0, 40, 70)],
        [1.0, (k) => disc(ctx, '#a8503f', px0 + 24, py0 + 24 - (1 - k) * 50, Math.round(12 * k) || 1)],
        [1.4, (k) => px(ctx, '#2b2330', px0 + 4 + (1 - k) * 60, py0 + 46, 30, 5)],
        [1.7, (k) => px(ctx, '#2b2330', px0 + 4 - (1 - k) * 60, py0 + 54, 20, 3)],
        [2.0, (k) => px(ctx, '#4fb3a8', px0 + 4, py0 + 62, Math.round(32 * k), 3)],
        [2.3, (k) => px(ctx, '#ffffff', px0 + 6, py0 + 6 + (1 - k) * -30, 10, 4)],
      ];
      for (const [at, draw] of pieces) if (T > at) draw(ease((T - at) / 0.4));
      if (T > 2.6) {
        poster2(ctx, B.x + 6, B.y + 14, ['#4fb3a8', '#ffe28a', '#1d1222']);
        poster2(ctx, B.x + 90, B.y + 20, ['#7a5ab8', '#ff9ad5', '#f3e6d2']);
      }
    } else if (id === 'motion') {
      // board: an animation timeline with a playhead
      const bx = B.x + 6, by = B.y + 8;
      px(ctx, '#1d1830', bx, by, 110, 66);
      const tracks = ['#ff9ad5', '#8eeaff', '#ffd98a', '#9effc8'];
      tracks.forEach((c, i) => {
        const ty = by + 8 + i * 14;
        px(ctx, '#2e2a40', bx + 4, ty, 102, 8);
        const len = Math.round(Math.min(1, (T - 0.4 - i * 0.25) / 0.6) * (40 + i * 12));
        if (len > 0) px(ctx, c, bx + 8 + i * 8, ty + 2, len, 4);
        for (let k = 0; k < 3; k++) {
          const kx = bx + 10 + i * 8 + k * 18;
          if (kx < bx + 8 + i * 8 + len) { px(ctx, '#ffffff', kx, ty + 3, 2, 2); }
        }
      });
      const ph = bx + 4 + ((t * 30) % 100);
      px(ctx, '#ff5a5a', ph, by + 2, 1, 62);
      px(ctx, '#ff5a5a', ph - 2, by + 2, 5, 3);
      // left: shapes moving across with easing; right: frames
      const u = (t * 0.5) % 1;
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      disc(ctx, '#ff9ad5', L.x + 4 + Math.round(e * 24), L.y + 8, 3);
      px(ctx, '#4fb3a8', L.x + 4 + Math.round((1 - e) * 22), L.y + 14, 6, 6);
      for (let k = 0; k < 4; k++) {
        px(ctx, '#2b2330', R.x + 2 + k * 8, R.y + 6, 7, 12);
        px(ctx, '#ffd98a', R.x + 3 + k * 8, R.y + 7 + ((k + Math.floor(t * 4)) % 4) * 2, 5, 3);
      }
    } else if (id === 'visual') {
      // board: a moodboard assembling tile by tile
      const tiles = [
        (x, y) => { for (let j = 0; j < 30; j++) px(ctx, mix('#b9659a', '#f8c68d', j / 30), x, y + j, 34, 1); },
        (x, y) => ['#a8503f', '#f2b58a', '#f3e6d2', '#4fb3a8'].forEach((c, i) => px(ctx, c, x + i * 9, y, 8, 30)),
        (x, y) => { px(ctx, '#f3e6d2', x, y, 34, 30); pixelLike(ctx, x + 6, y + 6, 'Aa', '#2b2330'); },
        (x, y) => { px(ctx, '#2e2436', x, y, 34, 30); disc(ctx, '#ffd98a', x + 12, y + 14, 8); px(ctx, '#4fb3a8', x + 18, y + 10, 12, 14); },
        (x, y) => { px(ctx, '#5a4062', x, y, 34, 30); dither(ctx, '#8fe0d4', x, y, 34, 30, 0.3); },
        (x, y) => { px(ctx, '#f6f0e6', x, y, 34, 30); px(ctx, '#2b2330', x + 4, y + 4, 26, 6); px(ctx, '#c8c0b8', x + 4, y + 14, 18, 2); px(ctx, '#c8c0b8', x + 4, y + 19, 22, 2); },
      ];
      tiles.forEach((draw, i) => {
        const k = (T - 0.5 - i * 0.3) / 0.3;
        if (k <= 0) return;
        const x = B.x + 6 + (i % 3) * 38, y = B.y + 8 + Math.floor(i / 3) * 36;
        if (k < 1) { px(ctx, '#f3e6d2', x + Math.round(17 * (1 - k)), y, Math.max(1, Math.round(34 * k)), 30); return; }
        draw(x, y);
      });
      // screens: a layout with clear hierarchy
      px(ctx, '#2b2330', L.x + 3, L.y + 3, 26, 5);
      px(ctx, '#f2b58a', L.x + 3, L.y + 10, 12, 10);
      px(ctx, '#c8c0b8', L.x + 17, L.y + 10, 12, 2); px(ctx, '#c8c0b8', L.x + 17, L.y + 14, 10, 2);
      for (let k = 0; k < 3; k++) px(ctx, ['#a8503f', '#4fb3a8', '#e3b13c'][k], R.x + 3 + k * 10, R.y + 4, 8, 8);
      px(ctx, '#2b2330', R.x + 3, R.y + 15, 28, 2); px(ctx, '#c8c0b8', R.x + 3, R.y + 19, 20, 2);
    } else if (id === 'product') {
      // board: a user flow drawing itself
      const boxes = [[B.x + 6, B.y + 10], [B.x + 46, B.y + 10], [B.x + 86, B.y + 10], [B.x + 46, B.y + 46], [B.x + 86, B.y + 46]];
      boxes.forEach(([bx, by], i) => {
        if (T < 0.5 + i * 0.3) return;
        px(ctx, '#1d1222', bx, by, 28, 22);
        px(ctx, '#f6f0e6', bx + 1, by + 1, 26, 20);
        px(ctx, '#c8c0b8', bx + 3, by + 3, 22, 3);
        px(ctx, '#c8c0b8', bx + 3, by + 9, 14, 2);
        if (i > 0) {
          const [ax, ay] = boxes[i === 3 ? 1 : i === 4 ? 3 : i - 1];
          const fromX = i === 3 ? ax + 14 : ax + 28, fromY = i === 3 ? ay + 22 : ay + 11;
          const toX = i === 3 ? bx + 14 : bx, toY = i === 3 ? by : by + 11;
          line(ctx, '#8fe0d4', fromX, fromY, toX, toY);
        }
      });
      // screens: a wireframe turning into a polished interface
      const done = T > 2.2;
      px(ctx, done ? '#4fb3a8' : '#c8c0b8', L.x + 2, L.y + 2, 28, 5);
      px(ctx, done ? '#f2b58a' : '#d8d0c8', L.x + 2, L.y + 9, 13, 11);
      px(ctx, done ? '#2b2330' : '#c8c0b8', L.x + 17, L.y + 9, 12, 2);
      px(ctx, done ? '#8a8090' : '#c8c0b8', L.x + 17, L.y + 13, 9, 2);
      px(ctx, done ? '#a8503f' : '#c8c0b8', L.x + 17, L.y + 17, 8, 3);
      if (!done) { line(ctx, '#b8b0a8', L.x + 2, L.y + 9, L.x + 14, L.y + 19); line(ctx, '#b8b0a8', L.x + 14, L.y + 9, L.x + 2, L.y + 19); }
      // right: a prototype with a clicking cursor
      px(ctx, '#e8eef9', R.x + 2, R.y + 2, 28, 20);
      px(ctx, '#4fb3a8', R.x + 6, R.y + 13, 20, 6);
      const cx = R.x + 14 + Math.round(Math.sin(t * 1.5) * 6), cy = R.y + 10 + Math.round(Math.cos(t * 1.5) * 3);
      for (let k = 0; k < 5; k++) px(ctx, '#1d1222', cx, cy + k, Math.max(1, 4 - k), 1);
    }
  }

  drawMini(ctx, id, x, y) {
    // compact versions of each discipline pinned on the design wall
    px(ctx, '#f6f0e6', x, y, 68, 58);
    if (id === 'graphic') { px(ctx, '#f2b58a', x + 20, y + 4, 28, 50); disc(ctx, '#a8503f', x + 36, y + 18, 8); px(ctx, '#2b2330', x + 23, y + 36, 22, 3); px(ctx, '#4fb3a8', x + 23, y + 46, 18, 2); }
    if (id === 'motion') { ['#ff9ad5', '#8eeaff', '#ffd98a'].forEach((c, i) => { px(ctx, '#2e2a40', x + 4, y + 8 + i * 15, 60, 8); px(ctx, c, x + 8 + i * 6, y + 10 + i * 15, 30 + i * 6, 4); }); px(ctx, '#ff5a5a', x + 40, y + 4, 1, 50); }
    if (id === 'visual') { ['#b9659a', '#f2b58a', '#4fb3a8', '#5a4062', '#e3b13c', '#f3e6d2'].forEach((c, i) => px(ctx, c, x + 4 + (i % 3) * 21, y + 6 + Math.floor(i / 3) * 25, 18, 22)); }
    if (id === 'product') { for (let i = 0; i < 3; i++) { px(ctx, '#1d1222', x + 4 + i * 22, y + 12, 18, 30); px(ctx, '#ffffff', x + 5 + i * 22, y + 13, 16, 28); px(ctx, i === 2 ? '#4fb3a8' : '#c8c0b8', x + 6 + i * 22, y + 15, 14, 4); } line(ctx, '#4fb3a8', x + 22, y + 27, x + 26, y + 27); line(ctx, '#4fb3a8', x + 44, y + 27, x + 48, y + 27); }
  }

  // Creative hats above the protagonist (drawn after the characters).
  drawHats(ctx, cam, player) {
    const H = this.hats;
    const t = this.time;
    const hx = player.x - cam.x;
    const hy = player.y - cam.y - player.sheet.meta.spriteHeight - 6;
    const order = ['graphic', 'motion', 'visual', 'product'];
    if (H.cycle) {
      // a hat pops up and keeps changing into each discipline as he names them
      const k = H.cycleT;
      const idx = Math.floor(Math.max(0, k - 0.5) / 0.75);
      const id = k < 0.5 ? 'hat' : order[Math.min(3, idx)];
      const local = k < 0.5 ? k / 0.5 : ((k - 0.5) % 0.75) / 0.75;
      const pop = local < 0.2 ? 0.6 + local * 2 : 1;
      drawHatIcon(ctx, id, hx, hy - 4 - Math.sin(Math.min(1, local * 3) * Math.PI) * 3, pop);
    }
    for (const pop of H.pops) {
      const k = pop.t;
      const lift = Math.min(1, k * 3);
      ctx.globalAlpha = k > 1.8 ? Math.max(0, 1 - (k - 1.8) / 0.6) : 1;
      drawHatIcon(ctx, pop.id, hx, hy - 6 - lift * 8 + Math.sin(k * 4) * 1.5, k < 0.15 ? 0.6 : 1);
      ctx.globalAlpha = 1;
    }
    if (H.orbit > 0) {
      ctx.globalAlpha = Math.min(1, H.orbit);
      order.forEach((id, i) => {
        const a = H.orbitT * 1.6 + (i / 4) * Math.PI * 2;
        const ox = Math.cos(a) * 30, oy = Math.sin(a) * 9;
        if (Math.sin(a) < 0) drawHatIcon(ctx, id, hx + ox, hy + 30 + oy, 0.9);
      });
      ctx.globalAlpha = 1;
    }
  }

  drawHatsFront(ctx, cam, player) {
    const H = this.hats;
    if (H.orbit <= 0) return;
    const hx = player.x - cam.x;
    const hy = player.y - cam.y - player.sheet.meta.spriteHeight - 6;
    ctx.globalAlpha = Math.min(1, H.orbit);
    ['graphic', 'motion', 'visual', 'product'].forEach((id, i) => {
      const a = H.orbitT * 1.6 + (i / 4) * Math.PI * 2;
      if (Math.sin(a) >= 0) drawHatIcon(ctx, id, hx + Math.cos(a) * 30, hy + 30 + Math.sin(a) * 9, 1);
    });
    ctx.globalAlpha = 1;
  }

  drawLinks(ctx, cam) {
    const t = this.time;
    const hub = { x: HILL.x, y: HILL.top - 30 };
    const ends = this.islands.map((i) => ({ x: i.x, y: i.y + 30 }));
    const pairs = ends.map((e) => [hub, e]);
    for (let i = 0; i < ends.length - 1; i++) pairs.push([ends[i], ends[i + 1]]);
    ctx.globalCompositeOperation = 'lighter';
    pairs.forEach(([a, b], idx) => {
      const k = Math.max(0, Math.min(1, this.links * pairs.length * 0.5 - idx * 0.4));
      if (k <= 0) return;
      const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 40;
      const steps = 60;
      for (let s = 0; s <= steps * k; s++) {
        const u = s / steps;
        const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x - cam.x;
        const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y - cam.y;
        const pulse = (Math.sin(u * 12 - t * 4 + idx) + 1) / 2;
        ctx.globalAlpha = 0.35 + pulse * 0.5;
        px(ctx, idx < 6 ? '#8eeaff' : '#ff9ad5', x, y, 2, 2);
      }
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawIndustrial(ctx, cam) {
    const W = cam.viewW;
    const t = this.time;
    const vis = (x0, x1) => x1 - cam.x > -20 && x0 - cam.x < W + 20;
    const S = Ind.IND.steel;
    if (vis(HALL.x0, HALL.x1)) {
      // overhead crane gliding along its rail, a crate swinging below
      const cx = (HALL.x0 + HALL.x1) / 2 + Math.sin(t * 0.12) * 480 - cam.x;
      const ry = G - 204 - cam.y;
      px(ctx, S.deep, cx - 14, ry, 28, 8);
      px(ctx, Ind.IND.hazard.y, cx - 14, ry, 28, 2);
      const len = 70 + Math.sin(t * 0.3) * 16;
      const sw = REDUCED_MOTION ? 0 : Math.sin(t * 1.1) * 3;
      for (let i = 0; i < len; i += 3) px(ctx, S.mid, cx + sw * (i / len), ry + 8 + i, 1, 2);
      const hx = cx + sw, hy = ry + 8 + len;
      px(ctx, S.deep, hx - 3, hy, 7, 4);
      px(ctx, S.dark, hx - 16, hy + 4, 32, 18);
      px(ctx, '#94603c', hx - 15, hy + 5, 30, 16);
      px(ctx, '#b98052', hx - 15, hy + 5, 30, 2);
      line(ctx, S.mid, hx - 1, hy + 2, hx - 14, hy + 5);
      line(ctx, S.mid, hx + 1, hy + 2, hx + 14, hy + 5);

      // press ram
      const p = this.press.t;
      const k = p < 1.8 ? 0 : p < 2.0 ? (p - 1.8) / 0.2 : p < 2.6 ? 1 : Math.max(0, 1 - (p - 2.6) / 0.6);
      const ramY = G - 104 + Math.round(k * 64) - cam.y;
      const rx = 3826 - cam.x;
      px(ctx, S.hi, rx - 3, G - 106 - cam.y, 6, ramY - (G - 106 - cam.y));
      px(ctx, S.deep, rx - 17, ramY, 34, 14);
      px(ctx, S.mid, rx - 16, ramY + 1, 32, 11);
      px(ctx, S.light, rx - 16, ramY + 1, 32, 1);
      // part on the bed
      px(ctx, '#a2a7b8', rx - 10, G - 38 - cam.y + (k > 0.95 ? 2 : 0), 20, k > 0.95 ? 2 : 4);

      // meshing gears
      const a = REDUCED_MOTION ? 0 : t * 0.9;
      gearRot(ctx, 3952 - cam.x, G - 118 - cam.y, 18, a, ['#4a4f5c', '#7d8496', '#c9cdd8']);
      gearRot(ctx, 3982 - cam.x, G - 100 - cam.y, 11, -a * 1.6 + 0.3, ['#6e3626', '#9a4e2e', '#e3b13c']);
      gearRot(ctx, 3968 - cam.x, G - 140 - cam.y, 8, -a * 2.2, ['#4a4f5c', '#a2a7b8', '#e9e3d8']);

      // conveyor belt + boxes
      const by = CONVEYOR.top - cam.y;
      const bx0 = CONVEYOR.x0 - cam.x, bw = CONVEYOR.x1 - CONVEYOR.x0;
      px(ctx, '#2a2228', bx0, by - 2, bw, 4);
      const off = REDUCED_MOTION ? 0 : (t * CONVEYOR.speed) % 10;
      for (let x = off; x < bw; x += 10) px(ctx, '#4a4048', bx0 + x, by - 2, 4, 1);
      for (const b of this.boxes) {
        const x = b.x - cam.x, y = CONVEYOR.top - 2 - 10 + b.y - cam.y;
        px(ctx, '#3a2228', x - 8, y - 1, 16, 11);
        px(ctx, b.c, x - 7, y, 14, 9);
        px(ctx, '#e8c890', x - 1, y, 2, 9);
        px(ctx, '#d8a070', x - 7, y, 14, 1);
      }

      // rotating warning beacons
      for (const L of LIGHTS) {
        if (L.kind !== 'beacon') continue;
        const x = L.x - cam.x, y = L.y - cam.y;
        if (x < -10 || x > W + 10) continue;
        const on = Math.max(0, Math.sin(t * 4 + L.x));
        px(ctx, S.deep, x - 5, y + 4, 10, 3);
        px(ctx, on > 0.5 ? '#ffb040' : '#a05a20', x - 4, y - 3, 8, 7);
        px(ctx, '#fff0c4', x - 2 + Math.round(Math.sin(t * 4 + L.x) * 2), y - 2, 2, 4);
      }
    }
    // the gateway: a slowly turning swirl of light and a beam into the sky
    if (vis(PORTAL.x - 200, PORTAL.x + 200)) {
      const x = PORTAL.x - cam.x, cy = PORTAL.y - Ind.PORTAL_SHAPE.cy - cam.y;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#b79cff';
      ctx.fillRect(x - 22, -cam.y - 300, 44, cy + cam.y + 300);
      ctx.globalAlpha = 0.06;
      ctx.fillRect(x - 40, -cam.y - 300, 80, cy + cam.y + 300);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const pulse = REDUCED_MOTION ? 0 : Math.round(Math.sin(t * 2) * 2);
      const rings = [[36, 62, '#3a2a7a'], [31, 54, '#5a46b8'], [25, 45 + pulse, '#7a6ae0'], [18, 34 + pulse, '#8eeaff'], [11, 21 + pulse, '#c9f6ff'], [4, 9, '#ffffff']];
      for (const [rx, ry, c] of rings) {
        ctx.fillStyle = c;
        for (let dy = -ry; dy <= ry; dy++) {
          const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
          ctx.fillRect(Math.round(x - half), Math.round(cy + dy), half * 2 + 1, 1);
        }
      }
      const spin = REDUCED_MOTION ? 0 : t * 1.2;
      for (let i = 0; i < 36; i++) {
        const a2 = spin + (i / 36) * Math.PI * 2;
        const rr = 0.35 + 0.6 * ((i * 7) % 10) / 10;
        const sx = x + Math.cos(a2 + rr * 2) * 32 * rr, sy = cy + Math.sin(a2 + rr * 2) * 56 * rr;
        px(ctx, i % 3 ? '#e9fbff' : '#ff9ad5', sx, sy, i % 4 ? 1 : 2, 1);
      }
      // motes rising out of the gateway
      for (let i = 0; i < 18; i++) {
        const life = ((t * 0.35 + i / 18) % 1);
        const mx = x + Math.sin(i * 12.9 + t * 0.6) * (20 + i);
        const my = cy + 60 - life * 170;
        ctx.globalAlpha = 1 - life;
        px(ctx, i % 2 ? '#8eeaff' : '#b79cff', mx, my, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawSmoke(ctx, cam) {
    for (const p of this.smoke) {
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = 0.55 * a;
      if (p.steam) { ctx.globalAlpha = 0.5 * a; disc(ctx, '#f1eaf2', p.x - cam.x, p.y - cam.y, Math.round(p.r)); continue; }
      disc(ctx, p.life < 1 ? '#d9c6dc' : '#bfa6c8', p.x - cam.x, p.y - cam.y, Math.round(p.r));
    }
    ctx.globalAlpha = 1;
  }

  // Things in front of the characters, then lighting + atmosphere.
  drawFront(ctx, cam) {
    const W = cam.viewW, H = cam.viewH;
    const t = this.time;
    blit(ctx, this.front, cam.x, cam.y + OY, W, H, 0, 0);

    // swaying grass blades on walkable ground
    for (const b of this.blades) {
      const x = b.x - cam.x;
      if (x < -4 || x > W + 4) continue;
      const sway = REDUCED_MOTION ? 0 : Math.round(Math.sin(t * 2 + b.p + b.x * 0.05) * 1.2);
      const y = Math.round(b.y - cam.y);
      px(ctx, b.c, Math.round(x), y - b.h + 2, 1, b.h - 2);
      px(ctx, b.c, Math.round(x) + sway, y - b.h, 1, 2);
    }

    // dust / sparkles
    for (const d of this.dust) {
      ctx.globalAlpha = 1 - d.life / d.max;
      px(ctx, d.c, d.x - cam.x, d.y - cam.y, d.s, d.s);
    }
    ctx.globalAlpha = 1;

    // petals (screen space with parallax) belong to the green parts of the world;
    // the factory has drifting dust in the window light instead
    const ind = industryAt(cam.x + W / 2);
    const indoors = areaOf(cam.x + W / 2).id === 'studio';
    const petalCount = indoors ? 0 : Math.round(this.petals.length * (1 - ind));
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      const x = m.x + Math.sin(t * 0.3 + m.p) * 14 - cam.x;
      const y = m.y + Math.cos(t * 0.25 + m.p) * 10 - cam.y;
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t + m.p);
      px(ctx, '#ffe2b0', x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
    for (const p of this.petals.slice(0, petalCount)) {
      const x = ((p.x + p.vx * t - cam.x * 0.9) % (W + 40) + W + 40) % (W + 40) - 20;
      const y = ((p.y + p.vy * t + Math.sin(t + p.p) * 6) % (H + 40) + H + 40) % (H + 40) - 20;
      px(ctx, p.c, x, y, Math.sin(t * 3 + p.p) > 0 ? 2 : 1, 1);
    }

    this.drawLighting(ctx, cam);

    // foreground foliage (parallax 1.25) framing the bottom edge (not indoors)
    const bottomY = H + 4;
    for (const f of (areaOf(cam.x + W / 2).id === 'studio' ? [] : this.fg)) {
      const x = Math.round(f.x - cam.x * 1.25);
      if (x < -40 || x > W + 40) continue;
      const sway = REDUCED_MOTION ? 0 : Math.sin(t * 1.4 + f.p) * 1.5;
      if (f.kind === 'daisy') {
        const top = bottomY - f.h - 10;
        px(ctx, '#2a1a2a', x, top + 4, 2, f.h + 10);
        disc(ctx, '#3a2436', x + 1 + sway, top, 5);
        disc(ctx, '#ead9e4', x + 1 + sway, top, 4);
        px(ctx, '#f5c35b', x + sway - 1, top - 1, 4, 3);
      } else if (f.kind === 'fern') {
        for (let i = 0; i < f.h; i += 2) {
          const yy = bottomY - i;
          const len = Math.round((1 - i / f.h) * 9) + 1;
          px(ctx, '#2a1a30', x - len + sway * (i / f.h), yy, len * 2 + 1, 2);
          if (i % 4 === 0) px(ctx, '#4a2f4a', x + sway * (i / f.h), yy, len, 1);
        }
      } else {
        // a tuft of grass blades
        for (let k = 0; k < 7; k++) {
          const bx = x + (k - 3) * 2;
          const bh = Math.round(f.h * (0.55 + ((k * 37 + f.w) % 10) / 22));
          const lean = (k - 3) * 0.35 + sway * 0.5;
          for (let i = 0; i < bh; i++) {
            const kk = i / bh;
            const xx = Math.round(bx + lean * kk * kk * 6);
            px(ctx, kk > 0.75 ? '#3e2846' : '#24162a', xx, bottomY - i, kk < 0.5 ? 2 : 1, 1);
          }
        }
      }
    }
  }

  drawLighting(ctx, cam) {
    const W = cam.viewW, H = cam.viewH;
    const t = this.time;
    // dusk tint: cool at the top, warm near the ground
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(70, 40, 110, 0.16)');
    g.addColorStop(0.55, 'rgba(255, 170, 110, 0.0)');
    g.addColorStop(1, 'rgba(120, 40, 70, 0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // light sources
    ctx.globalCompositeOperation = 'lighter';
    // sunset light shafts through the factory windows
    if (cam.x + W > HALL.x0 && cam.x < HALL.x1) {
      for (let wx = HALL.x0 + 70; wx < HALL.x1 - 100; wx += 170) {
        const x0 = wx - cam.x, y0 = HALL.roof + 30 - cam.y;
        const sway = REDUCED_MOTION ? 0 : Math.sin(t * 0.4 + wx) * 0.01;
        ctx.globalAlpha = 0.07 + sway;
        ctx.fillStyle = '#ffcf8a';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + 96, y0);
        ctx.lineTo(x0 + 96 - 70, G - cam.y);
        ctx.lineTo(x0 - 110, G - cam.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    for (const L of LIGHTS) {
      const x = L.x - cam.x, y = L.y - cam.y;
      if (x < -L.r || x > W + L.r || y < -L.r || y > H + L.r) continue;
      if (L.station && !(this.stations[L.station] && this.stations[L.station].on)) continue;
      let k = REDUCED_MOTION ? 1 : 0.85 + Math.sin(t * 7 + L.x) * 0.06 + Math.sin(t * 13 + L.y) * 0.05;
      if (L.kind === 'beacon') k = REDUCED_MOTION ? 0.6 : 0.25 + 0.75 * Math.max(0, Math.sin(t * 4 + L.x));
      if (L.kind === 'bulb') k = REDUCED_MOTION ? 0.9 : 0.75 + 0.25 * Math.sin(t * 3 + L.x * 0.7);
      if (L.kind === 'portal') k = REDUCED_MOTION ? 1 : 0.85 + 0.15 * Math.sin(t * 1.7 + L.x);
      if (L.kind === 'hanglamp') k = 1;
      const [r, g2, b] = LIGHT_COLORS[L.kind] || LIGHT_COLORS.lantern;
      const a0 = (L.kind === 'portal' ? 0.5 : L.kind === 'hanglamp' ? 0.32 : 0.42) * Math.min(1, k + 0.2);
      const rg = ctx.createRadialGradient(x, y, 1, x, y, Math.max(2, L.r * (L.kind === 'beacon' ? 1 : k)));
      rg.addColorStop(0, `rgba(${r}, ${g2}, ${b}, ${a0})`);
      rg.addColorStop(0.4, `rgba(${r}, ${Math.round(g2 * 0.8)}, ${Math.round(b * 0.7)}, ${a0 * 0.33})`);
      rg.addColorStop(1, `rgba(${r}, ${g2}, ${b}, 0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
      if (L.kind === 'hanglamp') {
        // a cone of light falling to the floor
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#ffd9a0';
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x + 46, G - cam.y);
        ctx.lineTo(x - 46, G - cam.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // fireflies
    for (const f of this.fireflies) {
      const x = f.ax + Math.sin(t * f.s + f.p) * 22 - cam.x;
      const y = f.ay + Math.cos(t * f.s * 1.3 + f.p) * 14 - cam.y;
      const on = (Math.sin(t * 2.2 + f.p * 3) + 1) / 2;
      if (on < 0.35) continue;
      ctx.globalAlpha = on;
      px(ctx, f.c, x, y, 1, 1);
      ctx.globalAlpha = on * 0.35;
      px(ctx, '#ffd27a', x - 1, y - 1, 3, 3);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // vignette
    const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(29, 18, 34, 0)');
    v.addColorStop(1, 'rgba(29, 18, 34, 0.5)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}

export { bayer };
