'use client'
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { useWalkthroughStore } from '@/store/walkthroughStore'
import { useModelStore } from '@/store/modelStore'
import { OVERVIEW_CAMERA, DETAIL_CAMERAS } from './overview/OverviewScene'

export function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const prevBlock = useRef<number | null | undefined>(undefined)
  const prevModel = useRef<string>('')
  const animating = useRef(false)
  const animProgress = useRef(1)

  const startPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const endPos = useRef(new THREE.Vector3())
  const endTarget = useRef(new THREE.Vector3())

  function animateTo(pos: [number, number, number], target: [number, number, number]) {
    startPos.current.copy(camera.position)
    if (controlsRef.current) {
      startTarget.current.copy(controlsRef.current.target)
    }
    endPos.current.set(...pos)
    endTarget.current.set(...target)
    animating.current = true
    animProgress.current = 0
  }

  useFrame((_, delta) => {
    const { activeBlock } = useWalkthroughStore.getState()
    const { selectedModelId } = useModelStore.getState()

    // Model changed → reset to overview
    if (selectedModelId !== prevModel.current) {
      prevModel.current = selectedModelId
      // Also reset activeBlock to null (go back to overview)
      useWalkthroughStore.getState().setActiveBlock(null)
      prevBlock.current = null
      animateTo(OVERVIEW_CAMERA.position, OVERVIEW_CAMERA.target)
    }

    // Block changed
    if (activeBlock !== prevBlock.current) {
      prevBlock.current = activeBlock
      if (activeBlock === null) {
        animateTo(OVERVIEW_CAMERA.position, OVERVIEW_CAMERA.target)
      } else {
        const cam = DETAIL_CAMERAS[activeBlock]
        if (cam) {
          animateTo(cam.position, cam.target)
        }
      }
    }

    // Run animation
    if (animating.current) {
      animProgress.current = Math.min(1, animProgress.current + delta * 2.0)
      const t = 1 - Math.pow(1 - animProgress.current, 3)

      camera.position.lerpVectors(startPos.current, endPos.current, t)
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startTarget.current, endTarget.current, t)
        controlsRef.current.update()
      }

      if (animProgress.current >= 1) {
        animating.current = false
      }
    }
  })

  // Initialize
  useEffect(() => {
    camera.position.set(...OVERVIEW_CAMERA.position)
    if (controlsRef.current) {
      controlsRef.current.target.set(...OVERVIEW_CAMERA.target)
      controlsRef.current.update()
    }
    prevBlock.current = null
    prevModel.current = useModelStore.getState().selectedModelId
  }, [camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      minDistance={2}
      maxDistance={100}
      maxPolarAngle={Math.PI}
    />
  )
}
