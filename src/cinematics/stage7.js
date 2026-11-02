import { WORLD, REDUCED_MOTION } from '../config.js';
import { OVERLOOK, MEMORIES } from '../world/level.js';
import { RECAP } from '../content/chapter01.js';

const G = WORLD.ground;
const AUTO = 2.4;

// Stage 7 scenes: the Great Overlook, the journey recap, the designer identity
// and the gateway to Chapter 02.

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

const sky = (game, x, zoom, rate = 0.8) => {
  const { camera } = game;
  game.setZoom(zoom);
  const keep = () => { camera.override = { x: x - camera.viewW / 2, y: G - 150 - camera.viewH / 2, rate }; };
  keep();
  game.onTick(keep);
  return () => { game.offTick(keep); camera.override = null; game.setZoom(1); };
};

export async function overlookArrive(game) {
  game.player.facing = 1;
  game.showChapterCard({ eyebrow: 'Chapter 01 · Final part', title: 'The Awakening', meta: 'The designer within' });
  // a slow pull back over the whole journey
  const release = sky(game, 18255, 1.55, 0.5);
  await wait(game, 2.2);
  await game.say('overlook-arrive', { auto: AUTO });
  release();
}

export async function recap(game) {
  const { renderer, audio } = game;
  game.player.facing = 1;
  const release = sky(game, 18255, 1.55, 0.7);
  await wait(game, 1.2);
  // each part of the journey lights up in turn
  for (let i = 0; i < MEMORIES.length; i++) {
    const m = MEMORIES[i];
    renderer.lightMemory(i);
    audio.sfx('chime', i);
    game.showRecap(`${m.num} · ${RECAP[m.id].title}`, RECAP[m.id].text);
    await wait(game, REDUCED_MOTION ? 1.6 : 2.6);
  }
  game.hideRecap();
  await game.say('recap-connect', { auto: AUTO });
  // ...and they connect into one continuous journey
  renderer.memLinksOn = true;
  audio.sfx('connect');
  await wait(game, REDUCED_MOTION ? 0.5 : 3.4);
  release();
}

export async function identity(game) {
  const { player, renderer, audio, camera } = game;
  await walkTo(game, player, OVERLOOK.canvas - 46, 5);
  player.facing = 1;
  camera.override = { x: OVERLOOK.canvas - 20 - camera.viewW / 2, y: G - 60 - camera.viewH * 0.66, rate: 1.1 };
  await game.say('identity', { auto: AUTO });
  renderer.canvasTarget = 1;
  audio.sfx('hats');
  renderer.sparkle(OVERLOOK.canvas, G - 140, 24);
  await wait(game, REDUCED_MOTION ? 1.5 : 4.5);
  camera.override = null;
}

export async function nextAdventure(game) {
  const { player, renderer, audio, camera } = game;
  player.facing = 1;
  camera.override = { x: OVERLOOK.gate - 40 - camera.viewW / 2, y: G - camera.viewH * 0.76, rate: 1 };
  await game.say('next-adventure', { auto: AUTO });
  renderer.finaleTarget = 1;
  audio.sfx('gate');
  await wait(game, REDUCED_MOTION ? 0.5 : 2.6);
  game.openFinaleGate();
  camera.override = null;
}

export async function chapterTwo(game) {
  const { audio, renderer } = game;
  game.player.facing = 1;
  audio.sfx('portal');
  renderer.sparkle(OVERLOOK.gate, G - 80, 30);
  game.flash = 0.8;
  await wait(game, 0.8);
  game.story.seen.add('chapter-complete');
  game.story.save();
  await game.hud.openCard(game.chapterCompleteCard());
}
