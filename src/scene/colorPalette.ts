// Semantic color palette — matches bbycroft visual language
export const COLORS = {
  WEIGHTS:     '#3B5BDB', // trainable parameters — deep blue
  ACTIVATIONS: '#2F9E44', // intermediate tensors — forest green
  ATTENTION:   '#E67700', // attention scores — amber
  KV_CACHE:    '#862E9C', // key/value tensors — purple
  CONNECTOR:   '#0CA678', // cross-modal bridge — teal
  TRAJECTORY:  '#F03E3E', // output waypoints — bright red
  SPECIAL:     '#C92A2A', // special tokens — dark red
  NORM:        '#74C0FC', // layer norm — light blue
  RESIDUAL:    '#A9E34B', // residual stream — lime
  TEXT_TOKEN:  '#F8F9FA', // text tokens — near white
  MUTED:       '#4a4a6a', // inactive / background
} as const

export type ColorKey = keyof typeof COLORS

// Color as THREE.Color hex number (e.g. 0x3B5BDB)
export function colorHex(key: ColorKey): number {
  return parseInt(COLORS[key].replace('#', ''), 16)
}
