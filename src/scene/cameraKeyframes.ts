import { Vector3 } from 'three'

export interface CameraKeyframe {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

// One keyframe per walkthrough step (12 steps, index 0–11)
export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  // Step 0: BEV Image Input — top-down view
  { position: [0, 18, 4],    target: [0, 0, 0],    fov: 45 },
  // Step 1: Patch Embedding — front of embedding bar forest
  { position: [0, 4, 22],    target: [0, 2, 0],    fov: 50 },
  // Step 2: Single ViT Layer — side view of exploded layer
  { position: [22, -8, 6],   target: [0, -8, 0],   fov: 50 },
  // Step 3: ViT Stack — far zoom showing all 24 layers
  { position: [30, -20, 40], target: [0, -20, 0],  fov: 60 },
  // Step 4: Spatial Merge — above the merge animation
  { position: [0, 20, 8],    target: [0, 0, 0],    fov: 45 },
  // Step 5: Cross-modal Connector — isometric
  { position: [18, 4, 18],   target: [0, 0, 0],    fov: 45 },
  // Step 6: Text Tokenization — front facing token chips
  { position: [0, 0, 20],    target: [0, 0, 0],    fov: 50 },
  // Step 7: Sequence Concat — wide shot
  { position: [0, 2, 30],    target: [0, 0, 0],    fov: 55 },
  // Step 8: Single LLM Layer — side view
  { position: [25, -50, 8],  target: [0, -50, 0],  fov: 50 },
  // Step 9: LLM Stack — far zoom showing all 28 layers
  { position: [35, -65, 45], target: [0, -65, 0],  fov: 60 },
  // Step 10: Trajectory Head — close up
  { position: [12, -100, 4], target: [0, -100, 0], fov: 40 },
  // Step 11: Trajectory Output — slight orbit over BEV
  { position: [8, 12, 8],    target: [0, 0, 0],    fov: 40 },
]
