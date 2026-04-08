'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { FlowArrow } from '../primitives/FlowArrow'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'
import { smoothstep } from '@/lib/utils/lerp'

interface ConnectorSceneProps { t: number }

export function ConnectorScene({ t }: ConnectorSceneProps) {
  const { vit } = useModelStore((s) => s.model)
  const enterT = smoothstep(0, 0.3, t)
  const flowT = smoothstep(0.2, 0.6, t)
  const labelT = smoothstep(0.3, 0.6, t)

  return (
    <group>
      <Label3D position={[0, 5, 0]} text="Cross-Modal Connector" color="#1a1a2e" size={0.45} opacity={enterT} />

      <TensorBlock position={[-6, 0, 0]} dims={[3.5, 2.0, 1.0]} color={COLORS.ACTIVATIONS} opacity={0.8 * enterT} />
      <Label3D position={[-6, -1.8, 0]} text={`${vit.tokens_after_merge} tokens × ${vit.hidden_size}-dim`} color={COLORS.ACTIVATIONS} size={0.25} opacity={labelT} />
      <Label3D position={[-6, 1.5, 0]} text="ViT Output" color={COLORS.ACTIVATIONS} size={0.3} opacity={labelT} />

      <TensorBlock position={[0, 0, 0]} dims={[1.5, 2.0, 1.0]} color={COLORS.WEIGHTS} opacity={0.85 * enterT} highlighted />
      <Label3D position={[0, -1.8, 0]} text={`Linear(${vit.hidden_size}→${vit.output_dim})`} color={COLORS.WEIGHTS} size={0.25} opacity={labelT} />

      <TensorBlock position={[6, 0, 0]} dims={[3.5, 4.0, 1.0]} color={COLORS.CONNECTOR} opacity={0.8 * flowT} />
      <Label3D position={[6, -2.8, 0]} text={`${vit.tokens_after_merge} tokens × ${vit.output_dim}-dim`} color={COLORS.CONNECTOR} size={0.25} opacity={labelT} />
      <Label3D position={[6, 2.5, 0]} text="LLM-Compatible" color={COLORS.CONNECTOR} size={0.3} opacity={labelT} />

      {flowT > 0.05 && (
        <>
          <FlowArrow from={[-4, 0, 0]} to={[-1, 0, 0]} color={COLORS.ACTIVATIONS} />
          <FlowArrow from={[1, 0, 0]} to={[4, 0, 0]} color={COLORS.CONNECTOR} />
        </>
      )}
    </group>
  )
}
