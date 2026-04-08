'use client'
import { useState } from 'react'
import { Text } from '@react-three/drei'
import { useWalkthroughStore } from '@/store/walkthroughStore'
import { Edges } from '@react-three/drei'

interface PipelineBlockProps {
  index: number
  position: [number, number, number]
  dims: [number, number, number]
  color: string
  label: string
  sublabel?: string
}

export function PipelineBlock({
  index,
  position,
  dims,
  color,
  label,
  sublabel,
}: PipelineBlockProps) {
  const [hovered, setHovered] = useState(false)
  const setActiveBlock = useWalkthroughStore((s) => s.setActiveBlock)
  const setHoveredBlock = useWalkthroughStore((s) => s.setHoveredBlock)

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); setActiveBlock(index) }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); setHoveredBlock(index); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { setHovered(false); setHoveredBlock(null); document.body.style.cursor = 'default' }}
      >
        <boxGeometry args={dims} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={hovered ? 0.95 : 0.8}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.05}
        />
        <Edges color={hovered ? '#000000' : color} threshold={15} scale={1.002} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, dims[1] / 2 + 0.4, 0]}
        fontSize={0.35}
        color="#1a1a2e"
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
      >
        {label}
      </Text>

      {/* Sublabel */}
      {sublabel && (
        <Text
          position={[0, -dims[1] / 2 - 0.3, 0]}
          fontSize={0.22}
          color="#666680"
          anchorX="center"
          anchorY="top"
        >
          {sublabel}
        </Text>
      )}

      {/* Click hint on hover */}
      {hovered && (
        <Text
          position={[0, -dims[1] / 2 - 0.7, 0]}
          fontSize={0.18}
          color="#3B5BDB"
          anchorX="center"
          anchorY="top"
        >
          Click to explore
        </Text>
      )}
    </group>
  )
}
