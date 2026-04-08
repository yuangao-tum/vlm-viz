'use client'
import { useRef, useEffect } from 'react'
import { useLiveInferenceStore } from '@/store/liveInferenceStore'
import { viridis } from '@/lib/three/colormap'

const CANVAS_SIZE = 512

export function AttentionHeatmapOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { result, selectedLayer, selectedHead, uploadedImage } = useLiveInferenceStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw background image
    if (uploadedImage) {
      const img = new Image()
      img.onload = () => {
        ctx.globalAlpha = 0.4
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
        ctx.globalAlpha = 1
        drawHeatmap(ctx)
      }
      img.src = uploadedImage
    } else {
      drawHeatmap(ctx)
    }

    function drawHeatmap(ctx: CanvasRenderingContext2D) {
      // Determine which attention data to use
      const vitKeys = Object.keys(result!.vit_attentions).map(Number).sort((a, b) => a - b)
      const llmKeys = Object.keys(result!.llm_attentions).map(Number).sort((a, b) => a - b)
      const allKeys = [...vitKeys.map(k => ({ type: 'vit' as const, k })), ...llmKeys.map(k => ({ type: 'llm' as const, k }))]
      const entry = allKeys[selectedLayer]
      if (!entry) return

      const attnData = entry.type === 'vit'
        ? result!.vit_attentions[String(entry.k)]
        : result!.llm_attentions[String(entry.k)]
      if (!attnData) return

      const head = Math.min(selectedHead, attnData.num_heads - 1)
      const weights = attnData.weights[head]
      if (!weights) return

      const gridSize = Math.sqrt(weights.length)
      if (gridSize !== Math.floor(gridSize)) return

      // Average attention received by each position (column-wise sum)
      const cellSize = CANVAS_SIZE / gridSize
      for (let i = 0; i < gridSize; i++) {
        let total = 0
        for (let j = 0; j < gridSize; j++) {
          total += weights[j]?.[i] ?? 0
        }
        const normalized = total / gridSize
        const [r, g, b] = viridis(normalized)
        const x = (i % Math.ceil(Math.sqrt(gridSize))) * cellSize
        const y = Math.floor(i / Math.ceil(Math.sqrt(gridSize))) * cellSize
        ctx.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, 0.6)`
        ctx.fillRect(x, y, cellSize, cellSize)
      }
    }
  }, [result, selectedLayer, selectedHead, uploadedImage])

  if (!result) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-mono text-muted">Attention Heatmap</h3>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full aspect-square rounded border border-border bg-bg"
      />
    </div>
  )
}
