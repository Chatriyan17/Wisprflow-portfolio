import { WORLD, REDUCED_MOTION } from '../config.js';
import { GOLEM } from '../world/level.js';
import { ARM_OF } from '../world/golem.js';
import { BOSS } from '../content/chapter01.js';
import { mountPoster, mountHierarchy, mountFlow } from '../ui/bossChallenges.js';

const G = WORLD.ground;
const AUTO = 1.4;
const IS_TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

// Stage 4 boss battle: the Four-Armed Creative Golem. Easy by design: there is
// no health to lose, no game over, no timers. Every challenge can be retried as
// often as needed, a hint appears after the first slip, and "Skip battle"
// carries the story on.

function wait(game, seconds) {
  return new Promise((resolve) => {
    let t = 0;
    const tick = (dt) => { t += dt; if (t >= seconds) { game.offTick(tick); resolve(); } };
    game.onTick(tick);
  });
}

function walkTo(game, ch, x, timeout = 6) {
  return new Promise((resolve) => {
    let t = 0;
    let done = false;
    const finish = () => { if (done) return; done = true; game.offTick(tick); ch.autopilot = null; ch.control.move = 0; resolve(); };
    ch.autopilot = { x, run: Math.abs(x - ch.x) > 120, tolerance: 3, onArrive: finish };
    const tick = (dt) => { t += dt; if (t > timeout) finish(); };
    game.onTick(tick);
  });
}

// ---------------------------------------------------------------------------
// Boss UI: indicators, panel, tip, jump button, banners
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function updateSystems(game, flash = null) {
  const g = game.golem;
  let active = 0;
  for (const li of $('boss-systems').children) {
    const id = li.dataset.sys;
    const off = g.arms[ARM_OF[id]].off;
    if (!off) active++;
    li.classList.toggle('is-off', off);
    li.setAttribute('aria-label', `${li.textContent.replace('✓', '').trim()} design: ${off ? 'offline' : 'active'}`);
    if (flash === id) { li.classList.remove('is-flash'); void li.offsetWidth; li.classList.add('is-flash'); }
  }
  $('boss-count').textContent = active === 0 ? 'All creative systems offline' : `${active} creative system${active === 1 ? '' : 's'} active`;
}

function bossBegin(game) {
  game.bossActive = true;
  game.bossMusic = true;
  game.input.captureScrollKeys = true;
  document.body.classList.add('is-boss');
  $('boss-hud').hidden = false;
  const skip = $('skip-scene');
  game.skipLabel = skip.textContent;
  skip.textContent = 'Skip battle ▸▸';
  updateSystems(game);
}

function bossEnd(game) {
  game.bossActive = false;
  game.bossMusic = false;
  game.bossJump = false;
  game.golem.autoJump = false;
  game.input.captureScrollKeys = game.mode === 'explore';
  document.body.classList.remove('is-boss');
  $('boss-hud').hidden = true;
  closePanel(game);
  tip(null);
  $('boss-jump').hidden = true;
  if (game.skipLabel) $('skip-scene').textContent = game.skipLabel;
}

function banner(big, sub, kind = '') {
  const el = $('boss-banner');
  el.querySelector('.boss-banner__big').textContent = big;
  el.querySelector('.boss-banner__sub').textContent = sub;
  el.dataset.kind = kind;
  el.classList.remove('is-on');
  void el.offsetWidth;
  el.classList.add('is-on');
  const live = $('sr-live');
  if (live) live.textContent = `${big} ${sub}`;
}

function tip(text, kind = '') {
  const el = $('boss-tip');
  if (!text) { el.hidden = true; el.textContent = ''; return el; }
  el.hidden = false;
  el.dataset.kind = kind;
  el.textContent = text;
  return el;
}

function openPanel(ph) {
  $('boss-panel-eyebrow').textContent = `Phase ${ph.num} · ${ph.discipline}`;
  $('boss-panel-title').textContent = ph.title;
  const body = $('boss-panel-body');
  body.innerHTML = '';
  $('boss-panel').hidden = false;
  return body;
}

function closePanel(game) {
  $('boss-panel').hidden = true;
  $('boss-panel-body').innerHTML = '';
  if (game && game.activePuzzle && game.activePuzzle.destroy) game.activePuzzle.destroy();
  if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#boss-panel')) document.activeElement.blur();
}

// keep the boy, the girl and the golem in shot: the boy just left of centre,
// the golem to the right, room for the challenge panel on the left
function arenaCamera(game) {
  const cam = game.camera;
  const narrow = cam.viewW < 520;
  return { x: narrow ? GOLEM.arena - cam.viewW * 0.22 : GOLEM.arena - cam.viewW * 0.57, y: G - cam.viewH * 0.74, rate: 1.6 };
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

const MOUNT = { graphic: mountPoster, visual: mountHierarchy, product: mountFlow };
const FLING = {
  graphic: [{ c: '#c8553d', shape: 'circle' }, { c: '#e3b13c', shape: 'bar' }, { c: '#8fae8b', shape: 'tri' }],
  visual: [{ c: '#b79ad8', shape: 'bar' }, { c: '#f2b58a', shape: 'bar' }, { c: '#8fae8b', shape: 'bar' }],
  product: [{ c: '#4fb3a8', shape: 'node' }, { c: '#f3e6d2', shape: 'node' }, { c: '#8fae8b', shape: 'node' }],
};

async function attackWarning(game, arm) {
  const g = game.golem;
  g.windup(arm);
  game.audio.sfx('whirr');
  await wait(game, REDUCED_MOTION ? 0.5 : 0.9);
  g.attack(arm);
}

// Phases 1, 3, 4: puzzle panels
async function puzzlePhase(game, ph) {
  const g = game.golem;
  const arm = ARM_OF[ph.id];
  game.bubbles.say(game.girl, ph.girl, { duration: 4.5 });
  await attackWarning(game, arm);
  game.audio.sfx(ph.id === 'graphic' ? 'splat' : ph.id === 'visual' ? 'prism' : 'holo');
  g.throwAt(arm, game.player, FLING[ph.id]);
  await wait(game, 0.55);
  g.hold(arm);
  const body = openPanel(ph);
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (done) return; done = true; resolve(); };
    const handle = MOUNT[ph.id](body, {
      audio: game.audio,
      onMiss: () => { g.goofy(); game.audio.sfx('laugh'); },
      onPlace: () => { g.nod(); game.audio.sfx('clank'); },
      onDone: finish,
    });
    game.activePuzzle = { solveNow: () => { handle.solveNow(); setTimeout(finish, 50); }, destroy: handle.destroy };
    if (game.fastForward) game.activePuzzle.solveNow();
  });
  closePanel(game);
  game.activePuzzle = null;
  g.recover(arm);
}

// Phase 2: motion timing, played in the world itself
async function motionPhase(game, ph) {
  const g = game.golem;
  const { player } = game;
  game.bubbles.say(game.girl, ph.girl, { duration: 4.5 });
  const jumpBtn = $('boss-jump');
  jumpBtn.hidden = false;
  game.bossJump = true;
  const press = IS_TOUCH ? 'Tap JUMP' : 'Press SPACE (or click JUMP)';
  let cleared = 0;
  let misses = 0;
  game.activePuzzle = { solveNow: () => { g.autoJump = true; } };
  if (game.fastForward) g.autoJump = true;
  tip(`Motion Timing · ${press} to jump over 2 waves`);
  await wait(game, 0.8);
  while (cleared < 2) {
    // a generous warning: the reel winds up, the floor lights a path to his feet
    g.windup('reel');
    g.showWarning(player, true);
    game.audio.sfx('warn');
    tip(`Wave ${cleared + 1} of 2 is coming… get ready`, 'go');
    await wait(game, misses ? 1.8 : 1.4);
    g.attack('reel');
    game.audio.sfx('wave');
    tip(`${press} when the glow reaches your feet!`, 'go');
    const ok = await g.launchWave({ speed: misses ? 52 : 68, player });
    g.showWarning(player, false);
    g.recover('reel');
    if (ok) {
      cleared++;
      game.renderer.sparkle(player.x, player.y - 40, 10);
      game.audio.sfx('success');
      tip(cleared < 2 ? 'Nice jump! One more wave.' : 'Perfect timing!', 'right');
    } else {
      misses++;
      g.goofy();
      game.audio.sfx('bonk');
      game.renderer.puff(player.x + 6, G - 6, 6);
      game.renderer.exclaim(player);
      // a hint straight after the first miss; and an offer to help after a few
      const t = tip(`No problem, it's harmless. Hint: ${press} just as the glowing wave reaches your feet. Here comes another.`);
      if (misses >= 2 && !g.autoJump) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pixel-btn pixel-btn--small';
        b.textContent = 'Jump for me';
        b.addEventListener('click', () => { g.autoJump = true; b.remove(); });
        t.append(b);
      }
    }
    await wait(game, 1.1);
  }
  game.bossJump = false;
  g.autoJump = false;
  jumpBtn.hidden = true;
  tip(null);
  game.activePuzzle = null;
}

async function shutDown(game, ph) {
  const g = game.golem;
  const arm = ARM_OF[ph.id];
  g.disable(arm);
  game.audio.sfx('disable');
  if (arm === 'reel') game.audio.sfx('reel');
  if (arm === 'prism') game.audio.sfx('sparkle');
  if (arm === 'holo') game.audio.sfx('success');
  updateSystems(game, ph.id);
  tip(ph.offline, 'right');
  game.story.seen.add(`golem-${ph.id}`);
  game.story.save();
  const off = Object.values(g.arms).filter((a) => a.off).length;
  g.weakT = off >= 2 ? Math.min(1, (off - 1) / 3) : 0;
  await wait(game, REDUCED_MOTION ? 1 : 1.6);
  tip(null);
}

async function runPhase(game, ph) {
  if (ph.id === 'motion') await motionPhase(game, ph);
  else await puzzlePhase(game, ph);
  await shutDown(game, ph);
}

// ---------------------------------------------------------------------------
// The battle
// ---------------------------------------------------------------------------

async function setUp(game) {
  const { player, girl, camera } = game;
  girl.scripted = true;
  girl.autopilot = { x: GOLEM.girl, run: false, tolerance: 4, onArrive: () => { girl.autopilot = null; girl.control.move = 0; girl.facing = 1; } };
  await walkTo(game, player, GOLEM.arena, 5);
  player.facing = 1;
  const keep = () => { camera.override = arenaCamera(game); };
  game.onTick(keep);
  return () => { game.offTick(keep); camera.override = null; };
}

export async function golem(game) {
  const { player, girl, audio } = game;
  const g = game.golem;
  const seen = game.story.seen;
  let release = null;
  bossBegin(game);
  try {
    release = await setUp(game);

    if (!seen.has('golem-intro')) {
      // dormant idle → mechanical awakening
      audio.sfx('clank');
      g.shake = 0.8;
      g.puffAll(4);
      await wait(game, 0.7);
      game.renderer.exclaim(girl);
      audio.sfx('surprise');
      g.eyesT = 0.4; await wait(game, 0.15); g.eyesT = 0; await wait(game, 0.18); g.eyesT = 1;
      audio.sfx('whirr');
      g.wake();
      for (const a of Object.values(g.arms)) { if (!a.off) { a.powerT = 0; a.droopT = 0.3; } }
      audio.sfx('stomp');
      await wait(game, REDUCED_MOTION ? 0.4 : 1.1);
      // boss introduction: each arm powers up, one by one, while they talk
      banner('BOSS BATTLE', 'The Four-Armed Creative Golem', 'battle');
      audio.sfx('boss');
      const intro = (async () => {
        for (const id of ['brush', 'reel', 'prism', 'holo']) {
          if (g.arms[id].off) continue;
          g.relight(id);
          audio.sfx('powerup');
          await wait(game, 0.45);
        }
        g.goofy();
        audio.sfx('laugh');
      })();
      await game.say('golem-wake', { auto: AUTO });
      await intro;
      seen.add('golem-intro');
      game.story.save();
    } else {
      // a returning visitor: a quick wake-up, straight back into the battle
      g.wake();
      g.eyesT = 1;
      audio.sfx('whirr');
      banner('BOSS BATTLE', 'Round two!', 'battle');
      await wait(game, 1.2);
    }

    for (const ph of BOSS.phases) {
      if (seen.has(`golem-${ph.id}`)) continue;
      await runPhase(game, ph);
    }

    await victory(game);
  } finally {
    if (release) release();
    girl.scripted = false;
    girl.autopilot = null;
    bossEnd(game);
    player.facing = 1;
  }
}

async function victory(game) {
  const { player, girl, audio } = game;
  const g = game.golem;
  const seen = game.story.seen;
  for (const a of Object.values(g.arms)) { a.charge = false; a.raiseT = 0; a.swingT = 0; }
  g.weakT = 1;
  g.setExpr('surprised', 1);
  await wait(game, 0.6);
  // it looks at its empty arms… then at the boy… and gives a little thumbs-up
  for (const a of Object.values(g.arms)) a.droopT = 0.85;
  g.lookT = { x: -1, y: 1 }; await wait(game, REDUCED_MOTION ? 0.3 : 0.75);
  g.lookT = { x: 1, y: 1 }; await wait(game, REDUCED_MOTION ? 0.3 : 0.75);
  g.lookT = { x: -1, y: 0 }; await wait(game, 0.5);
  g.arms.prism.thumbT = 1;
  audio.sfx('thumb');
  await wait(game, 1.3);
  g.arms.prism.thumbT = 0;
  // eyes dim slowly, the arms drop gently
  g.eyesT = 0.15;
  audio.sfx('powerdown');
  for (const a of Object.values(g.arms)) a.droopT = 1;
  await wait(game, REDUCED_MOTION ? 0.6 : 1.5);
  // the chest opens: four glowing creative symbols, orbiting the boy
  g.chestT = 1;
  audio.sfx('clank');
  await wait(game, 0.7);
  g.releaseSymbols();
  audio.sfx('hats');
  await wait(game, 1.4);
  // it sits down, with a funny mechanical sound
  g.chestT = 0;
  g.sitT = 1;
  g.headT = 0.35;
  audio.sfx('sitdown');
  await wait(game, 0.9);
  g.shake = 0.6;
  g.puffAll(6);
  await wait(game, 0.4);
  // the studio lights come back on
  g.darkT = 0;
  game.flash = 0.5;
  game.bossMusic = false;
  audio.sfx('lightson');
  for (const li of $('boss-systems').children) li.classList.add('is-off');
  banner('BOSS DEFEATED!', 'One designer. Four creative hats.');
  audio.sfx('victory');
  await wait(game, REDUCED_MOTION ? 1.5 : 3.2);
  player.facing = -1;
  girl.facing = 1;
  await game.say('golem-victory', { auto: AUTO + 0.4 });
  player.facing = 1;
  g.endSymbols();
  g.setRest(true);
  seen.add('golem-defeated');
  game.openStationGate();
  game.story.save();
  await wait(game, 0.5);
}

// The Boss Book: replay one challenge. The golem wakes up, relights that one arm,
// and settles back down when it's done.
export async function golemReplay(game) {
  const id = game.bossReplay || 'graphic';
  const ph = BOSS.phases.find((p) => p.id === id);
  const g = game.golem;
  const { girl, audio } = game;
  let release = null;
  bossBegin(game);
  try {
    release = await setUp(game);
    g.rest = false;
    g.awake = true;
    g.sitT = 0; g.headT = 0; g.eyesT = 1; g.darkT = 0.6; g.weakT = 0;
    for (const a of Object.values(g.arms)) { a.droopT = 0.55; }
    audio.sfx('whirr');
    await wait(game, 1.0);
    g.relight(ARM_OF[id]);
    audio.sfx('powerup');
    updateSystems(game);
    banner('REPLAY', `Phase ${ph.num} · ${ph.title}`, 'battle');
    await wait(game, 1.2);
    await runPhase(game, ph);
    for (const a of Object.values(g.arms)) a.droopT = 1;
    g.eyesT = 0.2;
    g.sitT = 1;
    g.headT = 0.35;
    g.darkT = 0;
    audio.sfx('sitdown');
    await wait(game, 1.2);
    g.setRest(true);
  } finally {
    if (release) release();
    girl.scripted = false;
    girl.autopilot = null;
    bossEnd(game);
  }
}

export function bossBookCard(game) {
  const rows = BOSS.phases.map((p) => `
    <li><div><strong>Phase ${p.num} · ${p.title}</strong><span>${p.discipline} · ${p.arm}</span></div>
    <button type="button" class="pixel-btn pixel-btn--small" data-replay="${p.id}">Replay ▸</button></li>`).join('');
  return {
    eyebrow: 'The Four-Armed Creative Golem',
    title: 'Boss Book',
    html: `<p>One designer, four creative hats. Replay any challenge. The golem doesn't mind; it rather enjoys it.</p><ol class="boss-book">${rows}</ol>`,
  };
}
