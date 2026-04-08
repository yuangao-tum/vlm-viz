'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { FlowArrow } from '../primitives/FlowArrow'
import { Label3D } from '../primitives/Label3D'
import { AttentionMatrix } from '../primitives/AttentionMatrix'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'
import { useWalkthroughStore } from '@/store/walkthroughStore'

interface ViTLayerSceneProps { t: number }

export function ViTLayerScene({ t }: ViTLayerSceneProps) {
  const { vit, family } = useModelStore((s) => s.model)
  const { activeSubBlock, setActiveSubBlock } = useWalkthroughStore()

  const W = 5.5, D = 0.8, gap = 2.5, resX = W / 2 + 2.2
  const headDim = vit.hidden_size / vit.num_heads
  const z = D / 2 + 0.01

  let y = 12
  const inputY = y; y -= gap
  const norm1Y = y; y -= gap
  const qkvY = y; y -= gap * 1.4
  const attnY = y; y -= gap * 1.2
  const oProjY = y; y -= gap * 0.8
  const add1Y = y; y -= gap
  const norm2Y = y; y -= gap
  const ffnUpY = y; y -= gap
  const ffnDownY = y; y -= gap * 0.8
  const add2Y = y; y -= gap
  const outputY = y

  const click = (id: string) => () => setActiveSubBlock(id)
  const hl = (id: string) => activeSubBlock === id

  return (
    <group>
      <Label3D position={[0, inputY + 2.5, 0]} text={`ViT Layer (1 of ${vit.depth})`} color="#1a1a2e" size={0.5} />
      <Label3D position={[0, inputY + 1.6, 0]} text={`${family === 'qwen3' ? 'Qwen3-VL' : 'Qwen2.5-VL'} · ${vit.hidden_size}-dim · ${vit.num_heads} heads · Click any block for details`} color="#888899" size={0.2} />

      {/* Input */}
      <TensorBlock position={[0, inputY, 0]} dims={[W, 0.6, D]} color={COLORS.RESIDUAL} opacity={0.85} />
      <Label3D position={[0, inputY, D]} text="Input Tokens" color={COLORS.RESIDUAL} size={0.26} />
      <Label3D position={[W / 2 + 1.5, inputY, 0]} text={`seq × ${vit.hidden_size}`} color="#888899" size={0.18} />

      <FlowArrow from={[0, inputY - 0.4, z]} to={[0, norm1Y + 0.35, z]} color="#999999" />

      {/* RMSNorm 1 — CLICKABLE */}
      <TensorBlock position={[0, norm1Y, 0]} dims={[W, 0.5, D]} color={COLORS.NORM} onClick={click('rmsnorm')} highlighted={hl('rmsnorm')} />
      <Label3D position={[0, norm1Y, D]} text="RMSNorm" color={COLORS.NORM} size={0.26} />

      <FlowArrow from={[0, norm1Y - 0.35, z]} to={[0, qkvY + 0.6, z]} color="#999999" />

      {/* Q/K/V — CLICKABLE */}
      <group position={[0, qkvY, 0]}>
        <TensorBlock position={[-1.8, 0, 0]} dims={[1.8, 1.0, D]} color={COLORS.WEIGHTS} onClick={click('qkv')} highlighted={hl('qkv')} />
        <Label3D position={[-1.8, 0, D]} text="Q proj" color={COLORS.WEIGHTS} size={0.22} />
        <TensorBlock position={[0.3, 0, 0]} dims={[1.2, 1.0, D]} color={COLORS.KV_CACHE} onClick={click('qkv')} highlighted={hl('qkv')} />
        <Label3D position={[0.3, 0, D]} text="K proj" color={COLORS.KV_CACHE} size={0.22} />
        <TensorBlock position={[2.2, 0, 0]} dims={[1.2, 1.0, D]} color={COLORS.KV_CACHE} onClick={click('qkv')} highlighted={hl('qkv')} />
        <Label3D position={[2.2, 0, D]} text="V proj" color={COLORS.KV_CACHE} size={0.22} />
        <Label3D position={[W / 2 + 1.5, 0.2, 0]} text={`${vit.num_heads} heads · dim=${headDim}`} color="#888899" size={0.16} />
      </group>

      <FlowArrow from={[0, qkvY - 0.6, z]} to={[0, attnY + 0.5, z]} color={COLORS.ATTENTION} />

      {/* Attention — CLICKABLE */}
      <TensorBlock position={[0, attnY, 0]} dims={[W, 0.8, D]} color={COLORS.ATTENTION} opacity={0.75} onClick={click('attention')} highlighted={hl('attention')} />
      <Label3D position={[0, attnY, D]} text="Scaled Dot-Product Attention" color={COLORS.ATTENTION} size={0.22} />
      <Label3D position={[W / 2 + 1.5, attnY, 0]} text="+ RoPE pos enc" color="#aaaaaa" size={0.13} />

      {/* Attention scores matrix — CLICKABLE */}
      <group position={[-W / 2 - 2.8, attnY, 0]} onClick={click('attn_scores')}>
        <AttentionMatrix position={[0, 0, 0]} size={8} cellSize={0.16} />
        <Label3D position={[0, 1.0, 0]} text={hl('attn_scores') ? '▶ Scores' : 'Scores'} color={hl('attn_scores') ? '#1a1a2e' : COLORS.ATTENTION} size={0.18} />
      </group>

      <FlowArrow from={[0, attnY - 0.5, z]} to={[0, oProjY + 0.45, z]} color={COLORS.ATTENTION} />

      {/* Output Proj — CLICKABLE */}
      <TensorBlock position={[0, oProjY, 0]} dims={[W, 0.7, D]} color={COLORS.WEIGHTS} onClick={click('output_proj')} highlighted={hl('output_proj')} />
      <Label3D position={[0, oProjY, D]} text="Output Proj (W_o)" color={COLORS.WEIGHTS} size={0.22} />

      {/* Residual Add 1 — CLICKABLE */}
      <FlowArrow from={[0, oProjY - 0.45, z]} to={[0, add1Y + 0.22, z]} color="#999999" />
      <mesh position={[0, add1Y, z]} onClick={click('residual')}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color={COLORS.RESIDUAL} emissive={COLORS.RESIDUAL} emissiveIntensity={hl('residual') ? 0.5 : 0.3} />
      </mesh>
      <Label3D position={[0.7, add1Y, z]} text="+" color={COLORS.RESIDUAL} size={0.35} />
      <FlowArrow from={[resX, inputY, z]} to={[resX, add1Y, z]} color={COLORS.RESIDUAL} />
      <FlowArrow from={[resX, add1Y, z]} to={[0.35, add1Y, z]} color={COLORS.RESIDUAL} />
      <Label3D position={[resX + 0.6, (inputY + add1Y) / 2, 0]} text="residual" color={COLORS.RESIDUAL} size={0.14} />

      <FlowArrow from={[0, add1Y - 0.3, z]} to={[0, norm2Y + 0.35, z]} color="#999999" />

      {/* RMSNorm 2 — CLICKABLE */}
      <TensorBlock position={[0, norm2Y, 0]} dims={[W, 0.5, D]} color={COLORS.NORM} onClick={click('rmsnorm')} highlighted={hl('rmsnorm')} />
      <Label3D position={[0, norm2Y, D]} text="RMSNorm" color={COLORS.NORM} size={0.26} />

      <FlowArrow from={[0, norm2Y - 0.35, z]} to={[0, ffnUpY + 0.55, z]} color="#999999" />

      {/* FFN Up — CLICKABLE */}
      <TensorBlock position={[0, ffnUpY, 0]} dims={[W, 0.8, D]} color={COLORS.WEIGHTS} onClick={click('ffn_up')} highlighted={hl('ffn_up')} />
      <Label3D position={[0, ffnUpY, D]} text="FFN Up + GELU" color={COLORS.WEIGHTS} size={0.24} />
      <Label3D position={[W / 2 + 1.5, ffnUpY, 0]} text={`${vit.hidden_size} → ${vit.intermediate_size}`} color="#888899" size={0.15} />

      <FlowArrow from={[0, ffnUpY - 0.5, z]} to={[0, ffnDownY + 0.5, z]} color={COLORS.ACTIVATIONS} />

      {/* FFN Down — CLICKABLE */}
      <TensorBlock position={[0, ffnDownY, 0]} dims={[W, 0.8, D]} color={COLORS.WEIGHTS} onClick={click('ffn_down')} highlighted={hl('ffn_down')} />
      <Label3D position={[0, ffnDownY, D]} text="FFN Down" color={COLORS.WEIGHTS} size={0.24} />
      <Label3D position={[W / 2 + 1.5, ffnDownY, 0]} text={`${vit.intermediate_size} → ${vit.hidden_size}`} color="#888899" size={0.15} />

      {/* Residual Add 2 */}
      <FlowArrow from={[0, ffnDownY - 0.5, z]} to={[0, add2Y + 0.22, z]} color="#999999" />
      <mesh position={[0, add2Y, z]} onClick={click('residual')}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color={COLORS.RESIDUAL} emissive={COLORS.RESIDUAL} emissiveIntensity={hl('residual') ? 0.5 : 0.3} />
      </mesh>
      <Label3D position={[0.7, add2Y, z]} text="+" color={COLORS.RESIDUAL} size={0.35} />
      <FlowArrow from={[resX, add1Y, z]} to={[resX, add2Y, z]} color={COLORS.RESIDUAL} />
      <FlowArrow from={[resX, add2Y, z]} to={[0.35, add2Y, z]} color={COLORS.RESIDUAL} />

      <FlowArrow from={[0, add2Y - 0.3, z]} to={[0, outputY + 0.4, z]} color="#999999" />

      {/* Output */}
      <TensorBlock position={[0, outputY, 0]} dims={[W, 0.6, D]} color={COLORS.RESIDUAL} opacity={0.85} />
      <Label3D position={[0, outputY, D]} text="Output Tokens" color={COLORS.RESIDUAL} size={0.26} />
    </group>
  )
}
