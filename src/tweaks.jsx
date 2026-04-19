import { PALETTES } from './palettes.js'

export default function TweaksPanel({ open, state, onChange, onClose }) {
  const set = (k, v) => onChange({ ...state, [k]: v })

  const sliders = [
    { key: 'density',     label: 'Density',      min: 0.3, max: 3.0, step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'bladeLength', label: 'Blade length', min: 40,  max: 180, step: 2,    fmt: v => v },
    { key: 'wind',        label: 'Wind',         min: 0,   max: 1,   step: 0.01, fmt: v => v.toFixed(2) },
  ]

  const pals = [
    { id: 'midnight', sw: ['#1a2218','#3a4a2e','#5e7747','#9bbf6e'] },
    { id: 'ember',    sw: ['#1a1208','#3a2210','#7a4a18','#c78940'] },
    { id: 'abyss',    sw: ['#0d1228','#1f2a4a','#3d567a','#7ea7d8'] },
  ]

  return (
    <div className={`tweaks ${open ? 'on' : ''}`}>
      <span className="pc tl" /><span className="pc tr" />
      <span className="pc bl" /><span className="pc br" />
      <button className="tweaks-close" aria-label="Close" onClick={onClose}>×</button>

      <h3>Controls</h3>
      <div className="tweaks-rule" />

      {sliders.map(({ key, label, min, max, step, fmt }) => (
        <div key={key} className="tweak-row">
          <label>{label} <b>{fmt(state[key])}</b></label>
          <input
            type="range" min={min} max={max} step={step}
            value={state[key]}
            onChange={e => set(key, +e.target.value)}
          />
        </div>
      ))}

      <div className="tweak-row" style={{ marginTop: 16 }}>
        <label style={{ marginBottom: 10 }}>Palette</label>
        <div className="palette-row">
          {pals.map(p => (
            <button
              key={p.id}
              className={state.palette === p.id ? 'active' : ''}
              onClick={() => set('palette', p.id)}
            >
              <span className="swatches">
                {p.sw.map((s, i) => <span key={i} style={{ background: s }} />)}
              </span>
              {PALETTES[p.id].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
