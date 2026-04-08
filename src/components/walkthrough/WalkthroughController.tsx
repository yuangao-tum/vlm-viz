'use client'
import { useWalkthroughStore } from '@/store/walkthroughStore'
import { useModelStore } from '@/store/modelStore'
import { OverviewScene } from '../scene/overview/OverviewScene'
import { DeepStackViz } from '../scene/overview/DeepStackViz'
import { PatchGrid } from '../scene/primitives/PatchGrid'
import { PatchEmbedScene } from '../scene/vit/PatchEmbedScene'
import { ViTLayerScene } from '../scene/vit/ViTLayerScene'
import { SpatialMergeScene } from '../scene/vit/SpatialMergeScene'
import { ConnectorScene } from '../scene/connector/ConnectorScene'
import { TokenizationScene } from '../scene/llm/TokenizationScene'
import { LLMLayerScene } from '../scene/llm/LLMLayerScene'
import { TrajectoryHeadScene } from '../scene/head/TrajectoryHeadScene'
import { TensorBlock } from '../scene/primitives/TensorBlock'
import { FlowArrow } from '../scene/primitives/FlowArrow'
import { Label3D } from '../scene/primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'

// LM Head detail scene — reads from selected model
function LMHeadScene({ t }: { t: number }) {
  const { llm } = useModelStore((s) => s.model)
  return (
    <group>
      <Label3D position={[0, 6, 0]} text="Language Model Head" color="#1a1a2e" size={0.45} opacity={t} />
      <Label3D position={[0, 4.8, 0]} text="Standard text generation head (base model)" color="#666680" size={0.25} opacity={t} />

      <TensorBlock position={[-6, 0, 0]} dims={[1.5, 4, 1]} color={COLORS.ACTIVATIONS} opacity={0.8} />
      <Label3D position={[-6, -3, 0]} text={`Hidden state\n${llm.hidden_size}-dim`} color={COLORS.ACTIVATIONS} size={0.25} opacity={t} />

      <TensorBlock position={[0, 0, 0]} dims={[2.5, 3, 1]} color={COLORS.KV_CACHE} opacity={0.85} highlighted />
      <Label3D position={[0, -2.5, 0]} text={`Linear\n${llm.hidden_size} → ${llm.vocab_size}`} color={COLORS.KV_CACHE} size={0.25} opacity={t} />

      <mesh position={[5, 0, 0]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color={COLORS.ATTENTION} emissive={COLORS.ATTENTION} emissiveIntensity={0.3} />
      </mesh>
      <Label3D position={[5, -1.2, 0]} text="Softmax" color={COLORS.ATTENTION} size={0.28} opacity={t} />

      <TensorBlock position={[10, 0, 0]} dims={[1.5, 5, 1]} color={COLORS.KV_CACHE} opacity={0.7} />
      <Label3D position={[10, -3.5, 0]} text={`Vocab probs\n${llm.vocab_size} tokens`} color={COLORS.KV_CACHE} size={0.25} opacity={t} />

      <FlowArrow from={[-5, 0, 0]} to={[-1.5, 0, 0]} color={COLORS.ACTIVATIONS} />
      <FlowArrow from={[1.5, 0, 0]} to={[4.3, 0, 0]} color={COLORS.KV_CACHE} />
      <FlowArrow from={[5.7, 0, 0]} to={[9, 0, 0]} color={COLORS.ATTENTION} />
    </group>
  )
}

// Standard detail scenes (shared across model families)
const SHARED_SCENES: Record<number, React.FC<{ t: number }>> = {
  0: ({ t }) => (
    <group>
      <PatchGrid position={[0, 0, 0]} t={t} patchesX={14} patchesY={14} />
      <Label3D position={[0, 5, 0]} text="Driving Scene → Patch Grid" color="#1a1a2e" size={0.45} opacity={t} />
    </group>
  ),
  1: PatchEmbedScene,
  2: ViTLayerScene,
  3: SpatialMergeScene,
  4: ConnectorScene,
  5: TokenizationScene,
  7: TrajectoryHeadScene,
  8: LMHeadScene,
  9: () => <DeepStackViz position={[0, 2, 0]} />,
}

export function WalkthroughController() {
  const activeBlock = useWalkthroughStore((s) => s.activeBlock)

  if (activeBlock === null) {
    return <OverviewScene />
  }

  // Block 6 (LLM Decoder): show detailed single layer for all models
  // (DeepStack annotation is included in LLMLayerScene for Qwen3)
  if (activeBlock === 6) {
    return <LLMLayerScene t={0.7} />
  }

  const DetailScene = SHARED_SCENES[activeBlock]
  if (!DetailScene) return <OverviewScene />

  return <DetailScene t={0.7} />
}
