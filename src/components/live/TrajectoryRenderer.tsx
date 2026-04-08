'use client'
import { useRef, useEffect } from 'react'
import { useLiveInferenceStore } from '@/store/liveInferenceStore'
import { BEV } from '@/scene/modelConstants'

const CANVAS_SIZE = 512

export function TrajectoryRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { result, uploadedImage } = useLiveInferenceStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw BEV background if available
    if (uploadedImage) {
      const img = new Image()
      img.onload = () => {
        ctx.globalAlpha = 0.5
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
        ctx.globalAlpha = 1
        drawTrajectory(ctx, result.trajectory)
      }
      img.src = uploadedImage
    } else {
      drawTrajectory(ctx, result.trajectory)
    }
  }, [result, uploadedImage])

  if (!result) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-mono text-muted">Predicted Trajectory</h3>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full aspect-square rounded border border-border bg-bg"
      />
    </div>
  )
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  trajectory: { x: number; y: number; t: number }[]
) {
  const scale = CANVAS_SIZE / BEV.EXTENT_METERS
  const cx = CANVAS_SIZE / 2
  const cy = CANVAS_SIZE / 2

  // Ego marker
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Path line
  ctx.beginPath()
  trajectory.forEach((p, i) => {
    const px = cx + p.x * scale
    const py = cy - p.y * scale
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.strokeStyle = '#F03E3E'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Waypoint dots
  trajectory.forEach((p, i) => {
    const px = cx + p.x * scale
    const py = cy - p.y * scale
    ctx.beginPath()
    ctx.arc(px, py, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#F03E3E'
    ctx.fill()

    // Time label
    ctx.fillStyle = '#cccccc'
    ctx.font = '10px monospace'
    ctx.fillText(`${p.t.toFixed(1)}s`, px + 6, py - 4)
  })
}
