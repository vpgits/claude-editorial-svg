/**
 * Grammar: diagram.
 *
 * Article: agents lose context each time they hand work to the next one.
 *
 * The literal illustration would be four robots around a laptop, which says
 * "AI" and nothing else. The argument is about loss across a chain, so the
 * drawing is a chain that visibly weakens: each node smaller than the last, each
 * arrow thinner than the last. The accent marks the start, so the eye reads
 * left to right and watches the signal fall off.
 */

import { createIllustration, onField } from '../lib/index.ts'
import type { Point } from '../lib/index.ts'

export default function build(): string {
  const s = createIllustration({ seed: 4821, palette: onField('sage') })

  s.blob({ x: 508, y: 512, width: 760, height: 700, roughness: 0.05 })

  // A gentle downward drift reads as decay without needing a label.
  const nodes: Point[] = [
    [230, 348],
    [434, 452],
    [640, 556],
    [828, 654],
  ]

  // Arrows thin as they go: the handoff itself is what is degrading.
  const weights = [17, 13, 9]
  for (let i = 0; i < nodes.length - 1; i++) {
    s.arrow({
      from: nodes[i],
      to: nodes[i + 1],
      bow: -46,
      weight: weights[i],
      headSize: 38 - i * 4,
      wobble: 4,
    })
  }

  // Nodes shrink in step with the arrows.
  const radii = [46, 34, 24, 15]
  nodes.forEach(([x, y], i) => s.dot(x, y, { radius: radii[i] }))

  // The accent sits on the origin — full signal, before any of it is lost.
  s.node(nodes[0][0], nodes[0][1], { radius: 46, fill: s.palette.accent, ring: true, ringGap: 26 })

  return s.toSVG()
}
