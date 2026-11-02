import { WORLD, REDUCED_MOTION } from '../config.js';
import { MENTOR, CAMP, SCHOOL } from '../world/level.js';
import { mountMathPuzzle } from '../ui/mathPuzzle.js';

const G = WORLD.ground;
const AUTO = 2.4;

// Stage 6 scenes: to the Mentor's Camp, meeting UX Anudeep, the school memory with
// its playable puzzle, the realisation, the transformation, and the way back.

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

// From the campus courtyard along the lantern path to the camp.
export async function mentorDoor(game) {
  const { player, girl, renderer, audio } = game;
  player.facing = 1;
  await game.say('mentor', { auto: AUTO });
  girl.scripted = true;
  girl.autopilot = { x: MENTOR.door - 6, run: false, tolerance: 4 };
  await walkTo(game, player, MENTOR.door + 30, 4);
  await Promise.all([fade(game, player, 0, 0.6), fade(game, girl, 0, 0.7)]);
  game.flash = 0.5;
  await wait(game, 0.4);
  game.enterCamp();
  game.showChapterCard({ eyebrow: 'Chapter 01 · Part 06', title: "The Mentor's Camp", meta: 'Discovering the designer within' });
  await Promise.all([fade(game, player, 1, 0.7), fade(game, girl, 1, 0.7)]);
  girl.scripted = false;
  audio.sfx('mentor');
  renderer.sparkle(player.x, player.y - 40, 10);
  await wait(game, 1.4);
}

export async function campArrive(game) {
  game.player.facing = 1;
  await game.say('camp-arrive', { auto: AUTO });
}

// Meeting the mentor, his question, and the way back to where it all started.
export async function mentorMeet(game) {
  const { player, girl, renderer, camera, audio } = game;
  await walkTo(game, player, CAMP.mentor - 70, 5);
  player.facing = 1;
  girl.scripted = true;
  girl.autopilot = { x: CAMP.mentor - 110, run: false, tolerance: 4 };
  camera.override = { x: CAMP.board - camera.viewW / 2 + 10, y: G - camera.viewH * 0.72, rate: 1.2 };
  // the mentor writes his question on the blackboard
  renderer.mentorWriting = true;
  for (let k = 0; k <= 3; k += 0.05) { renderer.mentorBoard = k; await wait(game, 0.04); if (k % 1 < 0.05) audio.sfx('chalk'); }
  renderer.mentorWriting = false;
  girl.autopilot = null;
  girl.facing = 1;
  renderer.mentorTalking = true;
  await game.say('mentor-question', { auto: AUTO });
  renderer.mentorTalking = false;
  await schoolMemory(game);
  girl.scripted = false;
}

// The school memory: its own full classroom, a younger him, a teacher, and the puzzle.
export async function schoolMemory(game) {
  const { player, girl, renderer, camera, audio } = game;
  const back = { x: player.x, gx: girl.x };
  // the forest fades, the blackboard becomes a school blackboard, morning light
  game.setZoom(0.85);
  camera.override = { x: CAMP.board - camera.viewW / 2, y: G - 150 - camera.viewH / 2, rate: 1.6 };
  audio.setQuiet(true);
  audio.sfx('memory');
  await wait(game, 1.2);
  game.flash = 1;
  await wait(game, 0.3);
  game.setYoung(true);
  game.moveTo(SCHOOL.desk);
  girl.scripted = true;
  girl.autopilot = null; girl.control.move = 0; girl.vx = 0;
  girl.x = SCHOOL.girl; girl.y = G; girl.facing = 1; girl.alpha = 0.92;
  game.setSchool(true);
  game.setZoom(1);
  camera.override = { x: SCHOOL.board - 60 - camera.viewW / 2, y: G - camera.viewH * 0.74, rate: 1.4 };
  audio.setQuiet(false);
  audio.sfx('bell');
  await wait(game, 1.2);

  // the teacher demonstrates the first problem, step by step
  renderer.board.phase = 'demo';
  renderer.board.step = 0;
  renderer.board.stepT = 0;
  renderer.teacherWriting = true;
  player.facing = 1;
  await wait(game, REDUCED_MOTION ? 1 : 3.2);
  await game.say('school-watch', { auto: AUTO });
  while (renderer.board.step < 4) await wait(game, 0.2);
  await wait(game, 0.6);
  // ...then a second problem, with a small change
  renderer.board.phase = 'second';
  renderer.board.second = 0;
  audio.sfx('chalk');
  await wait(game, 1.2);

  // the visitor plays the memory
  if (game.mode === 'explore') {
    await game.waitForBoard();
  }
  await new Promise((resolve) => {
    const closed = game.hud.openCard({ eyebrow: 'A memory · school', title: 'The way I think', html: '<div id="math-puzzle"></div>' });
    let done = false;
    const finish = () => { if (done) return; done = true; game.activePuzzle = null; resolve(); };
    game.activePuzzle = mountMathPuzzle(document.getElementById('math-puzzle'), {
      audio,
      preferWatch: game.mode === 'scroll',
      onSolved: (close) => {
        renderer.board.phase = 'solved';
        renderer.teacherWriting = false;
        game.story.seen.add('puzzle-solved');
        if (close) game.hud.closeCard();
      },
    });
    closed.then(() => {
      // if the card was closed without solving it, the memory still carries on
      if (renderer.board.phase !== 'solved') { renderer.board.phase = 'solved'; renderer.teacherWriting = false; }
      finish();
    });
  });
  renderer.sparkle(SCHOOL.board, G - 140, 20);
  audio.sfx('success');
  await wait(game, 0.6);

  // the realisation
  await game.say('school-realise', { auto: AUTO });
  await wait(game, REDUCED_MOTION ? 0.2 : 0.9);
  girl.facing = 1;
  await game.say('school-realise-2', { auto: AUTO + 0.4 });

  // silence, then the blackboard transforms into design
  audio.setQuiet(true);
  audio.mute(true);
  renderer.teacherWriting = false;
  camera.override = { x: SCHOOL.board - camera.viewW / 2, y: G - 132 - camera.viewH / 2, rate: 1.2 };
  game.setZoom(0.78);
  await wait(game, 1.0);
  renderer.board.phase = 'transform';
  renderer.board.transform = 0;
  audio.mute(false);
  audio.sfx('transform');
  while (renderer.board.transform < 1) await wait(game, 0.2);
  await wait(game, 0.8);
  // the camera pulls back
  game.setZoom(1.3);
  camera.override = { x: SCHOOL.board - 120 - camera.viewW / 2, y: G - camera.viewH * 0.72, rate: 0.9 };
  await wait(game, 1.6);
  await game.say('school-pullback', { auto: AUTO + 0.6 });
  game.showStatement();
  await wait(game, REDUCED_MOTION ? 2 : 5.5);
  game.hideStatement();
  audio.setQuiet(false);

  // back to the present, in the mentor's cabin
  game.flash = 1;
  await wait(game, 0.3);
  game.setSchool(false);
  game.setYoung(false);
  game.setZoom(1);
  camera.override = null;
  game.moveTo(back.x);
  girl.control.move = 0; girl.vx = 0;
  girl.x = back.gx; girl.y = G; girl.alpha = 1; girl.facing = 1;
  player.facing = 1;
  renderer.board.phase = 'idle';
  await wait(game, 0.8);
  renderer.mentorTalking = true;
  await game.say('mentor-return', { auto: AUTO });
  renderer.mentorTalking = false;
  game.story.seen.add('mentor-return');
  game.story.save();
  girl.scripted = false;
  audio.sfx('sparkle');
}

// Revisiting the memory later (from the overlook's recap).
export async function relive(game) {
  game.moveTo(CAMP.mentor - 70);
  await wait(game, 0.4);
  await schoolMemory(game);
}
