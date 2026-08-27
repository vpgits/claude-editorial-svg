/**
 * Grammar: UI.
 *
 * Article: previewing an unpublished draft before it goes live.
 *
 * A screenshot of the admin panel would date instantly and carry a hundred
 * details that argue nothing. Reconstructing only the meaningful parts — a stack
 * of versions, one of them being looked at — keeps the composition editable and
 * lets everything that is not the idea fall away. The hand supplies the agency:
 * someone is choosing this version, right now.
 */

import { createIllustration, onField } from '../lib/index.ts'

export default function build(): string {
  const s = createIllustration({ seed: 31337, palette: onField('sky') })

  // Deliberate misregistration: the sheet is not concentric with the stack, so
  // the composition sits slightly off-centre and reads as placed by hand.
  s.blob({ x: 520, y: 486, width: 790, height: 700, roughness: 0.05 })

  // Versions behind the current one. Drawn first so they sit underneath.
  s.panel({ x: 268, y: 214, width: 470, height: 380, weight: 'secondary', slop: 4 })
  s.panel({ x: 232, y: 250, width: 470, height: 380, weight: 'secondary', slop: 4 })

  // The draft being previewed.
  s.panel({ x: 196, y: 288, width: 470, height: 380, bar: true, barHeight: 62 })
  s.textLines({ x: 240, y: 420, width: 330, lines: 3, gap: 40 })

  // One live edit, in the accent — the only coloured mark in the piece.
  s.gesture({
    points: [[240, 540], [352, 540]],
    stroke: s.palette.accent,
    weight: 'secondary',
    wobble: 2,
  })

  s.hand({ x: 660, y: 470, angle: -2.5, size: 300, flip: true })

  return s.toSVG()
}
