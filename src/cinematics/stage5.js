import { WORLD, REDUCED_MOTION } from '../config.js';
import { CAMPUS, LAB, FOUNDATION, MENTOR, ACADEMY } from '../world/level.js';
import { mountLabPuzzle } from '../ui/labPuzzle.js';

const G = WORLD.ground;
const AUTO = 2.4;

// Stage 5 scenes: into the Knowledge Academy, the gates, the learning halls,
// the interaction design lab, the Foundation Wall and the mentor's signal.

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
    ch.autopilot = { x, run: false, tolerance: 3, onArrive: finish };
    const tick = (dt) => { t += dt; if (t > timeout) finish(); };
    game.onTick(tick);
  });
}

function fade(game, ch, to, seconds) {
  return new Promise((resolve) => {
    const from = ch.alpha;
    let t = 0;
    const tick = (dt) => {
      t += dt;
      const k = REDUCED_MOTION ? 1 : Math.min(1, t / seconds);
      ch.alpha = from + (to - from) * k;
      if (k >= 1) { game.offTick(tick); resolve(); }
    };
    game.onTick(tick);
  });
}

// From the studio's academy doorway onto the campus.
export async function academyDoor(game) {
  const { player, girl, renderer, audio } = game;
  player.facing = 1;
  await game.say('academy', { auto: AUTO });
  audio.sfx('portal');
  girl.scripted = true;
  girl.autopilot = { x: ACADEMY.door - 6, run: false, tolerance: 4 };
  await walkTo(game, player, ACADEMY.door + 2, 4);
  // design sketches turning into books and learning symbols
  for (let i = 0; i < 4; i++) renderer.sparkle(ACADEMY.door + (i - 1.5) * 16, G - 40 - i * 12, 12);
  await Promise.all([fade(game, player, 0, 0.45), fade(game, girl, 0, 0.55)]);
  game.flash = 1;
  await wait(game, 0.4);
  game.enterCampus();
  game.showChapterCard({ eyebrow: 'Chapter 01 · Part 05', title: 'The Knowledge Academy', meta: 'Master of Design · Interaction Design' });
  renderer.sparkle(CAMPUS.entry - 30, G - 60, 24);
  await Promise.all([fade(game, player, 1, 0.5), fade(game, girl, 1, 0.5)]);
  girl.scripted = false;
  audio.sfx('sparkle');
  await wait(game, 1.2);
}

export async function campusArrive(game) {
  const { player, girl, renderer, audio, camera } = game;
  await walkTo(game, player, CAMPUS.gate - 76, 4);
  player.facing = 1;
  // look up at the gates and the great hall behind them
  camera.override = { x: CAMPUS.gate - camera.viewW * 0.45, y: G - camera.viewH * 0.78, rate: 1.2 };
  girl.facing = 1;
  await wait(game, 0.8);
  await game.say('campus-arrive', { auto: AUTO });
  // the university gates open
  renderer.gateTarget = 1;
  audio.sfx('gate');
  await wait(game, REDUCED_MOTION ? 0.2 : 1.6);
  game.openCampusGate();
  camera.override = null;
}

export async function campusEnter(game) {
  game.player.facing = 1;
  await game.say('campus-enter', { auto: AUTO });
}

export async function fundamentals(game) {
  game.player.facing = 1;
  await game.say('fundamentals', { auto: AUTO });
}

export async function library(game) {
  game.player.facing = 1;
  await game.say('library', { auto: AUTO });
}

export async function lab(game) {
  const { player, renderer, audio, camera, hud } = game;
  await walkTo(game, player, LAB.station - 30, 4);
  player.facing = 1;
  camera.override = { x: LAB.station - camera.viewW / 2, y: G - camera.viewH * 0.72, rate: 2 };
  audio.sfx('station');
  await wait(game, 0.6);
  const closed = hud.openCard({ eyebrow: 'Interaction Design Lab', title: 'Make this screen work', html: '<div id="lab-puzzle"></div>' });
  mountLabPuzzle(document.getElementById('lab-puzzle'), {
    audio,
    onSolved: () => {
      renderer.labSolved = true;
      game.story.seen.add('lab-solved');
      game.story.save();
    },
  });
  await closed;
  await game.say('lab', { auto: AUTO });
  camera.override = null;
}

export async function foundation(game) {
  const { player, camera, audio } = game;
  player.facing = 1;
  audio.sfx('connect');
  // pull back to take in the whole illuminated wall
  game.setZoom(1.35);
  const mid = (FOUNDATION.x0 + FOUNDATION.x1) / 2;
  const keep = () => { camera.override = { x: mid + 40 - camera.viewW / 2, y: G - camera.viewH * 0.74, rate: 1.1 }; };
  game.onTick(keep);
  await wait(game, 1.4);
  await game.say('foundation', { auto: AUTO });
  game.offTick(keep);
  camera.override = null;
  game.setZoom(1);
}

export async function horizon(game) {
  const { player, renderer, audio, camera } = game;
  player.facing = 1;
  // a quiet courtyard; he looks towards the horizon
  camera.override = { x: MENTOR.sign - camera.viewW * 0.55, y: G - camera.viewH * 0.78, rate: 0.9 };
  await wait(game, 1.0);
  await game.say('horizon', { auto: AUTO });
  renderer.mentorTarget = 1;
  audio.sfx('mentor');
  await wait(game, REDUCED_MOTION ? 0.3 : 2.4);
  camera.override = null;
}
