// Stage 4 painters: the first workplace, Valluva HCM Cloud Suite (an IT company).
// Warm wood, muted purple, peach, brick red, cream and teal accents: a real
// creative workspace translated into pixel art, not a generic office.

import { px, dither, disc, ellipse, line, mix, pixelText, bayer } from './pixel.js';
import { COLORS } from './art.js';
import { WORLD } from '../config.js';

const G = WORLD.ground;

export const ST = {
  wall: '#5a4062', wallLight: '#6e5277', wallDark: '#46304e',
  wood: '#8a5a3c', woodLight: '#b67c52', woodDark: '#5a3828',
  cream: '#f3e6d2', peach: '#f2b58a', brick: '#a8503f', teal: '#4fb3a8', tealLight: '#8fe0d4',
  ink: '#1d1222', screenOff: '#232032', screenEdge: '#3a3448',
};

// ---------------------------------------------------------------------------
// Floor
// ---------------------------------------------------------------------------

export function paintStudioFloor(ctx, rand, x0, x1, top, bottom) {
  // dark wood panelling below the floor line
  for (let y = top; y < bottom; y++) {
    const d = (y - top) / 110;
    px(ctx, d < 0.4 ? '#4a2e30' : d < 0.9 ? '#3a2428' : '#2a1a22', x0, y, x1 - x0, 1);
  }
  for (let x = x0; x < x1; x += 40) px(ctx, '#2a1a22', x, top + 8, 2, bottom - top);
  // plank floor (top surface)
  px(ctx, ST.wood, x0, top - 8, x1 - x0, 14);
  px(ctx, ST.woodLight, x0, top - 8, x1 - x0, 2);
  px(ctx, '#d89a6a', x0, top - 9, x1 - x0, 1);
  for (let row = 0; row < 3; row++) {
    const y = top - 5 + row * 4;
    px(ctx, ST.woodDark, x0, y + 3, x1 - x0, 1);
    for (let x = x0 + (row * 23) % 46; x < x1; x += 46) px(ctx, ST.woodDark, x, y, 1, 4);
  }
  for (let x = x0; x < x1; x++) if (bayer(x, top) < 0.08) px(ctx, ST.woodLight, x, top - 3, 1, 1);
  px(ctx, '#2a1a22', x0, top + 6, x1 - x0, 2);
}

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

function poster(ctx, x, y, w, h, colors, rand) {
  px(ctx, ST.ink, x - 1, y - 1, w + 2, h + 2);
  px(ctx, colors[0], x, y, w, h);
  disc(ctx, colors[1], x + w * 0.6, y + h * 0.38, Math.round(w * 0.26));
  px(ctx, colors[2], x + 2, y + h - 10, w - 4, 3);
  px(ctx, colors[2], x + 2, y + h - 5, Math.round(w * 0.6), 2);
}

function plant(ctx, x, gy, s = 1) {
  px(ctx, '#9a4e3a', x - 6 * s, gy - 14 * s, 12 * s, 14 * s);
  px(ctx, '#b8654a', x - 7 * s, gy - 15 * s, 14 * s, 3);
  for (const [dx, dy, r] of [[-6, -26, 7], [5, -30, 8], [0, -38, 7], [-3, -22, 6]]) {
    disc(ctx, COLORS.leaf.dark, x + dx * s, gy + dy * s, Math.round(r * s));
    disc(ctx, COLORS.leaf.mid, x + dx * s + 1, gy + dy * s - 1, Math.round((r - 2) * s));
    disc(ctx, COLORS.leaf.light, x + dx * s + 3, gy + dy * s - 3, Math.max(1, Math.round((r - 5) * s)));
  }
}

function bookshelf(ctx, rand, x, gy) {
  px(ctx, ST.woodDark, x - 1, gy - 92, 50, 92);
  px(ctx, ST.wood, x, gy - 91, 48, 90);
  for (let r = 0; r < 4; r++) {
    const sy = gy - 88 + r * 22;
    px(ctx, ST.woodDark, x + 2, sy + 18, 44, 3);
    let bx = x + 3;
    while (bx < x + 42) {
      const bw = rand.int(3, 6), bh = rand.int(12, 17);
      const c = rand.pick([ST.brick, ST.teal, ST.peach, '#7a5ab8', ST.cream, '#e3b13c']);
      px(ctx, c, bx, sy + 18 - bh, bw, bh);
      px(ctx, mix(c, '#ffffff', 0.3), bx, sy + 18 - bh, bw, 1);
      bx += bw + 1;
    }
  }
}

export function paintStudioInterior(ctx, rand, x0, x1, gy) {
  const ceil = gy - 236;
  // back wall: muted purple with a warm wood wainscot
  for (let y = ceil; y < gy - 70; y++) {
    const t = (y - ceil) / (gy - 70 - ceil);
    px(ctx, mix(ST.wallDark, ST.wall, t), x0, y, x1 - x0, 1);
  }
  for (let x = x0; x < x1; x += 6) px(ctx, ST.wallLight, x, ceil + 30, 1, gy - 100 - ceil);
  for (let y = gy - 70; y < gy; y++) px(ctx, ((y - gy) / 7 | 0) % 2 ? ST.wood : '#7a4e34', x0, y, x1 - x0, 1);
  px(ctx, ST.woodLight, x0, gy - 72, x1 - x0, 3);
  px(ctx, ST.woodDark, x0, gy - 69, x1 - x0, 1);
  for (let x = x0; x < x1; x += 30) px(ctx, ST.woodDark, x, gy - 66, 1, 60);
  // ceiling with exposed beams
  px(ctx, '#2a1d30', x0, ceil - 400, x1 - x0, 400);
  px(ctx, '#3a2a40', x0, ceil - 8, x1 - x0, 10);
  for (let x = x0; x < x1; x += 70) {
    px(ctx, ST.woodDark, x, ceil - 6, 14, 20);
    px(ctx, ST.wood, x + 2, ceil - 6, 10, 18);
  }
  // big windows with the sunset outside
  for (let wx = x0 + 230; wx < x1 - 200; wx += 280) {
    const wy = ceil + 34, ww = 120, wh = 82;
    px(ctx, ST.ink, wx - 4, wy - 4, ww + 8, wh + 8);
    px(ctx, ST.woodLight, wx - 3, wy - 3, ww + 6, wh + 6);
    for (let y = 0; y < wh; y++) px(ctx, mix('#b9659a', '#f8c68d', y / wh), wx, wy + y, ww, 1);
    for (let k = 0; k < 3; k++) {
      const hx = wx + 10 + k * 40;
      for (let j = 0; j < 22; j++) px(ctx, '#7a5a8a', hx - j, wy + wh - 18 + Math.round(j * 0.3), j * 2 + 1, 1);
    }
    px(ctx, '#7a6a8a', wx, wy + wh - 6, ww, 6);
    px(ctx, ST.woodLight, wx + ww / 2 - 1, wy, 3, wh);
    px(ctx, ST.woodLight, wx, wy + wh / 2 - 1, ww, 3);
    px(ctx, ST.woodDark, wx - 6, wy + wh + 4, ww + 12, 4);
    plant(ctx, wx + 18, wy + wh + 4, 0.6);
  }
  // pendant lamps
  for (const lx of [10260, 10520, 10790, 11070, 11350, 11620, 11880]) {
    line(ctx, ST.ink, lx, ceil + 2, lx, gy - 182);
    for (let i = 0; i < 8; i++) px(ctx, i < 2 ? ST.teal : '#2f7a72', lx - 3 - i, gy - 182 + i, 7 + i * 2, 1);
    px(ctx, '#fff0c4', lx - 8, gy - 174, 17, 2);
  }
  // string of colour swatches across the room
  const sw = [ST.brick, ST.peach, ST.teal, '#e3b13c', '#7a5ab8', ST.cream];
  for (let x = x0 + 40, i = 0; x < x1 - 40; x += 22, i++) {
    const y = ceil + 18 + Math.round(Math.sin((x - x0) * 0.012) * 4);
    px(ctx, '#2b2330', x, y, 22, 1);
    px(ctx, sw[i % 6], x + 8, y + 1, 7, 9);
  }

  // --- entrance: door, mat, coat rack, plant
  const ex = x0 + 50;
  px(ctx, ST.ink, ex - 18, gy - 92, 36, 92);
  px(ctx, '#6a3a26', ex - 16, gy - 90, 32, 90);
  px(ctx, '#ffd98a', ex - 10, gy - 82, 20, 16);
  px(ctx, ST.ink, ex - 1, gy - 82, 2, 16);
  disc(ctx, '#f5c35b', ex + 11, gy - 44, 1);
  px(ctx, ST.brick, ex - 22, gy - 4, 44, 4);
  px(ctx, '#c86a58', ex - 22, gy - 4, 44, 1);
  // coat rack
  const cr = x0 + 100;
  px(ctx, ST.woodDark, cr, gy - 70, 3, 70);
  px(ctx, ST.woodDark, cr - 6, gy - 3, 15, 3);
  px(ctx, '#7a5ab8', cr - 7, gy - 66, 7, 18);
  px(ctx, ST.teal, cr + 3, gy - 64, 6, 14);
  plant(ctx, x0 + 128, gy);

  // --- reception with the company name on the wall
  const rx = x0 + 200;
  px(ctx, ST.ink, rx - 52, gy - 36, 104, 36);
  px(ctx, ST.woodLight, rx - 51, gy - 35, 102, 3);
  px(ctx, ST.wood, rx - 51, gy - 32, 102, 32);
  for (let x = rx - 46; x < rx + 46; x += 12) px(ctx, ST.woodDark, x, gy - 28, 1, 24);
  px(ctx, ST.teal, rx - 51, gy - 14, 102, 2);
  px(ctx, '#2b2330', rx + 18, gy - 50, 16, 12);
  px(ctx, ST.tealLight, rx + 19, gy - 49, 14, 9);
  px(ctx, ST.cream, rx - 30, gy - 40, 10, 4);
  plant(ctx, rx - 36, gy - 36, 0.5);
  // wall sign: VALLUVA HCM CLOUD SUITE (subtle, pinned letters with a cloud mark)
  const sy = gy - 158;
  px(ctx, '#3a2a44', rx - 96, sy - 6, 192, 40);
  px(ctx, '#4a3656', rx - 95, sy - 5, 190, 38);
  for (let i = 0; i < 3; i++) disc(ctx, ST.tealLight, rx - 80 + i * 6, sy + 10 - (i === 1 ? 3 : 0), 5);
  px(ctx, ST.tealLight, rx - 86, sy + 10, 24, 6);
  pixelText(ctx, 'VALLUVA', rx - 54, sy - 2, { size: 16, color: ST.cream, shadow: '#2a1d30' });
  pixelText(ctx, 'HCM CLOUD SUITE', rx - 54, sy + 18, { size: 8, color: ST.peach, shadow: '#2a1d30' });

  // --- it's an IT company: a bookshelf, a developer's desk with code on screen, a server rack
  bookshelf(ctx, rand, x0 + 320, gy);
  const dx = x0 + 420;
  px(ctx, ST.ink, dx - 30, gy - 36, 66, 6);
  px(ctx, ST.woodLight, dx - 29, gy - 36, 64, 2);
  px(ctx, ST.woodDark, dx - 26, gy - 30, 4, 30);
  px(ctx, ST.woodDark, dx + 26, gy - 30, 4, 30);
  for (const mx of [dx - 26, dx + 4]) {
    px(ctx, ST.ink, mx - 1, gy - 70, 30, 24);
    px(ctx, '#14182a', mx, gy - 69, 28, 22);
    for (let r = 0; r < 6; r++) {
      const ind = (r % 3) * 3;
      px(ctx, ['#8eeaff', '#9effc8', '#ffd98a', '#ff9ad5'][(r + (mx > dx ? 1 : 0)) % 4], mx + 2 + ind, gy - 67 + r * 3, 6 + ((r * 7) % 12), 1);
    }
    px(ctx, ST.screenEdge, mx + 12, gy - 46, 4, 6);
  }
  px(ctx, ST.ink, dx - 12, gy - 40, 26, 4);
  px(ctx, '#d8d0c4', dx - 11, gy - 40, 24, 3);
  px(ctx, '#3a3346', dx - 6, gy - 58, 14, 22);   // chair back
  px(ctx, ST.ink, dx, gy - 36, 3, 28);
  // server rack with blinking lights (the blinking is drawn by the renderer)
  const sx = x0 + 482;
  px(ctx, ST.ink, sx - 1, gy - 92, 30, 92);
  px(ctx, '#2a2a36', sx, gy - 91, 28, 90);
  for (let r = 0; r < 8; r++) {
    px(ctx, '#3a3a4a', sx + 2, gy - 88 + r * 11, 24, 9);
    px(ctx, '#4a4a5a', sx + 2, gy - 88 + r * 11, 24, 1);
    for (let k = 0; k < 5; k++) px(ctx, '#1a1a24', sx + 12 + k * 3, gy - 85 + r * 11, 2, 4);
  }
  pixelText(ctx, 'HCM', sx + 14, gy - 104, { size: 8, color: ST.tealLight, align: 'center', shadow: ST.ink });

  // --- right side: printer, water cooler, plants
  const pr = x0 + 1555;
  px(ctx, ST.ink, pr - 18, gy - 34, 36, 34);
  px(ctx, '#d8d0c4', pr - 17, gy - 33, 34, 32);
  px(ctx, '#b8b0a4', pr - 17, gy - 22, 34, 2);
  px(ctx, '#ffffff', pr - 10, gy - 38, 20, 5);
  px(ctx, '#5ef0a0', pr + 10, gy - 30, 3, 2);
  plant(ctx, pr + 34, gy);
  plant(ctx, x0 + 1480 + 160, gy, 0.8);
}

// ---------------------------------------------------------------------------
// The four creative stations (static parts; screens and boards animate)
// ---------------------------------------------------------------------------

export function paintCreativeStation(ctx, rand, x, gy, { id, num, name }) {
  // name plaque on the wall
  const label = `${num} · ${name.toUpperCase()}`;
  const lw = label.length * 6 + 14;
  px(ctx, ST.ink, x - lw / 2 - 1, gy - 214, lw + 2, 15);
  px(ctx, '#3a2a44', x - lw / 2, gy - 213, lw, 13);
  px(ctx, ST.peach, x - lw / 2, gy - 213, lw, 1);
  pixelText(ctx, label, x, gy - 214, { size: 8, color: ST.cream, align: 'center' });
  // the wall board behind the desk (filled in when the station wakes up)
  px(ctx, ST.ink, x - 62, gy - 194, 124, 84);
  px(ctx, '#2e2436', x - 61, gy - 193, 122, 82);
  px(ctx, ST.woodLight, x - 64, gy - 110, 128, 3);
  // desk
  px(ctx, ST.ink, x - 58, gy - 36, 116, 6);
  px(ctx, ST.woodLight, x - 57, gy - 36, 114, 2);
  px(ctx, ST.wood, x - 57, gy - 34, 114, 3);
  px(ctx, ST.woodDark, x - 54, gy - 30, 5, 30);
  px(ctx, ST.woodDark, x + 49, gy - 30, 5, 30);
  px(ctx, ST.wood, x + 24, gy - 30, 26, 22);
  px(ctx, ST.woodDark, x + 24, gy - 20, 26, 1);
  // dual monitors (screen content is animated)
  for (const mx of [x - 40, x + 4]) {
    px(ctx, ST.ink, mx - 1, gy - 92, 38, 30);
    px(ctx, ST.screenEdge, mx, gy - 91, 36, 28);
    px(ctx, ST.screenOff, mx + 2, gy - 89, 32, 24);
    px(ctx, ST.screenEdge, mx + 15, gy - 63, 6, 6);
    px(ctx, ST.screenEdge, mx + 10, gy - 58, 16, 2);
  }
  // keyboard, mouse, a mug, sticky notes
  px(ctx, ST.ink, x - 26, gy - 40, 34, 4);
  px(ctx, '#d8d0c4', x - 25, gy - 40, 32, 3);
  ellipse(ctx, '#d8d0c4', x + 16, gy - 38, 3, 2);
  px(ctx, ST.cream, x + 36, gy - 44, 7, 8);
  px(ctx, ST.brick, x + 37, gy - 44, 5, 2);
  for (let i = 0; i < 3; i++) px(ctx, ['#ffe28a', '#ff9ad5', '#8fe0d4'][i], x - 56 + i * 9, gy - 128 + (i % 2) * 4, 7, 7);
  // chair
  px(ctx, ST.ink, x - 12, gy - 58, 22, 24);
  px(ctx, id === 'graphic' ? ST.brick : id === 'motion' ? '#7a5ab8' : id === 'visual' ? ST.teal : '#e3b13c', x - 11, gy - 57, 20, 22);
  px(ctx, ST.ink, x - 2, gy - 34, 3, 26);
  px(ctx, ST.ink, x - 10, gy - 8, 20, 3);
  // a station-specific prop
  if (id === 'graphic') {
    // sketchbook + pencil cup + type specimen
    px(ctx, ST.cream, x - 50, gy - 41, 18, 5);
    px(ctx, ST.brick, x + 46, gy - 50, 6, 8);
    for (let k = 0; k < 3; k++) px(ctx, ['#e3b13c', ST.teal, '#7a5ab8'][k], x + 46 + k * 2, gy - 56, 1, 6);
    px(ctx, ST.ink, x + 66, gy - 160, 34, 46);
    px(ctx, ST.cream, x + 67, gy - 159, 32, 44);
    pixelText(ctx, 'Aa', x + 83, gy - 156, { size: 16, color: ST.brick, align: 'center', font: 'Pixelify Sans' });
    px(ctx, '#2b2330', x + 70, gy - 130, 26, 2);
    px(ctx, '#2b2330', x + 70, gy - 126, 20, 2);
  } else if (id === 'motion') {
    // film reel + clapboard
    disc(ctx, ST.ink, x + 84, gy - 140, 15);
    disc(ctx, '#5a5068', x + 84, gy - 140, 13);
    for (let k = 0; k < 6; k++) disc(ctx, ST.ink, x + 84 + Math.cos(k) * 8, gy - 140 + Math.sin(k) * 8, 2);
    px(ctx, ST.ink, x - 52, gy - 50, 18, 12);
    for (let k = 0; k < 4; k++) px(ctx, k % 2 ? '#ffffff' : ST.ink, x - 52 + k * 5, gy - 54, 5, 4);
  } else if (id === 'visual') {
    // colour swatch fan + camera
    for (let k = 0; k < 5; k++) {
      const a = -1.2 + k * 0.35;
      for (let j = 0; j < 14; j++) px(ctx, [ST.brick, ST.peach, '#e3b13c', ST.teal, '#7a5ab8'][k], x + 82 + Math.cos(a) * j, gy - 130 + Math.sin(a) * j, 3, 2);
    }
    px(ctx, ST.ink, x - 54, gy - 46, 16, 10);
    disc(ctx, '#5a5068', x - 46, gy - 41, 3);
  } else {
    // sticky-note wall + device on the desk
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      if ((r + c) % 3 === 2) continue;
      px(ctx, ['#ffe28a', '#ff9ad5', '#8fe0d4'][(r * 3 + c) % 3], x + 70 + c * 10, gy - 170 + r * 12, 8, 8);
    }
    px(ctx, ST.ink, x - 54, gy - 50, 12, 16);
    px(ctx, ST.tealLight, x - 53, gy - 49, 10, 13);
  }
}

// The big wall that gathers the four disciplines (quadrants fill in as stations are found).
export function paintDesignWall(ctx, x, gy) {
  px(ctx, ST.ink, x - 82, gy - 208, 164, 150);
  px(ctx, ST.woodLight, x - 81, gy - 207, 162, 148);
  px(ctx, '#e8dcc6', x - 77, gy - 203, 154, 140);
  dither(ctx, '#d8c8ac', x - 77, gy - 203, 154, 140, 0.12);
  px(ctx, ST.woodDark, x - 86, gy - 60, 172, 4);
  for (let i = 0; i < 4; i++) {
    const qx = x - 72 + (i % 2) * 76, qy = gy - 198 + Math.floor(i / 2) * 66;
    px(ctx, '#cbbfa8', qx, qy, 68, 58);
  }
  plant(ctx, x - 104, gy, 0.9);
  plant(ctx, x + 104, gy, 0.9);
}

// ---------------------------------------------------------------------------
// The Knowledge Academy: sign + glowing doorway at the end of the studio
// ---------------------------------------------------------------------------

export function paintAcademySign(ctx, x, gy) {
  const bw = 214, bh = 62, bx = x - bw / 2, by = gy - 170;
  for (const pxx of [bx + 18, bx + bw - 22]) {
    px(ctx, ST.woodDark, pxx, by + bh, 5, gy - by - bh);
    px(ctx, ST.woodLight, pxx + 3, by + bh, 1, gy - by - bh);
  }
  px(ctx, ST.ink, bx - 3, by - 3, bw + 6, bh + 6);
  px(ctx, '#1f2a44', bx, by, bw, bh);
  for (const [c, o] of [['#6a8ac8', 0], ['#cfe2ff', 2]]) {
    px(ctx, c, bx + 3 + o, by + 3 + o, bw - 6 - o * 2, 1);
    px(ctx, c, bx + 3 + o, by + bh - 4 - o, bw - 6 - o * 2, 1);
    px(ctx, c, bx + 3 + o, by + 3 + o, 1, bh - 6 - o * 2);
    px(ctx, c, bx + bw - 4 - o, by + 3 + o, 1, bh - 6 - o * 2);
  }
  pixelText(ctx, 'THE KNOWLEDGE ACADEMY', x, by + 9, { size: 8, color: '#ffe8a8', align: 'center', shadow: '#3a2a1a' });
  pixelText(ctx, "SOMETIMES, DOING MORE ISN'T ENOUGH.", x, by + 26, { size: 8, color: '#cfe2ff', align: 'center', shadow: '#1a2a4a' });
  pixelText(ctx, 'YOU NEED TO UNDERSTAND MORE.', x, by + 38, { size: 8, color: '#cfe2ff', align: 'center', shadow: '#1a2a4a' });
}

export function paintAcademyDoor(ctx, x, gy) {
  // a tall arched doorway glowing with soft white-blue light, books on either side
  const w = 56, h = 110;
  for (let y = 0; y < h; y++) {
    const half = y < 28 ? Math.round(Math.sqrt(Math.max(0, 28 * 28 - (28 - y) ** 2)) * (w / 2 + 8) / 28) : w / 2 + 8;
    px(ctx, ST.ink, x - half, gy - h + y, half * 2, 1);
  }
  for (let y = 4; y < h; y++) {
    const r = 24;
    const half = y < r + 4 ? Math.round(Math.sqrt(Math.max(0, r * r - (r + 4 - y) ** 2)) * (w / 2) / r) : w / 2;
    px(ctx, mix('#eaf4ff', '#9ab8f0', y / h), x - half, gy - h + y, half * 2, 1);
  }
  // pillars of stacked books
  for (const side of [-1, 1]) {
    let y = gy;
    let k = 0;
    while (y > gy - h) {
      const bw = 16 + (k % 3) * 2, bh = 5 + (k % 2) * 2;
      const c = [ST.brick, '#3a6eb0', '#e3b13c', ST.teal, '#7a5ab8'][k % 5];
      const bx = x + side * (w / 2 + 14) - bw / 2;
      px(ctx, ST.ink, bx - 1, y - bh - 1, bw + 2, bh + 1);
      px(ctx, c, bx, y - bh, bw, bh);
      px(ctx, mix(c, '#ffffff', 0.35), bx, y - bh, bw, 1);
      y -= bh + 1;
      k++;
    }
  }
  pixelText(ctx, '05', x, gy - h - 16, { size: 8, color: '#ffe8a8', align: 'center' });
}
