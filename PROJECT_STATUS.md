# Project status — GOLDEN LAB v1.0

## Completed

- Four interactive experiments: Fibonacci Growth, Golden Phyllotaxis, Golden Petals, and Fibonacci Mechanics.
- Homepage Pascal-number → parity-cell → apex-anchored Sierpiński reveal, with cached deep rows and prepare() / seek(time) renderer hooks.
- Responsive overview/workspace, animated card transitions, shared controls, Graphite / True Black modes, φ favicon, and Ryanhuhut footer mark.
- Generated preview.html for direct-file review. No backend or export system.

## Verified automatically

- npm test passes the existing mathematics, motion, theme, and Pascal-renderer checks.
- JavaScript syntax checks, preview regeneration, and git diff --check pass for the release.
- The test suite checks Fibonacci/BigInt ratios, spiral continuity in both directions, phyllotaxis coordinates, Pascal parity/camera behavior, Petals timing, damping, and appearance transitions.

## Manual QA still recommended

- Open in a real browser and inspect the console for runtime errors.
- Resize desktop windows and review mobile layout, stage overlays, controls, favicon, and footer mark.
- Judge animation smoothness and card transitions on typical hardware.
- Review the full Pascal reveal and reverse transition for visual continuity.
- Check Golden Petals marker alignment, 10–20 second timing, Pause/Resume, and glow.
- Exercise Fibonacci Mechanics wheel momentum, large-number readability, and both scroll directions.
