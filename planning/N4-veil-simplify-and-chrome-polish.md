# N4 — Veil simplification, chrome polish & design-language unification

**Status:** planning only — do not implement until approved.
**Branch strategy:** continue on `n3/design-audit`. These fixes are refinements to the N3 brutalist direction, not a separate direction. When approved and shipped, tag `N4` on top of `N3`. If the user wants a clean rollback point, `main` (tagged `N2`) is always the fallback. A separate `n4/*` branch is not needed — it would just add indirection for linear work.
**Context:** The user gave ten concrete observations on the live N3 build. This plan addresses each one and zooms out to solve the underlying issue: the field chrome currently speaks in two design languages (Role A ghost-frame+brackets on the Controls toggle, Role C inline tabs on the mode picker), and the brutalist "specimen density" voice has pushed legibility below an acceptable floor.

---

## 1. Executive read

### What the user is telling us

1. **The veil is overstructured.** The corner brackets, the right-side inputs column, the top/bottom spec tags (`01 ─`, `[TTG-01]`, `N3`) are visual noise — *not* signal. Asymmetry was tried; it didn't earn its complexity. Return to a calm, centered composition.
2. **The field chrome is under-legible.** 11px mono on `--ink-mute` at the bottom of a busy canvas disappears. Brutalist specimen voice only works when you can read the specimens.
3. **Two visual languages are fighting.** The Controls toggle (ghost-frame + corner brackets) looks like a primary CTA. The mode picker (bare tabs with `[ word ]` active) looks like inline text. Side by side, they look like they come from two different apps.
4. **"Controls" is the wrong label.** The top-right tabs `Touch · Camera · Keys` are *also* controls — they control *input*. Calling the bottom-right button "Controls" collides with the user's mental model. It needs a name that says *environment / scene / field settings*, not *input settings*.
5. **The Controls panel is busier than it needs to be.** A rule under an already-bold heading, a tiny `[ × ]` button — this is decoration, not structure.
6. **Mobile is a layout fix away from coherent.** Elements are dropped in without spatial thinking. The camera thumbnail eats half the field.
7. **There is a real bug on mobile.** Palette tiles remain clickable through an invisible panel — click-through is happening, silently changing palette whenever the user taps near the bottom. This is a functional regression, not a design issue.

### The rubric for N4

- **Legibility first.** Nothing below 16px on desktop, nothing below 14px on mobile. Specimen-voice survives through *uppercase + tracking*, not through *shrinking*.
- **One chrome language.** The mode picker and the settings button are the same button family. The ghost-frame+brackets (Role A) retires to a single place: the veil CTA. That moment is the *only* hero button in the product. Everything else in the running experience is quieter.
- **Readability over density.** The bottom strip gets a dark gradient pedestal so specimens don't vanish into grass. This violates "no gradients on chrome" — but we've been violating it anyway with `text-shadow: 0 1px 8px ...` on every label. Make the pedestal intentional instead of hacked.
- **Kill click-through.** Closed panels cannot receive pointer events at any level of the tree.

---

## 2. Veil simplification (Phase 1)

### Target composition (desktop and mobile)

```
               ┌──────────────────────────┐
               │                          │
               │                          │
               │      TOUCH THE GRASS     │  ← big display title, centered
               │                          │
               │                          │
               │    [ Wander the field ]  │  ← CTA, centered (Role A: ghost-frame + brackets — the ONLY hero button)
               │                          │
               │   ├── AN INTERACTIVE     │  ← bracketed rule with embedded label, centered
               │       FIELD · 2026 ──┤   │
               │                          │
               └──────────────────────────┘
```

Note the CTA sits **above** the rule, not below. The rule is the signature that authors the piece ("made in 2026"), not a divider between heading and action. That reading matches how people write credits on posters: the work on top, the colophon at the bottom.

### Removals

- **`.veil-corner` × 4** — gone. The black void is the frame.
- **`.veil-seq` (`01 ─`)** — gone.
- **`.veil-artifact` (`[TTG-01]`)** — gone.
- **`.veil-inputs` block** — gone.
- **`.veil-build` (`N3`)** — gone.

### Keeps & rework

- **Title `TOUCH THE GRASS`** — centered, single line on desktop (clamp down from the 180px stack-of-three to a single-line 96–120px so it fits comfortably at 1280px wide). On mobile, allow wrap but keep center-aligned.
- **CTA `Wander the field`** — unchanged visually (Role A: ghost-frame + four corner brackets). This stays special — it is the *only* place in the product that uses this treatment.
- **Bracketed rule** — restyled to carry the subline inside it. Width ~360px desktop, ~260px mobile. Ticks at both ends. Label "An interactive field · 2026" in mono uppercase, 11–12px is acceptable *only on the veil*, where it's not competing with running content. (On the field chrome we hold the 16px floor; on the veil, the label is a colophon and can be quieter.)

### Layout mechanic

Revert `.veil` from CSS-grid to flex-center. Vertical rhythm is: title → 56px → CTA → 28px → rule (all items centered). On mobile: title → 40px → CTA → 22px → rule. No absolute positioning, no corner elements, no side columns.

### Files

- `src/app.jsx` — strip veil children to: `<h1>`, `<button className="cta-btn">`, `<div className="veil-rule">` with label.
- `src/styles.css` — revert `.veil` to flex column center; delete `.veil-corner`, `.veil-seq`, `.veil-artifact`, `.veil-inputs`, `.veil-build`, `.veil-input-list` rules; retune `.veil-rule` with internal label.

### Verification

Desktop and mobile both: single centered column, three elements, no corners, no side columns, no tags. At any viewport, eye lands on title → CTA → rule, top to bottom, centered.

---

## 3. Chrome design-language unification (Phase 2)

This is the structural decision that unlocks the rest. We need *one* language for the field chrome. Four coherent options were considered; we recommend Option A for brand continuity.

### Option A (recommended) — "Outlined pill" family

Both the mode picker and the Field settings trigger become **1px-outlined rectangles with 0 radius**, same size, same font, same border colour, same hover treatment. Active state = inverted fill (ink background, night text).

```
Desktop top-right:       ┌─ Touch ─┐ ┌ Camera ┐ ┌  Keys  ┐
                         └─────────┘ └────────┘ └────────┘
                                   (filled = active)

Desktop bottom-right:                              ┌ Field settings ┐
                                                   └────────────────┘
```

- Border: `1px solid var(--ink-mute)`, hover `var(--ink)`, active *inverted* (`background: var(--ink); color: var(--night); border-color: var(--ink)`).
- Padding: `10px 14px`.
- Font: `--t-md` (14px) on mobile, `--t-lg` (16px) on desktop — *meets the legibility floor*.
- No brackets on hover or active. No ghost-frame corner ticks. The brackets are a veil-CTA-only device now.

**Why this works:** both the input selector and the settings trigger *do the same kind of thing* (change the state of the experience), so they should look the same. The user's mental model — "here are my controls" — matches the visual grouping. Both sit at 10px padding on the same baseline height.

### Option B (alternative) — "Bare inline tabs + bare text trigger"

Strip the ghost-frame off the Field settings button entirely. Match the mode picker's bare-text language everywhere in chrome.

```
Desktop top-right:   [ Touch ]  ·  Camera  ·  Keys
Desktop bottom-right:                           Field settings  ↗
```

Settings becomes a plain text button, maybe with a `↗` or `→` glyph.

**Why this could work:** maximally quiet chrome, grass is hero.
**Why we're not recommending it:** the settings trigger loses tap-target affordance on mobile. Brackets or a box help touch users *see* that it's interactive.

### Decision required

We default to **Option A (outlined pill)** unless the user prefers Option B. The rest of this document assumes Option A.

### Rename decision

- "Controls" → recommended **`Field settings`** (user's suggestion — clear, unambiguous, differentiates from input-mode selector).
- Alternatives considered: `Scene`, `Adjust`, `Tune`, `Environment`, `Customize`, `Field`.
- `Scene` is the most on-theme (this is a scene of grass) but requires explanation. `Adjust` is the shortest. `Field settings` is the clearest.
- Ship `Field settings`. In the panel itself, the heading also becomes **`FIELD SETTINGS`** (mono uppercase spec voice) replacing `CONTROLS`.

### Files

- `src/app.jsx` — rename toggle label & aria-label; remove the ghost-frame corner spans.
- `src/styles.css` — unify `.tweaks-toggle` and `.input-picker button` into a shared `.chip` (or reuse both with shared rules); remove `.tweaks-toggle .cc` brackets; both get `.chip.active` inverted fill treatment; retire Option A's bracketed `[ Touch ]` pseudo-elements.

---

## 4. Field chrome readability (Phase 3)

### 4.1 Bottom pedestal for legibility

Problem: status strip and Field settings button sit on a busy grass silhouette and disappear.

**Fix:** add a 120px-tall gradient shade at the bottom of the viewport behind the chrome. `linear-gradient(to top, oklch(0.04 0.01 148 / 0.88) 0%, oklch(0.04 0.01 148 / 0.55) 55%, transparent 100%)`. Sits above the canvas, below chrome. Gives us a legibility floor without adding a visible band.

Same approach for the top (wordmark / mode picker) — a 100px top gradient at `oklch(0.04 0.01 148 / 0.75) → transparent`. Shallower than the bottom because the wordmark is already at 32px and reads fine; the mode picker at 16px needs a little help.

No more `text-shadow: 0 1px 8px …` on labels — remove those; the pedestals make them unnecessary.

### 4.2 Legibility floor

| Element | Current | N4 target desktop | N4 target mobile |
|---|---|---|---|
| Wordmark title | 32px | 32px | 22px |
| Wordmark subline | 11px | **16px** | **14px** |
| Mode picker tabs | 14px | **16px** | **14px** |
| Field settings button | 14px | **16px** | **14px** |
| Status strip | 11px | **16px** | **14px** |
| Camera panel status | 11px | **14px** (panel is dense) | 14px |
| Panel heading | 11px | **14px** mono tracked | 14px |
| Slider labels | 11px | **14px** | 14px |
| Tweaks bound values | 10px | **14px** | 14px |

The `.spec` utility stops meaning "11px" and starts meaning "mono uppercase 0.08em tracking." Size is controlled separately. Spec-voice survives.

### 4.3 What runs in the status strip

User's question: *what is FPS? what are we actually showing?*

Honest answer: FPS is a debug tag that got through because it was easy. It's not useful to the user. Replace it with something about the *scene* the user is looking at.

**Proposed content (running state):**

```
INPUT: TOUCH   ·   PALETTE: MEADOW   ·   BLADES: 12,438
```

- `INPUT` — current input mode (already present).
- `PALETTE` — current palette name (already present).
- `BLADES` — live count of grass blades being simulated. This is a *real* specimen datum tied to what you're looking at. Changes as density slider moves. Formatted with thousands separator (`12,438`). Feels substantive.

**In camera mode**, append `CONF: .94` (hand confidence from MediaPipe). FPS drops entirely — it was filler.

Blade count comes from the grass simulation. It's already computed inside `GrassField` (the allocation loop produces `blades.length`). Expose it via a `onBladesChange` callback or a ref so `App` can read it.

Implementation: `GrassField` accepts `onStats={(stats) => …}` and fires `{ bladeCount }` on each rebuild (i.e., density change or resize). `App` holds `bladeCount` state and passes it to `StatusStrip`.

### 4.4 Mode picker hover & active (Option A flavoured)

- Inactive: 1px `--ink-mute` border, `--ink-mute` text.
- Hover: 1px `--ink` border, `--ink` text, `translateY(-1px)`.
- Active: `background: var(--ink); color: var(--night); border-color: var(--ink);` (inverted — same as the active palette tile).
- Gap between tabs: 6px. No middot separators (they're redundant with boxes).

### Files

- `src/styles.css` — new `.chrome-pedestal-bottom`, `.chrome-pedestal-top`; `.chip` component; size bumps on `.status-strip`, `.wordmark .sub`, `.input-picker button`, `.tweaks-toggle`; delete `text-shadow` rules on chrome labels.
- `src/app.jsx` — wrap top/bottom chrome in pedestal divs (or two sibling absolutely-positioned divs); rename "Controls" → "Field settings"; drop the `.cc` corner brackets on the toggle.
- `src/grass-field.jsx` — export blade count via `onStats` prop.
- `src/status-strip.jsx` — replace FPS with BLADES; take `bladeCount` prop.
- `src/use-fps.js` — delete (no longer used).

---

## 5. Field-settings panel rebuild (Phase 4)

### Remove

- **The rule under the heading** (`.tweaks-rule`). Delete it and its pseudo-elements. The heading + the first slider label are enough separation.
- **The small `[ × ]` close text button.** It's decorative brackets around an undersized hit target.

### Add

- **A proper close button** that matches the new chip language. Same 1px outline, 0 radius. `40×40px` hit target minimum. Contains just `×` at 20px (the glyph is big enough on its own; it doesn't need bracket chrome wrapped around it). Positioned top-right, inside the panel.

### Heading

- `FIELD SETTINGS` in mono uppercase 14px, 0.1em tracking, `--ink-mute`. Same weight as before, just sized up to meet the 14px floor.

### Slider row restyle

- Label row: label in 14px uppercase mono tracked (`DENSITY`), value in 18px mono tabular-nums bold `--ink`. Bigger hierarchy between label and value.
- Track: 2px solid `--ink-mute` across the row, unchanged.
- Thumb: 12×20 solid `--ink` rectangle, unchanged.
- Min/max bounds: 14px mono `--ink-faint` flanking the track (was 10px).

### Palette tile restyle

- Tiles 64×64 (up from implicit ~54), 2×2 swatches 16×16 with 2px gap, label 11px mono uppercase tracked *below the tile* (not inside). This is the one exception to the 14px floor — the label is a tertiary annotation, not a control. Alternative: drop the label entirely, swatches alone are enough. Ask user preference.
- Active state remains inverted fill.
- Hover border `--ink`, inactive `--ink-mute`.

### Files

- `src/tweaks.jsx` — new close button markup; remove `.tweaks-rule` div; rename heading; adjust slider row structure for bigger value.
- `src/styles.css` — restyle `.tweaks-heading` (14px), new `.tweaks-close` (40×40 chip), new slider label/value/bound sizes, new `.palette-tile` size.

---

## 6. Mobile layout recomposition (Phase 5)

### 6.1 Fix the bottom-sheet click-through bug (critical)

**Root cause:** `.tweaks` stays in the DOM with `opacity: 0; pointer-events: none`, but palette tiles and sliders inside the panel have `pointer-events: auto` (I set that explicitly in N3 so the palette clicks register when the panel is open). When the panel is visually closed on mobile and sits at the bottom of the screen, those children still accept clicks because `pointer-events: auto` overrides the parent's `pointer-events: none`.

**Fix:** toggle `visibility` on the panel.
- Closed state: `opacity: 0; visibility: hidden; transform: translateY(...)` — `visibility: hidden` cascades and disables pointer events on all descendants regardless of their own declarations.
- Open state: `visibility: visible; opacity: 1; transform: translateY(0)`.
- Add `visibility 0s linear var(--dur-base)` delay on close so the visibility transition happens *after* the opacity fade-out (otherwise the panel vanishes instantly before fading). On open, visibility toggles first, then opacity animates in.

```css
.tweaks {
  opacity: 0;
  visibility: hidden;
  transform: translateY(...) /* or translateX on desktop */;
  transition: opacity var(--dur-base), transform var(--dur-base), visibility 0s linear var(--dur-base);
}
.tweaks.on {
  opacity: 1;
  visibility: visible;
  transition: opacity var(--dur-base), transform var(--dur-base), visibility 0s linear 0s;
}
```

This fixes the "clicking the bottom of the screen changes palette" bug completely, on both desktop and mobile.

### 6.2 Mobile top zone

```
┌─────────────────────────────────┐
│  Touch the grass                │  ← wordmark left, 22px title, 14px tracked subline
│  An interactive field · 2026    │
│                                 │
│  ┌─Touch─┐ ┌Camera┐             │  ← mode picker on its own row, left-aligned
│  └───────┘ └──────┘             │     14px, Option-A chip style
└─────────────────────────────────┘
```

- Wordmark rows 1–2 (title + subline + 120px rule between them, existing).
- 20px gap.
- Mode picker as a horizontal pill row, left-aligned to match wordmark margin.
- Everything fits within a 120px-tall top pedestal zone.

### 6.3 Mobile camera panel — "small and out of the way"

Replace the full-width `left: 16px; right: 16px` panel with a **small corner chip**:

```
Fixed size: 128×96 (a true thumbnail, not a preview).
Position: top-right, below the mode picker row — absolute, right: 16px, top: (wordmark-bottom + picker-bottom + 16).
Contents: video thumbnail only. Status strip stacks below the chip (one-line strip: [filled-square] TRACK · 01 · .94), 14px.
Hide the skeleton overlay on mobile to save GPU.
```

Or even smaller: just show a `128×96` thumbnail. No caption below. The bottom status strip will repeat `CONF: .94` when in camera mode, so we don't need it twice.

**Desktop stays as-is (240px panel).**

### 6.4 Mobile bottom sheet (the sheet itself, now that the bug is fixed)

- Still a bottom sheet — full width, anchored to bottom, slide-up animation.
- Drag handle at top (already designed).
- Padding: 24px 20px max(24px, safe-area + 16px).
- Body: scrollable if content exceeds 70vh (`max-height: 70dvh; overflow-y: auto`).
- Close: the same new 40×40 close chip from Phase 4 sits top-right of the sheet, or kill the close chip on mobile and use a tap on the backdrop (add a `.tweaks-scrim` element behind the sheet, clicking it closes). Prefer the scrim + chip both — standard mobile pattern.

### 6.5 Mobile bottom chrome

```
┌─────────────────────────────────┐
│                                 │
│  [ grass blades ]               │
│                                 │
│  INPUT: TOUCH · PALETTE:        │  ← 14px mono tracked, two lines OK
│  MEADOW · BLADES: 12,438        │
│                                 │
│              ┌ Field settings ┐ │  ← chip, bottom-right, 14px
│              └────────────────┘ │
└─────────────────────────────────┘
```

- Bottom pedestal (140px tall on mobile, same gradient).
- Status strip: word-wrap at the right margin, let it flow to two lines if needed. 14px floor honoured.
- Field settings chip: bottom-right, 14px, clears status strip vertically with 12px gap.

### Files

- `src/styles.css` — `visibility` fix (desktop + mobile); mobile media query recomposition for `.picker-wrap`, `.cam-panel`, `.tweaks`, `.status-strip`, `.tweaks-toggle`; introduce `.tweaks-scrim`.
- `src/app.jsx` — render `<div className="tweaks-scrim" onClick={close}>` when panel is open; restructure cam panel on mobile to thumbnail-only.

---

## 7. Copy polish (Phase 6, trivial)

- Subline: keep `An interactive field · 2026`. Middot, cream-muted, 16px desktop / 14px mobile.
- Veil rule label: `An interactive field · 2026` (same copy, so it echoes across veil and field).
- Settings button: `Field settings`.
- Panel heading: `FIELD SETTINGS`.
- Close aria-label: `Close field settings`.
- Status strip labels: `INPUT`, `PALETTE`, `BLADES`, `CONF`.
- Camera panel: `MODE`, `HANDS`, `CONF`.

---

## 8. Motion (Phase 7, incremental)

The motion tokens from N3 (`--ease-push`, `--dur-base`, `--dur-fast`) stay. No new motion needed. Two small adjustments:

- Field settings panel desktop transition changes from `translateX(12px)` → `translateX(16px)` (slightly bigger offset reads more intentional at the new chip baseline).
- Chip hover `translateY(-1px)` is already in place for the CTA/toggle; extend it to mode picker chips for consistency.

---

## 9. Visual QA checklist

### Desktop (1440×900)

- [ ] Veil: only three elements on screen — `TOUCH THE GRASS`, `[ Wander the field ]`, `2026 · An interactive field` rule. All centered. No corner brackets anywhere.
- [ ] Veil: CTA sits above the rule.
- [ ] Field top: wordmark + mode picker chips, all legible from 3ft.
- [ ] Field bottom: status strip reads `INPUT: TOUCH · PALETTE: MEADOW · BLADES: 12,438` at 16px on a dark pedestal.
- [ ] Mode picker and Field settings button look like the same component family (same border, same padding, same height, same font).
- [ ] Active mode tab has inverted fill (cream bg, dark text), not bracketed.
- [ ] Field settings panel: heading `FIELD SETTINGS`, no rule under it, close button is a 40×40 chip with big clear `×`.
- [ ] Slider values are ≥14px and read as data.
- [ ] No FPS anywhere. Blade count present.
- [ ] Camera panel (desktop): same as N3, 240px wide, specimen status strip.

### Mobile (chrome devtools iPhone 12 Pro, 390×844)

- [ ] Veil: same three elements, centered, no corners, no tags.
- [ ] Field top: wordmark then mode picker on a new row, both left-aligned to 16px margin.
- [ ] Camera panel: 128×96 thumbnail, top-right corner, does NOT block the field.
- [ ] Bottom: status strip on dark pedestal, ≥14px, two lines if needed.
- [ ] Field settings chip: bottom-right, 14px, clearly tappable.
- [ ] Tap Field settings: bottom sheet slides up cleanly. Panel animation completes in ~180ms.
- [ ] Tap the scrim (or the close chip): sheet closes cleanly.
- [ ] **Tap anywhere in the bottom-of-screen area while the sheet is closed: NOTHING changes.** (Regression test for the click-through bug.)
- [ ] Palette tiles only respond to clicks when the sheet is open.

### Interaction

- [ ] Grass physics unchanged (N2 motion preserved).
- [ ] Zero colored chrome (no red toast, no green dot, no moss glow on cursor).
- [ ] No text below 16px on desktop, no text below 14px on mobile (veil rule label is the single allowed exception — it's a colophon).
- [ ] Panel opens with slide+fade, closes mirror-symmetrically.

### Console

- [ ] No errors, no warnings.

---

## 10. Phase ordering & commit plan

One commit per phase on `n3/design-audit`.

| # | Phase | Impact | Risk |
|---|---|---|---|
| 1 | Veil simplification | ★★★★★ | low (subtractive) |
| 2 | Chrome language unification (Option A chips + rename) | ★★★★★ | medium (shared component) |
| 3 | Legibility bump + bottom/top pedestals + BLADES | ★★★★ | medium (blade count plumbing) |
| 4 | Panel rebuild (heading, close, sliders, palette tiles) | ★★★★ | low |
| 5 | Mobile recomposition + **click-through bug fix** | ★★★★★ | medium (the bug is high priority) |
| 6 | Copy polish | ★ | trivial |
| 7 | Motion touch-ups | ★ | trivial |
| 8 | Visual QA | — | — |

**Recommended sequencing:** 5a (click-through fix *first*, standalone commit — it's a bug) → 1 (veil) → 2 (chrome lang) → 3 (legibility + blades) → 4 (panel) → 5b (mobile recompose) → 6 (copy) → 7 (motion) → 8 (QA).

Tag `N4` when QA passes. `N3` tag stays as the pre-polish reference.

---

## 11. Open questions for the user

1. **Chrome language — Option A (outlined-pill chips, recommended) or Option B (bare text)? - let's try option A**
2. **Copy for the settings trigger — `Field settings` (recommended), `Scene`, `Adjust`, or something else? - Field settings**
3. **Veil rule label — same copy as the running subline (`An interactive field · 2026`) or different? you decide, just don't make any copy smaller than 16px on mobile and smaller than 14 on mobile**
4. **Status strip data — keep `BLADES` or prefer something else (`WIND`, `DENSITY`, time-elapsed, none)? We can show the count, just need to call it grass count instead of blades**
5. **Camera thumbnail on mobile — 128×96 fixed (recommended), or user-resizable/collapsible to just a dot when minimized? Fixed is ok, let's try it **
6. **Palette tile label — keep the word under the tile (`MEADOW / EMBER / TIDE`) or swatches alone? I'm not sure I understand what are we talking about, so I will trust you to make a decision**
7. **Active mode-picker state — inverted fill (recommended), or keep the bracketed `[ Touch ]` word? Let's try your recommendation**
8. **Close affordance on mobile sheet — scrim tap + `×` chip, or one of them only? - whichever is the cleanest implementation and user friendly**
