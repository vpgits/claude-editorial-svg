/**
 * Grammar: code / tooling.
 *
 * Article: generated artwork you can still open and edit by hand.
 *
 * A robot with a paintbrush would say "AI made art". The claim is about the
 * output staying editable, so the drawing shows the mechanics of vector editing
 * — a curve with its anchors and control handles exposed. Bezier handles are
 * literally what "still editable" looks like to anyone who has opened a vector
 * tool, which makes this one of the rare cases where the mechanism is the metaphor.
 */

import { createIllustration, onField } from '../lib/index.ts'
import type { Point } from '../lib/index.ts'

export default function build(): string {
  const s = createIllustration({ seed: 90210, palette: onField('clay') })

  s.blob({ x: 496, y: 500, width: 780, height: 720, roughness: 0.06 })

  // The curve is the artwork; everything else is the evidence it can be changed.
  const curve: Point[] = [
    [214, 616],
    [368, 402],
    [604, 622],
    [788, 398],
  ]
  s.gesture({ points: curve, weight: 'primary', wobble: 3 })

  // Handles read as tooling only when they are visibly lighter than the artwork.
  const handles: Array<[Point, Point]> = [
    [curve[1], [300, 344]],
    [curve[2], [700, 668]],
  ]
  for (const [anchor, control] of handles) {
    s.gesture({ points: [anchor, control], weight: 'secondary', wobble: 0 })
    s.dot(control[0], control[1], { radius: 13, fill: s.palette.accent })
  }

  // Hollow anchors, solid controls — the convention every vector tool uses, and
  // hollow is the only way they stay visible sitting on top of the ink curve.
  for (const anchor of [curve[1], curve[2]]) {
    s.node(anchor[0], anchor[1], {
      radius: 15,
      fill: s.palette.paper,
      ring: true,
      ringGap: 3,
      weight: 'secondary',
    })
  }

  return s.toSVG()
}
