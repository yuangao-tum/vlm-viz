export interface AttentionLayer {
  layer_idx: number
  num_heads: number
  seq_len: number
  weights: number[][][]    // [heads, seq, seq]
}

export interface TrajectoryPoint {
  t: number
  x: number
  y: number
  velocity: number
  acceleration: number
  heading: number
}

export interface InferenceResponse {
  trajectory: TrajectoryPoint[]
  generated_text: string
  vit_attentions: Record<string, AttentionLayer>
  llm_attentions: Record<string, AttentionLayer>
  num_visual_tokens: number
  num_text_tokens: number
  timing: { vit_ms: number; llm_ms: number; head_ms: number }
}

export interface InferenceRequest {
  image: File
  vehicle_state: string
  style: string
}
