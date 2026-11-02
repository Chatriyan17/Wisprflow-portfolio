import { CHARACTERS } from '../content/chapter01.js';
import { REDUCED_MOTION } from '../config.js';

const CHARS_PER_SEC = 42;
// expressions available on the companion's reference sheet
const GIRL_EXPR = new Set(['neutral', 'smile', 'laugh', 'surprised', 'thinking', 'speaking', 'curious', 'wink']);

// Reusable RPG dialogue box. play(lines) resolves when the last line is dismissed.
export class Dialogue {
  constructor({ audio, voice, onSpeaker, live }) {
    this.el = document.getElementById('dialogue');
    this.nameEl = document.getElementById('dialogue-name');
    this.textEl = document.getElementById('dialogue-text');
    this.portrait = document.getElementById('dialogue-portrait');
    this.audio = audio;
    this.voice = voice || null;
    this.speaking = false;
    this.onSpeaker = onSpeaker || (() => {});
    this.live = live;
    this.queue = [];
    this.current = null;
    this.shown = 0;
    this.resolve = null;
    this.tickAcc = 0;

    this.el.addEventListener('click', () => this.advance());
    // preload portraits
    for (const who of ['boy', 'girl']) {
      for (const e of ['neutral', 'smile', 'speaking', 'curious', 'wink', 'laugh', 'thinking']) {
        const img = new Image();
        img.src = `assets/portraits/${who}-${e}.png`;
      }
    }
  }

  get active() { return !!this.current; }

  // opts.auto: seconds to linger on a finished line before moving on by itself
  // opts.id: script id, used to name each line's voice clip ("<id>-<n>")
  play(lines, opts = {}) {
    if (this.resolve) this.finish();
    this.auto = opts.auto || 0;
    this.linger = 0;
    this.queue = lines.map((l, i) => ({ ...l, key: opts.id ? `${opts.id}-${i + 1}` : null }));
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.next();
    });
  }

  next() {
    const line = this.queue.shift();
    if (!line) return this.finish();
    this.current = line;
    this.shown = REDUCED_MOTION ? line.text.length : 0;
    const who = CHARACTERS[line.who] || CHARACTERS.sign;
    this.el.hidden = false;
    this.el.dataset.speaker = line.who;
    this.nameEl.textContent = who.name || '';
    this.nameEl.hidden = !who.name;
    if (who.portrait) {
      const have = who.portrait === 'girl' ? GIRL_EXPR : null;
      const expr = !line.expr ? 'neutral' : have && !have.has(line.expr) ? 'smile' : line.expr;
      this.portrait.src = `assets/portraits/${who.portrait}-${expr}.png`;
      this.portrait.alt = `${who.name}, ${line.expr || 'neutral'} expression`;
    }
    this.render();
    this.onSpeaker(line.who);
    this.speaking = false;
    this.linger = 0;
    this.voicedLine = false;
    if (this.voice && this.voice.active && line.who !== 'sign') {
      this.speaking = true;
      this.voicedLine = true;
      this.voice.speak(line).then(() => {
        if (this.current !== line) return;
        this.speaking = false;
        if (this.shown >= line.text.length) this.onSpeaker(null);
      });
    }
    if (this.live) this.live.textContent = `${who.name ? `${who.name}: ` : ''}${line.text}`;
  }

  finish() {
    this.voice?.stop();
    this.speaking = false;
    this.current = null;
    this.el.hidden = true;
    this.onSpeaker(null);
    const r = this.resolve;
    this.resolve = null;
    if (r) r();
  }

  advance() {
    if (!this.current) return;
    if (this.shown < this.current.text.length) {
      this.shown = this.current.text.length;
      this.render();
      return;
    }
    this.audio?.sfx('blip');
    this.voice?.stop();
    this.next();
  }

  update(dt) {
    if (!this.current) return;
    if (this.shown >= this.current.text.length) {
      // in scenes, move on once the line has been read (or spoken) and had a moment to land
      if (this.auto && !this.speaking) {
        this.linger += dt;
        const wait = this.voicedLine ? 0.8 : this.auto + this.current.text.length * 0.022;
        if (this.linger >= wait) { this.linger = 0; this.next(); }
      }
      return;
    }
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.current.text.length, this.shown + dt * CHARS_PER_SEC);
    if (Math.floor(this.shown) !== before) {
      this.tickAcc++;
      if (this.tickAcc % 3 === 0 && !this.speaking) this.audio?.sfx(this.current.who === 'boy' ? 'voiceLow' : this.current.who === 'girl' ? 'voiceHigh' : 'type');
      this.render();
    }
    if (this.shown >= this.current.text.length && !this.speaking) this.onSpeaker(null);
  }

  render() {
    const t = this.current.text;
    const n = Math.floor(this.shown);
    this.textEl.textContent = t.slice(0, n);
    this.el.classList.toggle('is-typing', n < t.length);
  }
}
