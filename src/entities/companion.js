import { Character } from './character.js';

// The girl: follows the protagonist, keeps a friendly distance and catches up
// (with a little "poof") if he gets too far ahead.
export class Companion extends Character {
  constructor(opts) {
    super({ ...opts, w: 16, h: 78 });
    this.leader = null;
    this.scripted = false;
    this.followGap = 40;
    this.stuckTime = 0;
  }

  think(dt) {
    if (this.scripted || !this.leader || this.frozen) return;
    const L = this.leader;
    const c = this.control;
    const desired = L.x - L.facing * this.followGap;
    const dx = desired - this.x;
    const dist = Math.abs(dx);
    const vertical = this.y - L.y;

    // Too far, or the leader is somewhere she can't reach: catch up.
    if (dist > 420 || (L.onGround && vertical > 120 && dist < 140)) {
      this.stuckTime += dt;
      if (dist > 420 || this.stuckTime > 1.2) {
        this.emit('poof');
        this.x = L.x - L.facing * this.followGap;
        this.y = L.y - 2;
        this.vx = 0;
        this.vy = 0;
        this.stuckTime = 0;
        this.emit('poof');
        return;
      }
    } else {
      this.stuckTime = 0;
    }

    if (dist > 12 || (dist > 4 && Math.abs(L.vx) > 10)) {
      c.move = Math.max(-1, Math.min(1, dx / 30));
      c.run = dist > 90 || Math.abs(L.vx) > 120;
      c.boost = Math.max(1, Math.min(2.8, Math.max(dist / 180, Math.abs(L.vx) / 170)));
    } else {
      c.move = 0;
      c.run = false;
      c.boost = 1;
      if (Math.abs(this.vx) < 5) this.facing = L.facing;
    }

    // Follow the leader up and down ledges.
    c.jump = false;
    c.jumpHeld = true;
    if (this.onGround && this.lastHitWall) c.jump = true;
    if (this.onGround && vertical > 18 && Math.abs(L.x - this.x) < 90 && L.onGround) c.jump = true;
    c.drop = this.onGround && L.onGround && L.y - this.y > 20 && Math.abs(L.x - this.x) < 60;
  }
}
