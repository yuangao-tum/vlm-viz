'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { FlowArrow } from '../primitives/FlowArrow'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { TRAJECTORY_HEAD } from '@/scene/modelConstants'
import { useModelStore } from '@/store/modelStore'
import { smoothstep, subrange, easeOutCubic } from '@/lib/utils/lerp'

interface TrajectoryHeadSceneProps { t: number }

export function TrajectoryHeadScene({ t }: TrajectoryHeadSceneProps) {
  const { llm } = useModelStore((s) => s.model)
  const enterT = smoothstep(0, 0.25, t)
  const flowT = smoothstep(0.15, 0.5, t)
  const outputT = smoothstep(0.4, 0.75, t)
  const labelT = smoothstep(0.3, 0.6, t)

  return (
    <group>
      <Label3D position={[0, 6, 0]} text="Trajectory Regression Head" color="#1a1a2e" size={0.45} opacity={enterT} />
      <Label3D position={[0, 4.8, 0]} text="(Added during finetuning)" color="#666680" size={0.25} opacity={labelT} />

      {/* Input: pooled hidden state (2048-dim) */}
      <TensorBlock
        position={[-8, 0, 0]}
        dims={[1.5, 4.0 * enterT, 1.0]}
        color={COLORS.ACTIVATIONS}
        opacity={0.8 * enterT}
      />
      <Label3D position={[-8, -3, 0]} text={`[TRAJ] token\n${llm.hidden_size}-dim`} color={COLORS.ACTIVATIONS} size={0.25} opacity={labelT} />

      {/* Linear 1: 2048 → 1024 */}
      <TensorBlock
        position={[-3.5, 0, 0]}
        dims={[2.0 * flowT, 3.0, 1.0]}
        color={COLORS.WEIGHTS}
        opacity={0.85 * flowT}
      />
      <Label3D position={[-3.5, -2.5, 0]} text={`Linear\n${llm.hidden_size}→${TRAJECTORY_HEAD.HIDDEN_DIM}`} color={COLORS.WEIGHTS} size={0.25} opacity={labelT} />

      {/* ReLU activation (amber sphere) */}
      {flowT > 0.3 && (
        <group position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.5 * flowT]} />
            <meshStandardMaterial
              color={COLORS.ATTENTION}
              emissive={COLORS.ATTENTION}
              emissiveIntensity={0.4}
            />
          </mesh>
          <Label3D position={[0, -1.2, 0]} text="ReLU" color={COLORS.ATTENTION} size={0.28} opacity={flowT} />
        </group>
      )}

      {/* Linear 2: 1024 → 55 */}
      <TensorBlock
        position={[3.5, 0, 0]}
        dims={[1.5 * flowT, 1.5, 1.0]}
        color={COLORS.WEIGHTS}
        opacity={0.85 * flowT}
      />
      <Label3D position={[3.5, -1.5, 0]} text={`Linear\n${TRAJECTORY_HEAD.HIDDEN_DIM}→${TRAJECTORY_HEAD.OUTPUT_DIM}`} color={COLORS.WEIGHTS} size={0.25} opacity={labelT} />

      {/* Output: 55-dim split into 11 × 5 */}
      {outputT > 0.1 && (
        <group position={[8, 0, 0]}>
          {Array.from({ length: TRAJECTORY_HEAD.NUM_TIMESTEPS }).map((_, i) => {
            const delay = (i / TRAJECTORY_HEAD.NUM_TIMESTEPS) * 0.5
            const stepT = easeOutCubic(subrange(delay, delay + 0.5, outputT))
            const x = (i - TRAJECTORY_HEAD.NUM_TIMESTEPS / 2) * 0.5

            return (
              <TensorBlock
                key={i}
                position={[x, 0, 0]}
                dims={[0.35 * stepT, 1.2, 0.4]}
                color={COLORS.TRAJECTORY}
                opacity={0.8 * stepT}
              />
            )
          })}
          <Label3D
            position={[0, -1.8, 0]}
            text={`${TRAJECTORY_HEAD.NUM_TIMESTEPS} steps × [x, y, v, a, θ]`}
            color={COLORS.TRAJECTORY}
            size={0.25}
            opacity={outputT}
          />
          <Label3D
            position={[0, -2.6, 0]}
            text={`Δt = ${TRAJECTORY_HEAD.DT}s → ${(TRAJECTORY_HEAD.NUM_TIMESTEPS - 1) * TRAJECTORY_HEAD.DT}s horizon`}
            color="#666680"
            size={0.2}
            opacity={outputT}
          />
        </group>
      )}

      {/* Flow arrows connecting stages */}
      {flowT > 0.1 && (
        <>
          <FlowArrow from={[-7, 0, 0]} to={[-5, 0, 0]} color={COLORS.ACTIVATIONS} animated={flowT > 0.3} />
          <FlowArrow from={[-2.3, 0, 0]} to={[-0.7, 0, 0]} color={COLORS.ACTIVATIONS} animated={flowT > 0.4} />
          <FlowArrow from={[0.7, 0, 0]} to={[2.5, 0, 0]} color={COLORS.ACTIVATIONS} animated={flowT > 0.5} />
          <FlowArrow from={[4.5, 0, 0]} to={[6, 0, 0]} color={COLORS.TRAJECTORY} animated={flowT > 0.6} />
        </>
      )}
    </group>
  )
}
