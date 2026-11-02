import { VIEW, WORLD, SCROLL, REDUCED_MOTION } from './config.js';
import { loadImage, loadJSON, makeCanvas } from './engine/assets.js';
import { Input } from './engine/input.js';
import { Camera } from './engine/camera.js';
import { SpriteSheet } from './engine/sprite.js';
import { clamp } from './engine/rng.js';
import { Character } from './entities/character.js';
import { Companion } from './entities/companion.js';
import { WorldRenderer } from './world/renderer.js';
import { buildSolids, INTERACTABLES, WATERFALL, LANDMARKS } from './world/level.js';
import { Dialogue } from './systems/dialogue.js';
import { Bubbles } from './systems/bubbles.js';
import { Story } from './systems/story.js';
import { Audio } from './systems/audio.js';
import { HUD } from './ui/hud.js';
import { playIntro } from './cinematics/intro.js';
import { SCRIPTS, MODE_HINTS, CHAPTER_01 } from './content/chapter01.js';

const G = WORLD.ground;
const IS_TOUCH = matchMedia('(pointer: coarse)').matches;

class Game {
  constructor() {
    this.canvas = document.getElementById('world');
    this.ctx = this.canvas.getContext('2d');
    this.phase = 'loading';
    this.mode = 'scroll';
    this.tickers = new Set();
    this.introSkipped = false;
    this.busy = false;           // an interaction is running
    this.scrollTarget = SCROLL.startX;
    this.lastTime = 0;
  }

  // ---------------------------------------------------------------- setup

  async init() {
    const bar = document.querySelector('.loader__bar span');
    const step = (p) => { bar.style.width = `${p}%`; };
    step(10);
    const fontsReady = Promise.race([
      Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('16px "Pixelify Sans"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]).catch(() => {});
    const [boyImg, boyMeta, girlImg, girlMeta] = await Promise.all([
      loadImage('assets/sprites/boy.png'), loadJSON('assets/sprites/boy.json'),
      loadImage('assets/sprites/girl.png'), loadJSON('assets/sprites/girl.json'),
    ]);
    step(45);
    await fontsReady;
    step(60);
    await new Promise((r) => setTimeout(r, 30));

    this.solids = buildSolids();
    this.renderer = new WorldRenderer();
    this.renderer.build();
    step(90);

    this.camera = new Camera(WORLD);
    this.player = new Character({ name: 'boy', sheet: new SpriteSheet(boyImg, boyMeta), x: SCROLL.startX, y: G, w: 14, h: 64 });
    this.girl = new Companion({ name: 'girl', sheet: new SpriteSheet(girlImg, girlMeta), x: SCROLL.startX - 34, y: G });
    this.girl.leader = this.player;
    this.characters = [this.girl, this.player];

    this.input = new Input();
    this.audio = new Audio();
    this.hud = new HUD();
    this.bubbles = new Bubbles(document.getElementById('bubbles'));
    this.dialogue = new Dialogue({
      audio: this.audio,
      live: document.getElementById('sr-live'),
      onSpeaker: (who) => {
        this.player.talking = who === 'boy';
        this.girl.talking = who === 'girl';
      },
    });
    this.story = new Story({ onBeat: (b) => this.onBeat(b) });

    this.buffer = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindUI();
    this.bindInput();

    step(100);
    this.camera.follow(this.player, 0, true);
    requestAnimationFrame((t) => this.frame(t));
    await new Promise((r) => setTimeout(r, 250));
    this.setPhase('intro');
    const result = await playIntro(this);
    if (result.skipped) this.begin();
    else this.awaitStart();
  }

  setPhase(phase) {
    this.phase = phase;
    document.body.classList.remove('phase-loading', 'phase-intro', 'phase-press', 'phase-play');
    document.body.classList.add(`phase-${phase}`);
  }

  onTick(fn) { this.tickers.add(fn); }
  offTick(fn) { this.tickers.delete(fn); }

  say(lines, opts) {
    return this.dialogue.play(lines, opts);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let s = h / VIEW.targetHeight;
    if (w / s < VIEW.minWidth) s = w / VIEW.minWidth;
    if (w / s > 1100) s = w / 1100;
    this.scale = s;
    const vw = Math.ceil(w / s);
    const vh = Math.ceil(h / s);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    [this.buffer, this.bctx] = makeCanvas(vw, vh);
    this.camera.resize(vw, vh);
    this.updateScrollTrack();
  }

  // ---------------------------------------------------------------- flow

  awaitStart() {
    this.setPhase('press');
    const start = (e) => {
      if (e && e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey)) return;
      window.removeEventListener('keydown', start, true);
      window.removeEventListener('pointerdown', start, true);
      if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
      this.begin();
    };
    window.addEventListener('keydown', start, true);
    window.addEventListener('pointerdown', start, true);
  }

  begin() {
    if (this.phase === 'play') return;
    this.setPhase('play');
    this.girl.scripted = false;
    this.audio.sfx('start');
    this.setMode('scroll', { silent: true });
    this.later(0.6, () => this.bubbles.say(this.girl, MODE_HINTS.scroll, { duration: 5 }));
    this.hud.toast(IS_TOUCH ? 'Swipe up to travel · or switch to Explore World' : 'Scroll to travel · or press ← → to explore freely', 3800);
  }

  later(seconds, fn) {
    let t = 0;
    const tick = (dt) => {
      t += dt;
      if (t >= seconds) { this.offTick(tick); fn(); }
    };
    this.onTick(tick);
  }

  setMode(mode, { silent = false } = {}) {
    if (this.mode === mode && !silent) return;
    this.mode = mode;
    document.body.classList.toggle('mode-scroll', mode === 'scroll');
    document.body.classList.toggle('mode-explore', mode === 'explore');
    this.hud.setMode(mode);
    this.input.captureScrollKeys = mode === 'explore';
    if (mode === 'scroll') {
      this.updateScrollTrack();
      const y = (clamp(this.player.x, SCROLL.startX, SCROLL.endX) - SCROLL.startX) * SCROLL.pxPerWorldPx;
      this.ignoreScroll = true;
      window.scrollTo({ top: y, behavior: 'instant' });
      this.scrollTarget = this.player.x;
      requestAnimationFrame(() => { this.ignoreScroll = false; });
      if (!silent) {
        this.hud.toast('Scroll Journey · scroll to travel the path');
        this.bubbles.say(this.girl, MODE_HINTS.scroll, { duration: 3.5 });
      }
    } else {
      this.player.autopilot = null;
      this.player.control.move = 0;
      if (!silent) {
        this.hud.toast(IS_TOUCH ? 'Explore World · use the on-screen buttons' : 'Explore World · WASD / arrows to move, SPACE to jump, E to interact');
        this.bubbles.say(this.girl, IS_TOUCH ? MODE_HINTS.touch : MODE_HINTS.explore, { duration: 4 });
      }
    }
  }

  updateScrollTrack() {
    const track = document.getElementById('scroll-track');
    const len = (SCROLL.endX - SCROLL.startX) * SCROLL.pxPerWorldPx;
    track.style.height = `${Math.round(len + window.innerHeight)}px`;
  }

  // ---------------------------------------------------------------- input

  bindUI() {
    document.getElementById('skip-intro').addEventListener('click', () => { this.introSkipped = true; });
    // Mouse clicks hand keyboard focus back to the world; keyboard activation keeps focus.
    const release = (e) => { if (e.detail > 0) e.currentTarget.blur(); };
    const modeScroll = document.getElementById('mode-scroll');
    const modeExplore = document.getElementById('mode-explore');
    const sound = document.getElementById('sound-toggle');
    modeScroll.addEventListener('click', (e) => { release(e); this.setMode('scroll'); });
    modeExplore.addEventListener('click', (e) => { release(e); this.setMode('explore'); });
    sound.addEventListener('click', (e) => { release(e); this.toggleSound(); });
    document.getElementById('story-open').addEventListener('click', () => this.openStory());
    document.getElementById('interact-prompt').addEventListener('click', () => this.tryInteract());

    window.addEventListener('scroll', () => {
      if (this.mode !== 'scroll' || this.ignoreScroll) return;
      this.scrollTarget = SCROLL.startX + window.scrollY / SCROLL.pxPerWorldPx;
    }, { passive: true });

    let wheelHintAt = 0;
    window.addEventListener('wheel', (e) => {
      if (this.phase !== 'play' || this.mode !== 'explore' || this.hud.cardOpen) return;
      e.preventDefault();
      const now = performance.now();
      if (now - wheelHintAt > 6000) {
        wheelHintAt = now;
        this.hud.toast('You\'re in Explore World. Switch to Scroll Journey to scroll.');
      }
    }, { passive: false });

    // touch controls
    for (const btn of document.querySelectorAll('#touch button')) {
      const action = btn.dataset.action;
      const down = (e) => { e.preventDefault(); btn.classList.add('is-down'); this.input.setVirtual(action, true); };
      const up = (e) => { e.preventDefault(); btn.classList.remove('is-down'); this.input.setVirtual(action, false); };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
    }
  }

  bindInput() {
    this.input.on('action', (action, e) => {
      if (this.phase === 'intro' && action === 'cancel') { this.introSkipped = true; return; }
      if (this.dialogue.active) {
        if (['interact', 'confirm', 'jump'].includes(action)) {
          if (e) e.preventDefault();
          this.dialogue.advance();
        }
        return;
      }
      if (this.phase !== 'play' || this.hud.cardOpen) return;
      if (action === 'interact' || (action === 'confirm' && this.nearest)) this.tryInteract();
      // keyboard movement while scrolling hands control to Explore World
      if (this.mode === 'scroll' && (action === 'left' || action === 'right')) {
        if (e) e.preventDefault();
        this.setMode('explore');
      }
    });
    this.input.on('anykey', (e) => {
      if (e.code === 'KeyM' && !e.repeat && !e.metaKey && !e.ctrlKey) this.toggleSound();
      if (this.phase === 'play' && this.mode === 'scroll' && e.code === 'KeyW' && !this.dialogue.active && !this.hud.cardOpen) this.setMode('explore');
    });
  }

  async toggleSound() {
    const on = !this.audio.enabled;
    await this.audio.setEnabled(on);
    this.hud.setSound(on);
    this.hud.toast(on ? 'Sound on ♪' : 'Sound off', 1400);
  }

  // ---------------------------------------------------------------- story

  onBeat(beat) {
    const who = beat.who === 'boy' ? this.player : this.girl;
    this.bubbles.say(who, beat.text, { duration: 4, kind: beat.who });
  }

  nearestInteractable() {
    const p = this.player;
    let best = null;
    let bestD = Infinity;
    for (const it of INTERACTABLES) {
      const dx = Math.abs(p.x - it.x);
      const dy = Math.abs(p.y - it.y);
      if (dx <= it.range && dy < 30 && dx < bestD) { best = it; bestD = dx; }
    }
    return best;
  }

  async tryInteract() {
    const it = this.nearest;
    if (!it || this.busy || this.dialogue.active) return;
    this.busy = true;
    this.audio.sfx('interact');
    this.bubbles.clear();
    this.story.visited.add(it.id);
    document.body.classList.add('is-busy');
    const p = this.player;
    p.facing = it.x >= p.x ? 1 : -1;
    p.control.move = 0;
    const savedAuto = p.autopilot;
    p.autopilot = null;
    try {
      switch (it.id) {
        case 'journey-map':
          await this.say(SCRIPTS['journey-map-intro']);
          await this.hud.openCard({
            eyebrow: `Chapter ${CHAPTER_01.number} · ${CHAPTER_01.year}`,
            title: 'Journey Map',
            html: this.hud.journeyHTML({ reachedWorkshop: this.story.atWorkshop }),
          });
          break;
        case 'lookout': {
          p.facing = 1;
          this.camera.override = { x: 2890 - this.camera.viewW / 2, y: G - this.camera.viewH * 0.78, rate: 1.6 };
          await this.say(SCRIPTS.lookout);
          this.camera.override = null;
          break;
        }
        default:
          await this.say(SCRIPTS[it.id]);
      }
    } finally {
      this.busy = false;
      document.body.classList.remove('is-busy');
      if (this.mode === 'scroll') p.autopilot = savedAuto;
    }
  }

  openStory() {
    this.hud.openCard({
      eyebrow: `Chapter ${CHAPTER_01.number} · ${CHAPTER_01.year}`,
      title: CHAPTER_01.title,
      html: this.hud.journeyHTML({ reachedWorkshop: this.story.atWorkshop })
        + '<p style="margin-top:14px">The playable world currently covers the path to the first location. Each place on this map opens as a new part of the story.</p>',
    });
  }

  // ---------------------------------------------------------------- loop

  frame(t) {
    const dt = Math.min(0.05, (t - (this.lastTime || t)) / 1000);
    this.lastTime = t;
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((tt) => this.frame(tt));
  }

  update(dt) {
    for (const fn of [...this.tickers]) fn(dt);
    const p = this.player;
    const playing = this.phase === 'play';
    const blocked = this.dialogue.active || this.hud.cardOpen || this.busy;

    if (playing) {
      if (this.mode === 'explore') {
        const c = p.control;
        c.move = blocked ? 0 : this.input.axis();
        c.run = this.input.isDown('run');
        c.boost = 1;
        c.jump = !blocked && (this.input.wasPressed('jump') || this.input.wasPressed('up'));
        c.jumpHeld = this.input.isDown('jump') || this.input.isDown('up');
        c.drop = !blocked && this.input.isDown('down');
        p.autopilot = null;
      } else if (!blocked) {
        p.autopilot = { x: clamp(this.scrollTarget, SCROLL.startX, SCROLL.endX), tolerance: 2 };
        p.control.jumpHeld = true;
      } else {
        p.autopilot = null;
        p.control.move = 0;
      }
    }

    this.girl.think(dt);
    for (const ch of this.characters) ch.update(dt, this.solids);

    // character events → particles + sound
    for (const ch of this.characters) {
      for (const ev of ch.events) {
        if (ev.type === 'jump') { this.renderer.puff(ev.x, ev.y, 4); if (ch === p) this.audio.sfx('jump'); }
        if (ev.type === 'land' && ev.impact > 200) { this.renderer.puff(ev.x, ev.y, 7); if (ch === p) this.audio.sfx('land'); }
        if (ev.type === 'poof') { this.renderer.sparkle(ev.x, ev.y - 40, 10); this.audio.sfx('poof'); }
      }
      ch.events.length = 0;
    }

    this.camera.follow(p, dt, false);
    this.renderer.update(dt);
    this.dialogue.update(dt);

    if (playing) {
      this.story.update(p.x, this.mode);
      this.hud.setProgress(this.story.prologue);
      this.nearest = blocked ? null : this.nearestInteractable();
    } else {
      this.nearest = null;
    }
    this.updatePrompt();
    this.bubbles.update(dt, (x, y) => this.toScreen(x, y));

    // ambience
    const wd = Math.abs(p.x - (WATERFALL.x + WATERFALL.w / 2));
    this.audio.setWater(clamp(1 - wd / 420, 0, 1));
    this.audio.update();
  }

  toScreen(x, y) {
    return { x: (x - this.camera.x) * this.scale, y: (y - this.camera.y) * this.scale };
  }

  updatePrompt() {
    const el = document.getElementById('interact-prompt');
    const it = this.nearest;
    if (!it) { if (!el.hidden) el.hidden = true; return; }
    if (el.hidden || this.promptFor !== it.id) {
      document.getElementById('interact-label').textContent = it.label;
      this.promptFor = it.id;
      el.hidden = false;
    }
    const pt = this.toScreen(it.x, it.y - 90);
    el.style.left = `${Math.round(pt.x)}px`;
    el.style.top = `${Math.round(pt.y)}px`;
  }

  render() {
    const ctx = this.bctx;
    const cam = this.camera;
    this.renderer.drawBack(ctx, cam);
    for (const ch of this.characters) ch.draw(ctx, cam, this.solids);
    this.renderer.drawFront(ctx, cam);

    const out = this.ctx;
    out.imageSmoothingEnabled = false;
    const s = this.scale * this.dpr;
    out.drawImage(this.buffer, 0, 0, this.buffer.width, this.buffer.height, 0, 0, Math.round(this.buffer.width * s), Math.round(this.buffer.height * s));
  }
}

const game = new Game();
window.__game = game;
game.init().catch((err) => {
  console.error(err);
  const p = document.querySelector('#loader p');
  if (p) p.textContent = 'Something went wrong loading the world. Please refresh.';
});
