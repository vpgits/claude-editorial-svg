/**
 * Path construction.
 *
 * Everything in this system is ultimately a smooth curve through a handful of
 * points. Writing cubic Bezier control points by hand is where hand-authored SVG
 * goes wrong — you get either stiff polylines or curves that overshoot. Fitting a
 * Catmull-Rom spline through the points and converting to cubics gives a curve
 * that actually passes through every point you specify, so the coordinates you
 * write are the coordinates you see.
 */

import type { Rng } from './random.ts'
import { createNoise, createLoopNoise } from './random.ts'

export type Point = [number, number]

/** Round to 2dp. Keeps files small and diffs readable without visible faceting. */
const r = (n: number): number => Math.round(n * 100) / 100

/**
 * Fit a smooth curve through every point and emit an SVG path.
 *
 * `tension` controls how tight the curve is: 1 is the natural Catmull-Rom shape,
 * lower is straighter and stiffer, higher bulges. Stay near 1 unless you want a
 * specific effect.
 */
export function curveThrough(points: Point[], closed = false, tension = 1): string {
  if (points.length < 2) return ''
  if (points.length === 2 && !closed) {
    return `M${r(points[0][0])} ${r(points[0][1])}L${r(points[1][0])} ${r(points[1][1])}`
  }

  const n = points.length
  const at = (i: number): Point => {
    if (closed) return points[((i % n) + n) % n]
    return points[Math.max(0, Math.min(n - 1, i))]
  }

  const segments = closed ? n : n - 1
  let d = `M${r(points[0][0])} ${r(points[0][1])}`

  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)

    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension

    d += `C${r(c1x)} ${r(c1y)} ${r(c2x)} ${r(c2y)} ${r(p2[0])} ${r(p2[1])}`
  }

  return closed ? d + 'Z' : d
}

/** Straight polyline. Use when you want the stiffness — screens, tables, frames. */
export function lineThrough(points: Point[], closed = false): string {
  if (points.length < 2) return ''
  let d = `M${r(points[0][0])} ${r(points[0][1])}`
  for (let i = 1; i < points.length; i++) d += `L${r(points[i][0])} ${r(points[i][1])}`
  return closed ? d + 'Z' : d
}

/**
 * Straight-line resampling. Densifies a polyline without changing its shape.
 * Use when the corners are the point — a UI frame, a bracket, a table.
 */
export function resample(points: Point[], perSegment = 8): Point[] {
  if (points.length < 2) return points
  const out: Point[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment
      out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t])
    }
  }
  out.push(points[points.length - 1])
  return out
}

/**
 * Densify by evaluating the spline itself, so the extra points lie on the curve.
 *
 * This distinction matters more than it sounds. Interpolating along the straight
 * chords first and then fitting a curve through the result pins the curve to the
 * polyline — every direction change stays a visible corner, and the drawing comes
 * out angular no matter how smooth the fit is supposed to be. Sampling the actual
 * spline gives points that already curve, so wobble can be applied without
 * destroying the smoothness.
 */
export function sampleSpline(points: Point[], closed = false, perSegment = 10): Point[] {
  if (points.length < 3) return resample(points, perSegment)
  const n = points.length
  const at = (i: number): Point => {
    if (closed) return points[((i % n) + n) % n]
    return points[Math.max(0, Math.min(n - 1, i))]
  }
  const segments = closed ? n : n - 1
  const out: Point[] = []
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment
      const t2 = t * t
      const t3 = t2 * t
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      out.push([x, y])
    }
  }
  if (!closed) out.push(points[n - 1])
  return out
}

/**
 * Push points sideways along a slow drift, so a line reads as drawn rather than
 * plotted. Displacement is perpendicular to local direction — that bends the
 * line without changing where it starts, ends, or how long it is.
 *
 * Keep `amount` small (2-8 on a 1000px canvas). Past that it stops looking like
 * a steady hand and starts looking like a mistake.
 */
export function wobble(points: Point[], rng: Rng, amount: number): Point[] {
  if (amount <= 0 || points.length < 2) return points
  const noise = createNoise(rng, 3)
  return points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)]
    const nextP = points[Math.min(points.length - 1, i + 1)]
    let dx = nextP[0] - prev[0]
    let dy = nextP[1] - prev[1]
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    // Perpendicular of (dx, dy) is (-dy, dx).
    const t = i / points.length
    const off = noise(t * 6) * amount
    // Taper the displacement at both ends so endpoints stay put — a drawn line
    // still starts and stops where the artist aimed.
    const ease = Math.sin(Math.PI * t)
    return [p[0] - dy * off * ease, p[1] + dx * off * ease] as Point
  })
}

/**
 * An irregular closed shape — the workhorse for carriers and organic masses.
 *
 * `roughness` is a fraction of the radius: 0.05 is a slightly-off shape, 0.15 is
 * clearly hand-torn, past 0.25 it stops reading as a single form.
 *
 * `squareness` reshapes the base form before noise is applied. At 2 it is a true
 * ellipse; raising it flattens the sides and tightens the corners toward a
 * rounded rectangle. A carrier wants to read as a sheet of paper, and a pure
 * ellipse never does — it reads as a bubble, which pulls the eye to the centre
 * instead of letting the drawing sit on it.
 */
export function blobPoints(
  cx: number,
  cy: number,
  width: number,
  height: number,
  rng: Rng,
  roughness = 0.07,
  samples = 14,
  squareness = 2,
): Point[] {
  const noise = createLoopNoise(rng, 3)
  const rx = width / 2
  const ry = height / 2
  const points: Point[] = []
  // Random start angle so repeated blobs on one canvas don't share a silhouette.
  const phase = rng.range(0, Math.PI * 2)
  const exp = 2 / squareness
  for (let i = 0; i < samples; i++) {
    const t = i / samples
    const angle = t * Math.PI * 2 + phase
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    // Superellipse: |x/rx|^n + |y/ry|^n = 1.
    const sx = Math.sign(c) * Math.pow(Math.abs(c), exp)
    const sy = Math.sign(s) * Math.pow(Math.abs(s), exp)
    const k = 1 + noise(t) * roughness
    points.push([cx + sx * rx * k, cy + sy * ry * k])
  }
  return points
}

/**
 * A rectangle drawn by hand: corners land close to where they should, edges bow
 * slightly. Returns points, not a path, so callers can wobble or close as needed.
 */
export function roughRectPoints(
  x: number,
  y: number,
  w: number,
  h: number,
  rng: Rng,
  slop = 6,
): Point[] {
  const j = (v: number) => rng.jitter(v, slop)
  return [
    [j(x), j(y)],
    [j(x + w * 0.5), j(y - slop * 0.3)],
    [j(x + w), j(y)],
    [j(x + w + slop * 0.3), j(y + h * 0.5)],
    [j(x + w), j(y + h)],
    [j(x + w * 0.5), j(y + h + slop * 0.3)],
    [j(x), j(y + h)],
    [j(x - slop * 0.3), j(y + h * 0.5)],
  ]
}

/** Distance between two points. */
export function dist(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

/** Point at parameter t along a straight segment. */
export function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/** Unit direction from a to b. */
export function direction(a: Point, b: Point): Point {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  return [dx / len, dy / len]
}

/** Rotate a point around an origin by radians. */
export function rotate(p: Point, origin: Point, radians: number): Point {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  const dx = p[0] - origin[0]
  const dy = p[1] - origin[1]
  return [origin[0] + dx * c - dy * s, origin[1] + dx * s + dy * c]
}

export { r as round }
