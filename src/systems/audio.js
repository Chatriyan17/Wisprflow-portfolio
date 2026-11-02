// Tiny procedural chiptune audio: a soft ambient bed, waterfall noise and SFX.
// Starts muted; the visitor opts in with the sound toggle (or M).

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [
  [53, 57, 60, 64],   // Fmaj7
  [52, 55, 59, 62],   // Em7
  [50, 53, 57, 60],   // Dm7
  [48, 52, 55, 59],   // Cmaj7
];
const MELODY_SCALE = [72, 74, 76, 79, 81, 84];

export class Audio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.water = 0;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(c.destination);

    // ambient pad
    this.padGain = c.createGain();
    this.padGain.gain.value = 0.05;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    this.padGain.connect(lp).connect(this.master);
    this.pad = CHORDS[0].map((n) => {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = NOTE(n);
      o.detune.value = Math.random() * 8 - 4;
      o.connect(this.padGain);
      o.start();
      return o;
    });

    // waterfall noise
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * 0.08) * 0.97; d[i] = last * 4; }
    this.noise = c.createBufferSource();
    this.noise.buffer = buf;
    this.noise.loop = true;
    this.waterGain = c.createGain();
    this.waterGain.gain.value = 0;
    this.noise.connect(this.waterGain).connect(this.master);
    this.noise.start();

    this.chordIndex = 0;
    this.nextChord = c.currentTime + 6;
    this.nextNote = c.currentTime + 1.5;
  }

  async setEnabled(on) {
    this.enabled = on;
    if (on) {
      this.ensure();
      if (!this.ctx) return;
      await this.ctx.resume();
      this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.4);
    } else if (this.ctx) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
  }

  setWater(v) { this.water = v; }

  update() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    this.waterGain.gain.setTargetAtTime(this.water * 0.08, t, 0.3);
    if (t > this.nextChord) {
      this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
      CHORDS[this.chordIndex].forEach((n, i) => this.pad[i].frequency.setTargetAtTime(NOTE(n), t, 0.8));
      this.nextChord = t + 6;
    }
    if (t > this.nextNote) {
      // gentle music-box notes
      const n = MELODY_SCALE[Math.floor(Math.random() * MELODY_SCALE.length)];
      this.tone(NOTE(n), 0.9, 'sine', 0.035, t);
      if (Math.random() < 0.35) this.tone(NOTE(n + 7), 0.7, 'sine', 0.02, t + 0.25);
      this.nextNote = t + 0.9 + Math.random() * 1.6;
    }
  }

  tone(freq, dur, type = 'square', vol = 0.05, at = null, slideTo = null) {
    const c = this.ctx;
    const t = at ?? c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  sfx(name) {
    if (!this.enabled || !this.ctx) return;
    switch (name) {
      case 'jump': this.tone(330, 0.16, 'square', 0.04, null, 660); break;
      case 'land': this.tone(120, 0.08, 'triangle', 0.06, null, 60); break;
      case 'blip': this.tone(880, 0.06, 'square', 0.025); break;
      case 'type': this.tone(1200, 0.025, 'square', 0.012); break;
      case 'voiceHigh': this.tone(700 + Math.random() * 160, 0.035, 'square', 0.014); break;
      case 'voiceLow': this.tone(360 + Math.random() * 90, 0.04, 'square', 0.016); break;
      case 'interact':
        this.tone(660, 0.08, 'square', 0.03);
        this.tone(990, 0.12, 'square', 0.03, this.ctx.currentTime + 0.07);
        break;
      case 'sparkle':
        [1320, 1760, 2093, 2637].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.03, this.ctx.currentTime + i * 0.06));
        break;
      case 'poof': this.tone(500, 0.15, 'triangle', 0.03, null, 1000); break;
      case 'start':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'square', 0.03, this.ctx.currentTime + i * 0.08));
        break;
      default: break;
    }
  }
}
