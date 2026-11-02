# Chatriyan's Portfolio World

An interactive, autobiographical pixel-art portfolio. Visitors don't just read the career story, they travel through it.

**Chapter 01 · The Beginning (2022):** from manufacturing to discovering design.

Built so far:

- **Stage 1: World foundation.** The opening village, the two original characters, the camera, both navigation modes, dialogue and interaction.
- **Stage 2: The Old Workshop** (Chapter 01 · Part 02). The road from the village into an industrial district, the factory hall, the break yard where friends first mention UX, and the gateway to the World of UX.
- **Stage 5: The Knowledge Academy** (Chapter 01 · Part 05). Master of Design in Interaction Design at Lovely Professional University, Punjab: a magical campus with learning halls, a playable interaction-design puzzle, the Foundation Wall and the first signal of the Mentor's Camp.
- **Stage 4: The First Design Studio** (Chapter 01 · Part 04). Inside Balwa HCM Cloud Suite: the one-person design team, four creative stations, the creative hats, the missing piece, and the door to the Knowledge Academy.
- **Stage 3: The Discovery Path** (Chapter 01 · Part 03). Through the gateway into a magical forest: the first question, the learning station with the Google UX Design course on Coursera, six industry islands rising and connecting, and the door of the first design studio.

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

### What's in Stage 5

- **Into the academy.** Through the glowing doorway of books at the back of the studio, with a "Chapter 01 · Part 05" card, onto a sunny fantasy campus: sandstone halls, slate-blue towers with waving flags, lawns and cobbled paths, lamp posts, a fountain.
- **The gates.** A stone arch reading *LOVELY PROFESSIONAL UNIVERSITY · PUNJAB, INDIA*. The arrival conversation plays and then the iron gates swing open. Beside them, an information board (E) shows Institution, Programme and Specialisation.
- **01 · Design Fundamentals classroom.** Six optional learning objects (E): visual hierarchy, Gestalt principles, typography, composition, colour theory and usability principles. Each has a short explanation and a small visual example.
- **02 · Understanding People library.** Six optional objects: user research, interviews, empathy mapping, personas, affinity mapping and problem identification. All are presented as design learning concepts, not specific coursework.
- **03 · Interaction Design Lab.** A playable interface puzzle. Rearrange a jumbled sign-up screen, press its button and watch it respond (pressed, loading, success), then compare before and after. It works with mouse, touch and keyboard.
- **04 · The Foundation Wall.** Seven principle symbols light up one by one as he walks past, each with a rising chime. When all are lit the camera pulls back and the conversation lands: *"You're not just learning how to design anymore. You're learning why."*
- **The mentor's signal.** In a quiet courtyard he looks to the horizon. After the conversation, *THE MENTOR'S CAMP · Learning the principles is one thing. Learning how to think is another.* glows into view over a lantern-lit path. The path (E) is the hook for Stage 6: `Game.enterNextRegion()`.

### What's in Stage 4

- **Into the studio.** The studio door opens, forest sparks turn into little design elements and drifting pages become design documents. A "Chapter 01 · Part 04 · Balwa HCM Cloud Suite" card plays, and the pair walk into a warm, colourful creative studio with the company name on the wall.
- **The one-person design team.** The camera pulls back over four quiet, empty desks. "Well... I was the whole design team." A beat, a surprised companion with a "!", then "Pretty much!" As he names each discipline, a hat pops above his head and keeps changing.
- **Four creative stations** (graphic, motion, visual, product). Walk up and press E, or let Scroll Journey stop at each. The monitors wake, the camera eases in, and the work comes alive: a poster assembling itself, an animation timeline with a moving playhead, a moodboard building tile by tile, and a wireframe turning into a finished interface while a user flow draws itself. Each station is then marked discovered and earns its hat.
- **One designer. Multiple creative hats.** Once all four are found, the four hat badges orbit him under the title card, and the way to the back of the studio opens.
- **The missing piece.** At the design wall, which shows all four disciplines, the room dims, the camera moves in slowly and the conversation about wanting guidance plays.
- **The decision.** The Knowledge Academy sign and a glowing doorway. Its door (E) is the hook for Stage 5: `Game.enterNextRegion()`.
- The interior is its own space. Scroll Journey steps in and out of it as you scroll past the door, and in Explore World there is a "Go outside" door by the entrance.

### What's in Stage 3

- **Through the gateway.** The portal opens with a flash and a chapter card, and the pair step out into the Discovery Forest. On the way, pipes sprout into branches, the old street lamp is wrapped in vines, and blueprint pages drifting out of the factory turn into paper and books.
- **"Everything starts with a question."** A sign and a conversation at the forest entrance.
- **The learning station.** A study nook under the trees, with a vintage computer showing the Google UX Design course on Coursera. Using it plays the conversation and opens a panel of what he started to discover: understanding UX, user-centred design, research, problem identification, wireframing and prototyping. They're presented as first steps, not mastery, and six discovery cards float out around the desk.
- **The world of possibilities.** Healthcare, Education, Finance, E-commerce, Transportation and Technology islands rise one by one as he walks, each with a discovery chime. On the stone hill the camera pulls back, the conversation plays, and glowing pathways connect every world. Each island can also be inspected with E from below.
- **The first design studio.** A cozy creative workspace with a neon sign: *THE FIRST DESIGN STUDIO · Time to turn curiosity into practice.* Its door (E) is the hook for Stage 4: `Game.enterNextRegion()`.

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
    forest.js           Stage 3 painters (forest, learning station, industry islands, studio)
    studio.js           Stage 4 painters (studio interior, creative stations, design wall, academy door)
    campus.js           Stage 5 painters (campus, gates, classroom, library, lab, foundation wall)
    renderer.js         Parallax layers, baked main layer, water/smoke/grass, lighting
    pixel.js            Pixel drawing helpers (dither, discs, crisp pixel text)
  systems/              dialogue, character voices, speech bubbles, story progress + save, audio
  ui/hud.js             Chapter progress, mode switch, toasts, story cards
  ui/labPuzzle.js       The playable interaction-design puzzle (Stage 5)
  ui/learningCards.js   Academy learning cards with small visual examples
  cinematics/intro.js   Opening sequence
  cinematics/stage2.js  Stage 2 scenes (workshop talk, catwalk, break yard, memory)
  cinematics/stage3.js  Stage 3 scenes (gateway, first question, course, curiosity)
  cinematics/stage4.js  Stage 4 scenes (studio door, one-person team, stations, hats, missing piece, decision)
  cinematics/stage5.js  Stage 5 scenes (academy door, gates, halls, lab, foundation wall, horizon)
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
3. ✅ Discovery of UX (Discovery Path, Learning Camp)
4. ✅ First workplace (Balwa HCM Cloud Suite)
5. ✅ Education (The Knowledge Academy) · next: mentorship (The Mentor's Camp)
6. The birth of design skills (Origin Temple puzzle)
7. Chapter conclusion
