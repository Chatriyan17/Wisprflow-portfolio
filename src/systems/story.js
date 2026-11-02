import { BEATS, LANDMARKS } from '../world/level.js';
import { clamp } from '../engine/rng.js';

// Story progression shared by both navigation modes.
export class Story {
  constructor({ onBeat }) {
    this.onBeat = onBeat;
    this.seen = new Set();
    this.lastX = null;
    this.maxX = LANDMARKS.start;
    this.visited = new Set();   // interactables used
  }

  update(x, mode) {
    if (this.lastX === null) this.lastX = x;
    if (x > this.maxX) this.maxX = x;
    for (const b of BEATS) {
      if (this.seen.has(b.id)) continue;
      if (b.mode && b.mode !== mode) continue;
      if (this.lastX < b.x && x >= b.x) {
        this.seen.add(b.id);
        this.onBeat(b);
      }
    }
    this.lastX = x;
  }

  // 0..1 progress from the start of the world to the first location of the chapter.
  get prologue() {
    return clamp((this.maxX - LANDMARKS.start) / (LANDMARKS.workshop - LANDMARKS.start - 40), 0, 1);
  }

  get atWorkshop() { return this.prologue >= 1; }
}
