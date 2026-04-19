import React, { useState, useEffect, useRef } from 'react'
import GrassField from './grass-field.jsx'
import TweaksPanel from './tweaks.jsx'
import StatusStrip from './status-strip.jsx'
import { startHandTracker } from './hand-tracker.js'
import { PALETTES } from './palettes.js'
import { useFps } from './use-fps.js'

const DEFAULTS = { density: 3.4, bladeLength: 130, wind: 0.22, palette: 'midnight' }

const isTouchDevice = () => navigator.maxTouchPoints > 1 || 'ontouchstart' in window

// Hide Keys mode on touch-only devices (no keyboard available)
const ALL_MODES = [
  { id: 'cursor', label: 'Touch' },
  { id: 'camera', label: 'Camera' },
  { id: 'keys',   label: 'Keys' },
]

const CAM_STATUS_LABEL = {
  loading:  'Loading model…',
  on:       'Tracking',
  'no-hand':'Show your hand',
  off:      'Off',
  error:    'Error',
}

export default function App() {
  const [entered,    setEntered]    = useState(false)
  const [inputMode,  setInputMode]  = useState('cursor')
  const [camStatus,  setCamStatus]  = useState('off')
  const [camError,   setCamError]   = useState('')
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [cfg,        setCfg]        = useState(DEFAULTS)
  const [handConf,   setHandConf]   = useState(0)

  const fps = useFps()

  const handRef    = useRef({ x: -9999, y: -9999, active: false })
  const cursorRef  = useRef(null)
  const videoRef   = useRef(null)
  const sketchRef  = useRef(null)
  const camDotRef  = useRef(null)
  const camStopRef = useRef(null)
  const keyRef     = useRef({ x: 0.5, y: 0.65, vx: 0, vy: 0, keys: new Set() })

  const modes = isTouchDevice()
    ? ALL_MODES.filter(m => m.id !== 'keys')
    : ALL_MODES

  const moveRing = (x, y) => {
    if (!cursorRef.current) return
    cursorRef.current.style.left    = x + 'px'
    cursorRef.current.style.top     = y + 'px'
    cursorRef.current.style.opacity = '1'
  }
  const hideRing = () => {
    if (cursorRef.current) cursorRef.current.style.opacity = '0'
  }

  // ── cursor / touch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!entered || inputMode !== 'cursor') return
    const show = (x, y) => { handRef.current = { x, y, active: true }; moveRing(x, y) }
    const hide = () => { handRef.current = { ...handRef.current, active: false }; hideRing() }
    const onMouse = e => show(e.clientX, e.clientY)
    const onTouch = e => { if (e.touches?.length) show(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove',   onMouse)
    window.addEventListener('mouseleave',  hide)
    window.addEventListener('touchstart',  onTouch, { passive: true })
    window.addEventListener('touchmove',   onTouch, { passive: true })
    window.addEventListener('touchend',    hide)
    window.addEventListener('touchcancel', hide)
    return () => {
      window.removeEventListener('mousemove',   onMouse)
      window.removeEventListener('mouseleave',  hide)
      window.removeEventListener('touchstart',  onTouch)
      window.removeEventListener('touchmove',   onTouch)
      window.removeEventListener('touchend',    hide)
      window.removeEventListener('touchcancel', hide)
    }
  }, [inputMode, entered])

  // ── keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!entered || inputMode !== 'keys') return
    const st = keyRef.current
    const KEYS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d']
    const down = e => { if (KEYS.includes(e.key)) { st.keys.add(e.key); e.preventDefault() } }
    const up   = e => st.keys.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const k = st.keys
      const ax = (k.has('ArrowRight') || k.has('d') ? 1 : 0) - (k.has('ArrowLeft') || k.has('a') ? 1 : 0)
      const ay = (k.has('ArrowDown')  || k.has('s') ? 1 : 0) - (k.has('ArrowUp')   || k.has('w') ? 1 : 0)
      st.vx = st.vx * 0.88 + ax * 0.006
      st.vy = st.vy * 0.88 + ay * 0.006
      st.x  = Math.max(0.02, Math.min(0.98, st.x + st.vx))
      st.y  = Math.max(0.25, Math.min(0.95, st.y + st.vy))
      const px = st.x * window.innerWidth, py = st.y * window.innerHeight
      handRef.current = { x: px, y: py, active: true }
      moveRing(px, py)
    }
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); cancelAnimationFrame(raf) }
  }, [inputMode, entered])

  // ── camera ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!entered) return
    if (inputMode !== 'camera') {
      camStopRef.current?.(); camStopRef.current = null
      setCamStatus('off'); return
    }
    setCamStatus('loading'); setCamError('')
    startHandTracker({
      videoEl:  videoRef.current,
      sketchEl: sketchRef.current,
      onReady:  () => {},
      onStatus: (s) => setCamStatus(s),
      onError:  (msg) => { setCamStatus('error'); setCamError(msg || 'Camera error') },
      onFrame:  (hand) => {
        if (!hand || !hand.active) {
          handRef.current = { ...handRef.current, active: false }
          if (camDotRef.current)  camDotRef.current.style.opacity  = '0'
          setHandConf(0)
          hideRing(); return
        }
        const px = hand.x * window.innerWidth
        const py = hand.y * window.innerHeight
        handRef.current = { x: px, y: py, active: true }
        setHandConf(hand.confidence ?? 0)
        moveRing(px, py)
        if (camDotRef.current) {
          camDotRef.current.style.left    = hand.x * 100 + '%'
          camDotRef.current.style.top     = hand.y * 100 + '%'
          camDotRef.current.style.opacity = '1'
        }
      },
    }).then(stop => { camStopRef.current = stop })
    return () => { camStopRef.current?.(); camStopRef.current = null }
  }, [inputMode, entered])

  // ── cursor style ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = entered ? 'none' : 'default'
  }, [entered])

  // ── edit-mode bridge (design tool integration) ────────────────────────────
  useEffect(() => {
    const onMsg = e => {
      if (!e.data?.type) return
      if (e.data.type === '__activate_edit_mode')   setTweaksOpen(true)
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false)
    }
    window.addEventListener('message', onMsg)
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*') } catch (_) {}
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const handleCfg = next => {
    setCfg(next)
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*') } catch (_) {}
  }

  const palette = PALETTES[cfg.palette] || PALETTES.midnight
  const camTracking = camStatus === 'on' || camStatus === 'no-hand'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GrassField
        palette={palette}
        density={cfg.density}
        bladeLength={cfg.bladeLength}
        wind={cfg.wind}
        paused={!entered}
        handRef={handRef}
      />

      {/* Cursor ring → bracket frame */}
      <div ref={cursorRef} className="cursor-ring" style={{ opacity: 0 }}>
        <span className="cr tl" /><span className="cr tr" />
        <span className="cr bl" /><span className="cr br" />
      </div>

      {/* ── UI chrome ─────────────────────────────────────────────────────── */}
      <div className="chrome">

        {/* Wordmark — 32px, rule, 16px subline */}
        <div className="wordmark">
          Touch the grass
          <div className="wordmark-rule" />
          <span className="sub">An interactive field · 2026</span>
        </div>

        {/* Mode picker */}
        <div className="picker-wrap">
          <div className="input-picker" role="tablist">
            {modes.map(({ id, label }, i) => (
              <React.Fragment key={id}>
                {i > 0 && <span className="sep">·</span>}
                <button
                  role="tab"
                  aria-selected={inputMode === id}
                  className={inputMode === id ? 'active' : ''}
                  onClick={() => setInputMode(id)}
                >
                  {label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Camera panel — Role B: bracket-only, ink status */}
        {inputMode === 'camera' && (
          <div className="cam-panel">
            <span className="pc tl" /><span className="pc tr" />
            <span className="pc bl" /><span className="pc br" />
            <div className="cam-video-wrap">
              <span className="vc tl" /><span className="vc tr" />
              <span className="vc bl" /><span className="vc br" />
              <video ref={videoRef} playsInline muted />
              <canvas ref={sketchRef} className="cam-sketch" />
              <div ref={camDotRef} className="hand-dot" style={{ opacity: 0 }} />
            </div>
            <div className="cam-status-strip">
              <span className={`cam-track-dot ${camTracking ? 'on' : ''}`} />
              <span className="spec">Mode</span>
              <span className="data">
                {camStatus === 'loading' ? 'INIT' : camTracking ? 'TRACK' : 'WAIT'}
              </span>
              <span className="cam-sep">·</span>
              <span className="spec">Hands</span>
              <span className="data">{camTracking ? '01' : '00'}</span>
              {handConf > 0 && (
                <>
                  <span className="cam-sep">·</span>
                  <span className="spec">Conf</span>
                  <span className="data">
                    .{Math.round(handConf * 100).toString().padStart(2, '0')}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Camera error — ink-only toast */}
        {camStatus === 'error' && inputMode === 'camera' && (
          <div className="error-toast">
            <span className="spec">ERR</span>
            Camera unavailable — {camError}
          </div>
        )}

        {/* Tweaks panel */}
        <TweaksPanel open={tweaksOpen} state={cfg} onChange={handleCfg} onClose={() => setTweaksOpen(false)} />

        {/* Tweaks toggle — hidden while panel is open; close lives inside the panel */}
        {!tweaksOpen && (
          <button
            className="tweaks-toggle"
            onClick={() => setTweaksOpen(true)}
            aria-label="Open controls"
          >
            <span className="cc tl" /><span className="cc tr" />
            <span className="cc bl" /><span className="cc br" />
            Controls
          </button>
        )}

        {/* Status strip — bottom-left specimen annotation */}
        {entered && (
          <StatusStrip
            inputMode={inputMode}
            palette={cfg.palette}
            fps={fps}
            confidence={handConf}
            camTracking={camTracking}
          />
        )}
      </div>

      {/* ── Intro veil — asymmetric specimen sheet ───────────────────────── */}
      <div className={`veil ${entered ? 'hidden' : ''}`}>
        {/* Screen-corner brackets */}
        <div className="veil-corner tl" />
        <div className="veil-corner tr" />
        <div className="veil-corner bl" />
        <div className="veil-corner br" />

        {/* Row 1: sequence tag (left) + artifact tag (right) */}
        <span className="veil-seq">01 ─</span>
        <span className="veil-artifact">[TTG-01]</span>

        {/* Row 2: huge title (left) + inputs specimen (right) */}
        <h1>Touch<br />the<br />grass</h1>
        <div className="veil-inputs">
          <span className="spec">Inputs</span>
          <div className="veil-input-list">
            {modes.map(m => <span key={m.id}>─ {m.label}</span>)}
          </div>
        </div>

        {/* Row 3: full-width bracketed rule with label */}
        <div className="veil-rule">
          <span className="veil-rule-label">2026 · An interactive field</span>
        </div>

        {/* Row 4: CTA (left) + build tag (right) */}
        <button className="cta-btn" onClick={() => setEntered(true)}>
          <span className="cc tl" /><span className="cc tr" />
          <span className="cc bl" /><span className="cc br" />
          Wander the field
        </button>
        <span className="veil-build">N3</span>
      </div>
    </div>
  )
}
