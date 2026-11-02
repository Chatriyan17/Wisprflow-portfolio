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

    // factory hum + conveyor rattle + gateway shimmer (all start silent)
    this.humGain = c.createGain();
    this.humGain.gain.value = 0;
    const humLp = c.createBiquadFilter();
    humLp.type = 'lowpass';
    humLp.frequency.value = 240;
    this.humGain.connect(humLp).connect(this.master);
    for (const f of [55, 82.5, 110.4]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(this.humGain);
      o.start();
    }
    this.beltGain = c.createGain();
    this.beltGain.gain.value = 0;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 2;
    const belt = c.createBufferSource();
    belt.buffer = buf;
    belt.loop = true;
    belt.playbackRate.value = 1.7;
    belt.connect(bp).connect(this.beltGain).connect(this.master);
    belt.start();
    this.portalGain = c.createGain();
    this.portalGain.gain.value = 0;
    this.portalGain.connect(this.master);
    for (const f of [220, 329.6, 440, 554.4]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = Math.random() * 10 - 5;
      o.connect(this.portalGain);
      o.start();
    }
    this.region = { industry: 0, gateway: 0, conveyor: 0 };
    this.nextClank = c.currentTime + 3;

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

  setRegion(r) { this.region = r; }

  update() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    this.waterGain.gain.setTargetAtTime(this.water * 0.08, t, 0.3);
    const R = this.region || { industry: 0, gateway: 0, conveyor: 0, forest: 0 };
    if ((R.forest || 0) > 0.3 && t > (this.nextBird || 0)) {
      // birdsong in the discovery forest
      const f = 2200 + Math.random() * 1400;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.tone(f + Math.random() * 300, 0.07, 'sine', 0.012 * R.forest, t + i * 0.11, f * 1.3);
      this.nextBird = t + 1.5 + Math.random() * 3.5;
    }
    // birdsong-like music box fades out in the factory; machines hum instead
    this.padGain.gain.setTargetAtTime(0.05 * (1 - R.industry * 0.6), t, 0.8);
    this.humGain.gain.setTargetAtTime(0.03 * R.industry, t, 0.8);
    this.beltGain.gain.setTargetAtTime(0.05 * R.conveyor * R.industry, t, 0.3);
    this.portalGain.gain.setTargetAtTime(0.012 * R.gateway * (0.7 + 0.3 * Math.sin(t * 2)), t, 0.2);
    if (R.industry > 0.4 && t > this.nextClank) {
      // distant metal clanks and hisses
      const v = 0.02 * R.industry;
      if (Math.random() < 0.6) {
        this.tone(1400 + Math.random() * 600, 0.12, 'square', v, t);
        this.tone(700 + Math.random() * 200, 0.2, 'triangle', v * 0.8, t + 0.02);
      } else {
        this.tone(180, 0.18, 'triangle', v * 1.4, t, 90);
      }
      this.nextClank = t + 2 + Math.random() * 4;
    }
    if (t > this.nextChord) {
      this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
      CHORDS[this.chordIndex].forEach((n, i) => this.pad[i].frequency.setTargetAtTime(NOTE(n), t, 0.8));
      this.nextChord = t + 6;
    }
    if (t > this.nextNote && Math.random() > R.industry * 0.85) {
      // gentle music-box notes
      const n = MELODY_SCALE[Math.floor(Math.random() * MELODY_SCALE.length)];
      this.tone(NOTE(n), 0.9, 'sine', 0.035, t);
      if (Math.random() < 0.35) this.tone(NOTE(n + 7), 0.7, 'sine', 0.02, t + 0.25);
      this.nextNote = t + 0.9 + Math.random() * 1.6;
    } else if (t > this.nextNote) {
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

  sfx(name, vol = 1) {
    if (!this.enabled || !this.ctx) return;
    switch (name) {
      case 'thump':
        if (vol <= 0.02) break;
        this.tone(90, 0.25, 'triangle', 0.08 * vol, null, 45);
        this.tone(2200, 0.05, 'square', 0.015 * vol);
        break;
      case 'discover':
        [880, 1109, 1319].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.03, this.ctx.currentTime + i * 0.07));
        this.tone(1760, 0.3, 'triangle', 0.012, this.ctx.currentTime + 0.22);
        break;
      case 'connect':
        [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 1.4, 'sine', 0.022, this.ctx.currentTime + i * 0.22));
        break;
      case 'memory':
        [523, 659, 784, 988, 1175].forEach((f, i) => this.tone(f, 1.2, 'sine', 0.025, this.ctx.currentTime + i * 0.18));
        break;
      case 'portal':
        [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.03, this.ctx.currentTime + i * 0.09));
        this.tone(196, 1.6, 'triangle', 0.04, null, 392);
        break;
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
