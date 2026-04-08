/**
 * Viridis colormap: maps value ∈ [0,1] → [r, g, b] ∈ [0,1]
 * Perceptually uniform, great for attention weights.
 */
const VIRIDIS = [
  [0.267, 0.005, 0.329],
  [0.283, 0.141, 0.458],
  [0.254, 0.265, 0.530],
  [0.207, 0.372, 0.553],
  [0.164, 0.471, 0.558],
  [0.128, 0.567, 0.551],
  [0.135, 0.659, 0.518],
  [0.267, 0.749, 0.441],
  [0.478, 0.821, 0.318],
  [0.741, 0.873, 0.150],
  [0.993, 0.906, 0.144],
]

export function viridis(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t))
  const idx = clamped * (VIRIDIS.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(VIRIDIS.length - 1, lo + 1)
  const f = idx - lo
  return [
    VIRIDIS[lo][0] + (VIRIDIS[hi][0] - VIRIDIS[lo][0]) * f,
    VIRIDIS[lo][1] + (VIRIDIS[hi][1] - VIRIDIS[lo][1]) * f,
    VIRIDIS[lo][2] + (VIRIDIS[hi][2] - VIRIDIS[lo][2]) * f,
  ]
}

/**
 * Plasma colormap
 */
const PLASMA = [
  [0.050, 0.030, 0.528],
  [0.296, 0.007, 0.602],
  [0.490, 0.012, 0.621],
  [0.663, 0.072, 0.580],
  [0.796, 0.166, 0.484],
  [0.893, 0.271, 0.377],
  [0.957, 0.385, 0.269],
  [0.989, 0.513, 0.159],
  [0.990, 0.651, 0.072],
  [0.959, 0.796, 0.119],
  [0.940, 0.975, 0.131],
]

export function plasma(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t))
  const idx = clamped * (PLASMA.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(PLASMA.length - 1, lo + 1)
  const f = idx - lo
  return [
    PLASMA[lo][0] + (PLASMA[hi][0] - PLASMA[lo][0]) * f,
    PLASMA[lo][1] + (PLASMA[hi][1] - PLASMA[lo][1]) * f,
    PLASMA[lo][2] + (PLASMA[hi][2] - PLASMA[lo][2]) * f,
  ]
}
