import React from 'react'
import { PALETTES } from './palettes.js'

const MODE_LABEL = { cursor: 'TOUCH', camera: 'CAMERA', keys: 'KEYS' }

/**
 * StatusStrip — bottom-left specimen annotation bar.
 * Shows: INPUT · PALETTE · FPS · CONF (camera mode only)
 */
export default function StatusStrip({ inputMode, palette, fps, confidence, camTracking }) {
  const paletteName = PALETTES[palette]?.name?.toUpperCase() ?? palette.toUpperCase()
  const modeLabel = MODE_LABEL[inputMode] ?? inputMode.toUpperCase()

  const confStr =
    confidence > 0
      ? '.' + Math.round(confidence * 100).toString().padStart(2, '0')
      : null

  return (
    <div className="status-strip">
      <span className="spec">Input</span>
      <span className="data strip-val">{modeLabel}</span>

      <span className="strip-sep">·</span>
      <span className="spec">Palette</span>
      <span className="data strip-val">{paletteName}</span>

      {fps !== null && (
        <>
          <span className="strip-sep">·</span>
          <span className="spec">FPS</span>
          <span className="data strip-val">{fps}</span>
        </>
      )}

      {inputMode === 'camera' && camTracking && confStr && (
        <>
          <span className="strip-sep">·</span>
          <span className="spec">Conf</span>
          <span className="data strip-val">{confStr}</span>
        </>
      )}
    </div>
  )
}
