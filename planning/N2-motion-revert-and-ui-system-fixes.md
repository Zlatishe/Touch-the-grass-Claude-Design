# N2 — Motion reversion & UI design-language fixes

**Status:** planning only — do not implement until approved.
**Scope:** roll back over-tuned N1 grass physics, then define a coherent **brutalist design language** (derived from the `Wander the field` CTA) and apply it to every UI element in appropriate form. Fix ambient-noise lines (too thin/pale to read as intentional). Fix mobile overlap, rework Tweaks panel, rename palettes. End with a visual QA pass using desktop + mobile screenshots.
**Non-goals:** hand-tracking internals, spatial hash, perf budget (keep N1 gains). No new features.

---

## Phase 0 — Grass motion reversion (CRITICAL, do first)

**Problem.** N1 introduced delta-time correction and a near-cursor stiffness multiplier. Combined, blades snap and oscillate like rubber: on sub-60fps frames `Math.pow(damping, dtF)` under-damps while `accel * dtF` over-injects force → overshoot. The ×1.8 stiffness boost near the cursor makes the inner ring slam toward target.

**Reference (baseline).** `touch-the-grass.html` integrator:
```js
b.vAngle = (b.vAngle + ((tgt - b.angle) * b.stiffness) / b.mass) * b.damping
b.angle += b.vAngle
```
Original params: `stiffness: 0.014 + rand*0.020`, `damping: 0.90 + rand*0.05`, `mass: 0.6 + rand*0.8`.

**Changes in `src/grass-field.jsx`:**

1. **Remove delta-time scaling.** Delete `prevTsRef` writes, `dt`/`dtF` computation (lines ~127–132), and both `dtF` usages on lines 201–202. Restore:
   ```js
   b.vAngle = (b.vAngle + accel) * b.damping
   b.angle += b.vAngle
   ```
2. **Remove near-cursor stiffness boost.** Delete the `let eff = b.stiffness … eff *= 1.8` block (lines 193–197). Use `b.stiffness` directly.
3. **Keep** spatial hash — it only culls, doesn't change feel.
4. **Keep** `handSpeed`/`push` scaling — baseline has an equivalent.
5. **Keep** `prevTsRef` only for pause reset; else drop.

**Verification.** Side-by-side with `touch-the-grass.html`: same sway cadence with no hand, same smooth lean-and-return on cursor pass. No visible snap at inner radius. 30fps throttled = slow-mo (matches baseline).

**Tags.** Pre-edit: `N1-final`. Post-Phase-0: `N2-phase0`.

---

## Phase 1 — Design language (brutalist system)

**What the user actually said:** not "same CTA everywhere" — derive a *design language* from the CTA's vibe and apply it appropriately to each element type. And: thin/pale lines read as noise; make every visible line intentional.

### 1.1 Language principles (pulled from the `Wander the field` CTA)

| Principle | Observation from the CTA | Applied rule |
|---|---|---|
| **Ghost frame** | thin solid border on black, no fill | All containers that need framing use the same 1px border in the same ink color, not hairlines. |
| **Corner brackets** | four short ticks inset at the corners, not a full border | Brackets replace full borders on panels/screens to signal boundary without enclosing. Stay 8–10px ticks, always 1px. |
| **Monospace tension** | Space Mono body inside Space Grotesk wordmark | Metrics (slider values, status text, counters) use mono; labels/titles use display. |
| **Uniform ink** | one foreground color, one dim variant | No "barely visible" grey-on-grey. Two states: `--ink` (visible) and `--ink-mute` (secondary, still legible ≥ 60% contrast). Kill any `opacity: 0.25` hairline. |
| **Generous padding, tight tracking** | 14–18px padding, negative tracking | Buttons/inputs inherit the same padding scale. |
| **No gradients on UI chrome** | CTA is flat ink on flat bg | UI panels stay flat; gradients are reserved for the canvas (fog, vignette, hand tint). |

### 1.2 Tokens (top of `src/styles.css`)

```
/* Ink */
--ink:        oklch(0.92 0.02 85);       /* cream — the CTA text/border */
--ink-mute:   oklch(0.72 0.02 85);       /* still readable; replaces the "pale hairline" ink */
--ink-faint:  oklch(0.52 0.02 85);       /* only for non-load-bearing filigree; never for single lines */
--bg:         oklch(0.12 0.01 85);       /* veil/panel bg */

/* Line weights — everything is 1px or gone */
--line:        1px solid var(--ink);
--line-mute:   1px solid var(--ink-mute);
/* NO sub-pixel hairlines, NO opacity-based lines */

/* Frame geometry */
--radius:        4px;
--bracket-len:   10px;
--bracket-off:   -1px;

/* Spacing */
--pad-y: 12px;
--pad-x: 20px;

/* Type */
--font-display: "Space Grotesk", sans-serif;
--font-mono:    "Space Mono", monospace;
--track-tight:  -0.02em;
```

### 1.3 Element inventory and language mapping

One form language, three element roles:

| Role | Treatment | Used for |
|---|---|---|
| **A. Ghost-frame + brackets** | 1px border + 4 corner ticks | Primary CTAs: `Wander the field`, `Tweaks` toggle. |
| **B. Bracket-only** | corner ticks, no border | Container panels: Tweaks modal, camera panel. Reads as "brutalist viewport" not "button". |
| **C. Inline tab** | no frame; active = 1px underscore in `--ink`, inactive = `--ink-mute` | Mode picker (Touch / Camera / Keys), palette buttons. Separators between tabs use a visible `·` glyph, not a hairline. |

### 1.4 What gets removed (ambient noise)

- `.picker-rule` — sub-visible hairline → **deleted** entirely.
- `.brulia-mark` + `::after` on the veil — the barely-visible circle + vertical tick → **deleted** (see Phase 2).
- Any `border: 1px solid rgba(…, 0.08)` or similar pale borders — promoted to `--line-mute` (readable) or removed.
- Range-slider track: if currently a translucent hairline, switch to solid `--line-mute` on a 2px track.

### 1.5 What gets redesigned (kept but intentional)

- **`.veil-rule`** (horizontal mark below the wordmark on the landing page): keep, but redesign per 1.6.
- **Active-tab indicator** in mode picker: 1px solid `--ink` underline, 2px gap below the label, same width as the label text. No pale whole-picker hairline.

### 1.6 `.veil-rule` redesign (user: "can keep it but needs to be redesigned to fit the vibe")

Current: a single thin faint line. Replace with a bracketed rule that echoes the CTA:
```
├────────────────────────────┤
```
Implementation: a flex row — two short vertical 8px `--line` ticks at each end, a 1px `--line` between. Width: ~260px, centered. Reads as a deliberate mark, not a stray pixel row.

### 1.7 Deliverable

A single `/* Design language */` block at the top of `styles.css` defining tokens and three reusable classes (`.frame-ghost`, `.frame-brackets`, `.tab`). Every UI selector references tokens, not raw values. No rgba/alpha on structural lines.

---

## Phase 2 — Landing page cleanup

- Remove `<div className="brulia-mark" />` from veil (`src/app.jsx` line ~257).
- Remove `.brulia-mark` and `.brulia-mark::after` rules.
- **Keep** `.veil-rule` but rebuild per Phase 1.6 (bracketed rule).
- If veil feels top-heavy after removing the mark, tighten `.veil` top padding by ~20px. No replacement ornament.

---

## Phase 3 — Mode picker cleanup

- Delete `.picker-rule` CSS rule and the `<div className="picker-rule" />` node in `src/app.jsx` (~line 207).
- Audit `.picker-wrap::before/::after`, `.input-picker` borders — strip any pale line.
- Active tab: apply `.tab` class from Phase 1 (underscore in `--ink`, inactive label in `--ink-mute`). Separator `·` rendered in `--ink-mute`.

---

## Phase 4 — Subline separator

`An interactive field / 2026` → `An interactive field · 2026`. `src/app.jsx` line 186. Middot glyph with surrounding spaces.

---

## Phase 5 — Mobile layout fix

**Problem.** On narrow widths the picker can run into / under the wordmark.

**Plan.** Stack at ≤640px:
- `.chrome` top area flex-direction: column.
- Wordmark full-width, left-aligned.
- Picker below, 12px gap, left-aligned.
- At ≤420px also reduce picker button padding to `10px 12px` and font to 13px.

**Files:** `src/styles.css` only. Existing JSX already `isTouchDevice()`-filters Keys so mobile shows 2 tabs.

---

## Phase 6 — Tweaks panel redesign

**Decisions from user:**
- Copy: heading `Controls`, **no secondary copy** (remove the `.hint` line).
- Toggle behavior: **closed → button visible; open → button hidden**, close happens via the `×` inside the panel.

**Changes:**

**6a. Toggle (closed state only).**
- Apply Phase 1 Role A (ghost-frame + brackets). Same visual weight as the CTA, smaller size: `--pad-y: 8px; --pad-x: 14px`.
- JSX: wrap label in same 4 `<span className="cc …" />` corner spans as `.cta-btn`.
- Render **only when `!tweaksOpen`** (conditional JSX in `src/app.jsx`, replaces current always-on toggle).

**6b. Panel (open state).**
- Apply Phase 1 Role B (bracket-only frame).
- Add close button top-right: `<button className="tweaks-close" aria-label="Close" onClick={onClose}>×</button>`. No frame, just a 24px hit area; `×` glyph in `--ink`, hover = slight brightness bump. Wire `onClose` prop from `app.jsx` → `setTweaksOpen(false)`.
- Remove `<div className="hint">…</div>` node and the `.hint` CSS rule.
- Heading: `Controls` (replace `Tweaks` in `src/tweaks.jsx` line 20).
- Keep the bracketed `.tweaks-rule` under the heading but rebuild per Phase 1.6.

**6c. Palette buttons inside panel.**
- Apply Phase 1 Role C styling: inactive label `--ink-mute`, active label `--ink` with 1px underscore. Swatch row stays.

---

## Phase 7 — Palette renaming

Confirmed: **Meadow / Ember / Tide**. IDs unchanged to avoid breaking `cfg.palette` strings.

- `src/palettes.js` — add `name: 'Meadow' | 'Ember' | 'Tide'` field to each entry. Keep `id` keys (`midnight`, `ember`, `abyss`).
- `src/tweaks.jsx` lines 13–16 — read `name` from palette entries; drop the hardcoded lowercase labels.

---

## Phase 8 — Visual QA (NEW)

After all phases built, before declaring done:

1. **Dev server.** Launch via `mcp__Claude_Preview__preview_start` (config in `.claude/launch.json`, port 5173).
2. **Desktop screenshot.** `mcp__Claude_Preview__preview_resize` to 1440×900, then `preview_screenshot`. Capture:
   - Veil / landing state.
   - Field state (after clicking `Wander the field`).
   - Tweaks panel open.
   - Camera mode panel visible.
3. **Mobile screenshot.** Resize to 390×844 (iPhone 14 Pro), repeat all four captures.
4. **QA checklist — each screenshot must pass:**
   - [ ] No visible hairline ambiguity (every line is solid `--ink` or `--ink-mute`).
   - [ ] No brulia circle on veil.
   - [ ] Subline shows `·`, not `/`.
   - [ ] On mobile, picker does not overlap wordmark.
   - [ ] Tweaks button visible on field view (closed state); not visible when panel is open.
   - [ ] Panel shows `Controls` heading, `×` close button, no secondary copy line.
   - [ ] Palette labels read `Meadow`, `Ember`, `Tide`.
   - [ ] Active mode tab has a solid 1px underline; inactive tabs muted but readable.
   - [ ] `veil-rule` reads as a deliberate bracketed mark.
   - [ ] Grass motion: drag cursor across, confirm no rubbery snap (compare against `touch-the-grass.html` baseline opened in another tab).
5. **Console check.** `mcp__Claude_Preview__preview_console_logs` — no errors/warnings.
6. If any item fails, file a follow-up in the same doc under a `## QA findings` section and fix before closing N2.

---

## Phase ordering & branches

Branch `n2/fixes`. Commit per phase for independent rollback:

1. `phase-0-motion-revert`
2. `phase-1-design-language` (tokens + shared classes, no visual change yet beyond tokenizing)
3. `phase-2-landing-cleanup`
4. `phase-3-picker-cleanup`
5. `phase-4-subline-dot`
6. `phase-5-mobile-stack`
7. `phase-6-tweaks-panel`
8. `phase-7-palette-names`
9. `phase-8-qa` (only fix commits if QA surfaces anything)

Tag `N2` after QA passes. Keep `N1-final`.

---

## Confirmed decisions

1. Tweaks: heading `Controls`, no secondary copy.
2. Palettes: Meadow / Ember / Tide.
3. Tweaks toggle hides while panel is open; panel's `×` is the sole close.
4. `.veil-rule` kept but redesigned (Phase 1.6 bracketed rule).
