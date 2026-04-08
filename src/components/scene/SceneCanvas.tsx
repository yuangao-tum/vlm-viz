'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { CameraController } from './CameraController'

interface SceneCanvasProps {
  children: React.ReactNode
}

export function SceneCanvas({ children }: SceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 10, 20], fov: 50, near: 0.1, far: 500 }}
      style={{ background: '#ffffff' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />
      <directionalLight position={[-10, -5, -10]} intensity={0.4} color="#3B5BDB" />

      <CameraController />

      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  )
}
