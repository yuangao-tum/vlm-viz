'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { FlowArrow } from '../primitives/FlowArrow'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { VIT, LLM } from '@/scene/modelConstants'
import { smoothstep, lerp } from '@/lib/utils/lerp'

interface SequenceConcatSceneProps { t: number }

export function SequenceConcatScene({ t }: SequenceConcatSceneProps) {
  const enterT = smoothstep(0, 0.25, t)
  const flyT = smoothstep(0.15, 0.55, t)
  const mergeT = smoothstep(0.5, 0.8, t)

  const visualTokens = VIT.TOKENS_AFTER_MERGE // 49
  const textTokens = 84 // typical text length
  const totalTokens = visualTokens + textTokens + 2 // +2 for boundary tokens
  const visualW = 4
  const textW = 7
  const totalW = 12

  // Visual block flies in from left
  const visX = lerp(-12, -totalW / 2 + visualW / 2 + 0.5, flyT)
  // Text block flies in from right
  const textX = lerp(12, totalW / 2 - textW / 2 - 0.5, flyT)

  return (
    <group>
      <Label3D
        position={[0, 5, 0]}
        text="Multimodal Sequence"
        color="#1a1a2e"
        size={0.45}
        opacity={enterT}
      />

      {/* Visual tokens block (flying in from left) */}
      <group>
        <TensorBlock
          position={[visX, 0, 0]}
          dims={[visualW * enterT, 2.5, 1.0]}
          color={COLORS.CONNECTOR}
          opacity={0.75 * enterT}
        />
        <Label3D
          position={[visX, -2, 0]}
          text={`${visualTokens} visual tokens`}
          color={COLORS.CONNECTOR}
          size={0.25}
          opacity={enterT}
        />
      </group>

      {/* Text tokens block (flying in from right) */}
      <group>
        <TensorBlock
          position={[textX, 0, 0]}
          dims={[textW * enterT, 2.5, 1.0]}
          color={COLORS.TEXT_TOKEN}
          opacity={0.6 * enterT}
        />
        <Label3D
          position={[textX, -2, 0]}
          text={`~${textTokens} text tokens`}
          color={COLORS.TEXT_TOKEN}
          size={0.25}
          opacity={enterT}
        />
      </group>

      {/* Boundary token markers */}
      {flyT > 0.5 && (
        <>
          <TensorBlock
            position={[visX - visualW / 2 - 0.3, 0, 0]}
            dims={[0.3, 2.5, 1.0]}
            color={COLORS.SPECIAL}
            opacity={0.9 * mergeT}
          />
          <TensorBlock
            position={[visX + visualW / 2 + 0.3, 0, 0]}
            dims={[0.3, 2.5, 1.0]}
            color={COLORS.SPECIAL}
            opacity={0.9 * mergeT}
          />
        </>
      )}

      {/* Merged sequence indicator */}
      {mergeT > 0.3 && (
        <>
          <TensorBlock
            position={[0, -5, 0]}
            dims={[totalW * mergeT, 3, 1.0]}
            color={COLORS.ACTIVATIONS}
            opacity={0.5 * mergeT}
          />
          <Label3D
            position={[0, -7.5, 0]}
            text={`Combined: ~${totalTokens} tokens × ${LLM.HIDDEN_SIZE}-dim → LLM`}
            color={COLORS.ACTIVATIONS}
            size={0.28}
            opacity={mergeT}
          />
          <FlowArrow
            from={[0, -1.5, 0]}
            to={[0, -3.5, 0]}
            color={COLORS.ACTIVATIONS}
            animated={mergeT > 0.5}
          />
        </>
      )}

      {/* MROPE annotation */}
      {mergeT > 0.6 && (
        <Label3D
          position={[0, -9, 0]}
          text="MROPE: 3D positional encoding (T, H, W) for visual + 1D for text"
          color="#4444aa"
          size={0.22}
          opacity={mergeT - 0.6}
        />
      )}
    </group>
  )
}
