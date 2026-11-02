import { clamp, damp } from './rng.js';

export class Camera {
  constructor(world) {
    this.world = world;
    this.x = 0;
    this.y = 0;
    this.viewW = 640;
    this.viewH = 380;
    this.lookAhead = 0;
    this.override = null;    // {x, y} target used by cinematics / peeks
    this.rate = 4.5;
  }

  resize(w, h) {
    this.viewW = w;
    this.viewH = h;
    this.clampToWorld();
  }

  targetFor(entity) {
    const ahead = entity.facing * 46;
    this.lookAhead = damp(this.lookAhead, ahead, 1.6, 1 / 60);
    return {
      x: entity.x + this.lookAhead - this.viewW / 2,
      y: entity.y - this.viewH * 0.75,
    };
  }

  follow(entity, dt, snap = false) {
    const t = this.override || this.targetFor(entity);
    if (snap) {
      this.x = t.x;
      this.y = t.y;
    } else {
      const rate = this.override ? this.override.rate || 2 : this.rate;
      this.x = damp(this.x, t.x, rate, dt);
      this.y = damp(this.y, t.y, rate * 0.8, dt);
    }
    this.clampToWorld();
  }

  clampToWorld() {
    const maxX = this.world.width - this.viewW;
    this.x = clamp(this.x, 0, Math.max(0, maxX));
    const maxY = this.world.height - this.viewH;
    // Tall (portrait) views show more sky instead of more ground.
    this.y = maxY < 0 ? maxY : clamp(this.y, -160, maxY);
  }
}
