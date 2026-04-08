'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { TensorBlock } from '../primitives/TensorBlock'
import { Label3D } from '../primitives/Label3D'
import { COLORS } from '@/scene/colorPalette'
import { TRAJECTORY_HEAD, BEV } from '@/scene/modelConstants'
import { smoothstep, subrange, easeOutCubic } from '@/lib/utils/lerp'

interface TrajectoryOutputSceneProps { t: number }

// Demo trajectory: gentle left turn (ego-centric meters)
const DEMO_TRAJECTORY = [
  { x: 0.0, y: 0.0 },
  { x: 2.5, y: 0.1 },
  { x: 5.0, y: 0.4 },
  { x: 7.4, y: 1.0 },
  { x: 9.6, y: 1.9 },
  { x: 11.5, y: 3.1 },
  { x: 13.1, y: 4.5 },
  { x: 14.4, y: 6.2 },
  { x: 15.3, y: 8.0 },
  { x: 15.8, y: 9.9 },
  { x: 15.9, y: 11.8 },
]

export function TrajectoryOutputScene({ t }: TrajectoryOutputSceneProps) {
  const planeT = smoothstep(0, 0.25, t)
  const pathT = smoothstep(0.2, 0.7, t)
  const labelT = smoothstep(0.4, 0.7, t)

  const scale = BEV.PLANE_SIZE / BEV.EXTENT_METERS

  // Convert trajectory points to scene positions
  const waypoints = useMemo(() =>
    DEMO_TRAJECTORY.map(p => [
      p.x * scale - BEV.PLANE_SIZE / 2,
      0.15,
      -p.y * scale,
    ] as [number, number, number]),
  [scale])

  // Line points for the path curve
  const visibleCount = Math.max(2, Math.floor(pathT * waypoints.length))
  const linePoints = waypoints.slice(0, visibleCount)

  return (
    <group>
      <Label3D position={[0, 7, 0]} text="Trajectory Output" color="#1a1a2e" size={0.5} opacity={planeT} />

      {/* BEV ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BEV.PLANE_SIZE, BEV.PLANE_SIZE]} />
        <meshStandardMaterial color="#0a1020" transparent opacity={0.9 * planeT} />
      </mesh>
      <gridHelper args={[BEV.PLANE_SIZE, 20, '#1a2a4a', '#0d1525']} />

      {/* Ego vehicle marker at origin */}
      <mesh position={[- BEV.PLANE_SIZE / 2, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#1a1a2e" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <Label3D position={[-BEV.PLANE_SIZE / 2, 0.6, 0]} text="Ego" color="#1a1a2e" size={0.25} opacity={planeT} />

      {/* Trajectory path line */}
      {linePoints.length >= 2 && (
        <Line
          points={linePoints}
          color={COLORS.TRAJECTORY}
          lineWidth={3}
          transparent
          opacity={pathT}
        />
      )}

      {/* Waypoint spheres */}
      {waypoints.map((pos, i) => {
        const delay = (i / waypoints.length) * 0.6
        const wpT = easeOutCubic(subrange(delay, delay + 0.3, pathT))
        if (wpT < 0.05) return null

        return (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[0.15 * wpT, 12, 12]} />
              <meshStandardMaterial
                color={COLORS.TRAJECTORY}
                emissive={COLORS.TRAJECTORY}
                emissiveIntensity={0.3}
              />
            </mesh>
            {wpT > 0.5 && (
              <Label3D
                position={[0, 0.4, 0]}
                text={`${(i * TRAJECTORY_HEAD.DT).toFixed(1)}s`}
                color={COLORS.TRAJECTORY}
                size={0.15}
                opacity={wpT}
              />
            )}
          </group>
        )
      })}

      {/* Annotations */}
      {labelT > 0.1 && (
        <>
          <Label3D
            position={[0, -BEV.PLANE_SIZE / 2 - 1, 0]}
            text={`${TRAJECTORY_HEAD.NUM_TIMESTEPS} waypoints · ${(TRAJECTORY_HEAD.NUM_TIMESTEPS - 1) * TRAJECTORY_HEAD.DT}s horizon · Ego-centric frame`}
            color="#666680"
            size={0.25}
            opacity={labelT}
          />
          <Label3D
            position={[BEV.PLANE_SIZE / 2 + 1.5, 0, 0]}
            text="x → forward"
            color="#666666"
            size={0.2}
            opacity={labelT}
          />
          <Label3D
            position={[0, 0, -BEV.PLANE_SIZE / 2 - 1]}
            text="y → left"
            color="#666666"
            size={0.2}
            opacity={labelT}
          />
        </>
      )}
    </group>
  )
}
