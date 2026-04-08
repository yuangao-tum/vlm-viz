'use client'
import { useState } from 'react'
import { Text, Edges } from '@react-three/drei'
import { useFinetuningStore } from '@/store/finetuningStore'
import { STATUS_COLORS, STATUS_LABELS, type ComponentStatus } from '@/scene/finetuningConfig'

interface FinetuningBlockProps {
  index: number
  position: [number, number, number]
  dims: [number, number, number]
  label: string
  sublabel?: string
  status: ComponentStatus
  loraRank?: number
}

export function FinetuningBlock({ index, position, dims, label, sublabel, status, loraRank }: FinetuningBlockProps) {
  const [hovered, setHovered] = useState(false)
  const setSelectedComponent = useFinetuningStore((s) => s.setSelectedComponent)
  const setHoveredComponent = useFinetuningStore((s) => s.setHoveredComponent)
  const color = STATUS_COLORS[status]
  const isFrozen = status === 'frozen'

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); setSelectedComponent(index) }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); setHoveredComponent(index); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { setHovered(false); setHoveredComponent(null); document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={dims} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isFrozen ? 0.4 : hovered ? 0.95 : 0.8}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : status === 'new' ? 0.2 : 0.05}
        />
        <Edges color={hovered ? '#000000' : color} threshold={15} scale={1.002} />
      </mesh>

      {/* Block label */}
      <Text position={[0, dims[1] / 2 + 0.4, 0]} fontSize={0.35} color="#1a1a2e" anchorX="center" anchorY="bottom" fontWeight="bold">
        {label}
      </Text>

      {/* Sublabel */}
      {sublabel && (
        <Text position={[0, -dims[1] / 2 - 0.3, 0]} fontSize={0.2} color="#666680" anchorX="center" anchorY="top">
          {sublabel}
        </Text>
      )}

      {/* Status badge */}
      <Text
        position={[0, -dims[1] / 2 - 0.6, 0]}
        fontSize={0.18}
        color={color}
        anchorX="center"
        anchorY="top"
        fontWeight="bold"
      >
        {STATUS_LABELS[status]}{loraRank ? ` (r=${loraRank})` : ''}
      </Text>

      {/* Click hint on hover */}
      {hovered && (
        <Text position={[0, -dims[1] / 2 - 0.9, 0]} fontSize={0.15} color="#3B82F6" anchorX="center" anchorY="top">
          Click for details
        </Text>
      )}
    </group>
  )
}
