// Stage 6 and 7 painters: the Mentor's Camp (an evening forest), the school
// classroom memory, and the Great Overlook at sunrise.

import { px, dither, disc, ellipse, line, mix, pixelText, bayer } from './pixel.js';
import { COLORS, paintTerrainBlock, paintFloatingIsland } from './art.js';
import { paintForestGround, paintStream, MAGIC } from './forest.js';
import { makeCanvas } from '../engine/assets.js';
import { WORLD } from '../config.js';

const G = WORLD.ground;
const INK = '#1d1222';
const W = COLORS.wood;

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

export function paintCampGround(ctx, rand, x0, x1, top, bottom) {
  paintForestGround(ctx, rand, x0, x1, top, bottom);
  // a worn dirt footpath through the moss
  for (let x = x0; x < x1; x += 3) {
    if (bayer(x, top) < 0.55) px(ctx, '#8a6a4a', x, top - 5, 3, 3);
    if (bayer(x, top + 1) < 0.25) px(ctx, '#a8845a', x, top - 5, 2, 1);
  }
}

export function paintOverlookGround(ctx, rand, x0, x1, top, bottom) {
  paintTerrainBlock(ctx, rand, x0, x1, top, bottom);
}

export function paintClassroomFloor(ctx, rand, x0, x1, top, bottom) {
  for (let y = top; y < bottom; y++) px(ctx, (y - top) < 60 ? '#5a4038' : '#3a2828', x0, y, x1 - x0, 1);
  // terrazzo-style school floor
  px(ctx, '#b8a88c', x0, top - 8, x1 - x0, 14);
  px(ctx, '#d4c4a4', x0, top - 8, x1 - x0, 2);
  for (let x = x0; x < x1; x += 24) px(ctx, '#9a8a70', x, top - 8, 1, 14);
  for (let x = x0; x < x1; x++) if (bayer(x, top) < 0.15) px(ctx, rand.pick(['#8a7a60', '#e4d8bc', '#a89878']), x, top - 4 + (x % 5), 1, 1);
  px(ctx, '#3a2828', x0, top + 6, x1 - x0, 2);
}

// ---------------------------------------------------------------------------
// The Mentor's Camp
// ---------------------------------------------------------------------------

export function paintCampArrival(ctx, x, gy) {
  // where the campus path comes out: two lantern posts and a little rope
  for (const dx of [-30, 30]) {
    px(ctx, W.dark, x + dx - 2, gy - 50, 4, 50);
    px(ctx, '#3a2a2a', x + dx - 4, gy - 58, 9, 9);
    px(ctx, COLORS.glow.warm, x + dx - 3, gy - 57, 7, 7);
  }
  for (let i = 0; i <= 60; i++) px(ctx, '#d8bfb4', x - 30 + i, gy - 44 + Math.round(Math.sin((i / 60) * Math.PI) * 6), 1, 1);
}

export function paintCampLantern(ctx, x, gy) {
  px(ctx, W.dark, x - 1, gy - 56, 3, 56);
  px(ctx, W.dark, x - 1, gy - 56, 12, 2);
  line(ctx, '#2b1c22', x + 9, gy - 54, x + 9, gy - 48);
  px(ctx, '#3a2a2a', x + 5, gy - 48, 9, 11);
  px(ctx, COLORS.glow.warm, x + 6, gy - 47, 7, 9);
  px(ctx, COLORS.glow.core, x + 8, gy - 45, 3, 5);
}

export function paintCampStream(ctx, rand, x0, x1, gy, bottom) {
  paintStream(ctx, x0, x1, gy + 24, bottom);
  // a little wooden bridge
  for (let x = x0 - 10; x < x1 + 10; x += 7) {
    px(ctx, W.dark, x, gy - 1, 7, 7);
    px(ctx, (x / 7) % 2 ? W.mid : W.base, x, gy, 6, 5);
    px(ctx, W.light, x, gy, 6, 1);
  }
  for (const pxx of [x0 - 10, x0 + 46, x1 + 6]) {
    px(ctx, W.dark, pxx, gy - 20, 4, 30);
    px(ctx, W.light, pxx + 2, gy - 20, 1, 30);
  }
  for (let i = 0; i <= x1 - x0 + 20; i++) px(ctx, '#d8bfb4', x0 - 10 + i, gy - 18 + Math.round(Math.sin((i / (x1 - x0 + 20)) * Math.PI * 2) ** 2 * 4), 1, 1);
}

export function paintMentorSign(ctx, x, gy) {
  for (const dx of [-50, 46]) { px(ctx, W.dark, x + dx, gy - 70, 5, 70); px(ctx, W.light, x + dx + 3, gy - 70, 1, 70); }
  px(ctx, '#2b1a18', x - 62, gy - 96, 124, 34);
  px(ctx, W.mid, x - 61, gy - 95, 122, 32);
  for (let yy = gy - 89; yy < gy - 63; yy += 7) px(ctx, W.base, x - 61, yy, 122, 1);
  px(ctx, W.light, x - 61, gy - 95, 122, 1);
  pixelText(ctx, "THE MENTOR'S CAMP", x, gy - 91, { size: 8, color: '#fbe9cf', align: 'center', shadow: '#3a2228' });
  pixelText(ctx, 'CHAPTER 01 · PART 06', x, gy - 79, { size: 8, color: COLORS.glow.warm, align: 'center', shadow: '#3a2228' });
  // a lantern hanging from the board, a few books stacked at the foot
  px(ctx, '#2b1c22', x, gy - 62, 1, 6);
  px(ctx, '#3a2a2a', x - 4, gy - 56, 9, 10);
  px(ctx, COLORS.glow.warm, x - 3, gy - 55, 7, 8);
  for (let k = 0; k < 4; k++) px(ctx, ['#8c3b3b', '#3a6eb0', '#e3b13c', '#5b7a36'][k], x + 54, gy - 4 - k * 4, 16 - k * 2, 4);
}

export function paintCabin(ctx, rand, x0, x1, gy) {
  // a cutaway wooden cabin: cosy, lantern-lit, full of books and sketchboards
  const top = gy - 176;
  for (let y = top; y < gy; y++) px(ctx, ((y - top) / 7 | 0) % 2 ? '#6a4430' : '#5e3c2a', x0, y, x1 - x0, 1);
  for (let x = x0; x < x1; x += 40) px(ctx, '#4a2e22', x, top, 2, 176);
  // log frame + roof
  for (const cx of [x0 - 10, x1 - 4]) {
    px(ctx, INK, cx - 1, top - 14, 16, 190);
    px(ctx, W.base, cx, top - 13, 14, 189);
    px(ctx, W.light, cx + 10, top - 13, 3, 189);
    for (let y = top; y < gy; y += 18) px(ctx, W.dark, cx, y, 14, 2);
  }
  for (let j = 0; j < 40; j++) {
    const half = 30 + j * ((x1 - x0) / 2 + 20 - 30) / 40;
    px(ctx, j % 5 === 0 ? '#4a2e22' : j % 2 ? '#7a4a30' : '#6a4028', (x0 + x1) / 2 - half, top - 54 + j, half * 2, 1);
  }
  px(ctx, '#3a2418', x0 - 24, top - 15, x1 - x0 + 48, 4);
  // round window with the dusk outside
  const wx = x0 + 70, wy = top + 40;
  disc(ctx, INK, wx, wy, 18);
  disc(ctx, '#5a3a78', wx, wy, 16);
  disc(ctx, '#b9659a', wx, wy + 6, 10);
  px(ctx, INK, wx - 16, wy, 32, 2);
  px(ctx, INK, wx, wy - 16, 2, 32);
  // bookshelves
  for (const sx of [x0 + 20, x1 - 70]) {
    px(ctx, W.dark, sx, top + 70, 52, 104);
    for (let r = 0; r < 4; r++) {
      const sy = top + 74 + r * 25;
      px(ctx, W.base, sx + 2, sy + 21, 48, 3);
      let bx = sx + 3;
      while (bx < sx + 46) {
        const bw = rand.int(3, 6), bh = rand.int(13, 19);
        const c = rand.pick(['#8c3b3b', '#3a6eb0', '#e3b13c', '#4fb3a8', '#7a5ab8', '#f6ead2']);
        px(ctx, c, bx, sy + 21 - bh, bw, bh);
        bx += bw + 1;
      }
    }
  }
  // sketchboards pinned to the wall
  for (const [sx, sy] of [[x0 + 120, top + 24], [x0 + 300, top + 30]]) {
    px(ctx, INK, sx - 1, sy - 1, 46, 36);
    px(ctx, '#c89a62', sx, sy, 44, 34);
    px(ctx, '#f6ead2', sx + 4, sy + 4, 16, 12);
    px(ctx, '#f6ead2', sx + 24, sy + 6, 16, 10);
    line(ctx, '#6a6a8a', sx + 6, sy + 22, sx + 38, sy + 28);
    px(ctx, '#ffe28a', sx + 6, sy + 24, 8, 7);
  }
  // the mentor's blackboard (its writing is animated)
  px(ctx, W.dark, x0 + 170, top + 60, 108, 66);
  px(ctx, '#2f4a3a', x0 + 173, top + 63, 102, 60);
  px(ctx, '#e8e0d8', x0 + 190, top + 126, 16, 3);
  // two stools, a low table with tea, a rug
  ellipse(ctx, '#8c3b3b', (x0 + x1) / 2, gy - 2, 90, 3);
  ellipse(ctx, '#b85a4a', (x0 + x1) / 2, gy - 2, 80, 2);
  px(ctx, W.dark, x0 + 150, gy - 22, 60, 5);
  px(ctx, W.light, x0 + 150, gy - 22, 60, 1);
  px(ctx, W.dark, x0 + 154, gy - 17, 3, 17);
  px(ctx, W.dark, x0 + 203, gy - 17, 3, 17);
  for (const cx of [x0 + 168, x0 + 188]) { px(ctx, '#e8e0d8', cx, gy - 29, 7, 7); px(ctx, '#b07a52', cx + 1, gy - 29, 5, 2); }
  // hanging lanterns
  for (const lx of [x0 + 120, x0 + 320]) {
    line(ctx, '#2b1c22', lx, top, lx, top + 22);
    px(ctx, '#3a2a2a', lx - 5, top + 22, 11, 12);
    px(ctx, COLORS.glow.warm, lx - 4, top + 23, 9, 10);
  }
  // a small campfire just outside
  const fx = x1 + 30;
  for (let i = 0; i < 5; i++) px(ctx, W.dark, fx - 12 + i * 5, gy - 4, 6, 4);
  ellipse(ctx, '#5a5050', fx, gy - 1, 16, 2);
}

export function paintNextChapterSign(ctx, x, gy) {
  for (const dx of [-54, 50]) { px(ctx, W.dark, x + dx, gy - 74, 5, 74); px(ctx, W.light, x + dx + 3, gy - 74, 1, 74); }
  px(ctx, '#2b1a18', x - 66, gy - 104, 132, 36);
  px(ctx, '#3a2418', x - 65, gy - 103, 130, 34);
  px(ctx, '#f5a24a', x - 65, gy - 103, 130, 1);
  pixelText(ctx, 'THE NEXT CHAPTER', x, gy - 100, { size: 8, color: '#ffe8a8', align: 'center', shadow: '#5a3a1a' });
  pixelText(ctx, 'UNDERSTANDING PROBLEMS', x, gy - 88, { size: 8, color: '#f6ead2', align: 'center', shadow: '#3a2a1a' });
  pixelText(ctx, 'WAS ONLY THE BEGINNING.', x, gy - 78, { size: 8, color: '#f6ead2', align: 'center', shadow: '#3a2a1a' });
}

// (Unused since UX Anudeep's own sprite was added; kept for reference.)
// A calm, symbolic mentor: a silhouette with a soft lantern rim light.
export function drawMentor(ctx, x, gy, t, { talking = false, writing = false } = {}) {
  x = Math.round(x); gy = Math.round(gy);
  const body = '#2a2036', rim = '#ffcf8a';
  const bob = Math.round(Math.sin(t * 1.5) * 0.6);
  // legs + long coat
  px(ctx, body, x - 4, gy - 18, 3, 18);
  px(ctx, body, x + 2, gy - 18, 3, 18);
  for (let j = 0; j < 34; j++) px(ctx, body, x - 8 + Math.round(j * 0.05), gy - 52 + j + bob, 16 - Math.round(j * 0.1), 1);
  // head + a hint of a scarf
  disc(ctx, body, x, gy - 60 + bob, 7);
  px(ctx, '#8c3b5a', x - 7, gy - 53 + bob, 15, 3);
  // the arm: holding chalk up to the board, or at rest
  if (writing) {
    const k = Math.sin(t * 6) * 2;
    line(ctx, body, x - 6, gy - 48 + bob, x - 18, gy - 64 + k);
    px(ctx, '#f6ead2', x - 20, gy - 66 + k, 2, 2);
  } else {
    px(ctx, body, x - 9, gy - 48 + bob, 3, 18);
    if (talking) px(ctx, body, x + 8, gy - 46 + bob + Math.round(Math.sin(t * 5) * 2), 3, 10);
  }
  // rim light from the lanterns
  px(ctx, rim, x + 5, gy - 64 + bob, 1, 8);
  px(ctx, rim, x + 7, gy - 50 + bob, 1, 20);
  px(ctx, rim, x + 4, gy - 18, 1, 14);
}

// The teacher in the memory: the same soft, faceless style.
export function drawTeacher(ctx, x, gy, t, writing) {
  x = Math.round(x); gy = Math.round(gy);
  const body = '#4a3a5a', rim = '#fff2c4';
  px(ctx, body, x - 4, gy - 16, 3, 16);
  px(ctx, body, x + 2, gy - 16, 3, 16);
  px(ctx, '#6a5a7a', x - 7, gy - 50, 14, 34);
  disc(ctx, body, x, gy - 58, 7);
  px(ctx, '#2a2036', x - 7, gy - 64, 14, 5);
  if (writing) {
    const k = Math.sin(t * 7) * 2;
    line(ctx, '#6a5a7a', x - 6, gy - 46, x - 18 + k, gy - 66 + k);
    px(ctx, '#ffffff', x - 20 + k, gy - 68 + k, 2, 2);
  } else {
    px(ctx, '#6a5a7a', x - 9, gy - 46, 3, 16);
  }
  px(ctx, rim, x - 8, gy - 62, 1, 8);
  px(ctx, rim, x - 8, gy - 48, 1, 26);
}

// ---------------------------------------------------------------------------
// The school classroom (the memory)
// ---------------------------------------------------------------------------

export function paintSchoolroom(ctx, rand, x0, x1, gy) {
  const ceil = gy - 236;
  px(ctx, '#2a2030', x0 - 30, ceil - 400, x1 - x0 + 60, 400);
  // pale green wall over a darker dado, soft morning light
  for (let y = ceil; y < gy; y++) px(ctx, y < gy - 70 ? mix('#c8d8b8', '#e8ecd0', (y - ceil) / 170) : '#7a9a78', x0 - 30, y, x1 - x0 + 60, 1);
  px(ctx, '#5a7a58', x0 - 30, gy - 72, x1 - x0 + 60, 3);
  px(ctx, '#e8e0c8', x0 - 30, ceil, x1 - x0 + 60, 6);
  // windows with morning sky
  for (const wx of [x0 + 60, x0 + 300, x0 + 580, x0 + 780]) {
    px(ctx, '#6a5040', wx - 4, ceil + 36, 88, 98);
    for (let y = 0; y < 90; y++) px(ctx, mix('#9ad0f0', '#fff0c8', y / 90), wx, ceil + 40 + y, 80, 1);
    disc(ctx, '#ffffff', wx + 20, ceil + 60, 8);
    disc(ctx, '#ffffff', wx + 30, ceil + 62, 6);
    px(ctx, '#6a5040', wx + 38, ceil + 40, 4, 90);
    px(ctx, '#6a5040', wx, ceil + 84, 80, 3);
    // a tree outside
    disc(ctx, '#7ab060', wx + 64, ceil + 120, 16);
  }
  // the clock
  const cx = x0 + 470;
  disc(ctx, INK, cx, ceil + 50, 15);
  disc(ctx, '#f6f0e0', cx, ceil + 50, 13);
  for (let i = 0; i < 12; i++) px(ctx, INK, cx + Math.cos(i * Math.PI / 6) * 11, ceil + 50 + Math.sin(i * Math.PI / 6) * 11, 1, 1);
  line(ctx, INK, cx, ceil + 50, cx, ceil + 41);
  line(ctx, INK, cx, ceil + 50, cx + 6, ceil + 53);
  // the big blackboard
  const bx = x0 + 400, by = gy - 186;
  px(ctx, '#6a5040', bx - 6, by - 6, 252, 120);
  px(ctx, '#2f4a3a', bx, by, 240, 108);
  dither(ctx, '#355242', bx, by, 240, 108, 0.12);
  px(ctx, '#8a7060', bx - 6, by + 112, 252, 5);
  px(ctx, '#ffffff', bx + 30, by + 110, 12, 3);
  px(ctx, '#f2b3c8', bx + 50, by + 110, 10, 3);
  // teacher's desk
  px(ctx, INK, x0 + 640, gy - 42, 90, 6);
  px(ctx, '#8a5a3c', x0 + 641, gy - 42, 88, 5);
  px(ctx, '#6a4430', x0 + 644, gy - 36, 82, 36);
  px(ctx, '#f6ead2', x0 + 650, gy - 48, 22, 6);
  px(ctx, '#3a6eb0', x0 + 690, gy - 50, 14, 8);
  // student desks with notebooks and school bags
  for (const dx of [80, 190, 300]) {
    const x = x0 + dx;
    px(ctx, INK, x - 26, gy - 36, 52, 5);
    px(ctx, '#a8784c', x - 25, gy - 36, 50, 4);
    px(ctx, '#6a4430', x - 22, gy - 31, 4, 31);
    px(ctx, '#6a4430', x + 18, gy - 31, 4, 31);
    px(ctx, '#ffffff', x - 12, gy - 39, 14, 3);
    px(ctx, '#7a9ad8', x + 4, gy - 39, 8, 3);
    px(ctx, rand.pick(['#c0473a', '#3a6eb0', '#e3b13c']), x + 24, gy - 18, 12, 14);
    px(ctx, INK, x + 26, gy - 22, 8, 2);
  }
  // charts on the wall: times tables, shapes
  px(ctx, INK, x0 + 150, ceil + 40, 60, 52);
  px(ctx, '#fff8e8', x0 + 151, ceil + 41, 58, 50);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) px(ctx, '#c0473a', x0 + 156 + c * 13, ceil + 46 + r * 9, 9, 5);
  px(ctx, INK, x0 + 690, ceil + 46, 50, 46);
  px(ctx, '#fff8e8', x0 + 691, ceil + 47, 48, 44);
  disc(ctx, '#3a6eb0', x0 + 705, ceil + 62, 7);
  px(ctx, '#e3b13c', x0 + 718, ceil + 56, 14, 14);
  for (let j = 0; j < 12; j++) px(ctx, '#5b7a36', x0 + 700 + j, ceil + 86 - j, 24 - j * 2, 1);
}

export function drawCeilingFan(ctx, x, y, t) {
  px(ctx, '#4a4a50', x - 1, y, 2, 18);
  disc(ctx, '#6a6a70', x, y + 18, 4);
  const a = t * 9;
  for (let i = 0; i < 3; i++) {
    const ang = a + (i * Math.PI * 2) / 3;
    const ex = Math.cos(ang) * 30, ey = Math.sin(ang) * 3;
    line(ctx, '#8a8a90', x, y + 18, x + ex, y + 18 + ey);
    line(ctx, '#8a8a90', x, y + 19, x + ex, y + 19 + ey);
  }
}

// ---------------------------------------------------------------------------
// The Great Overlook
// ---------------------------------------------------------------------------

export function paintOverlookRocks(ctx, x, gy) {
  for (const [dx, s] of [[0, 1.2], [40, 0.8], [-30, 0.9]]) {
    const rx = Math.round(18 * s), ry = Math.round(11 * s);
    ellipse(ctx, '#6b5160', x + dx, gy - ry + 2, rx, ry);
    ellipse(ctx, '#94767a', x + dx + 2, gy - ry, rx - 4, ry - 3);
    ellipse(ctx, '#d8bfb4', x + dx + 5, gy - ry - 3, Math.max(1, rx - 12), Math.max(1, ry - 7));
  }
}

export function paintPlatform(ctx, x0, x1, top, gy) {
  // a carved stone terrace with a balustrade looking out over everything
  for (let y = top; y < gy + 6; y++) px(ctx, y < top + 4 ? '#e8d8b8' : '#c8b494', x0, y, x1 - x0, 1);
  for (let x = x0; x < x1; x += 20) px(ctx, '#a8946e', x, top + 4, 1, gy - top);
  px(ctx, '#f6ead2', x0, top - 1, x1 - x0, 2);
  for (let x = x0 + 10; x < x1 - 10; x += 16) {
    px(ctx, '#d8c8a8', x, top - 22, 6, 22);
    px(ctx, '#f6ead2', x, top - 22, 2, 22);
  }
  px(ctx, '#e8d8b8', x0 + 4, top - 26, x1 - x0 - 8, 5);
  px(ctx, '#f6ead2', x0 + 4, top - 26, x1 - x0 - 8, 1);
  // braziers at the corners
  for (const bx of [x0 + 16, x1 - 16]) {
    px(ctx, '#5a4a50', bx - 6, top - 40, 12, 14);
    px(ctx, '#ffd98a', bx - 4, top - 44, 8, 5);
  }
}

export function paintDesignCanvas(ctx, x, top) {
  // an easel-like frame standing on the platform; its surface lights up later
  const w = 236, h = 100, bx = x - w / 2, by = top - 26 - h - 14;
  px(ctx, '#5a3a28', bx - 8, by - 8, w + 16, h + 16);
  px(ctx, '#8a5a3c', bx - 6, by - 6, w + 12, h + 12);
  px(ctx, '#e3b13c', bx - 6, by - 6, w + 12, 1);
  px(ctx, '#2a2036', bx, by, w, h);
  line(ctx, '#5a3a28', bx + 20, by + h + 8, bx + 6, top - 26);
  line(ctx, '#5a3a28', bx + w - 20, by + h + 8, bx + w - 6, top - 26);
  return { bx, by, w, h };
}

export function paintChapterGate(ctx, x, gy) {
  // a huge ancient stone gateway with golden edges
  const half = 64, h = 190;
  for (const side of [-1, 1]) {
    const px0 = x + side * half - (side < 0 ? 26 : 0);
    for (let y = gy - h; y < gy; y++) {
      px(ctx, '#8a7a8a', px0, y, 26, 1);
      px(ctx, '#a898a8', px0 + 2, y, 4, 1);
      px(ctx, '#6a5a6a', px0 + 22, y, 4, 1);
    }
    for (let y = gy - h + 10; y < gy; y += 18) px(ctx, '#6a5a6a', px0, y, 26, 2);
    px(ctx, '#f5c35b', side < 0 ? px0 + 24 : px0, gy - h, 2, h);
    // runes
    for (let k = 0; k < 4; k++) px(ctx, '#ffd98a', px0 + 10, gy - h + 30 + k * 36, 6, 6);
  }
  // lintel and capstone
  px(ctx, '#6a5a6a', x - half - 34, gy - h - 22, (half + 34) * 2, 24);
  px(ctx, '#8a7a8a', x - half - 32, gy - h - 20, (half + 32) * 2, 20);
  px(ctx, '#f5c35b', x - half - 32, gy - h - 20, (half + 32) * 2, 2);
  px(ctx, '#f5c35b', x - half - 32, gy - h + 0, (half + 32) * 2, 1);
  pixelText(ctx, 'CHAPTER 02', x, gy - h - 17, { size: 8, color: '#ffe8a8', align: 'center', shadow: '#3a2a3a' });
  for (let j = 0; j < 18; j++) px(ctx, '#6a5a6a', x - 18 + j, gy - h - 40 + j, 36 - j * 2, 1);
  disc(ctx, '#f5c35b', x, gy - h - 30, 4);
  // the path beyond, disappearing into the horizon
  for (let i = 0; i < 30; i++) px(ctx, '#d8c4a4', x - 30 + i, gy - 3 - Math.round(i * 0.2), 60 - i * 2, 1);
}

// ---------------------------------------------------------------------------
// The six memory islands floating above the overlook
// ---------------------------------------------------------------------------

const MINI = {
  workshop(ctx) {
    // a little factory with a smoking chimney
    for (let y = 40; y < 68; y += 4) for (let x = 24; x < 78; x += 8) px(ctx, (x + y) % 3 ? '#9a4e3a' : '#8a4034', x, y, 7, 3);
    px(ctx, '#5d5468', 22, 36, 58, 4);
    px(ctx, '#ffcf7a', 32, 48, 10, 8); px(ctx, '#ffcf7a', 58, 48, 10, 8);
    px(ctx, '#6a302e', 70, 14, 10, 26);
    disc(ctx, '#c9a7b8', 78, 10, 5); disc(ctx, '#c9a7b8', 84, 4, 4);
    px(ctx, '#5d5468', 86, 56, 12, 12);
  },
  discovery(ctx) {
    // a glowing forest with the course computer and a floating book
    for (const [x, c] of [[30, '#3d5a2e'], [48, '#a24f78'], [80, '#5b7a36']]) { px(ctx, '#5a3828', x - 1, 44, 3, 24); disc(ctx, c, x, 38, 11); }
    px(ctx, '#1d1222', 54, 48, 20, 16); px(ctx, '#f4f6fb', 56, 50, 16, 10); px(ctx, '#2a6fdb', 56, 50, 16, 3);
    px(ctx, '#8eeaff', 90, 24, 8, 6); px(ctx, '#f6ead2', 91, 25, 3, 4);
  },
  studio(ctx) {
    // the cosy studio with swatch bunting
    for (let y = 40; y < 68; y++) px(ctx, ((y / 5) | 0) % 2 ? '#7a4a30' : '#94603c', 22, y, 60, 1);
    for (let j = 0; j < 12; j++) px(ctx, '#7a4a7a', 18 + j, 40 - 12 + j, 68 - j * 2, 1);
    px(ctx, '#ffd98a', 28, 48, 24, 14); px(ctx, '#6a3a26', 60, 50, 12, 18);
    ['#ff9ad5', '#ffd98a', '#8eeaff', '#9effc8'].forEach((c, i) => px(ctx, c, 26 + i * 14, 30 + (i % 2), 6, 6));
    for (let i = 0; i < 4; i++) disc(ctx, ['#e06a58', '#9a7ad0', '#4fb3a8', '#e3b13c'][i], 88 + (i % 2) * 8, 34 + Math.floor(i / 2) * 9, 3);
  },
  academy(ctx) {
    // sandstone hall with a slate-blue tower
    px(ctx, '#d9c6a6', 20, 42, 66, 26);
    for (let x = 24; x < 84; x += 10) px(ctx, '#ffd98a', x, 48, 5, 9);
    px(ctx, '#d9c6a6', 46, 18, 14, 26);
    for (let j = 0; j < 14; j++) px(ctx, '#4a5a8a', 53 - j / 2, 4 + j, j + 1, 1);
    px(ctx, '#8c3b5a', 54, 0, 8, 5);
    for (let j = 0; j < 8; j++) px(ctx, '#4a5a8a', 18 + j, 42 - 8 + j, 70 - j * 2, 1);
  },
  camp(ctx) {
    // the mentor's cabin, a lantern and a campfire
    for (let y = 40; y < 68; y++) px(ctx, ((y / 6) | 0) % 2 ? '#6a4430' : '#5e3c2a', 26, y, 50, 1);
    for (let j = 0; j < 14; j++) px(ctx, '#7a4a30', 22 + j * 1.2, 40 - 14 + j, 58 - j * 2.4, 1);
    px(ctx, '#ffcf7a', 36, 48, 10, 10); px(ctx, '#4a2e22', 56, 50, 10, 18);
    px(ctx, '#ff9a4a', 86, 60, 6, 6); px(ctx, '#ffe28a', 88, 58, 2, 4);
    px(ctx, '#2a1d30', 82, 52, 5, 10); px(ctx, '#d8642e', 81, 41, 7, 11); disc(ctx, '#e0a070', 84, 36, 4); px(ctx, '#3a2420', 82, 38, 5, 3);
  },
  classroom(ctx) {
    // a school with a big blackboard showing 48 × 5
    px(ctx, '#e8ecd0', 20, 34, 68, 34);
    px(ctx, '#2f4a3a', 30, 40, 48, 22);
    px(ctx, '#e8f0e0', 34, 46, 18, 2); px(ctx, '#e8f0e0', 34, 52, 30, 2); px(ctx, '#e8f0e0', 34, 56, 24, 2);
    for (let j = 0; j < 10; j++) px(ctx, '#c0573f', 16 + j, 34 - 10 + j, 76 - j * 2, 1);
    disc(ctx, '#f6f0e0', 54, 28, 4);
    px(ctx, '#c0473a', 90, 58, 8, 10);
  },
};

const SHORT = { workshop: 'OLD WORKSHOP', discovery: 'DISCOVERY', studio: 'FIRST WORKPLACE', academy: 'ACADEMY', camp: "MENTOR'S CAMP", classroom: 'CLASSROOM' };

// 160 x 140 canvas; the island is centred at x = 80.
export function makeMemoryCanvas(id, num, name, rand) {
  const [c, ctx] = makeCanvas(160, 140);
  ctx.save();
  ctx.translate(20, 0);
  paintFloatingIsland(ctx, 10, 70, 100, rand, { tone: 'near', waterfall: false });
  MINI[id](ctx);
  for (let x = 12; x < 108; x += 3) px(ctx, x % 2 ? COLORS.grass.top : COLORS.grass.light, x, 68, 1, 2);
  ctx.restore();
  const label = `${num} · ${SHORT[id]}`;
  const bw = label.length * 6 + 12;
  const bx = Math.round(80 - bw / 2), by = 112;
  px(ctx, INK, bx - 1, by - 1, bw + 2, 13);
  px(ctx, '#2a1d3a', bx, by, bw, 11);
  px(ctx, MAGIC.gold, bx, by, bw, 1);
  pixelText(ctx, label, 80, by, { size: 8, color: MAGIC.gold, align: 'center' });
  return c;
}
