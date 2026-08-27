/**
 * Seeded randomness.
 *
 * Every illustration must be reproducible: same seed in, byte-identical SVG out.
 * That is what makes the generated file safe to commit and diff. Nothing here
 * ever touches Math.random().
 */

export type Rng = {
  /** Uniform float in [0, 1). */
  next(): number
  /** Uniform float in [min, max). */
  range(min: number, max: number): number
  /** Symmetric jitter: v +/- amount. */
  jitter(v: number, amount: number): number
  /** Pick one item. */
  pick<T>(items: readonly T[]): T
  /** Coin flip with probability p of true. */
  chance(p: number): boolean
}

/** mulberry32 — small, fast, good enough for visual noise, fully deterministic. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    jitter: (v, amount) => v + (next() * 2 - 1) * amount,
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  }
}

/**
 * Smooth 1D noise built from a few sine harmonics.
 *
 * Per-coordinate white noise looks like a broken path, not a drawn one — a human
 * hand drifts slowly and corrects slowly. Summing a couple of low harmonics
 * gives that drift. Returns a function over t with output roughly in [-1, 1].
 */
export function createNoise(rng: Rng, harmonics = 3): (t: number) => number {
  const parts: Array<{ freq: number; phase: number; amp: number }> = []
  let total = 0
  for (let i = 0; i < harmonics; i++) {
    const amp = 1 / (i + 1)
    total += amp
    parts.push({ freq: i + 1, phase: rng.range(0, Math.PI * 2), amp })
  }
  return (t: number) => {
    let sum = 0
    for (const p of parts) sum += Math.sin(t * p.freq + p.phase) * p.amp
    return sum / total
  }
}

/**
 * Smooth noise that wraps seamlessly over t in [0, 1).
 *
 * Closed shapes (blobs) sample noise around a full circle. If the noise does not
 * return to its starting value the shape shows a visible seam where the outline
 * closes. Integer frequencies over a 2*PI period guarantee it wraps.
 */
export function createLoopNoise(rng: Rng, harmonics = 3): (t: number) => number {
  const parts: Array<{ freq: number; phase: number; amp: number }> = []
  let total = 0
  for (let i = 0; i < harmonics; i++) {
    const amp = 1 / (i + 1)
    total += amp
    parts.push({ freq: i + 1, phase: rng.range(0, Math.PI * 2), amp })
  }
  return (t: number) => {
    let sum = 0
    for (const p of parts) sum += Math.sin(t * Math.PI * 2 * p.freq + p.phase) * p.amp
    return sum / total
  }
}
