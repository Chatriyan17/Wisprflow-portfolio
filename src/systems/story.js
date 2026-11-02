import { BEATS, TRIGGERS, LANDMARKS, CHECKPOINTS } from '../world/level.js';
import { clamp } from '../engine/rng.js';
import { loadProgress, saveProgress } from './save.js';

// Story progression shared by both navigation modes, remembered between visits.
export class Story {
  constructor({ onBeat, onTrigger }) {
    this.onBeat = onBeat;
    this.onTrigger = onTrigger;
    this.seen = new Set();       // beats + triggers already played
    this.visited = new Set();    // interactables used
    this.lastX = null;
    this.maxX = LANDMARKS.start;
    this.checkpoint = 'start';
    const saved = loadProgress();
    this.saved = saved && saved.maxX > LANDMARKS.start + 200 ? saved : null;
  }

  // Continue from the saved checkpoint: restore what was already seen.
  restore() {
    const s = this.saved;
    if (!s) return null;
    (s.seen || []).forEach((id) => this.seen.add(id));
    (s.visited || []).forEach((id) => this.visited.add(id));
    this.maxX = s.maxX || this.maxX;
    this.checkpoint = s.checkpoint || 'start';
    this.lastX = null;
    return CHECKPOINTS.find((c) => c.id === this.checkpoint) || CHECKPOINTS[0];
  }

  get savedCheckpoint() {
    if (!this.saved) return null;
    return CHECKPOINTS.find((c) => c.id === this.saved.checkpoint) || null;
  }

  save() {
    saveProgress({
      seen: [...this.seen],
      visited: [...this.visited],
      maxX: Math.round(this.maxX),
      checkpoint: this.checkpoint,
    });
  }

  update(x, y, mode) {
    if (this.lastX === null) this.lastX = x;
    if (x > this.maxX) this.maxX = x;
    for (const c of CHECKPOINTS) {
      const idx = CHECKPOINTS.findIndex((k) => k.id === this.checkpoint);
      if (x >= c.x && CHECKPOINTS.indexOf(c) > idx) {
        this.checkpoint = c.id;
        this.save();
      }
    }
    for (const b of BEATS) {
      if (this.seen.has(b.id)) continue;
      if (b.mode && b.mode !== mode) continue;
      if (this.lastX < b.x && x >= b.x) {
        this.seen.add(b.id);
        this.onBeat(b);
      }
    }
    for (const t of TRIGGERS) {
      if (this.seen.has(t.id)) continue;
      if (t.maxY !== undefined && y > t.maxY) continue;
      if (x >= t.x && this.lastX < t.x + 60) {
        this.seen.add(t.id);
        this.save();
        this.onTrigger(t);
      }
    }
    this.lastX = x;
  }

  markVisited(id) {
    this.visited.add(id);
    this.save();
  }

  // Chapter progress in "location units": 0 at the start, 1 at the Old Workshop,
  // 2 at the gateway to the Discovery Path.
  get progress() {
    const a = clamp((this.maxX - LANDMARKS.start) / (LANDMARKS.workshop - LANDMARKS.start), 0, 1);
    const b = clamp((this.maxX - LANDMARKS.workshop) / (LANDMARKS.gateway - 40 - LANDMARKS.workshop), 0, 1);
    return a + b;
  }

  get atWorkshop() { return this.progress >= 1; }
  get atGateway() { return this.progress >= 2; }
}
