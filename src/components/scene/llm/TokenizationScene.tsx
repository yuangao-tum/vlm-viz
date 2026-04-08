'use client'
import { TokenChip } from '../primitives/TokenChip'
import { TensorBlock } from '../primitives/TensorBlock'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { smoothstep, subrange, easeOutCubic } from '@/lib/utils/lerp'

interface TokenizationSceneProps { t: number }

// Sample tokens from the driving prompt
const SAMPLE_TOKENS = [
  { text: '<|vision_start|>', color: COLORS.SPECIAL },
  { text: '<img>', color: COLORS.CONNECTOR },
  { text: '...×49', color: COLORS.CONNECTOR },
  { text: '<|vision_end|>', color: COLORS.SPECIAL },
  { text: 'Vehicle', color: COLORS.TEXT_TOKEN },
  { text: 'state', color: COLORS.TEXT_TOKEN },
  { text: ':', color: COLORS.TEXT_TOKEN },
  { text: 'pos', color: COLORS.TEXT_TOKEN },
  { text: '=', color: COLORS.TEXT_TOKEN },
  { text: '[0.0,', color: COLORS.TEXT_TOKEN },
  { text: '0.0]', color: COLORS.TEXT_TOKEN },
  { text: 'vel', color: COLORS.TEXT_TOKEN },
  { text: '=', color: COLORS.TEXT_TOKEN },
  { text: '5.2', color: COLORS.TEXT_TOKEN },
  { text: 'Style:', color: COLORS.TEXT_TOKEN },
  { text: 'Default', color: '#E67700' },
]

export function TokenizationScene({ t }: TokenizationSceneProps) {
  const enterT = smoothstep(0, 0.3, t)
  const chipT = smoothstep(0.1, 0.6, t)
  const embedT = smoothstep(0.4, 0.8, t)

  return (
    <group>
      <Label3D
        position={[0, 5, 0]}
        text="Text Tokenization"
        color="#1a1a2e"
        size={0.45}
        opacity={enterT}
      />

      {/* Token chips in a row */}
      {SAMPLE_TOKENS.map((tok, i) => {
        const delay = (i / SAMPLE_TOKENS.length) * 0.6
        const tokT = easeOutCubic(subrange(delay, delay + 0.4, chipT))
        const x = (i - SAMPLE_TOKENS.length / 2) * 1.6

        return (
          <group key={i}>
            <TokenChip
              position={[x, 2, 0]}
              label={tok.text}
              color={tok.color}
              scale={tokT}
            />
            {/* Embedding bar below each token */}
            {embedT > 0.1 && (
              <TensorBlock
                position={[x, -0.5, 0]}
                dims={[0.2, 3 * embedT, 0.2]}
                color={tok.color}
                opacity={0.6 * embedT}
              />
            )}
          </group>
        )
      })}

      {/* Labels */}
      <Label3D
        position={[0, 3.5, 0]}
        text="BPE tokens (vocab=151,936)"
        color="#666680"
        size={0.25}
        opacity={smoothstep(0.3, 0.5, t)}
      />
      {embedT > 0.3 && (
        <Label3D
          position={[0, -2.5, 0]}
          text="Token embeddings (2048-dim)"
          color={COLORS.ACTIVATIONS}
          size={0.28}
          opacity={embedT}
        />
      )}
    </group>
  )
}
