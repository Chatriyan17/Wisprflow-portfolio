#!/usr/bin/env python3
"""
Rebuild assets/voices/manifest.json from the recorded clips in assets/voices/.

Record each line as an .mp3 named after its key (see assets/voices/VOICE-SCRIPT.md),
drop the files in assets/voices/, then run:

    python3 tools/voice_manifest.py

Lines with a recording play the recording; every other line falls back to the
browser's built-in voice.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "assets", "voices")

clips = sorted(f[:-4] for f in os.listdir(DIR) if f.lower().endswith(".mp3"))
with open(os.path.join(DIR, "manifest.json"), "w") as fh:
    json.dump({"clips": clips}, fh, indent=2)
    fh.write("\n")
print(f"{len(clips)} recorded line(s) listed in assets/voices/manifest.json")
