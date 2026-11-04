#!/usr/bin/env python3
"""
Turn raw voice recordings (phone voice notes, WhatsApp audio, .m4a, .wav, ...) into
game-ready clips in assets/voices/, then rebuild the manifest.

    python3 tools/import_voices.py intro-1=~/Downloads/note1.mp4 home-1=~/Downloads/note2.mp4

A recording with several lines in a row can be split by giving each line its time range
in seconds:

    python3 tools/import_voices.py lookout-2=note.mp4@0-4.8 enter-workshop-1=note.mp4@5.5-11

Each KEY is a line key from assets/voices/lines.json (see SCRIPT-BOY.md / SCRIPT-GIRL.md).
For every recording this:
  1. cuts the hum below 80 Hz and lightly reduces background hiss,
  2. evens out loudness so every clip plays at the same level (-16 LUFS, peaks under -1.5 dB),
  3. trims the dead air before and after the words, so the voice starts with the text box,
  4. writes a mono .mp3 named after the key.

Needs ffmpeg on the PATH.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "assets", "voices")

CLEAN = "highpass=f=80,afftdn=nr=10:nf=-50:tn=1"
TARGET = "I=-16:TP=-1.5:LRA=11"
LEAD, TAIL = 0.08, 0.20          # seconds of breathing room kept around the words
SILENCE = "silencedetect=n=-40dB:d=0.25"
BLIP = 0.15                      # sounds shorter than this at the very start/end are taps, not words


def ffmpeg(*args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", *args],
                          capture_output=True, text=True, check=True).stderr


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def speech_bounds(path):
    """Start and end of the spoken part, ignoring silence at either edge and the
    short taps or clicks a phone picks up when recording starts or stops."""
    log = ffmpeg("-i", path, "-af", SILENCE, "-f", "null", "-")
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    total = duration(path)
    ends += [total] * (len(starts) - len(ends))          # silence running to the end
    # the sounding stretches are the gaps between silences
    sound, t = [], 0.0
    for s, e in zip(starts, ends):
        if s > t:
            sound.append([t, s])
        t = e
    if t < total:
        sound.append([t, total])
    while len(sound) > 1 and sound[0][1] - sound[0][0] < BLIP:
        sound.pop(0)
    while len(sound) > 1 and sound[-1][1] - sound[-1][0] < BLIP:
        sound.pop()
    if not sound:                # nothing detected: keep the whole clip
        return 0.0, total
    return sound[0][0], sound[-1][1]


def process(key, src, dst, span=None):
    cut = ["-ss", f"{span[0]}", "-to", f"{span[1]}"] if span else []
    with tempfile.TemporaryDirectory() as tmp:
        # pass 1: measure loudness after cleanup
        log = ffmpeg(*cut, "-i", src, "-af", f"{CLEAN},loudnorm={TARGET}:print_format=json", "-f", "null", "-")
        m = json.loads(log[log.rindex("{"):log.rindex("}") + 1])
        norm = (f"loudnorm={TARGET}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
                f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
        # pass 2: clean + normalise to a mono wav
        wav = os.path.join(tmp, "norm.wav")
        ffmpeg(*cut, "-i", src, "-af", f"{CLEAN},{norm},aresample=44100", "-ac", "1", wav)
        # trim the dead air, fade the edges so the cut never clicks, encode
        begin, finish = speech_bounds(wav)
        a = max(0.0, begin - LEAD)
        b = min(duration(wav), finish + TAIL)
        length = b - a
        ffmpeg("-i", wav, "-af",
               f"atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={max(0, length - 0.08):.3f}:d=0.08",
               "-c:a", "libmp3lame", "-q:a", "3", "-ac", "1", dst)
    kept = f"{(span[0] if span else 0) + a:.2f}-{(span[0] if span else 0) + b:.2f}s of the recording"
    print(f"{key}.mp3  {length:.2f}s  (kept {kept}; was {m['input_i']} LUFS)")


def main(pairs):
    if not pairs:
        sys.exit(__doc__)
    with open(os.path.join(DIR, "lines.json")) as fh:
        known = {l["key"]: l for l in json.load(fh)}
    jobs = []
    for p in pairs:
        key, sep, src = p.partition("=")
        key = key.removesuffix(".mp3")
        span = None
        m = re.fullmatch(r"(.+)@([\d.]+)-([\d.]+)", src)
        if m:
            src, span = m.group(1), (float(m.group(2)), float(m.group(3)))
            if span[1] <= span[0]:
                sys.exit(f"empty time range in {p!r}")
        src = os.path.expanduser(src)
        if not sep or not src:
            sys.exit(f"expected KEY=FILE or KEY=FILE@START-END, got {p!r}")
        if key not in known:
            sys.exit(f"unknown line key {key!r} (see assets/voices/lines.json)")
        if not os.path.isfile(src):
            sys.exit(f"no such file: {src}")
        jobs.append((key, src, span))
    for key, src, span in jobs:
        process(key, src, os.path.join(DIR, f"{key}.mp3"), span)
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "voice_manifest.py")], check=True)


if __name__ == "__main__":
    main(sys.argv[1:])
