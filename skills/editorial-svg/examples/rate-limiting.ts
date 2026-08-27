/**
 * Grammar: object.
 *
 * Article: the contact form allows five sends an hour per address.
 *
 * Drawing a form with an error toast illustrates the symptom. The idea is a
 * constriction — many arriving, few getting through — so the drawing is a queue
 * meeting a gate. The one mark past the gate is the accent, because the whole
 * point of the piece is what happens to that single request.
 */

import { createIllustration, onField } from '../lib/index.ts'

export default function build(): string {
  const s = createIllustration({ seed: 5150, palette: onField('ochre') })

  s.blob({ x: 500, y: 496, width: 800, height: 690, roughness: 0.05 })

  // A crowd arriving. Irregular spacing reads as traffic; a neat grid would
  // read as a chart.
  const queue: Array<[number, number]> = [
    [206, 402],
    [268, 512],
    [214, 606],
    [318, 388],
    [330, 620],
    [370, 500],
  ]
  for (const [x, y] of queue) s.dot(x, y, { radius: 19 })

  // A funnel, not a wall. Converging arms say "many in, few out" on their own;
  // two parallel bars just read as a gap in a fence.
  s.gesture({ points: [[452, 244], [560, 452], [566, 470]], weight: 'primary', wobble: 3 })
  s.gesture({ points: [[452, 764], [560, 556], [566, 538]], weight: 'primary', wobble: 3 })

  // One gets through, and it is the only accent on the canvas.
  s.arrow({ from: [604, 504], to: [806, 504], bow: 0, weight: 'primary', headSize: 34 })
  s.dot(690, 504, { radius: 22, fill: s.palette.accent })

  return s.toSVG()
}
