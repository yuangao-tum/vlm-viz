'use client'
import { useMemo } from 'react'
import { Text, Line } from '@react-three/drei'
import { TensorBlock } from '../primitives/TensorBlock'
import { COLORS } from '@/scene/colorPalette'
import { useModelStore } from '@/store/modelStore'

/**
 * Two-tower visualization of DeepStack:
 * Left tower = ViT layers (stacked vertically)
 * Right tower = LLM layers (stacked vertically)
 * Glowing bridge arrows at fusion points
 */
export function DeepStackViz({ position = [0, 0, 0] as [number, number, number] }) {
  const { vit, llm } = useModelStore((s) => s.model)

  const vitLayerH = 0.3
  const llmLayerH = 0.3
  const towerGap = 10    // horizontal distance between towers
  const vitX = -towerGap / 2
  const llmX = towerGap / 2

  const vitTotalH = vit.depth * vitLayerH
  const llmTotalH = llm.num_layers * llmLayerH

  // Map deepstack ViT layer indices to injection points in LLM
  // Qwen3 injects at LLM layers corresponding to deepstack indices [0,1,2]
  const fusionPairs = vit.deep_fusion_layers.map((vitLayer, i) => ({
    vitLayer,
    llmLayer: vitLayer, // injected at the same layer index in the LLM
    color: ['#FF6B6B', '#FFA94D', '#FFD43B'][i] ?? '#E67700',
    label: `L${vitLayer}`,
  }))

  return (
    <group position={position}>
      {/* ViT Tower */}
      <group position={[vitX, 0, 0]}>
        <Text position={[0, 2, 0]} fontSize={0.4} color="#1a1a2e" anchorX="center" fontWeight="bold">
          ViT Encoder
        </Text>
        <Text position={[0, 1.4, 0]} fontSize={0.2} color="#888899" anchorX="center">
          {`${vit.depth} layers · ${vit.hidden_size}-dim`}
        </Text>

        {Array.from({ length: vit.depth }).map((_, i) => {
          const y = -i * vitLayerH
          const isFusion = vit.deep_fusion_layers.includes(i)
          const fusionIdx = vit.deep_fusion_layers.indexOf(i)
          const color = isFusion
            ? (fusionPairs[fusionIdx]?.color ?? COLORS.ATTENTION)
            : COLORS.WEIGHTS

          return (
            <group key={`vit-${i}`}>
              <TensorBlock
                position={[0, y, 0]}
                dims={[3, vitLayerH * 0.85, 0.8]}
                color={color}
                opacity={isFusion ? 0.95 : 0.5}
                highlighted={isFusion}
              />
              {/* Layer number */}
              <Text position={[-2, y, 0]} fontSize={0.13} color={isFusion ? color : '#aaaaaa'} anchorX="right">
                {`L${i}`}
              </Text>
              {/* Fusion label */}
              {isFusion && (
                <Text position={[-2, y - 0.15, 0]} fontSize={0.11} color={color} anchorX="right">
                  extract →
                </Text>
              )}
            </group>
          )
        })}

        {/* Final output label */}
        <Text position={[0, -vit.depth * vitLayerH - 0.5, 0]} fontSize={0.18} color={COLORS.ACTIVATIONS} anchorX="center">
          Final → Merge → Connector
        </Text>
      </group>

      {/* LLM Tower */}
      <group position={[llmX, 0, 0]}>
        <Text position={[0, 2, 0]} fontSize={0.4} color="#1a1a2e" anchorX="center" fontWeight="bold">
          LLM Decoder
        </Text>
        <Text position={[0, 1.4, 0]} fontSize={0.2} color="#888899" anchorX="center">
          {`${llm.num_layers} layers · ${llm.hidden_size}-dim`}
        </Text>

        {Array.from({ length: llm.num_layers }).map((_, i) => {
          const y = -i * llmLayerH
          const fusionMatch = fusionPairs.find(f => f.llmLayer === i)
          const color = fusionMatch ? fusionMatch.color : COLORS.WEIGHTS

          return (
            <group key={`llm-${i}`}>
              <TensorBlock
                position={[0, y, 0]}
                dims={[3, llmLayerH * 0.85, 0.8]}
                color={color}
                opacity={fusionMatch ? 0.95 : 0.5}
                highlighted={!!fusionMatch}
              />
              <Text position={[2, y, 0]} fontSize={0.13} color={fusionMatch ? color : '#aaaaaa'} anchorX="left">
                {`L${i}`}
              </Text>
              {fusionMatch && (
                <Text position={[2, y - 0.15, 0]} fontSize={0.11} color={color} anchorX="left">
                  ← inject (additive)
                </Text>
              )}
            </group>
          )
        })}
      </group>

      {/* Bridge arrows between towers at fusion points */}
      {fusionPairs.map((pair, i) => {
        const vitY = -pair.vitLayer * vitLayerH
        const llmY = -pair.llmLayer * llmLayerH
        const fromX = vitX + 1.8
        const toX = llmX - 1.8

        // Bridge path: horizontal arrow with slight arc
        const midX = (fromX + toX) / 2
        const midY = (vitY + llmY) / 2 + 0.3
        const points: [number, number, number][] = [
          [fromX, vitY, 0],
          [midX - 1, midY, 0],
          [midX + 1, midY, 0],
          [toX, llmY, 0],
        ]

        return (
          <group key={`bridge-${i}`}>
            {/* Glowing bridge line */}
            <Line
              points={points}
              color={pair.color}
              lineWidth={3}
              transparent
              opacity={0.9}
            />
            {/* Bridge label */}
            <Text
              position={[midX, midY + 0.35, 0]}
              fontSize={0.18}
              color={pair.color}
              anchorX="center"
              fontWeight="bold"
            >
              {`DeepStack ${pair.label}`}
            </Text>
            {/* Operation description */}
            <Text
              position={[midX, midY + 0.1, 0]}
              fontSize={0.12}
              color="#888899"
              anchorX="center"
            >
              h[vis_pos] += feat
            </Text>

            {/* Arrow head at LLM end */}
            <mesh position={[toX, llmY, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.12, 0.3, 4]} />
              <meshStandardMaterial color={pair.color} />
            </mesh>
          </group>
        )
      })}

      {/* Legend */}
      <group position={[0, -Math.max(vitTotalH, llmTotalH) - 1.5, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.22} color="#1a1a2e" anchorX="center" fontWeight="bold">
          DeepStack: Multi-layer Visual Feature Injection
        </Text>
        <Text position={[0, -0.5, 0]} fontSize={0.16} color="#666680" anchorX="center">
          ViT intermediate features are additively fused into LLM hidden states at visual token positions
        </Text>
        <Text position={[0, -0.9, 0]} fontSize={0.16} color="#666680" anchorX="center">
          vs. Qwen2.5-VL which only injects visual tokens once at the LLM input
        </Text>
      </group>
    </group>
  )
}
