// Character voices for dialogue.
//
// 1. Recorded clips come first: drop audio files in assets/voices/ named after the
//    line key (e.g. "intro-1.mp3") and list them in assets/voices/manifest.json.
//    Run `python3 tools/voice_manifest.py` to rebuild the manifest automatically.
// 2. Otherwise the browser's built-in speech synthesis reads the line, with a
//    distinct voice, pitch and pace for each character.
//
// Voices only play while sound is on; they can also be turned off on their own.

const PROFILES = {
  // preferred voice names, in order; matched case-insensitively against what the device offers.
  // Neural voices ("Natural", "Neural", "Enhanced", "Premium") are always preferred over
  // basic ones, and keep their natural pitch: bending pitch is what makes speech sound robotic.
  boy: { prefer: ['prabhat', 'rishi', 'ravi', 'andrew', 'brian', 'guy', 'christopher', 'ryan', 'google uk english male', 'daniel', 'alex', 'aaron', 'david', 'male'], gender: 'male', pitch: 0.98, rate: 1.0 },
  girl: { prefer: ['neerja', 'veena', 'heera', 'ava', 'emma', 'jenny', 'aria', 'sonia', 'libby', 'google uk english female', 'samantha', 'karen', 'zira', 'female'], gender: 'female', pitch: 1.05, rate: 1.02 },
  friend: { prefer: ['kunal', 'ravi', 'eric', 'roger', 'steffan', 'thomas', 'george', 'fred', 'google us english', 'male'], gender: 'male', pitch: 0.92, rate: 0.97 },
};

const QUALITY = ['natural', 'neural', 'premium', 'enhanced', 'online', 'wavenet', 'studio'];
const isNatural = (v) => QUALITY.some((q) => v.name.toLowerCase().includes(q));

const MALE_HINTS = ['male', 'prabhat', 'kunal', 'andrew', 'brian', 'christopher', 'eric', 'roger', 'steffan', 'thomas', 'ryan', 'rishi', 'daniel', 'alex', 'david', 'aaron', 'arthur', 'fred', 'tom', 'mark', 'ravi', 'guy', 'george', 'oliver', 'james'];
const FEMALE_HINTS = ['female', 'neerja', 'ava', 'emma', 'libby', 'veena', 'heera', 'samantha', 'karen', 'zira', 'moira', 'tessa', 'victoria', 'susan', 'fiona', 'kate', 'serena', 'aria', 'jenny', 'sonia', 'neerja'];

export class VoiceCast {
  constructor() {
    this.enabled = true;        // the "Voices" toggle
    this.soundOn = false;       // follows the main sound toggle
    this.clips = new Set();
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.assigned = {};
    this.audio = null;
    this.token = 0;
    if (this.synth) {
      const load = () => { this.voices = this.synth.getVoices(); this.assigned = {}; };
      load();
      this.synth.addEventListener?.('voiceschanged', load);
    }
    fetch('assets/voices/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => { if (m && Array.isArray(m.clips)) m.clips.forEach((k) => this.clips.add(k)); })
      .catch(() => {});
  }

  get available() { return !!this.synth || this.clips.size > 0; }
  get active() { return this.enabled && this.soundOn; }

  setSound(on) {
    this.soundOn = on;
    if (!on) this.stop();
    // iOS/Safari only allow speech after a user gesture: prime it now.
    if (on && this.synth) {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        this.synth.speak(u);
      } catch { /* ignore */ }
    }
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
  }

  pickVoice(who) {
    if (this.assigned[who] !== undefined) return this.assigned[who];
    const profile = PROFILES[who];
    const english = this.voices.filter((v) => /^en/i.test(v.lang));
    const all = english.length ? english : this.voices;
    // try the device's natural-sounding voices first, then everything else
    const natural = all.filter(isNatural);
    let chosen = null;
    for (const pool of natural.length ? [natural, all] : [all]) {
      chosen = this.matchVoice(pool, who, profile);
      if (chosen) break;
    }
    const pool = all;
    if (who === 'friend' && chosen && this.assigned.boy && chosen.name === this.assigned.boy.name) {
      chosen = [...natural, ...all].find((v) => v !== this.assigned.boy && MALE_HINTS.some((h) => v.name.toLowerCase().includes(h))) || chosen;
    }
    this.assigned[who] = chosen || pool[0] || null;
    return this.assigned[who];
  }

  matchVoice(pool, who, profile) {
    let chosen = null;
    for (const want of profile.prefer) {
      chosen = pool.find((v) => v.name.toLowerCase().includes(want) || (want.startsWith('en-in') && /en-IN/i.test(v.lang) && v.name.toLowerCase().includes(want.split(' ')[1])));
      if (chosen) break;
    }
    if (!chosen) {
      const hints = profile.gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
      chosen = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) || null;
    }
    return chosen;
  }

  // Speak one line. Resolves when the voice has finished (or straight away if muted).
  speak(line) {
    this.stop();
    if (!this.active || !PROFILES[line.who]) return Promise.resolve(false);
    const token = ++this.token;
    if (line.key && this.clips.has(line.key)) return this.playClip(line.key, token);
    if (!this.synth) return Promise.resolve(false);
    if (!this.voices.length) this.voices = this.synth.getVoices();
    if (!this.voices.length) return Promise.resolve(false);   // no voices on this device
    return new Promise((resolve) => {
      const profile = PROFILES[line.who];
      const u = new SpeechSynthesisUtterance(line.text.replace(/…/g, '...'));
      const v = this.pickVoice(line.who);
      if (v) { u.voice = v; u.lang = v.lang; }
      const natural = v && isNatural(v);
      u.pitch = natural ? 1 : profile.pitch;
      u.rate = natural ? 1 : profile.rate;
      u.volume = 0.95;
      let done = false;
      let started = false;
      const end = () => { if (done) return; done = true; clearTimeout(guard); clearTimeout(startGuard); resolve(token === this.token); };
      u.onstart = () => { started = true; };
      u.onend = end;
      u.onerror = end;
      // safety nets: speech that never starts, or an onend that never fires
      const startGuard = setTimeout(() => { if (!started) end(); }, 1800);
      const guard = setTimeout(end, 1500 + line.text.split(/\s+/).length * 520);
      this.synth.speak(u);
    });
  }

  playClip(key, token) {
    return new Promise((resolve) => {
      const a = new Audio(`assets/voices/${key}.mp3`);
      this.audio = a;
      a.volume = 0.95;
      const end = () => resolve(token === this.token);
      a.onended = end;
      a.onerror = end;
      a.play().catch(end);
    });
  }

  stop() {
    this.token++;
    if (this.synth) { try { this.synth.cancel(); } catch { /* ignore */ } }
    if (this.audio) { this.audio.pause(); this.audio = null; }
  }
}
