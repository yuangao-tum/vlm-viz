// Multi-model architecture constants

export interface ModelConfig {
  id: string
  name: string
  family: 'qwen3' | 'qwen2.5'
  vit: {
    depth: number
    hidden_size: number
    num_heads: number
    intermediate_size: number
    patch_size: number
    output_dim: number
    full_attn_layers: number[]
    deep_fusion_layers: number[]
    spatial_merge_size: number
    tokens_before_merge: number
    tokens_after_merge: number
  }
  llm: {
    num_layers: number
    hidden_size: number
    num_heads: number
    num_kv_heads: number
    head_dim: number
    intermediate_size: number
    vocab_size: number
  }
}

export const MODELS: Record<string, ModelConfig> = {
  'qwen3-vl-2b': {
    id: 'qwen3-vl-2b',
    name: 'Qwen3-VL-2B',
    family: 'qwen3',
    vit: {
      depth: 24, hidden_size: 1024, num_heads: 16, intermediate_size: 4096,
      patch_size: 16, output_dim: 2048,
      full_attn_layers: [7, 15, 23],
      deep_fusion_layers: [5, 11, 17],
      spatial_merge_size: 2,
      tokens_before_merge: 196, tokens_after_merge: 49,
    },
    llm: {
      num_layers: 28, hidden_size: 2048, num_heads: 16, num_kv_heads: 8,
      head_dim: 128, intermediate_size: 6144, vocab_size: 151936,
    },
  },
  'qwen3-vl-4b': {
    id: 'qwen3-vl-4b',
    name: 'Qwen3-VL-4B',
    family: 'qwen3',
    vit: {
      depth: 24, hidden_size: 1024, num_heads: 16, intermediate_size: 4096,
      patch_size: 16, output_dim: 2560,
      full_attn_layers: [7, 15, 23],
      deep_fusion_layers: [5, 11, 17],
      spatial_merge_size: 2,
      tokens_before_merge: 196, tokens_after_merge: 49,
    },
    llm: {
      num_layers: 36, hidden_size: 2560, num_heads: 32, num_kv_heads: 8,
      head_dim: 128, intermediate_size: 9728, vocab_size: 151936,
    },
  },
  'qwen3-vl-8b': {
    id: 'qwen3-vl-8b',
    name: 'Qwen3-VL-8B',
    family: 'qwen3',
    vit: {
      depth: 27, hidden_size: 1152, num_heads: 16, intermediate_size: 4304,
      patch_size: 16, output_dim: 4096,
      full_attn_layers: [8, 16, 24],
      deep_fusion_layers: [8, 16, 24],
      spatial_merge_size: 2,
      tokens_before_merge: 196, tokens_after_merge: 49,
    },
    llm: {
      num_layers: 36, hidden_size: 4096, num_heads: 32, num_kv_heads: 8,
      head_dim: 128, intermediate_size: 12288, vocab_size: 151936,
    },
  },
  'qwen2.5-vl-3b': {
    id: 'qwen2.5-vl-3b',
    name: 'Qwen2.5-VL-3B',
    family: 'qwen2.5',
    vit: {
      depth: 32, hidden_size: 1280, num_heads: 16, intermediate_size: 3420,
      patch_size: 14, output_dim: 2048,
      full_attn_layers: [7, 15, 23, 31],
      deep_fusion_layers: [],
      spatial_merge_size: 2,
      tokens_before_merge: 256, tokens_after_merge: 64,
    },
    llm: {
      num_layers: 36, hidden_size: 2048, num_heads: 16, num_kv_heads: 2,
      head_dim: 128, intermediate_size: 11008, vocab_size: 151936,
    },
  },
  'qwen2.5-vl-7b': {
    id: 'qwen2.5-vl-7b',
    name: 'Qwen2.5-VL-7B',
    family: 'qwen2.5',
    vit: {
      depth: 32, hidden_size: 1280, num_heads: 16, intermediate_size: 3420,
      patch_size: 14, output_dim: 2048,
      full_attn_layers: [7, 15, 23, 31],
      deep_fusion_layers: [],
      spatial_merge_size: 2,
      tokens_before_merge: 256, tokens_after_merge: 64,
    },
    llm: {
      num_layers: 36, hidden_size: 2048, num_heads: 16, num_kv_heads: 2,
      head_dim: 128, intermediate_size: 11008, vocab_size: 151936,
    },
  },
}

export const MODEL_IDS = Object.keys(MODELS)
export const DEFAULT_MODEL = 'qwen3-vl-2b'

// Legacy flat aliases — detail scenes use these (they show the selected model's data
// but the constants here default to the 2B model for compilation; the overview scene
// reads dynamically from the store for the pipeline labels)
const _default = MODELS[DEFAULT_MODEL]

export const VIT = {
  DEPTH: _default.vit.depth,
  HIDDEN_SIZE: _default.vit.hidden_size,
  NUM_HEADS: _default.vit.num_heads,
  INTERMEDIATE_SIZE: _default.vit.intermediate_size,
  PATCH_SIZE: _default.vit.patch_size,
  FULL_ATTN_LAYERS: _default.vit.full_attn_layers as readonly number[],
  DEEP_FUSION_LAYERS: _default.vit.deep_fusion_layers as readonly number[],
  TOKENS_BEFORE_MERGE: _default.vit.tokens_before_merge,
  TOKENS_AFTER_MERGE: _default.vit.tokens_after_merge,
  SPATIAL_MERGE_SIZE: _default.vit.spatial_merge_size,
  OUTPUT_DIM: _default.vit.output_dim,
} as const

export const LLM = {
  NUM_LAYERS: _default.llm.num_layers,
  HIDDEN_SIZE: _default.llm.hidden_size,
  NUM_HEADS: _default.llm.num_heads,
  NUM_KV_HEADS: _default.llm.num_kv_heads,
  HEAD_DIM: _default.llm.head_dim,
  INTERMEDIATE_SIZE: _default.llm.intermediate_size,
  VOCAB_SIZE: _default.llm.vocab_size,
  MAX_SEQ_LEN: 262144,
} as const

// Other legacy aliases
export const TRAJECTORY_HEAD = {
  INPUT_DIM: 2048,
  HIDDEN_DIM: 1024,
  OUTPUT_DIM: 55,
  NUM_TIMESTEPS: 11,
  FEATURES_PER_STEP: 5,
  DT: 0.5,
} as const

export const SPECIAL_TOKENS = {
  VISION_START: 151652,
  VISION_END: 151653,
  IMAGE_TOKEN: 151655,
  VIDEO_TOKEN: 151656,
  EOS: 151645,
  PAD: 151643,
} as const

export const IMAGE_CONFIG = {
  SCALE: 0.1,
  EXTENT_METERS: 25.6,
  PLANE_SIZE: 10,
} as const

export const BEV = IMAGE_CONFIG
