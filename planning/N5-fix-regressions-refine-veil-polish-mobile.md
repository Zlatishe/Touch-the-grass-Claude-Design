# N5 — Fix regressions, refine veil composition & polish mobile

**Status:** planning only — do not implement until approved.
**Branch strategy:** continue on `n3/design-audit`. Tag `N5` on top of `N4` when QA passes. `N4` stays as the reference point just before this pass.
**Context:** N4 shipped but introduced two regressions (camera tracking / grass physics / panel-open blink — all one bug), and the user has taste-level notes on the veil composition, veil copy, and mobile chrome. This plan fixes the regression first, then executes the refinements.

---

## 1. Executive read

### What the user is telling us

1. **We broke something we were told not to touch.** Camera tracking + grass interaction are unreliable (blackout on desktop, flicker on mobile, hand shows in preview but grass doesn't respond). **Fix it first.**
2. **Grass physics feels wrong now.** Bounces back "too much" on release. Likely the same root cause as #1.
3. **The veil lockup is cramped.** The bracketed rule sitting 28px below the CTA reads like a utility signature attached to the button. It should be a colophon — bottom-anchored, with real breathing room.
4. **The veil copy stutters.** "Wander the **field**" + "An interactive **field** · 2026" repeats the same noun across two adjacent pieces of copy. Wants a rethink.
5. **Mobile has too much chrome.** The subline under the title and the status strip at the bottom should both go. Keep only title + mode picker chips + centered Field settings.
6. **Desktop blinks black when opening/closing the panel.** Same root cause as #1.
7. **Mobile close `×` is too small.** Keep the 40×40 square; bump the glyph itself.
8. **Mobile camera thumbnail has doubled corner brackets.** Ugly. Simplify.

### The rubric for N5

- **Regressions first, always.** Don't ship anything else until camera/physics/blink are demonstrably fixed.
- **Breathing room > density.** The veil should feel like a gallery wall, not a poster.
- **Mobile = subtraction.** Every element earns its pixels.
- **Verify with screenshots, not hope.** Every phase ends with a visual QA pass. See §8.

---

## 2. Root cause analysis — the camera/physics/blink bug

All three symptoms are the same bug.

### What broke

In `app.jsx` (N4) I added:

```jsx
<GrassField ... onStats={stats => setBladeCount(stats.bladeCount)} />
```

That inline arrow function creates a **new `onStats` reference on every React render.**

In `grass-field.jsx`, `onStats` is a dependency of `rebuild`:

```jsx
const rebuild = useCallback((w, h) => {
  const blades = buildBlades(w, h, density, bladeLength)
  bladesRef.current = blades
  gridRef.current = buildGrid(blades)
  sizeRef.current = { w, h }
  onStats?.({ bladeCount: blades.length })
}, [density, bladeLength, onStats])   // ← onStats here
```

And `rebuild` is a dependency of the resize effect:

```jsx
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  const onResize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.floor(rect.width * dpr)    // ← clears canvas to transparent
    canvas.height = Math.floor(rect.height * dpr)
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    rebuild(rect.width, rect.height)               // ← regenerates all blades from scratch
  }
  onResize()
  const ro = new ResizeObserver(onResize)
  ro.observe(canvas)
  return () => ro.disconnect()
}, [rebuild])   // ← runs every time rebuild changes
```

So the chain is:
**any React re-render** → new `onStats` ref → `rebuild` identity changes → resize effect re-runs → canvas is cleared + all blades reset.

### What triggers re-renders?

- `setHandConf(hand.confidence ?? 0)` fires **on every camera frame** (~30 Hz in camera mode). Result: 30 canvas wipes per second.
- `setTweaksOpen(true)` / `setTweaksOpen(false)` — one flash on open, one on close.
- `setBladeCount(...)` — the onStats callback itself triggers another re-render.

### Why each symptom maps to this

| Symptom | Mechanism |
|---|---|
| **Desktop blink on open/close** | Canvas cleared → one frame of transparent (body background is `--night` so reads as black) → palette.bg refills next frame. Single flash each transition. |
| **Camera blackout on desktop** | 30 Hz canvas wipes. Render loop is running against a fresh context every frame; some frames catch mid-wipe → black. |
| **Mobile flicker in camera mode** | Same, plus mobile DPR handling amplifies it. |
| **Hand shows in preview, grass doesn't move** | Blade `angle` and `vAngle` are reset to `restAngle` and `0` on every rebuild. The physics integrator never gets to accumulate. Hand push is applied for one frame, erased on next rebuild → net displacement ≈ 0. |
| **"Bounces back too much" on release** | When blades get a rare un-interrupted tick, they integrate a big push against a fully-rested spring, overshoot hard, then reset. The overshoot is what the user sees as "bouncing opposite direction". |

### The fix

Two-line patch in `app.jsx`:

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
// ...
const handleStats = useCallback(s => setBladeCount(s.bladeCount), [])
// ...
<GrassField ... onStats={handleStats} />
```

`useCallback([], [])` returns the same function reference across renders (React guarantees `setBladeCount` is stable). `rebuild` stays stable, the resize effect runs once at mount + on actual resize, canvas keeps rendering normally.

### Decision: fix properly with `useCallback` (not revert)

The user asked me to choose. Two options were on the table:

- **Strict revert:** remove `onStats` entirely → status strip drops GRASS COUNT → back to N3 behavior. Safe but loses an approved feature for no real reason (the feature wasn't the bug; my implementation of it was).
- **`useCallback` patch:** 2-line fix that restores correct behavior and keeps GRASS COUNT on desktop.

**Decision: the `useCallback` patch.** Rationale:

1. The *concept* of `onStats` is fine — the *reference instability* is the bug. Fixing the reference is more correct than removing a feature.
2. 2-line change, zero risk, easy to explain.
3. Keeps the agreed-on desktop status strip intact (mobile hides it anyway — see §5.2).
4. Reverting would be throwing out a sink because a pipe leaked.

Plain-English explanation for the user: **React components re-render whenever state changes. Every re-render, the line `onStats={stats => ...}` creates a brand-new function with a new identity. Downstream, the grass component thinks "oh, `onStats` is new — I'd better rebuild everything." The fix tells React: "this function never changes, reuse it." That's what `useCallback` does.**

### Files

- `src/app.jsx` — add `useCallback` import, wrap `onStats` handler.

### Verification (this phase only)

After the patch, in desktop:
- Open/close Field settings **3 times** — no black flash.
- Switch to Camera mode — hand shows in preview, grass bends away from cursor, springs back smoothly.
- Touch grass — it displaces, then decays over ~0.5s without visible overshoot in the opposite direction.

Mobile:
- Camera mode — no flicker.
- Grass responds to touch with the same soft spring.

**If any of these fail, do not ship the other phases.** The regression fix is the blocker.

---

## 3. Veil lockup — bottom-anchor the rule (Phase 2)

### Observation

Current spacing:

```
TOUCH THE GRASS
   ↓ 56px
[ Wander the field ]
   ↓ 28px
── AN INTERACTIVE FIELD · 2026 ──
```

The 28px gap puts the rule inside the title/CTA lockup's orbit. It reads as a caption *attached to the button* rather than a signature *anchored to the page*. Especially on tall desktop viewports where there's whitespace above the title, this looks off-balance.

### Target

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│                                  │
│         TOUCH THE GRASS          │  ← centered pair
│                                  │
│       [ Wander the field ]       │
│                                  │
│                                  │
│                                  │
│                                  │
│   ── AN INTERACTIVE FIELD ──     │  ← bottom-anchored colophon
│                                  │
└──────────────────────────────────┘
```

The rule is a colophon: it belongs at the bottom of the frame, like credits on a poster. Title + CTA form a centered hero lockup.

### Mechanic

```css
.veil {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(28px, 6vw, 96px);
  /* existing */
  position: relative;   /* already absolute in positioning — `.veil` is already `position: absolute` */
}

.cta-btn {
  /* REMOVE margin-bottom: 28px  — decoupled from rule now */
  margin-bottom: 0;
}

.veil-rule {
  position: absolute;
  bottom: clamp(36px, 6vh, 64px);
  left: 50%;
  transform: translateX(-50%);
  /* existing width: min(520px, 90vw); etc. kept */
}
```

On mobile, `bottom: clamp(24px, 5vh, 40px)` so the rule respects safe-area + looks right on short iPhone screens.

### Files

- `src/styles.css` — adjust `.cta-btn` margin, `.veil-rule` positioning, mobile bottom offset.
- `src/app.jsx` — **no change** (DOM order stays the same; CSS handles the layout shift).

### Verification

At 1440×900, 1280×720, and iPhone 12 Pro (390×844):
- Title and CTA read as a single centered pair.
- Rule sits at the bottom with clear whitespace above it.
- Bottom padding respects safe-area insets on iOS.

---

## 4. Content design — rethink veil copy (Phase 3)

### Current

| Element | Copy | Note |
|---|---|---|
| Title | *Touch the grass* | — |
| CTA | *Wander the field* | "field" appears |
| Rule | *An interactive field · 2026* | "field" appears again |

The two-word title + two noun phrases stack three near-synonyms: *grass*, *field*, *field*. The rule + CTA specifically share the noun verbatim. Reads repetitive.

### Decision: CTA becomes `Begin`

User picked `Begin`. Final copy:

| Element | Copy |
|---|---|
| Title | *Touch the grass* |
| CTA | *Begin* |
| Rule | *An interactive field · 2026* |

Three lines, zero repetition. "Begin" is a clean single-word imperative — doesn't fight the title for attention, doesn't echo any other word, and reads as a clear invitation. The existing bracketed CTA styling carries all the flavor the phrase needs; the word itself can be quiet.

Note: with a much shorter word, the CTA's internal padding may need a small retune so the button doesn't look empty. Current `padding: 18px 52px` was tuned for "Wander the field" (~15 chars). For "Begin" (5 chars), I'll consider either:
- Keep `padding: 18px 52px` — button ends up ~170px wide, looks deliberately generous, frames the word.
- Bump to `padding: 18px 64px` — slightly wider, even more gallery-poster feel.
- Shrink to `padding: 16px 40px` — tighter button, less presence.

Default: **keep `18px 52px`.** The extra whitespace around a single word feels intentional at this scale. Verify in QA; adjust if it looks off.

### Files

- `src/app.jsx` — update CTA and/or rule label text.

### Verification

- Read all three lines top-to-bottom aloud. No stutter.
- Screenshot and check the visual balance still works with the new copy length.

---

## 5. Mobile polish (Phase 4)

Four independent subtractions. All CSS-only except the close glyph.

### 5.1 Drop the subline under the title

```css
@media (max-width: 640px) {
  .wordmark-rule { display: none; }
  .wordmark .sub { display: none; }
}
```

Mobile top zone becomes: **title → mode picker chips.** Nothing else.

### 5.2 Drop the bottom status strip, center the Field settings chip

```css
@media (max-width: 640px) {
  .status-strip { display: none; }
  
  .tweaks-toggle {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    bottom: max(20px, calc(env(safe-area-inset-bottom, 0px) + 16px));
  }
  
  /* Pedestal can shrink — less content to carry */
  .chrome-pedestal-bottom { height: 100px; }
}
```

Note: `max-width` on `.status-strip` mobile rule was preserving room for the chip — no longer needed since strip is hidden, chip is centered.

### 5.3 Single-bracket mobile camera thumbnail

Current: the thumbnail has both `.pc` (panel corner brackets) and `.vc` (video corner ticks). On desktop with 14px panel padding, the brackets are 14px apart and read as "framed panel containing framed video" — intentional. On mobile with 0 panel padding, they sit on top of each other and read as a cluttered doubled corner.

**Fix:** hide `.pc` on mobile. Keep `.vc` — the video gets clean tick-marks and the panel is a simple rectangle.

```css
@media (max-width: 640px) {
  .cam-panel .pc { display: none; }
}
```

### 5.4 Bigger `×` glyph in the close chip

Keep the 40×40 tap target; bump only the glyph:

```css
@media (max-width: 640px) {
  .tweaks-close { font-size: 28px; }
}
```

Mobile-only (decided). Desktop stays at the current 20px glyph — user confirmed desktop reads fine.

### Files

- `src/styles.css` — all four changes in the mobile `@media (max-width: 640px)` block.

### Verification

At 390×844 iPhone 12 Pro preview:
- Wordmark shows title only, no rule, no subline.
- Bottom: no status strip. Field settings chip is centered.
- Switch to Camera → thumbnail has a single set of corner ticks.
- Open Field settings sheet → tap the × → closes. × looks chunky and legible.

---

## 6. Phase order & risk

| # | Phase | Blocker? | Risk | Effort |
|---|---|---|---|---|
| 1 | Regression fix: `useCallback(onStats)` | **YES** | low (2-line patch, easy to isolate) | 5 min |
| 2 | Veil rule → bottom anchor | no | low | 10 min |
| 3 | Veil copy: Option A (or user-chosen) | no | trivial | 2 min |
| 4 | Mobile polish (hide subline, center chip, single brackets, bigger ×) | no | low | 15 min |
| 5 | Visual QA pass | — | — | 15–30 min |

One commit per phase on `n3/design-audit`. If phase 1 doesn't land cleanly, **stop and diagnose** — do not stack phases on top of a broken canvas.

Tag `N5` when QA completes.

---

## 7. Decisions locked

All open questions resolved:

| # | Decision | Rationale |
|---|---|---|
| 1 | **`useCallback` patch**, not revert | Fixes root cause (React reference instability), keeps GRASS COUNT feature. |
| 2 | **CTA: `Begin`** | User-chosen. Short, clean, zero repetition with rule. |
| 3 | **Close `×`: mobile only, 28px** | Desktop reads fine at 20px. |
| 4 | **Mobile layout as specced in §5** | Subline gone, status strip gone, settings centered, single-bracket camera thumbnail. |

Ready to implement once approved.

---

## 8. QA — visual verification after every phase

**This is mandatory. The plan is not done until this passes.**

### Tooling — pick the cheapest option available

Claude Code has its own built-in preview capability in the desktop app. **Before reaching for an MCP, check whether a native preview is available in the current session** — the built-in tool is almost always lower-token and better-integrated than a separate MCP.

Priority order when I run QA:

1. **Native Claude Code preview** (if available in this session) — use it.
2. **Claude Preview MCP** (`mcp__Claude_Preview__preview_*`) — works, reuses the existing dev server in `.claude/launch.json`. Good for screenshots + computed-style inspection via `preview_inspect`.
3. **Claude-in-Chrome MCP** — heavier, but necessary if I need real media-query evaluation at a specific viewport. Earlier testing showed `preview_resize` in the Preview MCP affects screenshot crop but not `window.innerWidth`, so media queries don't actually evaluate at mobile sizes inside the Preview MCP — for true mobile verification I open Chrome at a resized window.

I don't need to commit to one tool up front; I'll pick whatever's cheapest and adequate for each check. The only hard rule: **verify before declaring done.**

Regardless of tool, the operations I need are:
- Take screenshots at desktop viewport + mobile viewport.
- Inspect computed styles of specific selectors (font-size, visibility, position, etc.).
- Read the JS console for errors/warnings.
- Click/tap elements to exercise state transitions (open panel, switch mode, etc.).

### After Phase 1 (regression fix)

- [ ] `preview_screenshot` at desktop: enter the field, verify grass renders.
- [ ] Click mode picker → Camera. Wait for tracking to start. `preview_screenshot`. Confirm grass is visible (not black) during camera mode.
- [ ] Open Field settings panel. `preview_screenshot`. No black flash visible (hard to verify from a still; complement with `preview_console_logs` for any errors).
- [ ] Move a slider. `preview_screenshot`. Canvas stays rendered throughout.
- [ ] Close panel. `preview_screenshot`. Panel gone, grass intact.

### After Phase 2 (veil rule anchor)

- [ ] `preview_screenshot` of veil: rule is clearly at the bottom, CTA has real whitespace below it.
- [ ] At tall viewport (1440×900) and short (1280×700) — rule stays anchored, title+CTA stay centered.

### After Phase 3 (copy)

- [ ] `preview_screenshot` — read the three lines. Confirm no repetition.
- [ ] Verify the new CTA text still fits inside the bracketed button without wrap.

### After Phase 4 (mobile)

- [ ] `preview_resize` to 390×844. `preview_screenshot`.
- [ ] Top zone shows title + mode picker chips only (no subline).
- [ ] Bottom has centered Field settings chip, no status strip.
- [ ] Switch to Camera mode. Thumbnail top-right with **one** set of corner ticks, not two.
- [ ] Tap Field settings. Sheet slides up. `×` glyph is large and legible.
- [ ] Tap `×` or the scrim. Sheet closes. Regression test: tap multiple areas at the bottom of the screen — palette does NOT change (N4 click-through fix holds).

### Interaction smoke test

- [ ] Tap/hover grass — smooth spring, no overshoot, no reset glitches.
- [ ] Change palette — tile inverts, canvas swaps smoothly (no blackout).
- [ ] Move every slider full range — no glitches.

### Console

- [ ] `preview_console_logs` — zero errors, zero warnings.

### If anything looks off

**Do not declare done.** Iterate:

1. Form a hypothesis about the specific root cause (DOM? computed style? timing? layout?).
2. Use `preview_inspect` with specific CSS properties to confirm/rule out.
3. Use `preview_console_logs` for JS-level errors.
4. Fix the specific root cause, not the visible symptom.
5. Re-verify the affected check from the top.
6. Re-run adjacent checks that could be disturbed by the fix.

Loop until all boxes are ticked.

Only then: tag `N5`, write a summary of what changed, done.
