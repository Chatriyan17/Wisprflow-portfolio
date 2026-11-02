// Procedural 16-bit style pixel-art painters for the world.
// Lighting convention: warm sunset key light from the upper right, cool purple fill
// from the left, ambient occlusion where surfaces meet.

import { px, dither, disc, ellipse, line, mix, pixelText, bayer } from './pixel.js';
import { WORLD } from '../config.js';

const G = WORLD.ground;

export const COLORS = {
  sky: ['#3d2b5e', '#553a75', '#734a89', '#955795', '#b9659a', '#d77b97', '#ea9590', '#f4ae8a', '#f8c68d', '#fbd89a'],
  mountain: { base: '#8a6aa9', lit: '#b090c6', shade: '#6f5492', snow: '#f4e4f0', snowShade: '#c7b0d8' },
  grass: { top: '#c3cf63', light: '#a8bc52', base: '#7f9a3e', mid: '#6b8838', dark: '#4f6a2c', deep: '#3b5226' },
  rock: { light: '#b8735a', base: '#8f5340', mid: '#7a4536', dark: '#5c3030', deep: '#3a1f2a', mortar: '#4a2629' },
  leaf: { dark: '#3d5a2e', mid: '#5b7a36', light: '#86a243', glint: '#b8cc62' },
  blossom: { dark: '#a24f78', mid: '#d07aa0', light: '#f0afc6', glint: '#fde3ec' },
  bark: { dark: '#3b2420', base: '#5a3828', light: '#80523a' },
  wood: { dark: '#4a2a22', base: '#7a4a30', mid: '#94603c', light: '#b98052' },
  glow: { core: '#fff2c4', warm: '#ffd27a', deep: '#f5a24a' },
  stone: { light: '#d8bfb4', base: '#b1938f', mid: '#94767a', dark: '#6b5160' },
};

// ---------------------------------------------------------------------------
// Sky + far layers
// ---------------------------------------------------------------------------

// Sky as a tileable strip covering world y from -600 to WORLD.height.
export function paintSky(ctx, w, h, yTop) {
  const stops = COLORS.sky;
  const horizon = G - 60 - yTop; // canvas y of the warmest band
  for (let y = 0; y < h; y++) {
    const t = Math.max(0, Math.min(1, y / horizon));
    const f = t * (stops.length - 1);
    const i = Math.floor(f);
    const frac = f - i;
    const a = stops[Math.min(i, stops.length - 1)];
    const b = stops[Math.min(i + 1, stops.length - 1)];
    ctx.fillStyle = a;
    ctx.fillRect(0, y, w, 1);
    if (frac > 0.02) {
      ctx.fillStyle = b;
      for (let x = 0; x < w; x++) if (bayer(x, y) < frac) ctx.fillRect(x, y, 1, 1);
    }
  }
}

export function paintSun(ctx, cx, cy) {
  const rings = [
    [44, 'rgba(255,214,150,0.10)'],
    [34, 'rgba(255,214,150,0.14)'],
    [26, 'rgba(255,226,170,0.22)'],
  ];
  for (const [r, c] of rings) disc(ctx, c, cx, cy, r);
  disc(ctx, '#fbe0a6', cx, cy, 19);
  disc(ctx, '#fdf0c8', cx, cy, 16);
  disc(ctx, '#fff8e2', cx - 3, cy - 3, 9);
}

export function makeCloud(ctx, rand, w) {
  const h = Math.round(w * 0.32);
  const puffs = [];
  const n = Math.max(3, Math.round(w / 14));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const r = Math.round((Math.sin(t * Math.PI) * 0.6 + 0.4) * h * rand.range(0.6, 0.9));
    puffs.push([Math.round(8 + t * (w - 16)), h - r * 0.6, r]);
  }
  for (const [x, y, r] of puffs) disc(ctx, '#b48db8', x, y + 2, r);
  for (const [x, y, r] of puffs) disc(ctx, '#e3b5c9', x, y, r);
  for (const [x, y, r] of puffs) disc(ctx, '#fbe2e3', x + 1, y - 2, Math.max(1, r - 4));
  ctx.fillStyle = '#b48db8';
  ctx.fillRect(4, h + 1, w - 8, 3);
  return h + 6;
}

export function paintMountains(ctx, w, baseY, rand) {
  const C = COLORS.mountain;
  const ridge = new Float32Array(w);
  const peaks = [];
  for (let x = 0; x < w; x += rand.int(110, 190)) peaks.push([x, rand.range(70, 150)]);
  for (let x = 0; x < w; x++) {
    let hgt = 18 + Math.sin(x * 0.011) * 10 + Math.sin(x * 0.037 + 2) * 5;
    for (const [px_, ph] of peaks) {
      const d = Math.abs(x - px_);
      hgt = Math.max(hgt, ph - d * (0.9 + (px_ % 7) * 0.05) + Math.sin(x * 0.2) * 1.5);
    }
    ridge[x] = baseY - hgt;
  }
  for (let x = 0; x < w; x++) {
    const top = Math.round(ridge[x]);
    const slope = (ridge[Math.min(w - 1, x + 1)] - ridge[Math.max(0, x - 1)]);
    // body
    px(ctx, C.base, x, top, 1, 400);
    // lit faces point toward the sun (right): descending to the right
    if (slope > 0.3) {
      const depth = 30 + (x % 13);
      px(ctx, C.lit, x, top, 1, depth);
      for (let y = 0; y < 10; y++) if (bayer(x, top + depth + y) < 1 - y / 10) px(ctx, C.lit, x, top + depth + y);
    } else if (slope < -0.3) {
      px(ctx, C.shade, x, top + 2, 1, 26);
    }
    // snow on the tall peaks
    const height = baseY - top;
    if (height > 95) {
      const snowDepth = Math.round((height - 95) * 0.45 + 3 + Math.sin(x * 0.7) * 2);
      px(ctx, slope < -0.3 ? C.snowShade : C.snow, x, top, 1, snowDepth);
    }
    px(ctx, mix(C.lit, '#ffffff', 0.25), x, top, 1, 1);
  }
  // atmospheric haze towards the base
  for (let y = 0; y < 60; y++) {
    const d = y / 60;
    for (let x = 0; x < w; x++) if (bayer(x, y) < d * 0.85) px(ctx, '#c995b6', x, baseY - 60 + y + 40);
  }
  px(ctx, '#c995b6', 0, baseY + 40, w, 400);
}

export function paintFloatingIsland(ctx, x, y, w, rand, { tone = 'far', waterfall = false } = {}) {
  const far = tone === 'far';
  const rock = far ? ['#8d6f9e', '#a385b0', '#735b8a'] : [COLORS.rock.base, COLORS.rock.light, COLORS.rock.dark];
  const grass = far ? ['#a5a774', '#c0bd86', '#8a8c64'] : [COLORS.grass.base, COLORS.grass.top, COLORS.grass.dark];
  const depth = Math.round(w * 0.55);
  for (let j = 0; j < depth; j++) {
    const t = j / depth;
    const half = Math.round((w / 2) * (1 - t * t) * (1 - t * 0.35) + Math.sin(j * 0.9) * 1.5);
    const cx = x + w / 2 + Math.sin(j * 0.3) * 2;
    px(ctx, rock[0], cx - half, y + 4 + j, half * 2, 1);
    px(ctx, rock[1], cx + half - Math.max(2, half * 0.35), y + 4 + j, Math.max(2, half * 0.35), 1);
    px(ctx, rock[2], cx - half, y + 4 + j, Math.max(1, half * 0.25), 1);
  }
  // grass cap
  px(ctx, grass[0], x - 2, y, w + 4, 5);
  px(ctx, grass[1], x, y - 1, w, 2);
  for (let i = 0; i < w; i += 2) {
    const d = rand.int(0, 3);
    px(ctx, grass[2], x + i, y + 5, 1, d);
  }
  // dangling roots
  for (let i = 0; i < Math.round(w / 12); i++) {
    const rx = x + rand.range(w * 0.2, w * 0.8);
    const len = rand.int(6, 16);
    px(ctx, far ? '#6c5578' : COLORS.bark.dark, rx, y + depth * 0.6, 1, len);
  }
  if (waterfall) {
    const wx = x + Math.round(w * 0.7);
    px(ctx, far ? '#d9cbea' : '#cfe0f4', wx, y + 2, 3, 70);
    px(ctx, far ? '#f3eaf6' : '#ffffff', wx + 1, y + 2, 1, 70);
  }
  // tiny tree
  if (w > 50) {
    const tx = x + Math.round(w * 0.3);
    px(ctx, far ? '#6c5578' : COLORS.bark.base, tx, y - 10, 2, 10);
    disc(ctx, far ? '#8f9a6c' : COLORS.leaf.mid, tx + 1, y - 13, 6);
    disc(ctx, far ? '#a8b07e' : COLORS.leaf.light, tx + 3, y - 15, 3);
  }
}

export function paintRuinsAndIslands(ctx, w, baseY, rand) {
  // hazy hills
  const hill = '#9d7aa8';
  for (let x = 0; x < w; x++) {
    const h = 34 + Math.sin(x * 0.006) * 16 + Math.sin(x * 0.021 + 1) * 8;
    px(ctx, hill, x, baseY - h, 1, 400);
    if (bayer(x, 0) < 0.5) px(ctx, '#b493b8', x, baseY - h, 1, 2);
  }
  // ruined arches / towers on the hills
  for (let x = 120; x < w; x += rand.int(260, 420)) {
    const hy = baseY - (34 + Math.sin(x * 0.006) * 16 + Math.sin(x * 0.021 + 1) * 8);
    const kind = rand.int(0, 2);
    const c = '#8a6a99', l = '#a98bb5';
    if (kind === 0) {
      for (let a = 0; a < 3; a++) {
        const ax = x + a * 22;
        px(ctx, c, ax, hy - 40, 5, 40);
        px(ctx, l, ax + 3, hy - 40, 2, 40);
        if (a < 2) {
          for (let i = 0; i < 17; i++) {
            const yy = Math.round(Math.sqrt(Math.max(0, 64 - (i - 8) * (i - 8))));
            px(ctx, c, ax + 5 + i, hy - 40 - yy, 1, 4);
          }
        }
      }
    } else if (kind === 1) {
      px(ctx, c, x, hy - 58, 16, 58);
      px(ctx, l, x + 11, hy - 58, 5, 58);
      for (let i = 0; i < 4; i++) px(ctx, c, x - 2 + i * 5, hy - 63, 3, 5);
      px(ctx, '#e9c7a0', x + 6, hy - 44, 3, 5);
    } else {
      px(ctx, c, x, hy - 26, 30, 26);
      px(ctx, l, x + 22, hy - 26, 8, 26);
      px(ctx, '#e9c7a0', x + 6, hy - 18, 3, 4);
      px(ctx, '#e9c7a0', x + 14, hy - 18, 3, 4);
    }
  }
  // floating islands drifting high above
  for (let x = 220; x < w; x += rand.int(380, 560)) {
    paintFloatingIsland(ctx, x, rand.int(40, 110), rand.int(36, 70), rand, { tone: 'far', waterfall: rand.chance(0.6) });
  }
}

export function paintHills(ctx, w, baseY, rand) {
  const back = '#7a6b8e';
  const front = '#6c6676';
  for (let x = 0; x < w; x++) {
    const h1 = 42 + Math.sin(x * 0.009 + 3) * 14 + Math.sin(x * 0.027) * 6;
    px(ctx, back, x, baseY - h1, 1, 400);
  }
  for (let x = 0; x < w; x++) {
    const h2 = 20 + Math.sin(x * 0.013) * 10 + Math.sin(x * 0.041 + 2) * 4;
    px(ctx, front, x, baseY - h2, 1, 400);
    if (bayer(x, 1) < 0.6) px(ctx, '#87916f', x, baseY - h2, 1, 1);
  }
  // tree clumps on the ridge
  for (let x = 10; x < w; x += rand.int(18, 46)) {
    const h1 = 42 + Math.sin(x * 0.009 + 3) * 14 + Math.sin(x * 0.027) * 6;
    const blossom = rand.chance(0.3);
    const r = rand.int(6, 12);
    const cy = baseY - h1 + 2 - r * 0.4;
    disc(ctx, blossom ? '#b07796' : '#5f6a55', x, cy, r);
    disc(ctx, blossom ? '#d39ab4' : '#78846a', x + 2, cy - 2, Math.max(2, r - 4));
  }
  px(ctx, front, 0, baseY, w, 400);
}

// ---------------------------------------------------------------------------
// Trees and plants
// ---------------------------------------------------------------------------

function canopy(ctx, rand, cx, cy, rx, ry, palette, count) {
  const blobs = [];
  for (let i = 0; i < count; i++) {
    const a = rand.range(0, Math.PI * 2);
    const d = Math.sqrt(rand());
    blobs.push([cx + Math.cos(a) * rx * d * 0.75, cy + Math.sin(a) * ry * d * 0.7, Math.round(rand.range(0.38, 0.6) * Math.min(rx, ry))]);
  }
  blobs.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of blobs) disc(ctx, palette.dark, x, y, r);
  for (const [x, y, r] of blobs) disc(ctx, palette.mid, x + 2, y - 3, Math.max(2, r - 3));
  for (const [x, y, r] of blobs) if (x > cx - rx * 0.3) disc(ctx, palette.light, x + 4, y - 6, Math.max(1, r - 8));
  // leafy edge noise + glints
  for (const [x, y, r] of blobs) {
    for (let k = 0; k < r; k++) {
      const a = rand.range(Math.PI * 1.0, Math.PI * 2.0);
      px(ctx, palette.mid, x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1), 2, 2);
    }
    if (x > cx) for (let k = 0; k < 3; k++) px(ctx, palette.glint, x + rand.range(0, r * 0.6), y - rand.range(r * 0.2, r * 0.7), 1, 1);
  }
}

export function paintTree(ctx, rand, x, groundY, { h = 120, r = 34, kind = 'green' } = {}) {
  const pal = kind === 'blossom' ? COLORS.blossom : COLORS.leaf;
  const trunkTop = groundY - h + r;
  const tw = Math.max(6, Math.round(r * 0.28));
  // trunk with slight curve
  for (let y = trunkTop; y < groundY; y++) {
    const t = (y - trunkTop) / (groundY - trunkTop);
    const off = Math.round(Math.sin(t * 2.4) * 2);
    const w = tw + Math.round(t * t * 6);
    px(ctx, COLORS.bark.base, x - w / 2 + off, y, w, 1);
    px(ctx, COLORS.bark.light, x + w / 2 - 2 + off, y, 2, 1);
    px(ctx, COLORS.bark.dark, x - w / 2 + off, y, 1, 1);
  }
  // roots
  px(ctx, COLORS.bark.base, x - tw - 3, groundY - 3, 6, 3);
  px(ctx, COLORS.bark.base, x + tw - 2, groundY - 2, 6, 2);
  // branches
  line(ctx, COLORS.bark.base, x, trunkTop + r * 0.5, x + r * 0.7, trunkTop - r * 0.1);
  line(ctx, COLORS.bark.base, x, trunkTop + r * 0.6, x - r * 0.6, trunkTop);
  canopy(ctx, rand, x, trunkTop - r * 0.35, r * 1.25, r, pal, Math.round(r / 3.2) + 5);
}

export function paintBigTree(ctx, rand, x, groundY) {
  const B = COLORS.bark;
  const top = 96;
  // trunk
  for (let y = top; y < groundY; y++) {
    const t = (y - top) / (groundY - top);
    const w = Math.round(30 + t * t * 26);
    const off = Math.round(Math.sin(t * 3.1) * 3);
    const lx = x - w / 2 + off;
    px(ctx, B.base, lx, y, w, 1);
    px(ctx, B.light, lx + w - 8, y, 6, 1);
    px(ctx, mix(B.light, '#f0a070', 0.3), lx + w - 3, y, 2, 1);
    px(ctx, B.dark, lx, y, 5, 1);
  }
  // bark grooves
  for (let i = 0; i < 7; i++) {
    let gx = x - 12 + i * 4 + rand.int(-1, 1);
    for (let y = top + rand.int(0, 20); y < groundY - 6; y += 1) {
      if (rand.chance(0.12)) gx += rand.chance(0.5) ? 1 : -1;
      if (rand.chance(0.85)) px(ctx, B.dark, gx, y);
    }
  }
  // knot hole
  ellipse(ctx, B.dark, x + 4, groundY - 120, 4, 6);
  ellipse(ctx, '#24140f', x + 4, groundY - 119, 2, 4);
  // roots spreading
  for (const [dx, len, dir] of [[-26, 26, -1], [-10, 16, -1], [22, 30, 1], [8, 18, 1]]) {
    for (let i = 0; i < len; i++) {
      const yy = groundY - 6 + Math.round((i / len) * 5);
      px(ctx, B.base, x + dx + dir * i, yy, 3, 6 - Math.round((i / len) * 4));
      px(ctx, B.light, x + dx + dir * i, yy, 1, 1);
    }
  }
  // branches reaching to the hanging lanterns
  for (const [x0, y0, x1, y1, w] of [[x + 10, 150, x + 98, 132, 5], [x + 14, 118, x + 134, 96, 4], [x - 10, 130, x - 70, 104, 5]]) {
    for (let k = 0; k < w; k++) line(ctx, k < w - 1 ? B.base : B.light, x0, y0 - k, x1, y1 - k * 0.5);
  }
  // canopy - layered clusters
  canopy(ctx, rand, x + 10, 30, 140, 70, COLORS.leaf, 26);
  canopy(ctx, rand, x + 96, 84, 46, 26, COLORS.leaf, 7);
  canopy(ctx, rand, x - 66, 84, 40, 24, COLORS.leaf, 6);
  // hanging vines
  for (let i = 0; i < 9; i++) {
    const vx = x - 80 + rand.int(0, 210);
    const len = rand.int(12, 38);
    for (let j = 0; j < len; j++) {
      px(ctx, COLORS.leaf.dark, vx + Math.round(Math.sin(j * 0.4) * 1), 86 + j);
      if (j % 4 === 0) px(ctx, COLORS.leaf.mid, vx + 1, 86 + j, 2, 1);
    }
  }
}

export function paintHangingLantern(ctx, x, y, ropeTop) {
  line(ctx, '#2b1c22', x, ropeTop, x, y - 6);
  px(ctx, '#2b1c22', x - 4, y - 6, 9, 2);
  px(ctx, '#3a2a2a', x - 4, y - 4, 9, 10);
  px(ctx, COLORS.glow.warm, x - 3, y - 3, 7, 8);
  px(ctx, COLORS.glow.core, x - 1, y - 2, 3, 5);
  px(ctx, '#3a2a2a', x, y - 4, 1, 10);
  px(ctx, '#2b1c22', x - 3, y + 6, 7, 2);
}

export function paintBush(ctx, rand, x, groundY, s = 1, kind = 'green') {
  const pal = kind === 'blossom' ? COLORS.blossom : COLORS.leaf;
  const r = Math.round(10 * s);
  const blobs = [[x - r, groundY - r * 0.7, r], [x + r * 0.6, groundY - r * 0.8, r + 2], [x - r * 0.1, groundY - r * 1.3, r]];
  for (const [bx, by, br] of blobs) disc(ctx, pal.dark, bx, by, br);
  for (const [bx, by, br] of blobs) disc(ctx, pal.mid, bx + 1, by - 2, br - 2);
  for (const [bx, by, br] of blobs) disc(ctx, pal.light, bx + 3, by - 4, Math.max(1, br - 6));
  px(ctx, pal.dark, x - r * 2, groundY - 2, r * 3.6, 2);
  if (kind !== 'blossom') {
    for (let i = 0; i < 5; i++) px(ctx, rand.pick(['#f2b3c8', '#fde3ec', '#f5c35b']), x + rand.range(-r * 1.6, r * 1.4), groundY - rand.range(4, r * 2), 2, 2);
  }
}

export function paintFlowers(ctx, rand, x, groundY, w) {
  const heads = ['#f2b3c8', '#fde3ec', '#f5c35b', '#d98aa6', '#b79ad8', '#ffffff'];
  for (let i = 0; i < w / 4; i++) {
    const fx = x + rand.range(0, w);
    const h = rand.int(3, 9);
    px(ctx, COLORS.grass.dark, fx, groundY - h, 1, h);
    const c = rand.pick(heads);
    px(ctx, c, fx - 1, groundY - h - 1, 3, 1);
    px(ctx, c, fx, groundY - h - 2, 1, 3);
    px(ctx, '#f5c35b', fx, groundY - h - 1, 1, 1);
  }
}

export function paintRock(ctx, x, groundY, s = 1) {
  const S = COLORS.stone;
  const rx = Math.round(14 * s), ry = Math.round(9 * s);
  ellipse(ctx, S.dark, x, groundY - ry + 2, rx, ry);
  ellipse(ctx, S.mid, x + 1, groundY - ry + 1, rx - 2, ry - 2);
  ellipse(ctx, S.base, x + 3, groundY - ry - 1, rx - 6, ry - 4);
  ellipse(ctx, S.light, x + 5, groundY - ry - 3, Math.max(1, rx - 11), Math.max(1, ry - 7));
  px(ctx, COLORS.grass.base, x - rx + 2, groundY - ry * 1.4, 5, 2);
}

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

export function paintTerrainBlock(ctx, rand, x0, x1, top, bottom) {
  const R = COLORS.rock, Gr = COLORS.grass;
  const w = x1 - x0;
  // depth gradient
  for (let y = top; y < bottom; y++) {
    const d = (y - top) / 120;
    const c = d < 0.5 ? R.base : d < 0.9 ? R.mid : d < 1.4 ? R.dark : R.deep;
    px(ctx, c, x0, y, w, 1);
  }
  // irregular stone courses
  let y = top + 9;
  while (y < bottom) {
    const rh = rand.int(8, 14);
    let x = x0 - rand.int(0, 18);
    while (x < x1) {
      const bw = rand.int(10, 28);
      const sh = rh - rand.int(0, 3);
      const bx = Math.max(x0, x + 1), bxe = Math.min(x1, x + bw - 1);
      if (bxe - bx > 3) {
        const depth = (y - top) / 110;
        const base = depth < 0.45 ? R.base : depth < 0.85 ? R.mid : R.dark;
        const roll = rand();
        const tint = roll < 0.2 ? mix(base, '#9a5a6a', 0.3) : roll < 0.32 ? mix(base, '#c07a50', 0.18) : base;
        const yy = y + 1 + (rh - sh);
        // body with clipped corners for a rounded, hand-placed look
        px(ctx, tint, bx + 1, yy, bxe - bx - 2, sh - 2);
        px(ctx, tint, bx, yy + 1, bxe - bx, sh - 4);
        // rim light (top-left) and shade (bottom-right)
        px(ctx, mix(tint, R.light, depth < 0.9 ? 0.65 : 0.3), bx + 1, yy, bxe - bx - 3, 1);
        px(ctx, mix(tint, R.light, 0.3), bx, yy + 1, 1, sh - 5);
        px(ctx, mix(tint, R.deep, 0.55), bx + 1, yy + sh - 3, bxe - bx - 2, 1);
        px(ctx, mix(tint, R.deep, 0.4), bxe - 1, yy + 1, 1, sh - 4);
        if (rand.chance(0.16)) line(ctx, mix(tint, R.deep, 0.5), bx + 3, yy + 2, bx + 5, yy + sh - 4);
        if (rand.chance(0.12)) px(ctx, mix(R.light, '#ffd0a0', 0.3), bx + rand.int(2, 6), yy + 2, 2, 1);
        if (depth < 0.35 && rand.chance(0.22)) px(ctx, Gr.dark, bx + 1, yy, rand.int(3, 8), 2);
      }
      x += bw;
    }
    y += rh;
  }
  // roots creeping down from the grass
  for (let i = 0; i < w / 70; i++) {
    let rx = x0 + rand.range(6, w - 6);
    const len = rand.int(10, 30);
    for (let j = 0; j < len; j++) {
      if (rand.chance(0.3)) rx += rand.chance(0.5) ? 1 : -1;
      px(ctx, COLORS.bark.dark, rx, top + 8 + j);
    }
  }
  // deep fade
  for (let yy = top + 56; yy < bottom; yy++) {
    const d = Math.min(1, (yy - top - 56) / 60);
    for (let xx = x0; xx < x1; xx++) if (bayer(xx, yy) < d * 0.7) px(ctx, R.deep, xx, yy);
  }
  // ambient occlusion under the grass lip
  for (let k = 0; k < 6; k++) {
    for (let xx = x0; xx < x1; xx++) if (bayer(xx, top + 6 + k) < 0.75 - k * 0.12) px(ctx, R.deep, xx, top + 6 + k);
  }
  // side edges catch light on the right / shade on the left
  px(ctx, R.deep, x0, top, 2, bottom - top);
  px(ctx, mix(R.light, R.base, 0.3), x1 - 2, top + 6, 2, bottom - top);

  // grass cap (top surface seen at a slight angle)
  px(ctx, Gr.base, x0 - 1, top - 8, w + 2, 14);
  px(ctx, Gr.light, x0 - 1, top - 8, w + 2, 3);
  px(ctx, Gr.top, x0, top - 9, w, 1);
  for (let xx = x0; xx < x1; xx++) {
    if (bayer(xx, top) < 0.35) px(ctx, Gr.mid, xx, top - 3 + (xx % 3), 1, 1);
    if (bayer(xx, top + 2) < 0.2) px(ctx, Gr.light, xx, top - 1, 1, 1);
    // ragged overhang
    const drip = Math.max(0, Math.round(2 + Math.sin(xx * 0.31) * 2 + Math.sin(xx * 0.07) * 2 + rand.range(-1, 1)));
    px(ctx, Gr.dark, xx, top + 6, 1, drip);
    px(ctx, Gr.mid, xx, top + 5, 1, 1);
    // tufts on the back edge
    if (rand.chance(0.18)) px(ctx, Gr.top, xx, top - 10 - rand.int(0, 2), 1, rand.int(1, 3));
  }
  // vines hanging off the edge
  for (let i = 0; i < w / 40; i++) {
    const vx = x0 + rand.range(4, w - 4);
    const len = rand.int(6, 26);
    for (let j = 0; j < len; j++) {
      px(ctx, Gr.deep, vx + Math.round(Math.sin(j * 0.5)), top + 6 + j);
      if (j % 3 === 0) px(ctx, Gr.mid, vx + 1, top + 6 + j, 2, 1);
    }
  }
  // pebbles & tiny flowers on the walking surface
  for (let i = 0; i < w / 16; i++) {
    const fx = x0 + rand.range(2, w - 2);
    if (rand.chance(0.5)) px(ctx, rand.pick(['#f2b3c8', '#fde3ec', '#f5c35b']), fx, top - 6 + rand.int(0, 4), 1, 1);
    else px(ctx, COLORS.stone.base, fx, top - 4 + rand.int(0, 3), 2, 1);
  }
}

// ---------------------------------------------------------------------------
// Water, cliff, bridge
// ---------------------------------------------------------------------------

export function paintBackCliff(ctx, rand, x0, x1, top, bottom) {
  // A cooler, hazier rock wall behind the waterfall (it sits further back in depth).
  const c = { base: '#875c70', light: '#b0848f', dark: '#69455d', deep: '#4a3048' };
  const tops = [];
  for (let x = x0; x < x1; x++) {
    const k = ((x - x0) / (x1 - x0)) * 2 - 1;     // -1..1 across the cliff
    tops.push(top + Math.round(k * k * k * k * 70 + Math.sin((x - x0) * 0.09) * 4 + Math.sin(x * 0.27) * 2));
  }
  for (let x = x0; x < x1; x++) {
    const t = tops[x - x0];
    for (let y = t; y < bottom; y++) {
      const d = (y - t) / 160;
      px(ctx, d < 0.5 ? c.base : d < 0.9 ? c.dark : c.deep, x, y);
    }
  }
  // boulder courses
  for (let y = top + 6; y < bottom; y += rand.int(12, 18)) {
    let x = x0 - rand.int(0, 20);
    while (x < x1) {
      const bw = rand.int(16, 34);
      const bh = rand.int(10, 16);
      const cx = x + bw / 2;
      if (cx > x0 && cx < x1 && y > tops[Math.min(x1 - x0 - 1, Math.max(0, Math.round(cx - x0)))] + 4) {
        const d = (y - top) / 160;
        const base = d < 0.5 ? c.base : c.dark;
        ellipse(ctx, mix(base, c.deep, 0.5), cx, y + bh / 2 + 1, bw / 2, bh / 2);
        ellipse(ctx, base, cx, y + bh / 2, bw / 2 - 1, bh / 2 - 1);
        ellipse(ctx, mix(base, c.light, 0.6), cx + 2, y + bh / 2 - 3, Math.max(1, bw / 2 - 6), Math.max(1, bh / 2 - 5));
      }
      x += bw;
    }
  }
  // grassy rim + hanging moss
  for (let x = x0; x < x1; x++) {
    const t = tops[x - x0];
    px(ctx, COLORS.grass.dark, x, t - 3, 1, 6 + (x % 5 === 0 ? rand.int(2, 8) : 0));
    px(ctx, COLORS.grass.base, x, t - 4, 1, 3);
    px(ctx, COLORS.grass.light, x, t - 5, 1, 1);
  }
}

export function paintPondBase(ctx, x0, x1, y, bottom) {
  px(ctx, '#5d6aa8', x0, y, x1 - x0, bottom - y);
  for (let yy = y; yy < bottom; yy++) {
    const d = (yy - y) / (bottom - y);
    for (let x = x0; x < x1; x++) if (bayer(x, yy) < d) px(ctx, '#3f4a86', x, yy);
  }
  px(ctx, '#9db0e6', x0, y, x1 - x0, 1);
  // lily pads
  for (const lx of [x0 + 30, x0 + 140, x0 + 168]) {
    ellipse(ctx, '#5b7a36', lx, y + 8, 7, 2);
    px(ctx, '#86a243', lx - 3, y + 7, 5, 1);
  }
  px(ctx, '#f2b3c8', x0 + 168, y + 6, 2, 2);
}

export function paintBridge(ctx, rand, x0, x1, deckY, waterY) {
  const S = COLORS.stone;
  const w = x1 - x0;
  // arch body
  for (let x = x0; x < x1; x++) {
    const t = (x - x0) / w;
    const archTop = deckY + 10 + Math.round(Math.sin(t * Math.PI) * 0 + (1 - Math.sin(t * Math.PI)) * 36);
    px(ctx, S.mid, x, deckY + 6, 1, archTop - deckY - 6 + 2);
    px(ctx, S.dark, x, archTop, 1, 2);
  }
  // fill below arch near piers
  px(ctx, S.mid, x0, deckY + 6, 18, waterY - deckY);
  px(ctx, S.mid, x1 - 18, deckY + 6, 18, waterY - deckY);
  // stone blocks on the face
  for (let y = deckY + 6; y < waterY; y += 7) {
    for (let x = x0 + ((y / 7) % 2) * 6; x < x1; x += 12) {
      px(ctx, S.dark, x, y, 1, 7);
    }
  }
  // arch keystones
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const ax = x0 + 18 + t * (w - 36);
    const ay = deckY + 10 + Math.round((1 - Math.sin(t * Math.PI)) * 30);
    px(ctx, S.light, ax, ay - 3, 6, 3);
    px(ctx, S.dark, ax, ay, 6, 1);
  }
  // deck surface
  px(ctx, S.base, x0 - 4, deckY - 6, w + 8, 8);
  px(ctx, S.light, x0 - 4, deckY - 7, w + 8, 2);
  for (let x = x0; x < x1; x += 10) px(ctx, S.mid, x, deckY - 5, 1, 7);
  px(ctx, S.dark, x0 - 4, deckY + 2, w + 8, 2);
  // moss
  for (let i = 0; i < w / 6; i++) px(ctx, COLORS.grass.dark, x0 + rand.range(0, w), deckY + 2 + rand.int(0, 3), 2, rand.int(1, 4));
}

// The front parapet is drawn after the characters for depth.
export function paintBridgeRail(ctx, x0, x1, deckY) {
  const S = COLORS.stone;
  for (let x = x0; x <= x1; x += 32) {
    px(ctx, S.dark, x - 1, deckY - 22, 8, 22);
    px(ctx, S.base, x, deckY - 22, 6, 21);
    px(ctx, S.light, x + 4, deckY - 22, 2, 21);
    px(ctx, S.light, x - 2, deckY - 25, 10, 3);
  }
  px(ctx, S.dark, x0, deckY - 17, x1 - x0 + 6, 5);
  px(ctx, S.base, x0, deckY - 18, x1 - x0 + 6, 3);
  px(ctx, S.light, x0, deckY - 19, x1 - x0 + 6, 1);
}

// ---------------------------------------------------------------------------
// Buildings and props
// ---------------------------------------------------------------------------

export function paintHouse(ctx, rand, x0, groundY) {
  const W = COLORS.wood;
  const w = 136, h = 66, side = 18, rise = 10;
  const top = groundY - h;
  // right side wall (depth face)
  for (let i = 0; i < side; i++) {
    const yOff = Math.round((i / side) * rise);
    px(ctx, '#5c3324', x0 + w + i, top - yOff, 1, h + yOff - Math.round(yOff * 0.1));
    if (i % 6 === 0) px(ctx, '#45261c', x0 + w + i, top - yOff, 1, h + yOff);
  }
  // front planks
  for (let y = top; y < groundY; y++) {
    const band = Math.floor((y - top) / 6);
    px(ctx, band % 2 ? W.base : W.mid, x0, y, w, 1);
    if ((y - top) % 6 === 5) px(ctx, W.dark, x0, y, w, 1);
  }
  for (let i = 0; i < 16; i++) px(ctx, W.dark, x0 + rand.int(4, w - 6), top + rand.int(2, h - 4), rand.int(3, 6), 1);
  // corner posts
  px(ctx, W.dark, x0 - 3, top - 2, 6, h + 2);
  px(ctx, W.light, x0 - 1, top - 2, 1, h + 2);
  px(ctx, W.dark, x0 + w - 3, top - 2, 6, h + 2);
  // foundation stones
  for (let x = x0 - 4; x < x0 + w + side; x += 9) {
    px(ctx, COLORS.stone.mid, x, groundY - 6, 8, 6);
    px(ctx, COLORS.stone.light, x, groundY - 6, 8, 1);
  }
  // windows with flower boxes
  for (const wx of [x0 + 22, x0 + 98]) {
    const wy = top + 14;
    px(ctx, W.dark, wx - 2, wy - 2, 24, 22);
    px(ctx, COLORS.glow.warm, wx, wy, 20, 18);
    px(ctx, COLORS.glow.core, wx + 2, wy + 2, 7, 6);
    px(ctx, COLORS.glow.deep, wx, wy + 13, 20, 5);
    px(ctx, W.dark, wx + 9, wy, 2, 18);
    px(ctx, W.dark, wx, wy + 8, 20, 2);
    // box
    px(ctx, W.dark, wx - 3, wy + 20, 26, 6);
    px(ctx, W.mid, wx - 2, wy + 21, 24, 3);
    for (let i = 0; i < 8; i++) {
      px(ctx, COLORS.leaf.mid, wx - 2 + i * 3, wy + 17, 2, 3);
      px(ctx, rand.pick(['#f2b3c8', '#d98aa6', '#fde3ec', '#f5c35b']), wx - 1 + i * 3, wy + 16, 2, 2);
    }
  }
  // door
  const dx = x0 + 56;
  px(ctx, W.dark, dx - 2, top + 22, 28, h - 22);
  px(ctx, '#6a3a26', dx, top + 24, 24, h - 24);
  for (let i = 0; i < 4; i++) px(ctx, '#5a2f20', dx + 1 + i * 6, top + 24, 1, h - 24);
  px(ctx, COLORS.glow.warm, dx + 7, top + 29, 10, 8);
  px(ctx, W.dark, dx + 11, top + 29, 2, 8);
  px(ctx, COLORS.gold || '#f5c35b', dx + 19, top + 46, 2, 2);
  px(ctx, COLORS.stone.base, dx - 6, groundY - 4, 36, 4);
  px(ctx, COLORS.stone.light, dx - 6, groundY - 4, 36, 1);
  // little sign above door
  px(ctx, W.dark, dx - 2, top + 13, 28, 7);
  px(ctx, W.light, dx - 1, top + 14, 26, 5);
  pixelText(ctx, 'HOME', dx + 12, top + 12, { size: 8, color: '#4a2a22', align: 'center' });
  // roof
  const roofTop = top - 44;
  for (let y = roofTop; y < top + 4; y++) {
    const t = (y - roofTop) / (top + 4 - roofTop);
    const half = Math.round(18 + t * (w / 2 + 2));
    const cx = x0 + w / 2;
    const row = Math.floor((y - roofTop) / 4);
    px(ctx, row % 2 ? '#7a3a3e' : '#8b4446', cx - half, y, half * 2, 1);
    if ((y - roofTop) % 4 === 3) {
      for (let k = cx - half + (row % 2) * 4; k < cx + half; k += 8) px(ctx, '#5c2a33', k, y - 3, 1, 4);
      px(ctx, '#5c2a33', cx - half, y, half * 2, 1);
    }
    px(ctx, '#b0605c', cx + half - 3, y, 3, 1);
  }
  // roof depth (top face going back)
  for (let i = 0; i < side; i++) {
    const yOff = Math.round((i / side) * rise);
    const t = 1;
    px(ctx, '#6a3036', x0 + w / 2 + 18 + i, roofTop - yOff, w / 2 - 14, 1);
  }
  for (let y = 0; y < 48; y++) {
    const t = y / 48;
    const x = Math.round(x0 + w / 2 + 18 + t * (w / 2 - 16));
    px(ctx, '#5c2a33', x, roofTop + y - Math.round(rise * (1 - t)) , side, 1);
  }
  // eave shadow on the wall
  for (let k = 0; k < 4; k++) dither(ctx, '#2a1520', x0, top + 4 + k, w, 1, 0.6 - k * 0.15);
  // chimney
  const cx = x0 + 124;
  px(ctx, COLORS.stone.dark, cx - 1, roofTop - 6, 16, 34);
  px(ctx, COLORS.stone.mid, cx, roofTop - 6, 14, 33);
  px(ctx, COLORS.stone.light, cx + 10, roofTop - 6, 3, 33);
  px(ctx, COLORS.stone.dark, cx - 3, roofTop - 10, 20, 5);
  // porch lamp
  px(ctx, '#2b1c22', dx + 32, top + 26, 6, 2);
  paintHangingLantern(ctx, dx + 36, top + 36, top + 27);
}

export function paintFence(ctx, x0, groundY, w) {
  const W = COLORS.wood;
  for (let x = x0; x <= x0 + w; x += 12) {
    px(ctx, W.dark, x, groundY - 20, 4, 20);
    px(ctx, W.light, x + 1, groundY - 20, 2, 19);
    px(ctx, W.dark, x, groundY - 22, 4, 2);
  }
  px(ctx, W.dark, x0, groundY - 16, w + 4, 3);
  px(ctx, W.mid, x0, groundY - 16, w + 4, 1);
  px(ctx, W.dark, x0, groundY - 8, w + 4, 3);
  px(ctx, W.mid, x0, groundY - 8, w + 4, 1);
}

export function paintLampPost(ctx, x, groundY) {
  px(ctx, '#2b1c22', x - 3, groundY - 4, 7, 4);
  px(ctx, '#3a2a35', x - 1, groundY - 52, 3, 50);
  px(ctx, '#5a4655', x, groundY - 52, 1, 50);
  px(ctx, '#2b1c22', x - 5, groundY - 62, 11, 3);
  px(ctx, '#3a2a2a', x - 4, groundY - 59, 9, 9);
  px(ctx, COLORS.glow.warm, x - 3, groundY - 58, 7, 7);
  px(ctx, COLORS.glow.core, x - 1, groundY - 57, 3, 4);
  px(ctx, '#2b1c22', x - 5, groundY - 50, 11, 2);
  px(ctx, '#2b1c22', x - 2, groundY - 65, 5, 3);
}

function woodBoard(ctx, x, y, w, h) {
  const W = COLORS.wood;
  px(ctx, '#2b1a18', x - 1, y - 1, w + 2, h + 2);
  px(ctx, W.mid, x, y, w, h);
  for (let yy = y + 5; yy < y + h; yy += 6) px(ctx, W.base, x, yy, w, 1);
  px(ctx, W.light, x, y, w, 1);
  px(ctx, W.dark, x, y + h - 2, w, 2);
  for (const [nx, ny] of [[x + 2, y + 2], [x + w - 4, y + 2], [x + 2, y + h - 4], [x + w - 4, y + h - 4]]) px(ctx, '#d8bfb4', nx, ny, 2, 2);
}

export function paintWelcomeSign(ctx, x, groundY) {
  const W = COLORS.wood;
  // posts
  for (const pxx of [x - 38, x + 34]) {
    px(ctx, W.dark, pxx, groundY - 62, 5, 62);
    px(ctx, W.light, pxx + 3, groundY - 62, 1, 62);
  }
  const bx = x - 50, by = groundY - 74, bw = 100, bh = 42;
  woodBoard(ctx, bx, by, bw, bh);
  pixelText(ctx, "CHATRIYAN'S", x, by + 5, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
  pixelText(ctx, 'PORTFOLIO', x, by + 15, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
  pixelText(ctx, 'WORLD', x, by + 25, { size: 8, color: '#f5c35b', align: 'center', shadow: '#3a2228' });
  // little gamepad icon
  const gx = x + 30, gy = by + 30;
  px(ctx, '#3a2228', gx - 6, gy, 13, 6);
  px(ctx, '#fbe9cf', gx - 5, gy + 1, 11, 4);
  px(ctx, '#3a2228', gx - 3, gy + 2, 3, 1);
  px(ctx, '#3a2228', gx - 2, gy + 1, 1, 3);
  px(ctx, '#d98aa6', gx + 2, gy + 2, 1, 1);
  px(ctx, '#d98aa6', gx + 4, gy + 2, 1, 1);
  // grass at base
  px(ctx, COLORS.grass.base, x - 42, groundY - 3, 14, 3);
  px(ctx, COLORS.grass.base, x + 30, groundY - 3, 14, 3);
}

export function paintPathSign(ctx, x, groundY) {
  const W = COLORS.wood;
  px(ctx, W.dark, x - 2, groundY - 50, 5, 50);
  px(ctx, W.light, x + 1, groundY - 50, 1, 50);
  // arrow board
  const by = groundY - 48;
  px(ctx, '#2b1a18', x - 30, by - 1, 64, 16);
  px(ctx, W.mid, x - 29, by, 62, 14);
  for (let i = 0; i < 8; i++) px(ctx, '#2b1a18', x + 33 + i, by - 1 + i, 1, 16 - i * 2);
  for (let i = 0; i < 7; i++) px(ctx, W.mid, x + 33 + i, by + i, 1, 14 - i * 2);
  px(ctx, W.light, x - 29, by, 62, 1);
  pixelText(ctx, 'WORKSHOP', x + 2, by + 2, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
}

export function paintMapBoard(ctx, rand, x, groundY) {
  const W = COLORS.wood;
  // posts and little roof
  px(ctx, W.dark, x - 30, groundY - 60, 5, 60);
  px(ctx, W.dark, x + 26, groundY - 60, 5, 60);
  for (let i = 0; i < 8; i++) px(ctx, i < 2 ? '#b0605c' : '#7a3a3e', x - 38 + i, groundY - 70 + i, 76 - i * 2 + i * 2, 1);
  px(ctx, '#5c2a33', x - 38, groundY - 62, 77, 2);
  // board
  const bx = x - 28, by = groundY - 58, bw = 56, bh = 36;
  px(ctx, '#2b1a18', bx - 1, by - 1, bw + 2, bh + 2);
  px(ctx, W.base, bx, by, bw, bh);
  // parchment map
  px(ctx, '#e6cfa6', bx + 3, by + 3, bw - 6, bh - 6);
  px(ctx, '#f3e2c0', bx + 4, by + 4, bw - 8, 2);
  dither(ctx, '#d7b98a', bx + 3, by + 3, bw - 6, bh - 6, 0.12);
  // dotted path with 7 stops
  const stops = [[8, 26], [15, 19], [22, 24], [29, 15], [36, 21], [42, 12], [48, 18]];
  for (let i = 0; i < stops.length - 1; i++) {
    const [ax, ay] = stops[i], [bx2, by2] = stops[i + 1];
    for (let t = 0; t < 1; t += 0.25) px(ctx, '#9a6a4a', bx + ax + (bx2 - ax) * t, by + ay + (by2 - ay) * t);
  }
  stops.forEach(([sx, sy], i) => {
    px(ctx, i === 0 ? '#c0392b' : '#6b2a3a', bx + sx - 1, by + sy - 1, 3, 3);
  });
  px(ctx, '#f5c35b', bx + 7, by + 25, 1, 1);
  // header
  px(ctx, '#2b1a18', x - 26, by - 11, 52, 10);
  px(ctx, W.light, x - 25, by - 10, 50, 8);
  pixelText(ctx, 'JOURNEY', x, by - 12, { size: 8, color: '#4a2a22', align: 'center' });
}

export function paintBarrel(ctx, x, groundY) {
  const W = COLORS.wood;
  ellipse(ctx, W.dark, x, groundY - 10, 8, 10);
  px(ctx, W.base, x - 7, groundY - 18, 14, 17);
  px(ctx, W.mid, x - 3, groundY - 18, 6, 17);
  px(ctx, W.light, x + 3, groundY - 18, 2, 17);
  px(ctx, '#3a2a35', x - 8, groundY - 15, 16, 2);
  px(ctx, '#3a2a35', x - 8, groundY - 6, 16, 2);
  ellipse(ctx, W.dark, x, groundY - 19, 7, 2);
  ellipse(ctx, W.mid, x, groundY - 19, 5, 1);
}

export function paintCrate(ctx, x, y, w, h) {
  const W = COLORS.wood;
  px(ctx, W.dark, x, y, w, h);
  px(ctx, W.mid, x + 2, y + 2, w - 4, h - 4);
  line(ctx, W.dark, x + 2, y + 2, x + w - 3, y + h - 3);
  line(ctx, W.dark, x + 3, y + 2, x + w - 2, y + h - 3);
  px(ctx, W.light, x + 2, y + 2, w - 4, 1);
  // top face (3D)
  for (let i = 0; i < 5; i++) px(ctx, W.light, x + i, y - i, w, 1);
  px(ctx, W.dark, x + 5, y - 5, w, 1);
  for (let i = 0; i < 5; i++) px(ctx, W.base, x + w + i - 1, y - i, 1, h);
}

export function paintBench(ctx, x, groundY) {
  const W = COLORS.wood;
  px(ctx, W.dark, x - 16, groundY - 12, 3, 12);
  px(ctx, W.dark, x + 13, groundY - 12, 3, 12);
  px(ctx, W.dark, x - 20, groundY - 14, 40, 4);
  px(ctx, W.light, x - 20, groundY - 14, 40, 1);
  px(ctx, W.dark, x - 18, groundY - 26, 3, 12);
  px(ctx, W.dark, x + 15, groundY - 26, 3, 12);
  px(ctx, W.mid, x - 20, groundY - 26, 40, 3);
  px(ctx, W.mid, x - 20, groundY - 20, 40, 3);
}

export function paintGear(ctx, x, cy, r, colors = ['#6a4a48', '#8a5f52', '#a87a62']) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    px(ctx, colors[0], x + Math.cos(a) * (r + 2) - 2, cy + Math.sin(a) * (r + 2) - 2, 5, 5);
  }
  disc(ctx, colors[0], x, cy, r);
  disc(ctx, colors[1], x, cy, r - 2);
  disc(ctx, colors[2], x + 1, cy - 1, Math.max(1, r - 6));
  disc(ctx, colors[1], x, cy, Math.max(1, r - 9));
  disc(ctx, colors[0], x, cy, 3);
}

export function paintGearProp(ctx, x, groundY) {
  paintGear(ctx, x, groundY - 12, 14);
  px(ctx, COLORS.grass.base, x - 16, groundY - 4, 32, 4);
  px(ctx, COLORS.grass.light, x - 14, groundY - 5, 6, 1);
}

export function paintWorkshop(ctx, rand, x0, groundY) {
  const w = 300, h = 118, side = 22, rise = 12;
  const top = groundY - h;
  const brick = ['#9a4a3a', '#a8543f', '#8a4034', '#93463a'];
  // side wall (depth)
  for (let i = 0; i < side; i++) {
    const yOff = Math.round((i / side) * rise);
    px(ctx, '#6a302e', x0 + w + i, top - yOff, 1, h + yOff);
    for (let y = top - yOff; y < groundY; y += 5) px(ctx, '#55262a', x0 + w + i, y, 1, 1);
  }
  // brick facade
  for (let y = top; y < groundY; y += 5) {
    const row = (y - top) / 5;
    for (let x = x0 - ((row % 2) * 6); x < x0 + w; x += 12) {
      const bx = Math.max(x0, x), bw = Math.min(x0 + w, x + 11) - bx;
      if (bw <= 0) continue;
      const c = brick[rand.int(0, 3)];
      px(ctx, c, bx, y, bw, 4);
      px(ctx, mix(c, '#d08a6a', 0.25), bx, y, bw, 1);
    }
    px(ctx, '#5e2c2c', x0, y + 4, w, 1);
  }
  // grime at the base
  for (let k = 0; k < 14; k++) dither(ctx, '#3a1f2a', x0, groundY - 14 + k, w, 1, k / 18);
  // corner pilasters
  for (const cx of [x0, x0 + w - 8]) {
    px(ctx, '#7a3a30', cx, top - 4, 8, h + 4);
    px(ctx, '#b8654a', cx + 6, top - 4, 2, h + 4);
  }
  // metal roof
  const roofY = top - 28;
  for (let y = roofY; y < top; y++) {
    const t = (y - roofY) / 28;
    const inset = Math.round((1 - t) * 10);
    px(ctx, '#5d5468', x0 - 8 + inset, y, w + 16 - inset * 2, 1);
  }
  for (let x = x0 - 6; x < x0 + w + 8; x += 6) {
    px(ctx, '#776c86', x, roofY + 2, 2, 26);
    px(ctx, '#9a8fb0', x, roofY + 2, 1, 26);
  }
  px(ctx, '#3a3346', x0 - 10, top - 2, w + 20, 4);
  px(ctx, '#9a8fb0', x0 - 10, top - 2, w + 20, 1);
  // roof depth face
  for (let i = 0; i < side; i++) {
    const yOff = Math.round((i / side) * rise);
    px(ctx, '#4a4258', x0 + w + 2 + i, roofY + 10 - yOff, 1, 20);
  }
  // central gable with gear window
  const gx = x0 + w / 2, gTop = roofY - 46;
  for (let y = gTop; y < roofY + 2; y++) {
    const t = (y - gTop) / (roofY + 2 - gTop);
    const half = Math.round(10 + t * 62);
    const row = Math.floor((y - gTop) / 5);
    px(ctx, row % 2 ? brick[0] : brick[2], gx - half, y, half * 2, 1);
    if ((y - gTop) % 5 === 4) px(ctx, '#5e2c2c', gx - half, y, half * 2, 1);
  }
  for (let y = gTop - 4; y < roofY + 4; y++) {
    const t = (y - gTop + 4) / (roofY + 8 - gTop);
    const half = Math.round(12 + t * 64);
    px(ctx, '#3a3346', gx - half - 2, y, 4, 1);
    px(ctx, '#3a3346', gx + half - 2, y, 4, 1);
    px(ctx, '#9a8fb0', gx + half - 1, y, 1, 1);
  }
  // round gear window (glowing)
  const wy = roofY - 16;
  disc(ctx, '#3a2228', gx, wy, 17);
  disc(ctx, COLORS.glow.deep, gx, wy, 15);
  disc(ctx, COLORS.glow.warm, gx, wy, 13);
  paintGear(ctx, gx, wy, 8, ['#4a2a2a', '#6a3a30', '#8a5040']);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    line(ctx, '#3a2228', gx - Math.cos(a) * 14, wy - Math.sin(a) * 14, gx + Math.cos(a) * 14, wy + Math.sin(a) * 14);
  }
  // factory windows
  for (const wx of [x0 + 24, x0 + 70, x0 + 196, x0 + 242]) {
    const wy2 = top + 18;
    px(ctx, '#3a2228', wx - 2, wy2 - 2, 38, 42);
    px(ctx, '#7a3a30', wx - 3, wy2 + 40, 40, 3);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const lit = rand.chance(0.72);
        px(ctx, lit ? COLORS.glow.warm : '#5b3a4a', wx + c * 12, wy2 + r * 10, 10, 8);
        if (lit) px(ctx, COLORS.glow.core, wx + c * 12 + 1, wy2 + r * 10 + 1, 3, 2);
        else px(ctx, '#7a5266', wx + c * 12 + 1, wy2 + r * 10 + 1, 2, 2);
      }
    }
  }
  // sign board
  const sy = top + 6;
  px(ctx, '#2b1a18', gx - 64, sy - 1, 128, 15);
  px(ctx, '#4a2a22', gx - 63, sy, 126, 13);
  px(ctx, '#6a3f2c', gx - 63, sy, 126, 1);
  pixelText(ctx, 'THE OLD WORKSHOP', gx, sy + 1, { size: 8, color: '#f5c35b', align: 'center', shadow: '#1d1222' });
  // big sliding door (closed for now)
  const dW = 66, dH = 76, dx = gx - dW / 2, dy = groundY - dH;
  px(ctx, '#2b1a18', dx - 4, dy - 4, dW + 8, dH + 4);
  px(ctx, '#3a3346', dx - 6, dy - 7, dW + 12, 3);
  for (let x = dx; x < dx + dW; x += 6) {
    px(ctx, '#6a3f2c', x, dy, 5, dH);
    px(ctx, '#7f4e34', x, dy, 1, dH);
    px(ctx, '#4a2a22', x + 5, dy, 1, dH);
  }
  px(ctx, '#2b1a18', gx - 1, dy, 2, dH);
  for (const [ax, ay, bx, by] of [[dx, dy + 6, gx - 2, dy + dH - 6], [dx + dW, dy + 6, gx + 2, dy + dH - 6]]) {
    for (let k = 0; k < 3; k++) line(ctx, '#4a2a22', ax, ay + k, bx, by + k);
  }
  px(ctx, '#4a2a22', dx, dy + 8, dW, 4);
  px(ctx, '#4a2a22', dx, dy + dH - 14, dW, 4);
  // chain + padlock
  for (let i = 0; i < 20; i++) px(ctx, i % 2 ? '#9a8fb0' : '#5d5468', gx - 20 + i * 2, dy + 34 + Math.round(Math.sin(i / 19 * Math.PI) * 6), 2, 2);
  px(ctx, '#c08a2a', gx - 4, dy + 40, 9, 8);
  px(ctx, '#f5c35b', gx - 3, dy + 41, 7, 2);
  px(ctx, '#7a5a20', gx, dy + 44, 1, 2);
  px(ctx, '#9a8fb0', gx - 2, dy + 36, 1, 4);
  px(ctx, '#9a8fb0', gx + 2, dy + 36, 1, 4);
  // cage lamps
  for (const lx of [gx - 60, gx + 60]) {
    px(ctx, '#2b1c22', lx - 1, groundY - 82, 3, 8);
    px(ctx, '#3a2a35', lx - 5, groundY - 76, 11, 3);
    px(ctx, COLORS.glow.warm, lx - 3, groundY - 73, 7, 7);
    px(ctx, COLORS.glow.core, lx - 1, groundY - 72, 3, 4);
    px(ctx, '#3a2a35', lx - 4, groundY - 73, 1, 7);
    px(ctx, '#3a2a35', lx + 4, groundY - 73, 1, 7);
    px(ctx, '#3a2a35', lx - 4, groundY - 66, 9, 2);
  }
  // pipes on the left wall
  px(ctx, '#5d5468', x0 + 10, top + 2, 5, h - 6);
  px(ctx, '#9a8fb0', x0 + 13, top + 2, 1, h - 6);
  for (let y = top + 12; y < groundY - 8; y += 22) px(ctx, '#3a3346', x0 + 9, y, 7, 3);
  px(ctx, '#5d5468', x0 + 10, groundY - 10, 22, 5);
  // banner: CH 01
  const bX = x0 + 132 - 72, bY = top + 4;
  // tall chimney stack
  const cx = x0 + 258;
  px(ctx, '#6a302e', cx - 1, groundY - 206, 20, 90);
  for (let y = groundY - 206; y < groundY - 118; y += 5) {
    px(ctx, '#8a4034', cx, y, 18, 4);
    px(ctx, '#b8654a', cx + 14, y, 3, 4);
  }
  px(ctx, '#3a3346', cx - 3, groundY - 210, 24, 6);
  px(ctx, '#9a8fb0', cx - 3, groundY - 210, 24, 1);
  px(ctx, '#3a3346', cx - 2, groundY - 180, 22, 3);
  // hanging banner on the left section
  px(ctx, '#3a2228', x0 + 120, top + 24, 2, 4);
  return { bX, bY };
}

export function paintBanner(ctx, x, y) {
  px(ctx, '#3a2a35', x - 2, y, 30, 3);
  px(ctx, '#8c3b3b', x, y + 3, 26, 34);
  px(ctx, '#a84a4a', x, y + 3, 26, 2);
  px(ctx, '#f5c35b', x, y + 3, 2, 34);
  px(ctx, '#f5c35b', x + 24, y + 3, 2, 34);
  for (let i = 0; i < 6; i++) px(ctx, '#8c3b3b', x + i * 2 + 2, y + 37 + Math.min(i, 5 - i), 2, 3);
  for (let i = 0; i < 6; i++) px(ctx, '#8c3b3b', x + 13 + i * 2, y + 37 + Math.min(i, 5 - i), 2, 3);
  pixelText(ctx, 'CH', x + 13, y + 8, { size: 8, color: '#f6e6d0', align: 'center' });
  pixelText(ctx, '01', x + 13, y + 20, { size: 8, color: '#f5c35b', align: 'center' });
}

export function paintPlatform(ctx, rand, p) {
  if (p.kind === 'log') {
    const W = COLORS.bark;
    px(ctx, W.dark, p.x, p.y - 1, p.w, 11);
    px(ctx, W.base, p.x + 1, p.y, p.w - 2, 8);
    px(ctx, W.light, p.x + 1, p.y, p.w - 2, 2);
    for (let i = 0; i < p.w; i += 7) px(ctx, W.dark, p.x + i + 2, p.y + 3, 4, 1);
    ellipse(ctx, '#b98052', p.x + p.w - 2, p.y + 4, 3, 5);
    ellipse(ctx, '#80523a', p.x + p.w - 2, p.y + 4, 1, 2);
    px(ctx, COLORS.grass.base, p.x + 6, p.y - 2, 10, 2);
    // ropes holding it up
    line(ctx, '#d8bfb4', p.x + 6, p.y, p.x + 2, p.y - 60);
    line(ctx, '#d8bfb4', p.x + p.w - 6, p.y, p.x + p.w - 2, p.y - 60);
  } else if (p.kind === 'island') {
    paintFloatingIsland(ctx, p.x, p.y + 1, p.w, rand, { tone: 'near', waterfall: false });
    paintFlowers(ctx, rand, p.x + 8, p.y, p.w - 50);
    // telescope / lookout post
    const tx = p.x + p.w - 30;
    px(ctx, COLORS.wood.dark, tx, p.y - 18, 2, 18);
    px(ctx, COLORS.wood.dark, tx - 5, p.y - 2, 12, 2);
    px(ctx, '#5d5468', tx - 6, p.y - 24, 16, 5);
    px(ctx, '#9a8fb0', tx - 6, p.y - 24, 16, 1);
    px(ctx, '#f5c35b', tx + 9, p.y - 24, 2, 5);
  } else {
    const S = COLORS.stone;
    px(ctx, S.dark, p.x, p.y, p.w, 10);
    px(ctx, S.base, p.x + 1, p.y, p.w - 2, 7);
    px(ctx, S.light, p.x + 1, p.y, p.w - 2, 2);
    for (let i = 0; i < 5; i++) px(ctx, S.dark, p.x + 4 + i * 7, p.y + 10, 3, 3 - (i % 2));
    px(ctx, COLORS.grass.base, p.x + 3, p.y - 2, p.w - 10, 2);
  }
}

export function pixelTextOn(ctx, text, x, y, size, color, shadow, font) {
  pixelText(ctx, text, x, y, { size, color, align: 'center', shadow, ...(font ? { font } : {}) });
}
