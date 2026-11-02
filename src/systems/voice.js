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
  // preferred voice names, in order; matched case-insensitively against what the device offers
  boy: { prefer: ['rishi', 'en-in male', 'google uk english male', 'daniel', 'alex', 'david', 'aaron', 'arthur', 'guy', 'male'], gender: 'male', pitch: 0.95, rate: 1.0 },
  girl: { prefer: ['veena', 'heera', 'en-in female', 'google uk english female', 'samantha', 'karen', 'zira', 'moira', 'tessa', 'female'], gender: 'female', pitch: 1.2, rate: 1.04 },
  friend: { prefer: ['ravi', 'fred', 'google us english', 'tom', 'mark', 'male'], gender: 'male', pitch: 0.8, rate: 0.95 },
};

const MALE_HINTS = ['male', 'rishi', 'daniel', 'alex', 'david', 'aaron', 'arthur', 'fred', 'tom', 'mark', 'ravi', 'guy', 'george', 'oliver', 'james'];
const FEMALE_HINTS = ['female', 'veena', 'heera', 'samantha', 'karen', 'zira', 'moira', 'tessa', 'victoria', 'susan', 'fiona', 'kate', 'serena', 'aria', 'jenny', 'sonia', 'neerja'];

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
    const pool = english.length ? english : this.voices;
    let chosen = null;
    for (const want of profile.prefer) {
      chosen = pool.find((v) => v.name.toLowerCase().includes(want) || (want.startsWith('en-in') && /en-IN/i.test(v.lang) && v.name.toLowerCase().includes(want.split(' ')[1])));
      if (chosen) break;
    }
    if (!chosen) {
      const hints = profile.gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
      chosen = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) || null;
    }
    // keep the friend from sounding exactly like the protagonist when possible
    if (who === 'friend' && chosen && this.assigned.boy && chosen.name === this.assigned.boy.name) {
      chosen = pool.find((v) => v !== this.assigned.boy && MALE_HINTS.some((h) => v.name.toLowerCase().includes(h))) || chosen;
    }
    this.assigned[who] = chosen || pool[0] || null;
    return this.assigned[who];
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
      u.pitch = profile.pitch;
      u.rate = profile.rate;
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
