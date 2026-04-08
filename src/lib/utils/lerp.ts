/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Smooth Hermite interpolation between 0 and 1 */
export function smoothstep(edge0: number, edge1: number, t: number): number {
  const x = Math.max(0, Math.min(1, (t - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

/** Ease in-out cubic */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Ease out cubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Ease in cubic */
export function easeInCubic(t: number): number {
  return t * t * t
}

/** Map t into a sub-range [start, end] → [0, 1], clamped */
export function subrange(start: number, end: number, t: number): number {
  return Math.max(0, Math.min(1, (t - start) / (end - start)))
}
