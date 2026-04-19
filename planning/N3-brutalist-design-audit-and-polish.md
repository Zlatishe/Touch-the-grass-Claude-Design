# N3 — Brutalist design audit & polish

**Status:** planning only — do not implement until approved.
**Brief from user:** "we were going for clean, brutalist, minimalist approach" — evaluate UX/UI/interaction across desktop + mobile, provide critique and a phase-by-phase fix plan.
**Method:** designer-led audit. Each issue is named, diagnosed, and resolved with a concrete intervention. Fixes are ordered by impact, not by file.

---

## 1. Executive critique

### What is actually working

- **Ink-only palette + Space Mono / Space Grotesk pairing** is coherent and reads as "specimen sheet, not app chrome." The cream-on-near-black is restrained and confident.
- **The `Wander the field` CTA** is the strongest element in the system. Ghost border + corner brackets + monospace label is textbook brutalist-minimal. Everything else should be measured against it.
- **The middot subline** (`An interactive field · 2026`) carries the right voice — technical, quiet, authored.
- **Physics revert** — the field now feels organic again. The interaction itself is the product; we protected it.
- **Mobile stacking** prevents overlap. Controls button is visible.

### Where it falls short of "brutalist minimal"

The system is **minimal but not yet brutalist.** Brutalism in UI isn't just "take stuff away" — it's structural honesty, specimen-density, asymmetric hierarchy, and materials that *declare themselves*. Currently the product reads as **generic minimal dark mode**. Specifically:

1. **The landing is a dead-center marketing composition.** Title and CTA stacked in the middle of a black void. No tension, no grid, no asymmetry, no information density. A brutalist landing would assert a structure — columns, annotations, offset — not a pageant.
2. **The cursor ring is moss-green** with a soft inner glow blob. It violates our own ink-only rule and is the only piece of UI that looks *soft*. It reads like a leftover from a different design.
3. **The camera panel is a rounded bordered card** with a filleted video thumbnail. This is app-card language, not bracket-only language. It's the most visually incongruous chrome element.
4. **Sliders use generic circular thumbs** on a thin line. Brutalist controls read as notches, blocks, or tick-marks — not iOS-era round thumbs.
5. **Active-tab affordance is a 1px underline.** It's present but timid. Brutalism asks for commitment — a filled block, a bracketed word, something that *claims* the element.
6. **No specimen density.** Brutalism loves annotations: FPS, palette ID, input mode, confidence, build tag. We have one subline. The rest of the canvas is empty. The system is missing its voice.
7. **No motion language.** Panels appear via `display: none → block`. No transition grammar (slide, fade, step). The product feels static between states.
8. **Hover states barely register.** The system doesn't talk back when you approach it.
9. **The veil vertical center-line is at `opacity: 0.15`** — below legibility. It's noise pretending to be structure, which is the exact thing the user called out in N2.
10. **Mobile panel is an undersized desktop panel** (`max-width: 300px` pinned to the right) — not a mobile-native bottom sheet.

### The rubric we'll use

A truly brutalist-minimal interactive field ships with:

| Principle | Manifestation here |
|---|---|
| **Structural honesty** | A visible or heavily-implied grid. Things sit where the grid says, not where "centered" says. |
| **Specimen density** | Technical annotations in the margins — FPS, mode, coords, palette id — treated as first-class content. |
| **Asymmetric hierarchy** | Huge type against small type. Off-center. One hero, many quiet companions. Never two centered things stacked. |
| **Material honesty** | Lines are 1px solid ink. Thumbs are blocks. Corners are brackets. No gradients on chrome, no soft glows on UI. |
| **Input as content** | The cursor / hand is part of the typography, not a decoration. Annotated with its coordinate. |
| **One color system** | Ink + mute + faint. No accent colors on chrome. Color belongs to the grass, not the UI. |

---

## 2. Surface-by-surface critique

### 2.1 Veil (landing)

**What I see.** Title "Touch the grass" centered horizontally and vertically. Bracketed rule above it. CTA `Wander the field` centered below. Corner brackets in all four screen corners. A near-invisible vertical center line.

**Problems.**
- **Center-center composition** is the single most conventional layout in digital design. It's what a Squarespace template does. It tells the visitor "this is a product page."
- **Title and CTA have no supporting information** — no tagline, no input instructions, no credits, no year-mark in-situ (it's in the wordmark on the *next* screen). The user is dropped into a void.
- **The `veil-vert` line** at opacity 0.15 is invisible but still paints. It's noise.
- **The bracketed horizontal rule** is a beautiful small mark but it's decorative here. It floats. It isn't tied to the grid or to the other elements.
- **The corner brackets** are applied to the whole screen — fine on desktop, but they mean almost nothing to the eye at 1440×900 because they're 22px ticks 22px inset. They read as "framing" when they could read as "the frame edges of a specimen card."

**Fix direction (Phase 1).**
- Break center-center. Left-align the title on a clear margin. Offset the CTA. Add a **specimen block** of metadata in the opposite quadrant.
- Treat the veil as a specimen sheet: title in one quadrant, metadata (input modes, year, author, build) in another, CTA with its own row. Think of the European Pharmacopoeia cover, the Swiss railway timetable, an issue of *Real Review*.
- Remove `veil-vert` entirely (it's not earning its pixels) **or** make it 1px solid `--ink-mute` full-height (commit).
- Lock elements to a visible 4-column guide — either actually draw 1px gridlines in `--ink-faint` (new token) or align every element to quarters of the viewport so the grid is *implied*.
- The bracketed horizontal rule becomes a label anchor, not a floating ornament — it sits above a short metadata block or between title and CTA as a spec-sheet divider with a label on one side (e.g. `├── 01/ ENTRY ──┤`).

### 2.2 Field chrome

**What I see.** Wordmark top-left. Mode picker top-right. Controls button bottom-right. (Camera panel top-right below picker when in camera mode.) Otherwise the canvas is the grass.

**Problems.**
- **The four corners-plus-grass** layout is safe but generic. Each corner gets one element. There's no relationship between elements — no sightlines, no shared baseline.
- **No specimen annotations.** Nothing on the screen tells the user what palette is active (unless they open the panel), what FPS they're at, what input mode is engaged, or where their cursor is in the coordinate space.
- **Wordmark and picker don't share a baseline** on desktop — wordmark sits at y=22 with title + rule + subline (total ~51px); picker is a single ~22px row at y=22. They're out of rhythm.
- **The Controls toggle** is the same language as the CTA — good — but it sits alone in the bottom-right with nothing to hold hands with. On the opposite (bottom-left) corner there could be a palette tag / FPS counter to balance.

**Fix direction (Phase 2 + 5).**
- Add a **status strip** along the bottom of the viewport, 28px tall, mono, left side showing `input: TOUCH · palette: MEADOW · fps: 60` — ink-mute. This gives brutalist density and balances the Controls toggle on the right.
- Align wordmark and picker to a shared top baseline (picker drops to match the subline row, not the title row) — so the two top-corners share a horizontal rhythm.
- When the cursor is over the field, optionally show its normalized coordinate (`x: 0.42 / y: 0.68`) near the cursor or in the status strip. Minimal but loaded with specimen-voice.

### 2.3 Mode picker

**What I see.** `Touch · Camera · Keys` with a 1px underline under the active label and the rest in `--ink-mute`.

**Problems.**
- **1px underline is too timid.** It looks like a hover state, not a selected state. From 3ft away you can't tell which mode is engaged.
- **The `·` separator is visually lighter than the labels.** Correct in principle (separators aren't content) but the dot is 14px and the labels are 14px, so they read as equal weight.
- **Hover state = color only.** The element doesn't physically respond.

**Fix direction (Phase 3).**
- Replace underline with a bracketed active treatment: `[ Touch ]` — where `[` and `]` are rendered via pseudo-elements that appear only on the active tab. This is a brutalist "selected" — structural, not decorative.
- Alternatively: active tab gets a solid 2px bottom rule and a 1px side-tick echoing the `veil-rule` language. Pick one and commit.
- Hover: shift `color` AND bump a 1px bottom rule into view (matching but thinner). Two-state feedback, not one.
- Shrink separators to `·` in `--ink-faint` or `——` mono-em-dashes between labels for variety.

### 2.4 Camera panel

**What I see.** Rounded panel (4px radius), thin mute border, filleted video thumbnail with the cursor-ring dot inside, below it `● Tracking | 1 hand`.

**Problems.**
- **Rounded border + card surface breaks the bracket-only language** we established for the Controls panel. Two panels, two visual grammars.
- **The video thumbnail is the "content"** but the panel treats it like a product card with a caption.
- **Status row is hidden at the bottom.** `● Tracking` uses a pulsing green dot — the only animated UI element and the only green UI element. It violates the palette rule.
- **"1 hand"** is a great specimen tag — should be louder, more technical: `HANDS: 1 · LM: 21 · CONF: 0.94` (when data is available).
- **No close/hide on the panel** — it only disappears when you change mode. No way to shrink or peek.

**Fix direction (Phase 4).**
- Strip the panel border; apply the `.pc` corner-bracket language. Zero radius on the outer panel; the video thumbnail can keep a 2px radius (or go to 0).
- Replace the green pulsing dot with an ink indicator: a 1px solid square that fills/hollows (filled = tracking, hollow = waiting). No color, no pulse.
- Expand the status row into a specimen strip with mono labels: `MODE: TRACK · HANDS: 01 · LM: 21 · CONF: .94` (pad integers, drop the leading 0 on decimals — the classic brutalist number).
- Minimize-state: clicking on the panel collapses it to just the status strip (no video). The user gets the information even after they've trusted the camera.
- Add corner brackets (`.pc`) on the video thumbnail frame itself, not the outer panel — the thumbnail *is* the specimen.

### 2.5 Controls panel (Tweaks)

**What I see.** Bracket-cornered panel bottom-right. Heading `Controls`, bracketed rule, three named sliders with cream circular thumbs on a thin dim track, palette row at bottom with three tiny swatch blocks under names.

**Problems.**
- **Sliders are the weakest element in the system.** Circular thumbs read as iOS/Android. Brutalist controls want blocks, tick-bars, or numeric-only input.
- **Values are shown in Space Mono bold at the end of the label** — good — but the label and value share the same font-size so the hierarchy is flat. Value should *dominate* so it reads as data.
- **Palette swatches (10×10 px)** are smaller than the font-size next to them. They're an afterthought. A palette selector is high-information — it should look high-information.
- **Active palette marker** is a 1px underline, same timid treatment as the mode picker.
- **× close button is 20px font-size** in a 24px box, `--ink-mute`. Easy to miss. On mobile it's a tiny tap target.
- **No slider step indicators or min/max labels.** You can drag to whatever, but brutalism would show bounds: `0.30 ≤ 3.40 ≤ 3.00`.
- **The `Controls` heading is 18px display.** It's the heading of a modal but it doesn't feel load-bearing. It should probably be smaller (14–16px mono, uppercase) like a specimen sheet section header, *or* much bigger (24–28px display) to actually function as a title.

**Fix direction (Phase 6).**
- **New slider design:** the track is a 2px solid `--ink-mute` bar across the full row. The "thumb" is a 10×16px solid `--ink` rectangle (block). Above the track, the min, current, and max values sit in mono, with the current value in `--ink` bold and the bounds in `--ink-faint`. No rounded thumb. No colored track.
- **Heading:** drop from 18px display → **12px mono uppercase with 0.1em tracking**: `CONTROLS`. Sits as a section marker, not as a title. The panel's size/content *is* the title.
- **Close affordance:** bracketed `[ × ]` in mono, 14px, `--ink-mute`. Larger tap target (32×32px). Alternatively: a mono label `[ close ]` — cleaner and self-documenting.
- **Palette row:** swatches become 20×20px, stacked 2×2 or 4×1, with the name in mono UPPERCASE below. Active palette = inverted fill (cream rectangle, dark text, matching CTA language).
- **Consider inline min/max labels** under each slider: `0.30 ──●──────────────── 3.00` with the current value centered above the thumb.

### 2.6 Cursor ring (field cursor)

**What I see.** A 52px cream ring with a soft moss-green inner glow and box-shadow. Softly semi-transparent.

**Problems.**
- **The only green UI element in the system.** Violates the ink-only rule. The green is supposed to belong to the grass — giving it to the cursor confuses who owns the color.
- **The blur + box-shadow glow** makes it the only "soft" thing on a screen full of hard lines and hard brackets.
- **Circular shape** at the cursor contradicts the brutalist corner-bracket language used everywhere else.
- **No readout.** A brutalist cursor would be a small bracketed crosshair with a coordinate tag beside it.

**Fix direction (Phase 7).**
- Replace the ring with a **bracket-frame cursor**: four `.cc`-style 10px corner ticks forming a 44×44 box around the hand point, 1px `--ink` (or `--ink-mute` when inactive/distant). No fill, no glow, no green.
- Optionally a 1px+1px crosshair through the center, length 6px, in `--ink-mute`.
- Optional (Phase 5): coordinate readout at the cursor — `0.42 / 0.68` in 11px mono, offset 12px to the bottom-right of the frame, in `--ink-faint`. Only when cursor is stationary for >200ms (so it doesn't flicker during movement).

### 2.7 Wordmark

**What I see.** `Touch the grass` at 32px Space Grotesk with a rule and an `An interactive field · 2026` subline.

**Problems.**
- Actually pretty strong. Only critiques are small:
  - The rule between title and subline uses `--ink-mute` but is 100% width of a natural-content-width element, which means the rule is title-wide. Looks fine but accidental. Lock it to a fixed width (e.g. 140px) so it reads as an intentional divider.
  - The subline is 16px — same as the picker. Could go to 11px mono for true specimen flavor.
- **On mobile, the wordmark title is 20px and the subline is 13px.** The relationship between wordmark and picker (stacked below) has no shared baseline with a gap that feels arbitrary (76px from top, no grid).

**Fix direction (Phase 8).**
- Reduce rule width to ~120px to break away from content-width coincidence.
- Consider moving to 11–12px mono tracked subline (`AN INTERACTIVE FIELD · 2026` in uppercase letterspaced) — more specimen, less web-header.
- On mobile, tighten the wordmark → picker gap to a clean 24px rhythm.

### 2.8 Mobile experience

**What I see (from the earlier QA).** Wordmark top-left stacked over the picker; grass fills the rest; Controls toggle bottom-right with brackets.

**Problems.**
- **Controls panel as a right-anchored mini-card** is wrong on mobile. It should be a **bottom sheet** — full-width, slides up from the bottom, with a drag handle and the bracket language on the top edge.
- **Camera panel on mobile** currently drops to 200px wide next to the picker — fine but cramped.
- **Veil on mobile**: the bracketed rule is 160px but the `Touch the grass` title is at ≤80px font-size — the rule feels proportionally right but the CTA is in the center of a big void again. Same "marketing page" problem as desktop.
- **No gesture-to-open-controls on mobile** — user has to tap a small bracketed button.

**Fix direction (Phase 9).**
- Mobile Controls: bottom sheet, 100vw, slides up 280ms ease-out, drag handle (1px solid bar 32px wide) at top. Corner brackets on the top-left and top-right of the sheet only (since it anchors to the bottom edge).
- Mobile Camera panel: full-width below the picker, video 16:9, status strip below it.
- Mobile Veil: stack left-aligned too — title top-left (on the grid), CTA bottom-left (on the grid), metadata block top-right. Same asymmetric language as desktop.
- Add a swipe-up-from-bottom gesture to open controls on touch devices.

### 2.9 Motion / state transitions

**What I see.** `display: none ↔ block` for the Controls panel. Veil opacity fade (0.95s). Otherwise static.

**Problems.**
- **Panels pop.** No sense of "coming from somewhere."
- **Palette change is instant** — a sudden full recolor of the field is jarring, not satisfying.
- **No cursor-appearance animation** — the ring just shows up.
- **Hover has 120ms color transition** on most elements, which is OK, but no structural response.

**Fix direction (Phase 10).**
- **Controls panel:** slide + fade from 12px offset, 180ms cubic-bezier(0.2, 0.8, 0.2, 1). Closing mirrors.
- **Palette change:** cross-fade the canvas colors over 400ms (requires animating `palette.shades` in the render loop — not trivial, see notes).
- **Mode switch:** small flash on the picker active marker as it slides from old → new tab.
- **Cursor ring appearance:** fade-in 120ms on first active frame.
- **Hover on buttons:** border brightens from `oklch(0.42 …)` to `oklch(0.65 …)` over 140ms (already present) — add a 1px `translateY(-1px)` on buttons for a tactile "pressable" response.
- No bouncy easing. No over-easing. Brutalism moves with a single confident push, not a spring.

### 2.10 Typography

**What I see.** Space Grotesk display (wordmark, headings). Space Mono everything else (body, labels, buttons, subline).

**Problems.**
- **Flat scale.** Most mono text is at 14 or 16px. No real hierarchy.
- **No uppercase-tracked-mono** anywhere — a staple of brutalist specimen voice.
- **No fractional number treatment** for data (e.g. `.94` vs `0.94`).

**Fix direction (Phase 11 — typography system).**
- Establish a mono type scale: `--t-xs: 10px`, `--t-sm: 12px` (uppercase + 0.08em tracking for specimen labels), `--t-md: 14px`, `--t-lg: 16px`.
- Introduce a `.spec` utility class: `font-size: var(--t-sm); text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-mute);` — apply to all section headers, status strips, specimen tags.
- Introduce `.data` utility: `font-variant-numeric: tabular-nums; color: var(--ink);` — apply to numeric readouts so they align.
- Display Space Grotesk reserved for: wordmark title, H1 on veil. Nothing else. Remove from Controls heading (use `.spec` instead).

---

## 3. Phase-by-phase implementation plan

Each phase is independently commit-able. Ordered by impact first, then dependency.

### Phase 1 — Veil recomposition (biggest visual shift)

**Goal.** Kill the center-center composition. Make the landing a specimen sheet.

**Layout (desktop):**
```
┌─────────────────────────────────────────────────────────┐
│  ┌─ 01                                         [TTG-01] │
│  │                                                      │
│  │                                                      │
│  TOUCH                                        INPUTS    │
│  THE                                          — TOUCH   │
│  GRASS                                        — CAMERA  │
│                                               — KEYS    │
│  ├── 2026 ──────── AN INTERACTIVE FIELD ──────┤         │
│                                                         │
│  [ Wander the field ]                                   │
│                                                         │
│                                                         │
│                                               BUILD N3  │
└─────────────────────────────────────────────────────────┘
```

- Title "Touch the grass" **left-aligned**, huge (clamp 96px → 180px), on a 10% left margin. Stack onto 3 lines (`Touch / the / grass`) at larger sizes for sculptural effect, single line at smaller. Left-align wraps naturally.
- Top-right specimen block: `INPUTS` header (spec type), three dashed lines listing `TOUCH / CAMERA / KEYS`.
- Top-left spec tag: `01` or `├─ 01` — small, mono, quiet.
- Top-right spec tag: `[TTG-01]` or `2026.04` — a brutalist "artifact number."
- Mid-row bracketed rule with a label embedded: `├── 2026 ──── AN INTERACTIVE FIELD ──┤` — single element, meaningful.
- CTA `[ Wander the field ]` sits below the rule, left-aligned at the same 10% margin.
- Bottom-right spec tag: `BUILD N3` or current revision.
- Remove `.veil-vert` entirely.

**Layout (mobile):** same language, stacked.
```
01 ─                                      [TTG-01]

TOUCH
THE
GRASS

├── 2026 ── AN INTERACTIVE FIELD ──┤

[ Wander the field ]

                                          BUILD N3
```

**Files.** `src/app.jsx` (veil JSX restructure), `src/styles.css` (veil grid styles), possibly new `.spec` class.

**Verification.** No element sits on the vertical or horizontal center. Visual weight is top-heavy left, supported by the right-margin spec block.

---

### Phase 2 — Cursor ring → bracket frame (second-biggest shift, easy win)

**Goal.** Remove the one green element. Replace with ink-only bracket-frame cursor.

**Changes.**
- Remove `.cursor-ring::before` entirely (the glow blob).
- `.cursor-ring` becomes a 44×44 box with four corner ticks (new `.cursor-corner` spans, or `::before`/`::after` tricks).
- Corner ticks: 10px, 1px solid `--ink`.
- On inactive (no mouse motion for >2s) fade ticks to `--ink-mute`.
- When over the veil (CTA area), the cursor can disappear — the browser default suffices there.

**Files.** `src/styles.css` (`.cursor-ring` rewrite), possibly `src/app.jsx` (wrapping spans inside the cursor ring div).

**Verification.** No green anywhere in UI chrome on any mode. Cursor reads as "specimen frame" around the hand point.

---

### Phase 3 — Mode picker active state

**Goal.** Make the selected mode unmistakable.

**Option A (recommended): bracketed active word**
```
Touch · [ Camera ] · Keys
```
- Active tab gets `[` and `]` rendered via `::before`/`::after`, mono 14px, `--ink`, 4px horizontal gap from the label.
- Underline removed.
- Inactive remains `--ink-mute`, no brackets.

**Option B: solid block fill**
- Active tab gets `background: var(--ink); color: var(--night); padding: 2px 6px;` — inverted, like a selected cell in a spreadsheet.

Pick **Option A** for consistency with the CTA bracket language.

**Hover:** inactive label brightens to `--ink` AND gains a 1px bottom rule that persists until pointer leaves.

**Files.** `src/styles.css` (.input-picker button + ::before/::after pseudo-elements for active).

---

### Phase 4 — Camera panel re-language

**Goal.** Kill the card. Make the panel a specimen.

**Changes.**
- Remove `border` and `border-radius` from `.cam-panel`.
- Add `.pc` corner bracket spans (4 of them) in `src/app.jsx` inside the cam-panel.
- Tighten `padding` to `12px`.
- Video thumbnail: add 4 smaller corner ticks (new `.vc` class, 6px) around the video wrap, `--ink`.
- Replace `.dot-indicator` pulse + green with a 6px solid cream square that toggles filled ↔ hollow (filled during tracking, hollow while loading/waiting). No animation.
- Status strip redesign:
  ```
  MODE: TRACK · HANDS: 01 · LM: 21 · CONF: .94
  ```
  - All mono uppercase, 11px, `--ink-mute`, labels in `--ink-faint`, values in `--ink`.
  - Requires plumbing hand-landmark count and confidence from `hand-tracker.js` → `onFrame` callback → up to App → into the cam panel. (`HandLandmarker` exposes `handedness` and `landmarks`; confidence from `handedness[0].score`.)
- Add a minimize control: clicking the panel body toggles a `minimized` state that hides the video and keeps the status strip.

**Files.** `src/app.jsx` (cam panel JSX + landmarks/confidence plumbing), `src/hand-tracker.js` (extend `onFrame` payload), `src/styles.css` (cam-panel rebuild).

---

### Phase 5 — Status strip (bottom of viewport)

**Goal.** Brutalist specimen density. Balances the Controls toggle.

**Element.** New `.status-strip`, absolutely positioned at bottom-left, 28px tall, mono 11px uppercase.

**Contents (in Touch mode):**
```
INPUT: TOUCH  ·  PALETTE: MEADOW  ·  FPS: 60
```

**Contents (in Camera mode):**
```
INPUT: CAMERA  ·  PALETTE: MEADOW  ·  CONF: .94  ·  FPS: 60
```

**Implementation.**
- Small React component `StatusStrip.jsx`.
- FPS from a simple rAF counter (rolling 60-frame average).
- PALETTE from `cfg.palette.toUpperCase()`.
- Positioned bottom: max(18px, safe-area+12px); left: max(24px, safe-area+18px); ending ~300px from right (to leave room for the Controls toggle).
- On mobile: strip sits above the Controls button on a new line, full-width.

**Files.** new `src/status-strip.jsx`, hook up in `src/app.jsx`, styles in `src/styles.css`.

---

### Phase 6 — Control surfaces rebuild (sliders, heading, close, palette)

**Goal.** Brutalist controls.

**6a. Heading.** `Controls` → `CONTROLS` in mono 12px, uppercase, 0.1em tracking, `--ink-mute`. Replace h3 display font. Section-header voice, not title voice.

**6b. Slider.** Custom slider component (or heavy CSS on the range input):
- Track: 2px solid `--ink-mute`, full row width.
- Thumb: 10×16px solid `--ink` rectangle, no border, no radius.
- Above the track, value line: `min ──────── {value} ──────── max` with current value in `--ink` tabular-nums, min/max in `--ink-faint`.
- Label above: `DENSITY` mono uppercase 11px in `--ink-mute`.

Example row:
```
DENSITY
0.30                   3.40                   3.00
━━━━━━━━━━━━━━━━━━━━━▍━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
(Block thumb inline with bar; above the bar, three-column label/value/max.)

**6c. Close.** Replace `×` with `[ × ]` in mono 14px, tap target 32×32. Or use `[ close ]` — self-documenting.

**6d. Palette row.** Buttons become 56×56 tiles in a single row:
- Each tile shows four 10×10px swatches stacked in a 2×2 grid at top, with uppercase mono name below (`MEADOW`, `EMBER`, `TIDE`).
- Active tile: inverted fill (cream background, dark text), same language as we'd use for the active picker tab if we went with Option B. Or: `[ MEADOW ]` bracketed name.
- Hover: bracketed-on-hover.

**6e. Panel padding.** Increase to 22px 24px. Brutalism likes breathing room where it exists.

**Files.** `src/tweaks.jsx` (restructure rows, new palette tile markup), `src/styles.css` (slider overhaul, heading, close, palette tiles).

---

### Phase 7 — Motion language

**Goal.** Single confident push per transition. No bouncy, no over-easing.

**Tokens (new).**
```
--ease-push:  cubic-bezier(0.2, 0.8, 0.2, 1);
--dur-fast:   120ms;
--dur-base:   180ms;
--dur-slow:   300ms;
```

**Mappings.**
- **Controls panel open/close:** slide from +12px X (desktop) or +100% Y (mobile bottom sheet), fade 0 → 1. `var(--dur-base) var(--ease-push)`. Closing mirrors.
- **Mode switch:** the `[ ]` brackets slide from old tab to new tab. `var(--dur-fast)`.
- **Hover on CTA / Controls toggle:** `transform: translateY(-1px)` + border brighten. `var(--dur-fast)`.
- **Palette change (stretch goal):** canvas `palette.shades` cross-faded over 400ms — implemented by holding `currentPalette` and `nextPalette` and a `t` variable in the render loop, lerping OKLCH. **Cost:** non-trivial. Defer to Phase 7b.
- **Cursor appearance:** opacity 0 → 1 over 120ms when first active.

**Files.** `src/styles.css` (tokens + transitions), `src/grass-field.jsx` for the palette cross-fade (if pursued).

---

### Phase 8 — Typography system cleanup

**Goal.** A scale that's doing work; a consistent specimen voice.

**Changes in `src/styles.css`:**

```
--t-xs: 10px;
--t-sm: 11px;   /* specimen labels, uppercased, tracked */
--t-md: 14px;
--t-lg: 16px;
--t-xl: 20px;
--track-spec: 0.08em;
```

Utilities:
```
.spec { font: var(--t-sm)/1 var(--sans); text-transform: uppercase; letter-spacing: var(--track-spec); color: var(--ink-mute); }
.data { font-variant-numeric: tabular-nums; color: var(--ink); }
.data-faint { font-variant-numeric: tabular-nums; color: var(--ink-faint); }
```

Apply:
- Wordmark subline → `.spec`
- Controls heading → `.spec`
- Status strip labels → `.spec`
- Slider labels → `.spec`
- All numeric values → `.data` / `.data-faint`

Scope Space Grotesk to only: wordmark title, veil H1.

---

### Phase 9 — Mobile recomposition

**Goal.** Make mobile feel mobile-native, not a shrunken desktop.

**Changes.**
- **Bottom sheet for Controls.** At ≤640px, `.tweaks` becomes full-width, anchored to bottom, with top corner brackets only. Slides up from `translateY(100%)` → `0`. Drag handle (1px solid `--ink-mute` bar, 32×1px) centered at top of sheet. Swipe-down-to-close gesture (nice-to-have).
- **Swipe-up-to-open** on field area (touchstart → touchmove Y < -40px → open). Nice-to-have.
- **Camera panel mobile:** full-width below picker, video 16:9, status strip stacked below.
- **Veil mobile:** stack the Phase 1 layout top-to-bottom, all left-aligned at 20px from left edge. No centering.

**Files.** `src/styles.css` media queries, `src/app.jsx` (touchstart handler for swipe-up).

---

### Phase 10 — Status / specimen plumbing

**Goal.** The annotations promised in Phase 5 need real data.

**Changes.**
- **FPS counter** — new `useFps()` hook reading rolling 60-frame timings via rAF. Passed to `StatusStrip`.
- **Hand confidence + landmark count** — extend `startHandTracker` `onFrame` to include `{active, x, y, confidence, landmarks: 21}`. Map `results.handednesses[0][0].score` and `results.landmarks[0].length`.
- **Palette name** — already have it (`PALETTES[cfg.palette].name.toUpperCase()`).

**Files.** new `src/use-fps.js`, edit `src/hand-tracker.js`, edit `src/app.jsx`, `src/status-strip.jsx`.

---

### Phase 11 — Error toast restyle

**Goal.** The red toast is the only colored element when camera fails; it sticks out like a bug report.

**Changes.**
- Replace red with ink-only: `background: oklch(0.12 0.01 85); border: 1px solid var(--ink); color: var(--ink);` with `.pc` corner brackets.
- Prefix the message with `ERR:` in `.spec` voice.
- Example: `ERR: CAMERA UNAVAILABLE — PERMISSION DENIED`.

---

## 4. Visual QA (Phase 12)

After all builds, before closing N3:

### Desktop (1440×900)
- [ ] Veil: no element is within 100px of the page center on X or Y.
- [ ] Veil: left-aligned title, right-side specimen block, left-aligned CTA, bottom-right build tag.
- [ ] Field Touch mode: status strip shows `INPUT: TOUCH · PALETTE: MEADOW · FPS: XX`.
- [ ] Field Camera mode: camera panel has no border, only corner brackets; status strip includes CONF.
- [ ] Controls panel: `CONTROLS` in mono uppercase; sliders have rectangular block thumbs; palette tiles are 56×56 with uppercase names.
- [ ] Cursor ring: no green, no glow, bracket-frame only.
- [ ] Mode picker: active tab is `[ Camera ]` bracketed; hover has two-state response.
- [ ] Zero colored UI elements (no red toast, no green dot, no moss glow).

### Mobile (390×844)
- [ ] Veil: left-aligned stack, no centering.
- [ ] Field: wordmark + picker + status strip stacked cleanly; Controls toggle bottom-right.
- [ ] Controls: opens as a bottom sheet, not a right-side card.
- [ ] Drag handle visible at top of sheet.
- [ ] Camera panel: full-width below picker.

### Interaction
- [ ] Grass still feels organic (N2 motion preserved).
- [ ] Controls panel slide takes ~180ms.
- [ ] Mode switch animates bracket markers.
- [ ] CTA and Controls toggle lift 1px on hover.
- [ ] No layout jank on palette switch (even before cross-fade is added).

### Console
- [ ] No errors.
- [ ] No warnings.

---

## 5. Phase priority & commit plan

Ordered by impact. Each phase = 1 commit on branch `n3/design-audit`.

| # | Phase | Impact | Risk |
|---|---|---|---|
| 1 | Veil recomposition | ★★★★★ | medium (layout rewrite) |
| 2 | Cursor ring → bracket frame | ★★★★ | low |
| 3 | Mode picker active state | ★★★ | low |
| 4 | Camera panel re-language | ★★★★ | medium (needs tracker plumbing) |
| 5 | Status strip | ★★★★ | low |
| 6 | Control surfaces rebuild | ★★★★ | medium (custom slider) |
| 7 | Motion language | ★★ | low |
| 8 | Typography system | ★★ | low |
| 9 | Mobile recomposition | ★★★ | medium (gesture + sheet) |
| 10 | Status / specimen plumbing | ★ | low (pairs with 5) |
| 11 | Error toast restyle | ★ | trivial |
| 12 | Visual QA pass | — | — |

**Recommended sequencing:** 1 → 2 → 3 → 6 → 4 → 5 (+10) → 8 → 7 → 9 → 11 → 12.

Tag `N3` after QA. Keep `N2` tag for comparison.

---

## 6. Open questions for the user

1. **Veil composition** — OK with the asymmetric, specimen-sheet landing (Phase 1)
2. **Active picker treatment** — bracketed word `[ Touch ]` (Option A) or inverted-block `◼ Touch` (Option B) - whichever fits better
3. **Slider thumb** — solid rectangular block (brutalist) or keep circular but rework the track to be more assertive? - rework the track
4. **Status strip** — desktop bottom-left as specified, or prefer it tucked under the wordmark (top-left cluster)? - bottom left
5. **Palette cross-fade** (Phase 7b) — worth the engineering cost, or is an instant palette change acceptable? - instant change is acceptable
6. **Mobile bottom-sheet** — agree this is the right mobile pattern for Controls, or keep the floating-card pattern? - use the right mobile pattern for Controls if this is a bottom sheet
7. **Data shown in status strip** — I've specified FPS + input + palette + confidence. Anything you want to add (blade count, wind, coords)? Anything to drop? Drop coords
8. **Build tag voice** — `BUILD N3` / `2026.04` / `[TTG-01]` / something else?
