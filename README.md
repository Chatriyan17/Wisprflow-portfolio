# Chatriyan's Portfolio World

An interactive, autobiographical pixel-art portfolio. Visitors don't just read the career story, they travel through it.

**Chapter 01 · The Beginning (2022):** from manufacturing to discovering design.

Built so far:

- **Stage 1: World foundation.** The opening village, the two original characters, the camera, both navigation modes, dialogue and interaction.
- **Stage 2: The Old Workshop** (Chapter 01 · Part 02). The road from the village into an industrial district, the factory hall, the break yard where friends first mention UX, and the gateway to the World of UX.

## Run it

It's a static site with no build step and no dependencies. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk won't work, because ES modules and `fetch` need a server.

It deploys as-is to GitHub Pages, Netlify, Vercel or any static host.

## How it plays

| | Scroll Journey (default) | Explore World |
|---|---|---|
| Move | Scroll or swipe. The boy walks or runs the path and the companion follows | `A` `D` / `←` `→` (hold `Shift` to run) |
| Jump | automatic on ledges | `Space` / `W` / `↑` |
| Drop through a platform | – | `S` / `↓` |
| Interact | `E` or click the prompt | `E` or click the prompt |
| Switch | toggle in the top bar, or press `←` `→` / `A` `D` | toggle in the top bar |

- `M` toggles sound (off by default). `V` toggles character voices. `Esc` closes cards and skips the intro.
- Touch devices get on-screen ◀ ▶ ▲ E buttons in Explore World.
- **Skip to story** opens the whole chapter as plain text, for visitors who'd rather read.
- `prefers-reduced-motion` is respected: no camera pan, particles or typewriter effect.
- Both modes share the same world, the same story beats and the same progress.

### What's in Stage 2

- **A gradual change of region, with no loading screen.** Grass becomes paving, trees become factories and chimneys, lanterns become sodium street lights, the sky turns rusty, and the music box gives way to a factory hum.
- **The Old Workshop hall.** A hydraulic press, meshing gears, a conveyor belt that carries you, an overhead crane, a workbench, a tool cabinet, a blueprint board, pipes with steam vents, warning beacons, and light shafts through the windows.
- **Story through exploration.** Inspect the machine (E) and read the blueprint (E). A conversation plays on the observation catwalk.
- **The turning point.** In the break yard he remembers the conversation with friends who first mentioned UX. They appear only as faceless silhouettes in a warm sepia memory. Then the companion reappears: *"Looks like someone just opened a new door."*
- **The discovery gateway.** A glowing sign, *A NEW PATH AWAITS · THE WORLD OF UX*, and a stone portal. Interacting with it plays the transition and shows what's next. `Game.enterNextRegion()` in `src/main.js` is the hook for Stage 3.
- **Saved progress.** Checkpoints are remembered in the visitor's browser. Returning visitors get a *Continue from …* button.

### What's in Stage 1

- **Opening cinematic.** The camera glides from the distant workshop back to the start, the boy appears, the girl walks up, and they talk. Then *PRESS ANY KEY TO BEGIN*.
- **The starting world.** The big lantern tree and welcome sign, home, the Journey Map ledge, a waterfall with a stone bridge, a floating-island lookout, a blossom grove, and The Old Workshop with its doors still locked.
- **Interactables.** Welcome sign, home door, Journey Map (lists all 7 chapter locations), lookout (the camera pans to the workshop) and the workshop door.
- **Chapter progress HUD.** Seven location pips, filling up as you approach the first location.

## Character voices

With sound on, every line of dialogue is spoken (signs stay silent).

1. **Recorded voices come first.** Record a line as an `.mp3`, name it after the line's key, put it in `assets/voices/` and run `python3 tools/voice_manifest.py`. The full list of lines and file names is in [`assets/voices/VOICE-SCRIPT.md`](assets/voices/VOICE-SCRIPT.md). Regenerate that list after editing dialogue with `node tools/voice_script.mjs`.
2. **Everything else uses the browser's built-in speech.** Each character gets their own voice, pitch and pace: the protagonist lower, the companion brighter, the friends deeper. Indian-English voices are preferred where the device has them. The exact voice depends on the visitor's device and browser.

Lines can be recorded a few at a time; anything not yet recorded keeps using the browser voice.

## Characters: exact originals, not redraws

The in-game sprites are cut directly out of the supplied reference sheets in `reference/`:

- `reference/boy-character-sheet.webp`: the protagonist (playable)
- `reference/girl-character-sheet.webp`: the companion and guide
- `reference/world-concept.webp`: the world mood reference

`tools/bake_sprites.py` cuts out the front, side and back turnaround poses, removes the background, and reduces them to game-scale pixel sprites. It then cuts the side pose into bones (upper arm, forearm, thigh, shin, foot) and animates them with a skeletal rig. Hip, knee, ankle, shoulder and elbow angles follow a human gait cycle, with heel strike, knee bend, toe-off, counter-swinging arms and the body rising and falling as the feet plant. Frames are posed at reference resolution and then reduced to the game's pixel grid with the character's own palette. The animations are idle, walk, run, jump, fall, land, talk, front, front-talk and back. The face, hair, glasses, beard, braids, clothes and colours are therefore always the original design. Dialogue portraits are cropped as-is from the expression panels.

To rebuild after changing a reference sheet (requires Pillow, numpy, scipy):

```bash
python3 tools/bake_sprites.py
```

## Project structure

```
index.html              UI shell (canvas + HUD, dialogue, cards, touch controls)
styles/main.css         RPG-style UI
src/
  main.js               Game: boot, loop, modes, interactions
  config.js             View, world, physics and scroll tuning
  engine/               assets, input, camera, physics (AABB), sprite animator, rng
  entities/             Character (player) and Companion (follow AI)
  world/
    level.js            Layout: terrain, platforms, props, lights, interactables, story beats
    art.js              Procedural 16-bit painters (sky, mountains, trees, house…)
    industrial.js       Stage 2 painters (concrete, factory hall, machines, break yard, gateway, skyline)
    renderer.js         Parallax layers, baked main layer, water/smoke/grass, lighting
    pixel.js            Pixel drawing helpers (dither, discs, crisp pixel text)
  systems/              dialogue, character voices, speech bubbles, story progress + save, audio
  ui/hud.js             Chapter progress, mode switch, toasts, story cards
  cinematics/intro.js   Opening sequence
  cinematics/stage2.js  Stage 2 scenes (workshop talk, catwalk, break yard, memory)
  content/chapter01.js  All story text, chapter locations and dialogue scripts
assets/sprites/         Baked sprite sheets + animation metadata
assets/portraits/       Dialogue portraits
assets/voices/          Recorded voice lines (optional) + manifest + voice script
tools/bake_sprites.py   Sprite/portrait baker
tools/voice_script.mjs  Exports every spoken line with its file name
tools/voice_manifest.py Lists recorded voice clips for the game
```

Character sprites, the background layers, camera, dialogue, interactables and story progression are separate modules. Characters are independent, controllable entities on top of the world; they are never baked into the background.

## Adding the next stages

1. Add the location's layout, props and interactables in `src/world/level.js`, and its painters in `src/world/art.js`.
2. Put the text in `src/content/chapter01.js`. **Only real, supplied facts:** don't invent achievements, dates, conversations or experiences.
3. Extend `SCROLL.endX` and `LANDMARKS` in `config.js` / `level.js` so Scroll Journey reaches the new area.

The companion is currently labelled "Companion" in dialogue. Set her name in `CHARACTERS.girl.name` in `src/content/chapter01.js`.

### Roadmap

1. ✅ World foundation
2. ✅ The manufacturing world (The Old Workshop)
3. Discovery of UX (Discovery Path, Learning Camp)
4. First workplace (Balwa HCM Cloud Suite)
5. Education and mentorship (Knowledge Academy, Mentor's Camp)
6. The birth of design skills (Origin Temple puzzle)
7. Chapter conclusion
