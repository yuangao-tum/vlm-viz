'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { LLM } from '@/scene/modelConstants'
import { smoothstep, subrange, easeOutCubic } from '@/lib/utils/lerp'

interface LLMStackSceneProps { t: number }

const LAYER_SPACING = 2.2
const SLAB_W = 8
const SLAB_D = 1.5

export function LLMStackScene({ t }: LLMStackSceneProps) {
  const enterT = smoothstep(0, 0.3, t)

  return (
    <group>
      <Label3D
        position={[0, 4, 0]}
        text={`LLM Decoder — ${LLM.NUM_LAYERS} Layers`}
        color="#1a1a2e"
        size={0.5}
        opacity={smoothstep(0.05, 0.3, t)}
      />
      <Label3D
        position={[0, 2, 0]}
        text={`~135 tokens × ${LLM.HIDDEN_SIZE}-dim · GQA (${LLM.NUM_HEADS}Q/${LLM.NUM_KV_HEADS}KV) · SwiGLU`}
        color="#666680"
        size={0.28}
        opacity={smoothstep(0.15, 0.4, t)}
      />

      {/* MROPE bar across the top */}
      {enterT > 0.2 && (
        <group position={[0, 0.5, 0]}>
          {/* Three colored bands for MROPE dimensions */}
          <TensorBlock position={[-3, 0, 0]} dims={[2 * enterT, 0.2, SLAB_D]} color="#F03E3E" opacity={0.5 * enterT} />
          <TensorBlock position={[0, 0, 0]} dims={[2 * enterT, 0.2, SLAB_D]} color="#2F9E44" opacity={0.5 * enterT} />
          <TensorBlock position={[3, 0, 0]} dims={[2 * enterT, 0.2, SLAB_D]} color="#3B5BDB" opacity={0.5 * enterT} />
          <Label3D position={[-3, 0.4, 0]} text="T" color="#F03E3E" size={0.2} opacity={enterT} />
          <Label3D position={[0, 0.4, 0]} text="H" color="#2F9E44" size={0.2} opacity={enterT} />
          <Label3D position={[3, 0.4, 0]} text="W" color="#3B5BDB" size={0.2} opacity={enterT} />
          <Label3D position={[SLAB_W / 2 + 1.5, 0, 0]} text="MROPE" color="#555570" size={0.22} opacity={enterT} />
        </group>
      )}

      {/* 28 layer slabs */}
      {Array.from({ length: LLM.NUM_LAYERS }).map((_, i) => {
        const delay = (i / LLM.NUM_LAYERS) * 0.5
        const layerT = easeOutCubic(subrange(delay, delay + 0.4, enterT))
        const y = -i * LAYER_SPACING

        // Gradient color from light to dark blue across depth
        const hue = 0.62 + (i / LLM.NUM_LAYERS) * 0.04
        const lightness = 0.45 - (i / LLM.NUM_LAYERS) * 0.12

        return (
          <group key={i}>
            <TensorBlock
              position={[0, y, 0]}
              dims={[SLAB_W * layerT, 0.5, SLAB_D]}
              color={COLORS.WEIGHTS}
              opacity={0.65 * layerT}
            />
            <Label3D
              position={[SLAB_W / 2 + 1, y, 0]}
              text={`L${i}`}
              color="#888899"
              size={0.2}
              opacity={layerT}
            />
          </group>
        )
      })}

      {/* Bottom label */}
      <Label3D
        position={[0, -(LLM.NUM_LAYERS) * LAYER_SPACING - 1, 0]}
        text="Output: contextualized hidden states"
        color={COLORS.ACTIVATIONS}
        size={0.3}
        opacity={smoothstep(0.4, 0.7, t)}
      />
    </group>
  )
}
