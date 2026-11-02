import { WORLD, REDUCED_MOTION } from '../config.js';
import { STUDIO, STATIONS, DESIGN_WALL, INTERIOR, ACADEMY } from '../world/level.js';

const G = WORLD.ground;
const AUTO = 2.4;

// Stage 4 scenes: into the studio, the one-person design team, the four
// creative stations, the creative hats, the missing piece and the decision.

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

// Through the studio door: forest sparks become design elements, then inside.
export async function studioDoor(game) {
  const { player, girl, renderer, audio } = game;
  player.facing = 1;
  await game.say('studio-door', { auto: AUTO });
  audio.sfx('door');
  const open = (dt) => { renderer.studioDoorOpen = Math.min(1, renderer.studioDoorOpen + dt * 2); };
  game.onTick(open);
  girl.scripted = true;
  girl.autopilot = { x: STUDIO.door - 6, run: false, tolerance: 4 };
  await walkTo(game, player, STUDIO.door + 4, 4);
  for (let i = 0; i < 3; i++) renderer.sparkle(STUDIO.door + (i - 1) * 20, G - 50 - i * 10, 14);
  await Promise.all([fade(game, player, 0, 0.45), fade(game, girl, 0, 0.55)]);
  game.flash = 0.9;
  await wait(game, 0.35);
  game.offTick(open);
  game.enterStudio();
  game.showChapterCard({ eyebrow: 'Chapter 01 · Part 04', title: 'The First Workplace', meta: 'Valluva HCM Cloud Suite · an IT company' });
  await Promise.all([fade(game, player, 1, 0.5), fade(game, girl, 1, 0.5)]);
  girl.scripted = false;
  audio.sfx('sparkle');
  await wait(game, 1.4);
}

export async function studioEnter(game) {
  game.player.facing = 1;
  await game.say('studio-enter', { auto: AUTO });
}

export async function oneTeam(game) {
  const { player, girl, renderer, camera } = game;
  player.facing = 1;
  // the camera pulls back to reveal the whole, very quiet studio
  game.setZoom(1.5);
  // keep the pair in shot on the left, the four empty desks stretching away to the right
  const frame = () => ({
    x: camera.viewW < 520 ? player.x - camera.viewW * 0.3 : player.x - 70 - camera.viewW * 0.12,
    y: G - camera.viewH * 0.68,
    rate: 1.1,
  });
  const keep = () => { camera.override = frame(); };
  game.onTick(keep);
  await wait(game, 1.6);
  await game.say('one-team', { auto: AUTO });
  // ...a beat. She turns to him.
  girl.facing = 1;
  girl.pose = 'front';
  renderer.exclaim(girl);
  game.audio.sfx('surprise');
  await wait(game, REDUCED_MOTION ? 0.3 : 1.1);
  girl.pose = null;
  girl.facing = 1;
  await game.say('one-team-2', { auto: AUTO });
  game.offTick(keep);
  camera.override = null;
  game.setZoom(1);
  // as he names each discipline, a hat appears and keeps changing
  renderer.hats.cycle = true;
  renderer.hats.cycleT = 0;
  await game.say('one-team-3', { auto: AUTO });
  await wait(game, 0.4);
  renderer.hats.cycle = false;
}

export async function station(game, id) {
  const { player, renderer, camera, audio } = game;
  const st = STATIONS.find((s) => s.id === id);
  await walkTo(game, player, st.x - 34, 4);
  player.facing = 1;
  // the camera eases in on the desk, the monitors wake up, the work comes alive
  camera.override = { x: st.x - 20 - camera.viewW / 2, y: G - camera.viewH * 0.7, rate: 2 };
  renderer.activateStation(id);
  audio.sfx('station');
  await wait(game, REDUCED_MOTION ? 0.2 : 1.0);
  await game.say(`station-${id}`, { auto: AUTO });
  await wait(game, REDUCED_MOTION ? 0.2 : 0.8);
  renderer.earnHat(id);
  audio.sfx('hat');
  await wait(game, 1.0);
  camera.override = null;
  game.story.seen.add(`station-${id}`);
  game.story.save();
  if (STATIONS.every((s) => renderer.stations[s.id].found) && !game.story.seen.has('hats')) game.runScene('hats');
}

export async function hats(game) {
  const { player, renderer, audio } = game;
  player.facing = 1;
  renderer.hats.orbit = 0.01;
  renderer.hats.orbitT = 0;
  const grow = (dt) => { renderer.hats.orbit = Math.min(1, renderer.hats.orbit + dt * 1.5); };
  game.onTick(grow);
  audio.sfx('hats');
  game.showChapterCard({ eyebrow: 'Valluva HCM Cloud Suite', title: 'One designer. Multiple creative hats.', meta: '' });
  await wait(game, REDUCED_MOTION ? 1.5 : 4.2);
  game.offTick(grow);
  const shrink = (dt) => {
    renderer.hats.orbit = Math.max(0, renderer.hats.orbit - dt * 0.8);
    if (renderer.hats.orbit <= 0) game.offTick(shrink);
  };
  game.onTick(shrink);
  game.story.seen.add('hats');
  game.openStationGate();
  game.story.save();
}

export async function missingPiece(game) {
  const { player, girl, renderer, camera } = game;
  await walkTo(game, player, DESIGN_WALL.x - 20, 4);
  player.facing = 1;
  // everything quietens down; the camera moves in slowly
  renderer.quietTarget = 1;
  game.audio.setQuiet(true);
  game.setZoom(0.86);
  const keep = () => { camera.override = { x: DESIGN_WALL.x - 30 - camera.viewW / 2, y: G - camera.viewH * 0.7, rate: 0.8 }; };
  game.onTick(keep);
  girl.scripted = true;
  await new Promise((resolve) => {
    girl.autopilot = { x: DESIGN_WALL.x - 52, run: false, tolerance: 3, onArrive: resolve };
    game.later(3, resolve);
  });
  girl.autopilot = null;
  girl.facing = 1;
  await wait(game, 0.8);
  await game.say('missing-piece', { auto: AUTO + 0.4 });
  await wait(game, REDUCED_MOTION ? 0.3 : 1.4);
  player.facing = -1;
  await game.say('missing-piece-2', { auto: AUTO + 0.4 });
  player.facing = 1;
  girl.scripted = false;
  game.offTick(keep);
  camera.override = null;
  game.setZoom(1);
  renderer.quietTarget = 0;
  game.audio.setQuiet(false);
}

export async function decision(game) {
  const { player, camera } = game;
  player.facing = 1;
  camera.override = { x: ACADEMY.sign - camera.viewW * 0.45, y: G - camera.viewH * 0.72, rate: 1.4 };
  await game.say('decision', { auto: AUTO });
  camera.override = null;
}
