// Stage 2 painters: the industrial district, the Old Workshop factory hall,
// the break yard and the gateway to the World of UX.
// Same pixel language as art.js: key light from the sunset (upper right),
// ambient occlusion in corners, chunky 1px highlights.

import { px, dither, disc, ellipse, line, mix, pixelText, bayer } from './pixel.js';
import { COLORS, paintTerrainBlock, paintGear } from './art.js';
import { WORLD } from '../config.js';

const G = WORLD.ground;

export const IND = {
  concrete: { top: '#c4b1a1', light: '#ab988a', base: '#94827a', mid: '#7c6c66', dark: '#5f504d', deep: '#3a2d33', joint: '#5a4a48' },
  steel: { deep: '#2f2c37', dark: '#474857', base: '#5f6273', mid: '#7a7e90', light: '#a2a7b8', hi: '#cfd2dc' },
  rust: { dark: '#6e3626', base: '#9a4e2e', light: '#c26e3e' },
  hazard: { y: '#e3b13c', k: '#2a2228' },
  brick: ['#8e4636', '#9c5039', '#81402f', '#934a37'],
  glass: { lit: '#ffcf7a', core: '#fff0c4', dim: '#6a4a5a', frame: '#3a2a30' },
  neon: { core: '#e9fbff', cyan: '#8eeaff', violet: '#b79cff', pink: '#ff9ad5' },
};

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

function concreteFace(ctx, rand, x0, x1, top, bottom) {
  const C = IND.concrete;
  for (let y = top; y < bottom; y++) {
    const d = (y - top) / 120;
    px(ctx, d < 0.45 ? C.base : d < 0.85 ? C.mid : d < 1.3 ? C.dark : C.deep, x0, y, x1 - x0, 1);
  }
  // cast panels with joints and form-tie holes
  for (let x = x0 - ((x0 % 48) + 48) % 48; x < x1; x += 48) {
    if (x > x0) {
      px(ctx, C.joint, x, top + 8, 1, bottom - top);
      px(ctx, C.light, x + 1, top + 8, 1, bottom - top);
    }
    for (let y = top + 22; y < bottom - 10; y += 26) {
      for (const tx of [x + 12, x + 36]) if (tx > x0 && tx < x1) px(ctx, C.dark, tx, y, 2, 2);
    }
  }
  // rust streaks bleeding from the top
  for (let i = 0; i < (x1 - x0) / 34; i++) {
    const sx = x0 + rand.range(2, x1 - x0 - 2);
    const len = rand.int(10, 40);
    for (let j = 0; j < len; j++) if (bayer(sx, top + 8 + j) < 1 - j / len) px(ctx, IND.rust.base, sx, top + 8 + j, rand.chance(0.3) ? 2 : 1, 1);
  }
  // deep fade
  for (let y = top + 56; y < bottom; y++) {
    const d = Math.min(1, (y - top - 56) / 60);
    for (let x = x0; x < x1; x++) if (bayer(x, y) < d * 0.7) px(ctx, C.deep, x, y);
  }
  for (let k = 0; k < 5; k++) for (let x = x0; x < x1; x++) if (bayer(x, top + 6 + k) < 0.7 - k * 0.13) px(ctx, C.deep, x, top + 6 + k);
}

function concreteCap(ctx, rand, x0, x1, top, { curb = true } = {}) {
  const C = IND.concrete;
  px(ctx, C.base, x0, top - 8, x1 - x0, 14);
  px(ctx, C.light, x0, top - 8, x1 - x0, 3);
  px(ctx, C.top, x0, top - 9, x1 - x0, 1);
  px(ctx, C.dark, x0, top + 5, x1 - x0, 1);
  // expansion joints (slanted a little for the top-down depth)
  for (let x = x0 - ((x0 % 40) + 40) % 40; x < x1; x += 40) {
    for (let k = 0; k < 13; k++) {
      const xx = x + Math.round(k * 0.35);
      if (xx > x0 && xx < x1) px(ctx, C.joint, xx, top - 8 + k);
    }
  }
  // grit, cracks and oil stains
  for (let x = x0; x < x1; x++) {
    if (bayer(x, top) < 0.18) px(ctx, C.mid, x, top - 5 + (x % 4), 1, 1);
    if (bayer(x, top + 3) < 0.1) px(ctx, C.light, x, top - 2, 1, 1);
  }
  for (let i = 0; i < (x1 - x0) / 70; i++) {
    let cx = x0 + rand.range(6, x1 - x0 - 6);
    let cy = top - 7;
    for (let k = 0; k < 10; k++) { px(ctx, C.joint, cx, cy); cx += rand.int(-1, 1); cy += 1; if (cy > top + 4) break; }
  }
  for (let i = 0; i < (x1 - x0) / 120; i++) ellipse(ctx, '#6a5a58', x0 + rand.range(10, x1 - x0 - 10), top - 2, rand.int(5, 10), 2);
  // painted curb line
  if (curb) {
    for (let x = x0; x < x1; x += 16) px(ctx, IND.hazard.y, x, top + 3, 10, 2);
  }
  // weeds pushing through
  for (let i = 0; i < (x1 - x0) / 45; i++) {
    const wx = x0 + rand.range(4, x1 - x0 - 4);
    px(ctx, COLORS.grass.base, wx, top - 11, 1, 4);
    px(ctx, COLORS.grass.light, wx + 1, top - 10, 1, 3);
    px(ctx, COLORS.grass.dark, wx - 1, top - 9, 1, 2);
  }
}

function factoryFloor(ctx, rand, x0, x1, top, bottom) {
  const S = IND.steel;
  // basement wall below the floor
  for (let y = top; y < bottom; y++) {
    const d = (y - top) / 100;
    px(ctx, d < 0.4 ? '#4c4250' : d < 0.9 ? '#3d3442' : '#2a2230', x0, y, x1 - x0, 1);
  }
  for (let x = x0; x < x1; x += 64) {
    px(ctx, S.dark, x, top + 6, 8, bottom - top);
    px(ctx, S.mid, x + 6, top + 6, 2, bottom - top);
  }
  for (const py of [top + 26, top + 40]) {
    px(ctx, S.dark, x0, py, x1 - x0, 6);
    px(ctx, S.mid, x0, py, x1 - x0, 2);
    for (let x = x0 + 30; x < x1; x += 90) px(ctx, S.deep, x, py - 1, 4, 8);
  }
  // floor: steel plate with a diamond tread
  px(ctx, '#7b7381', x0, top - 8, x1 - x0, 14);
  px(ctx, '#a39aa6', x0, top - 8, x1 - x0, 2);
  px(ctx, '#c8bfc8', x0, top - 9, x1 - x0, 1);
  for (let x = x0; x < x1; x++) {
    for (let y = top - 5; y < top + 4; y++) if (((x + y * 2) % 6 === 0) && ((x - y) % 4 === 0)) px(ctx, '#958c98', x, y);
  }
  for (let x = x0 - ((x0 % 32) + 32) % 32; x < x1; x += 32) if (x > x0) px(ctx, '#5b5462', x, top - 8, 1, 14);
  // safety walkway line
  px(ctx, IND.hazard.y, x0, top + 2, x1 - x0, 2);
  px(ctx, '#2a2228', x0, top + 5, x1 - x0, 1);
}

function paintTerrainCap(ctx, rand, x0, x1, top, paving) {
  for (let x = x0; x < x1; x += 16) {
    const w = Math.min(16, x1 - x);
    if (rand() < paving((x - x0) / (x1 - x0))) concreteCap(ctx, rand, x, x + w, top, { curb: false });
  }
}

export function paintGround(ctx, rand, x0, x1, top, bottom, mat) {
  if (mat === 'concrete') {
    concreteFace(ctx, rand, x0, x1, top, bottom);
    concreteCap(ctx, rand, x0, x1, top);
  } else if (mat === 'factory') {
    factoryFloor(ctx, rand, x0, x1, top, bottom);
  } else if (mat === 'toConcrete' || mat === 'toGlow') {
    // rock face on the green side, a cast concrete wall on the paved side,
    // meeting at a ragged seam; the walking surface hands over in patches
    const toPaving = mat === 'toConcrete';
    const seam = x0 + Math.round((x1 - x0) * (toPaving ? 0.55 : 0.4));
    paintTerrainBlock(ctx, rand, x0, x1, top, bottom);
    if (toPaving) concreteFace(ctx, rand, seam, x1, top + 6, bottom);
    else concreteFace(ctx, rand, x0, seam, top + 6, bottom);
    for (let y = top + 8; y < bottom; y += 6) {
      const j = rand.int(-5, 5);
      px(ctx, toPaving ? COLORS.rock.base : IND.concrete.mid, seam + j, y, 4, 6);
      px(ctx, '#3a1f2a', seam + j + (toPaving ? 4 : -1), y, 1, 6);
    }
    // walking surface: paving patches grow (or shrink) across the stretch
    paintTerrainCap(ctx, rand, x0, x1, top, (t) => (toPaving ? t * 1.25 - 0.1 : 1 - t * 1.3));
    if (!toPaving) {
      // glowing flowers spreading out from the gateway
      for (let i = 0; i < (x1 - x0) / 9; i++) {
        const fx = x0 + rand.range(0, x1 - x0);
        const t = (fx - x0) / (x1 - x0);
        if (rand() > t + 0.15) continue;
        const c = rand.pick([IND.neon.cyan, IND.neon.violet, IND.neon.pink]);
        px(ctx, COLORS.grass.dark, fx, top - 6, 1, 4);
        px(ctx, c, fx - 1, top - 8, 3, 2);
      }
    }
  } else {
    paintTerrainBlock(ctx, rand, x0, x1, top, bottom);
  }
}

// ---------------------------------------------------------------------------
// Road props
// ---------------------------------------------------------------------------

export function paintUtilityPole(ctx, x, gy) {
  const W = COLORS.wood;
  px(ctx, W.dark, x - 2, gy - 150, 5, 150);
  px(ctx, W.mid, x, gy - 150, 2, 150);
  px(ctx, W.dark, x - 22, gy - 140, 46, 4);
  px(ctx, W.light, x - 22, gy - 140, 46, 1);
  for (const ix of [x - 18, x - 6, x + 8, x + 20]) {
    px(ctx, '#cfd2dc', ix, gy - 144, 3, 4);
  }
  // wires sagging away to both sides
  for (const [ix, dir] of [[x - 17, -1], [x - 5, -1], [x + 9, 1], [x + 21, 1]]) {
    for (let k = 0; k < 130; k++) {
      const u = k / 130;
      px(ctx, '#2b2330', ix + dir * k, gy - 144 + Math.round(16 * u * (2 - u) * (1 - u * 0.4)), 1, 1);
    }
  }
  // transformer
  px(ctx, IND.steel.dark, x + 3, gy - 120, 12, 18);
  px(ctx, IND.steel.mid, x + 4, gy - 119, 10, 3);
}

export function paintChainFence(ctx, x0, gy, w) {
  const S = IND.steel;
  for (let x = x0; x <= x0 + w; x += 36) {
    px(ctx, S.dark, x, gy - 46, 3, 46);
    px(ctx, S.light, x + 1, gy - 46, 1, 46);
  }
  px(ctx, S.dark, x0, gy - 44, w + 3, 2);
  // diamond mesh
  for (let y = gy - 42; y < gy - 2; y++) {
    for (let x = x0 + 2; x < x0 + w; x++) {
      if ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) px(ctx, 'rgba(162,167,184,0.55)', x, y);
    }
  }
  // barbed wire on top
  for (let x = x0; x < x0 + w; x += 3) px(ctx, S.mid, x, gy - 50 + ((x / 3) % 2), 2, 1);
  for (let x = x0 + 4; x < x0 + w; x += 9) px(ctx, S.light, x, gy - 51, 1, 3);
}

export function paintStreetLamp(ctx, x, gy) {
  const S = IND.steel;
  px(ctx, S.deep, x - 3, gy - 4, 8, 4);
  px(ctx, S.dark, x - 1, gy - 84, 4, 80);
  px(ctx, S.mid, x + 1, gy - 84, 1, 80);
  // curved arm
  for (let i = 0; i < 16; i++) px(ctx, S.dark, x + i, gy - 86 - Math.round(Math.sin((i / 16) * Math.PI / 2) * 4), 2, 2);
  px(ctx, S.deep, x + 10, gy - 84, 14, 4);
  px(ctx, '#ffc46a', x + 11, gy - 80, 12, 2);
  px(ctx, '#fff0c4', x + 14, gy - 80, 6, 1);
}

export function paintPallets(ctx, rand, x, gy) {
  const W = COLORS.wood;
  for (let i = 0; i < 4; i++) {
    const y = gy - 6 - i * 6;
    px(ctx, W.dark, x - 20, y, 40, 6);
    px(ctx, W.light, x - 20, y, 40, 2);
    for (const bx of [x - 20, x - 2, x + 16]) px(ctx, W.mid, bx, y + 2, 4, 4);
  }
  // shrink-wrapped sacks on top
  px(ctx, '#b9a99a', x - 16, gy - 36, 30, 12);
  px(ctx, '#d8c9b8', x - 16, gy - 36, 30, 3);
  px(ctx, '#8e7e72', x - 1, gy - 36, 1, 12);
}

export function paintGate(ctx, x, gy) {
  const S = IND.steel;
  const half = 64;
  for (const pxx of [x - half, x + half - 10]) {
    px(ctx, S.deep, pxx - 1, gy - 128, 12, 128);
    px(ctx, S.dark, pxx, gy - 128, 10, 128);
    px(ctx, S.light, pxx + 7, gy - 128, 2, 128);
    for (let y = gy - 120; y < gy - 4; y += 12) px(ctx, S.deep, pxx + 2, y, 5, 2);
    // hazard foot
    for (let y = gy - 18; y < gy; y += 6) {
      px(ctx, IND.hazard.y, pxx, y, 10, 3);
      px(ctx, IND.hazard.k, pxx, y + 3, 10, 3);
    }
  }
  // truss beam
  const by = gy - 140;
  px(ctx, S.deep, x - half - 6, by, half * 2 + 12, 16);
  px(ctx, S.dark, x - half - 6, by + 1, half * 2 + 12, 3);
  px(ctx, S.dark, x - half - 6, by + 12, half * 2 + 12, 3);
  for (let i = 0; i < 14; i++) {
    const xx = x - half + i * 10;
    line(ctx, S.mid, xx, by + 3, xx + 5, by + 12);
    line(ctx, S.mid, xx + 5, by + 12, xx + 10, by + 3);
  }
  // sign
  px(ctx, '#1d1222', x - 62, by + 18, 124, 30);
  px(ctx, '#4a2a22', x - 61, by + 19, 122, 28);
  px(ctx, '#6a3f2c', x - 61, by + 19, 122, 1);
  pixelText(ctx, 'THE OLD WORKSHOP', x, by + 21, { size: 8, color: '#f5c35b', align: 'center', shadow: '#1d1222' });
  pixelText(ctx, 'CHAPTER 01 · PART 02', x, by + 33, { size: 8, color: '#f2c18d', align: 'center', shadow: '#1d1222' });
  for (const hx of [x - 50, x + 50]) line(ctx, '#2b2330', hx, by + 16, hx, by + 19);
  // lamp hanging under the beam
  px(ctx, S.deep, x - 6, by + 52, 12, 3);
  px(ctx, '#ffc46a', x - 4, by + 55, 8, 2);
}

// ---------------------------------------------------------------------------
// The Old Workshop hall
// ---------------------------------------------------------------------------

function hazardStripes(ctx, x, y, w, h) {
  px(ctx, IND.hazard.k, x, y, w, h);
  for (let k = 0; k < h; k++) {
    for (let i = -h; i < w; i += 8) {
      const xx = x + i + k;
      const x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + 4);
      if (x1 > x0) px(ctx, IND.hazard.y, x0, y + k, x1 - x0, 1);
    }
  }
}

function steelBox(ctx, x, y, w, h, tone = 'base') {
  const S = IND.steel;
  px(ctx, S.deep, x - 1, y - 1, w + 2, h + 2);
  px(ctx, S[tone], x, y, w, h);
  px(ctx, S.light, x, y, w, 1);
  px(ctx, S.light, x + w - 2, y, 2, h);
  px(ctx, S.dark, x, y + h - 2, w, 2);
}

export function paintHall(ctx, rand, x0, x1, roofY, gy) {
  const S = IND.steel;
  const w = x1 - x0;
  // dark ceiling void above the roof line
  px(ctx, '#241b28', x0 - 8, roofY - 400, w + 16, 400);
  // back wall: corrugated, sun-warmed steel above a brick base
  for (let y = roofY; y < gy - 64; y++) {
    const t = (y - roofY) / (gy - 64 - roofY);
    px(ctx, mix('#5a4652', '#6e5560', t), x0, y, w, 1);
  }
  for (let x = x0; x < x1; x += 4) px(ctx, '#4c3b48', x, roofY, 1, gy - 64 - roofY);
  for (let x = x0 + 2; x < x1; x += 4) px(ctx, '#7a6270', x, roofY, 1, gy - 64 - roofY);
  for (let y = gy - 64; y < gy; y += 5) {
    const row = (y - gy + 64) / 5;
    for (let x = x0 - (row % 2) * 6; x < x1; x += 12) {
      const bx = Math.max(x0, x), bw = Math.min(x1, x + 11) - bx;
      if (bw <= 0) continue;
      const c = IND.brick[rand.int(0, 3)];
      px(ctx, mix(c, '#2a1a24', 0.35), bx, y, bw, 4);
    }
    px(ctx, '#3a2228', x0, y + 4, w, 1);
  }
  px(ctx, S.dark, x0, gy - 66, w, 3);
  px(ctx, S.mid, x0, gy - 66, w, 1);

  // tall factory windows glowing with sunset
  for (let wx = x0 + 70; wx < x1 - 100; wx += 170) {
    const wy = roofY + 30, ww = 96, wh = 92;
    px(ctx, IND.glass.frame, wx - 3, wy - 3, ww + 6, wh + 6);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const lit = rand() < 0.86;
        const pxl = wx + c * 24, pyl = wy + r * 23;
        if (lit) {
          for (let y = 0; y < 21; y++) px(ctx, mix('#ffd98a', '#f2a060', (r * 23 + y) / wh), pxl, pyl + y, 22, 1);
          px(ctx, '#fff2c4', pxl + 2, pyl + 2, 6, 2);
        } else {
          px(ctx, IND.glass.dim, pxl, pyl, 22, 21);
          line(ctx, '#8a6a7a', pxl + 3, pyl + 16, pxl + 15, pyl + 4);
        }
      }
    }
    px(ctx, IND.glass.frame, wx + ww / 2 - 1, wy, 2, wh);
    px(ctx, S.mid, wx - 4, wy + wh + 3, ww + 8, 3);
  }
  // I-beam columns
  for (let cx = x0 + 10; cx < x1; cx += 170) {
    px(ctx, S.deep, cx - 7, roofY, 16, gy - roofY);
    px(ctx, S.dark, cx - 5, roofY, 12, gy - roofY);
    px(ctx, S.mid, cx + 3, roofY, 2, gy - roofY);
    for (let y = roofY + 10; y < gy; y += 18) px(ctx, S.light, cx - 3, y, 1, 1);
    px(ctx, S.deep, cx - 9, gy - 8, 20, 8);
  }
  // roof trusses
  for (let x = x0; x < x1; x += 34) {
    line(ctx, S.dark, x, roofY, x + 17, roofY + 22);
    line(ctx, S.dark, x + 17, roofY + 22, x + 34, roofY);
  }
  px(ctx, S.deep, x0, roofY - 4, w, 6);
  px(ctx, S.dark, x0, roofY + 22, w, 3);
  // crane rail
  px(ctx, S.deep, x0 + 40, gy - 212, w - 80, 8);
  px(ctx, IND.hazard.y, x0 + 40, gy - 212, w - 80, 2);
  // pipe runs with valves
  for (const [py, c] of [[gy - 118, '#7f5a4a'], [gy - 108, '#5f6273']]) {
    px(ctx, mix(c, '#000000', 0.35), x0, py - 1, w, 7);
    px(ctx, c, x0, py, w, 5);
    px(ctx, mix(c, '#ffffff', 0.35), x0, py, w, 1);
    for (let x = x0 + 40; x < x1; x += 120) px(ctx, mix(c, '#000000', 0.45), x, py - 2, 4, 9);
  }
  for (const vx of [x0 + 180, x0 + 620, x0 + 1040]) {
    disc(ctx, '#7a2a2a', vx, gy - 126, 5);
    disc(ctx, '#c0473a', vx, gy - 126, 3);
    px(ctx, '#2a1a1a', vx - 1, gy - 121, 2, 6);
  }
  // hanging lamps
  for (const lx of [3900, 4220, 4540, 4820]) {
    line(ctx, '#1d1222', lx, roofY + 20, lx, gy - 206);
    for (let i = 0; i < 6; i++) px(ctx, S.dark, lx - 3 - i, gy - 206 + i, 7 + i * 2, 1);
    px(ctx, '#ffd98a', lx - 6, gy - 200, 13, 2);
  }
  // safety signage
  px(ctx, '#1d1222', x0 + 600, gy - 160, 70, 20);
  px(ctx, IND.hazard.y, x0 + 601, gy - 159, 68, 18);
  pixelText(ctx, 'SAFETY', x0 + 635, gy - 160, { size: 8, color: '#2a2228', align: 'center' });
  pixelText(ctx, 'FIRST', x0 + 635, gy - 151, { size: 8, color: '#2a2228', align: 'center' });

  // entrance and exit frames
  for (const ex of [x0, x1 - 16]) {
    px(ctx, S.deep, ex, roofY - 6, 16, gy - roofY + 6);
    px(ctx, S.dark, ex + 2, roofY - 6, 12, gy - roofY + 6);
    hazardStripes(ctx, ex + 2, gy - 40, 12, 40);
  }

  paintLockers(ctx, x0 + 40, gy);
  paintPress(ctx, 3826, gy);
  paintGearHousing(ctx, 3966, gy);
  paintConveyorFrame(ctx, rand, 4090, 4400, gy - 26, gy);
  paintWorkbench(ctx, rand, 4448, gy);
  paintToolCabinet(ctx, 4526, gy);
  paintBlueprint(ctx, rand, 4600, gy);
  paintStairsAndCatwalk(ctx, gy);
}

function paintLockers(ctx, x, gy) {
  for (let i = 0; i < 3; i++) {
    const lx = x + i * 16;
    steelBox(ctx, lx, gy - 58, 15, 58, i === 1 ? 'mid' : 'base');
    for (let k = 0; k < 4; k++) px(ctx, IND.steel.deep, lx + 3, gy - 54 + k * 3, 9, 1);
    px(ctx, IND.steel.hi, lx + 11, gy - 30, 2, 4);
  }
  // a hard hat on top
  ellipse(ctx, IND.hazard.y, x + 26, gy - 61, 6, 3);
  px(ctx, '#fff2a8', x + 22, gy - 63, 4, 1);
}

function paintPress(ctx, x, gy) {
  const S = IND.steel;
  // columns and crown
  steelBox(ctx, x - 34, gy - 132, 10, 132, 'dark');
  steelBox(ctx, x + 24, gy - 132, 10, 132, 'dark');
  steelBox(ctx, x - 40, gy - 150, 80, 22, 'base');
  hazardStripes(ctx, x - 38, gy - 132, 76, 4);
  // hydraulic cylinder (the ram itself is animated)
  steelBox(ctx, x - 9, gy - 128, 18, 22, 'mid');
  // bed
  steelBox(ctx, x - 40, gy - 30, 80, 30, 'base');
  hazardStripes(ctx, x - 38, gy - 30, 76, 4);
  px(ctx, '#2a2228', x - 22, gy - 34, 44, 4);
  // control panel on a stand
  steelBox(ctx, x + 40, gy - 92, 22, 26, 'mid');
  px(ctx, '#1d1222', x + 43, gy - 88, 16, 8);
  px(ctx, '#8eea9a', x + 44, gy - 87, 6, 2);
  disc(ctx, '#c0392b', x + 46, gy - 72, 2);
  disc(ctx, '#3aa36b', x + 55, gy - 72, 2);
  px(ctx, S.dark, x + 49, gy - 66, 4, 66);
  pixelText(ctx, 'PRESS-01', x, gy - 147, { size: 8, color: '#e3b13c', align: 'center' });
}

function paintGearHousing(ctx, x, gy) {
  steelBox(ctx, x - 40, gy - 150, 80, 70, 'dark');
  for (const [bx, by] of [[x - 36, gy - 146], [x + 34, gy - 146], [x - 36, gy - 86], [x + 34, gy - 86]]) px(ctx, IND.steel.light, bx, by, 2, 2);
  steelBox(ctx, x - 6, gy - 80, 12, 80, 'base');
}

function paintConveyorFrame(ctx, rand, x0, x1, top, gy) {
  const S = IND.steel;
  // legs
  for (let x = x0 + 8; x < x1; x += 46) {
    px(ctx, S.dark, x, top + 8, 4, gy - top - 8);
    px(ctx, S.mid, x + 3, top + 8, 1, gy - top - 8);
    line(ctx, S.dark, x + 4, gy - 4, x + 22, top + 10);
  }
  // side rail (the belt surface is animated on top)
  px(ctx, S.deep, x0 - 4, top - 2, x1 - x0 + 8, 12);
  px(ctx, S.base, x0 - 4, top + 2, x1 - x0 + 8, 6);
  px(ctx, S.light, x0 - 4, top + 2, x1 - x0 + 8, 1);
  hazardStripes(ctx, x0 - 4, top + 6, x1 - x0 + 8, 3);
  // end drums
  disc(ctx, S.deep, x0, top + 3, 7);
  disc(ctx, S.deep, x1, top + 3, 7);
  // receiving bin at the end
  steelBox(ctx, x1 + 10, gy - 24, 34, 24, 'base');
  px(ctx, '#b98052', x1 + 14, gy - 26, 10, 6);
  px(ctx, '#94603c', x1 + 26, gy - 28, 12, 8);
  // motor
  steelBox(ctx, x0 + 20, gy - 18, 22, 18, 'mid');
  px(ctx, '#3aa36b', x0 + 24, gy - 14, 3, 3);
}

function paintWorkbench(ctx, rand, x, gy) {
  const W = COLORS.wood;
  // pegboard with tools
  px(ctx, '#8a6a52', x - 6, gy - 104, 80, 46);
  for (let yy = gy - 100; yy < gy - 60; yy += 5) for (let xx = x - 2; xx < x + 72; xx += 5) px(ctx, '#6a4e3e', xx, yy);
  // wrench, hammer, saw, pliers
  line(ctx, IND.steel.light, x + 6, gy - 98, x + 6, gy - 70);
  ellipse(ctx, IND.steel.light, x + 6, gy - 99, 3, 2);
  px(ctx, '#7a4a30', x + 18, gy - 92, 2, 24);
  px(ctx, IND.steel.mid, x + 14, gy - 96, 10, 5);
  px(ctx, IND.steel.light, x + 30, gy - 96, 18, 8);
  px(ctx, '#c0392b', x + 46, gy - 96, 6, 8);
  line(ctx, IND.steel.light, x + 60, gy - 98, x + 56, gy - 76);
  line(ctx, IND.steel.light, x + 62, gy - 98, x + 66, gy - 76);
  // bench
  px(ctx, W.dark, x - 4, gy - 40, 76, 6);
  px(ctx, W.light, x - 4, gy - 40, 76, 2);
  px(ctx, W.dark, x, gy - 34, 4, 34);
  px(ctx, W.dark, x + 64, gy - 34, 4, 34);
  px(ctx, W.base, x + 2, gy - 14, 64, 3);
  // vise and parts
  steelBox(ctx, x + 6, gy - 48, 14, 8, 'mid');
  px(ctx, IND.steel.hi, x + 2, gy - 45, 4, 2);
  paintGear(ctx, x + 40, gy - 45, 4, ['#5f6273', '#7a7e90', '#a2a7b8']);
  px(ctx, '#e3b13c', x + 52, gy - 46, 8, 6);
  // desk lamp
  line(ctx, IND.steel.dark, x + 66, gy - 40, x + 60, gy - 58);
  px(ctx, IND.steel.dark, x + 54, gy - 62, 10, 4);
  px(ctx, '#ffd98a', x + 55, gy - 58, 8, 1);
}

function paintToolCabinet(ctx, x, gy) {
  px(ctx, '#1d1222', x - 1, gy - 51, 32, 51);
  px(ctx, '#b0392f', x, gy - 50, 30, 50);
  px(ctx, '#d0584a', x, gy - 50, 30, 2);
  for (let i = 0; i < 5; i++) {
    px(ctx, '#7a2a24', x + 2, gy - 44 + i * 9, 26, 1);
    px(ctx, IND.steel.light, x + 11, gy - 41 + i * 9, 8, 1);
  }
}

function paintBlueprint(ctx, rand, x, gy) {
  const bx = x - 34, by = gy - 120, bw = 68, bh = 52;
  // easel / wall board
  px(ctx, COLORS.wood.dark, bx - 4, by - 4, bw + 8, bh + 8);
  px(ctx, '#2c5d9a', bx, by, bw, bh);
  dither(ctx, '#3a6eb0', bx, by, bw, bh, 0.25);
  const L = '#d6e8ff';
  // gear drawing with dimension lines
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    px(ctx, L, bx + 20 + Math.cos(t) * 11, by + 22 + Math.sin(t) * 11);
    if (a % 4 === 0) px(ctx, L, bx + 20 + Math.cos(t) * 14, by + 22 + Math.sin(t) * 14);
  }
  disc(ctx, '#2c5d9a', bx + 20, by + 22, 3);
  for (let a = 0; a < 16; a++) px(ctx, L, bx + 20 + Math.cos((a / 16) * Math.PI * 2) * 3, by + 22 + Math.sin((a / 16) * Math.PI * 2) * 3);
  line(ctx, L, bx + 6, by + 42, bx + 34, by + 42);
  px(ctx, L, bx + 6, by + 40, 1, 5);
  px(ctx, L, bx + 34, by + 40, 1, 5);
  // part side view
  px(ctx, L, bx + 42, by + 10, 18, 1);
  px(ctx, L, bx + 42, by + 30, 18, 1);
  px(ctx, L, bx + 42, by + 10, 1, 21);
  px(ctx, L, bx + 59, by + 10, 1, 21);
  px(ctx, L, bx + 46, by + 14, 10, 1);
  px(ctx, L, bx + 46, by + 26, 10, 1);
  for (let k = 0; k < 4; k++) px(ctx, L, bx + 42, by + 36 + k * 3, 14 - k * 3, 1);
  // pins
  px(ctx, '#c0392b', bx + 2, by + 2, 2, 2);
  px(ctx, '#c0392b', bx + bw - 4, by + 2, 2, 2);
  // a curled corner
  for (let k = 0; k < 6; k++) px(ctx, '#9cc0ee', bx + bw - 6 + k, by + bh - 1 - k, 6 - k, 1);
}

function paintStairsAndCatwalk(ctx, gy) {
  const S = IND.steel;
  const top = gy - 72;
  // generator under the catwalk
  steelBox(ctx, 4738, gy - 58, 148, 58, 'base');
  for (let x = 4746; x < 4800; x += 5) px(ctx, S.deep, x, gy - 50, 3, 26);
  disc(ctx, S.deep, 4826, gy - 34, 11);
  disc(ctx, '#e9e3d8', 4826, gy - 34, 9);
  line(ctx, '#c0392b', 4826, gy - 34, 4832, gy - 40);
  steelBox(ctx, 4848, gy - 50, 30, 18, 'mid');
  pixelText(ctx, 'GEN-02', 4863, gy - 48, { size: 8, color: '#2a2228', align: 'center' });
  hazardStripes(ctx, 4740, gy - 8, 144, 6);
  // stairs (up and down)
  for (let i = 0; i < 6; i++) {
    const h = 12 * (i + 1);
    for (const [sx, sy] of [[4660 + i * 12, gy - h], [4892 + i * 12, top + 12 * i]]) {
      px(ctx, S.deep, sx, sy, 12, 4);
      px(ctx, S.light, sx, sy, 12, 1);
      px(ctx, S.mid, sx + 1, sy + 1, 10, 2);
    }
  }
  line(ctx, S.dark, 4660, gy, 4734, top + 2);
  line(ctx, S.dark, 4890, top + 2, 4964, gy);
  // catwalk deck
  px(ctx, S.deep, 4732, top, 160, 8);
  px(ctx, S.mid, 4732, top, 160, 2);
  for (let x = 4734; x < 4890; x += 4) px(ctx, S.dark, x, top + 3, 2, 3);
  // back railing
  for (let x = 4732; x <= 4892; x += 20) px(ctx, S.dark, x, top - 26, 2, 26);
  px(ctx, S.dark, 4732, top - 27, 162, 2);
  px(ctx, S.dark, 4732, top - 14, 162, 1);
}

// Drawn in front of the characters.
export function paintHallFront(ctx, gy) {
  const S = IND.steel;
  const top = gy - 72;
  for (let x = 4734; x <= 4890; x += 26) {
    px(ctx, S.deep, x, top - 24, 3, 24);
    px(ctx, S.light, x + 1, top - 24, 1, 24);
  }
  px(ctx, S.deep, 4732, top - 25, 160, 3);
  px(ctx, IND.hazard.y, 4732, top - 25, 160, 1);
  px(ctx, S.deep, 4732, top - 12, 160, 2);
  // stair handrails
  line(ctx, S.deep, 4662, gy - 26, 4734, top - 25);
  line(ctx, S.light, 4662, gy - 27, 4734, top - 26);
  line(ctx, S.deep, 4890, top - 25, 4962, gy - 26);
  line(ctx, S.light, 4890, top - 26, 4962, gy - 27);
}

// ---------------------------------------------------------------------------
// Break yard
// ---------------------------------------------------------------------------

export function paintVending(ctx, x, gy) {
  px(ctx, '#1d1222', x - 15, gy - 64, 30, 64);
  px(ctx, '#c0473a', x - 14, gy - 63, 28, 62);
  px(ctx, '#e06a50', x - 14, gy - 63, 28, 2);
  px(ctx, '#ffe9c4', x - 11, gy - 58, 16, 38);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    px(ctx, ['#3aa3c0', '#e3b13c', '#7a5ab8', '#3aa36b'][(r + c) % 4], x - 9 + c * 5, gy - 55 + r * 9, 3, 6);
  }
  px(ctx, '#2a2228', x + 7, gy - 50, 5, 14);
  px(ctx, '#8eea9a', x + 8, gy - 56, 3, 2);
  px(ctx, '#2a2228', x - 10, gy - 14, 20, 6);
}

export function paintStringLights(ctx, x0, gy, w) {
  const S = IND.steel;
  for (const pxx of [x0, x0 + w]) {
    px(ctx, S.dark, pxx - 1, gy - 108, 3, 108);
    px(ctx, S.mid, pxx, gy - 108, 1, 108);
  }
  for (let i = 0; i <= w; i++) {
    const t = i / w;
    px(ctx, '#2b2330', x0 + i, gy - 104 + Math.round(Math.sin(t * Math.PI) * 18), 1, 1);
  }
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const bx = x0 + t * w, by = gy - 96 + Math.round(Math.sin(t * Math.PI) * 18);
    px(ctx, '#2b2330', bx, by - 6, 1, 4);
    px(ctx, i % 3 === 0 ? '#ffb0c8' : '#ffe2a0', bx - 1, by - 2, 3, 3);
    px(ctx, '#fff8e0', bx, by - 1, 1, 1);
  }
}

export function paintPottedPlant(ctx, x, gy) {
  px(ctx, '#7a3a30', x - 7, gy - 12, 14, 12);
  px(ctx, '#9a4e3a', x - 8, gy - 13, 16, 3);
  disc(ctx, COLORS.leaf.dark, x, gy - 22, 8);
  disc(ctx, COLORS.leaf.mid, x + 1, gy - 24, 6);
  disc(ctx, COLORS.leaf.light, x + 3, gy - 27, 3);
}

export function paintBreakTable(ctx, x, gy) {
  const W = COLORS.wood;
  // table
  px(ctx, W.dark, x - 32, gy - 26, 64, 5);
  px(ctx, W.light, x - 32, gy - 26, 64, 2);
  px(ctx, W.dark, x - 26, gy - 21, 4, 21);
  px(ctx, W.dark, x + 22, gy - 21, 4, 21);
  // two cups of tea, still warm
  for (const cx of [x - 10, x + 12]) {
    px(ctx, '#e8e0d8', cx - 3, gy - 33, 7, 7);
    px(ctx, '#b07a52', cx - 2, gy - 33, 5, 2);
    px(ctx, '#e8e0d8', cx + 4, gy - 31, 2, 3);
  }
  px(ctx, '#d8bfb4', x - 2, gy - 29, 8, 3);
  // stools
  for (const sx of [x + 24, x + 62]) {
    px(ctx, W.dark, sx - 8, gy - 18, 16, 4);
    px(ctx, W.light, sx - 8, gy - 18, 16, 1);
    px(ctx, W.dark, sx - 6, gy - 14, 2, 14);
    px(ctx, W.dark, sx + 4, gy - 14, 2, 14);
  }
}

export function paintCanteen(ctx, x, gy) {
  const W = COLORS.wood;
  const w = 110;
  // shed
  px(ctx, '#1d1222', x - 1, gy - 84, w + 2, 84);
  for (let y = gy - 83; y < gy; y++) px(ctx, ((y - gy) / 6 | 0) % 2 ? W.base : W.mid, x, y, w, 1);
  // roof with a striped awning
  px(ctx, '#3a3346', x - 8, gy - 92, w + 16, 9);
  px(ctx, '#9a8fb0', x - 8, gy - 92, w + 16, 1);
  for (let i = 0; i < w + 12; i += 12) {
    px(ctx, '#d0584a', x - 6 + i, gy - 82, 6, 12);
    px(ctx, '#f6e6d0', x + i, gy - 82, 6, 12);
  }
  for (let i = 0; i < w + 12; i += 6) px(ctx, i % 12 ? '#f6e6d0' : '#d0584a', x - 6 + i, gy - 70, 6, 2);
  // serving window
  px(ctx, '#3a2228', x + 10, gy - 64, 60, 30);
  px(ctx, '#ffcf7a', x + 12, gy - 62, 56, 26);
  px(ctx, '#f2a060', x + 12, gy - 44, 56, 8);
  // kettle and jars on the counter
  px(ctx, '#5f6273', x + 22, gy - 52, 12, 10);
  px(ctx, '#a2a7b8', x + 22, gy - 52, 12, 2);
  px(ctx, '#5f6273', x + 34, gy - 49, 4, 2);
  for (const jx of [x + 46, x + 54]) px(ctx, '#d8bfb4', jx, gy - 50, 5, 8);
  px(ctx, W.dark, x + 6, gy - 34, 68, 5);
  px(ctx, W.light, x + 6, gy - 34, 68, 1);
  // sign + menu board
  px(ctx, '#1d1222', x + 16, gy - 108, 72, 14);
  px(ctx, '#f6e6d0', x + 17, gy - 107, 70, 12);
  pixelText(ctx, 'CANTEEN', x + 52, gy - 108, { size: 8, color: '#8c3b3b', align: 'center' });
  px(ctx, '#2a2a30', x + 80, gy - 62, 22, 30);
  for (let i = 0; i < 4; i++) px(ctx, '#e8e0d8', x + 83, gy - 57 + i * 6, 12 + (i % 2) * 4, 1);
  // little chimney for the stove
  px(ctx, '#3a3346', x + 78, gy - 104, 8, 14);
}

export function paintFriendSilhouette(ctx, x, gy, facing, alpha, t) {
  // A soft, faceless figure: memories without details.
  ctx.globalAlpha = alpha;
  const bob = Math.round(Math.sin(t) * 0.6);
  const body = '#3a2a44', rim = '#f2c18d';
  // seated: legs to the stool, back slightly rounded
  px(ctx, body, x - 7, gy - 46 + bob, 14, 26);
  disc(ctx, body, x, gy - 54 + bob, 7);
  px(ctx, body, x - 8 * facing - (facing < 0 ? 6 : 0), gy - 22, 14, 6);
  px(ctx, body, x - 10 * facing - (facing < 0 ? 0 : 2), gy - 18, 3, 18);
  // arm resting on the table
  px(ctx, body, x - (facing < 0 ? 18 : -4), gy - 34 + bob, 14, 4);
  // warm rim light from the string lights
  px(ctx, rim, x + (facing < 0 ? 5 : -6), gy - 58 + bob, 1, 6);
  px(ctx, rim, x + (facing < 0 ? 6 : -7), gy - 44 + bob, 1, 14);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// The gateway
// ---------------------------------------------------------------------------

export function paintGlowFlowers(ctx, rand, x, gy, w) {
  for (let i = 0; i < w / 5; i++) {
    const fx = x + rand.range(0, w);
    const h = rand.int(4, 12);
    px(ctx, '#3e5a3a', fx, gy - h, 1, h);
    const c = rand.pick([IND.neon.cyan, IND.neon.violet, IND.neon.pink, '#ffffff']);
    px(ctx, c, fx - 1, gy - h - 1, 3, 1);
    px(ctx, c, fx, gy - h - 2, 1, 3);
  }
}

export function paintUxSign(ctx, x, gy) {
  const bw = 196, bh = 58;
  const bx = x - bw / 2, by = gy - 156;
  for (const pxx of [bx + 18, bx + bw - 22]) {
    px(ctx, '#2b2330', pxx, by + bh, 5, gy - by - bh);
    px(ctx, '#5a5068', pxx + 3, by + bh, 1, gy - by - bh);
  }
  px(ctx, '#0f0a18', bx - 3, by - 3, bw + 6, bh + 6);
  px(ctx, '#1d1430', bx, by, bw, bh);
  // neon frame
  for (const [c, o] of [['#6a50c8', 0], [IND.neon.violet, 2]]) {
    px(ctx, c, bx + 3 + o, by + 3 + o, bw - 6 - o * 2, 1);
    px(ctx, c, bx + 3 + o, by + bh - 4 - o, bw - 6 - o * 2, 1);
    px(ctx, c, bx + 3 + o, by + 3 + o, 1, bh - 6 - o * 2);
    px(ctx, c, bx + bw - 4 - o, by + 3 + o, 1, bh - 6 - o * 2);
  }
  pixelText(ctx, 'A NEW PATH AWAITS', x, by + 9, { size: 8, color: IND.neon.pink, align: 'center', shadow: '#5a2a5a' });
  pixelText(ctx, 'THE WORLD OF UX', x, by + 24, { size: 16, color: IND.neon.cyan, align: 'center', shadow: '#2a4a7a' });
}

export function paintCuriositySign(ctx, x, gy) {
  const W = COLORS.wood;
  px(ctx, W.dark, x - 2, gy - 44, 4, 44);
  px(ctx, '#2b1a18', x - 66, gy - 66, 132, 26);
  px(ctx, W.mid, x - 65, gy - 65, 130, 24);
  px(ctx, W.light, x - 65, gy - 65, 130, 1);
  pixelText(ctx, 'EVERY NEW JOURNEY', x, gy - 64, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
  pixelText(ctx, 'BEGINS WITH CURIOSITY', x, gy - 54, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
}

export const PORTAL_SHAPE = { cy: 70, rx: 36, ry: 62 };

export function paintPortalFrame(ctx, x, gy) {
  // An old stone arch with glowing runes; its light is animated by the renderer.
  const S = COLORS.stone;
  const cy = gy - PORTAL_SHAPE.cy, rx = PORTAL_SHAPE.rx + 10, ry = PORTAL_SHAPE.ry + 10;
  const stone = (sx, sy, rune) => {
    px(ctx, S.dark, sx - 7, sy - 7, 14, 14);
    px(ctx, S.base, sx - 6, sy - 6, 12, 12);
    px(ctx, S.light, sx - 6, sy - 6, 12, 2);
    px(ctx, S.mid, sx - 6, sy + 4, 12, 2);
    if (rune) px(ctx, IND.neon.cyan, sx - 1, sy - 2, 3, 3);
  };
  // pillars from the ground up to the arch spring line
  for (const side of [-1, 1]) {
    for (let y = gy - 6; y > cy; y -= 12) stone(x + side * rx, y, (gy - y) % 36 === 30);
  }
  // the arch itself
  for (let a = 0; a <= 180; a += 7) {
    const t = (a / 180) * Math.PI;
    stone(x + Math.round(Math.cos(t) * rx), cy - Math.round(Math.sin(t) * ry), a % 28 === 0);
  }
  // keystone
  px(ctx, S.dark, x - 9, cy - ry - 12, 18, 18);
  px(ctx, S.light, x - 8, cy - ry - 11, 16, 16);
  px(ctx, IND.neon.violet, x - 3, cy - ry - 6, 6, 6);
  px(ctx, IND.neon.core, x - 1, cy - ry - 4, 2, 2);
  // plinths + stepping stones
  for (const side of [-1, 1]) {
    px(ctx, S.dark, x + side * rx - 10, gy - 6, 20, 6);
    px(ctx, S.light, x + side * rx - 10, gy - 6, 20, 1);
  }
  for (const sx of [x - 30, x - 8, x + 14]) {
    ellipse(ctx, S.mid, sx + 8, gy - 2, 9, 2);
    ellipse(ctx, S.light, sx + 8, gy - 3, 6, 1);
  }
}

// ---------------------------------------------------------------------------
// Industrial skyline for the parallax layers
// ---------------------------------------------------------------------------

export function paintSkyline(ctx, rand, x0, x1, baseY, depth, density = () => 1) {
  // depth 0 = far / hazy, 1 = near
  const tone = [
    { body: '#8d6b84', lit: '#a8869a', win: '#e9b48a', smoke: '#c9a7b8' },
    { body: '#6f5668', lit: '#8a6c7e', win: '#f0b070', smoke: '#b996aa' },
    { body: '#54404f', lit: '#6e5466', win: '#ffc070', smoke: '#a88aa0' },
  ][depth];
  let x = x0;
  while (x < x1) {
    const d = density(x);
    const w = rand.int(40, 110);
    if (rand() > d) { x += w * 0.7; continue; }
    const h = rand.int(30, 70) + depth * 26;
    const kind = rand.int(0, 5);
    const top = baseY - h;
    if (kind <= 1) {
      // sawtooth-roof factory
      px(ctx, tone.body, x, top, w, h + 400);
      for (let k = 0; k < w; k += 16) {
        for (let j = 0; j < 10; j++) px(ctx, tone.body, x + k + j, top - 10 + j, Math.max(1, 16 - j * 1.6), 1);
        px(ctx, tone.lit, x + k, top - 10, 2, 10);
      }
      for (let wy = top + 8; wy < baseY - 6; wy += 10) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (rand() < 0.45) px(ctx, tone.win, wx, wy, 4, 3);
    } else if (kind === 2) {
      // chimney stack with a static plume
      px(ctx, tone.body, x + 10, top - 60, 12, h + 460);
      px(ctx, tone.lit, x + 18, top - 60, 3, h + 60);
      px(ctx, '#c0473a', x + 10, top - 50, 12, 3);
      for (let k = 0; k < 7; k++) {
        const r = 5 + k * 3;
        for (let yy = -r; yy <= r; yy++) {
          const half = Math.floor(Math.sqrt(r * r - yy * yy));
          for (let xx = -half; xx <= half; xx++) {
            const gx = x + 16 + Math.round(k * k * 2.2) + xx, gy = top - 72 - k * 10 + yy;
            if (bayer(gx, gy) < 0.5 - k * 0.06) px(ctx, tone.smoke, gx, gy);
          }
        }
      }
      px(ctx, tone.body, x, baseY - 24, w * 0.6, 424);
    } else if (kind === 3) {
      // cooling tower
      for (let j = 0; j < h + 20; j++) {
        const t = j / (h + 20);
        const half = Math.round(w * 0.32 * (0.75 + 0.35 * Math.cos(t * Math.PI * 1.1 - 0.4)));
        px(ctx, tone.body, x + w / 2 - half, top - 20 + j, half * 2, 1);
        px(ctx, tone.lit, x + w / 2 + half - 3, top - 20 + j, 3, 1);
      }
      px(ctx, tone.body, x, baseY - 1, w, 400);
    } else if (kind === 4) {
      // silo cluster + catwalk
      for (let k = 0; k < 3; k++) {
        const sx = x + k * 16;
        px(ctx, tone.body, sx, top + 6, 14, h + 400);
        ellipse(ctx, tone.body, sx + 7, top + 6, 7, 3);
        px(ctx, tone.lit, sx + 10, top + 6, 3, h);
      }
      px(ctx, tone.body, x, top + 12, 50, 2);
    } else {
      // gantry crane
      px(ctx, tone.body, x + 4, top - 30, 4, h + 430);
      px(ctx, tone.body, x + 4, top - 30, w * 0.9, 4);
      for (let k = 0; k < w * 0.9; k += 6) line(ctx, tone.body, x + 4 + k, top - 26, x + 7 + k, top - 30);
      line(ctx, tone.body, x + w * 0.6, top - 26, x + w * 0.6, top + 10);
      px(ctx, tone.body, x, baseY - 12, w, 412);
    }
    x += w + rand.int(-6, 18);
  }
}
