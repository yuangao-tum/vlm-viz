'use client'
import { PipelineBlock } from './PipelineBlock'
import { PipelineArrow } from './PipelineArrow'
import { GroupBox } from './GroupBox'
import { TensorBlock } from '../primitives/TensorBlock'
import { Text } from '@react-three/drei'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'
import { useWalkthroughStore } from '@/store/walkthroughStore'

export function OverviewScene() {
  const model = useModelStore((s) => s.model)
  if (model.family === 'qwen3') return <Qwen3Pipeline />
  return <Qwen25Pipeline />
}

// Helper: arrow from bottom-face center to top-face center, on the front surface (z = depth/2)
function arrow(
  aPos: [number, number, number], aDims: [number, number, number],
  bPos: [number, number, number], bDims: [number, number, number],
): { from: [number, number, number]; to: [number, number, number] } {
  const az = aDims[2] / 2 + 0.01  // just in front of the surface
  const bz = bDims[2] / 2 + 0.01
  return {
    from: [aPos[0], aPos[1] - aDims[1] / 2, az],
    to:   [bPos[0], bPos[1] + bDims[1] / 2, bz],
  }
}

// Helper: arrow between specific face centers (on the front surface)
function arrowFace(
  aPos: [number, number, number], aDims: [number, number, number], aFace: 'bottom' | 'top' | 'left' | 'right',
  bPos: [number, number, number], bDims: [number, number, number], bFace: 'bottom' | 'top' | 'left' | 'right',
): { from: [number, number, number]; to: [number, number, number] } {
  const z = Math.max(aDims[2], bDims[2]) / 2 + 0.01
  const faceOffset = (pos: [number, number, number], dims: [number, number, number], face: string) => {
    switch (face) {
      case 'bottom': return [pos[0], pos[1] - dims[1] / 2, z] as [number, number, number]
      case 'top':    return [pos[0], pos[1] + dims[1] / 2, z] as [number, number, number]
      case 'left':   return [pos[0] - dims[0] / 2, pos[1], z] as [number, number, number]
      case 'right':  return [pos[0] + dims[0] / 2, pos[1], z] as [number, number, number]
      default:       return [pos[0], pos[1], z] as [number, number, number]
    }
  }
  return {
    from: faceOffset(aPos, aDims, aFace),
    to:   faceOffset(bPos, bDims, bFace),
  }
}

function Qwen3Pipeline() {
  const { vit, llm, name } = useModelStore((s) => s.model)
  const setActiveBlock = useWalkthroughStore((s) => s.setActiveBlock)

  const visX = -7, txtX = 7, midX = 0

  // Block definitions: [position, dims]
  const imgPos: [number, number, number] = [visX, 8, 0],       imgDims: [number, number, number] = [3.5, 2, 1.2]
  const patchPos: [number, number, number] = [visX, 4.5, 0],   patchDims: [number, number, number] = [3.5, 2, 1.2]
  const vitPos: [number, number, number] = [visX, 0.5, 0],     vitDims: [number, number, number] = [4, 3, 1.2]
  const mergePos: [number, number, number] = [visX, -3.5, 0],  mergeDims: [number, number, number] = [3.5, 2, 1.2]
  const connPos: [number, number, number] = [visX, -7, 0],     connDims: [number, number, number] = [3.5, 2, 1.2]
  const textPos: [number, number, number] = [txtX, 8, 0],      textDims: [number, number, number] = [3.5, 2, 1.2]
  const llmPos: [number, number, number] = [midX, -12, 0],     llmDims: [number, number, number] = [6, 3.5, 1.2]
  const lmPos: [number, number, number] = [-4, -18, 0],        lmDims: [number, number, number] = [3.5, 2, 1.2]
  const trajPos: [number, number, number] = [4, -18, 0],       trajDims: [number, number, number] = [3.5, 2, 1.2]

  const blocks = [
    { index: 0, label: 'Image Input', sublabel: `Front-view · ${vit.patch_size}×${vit.patch_size}`, position: imgPos, dims: imgDims, color: '#78909C' },
    { index: 1, label: 'Patch Embed', sublabel: `${vit.tokens_before_merge} × ${vit.hidden_size}-dim`, position: patchPos, dims: patchDims, color: COLORS.ACTIVATIONS },
    { index: 2, label: 'ViT Encoder', sublabel: `${vit.depth} layers · ${vit.num_heads} heads`, position: vitPos, dims: vitDims, color: COLORS.WEIGHTS },
    { index: 3, label: 'Spatial Merge', sublabel: `${vit.tokens_before_merge} → ${vit.tokens_after_merge}`, position: mergePos, dims: mergeDims, color: COLORS.CONNECTOR },
    { index: 4, label: 'Connector', sublabel: `${vit.hidden_size} → ${vit.output_dim}`, position: connPos, dims: connDims, color: COLORS.CONNECTOR },
    { index: 5, label: 'Text Tokens', sublabel: 'Vehicle state + style', position: textPos, dims: textDims, color: '#78909C' },
    { index: 6, label: 'LLM Decoder', sublabel: `${llm.num_layers}L · GQA(${llm.num_heads}Q/${llm.num_kv_heads}KV) · ${llm.hidden_size}-dim`, position: llmPos, dims: llmDims, color: COLORS.WEIGHTS },
    { index: 8, label: 'LM Head', sublabel: `vocab ${(llm.vocab_size / 1000).toFixed(0)}K`, position: lmPos, dims: lmDims, color: COLORS.KV_CACHE },
    { index: 7, label: 'Trajectory Head', sublabel: 'MLP → 11×[x,y,v,a,θ]', position: trajPos, dims: trajDims, color: COLORS.TRAJECTORY },
  ]

  const arrows = [
    // Vision column: bottom face → top face
    arrow(imgPos, imgDims, patchPos, patchDims),
    arrow(patchPos, patchDims, vitPos, vitDims),
    arrow(vitPos, vitDims, mergePos, mergeDims),
    arrow(mergePos, mergeDims, connPos, connDims),
    // Connector bottom → LLM top
    arrowFace(connPos, connDims, 'bottom', llmPos, llmDims, 'top'),
    // Text bottom → LLM top
    arrowFace(textPos, textDims, 'bottom', llmPos, llmDims, 'top'),
    // LLM bottom → LM Head top
    arrowFace(llmPos, llmDims, 'bottom', lmPos, lmDims, 'top'),
    // LLM bottom → Trajectory Head top
    arrowFace(llmPos, llmDims, 'bottom', trajPos, trajDims, 'top'),
  ]

  const dsLayers = vit.deep_fusion_layers

  return (
    <group>
      <Text position={[midX, 12, 0]} fontSize={0.55} color="#1a1a2e" anchorX="center" fontWeight="bold">
        {name} · DeepStack Architecture
      </Text>
      <Text position={[midX, 11.2, 0]} fontSize={0.2} color="#aaaaaa" anchorX="center">
        Click any block to explore · Orbit with mouse
      </Text>

      {/* Grouping boxes */}
      <GroupBox position={[visX, 1, 0]} width={7} height={18}
        label="model.visual" sublabel="Vision encoder pipeline" color="#3B5BDB" />
      <GroupBox position={[txtX, 8, 0]} width={5.5} height={4}
        label="model.embed_tokens" sublabel="Text embedding" color="#0CA678" />
      <GroupBox position={[midX, -14.5, 0]} width={14} height={11}
        label="model.model + model.lm_head" sublabel="Base LLM (pre-trained)" color="#3B5BDB" />
      <GroupBox position={[4, -18, 0]} width={5} height={3.5}
        label="model.regression_head" sublabel="Added during finetuning" color="#F03E3E" />

      <Text position={[midX, llmPos[1] + llmDims[1] / 2 + 0.5, 0]} fontSize={0.3} color="#888899" anchorX="center">concat</Text>

      {arrows.map((a, i) => <PipelineArrow key={i} from={a.from} to={a.to} />)}
      {blocks.map((b) => <PipelineBlock key={b.index} {...b} />)}

      {/* DeepStack panel — CLICKABLE (block index 9) */}
      <group position={[18, -2, 0]}>
        {/* Clickable background */}
        <mesh onClick={(e) => { e.stopPropagation(); setActiveBlock(9) }}
              onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
              onPointerLeave={() => { document.body.style.cursor = 'default' }}>
          <planeGeometry args={[7, 10]} />
          <meshStandardMaterial color="#FFF8F0" transparent opacity={0.85} />
        </mesh>
        <mesh><planeGeometry args={[7.05, 10.05]} /><meshStandardMaterial color="#E67700" transparent opacity={0.25} /></mesh>
        <Text position={[0, 4.3, 0.1]} fontSize={0.32} color="#E67700" anchorX="center" fontWeight="bold">DeepStack</Text>
        <Text position={[0, 3.7, 0.1]} fontSize={0.18} color="#666680" anchorX="center">Multi-layer visual injection</Text>
        <Text position={[0, -4.6, 0.1]} fontSize={0.14} color="#3B82F6" anchorX="center">Click for details</Text>
        {dsLayers.map((layerIdx, i) => {
          const rowY = 2.2 - i * 2.2
          const colors = ['#E63946', '#F4A261', '#E9C46A']
          return (
            <group key={i} position={[0, rowY, 0.1]}>
              <TensorBlock position={[-2, 0, 0]} dims={[1.2, 0.8, 0.3]} color={COLORS.WEIGHTS} opacity={0.85} />
              <Text position={[-2, -0.65, 0]} fontSize={0.15} color="#3B5BDB" anchorX="center">ViT L{layerIdx}</Text>
              <PipelineArrow from={[-1.2, 0, 0]} to={[0.8, 0, 0]} color={colors[i] ?? '#E67700'} />
              <TensorBlock position={[2, 0, 0]} dims={[1.2, 0.8, 0.3]} color={COLORS.WEIGHTS} opacity={0.85} />
              <Text position={[2, -0.65, 0]} fontSize={0.15} color="#3B5BDB" anchorX="center">LLM L{layerIdx}</Text>
              <Text position={[0, 0.15, 0]} fontSize={0.13} color={colors[i] ?? '#E67700'} anchorX="center">+=</Text>
            </group>
          )
        })}
        <Text position={[0, -4.2, 0.1]} fontSize={0.15} color="#555555" anchorX="center">h[vis_pos] += vit_features</Text>
      </group>

      <PipelineArrow from={[visX + 2, vitPos[1], 0.3]} to={[14.5, 1.5, 0.3]} color="#E67700" />
      <PipelineArrow from={[llmPos[0] + 3, llmPos[1], 0.3]} to={[14.5, -4.5, 0.3]} color="#E67700" />
    </group>
  )
}

function Qwen25Pipeline() {
  const { vit, llm, name } = useModelStore((s) => s.model)

  const visX = -7, txtX = 7, midX = 0

  const imgPos: [number, number, number] = [visX, 8, 0],       imgDims: [number, number, number] = [3.5, 2, 1.2]
  const patchPos: [number, number, number] = [visX, 4.5, 0],   patchDims: [number, number, number] = [3.5, 2, 1.2]
  const vitPos: [number, number, number] = [visX, 0.5, 0],     vitDims: [number, number, number] = [4, 3, 1.2]
  const mergePos: [number, number, number] = [visX, -3.5, 0],  mergeDims: [number, number, number] = [3.5, 2, 1.2]
  const connPos: [number, number, number] = [visX, -7, 0],     connDims: [number, number, number] = [3.5, 2, 1.2]
  const textPos: [number, number, number] = [txtX, 8, 0],      textDims: [number, number, number] = [3.5, 2, 1.2]
  const llmPos: [number, number, number] = [midX, -12, 0],     llmDims: [number, number, number] = [6, 3.5, 1.2]
  const lmPos: [number, number, number] = [-4, -18, 0],        lmDims: [number, number, number] = [3.5, 2, 1.2]
  const trajPos: [number, number, number] = [4, -18, 0],       trajDims: [number, number, number] = [3.5, 2, 1.2]

  const blocks = [
    { index: 0, label: 'Image Input', sublabel: `Front-view · ${vit.patch_size}×${vit.patch_size}`, position: imgPos, dims: imgDims, color: '#78909C' },
    { index: 1, label: 'Patch Embed', sublabel: `${vit.tokens_before_merge} × ${vit.hidden_size}-dim`, position: patchPos, dims: patchDims, color: COLORS.ACTIVATIONS },
    { index: 2, label: 'ViT Encoder', sublabel: `${vit.depth} layers · ${vit.num_heads} heads`, position: vitPos, dims: vitDims, color: COLORS.WEIGHTS },
    { index: 3, label: 'Spatial Merge', sublabel: `${vit.tokens_before_merge} → ${vit.tokens_after_merge}`, position: mergePos, dims: mergeDims, color: COLORS.CONNECTOR },
    { index: 4, label: 'Connector', sublabel: `${vit.hidden_size} → ${vit.output_dim}`, position: connPos, dims: connDims, color: COLORS.CONNECTOR },
    { index: 5, label: 'Text Tokens', sublabel: 'Vehicle state + style', position: textPos, dims: textDims, color: '#78909C' },
    { index: 6, label: 'LLM Decoder', sublabel: `${llm.num_layers}L · GQA(${llm.num_heads}Q/${llm.num_kv_heads}KV) · ${llm.hidden_size}-dim`, position: llmPos, dims: llmDims, color: COLORS.WEIGHTS },
    { index: 8, label: 'LM Head', sublabel: `vocab ${(llm.vocab_size / 1000).toFixed(0)}K`, position: lmPos, dims: lmDims, color: COLORS.KV_CACHE },
    { index: 7, label: 'Trajectory Head', sublabel: 'MLP → 11×[x,y,v,a,θ]', position: trajPos, dims: trajDims, color: COLORS.TRAJECTORY },
  ]

  const arrows = [
    arrow(imgPos, imgDims, patchPos, patchDims),
    arrow(patchPos, patchDims, vitPos, vitDims),
    arrow(vitPos, vitDims, mergePos, mergeDims),
    arrow(mergePos, mergeDims, connPos, connDims),
    arrowFace(connPos, connDims, 'bottom', llmPos, llmDims, 'top'),
    arrowFace(textPos, textDims, 'bottom', llmPos, llmDims, 'top'),
    arrowFace(llmPos, llmDims, 'bottom', lmPos, lmDims, 'top'),
    arrowFace(llmPos, llmDims, 'bottom', trajPos, trajDims, 'top'),
  ]

  const fullAttn = vit.full_attn_layers.join(', ')

  return (
    <group>
      <Text position={[midX, 12, 0]} fontSize={0.55} color="#1a1a2e" anchorX="center" fontWeight="bold">
        {name} · Standard Concatenation
      </Text>
      <Text position={[midX, 11.2, 0]} fontSize={0.2} color="#aaaaaa" anchorX="center">
        {`Full attn at ViT layers [${fullAttn}] · Click any block · Orbit with mouse`}
      </Text>

      <GroupBox position={[visX, 1, 0]} width={7} height={18}
        label="model.visual" sublabel="Vision encoder pipeline" color="#3B5BDB" />
      <GroupBox position={[txtX, 8, 0]} width={5.5} height={4}
        label="model.embed_tokens" sublabel="Text embedding" color="#0CA678" />
      <GroupBox position={[midX, -14.5, 0]} width={14} height={11}
        label="model.model + model.lm_head" sublabel="Base LLM (pre-trained)" color="#3B5BDB" />
      <GroupBox position={[4, -18, 0]} width={5} height={3.5}
        label="model.regression_head" sublabel="Added during finetuning" color="#F03E3E" />

      <Text position={[midX, llmPos[1] + llmDims[1] / 2 + 0.5, 0]} fontSize={0.3} color="#888899" anchorX="center">
        concat (replace placeholders)
      </Text>

      {arrows.map((a, i) => <PipelineArrow key={i} from={a.from} to={a.to} />)}
      {blocks.map((b) => <PipelineBlock key={b.index} {...b} />)}
    </group>
  )
}

export const OVERVIEW_CAMERA = {
  position: [0, -3, 35] as [number, number, number],
  target: [0, -3, 0] as [number, number, number],
}

export const DETAIL_CAMERAS: Record<number, { position: [number, number, number]; target: [number, number, number] }> = {
  0: { position: [0, 10, 20], target: [0, 0, 0] },
  1: { position: [0, 4, 22], target: [0, 2, 0] },
  2: { position: [0, -3, 28], target: [0, -3, 0] },
  3: { position: [0, 0, 25], target: [0, 0, 0] },
  4: { position: [0, 0, 22], target: [0, 0, 0] },
  5: { position: [0, 0, 20], target: [0, 0, 0] },
  6: { position: [0, -3, 22], target: [0, -3, 0] },
  7: { position: [0, 0, 25], target: [0, 0, 0] },
  8: { position: [0, 0, 25], target: [0, 0, 0] },
  9: { position: [0, 0, 25], target: [0, 0, 0] },  // DeepStack detail
}
