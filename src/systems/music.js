// The soundtrack: one short composed piece per part of the world, crossfading
// as you travel. Melodies, chords and bass lines are written below; instruments
// are synthesised with filtered oscillators, gentle envelopes and a warm reverb.
//
// Prefer recorded music? Put audio files in assets/music/ and list them in
// assets/music/manifest.json, e.g. { "tracks": { "village": "village.mp3" } }.
// A listed track replaces the composed piece for that region.

// --- notation -------------------------------------------------------------
// Melody: one string per bar, 8 eighth-notes: scale degrees 1-7, ' = octave up,
// , = octave down, - = hold, . = rest. Chords: scale degree of each bar's triad.

export const THEMES = {
  village: {   // cosy, warm: the starting village
    bpm: 84, root: 65, scale: 'major', chords: [1, 6, 4, 5, 1, 6, 4, 5],
    melody: ['3 - 5 - 6 5 3 -', '1 - 2 3 - . 2 1', '6, - 5, 4, - 3, 4, .', '5, - - . 2 - 3 -',
      '3 - 5 - 1\' - 7 6', '6 - 5 3 - . 1 2', '4 - 6 5 4 3 2 -', '2 - 5, - 1 - - .'],
    lead: 'flute', arp: 'bell', bass: 'half', pad: 0.5, drums: null,
  },
  factory: {   // reflective, a little heavy: the Old Workshop
    bpm: 76, root: 62, scale: 'minor', chords: [1, 6, 3, 7, 1, 6, 3, 7],
    melody: ['5 - - - 4 - 3 -', '1 - - . . - 3 -', '3 - 5 - 4 - 3 -', '2 - - - . . . .',
      '5 - 6 5 4 - 3 -', '3 - 1 - 6, - 1 -', '5 - 7 - 5 - 3 -', '4 - 2 - 7, - - .'],
    lead: 'reed', arp: null, bass: 'eighths', pad: 0.6, drums: 'tick',
  },
  forest: {    // magical, curious: the Discovery Path
    bpm: 70, root: 64, scale: 'major', chords: [1, 4, 6, 5, 1, 4, 6, 5],
    melody: ['5 - - - 3 - 5 -', '6 - - - 1\' - 6 -', '5 - 3 - 1 - 3 -', '2 - - - . . . .',
      '5 - 1\' - 7 - 5 -', '4 - 6 - 1\' - 2\' -', '1\' - 7 - 6 - 3 -', '5 - - - - - . .'],
    lead: 'flute', arp: 'sparkle', bass: 'whole', pad: 0.8, drums: null,
  },
  studio: {    // energetic, busy: the first workplace
    bpm: 108, root: 67, scale: 'major', chords: [1, 5, 6, 4, 1, 5, 6, 4],
    melody: ['1 1 3 5 - 3 5 -', '7, 2 5 - 4 3 2 -', '1 3 6 - 5 3 1 -', '4 6 1\' - 6 5 4 .',
      '5 5 6 5 3 - 1 -', '2 - 5 4 3 - 2 -', '3 3 6 5 3 - 1 2', '4 - 3 - 2 - 5, .'],
    lead: 'square', arp: 'pluck', bass: 'quarters', pad: 0.3, drums: 'beat',
  },
  campus: {    // warm, studious: the Knowledge Academy
    bpm: 92, root: 70, scale: 'major', chords: [1, 6, 2, 5, 1, 6, 2, 5],
    melody: ['1 - 3 - 5 - 3 -', '6 - 5 - 3 - 1 -', '2 - 4 - 6 - 5 4', '5 - - - 7, - 2 -',
      '3 - 5 - 1\' - 5 -', '6 - 1\' - 6 5 3 -', '4 - 2 - 6 - 5 -', '5 - 4 3 2 - - .'],
    lead: 'flute', arp: 'pluck', bass: 'quarters', pad: 0.5, drums: 'brush',
  },
  camp: {      // evening calm: the Mentor's Camp
    bpm: 66, root: 69, scale: 'minor', chords: [1, 6, 3, 7, 1, 6, 3, 7],
    melody: ['1 - 3 - 5 - - -', '6 - 5 - 3 - - -', '5 - 3 - 2 - 3 -', '2 - - - . . . .',
      '5 - 6 - 7 - 1\' -', '1\' - 7 - 6 - 3 -', '5 - 3 - 2 - 1 -', '7, - - - 2 - - .'],
    lead: 'reed', arp: 'guitar', bass: 'half', pad: 0.6, drums: null,
  },
  school: {    // nostalgic music box: the school memory
    bpm: 80, root: 72, scale: 'major', chords: [1, 4, 5, 1, 6, 4, 5, 1],
    melody: ['5 - 3 - 1 - 3 -', '4 - 6 - 1\' - 6 -', '5 - 7 - 2\' - 7 -', '1\' - - - . . . .',
      '6 - 1\' - 3\' - 1\' -', '6 - 4 - 1 - 4 -', '5 - 4 - 2 - 7, -', '1 - - - . . . .'],
    lead: 'musicbox', arp: null, bass: 'whole', pad: 0.3, drums: null,
  },
  overlook: {  // uplifting finale: the Awakening
    bpm: 86, root: 62, scale: 'major', chords: [1, 5, 6, 4, 1, 5, 6, 4],
    melody: ['3 - - 2 1 - 5, -', '2 - - 1 7, - 5, -', '1 - - 7, 6, - 1 -', '4 - 3 - 2 - 1 -',
      '5 - - 6 5 - 3 -', '7 - - 1\' 2\' - 7 -', '1\' - 7 - 6 - 3 -', '4 - 6 - 5 - - .'],
    lead: 'flute', arp: 'bell', bass: 'half', pad: 1, drums: 'swell',
  },
  boss: {      // playful, mechanical: the Four-Armed Creative Golem
    bpm: 132, root: 62, scale: 'minor', chords: [1, 1, 6, 7, 1, 1, 4, 5],
    melody: ['1 . 1 3 5 . 3 .', '1\' - 7 5 6 5 3 .', '6, . 1 3 6 . 5 3', '7, - 2 4 5 - 4 2',
      '1 . 1 3 5 . 6 7', '1\' - 7 5 6 - 5 .', '4 . 6 1\' 6 4 2 .', '5 - 7 - 5 . 5, .'],
    lead: 'square', arp: 'pluck', bass: 'eighths', pad: 0.25, drums: 'beat',
  },
};

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function degreeToMidi(theme, deg, octave = 0) {
  const sc = SCALES[theme.scale];
  const d = deg - 1;
  return theme.root + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + octave);
}

function parseBar(bar) {
  return bar.trim().split(/\s+/).map((tok) => {
    if (tok === '-' || tok === '.') return tok;
    const deg = parseInt(tok, 10);
    const oct = (tok.match(/'/g) || []).length - (tok.match(/,/g) || []).length;
    return { deg, oct };
  });
}

function chordTones(theme, deg) {
  return [deg, deg + 2, deg + 4].map((d) => degreeToMidi(theme, d));
}

// --------------------------------------------------------------------------

export class Music {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.55;
    this.out.connect(out);
    // a warm room: generated reverb impulse
    this.reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.4);
    const imp = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = imp.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.reverb.buffer = imp;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    this.send = ctx.createGain();
    this.send.connect(this.reverb).connect(wet).connect(this.out);
    // a short noise buffer for percussion
    const nb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    this.buses = {};
    this.current = null;
    this.step = 0;
    this.nextTime = 0;
    this.files = {};
    this.fileAudio = {};
    fetch('assets/music/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (!m || !m.tracks) return;
      this.files = m.tracks;
      // the list arrives after the first piece has started: swap to its recording now
      const now = this.current;
      if (now && this.files[now]) {
        this.bus(now).gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
        this.current = null;
        this.play(now);
      }
    }).catch(() => {});
  }

  bus(name) {
    if (!this.buses[name]) {
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.connect(this.out);
      g.connect(this.send);
      this.buses[name] = g;
    }
    return this.buses[name];
  }

  // Switch themes with a crossfade (waits for the current bar to end).
  play(name) {
    if (name === this.current || !THEMES[name]) return;
    const t = this.ctx.currentTime;
    if (this.current) {
      this.bus(this.current).gain.setTargetAtTime(0, t, 0.9);
      this.stopFile(this.current);
    }
    this.current = name;
    if (this.files[name]) { this.playFile(name); return; }
    this.bus(name).gain.cancelScheduledValues(t);
    this.bus(name).gain.setTargetAtTime(1, t + 0.4, 1.2);
    this.step = 0;
    this.nextTime = Math.max(t + 0.15, this.nextTime);
  }

  // A recorded track plays through the soundtrack's own output (not straight to the
  // speakers), so the sound toggle and the quiet story moments apply to it too.
  playFile(name) {
    let f = this.fileAudio[name];
    if (!f) {
      const a = new Audio(`assets/music/${this.files[name]}`);
      a.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      this.ctx.createMediaElementSource(a).connect(gain).connect(this.out);
      f = this.fileAudio[name] = { a, gain };
    }
    const t = this.ctx.currentTime;
    f.gain.gain.cancelScheduledValues(t);
    f.gain.gain.setTargetAtTime(1, t, 0.8);
    f.a.play().catch(() => {});
  }

  stopFile(name) {
    const f = this.fileAudio[name];
    if (!f) return;
    const t = this.ctx.currentTime;
    f.gain.gain.cancelScheduledValues(t);
    f.gain.gain.setTargetAtTime(0, t, 0.4);
    setTimeout(() => { if (this.current !== name) f.a.pause(); }, 2500);
  }

  setLevel(v) { this.out.gain.setTargetAtTime(0.55 * v, this.ctx.currentTime, 0.6); }

  // Schedule notes slightly ahead of time (call every frame).
  update() {
    const name = this.current;
    if (!name || this.files[name]) return;
    const th = THEMES[name];
    const stepDur = 60 / th.bpm / 2;
    const now = this.ctx.currentTime;
    if (this.nextTime < now - 0.5) this.nextTime = now + 0.05;    // the tab was asleep
    while (this.nextTime < now + 0.25) {
      this.playStep(th, this.bus(name), this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  playStep(th, bus, step, t, sd) {
    const bar = Math.floor(step / 8), beat = step % 8;
    const chord = chordTones(th, th.chords[bar]);
    th._parsed = th._parsed || th.melody.map(parseBar);
    // melody
    const tok = th._parsed[bar][beat];
    if (tok && typeof tok === 'object') {
      let len = 1;
      for (let k = beat + 1; k < 8 && th._parsed[bar][k] === '-'; k++) len++;
      this.lead(th.lead, hz(degreeToMidi(th, tok.deg, tok.oct)), t, len * sd, bus);
    }
    // pad: the bar's chord, held
    if (beat === 0 && th.pad) chord.forEach((m) => this.pad(hz(m - 12), t, sd * 8, bus, th.pad));
    // bass
    const root = hz(chord[0] - 24);
    const fifth = hz(chord[2] - 24);
    if (th.bass === 'whole' && beat === 0) this.bass(root, t, sd * 7.5, bus);
    if (th.bass === 'half' && (beat === 0 || beat === 4)) this.bass(beat === 0 ? root : fifth, t, sd * 3.6, bus);
    if (th.bass === 'quarters' && beat % 2 === 0) this.bass(beat % 4 === 0 ? root : fifth, t, sd * 1.7, bus);
    if (th.bass === 'eighths') this.bass(root, t, sd * 0.8, bus, beat % 2 ? 0.55 : 0.85);
    // arpeggios
    const up = [0, 1, 2, 1, 0, 1, 2, 1];
    if (th.arp === 'bell' && beat % 2 === 1) this.bell(hz(chord[up[beat]] + 12), t, bus, 0.5);
    if (th.arp === 'sparkle') this.bell(hz(chord[(beat * 2) % 3] + 24), t, bus, beat % 2 ? 0.25 : 0.4);
    if (th.arp === 'pluck') this.pluck(hz(chord[up[beat]]), t, bus);
    if (th.arp === 'guitar' && beat % 2 === 0) this.pluck(hz(chord[[0, 1, 2, 1][beat / 2]]), t, bus, 0.8);
    // percussion
    if (th.drums === 'beat') {
      if (beat === 0 || beat === 4) this.kick(t, bus);
      if (beat === 2 || beat === 6) this.snare(t, bus, 0.5);
      this.hat(t, bus, beat % 2 ? 0.35 : 0.6);
    }
    if (th.drums === 'brush' && beat % 2 === 1) this.hat(t, bus, 0.35, 4000);
    if (th.drums === 'tick') { if (beat % 2 === 1) this.hat(t, bus, 0.4, 6000); if (beat === 0) this.kick(t, bus, 0.6); }
    if (th.drums === 'swell' && beat === 0 && bar % 2 === 0) this.kick(t, bus, 0.45);
  }

  // --- instruments --------------------------------------------------------
  env(g, t, a, peak, d, sustain, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sustain, t + a, d);
    g.gain.setTargetAtTime(0.0001, end, rel);
  }

  lead(kind, f, t, dur, bus) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    const types = { flute: 'triangle', reed: 'sawtooth', square: 'square', musicbox: 'sine' };
    o.type = types[kind] || 'triangle';
    lp.frequency.value = kind === 'reed' ? 1400 : kind === 'square' ? 2400 : 3200;
    o.frequency.setValueAtTime(f, t);
    // gentle vibrato that blooms on long notes
    if (dur > 0.4 && kind !== 'musicbox') {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 5.2;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.006, t + dur * 0.7);
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.6);
    }
    const vol = { flute: 0.085, reed: 0.05, square: 0.04, musicbox: 0.09 }[kind] || 0.07;
    if (kind === 'musicbox') {
      this.env(g, t, 0.005, vol, 0.25, 0.25, 0.4, t + Math.min(dur, 0.6));
      const o2 = c.createOscillator();           // the bright tine
      const g2 = c.createGain();
      o2.type = 'sine';
      o2.frequency.value = f * 4;
      this.env(g2, t, 0.002, vol * 0.25, 0.08, 0.1, 0.1, t + 0.15);
      o2.connect(g2).connect(bus);
      o2.start(t); o2.stop(t + 0.8);
    } else {
      this.env(g, t, 0.04, vol, 0.3, 0.75, 0.12, t + dur * 0.92);
    }
    o.connect(lp).connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 1);
  }

  pad(f, t, dur, bus, level) {
    const c = this.ctx;
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    for (const det of [-7, 7]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 1.5);
    }
    this.env(g, t, 0.7, 0.012 * level, 1, 0.9, 0.5, t + dur);
    lp.connect(g).connect(bus);
  }

  bass(f, t, dur, bus, level = 0.85) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    this.env(g, t, 0.01, 0.11 * level, 0.25, 0.6, 0.08, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.6);
  }

  bell(f, t, bus, level = 0.5) {
    const c = this.ctx;
    for (const [ratio, v, decay] of [[1, 1, 1.1], [2.76, 0.3, 0.35], [5.4, 0.12, 0.18]]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f * ratio;
      this.env(g, t, 0.003, 0.03 * level * v, decay, 0.0001, 0.1, t + decay * 2);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + decay * 2 + 0.5);
    }
  }

  pluck(f, t, bus, level = 0.6) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    o.type = 'sawtooth';
    o.frequency.value = f;
    this.env(g, t, 0.003, 0.04 * level, 0.12, 0.0001, 0.1, t + 0.4);
    o.connect(lp).connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.8);
  }

  kick(t, bus, level = 0.8) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    this.env(g, t, 0.002, 0.16 * level, 0.08, 0.0001, 0.05, t + 0.2);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.4);
  }

  noiseHit(t, bus, { type, freq, dur, vol }) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    this.env(g, t, 0.002, vol, dur / 3, 0.0001, dur / 4, t + dur);
    s.connect(f).connect(g).connect(bus);
    s.start(t);
    s.stop(t + dur + 0.2);
  }

  hat(t, bus, level = 0.5, freq = 8000) { this.noiseHit(t, bus, { type: 'highpass', freq, dur: 0.04, vol: 0.025 * level }); }
  snare(t, bus, level = 0.6) { this.noiseHit(t, bus, { type: 'bandpass', freq: 1800, dur: 0.14, vol: 0.06 * level }); }
}

// Which piece plays where.
export function themeFor(area, x) {
  if (area === 'studio') return 'studio';
  if (area === 'campus') return 'campus';
  if (area === 'classroom') return 'school';
  if (area === 'camp') return x < 17450 ? 'camp' : 'overlook';
  if (x < 2500) return 'village';
  if (x < 6170) return 'factory';
  return 'forest';
}
