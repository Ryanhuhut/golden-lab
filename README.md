# GOLDEN LAB

GOLDEN LAB is a static, interactive mathematical motion laboratory. Four Canvas experiments and a Pascal Triangle hero explore how simple rules become geometric structures. The visual language is graphite, black, off-white, and restrained gold. The site has no backend or heavy framework.

## Mathematical map

**Fibonacci and the Golden Ratio are not the same thing.** Fibonacci is a sequence defined by the recurrence Fₙ = Fₙ₋₁ + Fₙ₋₂; φ is the constant (1 + √5) / 2. Ratios of consecutive Fibonacci terms **approach** φ. No finite consecutive-term ratio is presented as exactly equal to φ.

The project follows this conceptual journey:

    Pascal → Fibonacci → consecutive ratios → φ → Golden Angle / phyllotaxis

Shallow diagonal sums in Pascal's Triangle yield Fibonacci numbers. Separately, Pascal coefficients taken modulo 2 form the Sierpiński pattern. The Golden Angle, mathematically about 137.507764°, belongs to the Golden Ratio branch; the interactive display deliberately targets **137.5°**. Phyllotaxis and the petal arrangements use that angle. They are not part of the definition of the Fibonacci sequence.

## The four experiments

| Experiment | What it shows |
| --- | --- |
| **01 — Fibonacci Growth** | Sequential Fibonacci squares, drawn quarter-circle spiral arcs, smooth auto-camera framing, and clockwise/counterclockwise presentation. |
| **02 — Golden Phyllotaxis** | Procedural points from r = spacing × √n and θ = n × angle, revealed from the center into a sunflower-like structure. |
| **03 — Golden Petals** | Procedural petals with count and angle controls. A slow presentation sequence moves from 120.0° to the exact UI target 137.5°, where the highlight strengthens. |
| **04 — Fibonacci Mechanics** | An inertial Fibonacci number roller, the exact BigInt recurrence, consecutive-term ratios, and their convergence toward φ. |

The homepage hero begins with Pascal numbers and thin gold diagonal guides. The guides retract, odd/even values become white/black cells, and the numerals fade. One camera then zooms continuously away from the **same triangle**, anchored at its apex. Deeper Pascal parity rows enter the frame until the Sierpiński triangle emerges. This is not a crossfade to a separate centered fractal. Deep rows are cached in Canvas bitmaps. The renderer in src/ui/pascal.js exposes prepare() and seek(time) for a future deterministic cinematic workflow; there is no export UI yet.

## Run locally

The project currently declares **no third-party npm dependencies**. There is nothing to install; npm install is optional. There is no development-server script in package.json. Use a local static server for the ES module version:

    python3 -m http.server 8000

Open http://localhost:8000/. To open the project directly as a file, use the generated preview.html next to favicon.svg. It inlines the app's CSS and JavaScript; hosted fonts still need a connection, with local fallbacks available. Rebuild it after source edits:

    npm run preview:build
    npm test

npm test runs the Node mathematical and renderer checks in tests/math.test.js. Append ?debug to the page URL for the built-in FPS and motion readout. Node.js 20.11+ is recommended because the preview script uses import.meta.dirname.

## Code map

| Path | Responsibility |
| --- | --- |
| index.html, styles.css, favicon.svg | Document shell, visual tokens/layout, and tab identity. |
| src/app.js, src/state.js | Experiment navigation, card transitions, render loop, and in-memory state. State survives closing/reopening an experiment in the same page session. |
| src/core/animation.js, canvas.js, theme.js | Shared easing/spring/damping helpers, DPR-aware Canvas setup, and eased Graphite / True Black appearance. |
| src/experiments/ | The four experiment renderers and their controls. Mechanics uses BigInt and scaled division so large Fibonacci ratios do not require converting huge integers directly to Number. |
| src/ui/ | Overview/workspace, controls, shared angle slider, and Pascal hero. |
| scripts/build-standalone.mjs, preview.html | Generator and generated direct-file preview. Edit source files, then regenerate preview.html. |
| tests/math.test.js | Automated mathematical, motion, theme, and Pascal renderer checks. |

Rendering runs through a shared requestAnimationFrame loop at the display refresh rate, with elapsed-time motion and a page-visibility pause. Experiments use Canvas 2D instead of per-point DOM nodes. Motion helpers provide springs, damping, and easing; scripted Petals motion uses a mostly steady time curve. Canvas backing resolution is capped at DPR 2. Static stage grids are cached, and the three Canvas workspace experiments offer a Grid setting that remains in memory while the page is open. Graphite is the default appearance; the UI also offers True Black.

## Branding and handoff

The project name is **GOLDEN LAB**. The footer carries the subtle creator mark **Ryanhuhut**, and the browser tab uses a gold φ favicon. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for verification and outstanding browser QA, and [docs/EDITING_ASSETS.md](docs/EDITING_ASSETS.md) for the next motion-graphics phase.

**Git in this workspace:** the environment provides an empty, read-only .git directory, so plain git status fails here. The existing development history is preserved in the local, ignored .goldenlab-history.git directory. To inspect it in this workspace, use:

    GIT_DIR=.goldenlab-history.git GIT_WORK_TREE=. git status

Use the same prefix for git log, tag, and other Git commands. Do not run git init over this history.
