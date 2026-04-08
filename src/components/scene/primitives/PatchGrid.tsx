'use client'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { subrange, easeOutCubic } from '@/lib/utils/lerp'

interface PatchGridProps {
  position?: [number, number, number]
  patchesX?: number
  patchesY?: number
  planeSize?: number
  t?: number
}

export function PatchGrid({
  position = [0, 0, 0],
  patchesX = 14,
  patchesY = 14,
  planeSize = 10,
  t = 1,
}: PatchGridProps) {
  const cellW = planeSize / patchesX
  const cellH = planeSize / patchesY

  // Only show a subset of patches for performance
  const patches: { x: number; z: number; delay: number }[] = []
  for (let row = 0; row < patchesY; row++) {
    for (let col = 0; col < patchesX; col++) {
      const x = (col + 0.5) * cellW - planeSize / 2
      const z = (row + 0.5) * cellH - planeSize / 2
      const dist = Math.sqrt((col - patchesX / 2) ** 2 + (row - patchesY / 2) ** 2)
      const maxDist = Math.sqrt(2) * patchesX / 2
      const delay = (dist / maxDist) * 0.4
      patches.push({ x, z, delay })
    }
  }

  return (
    <group position={position}>
      {/* Base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial color="#e8e8f0" transparent opacity={0.8} />
      </mesh>

      {/* Patch quads */}
      {patches.map((p, i) => {
        const localT = easeOutCubic(subrange(p.delay, 1, t))
        if (localT < 0.01) return null
        const s = cellW * 0.88 * localT
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.01, p.z]}>
            <planeGeometry args={[s, s]} />
            <meshStandardMaterial
              color={`hsl(${200 + (i % 14) * 3}, 50%, 35%)`}
              transparent
              opacity={0.45 * localT}
            />
          </mesh>
        )
      })}

      {/* Grid lines */}
      <gridHelper args={[planeSize, patchesX, '#2a3a6a', '#1a2a4a']} />
    </group>
  )
}
