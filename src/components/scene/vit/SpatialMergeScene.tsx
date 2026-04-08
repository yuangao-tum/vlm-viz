'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { FlowArrow } from '../primitives/FlowArrow'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'
import { smoothstep } from '@/lib/utils/lerp'

interface SpatialMergeSceneProps { t: number }

export function SpatialMergeScene({ t }: SpatialMergeSceneProps) {
  const { vit } = useModelStore((s) => s.model)
  const mergeT = smoothstep(0.15, 0.65, t)
  const labelT = smoothstep(0.3, 0.6, t)

  const gridBefore = Math.round(Math.sqrt(vit.tokens_before_merge))
  const gridAfter = Math.round(Math.sqrt(vit.tokens_after_merge))
  const cellSize = 0.45
  const mergedCellSize = cellSize * vit.spatial_merge_size

  return (
    <group>
      <Label3D position={[0, 6, 0]} text={`Spatial Merge (${vit.spatial_merge_size}×${vit.spatial_merge_size})`} color="#1a1a2e" size={0.45} opacity={smoothstep(0, 0.3, t)} />

      {mergeT < 0.95 && (
        <group position={[-8, 0, 0]}>
          <Label3D position={[0, 4.5, 0]} text={`Before: ${vit.tokens_before_merge} tokens (${vit.hidden_size}-dim)`} color={COLORS.ACTIVATIONS} size={0.28} opacity={1 - mergeT} />
          {Array.from({ length: Math.min(gridBefore * gridBefore, vit.tokens_before_merge) }).map((_, i) => {
            const row = Math.floor(i / gridBefore), col = i % gridBefore
            return (
              <TensorBlock key={i} position={[(col - gridBefore / 2) * cellSize, 0, (row - gridBefore / 2) * cellSize]}
                dims={[cellSize * 0.85, 0.15, cellSize * 0.85]} color={COLORS.ACTIVATIONS} opacity={0.5 * (1 - mergeT * 0.8)} />
            )
          })}
        </group>
      )}

      {mergeT > 0.1 && <FlowArrow from={[-3, 0, 0]} to={[3, 0, 0]} color={COLORS.CONNECTOR} />}

      {mergeT > 0.05 && (
        <group position={[8, 0, 0]}>
          <Label3D position={[0, 4.5, 0]} text={`After: ${vit.tokens_after_merge} tokens (${vit.output_dim}-dim)`} color={COLORS.CONNECTOR} size={0.28} opacity={mergeT} />
          {Array.from({ length: gridAfter * gridAfter }).map((_, i) => {
            const row = Math.floor(i / gridAfter), col = i % gridAfter
            return (
              <TensorBlock key={i} position={[(col - gridAfter / 2) * mergedCellSize, 0, (row - gridAfter / 2) * mergedCellSize]}
                dims={[mergedCellSize * 0.85 * mergeT, 0.3, mergedCellSize * 0.85 * mergeT]} color={COLORS.CONNECTOR} opacity={0.6 * mergeT} />
            )
          })}
        </group>
      )}

      {labelT > 0.1 && (
        <Label3D position={[0, -5, 0]} text={`${vit.spatial_merge_size}×${vit.spatial_merge_size} adjacent tokens → 1 merged token (${vit.hidden_size}×${vit.spatial_merge_size * vit.spatial_merge_size} → ${vit.output_dim})`} color="#666680" size={0.25} opacity={labelT} />
      )}
    </group>
  )
}
