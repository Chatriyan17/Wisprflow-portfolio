import { REDUCED_MOTION, WORLD } from '../config.js';
import { SCRIPTS } from '../content/chapter01.js';

const G = WORLD.ground;

class Skipped extends Error {}

// Opening cinematic: the camera reveals the world, the protagonist appears at the
// starting platform, the companion walks up and introduces the journey.
export async function playIntro(game) {
  const { player, girl, camera, renderer, audio } = game;
  const skipped = () => game.introSkipped;
  const wait = (s) => new Promise((resolve, reject) => {
    let t = 0;
    const tick = (dt) => {
      if (skipped()) { game.offTick(tick); reject(new Skipped()); return; }
      t += dt;
      if (t >= s) { game.offTick(tick); resolve(); }
    };
    game.onTick(tick);
  });
  const until = (fn) => new Promise((resolve, reject) => {
    const tick = () => {
      if (skipped()) { game.offTick(tick); reject(new Skipped()); return; }
      if (fn()) { game.offTick(tick); resolve(); }
    };
    game.onTick(tick);
  });

  // hide both characters until their entrance
  player.visible = false;
  player.frozen = true;
  girl.visible = false;
  girl.scripted = true;
  girl.x = 40;

  const restX = () => player.x + 46 - camera.viewW / 2;
  const restY = () => player.y - camera.viewH * 0.75;

  try {
    // 1. camera reveal: start over the far side of the world, glide back to the start
    document.body.classList.add('show-title');
    if (!REDUCED_MOTION) {
      const from = { x: Math.min(WORLD.width - camera.viewW, 2890 - camera.viewW * 0.62), y: restY() - 36 };
      const dur = 5.2;
      let t = 0;
      camera.override = { x: from.x, y: from.y };
      camera.follow(player, 0, true);
      await new Promise((resolve, reject) => {
        const tick = (dt) => {
          if (skipped()) { game.offTick(tick); reject(new Skipped()); return; }
          t += dt;
          const k = Math.min(1, t / dur);
          const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          camera.override = { x: from.x + (restX() - from.x) * e, y: from.y + (restY() - from.y) * e, rate: 30 };
          if (t > dur - 1.6) document.body.classList.remove('show-title');
          if (k >= 1) { game.offTick(tick); resolve(); }
        };
        game.onTick(tick);
      });
    } else {
      camera.override = null;
      camera.follow(player, 0, true);
      await wait(2.4);
      document.body.classList.remove('show-title');
    }
    camera.override = null;
    await wait(0.3);

    // 2. the protagonist appears on the starting platform
    renderer.sparkle(player.x, G - 38, 18);
    audio.sfx('sparkle');
    await wait(0.25);
    player.visible = true;
    player.frozen = false;
    player.y = G - 70;
    player.vy = 0;
    await until(() => player.onGround);
    await wait(0.5);
    // looks around
    player.pose = 'front';
    await wait(0.7);
    player.pose = null;
    player.facing = -1;
    await wait(0.35);

    // 3. the companion approaches
    girl.visible = true;
    girl.facing = 1;
    girl.y = G;
    // enter from just off the left edge of the screen (or from behind the big tree)
    girl.x = Math.max(40, Math.min(player.x - 150, camera.x - 24));
    let arrived = false;
    girl.autopilot = { x: player.x - 34, run: player.x - girl.x > 170, tolerance: 2, onArrive: () => { arrived = true; } };
    await until(() => arrived);
    girl.autopilot = null;
    girl.facing = 1;
    player.facing = -1;
    await wait(0.3);

    // 4. dialogue
    await game.say(SCRIPTS.intro, { auto: 2.2 });
    player.facing = 1;
    await wait(0.4);
    girl.facing = 1;
  } catch (e) {
    if (!(e instanceof Skipped)) throw e;
    // jump straight to the end state
    document.body.classList.remove('show-title');
    camera.override = null;
    if (game.dialogue.active) game.dialogue.finish();
    player.visible = true;
    player.frozen = false;
    player.pose = null;
    player.y = G;
    player.facing = 1;
    girl.visible = true;
    girl.autopilot = null;
    girl.x = player.x - 34;
    girl.y = G;
    girl.facing = 1;
    camera.follow(player, 0, true);
    return { skipped: true };
  }
  return { skipped: false };
}
