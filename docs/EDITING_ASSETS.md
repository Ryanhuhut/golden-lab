# Editing assets — next-phase plan

GOLDEN LAB is currently an interactive site. The next phase can use it as a procedural motion-graphics source for a presentation or video edit. **The capture/export features below are proposals, not implemented features.**

## Candidate shots

| Shot | Visual progression |
| --- | --- |
| Pascal → Sierpiński | Numbers, diagonals, parity cells, then the continuous apex-anchored reveal. |
| Fibonacci Growth | Squares and gold spiral build while the camera follows the structure. |
| Fibonacci Mechanics | The number wheel advances; recurrence and consecutive-term ratio approach φ. |
| Golden Phyllotaxis | Points appear from the center, building a sunflower-like pattern. |
| Golden Petals | The calm 120.0° → 137.5° demonstration and Golden Angle highlight. |

## Recommended Cinematic Mode

Design a separate, deterministic presentation path that hides all controls and navigation, uses a fixed output size such as **1920×1080**, starts from a known state, replays from time/frame zero, and exposes a fixed-duration timeline with exact seek(time) or seek(frame) control. Keep the interactive site intact. The Pascal renderer already exposes prepare() and seek(time); the other experiments currently advance from frame delta and would need equivalent deterministic timeline adapters. Choose shot framing and durations before implementing export.

For repeatable frames, freeze any time-dependent decorative effects to the timeline, avoid unseeded randomness, and keep Canvas DPR/output dimensions explicit. Add safe margins for titles or editor overlays as a later production decision.

## Possible capture routes

1. **OBS or browser capture:** fastest way to test shot pacing and use the existing visuals.
2. **PNG sequence:** useful for frame-accurate compositing and alpha when appropriate. Current stage canvases clear to an opaque themed background; transparency would need an intentional rendering path.
3. **WebM or another browser-friendly capture:** consider once timing and framing are stable. Check codec, alpha, and browser support before committing to this route.

First run the real-browser QA in PROJECT_STATUS.md. Then prototype Cinematic Mode with the Pascal shot, because its deterministic seek(time) hook already exists. Do not treat this document as evidence that export is implemented.
