'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Line, Billboard } from '@react-three/drei'

interface FlowArrowProps {
  from: [number, number, number]
  to: [number, number, number]
  control?: [number, number, number]
  color?: string
  animated?: boolean
  radius?: number
}

const ARROW_SIZE = 0.3

export function FlowArrow({
  from,
  to,
  control,
  color = '#2F9E44',
}: FlowArrowProps) {
  const points = useMemo(() => {
    if (control) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...from),
        new THREE.Vector3(...control),
        new THREE.Vector3(...to),
      )
      return curve.getPoints(20)
    }
    return [new THREE.Vector3(...from), new THREE.Vector3(...to)]
  }, [from, to, control])

  // Build a flat triangle shape pointing in the flow direction
  const { triangleGeo, tipPos } = useMemo(() => {
    const pts = points
    const p1 = pts[pts.length - 2]
    const p2 = pts[pts.length - 1]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    // 2D angle of the direction (in the XY plane viewed from front)
    const angle = Math.atan2(dy, dx)

    // Triangle vertices: tip at (0, ARROW_SIZE), base at (-ARROW_SIZE/2, 0) and (ARROW_SIZE/2, 0)
    // Rotated by `angle - PI/2` so the tip points along the direction
    const rot = angle - Math.PI / 2
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)

    const s = ARROW_SIZE
    // Tip
    const tx = 0 * cos - s * sin
    const ty = 0 * sin + s * cos
    // Base left
    const lx = (-s * 0.5) * cos - 0 * sin
    const ly = (-s * 0.5) * sin + 0 * cos
    // Base right
    const rx = (s * 0.5) * cos - 0 * sin
    const ry = (s * 0.5) * sin + 0 * cos

    const shape = new THREE.Shape()
    shape.moveTo(tx, ty)
    shape.lineTo(lx, ly)
    shape.lineTo(rx, ry)
    shape.closePath()

    return {
      triangleGeo: new THREE.ShapeGeometry(shape),
      tipPos: [p2.x, p2.y, p2.z] as [number, number, number],
    }
  }, [points])

  return (
    <group>
      <Line
        points={points.map(p => [p.x, p.y, p.z] as [number, number, number])}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.7}
      />
      {/* Billboard triangle: always faces the camera, tip points along flow direction */}
      <Billboard position={tipPos}>
        <mesh geometry={triangleGeo}>
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </Billboard>
    </group>
  )
}
