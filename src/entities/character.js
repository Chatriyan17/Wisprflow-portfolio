import { Animator } from '../engine/sprite.js';
import { moveAndCollide, surfaceBelow } from '../engine/physics.js';
import { PHYSICS } from '../config.js';
import { clamp } from '../engine/rng.js';

// A world character built from one of the baked reference sprite sheets.
// Characters are independent of the background: they own their position,
// physics body, animation state and simple "control" intent.
export class Character {
  constructor({ name, sheet, x, y, w = 18, h = 86 }) {
    this.name = name;
    this.sheet = sheet;
    this.anim = new Animator(sheet);
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.dropThrough = 0;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.landTimer = 0;
    this.idleTime = 0;
    this.alpha = 1;
    this.visible = true;
    this.frozen = false;        // ignore physics (e.g. during an entrance)
    this.talking = false;
    this.pose = null;           // 'front' | 'back' | null
    this.allowLookAround = true;
    this.autopilot = null;      // { x, run?: boolean, tolerance? }
    this.control = { move: 0, run: false, jump: false, jumpHeld: false, drop: false, boost: 1 };
    this.lastHitWall = 0;
    this.events = [];
  }

  // Is the thing we just bumped into low enough to jump onto?
  canHop() {
    const s = this.lastHitSolid;
    return !!s && this.y - s.y < 60;
  }

  emit(type, data = {}) { this.events.push({ type, x: this.x, y: this.y, ...data }); }

  // Steer towards an autopilot target (used by Scroll Journey and cinematics).
  applyAutopilot() {
    const a = this.autopilot;
    if (!a) return;
    const dx = a.x - this.x;
    const tol = a.tolerance ?? 2;
    const c = this.control;
    if (Math.abs(dx) <= tol) {
      c.move = 0;
      c.run = false;
      if (a.face) this.facing = a.face;
      c.boost = 1;
      if (a.onArrive) { const f = a.onArrive; a.onArrive = null; f(); }
      return;
    }
    c.move = clamp(dx / 14, -1, 1);
    c.run = a.run ?? Math.abs(dx) > 90;
    // far behind a fast scroll: hurry so the story keeps up with the visitor
    c.boost = a.run === false ? 1 : clamp(Math.abs(dx) / 260, 1, 2.6);
    // hop up small ledges automatically (never try to jump a tall wall)
    if (this.lastHitWall && this.onGround && this.canHop()) c.jump = true;
  }

  update(dt, solids) {
    if (this.frozen) {
      this.anim.update(dt);
      this.chooseAnimation();
      return;
    }
    this.applyAutopilot();
    const c = this.control;
    const top = (c.run ? PHYSICS.runSpeed * (c.boost || 1) : PHYSICS.walkSpeed) * Math.abs(c.move);
    const target = Math.sign(c.move) * top;
    const accel = this.onGround ? PHYSICS.accel : PHYSICS.airAccel;

    if (c.move !== 0) {
      const a = (Math.sign(target - this.vx) === Math.sign(c.move) ? accel : PHYSICS.friction) * dt;
      this.vx += clamp(target - this.vx, -a, a);
      this.facing = c.move > 0 ? 1 : -1;
    } else if (this.onGround) {
      const f = PHYSICS.friction * dt;
      this.vx += clamp(-this.vx, -f, f);
    } else {
      this.vx *= 1 - Math.min(1, dt * 1.5);
    }

    // jump with coyote time + input buffering
    this.coyote = this.onGround ? PHYSICS.coyoteTime : Math.max(0, this.coyote - dt);
    this.jumpBuffer = c.jump ? PHYSICS.jumpBuffer : Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -PHYSICS.jumpVelocity;
      this.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.emit('jump');
    }
    if (!c.jumpHeld && this.vy < 0 && !this.autopilot) this.vy *= 1 - (1 - PHYSICS.jumpCut) * Math.min(1, dt * 18);

    if (c.drop && this.onGround && this.groundSolid && this.groundSolid.oneWay) {
      this.dropThrough = 0.25;
      this.onGround = false;
    }
    this.dropThrough = Math.max(0, this.dropThrough - dt);

    this.vy = Math.min(PHYSICS.maxFall, this.vy + PHYSICS.gravity * dt);
    const fallSpeed = this.vy;
    const res = moveAndCollide(this, solids, dt);
    this.lastHitWall = res.hitWall;
    this.lastHitSolid = res.hitWall ? res.hitSolid : null;
    if (res.landed) {
      if (fallSpeed > 260) this.landTimer = 0.16;
      this.emit('land', { impact: fallSpeed });
    }
    this.landTimer = Math.max(0, this.landTimer - dt);
    c.jump = false;

    const moving = Math.abs(this.vx) > 6 || !this.onGround;
    this.idleTime = moving || this.talking || this.pose ? 0 : this.idleTime + dt;

    this.anim.update(dt);
    this.chooseAnimation();
  }

  chooseAnimation() {
    const speed = Math.abs(this.vx);
    this.lookFlip = false;
    if (!this.onGround && !this.frozen) {
      this.anim.play(this.vy < 0 ? 'jump' : 'fall');
    } else if (this.landTimer > 0) {
      this.anim.play('land');
    } else if (speed > 8) {
      const running = speed > PHYSICS.walkSpeed + 12;
      this.anim.play(running ? 'run' : 'walk');
      this.anim.speed = clamp(speed / (running ? PHYSICS.runSpeed : PHYSICS.walkSpeed), 0.5, 1.8);
      return;
    } else if (this.talking) {
      this.anim.play(this.pose === 'front' ? 'front_talk' : 'talk');
    } else if (this.pose) {
      this.anim.play(this.pose);
    } else if (this.allowLookAround && this.idleTime > 6) {
      // look around: glance at the camera, then over the shoulder, then back
      const t = (this.idleTime - 6) % 7;
      if (t < 1.4) this.anim.play('front');
      else if (t < 2.6) { this.anim.play('idle'); this.lookFlip = true; }
      else if (t < 3.6) this.anim.play('front');
      else this.anim.play('idle');
    } else {
      this.anim.play('idle');
    }
    this.anim.speed = 1;
  }

  draw(ctx, cam, solids) {
    if (!this.visible || this.alpha <= 0) return;
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y);
    // soft contact shadow on the surface below
    const ground = surfaceBelow(solids, this.x, this.y);
    if (ground !== Infinity) {
      const lift = clamp((ground - this.y) / 120, 0, 1);
      const w = Math.round(this.w * (1.25 - lift * 0.6));
      ctx.globalAlpha = 0.32 * (1 - lift * 0.7) * this.alpha;
      ctx.fillStyle = '#1d0f1c';
      const gy = Math.round(ground - cam.y);
      ctx.fillRect(sx - w, gy - 2, w * 2, 3);
      ctx.fillRect(sx - w + 3, gy - 3, w * 2 - 6, 5);
      ctx.globalAlpha = 1;
    }
    const flip = (this.facing < 0) !== !!this.lookFlip;
    const front = this.anim.name === 'front' || this.anim.name === 'front_talk' || this.anim.name === 'back';
    this.sheet.draw(ctx, this.anim.frame, sx, sy, front ? false : flip, this.alpha);
  }
}
