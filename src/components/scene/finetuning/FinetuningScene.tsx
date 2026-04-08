'use client'
import { FinetuningBlock } from './FinetuningBlock'
import { PipelineArrow } from '../overview/PipelineArrow'
import { GroupBox } from '../overview/GroupBox'
import { Text } from '@react-three/drei'
import { useModelStore } from '@/store/modelStore'
import { useFinetuningStore } from '@/store/finetuningStore'
import { STAGES, STATUS_COLORS, STATUS_LABELS, type ComponentStatus } from '@/scene/finetuningConfig'

// Arrow helper (same as OverviewScene)
function arrowFace(
  aPos: [number, number, number], aDims: [number, number, number], aFace: 'bottom' | 'top',
  bPos: [number, number, number], bDims: [number, number, number], bFace: 'bottom' | 'top',
) {
  const z = Math.max(aDims[2], bDims[2]) / 2 + 0.01
  const yOff = (face: string, dims: [number, number, number]) => face === 'bottom' ? -dims[1] / 2 : dims[1] / 2
  return {
    from: [aPos[0], aPos[1] + yOff(aFace, aDims), z] as [number, number, number],
    to: [bPos[0], bPos[1] + yOff(bFace, bDims), z] as [number, number, number],
  }
}

export function FinetuningScene() {
  const { vit, llm, name } = useModelStore((s) => s.model)
  const selectedStage = useFinetuningStore((s) => s.selectedStage)
  const stage = STAGES.find(s => s.id === selectedStage) ?? STAGES[1]

  const visX = -7, txtX = 7, midX = 0

  // Block positions and dims (shared with OverviewScene layout)
  const defs: { index: number; label: string; sublabel: string; pos: [number, number, number]; dims: [number, number, number] }[] = [
    { index: 0, label: 'Image Input', sublabel: `${vit.patch_size}×${vit.patch_size} patches`, pos: [visX, 8, 0], dims: [3.5, 2, 1.2] },
    { index: 1, label: 'Patch Embed', sublabel: `${vit.tokens_before_merge} × ${vit.hidden_size}`, pos: [visX, 4.5, 0], dims: [3.5, 2, 1.2] },
    { index: 2, label: 'ViT Encoder', sublabel: `${vit.depth}L · ${vit.num_heads}H`, pos: [visX, 0.5, 0], dims: [4, 3, 1.2] },
    { index: 3, label: 'Spatial Merge', sublabel: `${vit.tokens_before_merge}→${vit.tokens_after_merge}`, pos: [visX, -3.5, 0], dims: [3.5, 2, 1.2] },
    { index: 4, label: 'Connector', sublabel: `${vit.hidden_size}→${vit.output_dim}`, pos: [visX, -7, 0], dims: [3.5, 2, 1.2] },
    { index: 5, label: 'Text Tokens', sublabel: 'embed_tokens', pos: [txtX, 8, 0], dims: [3.5, 2, 1.2] },
    { index: 6, label: 'LLM Decoder', sublabel: `${llm.num_layers}L · ${llm.hidden_size}-dim`, pos: [midX, -12, 0], dims: [6, 3.5, 1.2] },
    { index: 8, label: 'LM Head', sublabel: `vocab ${(llm.vocab_size / 1000).toFixed(0)}K`, pos: [-4, -18, 0], dims: [3.5, 2, 1.2] },
    { index: 7, label: 'Trajectory Head', sublabel: 'MLP → 55-dim', pos: [4, -18, 0], dims: [3.5, 2, 1.2] },
  ]

  const arrows = [
    arrowFace(defs[0].pos, defs[0].dims, 'bottom', defs[1].pos, defs[1].dims, 'top'),
    arrowFace(defs[1].pos, defs[1].dims, 'bottom', defs[2].pos, defs[2].dims, 'top'),
    arrowFace(defs[2].pos, defs[2].dims, 'bottom', defs[3].pos, defs[3].dims, 'top'),
    arrowFace(defs[3].pos, defs[3].dims, 'bottom', defs[4].pos, defs[4].dims, 'top'),
    arrowFace(defs[4].pos, defs[4].dims, 'bottom', defs[6].pos, defs[6].dims, 'top'),
    arrowFace(defs[5].pos, defs[5].dims, 'bottom', defs[6].pos, defs[6].dims, 'top'),
    arrowFace(defs[6].pos, defs[6].dims, 'bottom', defs[7].pos, defs[7].dims, 'top'),
    arrowFace(defs[6].pos, defs[6].dims, 'bottom', defs[8].pos, defs[8].dims, 'top'),
  ]

  return (
    <group>
      <Text position={[midX, 12, 0]} fontSize={0.55} color="#1a1a2e" anchorX="center" fontWeight="bold">
        {name} · Finetuning — {stage.name}
      </Text>
      <Text position={[midX, 11.2, 0]} fontSize={0.2} color="#888899" anchorX="center">
        {stage.description}
      </Text>

      {/* Group boxes */}
      <GroupBox position={[visX, 1, 0]} width={7} height={18} label="model.visual" sublabel="Vision encoder" color="#3B5BDB" />
      <GroupBox position={[txtX, 8, 0]} width={5.5} height={4} label="model.embed_tokens" sublabel="Text embedding" color="#0CA678" />
      <GroupBox position={[midX, -14.5, 0]} width={14} height={11} label="model.model + model.lm_head" sublabel="Base LLM" color="#3B5BDB" />
      <GroupBox position={[4, -18, 0]} width={5} height={3.5} label="model.regression_head" sublabel="Finetuned" color="#F03E3E" />

      <Text position={[midX, -9.8, 0]} fontSize={0.3} color="#888899" anchorX="center">concat</Text>

      {/* Arrows */}
      {arrows.map((a, i) => <PipelineArrow key={i} from={a.from} to={a.to} />)}

      {/* Blocks with stage-dependent colors */}
      {defs.map((d) => {
        const comp = stage.components[d.index]
        const status: ComponentStatus = comp?.status ?? 'frozen'
        return (
          <FinetuningBlock
            key={d.index}
            index={d.index}
            position={d.pos}
            dims={d.dims}
            label={d.label}
            sublabel={d.sublabel}
            status={status}
            loraRank={comp?.loraRank}
          />
        )
      })}

      {/* Legend in bottom-right */}
      <group position={[14, -16, 0]}>
        <Text position={[0, 1.5, 0]} fontSize={0.25} color="#1a1a2e" anchorX="center" fontWeight="bold">Legend</Text>
        {(['frozen', 'trainable', 'lora', 'new'] as ComponentStatus[]).map((s, i) => (
          <group key={s} position={[0, 0.5 - i * 0.7, 0]}>
            <mesh position={[-1.2, 0, 0]}>
              <boxGeometry args={[0.4, 0.4, 0.1]} />
              <meshStandardMaterial color={STATUS_COLORS[s]} />
            </mesh>
            <Text position={[-0.8, 0, 0]} fontSize={0.18} color="#444444" anchorX="left" anchorY="middle">
              {STATUS_LABELS[s]}
            </Text>
          </group>
        ))}
      </group>
    </group>
  )
}

export const FINETUNING_CAMERA = {
  position: [0, -3, 35] as [number, number, number],
  target: [0, -3, 0] as [number, number, number],
}
