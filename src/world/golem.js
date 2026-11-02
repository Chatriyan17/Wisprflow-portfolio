// The Four-Armed Creative Golem: an ancient machine of dark iron, warm wood and
// copper that has absorbed every creative tool in the office. Drawn in code as
// pixel art, about 2.5x the protagonist's height, with four arms that animate
// independently:
//   upper left  · graphic design · a giant mechanical paintbrush
//   upper right · motion design  · a film reel and timeline mechanism
//   lower left  · visual design  · a rotating colour prism
//   lower right · product design · a holographic interface projector
// It is overwhelming, but slightly goofy. Nothing it does can hurt anyone.

import { px, disc, ellipse } from './pixel.js';
import { drawHatIcon } from './renderer.js';
import { WORLD, REDUCED_MOTION } from '../config.js';

const G = WORLD.ground;

const C = {
  ink: '#1d1222',
  ironD: '#2a2234', iron: '#3d3249', ironM: '#4e4160', ironL: '#6a5a7e', ironH: '#8a7a9c',
  woodD: '#5a3828', wood: '#8a5a3c', woodL: '#b67c52',
  copperD: '#7a3f2a', copper: '#b5643c', copperL: '#e0925a', copperH: '#f2c18d',
  amber: '#f5c35b', amberL: '#ffe7a8', amberD: '#6a4a24',
  plum: '#2a1730', brick: '#a8503f', peach: '#f2b58a', lavender: '#b79ad8', sage: '#8fae8b', gold: '#e3b13c',
  teal: '#4fb3a8', tealL: '#8fe0d4', cream: '#f3e6d2',
};

// discipline → arm
export const ARM_OF = { graphic: 'brush', motion: 'reel', visual: 'prism', product: 'holo' };
const PAINT = [C.brick, '#c8553d', C.peach, C.gold, C.lavender];

// Arm geometry: shoulder offset, segment lengths and poses [upper angle, forearm angle]
// in degrees (0 = right, 90 = down).
const ARMS = {
  // seat: where each arm rests when it sits on the floor
  brush: { sx: -44, sy: -122, L1: 30, L2: 26, idle: [150, 232], wind: [205, 262], hit: [158, 172], down: [100, 96], seat: [122, 152], ph: 0 },
  reel: { sx: 44, sy: -122, L1: 30, L2: 26, idle: [30, -52], wind: [-25, -82], hit: [22, 4], down: [80, 84], seat: [58, 28], ph: 1.3 },
  prism: { sx: -40, sy: -76, L1: 24, L2: 22, idle: [165, 205], wind: [192, 242], hit: [172, 180], down: [104, 96], seat: [132, 174], ph: 2.1 },
  holo: { sx: 40, sy: -76, L1: 24, L2: 22, idle: [15, -25], wind: [-12, -62], hit: [8, -4], down: [76, 84], seat: [50, 8], ph: 3.3 },
};
const THUMB = [176, 248];   // the prism arm's last trick: a thumbs-up

const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const toward = (v, target, rate, dt) => (Math.abs(target - v) <= rate * dt ? target : v + Math.sign(target - v) * rate * dt);
const MOTION = REDUCED_MOTION ? 0 : 1;

// a thick pixel line: square stamps along a segment
function thick(ctx, color, x0, y0, x1, y1, w) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  ctx.fillStyle = color;
  const h = w / 2;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * k - h), Math.round(y0 + (y1 - y0) * k - h), w, w);
  }
}

// rounded rectangle on the pixel grid
function rrect(ctx, color, x, y, w, h, r) {
  ctx.fillStyle = color;
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j++) {
    const d = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
    const inset = d ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
    ctx.fillRect(x + inset, y + j, w - inset * 2, 1);
  }
}

// filled triangle, scanline
function tri(ctx, color, a, b, c) {
  const pts = [a, b, c].map((p) => [Math.round(p[0]), Math.round(p[1])]).sort((p, q) => p[1] - q[1]);
  const [p0, p1, p2] = pts;
  ctx.fillStyle = color;
  const edge = (pa, pb, y) => (pb[1] === pa[1] ? pa[0] : pa[0] + ((pb[0] - pa[0]) * (y - pa[1])) / (pb[1] - pa[1]));
  for (let y = p0[1]; y <= p2[1]; y++) {
    const xa = edge(p0, p2, y);
    const xb = y < p1[1] ? edge(p0, p1, y) : edge(p1, p2, y);
    const l = Math.round(Math.min(xa, xb)), r = Math.round(Math.max(xa, xb));
    ctx.fillRect(l, y, r - l + 1, 1);
  }
}

function gear(ctx, cx, cy, r, ang, teeth, dark, mid, light) {
  for (let i = 0; i < teeth; i++) {
    const a = ang + (i * Math.PI * 2) / teeth;
    px(ctx, dark, cx + Math.cos(a) * (r + 1) - 1.5, cy + Math.sin(a) * (r + 1) - 1.5, 3, 3);
  }
  disc(ctx, dark, cx, cy, r);
  disc(ctx, mid, cx, cy, r - 1);
  px(ctx, light, cx - Math.round(r * 0.5), cy - Math.round(r * 0.5), 2, 1);
  disc(ctx, dark, cx, cy, Math.max(1, Math.round(r * 0.35)));
}

function star(ctx, color, x, y, s = 1) {
  x = Math.round(x); y = Math.round(y);
  px(ctx, color, x - 1, y - 1, 3, 3);
  px(ctx, color, x, y - 2 - s, 1, 2 + s);
  px(ctx, color, x, y + 2, 1, 1 + s);
  px(ctx, color, x - 2 - s, y, 2 + s, 1);
  px(ctx, color, x + 2, y, 1 + s, 1);
  px(ctx, '#ffffff', x, y, 1, 1);
}

function glow(ctx, x, y, r, rgb, a) {
  if (a <= 0.01) return;
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'source-over';
}

function newArm() {
  return { raise: 0, raiseT: 0, swing: 0, swingT: 0, droop: 1, droopT: 1, power: 0, powerT: 0, thumb: 0, thumbT: 0, spin: 0, flash: 0, charge: false, off: false, frozen: false };
}

export class Golem {
  constructor(x) {
    this.x = x;
    this.t = 0;
    this.steam = [];
    this.fx = [];
    this.waves = [];
    this.reset();
  }

  reset() {
    this.sit = 1; this.sitT = 1;
    this.eyes = 0; this.eyesT = 0;
    this.chest = 0; this.chestT = 0;
    this.dark = 0; this.darkT = 0;
    this.weak = 0; this.weakT = 0;
    this.head = 1; this.headT = 1;          // 1 = head sunk (asleep)
    this.look = { x: 0, y: 0 }; this.lookT = { x: 0, y: 0 };
    this.expr = 'normal'; this.exprT = 0;
    this.shake = 0;
    this.alarm = 0;
    this.awake = false;
    this.rest = false;                      // the friendly resting pose after the battle
    this.arms = { brush: newArm(), reel: newArm(), prism: newArm(), holo: newArm() };
    this.symbols = null;
    this.warn = null;
    this.autoJump = false;
    this.toolPos = {};
    this.fx.length = 0;
    this.waves.length = 0;
    this.steam.length = 0;
  }

  // ------------------------------------------------------------------ states

  // Bring back a saved battle: which arms are already offline, or the resting pose.
  restore(seen) {
    this.reset();
    for (const [key, id] of Object.entries(ARM_OF)) {
      if (seen.has(`golem-${key}`)) this.arms[id].off = true;
    }
    if (seen.has('golem-graphic')) this.fx.push({ kind: 'bucket', x: this.x - 70, y: G, vy: 0, t: 9, state: 'spilled', spill: 1 });
    if (seen.has('golem-defeated')) this.setRest(true);
  }

  // dormant → awake: eyes flicker on, it stands, steam everywhere
  wake() {
    this.awake = true;
    this.rest = false;
    this.headT = 0;
    this.sitT = 0;
    this.eyesT = 1;
    this.darkT = 1;
    this.shake = 1;
    for (const id of Object.keys(this.arms)) {
      const a = this.arms[id];
      a.droopT = a.off ? 0.55 : 0;
      a.powerT = a.off ? 0 : 1;
    }
    this.puffAll(10);
  }

  // power one arm on (boss introduction / replay)
  relight(id) {
    const a = this.arms[id];
    a.off = false; a.frozen = false;
    a.droopT = 0; a.powerT = 1; a.flash = 1;
    a.raiseT = 1;
    setTimeout(() => { a.raiseT = 0; }, 450);
  }

  windup(id) { const a = this.arms[id]; a.raiseT = 1; a.swingT = 0; a.charge = true; this.alarm = 1; }
  attack(id) { const a = this.arms[id]; a.raiseT = 0; a.swingT = 1; a.flash = 1; this.shake = Math.max(this.shake, 0.5); }
  hold(id) { const a = this.arms[id]; a.swingT = 0.35; a.raiseT = 0.2; a.charge = true; }
  recover(id) { const a = this.arms[id]; a.swingT = 0; a.raiseT = 0; a.charge = false; }

  // an arm shuts down, each in its own way
  disable(id) {
    const a = this.arms[id];
    a.off = true; a.charge = false;
    a.raiseT = 0; a.swingT = 0; a.droopT = 0.55; a.powerT = 0; a.flash = 1;
    this.shake = 1;
    this.setExpr('surprised', 1.6);
    const p = this.toolPos[id] || { x: this.x, y: G - 120 };
    for (let i = 0; i < 8; i++) this.fx.push({ kind: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 70, t: 0, max: 0.6 + Math.random() * 0.4, c: i % 2 ? C.amberL : C.copperL });
    if (id === 'brush') {
      this.fx = this.fx.filter((f) => f.kind !== 'bucket');
      this.fx.push({ kind: 'bucket', x: Math.max(p.x, this.x - 92), y: p.y, vy: -60, t: 0, state: 'fall', spill: 0 });
    }
    if (id === 'reel') { this.fx.push({ kind: 'film', t: 0 }); a.frozen = false; }
    if (id === 'prism') {
      this.fx = this.fx.filter((f) => f.kind !== 'stars');
      this.fx.push({ kind: 'stars', t: 0, x: p.x, y: p.y });
    }
    if (id === 'holo') this.fx.push({ kind: 'success', t: 0 });
    this.puffAll(4);
  }

  setExpr(e, seconds = 1.2) { this.expr = e; this.exprT = seconds; }

  // a goofy reaction when a move doesn't land: it laughs and bobs
  goofy() { this.setExpr('laugh', 1.3); this.shake = Math.max(this.shake, 0.35); }
  nod() { this.setExpr('surprised', 0.5); this.shake = Math.max(this.shake, 0.2); }

  setRest(on) {
    this.rest = on;
    this.awake = false;
    if (on) {
      this.sitT = 1; this.sit = 1; this.eyesT = 0.22; this.eyes = 0.22; this.headT = 0.35; this.head = 0.35;
      this.darkT = 0; this.dark = 0; this.chestT = 0; this.chest = 0; this.weakT = 0; this.weak = 0;
      for (const a of Object.values(this.arms)) { a.off = true; a.droopT = 1; a.droop = 1; a.powerT = 0; a.power = 0; a.raiseT = a.swingT = a.raise = a.swing = 0; a.thumbT = a.thumb = 0; }
      this.fx = this.fx.filter((f) => f.kind === 'bucket');
    }
  }

  // the paintbrush (and the others) fling things at the player
  throwAt(id, target, shapes) {
    const p = this.toolPos[id] || { x: this.x - 40, y: G - 140 };
    shapes.forEach((s, i) => {
      this.fx.push({ kind: 'flyer', t: -i * 0.12, dur: 0.75, x0: p.x, y0: p.y, x1: target.x - 20 + i * 20, y1: target.y - 110 - (i % 2) * 14, c: s.c, shape: s.shape });
    });
  }

  // an energy wave rolls along the floor towards the player; resolves true if he cleared it
  launchWave({ speed = 70, player }) {
    return new Promise((resolve) => {
      this.waves.push({ x: this.x - 48, vx: -speed, done: false, player, resolve, life: 0 });
      this.shake = Math.max(this.shake, 0.7);
      this.puffAll(3);
    });
  }

  showWarning(player, on) { this.warn = on ? { t: 0, x0: this.x - 48, player } : null; }

  releaseSymbols() { this.symbols = { t: 0, orbit: 0, fade: 1 }; }
  endSymbols() { if (this.symbols) this.symbols.ending = true; }

  puffAll(n) {
    const vents = [[-40, -150], [40, -150], [12, -196]];
    for (let i = 0; i < n; i++) {
      const v = vents[i % vents.length];
      this.puff(this.x + v[0], G + v[1] + this.sit * 34);
    }
  }

  puff(x, y) {
    if (this.steam.length > 80) return;
    this.steam.push({ x, y, vx: (Math.random() - 0.5) * 16, vy: -14 - Math.random() * 14, t: 0, max: 1.2 + Math.random() * 0.8, s: 2 + Math.floor(Math.random() * 3) });
  }

  // ------------------------------------------------------------------ update

  update(dt, player, girl) {
    this.t += dt;
    const k = REDUCED_MOTION ? 6 : 1;
    this.sit = toward(this.sit, this.sitT, 1.3 * k, dt);
    this.eyes = toward(this.eyes, this.eyesT, (this.eyesT < this.eyes ? 0.55 : 2.2) * k, dt);
    this.chest = toward(this.chest, this.chestT, 1.4 * k, dt);
    this.dark = toward(this.dark, this.darkT, 0.9 * k, dt);
    this.weak = toward(this.weak, this.weakT, 0.8 * k, dt);
    this.head = toward(this.head, this.headT, 1.6 * k, dt);
    this.look.x = toward(this.look.x, this.lookT.x, 4, dt);
    this.look.y = toward(this.look.y, this.lookT.y, 4, dt);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    this.alarm = Math.max(0, this.alarm - dt * 0.4);
    if (this.exprT > 0) { this.exprT -= dt; if (this.exprT <= 0) this.expr = 'normal'; }

    for (const a of Object.values(this.arms)) {
      a.raise = toward(a.raise, a.raiseT, 3.2, dt);
      a.swing = toward(a.swing, a.swingT, a.swingT > a.swing ? 7 : 2.2, dt);
      a.droop = toward(a.droop, a.droopT, 1.1 * k, dt);
      a.power = toward(a.power, a.powerT, 1.8, dt);
      a.thumb = toward(a.thumb, a.thumbT, 3, dt);
      a.flash = Math.max(0, a.flash - dt * 1.5);
      if (!a.frozen) a.spin += dt * (0.4 + a.power * (a.charge ? 9 : 3)) * MOTION;
    }

    // resting: it sleepily follows the visitor with its eyes
    if (this.rest && player) {
      const d = player.x - this.x;
      this.lookT.x = Math.abs(d) < 160 ? Math.max(-1, Math.min(1, d / 60)) : 0;
    }

    // steam: from the chimney and vents, more when it's weakened
    if ((this.awake || this.rest) && MOTION) {
      this.nextPuff = (this.nextPuff || 0) - dt;
      if (this.nextPuff <= 0) {
        const vy = G + this.sit * 34;
        this.puff(this.x + 12 + this.look.x * 2, vy - 198);
        if (this.weak > 0.2 && Math.random() < this.weak) this.puff(this.x + (Math.random() < 0.5 ? -40 : 40), vy - 150);
        this.nextPuff = this.rest ? 2.6 : this.awake ? 0.55 - this.weak * 0.25 : 1;
      }
    }
    for (const s of this.steam) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.98; }
    this.steam = this.steam.filter((s) => s.t < s.max);

    // effects
    for (const f of this.fx) {
      f.t += dt;
      if (f.kind === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 260 * dt; }
      if (f.kind === 'bucket' && f.state === 'fall') {
        f.vy += 520 * dt; f.y += f.vy * dt; f.x -= 26 * dt;
        if (f.y >= G) { f.y = G; f.state = 'tip'; f.t = 0; this.onEvent?.('bucket'); }
      }
      if (f.kind === 'bucket' && f.state === 'tip' && f.t > 0.25) { f.state = 'spilled'; f.t = 0; }
      if (f.kind === 'bucket' && f.state === 'spilled') f.spill = Math.min(1, f.spill + dt * 1.6);
    }
    this.fx = this.fx.filter((f) => !(f.kind === 'spark' && f.t > f.max) && !(f.kind === 'flyer' && f.t > f.dur + 0.2)
      && !(f.kind === 'film' && f.t > 4.2) && !(f.kind === 'success' && f.t > 3.2));

    if (this.warn) this.warn.t += dt;

    // energy waves
    for (const w of this.waves) {
      w.life += dt;
      w.x += w.vx * dt;
      const p = w.player;
      if (!w.done && p) {
        const dx = w.x - p.x;
        if (this.autoJump && dx > 0 && dx < 34 && p.onGround) p.control.jump = true;
        if (Math.abs(dx) < 14 && p.y < G - 5) { w.done = true; w.passed = true; w.resolve(true); }
        else if (dx < -14) { w.done = true; w.bonk = true; w.resolve(false); this.onEvent?.('bonk'); }
      }
      if (girl && girl.onGround) {
        const dg = w.x - girl.x;
        if (dg > 8 && dg < 26) { girl.control.jump = true; girl.control.jumpHeld = true; }
      }
    }
    this.waves = this.waves.filter((w) => !w.bonk && w.x > this.x - 420);

    // creative symbols: out of the chest, then orbiting him
    if (this.symbols) {
      const s = this.symbols;
      s.t += dt;
      s.orbit = Math.min(1, s.orbit + dt * 0.8);
      if (s.ending) s.fade = Math.max(0, s.fade - dt * 0.8);
      if (s.ending && s.fade <= 0) this.symbols = null;
    }
  }

  // ------------------------------------------------------------------ drawing

  // the room around the fight: lights down, a soft amber alarm glow
  drawRoom(ctx, cam) {
    if (this.dark <= 0.01) return;
    ctx.fillStyle = `rgba(18, 10, 28, ${0.48 * this.dark})`;
    ctx.fillRect(0, 0, cam.viewW, cam.viewH);
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 3);
    if (this.awake) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255, 120, 70, ${0.05 * this.dark * (0.4 + 0.6 * Math.max(this.alarm, pulse * 0.5))})`;
      ctx.fillRect(0, 0, cam.viewW, cam.viewH);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  draw(ctx, cam) {
    this.camX = cam.x; this.camY = cam.y;
    this.drawRoom(ctx, cam);
    const W = cam.viewW;
    const sx = this.x - cam.x;
    if (sx < -260 || sx > W + 260) return;
    const t = this.t;
    const shake = this.shake * MOTION;
    const X = Math.round(sx + Math.sin(t * 47) * 2 * shake);
    const awakeBob = this.awake ? Math.sin(t * 2.2) * 1.5 * MOTION : 0;
    const drop = Math.round(this.sit * 34 + awakeBob + this.weak * 4 + Math.abs(Math.sin(t * 31)) * 2 * shake);
    const feet = Math.round(G - cam.y);
    const oy = feet + drop;

    // steam behind
    for (const s of this.steam) {
      const k = s.t / s.max;
      ctx.globalAlpha = (1 - k) * 0.55;
      const r = s.s + k * 4;
      px(ctx, k < 0.3 ? '#e8e0f0' : '#b8acc8', s.x - cam.x - r / 2, s.y - cam.y - r / 2, r, r);
    }
    ctx.globalAlpha = 1;

    // the paint bucket on the floor (graphic arm)
    for (const f of this.fx) if (f.kind === 'bucket') this.drawBucket(ctx, f, cam);

    // the Boss Book on its little stand, once the battle is won
    if (this.rest) this.drawBook(ctx, Math.round(this.x - 78 - cam.x), feet);

    // back pipes
    for (const s of [-1, 1]) {
      const pxl = X + s * 38;
      thick(ctx, C.ink, pxl, oy - 96, pxl, oy - 150, 7);
      thick(ctx, C.copperD, pxl, oy - 97, pxl, oy - 149, 5);
      px(ctx, C.copperL, pxl - 1, oy - 148, 1, 50);
      px(ctx, C.ink, pxl - 4, oy - 154, 9, 4);
      px(ctx, C.copper, pxl - 3, oy - 153, 7, 2);
    }

    // legs and feet
    const legTop = oy - 44;
    for (const s of [-1, 1]) {
      const lx = X + s * (20 + this.sit * 6);
      const len = Math.max(4, feet - 8 - legTop);
      px(ctx, C.ink, lx - 10, legTop, 20, len + 1);
      px(ctx, C.iron, lx - 9, legTop, 18, len);
      px(ctx, C.ironL, lx - 8, legTop, 3, len);
      if (len > 14) {
        disc(ctx, C.ink, lx, legTop + Math.round(len / 2), 6);
        disc(ctx, C.copper, lx, legTop + Math.round(len / 2), 5);
        px(ctx, C.copperH, lx - 2, legTop + Math.round(len / 2) - 2, 2, 1);
      }
      const fx = lx + s * this.sit * 4;
      rrect(ctx, C.ink, fx - 16, feet - 11, 32, 11, 3);
      rrect(ctx, C.ironM, fx - 15, feet - 10, 30, 9, 2);
      px(ctx, C.ironH, fx - 13, feet - 9, 20, 1);
      px(ctx, C.copperD, fx + (s < 0 ? -15 : 7), feet - 8, 8, 6);
      px(ctx, C.copper, fx + (s < 0 ? -14 : 8), feet - 8, 6, 2);
    }

    // pelvis
    px(ctx, C.ink, X - 33, oy - 54, 66, 13);
    px(ctx, C.ironD, X - 32, oy - 53, 64, 11);
    for (let i = 0; i < 5; i++) px(ctx, C.copperL, X - 26 + i * 13, oy - 49, 2, 2);

    // lower arms go behind the torso's edge
    this.drawArm(ctx, 'prism', X, oy, t);
    this.drawArm(ctx, 'holo', X, oy, t);

    // torso
    const T = oy - 140;
    rrect(ctx, C.ink, X - 45, T - 1, 90, 92, 9);
    rrect(ctx, C.iron, X - 44, T, 88, 90, 8);
    px(ctx, C.ironM, X - 40, T + 6, 10, 78);
    px(ctx, C.ironL, X - 39, T + 8, 3, 72);
    px(ctx, C.ironD, X + 32, T + 6, 9, 78);
    px(ctx, C.copperD, X - 36, T + 2, 72, 6);
    px(ctx, C.copper, X - 36, T + 2, 72, 3);
    px(ctx, C.copperH, X - 34, T + 2, 30, 1);
    for (let i = 0; i < 7; i++) px(ctx, C.copperL, X - 36 + i * 12, T + 10, 2, 2);
    // the wooden belly panel
    px(ctx, C.ink, X - 31, T + 49, 62, 36);
    px(ctx, C.woodD, X - 30, T + 50, 60, 34);
    for (let r = 0; r < 4; r++) {
      px(ctx, C.wood, X - 29, T + 51 + r * 8, 58, 6);
      px(ctx, C.woodL, X - 27 + ((r * 13) % 20), T + 52 + r * 8, 14, 1);
      px(ctx, C.woodD, X - 10 + ((r * 7) % 18), T + 54 + r * 8, 9, 1);
    }
    for (const bx of [-28, 26]) for (const by of [52, 80]) px(ctx, C.copperL, X + bx, T + by, 2, 2);
    // belly gear
    gear(ctx, X + 30, T + 76, 9, this.t * (this.awake ? 1.6 : 0.1) * MOTION, 8, C.ink, C.copper, C.copperH);
    gear(ctx, X - 33, T + 30, 6, -this.t * (this.awake ? 2.2 : 0.1) * MOTION, 7, C.ink, C.copperD, C.copperL);
    // the chest door: a glowing core behind it
    const cx = X, cy = T + 28;
    px(ctx, C.ink, cx - 18, T + 11, 36, 34);
    px(ctx, C.copperD, cx - 17, T + 12, 34, 32);
    px(ctx, C.copper, cx - 16, T + 13, 32, 2);
    const coreA = Math.max(this.eyes * 0.6, this.chest);
    px(ctx, this.chest > 0.02 ? '#ffe7a8' : '#3a2230', cx - 13, T + 16, 26, 24);
    if (this.chest > 0.02) {
      disc(ctx, '#fff6dc', cx, cy, 7);
      glow(ctx, cx, cy, 40, '255, 220, 140', 0.55 * this.chest);
    }
    const doorW = Math.round(26 * (1 - this.chest));
    if (doorW > 1) {
      px(ctx, C.ironM, cx - 13, T + 16, doorW, 24);
      px(ctx, C.ironL, cx - 13, T + 16, Math.min(doorW, 2), 24);
      if (doorW > 14) {
        const pr = Math.round(7 * (doorW / 26));
        disc(ctx, C.ink, cx - 13 + Math.round(doorW / 2), cy, pr + 1);
        disc(ctx, coreA > 0.05 ? C.amber : C.amberD, cx - 13 + Math.round(doorW / 2), cy, pr);
        if (coreA > 0.05) {
          disc(ctx, C.amberL, cx - 13 + Math.round(doorW / 2) - 1, cy - 1, Math.max(1, pr - 4));
          glow(ctx, cx - 13 + doorW / 2, cy, 26, '255, 196, 110', 0.35 * coreA * (0.8 + 0.2 * Math.sin(t * 4)));
        }
      }
    }

    // head
    const hx = X + Math.round(this.look.x * 3 * (1 - this.head));
    const ht = T - 44 + Math.round(this.head * 8 + this.look.y * 2);
    this.drawHead(ctx, hx, ht, t);

    // upper arms in front
    this.drawArm(ctx, 'brush', X, oy, t);
    this.drawArm(ctx, 'reel', X, oy, t);

    // effects attached to the body
    for (const f of this.fx) {
      if (f.kind === 'spark') {
        ctx.globalAlpha = Math.max(0, 1 - f.t / f.max);
        px(ctx, f.c, f.x - cam.x, f.y - cam.y, 2, 2);
        ctx.globalAlpha = 1;
      }
      if (f.kind === 'film') this.drawFilm(ctx, f);
      if (f.kind === 'success') this.drawSuccess(ctx, f);
      if (f.kind === 'stars') this.drawStars(ctx, f, hx, ht, cam);
    }
  }

  drawHead(ctx, hx, ht, t) {
    // chimney
    px(ctx, C.ink, hx + 7, ht - 11, 10, 13);
    px(ctx, C.copperD, hx + 8, ht - 10, 8, 12);
    px(ctx, C.copperL, hx + 9, ht - 10, 1, 11);
    px(ctx, C.ink, hx + 5, ht - 14, 14, 4);
    px(ctx, C.copper, hx + 6, ht - 13, 12, 2);
    // ear gears
    gear(ctx, hx - 28, ht + 24, 6, t * (this.awake ? 3 : 0.1) * MOTION, 6, C.ink, C.copper, C.copperH);
    gear(ctx, hx + 28, ht + 24, 6, -t * (this.awake ? 3 : 0.1) * MOTION, 6, C.ink, C.copper, C.copperH);
    // dome
    rrect(ctx, C.ink, hx - 27, ht - 1, 54, 45, 11);
    rrect(ctx, C.iron, hx - 26, ht, 52, 43, 10);
    px(ctx, C.ironL, hx - 17, ht + 3, 22, 2);
    px(ctx, C.ironH, hx - 13, ht + 3, 8, 1);
    px(ctx, C.ironD, hx + 16, ht + 8, 6, 30);
    // the wooden brow
    px(ctx, C.ink, hx - 29, ht + 11, 58, 9);
    px(ctx, C.woodD, hx - 28, ht + 12, 56, 7);
    px(ctx, C.wood, hx - 27, ht + 13, 54, 4);
    px(ctx, C.woodL, hx - 24, ht + 13, 20, 1);
    px(ctx, C.copperL, hx - 26, ht + 15, 2, 2);
    px(ctx, C.copperL, hx + 24, ht + 15, 2, 2);
    // eyes
    const lx = Math.round(this.look.x * 2), ly = Math.round(this.look.y * 2);
    for (const s of [-1, 1]) {
      const ex = hx + (s < 0 ? -21 : 7), ey = ht + 21;
      px(ctx, C.ink, ex, ey, 14, 10);
      this.drawEye(ctx, ex, ey, lx, ly, s);
    }
    // mouth grille
    const laugh = this.expr === 'laugh' ? (Math.sin(t * 22) > 0 ? 3 : 1) : 0;
    px(ctx, C.ink, hx - 13, ht + 33 + laugh, 26, 8);
    px(ctx, C.copperD, hx - 12, ht + 34 + laugh, 24, 6);
    for (let i = 0; i < 6; i++) px(ctx, C.ink, hx - 10 + i * 4, ht + 35 + laugh, 2, 4);
    if (laugh) px(ctx, '#3a1a20', hx - 12, ht + 33, 24, laugh);
    // eye glow
    if (this.eyes > 0.05) {
      const a = 0.45 * this.eyes;
      glow(ctx, hx - 14, ht + 26, 22, '255, 200, 110', a);
      glow(ctx, hx + 14, ht + 26, 22, '255, 200, 110', a);
    }
  }

  drawEye(ctx, ex, ey, lx, ly, s) {
    const e = this.eyes;
    if (e < 0.04) { px(ctx, '#3a2a2a', ex + 3, ey + 3, 2, 1); return; }
    const col = e > 0.6 ? C.amber : e > 0.3 ? '#c8913a' : '#8a5a2a';
    const hi = e > 0.6 ? C.amberL : C.amber;
    const blink = this.awake && Math.sin(this.t * 0.9 + s) > 0.985;
    if (this.rest || e < 0.35) {
      // sleepy, friendly half-lids
      px(ctx, col, ex + 1, ey + 5, 12, 3);
      px(ctx, hi, ex + 2, ey + 5, 6, 1);
      return;
    }
    if (blink) { px(ctx, col, ex + 1, ey + 5, 12, 2); return; }
    if (this.expr === 'laugh') {
      // happy ^ ^
      px(ctx, col, ex + 1, ey + 6, 3, 2); px(ctx, col, ex + 3, ey + 4, 3, 2); px(ctx, col, ex + 5, ey + 2, 4, 2);
      px(ctx, col, ex + 8, ey + 4, 3, 2); px(ctx, col, ex + 10, ey + 6, 3, 2);
      return;
    }
    if (this.expr === 'surprised') {
      px(ctx, col, ex + 1, ey, 12, 10);
      px(ctx, hi, ex + 2, ey + 1, 10, 2);
      px(ctx, C.ink, ex + 6 + lx, ey + 4 + ly, 2, 2);
      return;
    }
    px(ctx, col, ex + 1, ey + 1, 12, 8);
    px(ctx, hi, ex + 2, ey + 1, 10, 2);
    px(ctx, C.ink, ex + 5 + lx * 2, ey + 4 + ly, 4, 4);
    px(ctx, '#ffffff', ex + 5 + lx * 2, ey + 4 + ly, 1, 1);
  }

  pose(id) {
    const c = ARMS[id];
    const a = this.arms[id];
    const sway = (this.awake && !a.off ? Math.sin(this.t * 1.7 + c.ph) * 6 : Math.sin(this.t * 0.6 + c.ph) * 1.5) * MOTION;
    let a1 = lerp(c.idle[0], c.wind[0], a.raise);
    let a2 = lerp(c.idle[1], c.wind[1], a.raise);
    a1 = lerp(a1, c.hit[0], a.swing);
    a2 = lerp(a2, c.hit[1], a.swing);
    const s = Math.min(1, this.sit * 1.4);
    const down0 = lerp(c.down[0], c.seat[0], s), down1 = lerp(c.down[1], c.seat[1], s);
    a1 = lerp(a1, down0, a.droop) + sway * (1 - a.droop);
    a2 = lerp(a2, down1, a.droop) + sway * 1.4 * (1 - a.droop);
    if (a.thumb > 0) { a1 = lerp(a1, THUMB[0], a.thumb); a2 = lerp(a2, THUMB[1], a.thumb); }
    if (a.charge) { a1 += Math.sin(this.t * 18) * 1.5 * MOTION; a2 += Math.sin(this.t * 14) * 2 * MOTION; }
    return { a1, a2 };
  }

  drawArm(ctx, id, X, oy, t) {
    const c = ARMS[id];
    const a = this.arms[id];
    const { a1, a2 } = this.pose(id);
    const S = [X + c.sx, oy + c.sy];
    const E = [S[0] + Math.cos(rad(a1)) * c.L1, S[1] + Math.sin(rad(a1)) * c.L1];
    const H = [E[0] + Math.cos(rad(a2)) * c.L2, E[1] + Math.sin(rad(a2)) * c.L2];
    const upper = id === 'brush' || id === 'reel';
    // shoulder
    if (upper) {
      gear(ctx, S[0], S[1], 11, (id === 'brush' ? 1 : -1) * t * (this.awake && !a.off ? 1.4 : 0.05) * MOTION, 10, C.ink, C.copper, C.copperH);
      disc(ctx, C.copperD, S[0], S[1], 5);
    } else {
      disc(ctx, C.ink, S[0], S[1], 7);
      disc(ctx, C.ironM, S[0], S[1], 6);
      disc(ctx, C.copper, S[0], S[1], 3);
    }
    // upper arm, elbow, forearm
    thick(ctx, C.ink, S[0], S[1], E[0], E[1], upper ? 10 : 9);
    thick(ctx, C.iron, S[0], S[1], E[0], E[1], upper ? 8 : 7);
    const m = [(S[0] + E[0]) / 2, (S[1] + E[1]) / 2];
    disc(ctx, C.copperD, m[0], m[1], 3);
    disc(ctx, C.ink, E[0], E[1], 6);
    disc(ctx, C.copper, E[0], E[1], 5);
    px(ctx, C.copperH, E[0] - 2, E[1] - 2, 2, 1);
    thick(ctx, C.ink, E[0], E[1], H[0], H[1], 9);
    thick(ctx, C.ironM, E[0], E[1], H[0], H[1], 7);
    thick(ctx, C.ironL, E[0], E[1] - 1, H[0], H[1] - 1, 2);
    disc(ctx, C.ink, H[0], H[1], 5);
    disc(ctx, C.copperD, H[0], H[1], 4);
    // the creative tool
    const d = [Math.cos(rad(a2)), Math.sin(rad(a2))];
    if (a.thumb > 0.4) { this.drawThumb(ctx, H, a.thumb); return; }
    if (id === 'brush') this.drawBrush(ctx, H, d, a, t);
    if (id === 'reel') this.drawReel(ctx, H, d, a, t);
    if (id === 'prism') this.drawPrism(ctx, H, d, a, t);
    if (id === 'holo') this.drawHolo(ctx, H, d, a, t);
  }

  // remember where each tool is (in world space) for effects
  mark(id, x, y) { this.toolPos[id] = { x: x + this.camX, y: y + this.camY }; }

  drawWarnMark(ctx, x, y, a) {
    if (!a.charge) return;
    const on = Math.sin(this.t * 10) > -0.2;
    if (!on) return;
    px(ctx, C.ink, x - 2, y - 13, 5, 11);
    px(ctx, C.amber, x - 1, y - 12, 3, 6);
    px(ctx, C.amber, x - 1, y - 5, 3, 2);
  }

  drawBrush(ctx, H, d, a, t) {
    const p = (k) => [H[0] + d[0] * k, H[1] + d[1] * k];
    const h1 = p(2), h2 = p(24), f2 = p(30);
    thick(ctx, C.ink, h1[0], h1[1], h2[0], h2[1], 6);
    thick(ctx, C.woodL, h1[0], h1[1], h2[0], h2[1], 4);
    thick(ctx, C.ink, h2[0], h2[1], f2[0], f2[1], 8);
    thick(ctx, C.copper, h2[0], h2[1], f2[0], f2[1], 6);
    for (let k = 0; k <= 16; k++) {
      const q = p(30 + k);
      const w = Math.max(3, Math.round(9 - k * 0.35));
      const col = a.power > 0.3 ? PAINT[Math.min(PAINT.length - 1, Math.floor(k / 3.5))] : k > 10 ? '#5a4a40' : '#7a6a5a';
      px(ctx, C.ink, q[0] - w / 2 - 1, q[1] - w / 2 - 1, w + 2, w + 2);
      px(ctx, col, q[0] - w / 2, q[1] - w / 2, w, w);
    }
    const tip = p(48);
    if (a.power > 0.3 && MOTION) {
      const drip = (t * 0.9) % 1;
      px(ctx, PAINT[Math.floor(t) % PAINT.length], tip[0], tip[1] + drip * 10, 2, 3);
    }
    if (a.charge || a.flash) glow(ctx, tip[0], tip[1], 26, '255, 150, 110', 0.4 * Math.max(a.flash, a.charge ? 0.6 + 0.4 * Math.sin(t * 10) : 0));
    this.mark('brush', tip[0], tip[1]);
    this.drawWarnMark(ctx, tip[0], tip[1] - 10, a);
  }

  drawReel(ctx, H, d, a, t) {
    const R = [H[0] + d[0] * 11, H[1] + d[1] * 11];
    // film ribbon trailing from the reel
    for (let k = 0; k < 6; k++) {
      const ang = 0.9 + k * 0.18 + (a.frozen ? 0 : Math.sin(t * 2 + k) * 0.08 * MOTION);
      const fx = R[0] + Math.cos(ang) * (12 + k * 6), fy = R[1] + Math.sin(ang) * (12 + k * 6);
      px(ctx, C.ink, fx - 3, fy - 3, 7, 7);
      px(ctx, a.power > 0.3 ? (k % 2 ? C.cream : C.lavender) : '#6a6070', fx - 2, fy - 2, 5, 5);
    }
    disc(ctx, C.ink, R[0], R[1], 16);
    disc(ctx, C.ironD, R[0], R[1], 15);
    disc(ctx, a.power > 0.3 ? C.ironL : C.iron, R[0], R[1], 13);
    for (let k = 0; k < 5; k++) {
      const ang = a.spin + (k * Math.PI * 2) / 5;
      disc(ctx, C.ink, R[0] + Math.cos(ang) * 8, R[1] + Math.sin(ang) * 8, 3);
    }
    disc(ctx, C.copper, R[0], R[1], 4);
    px(ctx, C.copperH, R[0] - 1, R[1] - 1, 2, 1);
    // the timeline mechanism under it, with a moving playhead
    const ty = R[1] + 19;
    px(ctx, C.ink, R[0] - 15, ty, 30, 5);
    px(ctx, C.copperD, R[0] - 14, ty + 1, 28, 3);
    for (let k = 0; k < 5; k++) px(ctx, C.copperL, R[0] - 12 + k * 6, ty + 1, 1, 1);
    const ph = a.frozen ? 10 : ((t * 14) % 28);
    if (a.power > 0.2 || a.frozen) px(ctx, a.frozen ? '#8a8098' : C.amber, R[0] - 14 + ph, ty - 2, 2, 9);
    if (a.charge || a.flash) glow(ctx, R[0], R[1], 30, '190, 150, 255', 0.45 * Math.max(a.flash, a.charge ? 0.6 + 0.4 * Math.sin(t * 9) : 0));
    this.mark('reel', R[0], R[1]);
    this.drawWarnMark(ctx, R[0], R[1] - 20, a);
  }

  drawPrism(ctx, H, d, a, t) {
    const P = [H[0] + d[0] * 9, H[1] + d[1] * 9 - 2];
    const rot = a.spin * 0.6;
    const v = (r, k) => [P[0] + Math.cos(rot + (k * Math.PI * 2) / 3 - Math.PI / 2) * r, P[1] + Math.sin(rot + (k * Math.PI * 2) / 3 - Math.PI / 2) * r];
    const lit = a.power > 0.3;
    if (lit) {
      // little rainbow rays
      const cols = [C.brick, C.peach, C.gold, C.sage, C.lavender];
      cols.forEach((col, i) => {
        const ang = rot * 1.5 + i * 1.25;
        const len = 8 + 4 * Math.sin(t * 6 + i);
        ctx.globalAlpha = 0.8;
        thick(ctx, col, P[0] + Math.cos(ang) * 12, P[1] + Math.sin(ang) * 12, P[0] + Math.cos(ang) * (12 + len), P[1] + Math.sin(ang) * (12 + len), 2);
      });
      ctx.globalAlpha = 1;
    }
    tri(ctx, C.ink, v(14, 0), v(14, 1), v(14, 2));
    tri(ctx, lit ? C.lavender : '#5e5868', v(12, 0), v(12, 1), v(12, 2));
    tri(ctx, lit ? '#e8dcff' : '#7a7484', v(6, 0), v(6, 1), v(6, 2));
    if (lit) {
      const b = v(12, 1), c2 = v(12, 2);
      thick(ctx, C.peach, b[0] + 2, b[1] - 1, c2[0] - 2, c2[1] - 1, 1);
      glow(ctx, P[0], P[1], 26, '200, 170, 255', 0.35 + 0.25 * Math.max(a.flash, a.charge ? 0.5 + 0.5 * Math.sin(t * 9) : 0));
    }
    this.mark('prism', P[0], P[1]);
    this.drawWarnMark(ctx, P[0], P[1] - 18, a);
  }

  drawHolo(ctx, H, d, a, t) {
    const B = [H[0] + d[0] * 7, H[1] + d[1] * 7];
    px(ctx, C.ink, B[0] - 9, B[1] - 7, 18, 13);
    px(ctx, C.ironM, B[0] - 8, B[1] - 6, 16, 11);
    px(ctx, C.copperD, B[0] - 8, B[1] - 6, 16, 2);
    disc(ctx, C.ink, B[0] - 2, B[1] - 7, 4);
    disc(ctx, a.power > 0.3 ? C.tealL : '#3a4a50', B[0] - 2, B[1] - 7, 3);
    if (a.power > 0.3) {
      const k = a.power;
      const flick = MOTION && Math.sin(t * 37) > 0.93 ? 0.4 : 1;
      const top = B[1] - 44, L = B[0] - 18;
      // light cone
      ctx.globalAlpha = 0.18 * k * flick;
      tri(ctx, C.tealL, [B[0] - 2, B[1] - 8], [L, top + 22], [L + 32, top + 22]);
      ctx.globalAlpha = 0.75 * k * flick;
      // the hologram: a tiny interface
      px(ctx, '#2b7a78', L, top, 32, 22);
      px(ctx, C.tealL, L, top, 32, 1); px(ctx, C.tealL, L, top + 21, 32, 1);
      px(ctx, C.tealL, L, top, 1, 22); px(ctx, C.tealL, L + 31, top, 1, 22);
      px(ctx, C.tealL, L + 3, top + 3, 26, 3);
      px(ctx, '#bff5ec', L + 3, top + 8, 11, 8);
      px(ctx, '#8fe0d4', L + 16, top + 8, 13, 2); px(ctx, '#8fe0d4', L + 16, top + 12, 9, 2);
      px(ctx, C.amber, L + 18, top + 16, 10, 3);
      for (let y = top + (Math.floor(t * 20) % 3); y < top + 22; y += 3) px(ctx, 'rgba(255,255,255,0.12)', L, y, 32, 1);
      ctx.globalAlpha = 1;
      if (a.charge || a.flash) glow(ctx, L + 16, top + 11, 30, '120, 230, 210', 0.4 * Math.max(a.flash, a.charge ? 0.6 + 0.4 * Math.sin(t * 9) : 0));
      this.mark('holo', L + 16, top + 11);
      this.drawWarnMark(ctx, L + 16, top - 4, a);
    } else {
      this.mark('holo', B[0], B[1] - 20);
    }
  }

  drawThumb(ctx, H, k) {
    const x = Math.round(H[0]), y = Math.round(H[1]);
    // a big iron fist…
    px(ctx, C.ink, x - 9, y - 9, 19, 17);
    px(ctx, C.ironL, x - 8, y - 8, 17, 15);
    px(ctx, C.ironH, x - 8, y - 8, 17, 2);
    for (let i = 0; i < 4; i++) px(ctx, C.ironD, x - 7, y - 4 + i * 3, 13, 1);
    px(ctx, C.copperL, x + 5, y - 6, 2, 2);
    // …with a copper thumb pointing up
    px(ctx, C.ink, x - 5, y - 23, 9, 15);
    px(ctx, C.copper, x - 4, y - 22, 7, 14);
    px(ctx, C.copperH, x - 4, y - 22, 2, 10);
    px(ctx, C.copperD, x - 4, y - 22, 7, 2);
    if (k > 0.9) {
      const tw = Math.sin(this.t * 10) > 0 ? 1 : 0;
      star(ctx, C.amberL, x + 11, y - 24, tw);
      star(ctx, C.peach, x - 12, y - 18, 1 - tw);
      glow(ctx, x, y - 14, 24, '255, 210, 140', 0.35);
    }
  }

  drawBucket(ctx, f, cam) {
    const x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y);
    if (f.state === 'spilled' || f.state === 'tip') {
      const s = f.spill || 0;
      ellipse(ctx, '#7a3040', x - 12, y - 1, Math.round(6 + 12 * s), 2);
      ellipse(ctx, C.brick, x - 14, y - 1, Math.round(4 + 7 * s), 1);
      ellipse(ctx, C.gold, x - 6, y - 1, Math.round(2 + 5 * s), 1);
      ellipse(ctx, C.lavender, x - 22, y - 1, Math.round(1 + 4 * s), 1);
      ellipse(ctx, C.sage, x - 2, y, Math.round(1 + 3 * s), 1);
      // the bucket on its side
      px(ctx, C.ink, x - 1, y - 11, 13, 11);
      px(ctx, C.copper, x, y - 10, 11, 9);
      px(ctx, C.copperH, x + 2, y - 10, 1, 9);
      px(ctx, C.woodD, x + 7, y - 10, 2, 9);
      px(ctx, C.brick, x, y - 9, 2, 7);
    } else {
      px(ctx, C.ink, x - 6, y - 12, 13, 13);
      px(ctx, C.copper, x - 5, y - 11, 11, 11);
      px(ctx, C.copperH, x - 4, y - 11, 1, 11);
      px(ctx, C.brick, x - 5, y - 11, 11, 2);
      px(ctx, C.gold, x - 2, y - 11, 4, 1);
    }
  }

  drawBook(ctx, x, feet) {
    // a wooden lectern with an open, softly glowing book
    px(ctx, C.ink, x - 2, feet - 22, 5, 22);
    px(ctx, C.wood, x - 1, feet - 22, 3, 22);
    px(ctx, C.ink, x - 8, feet - 2, 17, 2);
    px(ctx, C.ink, x - 10, feet - 27, 21, 6);
    px(ctx, C.woodL, x - 9, feet - 26, 19, 4);
    px(ctx, C.ink, x - 10, feet - 31, 21, 5);
    px(ctx, C.cream, x - 9, feet - 31, 9, 4);
    px(ctx, C.cream, x + 1, feet - 31, 9, 4);
    px(ctx, '#c8b8a8', x, feet - 31, 1, 4);
    for (let i = 0; i < 2; i++) { px(ctx, '#a8968a', x - 7, feet - 30 + i * 2, 6, 1); px(ctx, '#a8968a', x + 2, feet - 30 + i * 2, 6, 1); }
    const k = 0.5 + 0.5 * Math.sin(this.t * 2.4);
    glow(ctx, x, feet - 32, 18, '255, 220, 150', 0.22 + 0.15 * k);
    if (MOTION) {
      const life = (this.t * 0.5) % 1;
      ctx.globalAlpha = 1 - life;
      px(ctx, C.amberL, x - 4 + Math.sin(this.t * 3) * 4, feet - 34 - life * 14, 1, 1);
      ctx.globalAlpha = 1;
    }
  }

  drawFilm(ctx, f) {
    const p = this.toolPos.reel;
    if (!p) return;
    const x = Math.round(p.x - this.camX) - 13, y = Math.round(p.y - this.camY) - 46;
    const a = f.t < 0.2 ? f.t / 0.2 : f.t > 3.6 ? Math.max(0, 1 - (f.t - 3.6) / 0.6) : 1;
    ctx.globalAlpha = a;
    px(ctx, C.ink, x - 1, y - 1, 28, 21);
    px(ctx, C.cream, x, y, 26, 19);
    const frozen = f.t > 1.8;
    const frame = frozen ? 2 : Math.floor(f.t * 9) % 4;
    const by = [12, 6, 3, 6][frame];
    px(ctx, '#d8c8b0', x + 2, y + 16, 22, 1);
    disc(ctx, C.brick, x + 6 + frame * 4, y + by, 2);
    if (frozen) {
      px(ctx, 'rgba(60,50,80,0.35)', x, y, 26, 19);
      px(ctx, C.ink, x + 10, y + 5, 2, 8);
      px(ctx, C.ink, x + 14, y + 5, 2, 8);
    }
    ctx.globalAlpha = 1;
  }

  drawSuccess(ctx, f) {
    const p = this.toolPos.holo;
    if (!p) return;
    const x = Math.round(p.x - this.camX) - 22, y = Math.round(p.y - this.camY) - 40;
    const flick = MOTION && Math.sin(f.t * 41) > 0.9 ? 0.5 : 1;
    const a = (f.t < 0.25 ? f.t / 0.25 : f.t > 2.6 ? Math.max(0, 1 - (f.t - 2.6) / 0.6) : 1) * flick;
    ctx.globalAlpha = 0.85 * a;
    px(ctx, '#2b7a78', x, y, 44, 28);
    px(ctx, C.tealL, x, y, 44, 1); px(ctx, C.tealL, x, y + 27, 44, 1);
    px(ctx, C.tealL, x, y, 1, 28); px(ctx, C.tealL, x + 43, y, 1, 28);
    // a big check mark
    const cx = x + 13, cy = y + 15;
    for (let i = 0; i < 4; i++) px(ctx, '#d8fff4', cx - 4 + i, cy - 1 + i, 2, 2);
    for (let i = 0; i < 8; i++) px(ctx, '#d8fff4', cx + i, cy + 2 - i, 2, 2);
    px(ctx, C.tealL, x + 25, y + 9, 14, 3);
    px(ctx, C.tealL, x + 25, y + 15, 10, 2);
    px(ctx, C.amber, x + 25, y + 20, 12, 3);
    ctx.globalAlpha = 1;
    glow(ctx, x + 22, y + 14, 34, '120, 230, 210', 0.3 * a);
  }

  drawStars(ctx, f, hx, ht, cam) {
    const cols = [C.brick, C.peach, C.sage, C.lavender];
    const k = Math.min(1, f.t / 1.1);
    const fade = this.symbols ? Math.max(0, 1 - this.symbols.t / 1.2) : 1;
    ctx.globalAlpha = fade;
    cols.forEach((col, i) => {
      const ang = this.t * 2.2 + (i * Math.PI) / 2;
      const ox = hx + Math.cos(ang) * 30, oy = ht - 8 + Math.sin(ang) * 6;
      const sx = f.x - cam.x, sy = f.y - cam.y;
      const x = lerp(sx, ox, k * k), y = lerp(sy, oy, k) - Math.sin(k * Math.PI) * 20;
      const tw = Math.sin(this.t * 8 + i * 2) > 0 ? 1 : 0;
      star(ctx, col, x, y, tw);
    });
    ctx.globalAlpha = 1;
  }

  // in front of the characters: flying pieces, energy waves, warnings, creative symbols
  drawFront(ctx, cam, player) {
    const t = this.t;
    for (const f of this.fx) {
      if (f.kind !== 'flyer' || f.t < 0) continue;
      const k = Math.min(1, f.t / f.dur);
      const x = lerp(f.x0, f.x1, k) - cam.x, y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 40 - cam.y;
      ctx.globalAlpha = k > 0.85 ? Math.max(0, 1 - (k - 0.85) / 0.35) : 1;
      if (f.shape === 'circle') { disc(ctx, C.ink, x, y, 6); disc(ctx, f.c, x, y, 5); }
      else if (f.shape === 'tri') { tri(ctx, C.ink, [x, y - 7], [x - 7, y + 5], [x + 7, y + 5]); tri(ctx, f.c, [x, y - 5], [x - 5, y + 4], [x + 5, y + 4]); }
      else if (f.shape === 'node') { px(ctx, C.ink, x - 7, y - 5, 14, 10); px(ctx, f.c, x - 6, y - 4, 12, 8); px(ctx, '#ffffff', x - 5, y - 3, 6, 1); }
      else { px(ctx, C.ink, x - 9, y - 4, 18, 8); px(ctx, f.c, x - 8, y - 3, 16, 6); }
      ctx.globalAlpha = 1;
    }
    // warning: a glowing path along the floor and a target at his feet
    if (this.warn && this.warn.player) {
      const p = this.warn.player;
      const gy = Math.round(G - cam.y);
      const x0 = this.warn.x0 - cam.x, x1 = p.x - cam.x;
      const pulse = 0.5 + 0.5 * Math.sin(this.warn.t * 9);
      for (let i = 0; i < 6; i++) {
        const k = ((this.warn.t * 0.9 + i / 6) % 1);
        const cx = lerp(x0, x1, k);
        ctx.globalAlpha = 0.35 + 0.5 * (1 - Math.abs(k - 0.5) * 2);
        px(ctx, C.amber, cx - 2, gy - 3, 2, 1); px(ctx, C.amber, cx - 4, gy - 2, 2, 1); px(ctx, C.amber, cx - 2, gy - 1, 2, 1);
      }
      ctx.globalAlpha = 0.4 + 0.5 * pulse;
      ellipse(ctx, C.amber, x1, gy, 13, 2);
      ellipse(ctx, C.amberL, x1, gy, 7, 1);
      ctx.globalAlpha = 1;
      glow(ctx, x1, gy - 2, 24, '255, 200, 110', 0.25 + 0.25 * pulse);
    }
    // energy waves
    for (const w of this.waves) {
      const x = Math.round(w.x - cam.x), gy = Math.round(G - cam.y);
      for (let i = -9; i <= 9; i++) {
        const h = Math.round(Math.cos((i / 9) * Math.PI / 2) * 13 * (0.85 + 0.15 * Math.sin(t * 18 + i)));
        if (h <= 0) continue;
        px(ctx, C.ink, x + i, gy - h - 1, 1, h + 1);
        px(ctx, i % 3 ? C.lavender : '#d8c8ff', x + i, gy - h, 1, h);
        px(ctx, C.amberL, x + i, gy - h, 1, 1);
      }
      glow(ctx, x, gy - 6, 26, '190, 150, 255', 0.45);
      if (MOTION) for (let j = 0; j < 3; j++) px(ctx, C.amberL, x + 8 + j * 5 + Math.sin(t * 20 + j) * 2, gy - 4 - ((t * 30 + j * 7) % 12), 1, 1);
    }
    // the four creative symbols: out of his chest, then orbiting the boy
    if (this.symbols && player) {
      const s = this.symbols;
      const ids = ['graphic', 'motion', 'visual', 'product'];
      const chestX = this.x - cam.x, chestY = G + this.sit * 34 - 112 - cam.y;
      const hx = player.x - cam.x, hy = player.y - cam.y - 46;
      ctx.globalAlpha = s.fade;
      ids.forEach((id, i) => {
        const delay = i * 0.18;
        const e = Math.max(0, Math.min(1, (s.t - delay) / 1.1));
        const ang = s.t * 1.8 + (i / 4) * Math.PI * 2;
        const ox = hx + Math.cos(ang) * 30 * s.orbit, oy = hy + Math.sin(ang) * 12 * s.orbit;
        const x = lerp(chestX, ox, e * e * (3 - 2 * e)), y = lerp(chestY, oy, e) - Math.sin(e * Math.PI) * 30;
        glow(ctx, x, y, 16, '255, 230, 170', 0.5 * s.fade);
        drawHatIcon(ctx, id, x, y, 0.95);
      });
      ctx.globalAlpha = 1;
    }
  }

  // called before drawing: where the camera is (to map tool positions to world space)
  setCamera(cam) { this.camX = cam.x; this.camY = cam.y; }
}
