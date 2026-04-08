'use client'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface BEVImagePlaneProps {
  position?: [number, number, number]
  size?: number
  imageSrc?: string
}

export function BEVImagePlane({
  position = [0, 0, 0],
  size = 10,
  imageSrc,
}: BEVImagePlaneProps) {
  // Use a fallback grid if no image provided
  if (!imageSrc) {
    return (
      <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0d1a2e" wireframe={false}>
          <gridHelper args={[size, 14, '#1a3a5c', '#0d1a2e']} />
        </meshStandardMaterial>
      </mesh>
    )
  }

  return <BEVImageWithTexture position={position} size={size} imageSrc={imageSrc} />
}

function BEVImageWithTexture({ position, size, imageSrc }: Required<BEVImagePlaneProps>) {
  const texture = useTexture(imageSrc)
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}
