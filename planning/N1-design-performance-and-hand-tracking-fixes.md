# N1 — Design polish, cursor responsiveness, mobile parity & hand-tracking build-out

**Status:** Plan (not yet implemented)
**Baseline commit:** initial `touch-the-grass.html` single-file build
**Scope:** UI chrome finish (v3 spec), desktop cursor lag, mobile/desktop visual parity, hand-tracking depth
**Owner:** Z + Claude

---

## 0 · TL;DR of what we're fixing

1. **Cursor feels laggy / jerky on desktop** — not just physics smoothing; also runtime Babel + dev-mode React + variable-rate physics. Explained in §2.
2. **Mobile grass doesn't match desktop** — we silently halve density + tweak segment count on mobile. Removing that makes them visually consistent.
3. **Bottom-row UI ("Move · drag · swipe" hint + Tweaks button) is low-contrast and confusing on small screens.** Simplify.
4. **The v3 visual spec is only ~60% applied.** Specifically missing: correct H1 size, 32px wordmark, correct mode-picker sizing, ruled line under picker, 16px tweaks labels, square corners on panels, ruled line under "Tweaks" heading. Full diff in §5.
5. **Hand tracking is the bare minimum.** One centroid, no smoothing, no gesture, jitter leaks straight into the grass. Built out in §6.
6. **Single-HTML, Babel-at-runtime architecture is fighting us.** Moving to a real src/ layout with a build step removes one class of mystery perf issues. §3.

---

## 1 · Version control

**Done.** Repo initialized at the project root with an initial baseline commit. Every subsequent phase below should land on its **own commit** (or branch) so we can bisect / revert cleanly:

- `git checkout -b N1/phase-2-arch` — one branch per phase when the change is >1 file
- Small phases (§4 copy tweaks, §5 style tweaks) can land directly on `main` as single commits
- Tag `v0-baseline` on current HEAD so we always have a pristine revert point: `git tag v0-baseline`

---

## 2 · Why the desktop cursor feels jerky — diagnosis

> _"it feels like it almost reacting with a bit of a delay maybe. look into what may be a reason, maybe it's because we only have one html file and we need to do somthing else."_

The user's hunch is **partially right**. Single HTML file isn't directly causing per-frame jank, but the way we ship it does. There are ~4 real causes, ranked by impact:

### 2.1 Physics runs at variable speed (biggest per-frame cause)
In `GrassField`'s render loop, each blade does:
```js
b.vAngle = (b.vAngle + ((tgt - b.angle) * b.stiffness) / b.mass) * b.damping;
b.angle += b.vAngle;
```
There is **no delta-time**. The spring constants assume a fixed 60Hz tick. On a 120Hz display they run 2× fast; on a frame that stalls 32ms they step **once** instead of twice, so the blades visibly fall behind the cursor for a beat, then catch up. This reads as "delay then snap" — exactly the jerkiness described.

**Fix:** multiply the step by `dt/16.67`, clamped to [0.5, 3]. Physics then stays frame-rate-independent.

### 2.2 Spring stiffness is low on purpose (design lag)
`stiffness: 0.014 – 0.034`, `damping: 0.90 – 0.95`. These are deliberately soft so the field sways gracefully, but combined with §2.1 the base lag is ~8 frames (~130ms) — the threshold where human perception flips from "responsive" to "delayed."

**Fix:** keep the dreamy look, but stiffen the subset of blades **nearest the cursor** (e.g. `stiffness *= 1.8` when within `influenceR * 0.6`). Everything further out keeps its soft sway.

### 2.3 Runtime Babel + dev-build React (biggest startup cause)
We load:
- `react.development.js` (3-5× slower than `react.production.min.js`)
- `react-dom.development.js` (same)
- `@babel/standalone` (~3MB, transpiles JSX at runtime before first paint)

During the first ~600ms Babel is blocking the main thread. Any pointer event in that window is swallowed. It also schedules micro-tasks that occasionally land mid-frame for the first few seconds — visible as the "takes a beat to settle" feeling right after load.

**Fix:** swap to production React + precompile the JSX at build time (Vite, esbuild, or even a single `npx esbuild` step). This is why moving off the single-file HTML actually matters.

### 2.4 Canvas 2D draws ~7,000 quadratic-bezier paths per frame
On a 1920×1080 screen at density 3.4 the field has roughly 7k blades × 5 segments × ~20 path commands per blade = ~700k draw calls/sec. That's at the edge of what Canvas 2D can do reliably on mid-tier hardware.

**Fix options (ordered cheapest→biggest):**
- Cull blades outside viewport (noop today — none are — but will matter after scrolling/parallax)
- **Spatial hash** for hand influence: instead of `for each blade { distance to hand }`, bucket blades into a 128px grid and only test the 9 cells around the cursor. Cuts the hot inner loop from O(N) to O(√N) — on 7k blades that's ~7000 → ~400 per frame.
- Later: port the renderer to **WebGL / instanced quads**. ~30× headroom. Out of scope for N1, noted for N2.

### 2.5 Not a real cause, despite the hunch
- **One HTML file** vs many: doesn't affect per-frame JS at all once the script is parsed. It _does_ make debugging harder and lets Babel-at-runtime sneak in (see §2.3).
- **`mousemove` vs `pointermove`**: both coalesce to ~display-refresh-rate in modern browsers. Not a real factor.
- **`left/top` vs `transform` on `.cursor-ring`**: measurable on low-end devices, not the cause of what we're seeing.

---

## 3 · Phase A — Architecture: break the single HTML into a real project

**Goal:** get us off runtime Babel + dev React, so §2.3 stops contributing to the problem.

Tree after this phase:
```
Touch the Grass/
├── index.html                  # thin shell, one <script type="module"> tag
├── src/
│   ├── main.jsx                # createRoot + <App/>
│   ├── app.jsx
│   ├── grass-field.jsx
│   ├── hand-tracker.js
│   ├── tweaks.jsx
│   └── styles.css              # lifted out of <style>
├── package.json                # vite + react
├── vite.config.js
├── planning/
└── touch-the-grass.html        # keep as a reference / legacy single-file build
```

Steps:
1. `npm create vite@latest . -- --template react` (scaffold into a sibling dir, then merge — don't overwrite our HTML yet)
2. Copy the three script blocks from `touch-the-grass.html` into `src/*.jsx` files. Drop the `window.*` exports (just `export default`).
3. Move `<style>` block to `src/styles.css`, import from `main.jsx`.
4. `npm run build` → `dist/` with production React + prebuilt JS. Verify load time drops from ~600ms JS-parse window to <80ms.
5. Keep `touch-the-grass.html` checked in as-is so the single-file build stays as a fallback / shareable demo.

**Acceptance:** paint-to-interactive <100ms on MacBook-class hardware, React Profiler shows no dev-build overhead, Babel/standalone is no longer loaded.

---

## 4 · Phase B — Mobile/desktop visual parity

### 4.1 Grass density
Current:
```js
density: isTouchPrimary() ? 2.0 : 3.4    // default
eff = density * (isMobile ? 0.55 : 1.0)  // runtime multiplier
```
Result: effective density on mobile is **2.0 × 0.55 = 1.1** vs desktop **3.4**. That's a 68% reduction — which is why mobile "looks weird and doesn't match." It's showing half the field.

**Fix:**
- Drop both mobile branches. One default for everyone: `density: 3.4`.
- If perf actually suffers on mobile (test on iPhone 12/SE-class), don't halve density — instead drop blade **segment count** (5 → 4) and cap `devicePixelRatio` at 1.5. Those are invisible; density isn't.
- Ship it with the same look on both.

### 4.2 Bottom row ("Move · drag · swipe" + Tweaks)
The oklch(0.40) hint text is below threshold contrast for WCAG on our dark bg — user reports it's invisible. The Tweaks button overlaps the iOS home indicator on some phones.

**Fix:**
- **Remove the status hint line entirely.** The mode picker already tells users what mode they're in; an extra English sentence is redundant.
- Keep the **Tweaks** button, but move it to the **bottom-right** only (mirror of wordmark in top-left), bumped above `env(safe-area-inset-bottom)`.
- When Tweaks is open, swap the button label to a tidy **×** close icon (still a button, still labeled in `aria-label`).

### 4.3 Decorative elements that disappear on mobile
- **Vertical center line** (`.veil-vert`) — already hidden below 640px, keep.
- **Corner brackets on veil** (`.veil-corner`) — invisible at 22px on a 375px screen. Drop to 16px at `<=640px` and bump stroke to 1.5px.
- **Brulia crosshair tick line** (the vertical `::after` on `.brulia-mark`) — on short screens it runs into the title. Clip / shorten when `max-height: 700px`.

---

## 5 · Phase C — Complete the v3 visual spec

Diff table against the spec the user pasted. `→` = change to make.

| Spec line                                               | Current                              | Change                                  |
|---------------------------------------------------------|--------------------------------------|-----------------------------------------|
| H1 `clamp(72px, 10vw, 140px)`                           | `clamp(64px, 10vw, 134px)`           | → match spec exactly                    |
| Wordmark `Space Grotesk 700, 32px`                      | 26px                                 | → **32px**                              |
| Subline 16px Space Mono, oklch(0.65)                    | ✅                                   | keep                                    |
| Mode picker `padding 14px 24px`                         | `11px 20px`                          | → **14px 24px**                         |
| Mode picker `Space Mono 16px`                           | 14px                                 | → **16px**                              |
| Mode picker inactive `oklch(0.85…)`                     | `oklch(0.80)`                        | → **0.85**                              |
| **Every** tab has a visible 1px border                  | border only on `:hover`              | → add static 1px border to every tab    |
| Thin ruled line under the entire picker                 | ❌ missing                           | → add 1px rule below picker             |
| Tweaks: all labels 16px                                 | 11px                                 | → **16px** on labels + hint             |
| Tweaks: thin rule under "Tweaks" heading                | ❌ missing                           | → 1px rule, matches wordmark-rule style |
| Tweaks: square corners, 1px border                      | 6px radius                           | → **4px** (square-ish), keep 1px border |
| Camera panel: all text 16px                             | 11px                                 | → **16px**                              |
| Camera panel: square corners                            | 10px radius                          | → **4px**                               |
| Camera panel: small dot accent next to status           | ✅ (`.dot-indicator`)                | keep                                    |
| Cursor ring: unchanged                                  | ✅                                   | keep                                    |
| CTA: 1px ruled border, no fill, 16px Space Mono, 18×48  | ✅                                   | keep                                    |
| CTA: corner L-brackets                                  | ✅                                   | keep                                    |

Two things to double-check while we're in there:
- **Accent elements — thin rules, dots, circles, corner brackets — through _all_ interface elements.** We did the veil. We did **not** yet put: a small circle-with-dot marker next to the Tweaks heading, corner-bracket marks on the mode picker's active tab, or a thin rule under the `cam-panel` title. These are small but make the system feel cohesive. Add where they don't overcrowd.
- **16px floor on all UI copy.** The current file has ~7 places at 11-14px (tweaks labels, cam-status, status-text, veil-corner). Audit and lift.

---

## 6 · Phase D — Hand-motion tracking build-out

Current state: `MediaPipe Tasks Vision → HandLandmarker`, palm-centroid of landmarks {0,5,9,13,17}, x-mirrored, normalized [0..1]. That's the **minimum viable**. Every raw-MediaPipe sample has ~2-4px jitter in landmark space which becomes ~15-30px on a 1080p canvas — which the grass faithfully renders as twitching. It also doesn't distinguish an open palm from a fist, so the user has no way to "lift off."

### 6.1 Strategy — keep MediaPipe, add four layers
We don't rip out the model. We build four things on top of the raw landmarks:

**L1 — One-Euro filter on the output point.** A low-pass that de-jitters a slow cursor but preserves fast swipes. ~20 lines. Vastly better feel at no GPU cost.
_Reference:_ Casiez 2012 — parameters that work well for hand tracking: `minCutoff=1.0, beta=0.007, dcutoff=1.0`.

**L2 — Use the index fingertip (landmark 8), not the palm centroid.** Palm centroid feels sluggish because you move your hand to point, not your whole palm. Fingertip is more intuitive and matches what people expect from "point at the grass."

**L3 — Gesture state machine — open vs closed hand.**
- Closed = thumb (4) near index-MCP (5) → `active:false` → hand lifts off, grass recovers.
- Open = thumb far from index-MCP → `active:true` → grass reacts.
- Debounce state transitions with a 3-frame low-pass so it doesn't flicker on borderline poses.

**L4 — Visible calibration + skeleton overlay in the cam panel.**
- Draw the 21 landmarks as small circles over the video feed when tracking is on.
- On first detection, pulse the dot green for 0.5s to confirm "got you."
- If no hand is detected for >3s, show a subtle "Show your hand to the camera" hint inside the panel.

### 6.2 Mobile specifics
- iOS Safari requires `navigator.mediaDevices.getUserMedia` to be called from a user gesture. Our "Camera" tab click qualifies, but we need to make sure the call chain stays synchronous from the click — **no `await` before `getUserMedia`**. Current code is fine here, verify after the build-system move.
- iOS Safari blocks autoplaying video without `playsinline` and `muted`. Both set — good.
- Use `facingMode: "user"`. Already set.
- WASM SIMD isn't enabled by default on all mobile browsers → GPU delegate may silently fall back to CPU. Already handled with the `GPU → CPU` fallback in the try/catch. Keep.
- Throttle the model to **30fps** on mobile (skip every other `detectForVideo` call). Noticeably cooler phone, no visible difference for grass sway.

### 6.3 Error & permission UX (currently a single red toast — build this out)
States to cover:
- `permission-prompt` — browser is asking; show a neutral "Allow camera access" hint card.
- `permission-denied` — show "Camera blocked. Enable in browser settings." with a short link to browser-specific instructions (Safari vs Chrome).
- `no-camera` — hardware-missing case. "No camera detected."
- `model-loading` — already covered.
- `tracking-ok` — already covered.
- `hand-not-detected (>3s)` — new; soft hint inside cam panel.
- `tracking-lost (>5s)` — fall gently back to cursor mode with a toast.

### 6.4 What we explicitly **don't** do in N1
- Two-hand tracking (MediaPipe supports it, but UX design is a bigger question — N2)
- Depth / Z-axis. Mediapipe emits world-coords z, but the grass is 2D.
- Pinch-to-zoom on palette swatches. Cute, not in scope.

---

## 7 · Phase ordering, branches, acceptance

| Phase | Branch                          | Blocks on | Acceptance                                                    |
|-------|----------------------------------|-----------|---------------------------------------------------------------|
| A     | `N1/phase-a-vite`               | —         | `npm run build` works; first-paint JS <80ms; single `dist/`   |
| B     | `N1/phase-b-mobile-parity`      | A         | Same blade count / sq-px on iPhone 12 and MacBook             |
| C     | `N1/phase-c-v3-spec`            | A         | Every row in §5 checked off visually                          |
| D.1   | `N1/phase-d-one-euro`           | A         | No visible jitter on a still-held hand                        |
| D.2   | `N1/phase-d-fingertip-gesture`  | D.1       | Closed fist = no grass reaction. Open hand = reacts.          |
| D.3   | `N1/phase-d-calibration-ui`     | D.2       | Skeleton visible in cam panel; hint-copy states all exercised |

Merge to `main` after each phase. Tag releases `N1.a`, `N1.b`, etc. as we go.

---

## 8 · Test matrix (before calling N1 done)

| Device / browser          | Desktop check                                | Mobile check                                  |
|---------------------------|----------------------------------------------|-----------------------------------------------|
| MacBook 16" Chrome        | 60fps sustained, cursor-to-grass <2 frames   | —                                             |
| MacBook 16" Safari        | 60fps sustained, camera permission flow      | —                                             |
| iPhone 12 Safari          | —                                            | 60fps, density matches, hand tracking works   |
| iPhone SE (2nd gen) Chrome| —                                            | 45fps acceptable, density matches             |
| Pixel 7 Chrome            | —                                            | 60fps, GPU delegate active                    |
| iPad Air Safari (landscape)| —                                           | 60fps, camera panel correctly placed          |

Log results in `planning/N1-test-results.md`.

---

## 9 · Open questions (flag before implementation)

Are we OK with adding a build step (Vite / Node in the repo)? - Yes

Should the "Keys" mode stay visible on mobile? It does nothing there. Plan: hide bel 640px unless a physical keyboard is detected.

3. For hand-tracking, is one-euro smoothing a good enough call, or do we want to swap to ‹alman? one-euro is good.

---

## 10 · What the user will see after N1

- Cursor feels **1:1** with the grass on desktop — no perceived lag.
- Mobile grass looks like a smaller slice of the same field, not a sparser field.
- The veil and field chrome are visibly the same "Brulia-grid" family — circles, corner brackets, thin rules show up consistently.
- Camera mode shows a live hand skeleton in the preview, reacts only when your palm is open, holds still when your hand does.
- Every revert is a `git checkout <phase-commit>` away.
