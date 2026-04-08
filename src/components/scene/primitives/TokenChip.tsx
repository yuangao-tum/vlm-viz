'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

interface TokenChipProps {
  position?: [number, number, number]
  label: string
  color?: string
  scale?: number
}

export function TokenChip({ position = [0, 0, 0], label, color = '#F8F9FA', scale = 1 }: TokenChipProps) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[1.4, 0.5, 0.2]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <Text
        position={[0, 0, 0.12]}
        fontSize={0.18}
        color="#1a1a2e"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {label}
      </Text>
    </group>
  )
}
