// Sprite sheets baked by tools/bake_sprites.py and a small frame animator.

export class SpriteSheet {
  constructor(image, meta) {
    this.image = image;
    this.meta = meta;
    this.fw = meta.frameWidth;
    this.fh = meta.frameHeight;
    this.cols = meta.columns;
  }

  frames(name) {
    return this.meta.animations[name] || this.meta.animations.idle;
  }

  // Draws a frame with its feet anchored at (x, y). flip = face left.
  draw(ctx, frame, x, y, flip = false, alpha = 1) {
    const sx = (frame % this.cols) * this.fw;
    const sy = Math.floor(frame / this.cols) * this.fh;
    const dx = Math.round(x - this.fw / 2);
    const dy = Math.round(y - this.fh);
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save();
      ctx.translate(dx + this.fw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, sx, sy, this.fw, this.fh, 0, 0, this.fw, this.fh);
      ctx.restore();
    } else {
      ctx.drawImage(this.image, sx, sy, this.fw, this.fh, dx, dy, this.fw, this.fh);
    }
    if (alpha !== 1) ctx.globalAlpha = 1;
  }
}

const DEFAULT_FPS = { idle: 3, walk: 16, run: 20, talk: 6, land: 12, front_talk: 6 };
const NON_LOOPING = new Set(['land', 'jump', 'fall']);

export class Animator {
  constructor(sheet) {
    this.sheet = sheet;
    this.name = 'idle';
    this.time = 0;
    this.speed = 1;
  }

  play(name, restart = false) {
    if (this.name === name && !restart) return;
    this.name = name;
    this.time = 0;
  }

  update(dt) {
    this.time += dt * this.speed;
  }

  get done() {
    const frames = this.sheet.frames(this.name);
    const fps = DEFAULT_FPS[this.name] || 8;
    return this.time * fps >= frames.length;
  }

  get frame() {
    const frames = this.sheet.frames(this.name);
    const fps = DEFAULT_FPS[this.name] || 8;
    let i = Math.floor(this.time * fps);
    i = NON_LOOPING.has(this.name) ? Math.min(i, frames.length - 1) : i % frames.length;
    return frames[i];
  }
}
