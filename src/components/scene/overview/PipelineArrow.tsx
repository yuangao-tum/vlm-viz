'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

interface PipelineArrowProps {
  from: [number, number, number]
  to: [number, number, number]
  color?: string
}

export function PipelineArrow({ from, to, color = '#999999' }: PipelineArrowProps) {
  const midY = (from[1] + to[1]) / 2

  // If horizontal (same Y), draw straight line
  // If different Y, draw an L-shaped path
  const points = useMemo(() => {
    const dx = Math.abs(to[0] - from[0])
    const dy = Math.abs(to[1] - from[1])

    if (dy < 0.5) {
      // Horizontal
      return [from, to]
    }
    // L-shape: go down then across (or across then down)
    const mid: [number, number, number] = [from[0], to[1], from[2]]
    return [from, mid, to]
  }, [from, to])

  // Arrow head at the end
  const dir = new THREE.Vector3(
    to[0] - points[points.length - 2][0],
    to[1] - points[points.length - 2][1],
    to[2] - points[points.length - 2][2],
  ).normalize()

  const arrowRot = Math.atan2(dir.x, dir.y)

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.5}
      />
      {/* Arrow head */}
      <mesh position={to} rotation={[0, 0, -arrowRot]}>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <meshStandardMaterial color={color} opacity={0.7} transparent />
      </mesh>
    </group>
  )
}
