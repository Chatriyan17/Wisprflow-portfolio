# Chatriyan's Portfolio World

An interactive, autobiographical pixel-art portfolio. Visitors don't just read the career story, they travel through it.

**Chapter 01 · The Beginning (2022):** from manufacturing to discovering design.

This is **Stage 1: World foundation**. It covers the opening world, the two original characters, the camera, both navigation modes, dialogue and interaction. The path leads up to the first story location, The Old Workshop, which opens in Stage 2.

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

- `M` toggles sound (off by default). `Esc` closes cards and skips the intro.
- Touch devices get on-screen ◀ ▶ ▲ E buttons in Explore World.
- **Skip to story** opens the whole chapter as plain text, for visitors who'd rather read.
- `prefers-reduced-motion` is respected: no camera pan, particles or typewriter effect.
- Both modes share the same world, the same story beats and the same progress.

### What's in Stage 1

- **Opening cinematic.** The camera glides from the distant workshop back to the start, the boy appears, the girl walks up, and they talk. Then *PRESS ANY KEY TO BEGIN*.
- **The starting world.** The big lantern tree and welcome sign, home, the Journey Map ledge, a waterfall with a stone bridge, a floating-island lookout, a blossom grove, and The Old Workshop with its doors still locked.
- **Interactables.** Welcome sign, home door, Journey Map (lists all 7 chapter locations), lookout (the camera pans to the workshop) and the workshop door.
- **Chapter progress HUD.** Seven location pips, filling up as you approach the first location.

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
    art.js              Procedural 16-bit painters (sky, mountains, trees, house, workshop…)
    renderer.js         Parallax layers, baked main layer, water/smoke/grass, lighting
    pixel.js            Pixel drawing helpers (dither, discs, crisp pixel text)
  systems/              dialogue, speech bubbles, story progress, audio
  ui/hud.js             Chapter progress, mode switch, toasts, story cards
  cinematics/intro.js   Opening sequence
  content/chapter01.js  All story text, chapter locations and dialogue scripts
assets/sprites/         Baked sprite sheets + animation metadata
assets/portraits/       Dialogue portraits
tools/bake_sprites.py   Sprite/portrait baker
```

Character sprites, the background layers, camera, dialogue, interactables and story progression are separate modules. Characters are independent, controllable entities on top of the world; they are never baked into the background.

## Adding the next stages

1. Add the location's layout, props and interactables in `src/world/level.js`, and its painters in `src/world/art.js`.
2. Put the text in `src/content/chapter01.js`. **Only real, supplied facts:** don't invent achievements, dates, conversations or experiences.
3. Extend `SCROLL.endX` and `LANDMARKS` in `config.js` / `level.js` so Scroll Journey reaches the new area.

The companion is currently labelled "Companion" in dialogue. Set her name in `CHARACTERS.girl.name` in `src/content/chapter01.js`.

### Roadmap

1. ✅ World foundation
2. The manufacturing world (The Old Workshop)
3. Discovery of UX (Discovery Path, Learning Camp)
4. First workplace (Balwa HCM Cloud Suite)
5. Education and mentorship (Knowledge Academy, Mentor's Camp)
6. The birth of design skills (Origin Temple puzzle)
7. Chapter conclusion
