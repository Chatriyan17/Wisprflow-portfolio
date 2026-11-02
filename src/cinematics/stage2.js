import { WORLD, REDUCED_MOTION } from '../config.js';
import { SCRIPTS } from '../content/chapter01.js';
import { BREAK, HALL } from '../world/level.js';

const G = WORLD.ground;
const AUTO = 2.4;   // seconds a finished line lingers before the scene moves on

// Stage 2 scenes: the walk into the Old Workshop, the observation platform,
// the break-yard talk, and the memory of the conversation with friends.
// Each scene plays the same in Scroll Journey and Explore World.

function wait(game, seconds) {
  return new Promise((resolve) => {
    let t = 0;
    const tick = (dt) => {
      t += dt;
      if (t >= seconds) { game.offTick(tick); resolve(); }
    };
    game.onTick(tick);
  });
}

function walkTo(game, ch, x, timeout = 6) {
  return new Promise((resolve) => {
    let t = 0;
    let done = false;
    const finish = () => { if (done) return; done = true; game.offTick(tick); ch.autopilot = null; ch.control.move = 0; resolve(); };
    ch.autopilot = { x, run: false, tolerance: 2, onArrive: finish };
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

export async function enterWorkshop(game) {
  game.player.facing = 1;
  await game.say(SCRIPTS['enter-workshop'], { auto: AUTO });
}

export async function observation(game) {
  const { player, camera } = game;
  // stop on the platform and look back out over the factory floor
  player.facing = -1;
  camera.override = { x: Math.max(HALL.x0, player.x - camera.viewW * 0.7), y: player.y - camera.viewH * 0.62, rate: 1.4 };
  await game.say(SCRIPTS.observation, { auto: AUTO });
  camera.override = null;
}

export async function breakTalk(game) {
  game.player.facing = 1;
  await game.say(SCRIPTS['break-talk'], { auto: AUTO });
}

export async function memory(game) {
  const { player, girl, renderer, audio } = game;
  // step up to the table where it happened
  await walkTo(game, player, BREAK.table - 48);
  player.facing = 1;
  await wait(game, 0.3);

  // drift into the memory: the world warms and softens, the companion fades away
  girl.scripted = true;
  girl.control.move = 0;
  game.setMemory(true);
  audio.sfx('memory');
  await fade(game, girl, 0, 0.8);
  girl.visible = false;
  await wait(game, 0.9);

  await game.say(SCRIPTS.memory, { auto: AUTO });
  await wait(game, 0.4);

  // back to the present: she's right there beside him
  game.setMemory(false);
  await wait(game, 1.0);
  girl.x = player.x - 30;
  girl.y = player.y;
  girl.vx = 0;
  girl.facing = 1;
  girl.visible = true;
  girl.alpha = 0;
  renderer.sparkle(girl.x, girl.y - 34, 14);
  audio.sfx('sparkle');
  await fade(game, girl, 1, 0.4);
  player.facing = -1;
  await wait(game, 0.3);
  await game.say(SCRIPTS['memory-after'], { auto: AUTO });
  player.facing = 1;
  girl.scripted = false;
}
