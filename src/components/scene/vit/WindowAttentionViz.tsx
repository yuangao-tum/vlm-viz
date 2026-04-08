'use client'
import { AttentionMatrix } from '../primitives/AttentionMatrix'
import { Label3D } from '../primitives/Label3D'
import { TensorBlock } from '../primitives/TensorBlock'
import { COLORS } from '@/scene/colorPalette'
import { VIT } from '@/scene/modelConstants'

interface WindowAttentionVizProps {
  position?: [number, number, number]
  layerIndex?: number
  t?: number
  attentionData?: number[][][]
}

export function WindowAttentionViz({
  position = [0, 0, 0],
  layerIndex = 0,
  t = 1,
  attentionData,
}: WindowAttentionVizProps) {
  const isFullAttn = VIT.FULL_ATTN_LAYERS.includes(layerIndex)
  const windowSize = 7 // 7×7 window attention

  // Show 4 attention windows in a 2×2 grid
  const windowPositions: [number, number, number][] = [
    [-1.2, 0, 0], [1.2, 0, 0],
    [-1.2, 0, 2.4], [1.2, 0, 2.4],
  ]

  return (
    <group position={position}>
      <Label3D
        position={[0, 1.2, 1.2]}
        text={isFullAttn ? 'Global Attention' : 'Window Attention (7×7)'}
        color={COLORS.ATTENTION}
        size={0.3}
        opacity={t}
      />

      {isFullAttn ? (
        // Full attention: one big matrix
        <AttentionMatrix
          position={[0, 0, 0]}
          size={14}
          cellSize={0.12}
          values={attentionData?.[0]}
        />
      ) : (
        // Window attention: 4 small window matrices
        windowPositions.map((pos, i) => (
          <AttentionMatrix
            key={i}
            position={pos}
            size={windowSize}
            cellSize={0.12}
            values={attentionData?.[i]}
          />
        ))
      )}
    </group>
  )
}
