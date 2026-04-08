'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'
import { smoothstep, subrange, easeOutCubic } from '@/lib/utils/lerp'

interface ViTStackSceneProps { t: number }
const LAYER_SPACING = 2.0, SLAB_W = 6, SLAB_D = 1.2

export function ViTStackScene({ t }: ViTStackSceneProps) {
  const { vit } = useModelStore((s) => s.model)
  const enterT = smoothstep(0, 0.3, t)

  return (
    <group>
      {Array.from({ length: vit.depth }).map((_, i) => {
        const delay = (i / vit.depth) * 0.5
        const layerT = easeOutCubic(subrange(delay, delay + 0.4, enterT))
        const y = -i * LAYER_SPACING
        const isFullAttn = vit.full_attn_layers.includes(i)
        const isDeepFusion = vit.deep_fusion_layers.includes(i)
        const color = isFullAttn ? COLORS.ATTENTION : isDeepFusion ? COLORS.CONNECTOR : COLORS.WEIGHTS

        return (
          <group key={i}>
            <TensorBlock position={[0, y, 0]} dims={[SLAB_W * layerT, 0.4, SLAB_D]} color={color} opacity={0.7 * layerT} highlighted={isFullAttn} />
            <Label3D position={[SLAB_W / 2 + 1.5, y, 0]} text={`L${i}`} color={isFullAttn ? COLORS.ATTENTION : isDeepFusion ? COLORS.CONNECTOR : '#888899'} size={0.22} opacity={layerT} />
            {isFullAttn && layerT > 0.5 && <Label3D position={[-SLAB_W / 2 - 2.5, y, 0]} text="Global Attn" color={COLORS.ATTENTION} size={0.22} opacity={layerT} />}
            {isDeepFusion && layerT > 0.5 && <Label3D position={[-SLAB_W / 2 - 2.5, y, 0]} text="Deep Fusion" color={COLORS.CONNECTOR} size={0.22} opacity={layerT} />}
          </group>
        )
      })}
      <Label3D position={[0, 3, 0]} text={`Vision Transformer — ${vit.depth} Layers`} color="#1a1a2e" size={0.45} opacity={smoothstep(0.1, 0.4, t)} />
      <Label3D position={[0, 1.5, 0]} text={`${vit.tokens_before_merge} tokens × ${vit.hidden_size}-dim per layer`} color="#666680" size={0.28} opacity={smoothstep(0.2, 0.5, t)} />
    </group>
  )
}
