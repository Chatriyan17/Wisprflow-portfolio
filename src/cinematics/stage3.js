import { WORLD, REDUCED_MOTION } from '../config.js';
import { PORTAL, STATION, HILL } from '../world/level.js';
import { COURSE } from '../content/chapter01.js';

const G = WORLD.ground;
const AUTO = 2.4;

// Stage 3 scenes: stepping through the gateway, the first question, the
// learning station and the curiosity moment among the industry islands.

function wait(game, seconds) {
  return new Promise((resolve) => {
    let t = 0;
    const tick = (dt) => { t += dt; if (t >= seconds) { game.offTick(tick); resolve(); } };
    game.onTick(tick);
  });
}

function walkTo(game, ch, x, timeout = 6, run = false) {
  return new Promise((resolve) => {
    let t = 0;
    let done = false;
    const finish = () => { if (done) return; done = true; game.offTick(tick); ch.autopilot = null; ch.control.move = 0; resolve(); };
    ch.autopilot = { x, run, tolerance: 3, onArrive: finish };
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

export async function gateway(game) {
  const { player, girl, renderer, audio, camera } = game;
  player.facing = 1;
  await game.say('gateway', { auto: AUTO });
  // the gateway opens
  game.openGateway();
  audio.sfx('portal');
  renderer.sparkle(PORTAL.x, PORTAL.y - 70, 30);
  girl.scripted = true;
  girl.autopilot = { x: PORTAL.x - 6, run: false, tolerance: 4 };
  await walkTo(game, player, PORTAL.x + 2, 4);
  game.flash = 0.6;
  await Promise.all([fade(game, player, 0, 0.5), fade(game, girl, 0, 0.6)]);
  game.flash = 1;
  await wait(game, 0.4);
  // ... and they step out into a different world
  player.x = PORTAL.x + 160; player.y = G; player.vx = 0;
  girl.autopilot = null;
  girl.x = PORTAL.x + 126; girl.y = G; girl.vx = 0; girl.facing = 1;
  camera.follow(player, 0, true);
  game.showChapterCard({ eyebrow: 'Chapter 01 · Part 03', title: 'The Discovery Path', meta: 'The beginning of UX' });
  await wait(game, 0.6);
  renderer.sparkle(player.x, player.y - 34, 16);
  audio.sfx('sparkle');
  await Promise.all([fade(game, player, 1, 0.5), fade(game, girl, 1, 0.5)]);
  girl.scripted = false;
  await wait(game, 1.6);
}

export async function firstQuestion(game) {
  game.player.facing = 1;
  await game.say('first-question', { auto: AUTO });
}

export async function course(game) {
  const { player, renderer, audio, hud } = game;
  await walkTo(game, player, STATION.x - 44, 4);
  player.facing = 1;
  await game.say('course', { auto: AUTO });
  renderer.discoveriesOn = true;
  audio.sfx('discover');
  await wait(game, 1.2);
  const items = COURSE.discoveries.map((d) => `<li>${d}</li>`).join('');
  await hud.openCard({
    eyebrow: 'Chapter 01 · The Learning Camp',
    title: COURSE.name,
    html: `<p class="lede">${COURSE.platform}</p>`
      + '<p>Things I started to discover:</p>'
      + `<ul class="discoveries">${items}</ul>`
      + '<p class="note">My first steps into the fundamentals of UX.</p>',
  });
}

export async function curiosity(game) {
  const { player, girl, renderer, audio, camera } = game;
  // stand at the heart of the hill; every world rises into view
  await walkTo(game, player, HILL.x + 6, 4);
  player.facing = 1;
  for (const isl of renderer.islands) if (!isl.shown) { renderer.raiseIsland(isl.id); audio.sfx('discover'); }
  // the camera slowly pulls back to take it all in
  game.setZoom(1.45);
  const frame = () => ({ x: HILL.x - camera.viewW / 2, y: G - 118 - camera.viewH / 2, rate: 1.2 });
  camera.override = frame();
  const keepFramed = () => { camera.override = { ...frame(), rate: 1.2 }; };
  game.onTick(keepFramed);
  girl.facing = 1;
  await wait(game, 1.4);
  await game.say('curiosity', { auto: AUTO });
  // every world connects: curiosity joining the dots
  renderer.linksOn = true;
  audio.sfx('connect');
  await wait(game, REDUCED_MOTION ? 0.3 : 3.2);
  await game.say('curiosity-2', { auto: AUTO });
  game.offTick(keepFramed);
  game.setZoom(1);
  camera.override = null;
}
