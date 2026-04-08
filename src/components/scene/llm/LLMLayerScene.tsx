'use client'
import { TensorBlock } from '../primitives/TensorBlock'
import { AttentionMatrix } from '../primitives/AttentionMatrix'
import { FlowArrow } from '../primitives/FlowArrow'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'
import { useWalkthroughStore } from '@/store/walkthroughStore'

interface LLMLayerSceneProps { t: number }

export function LLMLayerScene({ t }: LLMLayerSceneProps) {
  const { llm, vit, family } = useModelStore((s) => s.model)
  const { activeSubBlock, setActiveSubBlock } = useWalkthroughStore()

  const W = 5.5, D = 0.8, gap = 2.5, resX = W / 2 + 2.2
  const z = D / 2 + 0.01

  let y = 12
  const inputY = y; y -= gap
  const norm1Y = y; y -= gap
  const qkvY = y; y -= gap * 1.4
  const attnY = y; y -= gap * 1.2
  const oProjY = y; y -= gap * 0.8
  const add1Y = y; y -= gap
  const norm2Y = y; y -= gap
  const gateY = y; y -= gap
  const mulY = y; y -= gap
  const downY = y; y -= gap * 0.8
  const add2Y = y; y -= gap
  const outputY = y

  const qPerKv = llm.num_heads / llm.num_kv_heads
  const click = (id: string) => () => setActiveSubBlock(id)
  const hl = (id: string) => activeSubBlock === id

  return (
    <group>
      <Label3D position={[0, inputY + 2.5, 0]} text={`LLM Decoder Layer (1 of ${llm.num_layers})`} color="#1a1a2e" size={0.5} />
      <Label3D position={[0, inputY + 1.6, 0]} text={`${family === 'qwen3' ? 'Qwen3-VL' : 'Qwen2.5-VL'} · ${llm.hidden_size}-dim · GQA(${llm.num_heads}Q/${llm.num_kv_heads}KV) · Click any block for details`} color="#888899" size={0.2} />

      {/* Input */}
      <TensorBlock position={[0, inputY, 0]} dims={[W, 0.6, D]} color={COLORS.RESIDUAL} opacity={0.85} />
      <Label3D position={[0, inputY, D]} text="Input Hidden States" color={COLORS.RESIDUAL} size={0.26} />
      <Label3D position={[W / 2 + 1.5, inputY, 0]} text={`seq × ${llm.hidden_size}`} color="#888899" size={0.18} />

      <FlowArrow from={[0, inputY - 0.4, z]} to={[0, norm1Y + 0.35, z]} color="#999999" />

      {/* RMSNorm 1 — CLICKABLE */}
      <TensorBlock position={[0, norm1Y, 0]} dims={[W, 0.5, D]} color={COLORS.NORM} onClick={click('rmsnorm')} highlighted={hl('rmsnorm')} />
      <Label3D position={[0, norm1Y, D]} text="RMSNorm" color={COLORS.NORM} size={0.26} />

      <FlowArrow from={[0, norm1Y - 0.35, z]} to={[0, qkvY + 0.6, z]} color="#999999" />

      {/* Q/K/V — CLICKABLE */}
      <group position={[0, qkvY, 0]}>
        <TensorBlock position={[-2, 0, 0]} dims={[1.8, 1.0, D]} color={COLORS.WEIGHTS} onClick={click('qkv')} highlighted={hl('qkv')} />
        <Label3D position={[-2, 0, D]} text="W_q" color={COLORS.WEIGHTS} size={0.22} />
        <TensorBlock position={[0.3, 0, 0]} dims={[1.2, 1.0, D]} color={COLORS.KV_CACHE} onClick={click('qkv')} highlighted={hl('qkv')} />
        <Label3D position={[0.3, 0, D]} text="W_k" color={COLORS.KV_CACHE} size={0.22} />
        <TensorBlock position={[2.2, 0, 0]} dims={[1.2, 1.0, D]} color={COLORS.KV_CACHE} onClick={click('qkv')} highlighted={hl('qkv')} />
        <Label3D position={[2.2, 0, D]} text="W_v" color={COLORS.KV_CACHE} size={0.22} />
        <Label3D position={[W / 2 + 1.5, 0.3, 0]} text={`${llm.num_heads} Q · ${llm.num_kv_heads} KV`} color="#888899" size={0.16} />
        <Label3D position={[W / 2 + 1.5, 0, 0]} text={`${qPerKv} Q per KV group`} color="#aaaaaa" size={0.13} />
        {family === 'qwen3' && <Label3D position={[W / 2 + 1.5, -0.3, 0]} text="+ QK-Norm" color="#E67700" size={0.13} />}
      </group>

      <FlowArrow from={[0, qkvY - 0.6, z]} to={[0, attnY + 0.5, z]} color={COLORS.ATTENTION} />

      {/* MROPE label — CLICKABLE */}
      <Label3D position={[W / 2 + 1.5, (qkvY + attnY) / 2, 0]} text="MROPE ›" color="#3B82F6" size={0.15} />

      {/* Attention — CLICKABLE */}
      <TensorBlock position={[0, attnY, 0]} dims={[W, 0.8, D]} color={COLORS.ATTENTION} opacity={0.75} onClick={click('attention')} highlighted={hl('attention')} />
      <Label3D position={[0, attnY, D]} text="Causal Self-Attention" color={COLORS.ATTENTION} size={0.22} />
      <Label3D position={[W / 2 + 1.5, attnY, 0]} text="+ causal mask + MROPE" color="#aaaaaa" size={0.13} />

      {/* Causal mask matrix — CLICKABLE */}
      <group position={[-W / 2 - 2.8, attnY, 0]} onClick={click('causal_mask')}>
        <AttentionMatrix position={[0, 0, 0]} size={8} cellSize={0.16} />
        <Label3D position={[0, 1.0, 0]} text={hl('causal_mask') ? '▶ Causal Mask' : 'Causal Mask'} color={hl('causal_mask') ? '#1a1a2e' : COLORS.ATTENTION} size={0.18} />
      </group>

      <FlowArrow from={[0, attnY - 0.5, z]} to={[0, oProjY + 0.45, z]} color={COLORS.ATTENTION} />

      {/* Output Proj */}
      <TensorBlock position={[0, oProjY, 0]} dims={[W, 0.7, D]} color={COLORS.WEIGHTS} onClick={click('output_proj')} highlighted={hl('output_proj')} />
      <Label3D position={[0, oProjY, D]} text="Output Proj (W_o)" color={COLORS.WEIGHTS} size={0.22} />

      {/* Residual 1 — CLICKABLE */}
      <FlowArrow from={[0, oProjY - 0.45, z]} to={[0, add1Y + 0.22, z]} color="#999999" />
      <mesh position={[0, add1Y, z]} onClick={click('residual')}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color={COLORS.RESIDUAL} emissive={COLORS.RESIDUAL} emissiveIntensity={hl('residual') ? 0.5 : 0.3} />
      </mesh>
      <Label3D position={[0.7, add1Y, z]} text="+" color={COLORS.RESIDUAL} size={0.35} />
      <FlowArrow from={[resX, inputY, z]} to={[resX, add1Y, z]} color={COLORS.RESIDUAL} />
      <FlowArrow from={[resX, add1Y, z]} to={[0.35, add1Y, z]} color={COLORS.RESIDUAL} />

      <FlowArrow from={[0, add1Y - 0.3, z]} to={[0, norm2Y + 0.35, z]} color="#999999" />

      {/* RMSNorm 2 — CLICKABLE */}
      <TensorBlock position={[0, norm2Y, 0]} dims={[W, 0.5, D]} color={COLORS.NORM} onClick={click('rmsnorm')} highlighted={hl('rmsnorm')} />
      <Label3D position={[0, norm2Y, D]} text="RMSNorm" color={COLORS.NORM} size={0.26} />

      <FlowArrow from={[0, norm2Y - 0.35, z]} to={[0, gateY + 0.55, z]} color="#999999" />

      {/* SwiGLU: Gate + Up — CLICKABLE */}
      <group position={[0, gateY, 0]}>
        <TensorBlock position={[-1.5, 0, 0]} dims={[2, 0.9, D]} color={COLORS.WEIGHTS} onClick={click('swiglu')} highlighted={hl('swiglu')} />
        <Label3D position={[-1.5, 0, D]} text="W_gate" color={COLORS.WEIGHTS} size={0.22} />
        <TensorBlock position={[1.5, 0, 0]} dims={[2, 0.9, D]} color={COLORS.WEIGHTS} onClick={click('swiglu')} highlighted={hl('swiglu')} />
        <Label3D position={[1.5, 0, D]} text="W_up" color={COLORS.WEIGHTS} size={0.22} />
        <Label3D position={[W / 2 + 1.5, 0, 0]} text={`${llm.hidden_size} → ${llm.intermediate_size}`} color="#888899" size={0.15} />
      </group>

      {/* SiLU + multiply */}
      <group position={[0, mulY, 0]}>
        <mesh position={[-1.5, 0, z]} onClick={click('swiglu')}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color={COLORS.ATTENTION} emissive={COLORS.ATTENTION} emissiveIntensity={0.3} />
        </mesh>
        <Label3D position={[-1.5, -0.5, z]} text="SiLU" color={COLORS.ATTENTION} size={0.18} />
        <mesh position={[0, 0, z]} onClick={click('swiglu')}>
          <sphereGeometry args={[0.3, 10, 10]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={hl('swiglu') ? 0.5 : 0.3} />
        </mesh>
        <Label3D position={[0, 0, z]} text="x" color="#ffffff" size={0.25} />
        <FlowArrow from={[-1.5, 0.55, z]} to={[-1.5, 0.25, z]} color={COLORS.ACTIVATIONS} />
        <FlowArrow from={[-1.2, 0, z]} to={[-0.35, 0, z]} color={COLORS.ACTIVATIONS} />
        <FlowArrow from={[1.5, 0.55, z]} to={[0.35, 0.05, z]} color={COLORS.ACTIVATIONS} />
      </group>

      <FlowArrow from={[0, mulY - 0.4, z]} to={[0, downY + 0.45, z]} color={COLORS.ACTIVATIONS} />

      {/* Down proj — CLICKABLE */}
      <TensorBlock position={[0, downY, 0]} dims={[W, 0.7, D]} color={COLORS.WEIGHTS} onClick={click('swiglu')} highlighted={hl('swiglu')} />
      <Label3D position={[0, downY, D]} text="W_down" color={COLORS.WEIGHTS} size={0.22} />
      <Label3D position={[W / 2 + 1.5, downY, 0]} text={`${llm.intermediate_size} → ${llm.hidden_size}`} color="#888899" size={0.15} />

      {/* Residual 2 */}
      <FlowArrow from={[0, downY - 0.45, z]} to={[0, add2Y + 0.22, z]} color="#999999" />
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
      <Label3D position={[0, outputY, D]} text="Output Hidden States" color={COLORS.RESIDUAL} size={0.26} />

      {/* DeepStack annotation (Qwen3 only) */}
      {family === 'qwen3' && (
        <group position={[-W / 2 - 3.5, outputY + 1, 0]}>
          <Label3D position={[0, 0.5, 0]} text="DeepStack:" color="#E67700" size={0.18} />
          <Label3D position={[0, 0, 0]} text={`At layers [${vit.deep_fusion_layers.join(', ')}]:`} color="#E67700" size={0.15} />
          <Label3D position={[0, -0.4, 0]} text="h[vis_pos] += vit_feat" color="#E67700" size={0.14} />
        </group>
      )}
    </group>
  )
}
