'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '@/scene/colorPalette'
import { Edges } from '@react-three/drei'

export interface TensorBlockProps {
  position?: [number, number, number]
  dims?: [number, number, number]
  color?: string
  opacity?: number
  gridOpacity?: number
  highlighted?: boolean
  label?: string
  onClick?: () => void
}

export function TensorBlock({
  position = [0, 0, 0],
  dims = [1, 1, 1],
  color = COLORS.WEIGHTS,
  opacity = 0.85,
  highlighted = false,
  onClick,
}: TensorBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Skip rendering if dimensions are essentially zero
  if (dims[0] < 0.005 && dims[1] < 0.005 && dims[2] < 0.005) return null

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <boxGeometry args={dims} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        emissive={highlighted ? color : '#000000'}
        emissiveIntensity={highlighted ? 0.3 : 0}
      />
      <Edges color={color} threshold={15} scale={1.001} />
    </mesh>
  )
}
