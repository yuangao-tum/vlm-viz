'use client'
import { useMemo } from 'react'
import { viridis } from '@/lib/three/colormap'

interface AttentionMatrixProps {
  position?: [number, number, number]
  size: number
  values?: number[][]
  cellSize?: number
  animated?: boolean
}

export function AttentionMatrix({
  position = [0, 0, 0],
  size,
  values,
  cellSize = 0.15,
}: AttentionMatrixProps) {
  // Limit to max 10×10 for performance with individual meshes
  const displaySize = Math.min(size, 10)
  const step = Math.max(1, Math.floor(size / displaySize))

  const cells = useMemo(() => {
    const result: { x: number; y: number; r: number; g: number; b: number }[] = []
    for (let row = 0; row < displaySize; row++) {
      for (let col = 0; col < displaySize; col++) {
        const origRow = row * step
        const origCol = col * step
        const val = values?.[origRow]?.[origCol] ?? Math.random() * 0.5
        const [r, g, b] = viridis(val)
        result.push({
          x: (col - displaySize / 2) * cellSize,
          y: (row - displaySize / 2) * cellSize,
          r, g, b,
        })
      }
    }
    return result
  }, [size, displaySize, step, values, cellSize])

  return (
    <group position={position}>
      {cells.map((cell, i) => (
        <mesh key={i} position={[cell.x, cell.y, 0]}>
          <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
          <meshBasicMaterial
            color={`rgb(${Math.floor(cell.r * 255)}, ${Math.floor(cell.g * 255)}, ${Math.floor(cell.b * 255)})`}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}
