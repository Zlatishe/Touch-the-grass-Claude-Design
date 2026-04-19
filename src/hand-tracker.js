// hand-tracker.js
// MediaPipe Tasks Vision — HandLandmarker
// Enhancements vs baseline:
//   • One-Euro filter on x,y → eliminates jitter on still hands, preserves fast swipes
//   • Tracks index fingertip (landmark 8), not palm centroid — more intuitive pointing
//   • Gesture detection: open hand = active, closed fist = lifts off the grass
//   • Skeleton overlay drawn on an optional <canvas> element
//   • GPU → CPU delegate fallback for broad mobile support
//   • 30fps throttle on mobile (saves battery; grass doesn't need 60fps from the tracker)

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const VISION_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'

// Hand skeleton connections (MediaPipe standard)
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [0,9],[9,10],[10,11],[11,12],  // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17],          // palm arc
]

// ── One-Euro Filter ──────────────────────────────────────────────────────────
// Adaptive low-pass: slow movement → heavy smoothing, fast movement → passes through.
// Reference: Casiez et al. 2012. minCutoff=1.0, beta=0.007 good for hand tracking.
function makeOneEuroFilter(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
  let freq = 60, xPrev = null, dxPrev = 0, lastTs = null

  const alpha = (cutoff) => {
    const te = 1 / freq
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / te)
  }
  const lp = (prev, a, x) => (prev === null ? x : a * x + (1 - a) * prev)

  return {
    filter(x, ts) {
      if (lastTs !== null) {
        const dt = (ts - lastTs) / 1000
        if (dt > 0) freq = 1 / dt
      }
      lastTs = ts
      const dx = xPrev === null ? 0 : (x - xPrev) * freq
      dxPrev = lp(dxPrev, alpha(dCutoff), dx)
      const cutoff = minCutoff + beta * Math.abs(dxPrev)
      xPrev = lp(xPrev, alpha(cutoff), x)
      return xPrev
    },
    reset() { xPrev = null; dxPrev = 0; lastTs = null },
  }
}

// ── Gesture detection ────────────────────────────────────────────────────────
// "Open" = index finger tip (8) is extended past its PIP (6) relative to wrist (0).
// We check all four non-thumb fingers; need ≥2 extended to count as open.
function isHandOpen(pts) {
  const wrist = pts[0]
  // Per-finger: [tip, pip, mcp]
  const fingers = [
    [8, 6, 5],   // index
    [12, 10, 9], // middle
    [16, 14, 13],// ring
    [20, 18, 17],// pinky
  ]
  let extended = 0
  for (const [tip, , mcp] of fingers) {
    const tipDist = Math.hypot(pts[tip].x - wrist.x, pts[tip].y - wrist.y)
    const mcpDist = Math.hypot(pts[mcp].x - wrist.x, pts[mcp].y - wrist.y)
    if (tipDist > mcpDist * 1.1) extended++
  }
  return extended >= 2
}

// ── Skeleton drawing ─────────────────────────────────────────────────────────
function drawSkeleton(sketchEl, pts) {
  const ctx = sketchEl.getContext('2d')
  const w = sketchEl.offsetWidth, h = sketchEl.offsetHeight
  if (!w || !h) return
  sketchEl.width = w
  sketchEl.height = h
  ctx.clearRect(0, 0, w, h)

  // Connections
  ctx.strokeStyle = 'oklch(0.55 0.12 115 / 0.65)'
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath()
    ctx.moveTo(pts[a].x * w, pts[a].y * h)
    ctx.lineTo(pts[b].x * w, pts[b].y * h)
    ctx.stroke()
  }

  // Landmark dots
  for (let i = 0; i < pts.length; i++) {
    const isIndexTip = i === 8
    ctx.fillStyle = isIndexTip
      ? 'oklch(0.80 0.16 115)'
      : 'oklch(0.58 0.10 115 / 0.75)'
    ctx.beginPath()
    ctx.arc(pts[i].x * w, pts[i].y * h, isIndexTip ? 5 : 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
async function loadVision() {
  try {
    const src = `import * as m from "${VISION_CDN}"; export const mod = m;`
    const blob = new Blob([src], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    try { return (await import(url)).mod } finally { URL.revokeObjectURL(url) }
  } catch (_) {
    return import(VISION_CDN)
  }
}

/**
 * startHandTracker({ videoEl, sketchEl?, onFrame, onError, onReady, onStatus })
 *
 * onFrame({ x, y, active, open }) — normalized [0..1] coords, x is mirrored
 * onStatus('loading'|'on'|'no-hand'|'error') — for UI state
 * sketchEl — optional <canvas> overlaid on the video for skeleton drawing
 *
 * Returns a stop() function.
 */
export async function startHandTracker({ videoEl, sketchEl, onFrame, onError, onReady, onStatus }) {
  let stream = null, landmarker = null, stopped = false, lastTs = -1
  const isMobile = navigator.maxTouchPoints > 1 || window.innerWidth < 640
  const FRAME_INTERVAL = isMobile ? 33 : 0 // ~30fps on mobile, uncapped on desktop

  // Gesture debounce
  let openFrames = 0, closedFrames = 0
  let currentOpen = true
  const DEBOUNCE = 3

  // No-hand timeout
  let noHandTs = null
  const NO_HAND_WARN_MS = 3000

  // One-Euro filters for x and y
  const filterX = makeOneEuroFilter(1.0, 0.007)
  const filterY = makeOneEuroFilter(1.0, 0.007)

  try {
    onStatus?.('loading')
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    videoEl.srcObject = stream
    videoEl.setAttribute('playsinline', '')
    videoEl.muted = true
    await videoEl.play()

    const vision = await loadVision()
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL)

    try {
      landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        numHands: 1,
        runningMode: 'VIDEO',
      })
    } catch (_) {
      landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        numHands: 1,
        runningMode: 'VIDEO',
      })
    }

    onReady?.()
    onStatus?.('on')
    let lastFrameTs = 0

    const loop = () => {
      if (stopped) return
      requestAnimationFrame(loop)
      const ts = performance.now()
      if (videoEl.readyState < 2 || ts === lastTs) return
      if (ts - lastFrameTs < FRAME_INTERVAL) return
      lastFrameTs = ts
      lastTs = ts

      let result
      try { result = landmarker.detectForVideo(videoEl, ts) } catch (_) { return }

      if (!result?.landmarks?.length) {
        // No hand detected
        if (noHandTs === null) noHandTs = ts
        else if (ts - noHandTs > NO_HAND_WARN_MS) onStatus?.('no-hand')
        if (sketchEl) {
          const ctx = sketchEl.getContext('2d')
          ctx.clearRect(0, 0, sketchEl.width, sketchEl.height)
        }
        filterX.reset()
        filterY.reset()
        onFrame?.(null)
        return
      }

      noHandTs = null
      onStatus?.('on')
      const pts = result.landmarks[0]

      // Draw skeleton on the overlay canvas
      if (sketchEl) drawSkeleton(sketchEl, pts)

      // Gesture: open or closed
      const handOpen = isHandOpen(pts)
      if (handOpen) { openFrames++; closedFrames = 0 }
      else { closedFrames++; openFrames = 0 }
      if (openFrames >= DEBOUNCE) currentOpen = true
      if (closedFrames >= DEBOUNCE) currentOpen = false

      // Index fingertip (landmark 8), x mirrored for natural left/right
      const raw = pts[8]
      const x = filterX.filter(1 - raw.x, ts)
      const y = filterY.filter(raw.y, ts)

      const confidence = result.handednesses?.[0]?.[0]?.score ?? 0
      onFrame?.({ x, y, active: currentOpen, open: currentOpen, confidence, landmarkCount: pts.length })
    }
    loop()
  } catch (e) {
    const msg = e.message || String(e)
    onStatus?.('error')
    onError?.(msg)
  }

  return () => {
    stopped = true
    stream?.getTracks().forEach((t) => t.stop())
    try { landmarker?.close() } catch (_) {}
    filterX.reset()
    filterY.reset()
  }
}
