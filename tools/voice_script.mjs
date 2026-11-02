// Writes assets/voices/VOICE-SCRIPT.md: every spoken line with the file name to record it as.
// Usage: node tools/voice_script.mjs
import { writeFileSync } from 'node:fs';
import { SCRIPTS, CHARACTERS } from '../src/content/chapter01.js';

const out = ['# Voice script', '',
  'Record each line as an `.mp3` named exactly as shown, put it in `assets/voices/`,',
  'then run `python3 tools/voice_manifest.py`. Lines without a recording use the browser voice.',
  'Signs are not voiced.', ''];
const ROLE = { boy: ' (protagonist)', girl: ' (companion)', mentor: ' (mentor)', friend: ' (memory, silhouettes)' };
for (const who of ['boy', 'girl', 'mentor', 'friend']) {
  out.push(`## ${CHARACTERS[who].name}${ROLE[who]}`, '');
  out.push('| File | Line |', '|---|---|');
  for (const [id, lines] of Object.entries(SCRIPTS)) {
    lines.forEach((l, i) => {
      if (l.who === who) out.push(`| \`${id}-${i + 1}.mp3\` | ${l.text.replace(/\|/g, '\\|')} |`);
    });
  }
  out.push('');
}
writeFileSync(new URL('../assets/voices/VOICE-SCRIPT.md', import.meta.url), out.join('\n'));

// machine-readable copy for tools/generate_voices.py
const lines = [];
for (const [id, list] of Object.entries(SCRIPTS)) {
  list.forEach((l, i) => { if (l.who !== 'sign') lines.push({ key: `${id}-${i + 1}`, who: l.who, text: l.text }); });
}
writeFileSync(new URL('../assets/voices/lines.json', import.meta.url), JSON.stringify(lines, null, 2) + '\n');
console.log(`wrote assets/voices/VOICE-SCRIPT.md and lines.json (${lines.length} spoken lines)`);
