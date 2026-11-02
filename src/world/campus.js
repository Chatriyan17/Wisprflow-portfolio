// Stage 5 painters: the Knowledge Academy, a magical university campus.
// Warm sandstone, slate-blue roofs, green lawns and stone paths, golden light.

import { px, dither, disc, ellipse, line, mix, pixelText, bayer } from './pixel.js';
import { COLORS, paintTerrainBlock, paintTree, paintBench } from './art.js';
import { WORLD } from '../config.js';

const G = WORLD.ground;

export const CP = {
  stone: '#d9c6a6', stoneLight: '#efdfc0', stoneMid: '#bba684', stoneDark: '#8e7a62', stoneDeep: '#5e4e42',
  roof: '#4a5a8a', roofLight: '#6a7cae', roofDark: '#33406a',
  wood: '#7a4a30', woodLight: '#a8703f', woodDark: '#4a2a22',
  ink: '#1d1222', board: '#2f4a3a', chalk: '#e8f0e0', gold: '#f5c35b', ivy: '#5b7a36',
  glass: '#ffd98a', glassDeep: '#f2a060', banner: '#8c3b5a',
};

// ---------------------------------------------------------------------------
// Ground: lawn with a stone path
// ---------------------------------------------------------------------------

export function paintCampusGround(ctx, rand, x0, x1, top, bottom) {
  paintTerrainBlock(ctx, rand, x0, x1, top, bottom);
  // cobbled path along the walking line
  for (let x = x0; x < x1; x += 9) {
    const w = 8, h = 4 + (x % 2);
    px(ctx, CP.stoneMid, x, top - 6, w, h);
    px(ctx, CP.stoneLight, x, top - 6, w - 1, 1);
    px(ctx, CP.stoneDark, x, top - 6 + h - 1, w, 1);
  }
  for (let x = x0 + 4; x < x1; x += 9) {
    px(ctx, CP.stoneMid, x, top - 2, 8, 4);
    px(ctx, CP.stoneLight, x, top - 2, 7, 1);
  }
}

// ---------------------------------------------------------------------------
// Backdrop: the grand academy behind everything
// ---------------------------------------------------------------------------

function tower(ctx, x, top, w, gy, flag) {
  for (let y = top; y < gy - 60; y++) {
    px(ctx, CP.stone, x, y, w, 1);
    px(ctx, CP.stoneMid, x + w - 4, y, 4, 1);
    px(ctx, CP.stoneLight, x, y, 2, 1);
  }
  for (let y = top + 8; y < gy - 70; y += 10) for (let k = x + 2; k < x + w - 2; k += 8) px(ctx, CP.stoneMid, k, y, 6, 1);
  // conical roof
  const rh = Math.round(w * 1.3);
  for (let j = 0; j < rh; j++) {
    const half = Math.round(((j + 1) / rh) * (w / 2 + 3));
    px(ctx, j % 4 === 0 ? CP.roofDark : CP.roof, x + w / 2 - half, top - rh + j, half * 2, 1);
    px(ctx, CP.roofLight, x + w / 2 + half - 2, top - rh + j, 2, 1);
  }
  px(ctx, CP.gold, x + w / 2 - 1, top - rh - 4, 2, 5);
  // arched window
  px(ctx, CP.ink, x + w / 2 - 5, top + 14, 10, 18);
  px(ctx, CP.glass, x + w / 2 - 4, top + 16, 8, 15);
  px(ctx, CP.ink, x + w / 2 - 1, top + 16, 1, 15);
  return { flagX: x + w / 2, flagY: top - rh - 4 };
}

export function paintCampusBackdrop(ctx, rand, x0, x1, gy) {
  // far wall of the campus: hedges and an ivy-covered stone wall
  for (let x = x0; x < x1; x++) {
    const h = 26 + Math.round(Math.sin(x * 0.03) * 3);
    px(ctx, '#4f6a3c', x, gy - 40 - h, 1, h + 30);
    if (bayer(x, 1) < 0.4) px(ctx, '#6a8a48', x, gy - 40 - h, 1, 2);
  }
  // the great hall: a long sandstone facade with towers and tall windows
  const hx0 = 12960, hx1 = 15140, hallTop = gy - 230;
  for (let y = hallTop; y < gy - 40; y++) {
    px(ctx, CP.stone, hx0, y, hx1 - hx0, 1);
  }
  for (let y = hallTop + 6; y < gy - 40; y += 8) {
    for (let x = hx0 + ((y / 8) % 2) * 10; x < hx1; x += 20) px(ctx, CP.stoneMid, x, y, 1, 8);
    px(ctx, CP.stoneMid, hx0, y, hx1 - hx0, 1);
  }
  // roof line with dormers
  for (let j = 0; j < 22; j++) px(ctx, j % 4 === 0 ? CP.roofDark : CP.roof, hx0 - 10 + j, hallTop - 22 + j, hx1 - hx0 + 20 - j * 2, 1);
  for (let x = hx0 + 60; x < hx1 - 60; x += 140) {
    for (let j = 0; j < 14; j++) px(ctx, CP.roofDark, x - j, hallTop - 36 + j, 20 + j * 2, 1);
    px(ctx, CP.ink, x + 4, hallTop - 26, 12, 12);
    px(ctx, CP.glass, x + 5, hallTop - 25, 10, 11);
  }
  // tall gothic windows along the upper floor
  for (let x = hx0 + 30; x < hx1 - 30; x += 70) {
    px(ctx, CP.ink, x - 1, hallTop + 20, 22, 46);
    for (let j = 0; j < 44; j++) {
      const half = j < 10 ? Math.round(Math.sqrt(Math.max(0, 100 - (10 - j) ** 2))) : 10;
      px(ctx, mix(CP.glass, CP.glassDeep, j / 44), x + 10 - half, hallTop + 21 + j, half * 2, 1);
    }
    px(ctx, CP.ink, x + 10, hallTop + 21, 1, 44);
    px(ctx, CP.ink, x, hallTop + 44, 21, 1);
  }
  // towers + flags (flags are animated by the renderer)
  const flags = [];
  for (const [tx, tw, th] of [[12940, 40, 300], [13540, 46, 330], [14540, 46, 320], [15130, 40, 300]]) {
    flags.push(tower(ctx, tx, gy - th, tw, gy));
  }
  // clock on the central tower
  disc(ctx, CP.ink, 13563, gy - 250, 13);
  disc(ctx, CP.stoneLight, 13563, gy - 250, 11);
  line(ctx, CP.ink, 13563, gy - 250, 13563, gy - 258);
  line(ctx, CP.ink, 13563, gy - 250, 13569, gy - 247);
  // ivy on the facade
  for (let i = 0; i < 40; i++) {
    let vx = hx0 + rand.range(0, hx1 - hx0);
    for (let j = 0; j < rand.int(10, 50); j++) {
      if (rand.chance(0.3)) vx += rand.chance(0.5) ? 1 : -1;
      px(ctx, j % 3 ? CP.ivy : '#7a9a4a', vx, gy - 40 - j, 2, 1);
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Arrival, gates and boards
// ---------------------------------------------------------------------------

export function paintArrivalArch(ctx, x, gy) {
  // the doorway they come through from the studio: books stacked into an arch
  for (let a = 0; a <= 180; a += 9) {
    const t = (a / 180) * Math.PI;
    const bx = x + Math.cos(t) * 34, by = gy - 60 - Math.sin(t) * 46;
    px(ctx, CP.ink, bx - 7, by - 4, 14, 8);
    px(ctx, ['#8c3b3b', '#3a6eb0', '#e3b13c', '#4fb3a8', '#7a5ab8'][(a / 9) % 5], bx - 6, by - 3, 12, 6);
  }
  for (const side of [-1, 1]) {
    for (let y = gy; y > gy - 62; y -= 7) {
      px(ctx, CP.ink, x + side * 34 - 8, y - 7, 16, 7);
      px(ctx, ['#4fb3a8', '#8c3b3b', '#e3b13c'][Math.abs(y) % 3], x + side * 34 - 7, y - 6, 14, 5);
    }
  }
}

export function paintNoticeBoard(ctx, x, gy) {
  px(ctx, CP.woodDark, x - 2, gy - 70, 4, 70);
  px(ctx, CP.ink, x - 30, gy - 82, 60, 42);
  px(ctx, CP.woodLight, x - 29, gy - 81, 58, 40);
  px(ctx, '#c89a62', x - 26, gy - 78, 52, 34);
  const notes = [['#f6ead2', -22, -76], ['#ffe28a', -6, -74], ['#f2b3c8', 10, -77], ['#bfe4ff', -18, -60], ['#f6ead2', 2, -59]];
  for (const [c, dx, dy] of notes) {
    px(ctx, c, x + dx, gy + dy, 13, 12);
    px(ctx, '#8a7a6a', x + dx + 2, gy + dy + 4, 9, 1);
    px(ctx, '#8a7a6a', x + dx + 2, gy + dy + 7, 6, 1);
    px(ctx, '#c0392b', x + dx + 5, gy + dy - 1, 2, 2);
  }
  pixelText(ctx, 'NOTICES', x, gy - 94, { size: 8, color: CP.gold, align: 'center', shadow: CP.ink });
}

export function paintCampusGatePillars(ctx, x, gy) {
  // stone pillars + arch with the university's name (the iron gates are animated)
  for (const side of [-1, 1]) {
    const px0 = x + side * 58 - 12;
    px(ctx, CP.ink, px0 - 1, gy - 120, 26, 120);
    px(ctx, CP.stone, px0, gy - 119, 24, 119);
    px(ctx, CP.stoneLight, px0, gy - 119, 4, 119);
    px(ctx, CP.stoneDark, px0 + 20, gy - 119, 4, 119);
    for (let y = gy - 110; y < gy; y += 12) px(ctx, CP.stoneMid, px0, y, 24, 1);
    px(ctx, CP.stoneDark, px0 - 4, gy - 126, 32, 8);
    px(ctx, CP.stoneLight, px0 - 4, gy - 126, 32, 2);
    // lantern
    px(ctx, CP.ink, px0 + 6, gy - 112, 12, 14);
    px(ctx, COLORS.glow.warm, px0 + 8, gy - 110, 8, 10);
  }
  // arch
  for (let a = 0; a <= 180; a += 2) {
    const t = (a / 180) * Math.PI;
    const ax = x + Math.cos(t) * 62, ay = gy - 126 - Math.sin(t) * 30;
    px(ctx, CP.ink, ax - 5, ay - 5, 10, 10);
    px(ctx, CP.stone, ax - 4, ay - 4, 8, 8);
    px(ctx, CP.stoneLight, ax - 4, ay - 4, 8, 2);
  }
  // name plate across the arch
  px(ctx, CP.ink, x - 82, gy - 168, 164, 32);
  px(ctx, '#2a3a5a', x - 81, gy - 167, 162, 30);
  px(ctx, CP.gold, x - 81, gy - 167, 162, 1);
  px(ctx, CP.gold, x - 81, gy - 138, 162, 1);
  pixelText(ctx, 'LOVELY PROFESSIONAL', x, gy - 165, { size: 8, color: CP.gold, align: 'center', shadow: CP.ink });
  pixelText(ctx, 'UNIVERSITY', x, gy - 155, { size: 8, color: CP.gold, align: 'center', shadow: CP.ink });
  pixelText(ctx, 'PUNJAB, INDIA', x, gy - 145, { size: 8, color: '#cfe2ff', align: 'center', shadow: CP.ink });
}

export function paintInfoBoard(ctx, x, gy) {
  // academic information board
  for (const dx of [-50, 46]) px(ctx, CP.woodDark, x + dx, gy - 54, 4, 54);
  px(ctx, CP.ink, x - 58, gy - 114, 116, 66);
  px(ctx, '#2a3a5a', x - 57, gy - 113, 114, 64);
  px(ctx, CP.gold, x - 57, gy - 113, 114, 1);
  const rows = [['INSTITUTION', 'LPU, PUNJAB'], ['PROGRAMME', 'MASTER OF DESIGN'], ['SPECIALISATION', 'INTERACTION DESIGN']];
  rows.forEach(([k, v], i) => {
    pixelText(ctx, k, x - 53, gy - 112 + i * 20, { size: 8, color: '#9ab8f0' });
    pixelText(ctx, v, x - 53, gy - 103 + i * 20, { size: 8, color: '#f6ead2' });
  });
}

export function paintCampusLamp(ctx, x, gy) {
  px(ctx, CP.ink, x - 3, gy - 4, 7, 4);
  px(ctx, '#3a3346', x - 1, gy - 70, 3, 66);
  px(ctx, CP.ink, x - 6, gy - 84, 13, 4);
  px(ctx, '#3a2a2a', x - 5, gy - 80, 11, 11);
  px(ctx, COLORS.glow.warm, x - 4, gy - 79, 9, 9);
  px(ctx, COLORS.glow.core, x - 2, gy - 78, 5, 5);
  px(ctx, CP.ink, x - 6, gy - 69, 13, 2);
  // a little banner on the lamp post
  px(ctx, CP.banner, x + 2, gy - 62, 10, 18);
  px(ctx, CP.gold, x + 2, gy - 62, 10, 1);
}

export function paintFlowerbed(ctx, rand, x, gy, w) {
  px(ctx, CP.stoneDark, x - 2, gy - 8, w + 4, 8);
  px(ctx, CP.stone, x - 1, gy - 8, w + 2, 2);
  for (let i = 0; i < w / 4; i++) {
    const fx = x + rand.range(0, w);
    px(ctx, COLORS.leaf.mid, fx, gy - 14, 1, 6);
    px(ctx, rand.pick(['#f2b3c8', '#ffe28a', '#ffffff', '#d98aa6', '#b79ad8']), fx - 1, gy - 16, 3, 2);
  }
}

export function paintCampusTree(ctx, rand, x, gy, opts) { paintTree(ctx, rand, x, gy, opts); }

// ---------------------------------------------------------------------------
// Cutaway rooms (the inside is visible, like a doll's house)
// ---------------------------------------------------------------------------

function cutawayRoom(ctx, x0, x1, gy, { wall, floor, title }) {
  const top = gy - 170;
  // back wall
  for (let y = top; y < gy; y++) px(ctx, mix(wall, '#2a1d30', (gy - y) / 400), x0, y, x1 - x0, 1);
  for (let x = x0; x < x1; x += 32) px(ctx, mix(wall, '#000000', 0.15), x, top, 1, 170);
  // wainscot + floor
  px(ctx, CP.woodDark, x0, gy - 34, x1 - x0, 34);
  px(ctx, CP.woodLight, x0, gy - 36, x1 - x0, 3);
  for (let x = x0; x < x1; x += 24) px(ctx, CP.wood, x + 1, gy - 32, 22, 28);
  // stone frame: side columns and a carved lintel with the room's name
  for (const cx of [x0 - 10, x1 - 6]) {
    px(ctx, CP.ink, cx - 1, top - 20, 18, 190);
    px(ctx, CP.stone, cx, top - 19, 16, 189);
    px(ctx, CP.stoneLight, cx, top - 19, 3, 189);
  }
  px(ctx, CP.ink, x0 - 14, top - 34, x1 - x0 + 30, 22);
  px(ctx, CP.stone, x0 - 13, top - 33, x1 - x0 + 28, 20);
  px(ctx, CP.stoneLight, x0 - 13, top - 33, x1 - x0 + 28, 2);
  pixelText(ctx, title, (x0 + x1) / 2, top - 30, { size: 8, color: '#5a3a2a', align: 'center' });
  // roof
  for (let j = 0; j < 24; j++) {
    px(ctx, j % 4 === 0 ? CP.roofDark : CP.roof, x0 - 22 + j, top - 58 + j, x1 - x0 + 46 - j * 2, 1);
  }
}

export function paintClassroom(ctx, rand, x0, x1, gy) {
  cutawayRoom(ctx, x0, x1, gy, { wall: '#8a6a5a', title: '01 · DESIGN FUNDAMENTALS' });
  const top = gy - 170;
  // blackboard with shapes and notes
  px(ctx, CP.woodDark, x0 + 40, top + 18, 160, 76);
  px(ctx, CP.board, x0 + 43, top + 21, 154, 70);
  const C = CP.chalk;
  disc(ctx, C, x0 + 70, top + 44, 10);
  disc(ctx, CP.board, x0 + 70, top + 44, 8);
  for (let i = 0; i < 18; i++) px(ctx, C, x0 + 92 + i, top + 54 - i, 2, 1);
  for (let i = 0; i < 18; i++) px(ctx, C, x0 + 110 + i, top + 37 + i, 2, 1);
  px(ctx, C, x0 + 92, top + 54, 36, 1);
  px(ctx, C, x0 + 140, top + 34, 20, 20);
  px(ctx, CP.board, x0 + 141, top + 35, 18, 18);
  pixelText(ctx, 'WHY?', x0 + 172, top + 30, { size: 8, color: C, align: 'center' });
  for (let i = 0; i < 3; i++) px(ctx, C, x0 + 52 + i * 40, top + 74, 26, 1);
  px(ctx, '#e8e0d8', x0 + 50, top + 92, 20, 3);
  // posters: type specimen + colour wheel
  px(ctx, CP.ink, x0 + 220, top + 18, 50, 66);
  px(ctx, '#f6ead2', x0 + 221, top + 19, 48, 64);
  pixelText(ctx, 'Aa', x0 + 245, top + 22, { size: 16, color: '#8c3b3b', align: 'center', font: 'Pixelify Sans' });
  pixelText(ctx, 'Bb Cc', x0 + 245, top + 50, { size: 8, color: '#2b2330', align: 'center' });
  px(ctx, '#2b2330', x0 + 228, top + 66, 34, 2);
  const wheel = ['#e04848', '#f2a060', '#f5c35b', '#7ac06a', '#4fb3a8', '#3a6eb0', '#7a5ab8', '#d06aa0'];
  for (let a = 0; a < 64; a++) {
    const t = (a / 64) * Math.PI * 2;
    for (let r = 6; r < 18; r++) px(ctx, wheel[Math.floor(a / 8)], x0 + 312 + Math.cos(t) * r, top + 44 + Math.sin(t) * r, 1, 1);
  }
  // desks with sketchbooks
  for (const dx of [70, 170, 270]) {
    px(ctx, CP.woodDark, x0 + dx - 26, gy - 46, 52, 5);
    px(ctx, CP.woodLight, x0 + dx - 26, gy - 46, 52, 1);
    px(ctx, CP.woodDark, x0 + dx - 22, gy - 41, 3, 41);
    px(ctx, CP.woodDark, x0 + dx + 19, gy - 41, 3, 41);
    px(ctx, '#f6ead2', x0 + dx - 14, gy - 49, 16, 3);
    px(ctx, '#8c3b3b', x0 + dx + 6, gy - 50, 10, 4);
  }
}

export function paintLibrary(ctx, rand, x0, x1, gy) {
  cutawayRoom(ctx, x0, x1, gy, { wall: '#6a5a7a', title: '02 · UNDERSTANDING PEOPLE' });
  const top = gy - 170;
  // tall bookshelves along the back wall
  for (let sx = x0 + 10; sx < x1 - 50; sx += 96) {
    px(ctx, CP.woodDark, sx, top + 8, 60, 150);
    for (let r = 0; r < 6; r++) {
      const sy = top + 12 + r * 24;
      px(ctx, CP.wood, sx + 3, sy + 20, 54, 3);
      let bx = sx + 4;
      while (bx < sx + 54) {
        const bw = rand.int(3, 6), bh = rand.int(14, 19);
        const c = rand.pick(['#8c3b3b', '#3a6eb0', '#e3b13c', '#4fb3a8', '#7a5ab8', '#f6ead2', '#5b7a36']);
        px(ctx, c, bx, sy + 20 - bh, bw, bh);
        px(ctx, mix(c, '#ffffff', 0.3), bx, sy + 20 - bh, bw, 1);
        bx += bw + 1;
      }
    }
  }
  // persona board + empathy map
  const pb = x0 + 76;
  px(ctx, CP.ink, pb - 1, top + 30, 30, 40);
  px(ctx, '#f6ead2', pb, top + 31, 28, 38);
  disc(ctx, '#d8a07a', pb + 14, top + 41, 5);
  px(ctx, '#5a3a5a', pb + 8, top + 47, 12, 6);
  for (let i = 0; i < 3; i++) px(ctx, '#8a7a6a', pb + 4, top + 56 + i * 4, 20 - i * 4, 1);
  const em = x0 + 170;
  px(ctx, CP.ink, em - 1, top + 28, 50, 44);
  px(ctx, '#f6ead2', em, top + 29, 48, 42);
  px(ctx, '#8a7a6a', em + 24, top + 29, 1, 42);
  px(ctx, '#8a7a6a', em, top + 50, 48, 1);
  disc(ctx, '#d8a07a', em + 24, top + 50, 5);
  for (const [dx, dy, c] of [[4, 4, '#ffe28a'], [32, 6, '#f2b3c8'], [6, 56, '#bfe4ff'], [34, 58, '#9effc8']]) px(ctx, c, em + dx, top + 29 + dy - 4, 9, 8);
  // reading table, open notebooks, rolling ladder, warm lamps
  px(ctx, CP.woodDark, x0 + 110, gy - 44, 140, 5);
  px(ctx, CP.woodLight, x0 + 110, gy - 44, 140, 1);
  px(ctx, CP.woodDark, x0 + 116, gy - 39, 4, 39);
  px(ctx, CP.woodDark, x0 + 240, gy - 39, 4, 39);
  for (const nx of [x0 + 130, x0 + 200]) {
    px(ctx, '#f6ead2', nx, gy - 48, 24, 4);
    px(ctx, '#8a7a6a', nx + 11, gy - 48, 1, 4);
  }
  line(ctx, CP.woodLight, x1 - 70, gy, x1 - 56, top + 20);
  line(ctx, CP.woodLight, x1 - 60, gy, x1 - 46, top + 20);
  for (let y = top + 30; y < gy; y += 14) px(ctx, CP.woodLight, x1 - 66 + (gy - y) * -0.1, y, 12, 1);
  for (const lx of [x0 + 150, x0 + 214]) {
    px(ctx, '#3a2a35', lx, gy - 62, 2, 14);
    px(ctx, '#3a6a4a', lx - 5, gy - 66, 12, 5);
    px(ctx, COLORS.glow.warm, lx - 4, gy - 61, 10, 1);
  }
}

export function paintLab(ctx, rand, x0, x1, gy) {
  cutawayRoom(ctx, x0, x1, gy, { wall: '#3a4a6a', title: '03 · INTERACTION DESIGN LAB' });
  const top = gy - 170;
  // flow diagram on the wall: connected journey paths
  const nodes = [[x0 + 30, top + 30], [x0 + 80, top + 20], [x0 + 80, top + 52], [x0 + 130, top + 36]];
  for (let i = 0; i < nodes.length - 1; i++) {
    const [ax, ay] = nodes[i], [bx, by] = nodes[i === 2 ? 1 : i + 1 === 2 ? 3 : i + 1];
    line(ctx, '#8eeaff', ax + 8, ay + 5, bx, by + 5);
  }
  line(ctx, '#8eeaff', nodes[0][0] + 8, nodes[0][1] + 5, nodes[2][0], nodes[2][1] + 5);
  line(ctx, '#8eeaff', nodes[2][0] + 16, nodes[2][1] + 5, nodes[3][0], nodes[3][1] + 5);
  for (const [nx, ny] of nodes) { px(ctx, CP.ink, nx - 1, ny - 1, 18, 12); px(ctx, '#e8eef9', nx, ny, 16, 10); px(ctx, '#4fb3a8', nx + 2, ny + 2, 8, 2); }
  // prototype boards
  for (let i = 0; i < 3; i++) {
    const bx = x0 + 270 + i * 34;
    px(ctx, CP.ink, bx - 1, top + 22, 26, 44);
    px(ctx, '#ffffff', bx, top + 23, 24, 42);
    px(ctx, i === 2 ? '#4fb3a8' : '#c8c8d8', bx + 2, top + 25, 20, 5);
    px(ctx, '#c8c8d8', bx + 2, top + 34, 14, 2);
    px(ctx, '#c8c8d8', bx + 2, top + 39, 18, 2);
    px(ctx, i === 2 ? '#e3b13c' : '#d8d8e0', bx + 4, top + 54, 16, 6);
  }
  // the big interactive screen + console (the puzzle station)
  const sx = x0 + 160;
  px(ctx, CP.ink, sx - 2, top + 70, 104, 70);
  px(ctx, '#5a6a8a', sx - 1, top + 71, 102, 68);
  px(ctx, '#14182a', sx + 3, top + 75, 94, 58);
  px(ctx, '#3a4a6a', sx + 40, top + 140, 20, 10);
  px(ctx, CP.ink, sx + 20, gy - 40, 60, 6);
  px(ctx, '#7a8aa8', sx + 21, gy - 40, 58, 2);
  px(ctx, '#3a4a6a', sx + 46, gy - 34, 8, 34);
  for (let i = 0; i < 4; i++) disc(ctx, ['#ff9ad5', '#8eeaff', '#ffd98a', '#9effc8'][i], sx + 28 + i * 14, gy - 37, 2);
}

export function paintFoundationWall(ctx, x0, gy) {
  // a grand open hall wall of carved stone, with seven niches for the principles
  const x1 = x0 + 480, top = gy - 210;
  px(ctx, CP.ink, x0 - 1, top - 1, x1 - x0 + 2, gy - top + 1);
  for (let y = top; y < gy; y++) px(ctx, mix('#4a3f62', '#2e2840', (y - top) / (gy - top)), x0, y, x1 - x0, 1);
  for (let y = top + 10; y < gy; y += 16) px(ctx, '#3a3254', x0, y, x1 - x0, 1);
  // pillars
  for (const cx of [x0, x1 - 18]) {
    px(ctx, CP.stone, cx, top - 10, 18, gy - top + 10);
    px(ctx, CP.stoneLight, cx, top - 10, 3, gy - top + 10);
    px(ctx, CP.stoneDark, cx + 15, top - 10, 3, gy - top + 10);
  }
  px(ctx, CP.ink, x0 - 10, top - 30, x1 - x0 + 20, 22);
  px(ctx, CP.stone, x0 - 9, top - 29, x1 - x0 + 18, 20);
  px(ctx, CP.stoneLight, x0 - 9, top - 29, x1 - x0 + 18, 2);
  pixelText(ctx, '04 · THE FOUNDATION WALL', (x0 + x1) / 2, top - 26, { size: 8, color: '#5a3a2a', align: 'center' });
  // niches (symbols are drawn and lit by the renderer)
  for (let i = 0; i < 7; i++) {
    const nx = x0 + 60 + i * 65;
    px(ctx, CP.ink, nx - 21, gy - 158, 42, 52);
    px(ctx, '#251f36', nx - 20, gy - 157, 40, 50);
    for (let j = 0; j < 10; j++) px(ctx, '#251f36', nx - 20 + j, gy - 167 + j, 40 - j * 2, 1);
  }
  // steps in front
  px(ctx, CP.stoneDark, x0 - 6, gy - 6, x1 - x0 + 12, 6);
  px(ctx, CP.stone, x0 - 6, gy - 6, x1 - x0 + 12, 2);
}

export function paintFountain(ctx, x, gy) {
  ellipse(ctx, CP.stoneDark, x, gy - 6, 34, 7);
  ellipse(ctx, CP.stone, x, gy - 8, 32, 5);
  ellipse(ctx, '#6a8ae0', x, gy - 8, 28, 3);
  px(ctx, CP.stone, x - 4, gy - 40, 8, 32);
  ellipse(ctx, CP.stone, x, gy - 40, 12, 3);
  ellipse(ctx, '#8ab0f0', x, gy - 40, 10, 2);
}

export function paintMentorPath(ctx, rand, x, gy) {
  // a quiet path leading off towards a distant campfire; the sign is revealed later
  for (let i = 0; i < 6; i++) {
    const lx = x - 80 + i * 40;
    px(ctx, CP.woodDark, lx, gy - 26, 2, 26);
    px(ctx, '#3a2a2a', lx - 3, gy - 34, 8, 8);
    px(ctx, COLORS.glow.warm, lx - 2, gy - 33, 6, 6);
  }
  // distant hills and the faint glow of the camp
  for (let x2 = x + 70; x2 < x + 220; x2++) {
    const h = 18 + Math.round(Math.sin((x2 - x) * 0.05) * 6);
    px(ctx, '#5a6a4a', x2, gy - h, 1, h);
  }
  // little tents
  for (const [tx, c] of [[x + 120, '#c0573f'], [x + 160, '#e3b13c']]) {
    for (let j = 0; j < 14; j++) px(ctx, j % 3 ? c : mix(c, '#000000', 0.3), tx - j, gy - 14 + j, j * 2 + 1, 1);
    px(ctx, CP.ink, tx - 1, gy - 6, 3, 6);
  }
  px(ctx, '#5a3a2a', x + 140, gy - 4, 10, 3);
}
