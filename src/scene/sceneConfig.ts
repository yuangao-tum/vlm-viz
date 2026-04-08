// Global 3D scene layout constants

// How many window.innerHeight scroll units per step
export const SCROLL_HEIGHT_PER_STEP = 3

// Y spacing between stacked ViT layers
export const VIT_LAYER_Y_SPACING = 2.5
// Y spacing between stacked LLM layers (offset below ViT stack)
export const LLM_LAYER_Y_OFFSET = -60
export const LLM_LAYER_Y_SPACING = 2.5

// Tensor block dimensions (scene units)
export const TENSOR = {
  // Embedding bar width/depth
  BAR_W: 0.18,
  BAR_D: 0.18,
  // Height per 1024 hidden units
  HIDDEN_UNIT: 0.003,
  // Layer slab thickness (compressed view)
  SLAB_H: 0.4,
  // Attention matrix cell size
  ATTN_CELL: 0.15,
} as const

// Post-processing config
export const POST_FX = {
  BLOOM_THRESHOLD: 0.65,
  BLOOM_INTENSITY: 0.5,
  VIGNETTE_OFFSET: 0.3,
  VIGNETTE_DARKNESS: 0.5,
} as const
