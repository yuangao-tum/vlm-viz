'use client'
import { Text, Billboard } from '@react-three/drei'

interface Label3DProps {
  position?: [number, number, number]
  text: string
  size?: number
  color?: string
  billboard?: boolean
  opacity?: number
}

export function Label3D({
  position = [0, 0, 0],
  text,
  size = 0.4,
  color = '#ffffff',
  billboard = true,
  opacity = 1,
}: Label3DProps) {
  if (opacity < 0.01) return null

  const textEl = (
    <Text
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
    >
      {text}
    </Text>
  )

  if (billboard) {
    return <Billboard position={position}>{textEl}</Billboard>
  }
  return <group position={position}>{textEl}</group>
}
