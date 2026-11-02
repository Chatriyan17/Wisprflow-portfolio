// Layered world renderer: parallax backgrounds, the baked main layer, animated
// details (water, smoke, grass, lights) and the atmospheric lighting pass.
// Characters are drawn by the game between the main layer and the front pass.

import { WORLD, REDUCED_MOTION } from '../config.js';
import { makeCanvas } from '../engine/assets.js';
import { rng } from '../engine/rng.js';
import { px, disc, bayer } from './pixel.js';
import * as Art from './art.js';
import {
  TERRAIN, BRIDGE, PLATFORMS, CRATES, PROPS, LIGHTS, SMOKE, WATERFALL, POND,
} from './level.js';

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
    layer(0.12, (ctx, w) => Art.paintMountains(ctx, w, G - 40, rng(7)));
    layer(0.25, (ctx, w) => Art.paintRuinsAndIslands(ctx, w, G - 20, rng(11)));
    layer(0.42, (ctx, w) => Art.paintHills(ctx, w, G + 4, rng(13)));
    layer(0.65, (ctx, w) => {
      const rr = rng(17);
      for (let x = 30; x < w; x += rr.int(60, 120)) {
        Art.paintTree(ctx, rr, x, G + 2, { h: rr.int(90, 150), r: rr.int(24, 40), kind: rr.chance(0.35) ? 'blossom' : 'green' });
      }
      for (let x = 0; x < w; x += rr.int(40, 80)) Art.paintBush(ctx, rr, x, G + 4, rr.range(0.8, 1.4), rr.chance(0.3) ? 'blossom' : 'green');
      px(ctx, '#4f6a2c', 0, G + 2, w, 200);
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
    const [front, fctx] = makeCanvas(WORLD.width, LAYER_H);
    fctx.translate(0, OY);
    Art.paintBridgeRail(fctx, BRIDGE.x0 - 2, BRIDGE.x1 - 6, BRIDGE.y + 6);
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
    for (const [x0, x1, top] of TERRAIN) {
      for (let x = x0 + 2; x < x1 - 2; x += br.int(3, 7)) {
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
    for (let i = 0; i < (REDUCED_MOTION ? 0 : 46); i++) {
      const anchor = LIGHTS[i % LIGHTS.length];
      this.fireflies.push({ ax: anchor.x + pr.range(-90, 90), ay: anchor.y + pr.range(-40, 50), p: pr.range(0, 10), s: pr.range(0.4, 1) });
    }
  }

  paintMain(ctx) {
    const r = rng(4242);
    const bottom = WORLD.height + 10;
    Art.paintBackCliff(ctx, r, 1326, 1536, WATERFALL.top - 12, bottom);
    Art.paintPondBase(ctx, POND.x0 - 4, POND.x1 + 4, POND.y, bottom);

    // props behind the terrain lip (big tree canopy etc.)
    const sorted = [...TERRAIN].sort((a, b) => b[2] - a[2]);
    for (const [x0, x1, top] of sorted) Art.paintTerrainBlock(ctx, r, x0, x1, top, bottom);

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
    for (const p of this.smoke) {
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
    // main layer slice
    blit(ctx, this.main, cam.x, cam.y + OY, W, H, 0, 0);

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

  drawSmoke(ctx, cam) {
    for (const p of this.smoke) {
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = 0.55 * a;
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

    // petals (screen space with parallax)
    for (const p of this.petals) {
      const x = ((p.x + p.vx * t - cam.x * 0.9) % (W + 40) + W + 40) % (W + 40) - 20;
      const y = ((p.y + p.vy * t + Math.sin(t + p.p) * 6) % (H + 40) + H + 40) % (H + 40) - 20;
      px(ctx, p.c, x, y, Math.sin(t * 3 + p.p) > 0 ? 2 : 1, 1);
    }

    this.drawLighting(ctx, cam);

    // foreground foliage (parallax 1.25) framing the bottom edge
    const bottomY = H + 4;
    for (const f of this.fg) {
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
    for (const L of LIGHTS) {
      const x = L.x - cam.x, y = L.y - cam.y;
      if (x < -L.r || x > W + L.r || y < -L.r || y > H + L.r) continue;
      const flicker = REDUCED_MOTION ? 1 : 0.85 + Math.sin(t * 7 + L.x) * 0.06 + Math.sin(t * 13 + L.y) * 0.05;
      const rg = ctx.createRadialGradient(x, y, 1, x, y, L.r * flicker);
      rg.addColorStop(0, 'rgba(255, 200, 120, 0.42)');
      rg.addColorStop(0.4, 'rgba(255, 160, 80, 0.14)');
      rg.addColorStop(1, 'rgba(255, 140, 60, 0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
    }
    // fireflies
    for (const f of this.fireflies) {
      const x = f.ax + Math.sin(t * f.s + f.p) * 22 - cam.x;
      const y = f.ay + Math.cos(t * f.s * 1.3 + f.p) * 14 - cam.y;
      const on = (Math.sin(t * 2.2 + f.p * 3) + 1) / 2;
      if (on < 0.35) continue;
      ctx.globalAlpha = on;
      px(ctx, '#fff2a8', x, y, 1, 1);
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
