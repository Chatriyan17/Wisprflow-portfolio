import { VIEW, WORLD, SCROLL, REDUCED_MOTION } from './config.js';
import { loadImage, loadJSON, makeCanvas } from './engine/assets.js';
import { Input } from './engine/input.js';
import { Camera } from './engine/camera.js';
import { SpriteSheet } from './engine/sprite.js';
import { clamp } from './engine/rng.js';
import { Character } from './entities/character.js';
import { Companion } from './entities/companion.js';
import { WorldRenderer } from './world/renderer.js';
import { buildSolids, groundTopAt, INTERACTABLES, WATERFALL, CONVEYOR, PORTAL, BREAK, GATE, ISLANDS, STREAM, STATIONS, INTERIOR, CAMPUS, PRINCIPLES, ACADEMY, MENTOR, CAMP, MEMORIES, areaOf } from './world/level.js';
import { industryAt, gatewayAt, forestAt } from './world/renderer.js';
import { paintFriendSilhouette } from './world/industrial.js';
import * as Stage2 from './cinematics/stage2.js';
import * as Stage3 from './cinematics/stage3.js';
import * as Stage4 from './cinematics/stage4.js';
import * as Stage5 from './cinematics/stage5.js';
import * as Stage6 from './cinematics/stage6.js';
import * as Stage7 from './cinematics/stage7.js';
import { learningCard, principleCard, academyInfoCard } from './ui/learningCards.js';
import { Dialogue } from './systems/dialogue.js';
import { Bubbles } from './systems/bubbles.js';
import { Story } from './systems/story.js';
import { Audio } from './systems/audio.js';
import { VoiceCast } from './systems/voice.js';
import { themeFor } from './systems/music.js';
import { HUD } from './ui/hud.js';
import { playIntro } from './cinematics/intro.js';
import { SCRIPTS, MODE_HINTS, CHAPTER_01, RECAP } from './content/chapter01.js';

const G = WORLD.ground;
const LEARN_LIBRARY = new Set(['research', 'interviews', 'empathy-map', 'personas', 'affinity', 'problem']);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches;

class Game {
  constructor() {
    this.canvas = document.getElementById('world');
    this.ctx = this.canvas.getContext('2d');
    this.phase = 'loading';
    this.mode = 'scroll';
    this.tickers = new Set();
    this.introSkipped = false;
    this.busy = false;           // an interaction or scene is running
    this.scripting = false;      // a scene is steering the protagonist
    this.sceneQueue = [];
    this.memory = 0;             // 0..1 strength of the memory filter
    this.memoryTarget = 0;
    this.flash = 0;
    this.zoom = 1;               // >1 pulls the camera back (wider view)
    this.zoomTarget = 1;
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
    const [boyImg, boyMeta, girlImg, girlMeta, youngImg, youngMeta, mentorImg, mentorMeta] = await Promise.all([
      loadImage('assets/sprites/boy.png'), loadJSON('assets/sprites/boy.json'),
      loadImage('assets/sprites/girl.png'), loadJSON('assets/sprites/girl.json'),
      loadImage('assets/sprites/boy-young.png'), loadJSON('assets/sprites/boy-young.json'),
      loadImage('assets/sprites/mentor.png'), loadJSON('assets/sprites/mentor.json'),
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
    this.boySheet = this.player.sheet;
    this.youngSheet = new SpriteSheet(youngImg, youngMeta);
    this.girl = new Companion({ name: 'girl', sheet: new SpriteSheet(girlImg, girlMeta), x: SCROLL.startX - 34, y: G });
    this.girl.leader = this.player;
    this.characters = [this.girl, this.player];

    this.input = new Input();
    this.audio = new Audio();
    this.hud = new HUD();
    this.bubbles = new Bubbles(document.getElementById('bubbles'));
    this.voice = new VoiceCast();
    this.dialogue = new Dialogue({
      audio: this.audio,
      voice: this.voice,
      live: document.getElementById('sr-live'),
      onSpeaker: (who) => {
        this.player.talking = who === 'boy';
        this.girl.talking = who === 'girl';
      },
    });
    this.story = new Story({ onBeat: (b) => this.onBeat(b), onTrigger: (t) => this.runScene(t.id) });
    this.renderer.seen = this.story.seen;
    this.renderer.mentorSheet = new SpriteSheet(mentorImg, mentorMeta);
    this.live = document.getElementById('sr-live');

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
    this.offerResume();
    const result = await playIntro(this);
    if (this.pendingResume) { this.begin(); this.doResume(); }
    else if (result.skipped) this.begin();
    else this.awaitStart();
  }

  // ---------------------------------------------------------------- saved progress

  offerResume() {
    const cp = this.story.savedCheckpoint;
    if (!cp || cp.id === 'start') return;
    const btn = document.getElementById('resume');
    btn.textContent = `Continue from ${cp.name} ▸`;
    btn.hidden = false;
    btn.onclick = (e) => { e.stopPropagation(); this.resume(); };
    this.later(14, () => { btn.hidden = true; });
  }

  resume() {
    document.getElementById('resume').hidden = true;
    if (this.phase === 'intro') { this.pendingResume = true; this.introSkipped = true; return; }
    if (this.phase !== 'play') this.begin();
    this.doResume();
  }

  doResume() {
    const cp = this.story.restore();
    if (!cp) return;
    const p = this.player, g = this.girl;
    p.x = cp.x; p.y = groundTopAt(cp.x); p.vx = 0; p.vy = 0;
    g.x = cp.x - 34; g.y = groundTopAt(cp.x - 34); g.vx = 0;
    this.restoreWorldState();
    this.camera.follow(p, 0, true);
    this.scrollTarget = cp.x;
    if (this.mode === 'scroll') this.setMode('scroll', { silent: true });
    this.bubbles.clear();
    this.hud.toast(`Welcome back! Continuing from ${cp.name}.`);
  }

  setPhase(phase) {
    this.phase = phase;
    document.body.classList.remove('phase-loading', 'phase-intro', 'phase-press', 'phase-play');
    document.body.classList.add(`phase-${phase}`);
  }

  onTick(fn) { this.tickers.add(fn); }
  offTick(fn) { this.tickers.delete(fn); }

  // say('script-id') plays a script from content/chapter01.js (with voices);
  // say([...lines]) plays ad-hoc lines.
  say(lines, opts = {}) {
    if (typeof lines === 'string') return this.dialogue.play(SCRIPTS[lines] || [], { ...opts, id: lines });
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
    this.baseVW = vw;
    this.baseVH = vh;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    // room to pull the camera back for wide cinematic shots
    [this.buffer, this.bctx] = makeCanvas(Math.min(1300, Math.ceil(vw * 1.7)), Math.ceil(vh * 1.7));
    this.applyZoom(true);
    this.updateScrollTrack();
  }

  setZoom(z) { this.zoomTarget = z; }

  applyZoom(force = false) {
    const vw = Math.min(1300, Math.round(this.baseVW * this.zoom));
    const vh = Math.round(this.baseVH * (vw / this.baseVW));
    if (force || vw !== this.camera.viewW || vh !== this.camera.viewH) this.camera.resize(vw, vh);
  }

  // A chapter title card (reuses the intro title card).
  showChapterCard({ eyebrow, title, meta }) {
    const card = document.getElementById('title-card');
    card.querySelector('.title-card__eyebrow').textContent = eyebrow;
    const h = card.querySelector('.title-card__title');
    h.textContent = '';
    const span = document.createElement('span');
    span.textContent = title;
    h.append(span);
    card.querySelector('.title-card__meta').textContent = meta || '';
    document.body.classList.add('show-title', 'show-chapter');
    clearTimeout(this.chapterTimer);
    this.chapterTimer = setTimeout(() => document.body.classList.remove('show-title', 'show-chapter'), 3600);
    if (this.live) this.live.textContent = `${eyebrow}: ${title}. ${meta || ''}`;
  }

  // The gateway to the World of UX opens for good.
  openGateway() {
    this.solids = this.solids.filter((s) => s.kind !== 'portalWall');
    this.story.seen.add('gateway');
    this.story.save();
  }

  // Stage 4: through the studio door into the interior, and back out.
  enterStudio() {
    const p = this.player, g = this.girl;
    p.x = INTERIOR.entry; p.y = G; p.vx = 0; p.vy = 0;
    g.x = INTERIOR.entry - 34; g.y = G; g.vx = 0; g.facing = 1;
    this.story.seen.add('studio-door');
    this.moveTo(INTERIOR.entry);
    this.story.save();
  }

  exitStudio() { this.moveTo(INTERIOR.exitTo); }

  // Stage 5: through the academy doorway onto the campus, and back.
  enterCampus() {
    this.story.seen.add('academy-door');
    this.moveTo(CAMPUS.entry);
    this.story.save();
  }

  exitCampus() { this.moveTo(CAMPUS.exitTo); }

  // Put both characters at x (in whichever area that is) and frame the camera there.
  moveTo(x) {
    const p = this.player, g = this.girl;
    p.x = x; p.y = G; p.vx = 0; p.vy = 0;
    g.x = x - 34; g.y = G; g.vx = 0; g.facing = 1;
    this.story.lastX = p.x;
    const a = areaOf(x);
    this.camera.bounds = { min: a.min, max: a.max };
    this.camera.follow(p, 0, true);
  }

  // Stage 6: the lantern path from the campus to the Mentor's Camp, and back.
  enterCamp() {
    this.story.seen.add('mentor-door');
    this.moveTo(CAMP.entry);
    this.story.save();
  }

  exitCamp() { this.moveTo(CAMP.exitTo); }

  // the protagonist as a schoolboy, inside the memory
  setYoung(on) {
    const p = this.player;
    p.sheet = on ? this.youngSheet : this.boySheet;
    p.anim.sheet = p.sheet;
    p.h = on ? 50 : 64;
  }

  setSchool(on) {
    document.body.classList.toggle('is-school', on);
    const cap = document.getElementById('memory-caption');
    cap.textContent = on ? 'A memory · school' : 'A memory · 2022';
  }

  // Explore World: let the visitor walk up to the blackboard themselves.
  waitForBoard() {
    this.bubbles.say(this.girl, 'Your turn. Walk up to the blackboard and press E.', { duration: 5 });
    return new Promise((resolve) => { this.awaitBoard = { resolve }; });
  }

  showStatement() { document.body.classList.add('show-statement'); this.live.textContent = "My design thinking didn't start with design. It started with understanding how problems work."; }
  hideStatement() { document.body.classList.remove('show-statement'); }

  showRecap(title, text) {
    const el = document.getElementById('recap');
    el.querySelector('strong').textContent = title;
    el.querySelector('span').textContent = text;
    el.classList.remove('is-on');
    void el.offsetWidth;
    el.classList.add('is-on');
    this.live.textContent = `${title}. ${text}`;
  }

  hideRecap() { document.getElementById('recap').classList.remove('is-on'); }

  openFinaleGate() {
    this.solids = this.solids.filter((s) => s.kind !== 'finaleGate');
    this.renderer.finaleTarget = 1;
  }

  chapterCompleteCard() {
    return {
      eyebrow: 'Chapter 01 · Complete',
      title: 'Where it all began.',
      html: '<p class="lede">I didn\'t become a designer the day I opened Figma.</p>'
        + '<p>I was learning to observe, understand patterns and solve problems long before I knew what design was. And that was just the beginning of my journey.</p>'
        + this.hud.journeyHTML({ progress: 7, complete: true })
        + '<div class="chapter-next"><p class="chapter-next__eyebrow">Chapter 02</p><p class="chapter-next__title">The Journey Continues</p><p>The next part of the world is still being built.</p></div>',
    };
  }

  // A floating memory on the overlook: a quick recap, and a way back there.
  async openMemory(id) {
    const r = RECAP[id];
    const m = MEMORIES.find((q) => q.id === id);
    const action = r.relive
      ? '<button type="button" class="pixel-btn" data-travel="relive">Relive the memory ▸</button>'
      : '<button type="button" class="pixel-btn" data-travel="go">Travel there ▸</button>';
    const closed = this.hud.openCard({ eyebrow: `Chapter 01 · ${m.num}`, title: r.title, html: `<p class="lede">${r.text}</p><p class="card-travel">${action} <span>Your progress stays saved.</span></p>` });
    let chosen = null;
    document.querySelector('#card [data-travel]').addEventListener('click', (e) => { chosen = e.currentTarget.dataset.travel; this.hud.closeCard(); });
    await closed;
    if (chosen === 'go') {
      this.flash = 0.8;
      this.moveTo(r.travel);
      if (this.mode === 'scroll') this.setMode('scroll', { silent: true });
      this.hud.toast(`Back at ${r.title}. Scroll or walk on to return to the overlook.`);
    } else if (chosen === 'relive') {
      this.runScene('relive');
    }
  }

  openCampusGate() {
    this.solids = this.solids.filter((s) => s.kind !== 'campusGate');
    this.renderer.gateTarget = 1;
  }

  openStationGate() {
    this.solids = this.solids.filter((s) => s.kind !== 'stationGate');
  }

  // Bring back what a returning visitor already unlocked.
  restoreWorldState() {
    const seen = this.story.seen;
    for (const st of STATIONS) {
      if (seen.has(`station-${st.id}`)) { this.renderer.activateStation(st.id); this.renderer.stations[st.id].t = 10; this.renderer.stations[st.id].found = true; }
    }
    if (seen.has('hats')) this.openStationGate();
    if (seen.has('campus-arrive')) { this.openCampusGate(); this.renderer.gateOpen = 1; }
    if (seen.has('lab-solved')) this.renderer.labSolved = true;
    PRINCIPLES.forEach((pr, i) => { if (seen.has(`lit-${pr.id}`) || seen.has('foundation')) this.renderer.principlesLit[i] = 1; });
    if (seen.has('horizon')) { this.renderer.mentorTarget = 1; this.renderer.mentorSign = 1; }
    if (seen.has('mentor-meet')) this.renderer.mentorBoard = 3;
    if (seen.has('recap')) { this.renderer.memIslands.forEach((m) => { m.on = true; m.lit = 1; }); this.renderer.memLinksOn = true; this.renderer.memLinks = 1; }
    if (seen.has('identity')) { this.renderer.canvasTarget = 1; this.renderer.canvasOn = 1; }
    if (seen.has('next-adventure')) { this.openFinaleGate(); this.renderer.finaleGate = 1; }
    if (seen.has('gateway') || this.story.maxX > PORTAL.x + 60) this.openGateway();
    const r = this.renderer;
    for (const isl of r.islands) if (this.story.maxX >= isl.at) { isl.shown = true; isl.t = 1; }
    if (seen.has('curiosity')) { r.linksOn = true; r.links = 1; }
    if (seen.has('course')) { r.discoveriesOn = true; r.discoveries = 1; }
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
    document.getElementById('skip-scene').addEventListener('click', (e) => { if (e.detail > 0) e.currentTarget.blur(); this.skipScene(); });
    // Mouse clicks hand keyboard focus back to the world; keyboard activation keeps focus.
    const release = (e) => { if (e.detail > 0) e.currentTarget.blur(); };
    const modeScroll = document.getElementById('mode-scroll');
    const modeExplore = document.getElementById('mode-explore');
    const sound = document.getElementById('sound-toggle');
    modeScroll.addEventListener('click', (e) => { release(e); this.setMode('scroll'); });
    modeExplore.addEventListener('click', (e) => { release(e); this.setMode('explore'); });
    sound.addEventListener('click', (e) => { release(e); this.toggleSound(); });
    const voices = document.getElementById('voice-toggle');
    voices.addEventListener('click', (e) => { release(e); this.toggleVoices(); });
    if (!this.voice.available) voices.hidden = true;
    document.getElementById('story-open').addEventListener('click', () => this.openStory());
    document.getElementById('interact-prompt').addEventListener('click', () => this.tryInteract());

    window.addEventListener('scroll', () => {
      if (this.mode !== 'scroll' || this.ignoreScroll || this.busy) return;
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
      if (e.code === 'KeyV' && !e.repeat && !e.metaKey && !e.ctrlKey) this.toggleVoices();
      if (this.phase === 'play' && this.mode === 'scroll' && e.code === 'KeyW' && !this.dialogue.active && !this.hud.cardOpen) this.setMode('explore');
    });
  }

  async toggleSound() {
    const on = !this.audio.enabled;
    this.voice.setSound(on);
    await this.audio.setEnabled(on);
    this.hud.setSound(on);
    this.hud.toast(on ? (this.voice.enabled ? 'Sound on ♪ · voices on' : 'Sound on ♪') : 'Sound off', 1600);
  }

  toggleVoices() {
    const on = !this.voice.enabled;
    this.voice.setEnabled(on);
    this.hud.setVoices(on);
    if (on && !this.audio.enabled) this.toggleSound();
    else this.hud.toast(on ? 'Character voices on' : 'Character voices off', 1400);
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
      if (it.after && !this.story.seen.has(it.after)) continue;
      if (it.only === 'puzzle' && !this.awaitBoard) continue;
      const dx = Math.abs(p.x - it.x);
      const dy = Math.abs(p.y - it.y);
      if (dx <= it.range && dy < 30 && dx < bestD) { best = it; bestD = dx; }
    }
    return best;
  }

  async tryInteract() {
    const it = this.nearest;
    if (it && it.id === 'blackboard' && this.awaitBoard) {
      const w = this.awaitBoard;
      this.awaitBoard = null;
      this.audio.sfx('interact');
      w.resolve();
      return;
    }
    if (!it || this.busy || this.dialogue.active) return;
    // some interactions are full scenes (they play by themselves in Scroll Journey)
    const sceneFor = { gateway: 'gateway', course: 'course', studio: 'studio-door', academy: 'academy-door', lab: 'lab', mentor: 'mentor-door', chapter2: 'chapter2' };
    if (sceneFor[it.id] || it.station) {
      const id = sceneFor[it.id] || it.id;
      this.story.seen.add(id);
      this.story.markVisited(it.id);
      this.audio.sfx('interact');
      this.runScene(id);
      return;
    }
    if (it.id === 'studio-exit') { this.exitStudio(); return; }
    if (it.id === 'campus-exit') { this.exitCampus(); return; }
    if (it.id === 'camp-exit') { this.exitCamp(); return; }
    if (it.memory) { this.audio.sfx('chime', MEMORIES.findIndex((m) => m.id === it.memory)); this.openMemory(it.memory); return; }
    this.busy = true;
    this.audio.sfx('interact');
    this.bubbles.clear();
    this.story.markVisited(it.id);
    document.body.classList.add('is-busy');
    const p = this.player;
    p.facing = it.x >= p.x ? 1 : -1;
    p.control.move = 0;
    const savedAuto = p.autopilot;
    p.autopilot = null;
    try {
      switch (it.id) {
        case 'journey-map':
          await this.say('journey-map-intro');
          await this.hud.openCard({
            eyebrow: `Chapter ${CHAPTER_01.number} · ${CHAPTER_01.year}`,
            title: 'Journey Map',
            html: this.hud.journeyHTML({ progress: this.story.progress }),
          });
          break;
        case 'lookout': {
          p.facing = 1;
          this.camera.override = { x: GATE.x + 60 - this.camera.viewW / 2, y: G - this.camera.viewH * 0.8, rate: 1.6 };
          await this.say('lookout');
          this.camera.override = null;
          break;
        }
        case 'mentor-talk':
          p.facing = 1;
          this.renderer.mentorTalking = true;
          await this.say('mentor-talk');
          this.renderer.mentorTalking = false;
          break;
        case 'info-board':
          this.audio.sfx('page');
          await this.hud.openCard(academyInfoCard());
          break;
        default:
          if (it.learn) {
            this.audio.sfx(it.learn === 'research' || LEARN_LIBRARY.has(it.learn) ? 'page' : 'chalk');
            await this.hud.openCard(learningCard(it.learn));
          } else if (it.principle) {
            const pr = PRINCIPLES.find((q) => q.id === it.principle);
            this.audio.sfx('chime');
            await this.hud.openCard(principleCard(pr.id, pr.name));
          } else {
            await this.say(it.id);
          }
      }
    } finally {
      this.busy = false;
      document.body.classList.remove('is-busy');
      if (this.mode === 'scroll') p.autopilot = savedAuto;
    }
  }

  // ---------------------------------------------------------------- scenes

  async runScene(id) {
    if (this.busy) { this.sceneQueue.push(id); return; }
    const scene = {
      'enter-workshop': Stage2.enterWorkshop,
      observation: Stage2.observation,
      'break-talk': Stage2.breakTalk,
      memory: Stage2.memory,
      gateway: Stage3.gateway,
      'first-question': Stage3.firstQuestion,
      course: Stage3.course,
      curiosity: Stage3.curiosity,
      'studio-door': Stage4.studioDoor,
      'studio-enter': Stage4.studioEnter,
      'one-team': Stage4.oneTeam,
      hats: Stage4.hats,
      'missing-piece': Stage4.missingPiece,
      decision: Stage4.decision,
      'academy-door': Stage5.academyDoor,
      'campus-arrive': Stage5.campusArrive,
      'campus-enter': Stage5.campusEnter,
      fundamentals: Stage5.fundamentals,
      library: Stage5.library,
      lab: Stage5.lab,
      foundation: Stage5.foundation,
      horizon: Stage5.horizon,
      'mentor-door': Stage6.mentorDoor,
      'camp-arrive': Stage6.campArrive,
      'mentor-meet': Stage6.mentorMeet,
      relive: Stage6.relive,
      'overlook-arrive': Stage7.overlookArrive,
      recap: Stage7.recap,
      identity: Stage7.identity,
      'next-adventure': Stage7.nextAdventure,
      chapter2: Stage7.chapterTwo,
      ...Object.fromEntries(STATIONS.map((st) => [`station-${st.id}`, (g) => Stage4.station(g, st.id)])),
    }[id];
    if (!scene) return;
    this.busy = true;
    this.scripting = true;
    document.body.classList.add('is-busy');
    this.bubbles.clear();
    const p = this.player;
    p.autopilot = null;
    p.control.move = 0;
    p.control.run = false;
    p.vx *= 0.25;
    try {
      await scene(this);
    } finally {
      this.busy = false;
      this.scripting = false;
      this.awaitBoard = null;
      document.body.classList.remove('is-busy');
      this.story.save();
      if (!this.sceneQueue.length) this.endFastForward();
      // keep Scroll Journey in step with where the scene left the protagonist
      if (this.mode === 'scroll') {
        this.scrollTarget = SCROLL.startX + window.scrollY / SCROLL.pxPerWorldPx;
        if (this.scrollTarget < p.x) this.scrollTarget = p.x;
      }
      const next = this.sceneQueue.shift();
      if (next) this.runScene(next);
    }
  }

  // "Skip scene": play the rest of the current scene at high speed.
  skipScene() {
    if (!this.scripting) return;
    this.fastForward = true;
    this.dialogue.fast = true;
    this.voice.stop();
    this.dialogue.advance();
    if (this.activePuzzle) this.activePuzzle.solveNow();
    if (this.hud.cardOpen) this.hud.closeCard();
    if (this.awaitBoard) { const w = this.awaitBoard; this.awaitBoard = null; w.resolve(); }
    this.hideStatement();
  }

  endFastForward() {
    this.fastForward = false;
    this.dialogue.fast = false;
  }

  setMemory(on) {
    this.memoryTarget = on ? 1 : 0;
    document.body.classList.toggle('is-memory', on);
  }

  openStory() {
    this.hud.openCard({
      eyebrow: `Chapter ${CHAPTER_01.number} · ${CHAPTER_01.year}`,
      title: CHAPTER_01.title,
      html: this.hud.journeyHTML({ progress: this.story.progress })
        + '<p style="margin-top:14px">Chapter 01 is a single connected world, from The Old Workshop to The Awakening. Walk or scroll through it at your own pace. Every scene can be skipped.</p>',
    });
  }

  // ---------------------------------------------------------------- loop

  frame(t) {
    const dt = Math.min(0.05, (t - (this.lastTime || t)) / 1000);
    this.lastTime = t;
    this.frameDt = dt;
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((tt) => this.frame(tt));
  }

  update(dt) {
    const sdt = this.fastForward ? dt * 8 : dt;
    for (const fn of [...this.tickers]) fn(sdt);
    const p = this.player;
    const playing = this.phase === 'play';
    const roaming = !!this.awaitBoard && this.mode === 'explore';
    const blocked = this.dialogue.active || this.hud.cardOpen || (this.busy && !roaming);

    if (playing && (!this.scripting || roaming)) {
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
        let target = clamp(this.scrollTarget, SCROLL.startX, SCROLL.endX);
        // separate areas (outdoors, the studio, the campus): step through their doors
        // as the scroll crosses them, in either direction
        const area = areaOf(p.x).id;
        if (area === 'outdoor' && target > INTERIOR.exitTo + 10) {
          if (this.story.seen.has('studio-door')) this.enterStudio();
          else target = INTERIOR.exitTo - 20;
        } else if (area === 'studio' && target < INTERIOR.x0 + 30) {
          this.exitStudio();
        } else if (area === 'studio' && target > CAMPUS.exitTo + 40) {
          if (this.story.seen.has('academy-door')) this.enterCampus();
          else target = Math.min(target, ACADEMY.door - 4);
        } else if (area === 'campus' && target < CAMPUS.entry + 10) {
          this.exitCampus();
        } else if (area === 'campus' && target > MENTOR.door + 20) {
          if (this.story.seen.has('mentor-door')) this.enterCamp();
          else target = Math.min(target, MENTOR.door - 2);
        } else if (area === 'camp' && target < CAMP.entry + 10) {
          this.exitCamp();
        }
        p.autopilot = { x: target, tolerance: 2 };
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
    for (const ev of this.renderer.events) {
      if (ev.type === 'press') this.audio.sfx('thump', clamp(1 - Math.abs(p.x - ev.x) / 500, 0, 1));
    }
    this.renderer.events.length = 0;
    this.memory += (this.memoryTarget - this.memory) * Math.min(1, dt * (REDUCED_MOTION ? 30 : 1.8));
    this.flash = Math.max(0, this.flash - dt * 1.2);

    if (Math.abs(this.zoom - this.zoomTarget) > 0.001) {
      this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * (REDUCED_MOTION ? 30 : 1.1));
      if (Math.abs(this.zoom - this.zoomTarget) < 0.002) this.zoom = this.zoomTarget;
      this.applyZoom();
    }
    // the industry islands rise one by one as he walks into the world of possibilities
    if (playing) {
      for (const isl of ISLANDS) {
        if (p.x >= isl.at && this.renderer.raiseIsland(isl.id)) this.audio.sfx('discover');
      }
    }
    const here = areaOf(p.x);
    this.camera.bounds = { min: here.min, max: here.max };
    // the Foundation Wall: each principle lights up as he walks past it
    if (playing && here.id === 'campus') {
      PRINCIPLES.forEach((pr, i) => {
        if (Math.abs(p.x - pr.x) < 24 && this.renderer.lightPrinciple(i)) {
          this.audio.sfx('chime', i);
          this.story.seen.add(`lit-${pr.id}`);
        }
      });
      if (!this.story.seen.has('foundation') && PRINCIPLES.every((pr) => this.story.seen.has(`lit-${pr.id}`))) {
        this.story.seen.add('foundation');
        this.story.save();
        this.runScene('foundation');
      }
    }
    this.camera.follow(p, dt, false);
    this.renderer.update(dt);
    this.dialogue.update(sdt);

    if (playing) {
      this.story.update(p.x, p.y, this.mode);
      this.hud.setProgress(this.story.progress, this.story.seen.has('chapter-complete'));
      this.nearest = blocked ? null : this.nearestInteractable();
    } else {
      this.nearest = null;
    }
    this.updatePrompt();
    this.bubbles.update(dt, (x, y) => this.toScreen(x, y));

    // ambience
    const wd = Math.abs(p.x - (WATERFALL.x + WATERFALL.w / 2));
    this.audio.setWater(clamp(1 - wd / 420, 0, 1));
    const cx = this.camera.x + this.camera.viewW / 2;
    this.audio.setRegion({
      industry: industryAt(cx),
      gateway: gatewayAt(cx) * clamp(1 - Math.abs(p.x - PORTAL.x) / 700, 0, 1),
      conveyor: clamp(1 - Math.abs(p.x - (CONVEYOR.x0 + CONVEYOR.x1) / 2) / 350, 0, 1),
      forest: here.id === 'outdoor' ? forestAt(cx) : here.id === 'campus' ? 0.6 : 0,
      studio: here.id === 'studio' ? 1 : 0,
      theme: themeFor(here.id, p.x),
    });
    if (forestAt(cx) > 0) this.audio.setWater(Math.max(clamp(1 - wd / 420, 0, 1), clamp(1 - Math.abs(p.x - (STREAM.x0 + STREAM.x1) / 2) / 300, 0, 1) * 0.6));
    this.audio.update();
  }

  // The school memory: soft morning sunlight and a dreamy, faded edge.
  drawMorning(ctx, cam) {
    const W = cam.viewW, H = cam.viewH;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255, 236, 190, 0.16)');
    g.addColorStop(1, 'rgba(255, 220, 170, 0.04)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(255, 248, 230, 0)');
    v.addColorStop(1, 'rgba(255, 248, 230, 0.45)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // A remembered moment: warm sepia, soft edges, a little dreamy glow.
  drawMemoryFilter(ctx, cam) {
    const m = this.memory;
    const W = cam.viewW, H = cam.viewH;
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(128,128,128,${0.75 * m})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255, 214, 160, ${0.55 * m})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(120, 70, 60, ${0.18 * m})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W / 2, H * 0.6, Math.min(W, H) * 0.25, W / 2, H * 0.6, Math.max(W, H) * 0.7);
    v.addColorStop(0, 'rgba(40, 24, 20, 0)');
    v.addColorStop(1, `rgba(40, 24, 20, ${0.75 * m})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  toScreen(x, y) {
    const k = window.innerWidth / this.camera.viewW;
    return { x: (x - this.camera.x) * k, y: (y - this.camera.y) * k };
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
    // friends, seen only in the memory
    if (this.memory > 0.02) {
      const t = this.renderer.time;
      BREAK.friends.forEach((fx, i) => {
        const talking = this.dialogue.current && this.dialogue.current.who === 'friend';
        paintFriendSilhouette(ctx, fx - cam.x, G - cam.y, -1, Math.min(1, this.memory * 1.2), talking ? t * 9 + i * 2 : t * 1.5 + i);
      });
    }
    this.renderer.drawHats(ctx, cam, this.player);
    for (const ch of this.characters) ch.draw(ctx, cam, this.solids);
    this.renderer.drawHatsFront(ctx, cam, this.player);
    this.renderer.drawExclaims(ctx, cam, this.frameDt || 0.016);
    this.renderer.drawFront(ctx, cam);
    if (this.memory > 0.02) this.drawMemoryFilter(ctx, cam);
    if (areaOf(cam.x + cam.viewW / 2).id === 'classroom') this.drawMorning(ctx, cam);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(214, 200, 255, ${this.flash * 0.7})`;
      ctx.fillRect(0, 0, cam.viewW, cam.viewH);
    }

    const out = this.ctx;
    out.imageSmoothingEnabled = false;
    out.drawImage(this.buffer, 0, 0, cam.viewW, cam.viewH, 0, 0, this.canvas.width, Math.round(this.canvas.width * cam.viewH / cam.viewW));
  }
}

const game = new Game();
window.__game = game;
game.init().catch((err) => {
  console.error(err);
  const p = document.querySelector('#loader p');
  if (p) p.textContent = 'Something went wrong loading the world. Please refresh.';
});
