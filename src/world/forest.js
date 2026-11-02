// Stage 3 painters: the Discovery Forest, the learning station, the six
// industry islands and the first workplace. Same pixel language as the rest.

import { px, dither, disc, ellipse, line, mix, pixelText, bayer } from './pixel.js';
import { COLORS, paintTerrainBlock, paintTree, paintFloatingIsland } from './art.js';
import { IND } from './industrial.js';
import { makeCanvas } from '../engine/assets.js';
import { WORLD } from '../config.js';

const G = WORLD.ground;

export const MAGIC = {
  cyan: '#8eeaff', violet: '#b79cff', pink: '#ff9ad5', gold: '#ffd98a', mint: '#9effc8',
  page: '#f6ead2', pageShade: '#d8c4a4',
};

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

export function paintForestGround(ctx, rand, x0, x1, top, bottom) {
  paintTerrainBlock(ctx, rand, x0, x1, top, bottom);
  // deep, mossy, violet-shadowed earth instead of the village's warm rock
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, top + 7, x1 - x0, bottom - top);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#8f86b8';
  ctx.fillRect(x0, top + 7, x1 - x0, bottom - top);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(60, 110, 70, 0.18)';
  ctx.fillRect(x0, top + 7, x1 - x0, 30);
  ctx.restore();
  // moss hanging over the lip
  for (let x = x0; x < x1; x++) {
    const d = Math.max(0, Math.round(3 + Math.sin(x * 0.21) * 3 + Math.sin(x * 0.05) * 3));
    px(ctx, '#4f7a34', x, top + 6, 1, d);
    if (d > 4 && x % 3 === 0) px(ctx, '#6f9a44', x, top + 6 + d, 1, 2);
  }
  // mossy, magical layer on top of the usual earth: glowing roots and moss
  for (let i = 0; i < (x1 - x0) / 22; i++) {
    let rx = x0 + rand.range(4, x1 - x0 - 4);
    const len = rand.int(12, 40);
    const c = rand.pick([MAGIC.cyan, MAGIC.violet, MAGIC.mint]);
    for (let j = 0; j < len; j++) {
      if (rand.chance(0.35)) rx += rand.chance(0.5) ? 1 : -1;
      px(ctx, j % 5 === 0 ? c : COLORS.bark.dark, rx, top + 10 + j);
    }
  }
  for (let x = x0; x < x1; x++) {
    if (bayer(x, top) < 0.12) px(ctx, '#5f8f3e', x, top - 4, 1, 2);
    if (rand.chance(0.02)) px(ctx, rand.pick([MAGIC.pink, MAGIC.cyan, MAGIC.gold]), x, top - 7, 1, 1);
  }
}

export function paintStream(ctx, x0, x1, waterY, bottom) {
  for (let y = waterY; y < bottom; y++) {
    const d = (y - waterY) / (bottom - waterY);
    px(ctx, mix('#6a8ae0', '#2a2a6a', d), x0, y, x1 - x0, 1);
  }
  px(ctx, '#bfe4ff', x0, waterY, x1 - x0, 1);
  // banks
  for (const [bx, dir] of [[x0, 1], [x1, -1]]) {
    for (let y = G - 6; y < waterY + 30; y++) {
      const w = 6 + Math.round(Math.sin(y * 0.4) * 2);
      px(ctx, COLORS.rock.mid, dir > 0 ? bx : bx - w, y, w, 1);
    }
  }
  for (const lx of [x0 + 24, x0 + 80]) {
    ellipse(ctx, '#5b7a36', lx, waterY + 6, 6, 2);
    px(ctx, MAGIC.pink, lx, waterY + 4, 2, 2);
  }
}

export function paintWoodBridge(ctx, x0, x1, deckY) {
  const W = COLORS.wood;
  // rope posts + planks
  for (let x = x0; x < x1; x += 7) {
    px(ctx, W.dark, x, deckY - 1, 7, 7);
    px(ctx, (x / 7) % 2 ? W.mid : W.base, x, deckY, 6, 5);
    px(ctx, W.light, x, deckY, 6, 1);
  }
  for (const pxx of [x0, x0 + 46, x0 + 92, x1 - 4]) {
    px(ctx, W.dark, pxx, deckY - 20, 4, 30);
    px(ctx, W.light, pxx + 2, deckY - 20, 1, 30);
  }
  for (let i = 0; i <= x1 - x0; i++) {
    const t = i / (x1 - x0);
    px(ctx, '#d8bfb4', x0 + i, deckY - 18 + Math.round(Math.sin(t * Math.PI * 3) ** 2 * 4), 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Transition props: industry turning into forest
// ---------------------------------------------------------------------------

export function paintRubble(ctx, rand, x, gy) {
  const C = IND.concrete;
  for (let i = 0; i < 4; i++) {
    const bx = x + i * 13 - 20, bh = rand.int(5, 10);
    px(ctx, C.dark, bx, gy - bh, 12, bh);
    px(ctx, C.base, bx + 1, gy - bh, 10, bh - 2);
    px(ctx, C.light, bx + 1, gy - bh, 10, 1);
    px(ctx, COLORS.grass.base, bx + 2, gy - bh - 2, rand.int(3, 7), 2);
  }
}

// A rusty factory pipe that has sprouted into a living branch.
export function paintPipeBranch(ctx, rand, x, gy, h) {
  const S = IND.steel;
  px(ctx, mix(S.dark, IND.rust.base, 0.4), x - 3, gy - h, 7, h);
  px(ctx, mix(S.mid, IND.rust.light, 0.4), x + 1, gy - h, 2, h);
  for (let y = gy - h + 10; y < gy; y += 24) px(ctx, S.deep, x - 4, y, 9, 3);
  // bark creeping up the pipe
  for (let y = gy - h; y < gy; y++) {
    const k = (gy - y) / h;
    if (rand() < k * 0.9) px(ctx, COLORS.bark.base, x - 3, y, rand.int(2, 5), 1);
  }
  // the top bursts into branches and leaves
  const top = gy - h;
  line(ctx, COLORS.bark.base, x, top, x - 22, top - 18);
  line(ctx, COLORS.bark.base, x + 1, top, x + 18, top - 24);
  line(ctx, COLORS.bark.base, x, top + 2, x + 6, top - 30);
  for (const [cx, cy, r] of [[x - 24, top - 22, 11], [x + 18, top - 28, 12], [x + 4, top - 36, 10]]) {
    disc(ctx, COLORS.leaf.dark, cx, cy, r);
    disc(ctx, COLORS.leaf.mid, cx + 2, cy - 2, r - 3);
    disc(ctx, COLORS.leaf.light, cx + 4, cy - 4, Math.max(2, r - 7));
    px(ctx, MAGIC.pink, cx - 2, cy + 2, 2, 2);
  }
}

export function paintOvergrownLamp(ctx, rand, x, gy) {
  const S = IND.steel;
  px(ctx, S.dark, x - 1, gy - 84, 4, 84);
  for (let i = 0; i < 16; i++) px(ctx, S.dark, x + i, gy - 86 - Math.round(Math.sin((i / 16) * Math.PI / 2) * 4), 2, 2);
  px(ctx, S.deep, x + 10, gy - 84, 14, 4);
  px(ctx, '#3a3a50', x + 11, gy - 80, 12, 2);   // the old bulb is dark now
  // vines wrapping the post, a few flowers
  for (let y = gy - 86; y < gy; y++) {
    const off = Math.round(Math.sin(y * 0.35) * 3);
    px(ctx, COLORS.leaf.mid, x + off, y, 2, 1);
    if (y % 9 === 0) px(ctx, COLORS.leaf.light, x + off - 2, y, 3, 2);
    if (y % 23 === 0) px(ctx, MAGIC.pink, x + off + 2, y, 2, 2);
  }
  for (let i = 0; i < 20; i++) px(ctx, COLORS.leaf.dark, x + 10 + rand.int(0, 14), gy - 82 + rand.int(0, 12), 1, rand.int(2, 6));
}

export function paintMushrooms(ctx, rand, x, gy) {
  for (let i = 0; i < 5; i++) {
    const mx = x + i * 6 - 12 + rand.int(-1, 1), h = rand.int(4, 10);
    const c = rand.pick([MAGIC.cyan, MAGIC.violet, MAGIC.pink]);
    px(ctx, '#e8e0d8', mx, gy - h, 2, h);
    ellipse(ctx, mix(c, '#2a1a3a', 0.35), mx + 1, gy - h, 4, 2);
    ellipse(ctx, c, mx + 1, gy - h - 1, 3, 1);
    px(ctx, '#ffffff', mx, gy - h - 1, 1, 1);
  }
}

export function paintCrystals(ctx, x, gy) {
  for (const [dx, h, c] of [[-8, 14, MAGIC.violet], [0, 22, MAGIC.cyan], [7, 12, MAGIC.pink]]) {
    for (let j = 0; j < h; j++) {
      const w = Math.max(1, Math.round((1 - j / h) * 4) + (j < 3 ? 1 : 0));
      px(ctx, mix(c, '#2a1a3a', 0.25), x + dx - w, gy - j, w * 2, 1);
      px(ctx, '#ffffff', x + dx, gy - j, 1, 1);
    }
  }
}

export function paintFerns(ctx, rand, x, gy, w) {
  for (let i = 0; i < w / 10; i++) {
    const fx = x + rand.range(0, w), h = rand.int(10, 20);
    for (let j = 0; j < h; j += 2) {
      const len = Math.round((1 - j / h) * 7);
      px(ctx, COLORS.leaf.mid, fx - len, gy - j, len, 1);
      px(ctx, COLORS.leaf.dark, fx, gy - j, len, 1);
    }
    px(ctx, COLORS.leaf.dark, fx, gy - h, 1, h);
  }
}

export function paintBigForestTree(ctx, rand, x, gy, opts) {
  paintTree(ctx, rand, x, gy, opts);
  // a lantern or a glowing hollow makes each tree feel inhabited
  if (rand.chance(0.6)) {
    const lx = x + rand.int(-14, 14), ly = gy - opts.h * 0.45;
    ellipse(ctx, '#2a1a24', lx, ly, 3, 5);
    ellipse(ctx, MAGIC.gold, lx, ly + 1, 2, 3);
  }
}

export function paintQuestionSign(ctx, x, gy) {
  const W = COLORS.wood;
  for (const pxx of [x - 56, x + 51]) {
    px(ctx, W.dark, pxx, gy - 72, 5, 72);
    px(ctx, W.light, pxx + 3, gy - 72, 1, 72);
  }
  const bx = x - 66, by = gy - 96, bw = 132, bh = 38;
  px(ctx, '#2b1a18', bx - 1, by - 1, bw + 2, bh + 2);
  px(ctx, W.mid, bx, by, bw, bh);
  for (let yy = by + 6; yy < by + bh; yy += 7) px(ctx, W.base, bx, yy, bw, 1);
  px(ctx, W.light, bx, by, bw, 1);
  pixelText(ctx, 'EVERYTHING STARTS', x, by + 6, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
  pixelText(ctx, 'WITH A QUESTION.', x, by + 18, { size: 8, color: MAGIC.gold, align: 'center', shadow: '#3a2228' });
  // a big question mark carved in the roof board + lantern
  px(ctx, '#2b1a18', x - 14, by - 14, 28, 13);
  px(ctx, W.light, x - 13, by - 13, 26, 11);
  pixelText(ctx, '?', x, by - 16, { size: 8, color: '#8c3b3b', align: 'center' });
  px(ctx, '#2b1c22', x + 2, gy - 72, 1, 4);
  px(ctx, '#3a2a2a', x - 2, gy - 70, 7, 7);
  px(ctx, COLORS.glow.warm, x - 1, gy - 69, 5, 5);
  // vines
  for (let i = 0; i < bw; i += 3) px(ctx, COLORS.leaf.mid, bx + i, by + bh + Math.round(Math.sin(i) * 2), 2, 2 + (i % 5));
}

// ---------------------------------------------------------------------------
// The learning station
// ---------------------------------------------------------------------------

export function paintStation(ctx, rand, x, gy) {
  const W = COLORS.wood;
  // a little roof between two trunks
  for (const tx of [x - 82, x + 78]) {
    px(ctx, COLORS.bark.dark, tx - 5, gy - 140, 12, 140);
    px(ctx, COLORS.bark.base, tx - 3, gy - 140, 8, 140);
    px(ctx, COLORS.bark.light, tx + 3, gy - 140, 2, 140);
  }
  for (let i = 0; i < 12; i++) {
    px(ctx, i < 2 ? '#c06a58' : i % 2 ? '#8a4446' : '#7a3a3e', x - 96 + i, gy - 150 + i, 192 - i * 2, 1);
  }
  px(ctx, '#5c2a33', x - 96, gy - 138, 192, 3);
  // hanging lanterns
  for (const lx of [x - 60, x + 66]) {
    line(ctx, '#2b1c22', lx, gy - 136, lx, gy - 100);
    px(ctx, '#3a2a2a', lx - 4, gy - 100, 9, 10);
    px(ctx, COLORS.glow.warm, lx - 3, gy - 99, 7, 8);
    px(ctx, COLORS.glow.core, lx - 1, gy - 98, 3, 5);
  }
  // pinned design sketches on a board (wireframes, user flows, journey maps)
  px(ctx, '#2b1a18', x - 74, gy - 128, 58, 46);
  px(ctx, '#a07850', x - 73, gy - 127, 56, 44);
  const sketch = (sx, sy, kind) => {
    px(ctx, MAGIC.page, sx, sy, 16, 18);
    px(ctx, '#c0392b', sx + 7, sy - 1, 2, 2);
    const L = '#6a6a8a';
    if (kind === 0) { px(ctx, L, sx + 2, sy + 3, 12, 3); px(ctx, L, sx + 2, sy + 8, 5, 6); px(ctx, L, sx + 9, sy + 8, 5, 2); px(ctx, L, sx + 9, sy + 12, 5, 2); }
    if (kind === 1) { disc(ctx, L, sx + 4, sy + 5, 2); disc(ctx, L, sx + 12, sy + 9, 2); disc(ctx, L, sx + 5, sy + 14, 2); line(ctx, L, sx + 5, sy + 6, sx + 11, sy + 9); line(ctx, L, sx + 11, sy + 10, sx + 6, sy + 13); }
    if (kind === 2) { for (let k = 0; k < 4; k++) px(ctx, L, sx + 2 + k * 3, sy + 14 - k * 3, 2, 2 + k * 3); }
    if (kind === 3) { px(ctx, L, sx + 3, sy + 2, 10, 14); px(ctx, MAGIC.page, sx + 4, sy + 3, 8, 10); px(ctx, L, sx + 6, sy + 14, 4, 1); }
  };
  sketch(x - 70, gy - 124, 0);
  sketch(x - 52, gy - 120, 1);
  sketch(x - 34, gy - 125, 3);
  sketch(x - 62, gy - 103, 2);
  // desk
  px(ctx, W.dark, x - 46, gy - 34, 104, 6);
  px(ctx, W.light, x - 46, gy - 34, 104, 2);
  px(ctx, W.dark, x - 42, gy - 28, 5, 28);
  px(ctx, W.dark, x + 50, gy - 28, 5, 28);
  px(ctx, W.base, x - 40, gy - 16, 92, 3);
  // vintage computer (the screen content is drawn here; it glows via the lighting pass)
  const cx = x + 6, cy = gy - 100;
  px(ctx, '#1d1222', cx - 43, cy - 1, 86, 64);
  px(ctx, '#d8cbb8', cx - 42, cy, 84, 62);
  px(ctx, '#efe4d2', cx - 42, cy, 84, 2);
  px(ctx, '#b8a894', cx - 42, cy + 56, 84, 6);
  px(ctx, '#1a1830', cx - 38, cy + 4, 76, 50);
  // course interface on the screen
  px(ctx, '#f4f6fb', cx - 37, cy + 5, 74, 48);
  px(ctx, '#2a6fdb', cx - 37, cy + 5, 74, 11);
  pixelText(ctx, 'COURSERA', cx - 34, cy + 6, { size: 8, color: '#ffffff' });
  px(ctx, '#e8eef9', cx - 35, cy + 18, 70, 20);
  pixelText(ctx, 'GOOGLE UX', cx - 33, cy + 18, { size: 8, color: '#1d2a44' });
  pixelText(ctx, 'DESIGN', cx - 33, cy + 27, { size: 8, color: '#1d2a44' });
  for (let i = 0; i < 4; i++) px(ctx, ['#ea4335', '#fbbc05', '#34a853', '#4285f4'][i], cx + 20 + i * 3, cy + 30, 2, 2);
  for (let i = 0; i < 3; i++) {
    px(ctx, '#d0d8e8', cx - 35, cy + 41 + i * 4, 46, 2);
    px(ctx, '#2a6fdb', cx - 35, cy + 41 + i * 4, 8 + i * 10, 2);
  }
  px(ctx, '#2a6fdb', cx + 16, cy + 41, 18, 9);
  px(ctx, '#ffffff', cx + 19, cy + 45, 12, 1);
  px(ctx, '#d8cbb8', cx - 10, cy + 62, 20, 4);
  px(ctx, '#b8a894', cx - 16, cy + 66, 32, 2);
  // keyboard, mug, notebooks, stacked books, desk lamp
  px(ctx, '#1d1222', cx - 18, gy - 38, 34, 4);
  px(ctx, '#d8cbb8', cx - 17, gy - 38, 32, 3);
  px(ctx, '#e8e0d8', x + 44, gy - 42, 7, 8);
  px(ctx, '#b07a52', x + 45, gy - 42, 5, 2);
  for (let i = 0; i < 4; i++) {
    const c = ['#8c3b3b', '#3a6eb0', '#e3b13c', '#5b7a36'][i];
    px(ctx, c, x - 44, gy - 38 - i * 4, 20 - (i % 2) * 3, 4);
    px(ctx, mix(c, '#ffffff', 0.3), x - 44, gy - 38 - i * 4, 20 - (i % 2) * 3, 1);
  }
  px(ctx, MAGIC.page, x + 22, gy - 37, 16, 3);
  px(ctx, '#6a6a8a', x + 24, gy - 36, 10, 1);
  // chair
  px(ctx, W.dark, x - 20, gy - 54, 4, 54);
  px(ctx, W.mid, x - 22, gy - 24, 16, 4);
}

// ---------------------------------------------------------------------------
// Industry islands: each is pre-rendered to its own small canvas
// ---------------------------------------------------------------------------

function island(ctx, rand, w) {
  // floating rock with a grass top, drawn at (10, 70) inside the canvas
  paintFloatingIsland(ctx, 10, 70, w, rand, { tone: 'near', waterfall: false });
}

const scenes = {
  healthcare(ctx, rand) {
    // little hospital with a cross + a heartbeat dashboard
    px(ctx, '#1d1222', 24, 34, 46, 36);
    px(ctx, '#f4f0ea', 25, 35, 44, 35);
    px(ctx, '#d8cfc4', 25, 35, 44, 2);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) px(ctx, '#8ec8f0', 29 + c * 10, 42 + r * 10, 6, 6);
    px(ctx, '#6a6a7a', 43, 60, 8, 10);
    px(ctx, '#e04848', 43, 22, 8, 16);
    px(ctx, '#e04848', 39, 26, 16, 8);
    px(ctx, '#ffffff', 46, 24, 2, 12);
    px(ctx, '#1d1222', 74, 44, 26, 20);
    px(ctx, '#0f2a2a', 75, 45, 24, 18);
    const ys = [8, 8, 8, 4, 12, 2, 8, 8, 8, 8, 8, 6, 10, 8];
    ys.forEach((y, i) => px(ctx, '#5ef0a0', 76 + i * 1.6, 46 + y, 2, 1));
    px(ctx, '#3a2a35', 86, 64, 2, 6);
  },
  education(ctx, rand) {
    // schoolhouse with a bell tower, books, a lesson card screen
    px(ctx, '#1d1222', 22, 40, 50, 30);
    px(ctx, '#c0573f', 23, 41, 48, 29);
    for (let i = 0; i < 10; i++) px(ctx, '#7a3a3e', 22 + i, 40 - i, 52 - i * 2, 1);
    px(ctx, '#e8dcc0', 41, 20, 12, 12);
    px(ctx, '#7a3a3e', 39, 16, 16, 4);
    disc(ctx, '#f5c35b', 47, 27, 2);
    for (const wx of [27, 59]) px(ctx, '#ffe2a0', wx, 48, 8, 8);
    px(ctx, '#5a3828', 43, 58, 8, 12);
    for (let i = 0; i < 4; i++) px(ctx, ['#3a6eb0', '#e3b13c', '#8c3b3b', '#5b7a36'][i], 78, 66 - i * 4, 18, 4);
    px(ctx, '#1d1222', 76, 34, 24, 18);
    px(ctx, '#f6ead2', 77, 35, 22, 16);
    px(ctx, '#3a6eb0', 79, 37, 10, 3);
    px(ctx, '#c8b898', 79, 42, 18, 2);
    px(ctx, '#c8b898', 79, 46, 14, 2);
  },
  finance(ctx, rand) {
    // bank with columns + rising chart + coins
    for (let i = 0; i < 10; i++) px(ctx, '#d8d0c4', 22 + i * 2, 30 - i, 52 - i * 4, 1);
    px(ctx, '#e8e0d4', 22, 30, 52, 4);
    for (let c = 0; c < 5; c++) {
      px(ctx, '#f4f0ea', 25 + c * 10, 34, 5, 28);
      px(ctx, '#c8beb0', 29 + c * 10, 34, 1, 28);
    }
    px(ctx, '#c8beb0', 20, 62, 56, 8);
    px(ctx, '#e8e0d4', 20, 62, 56, 2);
    pixelText(ctx, '$', 48, 18, { size: 8, color: '#8a6a2a', align: 'center' });
    // chart
    px(ctx, '#1d1222', 78, 36, 24, 26);
    px(ctx, '#14202a', 79, 37, 22, 24);
    [6, 10, 8, 14, 18].forEach((h, i) => px(ctx, '#5ef0a0', 81 + i * 4, 59 - h, 3, h));
    line(ctx, '#ffd98a', 81, 52, 98, 40);
    for (const [cx, cy] of [[84, 66], [92, 64], [98, 67]]) { disc(ctx, '#c08a2a', cx, cy, 3); disc(ctx, '#f5c35b', cx, cy - 1, 2); }
  },
  ecommerce(ctx, rand) {
    // market stall + bags + product cards
    px(ctx, '#5a3828', 24, 40, 3, 30);
    px(ctx, '#5a3828', 68, 40, 3, 30);
    for (let i = 0; i < 48; i += 8) { px(ctx, '#e06a8a', 22 + i, 32, 4, 10); px(ctx, '#f6e6d0', 26 + i, 32, 4, 10); }
    px(ctx, '#94603c', 24, 56, 47, 6);
    for (let i = 0; i < 4; i++) px(ctx, ['#e3b13c', '#8c3b3b', '#5b7a36', '#3a6eb0'][i], 28 + i * 10, 50, 7, 6);
    // shopping bags
    for (const [bx, c] of [[78, '#ff9ad5'], [90, '#8eeaff']]) {
      px(ctx, '#1d1222', bx - 1, 53, 11, 15);
      px(ctx, c, bx, 54, 9, 13);
      px(ctx, '#1d1222', bx + 2, 49, 1, 5);
      px(ctx, '#1d1222', bx + 6, 49, 1, 5);
      px(ctx, '#1d1222', bx + 2, 49, 5, 1);
    }
    // product card floating
    px(ctx, '#1d1222', 76, 26, 22, 20);
    px(ctx, '#ffffff', 77, 27, 20, 18);
    px(ctx, '#f2b3c8', 79, 29, 16, 8);
    px(ctx, '#c8c8d8', 79, 39, 12, 2);
    px(ctx, '#3aa36b', 79, 42, 8, 2);
  },
  transport(ctx, rand) {
    // little station + train + a direction sign
    px(ctx, '#1d1222', 20, 40, 34, 24);
    px(ctx, '#8a6a9a', 21, 41, 32, 23);
    for (let i = 0; i < 8; i++) px(ctx, '#5a4a6a', 18 + i, 40 - i, 38 - i * 2, 1);
    pixelText(ctx, 'STN', 37, 44, { size: 8, color: '#f6e6d0', align: 'center' });
    // tracks
    px(ctx, '#5a5068', 14, 68, 96, 2);
    for (let x = 14; x < 110; x += 6) px(ctx, '#7a5a40', x, 68, 3, 3);
    // train
    px(ctx, '#1d1222', 56, 48, 50, 20);
    px(ctx, '#3a8ac8', 57, 49, 48, 18);
    px(ctx, '#e3b13c', 57, 60, 48, 2);
    for (let i = 0; i < 4; i++) px(ctx, '#d6f0ff', 60 + i * 11, 52, 7, 5);
    disc(ctx, '#2a2228', 64, 68, 3);
    disc(ctx, '#2a2228', 96, 68, 3);
    // sign
    px(ctx, '#3a2a35', 18, 18, 2, 22);
    px(ctx, '#3aa36b', 10, 16, 20, 8);
    for (let i = 0; i < 4; i++) px(ctx, '#3aa36b', 30 + i, 16 + i, 1, 8 - i * 2);
    px(ctx, '#ffffff', 13, 19, 12, 2);
  },
  technology(ctx, rand) {
    // studio with screens and floating abstract UI blocks
    px(ctx, '#1d1222', 22, 34, 50, 36);
    px(ctx, '#3a3346', 23, 35, 48, 35);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      px(ctx, ['#8eeaff', '#b79cff', '#ff9ad5'][(r + c) % 3], 27 + c * 15, 40 + r * 12, 11, 8);
    }
    px(ctx, '#5a5068', 46, 18, 2, 16);
    disc(ctx, '#ff9ad5', 47, 17, 2);
    // UI blocks: a card, a toggle, a slider
    px(ctx, '#1d1222', 78, 26, 24, 16);
    px(ctx, '#ffffff', 79, 27, 22, 14);
    px(ctx, '#b79cff', 81, 29, 8, 8);
    px(ctx, '#c8c8d8', 91, 30, 8, 2);
    px(ctx, '#c8c8d8', 91, 34, 6, 2);
    px(ctx, '#1d1222', 80, 48, 16, 8);
    px(ctx, '#5ef0a0', 81, 49, 14, 6);
    disc(ctx, '#ffffff', 91, 52, 2);
    px(ctx, '#8eeaff', 78, 62, 22, 2);
    disc(ctx, '#ffffff', 90, 63, 3);
  },
};

export function makeIslandCanvas(id, name, rand) {
  const w = 96;
  const [c, ctx] = makeCanvas(w + 20, 150);
  island(ctx, rand, w);
  scenes[id](ctx, rand);
  // grass tufts over the base of the little scene
  for (let x = 12; x < w + 8; x += 3) px(ctx, x % 2 ? COLORS.grass.top : COLORS.grass.light, x, 68, 1, 2);
  // name banner hanging under the island
  const label = name.toUpperCase();
  const bw = Math.max(54, label.length * 6 + 10);
  const bx = Math.round((w + 20 - bw) / 2), by = 112;
  line(ctx, '#d8bfb4', bx + 6, by, bx + 10, 100);
  line(ctx, '#d8bfb4', bx + bw - 6, by, bx + bw - 10, 100);
  px(ctx, '#1d1222', bx - 1, by - 1, bw + 2, 13);
  px(ctx, '#2a1d3a', bx, by, bw, 11);
  px(ctx, MAGIC.violet, bx, by, bw, 1);
  pixelText(ctx, label, (w + 20) / 2, by, { size: 8, color: MAGIC.gold, align: 'center' });
  return c;
}

// ---------------------------------------------------------------------------
// Hill + studio
// ---------------------------------------------------------------------------

export function paintHillStones(ctx, x, gy) {
  // a ring of standing stones with runes: the centre of the world of possibilities
  for (const dx of [-96, -60, 60, 96]) {
    const h = Math.abs(dx) > 70 ? 26 : 34;
    px(ctx, COLORS.stone.dark, x + dx - 6, gy - h, 12, h);
    px(ctx, COLORS.stone.base, x + dx - 5, gy - h, 10, h - 1);
    px(ctx, COLORS.stone.light, x + dx - 5, gy - h, 10, 2);
    px(ctx, MAGIC.cyan, x + dx - 1, gy - h + 8, 2, 5);
  }
  ellipse(ctx, '#3a2a5a', x, gy - 1, 34, 3);
  ellipse(ctx, '#6a50c8', x, gy - 2, 28, 2);
}

export function paintStudioSign(ctx, x, gy) {
  const bw = 200, bh = 56, bx = x - bw / 2, by = gy - 158;
  for (const pxx of [bx + 20, bx + bw - 24]) {
    px(ctx, COLORS.wood.dark, pxx, by + bh, 5, gy - by - bh);
    px(ctx, COLORS.wood.light, pxx + 3, by + bh, 1, gy - by - bh);
  }
  px(ctx, '#1d1222', bx - 3, by - 3, bw + 6, bh + 6);
  px(ctx, '#2a1d3a', bx, by, bw, bh);
  for (const [c, o] of [['#c86a9a', 0], [MAGIC.pink, 2]]) {
    px(ctx, c, bx + 3 + o, by + 3 + o, bw - 6 - o * 2, 1);
    px(ctx, c, bx + 3 + o, by + bh - 4 - o, bw - 6 - o * 2, 1);
    px(ctx, c, bx + 3 + o, by + 3 + o, 1, bh - 6 - o * 2);
    px(ctx, c, bx + bw - 4 - o, by + 3 + o, 1, bh - 6 - o * 2);
  }
  pixelText(ctx, 'THE FIRST WORKPLACE', x, by + 10, { size: 8, color: MAGIC.gold, align: 'center', shadow: '#5a3a2a' });
  pixelText(ctx, 'TIME TO TURN CURIOSITY', x, by + 26, { size: 8, color: MAGIC.cyan, align: 'center', shadow: '#2a4a7a' });
  pixelText(ctx, 'INTO PRACTICE.', x, by + 36, { size: 8, color: MAGIC.cyan, align: 'center', shadow: '#2a4a7a' });
}

export function paintStudio(ctx, rand, x0, gy) {
  // a cozy creative workspace that also feels like a game location
  const W = COLORS.wood;
  const w = 180, h = 104, top = gy - h;
  // stone base + timber walls
  for (let y = top; y < gy; y++) px(ctx, ((y - top) / 6 | 0) % 2 ? W.base : W.mid, x0, y, w, 1);
  for (let x = x0; x < x0 + w; x += 9) {
    px(ctx, COLORS.stone.mid, x, gy - 10, 8, 10);
    px(ctx, COLORS.stone.light, x, gy - 10, 8, 1);
  }
  // big glass front with warm light and silhouettes of desks / screens
  px(ctx, '#2b1a18', x0 + 14, top + 26, 70, 52);
  px(ctx, '#ffd98a', x0 + 16, top + 28, 66, 48);
  px(ctx, '#f5b060', x0 + 16, top + 60, 66, 16);
  for (let c = 1; c < 3; c++) px(ctx, '#2b1a18', x0 + 16 + c * 22, top + 28, 2, 48);
  px(ctx, '#2b1a18', x0 + 16, top + 50, 66, 2);
  px(ctx, '#5a4a6a', x0 + 22, top + 62, 16, 10);
  px(ctx, MAGIC.cyan, x0 + 24, top + 64, 12, 6);
  px(ctx, '#5a4a6a', x0 + 48, top + 60, 20, 12);
  px(ctx, MAGIC.pink, x0 + 50, top + 62, 16, 8);
  // door
  const dx = x0 + 96;
  px(ctx, '#2b1a18', dx - 2, top + 40, 32, h - 40);
  px(ctx, '#6a3a26', dx, top + 42, 28, h - 42);
  px(ctx, '#ffd98a', dx + 6, top + 48, 16, 12);
  px(ctx, '#2b1a18', dx + 13, top + 48, 2, 12);
  disc(ctx, '#f5c35b', dx + 23, top + 74, 1);
  // round window with a pen-tool / bezier icon
  const rx = x0 + 150, ry = top + 40;
  disc(ctx, '#2b1a18', rx, ry, 16);
  disc(ctx, '#ffe2b0', rx, ry, 14);
  line(ctx, '#5a3a5a', rx - 9, ry + 6, rx + 9, ry - 6);
  px(ctx, '#ff9ad5', rx - 11, ry + 4, 4, 4);
  px(ctx, '#8eeaff', rx + 7, ry - 8, 4, 4);
  for (let a = 0; a < 12; a++) px(ctx, '#5a3a5a', rx - 8 + a * 1.4, ry + 4 - Math.sin((a / 12) * Math.PI) * 10, 1, 1);
  // roof with a skylight + colour-swatch bunting
  for (let i = 0; i < 30; i++) {
    const half = 20 + i * 3.6;
    px(ctx, i % 4 === 3 ? '#5a3a5a' : '#7a4a7a', x0 + w / 2 - half, top - 30 + i, half * 2, 1);
  }
  px(ctx, '#9a6a9a', x0 + w / 2 - 128, top - 1, 256, 2);
  px(ctx, '#8eeaff', x0 + 40, top - 18, 26, 8);
  px(ctx, '#d6f6ff', x0 + 42, top - 17, 10, 2);
  const swatches = ['#ff9ad5', '#ffd98a', '#8eeaff', '#9effc8', '#b79cff', '#f2a060'];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const bx = x0 - 10 + t * (w + 20), by = top + 6 + Math.round(Math.sin(t * Math.PI) * 10);
    px(ctx, swatches[i % 6], bx - 3, by, 6, 7);
    for (let k = 0; k < 3; k++) px(ctx, swatches[i % 6], bx - 2 + k, by + 7, 1, 2 - Math.abs(k - 1));
  }
  // chimney + plant pots + an easel outside
  px(ctx, '#5a3a5a', x0 + 132, top - 44, 12, 22);
  px(ctx, '#3a2a35', x0 + 130, top - 46, 16, 4);
  for (const ppx of [x0 + 8, x0 + 132]) {
    px(ctx, '#9a4e3a', ppx, gy - 14, 12, 12);
    disc(ctx, COLORS.leaf.mid, ppx + 6, gy - 20, 7);
    px(ctx, MAGIC.pink, ppx + 4, gy - 24, 2, 2);
  }
  line(ctx, W.dark, x0 + 196, gy, x0 + 204, gy - 44);
  line(ctx, W.dark, x0 + 214, gy, x0 + 206, gy - 44);
  px(ctx, '#f6ead2', x0 + 194, gy - 42, 22, 26);
  px(ctx, MAGIC.violet, x0 + 197, gy - 38, 8, 8);
  px(ctx, MAGIC.cyan, x0 + 205, gy - 30, 8, 8);
  px(ctx, MAGIC.pink, x0 + 199, gy - 26, 6, 6);
}
