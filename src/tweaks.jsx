import { PALETTES } from './palettes.js'

const SLIDERS = [
  { key: 'density',     label: 'Density',      min: 0.3, max: 3.0, step: 0.05, fmt: v => v.toFixed(2) },
  { key: 'bladeLength', label: 'Blade Length',  min: 40,  max: 180, step: 2,    fmt: v => v },
  { key: 'wind',        label: 'Wind',          min: 0,   max: 1,   step: 0.01, fmt: v => v.toFixed(2) },
]

const PALS = [
  { id: 'midnight', sw: ['#1a2218','#3a4a2e','#5e7747','#9bbf6e'] },
  { id: 'ember',    sw: ['#1a1208','#3a2210','#7a4a18','#c78940'] },
  { id: 'abyss',    sw: ['#0d1228','#1f2a4a','#3d567a','#7ea7d8'] },
]

export default function TweaksPanel({ open, state, onChange, onClose }) {
  const set = (k, v) => onChange({ ...state, [k]: v })

  return (
    <div className={`tweaks ${open ? 'on' : ''}`}>
      {/* Role B: bracket-only corners */}
      <span className="pc tl" /><span className="pc tr" />
      <span className="pc bl" /><span className="pc br" />

      {/* Drag handle — visible on mobile bottom sheet only */}
      <div className="sheet-handle" />

      {/* Close — 40×40 chip, proper touch target */}
      <button className="tweaks-close chip" aria-label="Close field settings" onClick={onClose}>×</button>

      {/* Heading — no rule under it */}
      <div className="tweaks-heading">Field settings</div>

      {/* Sliders */}
      {SLIDERS.map(({ key, label, min, max, step, fmt }) => (
        <div key={key} className="tweak-row">
          <div className="tweak-label-row">
            <span className="spec">{label}</span>
            <span className="data">{fmt(state[key])}</span>
          </div>
          <div className="tweak-track-wrap">
            <span className="data-faint tweak-bound">{min}</span>
            <input
              type="range" min={min} max={max} step={step}
              value={state[key]}
              onChange={e => set(key, +e.target.value)}
            />
            <span className="data-faint tweak-bound">{max}</span>
          </div>
        </div>
      ))}

      {/* Palette */}
      <div className="palette-section-label spec">Palette</div>
      <div className="palette-row">
        {PALS.map(p => (
          <button
            key={p.id}
            className={`palette-tile ${state.palette === p.id ? 'active' : ''}`}
            onClick={() => set('palette', p.id)}
          >
            <div className="palette-swatches">
              {p.sw.map((s, i) => <span key={i} style={{ background: s }} />)}
            </div>
            <span className="spec palette-tile-label">{PALETTES[p.id].name.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
