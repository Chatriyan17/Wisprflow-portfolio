#!/usr/bin/env python3
"""
Render every spoken line with natural neural voices (Kokoro, open source,
Apache-2.0) and save them as the game's voice clips.

Setup (once):
    pip install kokoro-onnx soundfile
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
    (ffmpeg must be installed to write .mp3)

Run:
    node tools/voice_script.mjs                 # refresh assets/voices/lines.json from the dialogue
    python3 tools/generate_voices.py --model-dir /path/to/kokoro/files
    python3 tools/generate_voices.py --only boy  # re-render one character
    python3 tools/generate_voices.py --boy am_fenrir --girl af_bella   # try other voices

Your own recordings always win: lines that already have a recording you made
are skipped unless you pass --force (generated clips are tracked in
assets/voices/generated.json).
"""
import argparse
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = os.path.join(ROOT, "assets", "voices")

# Default cast. Listen to alternatives with --boy/--girl/--friend.
#   male:   am_michael, am_fenrir, am_puck, am_echo, bm_george, bm_fable, bm_lewis
#   female: af_heart, af_bella, af_nicole, af_sarah, bf_emma, bf_isabella
CAST = {
    "boy": {"voice": "am_michael", "speed": 1.0},
    "girl": {"voice": "af_heart", "speed": 1.02},
    "friend": {"voice": "bm_george", "speed": 0.96},
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model-dir", default=".", help="folder with kokoro-v1.0.onnx and voices-v1.0.bin")
    ap.add_argument("--only", choices=list(CAST), help="render one character only")
    ap.add_argument("--force", action="store_true", help="also overwrite your own recordings")
    for who in CAST:
        ap.add_argument(f"--{who}", help=f"Kokoro voice for the {who}")
    args = ap.parse_args()
    for who in CAST:
        if getattr(args, who):
            CAST[who]["voice"] = getattr(args, who)

    from kokoro_onnx import Kokoro
    import soundfile as sf

    kokoro = Kokoro(os.path.join(args.model_dir, "kokoro-v1.0.onnx"), os.path.join(args.model_dir, "voices-v1.0.bin"))
    with open(os.path.join(VOICES, "lines.json")) as fh:
        lines = json.load(fh)
    gen_path = os.path.join(VOICES, "generated.json")
    generated = json.load(open(gen_path)) if os.path.exists(gen_path) else {}

    made = 0
    for line in lines:
        who, key = line["who"], line["key"]
        if who not in CAST or (args.only and who != args.only):
            continue
        out = os.path.join(VOICES, f"{key}.mp3")
        if os.path.exists(out) and key not in generated and not args.force:
            print(f"skip {key} (your recording)")
            continue
        cast = CAST[who]
        samples, rate = kokoro.create(line["text"], voice=cast["voice"], speed=cast["speed"], lang="en-us")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            sf.write(tmp.name, samples, rate)
            # gentle polish: trim silence at the ends, even out loudness, small file
            subprocess.run([
                "ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name,
                "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-18:TP=-2,apad=pad_dur=0.12",
                "-ac", "1", "-ar", "24000", "-b:a", "64k", out,
            ], check=True)
            os.unlink(tmp.name)
        generated[key] = cast["voice"]
        made += 1
        print(f"{key:28s} {cast['voice']:11s} {line['text'][:60]}")

    with open(gen_path, "w") as fh:
        json.dump(generated, fh, indent=2, sort_keys=True)
        fh.write("\n")
    subprocess.run(["python3", os.path.join(ROOT, "tools", "voice_manifest.py")], check=True)
    print(f"rendered {made} line(s)")


if __name__ == "__main__":
    main()
