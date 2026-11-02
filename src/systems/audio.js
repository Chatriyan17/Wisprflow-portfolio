import { Music } from './music.js';
// Tiny procedural chiptune audio: a soft ambient bed, waterfall noise and SFX.
// Starts muted; the visitor opts in with the sound toggle (or M).


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

    // the soundtrack (composed pieces per region, see music.js)
    this.music = new Music(c, this.master);

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

  setQuiet(on) { this.quiet = on; }

  // a moment of real silence (the realisation)
  mute(on) {
    if (!this.ctx || !this.enabled) return;
    this.master.gain.setTargetAtTime(on ? 0 : 0.9, this.ctx.currentTime, on ? 0.3 : 0.6);
  }

  update() {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    this.waterGain.gain.setTargetAtTime(this.water * 0.08, t, 0.3);
    const R = this.region || { industry: 0, gateway: 0, conveyor: 0, forest: 0 };
    if ((R.studio || 0) > 0.5 && !this.quiet && t > (this.nextType || 0)) {
      // studio ambience: bursts of keyboard typing, the odd mouse click
      if (Math.random() < 0.75) {
        const n = 4 + Math.floor(Math.random() * 8);
        for (let i = 0; i < n; i++) this.tone(1800 + Math.random() * 900, 0.018, 'square', 0.006, t + i * (0.07 + Math.random() * 0.06));
      } else {
        this.tone(2600, 0.012, 'square', 0.01, t);
        this.tone(2200, 0.012, 'square', 0.008, t + 0.09);
      }
      this.nextType = t + 1.4 + Math.random() * 3;
    }
    if ((R.forest || 0) > 0.3 && t > (this.nextBird || 0)) {
      // birdsong in the discovery forest
      const f = 2200 + Math.random() * 1400;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.tone(f + Math.random() * 300, 0.07, 'sine', 0.012 * R.forest, t + i * 0.11, f * 1.3);
      this.nextBird = t + 1.5 + Math.random() * 3.5;
    }
    // birdsong-like music box fades out in the factory; machines hum instead
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
    this.music.setLevel(this.quiet ? 0.35 : 1);
    if (R.theme) this.music.play(R.theme);
    this.music.update();
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

  // a short filtered noise burst (steam, impacts)
  noise(dur, type, freq, vol, at = null) {
    if (!this.music) return;
    this.music.noiseHit(at ?? this.ctx.currentTime, this.master, { type, freq, dur, vol });
  }

  sfx(name, vol = 1) {
    if (!this.enabled || !this.ctx) return;
    switch (name) {
      case 'thump':
        if (vol <= 0.02) break;
        this.tone(90, 0.25, 'triangle', 0.08 * vol, null, 45);
        this.tone(2200, 0.05, 'square', 0.015 * vol);
        break;
      case 'bell':
        [988, 784].forEach((f, i) => { this.tone(f, 1.1, 'sine', 0.03, this.ctx.currentTime + i * 0.5); this.tone(f * 2.01, 0.6, 'sine', 0.008, this.ctx.currentTime + i * 0.5); });
        break;
      case 'transform':
        [262, 330, 392, 494, 523, 659, 784, 988, 1047].forEach((f, i) => this.tone(f, 2.2, 'sine', 0.02, this.ctx.currentTime + i * 0.6));
        break;
      case 'gate':
        this.tone(140, 0.6, 'sawtooth', 0.015, null, 90);
        [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.025, this.ctx.currentTime + 0.4 + i * 0.12));
        break;
      case 'page':
        for (let i = 0; i < 6; i++) this.tone(3000 + Math.random() * 2000, 0.03, 'triangle', 0.006, this.ctx.currentTime + i * 0.025);
        break;
      case 'chalk':
        for (let i = 0; i < 8; i++) this.tone(2400 + Math.random() * 1600, 0.025, 'square', 0.005, this.ctx.currentTime + i * 0.04);
        break;
      case 'chime': {
        const scale = [784, 880, 988, 1175, 1319, 1480, 1568];
        this.tone(scale[Math.min(6, Math.max(0, vol | 0))], 0.9, 'sine', 0.03);
        break;
      }
      case 'click':
        this.tone(1800, 0.02, 'square', 0.015);
        break;
      case 'success':
        [659, 880, 1319].forEach((f, i) => this.tone(f, 0.25, 'square', 0.02, this.ctx.currentTime + i * 0.07));
        break;
      case 'mentor':
        [262, 330, 392, 523, 659].forEach((f, i) => this.tone(f, 1.6, 'sine', 0.025, this.ctx.currentTime + i * 0.3));
        break;
      case 'door':
        this.tone(240, 0.12, 'triangle', 0.04, null, 180);
        this.tone(660, 0.3, 'sine', 0.02, this.ctx.currentTime + 0.12, 990);
        break;
      case 'surprise':
        this.tone(520, 0.08, 'square', 0.03, null, 880);
        this.tone(880, 0.12, 'square', 0.025, this.ctx.currentTime + 0.09, 1320);
        break;
      case 'station':
        this.tone(330, 0.08, 'square', 0.02);
        [660, 990, 1320].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.022, this.ctx.currentTime + 0.08 + i * 0.06));
        break;
      case 'hat':
        this.tone(784, 0.1, 'square', 0.025, null, 1568);
        this.tone(1568, 0.25, 'sine', 0.02, this.ctx.currentTime + 0.1);
        break;
      case 'hats':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.6, 'square', 0.018, this.ctx.currentTime + i * 0.12));
        [1319, 1568].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.02, this.ctx.currentTime + 0.5 + i * 0.15));
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
      // --- the Four-Armed Creative Golem ---
      case 'clank':
        this.tone(1500, 0.07, 'square', 0.018);
        this.tone(820, 0.16, 'triangle', 0.03, this.ctx.currentTime + 0.01);
        this.tone(150, 0.2, 'triangle', 0.05, null, 90);
        break;
      case 'steam': this.noise(0.6, 'highpass', 3200, 0.05); break;
      case 'whirr':
        this.tone(110, 0.7, 'sawtooth', 0.018, null, 440);
        this.tone(220, 0.7, 'square', 0.008, null, 880);
        break;
      case 'stomp':
        this.tone(70, 0.35, 'triangle', 0.09, null, 38);
        this.noise(0.25, 'lowpass', 400, 0.09);
        break;
      case 'powerup':
        [262, 392, 523, 784].forEach((f, i) => this.tone(f, 0.12, 'square', 0.02, this.ctx.currentTime + i * 0.05));
        break;
      case 'boss':
        [196, 233, 262, 311, 392].forEach((f, i) => this.tone(f, 0.22, 'square', 0.03, this.ctx.currentTime + i * 0.09));
        this.tone(98, 0.8, 'sawtooth', 0.03, this.ctx.currentTime + 0.45);
        break;
      case 'laugh':
        // a goofy mechanical "ho-ho-ho"
        [392, 349, 311].forEach((f, i) => this.tone(f, 0.09, 'square', 0.028, this.ctx.currentTime + i * 0.13, f * 0.85));
        break;
      case 'warn':
        this.tone(880, 0.08, 'square', 0.025);
        this.tone(880, 0.08, 'square', 0.025, this.ctx.currentTime + 0.18);
        break;
      case 'wave':
        this.tone(90, 0.9, 'triangle', 0.05, null, 55);
        this.noise(0.8, 'bandpass', 600, 0.05);
        break;
      case 'bonk':
        this.tone(320, 0.12, 'square', 0.035, null, 160);
        this.tone(500, 0.25, 'sine', 0.03, this.ctx.currentTime + 0.08, 900);
        break;
      case 'splat':
        this.noise(0.25, 'lowpass', 900, 0.08);
        this.tone(260, 0.15, 'sine', 0.03, null, 120);
        break;
      case 'prism':
        [1319, 1568, 1976, 2349, 2637].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.018, this.ctx.currentTime + i * 0.04));
        break;
      case 'holo':
        this.tone(440, 0.35, 'sawtooth', 0.012, null, 1760);
        this.tone(1760, 0.2, 'sine', 0.015, this.ctx.currentTime + 0.3);
        break;
      case 'reel':
        for (let i = 0; i < 12; i++) this.tone(2200 - i * 80, 0.012, 'square', 0.012, this.ctx.currentTime + i * 0.05);
        break;
      case 'place':
        this.tone(660, 0.06, 'square', 0.028);
        this.tone(990, 0.12, 'sine', 0.03, this.ctx.currentTime + 0.05);
        break;
      case 'wrong': this.tone(240, 0.18, 'triangle', 0.04, null, 190); break;
      case 'disable':
        this.noise(0.35, 'highpass', 2500, 0.06);
        this.tone(880, 0.6, 'square', 0.02, null, 110);
        break;
      case 'bucket':
        this.tone(1180, 0.35, 'triangle', 0.035, null, 1050);
        this.tone(300, 0.2, 'square', 0.02, this.ctx.currentTime + 0.03, 200);
        this.noise(0.3, 'lowpass', 700, 0.06);
        break;
      case 'thumb':
        this.tone(1319, 0.4, 'sine', 0.03);
        this.tone(1760, 0.5, 'sine', 0.022, this.ctx.currentTime + 0.1);
        break;
      case 'powerdown': this.tone(700, 1.2, 'sawtooth', 0.018, null, 70); break;
      case 'sitdown': {
        // a slide-whistle "whoooop", a clunk and a little boing
        const t0 = this.ctx.currentTime;
        this.tone(1000, 0.75, 'sine', 0.035, t0, 160);
        this.tone(110, 0.3, 'triangle', 0.08, t0 + 0.75, 60);
        this.noise(0.4, 'lowpass', 500, 0.08, t0 + 0.75);
        this.tone(380, 0.35, 'sine', 0.03, t0 + 0.85, 760);
        this.noise(0.7, 'highpass', 3000, 0.04, t0 + 0.95);
        break;
      }
      case 'lightson':
        this.tone(60, 0.12, 'square', 0.035);
        [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.02, this.ctx.currentTime + 0.15 + i * 0.07));
        break;
      case 'victory': {
        const t0 = this.ctx.currentTime;
        [[523, 0], [523, 0.12], [523, 0.24], [659, 0.36], [784, 0.6], [1047, 0.84]].forEach(([f, d]) => this.tone(f, d === 0.84 ? 0.8 : 0.14, 'square', 0.03, t0 + d));
        [1319, 1568, 2093].forEach((f, i) => this.tone(f, 1.2, 'sine', 0.018, t0 + 0.84 + i * 0.08));
        break;
      }
      case 'start':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'square', 0.03, this.ctx.currentTime + i * 0.08));
        break;
      default: break;
    }
  }
}
