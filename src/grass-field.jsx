import { useRef, useEffect, useCallback } from 'react'

// Spatial hash cell size — balances lookup cost vs grid overhead
const CELL = 128
// Hand influence radius
const IR = 210
const IR2 = IR * IR
const MAX_BEND = 1.4

// ── Spatial hash helpers ──────────────────────────────────────────────────────
function buildGrid(blades) {
  const grid = new Map()
  for (let i = 0; i < blades.length; i++) {
    const b = blades[i]
    const key = Math.floor(b.x / CELL) * 10000 + Math.floor(b.y / CELL)
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(i)
  }
  return grid
}

function collectNearby(grid, hx, hy) {
  const result = []
  const cx = Math.floor(hx / CELL)
  const cy = Math.floor(hy / CELL)
  const r = Math.ceil(IR / CELL) + 1
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      const key = (cx + dx) * 10000 + (cy + dy)
      const cell = grid.get(key)
      if (cell) for (const idx of cell) result.push(idx)
    }
  }
  return result
}

// ── Build blade list ──────────────────────────────────────────────────────────
function buildBlades(w, h, density, bladeLength) {
  const n = Math.round((w * h / 1000) * density)
  const arr = new Array(n)
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const depth = Math.pow(Math.max(0, Math.min(1, y / h)), 0.85)
    const len = bladeLength * (0.40 + depth * 1.15) * (0.78 + Math.random() * 0.50)
    const restAngle = (Math.random() - 0.5) * 0.30
    arr[i] = {
      x, y, depth, len,
      maxW:      2.5 + depth * 8.0 + Math.random() * 2.0,
      shade:     Math.random(),
      restAngle,
      curl:      (Math.random() - 0.5) * 0.40,
      bellyPos:  0.28 + Math.random() * 0.18,
      angle:     restAngle, vAngle: 0,
      phase:     Math.random() * Math.PI * 2,
      phase2:    Math.random() * Math.PI * 2,
      stiffness: 0.014 + Math.random() * 0.020,
      damping:   0.90  + Math.random() * 0.05,
      mass:      0.6   + Math.random() * 0.8,
    }
  }
  arr.sort((a, b) => a.y - b.y)
  return arr
}

// ── Blade half-width profile (leaf shape) ─────────────────────────────────────
function halfW(t, bp, maxW) {
  const k = t < bp ? t / bp : (1 - t) / (1 - bp)
  return k * k * (3 - 2 * k) * maxW * 0.5
}

// ── Color lookup ──────────────────────────────────────────────────────────────
function pickColor(shade, depth, shades) {
  const bias = Math.max(0, 1 - depth) * 0.45
  const adj = Math.min(0.999, shade * (1 - bias) + bias)
  return shades[Math.min(shades.length - 1, Math.floor(adj * shades.length))]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GrassField({ palette, density, bladeLength, wind, paused, handRef, onStats }) {
  const canvasRef  = useRef(null)
  const bladesRef  = useRef([])
  const gridRef    = useRef(new Map())
  const sizeRef    = useRef({ w: 0, h: 0 })
  const rafRef     = useRef(0)
  const histRef    = useRef([])

  // Fixed 5 segments — same on all devices now (density handles perf, not segment count)
  const SEGS = 5

  const rebuild = useCallback((w, h) => {
    const blades = buildBlades(w, h, density, bladeLength)
    bladesRef.current = blades
    gridRef.current   = buildGrid(blades)
    sizeRef.current   = { w, h }
    onStats?.({ bladeCount: blades.length })
  }, [density, bladeLength, onStats])

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onResize = () => {
      const dpr  = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width  = Math.floor(rect.width  * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
      rebuild(rect.width, rect.height)
    }
    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [rebuild])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop)
      if (paused) return

      const { w, h } = sizeRef.current
      const blades = bladesRef.current
      const hand   = handRef.current

      // Hand velocity for push-strength scaling
      const hist = histRef.current
      if (hand?.active) {
        hist.push({ x: hand.x, y: hand.y, t: ts })
        if (hist.length > 5) hist.shift()
      } else { hist.length = 0 }
      let handSpeed = 0
      if (hist.length >= 2) {
        const a = hist[0], b = hist[hist.length - 1]
        const dth = Math.max(0.001, (b.t - a.t) / 1000)
        handSpeed = Math.hypot((b.x - a.x) / dth, (b.y - a.y) / dth)
      }
      const push = 1.8 + Math.min(1.5, handSpeed * 0.002)

      // Wind params
      const wt    = ts / 1000
      const wSlow = 0.35 + wind * 0.45
      const wFast = 1.60 + wind * 1.20
      const wStr  = 0.04 + wind * 0.22

      // Spatial hash: collect blade indices near the hand
      const nearSet = new Set()
      if (hand?.active) {
        const nearby = collectNearby(gridRef.current, hand.x, hand.y)
        for (const idx of nearby) nearSet.add(idx)
      }

      // ── Background
      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, w, h)

      // ── Blade physics + draw
      for (let i = 0; i < blades.length; i++) {
        const b = blades[i]

        // Wind sway
        const wTarget =
          (Math.sin(wt * wSlow + b.phase  + b.x * 0.004) +
           Math.sin(wt * wFast + b.phase2 + b.x * 0.012) * 0.35) * wStr

        // Hand influence — only computed for spatially-nearby blades
        let handTarget = 0
        if (nearSet.has(i) && hand?.active) {
          const dx = b.x - hand.x, dy = b.y - hand.y
          const d2 = dx * dx + dy * dy
          if (d2 < IR2) {
            const d = Math.sqrt(d2) + 1e-4
            const u = 1 - d / IR
            handTarget = (dx / d) * u * u * (3 - 2 * u) * push
          }
        }

        const tgt = Math.max(-MAX_BEND, Math.min(MAX_BEND, b.restAngle + wTarget + handTarget))

        const accel = ((tgt - b.angle) * b.stiffness) / b.mass
        b.vAngle = (b.vAngle + accel) * b.damping
        b.angle += b.vAngle

        // ── Build smooth centerline (multi-segment spline)
        const pts = new Array(SEGS + 1)
        pts[0] = { x: b.x, y: b.y }
        for (let s = 1; s <= SEGS; s++) {
          const t   = s / SEGS
          const tSm = t * t * (3 - 2 * t)
          pts[s] = {
            x: b.x + Math.sin(b.angle * tSm) * b.len * t + b.curl * tSm * b.len * 0.18,
            y: b.y - Math.cos(b.angle * tSm) * b.len * t * 0.97,
          }
        }
        const tipX = pts[SEGS].x, tipY = pts[SEGS].y

        // ── Perpendicular side arrays
        const L = new Array(SEGS + 1)
        const R = new Array(SEGS + 1)
        for (let s = 0; s <= SEGS; s++) {
          const p0 = pts[Math.max(0, s - 1)]
          const p1 = pts[Math.min(SEGS, s + 1)]
          const tx = p1.x - p0.x, ty = p1.y - p0.y
          const tl = Math.hypot(tx, ty) || 1
          const px = -ty / tl, py = tx / tl
          const hw = halfW(s / SEGS, b.bellyPos, b.maxW)
          L[s] = { x: pts[s].x + px * hw, y: pts[s].y + py * hw }
          R[s] = { x: pts[s].x - px * hw, y: pts[s].y - py * hw }
        }

        // ── Draw filled blade
        const alpha = 0.40 + b.depth * 0.55
        ctx.globalAlpha = alpha
        ctx.fillStyle = pickColor(b.shade, b.depth, palette.shades)
        ctx.beginPath()
        ctx.moveTo(L[0].x, L[0].y)
        for (let s = 1; s <= SEGS; s++) {
          ctx.quadraticCurveTo(L[s-1].x, L[s-1].y, (L[s-1].x + L[s].x) * 0.5, (L[s-1].y + L[s].y) * 0.5)
        }
        ctx.lineTo(tipX, tipY)
        for (let s = SEGS; s >= 1; s--) {
          ctx.quadraticCurveTo(R[s].x, R[s].y, (R[s].x + R[s-1].x) * 0.5, (R[s].y + R[s-1].y) * 0.5)
        }
        ctx.closePath()
        ctx.fill()

        // ── Spine highlight (mid/close blades)
        if (b.depth > 0.30 && b.maxW > 2.2) {
          ctx.globalAlpha = alpha * 0.45
          ctx.strokeStyle = palette.spine
          ctx.lineWidth = 0.55
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let s = 1; s <= SEGS; s++) {
            ctx.quadraticCurveTo(pts[s-1].x, pts[s-1].y, (pts[s-1].x + pts[s].x) * 0.5, (pts[s-1].y + pts[s].y) * 0.5)
          }
          ctx.lineTo(tipX, tipY)
          ctx.stroke()
        }
      }

      // ── Horizon fog
      ctx.globalAlpha = 1
      const fog = ctx.createLinearGradient(0, 0, 0, h * 0.60)
      fog.addColorStop(0,    palette.horizon)
      fog.addColorStop(0.45, palette.horizonMid)
      fog.addColorStop(1,    'oklch(0 0 0 / 0)')
      ctx.fillStyle = fog
      ctx.fillRect(0, 0, w, h * 0.60)

      // ── Vignette
      const vig = ctx.createRadialGradient(w/2, h*0.68, Math.min(w,h)*0.25, w/2, h*0.68, Math.max(w,h)*0.85)
      vig.addColorStop(0, 'oklch(0 0 0 / 0)')
      vig.addColorStop(1, palette.vignette)
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      // ── Warm hand tint
      if (hand?.active) {
        const rg = ctx.createRadialGradient(hand.x, hand.y, 0, hand.x, hand.y, 160)
        rg.addColorStop(0,   palette.handTint)
        rg.addColorStop(0.7, 'oklch(0 0 0 / 0)')
        rg.addColorStop(1,   'oklch(0 0 0 / 0)')
        ctx.globalCompositeOperation = 'overlay'
        ctx.fillStyle = rg
        ctx.beginPath()
        ctx.arc(hand.x, hand.y, 160, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.globalAlpha = 1
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [palette, wind, paused, handRef])

  return <canvas ref={canvasRef} className="grass" />
}
