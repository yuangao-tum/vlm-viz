'use client'
import { Text, Line } from '@react-three/drei'

interface GroupBoxProps {
  position: [number, number, number]
  width: number
  height: number
  label: string
  sublabel?: string
  color: string
}

export function GroupBox({ position, width, height, label, sublabel, color }: GroupBoxProps) {
  const hw = width / 2
  const hh = height / 2

  // Dashed rectangle corners
  const corners: [number, number, number][] = [
    [-hw, -hh, 0], [hw, -hh, 0], [hw, hh, 0], [-hw, hh, 0], [-hw, -hh, 0],
  ]

  return (
    <group position={position}>
      {/* Background fill */}
      <mesh position={[0, 0, -0.15]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} transparent opacity={0.05} />
      </mesh>

      {/* Border */}
      <Line
        points={corners}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.4}
        dashed
        dashSize={0.3}
        gapSize={0.15}
      />

      {/* Label top-left */}
      <Text
        position={[-hw + 0.2, hh + 0.25, 0]}
        fontSize={0.22}
        color={color}
        anchorX="left"
        anchorY="bottom"
        fontWeight="bold"
      >
        {label}
      </Text>
      {sublabel && (
        <Text
          position={[-hw + 0.2, hh + 0.02, 0]}
          fontSize={0.14}
          color={color}
          anchorX="left"
          anchorY="bottom"
        >
          {sublabel}
        </Text>
      )}
    </group>
  )
}
