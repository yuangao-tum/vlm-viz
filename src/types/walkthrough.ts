import type { CameraKeyframe } from '@/scene/cameraKeyframes'

export interface IStep {
  id: string
  index: number
  title: string
  subtitle: string
  commentary: string        // markdown prose
  camera: CameraKeyframe
  duration: number          // relative scroll weight (default 1.0)
}
