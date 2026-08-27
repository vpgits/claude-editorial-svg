/**
 * The scene: a small vocabulary of marks that emit plain SVG paths.
 *
 * Primitives exist so that composing an illustration is a design decision rather
 * than a coordinate-typing exercise. Each one takes intent (where, how big, which
 * way) and handles the hand-drawn quality itself.
 */

import type { Point } from './geometry.ts'
import {
  blobPoints,
  curveThrough,
  direction,
  lineThrough,
  resample,
  rotate,
  sampleSpline,
  roughRectPoints,
  round,
  wobble,
} from './geometry.ts'
import type { Rng } from './random.ts'
import { createRng } from './random.ts'
import type { Palette } from './palette.ts'
import { editorial } from './palette.ts'

/**
 * Three weights, so the drawing has a hierarchy the eye can follow.
 * Inventing a new weight per object is the fastest way to make a set of
 * illustrations stop looking like a set.
 */
export const WEIGHT = { primary: 17, secondary: 11, detail: 6 } as const
export type Weight = keyof typeof WEIGHT | number

const resolveWeight = (w: Weight | undefined, fallback: Weight): number =>
  typeof w === 'number' ? w : WEIGHT[w ?? (fallback as keyof typeof WEIGHT)]

export type SceneOptions = {
  width?: number
  height?: number
  seed?: number
  palette?: Palette
  /** Paint a flat field across the whole canvas. Pass false for transparency. */
  background?: string | false
}

type StrokeOpts = {
  stroke?: string
  weight?: Weight
  /** Sideways drift, in px. 0 is mechanical, 3-6 reads as drawn, >10 as broken. */
  wobble?: number
  fill?: string
  dash?: string
  opacity?: number
}

export type Scene = ReturnType<typeof createIllustration>

export function createIllustration(options: SceneOptions = {}) {
  const width = options.width ?? 1000
  const height = options.height ?? 1000
  const palette = options.palette ?? editorial
  const rng: Rng = createRng(options.seed ?? 1)
  const marks: string[] = []

  const strokeAttrs = (o: StrokeOpts, fallbackWeight: Weight = 'primary'): string => {
    const w = resolveWeight(o.weight, fallbackWeight)
    const parts = [
      `fill="${o.fill ?? 'none'}"`,
      `stroke="${o.stroke ?? palette.ink}"`,
      `stroke-width="${round(w)}"`,
      'stroke-linecap="round"',
      'stroke-linejoin="round"',
    ]
    if (o.dash) parts.push(`stroke-dasharray="${o.dash}"`)
    if (o.opacity !== undefined) parts.push(`opacity="${o.opacity}"`)
    return parts.join(' ')
  }

  const emit = (d: string, attrs: string) => {
    if (d) marks.push(`  <path d="${d}" ${attrs}/>`)
  }

  const api = {
    width,
    height,
    palette,
    rng,

    /** Escape hatch: push a raw element when a primitive does not fit. */
    raw(element: string) {
      marks.push('  ' + element)
      return api
    },

    /** Escape hatch: push your own path data with the standard stroke handling. */
    path(d: string, opts: StrokeOpts = {}) {
      emit(d, strokeAttrs(opts))
      return api
    },

    /** Flat colour across the whole canvas. */
    field(color: string = palette.bg) {
      marks.push(`  <rect width="${width}" height="${height}" fill="${color}"/>`)
      return api
    },

    /**
     * The carrier: an irregular sheet the drawing sits on. Almost a rectangle or
     * almost an ellipse, never exactly either — that near-miss is what stops the
     * composition feeling like a template.
     */
    blob(opts: {
      x: number
      y: number
      width: number
      height: number
      fill?: string
      stroke?: string
      weight?: Weight
      /** Fraction of radius. 0.05 subtle, 0.12 clearly torn, >0.25 falls apart. */
      roughness?: number
      samples?: number
      /**
       * 'sheet' is a torn rounded rectangle — the default, because a carrier
       * should read as paper the drawing sits on. 'ellipse' is a soft round
       * mass, for when the shape itself is the subject.
       */
      form?: 'sheet' | 'ellipse'
      /** Override the form preset: 2 is a true ellipse, 4-6 reads as a sheet. */
      squareness?: number
    }) {
      const form = opts.form ?? 'sheet'
      const squareness = opts.squareness ?? (form === 'sheet' ? 4.2 : 2)
      // A sheet needs more samples: its corners turn quickly and too few points
      // there would round them straight back into an ellipse.
      const samples = opts.samples ?? (form === 'sheet' ? 22 : 14)
      const pts = blobPoints(
        opts.x,
        opts.y,
        opts.width,
        opts.height,
        rng,
        opts.roughness ?? (form === 'sheet' ? 0.05 : 0.08),
        samples,
        squareness,
      )
      const d = curveThrough(pts, true)
      const attrs = [
        `fill="${opts.fill ?? palette.paper}"`,
        opts.stroke ? `stroke="${opts.stroke}"` : '',
        opts.stroke ? `stroke-width="${round(resolveWeight(opts.weight, 'primary'))}"` : '',
        opts.stroke ? 'stroke-linejoin="round"' : '',
      ]
        .filter(Boolean)
        .join(' ')
      emit(d, attrs)
      return api
    },

    /**
     * A drawn line through the points you give it. The backbone primitive —
     * most linework in an editorial illustration is one confident gesture.
     */
    gesture(opts: { points: Point[] } & StrokeOpts & { closed?: boolean }) {
      // Sample the spline (not the chords) so a gesture curves the way it reads
      // on paper; see sampleSpline for why the difference is visible.
      const dense = sampleSpline(opts.points, opts.closed ?? false, 10)
      const w = wobble(dense, rng, opts.wobble ?? 4)
      emit(curveThrough(w, opts.closed ?? false), strokeAttrs(opts))
      return api
    },

    /** Straight-edged version, for anything that should read as built, not grown. */
    polyline(opts: { points: Point[] } & StrokeOpts & { closed?: boolean }) {
      const j = opts.points.map(
        ([x, y]) => [rng.jitter(x, 3), rng.jitter(y, 3)] as Point,
      )
      emit(lineThrough(j, opts.closed ?? false), strokeAttrs(opts))
      return api
    },

    /**
     * A curved arrow with a drawn head. Hand-built rather than an SVG marker,
     * because markers scale with stroke width and always look mechanical.
     */
    arrow(opts: {
      from: Point
      to: Point
      /** Sideways bow of the shaft, in px. Negative bends the other way. */
      bow?: number
      headSize?: number
    } & StrokeOpts) {
      const { from, to } = opts
      const bow = opts.bow ?? 40
      const mid: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
      const [dx, dy] = direction(from, to)
      const ctrl: Point = [mid[0] - dy * bow, mid[1] + dx * bow]
      api.gesture({ ...opts, points: [from, ctrl, to] })

      // Head: two short strokes swept back from the tip, angled off the
      // direction of arrival rather than the straight-line direction.
      const arrive = direction(ctrl, to)
      const size = opts.headSize ?? 34
      const back: Point = [to[0] - arrive[0] * size, to[1] - arrive[1] * size]
      const left = rotate(back, to, 0.42)
      const right = rotate(back, to, -0.42)
      emit(lineThrough([left, to]), strokeAttrs(opts))
      emit(lineThrough([right, to]), strokeAttrs(opts))
      return api
    },

    /** A filled mark. Slightly irregular, because a drawn dot never is. */
    dot(x: number, y: number, opts: { radius?: number; fill?: string } = {}) {
      const radius = opts.radius ?? 14
      const pts = blobPoints(x, y, radius * 2, radius * 2, rng, 0.06, 9)
      emit(curveThrough(pts, true), `fill="${opts.fill ?? palette.ink}"`)
      return api
    },

    /** A dot, optionally ringed — an anchor, a state, a participant. */
    node(
      x: number,
      y: number,
      opts: { radius?: number; fill?: string; ring?: boolean; ringGap?: number } & StrokeOpts = {},
    ) {
      if (opts.ring) {
        const gap = opts.ringGap ?? 16
        const rr = (opts.radius ?? 14) + gap
        const pts = blobPoints(x, y, rr * 2, rr * 2, rng, 0.05, 11)
        emit(curveThrough(pts, true), strokeAttrs({ ...opts, fill: 'none' }, 'secondary'))
      }
      api.dot(x, y, { radius: opts.radius, fill: opts.fill })
      return api
    },

    /** A line between two anchors. Slight bow keeps a diagram from feeling plotted. */
    connector(from: Point, to: Point, opts: { bow?: number } & StrokeOpts = {}) {
      const bow = opts.bow ?? 0
      if (!bow) {
        api.gesture({ ...opts, points: [from, to], weight: opts.weight ?? 'secondary' })
        return api
      }
      const mid: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
      const [dx, dy] = direction(from, to)
      api.gesture({
        ...opts,
        weight: opts.weight ?? 'secondary',
        points: [from, [mid[0] - dy * bow, mid[1] + dx * bow], to],
      })
      return api
    },

    /**
     * Nodes joined by connectors. Draws edges first so the dots sit on top and
     * read as terminals rather than crossings.
     */
    cluster(opts: {
      nodes: Point[]
      edges?: Array<[number, number]>
      radius?: number
      fill?: string
      bow?: number
      ring?: number[]
    } & StrokeOpts) {
      for (const [a, b] of opts.edges ?? []) {
        if (opts.nodes[a] && opts.nodes[b]) {
          api.connector(opts.nodes[a], opts.nodes[b], {
            ...opts,
            bow: opts.bow ?? 0,
            weight: opts.weight ?? 'secondary',
          })
        }
      }
      opts.nodes.forEach((n, i) => {
        api.node(n[0], n[1], {
          radius: opts.radius,
          fill: opts.fill,
          ring: (opts.ring ?? []).includes(i),
          stroke: opts.stroke,
        })
      })
      return api
    },

    /**
     * A window or card, reconstructed rather than screenshotted. Reconstruction
     * keeps the composition editable and lets you drop every element that is not
     * carrying the idea.
     */
    panel(opts: {
      x: number
      y: number
      width: number
      height: number
      fill?: string
      /** Draw a title bar and its divider. */
      bar?: boolean
      barHeight?: number
      slop?: number
    } & StrokeOpts) {
      const { x, y, width: w, height: h } = opts
      const slop = opts.slop ?? 5
      const pts = roughRectPoints(x, y, w, h, rng, slop)
      const d = curveThrough(pts, true, 0.3)
      if (opts.fill !== 'none') {
        emit(d, `fill="${opts.fill ?? palette.paper}"`)
      }
      emit(d, strokeAttrs({ ...opts, fill: 'none' }))
      if (opts.bar) {
        const by = y + (opts.barHeight ?? 74)
        api.gesture({
          ...opts,
          fill: 'none',
          points: [
            [x, by],
            [x + w, by],
          ],
          weight: opts.weight ?? 'primary',
          wobble: 2,
        })
      }
      return api
    },

    /**
     * The hand: a wrist and a run of looping fingers.
     *
     * A hand entering the frame turns an abstract object into something being
     * used. It is the cheapest way to add agency to a still composition, which is
     * why editorial illustration leans on it so heavily.
     *
     * `angle` is in radians, 0 pointing right — the direction the fingers reach.
     */
    hand(opts: {
      /** Where the fingertips arrive. */
      x: number
      y: number
      angle?: number
      /** Overall length of the hand, wrist to fingertip. */
      size?: number
      fingers?: number
      flip?: boolean
    } & StrokeOpts) {
      const size = opts.size ?? 240
      const angle = opts.angle ?? 0
      const fingers = opts.fingers ?? 4
      const spacing = size * 0.2
      const baseLen = size * 0.46
      const dir = opts.flip ? -1 : 1
      // Half-width of a finger. Narrow relative to its length is what makes the
      // shape read as a finger and not a tooth on a comb.
      const fw = spacing * 0.31

      /**
       * Fingers are not the same length, and that is most of what separates a
       * hand from a coil. Middle longest, index and ring close behind, little
       * finger clearly shorter — sampled across however many are drawn.
       */
      const profile = [0.84, 1, 0.93, 0.74, 0.63]
      const lengthAt = (i: number) =>
        baseLen *
        profile[
          Math.min(
            profile.length - 1,
            Math.round((i / Math.max(1, fingers - 1)) * (profile.length - 1)),
          )
        ]

      // Build pointing right from the wrist, then rotate into place.
      const local: Point[] = []
      const wristLen = size * 0.6
      local.push([-wristLen, dir * size * 0.3])
      local.push([-wristLen * 0.55, dir * size * 0.13])
      // Palm: the baseline the fingers stand on. Without it the fingers float.
      local.push([-spacing * 0.5, dir * size * 0.02])

      for (let i = 0; i < fingers; i++) {
        const bx = i * spacing
        const len = lengthAt(i)
        const cx = bx + fw
        const cy = -len + fw

        // Up the near side.
        local.push([bx, dir * -len * 0.2])
        // Around the tip. Sampling the arc is the whole trick: four corner points
        // would smooth into a square wave, which is what a comb looks like.
        for (let k = 0; k <= 6; k++) {
          const a = Math.PI - (k / 6) * Math.PI
          local.push([cx + Math.cos(a) * fw, dir * (cy - Math.sin(a) * fw)])
        }
        // Down the far side, into the valley between fingers.
        local.push([bx + fw * 2, dir * -len * 0.2])
        if (i < fingers - 1) {
          local.push([bx + spacing - fw * 0.35, dir * -len * 0.02])
        }
      }

      /**
       * Fan the fingers a little around a pivot below the palm. Perfectly
       * parallel fingers look printed; a few degrees of splay looks held.
       */
      const pivot: Point = [(fingers - 1) * spacing * 0.5, dir * size * 0.55]
      const fanned = local.map((p, i) => {
        if (i < 3) return p
        const t = (p[0] - pivot[0]) / Math.max(1, (fingers - 1) * spacing)
        return rotate(p, pivot, dir * t * 0.14)
      })

      // Anchor so the fingertips land on (x, y).
      const tipX = (fingers - 1) * spacing + fw
      const placed = fanned.map((p) => {
        const shifted: Point = [p[0] - tipX, p[1]]
        const rotated = rotate(shifted, [0, 0], angle)
        return [rotated[0] + opts.x, rotated[1] + opts.y] as Point
      })

      // No resampling here: the tip arcs are already dense, and interpolating
      // between them would flatten the curves back out.
      const w = wobble(placed, rng, opts.wobble ?? 1.5)
      emit(curveThrough(w, false), strokeAttrs(opts))
      return api
    },

    /** A pointer. Reads instantly as software without drawing a whole interface. */
    cursor(x: number, y: number, opts: { size?: number; angle?: number } & StrokeOpts = {}) {
      const s = opts.size ?? 110
      const a = opts.angle ?? 0
      const local: Point[] = [
        [0, 0],
        [0, s],
        [s * 0.26, s * 0.74],
        [s * 0.42, s * 1.06],
        [s * 0.56, s * 0.99],
        [s * 0.4, s * 0.68],
        [s * 0.7, s * 0.66],
      ]
      const placed = local.map((p) => {
        const rp = rotate(p, [0, 0], a)
        return [rp[0] + x, rp[1] + y] as Point
      })
      const d = lineThrough(placed, true)
      if (opts.fill && opts.fill !== 'none') emit(d, `fill="${opts.fill}"`)
      emit(d, strokeAttrs({ ...opts, fill: 'none' }))
      return api
    },

    /**
     * A short controlled squiggle. Use for text stand-ins and marks of activity —
     * never as filler, because a mark that says nothing still costs attention.
     */
    scribble(opts: {
      x: number
      y: number
      width: number
      /** Number of peaks. Low counts read as handwriting, high as noise. */
      cycles?: number
      amplitude?: number
    } & StrokeOpts) {
      const cycles = opts.cycles ?? 4
      const amp = opts.amplitude ?? 12
      const pts: Point[] = []
      const steps = cycles * 2
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        pts.push([opts.x + opts.width * t, opts.y + (i % 2 === 0 ? -amp : amp)])
      }
      api.gesture({ ...opts, points: pts, weight: opts.weight ?? 'secondary', wobble: opts.wobble ?? 2 })
      return api
    },

    /** Lines standing in for text. Ragged right edge, like a real paragraph. */
    textLines(opts: {
      x: number
      y: number
      width: number
      lines?: number
      gap?: number
    } & StrokeOpts) {
      const lines = opts.lines ?? 3
      const gap = opts.gap ?? 34
      for (let i = 0; i < lines; i++) {
        const w = opts.width * rng.range(0.62, 1)
        api.gesture({
          ...opts,
          points: [
            [opts.x, opts.y + i * gap],
            [opts.x + w, opts.y + i * gap],
          ],
          weight: opts.weight ?? 'secondary',
          wobble: 2,
        })
      }
      return api
    },

    /** A bracket — grouping, scope, "everything in here". */
    bracket(opts: {
      x: number
      y: number
      height: number
      /** Which way the arms point. */
      facing?: 'left' | 'right'
      armLength?: number
    } & StrokeOpts) {
      const arm = opts.armLength ?? 34
      const s = opts.facing === 'right' ? -1 : 1
      api.gesture({
        ...opts,
        points: [
          [opts.x + arm * s, opts.y],
          [opts.x, opts.y],
          [opts.x, opts.y + opts.height],
          [opts.x + arm * s, opts.y + opts.height],
        ],
        wobble: opts.wobble ?? 2,
      })
      return api
    },

    /** The `</>` mark. Says "code" in two strokes and a slash. */
    codeMark(x: number, y: number, opts: { size?: number } & StrokeOpts = {}) {
      const s = opts.size ?? 90
      const o = { ...opts, weight: opts.weight ?? 'primary', wobble: opts.wobble ?? 2 }
      api.gesture({
        ...o,
        points: [
          [x - s * 0.55, y - s * 0.42],
          [x - s * 1.0, y],
          [x - s * 0.55, y + s * 0.42],
        ],
      })
      api.gesture({
        ...o,
        points: [
          [x + s * 0.55, y - s * 0.42],
          [x + s * 1.0, y],
          [x + s * 0.55, y + s * 0.42],
        ],
      })
      api.gesture({
        ...o,
        points: [
          [x + s * 0.2, y - s * 0.5],
          [x - s * 0.2, y + s * 0.5],
        ],
      })
      return api
    },

    toSVG(): string {
      return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
        ...marks,
        '</svg>',
        '',
      ].join('\n')
    },
  }

  if (options.background !== false) {
    api.field(typeof options.background === 'string' ? options.background : palette.bg)
  }

  return api
}
