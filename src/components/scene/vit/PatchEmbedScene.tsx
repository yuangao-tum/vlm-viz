'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { Label3D } from '../primitives/Label3D'
import { PatchGrid } from '../primitives/PatchGrid'
import { subrange, easeOutCubic, smoothstep } from '@/lib/utils/lerp'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'

interface PatchEmbedSceneProps { t: number }

export function PatchEmbedScene({ t }: PatchEmbedSceneProps) {
  const { vit } = useModelStore((s) => s.model)
  const enterT = smoothstep(0, 0.3, t)
  const barsT = subrange(0.15, 0.7, t)
  const labelT = smoothstep(0.4, 0.7, t)

  const patchesPerRow = vit.patch_size === 14 ? 16 : 14
  const SHOWN = 32
  const barSpacing = 0.26

  return (
    <group>
      <PatchGrid position={[0, 0, 0]} t={enterT} patchesX={patchesPerRow} patchesY={patchesPerRow} />

      {Array.from({ length: SHOWN }).map((_, i) => {
        const col = i % 8
        const row = Math.floor(i / 8)
        const x = (col - 3.5) * barSpacing * 2
        const z = (row - 1.5) * barSpacing * 4
        const delay = i / SHOWN * 0.5
        const barT = easeOutCubic(subrange(delay, delay + 0.5, barsT))
        const barHeight = barT * 3.0

        return (
          <TensorBlock
            key={i}
            position={[x, barHeight / 2, z]}
            dims={[0.18, Math.max(0.01, barHeight), 0.18]}
            color={COLORS.ACTIVATIONS}
            opacity={0.75 * barT}
          />
        )
      })}

      {labelT > 0.1 && (
        <>
          <Label3D
            position={[0, 4, -7]}
            text={`Patch Embeddings (${vit.hidden_size}-dim)`}
            color={COLORS.ACTIVATIONS}
            size={0.35}
            opacity={labelT}
          />
          <Label3D
            position={[-6, 0.2, 0]}
            text={`${vit.tokens_before_merge} patches → ${vit.tokens_before_merge} tokens`}
            color="#555570"
            size={0.28}
            opacity={labelT}
          />
        </>
      )}
    </group>
  )
}
